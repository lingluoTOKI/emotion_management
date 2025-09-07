#!/usr/bin/env python3
"""
测试综合评估流程
Test Comprehensive Assessment Flow
"""

import requests
import json
import time
from datetime import datetime

# 配置
BASE_URL = "http://localhost:8000"
TEST_USER = {
    "username": "student1",
    "password": "123456"
}

def test_comprehensive_assessment_flow():
    """测试完整的综合评估流程"""
    print("🧪 开始测试综合评估流程...")
    
    # 1. 登录获取token
    print("\n1️⃣ 用户登录...")
    login_response = requests.post(
        f"{BASE_URL}/api/auth/login",
        data={
            "username": TEST_USER["username"],
            "password": TEST_USER["password"]
        },
        headers={"Content-Type": "application/x-www-form-urlencoded"}
    )
    
    if login_response.status_code != 200:
        print(f"❌ 登录失败: {login_response.status_code}")
        return False
    
    login_data = login_response.json()
    token = login_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print(f"✅ 登录成功，用户角色: {login_data.get('user_role')}")
    
    # 2. 开始AI评估会话
    print("\n2️⃣ 开始AI评估会话...")
    session_response = requests.post(
        f"{BASE_URL}/api/ai/session/start",
        json={
            "session_type": "assessment",
            "initial_message": "我想进行心理评估"
        },
        headers=headers
    )
    
    if session_response.status_code != 200:
        print(f"❌ 开始AI会话失败: {session_response.status_code}")
        return False
    
    session_data = session_response.json()
    session_id = session_data["session_id"]
    print(f"✅ AI会话开始成功，会话ID: {session_id}")
    
    # 3. 进行AI对话评估
    print("\n3️⃣ 进行AI对话评估...")
    conversation_messages = [
        "我最近感到压力很大，学习任务很重",
        "有时候会感到焦虑，担心考试考不好",
        "睡眠质量也不太好，经常失眠",
        "和朋友的关系也出现了一些问题",
        "我觉得自己可能有些抑郁的倾向"
    ]
    
    for i, message in enumerate(conversation_messages, 1):
        print(f"   发送消息 {i}: {message}")
        
        chat_response = requests.post(
            f"{BASE_URL}/api/ai/session/chat",
            json={
                "session_id": session_id,
                "message": message,
                "message_type": "text"
            },
            headers=headers
        )
        
        if chat_response.status_code != 200:
            print(f"❌ 发送消息失败: {chat_response.status_code}")
            continue
        
        chat_data = chat_response.json()
        print(f"   AI回复: {chat_data.get('message', '')[:50]}...")
        
        # 检查是否有EasyBert分析结果
        if chat_data.get('emotion_analysis'):
            emotion_data = chat_data['emotion_analysis']
            print(f"   🧠 EasyBert分析: {emotion_data.get('dominant_emotion')} (强度: {emotion_data.get('emotion_intensity', 0):.2f})")
        
        # 检查是否有风险评估
        if chat_data.get('risk_assessment'):
            risk_data = chat_data['risk_assessment']
            print(f"   ⚠️ 风险评估: {risk_data.get('risk_level')} (得分: {risk_data.get('risk_score', 0):.2f})")
        
        time.sleep(1)  # 避免请求过快
    
    # 4. 结束AI评估会话
    print("\n4️⃣ 结束AI评估会话...")
    end_response = requests.post(
        f"{BASE_URL}/api/ai/session/end",
        json={
            "session_id": session_id,
            "end_reason": "assessment_complete"
        },
        headers=headers
    )
    
    if end_response.status_code != 200:
        print(f"❌ 结束AI会话失败: {end_response.status_code}")
        return False
    
    print("✅ AI评估会话结束成功")
    
    # 5. 提交传统量表结果
    print("\n5️⃣ 提交传统量表结果...")
    scale_results = {
        "DASS-21": {
            "total_score": 45,
            "categories": [
                {
                    "name": "抑郁",
                    "raw_score": 15,
                    "standard_score": 15,
                    "level": "moderate"
                },
                {
                    "name": "焦虑",
                    "raw_score": 18,
                    "standard_score": 18,
                    "level": "severe"
                },
                {
                    "name": "压力",
                    "raw_score": 12,
                    "standard_score": 12,
                    "level": "mild"
                }
            ],
            "completion_time": datetime.utcnow().isoformat(),
            "risk_level": "medium"
        }
    }
    
    scale_response = requests.post(
        f"{BASE_URL}/api/comprehensive-assessment/submit-scale-results",
        json={
            "session_id": session_id,
            "scale_results": scale_results
        },
        headers=headers
    )
    
    if scale_response.status_code != 200:
        print(f"❌ 提交量表结果失败: {scale_response.status_code}")
        return False
    
    print("✅ 传统量表结果提交成功")
    
    # 6. 生成综合评估报告
    print("\n6️⃣ 生成综合评估报告...")
    comprehensive_response = requests.post(
        f"{BASE_URL}/api/comprehensive-assessment/create-comprehensive-report",
        json={
            "session_id": session_id,
            "scale_results": scale_results,
            "include_conversation": True
        },
        headers=headers
    )
    
    if comprehensive_response.status_code != 200:
        print(f"❌ 生成综合评估报告失败: {comprehensive_response.status_code}")
        return False
    
    comprehensive_data = comprehensive_response.json()
    print("✅ 综合评估报告生成成功")
    
    # 7. 显示综合评估报告摘要
    print("\n7️⃣ 综合评估报告摘要:")
    if comprehensive_data.get("assessment_report"):
        report = comprehensive_data["assessment_report"]
        
        # 显示执行摘要
        if report.get("executive_summary"):
            print(f"📄 执行摘要: {report['executive_summary'][:100]}...")
        
        # 显示整体评估
        if report.get("overall_assessment"):
            overall = report["overall_assessment"]
            print(f"🎯 整体风险等级: {overall.get('risk_level', 'unknown')}")
            print(f"📊 综合得分: {overall.get('comprehensive_score', 0):.2f}")
        
        # 显示对话分析
        if report.get("conversation_analysis"):
            conv_analysis = report["conversation_analysis"]
            if conv_analysis.get("bert_analysis"):
                bert_data = conv_analysis["bert_analysis"]
                print(f"🧠 EasyBert分析: {bert_data.get('dominant_emotion', 'unknown')} (强度: {bert_data.get('emotion_intensity', 0):.2f})")
            
            if conv_analysis.get("dialogue_strategy"):
                strategy = conv_analysis["dialogue_strategy"]
                print(f"🎯 对话策略: {strategy.get('approach', 'unknown')} (风险: {strategy.get('risk_level', 'unknown')})")
        
        # 显示量表分析
        if report.get("scale_analysis"):
            scale_analysis = report["scale_analysis"]
            print(f"📋 量表分析: {len(scale_analysis.get('scale_analyses', {}))} 个量表")
        
        # 显示建议
        if report.get("recommendations"):
            recommendations = report["recommendations"]
            print(f"💡 个性化建议: {len(recommendations.get('immediate_actions', []))} 项")
    
    print("\n🎉 综合评估流程测试完成！")
    return True

if __name__ == "__main__":
    try:
        success = test_comprehensive_assessment_flow()
        if success:
            print("\n✅ 所有测试通过！")
        else:
            print("\n❌ 测试失败！")
    except Exception as e:
        print(f"\n💥 测试过程中出现错误: {e}")
        import traceback
        traceback.print_exc()
