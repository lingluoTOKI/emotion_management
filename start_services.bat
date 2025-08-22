@echo off
echo 启动情绪管理系统服务...
echo.

echo 启动后端服务...
start "Backend Service" cmd /k "cd /d D:\project\emotion_management\backend && venv\Scripts\activate && python main.py"

echo 等待后端服务启动...
timeout /t 5 /nobreak > nul

echo 启动前端服务...
start "Frontend Service" cmd /k "cd /d D:\project\emotion_management\frontend && npm run dev"

echo.
echo 服务启动完成！
echo 前端地址: http://localhost:3000
echo 后端地址: http://localhost:8000
echo.
echo 按任意键打开前端页面...
pause > nul
start http://localhost:3000
