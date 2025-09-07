"""
原始SQL认证API - 完全绕过SQLAlchemy ORM
使用原始SQL查询和mysql.connector
"""
import mysql.connector
from fastapi import APIRouter, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Depends
from app.core.security import create_access_token
import bcrypt

router = APIRouter()

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

@router.post("/login-raw")
async def login_raw(form_data: OAuth2PasswordRequestForm = Depends()):
    """
    原始SQL登录 - 完全绕过ORM
    """
    try:
        print(f"🔐 原始SQL登录请求: {form_data.username}")
        
        # 获取数据库连接
        connection = get_db_connection()
        if not connection:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="数据库连接失败"
            )
        
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
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户名或密码错误",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        print(f"✅ 找到用户: {user_data['username']}")
        print(f"📊 用户角色: {user_data['role']}")
        
        # 验证密码 - 支持两种模式
        password_valid = False
        stored_password = user_data['hashed_password']
        
        # 模式1: 明文密码比较（测试用）
        if stored_password == form_data.password:
            password_valid = True
            print("🔓 明文密码验证成功")
        
        # 模式2: bcrypt哈希验证
        elif stored_password.startswith('$2b$'):
            try:
                password_valid = bcrypt.checkpw(
                    form_data.password.encode('utf-8'),
                    stored_password.encode('utf-8')
                )
                if password_valid:
                    print("🔐 哈希密码验证成功")
            except Exception as e:
                print(f"⚠️ bcrypt验证失败: {e}")
        
        if not password_valid:
            print(f"❌ 密码错误: {form_data.username}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="用户名或密码错误",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # 创建访问令牌
        access_token = create_access_token(data={"sub": user_data['username']})
        
        print(f"🎉 登录成功: {user_data['username']} ({user_data['role']})")
        
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user_role": user_data['role'],
            "username": user_data['username']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"💥 登录错误: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"登录失败: {str(e)}"
        )
