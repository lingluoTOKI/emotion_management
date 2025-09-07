"""
咨询相关API路由
Consultation Related API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime

from app.core.database import get_db
from app.services.simple_auth_service import simple_get_current_user as get_current_user
from app.models.user import User, UserRole, Student, Counselor
from app.models.consultation import Consultation, Appointment, ConsultationStatus
from app.services.consultation_service import ConsultationService
from app.services.counselor_matching_service import CounselorMatchingService
from app.schemas.consultation import (
    AppointmentCreate,
    AppointmentResponse,
    CounselorMatchRequest,
    CounselorMatchResponse,
    ConsultationSchedule
)

router = APIRouter()

def get_student_user(current_user: User = Depends(get_current_user)):
    """验证学生权限"""
    # 处理角色大小写问题：数据库中是STUDENT，枚举中是student
    user_role = current_user.role.lower() if hasattr(current_user, 'role') else None
    if user_role != UserRole.STUDENT.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要学生权限"
        )
    return current_user

def get_counselor_user(current_user: User = Depends(get_current_user)):
    """验证咨询师权限"""
    # 处理角色大小写问题：数据库中是COUNSELOR，枚举中是counselor
    user_role = current_user.role.lower() if hasattr(current_user, 'role') else None
    if user_role != UserRole.COUNSELOR.value:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要咨询师权限"
        )
    return current_user

@router.post("/appointment/create", response_model=AppointmentResponse)
async def create_appointment(
    appointment_data: AppointmentCreate,
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db)
):
    """
    创建咨询预约
    学生可以指定咨询师偏好和要求
    """
    consultation_service = ConsultationService(db)
    return await consultation_service.create_appointment(current_user.id, appointment_data)

@router.get("/counselors/available")
async def get_available_counselors(
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db),
    school: Optional[str] = None,
    gender: Optional[str] = None,
    is_counselor: Optional[bool] = None
):
    """
    获取可用的咨询师列表
    支持按流派、性别、是否辅导员等条件筛选
    """
    consultation_service = ConsultationService(db)
    return await consultation_service.get_available_counselors(school, gender, is_counselor)

@router.post("/counselors/match", response_model=CounselorMatchResponse)
async def match_counselor(
    match_request: CounselorMatchRequest,
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db)
):
    """
    智能匹配咨询师
    基于学生问题和偏好自动匹配最适合的咨询师
    """
    matching_service = CounselorMatchingService(db)
    return await matching_service.match_counselor(current_user.id, match_request)

@router.get("/counselors/{counselor_id}/schedule")
async def get_counselor_schedule(
    counselor_id: int,
    date: datetime,
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db)
):
    """
    获取咨询师可用时间表
    """
    consultation_service = ConsultationService(db)
    return await consultation_service.get_counselor_schedule(counselor_id, date)

@router.get("/appointments/my")
async def get_my_appointments(
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db),
    status: Optional[str] = None
):
    """
    获取我的预约记录
    """
    consultation_service = ConsultationService(db)
    return await consultation_service.get_student_appointments(current_user.id, status)

@router.post("/appointments/{appointment_id}/cancel")
async def cancel_appointment(
    appointment_id: int,
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db)
):
    """
    取消预约
    """
    consultation_service = ConsultationService(db)
    return await consultation_service.cancel_appointment(appointment_id, current_user.id)

@router.get("/consultations/my")
async def get_my_consultations(
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db)
):
    """
    获取我的咨询记录
    """
    consultation_service = ConsultationService(db)
    return await consultation_service.get_student_consultations(current_user.id)

@router.post("/consultations/{consultation_id}/feedback")
async def submit_consultation_feedback(
    consultation_id: int,
    is_satisfied: bool,
    feedback_comment: Optional[str] = None,
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db)
):
    """
    提交咨询满意度反馈
    用于管理员条形图统计咨询师问题解决率
    """
    consultation_service = ConsultationService(db)
    return await consultation_service.submit_consultation_feedback(
        consultation_id, is_satisfied, feedback_comment, current_user.id
    )

# 咨询师相关接口
@router.get("/counselor/appointments")
async def get_counselor_appointments(
    current_user: User = Depends(get_counselor_user),
    db: Session = Depends(get_db),
    status: Optional[str] = None
):
    """
    咨询师获取预约列表
    """
    consultation_service = ConsultationService(db)
    return await consultation_service.get_counselor_appointments(current_user.id, status)

@router.get("/counselor/consultations")
async def get_counselor_consultations(
    current_user: User = Depends(get_counselor_user),
    db: Session = Depends(get_db)
):
    """
    咨询师获取咨询记录
    """
    consultation_service = ConsultationService(db)
    return await consultation_service.get_counselor_consultations(current_user.id)

@router.post("/counselor/schedule/update")
async def update_counselor_schedule(
    schedule_data: ConsultationSchedule,
    current_user: User = Depends(get_counselor_user),
    db: Session = Depends(get_db)
):
    """
    咨询师更新可用时间表
    """
    consultation_service = ConsultationService(db)
    return await consultation_service.update_counselor_schedule(current_user.id, schedule_data)

@router.get("/counselor/statistics")
async def get_counselor_statistics(
    current_user: User = Depends(get_counselor_user),
    db: Session = Depends(get_db),
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None
):
    """
    咨询师获取个人统计信息
    """
    consultation_service = ConsultationService(db)
    return await consultation_service.get_counselor_statistics(
        current_user.id, start_date, end_date
    )
