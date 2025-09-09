#!/usr/bin/env python3
"""
MySQL环境检测脚本
MySQL Environment Detection Script
"""

import subprocess
import sys
import os
import json
from pathlib import Path

def run_command(cmd, capture_output=True):
    """运行命令并返回结果"""
    try:
        if capture_output:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, encoding='utf-8')
            return result.returncode == 0, result.stdout.strip(), result.stderr.strip()
        else:
            result = subprocess.run(cmd, shell=True)
            return result.returncode == 0, "", ""
    except Exception as e:
        return False, "", str(e)

def detect_mysql_services():
    """检测MySQL服务"""
    services = []
    
    # Windows服务检测
    if os.name == 'nt':
        service_names = ['MySQL80', 'MySQL', 'mysql', 'MariaDB', 'MySQL57', 'MySQL56']
        for service in service_names:
            success, stdout, stderr = run_command(f'sc query {service}')
            if success and 'RUNNING' in stdout:
                services.append({
                    'name': service,
                    'status': 'running',
                    'platform': 'windows'
                })
            elif success:
                services.append({
                    'name': service,
                    'status': 'stopped',
                    'platform': 'windows'
                })
    
    return services

def detect_mysql_installation():
    """检测MySQL安装路径"""
    mysql_paths = []
    
    # 常见安装路径
    common_paths = [
        r'C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe',
        r'C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe',
        r'C:\Program Files\MySQL\MySQL Server 5.6\bin\mysql.exe',
        r'C:\Program Files (x86)\MySQL\MySQL Server 8.0\bin\mysql.exe',
        r'C:\Program Files (x86)\MySQL\MySQL Server 5.7\bin\mysql.exe',
        r'C:\xampp\mysql\bin\mysql.exe',
        r'C:\wamp64\bin\mysql\mysql8.0.21\bin\mysql.exe',
        r'C:\laragon\bin\mysql\mysql-8.0.30-winx64\bin\mysql.exe'
    ]
    
    for path in common_paths:
        if os.path.exists(path):
            mysql_paths.append(path)
    
    # 检查PATH中的mysql
    success, stdout, stderr = run_command('where mysql')
    if success and stdout:
        for line in stdout.split('\n'):
            if line.strip() and os.path.exists(line.strip()):
                mysql_paths.append(line.strip())
    
    return mysql_paths

def test_mysql_connection(host='localhost', port=3306, user='root', password=''):
    """测试MySQL连接"""
    # 构建连接命令
    if password:
        cmd = f'mysql -h {host} -P {port} -u {user} -p{password} -e "SELECT 1"'
    else:
        cmd = f'mysql -h {host} -P {port} -u {user} -e "SELECT 1"'
    
    success, stdout, stderr = run_command(cmd)
    return success

def get_mysql_version():
    """获取MySQL版本"""
    success, stdout, stderr = run_command('mysql --version')
    if success:
        return stdout
    return None

def detect_existing_databases(host='localhost', port=3306, user='root', password=''):
    """检测现有数据库"""
    if password:
        cmd = f'mysql -h {host} -P {port} -u {user} -p{password} -e "SHOW DATABASES"'
    else:
        cmd = f'mysql -h {host} -P {port} -u {user} -e "SHOW DATABASES"'
    
    success, stdout, stderr = run_command(cmd)
    if success:
        databases = []
        for line in stdout.split('\n'):
            line = line.strip()
            if line and line not in ['Database', 'information_schema', 'mysql', 'performance_schema', 'sys']:
                databases.append(line)
        return databases
    return []

def detect_existing_users(host='localhost', port=3306, user='root', password=''):
    """检测现有用户"""
    if password:
        cmd = f'mysql -h {host} -P {port} -u {user} -p{password} -e "SELECT User, Host FROM mysql.user WHERE User NOT IN (\'root\', \'mysql.session\', \'mysql.sys\', \'mysql.infoschema\')"'
    else:
        cmd = f'mysql -h {host} -P {port} -u {user} -e "SELECT User, Host FROM mysql.user WHERE User NOT IN (\'root\', \'mysql.session\', \'mysql.sys\', \'mysql.infoschema\')"'
    
    success, stdout, stderr = run_command(cmd)
    if success:
        users = []
        for line in stdout.split('\n'):
            line = line.strip()
            if line and not line.startswith('User'):
                parts = line.split('\t')
                if len(parts) >= 2:
                    users.append({'user': parts[0], 'host': parts[1]})
        return users
    return []

