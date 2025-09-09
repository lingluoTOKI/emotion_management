#!/usr/bin/env python3
"""
检查数据库枚举定义
"""

import mysql.connector

def check_enum_definition():
    print("🔍 检查数据库枚举定义...")
    
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='emotion_user',
            password='emotion123',
            database='emotion_management'
        )
        
        cursor = conn.cursor()
        
        # 查看role字段的详细信息
        cursor.execute("SHOW COLUMNS FROM users LIKE 'role'")
        result = cursor.fetchone()
        
        if result:
            print("📋 role字段信息:")
            print(f"  - 字段名: {result[0]}")
            print(f"  - 类型: {result[1]}")
            print(f"  - 是否为空: {result[2]}")
            print(f"  - 键: {result[3]}")
            print(f"  - 默认值: {result[4]}")
            print(f"  - 额外信息: {result[5]}")
        
        # 查看当前数据
        print("\n📊 当前用户数据:")
        cursor.execute("SELECT id, username, role FROM users")
        users = cursor.fetchall()
        for user in users:
            print(f"  - {user[1]} (ID: {user[0]}): '{user[2]}'")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ 检查失败: {e}")

if __name__ == "__main__":
    check_enum_definition()
