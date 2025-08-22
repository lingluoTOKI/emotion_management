"""
统一异常处理模块
Unified Exception Handling Module
"""

from fastapi import HTTPException, status
from typing import Any, Dict, Optional


class EmotionManagementException(Exception):
    """情绪管理系统基础异常类"""
    
    def __init__(self, message: str, error_code: str = None, details: Dict[str, Any] = None):
        self.message = message
        self.error_code = error_code
        self.details = details or {}
        super().__init__(self.message)


class AuthenticationError(EmotionManagementException):
    """认证错误"""
    
    def __init__(self, message: str = "认证失败"):
        super().__init__(message, "AUTH_ERROR")


class AuthorizationError(EmotionManagementException):
    """授权错误"""
    
    def __init__(self, message: str = "权限不足"):
        super().__init__(message, "AUTHZ_ERROR")


class ValidationError(EmotionManagementException):
    """数据验证错误"""
    
    def __init__(self, message: str, field: str = None):
        details = {"field": field} if field else {}
        super().__init__(message, "VALIDATION_ERROR", details)


class DatabaseError(EmotionManagementException):
    """数据库操作错误"""
    
    def __init__(self, message: str = "数据库操作失败"):
        super().__init__(message, "DB_ERROR")


class AIServiceError(EmotionManagementException):
    """AI服务错误"""
    
    def __init__(self, message: str = "AI服务调用失败"):
        super().__init__(message, "AI_ERROR")


class RiskAssessmentError(EmotionManagementException):
    """风险评估错误"""
    
    def __init__(self, message: str = "风险评估失败"):
        super().__init__(message, "RISK_ERROR")


class ResourceNotFoundError(EmotionManagementException):
    """资源未找到错误"""
    
    def __init__(self, resource: str, identifier: str = None):
        message = f"{resource}未找到"
        if identifier:
            message += f": {identifier}"
        super().__init__(message, "NOT_FOUND")


class BusinessLogicError(EmotionManagementException):
    """业务逻辑错误"""
    
    def __init__(self, message: str):
        super().__init__(message, "BUSINESS_ERROR")


def create_http_exception(
    exc: EmotionManagementException,
    status_code: int = status.HTTP_400_BAD_REQUEST
) -> HTTPException:
    """将自定义异常转换为HTTP异常"""
    
    # 根据异常类型确定状态码
    if isinstance(exc, AuthenticationError):
        status_code = status.HTTP_401_UNAUTHORIZED
    elif isinstance(exc, AuthorizationError):
        status_code = status.HTTP_403_FORBIDDEN
    elif isinstance(exc, ResourceNotFoundError):
        status_code = status.HTTP_404_NOT_FOUND
    elif isinstance(exc, ValidationError):
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif isinstance(exc, (DatabaseError, AIServiceError)):
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    
    detail = {
        "message": exc.message,
        "error_code": exc.error_code,
        "details": exc.details
    }
    
    return HTTPException(status_code=status_code, detail=detail)


def handle_database_error(func):
    """数据库操作装饰器"""
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            raise DatabaseError(f"数据库操作失败: {str(e)}")
    return wrapper


def handle_ai_service_error(func):
    """AI服务调用装饰器"""
    async def wrapper(*args, **kwargs):
        try:
            return await func(*args, **kwargs)
        except Exception as e:
            raise AIServiceError(f"AI服务调用失败: {str(e)}")
    return wrapper


class ErrorMessages:
    """错误消息常量"""
    
    # 认证相关
    INVALID_CREDENTIALS = "用户名或密码错误"
    TOKEN_EXPIRED = "令牌已过期"
    TOKEN_INVALID = "无效的令牌"
    ACCESS_DENIED = "访问被拒绝"
    
    # 用户相关
    USER_NOT_FOUND = "用户不存在"
    USER_ALREADY_EXISTS = "用户已存在"
    USER_INACTIVE = "用户已被禁用"
    
    # 评估相关
    ASSESSMENT_NOT_FOUND = "评估记录不存在"
    ASSESSMENT_ALREADY_COMPLETED = "评估已完成"
    ASSESSMENT_IN_PROGRESS = "评估正在进行中"
    
    # 咨询相关
    CONSULTATION_NOT_FOUND = "咨询记录不存在"
    COUNSELOR_NOT_AVAILABLE = "咨询师不可用"
    APPOINTMENT_CONFLICT = "预约时间冲突"
    
    # AI服务相关
    AI_SERVICE_UNAVAILABLE = "AI服务暂时不可用"
    AI_RESPONSE_ERROR = "AI回复生成失败"
    
    # 通用错误
    INVALID_INPUT = "输入数据无效"
    OPERATION_FAILED = "操作失败"
    INTERNAL_ERROR = "服务器内部错误"
