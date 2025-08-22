"""
管理员相关的数据模型
Admin Schemas
"""

from pydantic import BaseModel
from typing import List, Dict, Any

class KeywordStat(BaseModel):
    """关键词统计模型"""
    keyword: str
    count: int

class CounselorSchoolStat(BaseModel):
    """咨询师流派统计模型"""
    school: str
    count: int
    color: str

class AssessmentAccuracy(BaseModel):
    """评估准确性模型"""
    accurate: int
    inaccurate: int
    total: int

class CounselorSuccessRate(BaseModel):
    """咨询师成功率模型"""
    counselor: str
    success_rate: float
    consultations: int

class CounselorStat(BaseModel):
    """咨询师统计模型"""
    id: int
    name: str
    school: str
    total_consultations: int
    success_rate: float
    avg_rating: float

class ConsultationStat(BaseModel):
    """咨询统计模型"""
    total_consultations: int
    completed_consultations: int
    ongoing_consultations: int
    cancelled_consultations: int
    avg_duration: float
    student_satisfaction: float

class DashboardData(BaseModel):
    """仪表板数据模型"""
    keyword_statistics: List[KeywordStat]
    counselor_school_statistics: List[CounselorSchoolStat]
    assessment_accuracy: AssessmentAccuracy
    counselor_success_rate: List[CounselorSuccessRate]
