# 情绪管理系统数据库部署指南

## 概述

本目录包含情绪管理系统的数据库初始化脚本和部署工具。系统支持完整的用户管理、心理评估、AI咨询、预约咨询和匿名咨询功能。

## 文件说明

- `init.sql` - 数据库结构初始化脚本
- `init_db.py` - Python数据库初始化脚本（包含示例数据）
- `create_mysql_user.sql` - MySQL用户创建脚本
- `deploy_database.bat` - Windows一键部署脚本
- `README.md` - 本说明文档

## 数据库结构

### 核心表结构

1. **用户管理**
   - `users` - 用户基础信息表
   - `admins` - 管理员信息表
   - `students` - 学生信息表
   - `counselors` - 心理咨询师信息表

2. **心理评估**
   - `assessments` - 心理评估记录表
   - `assessment_records` - 评估详细记录表
   - `emotion_records` - 情绪记录表

3. **咨询管理**
   - `consultations` - 咨询记录表
   - `consultation_records` - 咨询过程记录表
   - `appointments` - 预约表

4. **AI功能**
   - `ai_counseling_sessions` - AI咨询会话表
   - `risk_assessments` - 风险评估表

5. **匿名咨询**
   - `anonymous_messages` - 匿名消息表
   - `anonymous_chats` - 匿名聊天表

## 部署步骤

### 方法一：使用一键部署脚本（推荐）

1. 确保MySQL服务已启动
2. 双击运行 `deploy_database.bat`
3. 按提示输入MySQL root密码
4. 等待部署完成

### 方法二：手动部署

1. **创建数据库用户**
   ```bash
   mysql -u root -p < create_mysql_user.sql
   ```

2. **初始化数据库结构**
   ```bash
   mysql -u emotion_user -pemotion123 < init.sql
   ```

3. **插入示例数据**
   ```bash
   python init_db.py
   ```

## 测试账号

所有测试账号密码均为：`123456`

| 角色 | 用户名 | 邮箱 | 说明 |
|------|--------|------|------|
| 管理员 | admin | admin@example.com | 系统管理员 |
| 咨询师 | counselor1 | counselor1@example.com | 认知行为疗法专家 |
| 咨询师 | counselor2 | counselor2@example.com | 人本主义疗法专家 |
| 咨询师 | counselor3 | counselor3@example.com | 精神分析专家 |
| 学生 | student1 | student1@example.com | 计算机专业大二学生 |
| 学生 | student2 | student2@example.com | 心理学专业大三学生 |
| 学生 | student3 | student3@example.com | 工商管理专业大一学生 |
| 学生 | student4 | student4@example.com | 临床医学专业大四学生 |

## 数据库连接信息

- **主机**: localhost
- **端口**: 3306
- **数据库名**: emotion_management
- **用户名**: emotion_user
- **密码**: emotion123

## 系统功能

### 1. 用户管理
- 支持管理员、咨询师、学生三种角色
- 完整的用户信息管理
- 角色权限控制

### 2. 心理评估
- 支持PHQ-9、GAD-7等标准化量表
- 情绪分析和趋势跟踪
- 风险评估和预警

### 3. AI咨询
- 智能对话系统
- 实时情绪分析
- 自动风险评估
- 干预建议生成

### 4. 预约咨询
- 在线和面对面咨询预约
- 咨询师时间管理
- 咨询记录和反馈

### 5. 匿名咨询
- 保护隐私的匿名咨询
- 紧急情况处理
- 咨询师分配机制

## 注意事项

1. **密码安全**: 当前使用明文密码存储，仅适用于测试环境
2. **数据备份**: 生产环境请定期备份数据库
3. **权限管理**: 确保数据库用户权限设置正确
4. **字符编码**: 使用UTF8MB4字符集支持完整Unicode

## 故障排除

### 常见问题

1. **MySQL连接失败**
   - 检查MySQL服务是否启动
   - 确认用户名密码正确
   - 检查防火墙设置

2. **权限不足**
   - 确保emotion_user有足够权限
   - 检查数据库用户创建是否成功

3. **字符编码问题**
   - 确认数据库使用UTF8MB4字符集
   - 检查表结构创建是否成功

### 重置数据库

如需重置数据库，请按以下步骤操作：

1. 删除数据库
   ```sql
   DROP DATABASE emotion_management;
   ```

2. 重新运行部署脚本

## 技术支持

如有问题，请检查：
1. MySQL服务状态
2. 数据库连接配置
3. Python环境和依赖
4. 系统日志文件

---

**版本**: 1.0.0  
**更新日期**: 2024年1月  
**维护者**: 情绪管理系统开发团队
