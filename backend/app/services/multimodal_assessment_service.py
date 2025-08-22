"""
多模态心理评估服务
Multimodal Psychological Assessment Service
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
import openai
import whisper
from dataclasses import dataclass
import asyncio
import json
from sqlalchemy.orm import Session
from loguru import logger

from app.core.config import settings
from app.core.exceptions import AIServiceError, ValidationError
from app.services.xfyun_ai_service import xfyun_ai_service


@dataclass
class PHQ9Score:
    """PHQ-9抑郁量表评分结果"""
    total_score: int           # 总分 (0-27)
    severity_level: str        # 严重程度
    item_scores: List[int]     # 各题得分
    risk_factors: List[str]    # 风险因素
    recommendations: List[str]  # 建议


@dataclass
class GAD7Score:
    """GAD-7焦虑量表评分结果"""
    total_score: int           # 总分 (0-21)
    severity_level: str        # 严重程度
    item_scores: List[int]     # 各题得分
    risk_factors: List[str]    # 风险因素
    recommendations: List[str]  # 建议


@dataclass
class EmotionAnalysis:
    """情绪分析结果"""
    dominant_emotion: str      # 主导情绪
    emotion_intensity: float   # 情绪强度 (0-1)
    emotion_stability: float   # 情绪稳定性 (0-1)
    trend_direction: str       # 趋势方向 (improving/stable/declining)
    confidence: float          # 分析置信度 (0-1)


@dataclass
class MultimodalAssessmentResult:
    """多模态评估综合结果"""
    phq9_result: PHQ9Score
    gad7_result: GAD7Score
    emotion_analysis: EmotionAnalysis
    text_features: Dict[str, Any]
    voice_features: Dict[str, Any]
    overall_risk_level: str
    intervention_recommendations: List[str]
    report_accuracy_prediction: float


class MultimodalAssessmentService:
    """多模态心理评估服务类"""
    
    def __init__(self, db: Session):
        self.db = db
        # 初始化Whisper模型用于语音识别
        self.whisper_model = whisper.load_model("base")
        
        # PHQ-9问题模板
        self.phq9_questions = [
            "在过去两周里，您有多少天感到做事时提不起劲或没有兴趣？",
            "在过去两周里，您有多少天感到心情低落、沮丧或绝望？",
            "在过去两周里，您有多少天入睡困难、睡不安稳或睡眠过多？",
            "在过去两周里，您有多少天感到疲倦或没有精力？",
            "在过去两周里，您有多少天食欲不振或吃得过多？",
            "在过去两周里，您有多少天觉得自己很糟或觉得自己让自己或家人失望？",
            "在过去两周里，您有多少天对事情专注有困难，如读报纸或看电视时？",
            "在过去两周里，您有多少天动作或说话速度缓慢到别人已经察觉？或正好相反，烦躁或坐立不安、动来动去的情况超过平常？",
            "在过去两周里，您有多少天有不如死掉或用某种方式伤害自己的念头？"
        ]
        
        # GAD-7问题模板
        self.gad7_questions = [
            "在过去两周里，您有多少天感到紧张、焦虑或急躁？",
            "在过去两周里，您有多少天无法停止或控制担心？",
            "在过去两周里，您有多少天对各种各样的事情担心过多？",
            "在过去两周里，您有多少天很难放松下来？",
            "在过去两周里，您有多少天坐立不安，很难安静地坐着？",
            "在过去两周里，您有多少天变得容易烦恼或急躁？",
            "在过去两周里，您有多少天感到似乎将有可怕的事情发生而害怕？"
        ]
    
    async def conduct_comprehensive_assessment(
        self,
        user_id: int,
        assessment_session: Dict[str, Any]
    ) -> MultimodalAssessmentResult:
        """
        进行综合多模态评估
        
        Args:
            user_id: 用户ID
            assessment_session: 评估会话数据
                - conversation_history: 对话历史
                - voice_recordings: 语音记录
                - user_responses: 用户回答
                - interaction_logs: 交互日志
        
        Returns:
            MultimodalAssessmentResult: 综合评估结果
        """
        
        try:
            logger.info(f"开始为用户 {user_id} 进行多模态心理评估")
            
            # 1. 文本情绪分析
            text_emotion = await self._analyze_text_emotion(assessment_session)
            
            # 2. 语音情绪分析
            voice_emotion = await self._analyze_voice_emotion(assessment_session)
            
            # 3. 智能引导完成PHQ-9量表
            phq9_result = await self._conduct_ai_guided_phq9(assessment_session)
            
            # 4. 智能引导完成GAD-7量表
            gad7_result = await self._conduct_ai_guided_gad7(assessment_session)
            
            # 5. 融合多模态情绪分析
            emotion_analysis = await self._fuse_multimodal_emotion(
                text_emotion, voice_emotion, assessment_session
            )
            
            # 6. 综合风险评估
            risk_level = await self._assess_overall_risk(
                phq9_result, gad7_result, emotion_analysis
            )
            
            # 7. 生成干预建议
            recommendations = await self._generate_intervention_recommendations(
                phq9_result, gad7_result, emotion_analysis, risk_level
            )
            
            # 8. 预测报告准确性
            accuracy_prediction = await self._predict_report_accuracy(
                assessment_session, phq9_result, gad7_result, emotion_analysis
            )
            
            # 9. 提取特征用于后续分析
            text_features = await self._extract_text_features(assessment_session)
            voice_features = await self._extract_voice_features(assessment_session)
            
            result = MultimodalAssessmentResult(
                phq9_result=phq9_result,
                gad7_result=gad7_result,
                emotion_analysis=emotion_analysis,
                text_features=text_features,
                voice_features=voice_features,
                overall_risk_level=risk_level,
                intervention_recommendations=recommendations,
                report_accuracy_prediction=accuracy_prediction
            )
            
            # 10. 保存评估结果
            await self._save_assessment_result(user_id, result)
            
            logger.info(f"用户 {user_id} 多模态心理评估完成")
            return result
            
        except Exception as e:
            logger.error(f"多模态评估失败: {str(e)}")
            raise AIServiceError(f"多模态评估失败: {str(e)}")
    
    async def _analyze_text_emotion(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """分析文本情绪"""
        
        conversation_history = session_data.get('conversation_history', [])
        user_responses = session_data.get('user_responses', [])
        
        # 收集所有用户文本
        all_texts = []
        for msg in conversation_history:
            if msg.get('role') == 'user':
                all_texts.append(msg.get('content', ''))
        
        for response in user_responses:
            all_texts.append(response.get('text', ''))
        
        if not all_texts:
            return {'emotion': 'neutral', 'intensity': 0.5, 'confidence': 0.3}
        
        # 使用AI模型进行情绪分析
        combined_text = ' '.join(all_texts)
        
        try:
            emotion_prompt = f"""
