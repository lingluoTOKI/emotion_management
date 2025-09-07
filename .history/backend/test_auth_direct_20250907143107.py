#!/usr/bin/env python3
"""
直接测试认证服务
"""

from app.core.database import get_db
from app.services.auth_service import authenticate_user

def test_auth():
    """测试认证服务"""
    db = next(get_db())
    try:
        print("测试认证服务...")
        user = authenticate_user(db, "student1", "123456")
        if user:
            print(f"认证成功: {user.username} - {user.role}")
        else:
            print("认证失败")
    except Exception as e:
        print(f"认证错误: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    test_auth()
