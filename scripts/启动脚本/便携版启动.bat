@echo off
chcp 65001 > nul
title 情绪管理系统 - 便携版启动器

REM 设置颜色
for /f %%A in ('"prompt $H &echo on &for %%B in (1) do rem"') do set BS=%%A

echo.
echo ========================================
echo   🧠 情绪管理系统 - 便携版启动器
echo ========================================
echo.
echo 🎯 这个脚本会自动：
echo    ✅ 检查Docker环境
echo    ✅ 自动安装缺失组件
echo    ✅ 启动完整系统
echo    ✅ 打开浏览器访问
echo.

REM 检查管理员权限
net session >nul 2>&1
if errorlevel 1 (
    echo ⚠️  需要管理员权限来安装Docker
    echo 📋 请右键选择"以管理员身份运行"
    echo.
    pause
    exit /b 1
)

echo ✅ 管理员权限检查通过
echo.

REM 检查Docker是否安装
echo 🔍 检查Docker安装状态...
docker --version >nul 2>&1
if errorlevel 1 (
    REM 尝试完整路径
    "C:\Program Files\Docker\Docker\resources\bin\docker.exe" --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ Docker未安装，开始自动安装...
    echo.
    echo 📥 正在下载Docker Desktop...
    
    REM 创建临时目录
    if not exist "temp" mkdir temp
    
    REM 下载Docker Desktop
    powershell -Command "& {Invoke-WebRequest -Uri 'https://desktop.docker.com/win/stable/Docker%%20Desktop%%20Installer.exe' -OutFile 'temp/DockerInstaller.exe'}"
    
    if not exist "temp\DockerInstaller.exe" (
        echo ❌ Docker下载失败！
        echo 📋 请手动下载安装：
        echo    https://desktop.docker.com/win/stable/Docker%%20Desktop%%20Installer.exe
        echo.
        pause
        exit /b 1
    )
    
    echo ✅ Docker下载完成
    echo 🔧 开始安装Docker Desktop...
    
    REM 静默安装Docker
    start /wait temp\DockerInstaller.exe install --quiet
    
    echo ✅ Docker安装完成
    echo ⏳ 请等待Docker Desktop启动...
    timeout /t 30 /nobreak
    
    REM 清理安装文件
    del /q temp\DockerInstaller.exe
    rmdir temp
    ) else (
        echo ✅ Docker已安装，设置环境变量...
        set "PATH=%PATH%;C:\Program Files\Docker\Docker\resources\bin"
    )
) else (
    echo ✅ Docker已安装并可用
)

echo ✅ Docker环境准备完成
echo.

REM 检查Docker是否运行
docker info >nul 2>&1
if errorlevel 1 (
    echo 🔧 正在启动Docker Desktop...
    start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
    
    echo ⏳ 等待Docker启动...
    :wait_docker
    timeout /t 5 /nobreak >nul
    docker info >nul 2>&1
    if errorlevel 1 (
        echo    ⏳ Docker启动中...
        goto wait_docker
    )
)

echo ✅ Docker服务运行正常
echo.

REM 检查项目文件
if not exist "docker-compose.yml" (
    echo ❌ 项目文件不完整！
    echo 📋 请确保以下文件存在：
    echo    - docker-compose.yml
    echo    - backend/Dockerfile
    echo    - frontend/Dockerfile
    echo.
    pause
    exit /b 1
)

echo ✅ 项目文件检查通过
echo.

REM 启动系统
echo 🚀 正在启动情绪管理系统...
echo.

REM 停止可能存在的旧容器
docker-compose down >nul 2>&1

REM 构建并启动服务
docker-compose up -d --build

if errorlevel 1 (
    echo.
    echo ❌ 系统启动失败！
    echo 📋 错误详情：
    docker-compose logs --tail=20
    echo.
    pause
    exit /b 1
)

echo.
echo ⏳ 等待系统完全启动...
timeout /t 15 /nobreak >nul

REM 健康检查
echo 🔍 系统健康检查...
:health_check
curl -s http://localhost:8000/health >nul 2>&1
if errorlevel 1 (
    echo    ⏳ 后端服务启动中...
    timeout /t 5 /nobreak >nul
    goto health_check
)

curl -s http://localhost:3000 >nul 2>&1
if errorlevel 1 (
    echo    ⏳ 前端服务启动中...
    timeout /t 5 /nobreak >nul
    goto health_check
)

echo.
echo ========================================
echo   🎉 系统启动成功！
echo ========================================
echo.
echo 🌐 访问地址：
echo    前端应用: http://localhost:3000
echo    后端API:  http://localhost:8000
echo    API文档:  http://localhost:8000/docs
echo.
echo 👥 测试账号：
echo    学生:     student1    / 123456
echo    咨询师:   counselor1  / 123456
echo    管理员:   admin1      / 123456
echo.
echo 🛠️ 系统管理：
echo    查看状态: docker-compose ps
echo    查看日志: docker-compose logs -f
echo    停止系统: docker-compose down
echo    重启系统: 再次运行此脚本
echo.

REM 自动打开浏览器
echo 🌐 正在打开浏览器...
start http://localhost:3000

echo.
echo 📞 需要帮助？查看"快速启动指南.md"
echo.
echo 🎯 系统已在后台运行，可以关闭此窗口
echo    要停止系统，请运行: docker-compose down
echo.
echo 按任意键关闭此窗口...
pause >nul
