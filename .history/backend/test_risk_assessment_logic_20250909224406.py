#!/usr/bin/env python3
"""
测试风险评估逻辑的准确性
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.ai_counseling_service import AICounselingService
from app.services.easybert_adapter import EasyBertAdapter
import asyncio

async def test_risk_assessment():
    print("🔍 测试风险评估逻辑")
    print("=" * 60)
    
    ai_service = AICounselingService()
    bert_adapter = EasyBertAdapter()
    
    # 测试案例1：声称快乐但有社交问题
    test_cases = [
        {
            "message": "我很快乐",
            "expected_risk": "low",
            "description": "表达积极情绪"
        },
        {
            "message": "感觉和大家都说不上什么话",
            "expected_risk": "medium",
            "description": "社交困难"
        },
        {
            "message": "我很快乐，但是感觉和大家都说不上什么话，有点孤独",
            "expected_risk": "medium",
            "description": "矛盾情绪：快乐但孤独"
        },
        {
            "message": "我想死",
            "expected_risk": "high",
            "description": "自杀倾向"
        }
    ]
    
    for i, case in enumerate(test_cases, 1):
        print(f"\n📝 测试案例 {i}: {case['description']}")
        print(f"💬 用户输入: \"{case['message']}\"")
        print(f"🎯 预期风险: {case['expected_risk']}")
        
        try:
            # 1. EasyBert情感分析
            bert_result = await bert_adapter.analyze_emotion_with_easybert(case["message"])
            print(f"🧠 EasyBert分析: {bert_result.get('dominant_emotion', 'N/A')} (置信度: {bert_result.get('confidence', 0):.2f})")
            
            # 2. 风险评估
            risk_assessment = ai_service._assess_risk_level(case["message"], bert_result)
            actual_risk = risk_assessment.get("risk_level", "unknown")
            
            print(f"⚠️ 实际风险: {actual_risk}")
            print(f"📊 风险分数: {risk_assessment.get('total_risk_score', 0)}")
            print(f"🔍 风险因素: {risk_assessment.get('risk_factors', [])}")
            
            # 判断是否匹配
            if actual_risk == case["expected_risk"]:
                print("✅ 风险评估正确")
            else:
                print("❌ 风险评估不准确!")
                print(f"   期望: {case['expected_risk']}, 实际: {actual_risk}")
                
        except Exception as e:
            print(f"💥 测试失败: {e}")
        
        print("-" * 40)

if __name__ == "__main__":
    asyncio.run(test_risk_assessment())
