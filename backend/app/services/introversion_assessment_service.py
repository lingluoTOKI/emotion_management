"""
学生内向程度智能评估服务
Introversion Assessment Service for Students
"""

from typing import Dict, Any, List, Optional, Tuple
from datetime import datetime, timedelta
import numpy as np
from dataclasses import dataclass
from sqlalchemy.orm import Session
from loguru import logger

from app.core.config import settings
from app.core.exceptions import BusinessLogicError


@dataclass
class IntroversionMetrics:
    """内向程度评估指标"""
    text_engagement: float      # 文本参与度 (0-1)
    voice_confidence: float     # 语音自信度 (0-1)
    interaction_initiative: float  # 交互主动性 (0-1)
    expression_depth: float     # 表达深度 (0-1)
    social_openness: float      # 社交开放度 (0-1)
    overall_score: float        # 综合内向程度 (0-1)


class IntroversionAssessmentService:
    """内向程度智能评估服务类"""
    
    def __init__(self, db: Session):
        self.db = db
        # 各维度权重配置
        self.weights = {
            'text_engagement': 0.20,     # 文本参与度权重
            'voice_confidence': 0.25,    # 语音自信度权重  
            'interaction_initiative': 0.20,  # 交互主动性权重
            'expression_depth': 0.20,    # 表达深度权重
            'social_openness': 0.15      # 社交开放度权重
        }
    
    async def assess_introversion_level(
        self,
        user_id: int,
        session_data: Dict[str, Any]
    ) -> IntroversionMetrics:
        """
        综合评估学生内向程度
        
        Args:
            user_id: 用户ID
            session_data: 评估会话数据，包含：
                - text_messages: 文本消息列表
                - voice_records: 语音记录列表  
                - interaction_logs: 交互日志
                - assessment_responses: 评估回答记录
        
        Returns:
            IntroversionMetrics: 内向程度评估结果
        """
        try:
            # 1. 文本参与度分析
            text_engagement = await self._analyze_text_engagement(session_data)
            
            # 2. 语音自信度分析
            voice_confidence = await self._analyze_voice_confidence(session_data)
            
            # 3. 交互主动性分析
            interaction_initiative = await self._analyze_interaction_initiative(session_data)
            
            # 4. 表达深度分析
            expression_depth = await self._analyze_expression_depth(session_data)
            
            # 5. 社交开放度分析
            social_openness = await self._analyze_social_openness(session_data)
            
            # 6. 计算综合内向程度
            overall_score = self._calculate_overall_score(
                text_engagement, voice_confidence, interaction_initiative,
                expression_depth, social_openness
            )
            
            # 7. 记录评估历史
            await self._save_assessment_history(user_id, {
                'text_engagement': text_engagement,
                'voice_confidence': voice_confidence,
                'interaction_initiative': interaction_initiative,
                'expression_depth': expression_depth,
                'social_openness': social_openness,
                'overall_score': overall_score
            })
            
            return IntroversionMetrics(
                text_engagement=text_engagement,
                voice_confidence=voice_confidence,
                interaction_initiative=interaction_initiative,
                expression_depth=expression_depth,
                social_openness=social_openness,
                overall_score=overall_score
            )
            
        except Exception as e:
            logger.error(f"内向程度评估失败: {str(e)}")
            raise BusinessLogicError(f"内向程度评估失败: {str(e)}")
    
    async def _analyze_text_engagement(self, session_data: Dict[str, Any]) -> float:
        """分析文本参与度"""
        text_messages = session_data.get('text_messages', [])
        
        if not text_messages:
            return 0.5  # 默认中等参与度
        
        # 指标计算
        total_characters = sum(len(msg.get('content', '')) for msg in text_messages)
        avg_message_length = total_characters / len(text_messages) if text_messages else 0
        response_frequency = len(text_messages) / session_data.get('total_interactions', 1)
        
        # 主动表达分析
        initiative_count = sum(1 for msg in text_messages 
                             if msg.get('is_initiative', False))
        initiative_ratio = initiative_count / len(text_messages) if text_messages else 0
        
        # 情感表达分析
        emotional_words = ['感觉', '觉得', '认为', '希望', '担心', '开心', '难过', '焦虑']
        emotional_expression = sum(
            1 for msg in text_messages 
            for word in emotional_words 
            if word in msg.get('content', '')
        ) / len(text_messages) if text_messages else 0
        
        # 综合评分 (分值越高表示越外向)
        engagement_score = min(1.0, (
            (avg_message_length / 50) * 0.3 +  # 平均字数影响
            response_frequency * 0.3 +          # 回应频率影响
            initiative_ratio * 0.2 +            # 主动性影响
            (emotional_expression / 2) * 0.2    # 情感表达影响
        ))
        
        # 转换为内向程度 (分值越高表示越内向)
        return 1.0 - engagement_score
    
    async def _analyze_voice_confidence(self, session_data: Dict[str, Any]) -> float:
        """分析语音自信度"""
        voice_records = session_data.get('voice_records', [])
        
        if not voice_records:
            return 0.6  # 无语音默认偏内向
        
        total_duration = sum(record.get('duration', 0) for record in voice_records)
        avg_volume = np.mean([record.get('volume_level', 0.5) for record in voice_records])
        speech_rate = sum(record.get('words_per_minute', 0) for record in voice_records) / len(voice_records)
        
        # 停顿分析
        avg_pauses = np.mean([record.get('pause_frequency', 0) for record in voice_records])
        
        # 语音清晰度
        clarity_score = np.mean([record.get('clarity_score', 0.5) for record in voice_records])
        
        # 自信度评分 (分值越高表示越自信/外向)
        confidence_score = min(1.0, (
            (avg_volume / 0.8) * 0.25 +         # 音量影响
            (speech_rate / 150) * 0.25 +        # 语速影响
            (1 - avg_pauses / 10) * 0.25 +      # 停顿影响
            clarity_score * 0.25                # 清晰度影响
        ))
        
        # 转换为内向程度
        return 1.0 - confidence_score
    
    async def _analyze_interaction_initiative(self, session_data: Dict[str, Any]) -> float:
        """分析交互主动性"""
        interaction_logs = session_data.get('interaction_logs', [])
        
        if not interaction_logs:
            return 0.5
        
        # 主动点击分析
        initiative_clicks = sum(1 for log in interaction_logs 
                               if log.get('action_type') == 'initiative_click')
        
        # 被动响应分析
        passive_responses = sum(1 for log in interaction_logs 
                               if log.get('action_type') == 'passive_response')
        
        # 探索行为分析
        exploration_actions = sum(1 for log in interaction_logs 
                                 if log.get('action_type') in ['explore', 'browse', 'search'])
        
        # 主动性评分
        total_interactions = len(interaction_logs)
        initiative_ratio = initiative_clicks / total_interactions if total_interactions else 0
        exploration_ratio = exploration_actions / total_interactions if total_interactions else 0
        
        initiative_score = min(1.0, (
            initiative_ratio * 0.5 +
            exploration_ratio * 0.3 +
            (1 - passive_responses / total_interactions) * 0.2
        ))
        
        # 转换为内向程度
        return 1.0 - initiative_score
    
    async def _analyze_expression_depth(self, session_data: Dict[str, Any]) -> float:
        """分析表达深度"""
        assessment_responses = session_data.get('assessment_responses', [])
        text_messages = session_data.get('text_messages', [])
        
        all_texts = []
        for response in assessment_responses:
            all_texts.append(response.get('answer_text', ''))
        for message in text_messages:
            all_texts.append(message.get('content', ''))
        
        if not all_texts:
            return 0.5
        
        # 具体性分析 - 具体词汇使用
        specific_indicators = ['具体', '比如', '例如', '因为', '所以', '导致', '影响']
        specificity_count = sum(
            1 for text in all_texts 
            for indicator in specific_indicators 
            if indicator in text
        )
        
        # 情感深度分析 - 深层情感词汇
        deep_emotions = ['痛苦', '绝望', '孤独', '恐惧', '愤怒', '悲伤', '无助', '困惑']
        emotion_depth = sum(
            1 for text in all_texts 
            for emotion in deep_emotions 
            if emotion in text
        )
        
        # 自我反思词汇
        reflection_words = ['反思', '思考', '意识到', '发现', '理解', '感悟']
        reflection_count = sum(
            1 for text in all_texts 
            for word in reflection_words 
            if word in text
        )
        
        # 平均文本长度
        avg_length = sum(len(text) for text in all_texts) / len(all_texts)
        
        # 表达深度评分 (分值越高表示表达越深入/外向)
        depth_score = min(1.0, (
            (specificity_count / len(all_texts)) * 0.25 +
            (emotion_depth / len(all_texts)) * 0.25 +
            (reflection_count / len(all_texts)) * 0.25 +
            (avg_length / 100) * 0.25
        ))
        
        # 转换为内向程度 (深度表达通常表示更开放)
        return 1.0 - depth_score
    
    async def _analyze_social_openness(self, session_data: Dict[str, Any]) -> float:
        """分析社交开放度"""
        text_messages = session_data.get('text_messages', [])
        assessment_responses = session_data.get('assessment_responses', [])
        
        all_texts = []
        for response in assessment_responses:
            all_texts.append(response.get('answer_text', ''))
        for message in text_messages:
            all_texts.append(message.get('content', ''))
        
        if not all_texts:
            return 0.5
        
        # 求助意愿分析
        help_seeking = ['帮助', '建议', '指导', '支持', '想要', '希望', '需要']
        help_seeking_count = sum(
            1 for text in all_texts 
            for word in help_seeking 
            if word in text
        )
        
        # 社交词汇分析
        social_words = ['朋友', '同学', '老师', '家人', '交流', '沟通', '分享', '聊天']
        social_count = sum(
            1 for text in all_texts 
            for word in social_words 
            if word in text
        )
        
        # 开放性词汇
        openness_words = ['愿意', '可以', '没问题', '好的', '同意', '接受']
        openness_count = sum(
            1 for text in all_texts 
            for word in openness_words 
            if word in text
        )
        
        # 拒绝/封闭词汇
        closed_words = ['不想', '不愿意', '算了', '没事', '不用', '不需要']
        closed_count = sum(
            1 for text in all_texts 
            for word in closed_words 
            if word in text
        )
        
        # 社交开放度评分
        openness_score = min(1.0, (
            (help_seeking_count / len(all_texts)) * 0.3 +
            (social_count / len(all_texts)) * 0.3 +
            (openness_count / len(all_texts)) * 0.2 +
            (1 - closed_count / len(all_texts)) * 0.2
        ))
        
        # 转换为内向程度
        return 1.0 - openness_score
    
    def _calculate_overall_score(
        self, 
        text_engagement: float,
        voice_confidence: float,
        interaction_initiative: float,
        expression_depth: float,
        social_openness: float
    ) -> float:
        """计算综合内向程度分数"""
        
        overall_score = (
            text_engagement * self.weights['text_engagement'] +
            voice_confidence * self.weights['voice_confidence'] +
            interaction_initiative * self.weights['interaction_initiative'] +
            expression_depth * self.weights['expression_depth'] +
            social_openness * self.weights['social_openness']
        )
        
        return min(1.0, max(0.0, overall_score))
    
    async def _save_assessment_history(self, user_id: int, metrics: Dict[str, float]):
        """保存评估历史记录"""
        # 这里应该保存到数据库
        # 实现数据持久化逻辑
        pass
    
    def get_consultation_recommendation(self, introversion_score: float) -> Dict[str, Any]:
        """
        根据内向程度推荐咨询模块
        
        Args:
            introversion_score: 内向程度分数 (0-1)
            
        Returns:
            推荐结果包含模块类型、推荐理由、使用建议
        """
        
        if introversion_score <= 0.3:
            # 内向程度浅 - 推荐AI心理辅导
            return {
                'recommended_module': 'ai_counseling',
                'module_name': 'AI心理辅导',
                'confidence': 1.0 - introversion_score,
                'reason': '您表现出较好的表达能力和互动积极性，AI辅导可以为您提供即时的心理支持和基础指导。',
                'benefits': [
                    '24小时随时可用',
                    '无压力的交流环境',
                    '基础心理教育和技巧学习',
                    '初步情绪疏导'
                ],
                'usage_tips': [
                    '可以随时开始对话',
                    '尽量详细描述您的感受',
                    '如有严重问题会自动推荐专业咨询'
                ]
            }
        
        elif introversion_score <= 0.7:
            # 内向程度中 - 推荐线下咨询预约
            return {
                'recommended_module': 'offline_consultation',
                'module_name': '线下咨询预约',
                'confidence': 0.8,
                'reason': '您有一定的表达意愿，但可能需要更专业的指导。面对面咨询能提供更深入的帮助。',
                'benefits': [
                    '专业咨询师一对一服务',
                    '深度心理分析和治疗',
                    '个性化咨询方案',
                    '长期跟踪和支持'
                ],
                'usage_tips': [
                    '可以根据问题类型选择咨询师',
                    '提前准备想要讨论的问题',
                    '选择您感觉舒适的咨询师'
                ]
            }
        
        else:
            # 内向程度深 - 推荐匿名留言咨询
            return {
                'recommended_module': 'anonymous_consultation',
                'module_name': '匿名留言咨询',
                'confidence': introversion_score,
                'reason': '考虑到您可能对直接交流感到不适，匿名方式可以让您更自由地表达内心感受。',
                'benefits': [
                    '完全匿名保护隐私',
                    '无时间压力慢慢思考',
                    '文字表达降低心理负担',
                    '专业咨询师耐心回复'
                ],
                'usage_tips': [
                    '可以花时间仔细组织语言',
                    '详细描述您的困扰',
                    '不用担心身份暴露',
                    '如有紧急情况会安全干预'
                ]
            }
    
    async def get_dynamic_recommendations(
        self,
        user_id: int,
        current_metrics: IntroversionMetrics,
        context: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """
        动态生成多模块推荐
        
        根据当前情绪状态、历史偏好、时间等因素动态调整推荐
        """
        
        recommendations = []
        
        # 主推荐
        primary_rec = self.get_consultation_recommendation(current_metrics.overall_score)
        primary_rec['priority'] = 'primary'
        recommendations.append(primary_rec)
        
        # 基于情绪状态的补充推荐
        current_emotion = context.get('current_emotion', 'neutral')
        emotion_intensity = context.get('emotion_intensity', 0.5)
        
        if current_emotion in ['depression', 'anxiety'] and emotion_intensity > 0.7:
            # 高强度负面情绪 - 推荐紧急支持
            emergency_rec = {
                'recommended_module': 'emergency_support',
                'module_name': '紧急心理支持',
                'priority': 'urgent',
                'reason': '检测到您当前情绪状态需要及时关注',
                'confidence': emotion_intensity,
                'benefits': ['24小时热线支持', '紧急干预服务', '专业危机处理'],
                'usage_tips': ['立即联系', '寻求身边人帮助', '前往最近医院']
            }
            recommendations.insert(0, emergency_rec)  # 优先级最高
        
        # 基于时间的推荐
        current_hour = datetime.now().hour
        if 9 <= current_hour <= 17:  # 工作时间
            if current_metrics.overall_score <= 0.5:  # 不太内向
                work_time_rec = {
                    'recommended_module': 'quick_consultation',
                    'module_name': '快速在线咨询',
                    'priority': 'secondary',
                    'reason': '当前时间咨询师在线，可以快速获得专业建议',
                    'confidence': 0.7,
                    'time_limited': True
                }
                recommendations.append(work_time_rec)
        
        return recommendations
