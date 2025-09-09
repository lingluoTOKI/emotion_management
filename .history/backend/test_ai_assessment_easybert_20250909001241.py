"""
测试AI评估对话中EasyBert情感分析的调用
Test EasyBert emotion analysis in AI assessment conversation
"""
import requests
import json

def test_ai_assessment_easybert():
    """测试AI评估对话中的EasyBert调用"""
    
    base_url = "http://localhost:8000"
    
    # 测试用户登录信息（确保是学生用户）
    login_data = {
        "username": "test_student",
        "password": "123456"
    }
    
    print("🔐 正在登录测试用户...")
    
    # 登录获取token
    login_response = requests.post(f"{base_url}/api/auth/login", json=login_data)
    if login_response.status_code != 200:
        print(f"❌ 登录失败: {login_response.status_code}")
        print(f"响应: {login_response.text}")
        return
    
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    print("✅ 登录成功，开始测试AI评估对话...")
    
    # 1. 启动AI会话
    session_start_data = {
        "problem_type": "AI智能评估对话",
        "initial_message": "用户已准备好开始心理健康评估对话"
    }
    
    print("🚀 启动AI评估会话...")
    session_response = requests.post(
        f"{base_url}/api/ai/session/start", 
        json=session_start_data,
        headers=headers
    )
    
    if session_response.status_code != 200:
        print(f"❌ 启动会话失败: {session_response.status_code}")
        print(f"响应: {session_response.text}")
        return
    
    session_data = session_response.json()
    session_id = session_data["session_id"]
    print(f"✅ AI会话启动成功，session_id: {session_id}")
    
    # 2. 发送测试消息 - 包含明显情感的文本
    test_messages = [
        "我最近心情很不好，感觉很沮丧",
        "我很焦虑，总是担心各种事情",
        "我感到很开心，一切都很顺利",
        "我觉得很累，对什么都没兴趣"
    ]
    
    for i, message in enumerate(test_messages, 1):
        print(f"\n📨 测试消息 {i}: '{message}'")
        
        chat_data = {
            "session_id": session_id,
            "message": message
        }
        
        chat_response = requests.post(
            f"{base_url}/api/ai/session/chat",
            json=chat_data,
            headers=headers
        )
        
        if chat_response.status_code == 200:
            response_data = chat_response.json()
            
            print(f"✅ AI回复: {response_data['message'][:100]}...")
            
            # 重点检查emotion_analysis字段
            emotion_analysis = response_data.get('emotion_analysis', {})
            print(f"🧠 情感分析结果: {json.dumps(emotion_analysis, ensure_ascii=False, indent=2)}")
            
            # 检查risk_assessment字段
            risk_assessment = response_data.get('risk_assessment', {})
            print(f"⚠️ 风险评估结果: {json.dumps(risk_assessment, ensure_ascii=False, indent=2)}")
            
            # 检查是否包含EasyBert特有的字段
            if 'analysis_method' in emotion_analysis:
                print(f"🔍 分析方法: {emotion_analysis['analysis_method']}")
            
            if 'confidence' in emotion_analysis:
                print(f"📊 置信度: {emotion_analysis['confidence']}")
                
            if 'dominant_emotion' in emotion_analysis:
                print(f"😊 主导情绪: {emotion_analysis['dominant_emotion']}")
            
        else:
            print(f"❌ 对话失败: {chat_response.status_code}")
            print(f"响应: {chat_response.text}")
            
        print("-" * 60)

if __name__ == "__main__":
    test_ai_assessment_easybert()
