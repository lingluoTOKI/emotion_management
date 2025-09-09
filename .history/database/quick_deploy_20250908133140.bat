@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
echo ========================================
echo 情绪管理系统快速部署脚本
echo Emotion Management System Quick Deploy
echo ========================================
echo.

REM 目录设置
set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%..\"
set "DB_DIR=%SCRIPT_DIR%"
set "VENV_PY=%PROJECT_DIR%backend\venv\Scripts\python.exe"

echo 正在检测Python环境...
if exist "%VENV_PY%" (
  echo 使用虚拟环境: %VENV_PY%
  set "PYTHON_CMD=%VENV_PY%"
) else (
  echo 错误：未找到虚拟环境！
  echo 请确保虚拟环境已创建：backend\venv\Scripts\python.exe
  echo 或手动激活虚拟环境后运行此脚本
  pause
  exit /b 1
)

echo.
echo 步骤1: 检测MySQL环境...
pushd "%DB_DIR%"
"%PYTHON_CMD%" "%DB_DIR%detect_mysql_env.py"
if %errorlevel% neq 0 (
    echo 错误：MySQL环境检测失败
    echo 请确保MySQL已正确安装并启动
    pause
    exit /b 1
)
popd

echo.
echo 步骤2: 生成配置文件...
pushd "%DB_DIR%"
"%PYTHON_CMD%" "%DB_DIR%generate_config.py"
if %errorlevel% neq 0 (
    echo 错误：配置文件生成失败
    pause
    exit /b 1
)
popd

echo.
echo 步骤3: 创建数据库和用户...
REM 尝试不同的root密码
set "ROOT_PASSWORDS= root password 123456"
set "CONNECTION_SUCCESS=0"

for %%p in (%ROOT_PASSWORDS%) do (
    if !CONNECTION_SUCCESS! equ 0 (
        echo 尝试root密码: %%p
        if "%%p"=="" (
            mysql -u root -e "CREATE DATABASE IF NOT EXISTS emotion_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
        ) else (
            mysql -u root -p%%p -e "CREATE DATABASE IF NOT EXISTS emotion_management CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;" 2>nul
        )
        if !errorlevel! equ 0 (
            echo 数据库创建成功
            set "CONNECTION_SUCCESS=1"
            set "ROOT_PASSWORD=%%p"
        )
    )
)

if !CONNECTION_SUCCESS! equ 0 (
    echo 错误：无法连接到MySQL
    echo 请检查MySQL服务是否启动，或手动设置root密码
    pause
    exit /b 1
)

echo.
echo 步骤4: 创建数据库用户...
if "%ROOT_PASSWORD%"=="" (
    mysql -u root < "%DB_DIR%create_mysql_user.sql"
) else (
    mysql -u root -p%ROOT_PASSWORD% < "%DB_DIR%create_mysql_user.sql"
)
if %errorlevel% neq 0 (
    echo 错误：创建数据库用户失败
    pause
    exit /b 1
)

echo.
echo 步骤5: 初始化数据库结构...
mysql -u emotion_user -pemotion123 emotion_management < "%DB_DIR%init.sql"
if %errorlevel% neq 0 (
    echo 错误：数据库结构初始化失败
    pause
    exit /b 1
)

echo.
echo 步骤6: 插入示例数据...
pushd "%DB_DIR%"
"%PYTHON_CMD%" init_db.py
if %errorlevel% neq 0 (
    echo 错误：示例数据插入失败
    pause
    exit /b 1
)
popd

echo.
echo ========================================
echo 部署完成！
echo ========================================
echo.
echo 测试账号信息：
echo 管理员: admin / 123456
echo 咨询师: counselor1 / 123456
echo 咨询师: counselor2 / 123456
echo 咨询师: counselor3 / 123456
echo 学生: student1 / 123456
echo 学生: student2 / 123456
echo 学生: student3 / 123456
echo 学生: student4 / 123456
echo.
echo 正在验证数据插入...
mysql -u emotion_user -pemotion123 emotion_management -e "SELECT COUNT(*) as user_count FROM users; SELECT username, role FROM users LIMIT 10;"
echo.
echo 数据库连接信息：
echo 主机: localhost
echo 端口: 3306
echo 数据库: emotion_management
echo 用户名: emotion_user
echo 密码: emotion123
echo.
echo 下一步：
echo 1. 启动后端服务: cd backend ^&^& python main.py
echo 2. 启动前端服务: cd frontend ^&^& npm run dev
echo.或直接双击运行在.\scripts\启动脚本\start_services.bat
pause
