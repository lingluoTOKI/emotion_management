#!/usr/bin/env python3
"""
逐步测试认证过程
Step by step authentication test
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.services.auth_service import authenticate_user
from app.core.security import create_access_token
from datetime import timedelta

def test_auth_step_by_step():
    """逐步测试认证过程"""
    
    print("🔍 逐步测试认证过程...")
    
    # 步骤1: 测试数据库连接
    try:
        print("\n1️⃣ 测试数据库连接...")
        db = SessionLocal()
        print("✅ 数据库连接成功")
        
        # 步骤2: 测试authenticate_user函数
        print("\n2️⃣ 测试authenticate_user函数...")
        user = authenticate_user(db, "student1", "123456")
        if user:
            print(f"✅ authenticate_user成功: {user.username}")
            print(f"   用户ID: {user.id}")
            print(f"   角色: {user.role}")
        else:
            print("❌ authenticate_user失败")
            return
        
        # 步骤3: 测试token创建
        print("\n3️⃣ 测试token创建...")
        access_token_expires = timedelta(minutes=30)
        access_token = create_access_token(
            data={"sub": user.username, "role": user.role},
            expires_delta=access_token_expires
        )
        print(f"✅ Token创建成功: {access_token[:20]}...")
        
        # 步骤4: 构建登录响应
        print("\n4️⃣ 构建登录响应...")
        response = {
            "access_token": access_token,
            "token_type": "bearer",
            "user_role": user.role,
            "username": user.username
        }
        print(f"✅ 登录响应构建成功: {response}")
        
        db.close()
        
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_auth_step_by_step()
