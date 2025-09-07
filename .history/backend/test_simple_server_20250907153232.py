#!/usr/bin/env python3
"""
测试简单登录服务器
"""

import requests
import json
import time

def test_simple_server():
    """测试简单服务器"""
    
    # 等待服务器启动
    print("⏳ 等待服务器启动...")
    time.sleep(3)
    
    # 健康检查
    try:
        response = requests.get("http://localhost:8001/health")
        if response.status_code == 200:
            print(f"🏥 简单服务器健康检查: ✅ {response.json()}")
        else:
            print(f"🏥 简单服务器健康检查: ❌ {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ 简单服务器未启动: {e}")
        return False
    
    # 测试登录
    login_data = {
        "username": "student1",
        "password": "123456"
    }
    
    url = "http://localhost:8001/login"
    
    print(f"\n🔍 测试简单登录...")
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
            print("✅ 简单登录成功!")
            return True
        else:
            print("❌ 简单登录失败!")
            return False
            
    except Exception as e:
        print(f"❌ 登录请求错误: {e}")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("🧪 简单服务器登录测试")
    print("=" * 60)
    
    test_simple_server()
