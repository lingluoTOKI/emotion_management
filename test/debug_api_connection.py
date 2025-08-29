#!/usr/bin/env python3
"""
调试前后端API连接问题
Debug Frontend-Backend API Connection Issues
"""

import requests
import json
import time

def debug_api_connection():
    """调试API连接问题"""
    
    print("🔍 调试前后端API连接问题")
    print("=" * 50)
    
    backend_url = 'http://localhost:8000'
    frontend_url = 'http://localhost:3000'
    
    # 1. 检查后端服务状态
    print("🔧 1. 检查后端服务状态...")
    try:
        health_resp = requests.get(f'{backend_url}/health', timeout=5)
        if health_resp.status_code == 200:
            print("   ✅ 后端服务正常运行")
        else:
            print(f"   ❌ 后端服务异常: {health_resp.status_code}")
            return
    except Exception as e:
        print(f"   ❌ 无法连接后端服务: {e}")
        return
    
    # 2. 检查前端服务状态  
    print("\n🌐 2. 检查前端服务状态...")
    try:
        frontend_resp = requests.get(frontend_url, timeout=5)
        if frontend_resp.status_code == 200:
            print("   ✅ 前端服务正常运行")
        else:
            print(f"   ❌ 前端服务异常: {frontend_resp.status_code}")
    except Exception as e:
        print(f"   ❌ 无法连接前端服务: {e}")
        print("   💡 请确保前端服务已启动 (npm run dev)")
    
    # 3. 测试认证流程
    print("\n🔐 3. 测试用户认证...")
    login_data = {'username': 'student1', 'password': '123456'}
    try:
        login_resp = requests.post(f'{backend_url}/api/auth/login', data=login_data, timeout=10)
        if login_resp.status_code == 200:
            login_data = login_resp.json()
            token = login_data.get('access_token')
            print("   ✅ 用户认证成功")
            print(f"   🎫 Token: {token[:20]}...")
        else:
            print(f"   ❌ 认证失败: {login_resp.status_code}")
            print(f"   错误: {login_resp.text}")
            return
    except Exception as e:
        print(f"   ❌ 认证异常: {e}")
        return
    
    # 4. 测试AI会话创建
    print("\n🚀 4. 测试AI会话创建...")
    headers = {'Authorization': f'Bearer {token}'}
    try:
        session_resp = requests.post(
            f'{backend_url}/api/ai/session/start',
            json={'problem_type': 'API调试测试'},
            headers=headers,
            timeout=15
        )
        
        if session_resp.status_code == 200:
            session_data = session_resp.json()
            session_id = session_data.get('data', {}).get('session_id') or session_data.get('session_id')
            print("   ✅ AI会话创建成功")
            print(f"   🆔 Session ID: {session_id}")
        else:
            print(f"   ❌ 会话创建失败: {session_resp.status_code}")
            print(f"   错误: {session_resp.text}")
            return
    except Exception as e:
        print(f"   ❌ 会话创建异常: {e}")
        return
    
    # 5. 测试AI对话
    print("\n💬 5. 测试AI对话...")
    try:
        chat_resp = requests.post(
            f'{backend_url}/api/ai/session/chat',
            json={'session_id': session_id, 'message': '你好，这是API调试测试'},
            headers=headers,
            timeout=30
        )
        
        if chat_resp.status_code == 200:
            chat_data = chat_resp.json()
            response_data = chat_data.get('data', chat_data)
            ai_message = response_data.get('message', '')
            risk_level = response_data.get('risk_assessment', {}).get('risk_level', 'unknown')
            
            print("   ✅ AI对话成功")
            print(f"   🤖 AI回复: {ai_message[:80]}...")
            print(f"   🚨 风险等级: {risk_level}")
            
        else:
            print(f"   ❌ AI对话失败: {chat_resp.status_code}")
            print(f"   错误: {chat_resp.text}")
            return
            
    except Exception as e:
        print(f"   ❌ AI对话异常: {e}")
        return
    
    # 6. 检查CORS配置
    print("\n🌍 6. 检查CORS配置...")
    try:
        # 模拟前端的OPTIONS请求
        options_resp = requests.options(
            f'{backend_url}/api/ai/session/chat',
            headers={
                'Origin': 'http://localhost:3000',
                'Access-Control-Request-Method': 'POST',
                'Access-Control-Request-Headers': 'authorization,content-type'
            },
            timeout=5
        )
        
        if options_resp.status_code == 200:
            cors_headers = options_resp.headers
            allowed_origins = cors_headers.get('Access-Control-Allow-Origin', '')
            allowed_methods = cors_headers.get('Access-Control-Allow-Methods', '')
            
            print("   ✅ CORS预检请求成功")
            print(f"   🔗 允许的源: {allowed_origins}")
            print(f"   📋 允许的方法: {allowed_methods}")
        else:
            print(f"   ⚠️ CORS预检请求状态: {options_resp.status_code}")
            
    except Exception as e:
        print(f"   ❌ CORS检查异常: {e}")
    
    print("\n📊 诊断总结:")
    print("✅ 后端API服务正常")
    print("✅ 认证流程正常")
    print("✅ AI会话功能正常")
    print("✅ 风险评估功能正常")
    
    print("\n💡 可能的前端问题:")
    print("1. 前端服务未启动或端口错误")
    print("2. 前端API调用中的错误处理过于严格")
    print("3. 认证token在前端存储/传递有问题")
    print("4. 网络请求被浏览器CORS策略阻止")
    
    print("\n🔧 建议检查:")
    print("- 打开浏览器开发者工具 (F12)")
    print("- 查看Console标签的错误信息")
    print("- 查看Network标签的API请求状态")
    print("- 确认前端localStorage中有access_token")

if __name__ == "__main__":
    debug_api_connection()
