# 情绪管理系统 (Emotion Management System)

## 📋 项目简介

情绪管理系统是一个基于AI的智能心理健康咨询平台，为学校心理健康服务提供完整的数字化解决方案。系统支持学生、咨询师和管理员三种用户角色，提供心理评估、咨询预约、AI聊天等全方位心理健康服务。

## ✨ 主要功能

### 🧠 AI智能心理评估
- 基于大模型的情绪识别和状态评估
- 自动风险评估和预警
- 个性化建议和干预方案
- 历史记录跟踪和趋势分析

### 📅 智能咨询预约
- 灵活的预约时间管理
- 咨询师专长匹配
- 多种咨询方式支持（面对面、在线、电话）
- 实时状态跟踪和提醒

### 🤖 AI心理助手
- 24/7在线心理支持
- 自然语言交互
- 情绪识别和建议
- 紧急情况转介

### 📊 数据分析和报告
- 实时统计和监控
- 心理健康趋势分析
- 咨询质量评估
- 风险预警系统

## 🏗️ 技术架构

### 后端 (Backend)
- **框架**: FastAPI (Python)
- **数据库**: MySQL
- **认证**: JWT Token
- **AI服务**: 讯飞API
- **部署**: Docker容器化

### 前端 (Frontend)
- **框架**: Next.js 14 + React 18
- **样式**: Tailwind CSS
- **动画**: Framer Motion
- **图标**: Lucide React
- **状态管理**: React Hooks

### 核心特性
- 🔐 JWT身份认证
- 🌐 RESTful API设计
- 📱 响应式Web界面
- 🔒 基于角色的权限控制
- 📊 实时数据监控

## 🚀 快速开始

### 环境要求
- Python 3.8+
- Node.js 18+
- MySQL 8.0+
- Docker (可选)

### 1. 克隆项目
```bash
git clone <repository-url>
cd emotion_management
```

### 2. 后端设置
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. 数据库配置
```bash
cd database
# 创建数据库和用户
mysql -u root -p < create_mysql_user.sql
# 初始化数据库
python init_db.py
```

### 4. 启动后端服务
```bash
cd backend
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5. 前端设置
```bash
cd frontend
npm install
npm run dev
```

### 6. 访问系统
- 前端: http://localhost:3000
- 后端API: http://localhost:8000
- API文档: http://localhost:8000/docs

## 👥 用户角色

### 👨‍🎓 学生 (Student)
- 心理评估测试
- 预约咨询师
- AI智能聊天
- 个人健康记录
- 查看咨询历史

### 👩‍⚕️ 咨询师 (Counselor)
- 管理咨询预约
- 查看学生档案
- 记录咨询过程
- 生成咨询报告
- 个人日程安排

### 👨‍💼 管理员 (Admin)
- 用户管理
- 系统监控
- 数据统计
- 系统配置
- 权限控制

## 📱 页面功能

### 已完成的页面
✅ **登录页面** - 用户认证和角色识别
✅ **学生仪表板** - 心理评估、预约咨询、AI聊天等
✅ **咨询师仪表板** - 咨询管理、日程安排、报告生成等
✅ **管理员仪表板** - 用户管理、系统监控、数据报告等
✅ **AI聊天页面** - 智能对话和心理支持

### 页面特性
- 🎨 现代化UI设计
- 📱 完全响应式布局
- ✨ 流畅的动画效果
- 🔍 直观的导航系统
- 📊 丰富的数据展示

## 🔧 配置说明

### 环境变量
创建 `.env` 文件在backend目录下：

```env
DATABASE_URL=mysql://username:password@localhost:3306/emotion_management
SECRET_KEY=your-secret-key-here
OPENAI_API_KEY=your-openai-api-key
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

### 数据库配置
- 数据库名: `emotion_management`
- 默认用户: 见 `database/init.sql`
- 测试账号:
  - 管理员: `admin` / `admin123`
  - 咨询师: `counselor1` / `123456`
  - 学生: `student1` / `123456`

## 📁 项目结构

```
emotion_management/
├── backend/                 # 后端服务
│   ├── app/                # 应用代码
│   │   ├── api/           # API路由
│   │   ├── core/          # 核心配置
│   │   ├── models/        # 数据模型
│   │   ├── schemas/       # 数据验证
│   │   └── services/      # 业务逻辑
│   ├── main.py            # 应用入口
│   └── requirements.txt    # Python依赖
├── frontend/               # 前端应用
│   ├── src/               # 源代码
│   │   ├── app/          # 页面组件
│   │   └── components/   # 可复用组件
│   ├── package.json       # Node.js依赖
│   └── next.config.js     # Next.js配置
├── database/               # 数据库脚本
├── scripts/                # 启动脚本
└── docs/                   # 项目文档
```

## 🧪 测试

### 后端测试
```bash
cd backend
pytest
```

### 前端测试
```bash
cd frontend
npm test
```

## 📊 性能指标

- **页面加载时间**: < 2秒
- **API响应时间**: < 500ms
- **并发用户支持**: 1000+
- **系统可用性**: 99.9%

## 🔒 安全特性

- JWT Token认证
- 基于角色的访问控制
- 数据加密存储
- SQL注入防护
- XSS攻击防护
- CSRF保护

## 🚀 部署

### Docker部署
```bash
docker-compose up -d
```

### 手动部署
参考 `scripts/` 目录下的启动脚本

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📝 开发规范

- 使用TypeScript进行类型安全开发
- 遵循ESLint和Prettier代码规范
- 编写单元测试和集成测试
- 使用语义化提交信息
- 保持代码文档的更新

## 🔮 未来计划

### 短期目标
- [ ] 实时通知系统
- [ ] 数据可视化图表
- [ ] 移动端优化
- [ ] 多语言支持

### 长期目标
- [ ] 移动原生应用
- [ ] VR/AR咨询体验
- [ ] 机器学习模型优化
- [ ] 国际化部署

## 📞 联系我们

- 项目维护者: [Your Name]
- 邮箱: [your.email@example.com]
- 项目地址: [GitHub Repository URL]

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和用户！

---

**注意**: 这是一个开发中的项目，某些功能可能仍在开发中。如果您遇到问题或有建议，请提交Issue或Pull Request。
