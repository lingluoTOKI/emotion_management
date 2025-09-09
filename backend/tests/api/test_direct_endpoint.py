#!/usr/bin/env python3
"""
创建一个完全独立的FastAPI应用测试登录
Create a completely independent FastAPI app to test login
"""

from fastapi import FastAPI, Form, HTTPException
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
import sys
import os

# 添加路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# 直接导入配置和安全函数
from app.core.config import settings
from app.core.security import verify_password, create_access_token
from datetime import timedelta

# 创建独立的数据库连接
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

app = FastAPI(title="独立登录测试")

@app.post("/test-login")
async def test_login(username: str = Form(...), password: str = Form(...)):
    """完全独立的登录测试"""
    
    db = SessionLocal()
    try:
        print(f"🔍 尝试登录用户: {username}")
        
        # 直接SQL查询
        sql = text("""
            SELECT id, username, email, hashed_password, role, is_active
            FROM users 
            WHERE username = :username
        """)
        
        result = db.execute(sql, {"username": username})
        user_data = result.fetchone()
        
        print(f"📋 查询结果: {user_data}")
        
        if not user_data:
            raise HTTPException(status_code=401, detail="用户不存在")
        
        print(f"🔑 验证密码...")
        if not verify_password(password, user_data.hashed_password):
            raise HTTPException(status_code=401, detail="密码错误")
        
        print(f"✅ 密码验证成功")
        
        if not user_data.is_active:
            raise HTTPException(status_code=400, detail="账户已禁用")
        
        # 创建token
        print(f"🎫 创建访问令牌...")
        access_token = create_access_token(
            data={"sub": user_data.username, "role": user_data.role},
            expires_delta=timedelta(minutes=30)
        )
        
        print(f"✅ 登录成功!")
        
        return {
            "success": True,
            "access_token": access_token,
            "token_type": "bearer",
            "user_role": user_data.role,
            "username": user_data.username
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ 登录失败: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
        
    finally:
        db.close()

@app.get("/")
async def root():
    return {"message": "独立登录测试服务"}

if __name__ == "__main__":
    import uvicorn
    print("🚀 启动独立登录测试服务...")
    uvicorn.run(app, host="0.0.0.0", port=8002)
