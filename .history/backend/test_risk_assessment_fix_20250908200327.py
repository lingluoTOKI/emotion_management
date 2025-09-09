#!/usr/bin/env python3
"""
测试风险评估修复
"""

import asyncio
from app.services.comprehensive_assessment_service import ComprehensiveAssessmentService

async def test_risk_assessment():
    """测试风险评估算法"""
    service = ComprehensiveAssessmentService()
    
    # 测试案例1：积极回答
    positive_messages = [
        "我最近感觉还不错",
        "虽然有些压力但还能应付",
        "谢谢您的关心，我会努力的",
        "我觉得生活还是有希望的",
        "我很感谢身边人的帮助"
    ]
    
    # 测试案例2：中性回答
    neutral_messages = [
        "我最近状态一般",
        "有时候会感到一些压力",
        "工作学习还可以",
        "没什么特别的问题"
    ]
    
    # 测试案例3：消极但不危险
    negative_messages = [
        "我最近有点难过",
        "感觉压力很大",
        "有时候会感到孤独",
        "心情不太好"
    ]
    
    # 测试案例4：高风险回答
    high_risk_messages = [
        "我觉得没有希望了",
        "不想活了",
        "感觉生活没有意义",
        "想要结束这一切"
    ]
    
    # 模拟BERT分析（低风险分数）
    low_bert_analysis = {
        "risk_assessment": {
            "risk_score": 1.5  # 低于阈值
        }
    }
    
    test_cases = [
        ("积极回答", positive_messages, low_bert_analysis),
        ("中性回答", neutral_messages, low_bert_analysis),
        ("消极但不危险", negative_messages, low_bert_analysis),
        ("高风险回答", high_risk_messages, {"risk_assessment": {"risk_score": 8}})
    ]
    
    print("🧪 风险评估算法测试")
    print("=" * 50)
    
    for case_name, messages, bert_analysis in test_cases:
        result = service._assess_conversation_risks(messages, bert_analysis)
        
        print(f"\n📋 测试案例: {case_name}")
        print(f"   风险等级: {result['risk_level']}")
        print(f"   风险分数: {result['risk_score']:.2f}")
        print(f"   高风险指标: {result['high_risk_indicators']}")
        print(f"   中风险指标: {result['medium_risk_indicators']}")
        print(f"   积极指标: {result['positive_indicators']}")
        print(f"   负面分数: {result['negative_score']}")
        print(f"   积极调整: {result['positive_adjustment']:.2f}")
        
        if result['positive_keywords_found']:
            print(f"   发现积极关键词: {result['positive_keywords_found']}")
        if result['risk_keywords_found']:
            print(f"   发现风险关键词: {result['risk_keywords_found']}")
    
    print("\n✅ 风险评估测试完成！")

if __name__ == "__main__":
    asyncio.run(test_risk_assessment())
