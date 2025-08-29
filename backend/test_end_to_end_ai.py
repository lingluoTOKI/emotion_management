#!/usr/bin/env python3
"""
端到端AI功能测试
End-to-End AI functionality test
"""

import requests
import json
import time
import sys
import os

class EndToEndAITester:
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.headers = {"Content-Type": "application/json"}
        self.auth_token = None
        
    def login_as_student(self):
        """登录为学生用户"""
        print("\n🔐 登录为学生用户...")
        
        # 创建测试学生账户（如果不存在）
        test_student = {
            "username": "test_student_ai",
            "password": "test123456",
            "email": "ai_test@example.com",
            "role": "student",
            "real_name": "AI测试学生"
        }
        
        try:
            # 尝试注册
            register_response = requests.post(
                f"{self.base_url}/api/auth/register",
                json=test_student,
                headers=self.headers,
                timeout=10
            )
            print(f"   注册响应: {register_response.status_code}")
        except:
            pass  # 可能已存在
        
        # 登录 - 使用表单数据
        login_form_data = {
            "username": test_student["username"],
            "password": test_student["password"]
        }
        
        try:
            # OAuth2PasswordRequestForm需要使用data而不是json
            login_response = requests.post(
                f"{self.base_url}/api/auth/login",
                data=login_form_data,
                timeout=10
            )
            
            if login_response.status_code == 200:
                login_result = login_response.json()
                self.auth_token = login_result.get("access_token")
                if self.auth_token:
                    self.headers["Authorization"] = f"Bearer {self.auth_token}"
                    print("   ✅ 学生用户登录成功")
                    return True
                else:
                    print("   ❌ 登录响应中没有access_token")
                    return False
            else:
                print(f"   ❌ 登录失败: {login_response.status_code}")
                print(f"   错误信息: {login_response.text}")
                return False
        except Exception as e:
            print(f"   ❌ 登录异常: {str(e)}")
            return False
    
    def test_ai_assessment_flow(self):
        """测试AI评估完整流程"""
        print("\n🧠 测试AI评估完整流程")
        print("=" * 50)
        
        try:
            # 1. 开始评估
            print("📊 1. 开始AI评估...")
            assessment_data = {
                "assessment_type": "AI智能评估",
                "description": "端到端测试评估"
            }
            
            response = requests.post(
                f"{self.base_url}/api/student/assessment/start",
                json=assessment_data,
                headers=self.headers,
                timeout=15
            )
            
            if response.status_code == 200:
                result = response.json()
                assessment_id = result.get("data", {}).get("id") or result.get("id")
                print(f"   ✅ 评估创建成功，ID: {assessment_id}")
            else:
                print(f"   ❌ 创建评估失败: {response.status_code}")
                print(f"   错误信息: {response.text}")
                return False
            
            # 2. 提交评估答案
            print("📝 2. 提交评估答案...")
            test_answers = [
                {
                    "question": "您最近的心情如何？",
                    "answer": "我最近感到有些焦虑和压力，学习任务很重，经常失眠"
                },
                {
                    "question": "您是否有困扰的问题？",
                    "answer": "是的，我担心考试成绩，也担心未来的职业发展"
                }
            ]
            
            for i, answer_data in enumerate(test_answers):
                submit_response = requests.post(
                    f"{self.base_url}/api/student/assessment/{assessment_id}/submit",
                    json={
                        "question_id": f"q_{i+1}",
                        "answer": answer_data["answer"]
                    },
                    headers=self.headers,
                    timeout=10
                )
                
                if submit_response.status_code == 200:
                    print(f"   ✅ 答案 {i+1} 提交成功")
                else:
                    print(f"   ❌ 答案 {i+1} 提交失败: {submit_response.status_code}")
            
            # 3. 完成评估（触发AI分析）
            print("🔍 3. 完成评估并触发AI分析...")
            complete_response = requests.post(
                f"{self.base_url}/api/student/assessment/{assessment_id}/complete",
                headers=self.headers,
                timeout=30  # AI分析可能需要更多时间
            )
            
            if complete_response.status_code == 200:
                result = complete_response.json()
                print("   ✅ AI评估分析完成")
                
                # 解析结果
                assessment_result = result.get("data", {})
                emotion_analysis = assessment_result.get("emotion_analysis", {})
                ai_report = assessment_result.get("ai_report", {})
                
                print(f"   📊 主导情绪: {emotion_analysis.get('dominant_emotion', 'unknown')}")
                print(f"   📈 情绪强度: {emotion_analysis.get('emotion_intensity', 0):.2f}")
                print(f"   📋 AI报告摘要: {ai_report.get('summary', 'N/A')[:100]}...")
                print(f"   💡 建议数量: {len(ai_report.get('recommendations', []))}")
                
                return True
            else:
                print(f"   ❌ 完成评估失败: {complete_response.status_code}")
                print(f"   错误信息: {complete_response.text}")
                return False
                
        except Exception as e:
            print(f"   ❌ AI评估流程异常: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_ai_counseling_flow(self):
        """测试AI心理辅导完整流程"""
        print("\n💬 测试AI心理辅导完整流程")
        print("=" * 50)
        
        try:
            # 1. 开始AI辅导会话
            print("🚀 1. 开始AI辅导会话...")
            session_data = {
                "problem_type": "学习压力"
            }
            
            response = requests.post(
                f"{self.base_url}/api/ai/session/start",
                json=session_data,
                headers=self.headers,
                timeout=15
            )
            
            if response.status_code == 200:
                result = response.json()
                session_id = result.get("data", {}).get("session_id") or result.get("session_id")
                opening_message = result.get("data", {}).get("message") or result.get("message")
                print(f"   ✅ 会话创建成功，ID: {session_id}")
                print(f"   💬 开场白: {opening_message[:100]}...")
            else:
                print(f"   ❌ 创建会话失败: {response.status_code}")
                print(f"   错误信息: {response.text}")
                return False
            
            # 2. 进行多轮对话
            print("💭 2. 进行AI对话...")
            test_messages = [
                "我最近学习压力很大，经常失眠",
                "我担心考试成绩不好，父母会失望",
                "有时候感觉很焦虑，不知道该怎么办"
            ]
            
            for i, message in enumerate(test_messages):
                print(f"   👤 用户消息 {i+1}: {message}")
                
                chat_response = requests.post(
                    f"{self.base_url}/api/ai/session/chat",
                    json={
                        "session_id": session_id,
                        "message": message
                    },
                    headers=self.headers,
                    timeout=30  # AI回复可能需要更多时间
                )
                
                if chat_response.status_code == 200:
                    result = chat_response.json()
                    ai_reply = result.get("data", {}).get("message") or result.get("message")
                    emotion_analysis = result.get("data", {}).get("emotion_analysis", {})
                    risk_assessment = result.get("data", {}).get("risk_assessment", {})
                    
                    print(f"   🤖 AI回复: {ai_reply[:150]}...")
                    print(f"   📊 检测情绪: {emotion_analysis.get('dominant_emotion', 'unknown')}")
                    print(f"   ⚠️ 风险等级: {risk_assessment.get('risk_level', 'unknown')}")
                    print()
                else:
                    print(f"   ❌ 对话失败: {chat_response.status_code}")
                    print(f"   错误信息: {chat_response.text}")
            
            # 3. 结束会话
            print("🏁 3. 结束AI辅导会话...")
            end_response = requests.post(
                f"{self.base_url}/api/ai/session/end",
                json={"session_id": session_id},
                headers=self.headers,
                timeout=15
            )
            
            if end_response.status_code == 200:
                result = end_response.json()
                session_summary = result.get("data", {}).get("summary") or result.get("summary")
                
                print("   ✅ 会话结束成功")
                print(f"   📊 对话轮数: {session_summary.get('conversation_count', 0)}")
                print(f"   🕐 持续时间: {session_summary.get('duration_minutes', 0):.1f} 分钟")
                print(f"   😊 最终情绪: {session_summary.get('final_emotion', 'unknown')}")
                print(f"   💡 建议数量: {len(session_summary.get('recommendations', []))}")
                
                return True
            else:
                print(f"   ❌ 结束会话失败: {end_response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ AI辅导流程异常: {str(e)}")
            import traceback
            traceback.print_exc()
            return False
    
    def test_ai_service_status(self):
        """测试AI服务状态"""
        print("\n🔧 测试AI服务状态")
        print("=" * 50)
        
        try:
            response = requests.get(
                f"{self.base_url}/api/ai-service/status",
                headers=self.headers,
                timeout=10
            )
            
            if response.status_code == 200:
                result = response.json()
                service_status = result.get("data", {}).get("service_status", {})
                xfyun_status = service_status.get("xfyun", {})
                
                print(f"   ✅ AI服务状态检查成功")
                print(f"   🤖 科大讯飞: {'可用' if xfyun_status.get('available') else '不可用'}")
                
                if not xfyun_status.get('available'):
                    print(f"   ❌ 错误信息: {xfyun_status.get('error', 'N/A')}")
                
                return xfyun_status.get('available', False)
            else:
                print(f"   ❌ 服务状态检查失败: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"   ❌ 服务状态检查异常: {str(e)}")
            return False

def main():
    """主测试函数"""
    print("🚀 科大讯飞AI功能端到端测试")
    print("="*60)
    
    tester = EndToEndAITester()
    
    # 测试结果
    results = {
        "login": False,
        "ai_service_status": False,
        "ai_assessment": False,
        "ai_counseling": False
    }
    
    # 1. 用户认证
    results["login"] = tester.login_as_student()
    if not results["login"]:
        print("\n❌ 用户认证失败，无法继续测试")
        return False
    
    # 2. 检查AI服务状态
    results["ai_service_status"] = tester.test_ai_service_status()
    
    # 3. 测试AI评估流程
    results["ai_assessment"] = tester.test_ai_assessment_flow()
    
    # 4. 测试AI心理辅导流程
    results["ai_counseling"] = tester.test_ai_counseling_flow()
    
    # 测试总结
    print("\n📊 端到端测试结果总结")
    print("="*60)
    
    for test_name, success in results.items():
        status = "✅ 通过" if success else "❌ 失败"
        test_name_cn = {
            "login": "用户认证",
            "ai_service_status": "AI服务状态",
            "ai_assessment": "AI智能评估",
            "ai_counseling": "AI心理辅导"
        }.get(test_name, test_name)
        print(f"   {test_name_cn}: {status}")
    
    all_passed = all(results.values())
    if all_passed:
        print("\n🎉 所有端到端测试通过！")
        print("✨ 科大讯飞AI模型已成功集成到前后端系统中")
        print("🔗 前端页面可以正常调用后端AI接口")
        print("🤖 AI智能评估和心理辅导功能正常工作")
    else:
        print("\n⚠️ 部分测试失败，请检查相关配置")
        
        if not results["ai_service_status"]:
            print("💡 建议检查科大讯飞API配置和网络连接")
        if not results["ai_assessment"]:
            print("💡 建议检查AI评估服务和数据库配置")
        if not results["ai_counseling"]:
            print("💡 建议检查AI辅导服务和会话管理")
    
    return all_passed

if __name__ == "__main__":
    main()
