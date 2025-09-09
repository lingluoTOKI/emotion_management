#!/usr/bin/env python3
"""
检查数据库表结构
"""

from app.core.database import engine
from sqlalchemy import text

def check_users_table():
    """检查users表结构"""
    conn = engine.connect()
    try:
        # 检查表结构
        result = conn.execute(text("DESCRIBE users"))
        print("Users table structure:")
        for row in result:
            print(f"  {row}")
        
        # 检查是否有数据
        result = conn.execute(text("SELECT COUNT(*) as count FROM users"))
        count = result.fetchone()[0]
        print(f"\nUsers table has {count} records")
        
        if count > 0:
            # 显示前几条记录的结构
            result = conn.execute(text("SELECT * FROM users LIMIT 1"))
            row = result.fetchone()
            if row:
                print("\nSample user record:")
                print(f"  {row}")
                
    except Exception as e:
        print(f"Error checking users table: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_users_table()
