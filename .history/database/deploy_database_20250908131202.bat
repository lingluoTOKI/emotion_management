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
set "VENV_PY=%PROJECT_DIR%backend\venv\Scripts\python.exe"

REM 配置默认参数（将被环境检测覆盖）
set "MYSQL_HOST=localhost"
set "MYSQL_PORT=3306"
set "DB_NAME=emotion_management"
set "DB_USER=emotion_user"
set "DB_PASS=emotion123"
set "MYSQL_ROOT_USER=root"
set "MYSQL_ROOT_PASS="

echo 正在检测MySQL环境...
set "PYTHON_CMD=python"
if exist "%VENV_PY%" (
  echo 检测到虚拟环境，将使用: %VENV_PY%
  set "PYTHON_CMD=%VENV_PY%"
)

REM 运行环境检测脚本
pushd "%DB_DIR%"
"%PYTHON_CMD%" "%DB_DIR%detect_mysql_env.py"
set "DETECT_EXIT_CODE=%ERRORLEVEL%"
popd

if not "%DETECT_EXIT_CODE%"=="0" (
    echo 错误：MySQL环境检测失败
    echo 请检查MySQL是否正确安装和配置
    pause
    exit /b 1
)

REM 读取检测结果并生成配置
if exist "%DB_DIR%mysql_config.json" (
    echo 正在读取MySQL配置...
    echo 正在生成配置文件...
    pushd "%DB_DIR%"
    "%PYTHON_CMD%" "%DB_DIR%generate_config.py"
    set "CONFIG_EXIT_CODE=%ERRORLEVEL%"
    popd
    if not "%CONFIG_EXIT_CODE%"=="0" (
        echo 警告：配置文件生成失败，使用默认配置
    ) else (
        echo 配置文件生成成功
    )
) else (
    echo 警告：未找到MySQL配置，使用默认配置
    echo 正在生成默认配置文件...
    pushd "%DB_DIR%"
    "%PYTHON_CMD%" "%DB_DIR%generate_config.py"
    popd
)

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
echo 正在测试MySQL连接...
REM 首先尝试root用户连接
if "%MYSQL_ROOT_PASS%"=="" (
    mysql -h %MYSQL_HOST% -P %MYSQL_PORT% -u %MYSQL_ROOT_USER% -e "select 1" >nul 2>&1
) else (
    mysql -h %MYSQL_HOST% -P %MYSQL_PORT% -u %MYSQL_ROOT_USER% -p%MYSQL_ROOT_PASS% -e "select 1" >nul 2>&1
)
if %errorlevel% neq 0 (
  echo 错误：无法连接到 MySQL（%MYSQL_HOST%:%MYSQL_PORT%）。
  echo 请确认 MySQL 已启动，或检查root用户密码。
  echo.
  echo 常见解决方案：
  echo 1. 启动MySQL服务
  echo 2. 检查root密码是否正确
  echo 3. 确认端口3306未被占用
  echo 4. 检查防火墙设置
  pause
  exit /b 1
)
echo MySQL root连接正常
echo.

echo 正在创建数据库和用户（如已存在将跳过）...
REM 使用检测到的root用户配置
if "%MYSQL_ROOT_PASS%"=="" (
    mysql -h %MYSQL_HOST% -P %MYSQL_PORT% -u %MYSQL_ROOT_USER% < create_mysql_user.sql
) else (
    mysql -h %MYSQL_HOST% -P %MYSQL_PORT% -u %MYSQL_ROOT_USER% -p%MYSQL_ROOT_PASS% < create_mysql_user.sql
)
if %errorlevel% neq 0 (
    echo 错误：创建数据库用户失败
    echo 请检查MySQL root密码是否正确
    echo 或手动执行以下命令：
    if "%MYSQL_ROOT_PASS%"=="" (
        echo mysql -h %MYSQL_HOST% -P %MYSQL_PORT% -u %MYSQL_ROOT_USER% ^< create_mysql_user.sql
    ) else (
        echo mysql -h %MYSQL_HOST% -P %MYSQL_PORT% -u %MYSQL_ROOT_USER% -p%MYSQL_ROOT_PASS% ^< create_mysql_user.sql
    )
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
