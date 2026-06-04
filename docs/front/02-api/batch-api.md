# 批量执行接口

## 基础信息

| 项目 | 值 |
|------|------|
| 基础路径 | `/api/v1/batch-executions` |
| 需要认证 | 是 |
| 内容类型 | `application/json` |

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 400001 | 400 | 请求参数无效 |
| 400002 | 400 | 批量执行 ID 必填 |
| 400003 | 400 | 批量执行 ID 必填（取消操作） |
| 400004 | 400 | 批量执行已完成，无法取消 |
| 400005 | 400 | 批量执行 ID 必填（获取任务） |
| 400006 | 400 | 批量执行 ID 必填（获取报告） |
| 404001 | 404 | 批量执行不存在 |
| 404002 | 404 | 批量执行不存在（取消操作） |
| 404003 | 404 | 报告不存在 |
| 409001 | 409 | 批量执行名称已存在 |
| 500001-500006 | 500 | 服务器内部错误 |

---

## 接口列表

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/batch-executions` | 创建批量执行 |
| GET | `/batch-executions` | 获取批量执行列表 |
| GET | `/batch-executions/:id` | 获取批量执行详情 |
| POST | `/batch-executions/:id/cancel` | 取消批量执行 |
| GET | `/batch-executions/:id/tasks` | 获取批量任务列表 |
| GET | `/batch-executions/:id/report` | 获取批量执行报告 |

---

## 批量执行状态枚举

| 值 | 说明 |
|----|------|
| `pending` | 等待中 |
| `running` | 运行中 |
| `completed` | 已完成 |
| `failed` | 失败 |
| `cancelled` | 已取消 |

---

## 批量任务状态枚举

| 值 | 说明 |
|----|------|
| `pending` | 等待中 |
| `running` | 运行中 |
| `completed` | 已完成 |
| `failed` | 失败 |
| `skipped` | 已跳过 |

---

## 优先级枚举

| 值 | 说明 |
|----|------|
| `p0` | 最高优先级 |
| `p1` | 高优先级 |
| `p2` | 默认优先级 |
| `p3` | 低优先级 |
| `p4` | 最低优先级 |

---

## 1. 创建批量执行

### 请求

```http
POST /api/v1/batch-executions
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface CreateBatchRequest {
  name: string;                    // 名称（必填，1-255字符）
  description?: string;             // 描述
  agent_ids: string[];             // Agent ID 列表（必填，最多100个）
  benchmark_ids: string[];         // Benchmark ID 列表（必填，最多100个）
  task_config?: TaskConfig;        // 任务配置
  agent_config?: AgentConfig;      // Agent 配置
  options?: BatchOptions;          // 批量执行选项
  organization_id?: string;        // 组织 ID
}

interface TaskConfig {
  max_steps: number;               // 最大步数
  timeout: number;                 // 超时时间（纳秒）
  priority: string;                // 优先级（p0-p4）
}

interface AgentConfig {
  temperature: number;             // 温度参数
  max_tokens: number;              // 最大 tokens
}

