#!/usr/bin/env python3
"""
EasyBert模型测试脚本
测试EasyBert模型的情感分析功能
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from app.services.easybert_adapter import analyze_emotion_with_easybert
from app.services.bert_text_analyzer import bert_analyzer
from loguru import logger

def test_easybert_emotion_analysis():
    """测试EasyBert情感分析功能"""
    
    print("=" * 60)
    print("EasyBert模型测试")
    print("=" * 60)
    
    # 测试用例
    test_cases = [
        "我今天很开心，考试通过了！",
        "我很难过，朋友不理我了",
        "我想死，活着没有意思",
        "我有点焦虑，不知道该怎么办",
        "今天天气不错，心情也很好",
        "我绝望了，感觉撑不下去了",
        "测试文本，没有明显情感倾向"
    ]
    
    print(f"测试 {len(test_cases)} 个情感分析用例...")
    print()
    
    for i, text in enumerate(test_cases, 1):
        print(f"测试用例 {i}: {text}")
        
        try:
            # 直接使用EasyBert适配器
            result = analyze_emotion_with_easybert(text)
            
            print(f"  EasyBert结果: {result['dominant_emotion']} (置信度: {result['confidence']:.3f})")
            print(f"  分析方法: {result['analysis_method']}")
            
            if 'debug_scores' in result:
                debug = result['debug_scores']
                print(f"  详细得分: 危机={debug['crisis']}, 严重负面={debug['severe_negative']}, 一般负面={debug['negative']}, 积极={debug['positive']}")
            
        except Exception as e:
            print(f"  EasyBert测试失败: {e}")
        
        print()
    
    print("=" * 60)
    print("BERT分析器状态检查")
    print("=" * 60)
    
    # 检查BERT分析器状态
    status = bert_analyzer.get_status()
    print(f"分析器可用: {status['available']}")
    print(f"模型已加载: {status['models_loaded']}")
    print(f"当前模式: {status['mode']}")
    print(f"模型偏好: {status['model_preference']}")
    print(f"EasyBert适配器可用: {status['easybert_adapter_available']}")
    print(f"任务分配: {status['task_assignments']}")
    
    print()
    print("=" * 60)
    print("综合测试")
    print("=" * 60)
    
    # 测试综合分析
    test_text = "我最近压力很大，学习跟不上，朋友也不理解我，感觉很孤独"
    print(f"测试文本: {test_text}")
    
    try:
        # 使用BERT分析器进行综合分析
        comprehensive_result = bert_analyzer.comprehensive_analysis(test_text)
        
        print("综合分析结果:")
        print(f"  情感分析: {comprehensive_result['emotion_analysis']['dominant_emotion']} (置信度: {comprehensive_result['emotion_analysis']['confidence']:.3f})")
        print(f"  问题分类: {comprehensive_result['problem_classification']['problem_type']}")
        print(f"  风险等级: {comprehensive_result['risk_assessment']['risk_level']}")
        print(f"  分析方法: {comprehensive_result['analysis_method']}")
        
    except Exception as e:
        print(f"综合分析测试失败: {e}")
    
    print()
    print("=" * 60)
    print("测试完成")
    print("=" * 60)

if __name__ == "__main__":
    test_easybert_emotion_analysis()
