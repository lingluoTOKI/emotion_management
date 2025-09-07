@echo off
setlocal enabledelayedexpansion
chcp 65001 >nul
echo ========================================
echo 情绪管理系统数据库部署脚本
echo Emotion Management System Database Deployment
echo ========================================
echo.

REM 目录及环境检测
set "SCRIPT_DIR=%~dp0"
set "PROJECT_DIR=%SCRIPT_DIR%..\"
set "DB_DIR=%SCRIPT_DIR%"
set "VENV_PY=%PROJECT_DIR%venv\Scripts\python.exe"

REM 配置默认参数
set "MYSQL_HOST=localhost"
set "MYSQL_PORT=3306"
set "DB_NAME=emotion_management"
set "DB_USER=emotion_user"
set "DB_PASS=emotion123"

echo 正在检查 MySQL 客户端...
where mysql >nul 2>&1
if %errorlevel% neq 0 (
  echo 错误：未找到 mysql 客户端，请将 MySQL 安装目录下的 bin 加入 PATH。
  pause
  exit /b 1
)

echo 正在检查 MySQL 服务状态...
set "SERVICE_FOUND="
for %%S in (MySQL80 MySQL mysql MariaDB) do (
  sc query %%S >nul 2>&1 && (
    set "SERVICE_FOUND=%%S"
  )
)

if defined SERVICE_FOUND (
  sc query %SERVICE_FOUND% | find /i "RUNNING" >nul 2>&1
  if %errorlevel% neq 0 (
    echo 警告：检测到服务 %SERVICE_FOUND% 未运行，尝试直接检测连接...
    goto :TEST_CONN
  ) else (
    echo 检测到服务 %SERVICE_FOUND% 正在运行
  )
) else (
  echo 警告：未识别到常见的 MySQL 服务名（MySQL80/MySQL/mysql/MariaDB）
  echo 将直接尝试连接检测...
)

:TEST_CONN
mysql -h %MYSQL_HOST% -P %MYSQL_PORT% -u %DB_USER% -p%DB_PASS% -e "select 1" >nul 2>&1
if %errorlevel% neq 0 (
  echo 错误：无法连接到 MySQL（%MYSQL_HOST%:%MYSQL_PORT%）。
  echo 请确认 MySQL 已启动，或修改脚本顶部的连接参数。
  pause
  exit /b 1
)
echo MySQL 连接正常
echo.

echo 正在创建数据库和用户（如已存在将跳过）...
mysql -h %MYSQL_HOST% -P %MYSQL_PORT% -u root -p < create_mysql_user.sql
if %errorlevel% neq 0 (
    echo 错误：创建数据库用户失败
    echo 请检查MySQL root密码是否正确
    pause
    exit /b 1
)

echo 数据库用户创建成功
echo.

echo 正在初始化数据库结构...
mysql -h %MYSQL_HOST% -P %MYSQL_PORT% -u %DB_USER% -p%DB_PASS% < init.sql
if %errorlevel% neq 0 (
    echo 错误：数据库初始化失败
    echo 请检查数据库连接和权限
    pause
    exit /b 1
)

echo 数据库结构初始化成功
echo.

echo 正在插入示例数据...
set "PYTHON_CMD=python"
if exist "%VENV_PY%" (
  echo 检测到虚拟环境，将使用: %VENV_PY%
  set "PYTHON_CMD=%VENV_PY%"
)

pushd "%DB_DIR%"
"%PYTHON_CMD%" "%DB_DIR%init_db.py"
set "PY_EXIT_CODE=%ERRORLEVEL%"
popd
if not "%PY_EXIT_CODE%"=="0" (
    echo 错误：示例数据插入失败（Python 退出码 %PY_EXIT_CODE%）
    echo 请检查 Python 依赖是否安装完整，或手动运行：
    echo   %PYTHON_CMD% %DB_DIR%init_db.py
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
echo 管理员: admin / 123456
echo 咨询师: counselor1 / 123456
echo 咨询师: counselor2 / 123456
echo 咨询师: counselor3 / 123456
echo 学生: student1 / 123456
echo 学生: student2 / 123456
echo 学生: student3 / 123456
echo 学生: student4 / 123456
echo.
echo 数据库连接信息：
echo 主机: %MYSQL_HOST%
echo 端口: %MYSQL_PORT%
echo 数据库: %DB_NAME%
echo 用户名: %DB_USER%
echo 密码: %DB_PASS%
echo.
pause
