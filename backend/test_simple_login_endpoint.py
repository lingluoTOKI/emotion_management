#!/usr/bin/env python3
"""
创建一个简单的登录端点进行测试
Create a simple login endpoint for testing
"""

from fastapi import FastAPI, Form, HTTPException
from app.services.simple_auth_service import simple_authenticate_user
from app.core.database import SessionLocal
from app.core.security import create_access_token
from datetime import timedelta

app = FastAPI()

@app.post("/simple-login")
async def simple_login(username: str = Form(...), password: str = Form(...)):
    """简单登录端点"""
    
    db = SessionLocal()
    try:
        # 使用我们的简化认证
        user = simple_authenticate_user(db, username, password)
        if not user:
            raise HTTPException(status_code=401, detail="用户名或密码错误")
        
        # 创建token
        access_token = create_access_token(
            data={"sub": user.username, "role": user.role},
            expires_delta=timedelta(minutes=30)
        )
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_role": user.role,
            "username": user.username
        }
        
    finally:
        db.close()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
