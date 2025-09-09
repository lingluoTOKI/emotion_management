#!/usr/bin/env python3
"""
测试API响应格式
Test API Response Format
"""

import asyncio
import sys
import os
import json

sys.path.append(os.path.join(os.path.dirname(__file__)))

from app.services.ai_counseling_service import AICounselingService

async def test_api_response():
    """测试API响应格式"""
    print("=" * 60)
    print("🔍 API响应格式测试")
    print("=" * 60)
    print()
    
    service = AICounselingService()
    
    # 测试"我想死"
    test_text = "我想死"
    
    print(f"🧪 测试文本: '{test_text}'")
    print("-" * 40)
    
    try:
        # 开始会话
        start_response = await service.start_session(
            student_id=1,
            problem_type="AI智能评估对话"
        )
        session_id = start_response["session_id"]
        
        # 发送消息
        response = await service.continue_conversation(session_id, test_text)
        
        print("📊 模拟前端API调用结果:")
        print(f"  message: {response.get('message', '')[:50]}...")
        print(f"  session_id: {response.get('session_id', '')}")
        
        # 检查emotion_analysis结构
        emotion_analysis = response.get('emotion_analysis', {})
        print(f"\n🧠 emotion_analysis结构:")
        print(f"  dominant_emotion: {emotion_analysis.get('dominant_emotion', 'N/A')}")
        print(f"  emotion_intensity: {emotion_analysis.get('emotion_intensity', 'N/A')}")
        print(f"  confidence: {emotion_analysis.get('confidence', 'N/A')}")
        print(f"  analysis_method: {emotion_analysis.get('analysis_method', 'N/A')}")
        
        # 检查risk_assessment结构
        risk_assessment = response.get('risk_assessment', {})
        print(f"\n⚠️ risk_assessment结构:")
        print(f"  risk_level: {risk_assessment.get('risk_level', 'N/A')}")
        print(f"  risk_score: {risk_assessment.get('risk_score', 'N/A')}")
        print(f"  risk_keywords: {risk_assessment.get('risk_keywords', [])}")
        
        # 检查redirect_action
        redirect_action = response.get('redirect_action')
        print(f"\n🔄 redirect_action: {redirect_action}")
        
        # 模拟前端处理逻辑
        print(f"\n🔄 前端应该显示:")
        emotion_mapping = {
            'sadness': '悲伤',
            'anxiety': '焦虑', 
            'anger': '愤怒',
            'fear': '恐惧',
            'neutral': '平稳',
            'positive': '开心',
            'negative': '悲伤'
        }
        
        dominant_emotion = emotion_analysis.get('dominant_emotion', 'neutral')
        chinese_emotion = emotion_mapping.get(dominant_emotion, dominant_emotion)
        risk_level = risk_assessment.get('risk_level', 'low')
        
        print(f"  当前情绪: {chinese_emotion}")
        print(f"  风险等级: {risk_level}")
        
        # 验证结果
        expected_emotion = "悲伤"
        expected_risk = "high"
        
        print(f"\n✅ 验证结果:")
        print(f"  情绪显示: {'✅ 正确' if chinese_emotion == expected_emotion else '❌ 错误'}")
        print(f"  风险显示: {'✅ 正确' if risk_level == expected_risk else '❌ 错误'}")
        
        if chinese_emotion != expected_emotion or risk_level != expected_risk:
            print(f"\n❌ 问题分析:")
            if chinese_emotion != expected_emotion:
                print(f"  情绪映射问题: {dominant_emotion} -> {chinese_emotion} (期望: {expected_emotion})")
            if risk_level != expected_risk:
                print(f"  风险等级问题: {risk_level} (期望: {expected_risk})")
        
    except Exception as e:
        print(f"❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    asyncio.run(test_api_response())
