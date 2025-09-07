#!/usr/bin/env python3
"""
修复数据库架构问题
Fix database schema issues
"""

import mysql.connector
from app.core.config import settings
import re

def fix_database_schema():
    """修复数据库架构"""
    
    # 解析数据库URL
    db_url = settings.DATABASE_URL
    # mysql://emotion_user:emotion123@localhost/emotion_management
    match = re.match(r'mysql://([^:]+):([^@]+)@([^/]+)/(.+)', db_url)
    if not match:
        print("❌ 无法解析数据库URL")
        return
        
    username, password, host, database = match.groups()
    
    try:
        # 连接到数据库
        conn = mysql.connector.connect(
            host=host,
            user=username,
            password=password,
            database=database
        )
        cursor = conn.cursor()
        
        print("✅ 已连接到数据库")
        
        # 检查users表结构
        cursor.execute("DESCRIBE users")
        columns = cursor.fetchall()
        
        print("📋 当前users表结构:")
        for column in columns:
            print(f"  - {column[0]}: {column[1]}")
        
        # 检查是否存在hashed_password列
        column_names = [col[0] for col in columns]
        
        if 'hashed_password' not in column_names:
            print("⚠️ 缺少hashed_password列，正在添加...")
            
            # 添加hashed_password列
            cursor.execute("ALTER TABLE users ADD COLUMN hashed_password VARCHAR(255) NOT NULL DEFAULT ''")
            print("✅ 已添加hashed_password列")
            
            # 如果存在password列，复制数据
            if 'password' in column_names:
                print("🔄 从password列复制数据...")
                cursor.execute("UPDATE users SET hashed_password = password")
                print("✅ 数据复制完成")
        
        # 确保表结构正确
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users_new (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                hashed_password VARCHAR(255) NOT NULL,
                role ENUM('admin', 'student', 'counselor') NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
        """)
        
        # 复制数据到新表
        cursor.execute("""
            INSERT IGNORE INTO users_new (id, username, email, hashed_password, role, is_active, created_at, updated_at)
            SELECT id, username, email, 
                   CASE 
                       WHEN hashed_password != '' THEN hashed_password 
                       ELSE '$2b$12$WS03cbpTGfxdvDI9gNKbheJ76PAYGbkiBdIt2bWlSpkueYOP.LQPu'
                   END,
                   role, is_active, created_at, updated_at
            FROM users
        """)
        
        # 备份原表并替换
        cursor.execute("DROP TABLE IF EXISTS users_backup")
        cursor.execute("RENAME TABLE users TO users_backup")
        cursor.execute("RENAME TABLE users_new TO users")
        
        print("✅ 数据库架构修复完成")
        
        # 提交更改
        conn.commit()
        
    except mysql.connector.Error as e:
        print(f"❌ 数据库错误: {e}")
    except Exception as e:
        print(f"❌ 修复失败: {e}")
    finally:
        if 'conn' in locals():
            conn.close()

if __name__ == "__main__":
    fix_database_schema()

