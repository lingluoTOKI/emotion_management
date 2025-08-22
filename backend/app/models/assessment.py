"""
心理评估相关数据模型
Psychological Assessment Related Data Models
"""

import enum
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Float, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

class AssessmentType(str, enum.Enum):
    """评估类型枚举"""
    PHQ9 = "PHQ-9"           # 抑郁自评量表
    GAD7 = "GAD-7"           # 焦虑自评量表
    EMOTION_ANALYSIS = "emotion_analysis"  # 情绪分析
    COMPREHENSIVE = "comprehensive"        # 综合评估

class Assessment(Base):
    """心理评估模型"""
    __tablename__ = "assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    assessment_type = Column(String(50), nullable=False)
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True))
    status = Column(String(50), default="in_progress")  # 评估状态
    total_score = Column(Float)  # 总分
    risk_level = Column(String(50))  # 风险等级
    keywords = Column(JSON)  # 提取的关键词
    emotion_trend = Column(JSON)  # 情绪变化趋势
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关联关系
    student = relationship("Student", back_populates="assessments")
    records = relationship("AssessmentRecord", back_populates="assessment")
    emotion_records = relationship("EmotionRecord", back_populates="assessment")

class AssessmentRecord(Base):
    """评估记录模型"""
    __tablename__ = "assessment_records"
    
    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    question_id = Column(String(50))  # 问题ID
    question_text = Column(Text)      # 问题内容
    answer_text = Column(Text)        # 回答内容
    answer_score = Column(Float)      # 回答得分
    emotion_score = Column(Float)     # 情绪得分
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关联关系
    assessment = relationship("Assessment", back_populates="records")

class EmotionRecord(Base):
    """情绪记录模型"""
    __tablename__ = "emotion_records"
    
    id = Column(Integer, primary_key=True, index=True)
    assessment_id = Column(Integer, ForeignKey("assessments.id"), nullable=False)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    depression_index = Column(Float)  # 抑郁指数
    anxiety_index = Column(Float)     # 焦虑指数
    stress_index = Column(Float)      # 压力指数
    overall_mood = Column(Float)      # 整体情绪状态
    dominant_emotion = Column(String(50))  # 主导情绪
    emotion_intensity = Column(Float)      # 情绪强度
    
    # 关联关系
    assessment = relationship("Assessment", back_populates="emotion_records")
