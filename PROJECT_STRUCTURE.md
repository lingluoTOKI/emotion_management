# 情绪管理系统项目结构

## 项目概述
这是一个基于大模型的智能心理健康咨询系统，包含三个主要版块：
- 版块1：管理员模块（可视化大屏）
- 版块2：学生评估模块（AI心理评估）
- 版块3：咨询服务模块（AI辅导、预约、匿名咨询）

## 目录结构

```
emotion_management/
├── README.md                           # 项目主要说明文档
├── PROJECT_STRUCTURE.md                # 项目结构说明文档
├── backend/                            # Python后端
│   ├── requirements.txt                # Python依赖包
│   ├── main.py                        # FastAPI主应用入口
│   ├── app/                           # 应用主目录
│   │   ├── core/                      # 核心配置
│   │   │   ├── config.py              # 应用配置
│   │   │   └── database.py            # 数据库配置
│   │   ├── models/                    # 数据模型
│   │   │   ├── __init__.py            # 模型包初始化
│   │   │   ├── user.py                # 用户相关模型
│   │   │   ├── consultation.py        # 咨询相关模型
│   │   │   ├── assessment.py          # 评估相关模型
│   │   │   ├── ai_counseling.py       # AI辅导相关模型
│   │   │   └── anonymous.py           # 匿名咨询相关模型
│   │   ├── api/                       # API路由
│   │   │   ├── auth.py                # 认证相关API
│   │   │   ├── admin.py               # 管理员API
│   │   │   ├── student.py             # 学生API
│   │   │   ├── consultation.py        # 咨询相关API
│   │   │   └── ai_counseling.py       # AI辅导API
│   │   ├── services/                  # 业务逻辑服务
│   │   ├── schemas/                   # 数据验证模式
│   │   └── utils/                     # 工具函数
│   └── static/                        # 静态文件
├── frontend/                           # React前端
│   ├── package.json                    # Node.js依赖配置
│   ├── next.config.js                  # Next.js配置
│   ├── tailwind.config.js              # Tailwind CSS配置
│   └── src/                            # 源代码
│       └── app/                        # Next.js 13+ App Router
│           ├── page.tsx                # 主页面（登录）
│           ├── admin/                  # 管理员页面
│           │   └── dashboard/          # 管理员仪表板
│           │       └── page.tsx        # 可视化大屏
│           ├── student/                # 学生页面
│           └── counselor/              # 咨询师页面
├── database/                           # 数据库相关
│   └── init.sql                        # 数据库初始化脚本
├── ai_models/                          # AI模型相关代码
├── docs/                               # 项目文档
└── scripts/                            # 部署和工具脚本
    ├── start.sh                        # Linux/Mac启动脚本
    └── start.bat                       # Windows启动脚本
```

## 核心功能模块

### 1. 管理员模块 (版块1)
- **文件位置**: `backend/app/api/admin.py`, `frontend/src/app/admin/dashboard/`
- **主要功能**:
  - 全校咨询状况可视化大屏
  - 词云图：学生问题关键词统计
  - 南丁格尔玫瑰图：咨询师流派咨询次数
  - 饼状图：评估报告准确性统计
  - 条形图：咨询师问题解决率

### 2. 学生评估模块 (版块2)
- **文件位置**: `backend/app/api/student.py`, `backend/app/models/assessment.py`
- **主要功能**:
  - 基于大模型的温和引导式对话
  - 支持文字和语音输入
  - 情绪变化趋势识别
  - 专业心理健康量表自动评估
  - 可视化评估报告生成
  - 情绪状况跟踪与抑郁指数变化图

### 3. 咨询服务模块 (版块3)
- **文件位置**: `backend/app/api/ai_counseling.py`, `backend/app/api/consultation.py`
- **主要功能**:
  - AI心理辅导（初级咨询师模拟）
  - 智能咨询师匹配预约系统
  - 匿名后台留言咨询

## 技术架构

