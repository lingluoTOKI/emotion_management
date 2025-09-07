#!/usr/bin/env python3
"""
直接测试简化认证服务
Direct test of simplified auth service
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.services.simple_auth_service import simple_authenticate_user
from app.core.security import create_access_token
from datetime import timedelta

def test_simple_auth_direct():
    """直接测试简化认证服务"""
    
    print("🧪 直接测试简化认证服务...")
    
    try:
        db = SessionLocal()
        
        # 测试简化认证
        user = simple_authenticate_user(db, "student1", "123456")
        if user:
            print(f"✅ 简化认证成功: {user.username}")
            print(f"   用户ID: {user.id}")
            print(f"   角色: {user.role}")
            print(f"   类型: {type(user)}")
            
            # 测试token创建
            access_token = create_access_token(
                data={"sub": user.username, "role": user.role},
                expires_delta=timedelta(minutes=30)
            )
            print(f"✅ Token创建成功: {access_token[:20]}...")
            
            return {
                "success": True,
                "access_token": access_token,
                "token_type": "bearer",
                "user_role": user.role,
                "username": user.username
            }
        else:
            print("❌ 简化认证失败")
            return {"success": False}
        
        db.close()
        
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    result = test_simple_auth_direct()
    print(f"\n🎯 最终结果: {result}")
