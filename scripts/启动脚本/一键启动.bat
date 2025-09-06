@echo off
chcp 65001 > nul
title 情绪管理系统 - 一键启动

echo.
echo ========================================
echo   🧠 情绪管理系统 - Docker一键启动
echo ========================================
echo.

REM 检查Docker是否安装和启动
echo 🔍 检查Docker环境...

REM 尝试多种方式检查Docker
docker --version >nul 2>&1
if errorlevel 1 (
    REM 尝试完整路径
    "C:\Program Files\Docker\Docker\resources\bin\docker.exe" --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Docker未安装或未启动！
        echo.
        echo 🔧 可能的解决方案：
        echo    1. 启动Docker Desktop应用程序
        echo    2. 等待Docker完全启动（可能需要1-2分钟）
        echo    3. 重新安装Docker Desktop：
        echo       https://desktop.docker.com/win/stable/Docker%20Desktop%20Installer.exe
        echo.
        echo 📋 当前Docker进程状态：
        tasklist /FI "IMAGENAME eq Docker Desktop.exe" 2>nul
        echo.
        pause
        exit /b 1
    ) else (
        REM 添加Docker到当前会话的PATH
        set "PATH=%PATH%;C:\Program Files\Docker\Docker\resources\bin"
    )
)

echo ✅ Docker环境检查通过
echo.

REM 检查docker-compose.yml文件
if not exist "docker-compose.yml" (
    echo ❌ docker-compose.yml文件未找到！
    echo    请确保在项目根目录下运行此脚本
    echo.
    pause
    exit /b 1
)

echo 📋 开始启动系统服务...
echo.

REM 停止可能存在的旧容器
echo 🛑 清理旧容器...
docker-compose down >nul 2>&1

REM 启动所有服务
echo 🚀 启动系统服务...
docker-compose up -d

if errorlevel 1 (
    echo.
    echo ❌ 服务启动失败！
    echo 📋 查看详细日志：
    docker-compose logs
    echo.
    pause
    exit /b 1
)

echo.
echo ⏳ 等待服务完全启动...
timeout /t 10 /nobreak >nul

REM 检查服务状态
echo.
echo 📊 检查服务状态...
docker-compose ps

REM 等待服务健康检查
echo.
echo 🔍 等待服务健康检查...
:wait_loop
timeout /t 5 /nobreak >nul
curl -s http://localhost:8000/health >nul 2>&1
if errorlevel 1 (
    echo    ⏳ 后端服务启动中...
    goto wait_loop
)

echo.
echo ========================================
echo   🎉 系统启动成功！
echo ========================================
echo.
echo 📱 访问地址：
echo    前端应用: http://localhost:3001
echo    后端API:  http://localhost:8000
echo    API文档:  http://localhost:8000/docs
echo.
echo 👥 测试账号：
echo    学生:     student1    / 123456
echo    咨询师:   counselor1  / 123456
echo    管理员:   admin1      / 123456
echo.
echo 🛠️ 管理命令：
echo    查看状态: docker-compose ps
echo    查看日志: docker-compose logs -f
echo    停止系统: docker-compose down
echo.

REM 询问是否打开浏览器
set /p open_browser="是否自动打开浏览器? (Y/N): "
if /i "%open_browser%"=="Y" (
    echo 🌐 正在打开浏览器...
    start http://localhost:3001
)

echo.
echo 📞 如需帮助，请查看 "快速启动指南.md"
echo.
echo 按任意键继续...
pause >nul
