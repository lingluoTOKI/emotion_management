"""
测试认证API - 使用明文密码
注意：仅用于开发测试！
"""
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.simple_auth_test import authenticate_user_simple
from app.core.security import create_access_token

router = APIRouter()

@router.post("/login-test")
async def login_test(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
):
    """
    测试登录端点 - 使用明文密码
    注意：仅用于开发测试！
    """
    try:
        print(f"测试登录请求: {form_data.username}")
        
        # 使用简化认证
        user = authenticate_user_simple(db, form_data.username, form_data.password)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户名或密码错误",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 创建访问令牌
        access_token = create_access_token(data={"sub": user.username})
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_role": user.role,
            "username": user.username
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"登录错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"登录失败: {str(e)}"
        )
