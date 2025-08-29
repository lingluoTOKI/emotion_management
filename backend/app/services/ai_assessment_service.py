"""
AI评估服务模块
AI Assessment Service Module
"""

from typing import Dict, Any, List
import json
from loguru import logger
from app.services.xfyun_ai_service import xfyun_ai_service

class AIAssessmentService:
    """AI评估服务类"""
    
    def __init__(self):
        pass
    
    async def analyze_emotion(self, assessment_data: Dict[str, Any]) -> Dict[str, Any]:
        """AI分析情绪 - 使用科大讯飞AI"""
        try:
            # 从评估数据中提取文本内容
            text_content = self._extract_text_from_assessment(assessment_data)
            
            if not text_content:
                logger.warning("评估数据中没有找到文本内容，使用默认分析")
                return self._get_default_emotion_analysis()
            
            # 使用科大讯飞AI进行情绪分析
            emotion_result = await xfyun_ai_service.analyze_emotion_with_ai(text_content)
            
            # 转换为标准格式
            return self._convert_emotion_result(emotion_result)
            
        except Exception as e:
            logger.error(f"AI情绪分析失败: {str(e)}")
            return self._get_default_emotion_analysis()
    
    async def generate_assessment_report(self, assessment_data: Dict[str, Any], emotion_analysis: Dict[str, Any]) -> Dict[str, Any]:
        """AI生成评估报告 - 使用科大讯飞AI"""
        try:
            # 构建评估报告生成的提示词
            report_prompt = self._build_report_prompt(assessment_data, emotion_analysis)
            
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
