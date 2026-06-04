# 执行记录接口

## 基础信息

| 项目 | 值 |
|------|------|
| 基础路径 | `/api/v1/executions` |
| 需要认证 | 是 |
| 内容类型 | `application/json` |

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 400002 | 400 | 执行记录已完成，无法取消 |
| 404001 | 404 | 执行记录不存在 |
| 500001 | 500 | 创建执行失败 |
| 500002 | 500 | 获取执行详情失败 |

---

## 接口列表

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/executions` | 获取执行记录列表 |
| GET | `/executions/:id` | 获取执行记录详情 |
| POST | `/executions` | 创建执行记录 |
| POST | `/executions/:id/cancel` | 取消执行 |
| POST | `/executions/:id/retry` | 重试执行 |
| GET | `/executions/:id/logs` | 获取执行日志 |
| GET | `/executions/:id/logs/download` | 下载日志文件 |
| GET | `/executions/:id/artifacts` | 获取执行产物 |
| GET | `/executions/:id/trace` | 获取执行轨迹 |
| GET | `/executions/summary` | 获取执行摘要 |
| GET | `/executions/stats` | 获取执行统计 |

---

## 执行状态枚举

| 值 | 说明 | 进度 |
|----|------|------|
| `pending` | 等待中 | 0% |
| `queued` | 队列中 | 0% |
| `running` | 运行中 | 1-99% |
| `completed` | 已完成 | 100% |
| `failed` | 失败 | 100% |
| `cancelled` | 已取消 | 100% |
| `timeout` | 超时 | 100% |

---

## 1. 获取执行记录列表

### 请求

```http
GET /api/v1/executions?page=1&page_size=20&benchmark_id=bm_001&agent_id=agent_001&status=running
Authorization: Bearer {access_token}
```

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| page_size | int | 20 | 每页数量（最大1000） |
| benchmark_id | string | - | Benchmark ID 筛选 |
| agent_id | string | - | Agent ID 筛选 |
| status | string[] | - | 状态筛选（可多选） |
| priority | string[] | - | 优先级筛选 |
| success | boolean | - | 成功状态筛选 |
| started_after | string | - | 开始时间之后（ISO 8601） |
| started_before | string | - | 开始时间之前（ISO 8601） |
| order_by | string | created_at | 排序字段 |
| order_dir | asc | desc | 排序方向 |

### 响应

```typescript
interface PaginatedResponse {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    data: ExecutionSummary[];
  };
}

interface ExecutionSummary {
  id: string;
  benchmark_id: string;
  benchmark_name: string;
  agent_id: string;
  agent_name: string;
  status: ExecutionStatus;
  progress?: ExecutionProgress;
  result?: ExecutionResult;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  created_at: string;
}

interface ExecutionProgress {
  current_step: number;
  total_steps: number;
  percentage: number;
  message: string;
}
```

---

## 2. 获取执行记录详情

### 请求

```http
GET /api/v1/executions/:id
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface ExecutionDetailResponse {
  code: number;
  message: string;
  data: ExecutionDetail;
}

interface ExecutionDetail {
  id: string;
  benchmark_id: string;
  benchmark_name: string;
  agent_id: string;
  agent_name: string;
  status: ExecutionStatus;
  progress: ExecutionProgress;
  result: ExecutionResult;
  logs: LogEntry[];
  artifacts: Artifact[];
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  created_at: string;
}
```

---

## 3. 创建执行记录

### 请求

```http
POST /api/v1/executions
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface CreateExecutionRequest {
  benchmark_id: string;           // 必填
  agent_id: string;               // 必填
  priority?: string;              // p0 | p1 | p2 | p3，默认 p2
  task_config?: {
    max_steps?: number;
    timeout?: number;             // 纳秒
    temperature?: number;
    max_tokens?: number;
  };
  agent_config?: {
    temperature?: number;
    max_tokens?: number;
  };
  organization_id?: string;
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": { /* ExecutionDetail 对象 */ }
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 500001 | 500 | 创建执行失败 |

---

## 4. 取消执行

### 请求

```http
POST /api/v1/executions/:id/cancel
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": string,
    "status": "cancelled"
  }
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 404001 | 404 | 执行记录不存在 |
| 400002 | 400 | 执行记录已完成，无法取消 |

---

## 5. 重试执行

### 请求

```http
POST /api/v1/executions/:id/retry
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": string,              // 新的 execution_id
    "original_id": string
  }
}
```

---

## 6. 获取执行日志

### 请求

```http
GET /api/v1/executions/:id/logs?page=1&page_size=100&level=info
Authorization: Bearer {access_token}
```

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| page_size | int | 100 | 每页数量（最大1000） |
| level | string | - | 日志级别筛选 (debug | info | warn | error) |

### 响应

```typescript
interface LogsResponse {
  code: number;
  message: string;
  data: {
    logs: LogEntry[];
    total: number;
    page: number;
    size: number;
  };
}

