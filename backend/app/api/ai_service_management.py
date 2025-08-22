"""
AI服务管理API
AI Service Management API
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from datetime import datetime
from pydantic import BaseModel

from app.core.database import get_db
from app.core.error_handlers import ResponseHandler
from app.services.ai_counseling_service import AICounselingService
from app.services.xfyun_ai_service import xfyun_ai_service
from app.models.user import User
from app.services.auth_service import get_current_user

router = APIRouter()

@router.get("/status")
async def get_ai_services_status():
    """获取所有AI服务状态"""
    
    try:
        # 创建AI咨询服务实例
        ai_counseling = AICounselingService()
        
        # 测试所有AI服务
        test_results = await ai_counseling.test_ai_services()
        
        # 获取当前配置
        current_service = ai_counseling.current_ai_service
        service_priority = ai_counseling.ai_service_priority
        
        return ResponseHandler.success(
            data={
                "current_primary_service": current_service,
                "service_priority": service_priority,
                "service_status": test_results,
                "last_checked": datetime.now().isoformat()
            },
            message="AI服务状态获取成功"
        )
        
    except Exception as e:
        return ResponseHandler.error(
            message=f"获取AI服务状态失败: {str(e)}",
            error_code="AI_STATUS_ERROR"
        )

@router.post("/switch")
async def switch_ai_service(
    service_name: str,
    current_user: User = Depends(get_current_user)
):
    """切换主要AI服务（需要管理员权限）"""
    
    # 检查权限
    if current_user.role != "admin":
        return ResponseHandler.forbidden(
            message="只有管理员可以切换AI服务"
        )
    
    try:
        ai_counseling = AICounselingService()
        success = await ai_counseling.switch_ai_service(service_name)
        
        if success:
            return ResponseHandler.success(
                data={"new_service": service_name},
                message=f"AI服务已切换到: {service_name}"
            )
        else:
            return ResponseHandler.error(
                message=f"不支持的AI服务: {service_name}",
                error_code="INVALID_SERVICE"
            )
            
    except Exception as e:
        return ResponseHandler.error(
            message=f"切换AI服务失败: {str(e)}",
            error_code="SWITCH_ERROR"
        )

@router.post("/test/xfyun")
async def test_xfyun_service():
    """测试科大讯飞AI服务"""
    
    try:
        test_results = await xfyun_ai_service.test_connection()
        
        return ResponseHandler.success(
            data=test_results,
            message="科大讯飞AI服务测试完成"
        )
        
    except Exception as e:
        return ResponseHandler.error(
            message=f"科大讯飞AI服务测试失败: {str(e)}",
            error_code="XFYUN_TEST_ERROR"
        )

class ChatTestRequest(BaseModel):
    message: str
    service_name: Optional[str] = "xfyun"
    use_websocket: Optional[bool] = False  # 默认使用HTTP

@router.post("/test/chat")
async def test_ai_chat(request: ChatTestRequest):
    """测试AI对话功能"""
    
    try:
        if request.service_name == "xfyun":
            if request.use_websocket:
                # 测试WebSocket流式对话
                response_parts = []
                async for chunk in xfyun_ai_service.chat_completion_websocket(
                    messages=[{"role": "user", "content": request.message}],
                    max_tokens=200
                ):
                    response_parts.append(chunk)
                
                full_response = "".join(response_parts)
                
                return ResponseHandler.success(
                    data={
                        "service": "xfyun_websocket",
                        "user_message": request.message,
                        "ai_response": full_response,
                        "response_chunks": len(response_parts)
                    },
                    message="WebSocket对话测试成功"
                )
            else:
                # 测试HTTP对话
                result = await xfyun_ai_service.chat_completion_http(
                    messages=[{"role": "user", "content": request.message}],
                    max_tokens=200
                )
                
                return ResponseHandler.success(
                    data={
                        "service": "xfyun_http",
                        "user_message": request.message,
                        "ai_response": result["choices"][0]["message"]["content"] if result.get("choices") else "无回复",
                        "full_result": result
                    },
                    message="HTTP对话测试成功"
                )
        else:
            return ResponseHandler.error(
                message=f"不支持的服务: {request.service_name}",
                error_code="UNSUPPORTED_SERVICE"
            )
            
    except Exception as e:
        return ResponseHandler.error(
            message=f"AI对话测试失败: {str(e)}",
            error_code="CHAT_TEST_ERROR"
        )

class EmotionTestRequest(BaseModel):
    text: str

@router.post("/test/emotion")
async def test_emotion_analysis(request: EmotionTestRequest):
    """测试情绪分析功能"""
    
    try:
        emotion_result = await xfyun_ai_service.analyze_emotion_with_ai(
            text_content=request.text,
            use_websocket=False
        )
        
        return ResponseHandler.success(
            data={
                "input_text": request.text,
                "emotion_analysis": emotion_result
            },
            message="情绪分析测试成功"
        )
        
    except Exception as e:
        return ResponseHandler.error(
            message=f"情绪分析测试失败: {str(e)}",
            error_code="EMOTION_TEST_ERROR"
        )

class PsychologicalTestRequest(BaseModel):
    user_message: str
    emotion_state: Optional[str] = "neutral"
    risk_level: Optional[str] = "low"

@router.post("/test/psychological")
async def test_psychological_response(request: PsychologicalTestRequest):
    """测试心理咨询回复生成"""
    
    try:
        context = {
            'emotion_state': request.emotion_state,
            'risk_level': request.risk_level
        }
        
        response = await xfyun_ai_service.generate_psychological_response(
            user_message=request.user_message,
            context=context,
            use_websocket=False  # 使用稳定的HTTP接口
        )
        
        return ResponseHandler.success(
            data={
                "user_message": request.user_message,
                "context": context,
                "psychological_response": response
            },
            message="心理咨询回复测试成功"
        )
        
    except Exception as e:
        return ResponseHandler.error(
            message=f"心理咨询回复测试失败: {str(e)}",
            error_code="PSYCHOLOGICAL_TEST_ERROR"
        )

@router.get("/config")
async def get_ai_service_config(current_user: User = Depends(get_current_user)):
    """获取AI服务配置信息（需要管理员权限）"""
    
    if current_user.role != "admin":
        return ResponseHandler.forbidden(
            message="只有管理员可以查看AI服务配置"
        )
    
    try:
        config_info = {
            "xfyun": {
                "http_endpoint": xfyun_ai_service.http_base_url,
                "websocket_endpoint": xfyun_ai_service.ws_base_url,
                "app_id": xfyun_ai_service.ws_app_id,
                "api_key_configured": True,
                "websocket_credentials_configured": True,
                "config_method": "内置配置",
                "status": "已集成"
            },
            "openai": {
                "base_url": "https://api.openai.com/v1",
                "api_key_configured": bool(settings.OPENAI_API_KEY),
                "default_model": settings.OPENAI_MODEL,
                "config_method": "环境变量",
                "status": "备用服务"
            },
            "system": {
                "primary_service": "xfyun",
                "fallback_enabled": True,
                "max_retry_attempts": 3,
                "service_priority": ["xfyun", "openai", "fallback"]
            }
        }
        
        return ResponseHandler.success(
            data=config_info,
            message="AI服务配置获取成功"
        )
        
    except Exception as e:
        return ResponseHandler.error(
            message=f"获取AI服务配置失败: {str(e)}",
            error_code="CONFIG_ERROR"
        )
