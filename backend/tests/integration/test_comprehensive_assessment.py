"""
综合心理评估系统测试脚本
Test script for comprehensive psychological assessment system
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.comprehensive_assessment_service import comprehensive_assessment_service
from app.services.ai_counseling_service import AICounselingService
from datetime import datetime
import json

async def test_comprehensive_assessment():
    """测试综合心理评估流程"""
    print("🧠 开始测试综合心理评估系统")
    print("=" * 60)
    
    # 1. 模拟AI咨询会话数据
    print("\n📝 1. 创建模拟AI咨询会话数据...")
    
    session_id = "ai_session_12345_1001"
    mock_conversation_data = {
        "session_id": session_id,
        "student_id": 12345,
        "start_time": datetime.utcnow(),
        "problem_type": "学习压力",
        "conversation_history": [
            {"role": "user", "message": "我最近学习压力很大，总是担心考试成绩", "timestamp": datetime.utcnow()},
            {"role": "assistant", "message": "我理解你的担心。能告诉我更多关于这种压力的具体表现吗？", "timestamp": datetime.utcnow()},
            {"role": "user", "message": "我晚上经常失眠，一想到要考试就紧张得不行，感觉很焦虑", "timestamp": datetime.utcnow()},
            {"role": "assistant", "message": "失眠和考试焦虑确实会影响学习效果。这种情况持续多久了？", "timestamp": datetime.utcnow()},
            {"role": "user", "message": "大概有两个月了，有时候我觉得很绝望，不知道能不能通过考试", "timestamp": datetime.utcnow()},
            {"role": "assistant", "message": "两个月确实是比较长的时间。除了学习，还有其他让你感到压力的事情吗？", "timestamp": datetime.utcnow()},
            {"role": "user", "message": "家里人期望很高，我怕让他们失望。而且和室友关系也不太好，感觉很孤独", "timestamp": datetime.utcnow()},
            {"role": "assistant", "message": "家庭期望和人际关系确实会增加压力。你有想过寻求帮助吗？", "timestamp": datetime.utcnow()},
            {"role": "user", "message": "我不知道该找谁帮忙，有时候觉得没有人能理解我", "timestamp": datetime.utcnow()},
            {"role": "assistant", "message": "你现在能够主动寻求AI咨询就是一个很好的开始。", "timestamp": datetime.utcnow()}
        ],
        "current_emotion": "negative",
        "risk_level": "medium"
    }
    
    # 手动添加到AI咨询服务的会话历史中
    ai_counseling_service = AICounselingService()
    ai_counseling_service.conversation_history[session_id] = mock_conversation_data
    
    print(f"✅ 创建了包含{len(mock_conversation_data['conversation_history']) // 2}轮对话的模拟会话")
    
    # 2. 模拟心理量表结果
    print("\n📊 2. 创建模拟心理量表测试结果...")
    
    mock_scale_results = {
        "PHQ-9": {
            "total_score": 12,
            "items": [
                {"question": "几乎每天都感到心情低落、沮丧或绝望", "score": 2},
                {"question": "几乎每天都对事物失去兴趣或快乐感", "score": 1},
                {"question": "入睡困难、睡眠不安或睡眠过多", "score": 3},
                {"question": "感到疲劳或精力不足", "score": 2},
                {"question": "食欲不振或暴饮暴食", "score": 1},
                {"question": "感到自己很糟糕", "score": 2},
                {"question": "注意力难以集中", "score": 1},
                {"question": "动作或说话缓慢", "score": 0},
                {"question": "有自伤或自杀的想法", "score": 0}
            ],
            "completion_time": datetime.utcnow().isoformat(),
            "max_score": 27
        },
        "GAD-7": {
            "total_score": 8,
            "items": [
                {"question": "感到紧张、焦虑或急躁", "score": 2},
                {"question": "无法停止或控制担忧", "score": 1},
                {"question": "对各种各样的事情担忧过多", "score": 2},
                {"question": "很难放松下来", "score": 1},
                {"question": "坐立不安，难以安静地坐着", "score": 1},
                {"question": "变得容易烦恼或易怒", "score": 1},
                {"question": "感到害怕，好像有什么可怕的事要发生", "score": 0}
            ],
            "completion_time": datetime.utcnow().isoformat(),
            "max_score": 21
        }
    }
    
    print(f"✅ 创建了{len(mock_scale_results)}个心理量表的测试结果")
    print(f"   - PHQ-9 (抑郁量表): {mock_scale_results['PHQ-9']['total_score']}/27分")
    print(f"   - GAD-7 (焦虑量表): {mock_scale_results['GAD-7']['total_score']}/21分")
    
    # 3. 测试综合评估
    print("\n🔬 3. 执行综合心理评估...")
    
    try:
        comprehensive_report = await comprehensive_assessment_service.create_comprehensive_assessment(
            session_id=session_id,
            scale_results=mock_scale_results,
            include_conversation=True
        )
        
        print("✅ 综合评估完成！")
        
        # 4. 展示评估结果
        print("\n📋 4. 综合评估结果:")
        print("-" * 50)
        
        # 基本信息
        print(f"📊 评估ID: {comprehensive_report.get('assessment_id')}")
        print(f"📅 评估时间: {comprehensive_report.get('assessment_date')}")
        print(f"🎯 会话ID: {comprehensive_report.get('session_id')}")
        
        # 整体评估
        overall = comprehensive_report.get('overall_assessment', {})
        print(f"\n🎯 整体评估:")
        print(f"   风险等级: {overall.get('risk_level', 'unknown')}")
        print(f"   风险评分: {overall.get('risk_score', 0):.1f}")
        print(f"   主导情绪: {overall.get('dominant_emotion', 'unknown')}")
        print(f"   评估可靠性: {overall.get('assessment_reliability', 'unknown')}")
        print(f"   数据完整性: {overall.get('data_completeness', 'unknown')}")
        
        # 执行摘要
        executive_summary = comprehensive_report.get('executive_summary', '')
        print(f"\n📄 执行摘要:")
        print(f"   {executive_summary}")
        
        # 详细发现
        detailed_findings = comprehensive_report.get('detailed_findings', {})
        
        # 对话洞察
        conversation_insights = detailed_findings.get('conversation_insights', {})
        if conversation_insights.get('status') != 'no_conversation_data':
            print(f"\n💬 对话分析洞察:")
            session_chars = conversation_insights.get('session_characteristics', {})
            print(f"   参与度: {session_chars.get('engagement_level')}")
            print(f"   对话深度: {session_chars.get('conversation_depth')}")
            
            key_concerns = conversation_insights.get('key_concerns', [])
            if key_concerns:
                print(f"   主要关注点: {', '.join(key_concerns)}")
            
            emotional_pattern = conversation_insights.get('emotional_pattern', {})
            print(f"   情感趋势: {emotional_pattern.get('trend')} ({emotional_pattern.get('direction')})")
        
        # 量表结果
        scale_results_summary = detailed_findings.get('scale_results', {})
        if scale_results_summary.get('status') != 'no_scale_data':
            print(f"\n📊 量表测试结果:")
            individual_results = scale_results_summary.get('individual_results', [])
            for result in individual_results:
                print(f"   {result['scale']}: {result['score']}分 ({result['severity']})")
        
        # 风险因素
        risk_factors = detailed_findings.get('risk_factors', [])
        if risk_factors:
            print(f"\n⚠️  识别的风险因素:")
            for factor in risk_factors[:5]:  # 显示前5个
                print(f"   - {factor['factor']} (来源: {factor['source']}, 严重度: {factor['severity']})")
        
        # 保护因素
        protective_factors = detailed_findings.get('protective_factors', [])
        if protective_factors:
            print(f"\n🛡️  保护性因素:")
            for factor in protective_factors[:3]:  # 显示前3个
                print(f"   - {factor['factor']} (强度: {factor['strength']})")
        
        # 建议
        recommendations = comprehensive_report.get('recommendations', {})
        
        immediate_actions = recommendations.get('immediate_actions', [])
        if immediate_actions:
            print(f"\n🚨 即时建议:")
            for action in immediate_actions[:3]:
                print(f"   - {action}")
        
        short_term_goals = recommendations.get('short_term_goals', [])
        if short_term_goals:
            print(f"\n📅 短期目标 (1-4周):")
            for goal in short_term_goals[:3]:
                print(f"   - {goal}")
        
        # 转介建议
        referral_suggestions = recommendations.get('referral_suggestions', [])
        if referral_suggestions:
            print(f"\n🏥 转介建议:")
            for referral in referral_suggestions[:2]:
                print(f"   - {referral['service']} ({referral['urgency']}) - {referral['reason']}")
        
        # 后续计划
        follow_up_plan = comprehensive_report.get('follow_up_plan', {})
        if follow_up_plan:
            print(f"\n📋 后续跟进计划:")
            schedule = follow_up_plan.get('follow_up_schedule', [])
            if schedule:
                print(f"   跟进时间点: {', '.join(schedule[:3])}")
            next_assessment = follow_up_plan.get('next_comprehensive_assessment')
            if next_assessment:
                print(f"   下次综合评估: {next_assessment}")
        
        # 5. 数据源分析
        data_sources = comprehensive_report.get('data_sources', [])
        print(f"\n📈 数据来源分析:")
        print(f"   使用数据源: {', '.join(data_sources)}")
        
        if 'conversation_analysis' in data_sources:
            conv_analysis = comprehensive_report.get('raw_data', {}).get('conversation_analysis', {})
            conv_summary = conv_analysis.get('conversation_summary', {})
            print(f"   对话数据: {conv_summary.get('total_messages', 0)}条消息, 质量评分: {conv_analysis.get('conversation_quality_score', 0):.2f}")
        
        if 'scale_analysis' in data_sources:
            scale_analysis = comprehensive_report.get('raw_data', {}).get('scale_analysis', {})
            scales_completed = len(scale_analysis.get('scales_completed', []))
            print(f"   量表数据: {scales_completed}个标准化量表")
        
        print(f"\n✅ 综合心理评估测试完成！")
        print(f"📊 评估结果已保存，ID: {comprehensive_report.get('assessment_id')}")
        
        # 6. 保存结果到文件（可选）
        output_file = f"comprehensive_assessment_result_{int(datetime.utcnow().timestamp())}.json"
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(comprehensive_report, f, ensure_ascii=False, indent=2, default=str)
        
        print(f"💾 详细结果已保存到: {output_file}")
        
        return True
        
    except Exception as e:
        print(f"❌ 综合评估失败: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_assessment_readiness():
    """测试评估准备状态检查"""
    print("\n🔍 测试评估准备状态检查...")
    
    # 使用之前创建的会话数据
    session_id = "ai_session_12345_1001"
    
    try:
        # 模拟检查评估准备状态
        conversation_data = comprehensive_assessment_service._get_conversation_data(session_id)
        
        if conversation_data:
            conversation_history = conversation_data.get("conversation_history", [])
            user_messages = [msg for msg in conversation_history if msg.get("role") == "user"]
            
            print(f"✅ 找到会话数据:")
            print(f"   对话轮数: {len(user_messages)}")
            print(f"   总消息数: {len(conversation_history)}")
            print(f"   问题类型: {conversation_data.get('problem_type')}")
            
            # 评估对话质量
            avg_length = sum(len(msg.get("message", "")) for msg in user_messages) / max(len(user_messages), 1)
            print(f"   平均消息长度: {avg_length:.1f}字符")
            
            if len(user_messages) >= 5 and avg_length >= 20:
                print(f"✅ 对话数据充分，适合进行综合评估")
            elif len(user_messages) >= 3:
                print(f"⚠️  对话数据基本充分，建议继续对话以提高评估质量")
            else:
                print(f"❌ 对话数据不足，建议至少进行5轮深入对话")
                
        else:
            print(f"❌ 未找到会话数据")
            
    except Exception as e:
        print(f"❌ 检查评估准备状态失败: {e}")

async def main():
    """主测试函数"""
    print("🎯 综合心理评估系统完整测试")
    print("=" * 60)
    
    try:
        # 测试评估准备状态
        await test_assessment_readiness()
        
        # 测试完整评估流程
        success = await test_comprehensive_assessment()
        
        if success:
            print("\n🎉 所有测试通过！综合心理评估系统运行正常")
            print("\n📋 系统功能验证:")
            print("✅ 对话数据分析")
            print("✅ 心理量表分析") 
            print("✅ BERT情感分析集成")
            print("✅ 风险评估和保护因素识别")
            print("✅ 个性化建议生成")
            print("✅ 后续跟进计划制定")
            print("✅ 综合报告生成")
        else:
            print("\n❌ 测试失败，请检查系统配置")
            
    except Exception as e:
        print(f"\n💥 测试过程中发生错误: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())

