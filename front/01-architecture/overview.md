# 前端架构概览

## 架构原则

MyAgent 前端遵循以下架构原则：

1. **分层清晰** - 视图层、业务逻辑层、数据层职责明确
2. **模块解耦** - 功能模块独立，便于维护和测试
3. **类型安全** - 充分利用 TypeScript 的类型系统
4. **性能优先** - 代码分割、懒加载、状态优化
5. **可扩展性** - 易于添加新功能和适配多端

## 技术选型理由

### 框架与构建工具

| 技术 | 选型理由 |
|------|---------|
| **React 18** | 组件化开发、生态系统成熟、并发特性 |
| **TypeScript** | 静态类型检查、IDE 支持、减少运行时错误 |
| **Vite** | 快速冷启动、HMR、基于 ESM 的原生开发体验 |

### UI 与交互

| 技术 | 选型理由 |
|------|---------|
| **Ant Design 5** | 企业级组件、设计规范统一、主题定制能力强 |
| **ECharts** | 丰富的图表类型、性能优秀、交互能力强 |

### 路由与状态

| 技术 | 选型理由 |
|------|---------|
| **React Router v6** | 声明式路由、嵌套路由、数据预加载支持 |
| **Zustand** | 轻量简洁、无 Boilerplate、TypeScript 友好 |

### 网络与通信

| 技术 | 选型理由 |
|------|---------|
| **axios** | 拦截器、取消请求、超时控制、进度监控 |
| **WebSocket** | 实时通信、任务进度推送、状态同步 |

## 分层架构

```
┌─────────────────────────────────────────────────────────────┐
│                        视图层 (View)                        │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   Pages     │ │ Components  │ │   Layouts   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     业务逻辑层 (Logic)                       │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │   Hooks     │ │   Stores    │ │   Utils     │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       数据层 (Data)                          │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │  Services   │ │    Types    │ │ Constants   │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

## 核心模块关系

```
                    ┌─────────────┐
                    │     App     │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │  Router │       │ i18n    │       │  Theme  │
   └────┬────┘       └────┬────┘       └────┬────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼──────┐
                    │   Layout    │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │ Header  │       │ Sidebar │       │ Content │
   └────┬────┘       └────┬────┘       └────┬────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                    ┌──────▼──────┐
                    │    Pages    │
                    └──────┬──────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
   ┌────▼────┐       ┌────▼────┐       ┌────▼────┐
   │Components│       │  Hooks  │       │ Services │
   └─────────┘       └────┬────┘       └────┬────┘
                           │                  │
                           └────────┬─────────┘
                                    │
                             ┌──────▼──────┐
                             │   Zustand   │
                             └──────┬──────┘
                                    │
                             ┌──────▼──────┐
                             │    Axios    │
                             └──────┬──────┘
                                    │
                             ┌──────▼──────┐
                             │ Backend API │
                             └─────────────┘
```

## 与后端 API 对接

### API 基础配置

```typescript
// src/services/api.ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
```

### 统一响应处理

```typescript
// 后端统一响应格式
interface ApiResponse<T = any> {
  code: number;      // 0 表示成功
  message: string;
  data?: T;
  request_id?: string;
}

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    const { code, message, data } = response.data;
    if (code === 0) {
      return data;
    }
    return Promise.reject(new Error(message));
  },
  (error) => {
    // 错误处理...
  }
);
```

## 状态管理策略

### 全局状态 (Zustand)

- **authStore** - 用户认证状态
- **uiStore** - UI 状态（侧边栏、主题等）
- **wsStore** - WebSocket 连接状态

### 局部状态 (useState)

- 组件内部状态
- 表单数据
- 临时 UI 状态

### 服务端状态

- 通过 API 获取的数据
- 使用自定义 Hooks 管理

## 路由设计

### 路由结构

```typescript
const routes = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedLayout />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'benchmarks', element: <BenchmarksPage /> },
      { path: 'executions', element: <ExecutionsPage /> },
      { path: 'agents', element: <AgentsPage /> },
      // ...
    ],
  },
];
```

### 路由守卫

- 认证检查
- 权限验证
- 页面访问日志

## 性能优化策略

### 代码分割

```typescript
// 路由级别懒加载
const DashboardPage = lazy(() => import('@/pages/dashboard'));
const BenchmarksPage = lazy(() => import('@/pages/benchmarks'));
```

### 组件优化

- 使用 `React.memo` 防止不必要的重渲染
- 使用 `useMemo` 缓存计算结果
- 使用 `useCallback` 稳定函数引用

### 数据缓存

- API 响应缓存
- 静态资源缓存
- LocalStorage 持久化

## 错误处理

### 错误边界

```typescript
class ErrorBoundary extends React.Component {
  // 捕获组件错误
}
```

### 全局错误处理

- API 请求错误
- WebSocket 连接错误
- 运行时错误

## 类型安全

### 类型定义组织

```
src/types/
├── api/           # API 相关类型
├── domain/        # 领域模型类型
├── components/    # 组件 Props 类型
└── index.ts       # 统一导出
```

### 类型复用

```typescript
// 从后端接口生成类型
export type Benchmark = {
  id: string;
  name: string;
  status: 'draft' | 'active' | 'archived';
  // ...
};
```

## 安全性

### XSS 防护

- React 默认转义输出
- `dangerouslySetInnerHTML` 谨慎使用

### CSRF 防护

- Token 存储在 localStorage
- 每次请求携带 Authorization 头

### 敏感信息

- 不在 URL 中传递敏感数据
- 不在 localStorage 存储密码

## 测试策略

### 单元测试

- 工具函数测试
- Hooks 测试
- 组件测试

### 集成测试

- API 测试
- 路由测试

### E2E 测试

- 关键业务流程

## 部署

### 构建产物

```bash
npm run build
# dist/
```

### 静态资源

- CDN 部署
- 缓存策略
- 版本管理
