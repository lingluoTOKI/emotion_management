#!/usr/bin/env python3
"""
检查服务状态
Check Service Status
"""

import requests
import json

def check_services():
    """检查前后端服务状态"""
    
    print("🔍 检查服务状态")
    print("=" * 30)
    
    # 检查后端
    print("🔧 检查后端服务...")
    try:
        resp = requests.get('http://localhost:8000/health', timeout=3)
        if resp.status_code == 200:
            print("   ✅ 后端正常运行")
        else:
            print(f"   ❌ 后端异常: {resp.status_code}")
    except Exception as e:
        print(f"   ❌ 后端无法连接: {e}")
    
    # 检查前端
    print("🌐 检查前端服务...")
    try:
        resp = requests.get('http://localhost:3000', timeout=3)
        if resp.status_code == 200:
            print("   ✅ 前端正常运行")
        else:
            print(f"   ❌ 前端异常: {resp.status_code}")
    except Exception as e:
        print(f"   ❌ 前端无法连接: {e}")
    
    # 快速API测试
    print("🚀 快速API测试...")
    try:
        # 登录
        login_resp = requests.post(
            'http://localhost:8000/api/auth/login',
            data={'username': 'student1', 'password': '123456'},
            timeout=5
        )
        
        if login_resp.status_code == 200:
            token = login_resp.json().get('access_token')
            print("   ✅ 认证成功")
            
            # 测试会话
            headers = {'Authorization': f'Bearer {token}'}
            session_resp = requests.post(
                'http://localhost:8000/api/ai/session/start',
                json={'problem_type': '快速测试'},
                headers=headers,
                timeout=10
            )
            
            if session_resp.status_code == 200:
                print("   ✅ AI服务正常")
            else:
                print(f"   ❌ AI服务异常: {session_resp.status_code}")
        else:
            print(f"   ❌ 认证失败: {login_resp.status_code}")
            
    except Exception as e:
        print(f"   ❌ API测试失败: {e}")
    
    print("\n💡 如果前端显示[本地AI]，请:")
    print("1. 确认前后端服务都在运行")
    print("2. 检查浏览器开发者工具的Console和Network标签")
    print("3. 确认已登录并且token有效")
    print("4. 检查CORS设置")

if __name__ == "__main__":
    check_services()
