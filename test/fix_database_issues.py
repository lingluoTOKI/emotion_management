#!/usr/bin/env python3
"""
修复数据库问题并测试风险评估
Fix Database Issues and Test Risk Assessment
"""

import sys
sys.path.append('backend')

from app.core.database import SessionLocal
from app.models.user import Student, User
from app.models.ai_counseling import AICounselingSession
import requests

def check_and_fix_database():
    """检查并修复数据库问题"""
    print("🔧 检查并修复数据库问题")
    print("=" * 50)
    
    db = SessionLocal()
    try:
        # 1. 检查学生表
        print("👨‍🎓 1. 检查学生数据...")
        students = db.query(Student).all()
        if students:
            print(f"   ✅ 找到 {len(students)} 个学生记录:")
            for student in students:
                print(f"      - ID: {student.id}, 用户名: {student.user.username}")
        else:
            print("   ❌ 没有找到学生记录")
            return
        
        # 2. 检查AI会话表
        print("\n🤖 2. 检查AI会话数据...")
        sessions = db.query(AICounselingSession).all()
        print(f"   📊 找到 {len(sessions)} 个AI会话记录")
        
        # 3. 清理无效会话记录
        if sessions:
            print("   🗑️ 清理无效的会话记录...")
            for session in sessions:
                if not session.student_id or not db.query(Student).filter(Student.id == session.student_id).first():
                    print(f"      删除无效会话: ID={session.id}")
                    db.delete(session)
            db.commit()
            print("   ✅ 清理完成")
        
        print("\n✅ 数据库检查和修复完成")
        
    except Exception as e:
        print(f"❌ 数据库操作失败: {e}")
        db.rollback()
    finally:
        db.close()

def test_risk_assessment():
    """测试风险评估功能"""
    print("\n🚨 测试风险评估功能")
    print("=" * 50)
    
    backend_url = 'http://localhost:8000'
    
    # 登录
    print("🔐 1. 登录...")
    login_data = {'username': 'student1', 'password': '123456'}
    try:
        login_resp = requests.post(f'{backend_url}/api/auth/login', data=login_data, timeout=10)
        if login_resp.status_code != 200:
            print(f"   ❌ 登录失败: {login_resp.status_code}")
            return
        
        token = login_resp.json().get('access_token')
        headers = {'Authorization': f'Bearer {token}'}
        print("   ✅ 登录成功")
    except Exception as e:
        print(f"   ❌ 登录异常: {e}")
        return
    
    # 创建会话
    print("🚀 2. 创建AI会话...")
    try:
        session_resp = requests.post(f'{backend_url}/api/ai/session/start', 
                                   json={'problem_type': '风险评估测试'}, 
                                   headers=headers, timeout=15)
        if session_resp.status_code != 200:
            print(f"   ❌ 创建会话失败: {session_resp.status_code}")
            print(f"   错误: {session_resp.text}")
            return
            
        session_data = session_resp.json()
        session_id = session_data.get('data', {}).get('session_id') or session_data.get('session_id')
        print(f"   ✅ 会话创建: {session_id}")
    except Exception as e:
        print(f"   ❌ 创建会话异常: {e}")
        return
    
    # 测试不同风险等级的消息
    test_messages = [
        ("低风险", "你好，今天天气不错"),
        ("中等风险", "我感到很绝望，没有希望"),
        ("高风险", "我不想活了，想死"),
        ("高风险", "我想自杀，生活没有意义")
    ]
    
    for expected_level, message in test_messages:
        print(f"\n💬 测试消息 ({expected_level}): {message}")
        try:
            chat_resp = requests.post(f'{backend_url}/api/ai/session/chat',
                                    json={'session_id': session_id, 'message': message}, 
                                    headers=headers, timeout=30)
            
            if chat_resp.status_code == 200:
                chat_data = chat_resp.json()
                ai_message = chat_data.get('data', {}).get('message') or chat_data.get('message', '')
                risk_assessment = chat_data.get('data', {}).get('risk_assessment', {})
                risk_level = risk_assessment.get('risk_level', 'unknown')
                risk_score = risk_assessment.get('risk_score', 0)
                
                print(f"   🤖 AI回复: {ai_message[:60]}...")
                print(f"   🚨 风险等级: {risk_level}")
                print(f"   📊 风险评分: {risk_score}")
                
                # 检查风险等级是否合理
                if risk_level != 'unknown':
                    print(f"   ✅ 风险评估正常工作")
                else:
                    print(f"   ❌ 风险评估未生效")
                    
            else:
                print(f"   ❌ 消息发送失败: {chat_resp.status_code}")
                print(f"   错误: {chat_resp.text}")
                
        except Exception as e:
            print(f"   ❌ 发送消息异常: {e}")
    
    print("\n📊 风险评估测试完成")

if __name__ == "__main__":
    check_and_fix_database()
    test_risk_assessment()
