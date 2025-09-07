"""
全局错误处理器
Global Error Handlers
"""

from fastapi import Request, HTTPException, status
from fastapi.responses import JSONResponse
from loguru import logger
import traceback
from typing import Any, Dict

from .exceptions import (
    EmotionManagementException,
    create_http_exception,
    ErrorMessages
)

def add_cors_headers(response: JSONResponse, request: Request) -> JSONResponse:
    """为响应添加CORS头"""
    # 简单粗暴：总是添加CORS头，允许所有来源
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, Accept, Origin, User-Agent"
    
    return response


async def emotion_management_exception_handler(
    request: Request, 
    exc: EmotionManagementException
) -> JSONResponse:
    """处理自定义异常"""
    
    # 记录错误日志
    logger.error(f"业务异常: {exc.message} | 错误代码: {exc.error_code} | 路径: {request.url}")
    
    # 根据异常类型确定状态码
    status_code = status.HTTP_400_BAD_REQUEST
    if exc.error_code == "AUTH_ERROR":
        status_code = status.HTTP_401_UNAUTHORIZED
    elif exc.error_code == "AUTHZ_ERROR":
        status_code = status.HTTP_403_FORBIDDEN
    elif exc.error_code == "NOT_FOUND":
        status_code = status.HTTP_404_NOT_FOUND
    elif exc.error_code == "VALIDATION_ERROR":
        status_code = status.HTTP_422_UNPROCESSABLE_ENTITY
    elif exc.error_code in ["DB_ERROR", "AI_ERROR", "RISK_ERROR"]:
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
    
    response = JSONResponse(
        status_code=status_code,
        content={
            "success": False,
            "message": exc.message,
            "error_code": exc.error_code,
            "details": exc.details,
            "path": str(request.url)
        }
    )
    return add_cors_headers(response, request)


async def http_exception_handler(
    request: Request, 
    exc: HTTPException
) -> JSONResponse:
    """处理HTTP异常"""
    
    logger.warning(f"HTTP异常: {exc.status_code} - {exc.detail} | 路径: {request.url}")
    
    response = JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "message": exc.detail if isinstance(exc.detail, str) else "请求处理失败",
            "error_code": f"HTTP_{exc.status_code}",
            "details": exc.detail if isinstance(exc.detail, dict) else {},
            "path": str(request.url)
        }
    )
    return add_cors_headers(response, request)


async def general_exception_handler(
    request: Request, 
    exc: Exception
) -> JSONResponse:
    """处理一般异常"""
    
    # 记录详细的错误信息
    logger.error(f"未处理异常: {str(exc)} | 路径: {request.url}")
    logger.error(f"异常堆栈: {traceback.format_exc()}")
    
    response = JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "message": ErrorMessages.INTERNAL_ERROR,
            "error_code": "INTERNAL_ERROR",
            "details": {
                "exception_type": type(exc).__name__,
                "exception_message": str(exc)
            },
            "path": str(request.url)
        }
    )
    return add_cors_headers(response, request)


async def validation_exception_handler(
    request: Request, 
    exc: Exception
) -> JSONResponse:
    """处理数据验证异常"""
    
    logger.warning(f"数据验证异常: {str(exc)} | 路径: {request.url}")
    
    # 处理Pydantic验证错误
    if hasattr(exc, 'errors'):
        errors = []
        for error in exc.errors():
            errors.append({
                "field": " -> ".join(str(loc) for loc in error.get("loc", [])),
                "message": error.get("msg", ""),
                "type": error.get("type", "")
            })
        
        response = JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "message": "数据验证失败",
                "error_code": "VALIDATION_ERROR",
                "details": {"errors": errors},
                "path": str(request.url)
            }
        )
        return add_cors_headers(response, request)
    
    response = JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "message": ErrorMessages.INVALID_INPUT,
            "error_code": "VALIDATION_ERROR",
            "details": {"message": str(exc)},
            "path": str(request.url)
        }
    )
    return add_cors_headers(response, request)


def create_success_response(
    data: Any = None,
    message: str = "操作成功",
    **kwargs
) -> Dict[str, Any]:
    """创建成功响应"""
    
    response = {
        "success": True,
        "message": message,
        "data": data
    }
    
    # 添加额外字段
    response.update(kwargs)
    
    return response


def create_error_response(
    message: str,
    error_code: str = "ERROR",
    details: Dict[str, Any] = None,
    **kwargs
) -> Dict[str, Any]:
    """创建错误响应"""
    
    response = {
        "success": False,
        "message": message,
        "error_code": error_code,
        "details": details or {}
    }
    
    # 添加额外字段
    response.update(kwargs)
    
    return response


class ResponseHandler:
    """响应处理器类"""
    
    @staticmethod
    def success(
        data: Any = None,
        message: str = "操作成功",
        **kwargs
    ) -> JSONResponse:
        """返回成功响应"""
        return JSONResponse(
            status_code=status.HTTP_200_OK,
            content=create_success_response(data, message, **kwargs)
        )
    
    @staticmethod
    def created(
        data: Any = None,
        message: str = "创建成功",
        **kwargs
    ) -> JSONResponse:
        """返回创建成功响应"""
        return JSONResponse(
            status_code=status.HTTP_201_CREATED,
            content=create_success_response(data, message, **kwargs)
        )
    
    @staticmethod
    def error(
        message: str,
        status_code: int = status.HTTP_400_BAD_REQUEST,
        error_code: str = "ERROR",
        details: Dict[str, Any] = None,
        **kwargs
    ) -> JSONResponse:
        """返回错误响应"""
        return JSONResponse(
            status_code=status_code,
            content=create_error_response(message, error_code, details, **kwargs)
        )
    
    @staticmethod
    def not_found(
        message: str = "资源未找到",
        **kwargs
    ) -> JSONResponse:
        """返回404响应"""
        return ResponseHandler.error(
            message=message,
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="NOT_FOUND",
            **kwargs
        )
    
    @staticmethod
    def unauthorized(
        message: str = "未授权访问",
        **kwargs
    ) -> JSONResponse:
        """返回401响应"""
        return ResponseHandler.error(
            message=message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="UNAUTHORIZED",
            **kwargs
        )
    
    @staticmethod
    def forbidden(
        message: str = "权限不足",
        **kwargs
    ) -> JSONResponse:
        """返回403响应"""
        return ResponseHandler.error(
            message=message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="FORBIDDEN",
            **kwargs
        )
