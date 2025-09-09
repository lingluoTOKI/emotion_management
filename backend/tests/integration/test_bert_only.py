"""
单独测试BERT情感分析功能
Test BERT emotion analysis functionality only
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.bert_text_analyzer import bert_analyzer
from app.services.easybert_adapter import easybert_adapter

def test_bert_analysis():
    """测试BERT分析功能"""
    print("🧠 BERT情感分析测试")
    print("=" * 50)
    
    # 测试消息
    test_messages = [
        "我最近学习压力特别大，每天都很焦虑",
        "晚上总是失眠，一闭眼就想到明天的考试",
        "我感觉自己快要崩溃了，什么都做不好",
        "今天心情还不错，学到了很多新知识",
        "我很担心明天的面试，不知道能不能通过"
    ]
    
    print(f"\n📋 测试{len(test_messages)}条消息...")
    
    for i, message in enumerate(test_messages, 1):
        print(f"\n--- 测试 {i} ---")
        print(f"输入: {message}")
        
        # 测试BERT分析器
        try:
            result = bert_analyzer.analyze_emotion(message)
            print(f"BERT结果: {result}")
        except Exception as e:
            print(f"BERT分析失败: {e}")
        
        # 测试EasyBert适配器
        try:
            easy_result = easybert_adapter.analyze_emotion_with_easybert(message)
            print(f"EasyBert结果: {easy_result}")
        except Exception as e:
            print(f"EasyBert分析失败: {e}")

def test_easybert_status():
    """测试EasyBert状态"""
    print("\n🔧 EasyBert状态检查")
    print("=" * 50)
    
    status = easybert_adapter.get_status()
    print(f"EasyBert状态: {status}")
    
    # 检查模型文件
    import os
    sentiment_path = "EasyBert/Sentiment/saved_dict/bert.ckpt"
    if os.path.exists(sentiment_path):
        print(f"✅ 情感模型文件存在: {sentiment_path}")
        
        # 获取文件大小
        size = os.path.getsize(sentiment_path)
        print(f"   文件大小: {size / (1024*1024):.1f} MB")
    else:
        print(f"❌ 情感模型文件不存在: {sentiment_path}")

if __name__ == "__main__":
    test_easybert_status()
    test_bert_analysis()
