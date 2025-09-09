#!/usr/bin/env python3
"""
测试SQLAlchemy连接和查询
"""

from app.core.database import engine, SessionLocal
from app.models.user import User
from sqlalchemy.orm import Session

def test_sqlalchemy_connection():
    """测试SQLAlchemy连接"""
    print("测试SQLAlchemy连接...")
    
    try:
        # 创建会话
        db = SessionLocal()
        
        # 测试查询
        users = db.query(User).limit(5).all()
        
        print(f"查询到 {len(users)} 个用户:")
        for user in users:
            print(f"  ID: {user.id}, 用户名: {user.username}, 邮箱: {user.email}, 角色: {user.role}")
        
        db.close()
        print("✅ SQLAlchemy连接测试成功!")
        
    except Exception as e:
        print(f"❌ SQLAlchemy连接测试失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_sqlalchemy_connection()