interface LogEntry {
  timestamp: string;            // ISO 8601
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  source?: string;              // 日志来源
}
```

---

## 7. 下载日志文件

### 请求

```http
GET /api/v1/executions/:id/logs/download
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

- Content-Type: `text/plain`
- Content-Disposition: `attachment; filename="execution-{id}-logs.txt"`

---

## 8. 获取执行产物

### 请求

```http
GET /api/v1/executions/:id/artifacts
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface ArtifactsResponse {
  code: number;
  message: "success";
  data: Artifact[];
}

interface Artifact {
  name: string;
  path: string;
  size: number;
  download_url: string;
  created_at: string;
}
```

---

## 9. 获取执行轨迹

### 请求

```http
GET /api/v1/executions/:id/trace
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface ExecutionTraceResponse {
  code: number;
  message: string;
  data: ExecutionTrace[];
}

interface ExecutionTrace {
  id: number;
  record_id: string;
  step_index: number;
  step_type: string;      // reasoning | tool_call | observation | correction
  action: string;
  input: string;
  output: string;
  error: string;
  duration: number;       // 毫秒
  timestamp: string;
  reasoning: string;
}
```

---

## 10. 获取执行摘要

### 请求

```http
GET /api/v1/executions/summary?benchmark_id=bm_001&agent_id=agent_001
Authorization: Bearer {access_token}
```

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| benchmark_id | string | Benchmark ID 筛选 |
| agent_id | string | Agent ID 筛选 |

### 响应

```typescript
interface ExecutionSummaryResponse {
  code: number;
  message: string;
  data: ExecutionSummary;
}

interface ExecutionSummary {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  timeout: number;
  cancelled: number;
  success_rate: number;
  avg_duration: number;  // 毫秒
}
```

---

## 11. 获取执行统计

### 请求

```http
GET /api/v1/executions/stats
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface ExecutionStatsResponse {
  code: number;
  message: "success";
  data: ExecutionStats;
}

interface ExecutionStats {
  total_executions: number;
  status_distribution: Record<ExecutionStatus, number>;
  avg_duration: number;
  total_tokens_used: number;
  total_cost: number;
  success_rate: number;
  most_common_errors: Array<{
    error: string;
    count: number;
  }>;
}
```

---

## TypeScript 类型定义

```typescript
// src/types/api/execution.ts

export type ExecutionStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';

export interface ExecutionSummary {
  id: string;
  benchmark_id: string;
  benchmark_name: string;
  agent_id: string;
  agent_name: string;
  status: ExecutionStatus;
  progress?: ExecutionProgress;
  result?: ExecutionResult;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  created_at: string;
}

export interface ExecutionDetail {
  id: string;
  benchmark_id: string;
  benchmark_name: string;
  agent_id: string;
  agent_name: string;
  status: ExecutionStatus;
  progress: ExecutionProgress;
  result: ExecutionResult;
  logs: LogEntry[];
  artifacts: Artifact[];
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  created_at: string;
}

export interface ExecutionProgress {
  current_step: number;
  total_steps: number;
  percentage: number;  // 0-100
  message: string;
}

export interface ExecutionResult {
  success: boolean;
  exit_code: number;
  output: string;
  error?: string;
  duration_ms: number;
  tokens_used: number;
  cost: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  source?: string;
}

export interface Artifact {
  name: string;
  path: string;
  size: number;
  download_url: string;
  created_at: string;
}

export interface CreateExecutionRequest {
  benchmark_id: string;
  agent_id: string;
  priority?: 'p0' | 'p1' | 'p2' | 'p3';
  task_config?: TaskConfig;
  agent_config?: AgentConfig;
  organization_id?: string;
}

export interface TaskConfig {
  max_steps?: number;
  timeout?: number;
  temperature?: number;
  max_tokens?: number;
}

export interface AgentConfig {
  temperature?: number;
  max_tokens?: number;
}

export interface ExecutionFilter {
  page?: number;
  page_size?: number;
  benchmark_id?: string;
  agent_id?: string;
  status?: ExecutionStatus[];
  priority?: string[];
  success?: boolean;
  started_after?: string;
  started_before?: string;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
}
```
