#!/usr/bin/env python3
"""
数据库连接和功能测试脚本
Database Connection and Functionality Test Script
"""

import os
import sys
from pathlib import Path
import mysql.connector
from mysql.connector import Error
import json
from datetime import datetime

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

def test_connection():
    """测试数据库连接"""
    print("🔌 测试数据库连接...")
    
    config = get_db_config()
    
    try:
        connection = mysql.connector.connect(**config)
        
        if connection.is_connected():
            db_info = connection.get_server_info()
            print(f"✅ 数据库连接成功")
            print(f"   MySQL版本: {db_info}")
            print(f"   数据库: {config['database']}")
            print(f"   主机: {config['host']}:{config['port']}")
            
            cursor = connection.cursor()
            cursor.execute("SELECT VERSION()")
            version = cursor.fetchone()
            print(f"   服务器版本: {version[0]}")
            
            return True, connection
        else:
            print("❌ 数据库连接失败")
            return False, None
            
    except Error as e:
        print(f"❌ 数据库连接错误: {e}")
        return False, None

def test_tables(connection):
    """测试表结构"""
    print("\n📋 测试数据库表结构...")
    
    try:
        cursor = connection.cursor()
        
        # 获取所有表
        cursor.execute("SHOW TABLES")
        tables = [table[0] for table in cursor.fetchall()]
        
        expected_tables = [
            'users', 'admins', 'students', 'counselors',
            'ai_counseling_sessions', 'assessments', 'assessment_records',
            'emotion_records', 'consultations', 'consultation_records',
            'appointments', 'risk_assessments', 'system_configs', 'operation_logs'
        ]
        
        print(f"📊 发现 {len(tables)} 个表")
        
        # 检查必需的表
        missing_tables = []
        for table in expected_tables:
            if table in tables:
                print(f"  ✅ {table}")
            else:
                print(f"  ❌ {table} (缺失)")
                missing_tables.append(table)
        
        if missing_tables:
            print(f"\n⚠️ 缺少 {len(missing_tables)} 个必需的表")
            return False
        
        print(f"\n✅ 所有必需的表都存在")
        return True
        
    except Error as e:
        print(f"❌ 测试表结构失败: {e}")
        return False

def test_data_integrity(connection):
    """测试数据完整性"""
    print("\n🔍 测试数据完整性...")
    
    try:
        cursor = connection.cursor()
        
        # 测试用户数据
        cursor.execute("SELECT COUNT(*) FROM users")
        user_count = cursor.fetchone()[0]
        print(f"👥 用户数量: {user_count}")
        
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'admin'")
        admin_count = cursor.fetchone()[0]
        print(f"👨‍💼 管理员数量: {admin_count}")
        
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'counselor'")
        counselor_count = cursor.fetchone()[0]
        print(f"👨‍⚕️ 咨询师数量: {counselor_count}")
        
        cursor.execute("SELECT COUNT(*) FROM users WHERE role = 'student'")
        student_count = cursor.fetchone()[0]
        print(f"🎓 学生数量: {student_count}")
        
        # 测试外键关系
        cursor.execute("""
            SELECT COUNT(*) FROM students s 
            INNER JOIN users u ON s.user_id = u.id 
            WHERE u.role = 'student'
        """)
        valid_students = cursor.fetchone()[0]
        print(f"🔗 有效学生记录: {valid_students}")
        
        cursor.execute("""
            SELECT COUNT(*) FROM counselors c 
            INNER JOIN users u ON c.user_id = u.id 
            WHERE u.role = 'counselor'
        """)
        valid_counselors = cursor.fetchone()[0]
        print(f"🔗 有效咨询师记录: {valid_counselors}")
        
        # 测试系统配置
        cursor.execute("SELECT COUNT(*) FROM system_configs")
        config_count = cursor.fetchone()[0]
        print(f"⚙️ 系统配置项: {config_count}")
        
        return True
        
    except Error as e:
        print(f"❌ 测试数据完整性失败: {e}")
        return False

def test_json_fields(connection):
    """测试JSON字段功能"""
    print("\n📄 测试JSON字段功能...")
    
    try:
        cursor = connection.cursor()
        
        # 测试系统配置JSON字段
        cursor.execute("SELECT config_key, config_value FROM system_configs WHERE config_type = 'json' LIMIT 1")
        result = cursor.fetchone()
        
        if result:
            config_key, config_value = result
            if config_value:
                try:
                    json.loads(config_value)
                    print(f"✅ JSON字段解析正常: {config_key}")
                except json.JSONDecodeError:
                    print(f"❌ JSON字段解析失败: {config_key}")
                    return False
        
        # 测试插入JSON数据
        test_json = {
            "test_key": "test_value",
            "timestamp": datetime.now().isoformat(),
            "nested": {
                "level1": "value1",
                "level2": 123
            }
        }
        
        cursor.execute("""
            INSERT INTO system_configs (config_key, config_value, config_type, description)
            VALUES (%s, %s, %s, %s)
        """, ("test_json_config", json.dumps(test_json), "json", "测试JSON配置"))
        
        # 验证插入的JSON数据
        cursor.execute("SELECT config_value FROM system_configs WHERE config_key = 'test_json_config'")
        result = cursor.fetchone()
        
        if result:
            retrieved_json = json.loads(result[0])
            if retrieved_json == test_json:
                print("✅ JSON数据插入和检索正常")
            else:
                print("❌ JSON数据不匹配")
                return False
        
        # 清理测试数据
        cursor.execute("DELETE FROM system_configs WHERE config_key = 'test_json_config'")
        
        return True
        
    except Error as e:
        print(f"❌ 测试JSON字段失败: {e}")
        return False

