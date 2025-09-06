#!/usr/bin/env python3
"""
前端API集成测试脚本
Frontend API Integration Test
"""

import requests
import json

def test_frontend_backend_integration():
    """测试前端与后端的API集成"""
    
    print("🔗 测试前端与后端API集成")
    print("=" * 50)
    
    backend_url = "http://localhost:8000"
    frontend_url = "http://localhost:3000"
    
    # 1. 测试后端API状态
    print("📊 1. 检查后端API状态...")
    try:
        response = requests.get(f"{backend_url}/health", timeout=5)
        if response.status_code == 200:
            print("   ✅ 后端服务正常运行")
        else:
            print(f"   ❌ 后端服务异常: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ 无法连接后端服务: {str(e)}")
        return False
    
    # 2. 测试前端服务状态
    print("🌐 2. 检查前端服务状态...")
    try:
        response = requests.get(frontend_url, timeout=5)
        if response.status_code == 200:
            print("   ✅ 前端服务正常运行")
        else:
            print(f"   ❌ 前端服务异常: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ 无法连接前端服务: {str(e)}")
        return False
    
    # 3. 测试API连通性
    print("🔌 3. 测试API连通性...")
    try:
        # 创建测试用户并登录
        test_user = {
            "username": "student1",
            "password": "123456",
            "email": "frontend_test@example.com",
            "role": "student",
            "real_name": "前端测试用户"
        }
        
        # 先尝试注册用户
        try:
            register_response = requests.post(
                f"{backend_url}/api/auth/register",
                json=test_user,
                timeout=10
            )
            print(f"   📝 注册用户: {register_response.status_code}")
        except:
            pass  # 用户可能已存在
        
        # 尝试登录
        login_response = requests.post(
            f"{backend_url}/api/auth/login",
            data=test_user,  # OAuth2PasswordRequestForm需要form data
            timeout=10
        )
        
        if login_response.status_code == 200:
            token_data = login_response.json()
            access_token = token_data.get("access_token")
            print("   ✅ 用户认证成功")
            
            # 4. 测试AI服务状态
            print("🤖 4. 测试AI服务状态...")
            headers = {"Authorization": f"Bearer {access_token}"}
            
            ai_status_response = requests.get(
                f"{backend_url}/api/ai-service/status",
                headers=headers,
                timeout=10
            )
            
            if ai_status_response.status_code == 200:
                ai_data = ai_status_response.json()
                xfyun_status = ai_data.get("data", {}).get("service_status", {}).get("xfyun", {})
                if xfyun_status.get("available"):
                    print("   ✅ 科大讯飞AI服务可用")
                else:
                    print(f"   ⚠️ AI服务不可用: {xfyun_status.get('error', 'Unknown')}")
            
            # 5. 测试AI聊天接口
            print("💬 5. 测试AI聊天接口...")
            
            # 开始会话
            session_response = requests.post(
                f"{backend_url}/api/ai/session/start",
                json={"problem_type": "API测试"},
                headers=headers,
                timeout=15
            )
            
            if session_response.status_code == 200:
                session_data = session_response.json()
                session_id = session_data.get("data", {}).get("session_id") or session_data.get("session_id")
                print(f"   ✅ AI会话创建成功: {session_id}")
                
                # 发送测试消息
                chat_response = requests.post(
                    f"{backend_url}/api/ai/session/chat",
                    json={"session_id": session_id, "message": "你好，这是API集成测试"},
                    headers=headers,
                    timeout=30
                )
                
                if chat_response.status_code == 200:
                    chat_data = chat_response.json()
                    ai_message = chat_data.get("data", {}).get("message") or chat_data.get("message")
                    print(f"   ✅ AI回复成功: {ai_message[:100]}...")
                    print()
                    print("🎉 前后端API集成测试完全通过！")
                    print("✨ 前端现在可以正常调用后端AI接口")
                    return True
                else:
                    print(f"   ❌ AI聊天失败: {chat_response.status_code}")
                    print(f"   错误: {chat_response.text}")
            else:
                print(f"   ❌ 创建AI会话失败: {session_response.status_code}")
                print(f"   错误: {session_response.text}")
        
        else:
            print(f"   ❌ 用户认证失败: {login_response.status_code}")
            print("   💡 请确保测试用户已注册")
    
    except Exception as e:
        print(f"   ❌ API测试异常: {str(e)}")
    
    return False

def main():
    print("🚀 前端后端API集成测试")
    print("=" * 60)
    
    success = test_frontend_backend_integration()
    
    if success:
        print("\n📋 测试总结:")
        print("✅ 后端服务正常")
        print("✅ 前端服务正常") 
        print("✅ API认证正常")
        print("✅ AI服务集成正常")
        print("✅ 所有接口调用成功")
        print()
        print("🎯 下一步:")
        print("1. 访问 http://localhost:3000")
        print("2. 登录学生账户")
        print("3. 测试 AI智能评估 和 AI聊天 功能")
        print("4. 确认API调用正常工作")
    else:
        print("\n⚠️ 集成测试失败，请检查:")
        print("- 后端服务是否在运行 (http://localhost:8000)")
        print("- 前端服务是否在运行 (http://localhost:3000)")
        print("- 网络连接是否正常")
        print("- API密钥配置是否正确")

if __name__ == "__main__":
    main()
