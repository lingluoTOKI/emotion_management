#!/usr/bin/env python3
"""
简单登录测试脚本
直接测试登录功能，不依赖复杂的ORM
"""

import requests
import json

def test_simple_login():
    """测试简单登录"""
    
    # 测试数据
    login_data = {
        "username": "student1",
        "password": "123456"
    }
    
    url = "http://localhost:8000/api/auth/login"
    
    print("🔍 测试登录端点...")
    print(f"URL: {url}")
    print(f"数据: {login_data}")
    
    try:
        response = requests.post(
            url,
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        print(f"\n📊 响应状态码: {response.status_code}")
        print(f"📄 响应头: {dict(response.headers)}")
        
        try:
            response_data = response.json()
            print(f"📝 响应内容: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
        except:
            print(f"📝 响应内容 (原始): {response.text}")
            
        if response.status_code == 200:
            print("✅ 登录成功!")
        else:
            print("❌ 登录失败!")
            
    except Exception as e:
        print(f"❌ 请求错误: {e}")

def test_health():
    """测试健康检查"""
    try:
        response = requests.get("http://localhost:8000/health")
        print(f"🏥 健康检查: {response.status_code} - {response.json()}")
    except Exception as e:
        print(f"❌ 健康检查失败: {e}")

if __name__ == "__main__":
    print("=" * 50)
    print("🧪 简单登录测试")
    print("=" * 50)
    
    test_health()
    print()
    test_simple_login()
