#!/usr/bin/env python3
"""
数据验证脚本
Data Verification Script
"""

import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))
sys.path.insert(0, str(project_root / "backend"))

from app.core.database import SessionLocal
from app.models.user import User, Admin, Student, Counselor, UserRole
from app.models.assessment import Assessment
from app.models.consultation import Consultation
from app.models.ai_counseling import AICounselingSession
from app.models.anonymous import AnonymousMessage
from sqlalchemy import text

def verify_data():
    """验证数据库中的数据"""
    print("=" * 60)
    print("数据验证脚本")
    print("Data Verification Script")
    print("=" * 60)
    
    try:
        db = SessionLocal()
        
        # 验证用户数据
        print("\n1. 验证用户数据...")
        users = db.query(User).all()
        print(f"✓ 总用户数: {len(users)}")
        
        for user in users:
            print(f"  - {user.username} ({user.role}) - {user.email}")
        
        # 验证管理员数据
        print("\n2. 验证管理员数据...")
        admins = db.query(Admin).all()
        print(f"✓ 管理员数量: {len(admins)}")
        for admin in admins:
            user = db.query(User).filter(User.id == admin.user_id).first()
            print(f"  - {admin.name} (用户名: {user.username})")
        
        # 验证咨询师数据
        print("\n3. 验证咨询师数据...")
        counselors = db.query(Counselor).all()
        print(f"✓ 咨询师数量: {len(counselors)}")
        for counselor in counselors:
            user = db.query(User).filter(User.id == counselor.user_id).first()
            print(f"  - {counselor.name} (用户名: {user.username}) - {counselor.school}")
        
        # 验证学生数据
        print("\n4. 验证学生数据...")
        students = db.query(Student).all()
        print(f"✓ 学生数量: {len(students)}")
        for student in students:
            user = db.query(User).filter(User.id == student.user_id).first()
            print(f"  - {student.name} (用户名: {user.username}) - {student.major} {student.grade}")
        
        # 验证评估数据
        print("\n5. 验证评估数据...")
        assessments = db.query(Assessment).all()
        print(f"✓ 评估记录数量: {len(assessments)}")
        for assessment in assessments:
            student = db.query(Student).filter(Student.id == assessment.student_id).first()
            print(f"  - 学生: {student.name} - 类型: {assessment.assessment_type} - 分数: {assessment.total_score}")
        
        # 验证咨询数据
        print("\n6. 验证咨询数据...")
        consultations = db.query(Consultation).all()
        print(f"✓ 咨询记录数量: {len(consultations)}")
        for consultation in consultations:
            student = db.query(Student).filter(Student.id == consultation.student_id).first()
            counselor = db.query(Counselor).filter(Counselor.id == consultation.counselor_id).first()
            print(f"  - 学生: {student.name} - 咨询师: {counselor.name} - 状态: {consultation.status}")
        
        # 验证AI咨询数据
        print("\n7. 验证AI咨询数据...")
        ai_sessions = db.query(AICounselingSession).all()
        print(f"✓ AI咨询会话数量: {len(ai_sessions)}")
        for session in ai_sessions:
            student = db.query(Student).filter(Student.id == session.student_id).first()
            print(f"  - 学生: {student.name} - 类型: {session.session_type} - 状态: {session.status}")
        
        # 验证匿名消息数据
        print("\n8. 验证匿名消息数据...")
        anonymous_msgs = db.query(AnonymousMessage).all()
        print(f"✓ 匿名消息数量: {len(anonymous_msgs)}")
        for msg in anonymous_msgs:
            print(f"  - 标识: {msg.student_identifier} - 风险等级: {msg.risk_level}")
        
        # 统计总数据
        print("\n" + "=" * 60)
        print("数据统计汇总:")
        print("=" * 60)
        print(f"用户总数: {len(users)}")
        print(f"管理员: {len(admins)}")
        print(f"咨询师: {len(counselors)}")
        print(f"学生: {len(students)}")
        print(f"评估记录: {len(assessments)}")
        print(f"咨询记录: {len(consultations)}")
        print(f"AI咨询会话: {len(ai_sessions)}")
        print(f"匿名消息: {len(anonymous_msgs)}")
        
        if len(users) >= 8:
            print("\n✓ 数据验证成功！所有测试数据已正确插入。")
            return True
        else:
            print(f"\n⚠ 数据验证警告：用户数量不足，期望至少8个，实际{len(users)}个")
            return False
            
    except Exception as e:
        print(f"\n✗ 数据验证失败: {e}")
        return False
    
    finally:
        db.close()

if __name__ == "__main__":
    success = verify_data()
    sys.exit(0 if success else 1)