请分析以下文本中的情绪状态，返回JSON格式：
{{
    "dominant_emotion": "情绪类型(joy/sadness/anger/fear/surprise/disgust/neutral)",
    "intensity": "情绪强度(0-1的浮点数)",
    "emotions_detected": ["检测到的所有情绪列表"],
    "emotional_keywords": ["关键情绪词汇"],
    "sentiment_trend": "情绪趋势(positive/negative/neutral)",
    "confidence": "分析置信度(0-1)"
}}

文本内容：
{combined_text}
"""
            
            # 优先使用科大讯飞AI进行情绪分析
            try:
                emotion_result = await xfyun_ai_service.analyze_emotion_with_ai(
                    text_content=combined_text,
                    use_websocket=False  # 情绪分析使用HTTP接口更稳定
                )
                
                if emotion_result and not emotion_result.get('error'):
                    logger.info("科大讯飞情绪分析成功")
                    return emotion_result
                else:
                    logger.warning("科大讯飞情绪分析返回异常，尝试OpenAI")
                    
            except Exception as e:
                logger.warning(f"科大讯飞情绪分析失败: {str(e)}，尝试OpenAI")
            
            # 回退到OpenAI API
            if settings.OPENAI_API_KEY:
                response = await openai.ChatCompletion.acreate(
                    model=settings.OPENAI_MODEL,
                    messages=[
                        {"role": "system", "content": "你是专业的心理情绪分析师，请准确分析文本中的情绪状态。"},
                        {"role": "user", "content": emotion_prompt}
                    ],
                    max_tokens=500,
                    temperature=0.3
                )
                
                emotion_result = json.loads(response.choices[0].message.content)
                logger.info("OpenAI情绪分析成功")
                return emotion_result
            else:
                logger.warning("OpenAI API未配置，使用基础分析")
                
        except Exception as e:
            logger.error(f"AI情绪分析失败: {str(e)}")
        
        # 最终回退到基础情绪分析
        return await self._basic_text_emotion_analysis(combined_text)
    
    async def _analyze_voice_emotion(self, session_data: Dict[str, Any]) -> Dict[str, Any]:
        """分析语音情绪"""
        
        voice_recordings = session_data.get('voice_recordings', [])
        
        if not voice_recordings:
            return {'emotion': 'neutral', 'intensity': 0.5, 'confidence': 0.2}
        
        voice_features = []
        
        for recording in voice_recordings:
            try:
                # 语音转文本
                audio_path = recording.get('file_path')
                if audio_path:
                    transcription = self.whisper_model.transcribe(audio_path)
                    text_content = transcription['text']
                    
                    # 提取语音特征
                    features = {
                        'text_content': text_content,
                        'duration': recording.get('duration', 0),
                        'average_volume': recording.get('average_volume', 0.5),
                        'speech_rate': len(text_content.split()) / (recording.get('duration', 1) / 60),
                        'pause_frequency': recording.get('pause_count', 0) / recording.get('duration', 1),
                        'voice_stability': recording.get('voice_stability', 0.5)
                    }
                    voice_features.append(features)
                    
            except Exception as e:
                logger.warning(f"语音分析失败: {str(e)}")
                continue
        
        if not voice_features:
            return {'emotion': 'neutral', 'intensity': 0.5, 'confidence': 0.2}
        
        # 分析语音情绪特征
        avg_speech_rate = np.mean([f['speech_rate'] for f in voice_features])
        avg_volume = np.mean([f['average_volume'] for f in voice_features])
        avg_pause_freq = np.mean([f['pause_frequency'] for f in voice_features])
        avg_stability = np.mean([f['voice_stability'] for f in voice_features])
        
        # 基于语音特征推断情绪
        emotion_score = self._calculate_voice_emotion_score(
            avg_speech_rate, avg_volume, avg_pause_freq, avg_stability
        )
        
        return emotion_score
    
    async def _conduct_ai_guided_phq9(self, session_data: Dict[str, Any]) -> PHQ9Score:
        """AI引导式PHQ-9量表评估"""
        
        conversation_history = session_data.get('conversation_history', [])
        
        # 从对话中提取PHQ-9相关信息
        extracted_responses = await self._extract_phq9_responses_from_conversation(
            conversation_history
        )
        
        # 计算PHQ-9得分
        item_scores = []
        total_score = 0
        
        for i, question in enumerate(self.phq9_questions):
            # 如果从对话中提取到相关信息，使用提取的得分
            if i < len(extracted_responses) and extracted_responses[i] is not None:
                score = extracted_responses[i]
            else:
                # 否则基于整体对话内容推断
                score = await self._infer_phq9_item_score(question, conversation_history)
            
            item_scores.append(score)
            total_score += score
        
        # 确定严重程度
        if total_score <= 4:
            severity = "minimal"
        elif total_score <= 9:
            severity = "mild"
        elif total_score <= 14:
            severity = "moderate"
        elif total_score <= 19:
            severity = "moderately_severe"
        else:
            severity = "severe"
        
        # 识别风险因素
        risk_factors = []
        if item_scores[8] > 0:  # 自伤念头
            risk_factors.append("self_harm_ideation")
        if total_score >= 15:
            risk_factors.append("severe_depression")
        if item_scores[0] > 2 or item_scores[1] > 2:  # 兴趣缺失或心境低落
            risk_factors.append("core_depression_symptoms")
        
        # 生成建议
        recommendations = self._generate_phq9_recommendations(total_score, risk_factors)
        
        return PHQ9Score(
            total_score=total_score,
            severity_level=severity,
            item_scores=item_scores,
            risk_factors=risk_factors,
            recommendations=recommendations
        )
    
    async def _conduct_ai_guided_gad7(self, session_data: Dict[str, Any]) -> GAD7Score:
        """AI引导式GAD-7量表评估"""
        
        conversation_history = session_data.get('conversation_history', [])
        
        # 从对话中提取GAD-7相关信息
        extracted_responses = await self._extract_gad7_responses_from_conversation(
            conversation_history
        )
        
        # 计算GAD-7得分
        item_scores = []
        total_score = 0
        
        for i, question in enumerate(self.gad7_questions):
            if i < len(extracted_responses) and extracted_responses[i] is not None:
                score = extracted_responses[i]
            else:
                score = await self._infer_gad7_item_score(question, conversation_history)
            
            item_scores.append(score)
            total_score += score
        
        # 确定严重程度
        if total_score <= 4:
            severity = "minimal"
        elif total_score <= 9:
            severity = "mild"
        elif total_score <= 14:
            severity = "moderate"
        else:
            severity = "severe"
        
        # 识别风险因素
        risk_factors = []
        if total_score >= 10:
            risk_factors.append("significant_anxiety")
        if item_scores[1] > 2:  # 无法控制担心
            risk_factors.append("worry_control_issues")
        if item_scores[6] > 2:  # 害怕可怕事情发生
            risk_factors.append("catastrophic_thinking")
        
        # 生成建议
        recommendations = self._generate_gad7_recommendations(total_score, risk_factors)
        
        return GAD7Score(
            total_score=total_score,
            severity_level=severity,
            item_scores=item_scores,
            risk_factors=risk_factors,
            recommendations=recommendations
        )
    
    async def _fuse_multimodal_emotion(
        self,
        text_emotion: Dict[str, Any],
        voice_emotion: Dict[str, Any],
        session_data: Dict[str, Any]
    ) -> EmotionAnalysis:
        """融合多模态情绪分析结果"""
        
        # 权重配置
        text_weight = 0.6 if session_data.get('voice_recordings') else 1.0
        voice_weight = 0.4 if session_data.get('voice_recordings') else 0.0
        
        # 融合主导情绪
        text_emo = text_emotion.get('dominant_emotion', 'neutral')
        voice_emo = voice_emotion.get('emotion', 'neutral')
        
        # 情绪优先级映射
        emotion_priority = {
            'sadness': 5, 'fear': 4, 'anger': 3,
            'surprise': 2, 'joy': 1, 'neutral': 0
        }
        
        if emotion_priority.get(text_emo, 0) >= emotion_priority.get(voice_emo, 0):
            dominant_emotion = text_emo
        else:
            dominant_emotion = voice_emo
        
        # 融合情绪强度
        text_intensity = text_emotion.get('intensity', 0.5)
        voice_intensity = voice_emotion.get('intensity', 0.5)
        
        fused_intensity = (
            text_intensity * text_weight + 
            voice_intensity * voice_weight
        )
        
        # 计算情绪稳定性
        emotion_stability = self._calculate_emotion_stability(session_data)
        
        # 确定趋势方向
        trend_direction = self._determine_emotion_trend(session_data)
        
        # 计算置信度
        text_confidence = text_emotion.get('confidence', 0.5)
        voice_confidence = voice_emotion.get('confidence', 0.5)
        
        overall_confidence = (
            text_confidence * text_weight + 
            voice_confidence * voice_weight
        )
        
        return EmotionAnalysis(
            dominant_emotion=dominant_emotion,
            emotion_intensity=fused_intensity,
            emotion_stability=emotion_stability,
            trend_direction=trend_direction,
            confidence=overall_confidence
        )
    
    def _calculate_emotion_stability(self, session_data: Dict[str, Any]) -> float:
        """计算情绪稳定性"""
        # 分析对话过程中情绪的变化程度
        # 返回0-1之间的值，1表示非常稳定
        return 0.7  # 临时实现
    
    def _determine_emotion_trend(self, session_data: Dict[str, Any]) -> str:
        """确定情绪趋势方向"""
        # 分析情绪在评估过程中的变化趋势
        # 返回 'improving', 'stable', 'declining' 之一
        return 'stable'  # 临时实现
    
    async def _assess_overall_risk(
        self,
        phq9_result: PHQ9Score,
        gad7_result: GAD7Score,
        emotion_analysis: EmotionAnalysis
    ) -> str:
        """综合风险评估"""
        
        risk_score = 0
        
        # PHQ-9风险评分
        if phq9_result.total_score >= 20:
            risk_score += 4
        elif phq9_result.total_score >= 15:
            risk_score += 3
        elif phq9_result.total_score >= 10:
            risk_score += 2
        elif phq9_result.total_score >= 5:
            risk_score += 1
        
        # GAD-7风险评分
        if gad7_result.total_score >= 15:
            risk_score += 3
        elif gad7_result.total_score >= 10:
            risk_score += 2
        elif gad7_result.total_score >= 5:
            risk_score += 1
        
        # 情绪分析风险评分
        if emotion_analysis.dominant_emotion in ['sadness', 'fear']:
            if emotion_analysis.emotion_intensity > 0.8:
                risk_score += 3
            elif emotion_analysis.emotion_intensity > 0.6:
                risk_score += 2
            elif emotion_analysis.emotion_intensity > 0.4:
                risk_score += 1
        
        # 特殊风险因素
        if "self_harm_ideation" in phq9_result.risk_factors:
            risk_score += 5  # 自伤念头是最高风险
        
        # 确定风险等级
        if risk_score >= 8:
            return "critical"
        elif risk_score >= 6:
            return "high"
        elif risk_score >= 4:
            return "moderate"
        elif risk_score >= 2:
            return "low"
        else:
            return "minimal"
    
    async def _generate_intervention_recommendations(
        self,
        phq9_result: PHQ9Score,
        gad7_result: GAD7Score,
        emotion_analysis: EmotionAnalysis,
        risk_level: str
    ) -> List[str]:
        """生成干预建议"""
        
        recommendations = []
        
        # 基于风险等级的建议
        if risk_level == "critical":
            recommendations.extend([
                "立即寻求专业心理危机干预",
                "联系心理健康热线：400-161-9995",
                "通知紧急联系人",
                "前往最近的心理健康中心"
            ])
        elif risk_level == "high":
            recommendations.extend([
                "建议尽快预约心理咨询师",
                "考虑药物治疗评估",
                "建立支持系统",
                "定期跟踪心理状态"
            ])
        elif risk_level == "moderate":
            recommendations.extend([
                "建议进行心理咨询",
                "学习情绪管理技巧",
                "保持规律的生活作息",
                "适量运动和社交活动"
            ])
        else:
            recommendations.extend([
                "继续保持心理健康意识",
                "定期进行自我评估",
                "维持健康的生活方式",
                "必要时寻求专业建议"
            ])
        
        # 基于具体症状的建议
        if phq9_result.total_score > 10:
            recommendations.append("针对抑郁症状进行专项干预")
        
        if gad7_result.total_score > 10:
            recommendations.append("学习焦虑管理和放松技巧")
        
        if emotion_analysis.emotion_stability < 0.5:
            recommendations.append("关注情绪稳定性，学习情绪调节技能")
        
        return list(set(recommendations))  # 去重
    
    async def _predict_report_accuracy(
        self,
        session_data: Dict[str, Any],
        phq9_result: PHQ9Score,
        gad7_result: GAD7Score,
        emotion_analysis: EmotionAnalysis
    ) -> float:
        """预测报告准确性"""
        
        accuracy_factors = []
        
        # 数据完整性
        text_completeness = len(session_data.get('conversation_history', [])) / 10  # 假设10轮对话较完整
        voice_completeness = len(session_data.get('voice_recordings', [])) / 5     # 假设5段语音较完整
        
        accuracy_factors.append(min(1.0, text_completeness) * 0.3)
        accuracy_factors.append(min(1.0, voice_completeness) * 0.2)
        
        # 回答一致性
        consistency_score = self._calculate_response_consistency(session_data)
        accuracy_factors.append(consistency_score * 0.2)
        
        # 情绪分析置信度
        accuracy_factors.append(emotion_analysis.confidence * 0.2)
        
        # 量表完整性
        phq9_completeness = sum(1 for score in phq9_result.item_scores if score >= 0) / 9
        gad7_completeness = sum(1 for score in gad7_result.item_scores if score >= 0) / 7
        
        accuracy_factors.append((phq9_completeness + gad7_completeness) / 2 * 0.1)
        
        return min(1.0, sum(accuracy_factors))
    
    def _calculate_response_consistency(self, session_data: Dict[str, Any]) -> float:
        """计算回答一致性"""
        # 分析用户回答的前后一致性
        return 0.8  # 临时实现
    
    # 辅助方法实现省略...
    # (包括 _extract_text_features, _extract_voice_features, 
    #  _save_assessment_result 等方法的具体实现)
    
    async def _basic_text_emotion_analysis(self, text: str) -> Dict[str, Any]:
        """基础文本情绪分析（备用方法）"""
        # 简单的关键词匹配情绪分析
        emotions = {
            'sadness': ['难过', '伤心', '沮丧', '失落', '痛苦'],
            'fear': ['害怕', '恐惧', '担心', '焦虑', '紧张'],
            'anger': ['愤怒', '生气', '恼火', '烦躁', '不满'],
            'joy': ['开心', '快乐', '高兴', '兴奋', '满足']
        }
        
        emotion_scores = {}
        for emotion, keywords in emotions.items():
            score = sum(1 for keyword in keywords if keyword in text)
            emotion_scores[emotion] = score
        
        if not any(emotion_scores.values()):
            return {'dominant_emotion': 'neutral', 'intensity': 0.5, 'confidence': 0.3}
        
        dominant_emotion = max(emotion_scores, key=emotion_scores.get)
        intensity = min(1.0, emotion_scores[dominant_emotion] / 3)
        
        return {
            'dominant_emotion': dominant_emotion,
            'intensity': intensity,
            'confidence': 0.6
        }
