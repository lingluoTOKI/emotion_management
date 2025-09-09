"""
模型对比测试脚本
用于对比现代化BERT和您的EasyBert模型的效果
"""

import asyncio
from app.services.modern_bert_analyzer import modern_bert_analyzer
from app.services.easybert_adapter import easybert_adapter

def test_model_comparison():
    """对比测试不同模型的效果"""
    print("🔍 BERT模型对比测试")
    print("=" * 50)
    
    # 测试文本
    test_texts = [
        "我最近感觉很焦虑，学习压力好大，不知道该怎么办。",
        "今天心情不错，和朋友一起玩得很开心。",
        "我觉得我可能有点抑郁了，每天都很难过。",
        "家里人总是不理解我，我感觉很孤独。"
    ]
    
    print("\n📊 模型可用性检查:")
    
    # 检查现代化BERT状态
    modern_status = modern_bert_analyzer.get_status()
    print(f"现代化BERT - 可用: {modern_status['available']}, 设备: {modern_status['device']}")
    
    # 检查EasyBert适配器状态
    easybert_status = easybert_adapter.get_status()
    print(f"您的EasyBert - 可用: {easybert_status['available']}, 可用模型: {easybert_status['available_models']}")
    
    print("\n" + "=" * 50)
    
    for i, text in enumerate(test_texts, 1):
        print(f"\n📝 测试文本 {i}: {text}")
        print("-" * 40)
        
        # 测试现代化BERT
        print("🤖 现代化BERT结果:")
        try:
            modern_emotion = modern_bert_analyzer.analyze_emotion(text)
            modern_classification = modern_bert_analyzer.classify_problem_type(text)
            
            print(f"   情感: {modern_emotion['dominant_emotion']} (置信度: {modern_emotion['confidence']:.2f})")
            print(f"   分类: {modern_classification['problem_type']} (置信度: {modern_classification['confidence']:.2f})")
            print(f"   方法: {modern_emotion['analysis_method']}")
        except Exception as e:
            print(f"   ❌ 错误: {e}")
        
        # 测试您的EasyBert模型
        print("\n📦 您的EasyBert结果:")
        try:
            easybert_emotion = easybert_adapter.analyze_emotion_with_easybert(text)
            easybert_classification = easybert_adapter.classify_problem_with_easybert(text)
            
            print(f"   情感: {easybert_emotion['dominant_emotion']} (置信度: {easybert_emotion['confidence']:.2f})")
            print(f"   分类: {easybert_classification['problem_type']} (置信度: {easybert_classification['confidence']:.2f})")
            print(f"   方法: {easybert_emotion['analysis_method']}")
            print(f"   模型路径: {easybert_emotion.get('model_path', 'N/A')}")
        except Exception as e:
            print(f"   ❌ 错误: {e}")
    
    print("\n" + "=" * 50)
    print("📈 综合对比测试:")
    
    # 综合分析对比
    test_text = test_texts[0]
    print(f"\n测试文本: {test_text}")
    
    print("\n🤖 现代化BERT综合分析:")
    try:
        modern_comprehensive = modern_bert_analyzer.comprehensive_analysis(test_text)
        print(f"   情感: {modern_comprehensive['emotion_analysis']['dominant_emotion']}")
        print(f"   分类: {modern_comprehensive['problem_classification']['problem_type']}")
        print(f"   风险: {modern_comprehensive['risk_assessment']['risk_level']}")
        print(f"   实体: {len(modern_comprehensive['entity_extraction']['entities']['persons'])} 个人名")
    except Exception as e:
        print(f"   ❌ 错误: {e}")
    
    print("\n📦 您的EasyBert综合分析:")
    try:
        easybert_comprehensive = easybert_adapter.comprehensive_analysis(test_text)
        print(f"   情感: {easybert_comprehensive['emotion_analysis']['dominant_emotion']}")
        print(f"   分类: {easybert_comprehensive['problem_classification']['problem_type']}")
        print(f"   风险: {easybert_comprehensive['risk_assessment']['risk_level']}")
        print(f"   可用模型: {easybert_comprehensive['available_models']}")
    except Exception as e:
        print(f"   ❌ 错误: {e}")

def create_model_switcher():
    """创建模型切换器"""
    print("\n🔄 模型切换器")
    print("您可以选择使用哪种BERT模型:")
    print("1. 现代化BERT (推荐) - 使用最新的预训练模型")
    print("2. 您的EasyBert - 使用您下载的bert.ckpt模型")
    print("3. 混合模式 - 根据任务自动选择最佳模型")
    
    print("\n当前系统配置:")
    print("- 优先级: 现代化BERT > EasyBert适配器 > 原始EasyBert > 后备方案")
    print("- 您的EasyBert模型已被检测到并可以使用")
    print("- 系统会自动选择最佳可用模型")

if __name__ == "__main__":
    test_model_comparison()
    create_model_switcher()
