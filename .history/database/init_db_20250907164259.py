"""
数据库初始化脚本
Database Initialization Script
"""

import os
import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from backend.app.core.database import init_db, engine
from backend.app.models import Base
from sqlalchemy import text
from loguru import logger

def create_database():
    """创建数据库"""
    try:
        # 连接到MySQL服务器（不指定数据库）
        from sqlalchemy import create_engine
        temp_engine = create_engine("mysql://root:password@localhost")
        
        with temp_engine.connect() as conn:
            # 创建数据库
            conn.execute(text("CREATE DATABASE IF NOT EXISTS emotion_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
            conn.commit()
            logger.info("数据库 'emotion_management' 创建成功")
            
    except Exception as e:
        logger.error(f"创建数据库失败: {e}")
        logger.info("请检查MySQL服务是否运行，以及用户名密码是否正确")
        return False
    
    finally:
        temp_engine.dispose()
    
    return True

def init_tables():
    """初始化表结构"""
    try:
        # 创建所有表
        Base.metadata.create_all(bind=engine)
        logger.info("数据库表创建成功")
        return True
    except Exception as e:
        logger.error(f"创建表失败: {e}")
        return False

def insert_sample_data():
    """插入示例数据"""
    try:
        from sqlalchemy.orm import Session
        from backend.app.core.database import SessionLocal
        from backend.app.models.user import User, Admin, Student, Counselor, UserRole, CounselorSchool
        from backend.app.models.assessment import Assessment, AssessmentRecord, EmotionRecord, AssessmentType
        from backend.app.models.consultation import Consultation, ConsultationRecord, Appointment, ConsultationType, ConsultationStatus
        from backend.app.models.ai_counseling import AICounselingSession, RiskAssessment
        from backend.app.models.anonymous import AnonymousMessage, AnonymousChat
        from backend.app.core.security import get_password_hash
        from datetime import datetime, timedelta
        import json
        
        db = SessionLocal()
        
        # 检查是否已有数据
        existing_users = db.query(User).count()
        if existing_users > 0:
            logger.info("数据库中已有数据，跳过示例数据插入")
            return True
        
        # 创建管理员用户
        admin_user = User(
            username="admin",
            email="admin@example.com",
            hashed_password="admin123",  # 明文密码
            role=UserRole.ADMIN
        )
        db.add(admin_user)
        db.flush()  # 获取ID
        
        admin = Admin(
            user_id=admin_user.id,
            name="系统管理员",
            department="信息技术部",
            phone="13800138000"
        )
        db.add(admin)
        
        # 创建咨询师用户
        counselor1_user = User(
            username="counselor1",
            email="counselor1@example.com",
            hashed_password="123456",  # 明文密码
            role=UserRole.COUNSELOR
        )
        db.add(counselor1_user)
        db.flush()
        
        counselor1 = Counselor(
            user_id=counselor1_user.id,
            name="张心理咨询师",
            school=CounselorSchool.COGNITIVE_BEHAVIORAL,
            description="专注于认知行为疗法，擅长处理焦虑和抑郁问题",
            specialties="焦虑症,抑郁症,压力管理",
            experience_years=8,
            phone="13800138001",
            office_location="心理咨询中心A101"
        )
        db.add(counselor1)
        
        counselor2_user = User(
            username="counselor2",
            email="counselor2@example.com",
            hashed_password="123456",  # 明文密码
            role=UserRole.COUNSELOR
        )
        db.add(counselor2_user)
        db.flush()
        
        counselor2 = Counselor(
            user_id=counselor2_user.id,
            name="李心理咨询师",
            school=CounselorSchool.HUMANISTIC,
            description="采用人本主义疗法，注重个人成长和自我实现",
            specialties="人际关系,自我认知,成长咨询",
            experience_years=5,
            phone="13800138002",
            office_location="心理咨询中心B201"
        )
        db.add(counselor2)
        
        # 创建更多咨询师
        counselor3_user = User(
            username="counselor3",
            email="counselor3@example.com",
            hashed_password="123456",  # 明文密码
            role=UserRole.COUNSELOR
        )
        db.add(counselor3_user)
        db.flush()
        
        counselor3 = Counselor(
            user_id=counselor3_user.id,
            name="陈心理咨询师",
            school=CounselorSchool.PSYCHOANALYTIC,
            description="精神分析专家，擅长深度心理分析",
            specialties="创伤治疗,人格障碍,深度分析",
            experience_years=12,
            phone="13800138005",
            office_location="心理咨询中心C301"
        )
        db.add(counselor3)
        
        # 创建学生用户
        student1_user = User(
            username="student1",
            email="student1@example.com",
            hashed_password="123456",  # 明文密码
            role=UserRole.STUDENT
        )
        db.add(student1_user)
        db.flush()
        
        student1 = Student(
            user_id=student1_user.id,
            student_id="2024001",
            name="王同学",
            major="计算机科学与技术",
            grade="大二",
            phone="13800138003",
            emergency_contact="王父",
            emergency_phone="13900139001"
        )
        db.add(student1)
        
        student2_user = User(
            username="student2",
            email="student2@example.com",
            hashed_password=get_password_hash("123456"),
            role=UserRole.STUDENT
        )
        db.add(student2_user)
        db.flush()
        
        student2 = Student(
            user_id=student2_user.id,
            student_id="2024002",
            name="李同学",
            major="心理学",
            grade="大三",
            phone="13800138004",
            emergency_contact="李母",
            emergency_phone="13900139002"
        )
        db.add(student2)
        
        # 创建更多学生
        student3_user = User(
            username="student3",
            email="student3@example.com",
            hashed_password=get_password_hash("123456"),
            role=UserRole.STUDENT
        )
        db.add(student3_user)
        db.flush()
        
        student3 = Student(
            user_id=student3_user.id,
            student_id="2024003",
            name="张同学",
            major="工商管理",
            grade="大一",
            phone="13800138006",
            emergency_contact="张母",
            emergency_phone="13900139003"
        )
        db.add(student3)
        
        student4_user = User(
            username="student4",
            email="student4@example.com",
            hashed_password=get_password_hash("123456"),
            role=UserRole.STUDENT
        )
        db.add(student4_user)
        db.flush()
        
        student4 = Student(
            user_id=student4_user.id,
            student_id="2024004",
            name="刘同学",
            major="临床医学",
            grade="大四",
            phone="13800138007",
            emergency_contact="刘父",
            emergency_phone="13900139004"
        )
        db.add(student4)
        
        db.flush()  # 确保所有用户ID都生成
        
        # 创建心理评估数据
        assessment1 = Assessment(
            student_id=student1.id,
            assessment_type=AssessmentType.PHQ9,
            status="completed",
            total_score=12.0,
            risk_level="moderate",
            keywords=json.dumps(["焦虑", "失眠", "压力"]),
            emotion_trend=json.dumps({"depression": 0.6, "anxiety": 0.7, "stress": 0.8}),
            end_time=datetime.now() - timedelta(days=1)
        )
        db.add(assessment1)
        
        assessment2 = Assessment(
            student_id=student2.id,
            assessment_type=AssessmentType.GAD7,
            status="completed",
            total_score=8.0,
            risk_level="low",
            keywords=json.dumps(["轻度焦虑", "学习压力"]),
            emotion_trend=json.dumps({"depression": 0.3, "anxiety": 0.4, "stress": 0.5}),
            end_time=datetime.now() - timedelta(days=2)
        )
        db.add(assessment2)
        
        # 创建咨询预约
        consultation1 = Consultation(
            student_id=student1.id,
            counselor_id=counselor1.id,
            consultation_type=ConsultationType.ONLINE,
            status=ConsultationStatus.SCHEDULED,
            scheduled_time=datetime.now() + timedelta(days=1, hours=14),
            duration=60,
            notes="学生主动预约，主要关注焦虑问题"
        )
        db.add(consultation1)
        
        consultation2 = Consultation(
            student_id=student2.id,
            counselor_id=counselor2.id,
            consultation_type=ConsultationType.FACE_TO_FACE,
            status=ConsultationStatus.COMPLETED,
            scheduled_time=datetime.now() - timedelta(days=3, hours=10),
            duration=60,
            notes="咨询效果良好，学生情绪有所改善",
            student_feedback=True
        )
        db.add(consultation2)
        
        # 创建AI咨询会话
        ai_session1 = AICounselingSession(
            student_id=student1.id,
            session_type="text",
            status="completed",
            end_time=datetime.now() - timedelta(hours=2),
            conversation_history=json.dumps([
                {"role": "user", "content": "我最近感觉很焦虑，睡不着觉"},
                {"role": "assistant", "content": "我理解你的感受，焦虑和失眠确实很困扰人。能告诉我具体是什么让你感到焦虑吗？"}
            ]),
            emotion_analysis=json.dumps({"anxiety": 0.8, "depression": 0.3, "stress": 0.7}),
            risk_assessment=json.dumps({"level": "moderate", "indicators": ["失眠", "焦虑"]}),
            intervention_suggestions="建议进行深度咨询，关注睡眠质量改善"
        )
        db.add(ai_session1)
        
        # 创建风险评估
        risk_assessment1 = RiskAssessment(
            session_id=ai_session1.id,
            risk_type="anxiety",
            risk_level="moderate",
            risk_score=0.7,
            risk_indicators=json.dumps(["失眠", "焦虑", "压力"]),
            intervention_required=True,
            counselor_notified=True,
            notification_sent_at=datetime.now() - timedelta(hours=1)
        )
        db.add(risk_assessment1)
        
        # 创建匿名消息
        anonymous_msg1 = AnonymousMessage(
            student_identifier="anon_001",
            message_type="text",
            content="我最近压力很大，不知道该怎么办",
            emotion_analysis=json.dumps({"stress": 0.8, "anxiety": 0.6}),
            risk_level="moderate",
            is_urgent=False,
            counselor_assigned=True
        )
        db.add(anonymous_msg1)
        
        # 创建匿名聊天
        anonymous_chat1 = AnonymousChat(
            message_id=anonymous_msg1.id,
            counselor_id=counselor1.id,
            chat_session_id="chat_001",
            status="active",
            conversation_history=json.dumps([
                {"role": "student", "content": "我最近压力很大，不知道该怎么办"},
                {"role": "counselor", "content": "我理解你的感受，能具体说说是什么让你感到压力吗？"}
            ]),
            risk_assessment=json.dumps({"level": "moderate", "type": "stress"}),
            intervention_required=False
        )
        db.add(anonymous_chat1)
        
        db.commit()
        logger.info("示例数据插入成功")
        return True
        
    except Exception as e:
        logger.error(f"插入示例数据失败: {e}")
        db.rollback()
        return False
    
    finally:
        db.close()

def main():
    """主函数"""
    logger.info("开始初始化数据库...")
    
    # 1. 创建数据库（可选，如果数据库已存在则跳过）
    logger.info("检查数据库是否存在...")
    
    # 2. 创建表结构
    if not init_tables():
        logger.error("表结构创建失败，退出")
        return
    
    # 3. 插入示例数据
    if not insert_sample_data():
        logger.error("示例数据插入失败")
        return
    
    logger.info("数据库初始化完成！")
    logger.info("=" * 50)
    logger.info("测试账号信息：")
    logger.info("管理员: admin / admin123")
    logger.info("咨询师: counselor1 / 123456")
    logger.info("咨询师: counselor2 / 123456")
    logger.info("咨询师: counselor3 / 123456")
    logger.info("学生: student1 / 123456")
    logger.info("学生: student2 / 123456")
    logger.info("学生: student3 / 123456")
    logger.info("学生: student4 / 123456")
    logger.info("=" * 50)
    logger.info("系统功能说明：")
    logger.info("1. 用户管理：支持管理员、咨询师、学生三种角色")
    logger.info("2. 心理评估：支持PHQ-9、GAD-7等标准化量表")
    logger.info("3. AI咨询：智能对话和情绪分析")
    logger.info("4. 预约咨询：在线和面对面咨询预约")
    logger.info("5. 匿名咨询：保护隐私的匿名咨询功能")
    logger.info("6. 风险评估：自动识别高风险学生并通知咨询师")

if __name__ == "__main__":
    main()