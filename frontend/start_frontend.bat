@echo off
chcp 65001 > nul
title 前端服务启动器

echo 🚀 启动情绪管理系统前端服务...
echo.

echo 📦 检查依赖...
if not exist "node_modules" (
    echo 🔧 安装依赖...
    npm install
    echo ✅ 依赖安装完成
) else (
    echo ✅ 依赖已存在
)
echo.

echo 🌐 启动Next.js开发服务器...
echo    访问地址: http://localhost:3000
echo.
echo 按 Ctrl+C 停止服务
echo.

REM 启动开发服务器
npm run dev
