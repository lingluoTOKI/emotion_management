"""
BERT集成测试脚本
Test Script for BERT Integration
"""

import asyncio
import sys
import os

# 添加项目路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.bert_text_analyzer import bert_analyzer
from app.services.ai_counseling_service import AICounselingService
from loguru import logger


async def test_bert_analyzer():
    """测试BERT分析器"""
    print("🔍 开始测试BERT分析器...")
    
    # 测试文本
    test_texts = [
        "我最近感觉很焦虑，学习压力好大，不知道该怎么办。",
        "今天心情不错，和朋友一起玩得很开心。",
        "我觉得我可能有点抑郁了，每天都很难过。",
        "家里人总是不理解我，我感觉很孤独。"
    ]
    
    # 1. 测试状态检查
    print("\n📊 检查BERT分析器状态:")
    status = bert_analyzer.get_status()
    print(f"   可用性: {status['available']}")
    print(f"   模型已加载: {status.get('models_loaded', False)}")
    print(f"   支持功能: {status.get('supported_features', [])}")
    
    # 2. 测试情感分析
    print("\n😊 测试情感分析:")
    for i, text in enumerate(test_texts, 1):
        print(f"\n   测试文本 {i}: {text}")
        emotion_result = bert_analyzer.analyze_emotion(text)
        print(f"   情感: {emotion_result['dominant_emotion']}")
        print(f"   置信度: {emotion_result['confidence']:.2f}")
        print(f"   分析方法: {emotion_result['analysis_method']}")
    
    # 3. 测试问题分类
    print("\n📋 测试问题类型分类:")
    for i, text in enumerate(test_texts, 1):
        print(f"\n   测试文本 {i}: {text}")
        classification_result = bert_analyzer.classify_problem_type(text)
        print(f"   问题类型: {classification_result['problem_type']}")
        print(f"   置信度: {classification_result['confidence']:.2f}")
        print(f"   分析方法: {classification_result['analysis_method']}")
    
    # 4. 测试实体识别
    print("\n🏷️  测试命名实体识别:")
    test_text = "我是北京大学的学生张三，最近和室友李四发生了矛盾。"
    print(f"   测试文本: {test_text}")
    entity_result = bert_analyzer.extract_entities(test_text)
    print(f"   识别的实体: {entity_result['entities']}")
    print(f"   分析方法: {entity_result['analysis_method']}")
    
    # 5. 测试文本相似度
    print("\n🔗 测试文本相似度:")
    text1 = test_texts[0]
    text2 = test_texts[2]
    print(f"   文本1: {text1}")
    print(f"   文本2: {text2}")
    similarity_result = bert_analyzer.calculate_text_similarity(text1, text2)
    print(f"   相似度: {similarity_result['similarity_score']:.2f}")
    print(f"   是否相似: {similarity_result['is_similar']}")
    print(f"   分析方法: {similarity_result['analysis_method']}")
    
    # 6. 测试综合分析
    print("\n🎯 测试综合分析:")
    comprehensive_text = test_texts[0]
    print(f"   测试文本: {comprehensive_text}")
    comprehensive_result = bert_analyzer.comprehensive_analysis(comprehensive_text)
    print(f"   情感分析: {comprehensive_result['emotion_analysis']['dominant_emotion']}")
    print(f"   问题分类: {comprehensive_result['problem_classification']['problem_type']}")
    print(f"   风险评估: {comprehensive_result['risk_assessment']['risk_level']}")
    
    print("\n✅ BERT分析器测试完成!")


async def test_ai_counseling_with_bert():
    """测试AI咨询服务的BERT集成"""
    print("\n🤖 开始测试AI咨询服务的BERT集成...")
    
    # 创建AI咨询服务实例
    ai_service = AICounselingService()
    
    # 开始会话
    print("\n📞 开始AI咨询会话:")
    session_result = await ai_service.start_session(
        student_id=12345,
        problem_type="学习压力"
    )
    session_id = session_result["session_id"]
    print(f"   会话ID: {session_id}")
    print(f"   开场白: {session_result['message']}")
    
    # 用户消息测试
    test_messages = [
        "我最近学习压力很大，感觉快要崩溃了。",
        "我总是担心考试成绩，晚上睡不着觉。",
        "有时候我觉得自己很没用，什么都做不好。"
    ]
    
    for i, message in enumerate(test_messages, 1):
        print(f"\n💬 用户消息 {i}: {message}")
        
        # 继续对话
        response = await ai_service.continue_conversation(session_id, message)
        
        print(f"   AI回复: {response['message'][:100]}...")
        print(f"   情感分析: {response['emotion_analysis']['dominant_emotion']}")
        print(f"   风险等级: {response['risk_assessment']['risk_level']}")
        
        # 检查是否有BERT分析结果
        if 'bert_analysis' in response:
            bert_data = response['bert_analysis']
            if bert_data:
                print(f"   BERT情感: {bert_data.get('emotion_analysis', {}).get('dominant_emotion', 'N/A')}")
                print(f"   BERT问题类型: {bert_data.get('problem_classification', {}).get('problem_type', 'N/A')}")
    
    # 结束会话
    print("\n📋 结束AI咨询会话:")
    summary_result = await ai_service.end_session(session_id)
    print(f"   会话总结: {summary_result.get('summary', {}).get('session_id', 'N/A')}")
    
    print("\n✅ AI咨询服务BERT集成测试完成!")


async def test_bert_status():
    """测试BERT服务状态"""
    print("\n📈 获取BERT服务状态:")
    
    ai_service = AICounselingService()
    status = await ai_service.get_bert_analyzer_status()
    
    print(f"   BERT可用性: {status.get('available', False)}")
    print(f"   模型状态: {status.get('models_loaded', False)}")
    print(f"   支持功能: {status.get('supported_features', [])}")
    
    if not status.get('available', False):
        print(f"   ⚠️  错误信息: {status.get('error', 'Unknown error')}")


async def main():
    """主测试函数"""
    print("🚀 开始BERT集成测试")
    print("=" * 50)
    
    try:
        # 测试BERT分析器
        await test_bert_analyzer()
        
        # 测试AI咨询服务集成
        await test_ai_counseling_with_bert()
        
        # 测试状态获取
        await test_bert_status()
        
        print("\n" + "=" * 50)
        print("🎉 所有测试完成!")
        
    except Exception as e:
        print(f"\n❌ 测试过程中发生错误: {e}")
        logger.error(f"BERT集成测试失败: {e}")


if __name__ == "__main__":
    asyncio.run(main())
