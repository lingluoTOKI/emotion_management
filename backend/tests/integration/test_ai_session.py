#!/usr/bin/env python3
"""
测试AI会话API
"""

import requests
import json

def test_ai_session():
    print("🧪 测试AI会话API...")
    
    # 首先登录获取token
    login_url = "http://localhost:8000/api/auth/login"
    login_data = {
        "username": "student1",
        "password": "123456"
    }
    
    print("📝 步骤1: 登录获取token...")
    try:
        login_response = requests.post(login_url, data=login_data)
        
        if login_response.status_code == 200:
            login_result = login_response.json()
            token = login_result.get('access_token')
            user_role = login_result.get('user_role')
            print(f"✅ 登录成功! 角色: {user_role}")
            print(f"   Token: {token[:20]}...")
        else:
            print(f"❌ 登录失败: {login_response.text}")
            return
    except Exception as e:
        print(f"❌ 登录请求失败: {e}")
        return
    
    # 测试AI会话API
    session_url = "http://localhost:8000/api/ai/session/start"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    session_data = {
        "session_type": "text",
        "assessment_id": 1
    }
    
    print("📝 步骤2: 测试AI会话API...")
    try:
        response = requests.post(session_url, json=session_data, headers=headers)
        
        print(f"📝 AI会话API响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ AI会话API调用成功!")
            print(f"   响应: {json.dumps(result, indent=2, ensure_ascii=False)}")
        else:
            print(f"❌ AI会话API调用失败: {response.text}")
            
    except Exception as e:
        print(f"❌ AI会话API请求失败: {e}")

if __name__ == "__main__":
    test_ai_session()
