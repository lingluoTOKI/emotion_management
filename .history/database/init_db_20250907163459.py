"""
数据库初始化脚本
Database Initialization Script
"""

import os
import sys
from pathlib import Path

# 添加项目根目录到Python路径
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

from app.core.database import init_db, engine
from app.models import Base
from sqlalchemy import text
from loguru import logger

def create_database():
    """创建数据库"""
    try:
        # 连接到MySQL服务器（不指定数据库）
        from sqlalchemy import create_engine
        from backend.app.core.config import settings
        
        # 从配置中提取数据库连接信息
        db_url = settings.DATABASE_URL
        # 解析数据库URL，提取主机、用户名、密码
        if db_url.startswith("mysql://"):
            # 格式: mysql://user:password@host/database
            parts = db_url.replace("mysql://", "").split("/")
            if len(parts) >= 2:
                user_pass_host = parts[0]
                database = parts[1]
                if "@" in user_pass_host:
                    user_pass, host = user_pass_host.split("@")
                    if ":" in user_pass:
                        user, password = user_pass.split(":")
                    else:
                        user, password = user_pass, ""
                else:
                    user, password, host = user_pass_host, "", "localhost"
                
                # 创建临时连接（不指定数据库）
                temp_url = f"mysql://{user}:{password}@{host}"
                temp_engine = create_engine(temp_url)
                
                with temp_engine.connect() as conn:
                    # 创建数据库
                    conn.execute(text("CREATE DATABASE IF NOT EXISTS emotion_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
                    conn.commit()
                    logger.info("数据库 'emotion_management' 创建成功")
            else:
                logger.error("数据库URL格式错误")
                return False
        else:
            logger.error("不支持的数据库类型")
            return False
            
    except Exception as e:
        logger.error(f"创建数据库失败: {e}")
        logger.info("请检查MySQL服务是否运行，以及用户名密码是否正确")
        return False
    
    finally:
        if 'temp_engine' in locals():
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
        from app.core.database import SessionLocal
        from app.models.user import User, Admin, Student, Counselor
        from app.core.security import get_password_hash
        
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
            hashed_password=get_password_hash("admin123"),
            role="admin"
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
            hashed_password=get_password_hash("123456"),
            role="counselor"
        )
        db.add(counselor1_user)
        db.flush()
        
        counselor1 = Counselor(
            user_id=counselor1_user.id,
            name="张心理咨询师",
            school="认知行为疗法",
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
            hashed_password=get_password_hash("123456"),
            role="counselor"
        )
        db.add(counselor2_user)
        db.flush()
        
        counselor2 = Counselor(
            user_id=counselor2_user.id,
            name="李心理咨询师",
            school="人本主义",
            description="采用人本主义疗法，注重个人成长和自我实现",
            specialties="人际关系,自我认知,成长咨询",
            experience_years=5,
            phone="13800138002",
            office_location="心理咨询中心B201"
        )
        db.add(counselor2)
        
        # 创建学生用户
        student1_user = User(
            username="student1",
            email="student1@example.com",
            hashed_password=get_password_hash("123456"),
            role="student"
        )
        db.add(student1_user)
        db.flush()
        
        student1 = Student(
            user_id=student1_user.id,
            student_id="2024001",
            name="王同学",
            major="计算机科学与技术",
            grade="大二",
            phone="13800138003"
        )
        db.add(student1)
        
        student2_user = User(
            username="student2",
            email="student2@example.com",
            hashed_password=get_password_hash("123456"),
            role="student"
        )
        db.add(student2_user)
        db.flush()
        
        student2 = Student(
            user_id=student2_user.id,
            student_id="2024002",
            name="李同学",
            major="心理学",
            grade="大三",
            phone="13800138004"
        )
        db.add(student2)
        
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
    
    # 1. 创建数据库（跳过，因为已经手动创建）
    logger.info("数据库已存在，跳过创建步骤")
    
    # 2. 创建表结构
    if not init_tables():
        logger.error("表结构创建失败，退出")
        return
    
    # 3. 插入示例数据
    if not insert_sample_data():
        logger.error("示例数据插入失败")
        return
    
    logger.info("数据库初始化完成！")
    logger.info("测试账号信息：")
    logger.info("管理员: admin / admin123")
    logger.info("咨询师: counselor1 / 123456")
    logger.info("学生: student1 / 123456")

if __name__ == "__main__":
    main()
