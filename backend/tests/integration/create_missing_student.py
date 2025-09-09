#!/usr/bin/env python3
"""
创建缺失的学生记录
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.database import SessionLocal
from app.models.user import User, Student

def create_missing_student():
    """创建缺失的学生记录"""
    
    print("🔧 创建缺失的学生记录")
    print("=" * 30)
    
    db = SessionLocal()
    try:
        # 查找所有学生用户
        student_users = db.query(User).filter(User.role == 'student').all()
        print(f"找到 {len(student_users)} 个学生用户")
        
        for user in student_users:
            # 检查是否已有对应的学生记录
            existing_student = db.query(Student).filter(Student.user_id == user.id).first()
            
            if not existing_student:
                print(f"为用户 {user.username} (ID: {user.id}) 创建学生记录...")
                
                # 创建新的学生记录
                new_student = Student(
                    user_id=user.id,
                    student_id=f"STU{user.id:04d}",  # 生成学号
                    name=user.username,  # 使用用户名作为姓名
                    major="计算机科学",
                    grade="本科"
                )
                
                db.add(new_student)
                print(f"   ✅ 学生记录创建成功")
            else:
                print(f"用户 {user.username} 已有学生记录 (ID: {existing_student.id})")
        
        # 提交更改
        db.commit()
        
        # 验证结果
        print("\n📊 当前学生记录:")
        students = db.query(Student).all()
        for student in students:
            print(f"   学生ID: {student.id}, 用户ID: {student.user_id}, 用户名: {student.user.username}")
        
        print(f"\n✅ 完成！共有 {len(students)} 个学生记录")
        
    except Exception as e:
        print(f"❌ 操作失败: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    create_missing_student()
