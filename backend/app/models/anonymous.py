"""
匿名咨询相关数据模型
Anonymous Consultation Related Data Models
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.core.database import Base

class AnonymousMessage(Base):
    """匿名消息模型"""
    __tablename__ = "anonymous_messages"
    
    id = Column(Integer, primary_key=True, index=True)
    student_identifier = Column(String(100), nullable=False)  # 学生标识符（加密）
    message_type = Column(String(50), default="text")  # 消息类型：text/voice
    content = Column(Text, nullable=False)  # 消息内容
    emotion_analysis = Column(JSON)  # 情绪分析结果
    risk_level = Column(String(50))  # 风险等级
    is_urgent = Column(Boolean, default=False)  # 是否紧急
    counselor_assigned = Column(Boolean, default=False)  # 是否已分配咨询师
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关联关系
    chats = relationship("AnonymousChat", back_populates="message")

class AnonymousChat(Base):
    """匿名聊天模型"""
    __tablename__ = "anonymous_chats"
    
    id = Column(Integer, primary_key=True, index=True)
    message_id = Column(Integer, ForeignKey("anonymous_messages.id"), nullable=False)
    counselor_id = Column(Integer, ForeignKey("counselors.id"), nullable=False)
    chat_session_id = Column(String(100), unique=True)  # 聊天会话ID
    start_time = Column(DateTime(timezone=True), server_default=func.now())
    end_time = Column(DateTime(timezone=True))
    status = Column(String(50), default="active")  # 聊天状态
    conversation_history = Column(JSON)  # 对话历史
    risk_assessment = Column(JSON)      # 风险评估
    intervention_required = Column(Boolean, default=False)  # 是否需要干预
    student_location = Column(String(200))  # 学生位置（用于紧急情况）
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关联关系
    message = relationship("AnonymousMessage", back_populates="chats")
    counselor = relationship("Counselor")
