"""
AI心理辅导API路由
AI Counseling API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from sqlalchemy.orm import Session
from typing import Optional
import json
from datetime import datetime

from app.core.database import get_db
from app.services.simple_auth_service import simple_get_current_user as get_current_user
from app.models.user import User, UserRole, Student
from app.models.ai_counseling import AICounselingSession, RiskAssessment
from app.services.ai_counseling_service import AICounselingService
from app.services.risk_assessment_service import RiskAssessmentService
from app.services.emotion_service import EmotionService
from app.schemas.ai_counseling import (
    AISessionCreate,
    AISessionResponse,
    AIConversationRequest,
    AIConversationResponse,
    AISessionEnd,
    RiskAssessmentRequest,
    RiskAssessmentResponse
)
from loguru import logger

router = APIRouter()

def get_student_user(current_user: User = Depends(get_current_user)):
    """验证学生权限"""
    if current_user.role != UserRole.STUDENT:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="需要学生权限"
        )
    return current_user

@router.post("/session/start", response_model=AISessionResponse)
async def start_ai_counseling(
    session_request: AISessionCreate,
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db)
):
    """
    开始AI心理辅导会话
    支持文字和语音输入
    """
    ai_service = AICounselingService(db)
    
    # 创建AI辅导会话
    session_data = await ai_service.start_session(
        current_user.id, 
        session_request.problem_type
    )
    
    return AISessionResponse(
        session_id=session_data["session_id"],
        message=session_data["message"],
        session_data=session_data["session_data"]
    )

@router.post("/test/emotion", response_model=dict)
async def test_emotion_analysis(
    data: dict,
    db: Session = Depends(get_db)
):
    """临时测试端点 - 无需认证"""
    print(f"🧪🧪🧪 测试端点被调用！message: '{data.get('message')}'")
    
    ai_service = AICounselingService(db)
    emotion_result = await ai_service._analyze_user_emotion(data.get('message', ''))
    
    print(f"🧪🧪🧪 测试结果: {emotion_result}")
    return {"test_emotion_result": emotion_result}

@router.post("/session/chat", response_model=AIConversationResponse)
async def continue_ai_chat(
    chat_request: AIConversationRequest,
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db)
):
    """
    继续AI辅导对话
    """
    # API调用日志
    logger.info(f"AI咨询API被调用 - session_id: {chat_request.session_id}, message: '{chat_request.message}'")
    
    ai_service = AICounselingService(db)
    
    # 继续对话
    response_data = await ai_service.continue_conversation(
        chat_request.session_id, 
        chat_request.message
    )
    
    logger.info(f"🔙 AI咨询API返回数据 - 情绪: {response_data['emotion_analysis']['dominant_emotion']}, 风险: {response_data['risk_assessment']['risk_level']}")
    # 不再打印完整的response_data，避免datetime序列化问题
    
    return AIConversationResponse(
        message=response_data["message"],
        emotion_analysis=response_data["emotion_analysis"],
        risk_assessment=response_data["risk_assessment"],
        session_id=chat_request.session_id,
        emergency_alert=response_data.get("emergency_alert"),
        redirect_action=response_data.get("redirect_action")
    )

@router.post("/session/end")
async def end_ai_counseling(
    end_request: AISessionEnd,
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db)
):
    """
    结束AI辅导会话
    生成会话总结和建议
    """
    ai_service = AICounselingService(db)
    return await ai_service.end_session(end_request.session_id)

@router.get("/session/{session_id}/summary")
async def get_session_summary(
    session_id: str,
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db)
):
    """
    获取AI辅导会话总结
    """
    ai_service = AICounselingService(db)
    return await ai_service.get_session_summary(session_id)

@router.get("/sessions/history")
async def get_ai_counseling_history(
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db),
    limit: int = 10
):
    """
    获取AI辅导历史记录
    """
    ai_service = AICounselingService(db)
    return await ai_service.get_session_history(current_user.id, limit)

@router.get("/risk-assessment/{session_id}")
async def get_risk_assessment(
    session_id: int,
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db)
):
    """
    获取风险评估结果
    """
    risk_service = RiskAssessmentService(db)
    return await risk_service.get_risk_assessment(session_id, current_user.id)

@router.post("/emergency-intervention")
async def request_emergency_intervention(
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db)
):
    """
    请求紧急干预
    当学生主动寻求帮助时使用
    """
    risk_service = RiskAssessmentService(db)
    return await risk_service.request_emergency_intervention(current_user.id)

@router.get("/intervention-suggestions")
async def get_intervention_suggestions(
    current_user: User = Depends(get_student_user),
    db: Session = Depends(get_db)
):
    """
    获取干预建议
    基于学生的历史数据和当前状态
    """
    ai_service = AICounselingService(db)
    return await ai_service.get_intervention_suggestions(current_user.id)

# WebSocket连接用于实时AI辅导
@router.websocket("/ws/{session_id}")
async def websocket_ai_counseling(
    websocket: WebSocket,
    session_id: int,
    db: Session = Depends(get_db)
):
    """
    WebSocket连接用于实时AI辅导对话
    """
    await websocket.accept()
    ai_service = AICounselingService(db)
    
    try:
        while True:
            # 接收学生消息
            data = await websocket.receive_text()
            message_data = json.loads(data)
            
            # 处理消息并生成AI回复
            ai_response = await ai_service.process_realtime_message(
                session_id, message_data["message"]
            )
            
            # 发送AI回复
            await websocket.send_text(json.dumps({
                "type": "ai_response",
                "content": ai_response,
                "timestamp": message_data.get("timestamp")
            }))
            
    except WebSocketDisconnect:
        # 连接断开，结束会话
        await ai_service.end_session(session_id)
        print(f"WebSocket连接断开，会话 {session_id} 已结束")
