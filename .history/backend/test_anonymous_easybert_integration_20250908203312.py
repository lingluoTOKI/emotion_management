#!/usr/bin/env python3
"""
测试匿名咨询页面的EasyBert集成
"""

import requests
import json

# 测试配置
BASE_URL = "http://localhost:8000"

def test_emotion_analysis_api():
    """测试情绪分析API"""
    print("🧪 测试匿名咨询EasyBert集成")
    print("=" * 50)
    
    # 测试用例
    test_messages = [
        "每天做些开心的事情",
        "我感觉非常好", 
        "出去旅游，游山玩水最让人放松",
        "我有点担心和焦虑",
        "感觉很痛苦，没有希望了",
        "不想活了"
    ]
    
    for message in test_messages:
        print(f"\n📝 测试消息: '{message}'")
        
        try:
            response = requests.post(
                f"{BASE_URL}/api/ai/test/emotion",
                json={"message": message},
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                risk_data = data.get('risk_assessment', {})
                emotion_data = data.get('emotion_analysis', {})
                
                print(f"   风险等级: {risk_data.get('risk_level', 'N/A')}")
                print(f"   风险分数: {risk_data.get('risk_score', 'N/A')}")
                print(f"   主导情绪: {emotion_data.get('dominant_emotion', 'N/A')}")
                print(f"   情绪强度: {emotion_data.get('emotion_intensity', 'N/A')}")
                print(f"   情感极性: {emotion_data.get('sentiment_score', 'N/A')}")
            else:
                print(f"   ❌ API调用失败: {response.status_code}")
                print(f"   错误信息: {response.text}")
                
        except Exception as e:
            print(f"   ❌ 请求异常: {str(e)}")
    
    print("\n✅ EasyBert集成测试完成！")

if __name__ == "__main__":
    test_emotion_analysis_api()
