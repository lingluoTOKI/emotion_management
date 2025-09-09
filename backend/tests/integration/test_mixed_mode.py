"""
混合模式测试脚本
测试情感分析使用EasyBert，问题分类使用现代化BERT的混合配置
"""

from app.services.bert_text_analyzer import bert_analyzer
from app.core.bert_config import BERT_MODEL_PREFERENCE

def test_mixed_mode():
    """测试混合模式配置"""
    print("🔄 BERT混合模式测试")
    print("=" * 60)
    
    # 检查配置
    print(f"📋 当前配置:")
    print(f"   模型偏好设置: {BERT_MODEL_PREFERENCE}")
    
    # 获取系统状态
    status = bert_analyzer.get_status()
    print(f"\n📊 系统状态:")
    print(f"   可用性: {status['available']}")
    print(f"   当前模式: {status['mode']}")
    print(f"   模型偏好: {status.get('model_preference', 'N/A')}")
    print(f"   现代化BERT可用: {status.get('modern_bert_available', False)}")
    print(f"   EasyBert适配器可用: {status.get('easybert_adapter_available', False)}")
    
    print(f"\n🎯 任务分配策略:")
    task_assignments = status.get('task_assignments', {})
    for task, model in task_assignments.items():
        print(f"   {task}: {model}")
    
    print("\n" + "=" * 60)
    
    # 测试文本
    test_texts = [
        "我最近感觉很焦虑，学习压力好大，不知道该怎么办。",
        "今天心情不错，和朋友一起玩得很开心。",
        "我觉得我可能有点抑郁了，每天都很难过。"
    ]
    
    for i, text in enumerate(test_texts, 1):
        print(f"\n📝 测试文本 {i}: {text}")
        print("-" * 40)
        
        # 测试情感分析（应该使用EasyBert）
        print("😊 情感分析 (应该使用EasyBert):")
        try:
            emotion_result = bert_analyzer.analyze_emotion(text)
            print(f"   情感: {emotion_result['dominant_emotion']}")
            print(f"   置信度: {emotion_result['confidence']:.2f}")
            print(f"   分析方法: {emotion_result['analysis_method']}")
            
            # 检查是否使用了EasyBert
            if 'easybert' in emotion_result['analysis_method']:
                print("   ✅ 正在使用EasyBert模型")
            else:
                print("   ⚠️  未使用EasyBert模型")
                
        except Exception as e:
            print(f"   ❌ 错误: {e}")
        
        # 测试问题分类（应该使用现代化BERT）
        print("\n📋 问题分类 (应该使用现代化BERT):")
        try:
            classification_result = bert_analyzer.classify_problem_type(text)
            print(f"   问题类型: {classification_result['problem_type']}")
            print(f"   置信度: {classification_result['confidence']:.2f}")
            print(f"   分析方法: {classification_result['analysis_method']}")
            
            # 检查是否使用了现代化BERT
            if 'modern' in classification_result['analysis_method']:
                print("   ✅ 正在使用现代化BERT")
            else:
                print("   ⚠️  未使用现代化BERT")
                
        except Exception as e:
            print(f"   ❌ 错误: {e}")
    
    print("\n" + "=" * 60)
    print("🎯 综合分析测试:")
    
    test_text = test_texts[0]
    print(f"\n测试文本: {test_text}")
    
    try:
        comprehensive_result = bert_analyzer.comprehensive_analysis(test_text)
        
        print(f"\n📊 综合分析结果:")
        print(f"   情感分析: {comprehensive_result['emotion_analysis']['dominant_emotion']} "
              f"(方法: {comprehensive_result['emotion_analysis']['analysis_method']})")
        print(f"   问题分类: {comprehensive_result['problem_classification']['problem_type']} "
              f"(方法: {comprehensive_result['problem_classification']['analysis_method']})")
        print(f"   风险评估: {comprehensive_result['risk_assessment']['risk_level']}")
        
        # 验证混合模式
        emotion_method = comprehensive_result['emotion_analysis']['analysis_method']
        classification_method = comprehensive_result['problem_classification']['analysis_method']
        
        print(f"\n✅ 混合模式验证:")
        if 'easybert' in emotion_method:
            print("   ✅ 情感分析使用EasyBert ✓")
        else:
            print("   ⚠️  情感分析未使用EasyBert")
        
        if 'modern' in classification_method:
            print("   ✅ 问题分类使用现代化BERT ✓")
        else:
            print("   ⚠️  问题分类未使用现代化BERT")
            
    except Exception as e:
        print(f"   ❌ 综合分析错误: {e}")
    
    print("\n" + "=" * 60)
    print("🎉 混合模式测试完成!")
    print("\n📝 配置总结:")
    print("   ✅ 情感分析: 使用您的EasyBert模型 (高准确率)")
    print("   ✅ 问题分类: 使用现代化BERT (零样本分类)")
    print("   ✅ 实体识别: 使用jieba分词 (中文优化)")
    print("   ✅ 文本相似度: 使用jieba算法 (快速计算)")

if __name__ == "__main__":
    test_mixed_mode()
