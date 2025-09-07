#!/usr/bin/env python3
"""
调试数据库问题
Debug database issue
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from sqlalchemy import create_engine, text, inspect
from app.core.config import settings
from app.models.user import User
from app.core.database import SessionLocal

def debug_database():
    """调试数据库问题"""
    
    print("🔍 开始调试数据库问题...")
    print(f"📋 数据库URL: {settings.DATABASE_URL}")
    
    # 1. 直接连接数据库检查表结构
    try:
        engine = create_engine(settings.DATABASE_URL)
        with engine.connect() as conn:
            print("\n✅ 直接数据库连接成功")
            
            # 检查表结构
            result = conn.execute(text("DESCRIBE users"))
            columns = result.fetchall()
            
            print("\n📋 数据库中的users表结构:")
            for column in columns:
                print(f"  - {column[0]}: {column[1]}")
            
            # 检查是否有hashed_password列
            column_names = [col[0] for col in columns]
            if 'hashed_password' in column_names:
                print("✅ hashed_password列存在于数据库中")
            else:
                print("❌ hashed_password列不存在于数据库中")
                
    except Exception as e:
        print(f"❌ 直接数据库连接失败: {e}")
        return
    
    # 2. 使用SQLAlchemy检查表结构
    try:
        print("\n🔍 使用SQLAlchemy检查表结构...")
        inspector = inspect(engine)
        columns = inspector.get_columns('users')
        
        print("📋 SQLAlchemy看到的users表结构:")
        for column in columns:
            print(f"  - {column['name']}: {column['type']}")
            
        column_names = [col['name'] for col in columns]
        if 'hashed_password' in column_names:
            print("✅ SQLAlchemy可以看到hashed_password列")
        else:
            print("❌ SQLAlchemy看不到hashed_password列")
            
    except Exception as e:
        print(f"❌ SQLAlchemy检查失败: {e}")
    
    # 3. 测试用户查询
    try:
        print("\n🔍 测试用户查询...")
        db = SessionLocal()
        
        # 尝试查询用户
        user = db.query(User).filter(User.username == "student1").first()
        if user:
            print(f"✅ 找到用户: {user.username}")
            print(f"   用户ID: {user.id}")
            print(f"   邮箱: {user.email}")
            print(f"   角色: {user.role}")
            print(f"   是否有hashed_password属性: {hasattr(user, 'hashed_password')}")
            if hasattr(user, 'hashed_password'):
                print(f"   hashed_password长度: {len(user.hashed_password) if user.hashed_password else 0}")
        else:
            print("❌ 没有找到student1用户")
            
        db.close()
        
    except Exception as e:
        print(f"❌ 用户查询失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_database()
