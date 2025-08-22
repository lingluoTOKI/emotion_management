"""
AI评估服务模块
AI Assessment Service Module
"""

from typing import Dict, Any, List
import json

class AIAssessmentService:
    """AI评估服务类"""
    
    def __init__(self):
        pass
    
    async def analyze_emotion(self, assessment_data: Dict[str, Any]) -> Dict[str, Any]:
        """AI分析情绪"""
        # 模拟AI情绪分析，实际应该调用OpenAI或其他AI模型
        return {
            "depression_index": 0.4,
            "anxiety_index": 0.3,
            "stress_index": 0.2,
            "overall_mood": 0.6,
            "dominant_emotion": "平静",
            "emotion_intensity": 0.4,
            "confidence": 0.85
        }
    
    async def generate_assessment_report(self, assessment_data: Dict[str, Any], emotion_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """AI生成评估报告"""
        # 模拟AI报告生成，实际应该使用LLM
        report = {
            "summary": "根据您的回答，您的整体情绪状态相对稳定，但存在一些需要注意的方面。",
            "detailed_analysis": {
                "depression": {
                    "score": emotion_analysis.get("depression_index", 0.0),
                    "level": self._get_level_description(emotion_analysis.get("depression_index", 0.0)),
                    "description": "您的抑郁指数处于正常范围，但建议关注情绪变化。"
                },
                "anxiety": {
                    "score": emotion_analysis.get("anxiety_index", 0.0),
                    "level": self._get_level_description(emotion_analysis.get("anxiety_index", 0.0)),
                    "description": "焦虑水平适中，建议学习放松技巧。"
                },
                "stress": {
                    "score": emotion_analysis.get("stress_index", 0.0),
                    "level": self._get_level_description(emotion_analysis.get("stress_index", 0.0)),
                    "description": "压力水平较低，继续保持良好的压力管理。"
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
                "description": "当前风险等级较低，建议定期关注情绪变化。"
            }
        }
        
        return report
    
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
