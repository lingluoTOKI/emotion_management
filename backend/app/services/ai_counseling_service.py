"""
AI心理咨询服务模块
AI Counseling Service Module
"""

from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import json
import openai
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.models.ai_counseling import AICounselingSession, RiskAssessment
from app.models.user import Student
from loguru import logger
from app.services.xfyun_ai_service import xfyun_ai_service

class AICounselingService:
    """AI心理咨询服务类"""
    
    def __init__(self, db: Session = None):
        # 使用全局会话存储作为缓存，但主要依赖数据库
        global global_conversation_history, global_risk_assessments
        self.conversation_history = global_conversation_history
        self.risk_assessments = global_risk_assessments
        self.db = db
        
        # AI服务优先级配置
        self.ai_service_priority = ["xfyun", "openai", "fallback"]
        self.current_ai_service = "xfyun"  # 默认使用科大讯飞
        
        # 设置OpenAI API密钥（备用）
        if settings.OPENAI_API_KEY:
            openai.api_key = settings.OPENAI_API_KEY
        else:
            logger.warning("OpenAI API密钥未设置，将使用科大讯飞作为主要AI服务")
    
    async def start_session(self, student_id: int, problem_type: str = None) -> Dict[str, Any]:
        """开始AI咨询会话"""
        
        # 在数据库中创建会话记录
        db_session = None
        if self.db:
            try:
                # 首先检查学生记录是否存在
                from app.models.user import Student
                student_record = self.db.query(Student).filter(Student.user_id == student_id).first()
                
                if student_record:
                    db_session = AICounselingSession(
                        student_id=student_record.id,  # 使用学生记录的ID而不是用户ID
                        session_type="text",
                        conversation_history=[],
                        emotion_analysis={},
                        risk_assessment={},
                        status="active"
                    )
                    self.db.add(db_session)
                    self.db.commit()
                    self.db.refresh(db_session)
                    logger.info(f"数据库会话创建成功，ID: {db_session.id}")
                else:
                    logger.warning(f"学生记录不存在，user_id: {student_id}，跳过数据库存储")
                    
            except Exception as e:
                logger.error(f"创建数据库会话失败: {e}")
                self.db.rollback()
                db_session = None
        
        # 生成会话ID，包含数据库ID以便后续查找
        if db_session and hasattr(db_session, 'id') and db_session.id:
            session_id = f"ai_session_{student_id}_{db_session.id}"
        else:
            session_id = f"ai_session_{student_id}_{int(datetime.utcnow().timestamp())}"
        
        # 初始化会话
        session_data = {
            "session_id": session_id,
            "student_id": student_id,
            "problem_type": problem_type,
            "start_time": datetime.utcnow(),
            "conversation_history": [],
            "current_emotion": "neutral",
            "risk_level": "low",
            "session_status": "active",
            "db_session_id": db_session.id if db_session else None
        }
        
        self.conversation_history[session_id] = session_data
        
        # 生成开场白
        opening_message = self._generate_opening_message(problem_type)
        
        return {
            "session_id": session_id,
            "message": opening_message,
            "session_data": session_data
        }
    
    async def continue_conversation(self, session_id: str, user_message: str) -> Dict[str, Any]:
        """继续AI咨询对话"""
        if session_id not in self.conversation_history:
            # 尝试从数据库恢复会话
            logger.warning(f"会话 {session_id} 从内存中丢失，尝试从数据库恢复")
            db_session_data = self._load_conversation_from_db(session_id)
            
            if db_session_data and db_session_data.get("conversation_history"):
                # 从数据库成功恢复会话历史
                self.conversation_history[session_id] = db_session_data
                logger.info(f"从数据库恢复会话 {session_id}，历史记录: {len(db_session_data['conversation_history'])} 条")
                session = self.conversation_history[session_id]
            else:
                # 数据库中也没有，创建新会话
                logger.warning(f"数据库中也未找到会话 {session_id}，创建新会话")
                user_id = session_id.split("_")[-2] if "_" in session_id else "unknown"
                self.conversation_history[session_id] = {
                    "session_id": session_id,
                    "user_id": user_id,
                    "start_time": datetime.now(),
                    "conversation_history": [],
                    "problem_type": "续连会话",
                    "session_data": {"auto_recovered": True}
                }
                
                # 智能处理会话恢复，分析当前用户消息的情绪状态
                emotion_analysis = await self._analyze_user_emotion(user_message)
                risk_assessment = await self._assess_risk_level(user_message, emotion_analysis)
                
                # 根据用户当前消息生成合适的回复
                ai_response = await self._generate_ai_response_with_fallback(
                    user_message, emotion_analysis, {"conversation_history": []}
                )
                
                # 添加恢复提示但保持对当前消息的回应
                recovery_message = f"抱歉刚才连接中断了一下。{ai_response}"
                
                return {
                    "message": recovery_message,
                    "emotion_analysis": emotion_analysis,
                    "risk_assessment": risk_assessment,
                    "session_id": session_id
                }
        
        else:
            session = self.conversation_history[session_id]
        
        # 记录用户消息
        session["conversation_history"].append({
            "role": "user",
            "message": user_message,
            "timestamp": datetime.utcnow()
        })
        
        # 分析用户情绪和风险
        emotion_analysis = await self._analyze_user_emotion(user_message)
        risk_assessment = await self._assess_risk_level(user_message, emotion_analysis)
        
        # 更新会话状态
        session["current_emotion"] = emotion_analysis.get("dominant_emotion", "neutral")
        session["risk_level"] = risk_assessment.get("risk_level", "low")
        
        # 生成AI回复
        ai_response = await self._generate_ai_response(user_message, emotion_analysis, risk_assessment, session)
        
        # 记录AI回复
        session["conversation_history"].append({
            "role": "assistant",
            "message": ai_response["message"],
            "timestamp": datetime.utcnow(),
            "emotion_analysis": emotion_analysis,
            "risk_assessment": risk_assessment
        })
        
        # 保存到数据库
        self._save_conversation_to_db(session_id, session)
        
        # 检查是否需要紧急干预
        if risk_assessment.get("risk_level") == "high":
            emergency_alert = await self._trigger_emergency_alert(session_id, session)
            ai_response["emergency_alert"] = emergency_alert
        
        return ai_response
    
    async def end_session(self, session_id: str) -> Dict[str, Any]:
        """结束AI咨询会话"""
        if session_id not in self.conversation_history:
            return {"error": "会话不存在"}
        
        session = self.conversation_history[session_id]
        session["session_status"] = "completed"
        session["end_time"] = datetime.utcnow()
        
        # 生成会话总结
        session_summary = await self._generate_session_summary(session)
        
        return {
            "session_id": session_id,
            "summary": session_summary,
            "session_data": session
        }
    
    async def get_session_summary(self, session_id: str) -> Dict[str, Any]:
        """获取会话总结"""
        if session_id not in self.conversation_history:
            return {"error": "会话不存在"}
        
        session = self.conversation_history[session_id]
        return await self._generate_session_summary(session)
    
    def _generate_opening_message(self, problem_type: str = None) -> str:
        """生成开场白"""
        if problem_type:
            return f"您好！我是您的AI心理咨询助手。我了解到您想讨论关于{problem_type}的问题。请告诉我您的具体情况，我会尽力帮助您。"
        else:
            return "您好！我是您的AI心理咨询助手。请告诉我您今天想聊什么，我会认真倾听并尽力帮助您。"
    
    async def _analyze_user_emotion(self, message: str) -> Dict[str, Any]:
        """分析用户情绪"""
        # 模拟情绪分析，实际应该使用NLP模型
        # 这里实现简单的关键词匹配
        message_lower = message.lower()
        
        # 情绪关键词
        emotion_keywords = {
            "depression": ["难过", "痛苦", "绝望", "不想活", "自杀", "死亡"],
            "anxiety": ["焦虑", "紧张", "担心", "害怕", "恐惧", "不安"],
            "anger": ["愤怒", "生气", "烦躁", "恼火", "不满"],
            "sadness": ["伤心", "悲伤", "沮丧", "失落", "孤独"],
            "happiness": ["开心", "快乐", "高兴", "兴奋", "满足"]
        }
        
        detected_emotions = {}
        for emotion, keywords in emotion_keywords.items():
            score = sum(1 for keyword in keywords if keyword in message_lower)
            if score > 0:
                detected_emotions[emotion] = score / len(keywords)
        
        # 确定主导情绪
        if detected_emotions:
            dominant_emotion = max(detected_emotions, key=detected_emotions.get)
            emotion_intensity = detected_emotions[dominant_emotion]
        else:
            dominant_emotion = "neutral"
            emotion_intensity = 0.0
        
        return {
            "dominant_emotion": dominant_emotion,
            "emotion_intensity": emotion_intensity,
            "detected_emotions": detected_emotions,
            "confidence": 0.8
        }
    
    async def _assess_risk_level(self, message: str, emotion_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """评估风险等级"""
        message_lower = message.lower()
        
        # 高风险关键词
        high_risk_keywords = [
            "自杀", "死亡", "不想活", "结束生命", "结束一切", "想死",
            "伤害自己", "自残", "割腕", "上吊", "跳楼", "活着没有意义",
            "死了算了", "一了百了", "去死", "轻生"
        ]
        
        # 中风险关键词
        medium_risk_keywords = [
            "绝望", "痛苦", "没有希望", "看不到未来", "很累", "累得不行",
            "没人理解", "孤独", "被抛弃", "撑不下去", "受不了", "崩溃"
        ]
        
        risk_score = 0
        risk_keywords = []
        
        # 检查高风险关键词
        for keyword in high_risk_keywords:
            if keyword in message_lower:
                risk_score += 3
                risk_keywords.append(keyword)
        
        # 检查中风险关键词
        for keyword in medium_risk_keywords:
            if keyword in message_lower:
                risk_score += 2
                risk_keywords.append(keyword)
        
        # 情绪强度影响
        emotion_intensity = emotion_analysis.get("emotion_intensity", 0.0)
        if emotion_intensity > 0.7:
            risk_score += 1
        
        # 确定风险等级
        if risk_score >= 5:
            risk_level = "high"
        elif risk_score >= 3:
            risk_level = "medium"
        elif risk_score >= 1:
            risk_level = "low"
        else:
            risk_level = "minimal"
        
        return {
            "risk_level": risk_level,
            "risk_score": risk_score,
            "risk_keywords": risk_keywords,
            "recommendations": self._get_risk_recommendations(risk_level)
        }
    
    async def _generate_ai_response(self, user_message: str, emotion_analysis: Dict[str, Any], 
                                  risk_assessment: Dict[str, Any], session: Dict[str, Any]) -> Dict[str, Any]:
        """生成AI回复"""
        dominant_emotion = emotion_analysis.get("dominant_emotion", "neutral")
        risk_level = risk_assessment.get("risk_level", "low")
        
        # 高风险情况优先处理
        if risk_level == "high":
            response_text = self._generate_high_risk_response(user_message)
        else:
            # 尝试使用配置的AI服务生成回复
            response_text = await self._generate_ai_response_with_fallback(
                user_message, emotion_analysis, session
            )
        
        return {
            "message": response_text,
            "emotion_analysis": emotion_analysis,
            "risk_assessment": risk_assessment,
            "session_id": session["session_id"]
        }
    
    def _generate_high_risk_response(self, user_message: str) -> str:
        """生成高风险情况回复"""
        return """我注意到您提到了一些让我非常担心的话。您的生命非常宝贵，请一定要珍惜。

如果您现在有伤害自己的想法，请立即：
1. 拨打全国24小时心理危机干预热线：400-161-9995
2. 联系您的家人、朋友或老师
3. 前往最近的医院急诊科

我会一直在这里陪伴您，但专业人员的帮助对您来说更重要。请记住，困难是暂时的，但生命只有一次。"""
    
    def _generate_empathy_response(self, user_message: str, emotion_type: str) -> str:
        """生成共情回复"""
        empathy_responses = {
            "depression": "我能感受到您现在的痛苦和绝望。这种感受确实很难熬，但请相信，您并不孤单。",
            "anxiety": "我理解您的焦虑和担心。面对未知和不确定性确实会让人感到不安。",
            "anger": "我能感受到您的愤怒和不满。这种情绪是正常的，重要的是如何表达和处理它。"
        }
        
        base_response = empathy_responses.get(emotion_type, "我能感受到您的情绪。")
        
        # 添加具体建议
        suggestions = {
            "depression": "建议您可以尝试：1）与信任的人分享感受 2）保持规律的作息 3）适当运动 4）寻求专业帮助",
            "anxiety": "建议您可以尝试：1）深呼吸练习 2）正念冥想 3）写下担心的事情 4）制定行动计划",
            "anger": "建议您可以尝试：1）深呼吸 2）暂时离开现场 3）运动释放能量 4）与对方冷静沟通"
        }
        
        return f"{base_response} {suggestions.get(emotion_type, '')}"
    
    def _generate_general_response(self, user_message: str) -> str:
        """生成一般回复"""
        return "我理解您的感受。请继续告诉我更多细节，这样我才能更好地帮助您。"
    
    def _get_risk_recommendations(self, risk_level: str) -> List[str]:
        """获取风险建议"""
        recommendations = {
            "high": [
                "立即寻求专业心理危机干预",
                "联系家人朋友获得支持",
                "避免独处",
                "前往医院急诊科"
            ],
            "medium": [
                "寻求专业心理咨询",
                "与信任的人分享感受",
                "保持规律作息",
                "学习情绪管理技巧"
            ],
            "low": [
                "继续关注情绪变化",
                "学习压力管理技巧",
                "保持积极的生活方式"
            ],
            "minimal": [
                "继续保持当前状态",
                "定期关注心理健康"
            ]
        }
        
        return recommendations.get(risk_level, [])
    
    async def _generate_openai_response(self, user_message: str, emotion_analysis: Dict[str, Any], session: Dict[str, Any]) -> str:
        """使用OpenAI API生成回复"""
        # 构建对话历史
        conversation_history = session.get("conversation_history", [])
        dominant_emotion = emotion_analysis.get("dominant_emotion", "neutral")
        
        # 构建系统提示
        system_prompt = self._build_system_prompt(dominant_emotion)
        
        # 构建消息历史（只传递文本内容，避免datetime序列化问题）
        messages = []
        
        # 添加最近的对话历史（最多10轮）
        recent_history = conversation_history[-10:] if len(conversation_history) > 10 else conversation_history
        for msg in recent_history:
            if msg["role"] in ["user", "assistant"] and "message" in msg:
                messages.append({
                    "role": msg["role"],
                    "content": msg["message"]
                })
        
        # 添加当前用户消息
        messages.append({"role": "user", "content": user_message})
        
        try:
            # 调用OpenAI API
            response = await openai.ChatCompletion.acreate(
                model=settings.OPENAI_MODEL,
                messages=messages,
                max_tokens=500,
                temperature=0.7,
                top_p=0.9,
                frequency_penalty=0.3,
                presence_penalty=0.3
            )
            
            ai_response = response.choices[0].message.content
            logger.info(f"OpenAI API调用成功，生成回复长度: {len(ai_response)}")
            return ai_response
            
        except Exception as e:
            logger.error(f"OpenAI API调用异常: {str(e)}")
            raise e
    
    def _build_system_prompt(self, dominant_emotion: str) -> str:
        """构建系统提示词"""
        base_prompt = """你是一位专业的AI心理咨询师，具有丰富的心理健康咨询经验。请遵循以下原则：

1. 保持专业、温暖、共情的语调
2. 积极倾听并理解来访者的感受
3. 提供建设性的建议和支持
4. 避免诊断或提供医疗建议
5. 鼓励来访者寻求专业帮助当需要时
6. 保护来访者的隐私和尊严

请用中文回复，语言要温和、专业且易于理解。"""

        # 根据情绪调整提示
        emotion_specific_prompts = {
            "depression": "\n\n当前来访者可能处于抑郁情绪中，请特别关注他们的感受，提供温暖的支持和希望。",
            "anxiety": "\n\n当前来访者可能感到焦虑不安，请帮助他们缓解紧张情绪，提供实用的放松技巧。",
            "anger": "\n\n当前来访者可能感到愤怒，请帮助他们理解和管理这种情绪，寻找建设性的表达方式。",
            "sadness": "\n\n当前来访者可能感到悲伤，请给予充分的理解和支持，帮助他们处理这种情绪。"
        }
        
        if dominant_emotion in emotion_specific_prompts:
            base_prompt += emotion_specific_prompts[dominant_emotion]
        
        return base_prompt
    
    def _generate_fallback_response(self, user_message: str, dominant_emotion: str) -> str:
        """生成后备回复（当OpenAI API不可用时）"""
        if dominant_emotion in ["depression", "sadness"]:
            return self._generate_empathy_response(user_message, "depression")
        elif dominant_emotion in ["anxiety", "fear"]:
            return self._generate_empathy_response(user_message, "anxiety")
        elif dominant_emotion in ["anger", "frustration"]:
            return self._generate_empathy_response(user_message, "anger")
        else:
            return self._generate_general_response(user_message)
    
    async def _generate_ai_response_with_fallback(
        self,
        user_message: str,
        emotion_analysis: Dict[str, Any],
        session: Dict[str, Any]
    ) -> str:
        """使用多AI服务回退机制生成回复"""
        
        context = {
            'emotion_state': emotion_analysis.get('dominant_emotion', 'neutral'),
            'risk_level': 'low',  # 这里传入的是非高风险情况
            'emotion_intensity': emotion_analysis.get('emotion_intensity', 0.5)
        }
        
        conversation_history = session.get("conversation_history", [])
        
        # 转换对话历史为简单格式（避免datetime序列化问题）
        simple_history = []
        for msg in conversation_history[-10:]:  # 只保留最近10轮对话
            if msg.get("role") in ["user", "assistant"] and "message" in msg:
                simple_history.append({
                    "role": msg["role"],
                    "content": msg["message"]
                })
        
        # 按优先级尝试不同的AI服务
        for service_name in self.ai_service_priority:
            try:
                if service_name == "xfyun":
                    # 使用科大讯飞AI服务
                    response = await xfyun_ai_service.generate_psychological_response(
                        user_message=user_message,
                        conversation_history=simple_history,
                        context=context,
                        use_websocket=False  # 使用稳定的HTTP接口
                    )
                    
                    if response and len(response.strip()) > 0:
                        logger.info("科大讯飞AI服务回复成功")
                        return response
                    
                elif service_name == "openai" and settings.OPENAI_API_KEY:
                    # 使用OpenAI API
                    response = await self._generate_openai_response(
                        user_message, emotion_analysis, session
                    )
                    
                    if response and len(response.strip()) > 0:
                        logger.info("OpenAI API回复成功")
                        return response
                
                elif service_name == "fallback":
                    # 使用后备回复机制
                    dominant_emotion = emotion_analysis.get("dominant_emotion", "neutral")
                    response = self._generate_fallback_response(user_message, dominant_emotion)
                    logger.info("使用后备回复机制")
                    return response
                    
            except Exception as e:
                logger.warning(f"{service_name} AI服务调用失败: {str(e)}")
                continue
        
        # 如果所有服务都失败，返回默认回复
        return "我理解您的感受，但当前AI服务暂时不可用。请稍后再试，或者考虑联系我们的人工咨询师获得帮助。"
    
    async def switch_ai_service(self, service_name: str) -> bool:
        """切换AI服务"""
        
        if service_name in ["xfyun", "openai", "fallback"]:
            self.current_ai_service = service_name
            logger.info(f"AI服务已切换到: {service_name}")
            return True
        else:
            logger.warning(f"不支持的AI服务: {service_name}")
            return False
    
    async def test_ai_services(self) -> Dict[str, Any]:
        """测试所有AI服务的可用性"""
        
        test_results = {
            "xfyun": {"available": False, "error": None, "response_time": None},
            "openai": {"available": False, "error": None, "response_time": None}
        }
        
        # 测试科大讯飞服务
        try:
            start_time = datetime.now()
            xfyun_test = await xfyun_ai_service.test_connection()
            end_time = datetime.now()
            
            response_time = (end_time - start_time).total_seconds()
            
            if xfyun_test.get("http_connection") or xfyun_test.get("websocket_connection"):
                test_results["xfyun"]["available"] = True
                test_results["xfyun"]["response_time"] = response_time
                test_results["xfyun"]["details"] = xfyun_test
            else:
                test_results["xfyun"]["error"] = "连接测试失败"
                
        except Exception as e:
            test_results["xfyun"]["error"] = str(e)
        
        # 测试OpenAI服务
        if settings.OPENAI_API_KEY:
            try:
                start_time = datetime.now()
                
                test_response = await openai.ChatCompletion.acreate(
                    model=settings.OPENAI_MODEL,
                    messages=[{"role": "user", "content": "测试连接"}],
                    max_tokens=10
                )
                
                end_time = datetime.now()
                response_time = (end_time - start_time).total_seconds()
                
                test_results["openai"]["available"] = True
                test_results["openai"]["response_time"] = response_time
                
            except Exception as e:
                test_results["openai"]["error"] = str(e)
        else:
            test_results["openai"]["error"] = "API密钥未配置"
        
        return test_results
    
    async def _trigger_emergency_alert(self, session_id: str, session: Dict[str, Any]) -> Dict[str, Any]:
        """触发紧急干预警报"""
        alert_data = {
            "session_id": session_id,
            "student_id": session["student_id"],
            "risk_level": session["risk_level"],
            "timestamp": datetime.utcnow(),
            "conversation_context": session["conversation_history"][-2:],  # 最近两轮对话
            "alert_type": "high_risk_student"
        }
        
        # 这里应该实现实际的警报机制，如发送短信、邮件等
        # 目前只是记录警报数据
        
        return {
            "alert_triggered": True,
            "alert_data": alert_data,
            "message": "已触发紧急干预警报，专业人员将尽快联系您。"
        }
    
    async def _generate_session_summary(self, session: Dict[str, Any]) -> Dict[str, Any]:
        """生成会话总结"""
        conversation_count = len(session["conversation_history"])
        duration = None
        if "end_time" in session and "start_time" in session:
            duration = (session["end_time"] - session["start_time"]).total_seconds() / 60
        
        # 分析对话内容
        user_messages = [msg for msg in session["conversation_history"] if msg["role"] == "user"]
        ai_messages = [msg for msg in session["conversation_history"] if msg["role"] == "assistant"]
        
        # 情绪变化趋势
        emotion_trend = []
        for msg in ai_messages:
            if "emotion_analysis" in msg:
                emotion_trend.append({
                    "timestamp": msg["timestamp"],
                    "emotion": msg["emotion_analysis"].get("dominant_emotion", "unknown"),
                    "intensity": msg["emotion_analysis"].get("emotion_intensity", 0.0)
                })
        
        return {
            "session_id": session["session_id"],
            "start_time": session["start_time"],
            "end_time": session.get("end_time"),
            "duration_minutes": duration,
            "conversation_count": conversation_count,
            "problem_type": session.get("problem_type"),
            "final_emotion": session.get("current_emotion"),
            "final_risk_level": session.get("risk_level"),
            "emotion_trend": emotion_trend,
            "key_topics": self._extract_key_topics(session["conversation_history"]),
            "recommendations": self._get_session_recommendations(session)
        }
    
    def _extract_key_topics(self, conversation_history: List[Dict[str, Any]]) -> List[str]:
        """提取关键话题"""
        # 简单的关键词提取，实际应该使用NLP
        all_text = " ".join([msg.get("message", "") for msg in conversation_history])
        
        key_topics = []
        topic_keywords = ["学习", "压力", "人际关系", "情感", "家庭", "未来", "自我认知"]
        
        for topic in topic_keywords:
            if topic in all_text:
                key_topics.append(topic)
        
        return key_topics[:5]  # 返回最多5个话题
    
    def _get_session_recommendations(self, session: Dict[str, Any]) -> List[str]:
        """获取会话建议"""
        recommendations = []
        
        # 根据最终情绪状态给出建议
        final_emotion = session.get("current_emotion", "neutral")
        if final_emotion in ["depression", "sadness"]:
            recommendations.append("建议寻求专业心理咨询师的帮助")
            recommendations.append("可以尝试正念冥想和放松练习")
        
        # 根据风险等级给出建议
        risk_level = session.get("risk_level", "low")
        if risk_level == "high":
            recommendations.append("强烈建议立即寻求专业心理危机干预")
        elif risk_level == "medium":
            recommendations.append("建议寻求专业心理咨询")
        
        # 通用建议
        recommendations.append("保持规律的作息时间")
        recommendations.append("与家人朋友多交流")
        recommendations.append("适当运动释放压力")
        
        return recommendations

    def _get_or_create_db_session(self, session_id: str, user_id: int) -> Optional[AICounselingSession]:
        """获取或创建数据库会话记录"""
        if not self.db:
            return None
            
        try:
            # 尝试从数据库获取现有会话
            db_session = self.db.query(AICounselingSession).filter(
                AICounselingSession.id == int(session_id.split("_")[-1]) if "_" in session_id else 0
            ).first()
            
            if not db_session:
                # 创建新的数据库会话
                db_session = AICounselingSession(
                    student_id=user_id,
                    session_type="text",
                    conversation_history=[],
                    emotion_analysis={},
                    risk_assessment={},
                    status="active"
                )
                self.db.add(db_session)
                self.db.commit()
                self.db.refresh(db_session)
                
            return db_session
        except Exception as e:
            logger.error(f"数据库会话操作失败: {str(e)}")
            return None

    def _save_conversation_to_db(self, session_id: str, conversation_data: Dict[str, Any]):
        """保存对话数据到数据库"""
        if not self.db:
            return
            
        try:
            # 从session_id提取数据库ID
            db_id = conversation_data.get("db_session_id")
            if not db_id:
                # 尝试从session_id解析
                parts = session_id.split("_")
                if len(parts) >= 3:
                    try:
                        db_id = int(parts[-1])
                    except ValueError:
                        logger.warning(f"无法从session_id {session_id} 解析数据库ID")
                        return
                else:
                    logger.warning(f"session_id格式不正确: {session_id}")
                    return
            
            db_session = self.db.query(AICounselingSession).filter(
                AICounselingSession.id == db_id
            ).first()
            
            if db_session:
                db_session.conversation_history = conversation_data.get("conversation_history", [])
                db_session.emotion_analysis = conversation_data.get("emotion_analysis", {})
                db_session.risk_assessment = conversation_data.get("risk_assessment", {})
                self.db.commit()
                
        except Exception as e:
            logger.error(f"保存对话到数据库失败: {str(e)}")

    def _load_conversation_from_db(self, session_id: str) -> Optional[Dict[str, Any]]:
        """从数据库加载对话数据"""
        if not self.db:
            return None
            
        try:
            # 从session_id提取数据库ID：ai_session_{student_id}_{db_id}
            parts = session_id.split("_")
            if len(parts) >= 3:
                try:
                    db_id = int(parts[-1])  # 最后一部分是数据库ID
                    db_session = self.db.query(AICounselingSession).filter(
                        AICounselingSession.id == db_id
                    ).first()
                except ValueError:
                    # 如果最后一部分不是数字，尝试按学生ID查找最新会话
                    student_id = int(parts[2]) if len(parts) > 2 else 0
                    db_session = self.db.query(AICounselingSession).filter(
                        AICounselingSession.student_id == student_id,
                        AICounselingSession.status == "active"
                    ).order_by(AICounselingSession.created_at.desc()).first()
            else:
                db_session = None
            
            if db_session:
                return {
                    "session_id": session_id,
                    "user_id": db_session.student_id,
                    "start_time": db_session.start_time,
                    "conversation_history": db_session.conversation_history or [],
                    "emotion_analysis": db_session.emotion_analysis or {},
                    "risk_assessment": db_session.risk_assessment or {},
                    "status": db_session.status,
                    "session_data": {"db_session_id": db_session.id}
                }
        except Exception as e:
            logger.error(f"从数据库加载对话失败: {str(e)}")
            
        return None


# 全局会话存储（在实际生产环境中应该使用Redis或数据库）
global_conversation_history = {}
global_risk_assessments = {}
