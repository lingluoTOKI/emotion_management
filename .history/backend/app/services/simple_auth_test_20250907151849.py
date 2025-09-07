"""
简化认证服务 - 仅用于测试
注意：使用明文密码，不安全，仅用于开发测试
"""
from sqlalchemy.orm import Session
from sqlalchemy import text
from typing import Optional
from pydantic import BaseModel

class SimpleUser(BaseModel):
    id: int
    username: str
    email: Optional[str] = None
    role: str
    is_active: bool = True

def authenticate_user_simple(db: Session, username: str, password: str) -> Optional[SimpleUser]:
    """
    简化用户认证 - 使用明文密码比较
    注意：仅用于测试！
    """
    try:
        sql = text("""
            SELECT id, username, email, hashed_password, role, is_active
            FROM users
            WHERE username = :username AND is_active = 1
        """)
        result = db.execute(sql, {"username": username})
        user_data = result.fetchone()
        
        if not user_data:
            print(f"用户不存在: {username}")
            return None
        
        # 明文密码比较（仅用于测试）
        if user_data.hashed_password != password:
            print(f"密码错误: {username}")
            return None
        
        return SimpleUser(
            id=user_data.id,
            username=user_data.username,
            email=user_data.email,
            role=user_data.role,
            is_active=user_data.is_active
        )
        
    except Exception as e:
        print(f"认证错误: {e}")
        return None
