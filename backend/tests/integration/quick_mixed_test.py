"""
快速混合模式测试
"""

from app.services.bert_text_analyzer import bert_analyzer

def quick_test():
    text = "我最近很焦虑，压力很大"
    print("🔄 快速混合模式测试")
    print(f"测试文本: {text}")
    print()
    
    # 综合分析测试
    result = bert_analyzer.comprehensive_analysis(text)
    
    print("📊 综合分析结果:")
    print(f"   情感: {result['emotion_analysis']['dominant_emotion']} (方法: {result['emotion_analysis']['analysis_method']})")
    print(f"   分类: {result['problem_classification']['problem_type']} (方法: {result['problem_classification']['analysis_method']})")
    print(f"   风险: {result['risk_assessment']['risk_level']}")
    print(f"   分析方法: {result['analysis_method']}")
    
    print()
    print("✅ 混合模式验证:")
    emotion_method = result['emotion_analysis']['analysis_method']
    classification_method = result['problem_classification']['analysis_method']
    
    if 'easybert' in emotion_method:
        print("   ✅ 情感分析使用EasyBert ✓")
    else:
        print("   ⚠️  情感分析未使用EasyBert")
    
    if 'modern' in classification_method:
        print("   ✅ 问题分类使用现代化BERT ✓")
    else:
        print("   ⚠️  问题分类未使用现代化BERT")
        
    if result['analysis_method'] == 'mixed_comprehensive':
        print("   ✅ 综合分析使用混合模式 ✓")
    else:
        print("   ⚠️  综合分析未使用混合模式")

if __name__ == "__main__":
    quick_test()
