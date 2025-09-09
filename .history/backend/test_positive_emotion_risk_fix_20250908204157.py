#!/usr/bin/env python3
"""
测试积极情绪风险评估修复
"""

def test_risk_logic_scenarios():
    """测试前端风险评估逻辑的各种场景"""
    print("🧪 测试积极情绪风险评估修复")
    print("=" * 50)
    
    # 模拟前端的风险评估逻辑
    def calculate_risk_level(sentiment_score, emotion_intensity):
        """模拟前端修复后的风险评估逻辑"""
        if sentiment_score < -0.6 and emotion_intensity > 0.6:
            return 'high'
        elif sentiment_score < -0.3 and emotion_intensity > 0.4:
            return 'medium'
        elif sentiment_score > 0.3:
            return 'low' if emotion_intensity > 0.7 else 'minimal'
        elif -0.3 <= sentiment_score <= 0.3:
            return 'low'
        elif sentiment_score < -0.3:
            return 'low'
        else:
            return 'minimal'
    
    test_cases = [
        # 积极情绪测试
        ("开心的回答 - 高积极性低强度", 0.8, 0.5, "minimal"),
        ("开心的回答 - 高积极性高强度", 0.8, 0.8, "low"),
        ("非常开心 - 极高积极性", 0.9, 0.9, "low"),
        
        # 中性情绪测试
        ("中性回答 - 无明显情感倾向", 0.1, 0.3, "low"),
        ("平静状态", -0.1, 0.2, "low"),
        
        # 负面情绪测试
        ("轻微担忧", -0.4, 0.3, "low"),  # 不满足medium条件
        ("明显焦虑", -0.4, 0.5, "medium"),
        ("严重抑郁", -0.7, 0.8, "high"),
        ("极度痛苦", -0.9, 0.9, "high"),
    ]
    
    print("\n📊 测试结果:")
    all_passed = True
    
    for description, sentiment, intensity, expected in test_cases:
        actual = calculate_risk_level(sentiment, intensity)
        status = "✅" if actual == expected else "❌"
        
        print(f"{status} {description}")
        print(f"   情感极性: {sentiment:+.1f}, 强度: {intensity:.1f}")
        print(f"   期望: {expected}, 实际: {actual}")
        
        if actual != expected:
            all_passed = False
            print(f"   ⚠️  风险评估不正确!")
        print()
    
    print("=" * 50)
    if all_passed:
        print("🎉 所有测试通过！风险评估逻辑修复成功！")
    else:
        print("❌ 部分测试失败，需要进一步调整逻辑")

if __name__ == "__main__":
    test_risk_logic_scenarios()
