"""
数据模型包
Data Models Package
"""

from app.core.database import Base
# 临时注释模型导入用于调试
# from .user import User, Admin, Student, Counselor
# from .consultation import Consultation, ConsultationRecord, Appointment
# from .assessment import Assessment, AssessmentRecord, EmotionRecord
# from .ai_counseling import AICounselingSession, RiskAssessment
# from .anonymous import AnonymousMessage, AnonymousChat

__all__ = [
    "Base",
    # 临时注释模型导出用于调试
    # "User", "Admin", "Student", "Counselor",
    # "Consultation", "ConsultationRecord", "Appointment",
    # "Assessment", "AssessmentRecord", "EmotionRecord",
    # "AICounselingSession", "RiskAssessment",
    # "AnonymousMessage", "AnonymousChat"
]
