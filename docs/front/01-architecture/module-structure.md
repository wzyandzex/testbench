# 模块划分

## 目录结构

```
myagent-frontend/
├── public/
│   ├── locales/           # 静态语言文件
│   └── favicon.ico
├── src/
│   ├── assets/            # 静态资源
│   │   ├── images/        # 图片
│   │   ├── icons/         # 图标
│   │   └── styles/        # 全局样式
│   │       ├── global.css
│   │       ├── variables.css    # CSS 变量
│   │       └── themes/          # 主题样式
│   │           ├── light.css
│   │           └── dark.css
│   ├── components/        # 通用组件
│   │   ├── layout/        # 布局组件
│   │   │   ├── AppLayout.tsx
│   │   │   ├── AppHeader.tsx
│   │   │   ├── AppSidebar.tsx
│   │   │   └── AppFooter.tsx
│   │   ├── table/         # 表格组件
│   │   │   ├── DataTable.tsx
│   │   │   └── ActionButtons.tsx
│   │   ├── form/          # 表单组件
│   │   │   ├── FormBuilder.tsx
│   │   │   └── FormItem.tsx
│   │   ├── chart/         # 图表组件
│   │   │   ├── LineChart.tsx
│   │   │   ├── BarChart.tsx
│   │   │   └── PieChart.tsx
│   │   ├── status/        # 状态显示组件
│   │   │   ├── StatusBadge.tsx
│   │   │   ├── ProgressBar.tsx
│   │   │   └── StatusIcon.tsx
│   │   └── common/        # 通用组件
│   │       ├── EmptyState.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── Loading.tsx
│   │       └── ConfirmModal.tsx
│   ├── pages/             # 页面组件
│   │   ├── auth/          # 认证页面
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── dashboard/     # 仪表盘
│   │   │   └── DashboardPage.tsx
│   │   ├── benchmarks/    # 评测任务
│   │   │   ├── BenchmarkListPage.tsx
│   │   │   ├── BenchmarkDetailPage.tsx
│   │   │   ├── BenchmarkCreatePage.tsx
│   │   │   └── components/
│   │   │       ├── BenchmarkTable.tsx
│   │   │       └── BenchmarkFilter.tsx
│   │   ├── executions/    # 执行记录
│   │   │   ├── ExecutionListPage.tsx
│   │   │   ├── ExecutionDetailPage.tsx
│   │   │   └── components/
│   │   │       ├── ExecutionTable.tsx
│   │   │       └── ExecutionLog.tsx
│   │   ├── agents/        # Agent 管理
│   │   │   ├── AgentListPage.tsx
│   │   │   ├── AgentDetailPage.tsx
│   │   │   └── components/
│   │   │       ├── AgentCard.tsx
│   │   │       └── AgentConfig.tsx
│   │   ├── batch/         # 批量执行
│   │   │   ├── BatchListPage.tsx
│   │   │   ├── BatchCreatePage.tsx
│   │   │   └── BatchDetailPage.tsx
│   │   ├── metrics/       # 指标分析
│   │   │   ├── MetricsOverviewPage.tsx
│   │   │   └── MetricsDetailPage.tsx
│   │   ├── scheduler/     # 调度管理
│   │   │   └── SchedulerPage.tsx
│   │   ├── organizations/ # 组织管理
│   │   │   ├── OrgListPage.tsx
│   │   │   ├── OrgDetailPage.tsx
│   │   │   └── OrgSettingsPage.tsx
│   │   ├── settings/      # 设置
│   │   │   └── SettingsPage.tsx
│   │   └── notifications/ # 通知中心
│   │       └── NotificationPage.tsx
│   ├── hooks/             # 自定义 Hooks
│   │   ├── useRequest.ts      # 请求 Hook
│   │   ├── useWebSocket.ts    # WebSocket Hook
│   │   ├── usePermissions.ts  # 权限 Hook
│   │   ├── useAuth.ts         # 认证 Hook
│   │   ├── usePagination.ts   # 分页 Hook
│   │   ├── useDebounce.ts     # 防抖 Hook
│   │   ├── useThrottle.ts     # 节流 Hook
│   │   └── useLocalStorage.ts # LocalStorage Hook
│   ├── services/          # API 服务层
│   │   ├── api.ts         # Axios 实例配置
│   │   ├── auth.ts        # 认证服务
│   │   ├── benchmark.ts   # 评测任务服务
│   │   ├── execution.ts   # 执行记录服务
│   │   ├── agent.ts       # Agent 服务
│   │   ├── batch.ts       # 批量执行服务
│   │   ├── metrics.ts     # 指标服务
│   │   ├── scheduler.ts   # 调度服务
│   │   ├── organization.ts# 组织服务
│   │   ├── user.ts        # 用户服务
│   │   └── upload.ts      # 上传服务
│   ├── stores/            # Zustand 状态管理
│   │   ├── authStore.ts   # 认证状态
│   │   ├── uiStore.ts     # UI 状态
│   │   ├── wsStore.ts     # WebSocket 状态
│   │   ├── benchmarkStore.ts
│   │   └── index.ts
│   ├── router/            # 路由配置
│   │   ├── routes.tsx     # 路由定义
│   │   ├── guards.tsx     # 路由守卫
│   │   └── index.tsx
│   ├── utils/             # 工具函数
│   │   ├── format.ts      # 格式化工具
│   │   ├── validation.ts  # 验证工具
│   │   ├── date.ts        # 日期工具
│   │   ├── storage.ts     # 存储工具
│   │   └── request.ts     # 请求工具
│   ├── constants/         # 常量定义
│   │   ├── enum.ts        # 枚举
│   │   ├── config.ts      # 配置
│   │   └── index.ts
│   ├── types/             # TypeScript 类型
│   │   ├── api/           # API 类型
│   │   │   ├── common.ts
│   │   │   ├── auth.ts
│   │   │   ├── benchmark.ts
│   │   │   ├── execution.ts
│   │   │   ├── agent.ts
│   │   │   └── index.ts
│   │   ├── domain/        # 领域类型
│   │   ├── components/    # 组件类型
│   │   └── index.ts
│   ├── locales/           # 国际化文件
│   │   ├── zh-CN.ts
│   │   ├── en-US.ts
│   │   └── index.ts
│   ├── providers/         # Context Providers
│   │   ├── ThemeProvider.tsx
│   │   ├── I18nProvider.tsx
│   │   └── QueryProvider.tsx
│   ├── App.tsx            # 应用根组件
│   └── main.tsx           # 应用入口
├── .env.development       # 开发环境变量
├── .env.production        # 生产环境变量
├── .eslintrc.cjs          # ESLint 配置
├── .prettierrc            # Prettier 配置
├── tsconfig.json          # TypeScript 配置
├── vite.config.ts         # Vite 配置
└── package.json
```

