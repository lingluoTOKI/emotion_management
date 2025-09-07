#!/usr/bin/env python3
"""
修改数据库中的角色值为小写
"""

import mysql.connector

def fix_role_case_in_db():
    print("🔧 修改数据库中的角色值为小写...")
    
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='emotion_user',
            password='emotion123',
            database='emotion_management'
        )
        
        cursor = conn.cursor()
        
        # 查看当前的角色值
        print("📋 修改前的角色值:")
        cursor.execute("SELECT id, username, role FROM users")
        users = cursor.fetchall()
        for user in users:
            print(f"  - {user[1]} (ID: {user[0]}): {user[2]}")
        
        # 修改角色值为小写
        print("\n🔄 开始修改角色值...")
        
        # 修改ADMIN为admin
        cursor.execute("UPDATE users SET role = 'admin' WHERE role = 'ADMIN'")
        admin_count = cursor.rowcount
        print(f"   ✅ 修改了 {admin_count} 个ADMIN用户")
        
        # 修改STUDENT为student
        cursor.execute("UPDATE users SET role = 'student' WHERE role = 'STUDENT'")
        student_count = cursor.rowcount
        print(f"   ✅ 修改了 {student_count} 个STUDENT用户")
        
        # 修改COUNSELOR为counselor
        cursor.execute("UPDATE users SET role = 'counselor' WHERE role = 'COUNSELOR'")
        counselor_count = cursor.rowcount
        print(f"   ✅ 修改了 {counselor_count} 个COUNSELOR用户")
        
        # 提交更改
        conn.commit()
        print("✅ 数据库修改完成")
        
        # 查看修改后的角色值
        print("\n📋 修改后的角色值:")
        cursor.execute("SELECT id, username, role FROM users")
        users = cursor.fetchall()
        for user in users:
            print(f"  - {user[1]} (ID: {user[0]}): {user[2]}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ 修改失败: {e}")

if __name__ == "__main__":
    fix_role_case_in_db()