interface BatchOptions {
  parallel: boolean;               // 是否并行执行（默认 true）
  max_parallel: number;            // 最大并行数（默认 10，范围 1-50）
  stop_on_first_failure: boolean;  // 首次失败时停止（默认 false）
  generate_report: boolean;        // 是否生成报告（默认 true）
}
```

### 响应

**成功响应（200）：**

```typescript
interface CreateBatchResponse {
  code: number;
  message: string;
  data: {
    id: string;
    name: string;
    status: BatchStatus;
    total_tasks: number;
    pending_tasks: number;
    running_tasks: number;
    completed_tasks: number;
    failed_tasks: number;
    created_at: number;            // Unix 时间戳
  };
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 400001 | 400 | 请求参数无效 |
| 409001 | 409 | 批量执行名称已存在 |
| 500001 | 500 | 创建失败 |

---

## 2. 获取批量执行列表

### 请求

```http
GET /api/v1/batch-executions?status=running&page=1&page_size=20
Authorization: Bearer {access_token}
```

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| status | string | - | 状态筛选（pending/running/completed/failed/cancelled） |
| page | int | 1 | 页码 |
| page_size | int | 20 | 每页数量（最大100） |

### 响应

```typescript
interface ListBatchesResponse {
  code: number;
  message: string;
  data: {
    data: BatchSummary[];
    total: number;
    page: number;
    size: number;
  };
}

interface BatchSummary {
  id: string;
  name: string;
  status: BatchStatus;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  progress: number;               // 完成百分比
  created_by: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}
```

---

## 3. 获取批量执行详情

### 请求

```http
GET /api/v1/batch-executions/:id
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface GetBatchResponse {
  code: number;
  message: string;
  data: {
    batch_execution: BatchExecution;
    progress_percentage: number;
  };
}

interface BatchExecution {
  id: string;
  name: string;
  description: string;
  agent_ids: string[];
  benchmark_ids: string[];
  task_config: TaskConfig;
  agent_config: AgentConfig;
  options: BatchOptions;
  status: BatchStatus;
  total_tasks: number;
  pending_tasks: number;
  running_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  created_by: string;
  organization_id?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  report_id?: string;
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 400002 | 400 | 批量执行 ID 必填 |
| 404001 | 404 | 批量执行不存在 |
| 500002 | 500 | 获取失败 |

---

## 4. 取消批量执行

### 请求

```http
POST /api/v1/batch-executions/:id/cancel
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

```typescript
interface CancelBatchResponse {
  code: number;
  message: string;
  data: {
    id: string;
    status: BatchStatus;
  };
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 400003 | 400 | 批量执行 ID 必填 |
| 400004 | 400 | 批量执行已完成，无法取消 |
| 404002 | 404 | 批量执行不存在 |
| 500004 | 500 | 取消失败 |

---

## 5. 获取批量任务列表

### 请求

```http
GET /api/v1/batch-executions/:id/tasks?agent_id=agent_001&benchmark_id=bm_001&status=running&page=1&page_size=20
Authorization: Bearer {access_token}
```

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| agent_id | string | - | Agent ID 筛选 |
| benchmark_id | string | - | Benchmark ID 筛选 |
| status | string[] | - | 状态筛选（可多选） |
| page | int | 1 | 页码 |
| page_size | int | 20 | 每页数量（最大1000） |
| order_by | string | created_at | 排序字段 |
| order_dir | string | desc | 排序方向 |

### 响应

```typescript
interface GetBatchTasksResponse {
  code: number;
  message: string;
  data: {
    data: BatchTaskProgress[];
    total: number;
    page: number;
    size: number;
  };
}

interface BatchTaskProgress {
  task_id: string;
  agent_id: string;
  benchmark_id: string;
  status: BatchTaskStatus;
  error?: string;
  started_at?: string;
  completed_at?: string;
  duration?: number;              // 毫秒
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 400005 | 400 | 批量执行 ID 必填 |
| 500005 | 500 | 获取任务列表失败 |

---

## 6. 获取批量执行报告

### 请求

```http
GET /api/v1/batch-executions/:id/report
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface GetReportResponse {
  code: number;
  message: string;
  data: BatchReport;
}

interface BatchReport {
  id: string;
  batch_id: string;
  // 总体统计
  summary: BatchSummaryReport;
  // 详细对比
  agent_comparison: AgentComparison[];
  benchmark_comparison: BenchmarkComparison[];
  // 成本统计
  cost_summary: CostSummary;
  // 排名
  rankings: Rankings;
  // 可视化数据
  charts_data: Record<string, any>;
  created_at: string;
}

interface BatchSummaryReport {
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  success_rate: number;
  avg_duration: number;           // 毫秒
  total_cost: number;
  min_duration: number;           // 毫秒
  max_duration: number;           // 毫秒
}

interface AgentComparison {
  agent_id: string;
  agent_name: string;
  total_executions: number;
  success_count: number;
  failed_count: number;
  success_rate: number;
  avg_duration: number;           // 毫秒
  min_duration: number;           // 毫秒
  max_duration: number;           // 毫秒
  total_tokens: number;
  total_cost: number;
  benchmark_stats: Record<string, BenchmarkStats>;
}

interface BenchmarkStats {
  total_executions: number;
  success_count: number;
  failed_count: number;
  success_rate: number;
  avg_duration: number;
}

interface BenchmarkComparison {
  benchmark_id: string;
  benchmark_name: string;
  total_executions: number;
  success_count: number;
  failed_count: number;
  success_rate: number;
  avg_duration: number;
  agent_stats: Record<string, AgentStats>;
}

interface AgentStats {
  success_count: number;
  failed_count: number;
  success_rate: number;
  avg_duration: number;
  tokens_used: number;
  cost: number;
}

interface CostSummary {
  total_cost: number;
  currency: string;
  cost_by_agent: Record<string, number>;
  cost_by_benchmark: Record<string, number>;
}

interface Rankings {
  by_success_rate: AgentRanking[];
  by_speed: AgentRanking[];
  by_cost: AgentRanking[];
  by_tokens: AgentRanking[];
}

interface AgentRanking {
  rank: number;
  agent_id: string;
  agent_name: string;
  value: number;
  unit: string;                   // "%", "ms", "USD", "tokens"
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 400006 | 400 | 批量执行 ID 必填 |
| 404003 | 404 | 报告不存在 |
| 500006 | 500 | 获取报告失败 |

---

## WebSocket 进度推送

批量执行进度会通过 WebSocket 实时推送：

```typescript
// 订阅批量执行进度
{
  "event": "batch_progress",
  "data": {
    "batch_id": "batch_123",
    "task_id": "task_456",        // 可选，特定任务更新
    "agent_id": "agent_001",      // 可选
    "benchmark_id": "bm_001",     // 可选
    "status": "running",
    "completed_count": 5,
    "total_count": 10,
    "percentage": 50.0,
    "timestamp": 1704067200000    // Unix 时间戳（毫秒）
  }
}

// 批量执行状态变更
{
  "event": "batch_status_change",
  "data": {
    "batch_id": "batch_123",
    "status": "completed",
    "timestamp": 1704067200000
  }
}

// 批量执行完成
{
  "event": "batch_completed",
  "data": {
    "batch_id": "batch_123",
    "report_id": "report_789",
    "timestamp": 1704067200000
  }
}

// 批量执行失败
{
  "event": "batch_failed",
  "data": {
    "batch_id": "batch_123",
    "error": "execution failed",
    "timestamp": 1704067200000
  }
}
```

---

## TypeScript 类型定义

```typescript
// src/types/api/batch.ts

export type BatchStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type BatchTaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export type BatchPriority = 'p0' | 'p1' | 'p2' | 'p3' | 'p4';

export interface CreateBatchRequest {
  name: string;
  description?: string;
  agent_ids: string[];
  benchmark_ids: string[];
  task_config?: TaskConfig;
  agent_config?: AgentConfig;
  options?: BatchOptions;
  organization_id?: string;
}

export interface TaskConfig {
  max_steps: number;
  timeout: number;                 // 纳秒
  priority: BatchPriority;
}

export interface AgentConfig {
  temperature: number;
  max_tokens: number;
}

export interface BatchOptions {
  parallel: boolean;
  max_parallel: number;
  stop_on_first_failure: boolean;
  generate_report: boolean;
}

export interface CreateBatchResponse {
  id: string;
  name: string;
  status: BatchStatus;
  total_tasks: number;
  pending_tasks: number;
  running_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  created_at: number;
}

export interface BatchSummary {
  id: string;
  name: string;
  status: BatchStatus;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  progress: number;
  created_by: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface BatchExecution {
  id: string;
  name: string;
  description: string;
  agent_ids: string[];
  benchmark_ids: string[];
  task_config: TaskConfig;
  agent_config: AgentConfig;
  options: BatchOptions;
  status: BatchStatus;
  total_tasks: number;
  pending_tasks: number;
  running_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  created_by: string;
  organization_id?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  report_id?: string;
}

export interface GetBatchResponse {
  batch_execution: BatchExecution;
  progress_percentage: number;
}

export interface BatchTaskProgress {
  task_id: string;
  agent_id: string;
  benchmark_id: string;
  status: BatchTaskStatus;
  error?: string;
  started_at?: string;
  completed_at?: string;
  duration?: number;
}

export interface CancelBatchResponse {
  id: string;
  status: BatchStatus;
}

export interface BatchReport {
  id: string;
  batch_id: string;
  summary: BatchSummaryReport;
  agent_comparison: AgentComparison[];
  benchmark_comparison: BenchmarkComparison[];
  cost_summary: CostSummary;
  rankings: Rankings;
  charts_data: Record<string, any>;
  created_at: string;
}

export interface BatchSummaryReport {
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  success_rate: number;
  avg_duration: number;
  total_cost: number;
  min_duration: number;
  max_duration: number;
}

export interface AgentComparison {
  agent_id: string;
  agent_name: string;
  total_executions: number;
  success_count: number;
  failed_count: number;
  success_rate: number;
  avg_duration: number;
  min_duration: number;
  max_duration: number;
  total_tokens: number;
  total_cost: number;
  benchmark_stats: Record<string, BenchmarkStats>;
}

export interface BenchmarkStats {
  total_executions: number;
  success_count: number;
  failed_count: number;
  success_rate: number;
  avg_duration: number;
}

export interface BenchmarkComparison {
  benchmark_id: string;
  benchmark_name: string;
  total_executions: number;
  success_count: number;
  failed_count: number;
  success_rate: number;
  avg_duration: number;
  agent_stats: Record<string, AgentStats>;
}

export interface AgentStats {
  success_count: number;
  failed_count: number;
  success_rate: number;
  avg_duration: number;
  tokens_used: number;
  cost: number;
}

export interface CostSummary {
  total_cost: number;
  currency: string;
  cost_by_agent: Record<string, number>;
  cost_by_benchmark: Record<string, number>;
}

export interface Rankings {
  by_success_rate: AgentRanking[];
  by_speed: AgentRanking[];
  by_cost: AgentRanking[];
  by_tokens: AgentRanking[];
}

export interface AgentRanking {
  rank: number;
  agent_id: string;
  agent_name: string;
  value: number;
  unit: string;
}

export interface BatchFilter {
  status?: BatchStatus;
  created_by?: string;
  page?: number;
  page_size?: number;
  order_by?: string;
  order_dir?: string;
}

export interface BatchTaskFilter {
  agent_id?: string;
  benchmark_id?: string;
  status?: BatchTaskStatus[];
  page?: number;
  page_size?: number;
  order_by?: string;
  order_dir?: string;
}

// WebSocket 事件类型
export interface BatchProgressEvent {
  batch_id: string;
  task_id?: string;
  agent_id?: string;
  benchmark_id?: string;
  status: string;
  completed_count: number;
  total_count: number;
  percentage: number;
  timestamp: number;
}

export interface BatchStatusChangeEvent {
  batch_id: string;
  status: BatchStatus;
  timestamp: number;
}

export interface BatchCompletedEvent {
  batch_id: string;
  report_id: string;
  timestamp: number;
}

export interface BatchFailedEvent {
  batch_id: string;
  error: string;
  timestamp: number;
}

// 错误码
export const BatchErrorCode = {
  INVALID_PARAMS: 400001,
  ID_REQUIRED: 400002,
  ID_REQUIRED_CANCEL: 400003,
  ALREADY_COMPLETED: 400004,
  ID_REQUIRED_TASKS: 400005,
  ID_REQUIRED_REPORT: 400006,
  NOT_FOUND: 404001,
  NOT_FOUND_CANCEL: 404002,
  REPORT_NOT_FOUND: 404003,
  NAME_EXISTS: 409001,
} as const;
```