## 模块职责

### /components - 通用组件

可复用的 UI 组件，不包含业务逻辑。

**职责**：
- 接收 Props 进行渲染
- 触发事件回调
- 保持独立性

**示例**：
```typescript
// components/status/StatusBadge.tsx
interface StatusBadgeProps {
  status: 'pending' | 'running' | 'completed' | 'failed';
  text?: string;
}

export function StatusBadge({ status, text }: StatusBadgeProps) {
  const config = {
    pending: { color: 'default', icon: <ClockIcon /> },
    running: { color: 'processing', icon: <LoadingIcon /> },
    completed: { color: 'success', icon: <CheckIcon /> },
    failed: { color: 'error', icon: <ErrorIcon /> },
  };

  const { color, icon } = config[status];

  return (
    <Badge color={color} icon={icon}>
      {text || status}
    </Badge>
  );
}
```

### /pages - 页面组件

对应路由的页面组件，组装业务逻辑。

**职责**：
- 获取数据
- 协调子组件
- 处理页面级交互

**示例**：
```typescript
// pages/benchmarks/BenchmarkListPage.tsx
export function BenchmarkListPage() {
  const [filter, setFilter] = useState({});
  const { data, loading } = useBenchmarkList(filter);

  return (
    <PageContainer title="评测任务">
      <BenchmarkFilter onFilter={setFilter} />
      <BenchmarkTable
        data={data?.items || []}
        loading={loading}
        pagination={data?.pagination}
      />
    </PageContainer>
  );
}
```

