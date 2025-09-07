#!/usr/bin/env python3
"""
测试原始SQL登录端点
"""

import requests
import json
import time

def test_raw_login():
    """测试原始SQL登录"""
    
    # 等待服务器启动
    print("⏳ 等待服务器启动...")
    time.sleep(2)
    
    # 测试数据
    login_data = {
        "username": "student1",
        "password": "123456"
    }
    
    url = "http://localhost:8000/api/raw-auth/login-raw"
    
    print("🔍 测试原始SQL登录端点...")
    print(f"URL: {url}")
    print(f"数据: {login_data}")
    
    try:
        response = requests.post(
            url,
            data=login_data,
            headers={"Content-Type": "application/x-www-form-urlencoded"}
        )
        
        print(f"\n📊 响应状态码: {response.status_code}")
        
        try:
            response_data = response.json()
            print(f"📝 响应内容: {json.dumps(response_data, indent=2, ensure_ascii=False)}")
        except:
            print(f"📝 响应内容 (原始): {response.text}")
            
        if response.status_code == 200:
            print("✅ 原始SQL登录成功!")
            return True
        else:
            print("❌ 原始SQL登录失败!")
            return False
            
    except Exception as e:
        print(f"❌ 请求错误: {e}")
        return False

def test_health():
    """测试健康检查"""
    try:
        response = requests.get("http://localhost:8000/health")
        if response.status_code == 200:
            print(f"🏥 健康检查: ✅ {response.json()}")
            return True
        else:
            print(f"🏥 健康检查: ❌ {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 健康检查失败: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("🧪 原始SQL登录测试")
    print("=" * 60)
    
    if test_health():
        test_raw_login()
    else:
        print("❌ 服务器未启动，请先启动后端服务")
