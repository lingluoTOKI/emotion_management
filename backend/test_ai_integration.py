#!/usr/bin/env python3
"""
AI功能集成测试脚本
Test AI Integration functionality
"""

import requests
import json
import asyncio
import sys
import os

# 添加项目路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.services.ai_assessment_service import AIAssessmentService
from app.services.ai_counseling_service import AICounselingService

class AIIntegrationTester:
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.headers = {"Content-Type": "application/json"}
        
    async def test_ai_assessment_service(self):
        """测试AI评估服务"""
        print("\n🧠 测试AI智能评估服务")
        print("=" * 50)
        
        try:
            ai_assessment = AIAssessmentService()
            
            # 测试数据
            assessment_data = {
                "assessment_type": "情绪状态评估",
                "answers": [
                    {
                        "question": "最近两周您的心情如何？",
                        "answer": "感觉有些焦虑，学习压力比较大，经常失眠"
                    },
                    {
                        "question": "您是否感到沮丧或绝望？",
                        "answer": "有时候会，特别是考试前"
                    }
                ],
                "description": "学生心理健康评估"
            }
            
            # 1. 测试情绪分析
            print("📊 1. 测试AI情绪分析...")
            emotion_result = await ai_assessment.analyze_emotion(assessment_data)
            print(f"   ✅ 主导情绪: {emotion_result.get('dominant_emotion')}")
            print(f"   ✅ 情绪强度: {emotion_result.get('emotion_intensity'):.2f}")
            print(f"   ✅ 抑郁指数: {emotion_result.get('depression_index'):.2f}")
            print(f"   ✅ 焦虑指数: {emotion_result.get('anxiety_index'):.2f}")
            
            # 2. 测试评估报告生成
            print("📋 2. 测试AI评估报告生成...")
            report = await ai_assessment.generate_assessment_report(assessment_data, emotion_result)
            print(f"   ✅ 报告摘要: {report.get('summary', '未生成')[:100]}...")
            print(f"   ✅ 建议数量: {len(report.get('recommendations', []))}")
            print(f"   ✅ 风险等级: {report.get('risk_assessment', {}).get('level', 'unknown')}")
            
            # 3. 测试关键词提取
            print("🔍 3. 测试关键词提取...")
            text = "我最近学习压力很大，经常焦虑失眠，感觉很沮丧"
            keywords = await ai_assessment.extract_keywords(text)
            print(f"   ✅ 提取的关键词: {', '.join(keywords)}")
            
            return True
            
        except Exception as e:
            print(f"   ❌ AI评估服务测试失败: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    async def test_ai_counseling_service(self):
        """测试AI心理辅导服务"""
        print("\n💬 测试AI心理辅导服务")
        print("=" * 50)
        
        try:
            ai_counseling = AICounselingService()
            
            # 1. 测试开始会话
            print("🚀 1. 测试开始AI辅导会话...")
            session_result = await ai_counseling.start_session(
                student_id=1001, 
                problem_type="学习压力"
            )
            session_id = session_result["session_id"]
            print(f"   ✅ 会话ID: {session_id}")
            print(f"   ✅ 开场白: {session_result['message'][:100]}...")
            
            # 2. 测试对话交互
            print("💭 2. 测试AI对话交互...")
            user_messages = [
                "我最近学习压力很大，经常睡不着觉",
                "我担心考试考不好，父母会失望",
                "有时候觉得很绝望，不知道该怎么办"
            ]
            
            for i, message in enumerate(user_messages):
                print(f"   用户消息 {i+1}: {message}")
                
                response = await ai_counseling.continue_conversation(session_id, message)
                ai_reply = response.get("message", "")
                emotion = response.get("emotion_analysis", {}).get("dominant_emotion", "unknown")
                risk_level = response.get("risk_assessment", {}).get("risk_level", "unknown")
                
                print(f"   AI回复: {ai_reply[:150]}...")
                print(f"   检测情绪: {emotion}, 风险等级: {risk_level}")
                print()
            
            # 3. 测试会话结束
            print("🏁 3. 测试结束会话...")
            end_result = await ai_counseling.end_session(session_id)
            summary = end_result.get("summary", {})
            print(f"   ✅ 会话时长: {summary.get('duration_minutes', 0):.1f} 分钟")
            print(f"   ✅ 对话轮数: {summary.get('conversation_count', 0)}")
            print(f"   ✅ 最终情绪: {summary.get('final_emotion', 'unknown')}")
            print(f"   ✅ 建议数量: {len(summary.get('recommendations', []))}")
            
            # 4. 测试AI服务状态
            print("🔧 4. 测试AI服务状态...")
            service_status = await ai_counseling.test_ai_services()
            xfyun_status = service_status.get("xfyun", {})
            openai_status = service_status.get("openai", {})
            
            print(f"   科大讯飞: {'✅ 可用' if xfyun_status.get('available') else '❌ 不可用'}")
            if xfyun_status.get("response_time"):
                print(f"   响应时间: {xfyun_status['response_time']:.2f}秒")
            
            print(f"   OpenAI: {'✅ 可用' if openai_status.get('available') else '❌ 不可用'}")
            
            return True
            
        except Exception as e:
            print(f"   ❌ AI心理辅导服务测试失败: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_api_endpoints(self):
        """测试API端点"""
        print("\n🌐 测试API端点连接")
        print("=" * 50)
        
        try:
            # 测试健康检查
            response = requests.get(f"{self.base_url}/health", timeout=10)
            if response.status_code == 200:
                print("   ✅ 服务健康检查通过")
            else:
                print(f"   ❌ 服务健康检查失败: {response.status_code}")
                return False
            
            # 测试AI服务状态
            response = requests.get(f"{self.base_url}/api/ai-service/status", timeout=10)
            if response.status_code == 200:
                data = response.json()
                xfyun_status = data.get('data', {}).get('service_status', {}).get('xfyun', {})
                available = xfyun_status.get('available', False)
                print(f"   ✅ AI服务状态: {'可用' if available else '不可用'}")
            else:
                print(f"   ❌ AI服务状态检查失败: {response.status_code}")
            
            return True
            
        except Exception as e:
            print(f"   ❌ API端点测试失败: {str(e)}")
            return False

async def main():
    """主测试函数"""
    print("🚀 AI功能集成测试开始")
    print("="*60)
    
    tester = AIIntegrationTester()
    
    # 测试结果
    results = {
        "api_endpoints": False,
        "ai_assessment": False,
        "ai_counseling": False
    }
    
    # 1. 测试API端点
    results["api_endpoints"] = tester.test_api_endpoints()
    
    # 2. 测试AI评估服务
    results["ai_assessment"] = await tester.test_ai_assessment_service()
    
    # 3. 测试AI心理辅导服务
    results["ai_counseling"] = await tester.test_ai_counseling_service()
    
    # 测试总结
    print("\n📊 测试结果总结")
    print("="*60)
    
    for test_name, success in results.items():
        status = "✅ 通过" if success else "❌ 失败"
        print(f"   {test_name}: {status}")
    
    all_passed = all(results.values())
    if all_passed:
        print("\n🎉 所有AI功能集成测试通过！")
        print("科大讯飞AI模型已成功集成到后端系统中")
    else:
        print("\n⚠️ 部分测试失败，请检查相关配置")
    
    return all_passed

if __name__ == "__main__":
    asyncio.run(main())
