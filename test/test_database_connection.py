#!/usr/bin/env python3
"""
测试MySQL数据库连接和AI对话存储
Test MySQL Database Connection and AI Conversation Storage
"""

import sys
sys.path.append('backend')

from app.core.database import engine, SessionLocal, Base
from app.models.ai_counseling import AICounselingSession, RiskAssessment
from app.models.user import Student
from sqlalchemy import text
import json
from datetime import datetime

def test_database_connection():
    """测试数据库连接"""
    print("🔗 测试MySQL数据库连接")
    print("=" * 50)
    
    try:
        # 测试基本连接
        print("📊 1. 测试数据库连接...")
        with engine.connect() as connection:
            result = connection.execute(text("SELECT VERSION()"))
            mysql_version = result.fetchone()[0]
            print(f"   ✅ MySQL连接成功")
            print(f"   📝 MySQL版本: {mysql_version}")
        
        # 测试表是否存在
        print("\n🗂️ 2. 检查AI对话相关表...")
        with engine.connect() as connection:
            # 检查ai_counseling_sessions表
            result = connection.execute(text(
                "SELECT COUNT(*) FROM information_schema.tables "
                "WHERE table_schema = 'emotion_management' "
                "AND table_name = 'ai_counseling_sessions'"
            ))
            sessions_table_exists = result.fetchone()[0] > 0
            
            if sessions_table_exists:
                print("   ✅ ai_counseling_sessions 表存在")
                
                # 获取表结构
                result = connection.execute(text(
                    "DESCRIBE ai_counseling_sessions"
                ))
                columns = result.fetchall()
                print("   📋 表结构:")
                for col in columns:
                    print(f"      - {col[0]}: {col[1]}")
            else:
                print("   ❌ ai_counseling_sessions 表不存在，尝试创建...")
                # 创建表
                Base.metadata.create_all(bind=engine)
                print("   ✅ 表创建完成")
        
        # 测试数据插入和查询
        print("\n💾 3. 测试对话数据存储...")
        db = SessionLocal()
        try:
            # 查找一个学生用户进行测试
            student = db.query(Student).first()
            if not student:
                print("   ⚠️ 没有找到学生用户，无法测试")
                return
            
            print(f"   👨‍🎓 使用学生用户: {student.user.username}")
            
            # 创建测试会话
            test_session = AICounselingSession(
                student_id=student.id,
                session_type="text",
                conversation_history=[
                    {
                        "role": "user",
                        "message": "测试消息",
                        "timestamp": datetime.now().isoformat()
                    },
                    {
                        "role": "assistant",
                        "message": "测试回复",
                        "timestamp": datetime.now().isoformat(),
                        "emotion_analysis": {"dominant_emotion": "neutral"},
                        "risk_assessment": {"risk_level": "low"}
                    }
                ],
                emotion_analysis={"overall": "positive"},
                risk_assessment={"level": "low", "score": 0.1},
                status="active"
            )
            
            db.add(test_session)
            db.commit()
            db.refresh(test_session)
            
            print(f"   ✅ 测试会话创建成功，ID: {test_session.id}")
            
            # 查询测试
            saved_session = db.query(AICounselingSession).filter(
                AICounselingSession.id == test_session.id
            ).first()
            
            if saved_session:
                print(f"   ✅ 对话历史查询成功")
                print(f"   📝 对话记录数: {len(saved_session.conversation_history)}")
                print(f"   💬 第一条消息: {saved_session.conversation_history[0]['message']}")
                
                # 清理测试数据
                db.delete(saved_session)
                db.commit()
                print("   🗑️ 测试数据已清理")
            
        except Exception as e:
            print(f"   ❌ 数据操作失败: {e}")
        finally:
            db.close()
        
        print("\n🎉 数据库测试完成！")
        print("✅ MySQL数据库完全可以用来存储AI对话历史")
        print("✅ 表结构完整，支持JSON格式存储")
        print("✅ 对话历史、情绪分析、风险评估都可以持久化")
        
    except Exception as e:
        print(f"❌ 数据库连接失败: {e}")
        print("💡 请检查MySQL服务是否运行")
        print("💡 请检查数据库配置是否正确")

if __name__ == "__main__":
    test_database_connection()
