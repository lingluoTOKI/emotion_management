#!/usr/bin/env python3
"""
测试数据库连接和表结构
"""

import mysql.connector
from app.core.config import settings

def test_db_connection():
    """测试数据库连接"""
    print(f"数据库URL: {settings.DATABASE_URL}")
    
    try:
        # 解析数据库URL
        # mysql://emotion_user:emotion123@localhost/emotion_management
        parts = settings.DATABASE_URL.replace("mysql://", "").split("@")
        auth_part = parts[0].split(":")
        host_part = parts[1].split("/")
        
        user = auth_part[0]
        password = auth_part[1]
        host = host_part[0]
        database = host_part[1]
        
        print(f"连接参数: host={host}, user={user}, database={database}")
        
        # 直接连接数据库
        conn = mysql.connector.connect(
            host=host,
            user=user,
            password=password,
            database=database
        )
        
        cursor = conn.cursor()
        
        # 检查表结构
        cursor.execute("DESCRIBE users")
        columns = cursor.fetchall()
        print("\nusers表结构:")
        for col in columns:
            print(f"  {col[0]}: {col[1]}")
        
        # 检查用户数据
        cursor.execute("SELECT id, username, email, role FROM users LIMIT 5")
        users = cursor.fetchall()
        print(f"\n用户数据 (共{len(users)}条):")
        for user in users:
            print(f"  ID: {user[0]}, 用户名: {user[1]}, 邮箱: {user[2]}, 角色: {user[3]}")
        
        cursor.close()
        conn.close()
        
        print("\n✅ 数据库连接测试成功!")
        
    except Exception as e:
        print(f"❌ 数据库连接测试失败: {e}")

if __name__ == "__main__":
    test_db_connection()
