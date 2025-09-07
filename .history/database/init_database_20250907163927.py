#!/usr/bin/env python3
"""
情绪管理系统数据库初始化脚本
Emotion Management System Database Initialization Script
版本: 2.0
"""

import os
import sys
import subprocess
from pathlib import Path
from datetime import datetime
import mysql.connector
from mysql.connector import Error
import hashlib
import secrets

# 添加项目根目录到Python路径
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

def get_db_config():
    """获取数据库配置"""
    return {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': int(os.getenv('DB_PORT', 3306)),
        'user': os.getenv('DB_USER', 'root'),
        'password': os.getenv('DB_PASSWORD', 'password'),
        'database': os.getenv('DB_NAME', 'emotion_management'),
        'charset': 'utf8mb4'
    }

def create_database():
    """创建数据库"""
    config = get_db_config()
    database_name = config['database']
    
    # 移除数据库名，连接到MySQL服务器
    config_without_db = config.copy()
    del config_without_db['database']
    
    try:
        print(f"🔧 正在创建数据库 '{database_name}'...")
        
        connection = mysql.connector.connect(**config_without_db)
        cursor = connection.cursor()
        
        # 创建数据库
        cursor.execute(f"""
            CREATE DATABASE IF NOT EXISTS {database_name} 
            CHARACTER SET utf8mb4 
            COLLATE utf8mb4_unicode_ci
        """)
        
        connection.commit()
        print(f"✅ 数据库 '{database_name}' 创建成功")
        
        return True
        
    except Error as e:
        print(f"❌ 创建数据库失败: {e}")
        return False
        
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

def execute_sql_file(sql_file_path):
    """执行SQL文件"""
    config = get_db_config()
    
    try:
        print(f"🔧 正在执行SQL文件: {sql_file_path}")
        
        connection = mysql.connector.connect(**config)
        cursor = connection.cursor()
        
        # 读取SQL文件
        with open(sql_file_path, 'r', encoding='utf-8') as file:
            sql_content = file.read()
        
        # 分割SQL语句（以分号分隔）
        sql_statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
        
        # 执行每个SQL语句
        for i, statement in enumerate(sql_statements, 1):
            if statement:
                try:
                    cursor.execute(statement)
                    print(f"  ✅ 执行语句 {i}/{len(sql_statements)}")
                except Error as e:
                    print(f"  ⚠️ 语句 {i} 执行失败: {e}")
                    # 继续执行其他语句
        
        connection.commit()
        print(f"✅ SQL文件执行完成")
        
        return True
        
    except Error as e:
        print(f"❌ 执行SQL文件失败: {e}")
        return False
        
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

def verify_database():
    """验证数据库结构"""
    config = get_db_config()
    
    try:
        print("🔍 正在验证数据库结构...")
        
        connection = mysql.connector.connect(**config)
        cursor = connection.cursor()
        
        # 检查表是否存在
        cursor.execute("SHOW TABLES")
        tables = [table[0] for table in cursor.fetchall()]
        
        expected_tables = [
            'users', 'admins', 'students', 'counselors',
            'ai_counseling_sessions', 'assessments', 'assessment_records',
            'emotion_records', 'consultations', 'consultation_records',
            'appointments', 'risk_assessments', 'system_configs', 'operation_logs'
        ]
        
        missing_tables = [table for table in expected_tables if table not in tables]
        
        if missing_tables:
            print(f"⚠️ 缺少表: {', '.join(missing_tables)}")
            return False
        
        # 检查用户数据
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM students")
        student_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM counselors")
        counselor_count = cursor.fetchone()[0]
        
        cursor.execute("SELECT COUNT(*) FROM admins")
        admin_count = cursor.fetchone()[0]
        
        print(f"✅ 数据库验证完成:")
        print(f"  📊 表数量: {len(tables)}")
        print(f"  👥 用户数量: {user_count}")
        print(f"  🎓 学生数量: {student_count}")
        print(f"  👨‍⚕️ 咨询师数量: {counselor_count}")
        print(f"  👨‍💼 管理员数量: {admin_count}")
        
        return True
        
    except Error as e:
        print(f"❌ 验证数据库失败: {e}")
        return False
        
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

def create_backup():
    """创建数据库备份"""
    config = get_db_config()
    backup_dir = Path(__file__).parent / "backups"
    backup_dir.mkdir(exist_ok=True)
    
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_file = backup_dir / f"emotion_management_backup_{timestamp}.sql"
    
    try:
        print(f"💾 正在创建数据库备份: {backup_file}")
        
        # 使用mysqldump创建备份
        cmd = [
            'mysqldump',
            f'--host={config["host"]}',
            f'--port={config["port"]}',
            f'--user={config["user"]}',
            f'--password={config["password"]}',
            '--single-transaction',
            '--routines',
            '--triggers',
            config['database']
        ]
        
        with open(backup_file, 'w', encoding='utf-8') as f:
            subprocess.run(cmd, stdout=f, stderr=subprocess.PIPE, check=True)
        
        print(f"✅ 数据库备份创建成功: {backup_file}")
        return str(backup_file)
        
    except subprocess.CalledProcessError as e:
        print(f"❌ 创建备份失败: {e}")
        return None
    except Exception as e:
        print(f"❌ 创建备份时发生错误: {e}")
        return None

