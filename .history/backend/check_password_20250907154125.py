#!/usr/bin/env python3
"""
检查密码哈希格式
"""

import mysql.connector
import bcrypt

def check_password():
    """检查密码哈希格式"""
    try:
        # 连接数据库
        conn = mysql.connector.connect(
            host='localhost',
            user='emotion_user',
            password='emotion123',
            database='emotion_management'
        )
        
        cursor = conn.cursor()
        cursor.execute("SELECT username, hashed_password FROM users WHERE username = 'student1'")
        user_data = cursor.fetchone()
        
        if user_data:
            username, hashed_password = user_data
            print(f"用户: {username}")
            print(f"密码哈希: {hashed_password}")
            print(f"哈希长度: {len(hashed_password)}")
            print(f"哈希格式: {hashed_password[:10]}...")
            
            # 测试密码验证
            test_password = "123456"
            try:
                result = bcrypt.checkpw(test_password.encode('utf-8'), hashed_password.encode('utf-8'))
                print(f"密码验证结果: {result}")
            except Exception as e:
                print(f"密码验证错误: {e}")
                
                # 尝试重新创建密码哈希
                print("重新创建密码哈希...")
                new_hash = bcrypt.hashpw(test_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
                print(f"新密码哈希: {new_hash}")
                
                # 更新数据库
                cursor.execute("UPDATE users SET hashed_password = %s WHERE username = %s", (new_hash, username))
                conn.commit()
                print("密码哈希已更新")
                
        else:
            print("用户不存在")
            
    except Exception as e:
        print(f"错误: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    check_password()
