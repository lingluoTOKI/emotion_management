"""
简单独立的认证API - 完全避开ORM冲突
Simple Standalone Authentication API - Completely Avoiding ORM Conflicts
"""

from fastapi import APIRouter, HTTPException, status, Form
import mysql.connector
import bcrypt
import jwt
from datetime import datetime, timedelta
from typing import Dict, Any

router = APIRouter()

# 数据库连接配置
DB_CONFIG = {
    'host': 'localhost',
    'user': 'emotion_user',
    'password': 'emotion123',
    'database': 'emotion_management'
}

# JWT配置
SECRET_KEY = "your-secret-key-here"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

def create_jwt_token(username: str, role: str) -> str:
    """创建JWT令牌"""
    payload = {
        "sub": username,
        "role": role,
        "exp": datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """验证密码"""
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

@router.post("/login")
async def simple_login(
    username: str = Form(...),
    password: str = Form(...)
) -> Dict[str, Any]:
    """
    简单登录端点 - 完全独立实现
    """
    conn = None
    try:
        # 连接数据库
        conn = mysql.connector.connect(**DB_CONFIG)
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
        if not verify_password(password, user_data[3]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户名或密码错误"
            )
        
        # 检查账户状态
        if not user_data[5]:  # is_active
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="账户已被禁用"
            )
        
        # 创建JWT令牌
        access_token = create_jwt_token(user_data[1], user_data[4])
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_role": user_data[4],  # role
            "username": user_data[1]    # username
        }
        
    except mysql.connector.Error as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"数据库连接错误: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"登录失败: {str(e)}"
        )
    finally:
        if conn and conn.is_connected():
            conn.close()

@router.get("/test")
async def test_connection():
    """测试数据库连接"""
    conn = None
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        cursor = conn.cursor()
        cursor.execute("SELECT COUNT(*) FROM users")
        count = cursor.fetchone()[0]
        
        return {
            "status": "success",
            "message": f"数据库连接正常，共有 {count} 个用户"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"数据库连接失败: {str(e)}"
        )
    finally:
        if conn and conn.is_connected():
            conn.close()

@router.post("/verify-token")
async def verify_token(token: str = Form(...)):
    """验证JWT令牌"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        role = payload.get("role")
        
        if not username:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="无效的令牌"
            )
        
        return {
            "valid": True,
            "username": username,
            "role": role
        }
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="令牌已过期"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的令牌"
        )