def generate_password_hash(password: str) -> str:
    """生成密码哈希"""
    import bcrypt
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def create_test_data():
    """创建测试数据"""
    config = get_db_config()
    
    try:
        print("🔧 正在创建测试数据...")
        
        connection = mysql.connector.connect(**config)
        cursor = connection.cursor()
        
        # 检查是否已有测试数据
        cursor.execute("SELECT COUNT(*) FROM users WHERE username LIKE 'test_%'")
        existing_test_users = cursor.fetchone()[0]
        
        if existing_test_users > 0:
            print("ℹ️ 测试数据已存在，跳过创建")
            return True
        
        # 创建测试用户
        test_users = [
            ('test_student1', 'test_student1@example.com', 'student', '测试学生1', '2024T001', '计算机科学', '大二'),
            ('test_student2', 'test_student2@example.com', 'student', '测试学生2', '2024T002', '心理学', '大三'),
            ('test_counselor1', 'test_counselor1@example.com', 'counselor', '测试咨询师1', None, '认知行为疗法', None),
        ]
        
        password_hash = generate_password_hash('test123')
        
        for username, email, role, name, student_id, major_or_school, grade in test_users:
            # 插入用户
            cursor.execute("""
                INSERT INTO users (username, email, hashed_password, role, is_active)
                VALUES (%s, %s, %s, %s, 1)
            """, (username, email, password_hash, role))
            
            user_id = cursor.lastrowid
            
            if role == 'student':
                # 插入学生信息
                cursor.execute("""
                    INSERT INTO students (user_id, student_id, name, major, grade, phone)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (user_id, student_id, name, major_or_school, grade, '13800000000'))
                
            elif role == 'counselor':
                # 插入咨询师信息
                cursor.execute("""
                    INSERT INTO counselors (user_id, name, school, description, specialties, experience_years, phone, office_location)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                """, (user_id, name, major_or_school, '测试咨询师', '测试专业', 3, '13800000000', '测试办公室'))
        
        connection.commit()
        print("✅ 测试数据创建成功")
        print("📝 测试账号信息:")
        print("  学生: test_student1 / test123")
        print("  学生: test_student2 / test123")
        print("  咨询师: test_counselor1 / test123")
        
        return True
        
    except Error as e:
        print(f"❌ 创建测试数据失败: {e}")
        return False
        
    finally:
        if 'connection' in locals() and connection.is_connected():
            cursor.close()
            connection.close()

def main():
    """主函数"""
    print("🚀 开始初始化情绪管理系统数据库...")
    print("=" * 50)
    
    # 检查MySQL连接
    config = get_db_config()
    try:
        connection = mysql.connector.connect(**{k: v for k, v in config.items() if k != 'database'})
        connection.close()
        print("✅ MySQL连接正常")
    except Error as e:
        print(f"❌ MySQL连接失败: {e}")
        print("请检查MySQL服务是否运行，以及连接配置是否正确")
        return False
    
    # 1. 创建数据库
    if not create_database():
        return False
    
    # 2. 执行部署SQL文件
    sql_file = Path(__file__).parent / "deploy.sql"
    if sql_file.exists():
        if not execute_sql_file(sql_file):
            return False
    else:
        print(f"⚠️ SQL文件不存在: {sql_file}")
        return False
    
    # 3. 验证数据库结构
    if not verify_database():
        return False
    
    # 4. 创建测试数据
    if not create_test_data():
        return False
    
    # 5. 创建备份
    backup_file = create_backup()
    
    print("=" * 50)
    print("🎉 数据库初始化完成！")
    print("📋 系统信息:")
    print(f"  数据库: {config['database']}")
    print(f"  主机: {config['host']}:{config['port']}")
    print(f"  字符集: {config['charset']}")
    if backup_file:
        print(f"  备份文件: {backup_file}")
    
    print("\n🔑 默认账号信息:")
    print("  管理员: admin / 123456")
    print("  咨询师: counselor1 / 123456")
    print("  咨询师: counselor2 / 123456")
    print("  学生: student1 / 123456")
    print("  学生: student2 / 123456")
    print("  学生: student3 / 123456")
    
    print("\n🧪 测试账号信息:")
    print("  学生: test_student1 / test123")
    print("  学生: test_student2 / test123")
    print("  咨询师: test_counselor1 / test123")
    
    return True

if __name__ == "__main__":
    try:
        success = main()
        if success:
            print("\n✅ 数据库初始化成功完成！")
            sys.exit(0)
        else:
            print("\n❌ 数据库初始化失败！")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n⚠️ 用户中断操作")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 发生未预期的错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
