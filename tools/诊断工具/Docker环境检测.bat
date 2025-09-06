@echo off
chcp 65001 > nul
title Docker环境检测工具

echo.
echo ========================================
echo   🔍 Docker环境检测工具
echo ========================================
echo.

echo 📋 系统信息：
echo    操作系统: %OS%
echo    用户名: %USERNAME%
echo    当前目录: %CD%
echo.

echo 🔍 检查Docker Desktop进程...
tasklist /FI "IMAGENAME eq Docker Desktop.exe" 2>nul | find /I "Docker Desktop.exe" >nul
if errorlevel 1 (
    echo ❌ Docker Desktop进程未运行
    echo 💡 请启动Docker Desktop应用程序
) else (
    echo ✅ Docker Desktop进程正在运行
)
echo.

echo 🔍 检查Docker命令（方式1：直接调用）...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ❌ docker命令不可用（直接调用）
) else (
    echo ✅ docker命令可用（直接调用）
    docker --version
)
echo.

echo 🔍 检查Docker命令（方式2：完整路径）...
"C:\Program Files\Docker\Docker\resources\bin\docker.exe" --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker未安装在默认位置
    echo 📂 请检查Docker Desktop安装路径
) else (
    echo ✅ Docker可通过完整路径访问
    "C:\Program Files\Docker\Docker\resources\bin\docker.exe" --version
)
echo.

echo 🔍 检查Docker服务状态...
docker info >nul 2>&1
if errorlevel 1 (
    echo ❌ Docker服务未启动或不可访问
    echo 💡 请等待Docker Desktop完全启动
) else (
    echo ✅ Docker服务运行正常
)
echo.

echo 🔍 检查docker-compose...
docker-compose --version >nul 2>&1
if errorlevel 1 (
    "C:\Program Files\Docker\Docker\resources\bin\docker-compose.exe" --version >nul 2>&1
    if errorlevel 1 (
        echo ❌ docker-compose不可用
    ) else (
        echo ✅ docker-compose可用（完整路径）
        "C:\Program Files\Docker\Docker\resources\bin\docker-compose.exe" --version
    )
) else (
    echo ✅ docker-compose可用（直接调用）
    docker-compose --version
)
echo.

echo 🔍 检查环境变量PATH...
echo %PATH% | find /I "Docker" >nul
if errorlevel 1 (
    echo ⚠️ PATH中未包含Docker路径
    echo 💡 建议添加以下路径到系统PATH：
    echo    C:\Program Files\Docker\Docker\resources\bin
) else (
    echo ✅ PATH中包含Docker相关路径
)
echo.

echo ========================================
echo   📋 诊断总结
echo ========================================
echo.

REM 综合判断
docker --version >nul 2>&1
if errorlevel 1 (
    "C:\Program Files\Docker\Docker\resources\bin\docker.exe" --version >nul 2>&1
    if errorlevel 1 (
        echo 🔴 Docker未正确安装
        echo.
        echo 🛠️ 解决方案：
        echo    1. 下载并安装Docker Desktop
        echo    2. 重启计算机
        echo    3. 启动Docker Desktop应用程序
    ) else (
        echo 🟡 Docker已安装但PATH配置有问题
        echo.
        echo 🛠️ 解决方案：
        echo    1. 重启Docker Desktop
        echo    2. 重新登录Windows
        echo    3. 或手动添加PATH环境变量
    )
) else (
    docker info >nul 2>&1
    if errorlevel 1 (
        echo 🟡 Docker已安装但服务未启动
        echo.
        echo 🛠️ 解决方案：
        echo    1. 启动Docker Desktop应用程序
        echo    2. 等待服务完全启动（1-2分钟）
        echo    3. 重新运行启动脚本
    ) else (
        echo 🟢 Docker环境完全正常
        echo.
        echo ✅ 可以正常使用Docker启动脚本
    )
)

echo.
echo 📞 如需进一步帮助，请查看项目文档
echo.
pause
