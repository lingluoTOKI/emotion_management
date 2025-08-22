"""
AI心理辅导相关数据模型
AI Counseling Related Data Models
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

class AICounselingSession(Base):
    """AI辅导会话模型"""
    __tablename__ = "ai_counseling_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    session_type = Column(String(50), default="text")  # 会话类型：text/voice
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True))
    status = Column(String(50), default="active")  # 会话状态
    conversation_history = Column(JSON)  # 对话历史
    emotion_analysis = Column(JSON)     # 情绪分析结果
    risk_assessment = Column(JSON)      # 风险评估结果
    intervention_suggestions = Column(Text)  # 干预建议
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关联关系
    student = relationship("Student", back_populates="ai_sessions")
    risk_assessments = relationship("RiskAssessment", back_populates="session")

class RiskAssessment(Base):
    """风险评估模型"""
    __tablename__ = "risk_assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("ai_counseling_sessions.id"), nullable=False)
    risk_type = Column(String(50))  # 风险类型
    risk_level = Column(String(50))  # 风险等级：low/medium/high/critical
    risk_score = Column(Float)       # 风险评分
    risk_indicators = Column(JSON)   # 风险指标
    intervention_required = Column(Boolean, default=False)  # 是否需要干预
    counselor_notified = Column(Boolean, default=False)     # 是否已通知咨询师
    notification_sent_at = Column(DateTime(timezone=True))  # 通知发送时间
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关联关系
    session = relationship("AICounselingSession", back_populates="risk_assessments")
