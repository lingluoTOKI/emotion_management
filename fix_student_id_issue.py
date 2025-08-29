#!/usr/bin/env python3
"""
修复学生ID外键约束问题
Fix Student ID Foreign Key Constraint Issue
"""

import sys
sys.path.append('backend')

from app.core.database import SessionLocal
from app.models.user import User, Student
from sqlalchemy import text

def fix_student_id_issue():
    """修复学生ID外键约束问题"""
    
    print("🔧 修复学生ID外键约束问题")
    print("=" * 40)
    
    db = SessionLocal()
    try:
        # 查看当前用户和学生记录
        print("👥 检查用户记录...")
        users = db.query(User).all()
        for user in users:
            print(f"   用户ID: {user.id}, 用户名: {user.username}, 角色: {user.role}")
        
        print("\n👨‍🎓 检查学生记录...")
        students = db.query(Student).all()
        for student in students:
            print(f"   学生ID: {student.id}, 用户ID: {student.user_id}, 用户名: {student.user.username}")
        
        # 查找role为student但没有对应Student记录的用户
        student_users = db.query(User).filter(User.role == 'student').all()
        for user in student_users:
            existing_student = db.query(Student).filter(Student.user_id == user.id).first()
            if not existing_student:
                print(f"\n🔨 为用户 {user.username} (ID: {user.id}) 创建学生记录...")
                new_student = Student(
                    user_id=user.id,
                    student_id=f"STU{user.id:04d}",  # 生成学号
                    enrollment_year=2024,
                    major="计算机科学",
                    grade="本科",
                    status="active"
                )
                db.add(new_student)
                print(f"   ✅ 学生记录创建成功")
        
        db.commit()
        
        print("\n📊 修复后的学生记录:")
        students = db.query(Student).all()
        for student in students:
            print(f"   学生ID: {student.id}, 用户ID: {student.user_id}, 用户名: {student.user.username}")
        
        print("\n✅ 学生ID外键约束问题修复完成")
        
    except Exception as e:
        print(f"❌ 修复失败: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_student_id_issue()
