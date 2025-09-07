#!/usr/bin/env python3
"""
调试登录错误
Debug login error
"""

import requests
import json

def debug_login_error():
    """调试登录错误"""
    
    print("🔍 调试登录错误...")
    
    url = "http://localhost:8000/api/auth/login"
    
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded'
    }
    data = {
        'username': 'student1',
        'password': '123456'
    }
    
    try:
        response = requests.post(url, headers=headers, data=data)
        print(f"📝 响应状态码: {response.status_code}")
        
        if response.status_code != 200:
            error_data = response.json()
            print(f"❌ 错误信息: {error_data}")
            
            # 解析错误详情
            if 'details' in error_data and 'exception_message' in error_data['details']:
                exception_msg = error_data['details']['exception_message']
                print(f"\n🔍 异常消息分析:")
                print(exception_msg)
                
                # 查找SQL语句
                if 'SQL:' in exception_msg:
                    sql_start = exception_msg.find('SQL:') + 4
                    sql_end = exception_msg.find(']', sql_start)
                    if sql_end != -1:
                        sql_query = exception_msg[sql_start:sql_end].strip()
                        print(f"\n📋 执行的SQL查询:")
                        print(sql_query)
                        
                        # 这是典型的SQLAlchemy ORM查询
                        if "AS users_id" in sql_query:
                            print("\n❗ 这是SQLAlchemy ORM自动生成的查询!")
                            print("   说明还有地方在使用 db.query(User) 而不是我们的直接SQL")
        
    except Exception as e:
        print(f"❌ 请求失败: {e}")

if __name__ == "__main__":
    debug_login_error()
