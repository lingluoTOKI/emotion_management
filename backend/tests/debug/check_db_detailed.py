#!/usr/bin/env python3
"""
详细检查数据库表结构
"""

from app.core.database import engine
from sqlalchemy import text

def check_detailed_schema():
    """详细检查数据库表结构"""
    conn = engine.connect()
    try:
        # 检查表结构
        result = conn.execute(text("SHOW CREATE TABLE users"))
        create_table = result.fetchone()[1]
        print("Users table CREATE statement:")
        print(create_table)
        
        # 检查列信息
        result = conn.execute(text("SHOW COLUMNS FROM users"))
        print("\nUsers table columns:")
        for row in result:
            print(f"  {row}")
            
        # 检查是否有数据
        result = conn.execute(text("SELECT * FROM users LIMIT 1"))
        row = result.fetchone()
        if row:
            print(f"\nSample user record:")
            print(f"  {row}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    check_detailed_schema()
