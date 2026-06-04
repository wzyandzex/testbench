# 系统概览

## 系统架构

MyAgent 是一个分布式代码评测和执行系统，采用微服务架构。

### 服务组件

| 服务 | 端口 | 职责 |
|------|------|------|
| **API** | 8080 | REST API 网关，处理认证、任务提交、查询 |
| **Scheduler** | 8081/50051 | 任务调度中心，支持 gRPC 推送和 Kafka 拉取 |
| **Worker** | 9095 | 任务执行器，管理沙箱和 Agent 运行时 |
| **Analyzer** | - | 代码分析服务 |
| **Collector** | - | 指标收集服务 |
| **Notifier** | 8005 | 通知服务（WebSocket 实时推送） |
| **Importer-Worker** | - | Benchmark 导入后台任务 |

### 架构图

```
                    ┌─────────────┐
                    │     API     │ ← HTTP 客户端 (8080)
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Scheduler  │ ← gRPC 推送 / Kafka 拉取 (8081/50051)
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
         ┌────▼────┐ ┌───▼────┐ ┌───▼────┐
         │ Worker  │ │ Worker  │ │ Worker  │
         └────┬────┘ └───┬────┘ └───┬────┘
              │           │           │
         ┌────▼─────────▼─────────▼────┐
         │   Docker Sandbox Pool       │
         └─────────────────────────────┘

         ┌────────────────────────────────┐
         │         WebSocket Notifier      │ ← 实时推送 (8005)
         └────────────────────────────────┘
```

## 前端架构

### 技术栈

| 技术 | 用途 |
|------|------|
| React 18.x | UI 框架 |
| TypeScript 5.x | 类型系统 |
| Vite 5.x | 构建工具 |
| Ant Design 5.x | UI 组件库 |
| React Router 6.x | 路由管理 |
| Zustand 4.x | 状态管理 |
| axios 1.x | HTTP 客户端 |
| ECharts 5.x | 图表库 |
| react-i18next 13.x | 国际化 |

### 分层架构

```
┌─────────────────────────────────────────────────────────┐
│                    Pages / Views                        │
│  (登录页、列表页、详情页、表单页等)                       │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │
┌─────────────────────────────────────────────────────────┐
│                   Components                            │
│  (通用组件、业务组件)                                     │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │
┌─────────────────────────────────────────────────────────┐
│                   Stores (Zustand)                      │
│  - authStore: 认证状态                                   │
│  - uiStore: UI 状态                                      │
│  - wsStore: WebSocket 状态                               │
│  - [domain]Store: 各领域状态                             │
└─────────────────────────────────────────────────────────┘
                            ▲
                            │
┌─────────────────────────────────────────────────────────┐
│                   Services / API                        │
│  - API 客户端 (axios)                                    │
│  - WebSocket 管理器                                      │
│  - 工具函数                                              │
└─────────────────────────────────────────────────────────┘
```

## 核心概念

### 1. Benchmark（评测任务）

评测任务是系统核心实体，定义了代码评测的规则和环境。

```typescript
interface Benchmark {
  id: string;
  name: string;
  display_name: string;
  type: BenchmarkType;       // code_fix | code_complete | terminal | code_review | refactor | debug | optimize
  language: string;
  difficulty: DifficultyLevel;  // easy | medium | hard | expert
  status: BenchmarkStatus;   // draft | active | archived | deprecated
  approval_status: ApprovalStatus; // pending | approved | rejected
  visibility: Visibility;     // public | private | organization
  config: BenchmarkConfig;
  test_config: TestConfig;
}
```

### 2. Execution（执行记录）

执行记录是一次具体的评测运行。

```typescript
interface Execution {
  id: string;
  benchmark_id: string;
  agent_id: string;
  status: ExecutionStatus;    // pending | running | completed | failed | cancelled | timeout
  result: ExecutionResult;
  started_at: string;
  completed_at?: string;
}
```

### 3. Agent（智能体）

Agent 是执行评测的 AI 实体。

```typescript
interface Agent {
  id: string;
  name: string;
  type: AgentType;
  config: AgentConfig;
  capabilities: string[];
}
```

### 4. Organization（组织）

组织是多租户隔离的核心单元。

```typescript
interface Organization {
  id: string;
  name: string;
  owner_id: string;
  member_count: number;
  settings: OrganizationSettings;
}
```

## 数据流向

### 1. 任务提交流程

```
用户 → 前端 → API (POST /executions)
                    ↓
              Scheduler (排队)
                    ↓
              Worker (执行)
                    ↓
              Notifier (WebSocket 推送进度)
                    ↓
              前端 (更新状态)
```

### 2. 数据集导入流程

```
用户上传文件 → 前端 → API (POST /import/upload)
                           ↓
                      MinIO (存储文件)
                           ↓
                      API (POST /import/async)
                           ↓
                      Kafka (发送任务)
                           ↓
                      Importer-Worker (处理)
                           ↓
                      前端轮询状态 (GET /tasks/:id)
```

### 3. 实时更新流程

```
前端 → WebSocket 连接 → Notifier
                           ↓
                      订阅事件
                           ↓
                 Worker 推送进度 → Kafka → Notifier
                           ↓
                      前端接收更新
```

## API 规范

### 统一响应格式

```typescript
interface ApiResponse<T> {
  code: number;        // 0 表示成功
  message: string;
  data: T;
}
```

### 分页格式

```typescript
interface PaginatedResponse<T> {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    data: T[];
  };
}
```

### 错误码范围

| 错误码范围 | 说明 |
|-----------|------|
| 0-999 | 通用错误 |
| 1000-1999 | 认证错误 |
| 2000-2999 | Benchmark 错误 |
| 3000-3999 | Execution 错误 |
| 4000-4999 | Scheduler 错误 |
| 5000-5999 | 数据库错误 |

## 认证机制

### Token 类型

1. **Access Token**: 短期有效（默认 1 小时），用于 API 认证
2. **Refresh Token**: 长期有效（默认 30 天），用于刷新 Access Token

### Token 存储

```
localStorage
├── access_token     // Access Token
├── refresh_token    // Refresh Token
└── token_expires    // 过期时间
```

### Token 刷新

```typescript
// Axios 拦截器自动处理 401
axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401 && !error.config._retry) {
      error.config._retry = true;
      const newToken = await refreshAccessToken();
      error.config.headers.Authorization = `Bearer ${newToken}`;
      return axios(error.config);
    }
    return Promise.reject(error);
  }
);
```

## 多租户/组织隔离

### 组织上下文

每个 API 请求需要携带组织上下文：

```typescript
// 1. URL 参数（推荐）
GET /api/v1/benchmarks?org_id={org_id}

// 2. Header
Authorization: Bearer {token}
X-Organization-ID: {org_id}

// 3. 状态管理
const { currentOrg } = useOrganizationStore();
```

### 资源可见性

| visibility | 说明 |
|-----------|------|
| public | 所有用户可见 |
| private | 仅创建者可见 |
| organization | 组织内成员可见 |
