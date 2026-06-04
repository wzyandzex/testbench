# 定时任务接口

## 基础信息

| 项目 | 值 |
|------|------|
| 基础路径 | `/api/v1/scheduled-tasks` |
| 需要认证 | 是 |
| 内容类型 | `application/json` |

## 错误码

| 错误码 | 说明 |
|--------|------|
| 400 | 请求参数无效 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |

---

## 接口列表

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/scheduled-tasks` | 创建定时任务 |
| GET | `/scheduled-tasks` | 获取定时任务列表 |
| GET | `/scheduled-tasks/:id` | 获取定时任务详情 |
| PUT | `/scheduled-tasks/:id` | 更新定时任务 |
| PATCH | `/scheduled-tasks/:id/status` | 启用/禁用定时任务 |
| DELETE | `/scheduled-tasks/:id` | 删除定时任务 |
| POST | `/scheduled-tasks/:id/trigger` | 手动触发定时任务 |
| GET | `/scheduled-tasks/:id/runs` | 获取任务执行历史 |

---

## 定时任务状态枚举

| 值 | 说明 |
|----|------|
| `active` | 活跃 |
| `paused` | 暂停 |
| `archived` | 已归档 |

---

## 执行状态枚举

| 值 | 说明 |
|----|------|
| `pending` | 等待中 |
| `running` | 运行中 |
| `completed` | 已完成 |
| `failed` | 失败 |
| `cancelled` | 已取消 |

---

## 1. 创建定时任务

### 请求

```http
POST /api/v1/scheduled-tasks
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface CreateScheduledTaskRequest {
  name: string;                    // 名称（必填）
  description?: string;             // 描述
  schedule: ScheduleConfig;         // 调度配置（必填）
  execution_config: ExecutionConfig; // 执行配置（必填）
  retry?: RetryConfig;              // 重试配置
  notification?: NotificationConfig; // 通知配置
  enabled?: boolean;                // 是否启用（默认 true）
}

interface ScheduleConfig {
  type: 'cron' | 'interval';       // 调度类型
  cron_expression?: string;         // Cron 表达式（type=cron 时必填）
  interval_seconds?: number;        // 间隔秒数（type=interval 时必填）
  timezone?: string;                // 时区（默认 UTC）
}

interface ExecutionConfig {
  agent_ids: string[];              // Agent ID 列表
  benchmark_ids: string[];          // Benchmark ID 列表
  task_config?: {
    max_steps?: number;
    timeout?: number;
    priority?: string;
  };
  agent_config?: {
    temperature?: number;
    max_tokens?: number;
  };
  options?: {
    parallel?: boolean;
    max_parallel?: number;
    stop_on_first_failure?: boolean;
    generate_report?: boolean;
  };
}

interface RetryConfig {
  enabled: boolean;                // 是否启用重试
  max_attempts: number;             // 最大重试次数
  initial_backoff: number;          // 初始退避时间（秒）
  max_backoff: number;              // 最大退避时间（秒）
  backoff_strategy: 'fixed' | 'exponential' | 'linear'; // 退避策略
}

interface NotificationConfig {
  on_success: boolean;             // 成功时通知
  on_failure: boolean;              // 失败时通知
  channels: string[];               // 通知渠道（email/webhook）
  webhook_url?: string;             // Webhook URL
}
```

### 响应

**成功响应（201）：**

```typescript
interface ScheduledTaskResponse {
  code: number;
  message: string;
  data: ScheduledTask;
}

interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  schedule: ScheduleConfig;
  execution_config: ExecutionConfig;
  retry: RetryConfig;
  notification: NotificationConfig;
  enabled: boolean;
  status: TaskStatus;
  next_run_time?: string;
  last_run_time?: string;
  last_run_id?: string;
  last_run_status?: RunStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

