# SWE-bench API

## 基础信息

| 项目 | 值 |
|------|------|
| 基础路径 | `/api/v1/swenbench` |
| 需要认证 | 是 |
| 内容类型 | `application/json` |

---

## 接口列表

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/tasks` | 创建 SWE 任务 |
| GET | `/tasks/:id` | 获取任务详情 |
| POST | `/tasks/:id/retry` | 重试任务 |
| POST | `/tasks/:id/fix` | 智能修复 |
| GET | `/tasks/:id/export` | 导出代码 |
| GET | `/tasks/:id/test-options` | 获取测试选项 |
| POST | `/tasks/:id/test-strategy` | 设置测试策略 |
| GET | `/tasks` | 获取任务列表 |
| GET | `/ws` | WebSocket 连接 |
| GET | `/ws/stats` | WebSocket 统计 |
| GET | `/repo/cache` | 仓库缓存列表 |
| DELETE | `/repo/cache` | 删除仓库缓存 |

---

## 1. 创建 SWE 任务

### 请求

```http
POST /api/v1/swenbench/tasks
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体**:
```typescript
interface CreateSWETaskRequest {
  repo_url: string           // 必填，GitHub 仓库 URL
  commit_hash?: string       // 可选，默认 main 分支最新
  base_branch?: string       // 可选，默认 "main"
  issue: {
    number?: number          // Issue 编号
    title: string            // 必填
    body: string             // 必填
    url?: string             // Issue URL
    labels?: string[]
  }
  config?: {
    test_strategy?: "full" | "smart" | "skip"
    enable_auto_fix?: boolean
    max_fix_attempts?: number
  }
}
```

### 响应

**成功 (200)**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    id: string,              // "swe-{uuid}"
    status: "pending",
    phase: "init",
    message: "Task created successfully",
    created_at: string
  }
}
```

---

## 2. 获取任务详情

### 请求

```http
GET /api/v1/swenbench/tasks/:id
Authorization: Bearer {access_token}
```

### 响应

**成功 (200)**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    id: string,
    status: "pending" | "running" | "completed" | "failed" | "fixing",
    phase: string,
    progress: number,         // 0-100
    message?: string,

    repository: {
      url: string,
      owner: string,
      name: string,
      commit_hash: string,
      cloned: boolean
    },

    test?: {
      strategy: string,
      passed?: boolean,
      total?: number,
      passed_count?: number,
      failed_count?: number
    },

    fix?: {
      attempted: boolean,
      success: boolean,
      fixed_count?: number
    },

    error?: string,
    created_at: string,
    updated_at: string,
    completed_at?: string
  }
}
```

---

## 3. 重试任务

### 请求

```http
POST /api/v1/swenbench/tasks/:id/retry
Authorization: Bearer {access_token}
```

### 响应

**成功 (200)**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    id: string,
    status: "pending",
    phase: "init",
    message: "Task retry scheduled",
    created_at: string
  }
}
```

---

## 4. 智能修复

### 请求

```http
POST /api/v1/swenbench/tasks/:id/fix
Authorization: Bearer {access_token}
```

### 响应

**成功 (200)**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    task_id: string,
    attempted: true,
    success: false,
    message: "Fix in progress"
  }
}
```

**错误 (400)**:
- 任务状态不可修复

---

## 5. 导出代码

### 请求

```http
GET /api/v1/swenbench/tasks/:id/export
Authorization: Bearer {access_token}
```

### 响应

**成功 (200)**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    task_id: string,
    artifact_key: string,
    download_url: string,
    file_count: number,
    expires_at: string
  }
}
```

---

## 6. 获取测试选项

### 请求

```http
GET /api/v1/swenbench/tasks/:id/test-options
Authorization: Bearer {access_token}
```

### 响应

**成功 (200)**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    task_id: string,
    options: [
      {
        strategy: "full",
        description: "Run all tests",
        estimated_time: 300
      },
      {
        strategy: "smart",
        description: "Run tests affected by changes",
        estimated_time: 60
      },
      {
        strategy: "skip",
        description: "Skip tests",
        estimated_time: 0
      }
    ],
    recommended: "smart",
    test_file_count: 50
  }
}
```

---

## 7. 设置测试策略

### 请求

```http
POST /api/v1/swenbench/tasks/:id/test-strategy
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体**:
```typescript
{
  strategy: "full" | "smart" | "skip"
}
```

### 响应

**成功 (200)**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    task_id: string,
    strategy: string,
    message: "Test strategy updated"
  }
}
```

---

## 8. 任务列表

### 请求

```http
GET /api/v1/swenbench/tasks?page=1&page_size=20&status=running
Authorization: Bearer {access_token}
```

**查询参数**:

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| page_size | int | 20 | 每页数量 |
| status | string | - | 状态筛选 |

---

## WebSocket 连接

### 任务进度订阅

```http
GET /api/v1/swenbench/tasks/:id/ws
```

### 所有任务订阅

```http
GET /api/v1/swenbench/ws
```

**WebSocket 消息**:

```typescript
// 进度更新
{
  event: "swe_progress",
  data: {
    task_id: string,
    phase: string,
    progress: number,
    message: string
  }
}

// 任务完成
{
  event: "swe_completed",
  data: {
    task_id: string,
    result: {...}
  }
}

// 任务失败
{
  event: "swe_failed",
  data: {
    task_id: string,
    error: string
  }
}
```

---

## 仓库缓存

### 获取缓存列表

```http
GET /api/v1/swenbench/repo/cache?page=1&page_size=20
```

### 删除缓存

```http
DELETE /api/v1/swenbench/repo/cache?repo_url={encoded_url}
```

---

## TypeScript 类型定义

```typescript
// src/types/api/swenbench.ts

export type SWETaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'fixing'

export type SWEPhase =
  | 'init'
  | 'repository'
  | 'indexing'
  | 'executing'
  | 'testing'
  | 'fixing'
  | 'completed'
  | 'failed'

export type TestStrategy = 'full' | 'smart' | 'skip'

export interface CreateSWETaskRequest {
  repo_url: string
  commit_hash?: string
  base_branch?: string
  issue: {
    number?: number
    title: string
    body: string
    url?: string
    labels?: string[]
  }
  config?: {
    test_strategy?: TestStrategy
    enable_auto_fix?: boolean
    max_fix_attempts?: number
  }
}

export interface SWETaskDetail {
  id: string
  status: SWETaskStatus
  phase: SWEPhase
  progress: number
  message?: string
  repository: {
    url: string
    owner: string
    name: string
    commit_hash: string
    cloned: boolean
  }
  test?: {
    strategy: TestStrategy
    passed?: boolean
    total?: number
    passed_count?: number
    failed_count?: number
  }
  fix?: {
    attempted: boolean
    success: boolean
    fixed_count?: number
  }
  error?: string
  created_at: string
  updated_at: string
  completed_at?: string
}
```
