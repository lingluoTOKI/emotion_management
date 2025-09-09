#!/usr/bin/env python3
"""
直接测试登录API
"""

import mysql.connector

def test_login_direct():
    """直接测试登录逻辑"""
    print("测试直接MySQL登录...")
    
    try:
        # 直接使用MySQL连接
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
        
        if user_data:
            print(f"找到用户: {user_data}")
            print(f"用户名: {user_data[1]}")
            print(f"密码: {user_data[3]}")
            print(f"角色: {user_data[4]}")
            print(f"状态: {user_data[5]}")
        else:
            print("未找到用户")
        
        cursor.close()
        conn.close()
        
        print("✅ 直接MySQL登录测试成功!")
        
    except Exception as e:
        print(f"❌ 直接MySQL登录测试失败: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_login_direct()