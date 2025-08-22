"""
用户数据模型
User Data Models
"""

from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum

from app.core.database import Base

class UserRole(str, enum.Enum):
    """用户角色枚举"""
    ADMIN = "admin"
    STUDENT = "student"
    COUNSELOR = "counselor"

class CounselorSchool(str, enum.Enum):
    """咨询师流派枚举"""
    COGNITIVE_BEHAVIORAL = "认知行为疗法"
    PSYCHOANALYTIC = "精神分析"
    HUMANISTIC = "人本主义"
    SYSTEMIC = "系统家庭治疗"
    GESTALT = "格式塔疗法"
    OTHER = "其他"

class User(Base):
    """用户基础模型"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    email = Column(String(100), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 关联关系
    admin = relationship("Admin", back_populates="user", uselist=False)
    student = relationship("Student", back_populates="user", uselist=False)
    counselor = relationship("Counselor", back_populates="user", uselist=False)

class Admin(Base):
    """管理员模型"""
    __tablename__ = "admins"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    department = Column(String(100))
    phone = Column(String(20))
    
    # 关联关系
    user = relationship("User", back_populates="admin")

class Student(Base):
    """学生模型"""
    __tablename__ = "students"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    student_id = Column(String(20), unique=True, nullable=False)  # 学号
    name = Column(String(100), nullable=False)
    major = Column(String(100))
    grade = Column(String(20))
    phone = Column(String(20))
    emergency_contact = Column(String(100))  # 紧急联系人
    emergency_phone = Column(String(20))     # 紧急联系电话
    
    # 关联关系
    user = relationship("User", back_populates="student")
    assessments = relationship("Assessment", back_populates="student")
    consultations = relationship("Consultation", back_populates="student")
    ai_sessions = relationship("AICounselingSession", back_populates="student")

class Counselor(Base):
    """心理咨询师模型"""
    __tablename__ = "counselors"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    school = Column(Enum(CounselorSchool), nullable=False)  # 流派
    description = Column(Text)  # 个人介绍
    specialties = Column(Text)  # 专长领域
    experience_years = Column(Integer)  # 从业年限
    is_counselor = Column(Boolean, default=True)  # 是否担任辅导员
    is_available = Column(Boolean, default=True)  # 是否可预约
    phone = Column(String(20))
    office_location = Column(String(200))  # 办公室位置
    
    # 关联关系
    user = relationship("User", back_populates="counselor")
    consultations = relationship("Consultation", back_populates="counselor")
    appointments = relationship("Appointment", back_populates="counselor")
