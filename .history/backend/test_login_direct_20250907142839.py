#!/usr/bin/env python3
"""
直接测试登录功能
"""

import requests
import json

def test_login():
    """测试登录端点"""
    url = "http://localhost:8000/api/auth/login"
    
    # 测试数据
    test_cases = [
        {"username": "student1", "password": "123456"},
        {"username": "admin", "password": "123456"},
        {"username": "counselor1", "password": "123456"},
    ]
    
    for test_case in test_cases:
        print(f"\n测试登录: {test_case['username']}")
        try:
            response = requests.post(
                url,
                data=test_case,
                headers={"Content-Type": "application/x-www-form-urlencoded"}
            )
            
            print(f"状态码: {response.status_code}")
            print(f"响应: {response.text}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"登录成功: {data.get('username')} - {data.get('user_role')}")
            else:
                print(f"登录失败: {response.text}")
                
        except Exception as e:
            print(f"请求错误: {e}")

if __name__ == "__main__":
    test_login()