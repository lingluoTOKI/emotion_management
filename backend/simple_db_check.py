#!/usr/bin/env python3
"""
简单的数据库检查和修复
Simple database check and fix
"""

from sqlalchemy import text
from app.core.database import engine

def check_and_fix_database():
    """检查并修复数据库"""
    
    try:
        with engine.connect() as conn:
            # 检查users表结构
            result = conn.execute(text("DESCRIBE users"))
            columns = result.fetchall()
            
            print("📋 当前users表结构:")
            for column in columns:
                print(f"  - {column[0]}: {column[1]}")
            
            # 检查是否有数据
            result = conn.execute(text("SELECT COUNT(*) FROM users"))
            count = result.fetchone()[0]
            print(f"📊 用户表中有 {count} 条记录")
            
            # 如果有数据，显示一些示例
            if count > 0:
                result = conn.execute(text("SELECT username, email, role FROM users LIMIT 5"))
                users = result.fetchall()
                print("👥 示例用户:")
                for user in users:
                    print(f"  - {user[0]} ({user[2]})")
            
            conn.commit()
            
    except Exception as e:
        print(f"❌ 错误: {e}")

if __name__ == "__main__":
    check_and_fix_database()
