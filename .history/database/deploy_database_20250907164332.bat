@echo off
chcp 65001 >nul
echo ========================================
echo 情绪管理系统数据库部署脚本
echo Emotion Management System Database Deployment
echo ========================================
echo.

echo 正在检查MySQL服务状态...
sc query mysql >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误：MySQL服务未运行或未安装
    echo 请先启动MySQL服务或安装MySQL
    pause
    exit /b 1
)

echo MySQL服务运行正常
echo.

echo 正在创建数据库用户...
mysql -u root -p < create_mysql_user.sql
if %errorlevel% neq 0 (
    echo 错误：创建数据库用户失败
    echo 请检查MySQL root密码是否正确
    pause
    exit /b 1
)

echo 数据库用户创建成功
echo.

echo 正在初始化数据库结构...
mysql -u emotion_user -pemotion123 < init.sql
if %errorlevel% neq 0 (
    echo 错误：数据库初始化失败
    echo 请检查数据库连接和权限
    pause
    exit /b 1
)

echo 数据库结构初始化成功
echo.

echo 正在插入示例数据...
python init_db.py
if %errorlevel% neq 0 (
    echo 错误：示例数据插入失败
    echo 请检查Python环境和依赖
    pause
    exit /b 1
)

echo.
echo ========================================
echo 数据库部署完成！
echo Database deployment completed!
echo ========================================
echo.
echo 测试账号信息：
echo 管理员: admin / admin123
echo 咨询师: counselor1 / 123456
echo 咨询师: counselor2 / 123456
echo 咨询师: counselor3 / 123456
echo 学生: student1 / 123456
echo 学生: student2 / 123456
echo 学生: student3 / 123456
echo 学生: student4 / 123456
echo.
echo 数据库连接信息：
echo 主机: localhost
echo 端口: 3306
echo 数据库: emotion_management
echo 用户名: emotion_user
echo 密码: emotion123
echo.
pause
