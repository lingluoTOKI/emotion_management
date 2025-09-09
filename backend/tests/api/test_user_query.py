#!/usr/bin/env python3
"""
测试User模型的SQLAlchemy查询
"""

from app.core.database import SessionLocal
from app.models.user import User

def test_user_query():
    """测试User查询"""
    print("测试User模型SQLAlchemy查询...")
    
    try:
        db = SessionLocal()
        
        # 测试查询
        user = db.query(User).filter(User.username == "student1").first()
        
        if user:
            print(f"找到用户: {user.username}, 邮箱: {user.email}, 角色: {user.role}")
        else:
            print("未找到用户")
        
        db.close()
        print("✅ User查询测试成功!")
        
    except Exception as e:
        print(f"❌ User查询测试失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_user_query()
