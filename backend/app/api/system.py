"""
系统状态和诊断API
System Status and Diagnostic API
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Dict, Any
import time
import psutil
import openai
from datetime import datetime

from app.core.database import get_db, engine
from app.core.config import settings
from app.core.error_handlers import ResponseHandler
from app.models.user import User
from app.models.assessment import Assessment
from app.models.consultation import Consultation

router = APIRouter()

@router.get("/health")
async def health_check():
    """简单的健康检查"""
    return ResponseHandler.success(
        data={
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "service": "emotion_management"
        },
        message="系统运行正常"
    )

@router.get("/status")
async def system_status(db: Session = Depends(get_db)):
    """详细的系统状态检查"""
    
    status_data = {
        "overall_status": "healthy",
        "checks": {},
        "timestamp": datetime.utcnow().isoformat()
    }
    
    # 数据库连接检查
    try:
        db.execute("SELECT 1")
        status_data["checks"]["database"] = {
            "status": "healthy",
            "message": "数据库连接正常"
        }
    except Exception as e:
        status_data["checks"]["database"] = {
            "status": "unhealthy",
            "message": f"数据库连接失败: {str(e)}"
        }
        status_data["overall_status"] = "unhealthy"
    
    # OpenAI API检查
    try:
        if settings.OPENAI_API_KEY:
            # 这里可以做一个简单的API调用测试
            status_data["checks"]["openai"] = {
                "status": "configured",
                "message": "OpenAI API密钥已配置"
            }
        else:
            status_data["checks"]["openai"] = {
                "status": "warning",
                "message": "OpenAI API密钥未配置，使用模拟模式"
            }
    except Exception as e:
        status_data["checks"]["openai"] = {
            "status": "error",
            "message": f"OpenAI API检查失败: {str(e)}"
        }
    
    # 系统资源检查
    try:
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        status_data["checks"]["resources"] = {
            "status": "healthy" if cpu_percent < 80 and memory.percent < 80 else "warning",
            "cpu_percent": cpu_percent,
            "memory_percent": memory.percent,
            "disk_percent": disk.percent,
            "message": "系统资源使用正常" if cpu_percent < 80 and memory.percent < 80 else "系统资源使用较高"
        }
    except Exception as e:
        status_data["checks"]["resources"] = {
            "status": "error",
            "message": f"系统资源检查失败: {str(e)}"
        }
    
    return ResponseHandler.success(
        data=status_data,
        message="系统状态检查完成"
    )

@router.get("/diagnostics")
async def system_diagnostics(db: Session = Depends(get_db)):
    """系统诊断信息"""
    
    diagnostics = {
        "application": {
            "name": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "debug_mode": settings.DEBUG,
            "environment": "development" if settings.DEBUG else "production"
        },
        "database": {},
        "statistics": {},
        "configuration": {
            "openai_configured": bool(settings.OPENAI_API_KEY),
            "redis_configured": bool(settings.REDIS_URL),
            "allowed_origins": len(settings.ALLOWED_ORIGINS)
        }
    }
    
    # 数据库统计
    try:
        user_count = db.query(User).count()
        assessment_count = db.query(Assessment).count()
        consultation_count = db.query(Consultation).count()
        
        diagnostics["statistics"] = {
            "total_users": user_count,
            "total_assessments": assessment_count,
            "total_consultations": consultation_count
        }
        
        diagnostics["database"]["status"] = "connected"
        diagnostics["database"]["tables_accessible"] = True
        
    except Exception as e:
        diagnostics["database"]["status"] = "error"
        diagnostics["database"]["error"] = str(e)
        diagnostics["statistics"] = {
            "error": "无法获取统计数据"
        }
    
    return ResponseHandler.success(
        data=diagnostics,
        message="系统诊断完成"
    )

@router.get("/performance")
async def performance_metrics():
    """性能指标"""
    
    try:
        # 系统性能指标
        cpu_times = psutil.cpu_times()
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        boot_time = psutil.boot_time()
        
        performance = {
            "cpu": {
                "percent": psutil.cpu_percent(interval=1),
                "count": psutil.cpu_count(),
                "times": {
                    "user": cpu_times.user,
                    "system": cpu_times.system,
                    "idle": cpu_times.idle
                }
            },
            "memory": {
                "total": memory.total,
                "available": memory.available,
                "percent": memory.percent,
                "used": memory.used,
                "free": memory.free
            },
            "disk": {
                "total": disk.total,
                "used": disk.used,
                "free": disk.free,
                "percent": disk.percent
            },
            "uptime": time.time() - boot_time
        }
        
        return ResponseHandler.success(
            data=performance,
            message="性能指标获取成功"
        )
        
    except Exception as e:
        return ResponseHandler.error(
            message=f"性能指标获取失败: {str(e)}",
            error_code="PERFORMANCE_ERROR"
        )

@router.post("/test/ai")
async def test_ai_service():
    """测试AI服务连接"""
    
    if not settings.OPENAI_API_KEY:
        return ResponseHandler.error(
            message="OpenAI API密钥未配置",
            error_code="AI_NOT_CONFIGURED"
        )
    
    try:
        # 测试OpenAI API调用
        start_time = time.time()
        
        response = await openai.ChatCompletion.acreate(
            model=settings.OPENAI_MODEL,
            messages=[
                {"role": "user", "content": "这是一个测试消息，请简短回复。"}
            ],
            max_tokens=50
        )
        
        end_time = time.time()
        
        return ResponseHandler.success(
            data={
                "api_key_configured": True,
                "model": settings.OPENAI_MODEL,
                "response_time": f"{(end_time - start_time):.2f}秒",
                "test_response": response.choices[0].message.content,
                "status": "success"
            },
            message="AI服务测试成功"
        )
        
    except Exception as e:
        return ResponseHandler.error(
            message=f"AI服务测试失败: {str(e)}",
            error_code="AI_TEST_FAILED"
        )

@router.post("/test/database")
async def test_database_connection(db: Session = Depends(get_db)):
    """测试数据库连接"""
    
    try:
        start_time = time.time()
        
        # 测试基本查询
        result = db.execute("SELECT VERSION()")
        db_version = result.fetchone()[0]
        
        # 测试表访问
        user_count = db.query(User).count()
        
        end_time = time.time()
        
        return ResponseHandler.success(
            data={
                "connection": "successful",
                "version": db_version,
                "response_time": f"{(end_time - start_time):.3f}秒",
                "user_count": user_count,
                "status": "healthy"
            },
            message="数据库连接测试成功"
        )
        
    except Exception as e:
        return ResponseHandler.error(
            message=f"数据库连接测试失败: {str(e)}",
            error_code="DB_TEST_FAILED"
        )