def test_permissions(connection):
    """测试数据库权限"""
    print("\n🔐 测试数据库权限...")
    
    try:
        cursor = connection.cursor()
        
        # 测试SELECT权限
        cursor.execute("SELECT 1")
        print("✅ SELECT权限正常")
        
        # 测试INSERT权限
        cursor.execute("""
            INSERT INTO system_configs (config_key, config_value, config_type, description)
            VALUES (%s, %s, %s, %s)
        """, ("permission_test", "test", "string", "权限测试"))
        print("✅ INSERT权限正常")
        
        # 测试UPDATE权限
        cursor.execute("""
            UPDATE system_configs 
            SET config_value = 'updated' 
            WHERE config_key = 'permission_test'
        """)
        print("✅ UPDATE权限正常")
        
        # 测试DELETE权限
        cursor.execute("DELETE FROM system_configs WHERE config_key = 'permission_test'")
        print("✅ DELETE权限正常")
        
        return True
        
    except Error as e:
        print(f"❌ 测试权限失败: {e}")
        return False

def test_character_set(connection):
    """测试字符集支持"""
    print("\n🌐 测试字符集支持...")
    
    try:
        cursor = connection.cursor()
        
        # 测试中文
        test_text = "你好，世界！这是一个测试。"
        cursor.execute("SELECT %s as test_text", (test_text,))
        result = cursor.fetchone()
        
        if result and result[0] == test_text:
            print("✅ 中文字符集支持正常")
        else:
            print("❌ 中文字符集支持异常")
            return False
        
        # 测试特殊字符
        special_chars = "🚀💡⭐️🎉🔥"
        cursor.execute("SELECT %s as special_chars", (special_chars,))
        result = cursor.fetchone()
        
        if result and result[0] == special_chars:
            print("✅ 特殊字符支持正常")
        else:
            print("❌ 特殊字符支持异常")
            return False
        
        return True
        
    except Error as e:
        print(f"❌ 测试字符集失败: {e}")
        return False

def test_performance(connection):
    """测试数据库性能"""
    print("\n⚡ 测试数据库性能...")
    
    try:
        cursor = connection.cursor()
        
        # 测试简单查询性能
        import time
        
        start_time = time.time()
        cursor.execute("SELECT COUNT(*) FROM users")
        result = cursor.fetchone()
        simple_query_time = time.time() - start_time
        
        print(f"📊 简单查询耗时: {simple_query_time:.4f}秒")
        
        # 测试复杂查询性能
        start_time = time.time()
        cursor.execute("""
            SELECT u.username, u.role, s.name, s.major 
            FROM users u 
            LEFT JOIN students s ON u.id = s.user_id 
            WHERE u.role = 'student'
        """)
        results = cursor.fetchall()
        complex_query_time = time.time() - start_time
        
        print(f"📊 复杂查询耗时: {complex_query_time:.4f}秒")
        print(f"📊 查询结果数量: {len(results)}")
        
        # 性能评估
        if simple_query_time < 0.1 and complex_query_time < 0.5:
            print("✅ 数据库性能良好")
        elif simple_query_time < 0.5 and complex_query_time < 2.0:
            print("⚠️ 数据库性能一般")
        else:
            print("❌ 数据库性能较差")
        
        return True
        
    except Error as e:
        print(f"❌ 测试性能失败: {e}")
        return False

def main():
    """主函数"""
    print("🧪 开始数据库测试...")
    print("=" * 50)
    
    # 测试连接
    success, connection = test_connection()
    if not success:
        print("\n❌ 数据库连接失败，无法继续测试")
        return False
    
    try:
        # 运行所有测试
        tests = [
            ("表结构", test_tables),
            ("数据完整性", test_data_integrity),
            ("JSON字段", test_json_fields),
            ("权限", test_permissions),
            ("字符集", test_character_set),
            ("性能", test_performance)
        ]
        
        passed_tests = 0
        total_tests = len(tests)
        
        for test_name, test_func in tests:
            try:
                if test_func(connection):
                    passed_tests += 1
                else:
                    print(f"❌ {test_name}测试失败")
            except Exception as e:
                print(f"❌ {test_name}测试异常: {e}")
        
        # 提交所有更改
        connection.commit()
        
        print("\n" + "=" * 50)
        print(f"📊 测试结果: {passed_tests}/{total_tests} 通过")
        
        if passed_tests == total_tests:
            print("🎉 所有测试通过！数据库配置正确")
            return True
        else:
            print("⚠️ 部分测试失败，请检查数据库配置")
            return False
            
    finally:
        if connection and connection.is_connected():
            connection.close()
            print("🔌 数据库连接已关闭")

if __name__ == "__main__":
    try:
        success = main()
        if success:
            print("\n✅ 数据库测试完成")
            sys.exit(0)
        else:
            print("\n❌ 数据库测试失败")
            sys.exit(1)
    except KeyboardInterrupt:
        print("\n⚠️ 用户中断测试")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 测试过程中发生错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
