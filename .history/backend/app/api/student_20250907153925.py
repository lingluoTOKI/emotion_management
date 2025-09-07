"""
学生API路由
Student API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
import json

from app.core.database import get_db
from app.services.simple_auth_service import simple_get_current_user as get_current_user
from app.models.user import User, UserRole, Student
from app.models.assessment import Assessment, AssessmentRecord, EmotionRecord
from app.services.student_service import StudentService

@router.get("/dashboard-stats")
async def get_dashboard_stats(current_user = Depends(get_student_user)):
    """获取学生仪表板统计数据"""
    return {
        "assessmentCount": 5,
        "consultationCount": 3,
        "aiChatCount": 12,
        "lastAssessmentScore": 75
    }
from app.services.emotion_service import EmotionService
from app.services.ai_assessment_service import AIAssessmentService
from app.schemas.student import (
    AssessmentCreate,
    AssessmentResponse,
    EmotionRecordCreate,
    EmotionTrendResponse
)

router = APIRouter()

def get_student_user(current_user = Depends(get_current_user)):
    """验证学生权限"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要学生权限"
        )
    return current_user

@router.post("/assessment/start", response_model=AssessmentResponse)
async def start_assessment(
    assessment_data: AssessmentCreate,
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db)
):
    """
    开始心理评估
    支持多种评估类型：PHQ-9, GAD-7, 情绪分析等
    """
    try:
        from loguru import logger
        logger.debug(f"开始评估请求: user_id={current_user.id}, assessment_data={assessment_data}")
        
        student_service = StudentService(db)
        result = await student_service.start_assessment(current_user.id, assessment_data)
        
        logger.debug(f"评估创建成功: assessment_id={result.id}")
        return result
        
    except Exception as e:
        from loguru import logger
        logger.error(f"创建评估失败: {str(e)}")
        logger.error(f"错误类型: {type(e).__name__}")
        import traceback
        logger.error(f"错误堆栈: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"创建评估失败: {str(e)}"
        )

class SubmitAnswerRequest(BaseModel):
    question_id: str
    answer: str

@router.post("/assessment/{assessment_id}/submit")
async def submit_assessment_answer(
    assessment_id: int,
    answer_data: SubmitAnswerRequest,
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db)
):
    """
    提交评估问题答案
    """
    try:
        student_service = StudentService(db)
        result = await student_service.submit_answer(
            assessment_id, answer_data.question_id, answer_data.answer, current_user.id
        )
        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        from loguru import logger
        logger.error(f"提交评估答案失败: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"提交答案失败: {str(e)}"
        )

@router.post("/assessment/{assessment_id}/complete")
async def complete_assessment(
    assessment_id: int,
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db)
):
    """
    完成心理评估
    生成评估报告和情绪分析
    """
    student_service = StudentService(db)
    ai_service = AIAssessmentService()
    
    # 完成评估
    assessment_result = await student_service.complete_assessment(assessment_id, current_user.id)
    
    # AI分析情绪和生成报告
    emotion_analysis = await ai_service.analyze_emotion(assessment_result)
    assessment_report = await ai_service.generate_assessment_report(assessment_result, emotion_analysis)
    
    return {
        "assessment_result": assessment_result,
        "emotion_analysis": emotion_analysis,
        "assessment_report": assessment_report
    }

@router.get("/assessment/{assessment_id}/report")
async def get_assessment_report(
    assessment_id: int,
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db)
):
    """
    获取评估报告
    """
    student_service = StudentService(db)
    return await student_service.get_assessment_report(assessment_id, current_user.id)

@router.post("/emotion/record")
async def record_emotion(
    emotion_data: EmotionRecordCreate,
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db)
):
    """
    记录情绪状态
    支持手动记录和AI识别
    """
    emotion_service = EmotionService(db)
    return await emotion_service.record_emotion(current_user.id, emotion_data)

@router.get("/emotion/trend", response_model=EmotionTrendResponse)
async def get_emotion_trend(
    days: int = 30,
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db)
):
    """
    获取情绪变化趋势
    返回指定天数内的情绪指数变化
    """
    emotion_service = EmotionService(db)
    return await emotion_service.get_emotion_trend(current_user.id, days)

@router.post("/assessment/feedback")
async def submit_assessment_feedback(
    assessment_id: int,
    is_accurate: bool,
    feedback_comment: Optional[str] = None,
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db)
):
    """
    提交评估报告准确性反馈
    用于管理员饼状图统计
    """
    student_service = StudentService(db)
    return await student_service.submit_assessment_feedback(
        assessment_id, is_accurate, feedback_comment, current_user.id
    )

@router.post("/voice/assessment")
async def voice_assessment(
    audio_file: UploadFile = File(...),
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db)
):
    """
    语音评估
    上传语音文件进行情绪识别和问题分析
    """
    emotion_service = EmotionService(db)
    ai_service = AIAssessmentService()
    
    # 语音转文字
    text_content = await emotion_service.speech_to_text(audio_file)
    
    # AI情绪分析
    emotion_analysis = await ai_service.analyze_emotion_from_text(text_content)
    
    # 记录情绪状态
    emotion_record = await emotion_service.record_emotion_from_ai(
        current_user.id, emotion_analysis
    )
    
    return {
        "text_content": text_content,
        "emotion_analysis": emotion_analysis,
        "emotion_record": emotion_record
    }

@router.get("/assessments/history")
async def get_assessment_history(
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db),
    limit: int = 10
):
    """
    获取评估历史记录
    """
    student_service = StudentService(db)
    return await student_service.get_assessment_history(current_user.id, limit)

@router.get("/profile")
async def get_student_profile(
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db)
):
    """
    获取学生个人信息
    """
    student_service = StudentService(db)
    return await student_service.get_student_profile(current_user.id)
