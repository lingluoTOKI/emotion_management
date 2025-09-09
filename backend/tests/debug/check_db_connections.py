#!/usr/bin/env python3
"""
检查数据库连接
Check database connections
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
from app.core.database import engine, SessionLocal
from sqlalchemy import text, inspect
import mysql.connector
import re

def check_all_connections():
    """检查所有数据库连接"""
    
    print("🔍 检查数据库连接配置...")
    print(f"📋 配置文件中的DATABASE_URL: {settings.DATABASE_URL}")
    
    # 1. 直接MySQL连接
    print("\n1️⃣ 直接MySQL连接测试:")
    try:
        db_url = settings.DATABASE_URL
        match = re.match(r'mysql://([^:]+):([^@]+)@([^/]+)/(.+)', db_url)
        if not match:
            print("❌ 无法解析数据库URL")
            return
            
        username, password, host, database = match.groups()
        print(f"   主机: {host}")
        print(f"   数据库: {database}")
        print(f"   用户: {username}")
        
        conn = mysql.connector.connect(
            host=host,
            user=username,
            password=password,
            database=database
        )
        cursor = conn.cursor()
        
        # 检查当前数据库
        cursor.execute("SELECT DATABASE()")
        current_db = cursor.fetchone()[0]
        print(f"✅ 当前连接的数据库: {current_db}")
        
        # 检查表结构
        cursor.execute("DESCRIBE users")
        columns = cursor.fetchall()
        
        print("📋 users表结构:")
        for column in columns:
            print(f"   - {column[0]}: {column[1]}")
        
        # 检查用户数据
        cursor.execute("SELECT username, role FROM users LIMIT 3")
        users = cursor.fetchall()
        print("👥 用户数据样例:")
        for user in users:
            print(f"   - {user[0]}: {user[1]}")
        
        conn.close()
        
    except Exception as e:
        print(f"❌ 直接MySQL连接失败: {e}")
    
    # 2. SQLAlchemy连接
    print("\n2️⃣ SQLAlchemy连接测试:")
    try:
        with engine.connect() as conn:
            # 检查当前数据库
            result = conn.execute(text("SELECT DATABASE()"))
            current_db = result.fetchone()[0]
            print(f"✅ SQLAlchemy连接的数据库: {current_db}")
            
            # 检查表结构
            inspector = inspect(engine)
            columns = inspector.get_columns('users')
            
            print("📋 SQLAlchemy看到的users表结构:")
            for column in columns:
                print(f"   - {column['name']}: {column['type']}")
            
            # 测试查询
            result = conn.execute(text("SELECT username, role FROM users LIMIT 3"))
            users = result.fetchall()
            print("👥 SQLAlchemy查询的用户数据:")
            for user in users:
                print(f"   - {user[0]}: {user[1]}")
                
    except Exception as e:
        print(f"❌ SQLAlchemy连接失败: {e}")
        import traceback
        traceback.print_exc()
    
    # 3. SessionLocal连接
    print("\n3️⃣ SessionLocal连接测试:")
    try:
        db = SessionLocal()
        
        # 直接SQL查询
        result = db.execute(text("SELECT DATABASE()"))
        current_db = result.fetchone()[0]
        print(f"✅ SessionLocal连接的数据库: {current_db}")
        
        # 测试用户查询
        result = db.execute(text("SELECT username, role, hashed_password FROM users WHERE username = 'student1'"))
        user = result.fetchone()
        if user:
            print(f"✅ 找到用户 student1:")
            print(f"   用户名: {user[0]}")
            print(f"   角色: {user[1]}")
            print(f"   密码哈希长度: {len(user[2]) if user[2] else 0}")
        else:
            print("❌ 未找到用户 student1")
        
        db.close()
        
    except Exception as e:
        print(f"❌ SessionLocal连接失败: {e}")
        import traceback
        traceback.print_exc()
    
    # 4. 检查是否有多个数据库
    print("\n4️⃣ 检查是否有多个数据库:")
    try:
        conn = mysql.connector.connect(
            host=host,
            user=username,
            password=password
        )
        cursor = conn.cursor()
        
        cursor.execute("SHOW DATABASES LIKE '%emotion%'")
        databases = cursor.fetchall()
        
        print("📋 包含'emotion'的数据库:")
        for db in databases:
            print(f"   - {db[0]}")
            
        conn.close()
        
    except Exception as e:
        print(f"❌ 检查数据库列表失败: {e}")

if __name__ == "__main__":
    check_all_connections()
