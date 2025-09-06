#!/bin/bash

# 设置颜色
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 清屏
clear

echo -e "${BLUE}========================================"
echo -e "  🧠 情绪管理系统 - Docker一键启动"
echo -e "========================================${NC}"
echo

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo -e "${RED}❌ Docker未安装！${NC}"
    echo
    echo -e "${YELLOW}📥 请先安装Docker：${NC}"
    echo "   Ubuntu/Debian: sudo apt-get install docker.io docker-compose"
    echo "   CentOS/RHEL:   sudo yum install docker docker-compose"
    echo "   macOS:         brew install docker docker-compose"
    echo
    exit 1
fi

# 检查Docker是否运行
if ! docker info &> /dev/null; then
    echo -e "${RED}❌ Docker服务未启动！${NC}"
    echo -e "${YELLOW}🔧 启动Docker服务：${NC}"
    echo "   sudo systemctl start docker"
    echo "   或者启动Docker Desktop"
    echo
    exit 1
fi

echo -e "${GREEN}✅ Docker环境检查通过${NC}"
echo

# 检查docker-compose.yml文件
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}❌ docker-compose.yml文件未找到！${NC}"
    echo "   请确保在项目根目录下运行此脚本"
    echo
    exit 1
fi

echo -e "${CYAN}📋 开始启动系统服务...${NC}"
echo

# 停止可能存在的旧容器
echo -e "${YELLOW}🛑 清理旧容器...${NC}"
docker-compose down &> /dev/null

# 启动所有服务
echo -e "${CYAN}🚀 启动系统服务...${NC}"
if ! docker-compose up -d; then
    echo
    echo -e "${RED}❌ 服务启动失败！${NC}"
    echo -e "${YELLOW}📋 查看详细日志：${NC}"
    docker-compose logs
    echo
    exit 1
fi

echo
echo -e "${YELLOW}⏳ 等待服务完全启动...${NC}"
sleep 10

# 检查服务状态
echo
echo -e "${CYAN}📊 检查服务状态...${NC}"
docker-compose ps

# 等待服务健康检查
echo
echo -e "${YELLOW}🔍 等待服务健康检查...${NC}"
while ! curl -s http://localhost:8000/health > /dev/null 2>&1; do
    echo "   ⏳ 后端服务启动中..."
    sleep 5
done

echo
echo -e "${GREEN}========================================"
echo -e "  🎉 系统启动成功！"
echo -e "========================================${NC}"
echo
echo -e "${PURPLE}📱 访问地址：${NC}"
echo -e "   前端应用: ${CYAN}http://localhost:3000${NC}"
echo -e "   后端API:  ${CYAN}http://localhost:8000${NC}"
echo -e "   API文档:  ${CYAN}http://localhost:8000/docs${NC}"
echo
echo -e "${PURPLE}👥 测试账号：${NC}"
echo -e "   学生:     ${GREEN}student1${NC}    / ${GREEN}123456${NC}"
echo -e "   咨询师:   ${GREEN}counselor1${NC}  / ${GREEN}123456${NC}"
echo -e "   管理员:   ${GREEN}admin1${NC}      / ${GREEN}123456${NC}"
echo
echo -e "${PURPLE}🛠️ 管理命令：${NC}"
echo -e "   查看状态: ${YELLOW}docker-compose ps${NC}"
echo -e "   查看日志: ${YELLOW}docker-compose logs -f${NC}"
echo -e "   停止系统: ${YELLOW}docker-compose down${NC}"
echo

# 询问是否打开浏览器
read -p "是否自动打开浏览器? (Y/n): " open_browser
if [[ $open_browser =~ ^[Yy]$ ]] || [[ -z $open_browser ]]; then
    echo -e "${CYAN}🌐 正在打开浏览器...${NC}"
    
    # 根据系统打开浏览器
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        open http://localhost:3000
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        # Linux
        xdg-open http://localhost:3000 2>/dev/null || {
            echo -e "${YELLOW}请手动访问: http://localhost:3000${NC}"
        }
    fi
fi

echo
echo -e "${CYAN}📞 如需帮助，请查看 "快速启动指南.md"${NC}"
echo
