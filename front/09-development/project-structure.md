# 项目目录结构

## 标准结构

```
myagent-frontend/
├── public/                     # 静态资源
│   ├── locales/               # 语言文件（可选，如果静态加载）
│   ├── favicon.ico
│   └── logo.png
│
├── src/                        # 源代码
│   ├── assets/                 # 资源文件
│   │   ├── images/            # 图片
│   │   ├── icons/             # 图标
│   │   └── styles/            # 全局样式
│   │       ├── global.css     # 全局 CSS
│   │       ├── variables.css  # CSS 变量
│   │       └── reset.css      # 重置样式
│   │
│   ├── components/             # 通用组件
│   │   ├── layout/            # 布局组件
│   │   │   ├── AppLayout.tsx
│   │   │   ├── AppHeader.tsx
│   │   │   ├── AppSidebar.tsx
│   │   │   └── AppFooter.tsx
│   │   │
│   │   ├── table/             # 表格组件
│   │   │   ├── DataTable.tsx
│   │   │   ├── ActionButtons.tsx
│   │   │   └── StatusColumn.tsx
│   │   │
│   │   ├── form/              # 表单组件
│   │   │   ├── FormBuilder.tsx
│   │   │   ├── FilterForm.tsx
│   │   │   └── UploadZone.tsx
│   │   │
│   │   ├── status/            # 状态显示
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── ConnectionStatus.tsx
│   │   │
│   │   ├── chart/             # 图表组件
│   │   │   ├── LineChart.tsx
│   │   │   ├── BarChart.tsx
│   │   │   └── PieChart.tsx
│   │   │
│   │   └── common/            # 通用组件
│   │       ├── EmptyState.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── Loading.tsx
│   │       └── ConfirmModal.tsx
│   │
│   ├── pages/                  # 页面组件
│   │   ├── auth/              # 认证页面
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   └── ForgotPasswordPage.tsx
│   │   │
│   │   ├── dashboard/         # 仪表盘
│   │   │   └── DashboardPage.tsx
│   │   │
│   │   ├── benchmarks/        # 评测任务
│   │   │   ├── BenchmarkListPage.tsx
│   │   │   ├── BenchmarkDetailPage.tsx
│   │   │   ├── BenchmarkCreatePage.tsx
│   │   │   ├── BenchmarkEditPage.tsx
│   │   │   └── components/
│   │   │       ├── BenchmarkTable.tsx
│   │   │       ├── BenchmarkFilter.tsx
│   │   │       └── BenchmarkCard.tsx
│   │   │
│   │   ├── executions/        # 执行记录
│   │   │   ├── ExecutionListPage.tsx
│   │   │   ├── ExecutionDetailPage.tsx
│   │   │   └── components/
│   │   │       ├── ExecutionTable.tsx
│   │   │       ├── ExecutionLog.tsx
│   │   │       └── ExecutionProgress.tsx
│   │   │
│   │   ├── agents/            # Agent 管理
│   │   │   ├── AgentListPage.tsx
│   │   │   ├── AgentDetailPage.tsx
│   │   │   ├── AgentCreatePage.tsx
│   │   │   └── components/
│   │   │       ├── AgentCard.tsx
│   │   │       └── AgentConfig.tsx
│   │   │
│   │   ├── batch/             # 批量执行
│   │   │   ├── BatchListPage.tsx
│   │   │   ├── BatchCreatePage.tsx
│   │   │   ├── BatchDetailPage.tsx
│   │   │   └── components/
│   │   │       └── BatchProgress.tsx
│   │   │
│   │   ├── metrics/           # 指标分析
│   │   │   └── MetricsPage.tsx
│   │   │
│   │   ├── organizations/     # 组织管理
│   │   │   ├── OrgListPage.tsx
│   │   │   ├── OrgDetailPage.tsx
│   │   │   └── OrgSettingsPage.tsx
│   │   │
│   │   ├── settings/          # 设置
│   │   │   ├── ProfilePage.tsx
│   │   │   └── PreferencesPage.tsx
│   │   │
│   │   └── notifications/     # 通知中心
│   │       └── NotificationPage.tsx
│   │
│   ├── hooks/                  # 自定义 Hooks
│   │   ├── useRequest.ts      # 请求 Hook
│   │   ├── useWebSocket.ts    # WebSocket Hook
│   │   ├── usePermissions.ts  # 权限 Hook
│   │   ├── useAuth.ts         # 认证 Hook
│   │   ├── usePagination.ts   # 分页 Hook
│   │   ├── useDebounce.ts     # 防抖 Hook
│   │   ├── useThrottle.ts     # 节流 Hook
│   │   ├── useLocalStorage.ts # LocalStorage Hook
│   │   └── useI18n.ts         # 国际化 Hook
│   │
│   ├── services/               # API 服务层
│   │   ├── api.ts            # Axios 实例配置
│   │   ├── request.ts        # 请求封装
│   │   ├── auth.ts           # 认证服务
│   │   ├── benchmark.ts      # 评测任务服务
│   │   ├── execution.ts      # 执行记录服务
│   │   ├── agent.ts          # Agent 服务
│   │   ├── batch.ts          # 批量执行服务
│   │   ├── metrics.ts        # 指标服务
│   │   ├── scheduler.ts      # 调度服务
│   │   ├── organization.ts   # 组织服务
│   │   ├── user.ts           # 用户服务
│   │   ├── upload.ts         # 上传服务
│   │   └── websocket.ts      # WebSocket 服务
│   │
│   ├── stores/                 # Zustand 状态管理
│   │   ├── authStore.ts      # 认证状态
│   │   ├── uiStore.ts        # UI 状态
│   │   ├── wsStore.ts        # WebSocket 状态
│   │   ├── benchmarkStore.ts # 评测任务状态
│   │   └── index.ts          # 统一导出
│   │
│   ├── router/                 # 路由配置
│   │   ├── routes.tsx        # 路由定义
│   │   ├── guards.tsx        # 路由守卫
│   │   └── index.tsx         # 导出
│   │
│   ├── utils/                  # 工具函数
│   │   ├── format.ts         # 格式化工具
│   │   ├── validation.ts     # 验证工具
│   │   ├── date.ts           # 日期工具
│   │   ├── storage.ts        # 存储工具
│   │   ├── request.ts        # 请求工具
│   │   └── index.ts
│   │
│   ├── constants/              # 常量定义
│   │   ├── enum.ts           # 枚举
│   │   ├── config.ts         # 配置
│   │   ├── permissions.ts    # 权限定义
│   │   └── index.ts
│   │
│   ├── types/                  # TypeScript 类型
│   │   ├── api/              # API 类型
│   │   │   ├── common.ts
│   │   │   ├── auth.ts
│   │   │   ├── benchmark.ts
│   │   │   ├── execution.ts
│   │   │   ├── agent.ts
│   │   │   ├── batch.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── domain/           # 领域类型
│   │   │   ├── user.ts
│   │   │   ├── organization.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── components/       # 组件类型
│   │   │   ├── table.ts
│   │   │   ├── form.ts
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts          # 统一导出
│   │
│   ├── locales/                # 国际化文件
│   │   ├── index.ts          # 配置入口
│   │   ├── zh-CN.ts          # 简体中文
│   │   ├── en-US.ts          # 英文
│   │   └── modules/          # 模块化翻译
│   │       ├── common.ts
│   │       ├── nav.ts
│   │       ├── benchmark.ts
│   │       ├── execution.ts
│   │       └── errors.ts
│   │
│   ├── providers/              # Context Providers
│   │   ├── ThemeProvider.tsx
│   │   ├── I18nProvider.tsx
│   │   └── QueryProvider.tsx
│   │
│   ├── App.tsx                 # 应用根组件
│   └── main.tsx                # 应用入口
│
├── tests/                      # 测试文件
│   ├── unit/                  # 单元测试
│   ├── integration/           # 集成测试
│   └── e2e/                   # E2E 测试
│
├── .env.development            # 开发环境变量
├── .env.production             # 生产环境变量
├── .eslintrc.cjs               # ESLint 配置
├── .prettierrc                 # Prettier 配置
├── tsconfig.json               # TypeScript 配置
├── tsconfig.node.json          # Node TypeScript 配置
├── vite.config.ts              # Vite 配置
├── package.json
├── pnpm-lock.yaml              # 或 package-lock.json
└── README.md
```

