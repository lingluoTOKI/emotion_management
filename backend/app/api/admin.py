"""
管理员API路由
Admin API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from datetime import datetime, timedelta

from app.core.database import get_db
from app.services.auth_service import get_current_user
from app.models.user import User, UserRole, Counselor, CounselorSchool
from app.models.consultation import Consultation, ConsultationStatus
from app.models.assessment import Assessment
from app.services.admin_service import AdminService
from app.schemas.admin import (
    DashboardData, 
    CounselorStat, 
    ConsultationStat,
    AssessmentAccuracy
)

router = APIRouter()

def get_admin_user(current_user: User = Depends(get_current_user)):
    """验证管理员权限"""
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要管理员权限"
        )
    return current_user

@router.get("/dashboard", response_model=DashboardData)
async def get_dashboard_data(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    获取管理员仪表板数据
    包含所有可视化图表所需的数据
    """
    admin_service = AdminService(db)
    
    # 获取词云图数据：学生问题关键词统计
    keyword_stats = await admin_service.get_keyword_statistics()
    
    # 获取南丁格尔玫瑰图数据：不同流派咨询师咨询次数
    counselor_school_stats = await admin_service.get_counselor_school_statistics()
    
    # 获取饼状图数据：评估报告准确性统计
    assessment_accuracy = await admin_service.get_assessment_accuracy()
    
    # 获取条形图数据：咨询师问题解决率
    counselor_success_rate = await admin_service.get_counselor_success_rate()
    
    return DashboardData(
        keyword_statistics=keyword_stats,
        counselor_school_statistics=counselor_school_stats,
        assessment_accuracy=assessment_accuracy,
        counselor_success_rate=counselor_success_rate
    )

@router.get("/counselors/stats", response_model=List[CounselorStat])
async def get_counselor_statistics(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    获取咨询师统计信息
    """
    admin_service = AdminService(db)
    return await admin_service.get_counselor_statistics()

@router.get("/consultations/stats", response_model=ConsultationStat)
async def get_consultation_statistics(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db),
    start_date: datetime = None,
    end_date: datetime = None
):
    """
    获取咨询统计信息
    支持时间范围筛选
    """
    admin_service = AdminService(db)
    return await admin_service.get_consultation_statistics(start_date, end_date)

@router.get("/assessments/accuracy", response_model=AssessmentAccuracy)
async def get_assessment_accuracy_stats(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    获取评估报告准确性统计
    """
    admin_service = AdminService(db)
    return await admin_service.get_assessment_accuracy()

@router.get("/risk-alerts")
async def get_risk_alerts(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    获取风险预警信息
    """
    admin_service = AdminService(db)
    return await admin_service.get_risk_alerts()

@router.get("/system-overview")
async def get_system_overview(
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    获取系统概览信息
    """
    admin_service = AdminService(db)
    return await admin_service.get_system_overview()

@router.post("/counselors/{counselor_id}/toggle-availability")
async def toggle_counselor_availability(
    counselor_id: int,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    切换咨询师可用状态
    """
    admin_service = AdminService(db)
    return await admin_service.toggle_counselor_availability(counselor_id)

@router.get("/reports/export")
async def export_reports(
    report_type: str,
    start_date: datetime = None,
    end_date: datetime = None,
    current_user: User = Depends(get_admin_user),
    db: Session = Depends(get_db)
):
    """
    导出报告数据
    支持多种报告类型：咨询记录、评估报告、风险预警等
    """
    admin_service = AdminService(db)
    return await admin_service.export_reports(report_type, start_date, end_date)
