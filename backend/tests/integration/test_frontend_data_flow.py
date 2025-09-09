#!/usr/bin/env python3
"""
测试前端数据流
Test Frontend Data Flow
"""

import asyncio
import sys
import os
import json

sys.path.append(os.path.join(os.path.dirname(__file__)))

from app.services.ai_counseling_service import AICounselingService

async def test_frontend_data_flow():
    """测试前端数据流"""
    print("=" * 60)
    print("🔍 前端数据流测试")
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
        
        print("📊 后端返回的完整数据结构:")
        print(json.dumps(response, ensure_ascii=False, indent=2))
        
        print("\n🎯 关键数据提取:")
        print(f"  情绪分析: {response.get('emotion_analysis', {})}")
        print(f"  风险评估: {response.get('risk_assessment', {})}")
        
        # 模拟前端处理逻辑
        emotion_data = response.get('emotion_analysis', {})
        risk_data = response.get('risk_assessment', {})
        
        # 情绪映射
        emotion_mapping = {
            'sadness': '悲伤',
            'anxiety': '焦虑', 
            'anger': '愤怒',
            'fear': '恐惧',
            'neutral': '平稳',
            'positive': '开心',
            'negative': '悲伤'
        }
        
        dominant_emotion = emotion_data.get('dominant_emotion', 'neutral')
        chinese_emotion = emotion_mapping.get(dominant_emotion, dominant_emotion)
        risk_level = risk_data.get('risk_level', 'low')
        
        print(f"\n🔄 前端应该显示:")
        print(f"  当前情绪: {chinese_emotion}")
        print(f"  风险等级: {risk_level}")
        
        # 检查是否正确
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
    asyncio.run(test_frontend_data_flow())
