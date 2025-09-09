#!/usr/bin/env python3
"""
调试关键词匹配
Debug Keyword Matching
"""

def debug_keyword_match():
    """调试关键词匹配"""
    print("=" * 60)
    print("🔍 关键词匹配调试")
    print("=" * 60)
    print()
    
    # 危机关键词列表
    crisis_words = [
        '死', '想死', '死去', '去死', '想去死', '自杀', '结束生命', '不想活', '活着没意思',
        '轻生', '自伤', '伤害自己', '消失', '离开这个世界', '解脱',
        '结束这一切', '再见了，人生', '不想活下去', '想要死去', '活不下去'
    ]
    
    # 测试文本
    test_texts = ["我想死", "我想去死", "去死", "想死", "结束这一切"]
    
    for text in test_texts:
        print(f"🧪 测试文本: '{text}'")
        text_lower = text.lower()
        
        matched_keywords = []
        for word in crisis_words:
            if word in text_lower:
                matched_keywords.append(word)
        
        print(f"  匹配的关键词: {matched_keywords}")
        print(f"  危机得分: {len(matched_keywords) * 5}")
        print()
    
    print("=" * 60)

if __name__ == "__main__":
    debug_keyword_match()
