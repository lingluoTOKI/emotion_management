#!/usr/bin/env python3
"""
测试角色转换是否正确
"""

import requests
import json

def test_role_conversion():
    print("🧪 测试角色转换...")
    
    url = "http://localhost:8000/api/auth/login"
    
    # 测试数据
    data = {
        "username": "student1",
        "password": "123456"
    }
    
    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }
    
    try:
        response = requests.post(url, data=data, headers=headers)
        
        print(f"📝 响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ 登录成功!")
            print(f"   用户角色: {result.get('user_role')}")
            print(f"   用户名: {result.get('username')}")
            print(f"   Token类型: {result.get('token_type')}")
            
            # 检查角色是否为小写
            user_role = result.get('user_role')
            if user_role == 'student':
                print("✅ 角色转换正确: student (小写)")
            else:
                print(f"❌ 角色转换错误: {user_role} (期望: student)")
        else:
            print(f"❌ 登录失败: {response.text}")
            
    except Exception as e:
        print(f"❌ 请求失败: {e}")

if __name__ == "__main__":
    test_role_conversion()
