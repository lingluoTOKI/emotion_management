# 前端目录结构说明

## 📁 整体结构

```
frontend/
├── public/                 # 静态资源
├── src/                   # 源代码
│   ├── app/              # Next.js 13+ App Router (页面)
│   ├── components/       # 可复用组件
│   ├── lib/             # 工具库和配置
│   └── types/           # TypeScript类型定义 (可选)
├── package.json
├── tsconfig.json
└── tailwind.config.js
```

## 🎯 详细说明

### `/src/app/` - 页面和路由
基于Next.js 13+ App Router的文件系统路由：

```
app/
├── layout.tsx            # 根布局组件
├── page.tsx             # 首页 (/)
├── globals.css          # 全局样式
├── admin/               # 管理员路由 (/admin/*)
│   ├── dashboard/       # /admin/dashboard
│   ├── analytics/       # /admin/analytics
│   └── crisis-monitoring/ # /admin/crisis-monitoring
├── student/             # 学生路由 (/student/*)
│   ├── dashboard/       # /student/dashboard
│   ├── ai-assessment/   # /student/ai-assessment
│   ├── assessment/      # /student/assessment
│   ├── consultation/    # /student/consultation
│   ├── consultation-matching/ # /student/consultation-matching
│   └── anonymous-consultation/ # /student/anonymous-consultation
├── counselor/           # 咨询师路由 (/counselor/*)
│   ├── dashboard/       # /counselor/dashboard
│   └── consultations/   # /counselor/consultations
└── ai-chat/            # AI聊天 (/ai-chat)
    └── page.tsx
```

### `/src/components/` - 可复用组件
所有可在多个页面使用的React组件：

```
components/
├── index.ts             # 组件导出索引
├── AuthGuard.tsx        # 认证保护组件
├── DashboardLayout.tsx  # 仪表板布局
├── ui/                  # 基础UI组件 (可选)
│   ├── Button.tsx
│   ├── Input.tsx
│   └── Modal.tsx
└── feature/             # 功能性组件 (可选)
    ├── ChatMessage.tsx
    └── StatCard.tsx
```

### `/src/lib/` - 工具库
共享的工具函数、配置和业务逻辑：

```
lib/
├── index.ts             # 工具导出索引
├── auth.ts              # 认证相关工具
├── navigation.ts        # 导航和路由工具
├── api.ts              # API调用工具 (可选)
├── utils.ts            # 通用工具函数 (可选)
└── constants.ts        # 常量定义 (可选)
```

## 🔄 导入方式

### 推荐的导入方式：

```typescript
// ✅ 使用索引文件
import { AuthGuard, DashboardLayout } from '@/components'
import { getUserInfo, getDefaultDashboardPath } from '@/lib'

// ✅ 或者直接导入
import AuthGuard from '@/components/AuthGuard'
import { getUserInfo } from '@/lib/auth'
```

### 避免的导入方式：

```typescript
// ❌ 相对路径导入
import AuthGuard from '../../../components/AuthGuard'
import { getUserInfo } from '../../lib/auth'
```

## 📝 文件命名规范

### 组件文件
- **PascalCase**: `AuthGuard.tsx`, `DashboardLayout.tsx`
- **页面组件**: `page.tsx` (Next.js App Router要求)
- **布局组件**: `layout.tsx` (Next.js App Router要求)

### 工具文件
- **camelCase**: `auth.ts`, `navigation.ts`, `utils.ts`
- **kebab-case**: 某些配置文件 `api-client.ts`

### 目录名
- **kebab-case**: `ai-chat`, `crisis-monitoring`
- **camelCase**: `aiChat`, `crisisMonitoring` (也可接受)

## 🎯 最佳实践

1. **单一职责**: 每个组件和工具文件只负责一个明确的功能
2. **导出索引**: 使用`index.ts`文件统一导出
3. **类型安全**: 所有函数和组件都要有TypeScript类型
4. **文档注释**: 重要的组件和函数要有JSDoc注释
5. **一致的导入**: 使用`@/`别名而不是相对路径

## 🔧 配置文件

### `tsconfig.json` - TypeScript配置
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

这个配置让我们可以使用`@/`作为`src/`的别名。

## 🚀 扩展建议

随着项目发展，可以考虑添加：

```
src/
├── hooks/               # 自定义React Hooks
├── context/            # React Context
├── types/              # TypeScript类型定义
├── styles/             # 样式文件
└── __tests__/          # 测试文件
```

## 总结

当前的目录结构已经遵循了Next.js的最佳实践，具有：
- ✅ 清晰的职责分离
- ✅ 可维护的代码组织
- ✅ 可扩展的架构设计
- ✅ TypeScript支持
- ✅ 现代化的开发体验
