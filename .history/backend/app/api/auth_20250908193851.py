"""
用户认证API路由
Authentication API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, Form
import mysql.connector
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional

from app.core.database import get_db
from app.core.security import create_access_token, get_password_hash, verify_password
from app.core.config import settings
from app.models.user import User, UserRole
from app.schemas.auth import Token, UserLogin, UserCreate, UserResponse
from app.services.auth_service import authenticate_user, get_current_user

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate):
    """
    用户注册 - 使用直接MySQL连接避免ORM冲突
    """
    import mysql.connector
    
    try:
        # 直接使用MySQL连接
        conn = mysql.connector.connect(
            host='localhost',
            user='emotion_user',
            password='emotion123',
            database='emotion_management'
        )
        
        cursor = conn.cursor()
        
        # 检查用户名是否已存在
        cursor.execute("SELECT id FROM users WHERE username = %s", (user_data.username,))
        if cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用户名已存在"
            )
        
        # 检查邮箱是否已存在
        cursor.execute("SELECT id FROM users WHERE email = %s", (user_data.email,))
        if cursor.fetchone():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被注册"
            )
        
        # 创建新用户（存储明文密码）
        cursor.execute("""
            INSERT INTO users (username, email, hashed_password, role, is_active)
            VALUES (%s, %s, %s, %s, %s)
        """, (
            user_data.username,
            user_data.email,
            user_data.password,  # 存储明文密码
            user_data.role.value if hasattr(user_data.role, 'value') else user_data.role,
            True
        ))
        
        user_id = cursor.lastrowid
        conn.commit()
        
        return UserResponse(
            id=user_id,
            username=user_data.username,
            email=user_data.email,
            role=user_data.role,
            is_active=True
        )
        
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"数据库错误: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"注册失败: {str(e)}"
        )
    finally:
        if 'conn' in locals():
            conn.close()

@router.post("/login")
async def login(
    username: str = Form(...),
    password: str = Form(...)
):
    """
    用户登录 - 完全独立实现，避免ORM冲突
    """
    import mysql.connector
    import bcrypt
    
    try:
        # 直接使用MySQL连接，完全避免SQLAlchemy
        conn = mysql.connector.connect(
            host='localhost',
            user='emotion_user',
            password='emotion123',
            database='emotion_management'
        )
        
        cursor = conn.cursor()
        
        # 查询用户
        cursor.execute("""
            SELECT id, username, email, hashed_password, role, is_active
            FROM users 
            WHERE username = %s
        """, (username,))
        
        user_data = cursor.fetchone()
        
        if not user_data:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户名或密码错误"
            )
        
        # 直接比较明文密码
        if password != user_data[3]:  # hashed_password字段现在存储明文密码
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户名或密码错误"
            )
        
        if not user_data[5]:  # is_active
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="账户已被禁用"
            )
        
        # 创建JWT令牌
        access_token = create_access_token(
            data={"sub": user_data[1], "role": user_data[4]},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_role": user_data[4].lower(),  # role转换为小写
            "username": user_data[1]    # username
        }
        
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"数据库错误: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"登录失败: {str(e)}"
        )
    finally:
        if 'conn' in locals():
            conn.close()

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """
    获取当前用户信息
    """
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        email=current_user.email,
        role=current_user.role,
        is_active=current_user.is_active
    )

@router.post("/logout")
async def logout():
    """
    用户登出
    注意：JWT令牌在客户端删除，服务器端无法真正"登出"
    """
    return {"message": "登出成功"}

@router.post("/refresh")
async def refresh_token(current_user: User = Depends(get_current_user)):
    """
    刷新访问令牌
    """
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": current_user.username, "role": current_user.role},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }