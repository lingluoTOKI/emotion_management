"""
AI评估服务模块
AI Assessment Service Module
"""

from typing import Dict, Any, List
import json
from loguru import logger
from app.services.xfyun_ai_service import xfyun_ai_service
from app.services.bert_text_analyzer import bert_analyzer

class AIAssessmentService:
    """AI评估服务类"""
    
    def __init__(self):
        pass
    
    async def analyze_emotion(self, assessment_data: Dict[str, Any]) -> Dict[str, Any]:
        """AI分析情绪 - 集成BERT情感分析"""
        try:
            # 从评估数据中提取文本内容
            if hasattr(assessment_data, 'get'):
                text_content = self._extract_text_from_assessment(assessment_data)
            else:
                # 如果assessment_data是模型对象，转换为字典
                text_content = str(assessment_data)
            
            if not text_content:
                logger.warning("评估数据中没有找到文本内容，使用默认分析")
                return self._get_default_emotion_analysis()
            
            logger.info("开始进行综合情感分析：BERT + AI对话分析")
            
            # 1. 使用BERT进行深度情感分析
            bert_emotion_result = bert_analyzer.comprehensive_analysis(text_content)
            
            # 2. 使用科大讯飞AI进行对话式情绪分析（作为补充）
            ai_emotion_result = await xfyun_ai_service.analyze_emotion_with_ai(text_content)
            
            # 3. 综合分析结果
            if hasattr(assessment_data, 'get'):
                comprehensive_result = self._merge_emotion_analysis(
                    bert_result=bert_emotion_result,
                    ai_result=ai_emotion_result,
                    original_data=assessment_data
                )
            else:
                # 如果assessment_data是模型对象，创建基础结果
                comprehensive_result = {
                    "dominant_emotion": bert_emotion_result.get('emotion_analysis', {}).get('dominant_emotion', 'neutral'),
                    "emotion_intensity": bert_emotion_result.get('emotion_analysis', {}).get('confidence', 0.5),
                    "confidence": 0.7,
                    "analysis_source": "bert_enhanced"
                }
            
            logger.info(f"综合情感分析完成，主导情绪: {comprehensive_result['dominant_emotion']}")
            return comprehensive_result
            
        except Exception as e:
            logger.error(f"综合情绪分析失败: {str(e)}")
            return self._get_default_emotion_analysis()
    
    async def generate_assessment_report(self, assessment_data: Dict[str, Any], emotion_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """AI生成评估报告 - 使用科大讯飞AI"""
        try:
            # 构建评估报告生成的提示词
            if hasattr(assessment_data, 'get'):
                report_prompt = self._build_report_prompt(assessment_data, emotion_analysis)
            else:
                # 如果assessment_data是模型对象，创建基础提示词
                report_prompt = f"基于情感分析结果生成心理评估报告。主要情绪：{emotion_analysis.get('dominant_emotion', 'neutral')}"
            
            # 使用科大讯飞AI生成报告
            ai_report = await xfyun_ai_service.generate_psychological_response(
                user_message=report_prompt,
                context={
                    'emotion_state': emotion_analysis.get('dominant_emotion', 'neutral'),
                    'risk_level': self._calculate_risk_level(emotion_analysis)
                }
            )
            
            # 解析AI生成的报告并构建标准格式
            return self._parse_ai_report(ai_report, emotion_analysis)
            
        except Exception as e:
            logger.error(f"AI报告生成失败: {str(e)}")
            return self._get_default_report(emotion_analysis)
    
    async def extract_keywords(self, text: str) -> List[str]:
        """AI提取关键词"""
        # 模拟关键词提取，实际应该使用NLP模型
        common_keywords = [
            "学习压力", "人际关系", "情感问题", "家庭矛盾", 
            "自我认知", "未来规划", "社交焦虑", "学业困难",
            "情绪管理", "压力应对", "心理健康", "自我调节"
        ]
        
        # 简单的关键词匹配
        found_keywords = []
        for keyword in common_keywords:
            if keyword in text:
                found_keywords.append(keyword)
        
        return found_keywords[:5]
    
    async def generate_guided_questions(self, assessment_type: str, current_answers: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """AI生成引导性问题"""
        # 模拟问题生成，实际应该使用LLM
        if assessment_type == "PHQ-9":
            questions = [
                {
                    "id": "phq_1",
                    "question": "在过去两周内，您是否感到情绪低落、沮丧或绝望？",
                    "options": ["完全没有", "几天", "超过一半时间", "几乎每天"],
                    "scores": [0, 1, 2, 3]
                },
                {
                    "id": "phq_2", 
                    "question": "在过去两周内，您是否对做事情失去兴趣或乐趣？",
                    "options": ["完全没有", "几天", "超过一半时间", "几乎每天"],
                    "scores": [0, 1, 2, 3]
                }
            ]
        elif assessment_type == "GAD-7":
            questions = [
                {
                    "id": "gad_1",
                    "question": "在过去两周内，您是否感到紧张、焦虑或烦躁？",
                    "options": ["完全没有", "几天", "超过一半时间", "几乎每天"],
                    "scores": [0, 1, 2, 3]
                }
            ]
        else:
            questions = [
                {
                    "id": "general_1",
                    "question": "请描述您当前的情绪状态？",
                    "type": "text",
                    "follow_up": "您能具体说说是什么让您有这种感受吗？"
                }
            ]
        
        return questions
    
    def _get_level_description(self, score: float) -> str:
        """获取分数等级描述"""
        if score < 0.3:
            return "低"
        elif score < 0.6:
            return "中等"
        elif score < 0.8:
            return "较高"
        else:
            return "高"
    
    def _calculate_risk_level(self, emotion_data: Dict[str, Any]) -> str:
        """计算风险等级"""
        depression = emotion_data.get("depression_index", 0.0)
        anxiety = emotion_data.get("anxiety_index", 0.0)
        stress = emotion_data.get("stress_index", 0.0)
        
        max_score = max(depression, anxiety, stress)
        
        if max_score >= 0.8:
            return "high"
        elif max_score >= 0.6:
            return "medium"
        elif max_score >= 0.4:
            return "low"
        else:
            return "minimal"
    
    def _extract_text_from_assessment(self, assessment_data: Dict[str, Any]) -> str:
        """从评估数据中提取文本内容"""
        text_parts = []
        
        # 提取评估类型
        assessment_type = assessment_data.get("assessment_type", "")
        if assessment_type:
            text_parts.append(f"评估类型: {assessment_type}")
        
        # 提取答案文本
        answers = assessment_data.get("answers", [])
        for answer in answers:
            if isinstance(answer, dict):
                question = answer.get("question", "")
                response = answer.get("answer", "")
                if question and response:
                    text_parts.append(f"问题: {question} 回答: {response}")
            elif isinstance(answer, str):
                text_parts.append(answer)
        
        # 提取其他文本字段
        for key in ["description", "notes", "additional_info"]:
            if key in assessment_data and assessment_data[key]:
                text_parts.append(str(assessment_data[key]))
        
        return " ".join(text_parts)
    
    def _convert_emotion_result(self, ai_result: Dict[str, Any]) -> Dict[str, Any]:
        """转换AI情绪分析结果为标准格式"""
        # 映射情绪类型
        emotion_mapping = {
            "joy": "happiness", 
            "sadness": "depression",
            "fear": "anxiety",
            "anger": "anger",
            "neutral": "neutral"
        }
        
        dominant_emotion = ai_result.get("dominant_emotion", "neutral")
        mapped_emotion = emotion_mapping.get(dominant_emotion, "neutral")
        intensity = ai_result.get("intensity", 0.5)
        
        # 根据主导情绪分配各项指数
        depression_index = intensity if mapped_emotion == "depression" else 0.2
        anxiety_index = intensity if mapped_emotion == "anxiety" else 0.2
        stress_index = intensity * 0.8 if mapped_emotion in ["anxiety", "anger"] else 0.2
        overall_mood = 1.0 - intensity if mapped_emotion in ["depression", "sadness"] else 0.6
        
        return {
            "depression_index": depression_index,
            "anxiety_index": anxiety_index,
            "stress_index": stress_index,
            "overall_mood": overall_mood,
            "dominant_emotion": mapped_emotion,
            "emotion_intensity": intensity,
            "confidence": ai_result.get("confidence", 0.8)
        }
    
    def _get_default_emotion_analysis(self) -> Dict[str, Any]:
        """获取默认情绪分析结果"""
        return {
            "depression_index": 0.3,
            "anxiety_index": 0.3,
            "stress_index": 0.2,
            "overall_mood": 0.6,
            "dominant_emotion": "neutral",
            "emotion_intensity": 0.4,
            "confidence": 0.5
        }
    
    def _build_report_prompt(self, assessment_data: Dict[str, Any], emotion_analysis: Dict[str, Any]) -> str:
        """构建评估报告生成的提示词"""
        text_content = self._extract_text_from_assessment(assessment_data)
        dominant_emotion = emotion_analysis.get("dominant_emotion", "neutral")
        
        prompt = f"""请作为专业心理评估师，根据以下评估信息生成一份详细的心理健康评估报告：

评估内容：
{text_content}

检测到的主要情绪：{dominant_emotion}
情绪强度：{emotion_analysis.get('emotion_intensity', 0.0)}

请生成包含以下内容的评估报告：
1. 整体评估摘要（50字以内）
2. 抑郁状态分析
3. 焦虑状态分析  
4. 压力水平分析
5. 个性化建议（3-5条）
6. 风险评估

请用专业、温和的语调，避免过于严重的表述。"""
        
        return prompt
    
    def _parse_ai_report(self, ai_report: str, emotion_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """解析AI生成的报告"""
        # 简单解析AI报告，实际可以使用更复杂的NLP解析
        lines = ai_report.split('\n')
        
        summary = ""
        recommendations = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            if "摘要" in line or "总结" in line:
                summary = line.split("：")[-1] if "：" in line else line
            elif "建议" in line and len(line) > 10:
                recommendations.append(line)
            elif line.startswith(("1.", "2.", "3.", "4.", "5.", "•", "-")):
                recommendations.append(line)
        
        if not summary:
            summary = "根据您的评估结果，整体情绪状态需要关注。"
        
        if not recommendations:
            recommendations = [
                "建议保持规律的作息时间",
                "适当进行体育锻炼",
                "与亲朋好友多交流",
                "如有需要寻求专业帮助"
            ]
        
        return {
            "summary": summary,
            "detailed_analysis": {
                "depression": {
                    "score": emotion_analysis.get("depression_index", 0.0),
                    "level": self._get_level_description(emotion_analysis.get("depression_index", 0.0)),
                    "description": "基于AI分析的抑郁状态评估"
                },
                "anxiety": {
                    "score": emotion_analysis.get("anxiety_index", 0.0),
                    "level": self._get_level_description(emotion_analysis.get("anxiety_index", 0.0)),
                    "description": "基于AI分析的焦虑状态评估"
                },
                "stress": {
                    "score": emotion_analysis.get("stress_index", 0.0),
                    "level": self._get_level_description(emotion_analysis.get("stress_index", 0.0)),
                    "description": "基于AI分析的压力水平评估"
                }
            },
            "recommendations": recommendations[:5],
            "risk_assessment": {
                "level": self._calculate_risk_level(emotion_analysis),
                "description": "基于科大讯飞AI的风险评估结果"
            },
            "ai_report": ai_report  # 保存完整的AI报告
        }
    
    def _get_default_report(self, emotion_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """获取默认评估报告"""
        return {
            "summary": "评估已完成，建议关注当前的情绪状态。",
            "detailed_analysis": {
                "depression": {
                    "score": emotion_analysis.get("depression_index", 0.0),
                    "level": self._get_level_description(emotion_analysis.get("depression_index", 0.0)),
                    "description": "抑郁状态评估结果"
                },
                "anxiety": {
                    "score": emotion_analysis.get("anxiety_index", 0.0),
                    "level": self._get_level_description(emotion_analysis.get("anxiety_index", 0.0)),
                    "description": "焦虑状态评估结果"
                },
                "stress": {
                    "score": emotion_analysis.get("stress_index", 0.0),
                    "level": self._get_level_description(emotion_analysis.get("stress_index", 0.0)),
                    "description": "压力水平评估结果"
                }
            },
            "recommendations": [
                "建议保持规律的作息时间",
                "可以尝试正念冥想练习",
                "建议与朋友和家人多交流",
                "如有需要，可以寻求专业心理咨询"
            ],
            "risk_assessment": {
                "level": self._calculate_risk_level(emotion_analysis),
                "description": "当前风险等级评估"
            }
        }
    
    def _merge_emotion_analysis(self, bert_result: Dict[str, Any], ai_result: Dict[str, Any], original_data: Dict[str, Any]) -> Dict[str, Any]:
        """综合BERT和AI的情感分析结果"""
        try:
            # 提取BERT分析结果
            bert_emotion = bert_result.get('emotion_analysis', {})
            bert_classification = bert_result.get('problem_classification', {})
            bert_risk = bert_result.get('risk_assessment', {})
            
            # 提取AI分析结果（科大讯飞）
            ai_emotion = ai_result if ai_result else {}
            
            # 情感权重配置（BERT更准确，权重更高）
            bert_weight = 0.7  # BERT权重70%
            ai_weight = 0.3    # AI权重30%
            
            # 综合情感倾向
            bert_emotion_type = bert_emotion.get('dominant_emotion', 'neutral')
            bert_confidence = bert_emotion.get('confidence', 0.5)
            
            # AI情感映射
            ai_emotion_type = self._map_ai_emotion(ai_emotion)
            ai_confidence = ai_emotion.get('confidence', 0.5)
            
            # 计算综合置信度
            if bert_emotion_type == ai_emotion_type:
                # 两个分析结果一致，提高置信度
                final_emotion = bert_emotion_type
                final_confidence = min(0.95, bert_confidence * bert_weight + ai_confidence * ai_weight + 0.1)
                consistency = "high"
            elif bert_confidence > ai_confidence + 0.2:
                # BERT置信度明显更高，采用BERT结果
                final_emotion = bert_emotion_type
                final_confidence = bert_confidence * 0.9
                consistency = "bert_dominant"
            else:
                # 使用加权平均或BERT结果（因为BERT更准确）
                final_emotion = bert_emotion_type
                final_confidence = bert_confidence * bert_weight + ai_confidence * ai_weight
                consistency = "moderate"
            
            # 计算综合情绪强度
            bert_intensity = bert_emotion.get('emotion_intensity', bert_confidence)
            final_intensity = min(1.0, bert_intensity * bert_weight + ai_confidence * ai_weight)
            
            # 问题类型分析（主要来自BERT）
            problem_type = bert_classification.get('problem_type', 'general')
            problem_confidence = bert_classification.get('confidence', 0.5)
            
            # 风险评估（综合考虑）
            bert_risk_level = bert_risk.get('risk_level', 'low')
            risk_score = bert_risk.get('risk_score', 0)
            risk_factors = bert_risk.get('risk_factors', [])
            
            # 基于对话轮次和内容调整风险评估
            conversation_risk = self._assess_conversation_risk(original_data)
            final_risk_score = risk_score + conversation_risk
            
            if final_risk_score >= 6:
                final_risk_level = 'high'
            elif final_risk_score >= 3:
                final_risk_level = 'medium'
            else:
                final_risk_level = 'low'
            
            # 生成分析总结
            analysis_summary = self._generate_analysis_summary(
                emotion=final_emotion,
                intensity=final_intensity,
                problem_type=problem_type,
                risk_level=final_risk_level,
                consistency=consistency
            )
            
            return {
                "dominant_emotion": final_emotion,
                "emotion_intensity": final_intensity,
                "confidence": final_confidence,
                "problem_type": problem_type,
                "problem_confidence": problem_confidence,
                "risk_level": final_risk_level,
                "risk_score": final_risk_score,
                "risk_factors": risk_factors,
                "analysis_source": "bert_ai_combined",
                "consistency": consistency,
                "bert_analysis": bert_result,
                "ai_analysis": ai_result,
                "analysis_summary": analysis_summary,
                "recommendations": self._generate_emotion_recommendations(final_emotion, final_risk_level),
                "follow_up_questions": self._generate_follow_up_questions(problem_type, final_emotion)
            }
            
        except Exception as e:
            logger.error(f"综合情感分析合并失败: {e}")
            # 如果合并失败，优先返回BERT结果
            if bert_result:
                bert_emotion = bert_result.get('emotion_analysis', {})
                return {
                    "dominant_emotion": bert_emotion.get('dominant_emotion', 'neutral'),
                    "emotion_intensity": bert_emotion.get('confidence', 0.5),
                    "confidence": bert_emotion.get('confidence', 0.5),
                    "analysis_source": "bert_fallback"
                }
            else:
                return self._get_default_emotion_analysis()
    
    def _map_ai_emotion(self, ai_result: Dict[str, Any]) -> str:
        """映射AI结果到标准情感类型"""
        if not ai_result:
            return 'neutral'
        
        # 这里根据科大讯飞AI返回的格式进行映射
        ai_emotion = ai_result.get('emotion', ai_result.get('dominant_emotion', 'neutral'))
        
        # 标准化情感映射
        emotion_mapping = {
            'positive': 'positive',
            'negative': 'negative',
            'neutral': 'neutral',
            'happy': 'positive',
            'sad': 'negative',
            'angry': 'negative',
            'fear': 'negative',
            'anxious': 'negative',
            'depressed': 'negative',
            'excited': 'positive',
            'calm': 'neutral'
        }
        
        return emotion_mapping.get(str(ai_emotion).lower(), 'neutral')
    
    def _assess_conversation_risk(self, assessment_data: Dict[str, Any]) -> int:
        """基于对话内容评估额外风险"""
        risk_score = 0
        
        # 检查对话轮次（轮次过多可能表示问题复杂）
        conversation_count = assessment_data.get('conversation_count', 0)
        if conversation_count > 10:
            risk_score += 1
        elif conversation_count > 20:
            risk_score += 2
        
        # 检查是否提到特定风险词汇
        text_content = self._extract_text_from_assessment(assessment_data)
        if text_content:
            high_risk_words = ['自杀', '死亡', '伤害', '结束生命', '不想活', '没有希望']
            for word in high_risk_words:
                if word in text_content:
                    risk_score += 3
                    break
        
        return risk_score
    
    def _generate_analysis_summary(self, emotion: str, intensity: float, problem_type: str, risk_level: str, consistency: str) -> str:
        """生成分析总结"""
        emotion_desc = {
            'positive': '积极乐观',
            'negative': '消极低落',
            'neutral': '情绪平稳'
        }.get(emotion, '情绪状态')
        
        intensity_desc = '强烈' if intensity > 0.7 else '中等' if intensity > 0.4 else '轻微'
        
        problem_desc = {
            'academic_pressure': '学习压力',
            'social_anxiety': '社交焦虑',
            'family_issues': '家庭问题',
            'emotional_issues': '情感困扰',
            'mental_health': '心理健康',
            'general': '一般性问题'
        }.get(problem_type, '心理状态')
        
        risk_desc = {
            'low': '风险较低',
            'medium': '需要关注',
            'high': '需要重点关注'
        }.get(risk_level, '正常')
        
        consistency_desc = {
            'high': '分析结果高度一致',
            'bert_dominant': '基于深度学习分析',
            'moderate': '综合多维度分析'
        }.get(consistency, '分析完成')
        
        return f"学生当前表现为{emotion_desc}的情绪状态，强度{intensity_desc}。主要困扰类型为{problem_desc}，{risk_desc}。{consistency_desc}。"
    
    def _generate_emotion_recommendations(self, emotion: str, risk_level: str) -> List[str]:
        """生成情感建议"""
        recommendations = []
        
        if emotion == 'negative':
            recommendations.extend([
                "建议进行深度心理咨询，了解负面情绪的根源",
                "尝试情绪调节技巧，如深呼吸、正念冥想",
                "保持规律的作息和适量运动",
                "寻求社会支持，与信任的人分享感受"
            ])
        elif emotion == 'positive':
            recommendations.extend([
                "保持当前积极的心理状态",
                "可以尝试帮助其他同学，分享积极经验",
                "继续保持良好的生活习惯"
            ])
        else:  # neutral
            recommendations.extend([
                "情绪状态相对稳定，建议定期关注心理健康",
                "可以尝试一些新的活动丰富生活体验"
            ])
        
        if risk_level == 'high':
            recommendations.insert(0, "⚠️ 建议立即寻求专业心理危机干预")
            recommendations.insert(1, "联系心理健康中心或拨打心理援助热线")
        elif risk_level == 'medium':
            recommendations.insert(0, "建议预约专业心理咨询师进行深入评估")
        
        return recommendations
    
    def _generate_follow_up_questions(self, problem_type: str, emotion: str) -> List[str]:
        """生成后续追问问题"""
        questions = []
        
        if problem_type == 'academic_pressure':
            questions.extend([
                "你觉得学习压力主要来源于哪些方面？",
                "你有什么方法来应对学习压力吗？",
                "你希望在学习方面得到什么样的帮助？"
            ])
        elif problem_type == 'social_anxiety':
            questions.extend([
                "在社交场合你最担心的是什么？",
                "你觉得什么样的社交环境让你感到舒适？",
                "你希望改善人际关系的哪些方面？"
            ])
        elif problem_type == 'family_issues':
            questions.extend([
                "家庭中让你感到困扰的主要是什么？",
                "你希望家庭关系有什么样的改变？",
                "你觉得可以从哪些方面改善家庭沟通？"
            ])
        
        if emotion == 'negative':
            questions.append("这种情绪状态持续多长时间了？")
            questions.append("你觉得什么事情能让你感到快乐？")
        
        return questions[:5]  # 最多返回5个追问问题
