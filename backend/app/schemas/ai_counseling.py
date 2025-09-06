"""
AI心理咨询相关的数据模型
AI Counseling Schemas
"""

from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class AISessionCreate(BaseModel):
    """创建AI咨询会话模型"""
    problem_type: Optional[str] = None
    initial_message: Optional[str] = None

class AISessionResponse(BaseModel):
    """AI咨询会话响应模型"""
    session_id: str
    message: str
    session_data: Dict[str, Any]

class AIConversationRequest(BaseModel):
    """AI对话请求模型"""
    session_id: str
    message: str

class AIConversationResponse(BaseModel):
    """AI对话响应模型"""
    message: str
    emotion_analysis: Dict[str, Any]
    risk_assessment: Dict[str, Any]
    session_id: str
    emergency_alert: Optional[Dict[str, Any]] = None
    redirect_action: Optional[Dict[str, Any]] = None  # 新增：跳转指令

class AISessionEnd(BaseModel):
    """结束AI咨询会话模型"""
    session_id: str

class AISessionSummary(BaseModel):
    """AI咨询会话总结模型"""
    session_id: str
    summary: Dict[str, Any]
    session_data: Dict[str, Any]

class RiskAssessmentRequest(BaseModel):
    """风险评估请求模型"""
    text_content: Optional[str] = None
    voice_data: Optional[bytes] = None
    behavior_patterns: Optional[List[Dict[str, Any]]] = None

class RiskAssessmentResponse(BaseModel):
    """风险评估响应模型"""
    risk_level: str
    risk_score: float
    risk_factors: List[str]
    recommendations: List[str]
    risk_report: Dict[str, Any]
    assessment_timestamp: datetime

class EmergencyInterventionRequest(BaseModel):
    """紧急干预请求模型"""
    session_id: str
    student_id: int
    risk_level: str
    description: str

class EmergencyInterventionResponse(BaseModel):
    """紧急干预响应模型"""
    intervention_id: str
    status: str
    actions_taken: List[str]
    next_steps: List[str]
    timestamp: datetime

class InterventionSuggestion(BaseModel):
    """干预建议模型"""
    risk_level: str
    immediate_actions: List[str]
    short_term_goals: List[str]
    long_term_goals: List[str]
    responsible_person: str
    follow_up_schedule: Dict[str, Any]

class ComprehensiveAssessmentRequest(BaseModel):
    """综合评估请求模型"""
    session_id: str
    scale_results: Optional[Dict[str, Any]] = None
    ai_assessment: Optional[Dict[str, Any]] = None
    include_conversation: bool = True

class ComprehensiveAssessmentResponse(BaseModel):
    """综合评估响应模型"""
    assessment_id: str
    session_id: str
    assessment_report: Dict[str, Any]
    created_at: datetime