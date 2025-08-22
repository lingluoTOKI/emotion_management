"""
咨询相关的数据模型
Consultation Schemas
"""

from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class AppointmentCreate(BaseModel):
    """创建预约模型"""
    counselor_id: int
    appointment_time: datetime
    consultation_type: str
    description: Optional[str] = None

class AppointmentResponse(BaseModel):
    """预约响应模型"""
    id: int
    student_id: int
    counselor_id: int
    appointment_time: datetime
    consultation_type: str
    description: Optional[str]
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class CounselorMatchRequest(BaseModel):
    """咨询师匹配请求模型"""
    problem_type: str
    preferences: Dict[str, Any] = {}

class CounselorMatchResponse(BaseModel):
    """咨询师匹配响应模型"""
    counselors: List[Dict[str, Any]]
    total_matches: int

class ConsultationSchedule(BaseModel):
    """咨询日程模型"""
    counselor_id: int
    date: datetime
    appointments: List[Dict[str, Any]]

class ConsultationCreate(BaseModel):
    """创建咨询模型"""
    appointment_id: int
    consultation_type: str
    notes: Optional[str] = None

class ConsultationResponse(BaseModel):
    """咨询响应模型"""
    id: int
    student_id: int
    counselor_id: int
    appointment_id: Optional[int]
    consultation_type: str
    status: str
    start_time: datetime
    end_time: Optional[datetime]
    duration: Optional[float]
    summary: Optional[str]
    student_feedback: Optional[str]
    student_rating: Optional[int]
    created_at: datetime

    class Config:
        from_attributes = True

class ConsultationUpdate(BaseModel):
    """更新咨询模型"""
    summary: Optional[str] = None
    student_feedback: Optional[str] = None
    student_rating: Optional[int] = None

class CounselorAvailability(BaseModel):
    """咨询师可用性模型"""
    counselor_id: int
    date: datetime
    available_slots: List[Dict[str, Any]]
    total_appointments: int
    available_slots_count: int
