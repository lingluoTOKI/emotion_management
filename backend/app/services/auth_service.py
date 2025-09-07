"""
认证服务模块
Authentication Service
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.core.security import verify_password, verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

class SimpleUser:
    """简单用户类"""
    def __init__(self, id, username, email, hashed_password, role, is_active, created_at=None, updated_at=None):
        self.id = id
        self.username = username
        self.email = email
        self.hashed_password = hashed_password
        self.role = role
        self.is_active = is_active
        self.created_at = created_at
        self.updated_at = updated_at

def authenticate_user(db: Session, username: str, password: str) -> SimpleUser:
    """
    验证用户
    """
    try:
        # 使用直接SQL查询
        sql = text("""
            SELECT id, username, email, hashed_password, role, is_active, created_at, updated_at
            FROM users 
            WHERE username = :username
        """)
        
        result = db.execute(sql, {"username": username})
        user_data = result.fetchone()
        
        if not user_data:
            return None
        
        if not verify_password(password, user_data.hashed_password):
            return None
        
        return SimpleUser(
            id=user_data.id,
            username=user_data.username,
            email=user_data.email,
            hashed_password=user_data.hashed_password,
            role=user_data.role,
            is_active=bool(user_data.is_active),
            created_at=user_data.created_at,
            updated_at=user_data.updated_at
        )
        
    except Exception as e:
        print(f"认证错误: {e}")
        return None

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> SimpleUser:
    """
    获取当前用户
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="无法验证凭据",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
    
    username: str = payload.get("sub")
    if username is None:
        raise credentials_exception
    
    try:
        sql = text("""
            SELECT id, username, email, hashed_password, role, is_active, created_at, updated_at
            FROM users 
            WHERE username = :username
        """)
        
        result = db.execute(sql, {"username": username})
        user_data = result.fetchone()
        
        if user_data is None:
            raise credentials_exception
        
        return SimpleUser(
            id=user_data.id,
            username=user_data.username,
            email=user_data.email,
            hashed_password=user_data.hashed_password,
            role=user_data.role,
            is_active=bool(user_data.is_active),
            created_at=user_data.created_at,
            updated_at=user_data.updated_at
        )
        
    except Exception as e:
        print(f"获取用户错误: {e}")
        raise credentials_exception

def get_current_active_user(current_user: SimpleUser = Depends(get_current_user)) -> SimpleUser:
    """
    获取当前活跃用户
    """
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="用户已被禁用")
    return current_user