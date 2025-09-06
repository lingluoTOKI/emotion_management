#!/usr/bin/env python3
"""
测试风险评估修复效果
Test Risk Assessment Fix
"""

import requests
import time

def test_risk_assessment_fix():
    """测试风险评估修复效果"""
    
    print("🚨 测试风险评估修复效果")
    print("=" * 50)
    
    backend_url = 'http://localhost:8000'
    
    # 等待服务启动
    print("⏰ 等待后端服务启动...")
    for i in range(10):
        try:
            resp = requests.get(f'{backend_url}/health', timeout=2)
            if resp.status_code == 200:
                print("   ✅ 后端服务已启动")
                break
        except:
            time.sleep(2)
            print(f"   ⏳ 等待中... ({i+1}/10)")
    else:
        print("   ❌ 后端服务启动超时")
        return
    
    # 登录
    print("🔐 1. 登录...")
    login_data = {'username': 'student1', 'password': '123456'}
    try:
        login_resp = requests.post(f'{backend_url}/api/auth/login', data=login_data, timeout=10)
        if login_resp.status_code != 200:
            print(f"   ❌ 登录失败: {login_resp.status_code}")
            return
        
        token = login_resp.json().get('access_token')
        headers = {'Authorization': f'Bearer {token}'}
        print("   ✅ 登录成功")
    except Exception as e:
        print(f"   ❌ 登录异常: {e}")
        return
    
    # 创建会话
    print("🚀 2. 创建AI会话...")
    try:
        session_resp = requests.post(f'{backend_url}/api/ai/session/start', 
                                   json={'problem_type': '风险评估修复测试'}, 
                                   headers=headers, timeout=15)
        if session_resp.status_code != 200:
            print(f"   ❌ 创建会话失败: {session_resp.status_code}")
            print(f"   响应: {session_resp.text}")
            return
            
        session_data = session_resp.json()
        session_id = session_data.get('data', {}).get('session_id') or session_data.get('session_id')
        print(f"   ✅ 会话创建: {session_id}")
    except Exception as e:
        print(f"   ❌ 创建会话异常: {e}")
        return
    
    # 测试风险评估
    test_cases = [
        {
            'message': '你好，今天天气不错',
            'expected_risk': 'minimal',
            'description': '正常对话'
        },
        {
            'message': '我最近很累，撑不下去了',
            'expected_risk': 'medium',
            'description': '中等风险'
        },
        {
            'message': '我想死，活着没有意义',
            'expected_risk': 'high',
            'description': '高风险'
        }
    ]
    
    print("\n💬 3. 测试风险评估...")
    for i, test_case in enumerate(test_cases, 1):
        print(f"\n   测试 {i}: {test_case['description']}")
        print(f"   消息: {test_case['message']}")
        
        try:
            chat_resp = requests.post(f'{backend_url}/api/ai/session/chat',
                                    json={'session_id': session_id, 'message': test_case['message']}, 
                                    headers=headers, timeout=30)
            
            if chat_resp.status_code == 200:
                chat_data = chat_resp.json()
                
                # 提取数据
                response_data = chat_data.get('data', chat_data)
                ai_message = response_data.get('message', '')
                emotion_analysis = response_data.get('emotion_analysis', {})
                risk_assessment = response_data.get('risk_assessment', {})
                
                risk_level = risk_assessment.get('risk_level', 'unknown')
                risk_score = risk_assessment.get('risk_score', 0)
                risk_keywords = risk_assessment.get('risk_keywords', [])
                
                print(f"   🤖 AI回复: {ai_message[:50]}...")
                print(f"   🚨 风险等级: {risk_level}")
                print(f"   📊 风险评分: {risk_score}")
                print(f"   🔍 风险关键词: {risk_keywords}")
                
                # 检查结果
                if risk_level == 'unknown':
                    print(f"   ❌ 风险评估仍然失效")
                elif risk_level == test_case['expected_risk']:
                    print(f"   ✅ 风险评估正确匹配期望等级")
                else:
                    print(f"   ⚠️ 风险等级为 {risk_level}，期望 {test_case['expected_risk']}")
                
                # 检查情绪分析
                emotion = emotion_analysis.get('dominant_emotion', 'unknown')
                print(f"   😊 情绪分析: {emotion}")
                
            else:
                print(f"   ❌ 发送失败: {chat_resp.status_code}")
                print(f"   错误: {chat_resp.text}")
                
        except Exception as e:
            print(f"   ❌ 发送异常: {e}")
    
    print("\n📊 测试总结:")
    print("✅ 已修复方法调用问题（_analyze_user_emotion）")
    print("✅ 已增强风险关键词匹配")
    print("✅ 已修复数据库保存逻辑")
    print("💡 如果风险等级仍显示'unknown'，可能需要进一步调试")

if __name__ == "__main__":
    test_risk_assessment_fix()
