#!/usr/bin/env python3
"""
测试AI咨询服务中的BERT分析
Test BERT Analysis in AI Counseling Service
"""

import asyncio
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__)))

# 直接测试BERT分析器
from app.services.bert_text_analyzer import bert_analyzer

def test_direct_bert():
    """直接测试BERT分析器"""
    print("=" * 60)
    print("🔍 直接测试BERT分析器")
    print("=" * 60)
    
    test_text = "我想死"
    print(f"🧪 测试文本: '{test_text}'")
    
    result = bert_analyzer.analyze_emotion(test_text)
    print(f"📊 BERT分析结果:")
    print(f"  dominant_emotion: {result.get('dominant_emotion')}")
    print(f"  confidence: {result.get('confidence')}")
    print(f"  analysis_method: {result.get('analysis_method')}")
    
    print("\n" + "=" * 60)

if __name__ == "__main__":
    test_direct_bert()
