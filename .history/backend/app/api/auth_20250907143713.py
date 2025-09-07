"""
用户认证API路由
Authentication API Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status, Form
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
from typing import Optional

from app.core.database import get_db
from app.core.security import create_access_token, get_password_hash
from app.core.config import settings
# from app.models.user import User, UserRole  # 暂时注释掉避免ORM冲突
from app.schemas.auth import Token, UserLogin, UserCreate, UserResponse
from app.services.auth_service import authenticate_user, get_current_user

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

@router.post("/register", response_model=UserResponse)
async def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """
    用户注册
    支持学生、咨询师、管理员注册
    """
    from sqlalchemy import text
    
    try:
        # 检查用户名是否已存在
        check_username_sql = text("SELECT id FROM users WHERE username = :username")
        existing_user = db.execute(check_username_sql, {"username": user_data.username}).fetchone()
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="用户名已存在"
            )
        
        # 检查邮箱是否已存在
        check_email_sql = text("SELECT id FROM users WHERE email = :email")
        existing_email = db.execute(check_email_sql, {"email": user_data.email}).fetchone()
        if existing_email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="邮箱已被注册"
            )
        
        # 创建新用户
        hashed_password = get_password_hash(user_data.password)
        insert_sql = text("""
            INSERT INTO users (username, email, hashed_password, role, is_active, created_at)
            VALUES (:username, :email, :hashed_password, :role, :is_active, NOW())
        """)
        
        result = db.execute(insert_sql, {
            "username": user_data.username,
            "email": user_data.email,
            "hashed_password": hashed_password,
            "role": user_data.role.upper(),  # 确保角色是大写
            "is_active": True
        })
        
        db.commit()
        
        # 获取新创建的用户ID
        user_id = result.lastrowid
        
        return UserResponse(
            id=user_id,
            username=user_data.username,
            email=user_data.email,
            role=user_data.role,
            is_active=True
        )
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"注册失败: {str(e)}"
        )

@router.post("/login", response_model=Token)
async def login(
    username: str = Form(...),
    password: str = Form(...)
):
    """
    用户登录 - 使用独立数据库连接避免ORM冲突
    返回JWT访问令牌
    """
    from sqlalchemy import create_engine, text
    from sqlalchemy.orm import sessionmaker
    from app.core.security import verify_password, create_access_token
    from datetime import timedelta
    
    # 创建独立的数据库连接，避免ORM冲突
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    db = SessionLocal()
    try:
        # 直接SQL查询
        sql = text("""
            SELECT id, username, email, hashed_password, role, is_active
            FROM users 
            WHERE username = :username
        """)
        
        result = db.execute(sql, {"username": username})
        user_data = result.fetchone()
        
        if not user_data or not verify_password(password, user_data.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户名或密码错误",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user_data.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="账户已被禁用"
            )
        
        # 创建访问令牌
        access_token = create_access_token(
            data={"sub": user_data.username, "role": user_data.role},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_role": user_data.role,
            "username": user_data.username
        }
        
    finally:
        db.close()

@router.post("/login-simple")
async def login_simple(
    username: str = Form(...),
    password: str = Form(...)
):
    """
    简单登录端点 - 完全独立，不使用任何ORM
    """
    import mysql.connector
    import bcrypt
    import jwt
    from datetime import datetime, timedelta
    
    try:
        # 直接使用mysql连接，避免SQLAlchemy
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
        
        # 验证密码
        if not bcrypt.checkpw(password.encode('utf-8'), user_data[3].encode('utf-8')):
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
        payload = {
            "sub": user_data[1],  # username
            "role": user_data[4],  # role
            "exp": datetime.utcnow() + timedelta(minutes=30)
        }
        
        access_token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_role": user_data[4],  # role
            "username": user_data[1]    # username
        }
        
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"数据库错误: {str(e)}"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"登录失败: {str(e)}"
        )
    finally:
        if 'conn' in locals():
            conn.close()

@router.post("/login-fixed")
async def login_fixed(
    username: str = Form(...),
    password: str = Form(...)
):
    """
    修复版登录端点 - 使用独立数据库连接
    """
    from sqlalchemy import create_engine, text
    from sqlalchemy.orm import sessionmaker
    from app.core.security import verify_password, create_access_token
    from datetime import timedelta
    
    # 创建独立的数据库连接，避免主应用的问题
    engine = create_engine(settings.DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    db = SessionLocal()
    try:
        # 直接SQL查询
        sql = text("""
            SELECT id, username, email, hashed_password, role, is_active
            FROM users 
            WHERE username = :username
        """)
        
        result = db.execute(sql, {"username": username})
        user_data = result.fetchone()
        
        if not user_data or not verify_password(password, user_data.hashed_password):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户名或密码错误",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        if not user_data.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="账户已被禁用"
            )
        
        # 创建访问令牌
        access_token = create_access_token(
            data={"sub": user_data.username, "role": user_data.role},
            expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_role": user_data.role,
            "username": user_data.username
        }
        
    finally:
        db.close()

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
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
async def refresh_token(current_user = Depends(get_current_user)):
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
