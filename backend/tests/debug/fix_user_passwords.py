#!/usr/bin/env python3
"""
修复用户密码哈希
Fix user password hashes
"""

from app.core.database import get_db
from app.core.security import get_password_hash
from app.models.user import User
from sqlalchemy.orm import Session

def fix_user_passwords():
    """修复测试用户的密码哈希"""
    db = next(get_db())
    
    # 测试用户的正确密码
    test_users = [
        ('admin1', 'admin123'),
        ('student1', '123456'),
        ('student2', '123456'), 
        ('counselor1', '123456'),
        ('counselor2', '123456')
    ]
    
    print("开始修复用户密码...")
    
    for username, password in test_users:
        user = db.query(User).filter(User.username == username).first()
        if user:
            # 生成正确的密码哈希
            correct_hash = get_password_hash(password)
            user.hashed_password = correct_hash
            print(f"✅ 已更新用户 {username} 的密码哈希")
        else:
            # 创建用户如果不存在
            from app.models.user import UserRole
            
            # 根据用户名确定角色
            if username.startswith('admin'):
                role = UserRole.ADMIN
            elif username.startswith('student'):
                role = UserRole.STUDENT
            elif username.startswith('counselor'):
                role = UserRole.COUNSELOR
            else:
                role = UserRole.STUDENT
                
            new_user = User(
                username=username,
                email=f"{username}@example.com",
                hashed_password=get_password_hash(password),
                role=role,
                is_active=True
            )
            db.add(new_user)
            print(f"✅ 已创建用户 {username}")
    
    # 提交更改
    try:
        db.commit()
        print("✅ 所有更改已保存到数据库")
    except Exception as e:
        print(f"❌ 保存失败: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    fix_user_passwords()