type TaskStatus = 'active' | 'paused' | 'archived';
type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
```

---

## 2. 获取定时任务列表

### 请求

```http
GET /api/v1/scheduled-tasks?enabled=true&status=active&page=1&page_size=20
Authorization: Bearer {access_token}
```

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| page_size | int | 20 | 每页数量（最大100） |
| enabled | boolean | - | 是否启用筛选 |
| status | string | - | 状态筛选 |

### 响应

```typescript
interface ListScheduledTasksResponse {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    items: ScheduledTask[];
  };
}
```

---

## 3. 获取定时任务详情

### 请求

```http
GET /api/v1/scheduled-tasks/:id
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface ScheduledTaskDetailResponse {
  code: number;
  message: string;
  data: ScheduledTask;
}
```

---

## 4. 更新定时任务

### 请求

```http
PUT /api/v1/scheduled-tasks/:id
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface UpdateScheduledTaskRequest {
  name?: string;
  description?: string;
  schedule?: ScheduleConfig;
  execution_config?: ExecutionConfig;
  retry?: RetryConfig;
  notification?: NotificationConfig;
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "Task updated successfully"
}
```

---

## 5. 启用/禁用定时任务

### 请求

```http
PATCH /api/v1/scheduled-tasks/:id/status
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface UpdateTaskStatusRequest {
  enabled: boolean;
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "Status updated successfully"
}
```

---

## 6. 删除定时任务

### 请求

```http
DELETE /api/v1/scheduled-tasks/:id
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "Task deleted successfully"
}
```

---

## 7. 手动触发定时任务

### 请求

```http
POST /api/v1/scheduled-tasks/:id/trigger
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface TriggerTaskResponse {
  code: number;
  message: string;
  data: TaskRun;
}

interface TaskRun {
  id: string;
  task_id: string;
  scheduled_time: string;
  started_at?: string;
  completed_at?: string;
  status: RunStatus;
  batch_id?: string;
  execution_id?: string;
  error?: string;
  retry_attempt: number;
  next_retry_time?: string;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  created_at: string;
}
```

---

## 8. 获取任务执行历史

### 请求

```http
GET /api/v1/scheduled-tasks/:id/runs?page=1&page_size=20
Authorization: Bearer {access_token}
```

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| page_size | int | 20 | 每页数量（最大100） |

### 响应

```typescript
interface ListTaskRunsResponse {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    items: TaskRun[];
  };
}
```

---

## TypeScript 类型定义

```typescript
// src/types/api/scheduled-task.ts

export type TaskStatus = 'active' | 'paused' | 'archived';
export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

export interface ScheduleConfig {
  type: 'cron' | 'interval';
  cron_expression?: string;
  interval_seconds?: number;
  timezone?: string;
}

export interface ExecutionConfig {
  agent_ids: string[];
  benchmark_ids: string[];
  task_config?: {
    max_steps?: number;
    timeout?: number;
    priority?: string;
  };
  agent_config?: {
    temperature?: number;
    max_tokens?: number;
  };
  options?: {
    parallel?: boolean;
    max_parallel?: number;
    stop_on_first_failure?: boolean;
    generate_report?: boolean;
  };
}

export interface RetryConfig {
  enabled: boolean;
  max_attempts: number;
  initial_backoff: number;
  max_backoff: number;
  backoff_strategy: 'fixed' | 'exponential' | 'linear';
}

export interface NotificationConfig {
  on_success: boolean;
  on_failure: boolean;
  channels: string[];
  webhook_url?: string;
}

export interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  schedule: ScheduleConfig;
  execution_config: ExecutionConfig;
  retry: RetryConfig;
  notification: NotificationConfig;
  enabled: boolean;
  status: TaskStatus;
  next_run_time?: string;
  last_run_time?: string;
  last_run_id?: string;
  last_run_status?: RunStatus;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateScheduledTaskRequest {
  name: string;
  description?: string;
  schedule: ScheduleConfig;
  execution_config: ExecutionConfig;
  retry?: RetryConfig;
  notification?: NotificationConfig;
  enabled?: boolean;
}

export interface UpdateScheduledTaskRequest {
  name?: string;
  description?: string;
  schedule?: ScheduleConfig;
  execution_config?: ExecutionConfig;
  retry?: RetryConfig;
  notification?: NotificationConfig;
}

export interface UpdateTaskStatusRequest {
  enabled: boolean;
}

export interface TaskRun {
  id: string;
  task_id: string;
  scheduled_time: string;
  started_at?: string;
  completed_at?: string;
  status: RunStatus;
  batch_id?: string;
  execution_id?: string;
  error?: string;
  retry_attempt: number;
  next_retry_time?: string;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  created_at: string;
}

export interface ScheduledTaskFilter {
  page?: number;
  page_size?: number;
  enabled?: boolean;
  status?: TaskStatus;
}
```
