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
from app.services.bert_text_analyzer import bert_analyzer

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
                risk_assessment = self._assess_risk_level(user_message, emotion_analysis)
                
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
        logger.info("准备调用情感分析...")
        emotion_analysis = await self._analyze_user_emotion(user_message)
        logger.info(f"情感分析完成: {emotion_analysis}")
        
        logger.info("准备调用风险评估...")
        risk_assessment = self._assess_risk_level(user_message, emotion_analysis)
        logger.info(f"风险评估完成: {risk_assessment}")
        
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
        """使用BERT分析用户情绪"""
        logger.info(f"开始BERT情感分析，文本: '{message}'")
        try:
            # 危机词前置强制判定（优先级最高）
            crisis_phrases = [
                "自杀", "不想活", "结束生命", "结束一切", "想死", "我想死", "我要死", "让我死",
                "活不下去", "死了算了", "一了百了", "轻生"
            ]
            if any(phrase in message for phrase in crisis_phrases):
                logger.info("检测到危机短语，直接返回强负面情绪（高置信度）")
                logger.warning(f"🚨 危机短语检测触发 - 消息: '{message}'")
                return {
                    "dominant_emotion": "sadness",  # 与前端映射一致（显示为悲伤/抑郁）
                    "emotion_intensity": 0.95,
                    "detected_emotions": {"sadness": 0.95},
                    "confidence": 0.95,
                    "analysis_method": "crisis_override",
                    "bert_details": {"matched_crisis": True}
                }

            # 使用BERT进行情感分析
            bert_result = bert_analyzer.analyze_emotion(message)
            logger.info(f"AI咨询服务收到BERT分析结果: {bert_result}")
            
            if bert_result.get('dominant_emotion') and bert_result.get('confidence', 0) > 0:
                # BERT分析成功，进行智能映射
                bert_emotion = bert_result.get('dominant_emotion', 'neutral')
                confidence = bert_result.get('confidence', 0.5)
                
                # 使用改进的情绪映射逻辑
                mapped_emotion = self._intelligent_emotion_mapping(message, bert_emotion, confidence)
                
                logger.info(f"BERT情感分析结果: {bert_emotion} -> {mapped_emotion} (置信度: {confidence})")
                
                return {
                    "dominant_emotion": mapped_emotion,
                    "emotion_intensity": confidence,
                    "detected_emotions": {mapped_emotion: confidence},
                    "confidence": confidence,
                    "analysis_method": "bert_enhanced",
                    "bert_details": bert_result
                }
            else:
                # BERT分析失败，使用关键词分析作为后备
                logger.warning("BERT分析失败，使用关键词分析")
                return await self._fallback_emotion_analysis(message)
                
        except Exception as e:
            logger.warning(f"BERT情感分析异常: {e}")
            logger.warning(f"异常详情: {str(e)}")
            # 使用关键词分析作为后备
            logger.info("使用fallback情感分析方法")
            return await self._fallback_emotion_analysis(message)
    
    async def _fallback_emotion_analysis(self, message: str) -> Dict[str, Any]:
        """关键词情感分析（后备方案）"""
        logger.info(f"执行fallback情感分析，文本: '{message}'")
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
        
        result = {
            "dominant_emotion": dominant_emotion,
            "emotion_intensity": emotion_intensity,
            "detected_emotions": detected_emotions,
            "confidence": 0.6,  # 关键词分析的置信度较低
            "analysis_method": "keyword_fallback"
        }
        logger.info(f"fallback情感分析结果: {result}")
        return result
    
    def _intelligent_emotion_mapping(self, message: str, bert_emotion: str, confidence: float) -> str:
        """
        智能情绪映射：结合EasyBert的基础分类和关键词分析进行精准映射
        
        Args:
            message: 用户输入文本
            bert_emotion: EasyBert的基础分类结果 (positive/negative/neutral)
            confidence: 置信度
            
        Returns:
            str: 映射后的具体情绪
        """
        message_lower = message.lower()
        
        # 定义情绪关键词字典 - 按优先级排序
        emotion_keywords = {
            # 焦虑相关
            "anxiety": {
                "primary": ["焦虑", "紧张", "担心", "不安", "心慌"],
                "secondary": ["害怕", "恐惧", "担忧", "忧虑", "惶恐", "压力大"]
            },
            # 悲伤相关
            "sadness": {
                "primary": ["难过", "伤心", "悲伤", "失落"],
                "secondary": ["沮丧", "低落", "郁闷", "痛苦", "心情不好"]
            },
            # 抑郁相关
            "depression": {
                "primary": ["抑郁", "绝望", "无助", "空虚"],
                "secondary": ["没意思", "没意义", "活着累", "没希望", "麻木"]
            },
            # 愤怒相关
            "anger": {
                "primary": ["愤怒", "生气", "愤恨", "气愤"],
                "secondary": ["烦躁", "恼火", "不满", "讨厌", "火大", "暴躁"]
            },
            # 恐惧相关
            "fear": {
                "primary": ["害怕", "恐惧", "怕", "畏惧"],
                "secondary": ["惊恐", "胆怯", "可怕", "吓人"]
            },
            # 开心相关
            "happiness": {
                "primary": ["开心", "高兴", "快乐", "愉快"],
                "secondary": ["兴奋", "满足", "幸福", "喜悦", "愉悦", "喜欢"]
            }
        }
        
        # 1. 首先检查明确的情绪表达关键词
        detected_emotions = {}
        
        for emotion, keywords in emotion_keywords.items():
            primary_score = sum(1 for keyword in keywords["primary"] if keyword in message_lower)
            secondary_score = sum(0.5 for keyword in keywords["secondary"] if keyword in message_lower)
            total_score = primary_score * 2 + secondary_score  # 主要关键词权重更高
            
            if total_score > 0:
                detected_emotions[emotion] = total_score
        
        # 2. 如果检测到明确的情绪关键词，优先使用
        if detected_emotions:
            # 选择得分最高的情绪
            explicit_emotion = max(detected_emotions, key=detected_emotions.get)
            max_score = detected_emotions[explicit_emotion]
            
            # 如果关键词得分足够高，直接使用（覆盖BERT的基础分类）
            if max_score >= 1.5:  # 至少包含一个主要关键词或多个次要关键词
                logger.info(f"🎯 关键词明确识别情绪: {explicit_emotion} (得分: {max_score})")
                return explicit_emotion
        
        # 3. 如果没有明确的关键词，基于BERT的基础分类进行合理映射
        if bert_emotion == 'positive':
            # 积极情绪 - 检查是否有具体的积极情绪关键词
            if "happiness" in detected_emotions:
                return "happiness"
            # 特殊情况：表达喜爱但可能是对AI的依恋
            if any(word in message_lower for word in ["喜欢你", "爱你", "喜欢ai"]):
                return "happiness"  # 仍然归类为积极情绪，但可能需要引导
            return "happiness"  # 默认积极情绪
            
        elif bert_emotion == 'negative':
            # 消极情绪 - 需要进一步细分
            if detected_emotions:
                # 有检测到情绪关键词，使用得分最高的
                return max(detected_emotions, key=detected_emotions.get)
            else:
                # 没有明确关键词，根据消极语境推断
                # 检查是否包含压力、困扰等通用消极词汇
                stress_indicators = ["压力", "困扰", "烦恼", "麻烦", "问题", "困难"]
                if any(word in message_lower for word in stress_indicators):
                    return "anxiety"  # 倾向于焦虑
                else:
                    return "sadness"  # 默认为悲伤
                    
        else:  # neutral
            # 中性情绪
            if detected_emotions:
                # 即使BERT认为是中性，但有明确情绪词汇
                return max(detected_emotions, key=detected_emotions.get)
            return "neutral"
    
    def _assess_risk_level(self, message: str, emotion_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """评估风险等级"""
        message_lower = message.lower()
        
        # 高风险关键词 - 增强版
        high_risk_keywords = [
            "自杀", "死亡", "不想活", "结束生命", "结束一切", "想死", "我想死", "我要死",
            "伤害自己", "自残", "割腕", "上吊", "跳楼", "活着没有意义",
            "死了算了", "一了百了", "去死", "轻生", "再见了，人生",
            "结束这一切", "不想活下去", "想要死去", "活不下去", "让我死"
        ]
        
        # 中风险关键词
        medium_risk_keywords = [
            "绝望", "痛苦", "没有希望", "看不到未来", "很累", "累得不行",
            "没人理解", "孤独", "被抛弃", "撑不下去", "受不了", "崩溃",
            "说不上", "没什么话", "聊不来", "交流困难", "社交困难", "很难交流"
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
        
        # 矛盾情绪检测：如果同时出现积极和消极词汇，可能是掩饰或复杂情况
        positive_keywords = ["快乐", "开心", "高兴", "愉快", "幸福", "满足"]
        negative_social_keywords = ["说不上", "孤独", "没什么话", "聊不来", "没人理解"]
        
        has_positive = any(keyword in message_lower for keyword in positive_keywords)
        has_negative_social = any(keyword in message_lower for keyword in negative_social_keywords)
        
        # 如果同时出现积极词汇和社交困难，增加风险分数（可能是情绪掩饰）
        if has_positive and has_negative_social:
            risk_score += 1
            risk_keywords.append("矛盾情绪模式")
        
        # 确定风险等级 - 调整阈值让危机关键词直接触发高风险
        if risk_score >= 3:  # 任何高风险关键词都触发高风险
            risk_level = "high"
        elif risk_score >= 2:
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
        """根据BERT情感分析结果生成AI回复"""
        dominant_emotion = emotion_analysis.get("dominant_emotion", "neutral")
        risk_level = risk_assessment.get("risk_level", "low")
        analysis_method = emotion_analysis.get("analysis_method", "unknown")
        confidence = emotion_analysis.get("confidence", 0.5)
        
        # 记录BERT分析结果
        if analysis_method == "bert":
            logger.info(f"使用BERT情感分析结果生成回复: {dominant_emotion} (置信度: {confidence})")
        
        # 高风险情况优先处理
        if risk_level == "high":
            response_text = self._generate_high_risk_response(user_message)
        else:
            # 根据情感分析结果调整AI回复策略
            emotion_context = self._build_emotion_context(emotion_analysis)
            
            # 尝试使用配置的AI服务生成回复，传入情感上下文
            response_text = await self._generate_ai_response_with_fallback(
                user_message, emotion_analysis, session, emotion_context
            )
        
        # 检查是否应该完成评估并跳转
        redirect_action = self._check_assessment_completion(session, emotion_analysis, risk_assessment)
        
        return {
            "message": response_text,
            "emotion_analysis": emotion_analysis,
            "risk_assessment": risk_assessment,
            "session_id": session["session_id"],
            "redirect_action": redirect_action
        }
    
    def _check_assessment_completion(self, session: Dict[str, Any], 
                                   emotion_analysis: Dict[str, Any], 
                                   risk_assessment: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """检查AI评估是否应该完成并跳转到传统量表"""
        conversation_history = session.get("conversation_history", [])
        
        # 只计算用户消息的数量（真实的对话轮数）
        user_message_count = len([msg for msg in conversation_history if msg.get("role") == "user"])
        
        # 评估完成条件：用户对话轮数达到6轮或满足特定条件
        should_complete = False
        completion_reason = ""
        
        logger.info(f"评估完成检查: 用户消息数={user_message_count}, 总历史记录数={len(conversation_history)}")
        
        if user_message_count >= 6:
            should_complete = True
            completion_reason = "达到预设对话轮数"
        
        # 也可以基于其他条件完成评估
        elif user_message_count >= 4:
            # 检查是否已经涵盖足够的评估维度
            emotions_covered = set()
            risk_levels_seen = set()
            
            for conv in session.get("conversation_history", []):
                if "emotion_analysis" in conv:
                    emotions_covered.add(conv["emotion_analysis"].get("dominant_emotion", ""))
                if "risk_assessment" in conv:
                    risk_levels_seen.add(conv["risk_assessment"].get("risk_level", ""))
            
            # 如果涵盖了多种情绪状态且有足够对话
            if len(emotions_covered) >= 2 and user_message_count >= 5:
                should_complete = True
                completion_reason = "评估维度充分"
        
        if should_complete:
            # 生成完成消息
            completion_message = "非常感谢您的耐心配合！通过我们的深入对话，我已经对您的心理状态有了全面的了解。现在让我为您生成AI评估报告，然后我们将进入标准化量表评估阶段，这样可以为您提供更准确、更全面的心理健康评估。"
            
            return {
                "type": "complete_assessment",
                "message": completion_message,
                "redirect_to": "/student/assessment",
                "reason": completion_reason,
                "conversation_count": user_message_count,
                "delay": 3000  # 3秒后跳转
            }
        
        return None

    def _build_emotion_context(self, emotion_analysis: Dict[str, Any]) -> str:
        """根据BERT分析结果构建情感上下文"""
        dominant_emotion = emotion_analysis.get("dominant_emotion", "neutral")
        confidence = emotion_analysis.get("confidence", 0.5)
        analysis_method = emotion_analysis.get("analysis_method", "unknown")
        
        # 根据情绪类型和置信度构建上下文提示
        emotion_prompts = {
            "depression": f"用户表现出抑郁情绪（置信度: {confidence:.2f}），需要温暖、理解和支持的回应",
            "anxiety": f"用户表现出焦虑情绪（置信度: {confidence:.2f}），需要安抚、理解和实用建议",
            "anger": f"用户表现出愤怒情绪（置信度: {confidence:.2f}），需要冷静、理解和引导",
            "sadness": f"用户表现出悲伤情绪（置信度: {confidence:.2f}），需要同理心和温暖支持",
            "happiness": f"用户表现出积极情绪（置信度: {confidence:.2f}），可以分享他们的快乐并提供正面引导",
            "neutral": f"用户情绪相对平稳（置信度: {confidence:.2f}），可以进行正常的心理评估对话"
        }
        
        base_context = emotion_prompts.get(dominant_emotion, "用户情绪需要进一步了解")
        
        # 如果使用了BERT分析，添加额外的上下文信息
        if analysis_method == "bert" and confidence > 0.7:
            base_context += "。BERT分析显示情绪识别置信度较高，请重点关注这一情绪状态"
        elif analysis_method == "bert" and confidence < 0.5:
            base_context += "。BERT分析显示情绪识别存在不确定性，建议进一步探索用户的真实感受"
        
        return base_context
    
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
        session: Dict[str, Any],
        emotion_context: str = None
    ) -> str:
        """使用多AI服务回退机制生成回复，结合BERT情感分析"""
        
        context = {
            'emotion_state': emotion_analysis.get('dominant_emotion', 'neutral'),
            'risk_level': 'low',  # 这里传入的是非高风险情况
            'emotion_intensity': emotion_analysis.get('emotion_intensity', 0.5),
            'analysis_method': emotion_analysis.get('analysis_method', 'unknown'),
            'confidence': emotion_analysis.get('confidence', 0.5)
        }
        
        # 添加BERT情感上下文到提示中
        if emotion_context:
            context['emotion_context'] = emotion_context
        
        conversation_history = session.get("conversation_history", [])
        
        # 提取已问过的问题，避免重复
        asked_questions = []
        for msg in conversation_history:
            if msg.get("role") == "assistant" and "?" in msg.get("message", ""):
                # 提取问题句子
                questions = [q.strip() + "?" for q in msg["message"].split("?") if q.strip()]
                asked_questions.extend(questions)
        
        # 将已问问题添加到上下文中
        if asked_questions:
            context['previous_questions'] = asked_questions[-5:]  # 只保留最近5个问题
        
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
        # 只计算用户消息数量（与评估完成检查保持一致）
        user_messages = [msg for msg in session["conversation_history"] if msg["role"] == "user"]
        ai_messages = [msg for msg in session["conversation_history"] if msg["role"] == "assistant"]
        conversation_count = len(user_messages)  # 修改为只计算用户消息
        
        duration = None
        if "end_time" in session and "start_time" in session:
            duration = (session["end_time"] - session["start_time"]).total_seconds() / 60
        
        # 分析对话内容
        
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
                # 序列化conversation_history中的datetime对象
                conversation_history = conversation_data.get("conversation_history", [])
                serialized_history = []
                for entry in conversation_history:
                    serialized_entry = entry.copy()
                    if 'timestamp' in serialized_entry and hasattr(serialized_entry['timestamp'], 'isoformat'):
                        serialized_entry['timestamp'] = serialized_entry['timestamp'].isoformat()
                    serialized_history.append(serialized_entry)
                
                db_session.conversation_history = serialized_history
                db_session.emotion_analysis = conversation_data.get("emotion_analysis", {})
                db_session.risk_assessment = conversation_data.get("risk_assessment", {})
                self.db.commit()
                logger.info(f"✅ 对话数据已成功保存到数据库，会话ID: {db_id}, 对话条数: {len(serialized_history)}")
            else:
                logger.warning(f"❌ 未找到数据库会话记录，ID: {db_id}")
                
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
                    expected_student_id = int(parts[2])  # session_id中的student_id
                    db_id = int(parts[-1])  # 最后一部分是数据库ID
                    db_session = self.db.query(AICounselingSession).filter(
                        AICounselingSession.id == db_id
                    ).first()
                    
                    # 验证student_id是否匹配
                    if db_session and db_session.student_id != expected_student_id:
                        logger.warning(f"会话ID不匹配: {session_id} 期望student_id={expected_student_id}, 但数据库中为{db_session.student_id}")
                        # student_id不匹配，按student_id查找最新会话
                        db_session = self.db.query(AICounselingSession).filter(
                            AICounselingSession.student_id == expected_student_id,
                            AICounselingSession.status == "active"
                        ).order_by(AICounselingSession.created_at.desc()).first()
                        
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

    async def get_session_history(self, student_id: int, limit: int = 10) -> List[Dict[str, Any]]:
        """获取学生的AI咨询历史记录"""
        if not self.db:
            return []
        
        try:
            # 从数据库获取学生的咨询会话历史
            sessions = self.db.query(AICounselingSession).filter(
                AICounselingSession.student_id == student_id
            ).order_by(AICounselingSession.created_at.desc()).limit(limit).all()
            
            history = []
            for session in sessions:
                # 只计算用户消息数量（与其他地方保持一致）
                user_msg_count = len([msg for msg in (session.conversation_history or []) if msg.get("role") == "user"])
                
                history.append({
                    "session_id": f"ai_session_{student_id}_{session.id}",
                    "start_time": session.start_time,
                    "end_time": session.end_time,
                    "status": session.status,
                    "conversation_count": user_msg_count,  # 修改为只计算用户消息
                    "final_emotion": session.emotion_analysis.get("dominant_emotion", "neutral") if session.emotion_analysis else "neutral",
                    "risk_level": session.risk_assessment.get("risk_level", "low") if session.risk_assessment else "low"
                })
            
            return history
            
        except Exception as e:
            logger.error(f"获取咨询历史失败: {e}")
            return []

    async def get_intervention_suggestions(self, student_id: int) -> Dict[str, Any]:
        """获取基于学生历史数据的干预建议"""
        try:
            # 获取学生最近的咨询记录
            recent_sessions = await self.get_session_history(student_id, limit=5)
            
            if not recent_sessions:
                return {
                    "suggestions": ["建议定期进行心理健康评估", "保持积极的生活方式"],
                    "risk_trend": "stable",
                    "recommendation": "继续关注心理健康状态"
                }
            
            # 分析风险趋势
            risk_levels = [session.get("risk_level", "low") for session in recent_sessions]
            high_risk_count = sum(1 for level in risk_levels if level == "high")
            medium_risk_count = sum(1 for level in risk_levels if level == "medium")
            
            suggestions = []
            if high_risk_count > 0:
                suggestions.extend([
                    "强烈建议寻求专业心理危机干预",
                    "联系家人朋友获得支持",
                    "避免独处，保持社交联系"
                ])
            elif medium_risk_count >= 2:
                suggestions.extend([
                    "建议寻求专业心理咨询",
                    "学习情绪管理技巧",
                    "保持规律作息"
                ])
            else:
                suggestions.extend([
                    "继续保持当前状态",
                    "定期进行心理健康评估",
                    "学习压力管理技巧"
                ])
            
            return {
                "suggestions": suggestions,
                "risk_trend": "increasing" if high_risk_count > 0 else "stable",
                "recommendation": "继续关注心理健康状态" if high_risk_count == 0 else "需要专业干预",
                "recent_sessions_count": len(recent_sessions)
            }
            
        except Exception as e:
            logger.error(f"获取干预建议失败: {e}")
            return {
                "suggestions": ["建议寻求专业心理咨询"],
                "risk_trend": "unknown",
                "recommendation": "需要进一步评估"
            }

    async def process_realtime_message(self, session_id: str, message: str) -> Dict[str, Any]:
        """处理实时消息（用于WebSocket）"""
        try:
            # 使用现有的对话处理方法
            response = await self.continue_conversation(session_id, message)
            return {
                "message": response.get("message", ""),
                "emotion_analysis": response.get("emotion_analysis", {}),
                "risk_assessment": response.get("risk_assessment", {}),
                "timestamp": datetime.utcnow().isoformat()
            }
        except Exception as e:
            logger.error(f"处理实时消息失败: {e}")
            return {
                "message": "抱歉，处理您的消息时出现了问题，请稍后再试。",
                "emotion_analysis": {},
                "risk_assessment": {"risk_level": "low"},
                "timestamp": datetime.utcnow().isoformat()
            }


# 全局会话存储（在实际生产环境中应该使用Redis或数据库）
global_conversation_history = {}
global_risk_assessments = {}