def main():
    """主函数"""
    print("=" * 60)
    print("MySQL环境检测脚本")
    print("MySQL Environment Detection Script")
    print("=" * 60)
    
    # 检测MySQL安装
    print("\n1. 检测MySQL安装...")
    mysql_paths = detect_mysql_installation()
    if mysql_paths:
        print(f"✓ 找到MySQL安装: {len(mysql_paths)}个")
        for path in mysql_paths:
            print(f"  - {path}")
    else:
        print("✗ 未找到MySQL安装")
        return False
    
    # 检测MySQL版本
    print("\n2. 检测MySQL版本...")
    version = get_mysql_version()
    if version:
        print(f"✓ MySQL版本: {version}")
    else:
        print("✗ 无法获取MySQL版本")
    
    # 检测MySQL服务
    print("\n3. 检测MySQL服务...")
    services = detect_mysql_services()
    if services:
        for service in services:
            status_icon = "✓" if service['status'] == 'running' else "⚠"
            print(f"{status_icon} 服务: {service['name']} - {service['status']}")
    else:
        print("⚠ 未检测到MySQL服务")
    
    # 测试连接
    print("\n4. 测试MySQL连接...")
    
    # 尝试不同的连接配置
    connection_configs = [
        {'host': 'localhost', 'port': 3306, 'user': 'root', 'password': ''},
        {'host': 'localhost', 'port': 3306, 'user': 'root', 'password': 'root'},
        {'host': 'localhost', 'port': 3306, 'user': 'root', 'password': 'password'},
        {'host': 'localhost', 'port': 3306, 'user': 'root', 'password': '123456'},
        {'host': '127.0.0.1', 'port': 3306, 'user': 'root', 'password': ''},
    ]
    
    working_config = None
    for config in connection_configs:
        print(f"  测试连接: {config['user']}@{config['host']}:{config['port']} (密码: {'***' if config['password'] else '无'})")
        if test_mysql_connection(**config):
            print(f"  ✓ 连接成功!")
            working_config = config
            break
        else:
            print(f"  ✗ 连接失败")
    
    if not working_config:
        print("\n✗ 无法连接到MySQL，请检查:")
        print("  - MySQL服务是否启动")
        print("  - 用户名密码是否正确")
        print("  - 端口是否被占用")
        return False
    
    # 检测现有数据库
    print("\n5. 检测现有数据库...")
    databases = detect_existing_databases(**working_config)
    if databases:
        print(f"✓ 找到 {len(databases)} 个用户数据库:")
        for db in databases:
            print(f"  - {db}")
    else:
        print("✓ 没有用户数据库")
    
    # 检测现有用户
    print("\n6. 检测现有用户...")
    users = detect_existing_users(**working_config)
    if users:
        print(f"✓ 找到 {len(users)} 个用户:")
        for user in users:
            print(f"  - {user['user']}@{user['host']}")
    else:
        print("✓ 没有自定义用户")
    
    # 生成配置建议
    print("\n7. 配置建议...")
    config_suggestions = {
        'mysql_host': working_config['host'],
        'mysql_port': working_config['port'],
        'mysql_root_user': working_config['user'],
        'mysql_root_password': working_config['password'],
        'database_name': 'emotion_management',
        'database_user': 'emotion_user',
        'database_password': 'emotion123',
        'mysql_path': mysql_paths[0] if mysql_paths else '',
        'services': services
    }
    
    # 保存配置到文件
    config_file = Path(__file__).parent / 'mysql_config.json'
    with open(config_file, 'w', encoding='utf-8') as f:
        json.dump(config_suggestions, f, indent=2, ensure_ascii=False)
    
    print(f"✓ 配置已保存到: {config_file}")
    
    print("\n" + "=" * 60)
    print("检测完成!")
    print("=" * 60)
    
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