### 后端技术栈
- **框架**: FastAPI (Python)
- **数据库**: MySQL + Redis
- **ORM**: SQLAlchemy
- **AI模型**: OpenAI GPT + 本地情绪分析模型
- **认证**: JWT + OAuth2
- **语音处理**: SpeechRecognition + PyAudio

### 前端技术栈
- **框架**: Next.js 13+ (React)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **图表**: ECharts + D3.js
- **状态管理**: Zustand
- **动画**: Framer Motion

## 数据模型设计

### 核心实体
1. **User**: 用户基础信息（管理员、学生、咨询师）
2. **Student**: 学生详细信息
3. **Counselor**: 咨询师详细信息
4. **Assessment**: 心理评估记录
5. **Consultation**: 咨询记录
6. **AICounselingSession**: AI辅导会话
7. **RiskAssessment**: 风险评估记录

### 关键关系
- 学生与评估：一对多
- 学生与咨询：一对多
- 咨询师与咨询：一对多
- 评估与情绪记录：一对多

## API接口设计

### 认证接口
- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/me` - 获取当前用户信息

### 管理员接口
- `GET /api/admin/dashboard` - 获取仪表板数据
- `GET /api/admin/counselors/stats` - 咨询师统计
- `GET /api/admin/consultations/stats` - 咨询统计

### 学生接口
- `POST /api/student/assessment/start` - 开始评估
- `POST /api/student/assessment/complete` - 完成评估
- `GET /api/student/emotion/trend` - 情绪趋势

### 咨询接口
- `POST /api/consultation/appointment/create` - 创建预约
- `POST /api/consultation/counselors/match` - 匹配咨询师

### AI辅导接口
- `POST /api/ai/session/start` - 开始AI辅导
- `POST /api/ai/session/chat` - AI对话
- `WebSocket /api/ai/ws/{session_id}` - 实时对话

## 部署说明

### 环境要求
- Python 3.8+
- Node.js 16+
- MySQL 8.0+
- Redis 6.0+

### 快速启动
1. **克隆项目**
   ```bash
   git clone <repository-url>
   cd emotion_management
   ```

2. **启动服务**
   - **Linux/Mac**: `./scripts/start.sh`
   - **Windows**: `scripts/start.bat`

3. **访问系统**
   - 前端: http://localhost:3000
   - 后端API: http://localhost:8000
   - API文档: http://localhost:8000/docs

### 手动启动
1. **后端启动**
   ```bash
   cd backend
   pip install -r requirements.txt
   python main.py
   ```

2. **前端启动**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

## 开发说明

### 代码规范
- 使用类型提示 (Python + TypeScript)
- 遵循PEP 8 (Python) 和 ESLint (TypeScript)
- 编写详细的文档字符串和注释

### 测试
- 后端: pytest + pytest-asyncio
- 前端: Jest + React Testing Library

### 数据库迁移
- 使用Alembic进行数据库版本管理
- 支持向前和向后兼容

## 安全特性

### 认证与授权
- JWT令牌认证
- 基于角色的访问控制 (RBAC)
- 密码加密存储 (bcrypt)

### 数据保护
- 匿名咨询保护机制
- 敏感信息加密
- 风险评估预警系统

## 扩展性设计

### 模块化架构
- 服务层抽象
- 插件化AI模型
- 可配置的评估量表

### 性能优化
- Redis缓存
- 数据库连接池
- 异步处理

### 监控与日志
- 结构化日志记录
- 性能指标监控
- 错误追踪和报警

## 后续开发计划

### 短期目标
1. 完善AI情绪识别模型
2. 优化咨询师匹配算法
3. 增加更多评估量表

### 长期目标
1. 移动端应用开发
2. 多语言支持
3. 云端部署和扩展
4. 与其他心理健康系统集成

---

*本文档描述了情绪管理系统的完整项目结构和实现方案。如有疑问，请参考代码注释或联系开发团队。*
