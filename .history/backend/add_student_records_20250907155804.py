#!/usr/bin/env python3
"""
为学生用户添加学生记录
"""

import mysql.connector

def add_student_records():
    print("👥 为学生用户添加学生记录...")
    
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='emotion_user',
            password='emotion123',
            database='emotion_management'
        )
        
        cursor = conn.cursor()
        
        # 获取所有学生角色的用户
        cursor.execute("""
            SELECT id, username, email 
            FROM users 
            WHERE role = 'STUDENT'
        """)
        student_users = cursor.fetchall()
        
        print(f"📊 找到 {len(student_users)} 个学生用户")
        
        for user in student_users:
            user_id, username, email = user
            print(f"👤 处理用户: {username} (ID: {user_id})")
            
            # 检查是否已有学生记录
            cursor.execute("SELECT id FROM students WHERE user_id = %s", (user_id,))
            existing = cursor.fetchone()
            
            if existing:
                print(f"   ✅ 学生记录已存在")
            else:
                # 创建学生记录
                cursor.execute("""
                    INSERT INTO students (user_id, student_id, name, major, grade, phone, emergency_contact, emergency_phone)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (
                    user_id,
                    f"STU{user_id:04d}",  # 学生ID格式
                    username,  # 姓名
                    "计算机科学",  # 专业
                    "2023级",  # 年级
                    "13800000000",  # 电话
                    "家长",  # 紧急联系人
                    "13900000000"  # 紧急联系电话
                ))
                print(f"   ✅ 学生记录创建成功")
        
        conn.commit()
        print("✅ 所有学生记录处理完成")
        
        # 验证结果
        cursor.execute("SELECT COUNT(*) FROM students")
        count = cursor.fetchone()[0]
        print(f"📊 students表现在有 {count} 条记录")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ 添加学生记录失败: {e}")

if __name__ == "__main__":
    add_student_records()
