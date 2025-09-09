#!/usr/bin/env python3
"""
测试学生评估API权限
"""

import requests
import json

def test_student_assessment():
    print("🧪 测试学生评估API权限...")
    
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
    
    # 测试学生评估API
    assessment_url = "http://localhost:8000/api/student/assessment/start"
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }
    
    assessment_data = {
        "assessment_type": "emotion"
    }
    
    print("📝 步骤2: 测试学生评估API...")
    try:
        response = requests.post(assessment_url, json=assessment_data, headers=headers)
        
        print(f"📝 评估API响应状态码: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ 评估API调用成功!")
            print(f"   响应: {json.dumps(result, indent=2, ensure_ascii=False)}")
        else:
            print(f"❌ 评估API调用失败: {response.text}")
            
    except Exception as e:
        print(f"❌ 评估API请求失败: {e}")

if __name__ == "__main__":
    test_student_assessment()
