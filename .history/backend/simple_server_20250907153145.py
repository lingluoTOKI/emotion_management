#!/usr/bin/env python3
"""
最简单的登录服务器 - 独立运行，不依赖复杂的模块结构
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
import mysql.connector
import uvicorn

app = FastAPI(title="简单登录服务")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据库连接配置
DB_CONFIG = {
    'host': 'localhost',
    'user': 'emotion_user',
    'password': 'emotion123',
    'database': 'emotion_management',
    'charset': 'utf8mb4'
}

def get_db_connection():
    """获取数据库连接"""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        return connection
    except Exception as e:
        print(f"数据库连接失败: {e}")
        return None

@app.get("/")
async def root():
    return {"message": "简单登录服务运行中", "status": "ok"}

@app.get("/health")
async def health():
    return {"status": "healthy", "service": "simple_login"}

@app.post("/login")
async def simple_login(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    最简单的登录端点
    """
    try:
        print(f"🔐 登录请求: {form_data.username}")
        
        # 获取数据库连接
        connection = get_db_connection()
        if not connection:
            raise HTTPException(status_code=500, detail="数据库连接失败")
        
        cursor = connection.cursor(dictionary=True)
        
        # 执行查询
        query = """
        SELECT id, username, email, hashed_password, role, is_active
        FROM users
        WHERE username = %s AND is_active = 1
        """
        
        cursor.execute(query, (form_data.username,))
        user_data = cursor.fetchone()
        
        cursor.close()
        connection.close()
        
        if not user_data:
            print(f"❌ 用户不存在: {form_data.username}")
            raise HTTPException(status_code=401, detail="用户名或密码错误")
        
        print(f"✅ 找到用户: {user_data['username']}")
        print(f"📊 用户角色: {user_data['role']}")
        print(f"🔑 存储的密码: {user_data['hashed_password'][:10]}...")
        
        # 验证密码 - 明文比较（测试用）
        if user_data['hashed_password'] == form_data.password:
            print("🔓 密码验证成功")
            
            return {
                "access_token": "test_token_" + user_data['username'],
                "token_type": "bearer",
                "user_role": user_data['role'],
                "username": user_data['username'],
                "message": "登录成功"
            }
        else:
            print(f"❌ 密码错误: 期望={user_data['hashed_password']}, 实际={form_data.password}")
            raise HTTPException(status_code=401, detail="用户名或密码错误")
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"💥 登录错误: {e}")
        raise HTTPException(status_code=500, detail=f"登录失败: {str(e)}")

if __name__ == "__main__":
    print("🚀 启动简单登录服务...")
    print("📍 端口: 8001")
    print("🔗 健康检查: http://localhost:8001/health")
    print("🔐 登录端点: http://localhost:8001/login")
    
    uvicorn.run(
        "simple_server:app",
        host="0.0.0.0",
        port=8001,
        reload=False,
        log_level="info"
    )
