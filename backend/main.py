"""
情绪管理系统主应用入口
Emotion Management System Main Application Entry
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exceptions import RequestValidationError
from contextlib import asynccontextmanager
import uvicorn
from loguru import logger

from app.api import auth, admin, student, consultation, ai_counseling, system, ai_service_management
from app.core.config import settings
from app.core.database import engine
from app.models import Base
from app.core.exceptions import EmotionManagementException
from app.core.error_handlers import (
    emotion_management_exception_handler,
    http_exception_handler,
    general_exception_handler,
    validation_exception_handler
)

# 创建数据库表
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动事件
    logger.info("情绪管理系统启动成功")
    yield
    # 关闭事件
    logger.info("情绪管理系统关闭")

# 创建FastAPI应用实例
app = FastAPI(
    title="情绪管理系统",
    description="基于大模型的智能心理健康咨询系统",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# 配置CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 挂载静态文件
app.mount("/static", StaticFiles(directory="static"), name="static")

# 注册异常处理器
app.add_exception_handler(EmotionManagementException, emotion_management_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# 注册路由
app.include_router(system.router, prefix="/api/system", tags=["系统"])
app.include_router(ai_service_management.router, prefix="/api/ai-service", tags=["AI服务管理"])
app.include_router(auth.router, prefix="/api/auth", tags=["认证"])
app.include_router(admin.router, prefix="/api/admin", tags=["管理员"])
app.include_router(student.router, prefix="/api/student", tags=["学生"])
app.include_router(consultation.router, prefix="/api/consultation", tags=["咨询"])
app.include_router(ai_counseling.router, prefix="/api/ai", tags=["AI辅导"])

# 旧的事件处理器已替换为lifespan函数

@app.get("/")
async def root():
    """根路径"""
    return {"message": "情绪管理系统API服务", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "healthy", "service": "emotion_management"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
