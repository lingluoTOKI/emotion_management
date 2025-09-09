#!/usr/bin/env python3
"""
测试改进后的情绪映射逻辑
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.ai_counseling_service import AICounselingService

def test_emotion_mapping():
    """测试情绪映射逻辑"""
    
    # 创建服务实例
    service = AICounselingService()
    
    # 测试用例
    test_cases = [
        # 焦虑情绪测试
        {
            "input": "我很焦虑",
            "bert_emotion": "negative",
            "expected": "anxiety",
            "description": "明确表达焦虑"
        },
        {
            "input": "我感到很紧张",
            "bert_emotion": "negative", 
            "expected": "anxiety",
            "description": "表达紧张"
        },
        {
            "input": "我很担心明天的考试",
            "bert_emotion": "negative",
            "expected": "anxiety", 
            "description": "表达担心"
        },
        
        # 悲伤情绪测试
        {
            "input": "我很难过",
            "bert_emotion": "negative",
            "expected": "sadness",
            "description": "明确表达悲伤"
        },
        {
            "input": "我感到很失落",
            "bert_emotion": "negative",
            "expected": "sadness",
            "description": "表达失落"
        },
        
        # 开心情绪测试
        {
            "input": "我很开心",
            "bert_emotion": "positive",
            "expected": "happiness",
            "description": "明确表达开心"
        },
        {
            "input": "我喜欢你",
            "bert_emotion": "positive",
            "expected": "happiness",
            "description": "表达喜爱"
        },
        
        # 愤怒情绪测试
        {
            "input": "我很生气",
            "bert_emotion": "negative",
            "expected": "anger",
            "description": "明确表达愤怒"
        },
        {
            "input": "我感到很烦躁",
            "bert_emotion": "negative",
            "expected": "anger",
            "description": "表达烦躁"
        },
        
        # 抑郁情绪测试
        {
            "input": "我感到绝望",
            "bert_emotion": "negative",
            "expected": "depression",
            "description": "表达绝望"
        },
        {
            "input": "生活没有意义",
            "bert_emotion": "negative",
            "expected": "depression",
            "description": "表达无意义感"
        },
        
        # 没有明确关键词的消极情绪
        {
            "input": "我遇到了很多问题",
            "bert_emotion": "negative",
            "expected": "anxiety",
            "description": "压力指标，应倾向于焦虑"
        },
        {
            "input": "今天不太好",
            "bert_emotion": "negative",
            "expected": "sadness",
            "description": "一般消极，默认悲伤"
        },
        
        # 中性情绪但有情绪词汇
        {
            "input": "我觉得有点紧张，但还好",
            "bert_emotion": "neutral",
            "expected": "anxiety",
            "description": "中性但有情绪词汇"
        }
    ]
    
    print("🧪 测试改进后的情绪映射逻辑")
    print("=" * 60)
    
    passed = 0
    total = len(test_cases)
    
    for i, case in enumerate(test_cases, 1):
        print(f"\n📝 测试 {i}: {case['description']}")
        print(f"💬 输入: \"{case['input']}\"")
        print(f"🤖 BERT分类: {case['bert_emotion']}")
        print(f"🎯 期望结果: {case['expected']}")
        
        try:
            # 调用映射函数
            result = service._intelligent_emotion_mapping(
                case['input'], 
                case['bert_emotion'], 
                0.8
            )
            
            print(f"✅ 实际结果: {result}")
            
            if result == case['expected']:
                print(f"✅ 测试通过")
                passed += 1
            else:
                print(f"❌ 测试失败 - 期望 {case['expected']}，得到 {result}")
                
        except Exception as e:
            print(f"💥 测试异常: {e}")
        
        print("-" * 40)
    
    print(f"\n📊 测试总结:")
    print(f"总测试数: {total}")
    print(f"通过数: {passed}")
    print(f"失败数: {total - passed}")
    print(f"通过率: {passed/total*100:.1f}%")
    
    if passed == total:
        print("🎉 所有测试通过！情绪映射逻辑工作正常")
    else:
        print("⚠️ 有测试失败，需要调整映射逻辑")

if __name__ == "__main__":
    test_emotion_mapping()
