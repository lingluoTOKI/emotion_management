#!/usr/bin/env python3
"""
直接使用SQL测试认证
Test authentication using direct SQL
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import text
from app.core.database import SessionLocal
from app.core.security import verify_password

def test_direct_sql_auth():
    """使用直接SQL测试认证"""
    
    print("🧪 使用直接SQL测试认证...")
    
    try:
        db = SessionLocal()
        
        # 直接SQL查询用户
        sql = text("""
            SELECT id, username, email, hashed_password, role, is_active 
            FROM users 
            WHERE username = :username
        """)
        
        result = db.execute(sql, {"username": "student1"})
        user = result.fetchone()
        
        if user:
            print(f"✅ 找到用户: {user.username}")
            print(f"   ID: {user.id}")
            print(f"   邮箱: {user.email}")
            print(f"   角色: {user.role}")
            print(f"   激活状态: {user.is_active}")
            print(f"   密码哈希: {user.hashed_password[:20]}...")
            
            # 测试密码验证
            if verify_password("123456", user.hashed_password):
                print("✅ 密码验证成功!")
                
                # 模拟创建token
                from app.core.security import create_access_token
                from datetime import timedelta
                
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
                print("❌ 密码验证失败")
                return {"success": False, "error": "密码错误"}
        else:
            print("❌ 用户不存在")
            return {"success": False, "error": "用户不存在"}
            
        db.close()
        
    except Exception as e:
        print(f"❌ 直接SQL认证失败: {e}")
        import traceback
        traceback.print_exc()
        return {"success": False, "error": str(e)}

if __name__ == "__main__":
    result = test_direct_sql_auth()
    print(f"\n🎯 最终结果: {result}")
