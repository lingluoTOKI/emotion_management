#!/usr/bin/env python3
"""
修复数据库角色枚举值
Fix database role enum values
"""

import mysql.connector
from app.core.config import settings
import re

def fix_enum_values():
    """修复角色枚举值"""
    
    # 解析数据库URL
    db_url = settings.DATABASE_URL
    match = re.match(r'mysql://([^:]+):([^@]+)@([^/]+)/(.+)', db_url)
    if not match:
        print("❌ 无法解析数据库URL")
        return
        
    username, password, host, database = match.groups()
    
    try:
        # 连接到数据库
        conn = mysql.connector.connect(
            host=host,
            user=username,
            password=password,
            database=database
        )
        cursor = conn.cursor()
        
        print("✅ 已连接到数据库")
        
        # 修改角色枚举值为小写
        print("🔄 修改角色枚举值...")
        
        # 先修改表结构，将枚举值改为小写
        cursor.execute("""
            ALTER TABLE users MODIFY COLUMN role 
            ENUM('admin', 'student', 'counselor') NOT NULL
        """)
        
        print("✅ 角色枚举值已更新为小写")
        
        # 更新现有数据
        cursor.execute("UPDATE users SET role = LOWER(role)")
        print("✅ 现有用户角色数据已更新")
        
        # 提交更改
        conn.commit()
        
        # 验证修改
        cursor.execute("DESCRIBE users")
        columns = cursor.fetchall()
        
        print("\n📋 更新后的users表结构:")
        for column in columns:
            print(f"  - {column[0]}: {column[1]}")
        
        # 显示一些用户数据
        cursor.execute("SELECT username, role FROM users LIMIT 5")
        users = cursor.fetchall()
        print("\n👥 用户角色数据:")
        for user in users:
            print(f"  - {user[0]}: {user[1]}")
        
        print("\n✅ 角色枚举值修复完成！")
        
    except mysql.connector.Error as e:
        print(f"❌ 数据库错误: {e}")
    except Exception as e:
        print(f"❌ 修复失败: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    fix_enum_values()
