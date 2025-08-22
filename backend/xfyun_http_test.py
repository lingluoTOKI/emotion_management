#!/usr/bin/env python3
"""
科大讯飞AI服务HTTP接口测试
XFYun AI Service HTTP API Test

用于验证科大讯飞AI集成是否正常工作
仅使用HTTP接口，配置已内置到系统中
"""

import requests
import json

def test_local_api():
    """测试本地集成的科大讯飞AI服务"""
    print("🎯 测试科大讯飞AI服务集成")
    print("="*50)
    
    base_url = "http://localhost:8000"
    
    try:
        # 1. 测试服务状态
        print("📊 1. 检查AI服务状态...")
        response = requests.get(f"{base_url}/api/ai-service/status", timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            xfyun_status = data['data']['service_status'].get('xfyun', {})
            available = xfyun_status.get('available', False)
            
            print(f"   ✅ 服务状态: {'可用' if available else '不可用'}")
            if not available:
                print(f"   ❌ 错误: {xfyun_status.get('error', 'N/A')}")
                return False
        else:
            print(f"   ❌ 服务异常: HTTP {response.status_code}")
            return False
        
        # 2. 测试AI对话
        print("💬 2. 测试AI对话功能...")
        chat_data = {"message": "你好，这是一个测试"}
        response = requests.post(f"{base_url}/api/ai-service/test/chat", json=chat_data, timeout=15)
        
        if response.status_code == 200:
            data = response.json()
            ai_response = data['data'].get('ai_response', '')
            print(f"   ✅ AI回复: {ai_response}")
        else:
            print(f"   ❌ 对话测试失败: HTTP {response.status_code}")
            return False
        
        # 3. 测试情绪分析
        print("😊 3. 测试情绪分析功能...")
        emotion_data = {"text": "我今天心情很好，阳光明媚"}
        response = requests.post(f"{base_url}/api/ai-service/test/emotion", json=emotion_data, timeout=30)  # 增加超时时间
        
        if response.status_code == 200:
            data = response.json()
            emotion_result = data['data']['emotion_analysis']
            dominant_emotion = emotion_result.get('dominant_emotion', 'N/A')
            intensity = emotion_result.get('intensity', 0)
            print(f"   ✅ 主导情绪: {dominant_emotion} (强度: {intensity})")
        else:
            print(f"   ❌ 情绪分析失败: HTTP {response.status_code}")
            return False
        
        # 4. 测试心理咨询
        print("🧠 4. 测试心理咨询功能...")
        psych_data = {
            "user_message": "我最近感到有些焦虑",
            "emotion_state": "anxiety",
            "risk_level": "low"
        }
        response = requests.post(f"{base_url}/api/ai-service/test/psychological", json=psych_data, timeout=30)  # 增加超时时间
        
        if response.status_code == 200:
            data = response.json()
            psych_response = data['data'].get('psychological_response', '')
            print(f"   ✅ 心理回复: {psych_response[:100]}...")
        else:
            print(f"   ❌ 心理咨询失败: HTTP {response.status_code}")
            return False
        
        print("\n🎉 所有测试通过! 科大讯飞AI服务集成成功!")
        return True
        
    except Exception as e:
        print(f"❌ 测试异常: {str(e)}")
        print("💡 请确保应用正在运行: python main.py")
        return False

def test_direct_api():
    """直接测试科大讯飞API(备用方法)"""
    print("\n🔍 直接API测试 (备用验证)")
    print("-" * 30)
    
    try:
        from openai import OpenAI
        
        # 使用内置配置
        api_key = "sk-4JpoOnxubRLv83ppEc8e0b51935049D9B1B4543103845bC2"
        api_base = "https://maas-api.cn-huabei-1.xf-yun.com/v1"
        model_id = "xopgptoss120b"
        
        client = OpenAI(api_key=api_key, base_url=api_base)
        
        response = client.chat.completions.create(
            model=model_id,
            messages=[{"role": "user", "content": "简单回答：你好"}],
            max_tokens=30,
            temperature=0.7
        )
        
        if response and response.choices:
            content = response.choices[0].message.content
            print(f"✅ 直接API成功: {content}")
            return True
        else:
            print("❌ 直接API失败")
            return False
            
    except ImportError:
        print("⚠️ 需要安装openai库: pip install openai")
        return False
    except Exception as e:
        print(f"❌ 直接API错误: {str(e)}")
        return False

def main():
    print("🚀 科大讯飞AI服务完整测试")
    print("="*60)
    print("📋 测试内容:")
    print("   - AI服务状态")
    print("   - AI对话功能") 
    print("   - 情绪分析功能")
    print("   - 心理咨询功能")
    print("="*60)
    
    # 测试本地集成API
    success = test_local_api()
    
    if not success:
        print("\n⚠️ 本地API测试失败，尝试直接API测试...")
        test_direct_api()

if __name__ == "__main__":
    main()
