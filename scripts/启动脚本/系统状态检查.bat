@echo off
chcp 65001 > nul
title 情绪管理系统 - 状态检查

echo.
echo ========================================
echo   🔍 情绪管理系统 - 状态检查
echo ========================================
echo.

REM 检查Docker是否安装
echo 📋 检查Docker环境...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker未安装
    goto end_check
) else (
    for /f "tokens=3" %%i in ('docker --version') do echo ✅ Docker版本: %%i
)

REM 检查Docker是否运行
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker服务未运行
    goto end_check
) else (
    echo ✅ Docker服务正常
)

echo.
echo 📊 容器状态检查...
echo ----------------------------------------

REM 检查容器状态
docker-compose ps 2>nul
if errorlevel 1 (
    echo ❌ 系统未启动或docker-compose.yml文件不存在
    goto end_check
)

echo.
echo 🌐 服务连通性检查...
echo ----------------------------------------

REM 检查前端服务
echo 检查前端服务 (http://localhost:3000)...
curl -s -o nul -w "%%{http_code}" http://localhost:3000 > temp_status.txt 2>nul
set /p frontend_status=<temp_status.txt
del temp_status.txt 2>nul

if "%frontend_status%"=="200" (
    echo ✅ 前端服务正常 (HTTP %frontend_status%)
) else if "%frontend_status%"=="000" (
    echo ❌ 前端服务无法连接
) else (
    echo ⚠️ 前端服务异常 (HTTP %frontend_status%)
)

REM 检查后端服务
echo 检查后端服务 (http://localhost:8000)...
curl -s -o nul -w "%%{http_code}" http://localhost:8000/health > temp_status.txt 2>nul
set /p backend_status=<temp_status.txt
del temp_status.txt 2>nul

if "%backend_status%"=="200" (
    echo ✅ 后端服务正常 (HTTP %backend_status%)
) else if "%backend_status%"=="000" (
    echo ❌ 后端服务无法连接
) else (
    echo ⚠️ 后端服务异常 (HTTP %backend_status%)
)

REM 检查数据库连接
echo 检查数据库连接...
docker-compose exec -T mysql mysql -u emotion_user -pemotionpassword -e "SELECT 1;" emotion_management >nul 2>&1
if errorlevel 1 (
    echo ❌ 数据库连接失败
) else (
    echo ✅ 数据库连接正常
)

echo.
echo 📈 系统资源使用情况...
echo ----------------------------------------

REM 显示容器资源使用
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" 2>nul

echo.
echo 📝 最近日志 (最后10行)...
echo ----------------------------------------
docker-compose logs --tail=10 2>nul

:end_check
echo.
echo ========================================
echo   📋 状态检查完成
echo ========================================
echo.
echo 🛠️ 常用管理命令：
echo    启动系统: docker-compose up -d
echo    停止系统: docker-compose down
echo    查看日志: docker-compose logs -f
echo    重启服务: docker-compose restart
echo.
echo 🌐 访问地址：
echo    前端: http://localhost:3000
echo    后端: http://localhost:8000
echo    文档: http://localhost:8000/docs
echo.
pause
