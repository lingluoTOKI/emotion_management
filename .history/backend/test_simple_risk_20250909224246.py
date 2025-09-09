#!/usr/bin/env python3
"""
简单测试风险评估修复
"""
import re

def assess_risk_level_simple(message):
    """简化版风险评估测试"""
    message_lower = message.lower()
    print(f"  🔍 分析文本: '{message_lower}'")
    
    # 高风险关键词
    high_risk_keywords = [
        "自杀", "死亡", "不想活", "结束生命", "想死"
    ]
    
    # 中风险关键词 - 使用更灵活的匹配
    medium_risk_keywords = [
        "绝望", "痛苦", "没有希望", "孤独", "崩溃",
        "说不上", "没什么话", "聊不来", "交流困难", "社交困难"
    ]
    
    risk_score = 0
    risk_keywords = []
    
    # 检查高风险关键词
    for keyword in high_risk_keywords:
        if keyword in message_lower:
            risk_score += 3
            risk_keywords.append(keyword)
    
    # 检查中风险关键词
    for keyword in medium_risk_keywords:
        if keyword in message_lower:
            risk_score += 2
            risk_keywords.append(keyword)
            print(f"  🎯 匹配到中风险关键词: '{keyword}'")
    
    # 矛盾情绪检测
    positive_keywords = ["快乐", "开心", "高兴", "愉快", "幸福"]
    negative_social_keywords = ["说不上", "孤独", "没什么话", "聊不来"]
    
    has_positive = any(keyword in message_lower for keyword in positive_keywords)
    has_negative_social = any(keyword in message_lower for keyword in negative_social_keywords)
    
    if has_positive and has_negative_social:
        risk_score += 1
        risk_keywords.append("矛盾情绪模式")
    
    # 确定风险等级
    if risk_score >= 3:
        risk_level = "high"
    elif risk_score >= 2:
        risk_level = "medium"
    elif risk_score >= 1:
        risk_level = "low"
    else:
        risk_level = "minimal"
    
    return {
        "risk_level": risk_level,
        "risk_score": risk_score,
        "risk_keywords": risk_keywords
    }

# 测试您的对话
test_cases = [
    "我很快乐",
    "感觉和大家都说不上什么话",
    "我很快乐，但是感觉和大家都说不上什么话"
]

print("🔍 测试修复后的风险评估逻辑")
print("=" * 50)

for i, message in enumerate(test_cases, 1):
    print(f"\n📝 测试 {i}: \"{message}\"")
    result = assess_risk_level_simple(message)
    print(f"⚠️ 风险等级: {result['risk_level']}")
    print(f"📊 风险分数: {result['risk_score']}")
    print(f"🔍 检测到的关键词: {result['risk_keywords']}")
    print("-" * 30)