### /hooks - 自定义 Hooks

可复用的逻辑封装。

**职责**：
- 封装通用逻辑
- 提供简洁 API
- 管理组件生命周期

**示例**：
```typescript
// hooks/useRequest.ts
export function useRequest<T>(
  apiFunc: () => Promise<T>,
  options = {}
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    try {
      const result = await apiFunc();
      setData(result);
      return result;
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [apiFunc]);

  return { data, loading, error, execute };
}
```

### /services - API 服务层

封装后端 API 调用。

**职责**：
- 定义 API 接口
- 处理请求/响应
- 错误转换

**示例**：
```typescript
// services/benchmark.ts
import api from './api';
import type { Benchmark, CreateBenchmarkDto } from '@/types';

export const benchmarkService = {
  // 获取列表
  list: (params: ListParams) => {
    return api.get<PaginatedResponse<Benchmark>>('/benchmarks', { params });
  },

  // 获取详情
  get: (id: string) => {
    return api.get<Benchmark>(`/benchmarks/${id}`);
  },

  // 创建
  create: (data: CreateBenchmarkDto) => {
    return api.post<Benchmark>('/benchmarks', data);
  },

  // 更新
  update: (id: string, data: UpdateBenchmarkDto) => {
    return api.put<Benchmark>(`/benchmarks/${id}`, data);
  },

  // 删除
  delete: (id: string) => {
    return api.delete(`/benchmarks/${id}`);
  },
};
```

### /stores - 状态管理

全局状态管理。

**职责**：
- 存储全局状态
- 提供状态操作方法
- 状态持久化

### /types - 类型定义

TypeScript 类型定义。

**职责**：
- API 接口类型
- 领域模型类型
- 组件 Props 类型

### /utils - 工具函数

纯函数工具集。

**职责**：
- 格式化
- 验证
- 转换
- 计算

## 模块依赖规则

```
┌─────────────────────────────────────────────────────────┐
│                        pages                            │
│     (可以依赖: components, hooks, services, stores)      │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    components                           │
│        (可以依赖: hooks, utils, constants, types)        │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                      hooks                              │
│  (可以依赖: services, stores, utils, constants, types)   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                    services                             │
│           (可以依赖: api, utils, types)                  │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                     stores                              │
│        (可以依赖: services, utils, types)                │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              utils / constants / types                   │
│                  (无依赖或仅相互依赖)                     │
└─────────────────────────────────────────────────────────┘
```

## 模块通信

### 组件间通信

```
┌─────────────┐                    ┌─────────────┐
│   Parent    │                    │   Parent    │
└──────┬──────┘                    └──────┬──────┘
       │                                  │
       │ Props                            │ Callbacks
       ▼                                  ▼
┌─────────────┐                    ┌─────────────┐
│    Child    │                    │    Child    │
└─────────────┘                    └─────────────┘

       跨层级通信
           │
           ▼
┌─────────────────────────────────────────────┐
│              Context / Store                 │
│  (useContext / Zustand for complex state)   │
└─────────────────────────────────────────────┘
```

### 页面间通信

```
┌─────────────┐      Router       ┌─────────────┐
│   Page A    │ ─────────────────▶│   Page B    │
└─────────────┘  (URL Params /    └─────────────┘
                  Query String /
                  Router State)

       共享状态
           │
           ▼
┌─────────────────────────────────────────────┐
│              Store / LocalStorage           │
│  (for persistent shared state)              │
└─────────────────────────────────────────────┘
```

## 最佳实践

1. **单一职责** - 每个模块只负责一件事
2. **依赖倒置** - 高层模块不依赖低层模块
3. **接口隔离** - 模块间通过接口通信
4. **开放封闭** - 对扩展开放，对修改封闭
5. **最少知识** - 模块只与必要的模块通信
