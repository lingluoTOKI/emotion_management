#!/usr/bin/env python3
"""
简单测试情绪映射逻辑
"""

def test_intelligent_emotion_mapping():
    """简化版测试"""
    
    def intelligent_emotion_mapping(message: str, bert_emotion: str) -> str:
        """简化版映射函数"""
        message_lower = message.lower()
        
        # 定义情绪关键词字典
        emotion_keywords = {
            "anxiety": {
                "primary": ["焦虑", "紧张", "担心", "不安", "心慌"],
                "secondary": ["害怕", "恐惧", "担忧", "忧虑", "惶恐", "压力大"]
            },
            "sadness": {
                "primary": ["难过", "伤心", "悲伤", "失落"],
                "secondary": ["沮丧", "低落", "郁闷", "痛苦", "心情不好"]
            },
            "happiness": {
                "primary": ["开心", "高兴", "快乐", "愉快"],
                "secondary": ["兴奋", "满足", "幸福", "喜悦", "愉悦", "喜欢"]
            },
            "anger": {
                "primary": ["愤怒", "生气", "愤恨", "气愤"],
                "secondary": ["烦躁", "恼火", "不满", "讨厌", "火大", "暴躁"]
            }
        }
        
        # 检查明确的情绪关键词
        detected_emotions = {}
        
        for emotion, keywords in emotion_keywords.items():
            primary_score = sum(1 for keyword in keywords["primary"] if keyword in message_lower)
            secondary_score = sum(0.5 for keyword in keywords["secondary"] if keyword in message_lower)
            total_score = primary_score * 2 + secondary_score
            
            if total_score > 0:
                detected_emotions[emotion] = total_score
        
        # 如果检测到明确的情绪关键词，优先使用
        if detected_emotions:
            explicit_emotion = max(detected_emotions, key=detected_emotions.get)
            max_score = detected_emotions[explicit_emotion]
            
            if max_score >= 1.5:
                return explicit_emotion
        
        # 基于BERT的基础分类进行映射
        if bert_emotion == 'positive':
            return "happiness"
        elif bert_emotion == 'negative':
            if detected_emotions:
                return max(detected_emotions, key=detected_emotions.get)
            else:
                stress_indicators = ["压力", "困扰", "烦恼", "麻烦", "问题", "困难"]
                if any(word in message_lower for word in stress_indicators):
                    return "anxiety"
                else:
                    return "sadness"
        else:
            if detected_emotions:
                return max(detected_emotions, key=detected_emotions.get)
            return "neutral"
    
    # 测试用例
    test_cases = [
        ("我很焦虑", "negative", "anxiety"),
        ("我很难过", "negative", "sadness"),
        ("我很开心", "positive", "happiness"),
        ("我喜欢你", "positive", "happiness"),
        ("我很生气", "negative", "anger"),
        ("我遇到了问题", "negative", "anxiety"),
        ("今天不好", "negative", "sadness")
    ]
    
    print("🧪 测试情绪映射逻辑")
    print("=" * 50)
    
    for i, (input_text, bert_emotion, expected) in enumerate(test_cases, 1):
        result = intelligent_emotion_mapping(input_text, bert_emotion)
        status = "✅" if result == expected else "❌"
        print(f"{status} 测试{i}: \"{input_text}\" ({bert_emotion}) -> {result} (期望: {expected})")
    
    print("\n✅ 映射逻辑测试完成")

if __name__ == "__main__":
    test_intelligent_emotion_mapping()
