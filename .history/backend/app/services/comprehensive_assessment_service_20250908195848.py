"""
综合心理评估服务 - 整合对话分析和传统量表评估
Comprehensive Psychological Assessment Service
"""

from typing import Dict, Any, List, Optional
import json
from datetime import datetime
from loguru import logger

from app.services.ai_assessment_service import AIAssessmentService
from app.services.ai_counseling_service import AICounselingService
from app.services.bert_text_analyzer import bert_analyzer
from app.services.xfyun_ai_service import xfyun_ai_service


class ComprehensiveAssessmentService:
    """综合心理评估服务类 - 整合对话分析和量表评估"""
    
    def __init__(self):
        self.ai_assessment_service = AIAssessmentService()
        self.ai_counseling_service = AICounselingService()
    
    async def create_comprehensive_assessment(self, 
                                            session_id: str, 
                                            scale_results: Optional[Dict[str, Any]] = None,
                                            include_conversation: bool = True) -> Dict[str, Any]:
        """
        创建综合心理评估报告
        
        Args:
            session_id: AI咨询会话ID
            scale_results: 传统量表测试结果（PHQ-9, GAD-7等）
            include_conversation: 是否包含对话分析
        
        Returns:
            综合评估报告
        """
        try:
            logger.info(f"开始生成综合心理评估，会话ID: {session_id}")
            
            # 1. 获取对话数据
            conversation_data = None
            if include_conversation:
                conversation_data = self._get_conversation_data(session_id)
            
            # 2. 对话情感分析
            conversation_analysis = None
            if conversation_data:
                conversation_analysis = await self._analyze_conversation_comprehensively(conversation_data)
            
            # 3. 量表分析
            scale_analysis = None
            if scale_results:
                scale_analysis = self._analyze_scale_results(scale_results)
            
            # 4. 综合分析
            comprehensive_result = self._integrate_assessment_results(
                conversation_analysis=conversation_analysis,
                scale_analysis=scale_analysis,
                session_id=session_id
            )
            
            # 5. 生成最终报告
            final_report = await self._generate_final_assessment_report(comprehensive_result)
            
            logger.info(f"综合心理评估完成，风险等级: {final_report.get('overall_risk_level')}")
            return final_report
            
        except Exception as e:
            logger.error(f"综合心理评估失败: {e}")
            return self._generate_fallback_assessment()
    
    def _get_conversation_data(self, session_id: str) -> Optional[Dict[str, Any]]:
        """获取对话数据"""
        try:
            # 从AI咨询服务获取会话数据
            if hasattr(self.ai_counseling_service, 'conversation_history'):
                session_data = self.ai_counseling_service.conversation_history.get(session_id)
                if session_data:
                    return session_data
            
            # 如果内存中没有，尝试从数据库加载
            logger.warning(f"内存中未找到会话 {session_id}，尝试从数据库加载")
            # 这里可以添加数据库查询逻辑
            
            return None
            
        except Exception as e:
            logger.error(f"获取对话数据失败: {e}")
            return None
    
    async def _analyze_conversation_comprehensively(self, conversation_data: Dict[str, Any]) -> Dict[str, Any]:
        """综合分析对话数据，重点利用EasyBert分析结果"""
        try:
            conversation_history = conversation_data.get("conversation_history", [])
            user_messages = [msg.get("message", "") for msg in conversation_history if msg.get("role") == "user"]
            
            if not user_messages:
                return {"status": "no_conversation_data"}
            
            # 构建完整对话文本
            full_conversation = " ".join(user_messages)
            
            # 1. EasyBert情感分析（主要分析工具）
            easybert_analysis = bert_analyzer.comprehensive_analysis(full_conversation)
            
            # 2. AI情感分析（辅助验证）
            ai_emotion_analysis = await xfyun_ai_service.analyze_emotion_with_ai(full_conversation)
            
            # 3. 会话模式分析
            session_patterns = self._analyze_session_patterns(conversation_data)
            
            # 4. 基于EasyBert结果的对话策略分析
            dialogue_strategy = self._analyze_dialogue_strategy(easybert_analysis, full_conversation)
            
            # 5. 风险评估
            risk_assessment = self._assess_conversation_risks(user_messages, easybert_analysis)
            
            # 5. 情感变化轨迹
            emotional_trajectory = self._analyze_emotional_trajectory(conversation_history)
            
            return {
                "conversation_summary": {
                    "total_messages": len(user_messages),
                    "session_duration": session_patterns.get("duration_minutes"),
                    "engagement_level": session_patterns.get("engagement_level"),
                    "conversation_depth": session_patterns.get("conversation_depth")
                },
                "bert_analysis": easybert_analysis,
                "ai_emotion_analysis": ai_emotion_analysis,
                "session_patterns": session_patterns,
                "dialogue_strategy": dialogue_strategy,
                "risk_assessment": risk_assessment,
                "emotional_trajectory": emotional_trajectory,
                "dominant_themes": self._extract_conversation_themes(user_messages),
                "conversation_quality_score": self._calculate_conversation_quality(conversation_data)
            }
            
        except Exception as e:
            logger.error(f"对话综合分析失败: {e}")
            return {"status": "analysis_failed", "error": str(e)}
    
    def _analyze_dialogue_strategy(self, easybert_analysis: Dict[str, Any], full_conversation: str) -> Dict[str, Any]:
        """基于EasyBert分析结果分析对话策略"""
        try:
            dominant_emotion = easybert_analysis.get("dominant_emotion", "neutral")
            emotion_intensity = easybert_analysis.get("emotion_intensity", 0.0)
            sentiment_score = easybert_analysis.get("sentiment_score", 0.0)
            
            # 根据主导情绪确定对话策略
            strategy = {
                "approach": "neutral",  # neutral, supportive, probing, gentle
                "focus_areas": [],
                "next_questions": [],
                "risk_level": "low"
            }
            
            # 根据主导情绪调整策略
            if dominant_emotion in ["sadness", "depression"]:
                strategy["approach"] = "supportive"
                strategy["focus_areas"] = ["depression", "self_esteem", "social_support"]
                strategy["next_questions"] = [
                    "您刚才提到感到沮丧，能告诉我是什么让您有这种感觉吗？",
                    "这种情绪持续多久了？",
                    "您平时有什么方式让自己感觉好一些吗？"
                ]
            elif dominant_emotion in ["anxiety", "fear"]:
                strategy["approach"] = "gentle"
                strategy["focus_areas"] = ["anxiety", "stress", "coping_mechanisms"]
                strategy["next_questions"] = [
                    "听起来您可能感到有些焦虑，能具体说说是什么让您担心吗？",
                    "这种担心对您的日常生活有什么影响？",
                    "您有什么方法帮助自己放松吗？"
                ]
            elif dominant_emotion in ["anger", "frustration"]:
                strategy["approach"] = "neutral"
                strategy["focus_areas"] = ["anger_management", "stress", "relationships"]
                strategy["next_questions"] = [
                    "我注意到您可能感到有些愤怒或沮丧，能告诉我发生了什么吗？",
                    "这种情绪通常什么时候会出现？",
                    "您是如何处理这种情绪的？"
                ]
            
            # 根据情绪强度调整风险等级
            if emotion_intensity > 0.8 or sentiment_score < -0.6:
                strategy["risk_level"] = "high"
            elif emotion_intensity > 0.6 or sentiment_score < -0.3:
                strategy["risk_level"] = "medium"
            
            return strategy
            
        except Exception as e:
            logger.error(f"对话策略分析失败: {e}")
            return {
                "approach": "neutral",
                "focus_areas": [],
                "next_questions": [],
                "risk_level": "low"
            }
    
    def _analyze_session_patterns(self, conversation_data: Dict[str, Any]) -> Dict[str, Any]:
        """分析会话模式"""
        conversation_history = conversation_data.get("conversation_history", [])
        start_time = conversation_data.get("start_time", datetime.utcnow())
        
        user_messages = [msg for msg in conversation_history if msg.get("role") == "user"]
        assistant_messages = [msg for msg in conversation_history if msg.get("role") == "assistant"]
        
        # 计算会话特征
        duration_minutes = (datetime.utcnow() - start_time).total_seconds() / 60
        avg_user_message_length = sum(len(msg.get("message", "")) for msg in user_messages) / max(len(user_messages), 1)
        
        # 参与度评估
        if avg_user_message_length > 50 and len(user_messages) > 5:
            engagement_level = "high"
        elif avg_user_message_length > 20 and len(user_messages) > 3:
            engagement_level = "medium"
        else:
            engagement_level = "low"
        
        # 对话深度评估
        conversation_depth = "surface"
        if len(user_messages) > 10:
            conversation_depth = "deep"
        elif len(user_messages) > 5:
            conversation_depth = "moderate"
        
        return {
            "duration_minutes": duration_minutes,
            "user_message_count": len(user_messages),
            "assistant_message_count": len(assistant_messages),
            "avg_user_message_length": avg_user_message_length,
            "engagement_level": engagement_level,
            "conversation_depth": conversation_depth,
            "problem_type": conversation_data.get("problem_type", "unknown")
        }
    
    def _assess_conversation_risks(self, user_messages: List[str], bert_analysis: Dict) -> Dict[str, Any]:
        """评估对话中的风险因素 - 优化版本，考虑积极和消极因素"""
        all_text = " ".join(user_messages).lower()
        
        # 高风险关键词
        high_risk_keywords = ["自杀", "死亡", "伤害自己", "结束生命", "不想活了", "没有希望", "想死", "自残"]
        medium_risk_keywords = ["绝望", "无助", "孤独", "痛苦", "折磨", "崩溃", "压力很大", "很难受", "受不了"]
        
        # 积极关键词（降低风险）
        positive_keywords = ["开心", "快乐", "满意", "感谢", "希望", "乐观", "积极", "好转", "改善", "放松", "舒服", "安心", "平静", "满足", "幸福", "还好", "不错", "挺好"]
        
        high_risk_count = sum(1 for keyword in high_risk_keywords if keyword in all_text)
        medium_risk_count = sum(1 for keyword in medium_risk_keywords if keyword in all_text)
        positive_count = sum(1 for keyword in positive_keywords if keyword in all_text)
        
        # BERT风险评估 - 更严格的处理
        bert_risk = bert_analysis.get("risk_assessment", {})
        bert_risk_score = bert_risk.get("risk_score", 0)
        
        # 如果BERT风险评分过低（可能是默认值），不计入
        if bert_risk_score < 3:
            bert_risk_score = 0
        
        # 综合风险评分 - 考虑积极因素
        negative_score = high_risk_count * 6 + medium_risk_count * 2
        positive_adjustment = min(positive_count * 2, negative_score * 0.7)  # 积极因素最多抵消70%的负面分数
        
        total_risk_score = max(0, negative_score - positive_adjustment + bert_risk_score * 0.5)  # BERT分数权重降低
        
        # 更严格的风险等级判断
        if high_risk_count > 0 and total_risk_score >= 8:  # 必须有高风险关键词且分数很高
            risk_level = "high"
        elif total_risk_score >= 4:
            risk_level = "medium"
        elif total_risk_score >= 1:
            risk_level = "low"
        else:
            risk_level = "minimal"
        
        return {
            "risk_level": risk_level,
            "risk_score": total_risk_score,
            "high_risk_indicators": high_risk_count,
            "medium_risk_indicators": medium_risk_count,
            "positive_indicators": positive_count,
            "bert_risk_score": bert_risk_score,
            "negative_score": negative_score,
            "positive_adjustment": positive_adjustment,
            "risk_keywords_found": [kw for kw in high_risk_keywords + medium_risk_keywords if kw in all_text],
            "positive_keywords_found": [kw for kw in positive_keywords if kw in all_text],
            "risk_factors": self._identify_specific_risk_factors(all_text, bert_analysis)
        }
    
    def _identify_specific_risk_factors(self, text: str, bert_analysis: Dict) -> List[str]:
        """识别具体风险因素"""
        risk_factors = []
        
        # 基于关键词的风险因素
        if any(word in text for word in ["自杀", "死亡", "伤害自己"]):
            risk_factors.append("自伤或自杀倾向")
        
        if any(word in text for word in ["绝望", "没有希望"]):
            risk_factors.append("绝望感强烈")
        
        if any(word in text for word in ["孤独", "没有朋友", "一个人"]):
            risk_factors.append("社会孤立")
        
        if any(word in text for word in ["睡不着", "失眠", "睡眠不好"]):
            risk_factors.append("睡眠问题")
        
        if any(word in text for word in ["不想吃", "没有食欲", "体重"]):
            risk_factors.append("食欲或体重变化")
        
        # 基于BERT分析的风险因素
        bert_emotion = bert_analysis.get("emotion_analysis", {})
        if bert_emotion.get("dominant_emotion") == "negative" and bert_emotion.get("confidence", 0) > 0.7:
            risk_factors.append("持续负面情绪")
        
        problem_type = bert_analysis.get("problem_classification", {}).get("problem_type")
        if problem_type in ["mental_health", "emotional_issues"]:
            risk_factors.append("心理健康问题")
        
        return risk_factors
    
    def _analyze_emotional_trajectory(self, conversation_history: List[Dict]) -> Dict[str, Any]:
        """分析情感变化轨迹"""
        user_messages = [msg for msg in conversation_history if msg.get("role") == "user"]
        
        if len(user_messages) < 3:
            return {"status": "insufficient_data"}
        
        emotional_scores = []
        for msg in user_messages:
            message_text = msg.get("message", "")
            score = self._quick_emotional_score(message_text)
            emotional_scores.append({
                "timestamp": msg.get("timestamp"),
                "score": score,
                "message": message_text[:50] + "..." if len(message_text) > 50 else message_text
            })
        
        # 计算趋势
        recent_scores = [item["score"] for item in emotional_scores[-3:]]
        earlier_scores = [item["score"] for item in emotional_scores[:3]]
        
        recent_avg = sum(recent_scores) / len(recent_scores)
        earlier_avg = sum(earlier_scores) / len(earlier_scores)
        
        if recent_avg > earlier_avg + 0.1:
            trend = "improving"
        elif recent_avg < earlier_avg - 0.1:
            trend = "declining"
        else:
            trend = "stable"
        
        return {
            "emotional_scores": emotional_scores,
            "trend": trend,
            "recent_average": recent_avg,
            "earlier_average": earlier_avg,
            "overall_direction": "positive" if recent_avg > 0 else "negative" if recent_avg < -0.1 else "neutral"
        }
    
    def _quick_emotional_score(self, text: str) -> float:
        """快速情感评分（-1到1之间）"""
        positive_words = ["好", "开心", "快乐", "希望", "感谢", "舒服", "放松", "满意", "喜欢"]
        negative_words = ["难过", "痛苦", "焦虑", "害怕", "绝望", "困难", "压力", "烦躁", "不满"]
        
        pos_count = sum(1 for word in positive_words if word in text)
        neg_count = sum(1 for word in negative_words if word in text)
        
        total_words = len(text.split())
        if total_words == 0:
            return 0.0
        
        return (pos_count - neg_count) / max(total_words, 5)  # 避免除零，设置最小值
    
    def _extract_conversation_themes(self, user_messages: List[str]) -> List[Dict[str, Any]]:
        """提取对话主题"""
        all_text = " ".join(user_messages)
        
        themes = []
        
        # 定义主题关键词
        theme_keywords = {
            "学习压力": ["学习", "考试", "成绩", "功课", "作业", "学业"],
            "人际关系": ["朋友", "同学", "室友", "社交", "人际", "关系"],
            "家庭问题": ["家里", "父母", "家人", "家庭", "爸爸", "妈妈"],
            "情感困扰": ["恋爱", "分手", "喜欢", "爱情", "感情", "男朋友", "女朋友"],
            "就业焦虑": ["工作", "就业", "找工作", "实习", "职业", "未来"],
            "身体健康": ["身体", "生病", "健康", "医院", "疼痛"],
            "心理健康": ["抑郁", "焦虑", "心理", "情绪", "精神"]
        }
        
        for theme_name, keywords in theme_keywords.items():
            count = sum(1 for keyword in keywords if keyword in all_text)
            if count > 0:
                # 计算主题权重
                weight = count / len(user_messages)
                themes.append({
                    "theme": theme_name,
                    "keyword_count": count,
                    "weight": weight,
                    "relevance": "high" if weight > 0.3 else "medium" if weight > 0.1 else "low"
                })
        
        # 按权重排序
        themes.sort(key=lambda x: x["weight"], reverse=True)
        return themes[:5]  # 返回前5个主题
    
    def _calculate_conversation_quality(self, conversation_data: Dict[str, Any]) -> float:
        """计算对话质量分数（0-1之间）"""
        conversation_history = conversation_data.get("conversation_history", [])
        user_messages = [msg for msg in conversation_history if msg.get("role") == "user"]
        
        if not user_messages:
            return 0.0
        
        quality_score = 0.0
        
        # 1. 消息数量（20%权重）
        message_count_score = min(len(user_messages) / 10, 1.0)  # 10条消息为满分
        quality_score += message_count_score * 0.2
        
        # 2. 平均消息长度（30%权重）
        avg_length = sum(len(msg.get("message", "")) for msg in user_messages) / len(user_messages)
        length_score = min(avg_length / 100, 1.0)  # 100字符为满分
        quality_score += length_score * 0.3
        
        # 3. 对话深度（25%权重）
        # 检查是否有深度表达
        depth_indicators = ["因为", "所以", "但是", "然而", "感觉", "觉得", "经历", "体验"]
        depth_count = sum(1 for msg in user_messages for indicator in depth_indicators 
                         if indicator in msg.get("message", ""))
        depth_score = min(depth_count / (len(user_messages) * 2), 1.0)
        quality_score += depth_score * 0.25
        
        # 4. 情感表达丰富度（25%权重）
        emotion_words = ["开心", "难过", "焦虑", "害怕", "愤怒", "担心", "希望", "失望", "兴奋", "紧张"]
        emotion_count = sum(1 for msg in user_messages for word in emotion_words 
                           if word in msg.get("message", ""))
        emotion_score = min(emotion_count / len(user_messages), 1.0)
        quality_score += emotion_score * 0.25
        
        return round(quality_score, 2)
    
    def _analyze_scale_results(self, scale_results: Dict[str, Any]) -> Dict[str, Any]:
        """分析量表结果"""
        analysis = {
            "scales_completed": list(scale_results.keys()),
            "scale_analyses": {},
            "overall_scale_assessment": {}
        }
        
        total_risk_score = 0
        scale_count = 0
        
        for scale_name, scale_data in scale_results.items():
            scale_analysis = self._analyze_individual_scale(scale_name, scale_data)
            analysis["scale_analyses"][scale_name] = scale_analysis
            
            # 累计风险评分
            if scale_analysis.get("risk_score"):
                total_risk_score += scale_analysis["risk_score"]
                scale_count += 1
        
        # 整体量表评估
        if scale_count > 0:
            avg_risk_score = total_risk_score / scale_count
            if avg_risk_score >= 7:
                overall_risk = "high"
            elif avg_risk_score >= 4:
                overall_risk = "medium"
            else:
                overall_risk = "low"
            
            analysis["overall_scale_assessment"] = {
                "average_risk_score": avg_risk_score,
                "overall_risk_level": overall_risk,
                "scales_count": scale_count,
                "assessment_reliability": "high" if scale_count >= 2 else "medium"
            }
        
        return analysis
    
    def _analyze_individual_scale(self, scale_name: str, scale_data: Dict[str, Any]) -> Dict[str, Any]:
        """分析单个量表结果"""
        score = scale_data.get("total_score", 0)
        
        # 不同量表的评分标准
        if scale_name.lower() in ["phq-9", "phq9"]:
            return self._analyze_phq9(score, scale_data)
        elif scale_name.lower() in ["gad-7", "gad7"]:
            return self._analyze_gad7(score, scale_data)
        elif scale_name.lower() in ["beck", "bdi-ii", "bdi"]:
            return self._analyze_beck_depression(score, scale_data)
        else:
            # 通用分析
            return self._analyze_generic_scale(scale_name, score, scale_data)
    
    def _analyze_phq9(self, score: int, scale_data: Dict[str, Any]) -> Dict[str, Any]:
        """分析PHQ-9抑郁量表"""
        if score >= 20:
            severity = "severe"
            risk_score = 9
            recommendation = "重度抑郁症状，强烈建议立即寻求专业医疗帮助"
        elif score >= 15:
            severity = "moderately_severe"
            risk_score = 7
            recommendation = "中重度抑郁症状，建议寻求专业心理或医疗帮助"
        elif score >= 10:
            severity = "moderate"
            risk_score = 5
            recommendation = "中度抑郁症状，建议咨询心理健康专家"
        elif score >= 5:
            severity = "mild"
            risk_score = 3
            recommendation = "轻度抑郁症状，建议关注心理健康状态"
        else:
            severity = "minimal"
            risk_score = 1
            recommendation = "抑郁症状最小，继续保持良好的心理状态"
        
        return {
            "scale_name": "PHQ-9",
            "score": score,
            "severity": severity,
            "risk_score": risk_score,
            "recommendation": recommendation,
            "interpretation": f"PHQ-9抑郁自评量表得分{score}分，属于{severity}级别"
        }
    
    def _analyze_gad7(self, score: int, scale_data: Dict[str, Any]) -> Dict[str, Any]:
        """分析GAD-7焦虑量表"""
        if score >= 15:
            severity = "severe"
            risk_score = 8
            recommendation = "重度焦虑症状，强烈建议寻求专业医疗帮助"
        elif score >= 10:
            severity = "moderate"
            risk_score = 6
            recommendation = "中度焦虑症状，建议咨询心理健康专家"
        elif score >= 5:
            severity = "mild"
            risk_score = 3
            recommendation = "轻度焦虑症状，建议学习焦虑管理技巧"
        else:
            severity = "minimal"
            risk_score = 1
            recommendation = "焦虑症状最小，继续保持良好状态"
        
        return {
            "scale_name": "GAD-7",
            "score": score,
            "severity": severity,
            "risk_score": risk_score,
            "recommendation": recommendation,
            "interpretation": f"GAD-7焦虑自评量表得分{score}分，属于{severity}级别"
        }
    
    def _analyze_beck_depression(self, score: int, scale_data: Dict[str, Any]) -> Dict[str, Any]:
        """分析Beck抑郁量表"""
        if score >= 29:
            severity = "severe"
            risk_score = 9
        elif score >= 20:
            severity = "moderate"
            risk_score = 6
        elif score >= 14:
            severity = "mild"
            risk_score = 4
        else:
            severity = "minimal"
            risk_score = 2
        
        return {
            "scale_name": "Beck Depression Inventory",
            "score": score,
            "severity": severity,
            "risk_score": risk_score,
            "interpretation": f"Beck抑郁量表得分{score}分"
        }
    
    def _analyze_generic_scale(self, scale_name: str, score: int, scale_data: Dict[str, Any]) -> Dict[str, Any]:
        """分析通用量表"""
        # 基于分数范围的通用分析
        max_score = scale_data.get("max_score", 100)
        percentage = (score / max_score) * 100
        
        if percentage >= 80:
            severity = "high"
            risk_score = 7
        elif percentage >= 60:
            severity = "moderate"
            risk_score = 5
        elif percentage >= 40:
            severity = "mild"
            risk_score = 3
        else:
            severity = "low"
            risk_score = 1
        
        return {
            "scale_name": scale_name,
            "score": score,
            "percentage": percentage,
            "severity": severity,
            "risk_score": risk_score,
            "interpretation": f"{scale_name}得分{score}分（{percentage:.1f}%）"
        }
    
    def _integrate_assessment_results(self, 
                                    conversation_analysis: Optional[Dict[str, Any]], 
                                    scale_analysis: Optional[Dict[str, Any]], 
                                    session_id: str) -> Dict[str, Any]:
        """整合评估结果"""
        integrated_result = {
            "session_id": session_id,
            "assessment_timestamp": datetime.utcnow().isoformat(),
            "data_sources": [],
            "integrated_findings": {}
        }
        
        # 数据源标记
        if conversation_analysis:
            integrated_result["data_sources"].append("conversation_analysis")
        if scale_analysis:
            integrated_result["data_sources"].append("scale_analysis")
        
        # 综合风险评估
        risk_assessments = []
        
        if conversation_analysis and conversation_analysis.get("risk_assessment"):
            conv_risk = conversation_analysis["risk_assessment"]
            risk_assessments.append({
                "source": "conversation",
                "risk_level": conv_risk.get("risk_level", "low"),
                "risk_score": conv_risk.get("risk_score", 0),
                "weight": 0.6  # 对话分析权重60%
            })
        
        if scale_analysis and scale_analysis.get("overall_scale_assessment"):
            scale_risk = scale_analysis["overall_scale_assessment"]
            risk_assessments.append({
                "source": "scales",
                "risk_level": scale_risk.get("overall_risk_level", "low"),
                "risk_score": scale_risk.get("average_risk_score", 0),
                "weight": 0.4  # 量表分析权重40%
            })
        
        # 计算综合风险
        if risk_assessments:
            weighted_risk_score = sum(ra["risk_score"] * ra["weight"] for ra in risk_assessments)
            
            if weighted_risk_score >= 7:
                integrated_risk_level = "high"
            elif weighted_risk_score >= 4:
                integrated_risk_level = "medium"
            else:
                integrated_risk_level = "low"
            
            integrated_result["integrated_findings"]["risk_assessment"] = {
                "integrated_risk_level": integrated_risk_level,
                "weighted_risk_score": weighted_risk_score,
                "individual_assessments": risk_assessments,
                "consistency": self._assess_risk_consistency(risk_assessments)
            }
        
        # 综合情感状态
        emotion_assessments = []
        
        if conversation_analysis and conversation_analysis.get("bert_analysis"):
            bert_emotion = conversation_analysis["bert_analysis"].get("emotion_analysis", {})
            emotion_assessments.append({
                "source": "bert_conversation",
                "emotion": bert_emotion.get("dominant_emotion", "neutral"),
                "confidence": bert_emotion.get("confidence", 0.5)
            })
        
        if conversation_analysis and conversation_analysis.get("emotional_trajectory"):
            trajectory = conversation_analysis["emotional_trajectory"]
            emotion_assessments.append({
                "source": "conversation_trajectory",
                "emotion": trajectory.get("overall_direction", "neutral"),
                "trend": trajectory.get("trend", "stable")
            })
        
        if emotion_assessments:
            integrated_result["integrated_findings"]["emotional_state"] = {
                "assessments": emotion_assessments,
                "dominant_pattern": self._determine_dominant_emotional_pattern(emotion_assessments)
            }
        
        # 保存原始分析结果
        integrated_result["conversation_analysis"] = conversation_analysis
        integrated_result["scale_analysis"] = scale_analysis
        
        return integrated_result
    
    def _assess_risk_consistency(self, risk_assessments: List[Dict]) -> str:
        """评估风险评估的一致性"""
        if len(risk_assessments) < 2:
            return "single_source"
        
        risk_levels = [ra["risk_level"] for ra in risk_assessments]
        
        if len(set(risk_levels)) == 1:
            return "high_consistency"
        elif all(level in ["low", "medium"] for level in risk_levels) or \
             all(level in ["medium", "high"] for level in risk_levels):
            return "moderate_consistency"
        else:
            return "low_consistency"
    
    def _determine_dominant_emotional_pattern(self, emotion_assessments: List[Dict]) -> Dict[str, Any]:
        """确定主导情感模式"""
        emotions = [ea.get("emotion", "neutral") for ea in emotion_assessments]
        emotion_counts = {}
        
        for emotion in emotions:
            emotion_counts[emotion] = emotion_counts.get(emotion, 0) + 1
        
        dominant_emotion = max(emotion_counts, key=emotion_counts.get)
        
        return {
            "dominant_emotion": dominant_emotion,
            "consistency_score": emotion_counts[dominant_emotion] / len(emotions),
            "all_emotions": emotion_counts
        }
    
    async def _generate_final_assessment_report(self, integrated_result: Dict[str, Any]) -> Dict[str, Any]:
        """生成最终评估报告"""
        try:
            # 提取关键信息
            risk_assessment = integrated_result.get("integrated_findings", {}).get("risk_assessment", {})
            emotional_state = integrated_result.get("integrated_findings", {}).get("emotional_state", {})
            conversation_analysis = integrated_result.get("conversation_analysis", {})
            scale_analysis = integrated_result.get("scale_analysis", {})
            
            # 生成报告结构
            final_report = {
                "assessment_id": f"comprehensive_{integrated_result['session_id']}_{int(datetime.utcnow().timestamp())}",
                "assessment_date": integrated_result["assessment_timestamp"],
                "session_id": integrated_result["session_id"],
                
                # 执行摘要
                "executive_summary": self._generate_executive_summary(integrated_result),
                
                # 整体评估
                "overall_assessment": {
                    "risk_level": risk_assessment.get("integrated_risk_level", "unknown"),
                    "risk_score": risk_assessment.get("weighted_risk_score", 0),
                    "dominant_emotion": emotional_state.get("dominant_pattern", {}).get("dominant_emotion", "neutral"),
                    "assessment_reliability": self._calculate_assessment_reliability(integrated_result),
                    "data_completeness": self._assess_data_completeness(integrated_result)
                },
                
                # 详细发现
                "detailed_findings": {
                    "conversation_insights": self._extract_conversation_insights(conversation_analysis),
                    "scale_results": self._summarize_scale_results(scale_analysis),
                    "risk_factors": self._identify_comprehensive_risk_factors(integrated_result),
                    "protective_factors": self._identify_protective_factors(integrated_result)
                },
                
                # 建议和推荐
                "recommendations": {
                    "immediate_actions": self._generate_immediate_recommendations(risk_assessment),
                    "short_term_goals": self._generate_short_term_recommendations(integrated_result),
                    "long_term_strategies": self._generate_long_term_recommendations(integrated_result),
                    "referral_suggestions": self._generate_referral_suggestions(risk_assessment, scale_analysis)
                },
                
                # 后续计划
                "follow_up_plan": self._create_follow_up_plan(integrated_result),
                
                # 数据来源
                "data_sources": integrated_result["data_sources"],
                "raw_data": {
                    "conversation_analysis": conversation_analysis,
                    "scale_analysis": scale_analysis
                }
            }
            
            logger.info(f"最终评估报告生成完成，ID: {final_report['assessment_id']}")
            return final_report
            
        except Exception as e:
            logger.error(f"生成最终评估报告失败: {e}")
            return self._generate_fallback_assessment()
    
    def _generate_executive_summary(self, integrated_result: Dict[str, Any]) -> str:
        """生成执行摘要"""
        risk_level = integrated_result.get("integrated_findings", {}).get("risk_assessment", {}).get("integrated_risk_level", "unknown")
        data_sources = integrated_result.get("data_sources", [])
        
        summary_parts = []
        
        # 基础信息
        summary_parts.append(f"本次综合心理评估基于{len(data_sources)}种数据源")
        
        if "conversation_analysis" in data_sources:
            conv_analysis = integrated_result.get("conversation_analysis", {})
            conv_summary = conv_analysis.get("conversation_summary", {})
            summary_parts.append(f"包含{conv_summary.get('total_messages', 0)}轮对话分析")
        
        if "scale_analysis" in data_sources:
            scale_analysis = integrated_result.get("scale_analysis", {})
            scales_count = len(scale_analysis.get("scales_completed", []))
            summary_parts.append(f"以及{scales_count}个标准化量表结果")
        
        # 风险评估
        risk_descriptions = {
            "high": "高风险状态，需要立即关注和专业干预",
            "medium": "中等风险状态，建议寻求专业咨询和支持",
            "low": "低风险状态，当前心理状态相对稳定"
        }
        
        summary_parts.append(f"评估结果显示学生目前处于{risk_descriptions.get(risk_level, '未知风险状态')}")
        
        return "。".join(summary_parts) + "。"
    
    def _calculate_assessment_reliability(self, integrated_result: Dict[str, Any]) -> str:
        """计算评估可靠性"""
        data_sources = integrated_result.get("data_sources", [])
        
        reliability_score = 0
        
        # 数据源多样性
        if len(data_sources) >= 2:
            reliability_score += 3
        elif len(data_sources) == 1:
            reliability_score += 1
        
        # 对话数据质量
        if "conversation_analysis" in data_sources:
            conv_analysis = integrated_result.get("conversation_analysis", {})
            conv_quality = conv_analysis.get("conversation_quality_score", 0)
            if conv_quality >= 0.7:
                reliability_score += 3
            elif conv_quality >= 0.4:
                reliability_score += 2
            else:
                reliability_score += 1
        
        # 量表数据完整性
        if "scale_analysis" in data_sources:
            scale_analysis = integrated_result.get("scale_analysis", {})
            scales_count = len(scale_analysis.get("scales_completed", []))
            if scales_count >= 3:
                reliability_score += 3
            elif scales_count >= 2:
                reliability_score += 2
            else:
                reliability_score += 1
        
        # 一致性检查
        risk_assessment = integrated_result.get("integrated_findings", {}).get("risk_assessment", {})
        consistency = risk_assessment.get("consistency", "low_consistency")
        if consistency == "high_consistency":
            reliability_score += 2
        elif consistency == "moderate_consistency":
            reliability_score += 1
        
        if reliability_score >= 8:
            return "high"
        elif reliability_score >= 5:
            return "medium"
        else:
            return "low"
    
    def _assess_data_completeness(self, integrated_result: Dict[str, Any]) -> str:
        """评估数据完整性"""
        completeness_score = 0
        max_score = 10
        
        # 对话数据完整性
        if "conversation_analysis" in integrated_result.get("data_sources", []):
            conv_analysis = integrated_result.get("conversation_analysis", {})
            if conv_analysis.get("conversation_summary", {}).get("total_messages", 0) >= 5:
                completeness_score += 3
            elif conv_analysis.get("conversation_summary", {}).get("total_messages", 0) >= 2:
                completeness_score += 2
            else:
                completeness_score += 1
            
            if conv_analysis.get("bert_analysis"):
                completeness_score += 2
        
        # 量表数据完整性
        if "scale_analysis" in integrated_result.get("data_sources", []):
            scale_analysis = integrated_result.get("scale_analysis", {})
            scales_count = len(scale_analysis.get("scales_completed", []))
            completeness_score += min(scales_count, 3)
        
        # 风险评估完整性
        if integrated_result.get("integrated_findings", {}).get("risk_assessment"):
            completeness_score += 2
        
        percentage = (completeness_score / max_score) * 100
        
        if percentage >= 80:
            return "complete"
        elif percentage >= 60:
            return "mostly_complete"
        elif percentage >= 40:
            return "partial"
        else:
            return "limited"
    
    def _extract_conversation_insights(self, conversation_analysis: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """提取对话洞察"""
        if not conversation_analysis:
            return {"status": "no_conversation_data"}
        
        insights = {}
        
        # 会话模式洞察
        session_patterns = conversation_analysis.get("session_patterns", {})
        insights["session_characteristics"] = {
            "engagement_level": session_patterns.get("engagement_level", "unknown"),
            "conversation_depth": session_patterns.get("conversation_depth", "unknown"),
            "duration_assessment": "长期对话" if session_patterns.get("duration_minutes", 0) > 30 else "标准对话"
        }
        
        # 主题洞察
        themes = conversation_analysis.get("dominant_themes", [])
        insights["key_concerns"] = [theme["theme"] for theme in themes[:3]]
        
        # 情感轨迹洞察
        trajectory = conversation_analysis.get("emotional_trajectory", {})
        insights["emotional_pattern"] = {
            "trend": trajectory.get("trend", "unknown"),
            "direction": trajectory.get("overall_direction", "neutral"),
            "stability": "稳定" if trajectory.get("trend") == "stable" else "变化中"
        }
        
        # BERT分析洞察
        bert_analysis = conversation_analysis.get("bert_analysis", {})
        if bert_analysis:
            emotion_analysis = bert_analysis.get("emotion_analysis", {})
            insights["bert_insights"] = {
                "dominant_emotion": emotion_analysis.get("dominant_emotion", "neutral"),
                "confidence": emotion_analysis.get("confidence", 0),
                "analysis_reliability": "高" if emotion_analysis.get("confidence", 0) > 0.7 else "中等"
            }
        
        return insights
    
    def _summarize_scale_results(self, scale_analysis: Optional[Dict[str, Any]]) -> Dict[str, Any]:
        """总结量表结果"""
        if not scale_analysis:
            return {"status": "no_scale_data"}
        
        summary = {
            "scales_completed": scale_analysis.get("scales_completed", []),
            "scale_count": len(scale_analysis.get("scales_completed", [])),
            "individual_results": [],
            "overall_assessment": scale_analysis.get("overall_scale_assessment", {})
        }
        
        # 个别量表结果
        scale_analyses = scale_analysis.get("scale_analyses", {})
        for scale_name, analysis in scale_analyses.items():
            summary["individual_results"].append({
                "scale": scale_name,
                "score": analysis.get("score", 0),
                "severity": analysis.get("severity", "unknown"),
                "recommendation": analysis.get("recommendation", "")
            })
        
        return summary
    
    def _identify_comprehensive_risk_factors(self, integrated_result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """识别综合风险因素"""
        risk_factors = []
        
        # 从对话分析中提取风险因素
        conversation_analysis = integrated_result.get("conversation_analysis", {})
        if conversation_analysis:
            conv_risk = conversation_analysis.get("risk_assessment", {})
            conv_risk_factors = conv_risk.get("risk_factors", [])
            
            for factor in conv_risk_factors:
                risk_factors.append({
                    "factor": factor,
                    "source": "conversation",
                    "severity": "high" if any(word in factor for word in ["自杀", "自伤"]) else "medium"
                })
        
        # 从量表分析中提取风险因素
        scale_analysis = integrated_result.get("scale_analysis", {})
        if scale_analysis:
            scale_analyses = scale_analysis.get("scale_analyses", {})
            
            for scale_name, analysis in scale_analyses.items():
                if analysis.get("severity") in ["severe", "moderately_severe"]:
                    risk_factors.append({
                        "factor": f"{scale_name}显示严重症状",
                        "source": "scale",
                        "severity": "high",
                        "details": analysis.get("interpretation", "")
                    })
                elif analysis.get("severity") == "moderate":
                    risk_factors.append({
                        "factor": f"{scale_name}显示中度症状",
                        "source": "scale", 
                        "severity": "medium",
                        "details": analysis.get("interpretation", "")
                    })
        
        return risk_factors
    
    def _identify_protective_factors(self, integrated_result: Dict[str, Any]) -> List[Dict[str, Any]]:
        """识别保护性因素"""
        protective_factors = []
        
        # 从对话分析中提取保护因素
        conversation_analysis = integrated_result.get("conversation_analysis", {})
        if conversation_analysis:
            # 参与度高是保护因素
            session_patterns = conversation_analysis.get("session_patterns", {})
            if session_patterns.get("engagement_level") == "high":
                protective_factors.append({
                    "factor": "高度参与对话，表现出寻求帮助的积极态度",
                    "source": "conversation",
                    "strength": "medium"
                })
            
            # 情感轨迹改善是保护因素
            trajectory = conversation_analysis.get("emotional_trajectory", {})
            if trajectory.get("trend") == "improving":
                protective_factors.append({
                    "factor": "情绪状态呈改善趋势",
                    "source": "conversation",
                    "strength": "high"
                })
            
            # 积极主题是保护因素
            themes = conversation_analysis.get("dominant_themes", [])
            positive_themes = ["人际关系", "学习压力"]  # 这些表示有社会连接和目标
            for theme in themes:
                if theme.get("theme") in positive_themes and theme.get("relevance") == "high":
                    protective_factors.append({
                        "factor": f"积极关注{theme['theme']}问题",
                        "source": "conversation",
                        "strength": "medium"
                    })
        
        # 从量表分析中提取保护因素
        scale_analysis = integrated_result.get("scale_analysis", {})
        if scale_analysis:
            scale_analyses = scale_analysis.get("scale_analyses", {})
            
            for scale_name, analysis in scale_analyses.items():
                if analysis.get("severity") in ["minimal", "low"]:
                    protective_factors.append({
                        "factor": f"{scale_name}显示良好状态",
                        "source": "scale",
                        "strength": "high",
                        "details": analysis.get("interpretation", "")
                    })
        
        return protective_factors
    
    def _generate_immediate_recommendations(self, risk_assessment: Dict[str, Any]) -> List[str]:
        """生成即时建议"""
        recommendations = []
        
        risk_level = risk_assessment.get("integrated_risk_level", "low")
        
        if risk_level == "high":
            recommendations.extend([
                "⚠️ 立即联系心理危机干预热线：400-161-9995",
                "通知学校心理健康中心或辅导员",
                "考虑陪同学生寻求紧急医疗或心理援助",
                "确保学生在安全环境中，避免独处",
                "移除可能的自伤工具或物品"
            ])
        elif risk_level == "medium":
            recommendations.extend([
                "在24-48小时内预约专业心理咨询师",
                "联系学生的支持网络（朋友、家人）",
                "建议学生避免重大决策",
                "提供心理健康资源和联系方式",
                "安排定期检查和跟进"
            ])
        else:  # low risk
            recommendations.extend([
                "鼓励学生继续参与心理健康活动",
                "提供自我关爱的建议和资源",
                "建议保持规律的作息和健康习惯",
                "如有需要，随时可以寻求帮助"
            ])
        
        return recommendations
    
    def _generate_short_term_recommendations(self, integrated_result: Dict[str, Any]) -> List[str]:
        """生成短期建议（1-4周）"""
        recommendations = []
        
        # 基于主题的建议
        conversation_analysis = integrated_result.get("conversation_analysis", {})
        if conversation_analysis:
            themes = conversation_analysis.get("dominant_themes", [])
            
            for theme in themes[:2]:  # 前两个主要主题
                theme_name = theme.get("theme", "")
                
                if theme_name == "学习压力":
                    recommendations.append("制定合理的学习计划和时间管理策略")
                    recommendations.append("学习放松和压力管理技巧")
                elif theme_name == "人际关系":
                    recommendations.append("参加社交技能训练或团体咨询")
                    recommendations.append("主动参与社交活动，建立支持网络")
                elif theme_name == "家庭问题":
                    recommendations.append("考虑家庭咨询或治疗")
                    recommendations.append("学习健康的沟通技巧")
        
        # 基于量表结果的建议
        scale_analysis = integrated_result.get("scale_analysis", {})
        if scale_analysis:
            scale_analyses = scale_analysis.get("scale_analyses", {})
            
            if any("phq" in scale.lower() for scale in scale_analyses.keys()):
                recommendations.append("进行认知行为治疗(CBT)或接受心理咨询")
            
            if any("gad" in scale.lower() for scale in scale_analyses.keys()):
                recommendations.append("学习焦虑管理技巧，如正念冥想")
        
        # 通用建议
        recommendations.extend([
            "建立规律的睡眠和运动习惯",
            "保持营养均衡的饮食",
            "限制酒精和咖啡因摄入",
            "定期进行心理健康自我评估"
        ])
        
        return recommendations[:8]  # 限制数量
    
    def _generate_long_term_recommendations(self, integrated_result: Dict[str, Any]) -> List[str]:
        """生成长期建议（1个月以上）"""
        recommendations = [
            "建立长期的心理健康维护计划",
            "定期参加心理健康检查和评估",
            "发展个人兴趣爱好和成就感来源",
            "建立稳定的社会支持网络",
            "学习和实践压力管理技能",
            "保持健康的生活方式和作息习惯",
            "考虑加入相关的支持小组或社区",
            "制定个人成长和发展目标"
        ]
        
        return recommendations
    
    def _generate_referral_suggestions(self, risk_assessment: Dict[str, Any], scale_analysis: Optional[Dict[str, Any]]) -> List[Dict[str, str]]:
        """生成转介建议"""
        referrals = []
        
        risk_level = risk_assessment.get("integrated_risk_level", "low")
        
        if risk_level == "high":
            referrals.extend([
                {
                    "type": "emergency",
                    "service": "心理危机干预中心",
                    "urgency": "立即",
                    "reason": "高风险状态需要紧急专业干预"
                },
                {
                    "type": "medical",
                    "service": "精神科医生",
                    "urgency": "24小时内",
                    "reason": "评估是否需要药物治疗"
                }
            ])
        
        if risk_level in ["high", "medium"]:
            referrals.append({
                "type": "counseling",
                "service": "专业心理咨询师",
                "urgency": "1周内",
                "reason": "进行深度心理咨询和治疗"
            })
        
        # 基于量表结果的转介
        if scale_analysis:
            scale_analyses = scale_analysis.get("scale_analyses", {})
            
            for scale_name, analysis in scale_analyses.items():
                if analysis.get("severity") in ["severe", "moderately_severe"]:
                    if "phq" in scale_name.lower():
                        referrals.append({
                            "type": "specialist",
                            "service": "抑郁症专科治疗",
                            "urgency": "2周内",
                            "reason": f"{scale_name}显示严重抑郁症状"
                        })
                    elif "gad" in scale_name.lower():
                        referrals.append({
                            "type": "specialist", 
                            "service": "焦虑症专科治疗",
                            "urgency": "2周内",
                            "reason": f"{scale_name}显示严重焦虑症状"
                        })
        
        # 通用转介
        if not referrals:  # 低风险情况
            referrals.append({
                "type": "preventive",
                "service": "学校心理健康中心",
                "urgency": "1个月内",
                "reason": "定期心理健康维护和咨询"
            })
        
        return referrals
    
    def _create_follow_up_plan(self, integrated_result: Dict[str, Any]) -> Dict[str, Any]:
        """创建后续跟进计划"""
        risk_level = integrated_result.get("integrated_findings", {}).get("risk_assessment", {}).get("integrated_risk_level", "low")
        
        if risk_level == "high":
            follow_up_intervals = ["24小时", "72小时", "1周", "2周", "1个月"]
            next_assessment = "1周内"
        elif risk_level == "medium":
            follow_up_intervals = ["3天", "1周", "2周", "1个月", "3个月"]
            next_assessment = "2周内"
        else:
            follow_up_intervals = ["2周", "1个月", "3个月", "6个月"]
            next_assessment = "1个月内"
        
        return {
            "follow_up_schedule": follow_up_intervals,
            "next_comprehensive_assessment": next_assessment,
            "monitoring_indicators": [
                "情绪状态变化",
                "睡眠质量",
                "社交活动参与度",
                "学习/工作表现",
                "风险行为出现"
            ],
            "emergency_contacts": [
                "心理危机热线：400-161-9995",
                "学校心理健康中心",
                "紧急联系人"
            ],
            "self_monitoring_tools": [
                "每日情绪日记",
                "睡眠质量记录",
                "压力水平评估"
            ]
        }
    
    def _generate_fallback_assessment(self) -> Dict[str, Any]:
        """生成备用评估结果"""
        return {
            "assessment_id": f"fallback_{int(datetime.utcnow().timestamp())}",
            "assessment_date": datetime.utcnow().isoformat(),
            "status": "partial_assessment",
            "executive_summary": "由于数据不足或系统错误，仅能提供基础评估建议。",
            "overall_assessment": {
                "risk_level": "unknown",
                "assessment_reliability": "low",
                "data_completeness": "limited"
            },
            "recommendations": {
                "immediate_actions": [
                    "建议寻求专业心理健康评估",
                    "如有紧急情况请联系危机热线"
                ],
                "short_term_goals": [
                    "完成标准化心理量表评估",
                    "预约专业心理咨询"
                ]
            },
            "follow_up_plan": {
                "next_comprehensive_assessment": "尽快安排",
                "emergency_contacts": ["心理危机热线：400-161-9995"]
            }
        }


# 创建全局服务实例
comprehensive_assessment_service = ComprehensiveAssessmentService()

