#!/bin/bash

# 情绪管理系统数据库部署脚本
# Emotion Management System Database Deployment Script

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查依赖
check_dependencies() {
    log_info "检查依赖..."
    
    # 检查MySQL客户端
    if ! command -v mysql &> /dev/null; then
        log_error "MySQL客户端未安装，请先安装MySQL客户端"
        exit 1
    fi
    
    # 检查Python
    if ! command -v python3 &> /dev/null; then
        log_error "Python3未安装，请先安装Python3"
        exit 1
    fi
    
    # 检查pip
    if ! command -v pip3 &> /dev/null; then
        log_error "pip3未安装，请先安装pip3"
        exit 1
    fi
    
    log_success "依赖检查完成"
}

# 安装Python依赖
install_python_deps() {
    log_info "安装Python依赖..."
    
    pip3 install mysql-connector-python bcrypt loguru
    
    log_success "Python依赖安装完成"
}

# 检查数据库连接
check_database_connection() {
    log_info "检查数据库连接..."
    
    # 从环境变量或配置文件读取数据库配置
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-3306}
    DB_USER=${DB_USER:-root}
    DB_PASSWORD=${DB_PASSWORD:-password}
    
    # 测试连接
    if mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "SELECT 1;" &> /dev/null; then
        log_success "数据库连接正常"
    else
        log_error "数据库连接失败，请检查配置"
        exit 1
    fi
}

# 创建数据库
create_database() {
    log_info "创建数据库..."
    
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-3306}
    DB_USER=${DB_USER:-root}
    DB_PASSWORD=${DB_PASSWORD:-password}
    DB_NAME=${DB_NAME:-emotion_management}
    
    mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" -e "
        CREATE DATABASE IF NOT EXISTS $DB_NAME 
        CHARACTER SET utf8mb4 
        COLLATE utf8mb4_unicode_ci;
    "
    
    log_success "数据库创建完成"
}

# 执行SQL脚本
execute_sql_script() {
    log_info "执行数据库部署脚本..."
    
    DB_HOST=${DB_HOST:-localhost}
    DB_PORT=${DB_PORT:-3306}
    DB_USER=${DB_USER:-root}
    DB_PASSWORD=${DB_PASSWORD:-password}
    DB_NAME=${DB_NAME:-emotion_management}
    
    if [ -f "deploy.sql" ]; then
        mysql -h"$DB_HOST" -P"$DB_PORT" -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME" < deploy.sql
        log_success "SQL脚本执行完成"
    else
        log_error "deploy.sql文件不存在"
        exit 1
    fi
}

# 运行Python初始化脚本
run_python_init() {
    log_info "运行Python初始化脚本..."
    
    if [ -f "init_database.py" ]; then
        python3 init_database.py
        log_success "Python初始化脚本执行完成"
    else
        log_error "init_database.py文件不存在"
        exit 1
    fi
}

# 运行数据库测试
run_database_test() {
    log_info "运行数据库测试..."
    
    if [ -f "test_database.py" ]; then
        python3 test_database.py
        log_success "数据库测试完成"
    else
        log_warning "test_database.py文件不存在，跳过测试"
    fi
}

# 显示部署信息
show_deployment_info() {
    log_info "部署信息:"
    echo "  数据库主机: ${DB_HOST:-localhost}"
    echo "  数据库端口: ${DB_PORT:-3306}"
    echo "  数据库名称: ${DB_NAME:-emotion_management}"
    echo "  数据库用户: ${DB_USER:-root}"
    echo ""
    echo "默认账号信息:"
    echo "  管理员: admin / 123456"
    echo "  咨询师: counselor1 / 123456"
    echo "  学生: student1 / 123456"
    echo ""
    echo "测试账号信息:"
    echo "  学生: test_student1 / test123"
    echo "  咨询师: test_counselor1 / test123"
}

# 主函数
main() {
    echo "🚀 开始部署情绪管理系统数据库..."
    echo "=================================="
    
    # 检查是否在正确的目录
    if [ ! -f "deploy.sql" ]; then
        log_error "请在database目录下运行此脚本"
        exit 1
    fi
    
    # 执行部署步骤
    check_dependencies
    install_python_deps
    check_database_connection
    create_database
    execute_sql_script
    run_python_init
    run_database_test
    
    echo ""
    echo "=================================="
    log_success "数据库部署完成！"
    show_deployment_info
}

# 处理命令行参数
case "${1:-}" in
    --help|-h)
        echo "情绪管理系统数据库部署脚本"
        echo ""
        echo "用法: $0 [选项]"
        echo ""
        echo "选项:"
        echo "  --help, -h     显示帮助信息"
        echo "  --test-only    仅运行测试"
        echo "  --init-only    仅运行初始化"
        echo ""
        echo "环境变量:"
        echo "  DB_HOST        数据库主机 (默认: localhost)"
        echo "  DB_PORT        数据库端口 (默认: 3306)"
        echo "  DB_USER        数据库用户 (默认: root)"
        echo "  DB_PASSWORD    数据库密码 (默认: password)"
        echo "  DB_NAME        数据库名称 (默认: emotion_management)"
        echo ""
        echo "示例:"
        echo "  $0                                    # 完整部署"
        echo "  DB_PASSWORD=mypass $0                # 使用自定义密码"
        echo "  $0 --test-only                       # 仅测试"
        exit 0
        ;;
    --test-only)
        log_info "仅运行数据库测试..."
        run_database_test
        ;;
    --init-only)
        log_info "仅运行数据库初始化..."
        check_dependencies
        install_python_deps
        check_database_connection
        run_python_init
        ;;
    *)
        main
        ;;
esac
