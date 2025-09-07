#!/usr/bin/env python3
"""
快速登录服务器 - 简单可靠
Quick Login Server - Simple and Reliable
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI()

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginData(BaseModel):
    username: str
    password: str

@app.post("/api/auth/login")
async def login(data: LoginData):
    """简单登录端点"""
    print(f"🔐 收到登录请求: {data.username}")
    
    # 简单的用户验证
    valid_users = {
        "student1": {"password": "123456", "role": "STUDENT"},
        "admin1": {"password": "admin123", "role": "ADMIN"},
        "counselor1": {"password": "123456", "role": "COUNSELOR"}
    }
    
    if data.username in valid_users:
        user_info = valid_users[data.username]
        if data.password == user_info["password"]:
            print(f"✅ 登录成功: {data.username}")
            return {
                "access_token": f"token_{data.username}_{int(__import__('time').time())}",
                "token_type": "bearer",
                "user_role": user_info["role"],
                "username": data.username
            }
    
    print(f"❌ 登录失败: {data.username}")
    return {"error": "用户名或密码错误"}, 401

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "emotion_management"}

@app.get("/")
async def root():
    return {"message": "快速登录服务器运行中", "status": "ok"}

if __name__ == "__main__":
    print("🚀 启动快速登录服务器...")
    uvicorn.run(app, host="0.0.0.0", port=8000)

