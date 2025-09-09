#!/usr/bin/env python3
"""
简单的登录测试API
Simple login test API
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

app = FastAPI()

# 添加CORS中间件
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/auth/login")
async def simple_login(request: LoginRequest):
    """简化的登录API用于测试"""
    print(f"收到登录请求: {request.username}")
    
    # 简单验证
    if request.username == "student1" and request.password == "123456":
        return {
            "access_token": "test_token_123",
            "token_type": "bearer",
            "user_role": "STUDENT",
            "username": "student1"
        }
    else:
        raise HTTPException(status_code=401, detail="用户名或密码错误")

@app.get("/health")
async def health():
    return {"status": "ok"}

if __name__ == "__main__":
    print("🚀 启动简化登录测试服务器...")
    uvicorn.run(app, host="0.0.0.0", port=8001)

