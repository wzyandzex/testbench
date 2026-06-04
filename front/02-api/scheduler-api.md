# 调度器接口

## 基础信息

| 项目 | 值 |
|------|------|
| 基础路径 | `/api/v1/scheduler` |
| 需要认证 | 是 |
| 内容类型 | `application/json` |

## 错误码

| 错误码 | 说明 |
|--------|------|
| 400002 | 任务已完成，无法取消 |
| 404001 | 任务不存在 |
| 500 | 服务器内部错误 |

---

## 接口列表

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/scheduler/stats` | 获取调度器统计 |
| GET | `/scheduler/tasks` | 获取调度任务列表 |
| POST | `/scheduler/tasks` | 提交任务 |
| GET | `/scheduler/tasks/:id` | 获取任务详情 |
| POST | `/scheduler/tasks/:id/cancel` | 取消任务 |

---

## 1. 获取调度器统计

### 请求

```http
GET /api/v1/scheduler/stats
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface SchedulerStatsResponse {
  code: number;
  message: string;
  data: SchedulerStats;
}

interface SchedulerStats {
  // 队列统计
  queue_size: number;
  queue_capacity: number;

  // 任务统计（按优先级）
  pending_tasks: Record<string, number>;
  running_tasks: Record<string, number>;

  // Worker 统计
  total_workers: number;
  active_workers: number;
  idle_workers: number;

  // 吞吐量
  tasks_per_minute: number;
  avg_task_duration: number;

  // 时间统计
  uptime_seconds: number;
  last_reset_time: string;
}
```

---

## 2. 获取调度任务列表

### 请求

```http
GET /api/v1/scheduler/tasks?status=running&priority=p0&page=1&page_size=20
Authorization: Bearer {access_token}
```

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| status | string[] | - | 状态筛选（可多选） |
| priority | string[] | - | 优先级筛选（可多选） |
| agent_id | string | - | Agent ID 筛选 |
| page | int | 1 | 页码 |
| page_size | int | 20 | 每页数量（最大1000） |

### 响应

```typescript
interface PaginatedResponse {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    data: ServiceTask[];
  };
}

interface ServiceTask {
  id: string;
  type: string;
  priority: string;
  benchmark_id: string;
  agent_id: string;
  config: Record<string, any>;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
```

---

## 3. 提交任务

### 请求

```http
POST /api/v1/scheduler/tasks
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface SubmitTaskRequest {
  type: string;                  // 任务类型
  priority: string;              // 优先级（p0-p4）
  benchmark_id: string;          // Benchmark ID
  agent_id: string;              // Agent ID
  config: Record<string, any>;   // 任务配置
}
```

### 响应

```typescript
interface SubmitTaskResponse {
  code: number;
  message: string;
  data: ServiceTask;
}
```

---

## 4. 获取任务详情

### 请求

```http
GET /api/v1/scheduler/tasks/:id
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface TaskDetailResponse {
  code: number;
  message: string;
  data: ServiceTask;
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| 404001 | 任务不存在 |

---

## 5. 取消任务

### 请求

```http
POST /api/v1/scheduler/tasks/:id/cancel
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "task cancelled successfully",
    "task_id": "task-123"
  }
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| 404001 | 任务不存在 |
| 400002 | 任务已完成，无法取消 |

---

## TypeScript 类型定义

```typescript
// src/types/api/scheduler.ts

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type TaskPriority = 'p0' | 'p1' | 'p2' | 'p3' | 'p4';

export interface SchedulerStats {
  queue_size: number;
  queue_capacity: number;
  pending_tasks: Record<string, number>;
  running_tasks: Record<string, number>;
  total_workers: number;
  active_workers: number;
  idle_workers: number;
  tasks_per_minute: number;
  avg_task_duration: number;
  uptime_seconds: number;
  last_reset_time: string;
}

export interface ServiceTask {
  id: string;
  type: string;
  priority: TaskPriority;
  benchmark_id: string;
  agent_id: string;
  config: Record<string, any>;
  status: TaskStatus;
  created_at: string;
  updated_at: string;
}

export interface SubmitTaskRequest {
  type: string;
  priority: TaskPriority;
  benchmark_id: string;
  agent_id: string;
  config?: Record<string, any>;
}

export interface ServiceTaskFilter {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  agent_id?: string;
  page?: number;
  page_size?: number;
}

// 错误码
export const SchedulerErrorCode = {
  TASK_COMPLETED: 400002,
  TASK_NOT_FOUND: 404001,
} as const;
```
