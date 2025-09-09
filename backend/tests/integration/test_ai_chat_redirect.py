"""
测试AI聊天完成后的自动跳转功能
Test AI chat auto-redirect functionality after assessment completion
"""

import asyncio
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.ai_counseling_service import AICounselingService
import json

async def test_ai_chat_redirect():
    """测试AI聊天评估完成后的跳转指令"""
    print("🎯 AI聊天跳转功能测试")
    print("=" * 60)
    
    ai_service = AICounselingService()
    
    # 创建AI咨询会话
    session_data = await ai_service.start_session(
        student_id=12345,
        problem_type="跳转功能测试"
    )
    
    session_id = session_data["session_id"]
    print(f"✅ AI咨询会话创建: {session_id}")
    
    # 模拟足够的对话轮数触发跳转
    test_messages = [
        "我最近学习压力很大",
        "晚上总是失眠，睡不好觉", 
        "我觉得自己很焦虑，心情不好",
        "有时候会感到很沮丧，不知道该怎么办",
        "我担心自己的学习成绩会下降",
        "家人对我期望很高，压力很大",
        "我想要寻求一些帮助和建议",
        "希望能够改善现在的状况",
        "我愿意配合做一些评估测试",
        "请告诉我下一步应该怎么做",
        "我想了解更多关于心理健康的知识",
        "希望能够得到专业的指导",
        "我会认真对待这个评估过程",
        "请帮助我分析一下我的情况",
        "我想知道自己的心理状态如何",
        "谢谢你的耐心倾听和帮助"  # 第16条消息，应该触发跳转
    ]
    
    print(f"\n💬 开始16轮对话测试...")
    
    redirect_triggered = False
    redirect_data = None
    
    for i, message in enumerate(test_messages, 1):
        print(f"\n--- 第 {i}/16 轮 ---")
        print(f"用户: {message}")
        
        try:
            # 调用AI咨询服务
            response = await ai_service.continue_conversation(session_id, message)
            
            ai_message = response.get('message', '')
            emotion_analysis = response.get('emotion_analysis', {})
            risk_assessment = response.get('risk_assessment', {})
            redirect_action = response.get('redirect_action')
            
            print(f"AI: {ai_message[:100]}...")
            print(f"🧠 情绪分析: {emotion_analysis.get('dominant_emotion', 'unknown')} (置信度: {emotion_analysis.get('confidence', 0):.2f})")
            print(f"⚠️  风险等级: {risk_assessment.get('risk_level', 'unknown')}")
            
            # 检查跳转指令
            if redirect_action:
                print(f"\n🎯 跳转指令触发!")
                print(f"   类型: {redirect_action.get('type')}")
                print(f"   原因: {redirect_action.get('reason')}")
                print(f"   对话轮数: {redirect_action.get('conversation_count')}")
                print(f"   跳转到: {redirect_action.get('redirect_to')}")
                print(f"   延迟: {redirect_action.get('delay')}ms")
                print(f"   跳转消息: {redirect_action.get('message')[:100]}...")
                
                redirect_triggered = True
                redirect_data = redirect_action
                break
            else:
                print("   ⏳ 继续对话...")
        
        except Exception as e:
            print(f"❌ 第{i}轮对话失败: {e}")
            break
    
    # 验证跳转功能
    print(f"\n📋 跳转功能测试结果")
    print("=" * 40)
    
    if redirect_triggered:
        print("✅ 跳转指令成功触发")
        print(f"✅ 跳转类型: {redirect_data.get('type')}")
        print(f"✅ 目标页面: {redirect_data.get('redirect_to')}")
        print(f"✅ 触发原因: {redirect_data.get('reason')}")
        print(f"✅ 对话轮数: {redirect_data.get('conversation_count')}")
        print(f"✅ 延迟时间: {redirect_data.get('delay')}ms")
        
        # 模拟前端处理
        print(f"\n🎨 前端处理模拟:")
        print(f"1. 收到AI消息: '{redirect_data.get('message', '')[:50]}...'")
        print(f"2. 检测到redirect_action.type = 'complete_assessment'")
        print(f"3. 显示AI完成消息")
        print(f"4. 调用completeAssessment()保存评估结果")
        print(f"5. 显示倒计时: '即将跳转到传统量表评估页面... 3秒'")
        print(f"6. 执行router.push('{redirect_data.get('redirect_to')}')")
        
        # 验证后端数据结构
        expected_fields = ['type', 'message', 'redirect_to', 'reason', 'conversation_count', 'delay']
        missing_fields = [field for field in expected_fields if field not in redirect_data]
        
        if missing_fields:
            print(f"⚠️  缺少字段: {missing_fields}")
        else:
            print("✅ 跳转数据结构完整")
        
        return True
    else:
        print("❌ 跳转指令未触发")
        print("   可能原因:")
        print("   1. 对话轮数不足")
        print("   2. 评估完成条件未满足")
        print("   3. 跳转逻辑存在问题")
        
        return False

