#!/usr/bin/env python3
"""
完全独立的登录测试，不使用任何项目依赖
"""

import mysql.connector
import bcrypt

def test_independent_login():
    """完全独立的登录测试"""
    try:
        # 直接连接MySQL
        conn = mysql.connector.connect(
            host='localhost',
            user='emotion_user',
            password='emotion123',
            database='emotion_management'
        )
        
        cursor = conn.cursor()
        
        # 查询用户
        cursor.execute("""
            SELECT id, username, email, hashed_password, role, is_active
            FROM users 
            WHERE username = %s
        """, ('student1',))
        
        user_data = cursor.fetchone()
        
        if not user_data:
            print("❌ 用户不存在")
            return
        
        print(f"✅ 找到用户: {user_data[1]} ({user_data[4]})")
        
        # 验证密码
        password = '123456'
        if bcrypt.checkpw(password.encode('utf-8'), user_data[3].encode('utf-8')):
            print("✅ 密码验证成功")
            print(f"✅ 登录成功! 用户: {user_data[1]} ({user_data[4]})")
        else:
            print("❌ 密码验证失败")
        
    except mysql.connector.Error as e:
        print(f"❌ 数据库错误: {e}")
    except Exception as e:
        print(f"❌ 其他错误: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    test_independent_login()
