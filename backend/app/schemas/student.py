"""
学生相关的数据模型
Student Schemas
"""

from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class AssessmentCreate(BaseModel):
    """创建评估模型"""
    assessment_type: str
    student_id: Optional[int] = None

class AssessmentResponse(BaseModel):
    """评估响应模型"""
    id: int
    student_id: int
    assessment_type: str
    status: str
    start_time: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class AssessmentAnswer(BaseModel):
    """评估答案模型"""
    question_id: str
    answer: str
    score: Optional[float] = None

class EmotionRecordCreate(BaseModel):
    """创建情绪记录模型"""
    assessment_id: int
    depression_index: float
    anxiety_index: float
    stress_index: float
    overall_mood: float
    dominant_emotion: str
    emotion_intensity: float

class EmotionTrendResponse(BaseModel):
    """情绪趋势响应模型"""
    assessment_id: int
    timestamp: datetime
    depression_index: float
    anxiety_index: float
    stress_index: float
    overall_mood: float

    class Config:
        from_attributes = True

class AssessmentReport(BaseModel):
    """评估报告模型"""
    assessment_id: int
    assessment_type: str
    total_score: Optional[float]
    risk_level: Optional[str]
    keywords: List[str]
    emotion_trend: List[EmotionTrendResponse]
    summary: str
    recommendations: List[str]

class VoiceAssessmentRequest(BaseModel):
    """语音评估请求模型"""
    assessment_id: int
    audio_data: bytes
    language: str = "zh-CN"

class VoiceAssessmentResponse(BaseModel):
    """语音评估响应模型"""
    text: str
    emotion_analysis: Dict[str, Any]
    keywords: List[str]
    confidence: float
