#!/usr/bin/env python3
"""
分步更新数据库枚举定义
"""

import mysql.connector

def update_enum_step_by_step():
    print("🔧 分步更新数据库枚举定义...")
    
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='emotion_user',
            password='emotion123',
            database='emotion_management'
        )
        
        cursor = conn.cursor()
        
        print("📋 当前枚举定义:")
        cursor.execute("SHOW COLUMNS FROM users LIKE 'role'")
        result = cursor.fetchone()
        print(f"  - 类型: {result[1]}")
        
        # 第一步：修改枚举定义，只保留小写值
        print("\n🔄 第一步：修改枚举定义为小写...")
        cursor.execute("""
            ALTER TABLE users 
            MODIFY COLUMN role ENUM('admin', 'student', 'counselor') 
            NOT NULL DEFAULT 'student'
        """)
        print("   ✅ 枚举定义已更新为小写")
        
        # 第二步：更新数据
        print("\n🔄 第二步：更新用户数据...")
        
        # 先查看当前数据
        cursor.execute("SELECT id, username, role FROM users")
        users = cursor.fetchall()
        print("   当前用户数据:")
        for user in users:
            print(f"     - {user[1]} (ID: {user[0]}): '{user[2]}'")
        
        # 更新数据
        cursor.execute("UPDATE users SET role = 'admin' WHERE username = 'admin1'")
        cursor.execute("UPDATE users SET role = 'counselor' WHERE username = 'counselor1'")
        cursor.execute("UPDATE users SET role = 'student' WHERE username = 'student1'")
        
        print("   ✅ 用户数据已更新")
        
        # 提交更改
        conn.commit()
        print("✅ 数据库修改完成")
        
        # 查看最终结果
        print("\n📋 最终枚举定义:")
        cursor.execute("SHOW COLUMNS FROM users LIKE 'role'")
        result = cursor.fetchone()
        print(f"  - 类型: {result[1]}")
        
        print("\n📊 最终用户数据:")
        cursor.execute("SELECT id, username, role FROM users")
        users = cursor.fetchall()
        for user in users:
            print(f"  - {user[1]} (ID: {user[0]}): '{user[2]}'")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ 修改失败: {e}")

if __name__ == "__main__":
    update_enum_step_by_step()
