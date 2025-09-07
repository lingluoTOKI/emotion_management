#!/usr/bin/env python3
"""
更新数据库枚举定义为小写
"""

import mysql.connector

def update_enum_definition():
    print("🔧 更新数据库枚举定义为小写...")
    
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
        
        # 修改枚举定义，添加小写值
        print("\n🔄 修改枚举定义...")
        cursor.execute("""
            ALTER TABLE users 
            MODIFY COLUMN role ENUM('admin', 'student', 'counselor', 'ADMIN', 'STUDENT', 'COUNSELOR') 
            NOT NULL DEFAULT 'student'
        """)
        print("   ✅ 枚举定义已更新")
        
        # 现在可以修改数据为小写
        print("\n🔄 修改数据为小写...")
        cursor.execute("UPDATE users SET role = 'admin' WHERE role = 'ADMIN'")
        admin_count = cursor.rowcount
        print(f"   ✅ 修改了 {admin_count} 个ADMIN用户")
        
        cursor.execute("UPDATE users SET role = 'student' WHERE role = 'STUDENT'")
        student_count = cursor.rowcount
        print(f"   ✅ 修改了 {student_count} 个STUDENT用户")
        
        cursor.execute("UPDATE users SET role = 'counselor' WHERE role = 'COUNSELOR'")
        counselor_count = cursor.rowcount
        print(f"   ✅ 修改了 {counselor_count} 个COUNSELOR用户")
        
        # 清理枚举定义，只保留小写值
        print("\n🧹 清理枚举定义...")
        cursor.execute("""
            ALTER TABLE users 
            MODIFY COLUMN role ENUM('admin', 'student', 'counselor') 
            NOT NULL DEFAULT 'student'
        """)
        print("   ✅ 枚举定义已清理")
        
        # 提交更改
        conn.commit()
        print("✅ 数据库修改完成")
        
        # 查看修改后的结果
        print("\n📋 修改后的枚举定义:")
        cursor.execute("SHOW COLUMNS FROM users LIKE 'role'")
        result = cursor.fetchone()
        print(f"  - 类型: {result[1]}")
        
        print("\n📊 修改后的用户数据:")
        cursor.execute("SELECT id, username, role FROM users")
        users = cursor.fetchall()
        for user in users:
            print(f"  - {user[1]} (ID: {user[0]}): '{user[2]}'")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ 修改失败: {e}")

if __name__ == "__main__":
    update_enum_definition()
