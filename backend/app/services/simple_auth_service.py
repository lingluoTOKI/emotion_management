"""
简化的认证服务 - 不使用ORM模型
Simplified authentication service without ORM models
"""

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import get_db
from app.core.security import verify_password, verify_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

class SimpleUser:
    """简单用户类，不继承SQLAlchemy Base"""
    def __init__(self, user_data):
        self.id = user_data.id
        self.username = user_data.username
        self.email = user_data.email
        self.hashed_password = user_data.hashed_password
        self.role = user_data.role
        self.is_active = bool(user_data.is_active)
        self.created_at = user_data.created_at
        self.updated_at = user_data.updated_at

def simple_authenticate_user(db: Session, username: str, password: str) -> SimpleUser:
    """
    简化的用户验证
    """
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
    
    return SimpleUser(user_data)

def simple_get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
) -> SimpleUser:
    """
    简化的获取当前用户
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
    
    sql = text("""
        SELECT id, username, email, hashed_password, role, is_active, created_at, updated_at
        FROM users 
        WHERE username = :username
    """)
    
    result = db.execute(sql, {"username": username})
    user_data = result.fetchone()
    
    if user_data is None:
        raise credentials_exception
    
    return SimpleUser(user_data)
