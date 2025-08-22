#!/bin/bash

# 情绪管理系统启动脚本
# Emotion Management System Startup Script

echo "🚀 启动情绪管理系统..."
echo "=================================="

# 检查Python环境
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 未安装，请先安装Python3"
    exit 1
fi

# 检查Node.js环境
if ! command -v node &> /dev/null; then
    echo "❌ Node.js 未安装，请先安装Node.js"
    exit 1
fi

# 检查MySQL服务
if ! command -v mysql &> /dev/null; then
    echo "❌ MySQL 未安装，请先安装MySQL"
    exit 1
fi

# 检查Redis服务
if ! command -v redis-cli &> /dev/null; then
    echo "❌ Redis 未安装，请先安装Redis"
    exit 1
fi

echo "✅ 环境检查完成"

# 启动后端服务
echo "🔧 启动后端服务..."
cd backend

# 检查虚拟环境
if [ ! -d "venv" ]; then
    echo "📦 创建Python虚拟环境..."
    python3 -m venv venv
fi

# 激活虚拟环境
source venv/bin/activate

# 安装依赖
echo "📥 安装Python依赖..."
pip install -r requirements.txt

# 启动后端服务
echo "🚀 启动FastAPI后端服务..."
python main.py &
BACKEND_PID=$!

cd ..

# 启动前端服务
echo "🔧 启动前端服务..."
cd frontend

# 安装依赖
echo "📥 安装Node.js依赖..."
npm install

# 启动前端服务
echo "🚀 启动Next.js前端服务..."
npm run dev &
FRONTEND_PID=$!

cd ..

echo "=================================="
echo "🎉 情绪管理系统启动完成！"
echo ""
echo "📊 管理员仪表板: http://localhost:3000/admin/dashboard"
echo "👨‍🎓 学生界面: http://localhost:3000/student/dashboard"
echo "👨‍⚕️ 咨询师界面: http://localhost:3000/counselor/dashboard"
echo "🔌 API文档: http://localhost:8000/docs"
echo ""
echo "按 Ctrl+C 停止所有服务"

# 等待用户中断
trap "echo '🛑 正在停止服务...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

# 保持脚本运行
wait
