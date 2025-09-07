#!/usr/bin/env python3
"""
测试数据库连接和表结构
"""

import sys
import os
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend'))

from sqlalchemy import create_engine, text
from app.core.config import settings
from app.models.user import User
from sqlalchemy.orm import sessionmaker

def test_database_connection():
    """测试数据库连接"""
    try:
        # 创建引擎
        engine = create_engine(settings.DATABASE_URL)
        
        # 测试连接
        with engine.connect() as conn:
            result = conn.execute(text("SELECT 1"))
            print("✅ 数据库连接成功")
            
            # 检查表结构
            result = conn.execute(text("DESCRIBE users"))
            columns = result.fetchall()
            print("\n📋 users表结构:")
            for col in columns:
                print(f"  - {col[0]}: {col[1]}")
                
            # 测试查询用户
            result = conn.execute(text("SELECT username, email, hashed_password FROM users LIMIT 3"))
            users = result.fetchall()
            print(f"\n👥 用户数据 ({len(users)} 条):")
            for user in users:
                print(f"  - {user[0]}: {user[1]} (密码长度: {len(user[2])})")
                
        # 测试SQLAlchemy模型
        SessionLocal = sessionmaker(bind=engine)
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.username == "student1").first()
            if user:
                print(f"\n✅ SQLAlchemy查询成功: {user.username} ({user.role})")
            else:
                print("\n❌ SQLAlchemy查询失败: 未找到用户")
        except Exception as e:
            print(f"\n❌ SQLAlchemy查询失败: {e}")
        finally:
            db.close()
            
    except Exception as e:
        print(f"❌ 数据库连接失败: {e}")

if __name__ == "__main__":
    test_database_connection()
