#!/usr/bin/env python3
"""
检查students表是否存在
"""

import mysql.connector
from app.core.config import settings

def check_students_table():
    print("🔍 检查students表...")
    
    try:
        conn = mysql.connector.connect(
            host='localhost',
            user='emotion_user',
            password='emotion123',
            database='emotion_management'
        )
        
        cursor = conn.cursor()
        
        # 检查students表是否存在
        cursor.execute("SHOW TABLES LIKE 'students'")
        result = cursor.fetchone()
        
        if result:
            print("✅ students表存在")
            
            # 查看表结构
            cursor.execute("DESCRIBE students")
            columns = cursor.fetchall()
            print("📋 students表结构:")
            for col in columns:
                print(f"  - {col[0]}: {col[1]}")
            
            # 查看数据
            cursor.execute("SELECT COUNT(*) FROM students")
            count = cursor.fetchone()[0]
            print(f"📊 students表中有 {count} 条记录")
            
            if count > 0:
                cursor.execute("SELECT * FROM students LIMIT 3")
                students = cursor.fetchall()
                print("👥 示例学生:")
                for student in students:
                    print(f"  - {student}")
        else:
            print("❌ students表不存在")
            
            # 检查所有表
            cursor.execute("SHOW TABLES")
            tables = cursor.fetchall()
            print("📋 数据库中的所有表:")
            for table in tables:
                print(f"  - {table[0]}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ 检查失败: {e}")

if __name__ == "__main__":
    check_students_table()