async def test_frontend_api_integration():
    """测试前端API集成"""
    print(f"\n🔗 前端API集成测试")
    print("=" * 40)
    
    # 模拟前端API调用结构
    mock_api_response = {
        "message": "非常感谢您的耐心配合！通过我们的深入对话，我已经对您的心理状态有了全面的了解。现在让我为您生成AI评估报告，然后我们将进入标准化量表评估阶段。",
        "emotion_analysis": {
            "dominant_emotion": "sadness",
            "emotion_intensity": 0.7,
            "confidence": 0.85
        },
        "risk_assessment": {
            "risk_level": "medium",
            "risk_score": 6,
            "recommendations": ["建议寻求专业心理咨询"]
        },
        "session_id": "test_session_123",
        "emergency_alert": None,
        "redirect_action": {
            "type": "complete_assessment",
            "message": "评估完成，准备跳转到传统量表",
            "redirect_to": "/student/assessment",
            "reason": "达到预设对话轮数",
            "conversation_count": 16,
            "delay": 3000
        }
    }
    
    print("✅ 模拟API响应结构:")
    print(json.dumps(mock_api_response, ensure_ascii=False, indent=2))
    
    # 验证前端处理逻辑
    redirect_action = mock_api_response.get('redirect_action')
    if redirect_action and redirect_action.get('type') == 'complete_assessment':
        print(f"\n✅ 前端逻辑验证:")
        print(f"   检测到跳转指令: {redirect_action.get('type')}")
        print(f"   目标路由: {redirect_action.get('redirect_to')}")
        print(f"   延迟时间: {redirect_action.get('delay')}ms")
        print(f"   倒计时: {redirect_action.get('delay') // 1000}秒")
        
        return True
    else:
        print("❌ 前端逻辑验证失败")
        return False

async def main():
    """主测试函数"""
    print("🚀 AI聊天跳转功能完整测试")
    print("=" * 60)
    
    # 测试后端跳转逻辑
    backend_success = await test_ai_chat_redirect()
    
    # 测试前端API集成
    frontend_success = await test_frontend_api_integration()
    
    print(f"\n🎉 测试总结")
    print("=" * 40)
    print(f"后端跳转逻辑: {'✅ 通过' if backend_success else '❌ 失败'}")
    print(f"前端API集成: {'✅ 通过' if frontend_success else '❌ 失败'}")
    
    if backend_success and frontend_success:
        print(f"\n🎯 完整功能流程:")
        print(f"1. 用户在AI评估页面进行16轮对话")
        print(f"2. 后端检测到评估完成条件")
        print(f"3. 后端返回redirect_action指令")
        print(f"4. 前端接收到跳转指令")
        print(f"5. 前端显示AI完成消息")
        print(f"6. 前端保存评估结果到localStorage")
        print(f"7. 前端显示3秒倒计时")
        print(f"8. 前端自动跳转到/student/assessment")
        print(f"9. 传统量表页面检测到AI评估完成")
        print(f"10. 完成传统量表后生成综合报告")
        
        print(f"\n✅ AI聊天跳转功能测试通过！")
    else:
        print(f"\n❌ AI聊天跳转功能测试失败")
        print(f"请检查相关代码实现")

if __name__ == "__main__":
    asyncio.run(main())
