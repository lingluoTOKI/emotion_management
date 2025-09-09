#!/usr/bin/env python3
"""
测试综合评估API的风险等级
"""

import asyncio
import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from app.services.comprehensive_assessment_service import ComprehensiveAssessmentService
from app.services.ai_counseling_service import AICounselingService

async def test_comprehensive_assessment_api():
    """测试综合评估API的风险等级计算"""
    
    # 创建服务实例
    comprehensive_service = ComprehensiveAssessmentService()
    ai_service = AICounselingService()
    
    # 模拟积极对话会话
    positive_session_id = "ai_session_test_123"
    positive_messages = [
        {"role": "user", "message": "我最近感觉还不错"},
        {"role": "assistant", "message": "很高兴听到您这么说"},
        {"role": "user", "message": "虽然有些压力但还能应付"},
        {"role": "assistant", "message": "能够应付压力是很好的"},
        {"role": "user", "message": "谢谢您的关心，我会努力的"},
        {"role": "assistant", "message": "您的积极态度很值得赞赏"},
        {"role": "user", "message": "我觉得生活还是有希望的"},
        {"role": "assistant", "message": "保持希望很重要"}
    ]
    
    # 模拟会话数据
    ai_service.conversation_history[positive_session_id] = {
        "session_id": positive_session_id,
        "user_id": 123,
        "conversation_history": positive_messages,
        "problem_type": "general_support",
        "created_at": "2024-01-01T00:00:00"
    }
    
    print("🧪 测试综合评估API风险等级")
    print("=" * 50)
    
    try:
        # 调用综合评估（只使用对话分析，不包含量表）
        result = await comprehensive_service.create_comprehensive_assessment(
            session_id=positive_session_id,
            scale_results=None,
            include_conversation=True
        )
        
        print(f"\n📋 积极对话测试结果:")
        print(f"   会话ID: {positive_session_id}")
        
        # 提取风险评估信息
        if result and "assessment_report" in result:
            assessment_report = result["assessment_report"]
            overall_assessment = assessment_report.get("overall_assessment", {})
            risk_level = overall_assessment.get("risk_level", "unknown")
            
            print(f"   综合风险等级: {risk_level}")
            
            # 检查详细的风险评估
            if "integrated_findings" in assessment_report:
                integrated_findings = assessment_report["integrated_findings"]
                if "risk_assessment" in integrated_findings:
                    risk_assessment = integrated_findings["risk_assessment"]
                    print(f"   风险评分: {risk_assessment.get('weighted_risk_score', 'N/A')}")
                    print(f"   集成风险等级: {risk_assessment.get('integrated_risk_level', 'N/A')}")
                    
                    # 显示各个评估来源
                    individual_assessments = risk_assessment.get("individual_assessments", [])
                    for assessment in individual_assessments:
                        source = assessment.get("source", "unknown")
                        level = assessment.get("risk_level", "unknown")
                        score = assessment.get("risk_score", 0)
                        weight = assessment.get("weight", 0)
                        print(f"   - {source}: {level} (分数: {score:.2f}, 权重: {weight})")
                
                # 检查对话分析
                if "conversation_analysis" in integrated_findings:
                    conv_analysis = integrated_findings["conversation_analysis"]
                    if "risk_assessment" in conv_analysis:
                        conv_risk = conv_analysis["risk_assessment"]
                        print(f"\n   对话风险分析:")
                        print(f"   - 风险等级: {conv_risk.get('risk_level', 'N/A')}")
                        print(f"   - 风险分数: {conv_risk.get('risk_score', 'N/A')}")
                        print(f"   - 高风险指标: {conv_risk.get('high_risk_indicators', 0)}")
                        print(f"   - 中风险指标: {conv_risk.get('medium_risk_indicators', 0)}")
                        print(f"   - 积极指标: {conv_risk.get('positive_indicators', 0)}")
                        
                        if conv_risk.get('positive_keywords_found'):
                            print(f"   - 发现积极关键词: {conv_risk['positive_keywords_found']}")
                        if conv_risk.get('risk_keywords_found'):
                            print(f"   - 发现风险关键词: {conv_risk['risk_keywords_found']}")
            
            # 检查建议
            if "recommendations" in assessment_report:
                recommendations = assessment_report["recommendations"]
                immediate_actions = recommendations.get("immediate_actions", [])
                print(f"\n   即时建议 ({len(immediate_actions)}条):")
                for i, action in enumerate(immediate_actions[:3], 1):  # 只显示前3条
                    print(f"   {i}. {action}")
        else:
            print("   ❌ 未能获取评估报告")
            
    except Exception as e:
        print(f"   ❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
    
    print("\n✅ 综合评估API测试完成！")

if __name__ == "__main__":
    asyncio.run(test_comprehensive_assessment_api())


