"""
认证相关的数据模型
Authentication Schemas
"""

from pydantic import BaseModel, EmailStr
from typing import Optional
from app.models.user import UserRole

class UserBase(BaseModel):
    """用户基础模型"""
    username: str
    email: EmailStr

class UserCreate(UserBase):
    """用户创建模型"""
    password: str
    role: UserRole

class UserLogin(BaseModel):
    """用户登录模型"""
    username: str
    password: str

class UserResponse(UserBase):
    """用户响应模型"""
    id: int
    role: UserRole
    is_active: bool

    class Config:
        from_attributes = True

class Token(BaseModel):
    """令牌模型"""
    access_token: str
    token_type: str
    user_role: UserRole
    username: str

class TokenData(BaseModel):
    """令牌数据模型"""
    username: Optional[str] = None
    role: Optional[UserRole] = None
