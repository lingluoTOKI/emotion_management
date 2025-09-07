"""
咨询相关数据模型
Consultation Related Data Models
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum, Float
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base

class ConsultationStatus(str, enum.Enum):
    """咨询状态枚举（与数据库保持一致的英文大写值）"""
    SCHEDULED = "SCHEDULED"      # 已预约
    IN_PROGRESS = "IN_PROGRESS"  # 进行中
    COMPLETED = "COMPLETED"      # 已完成
    CANCELLED = "CANCELLED"      # 已取消

class ConsultationType(str, enum.Enum):
    """咨询类型枚举（与数据库保持一致的英文大写值）"""
    FACE_TO_FACE = "FACE_TO_FACE"  # 面对面咨询
    ONLINE = "ONLINE"              # 在线咨询
    PHONE = "PHONE"                # 电话咨询

class Consultation(Base):
    """咨询记录模型"""
    __tablename__ = "consultations"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    counselor_id = Column(Integer, ForeignKey("counselors.id"), nullable=False)
    consultation_type = Column(Enum(ConsultationType), nullable=False)
    status = Column(Enum(ConsultationStatus), default=ConsultationStatus.SCHEDULED)
    scheduled_time = Column(DateTime(timezone=True), nullable=False)
    duration = Column(Integer, default=60)  # 咨询时长（分钟）
    notes = Column(Text)  # 咨询师备注
    student_feedback = Column(Boolean)  # 学生满意度反馈（是/否）
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关联关系
    student = relationship("Student", back_populates="consultations")
    counselor = relationship("Counselor", back_populates="consultations")
    records = relationship("ConsultationRecord", back_populates="consultation")

class ConsultationRecord(Base):
    """咨询过程记录模型"""
    __tablename__ = "consultation_records"
    
    id = Column(Integer, primary_key=True, index=True)
    consultation_id = Column(Integer, ForeignKey("consultations.id"), nullable=False)
    record_type = Column(String(50))  # 记录类型（对话、观察等）
    content = Column(Text, nullable=False)  # 记录内容
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关联关系
    consultation = relationship("Consultation", back_populates="records")

class Appointment(Base):
    """预约模型"""
    __tablename__ = "appointments"
    
    id = Column(Integer, primary_key=True, index=True)
    student_id = Column(Integer, ForeignKey("students.id"), nullable=False)
    counselor_id = Column(Integer, ForeignKey("counselors.id"), nullable=False)
    preferred_time = Column(DateTime(timezone=True), nullable=False)
    alternative_time = Column(DateTime(timezone=True))  # 备选时间
    reason = Column(Text)  # 预约原因
    urgency_level = Column(Integer, default=1)  # 紧急程度（1-5）
    status = Column(String(50), default="pending")  # 预约状态
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 关联关系
    student = relationship("Student")
    counselor = relationship("Counselor", back_populates="appointments")
