#!/usr/bin/env python3
"""快速测试改进后的AI聊天功能"""

import requests

def quick_test():
    print("🚀 快速测试AI聊天功能")
    print("=" * 40)
    
    backend_url = 'http://localhost:8000'
    
    # 登录
    login_data = {'username': 'student1', 'password': '123456'}
    login_resp = requests.post(f'{backend_url}/api/auth/login', data=login_data, timeout=10)
    token = login_resp.json().get('access_token')
    headers = {'Authorization': f'Bearer {token}'}
    print("✅ 登录成功")
    
    # 创建会话
    session_resp = requests.post(f'{backend_url}/api/ai/session/start', 
                               json={'problem_type': '快速测试'}, 
                               headers=headers, timeout=15)
    session_data = session_resp.json()
    session_id = session_data.get('data', {}).get('session_id') or session_data.get('session_id')
    print(f"✅ 创建会话: {session_id}")
    
    # 测试消息
    test_messages = [
        "你好",
        "我最近心情不太好",
        "我想死"  # 测试危机检测
    ]
    
    for i, message in enumerate(test_messages, 1):
        print(f"\n💬 消息{i}: {message}")
        chat_resp = requests.post(f'{backend_url}/api/ai/session/chat',
                                json={'session_id': session_id, 'message': message}, 
                                headers=headers, timeout=30)
        
        if chat_resp.status_code == 200:
            chat_data = chat_resp.json()
            ai_message = chat_data.get('data', {}).get('message') or chat_data.get('message', '')
            risk_level = chat_data.get('data', {}).get('risk_assessment', {}).get('risk_level', 'unknown')
            print(f"🤖 AI回复: {ai_message[:80]}...")
            print(f"⚠️ 风险等级: {risk_level}")
        else:
            print(f"❌ 失败: {chat_resp.status_code}")
            print(f"错误: {chat_resp.text}")
    
    print("\n🎯 测试完成！")

if __name__ == "__main__":
    quick_test()