## 文件命名规范

### 组件文件

- PascalCase: `BenchmarkTable.tsx`, `ActionButtons.tsx`
- 组件目录与主文件同名: `components/layout/AppLayout/AppLayout.tsx`

### 工具/服务文件

- camelCase: `formatDate.ts`, `authService.ts`, `useRequest.ts`

### 类型文件

- camelCase: `common.ts`, `benchmark.ts`

### 常量文件

- camelCase: `enum.ts`, `config.ts`

### 样式文件

- kebab-case: `benchmark-list.css`, `app-header.css`

## 模块导出规范

### 模块索引文件

```typescript
// src/components/index.ts
export { AppLayout } from './layout/AppLayout';
export { AppHeader } from './layout/AppHeader';
export { AppSidebar } from './layout/AppSidebar';
export { DataTable } from './table/DataTable';
export { StatusBadge } from './status/StatusBadge';
// ...

// src/services/index.ts
export { authService } from './auth';
export { benchmarkService } from './benchmark';
export { executionService } from './execution';
// ...

// src/hooks/index.ts
export { useRequest } from './useRequest';
export { useWebSocket } from './useWebSocket';
export { useAuth } from './useAuth';
// ...
```

### 使用方式

```typescript
// 统一导入
import { DataTable, StatusBadge, AppLayout } from '@/components';
import { useAuth, useRequest } from '@/hooks';
import { authService, benchmarkService } from '@/services';
```

## 路径别名配置

### vite.config.ts

```typescript
import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@hooks': path.resolve(__dirname, './src/hooks'),
      '@services': path.resolve(__dirname, './src/services'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@types': path.resolve(__dirname, './src/types'),
      '@constants': path.resolve(__dirname, './src/constants'),
      '@assets': path.resolve(__dirname, './src/assets'),
      '@locales': path.resolve(__dirname, './src/locales'),
    },
  },
});
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@pages/*": ["src/pages/*"],
      "@hooks/*": ["src/hooks/*"],
      "@services/*": ["src/services/*"],
      "@stores/*": ["src/stores/*"],
      "@utils/*": ["src/utils/*"],
      "@types/*": ["src/types/*"],
      "@constants/*": ["src/constants/*"],
      "@assets/*": ["src/assets/*"],
      "@locales/*": ["src/locales/*"]
    }
  }
}
```

## 代码组织原则

1. **按功能分组** - 相关文件放在同一目录
2. **清晰的层次** - pages → components → hooks → services
3. **统一导出** - 使用 index.ts 统一导出
4. **避免深层嵌套** - 目录层级不超过 3 层
5. **命名一致性** - 同类文件使用相同命名风格
