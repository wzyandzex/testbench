# 任务执行

## 概述

**业务目标**: 创建和监控代码评测任务的执行

**涉及角色**: 普通用户、管理员

**前置条件**: 用户已登录，存在可用的 Benchmark 和 Agent

---

## 流程 1: 单次执行

### 步骤 1: 用户选择执行配置

**用户操作**: 用户在 Benchmark 详情页点击"执行"按钮

**前端行为**:
- 打开执行配置对话框
- 初始化表单:
  ```typescript
  {
    benchmark_id: string,    // 从上下文获取
    agent_id: string,         // 必选，下拉选择可用 Agent
    priority: "p1" | "p2" | "p3",  // 默认 p2
    config?: {
      max_steps?: number,
      timeout?: number,
      temperature?: number,
      max_tokens?: number
    }
  }
  ```
- 加载可用 Agent 列表:
  - API: `GET /api/v1/agents?status=active`

### 步骤 2: 用户提交执行

**用户操作**: 用户选择 Agent 后点击"执行"

**前端行为**:
- API 请求: `POST /api/v1/executions`
- 请求体:
  ```typescript
  {
    benchmark_id: string,
    agent_id: string,
    priority?: string,
    config?: object
  }
  ```

**后端响应**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    id: string,
    benchmark_id: string,
    agent_id: string,
    status: "pending",
    created_at: string
  }
}
```

**状态变化**:
```typescript
submitting = true

// 成功后
message.success("任务已提交")
navigate(`/executions/${data.id}`)
// 订阅 WebSocket 进度
subscribeExecutionProgress(data.id)
submitting = false
```

### 步骤 3: 实时进度跟踪

**前端行为**:
- WebSocket 连接: `ws://notifier:8005/ws`
- 订阅执行:
  ```typescript
  {
    event: "subscribe",
    filters: {
      execution_id: string
    }
  }
  ```

**WebSocket 推送消息**:

| 事件 | 数据结构 | 说明 |
|------|---------|------|
| `execution_created` | `{ execution_id, ... }` | 执行创建 |
| `execution_status` | `{ execution_id, status, ... }` | 状态变更 |
| `execution_progress` | `{ execution_id, progress, message, ... }` | 进度更新 |
| `execution_step` | `{ execution_id, step_number, step_output, ... }` | 步骤输出 |
| `execution_log` | `{ execution_id, log_level, log_message, timestamp }` | 日志输出 |
| `execution_completed` | `{ execution_id, result, ... }` | 执行完成 |
| `execution_failed` | `{ execution_id, error, ... }` | 执行失败 |

**进度计算**:
```typescript
interface ExecutionProgress {
  execution_id: string
  status: ExecutionStatus
  progress: number          // 0-100
  current_step: number
  total_steps: number
  message: string
  started_at: string
  updated_at: string
}

type ExecutionStatus =
  | "pending"    // 0%
  | "queued"     // 0%
  | "running"    // 1-99%
  | "completed"  // 100%
  | "failed"     // 100%
  | "cancelled"  // 100%
  | "timeout"    // 100%
```

**前端处理**:
```typescript
const wsStore = useWSStore()

// 订阅
wsStore.subscribe(executionId, (message) => {
  switch (message.event) {
    case 'execution_progress':
      setProgress(message.data.progress)
      setMessage(message.data.message)
      break
    case 'execution_log':
      appendLog(message.data)
      break
    case 'execution_completed':
      setResult(message.data.result)
      setStatus('completed')
      break
    case 'execution_failed':
      setError(message.data.error)
      setStatus('failed')
      break
  }
})
```

### 步骤 4: 查看执行详情

**用户操作**: 用户查看执行详情页面

**前端行为**:
- API 请求: `GET /api/v1/executions/:id`
- 响应:
  ```typescript
  {
    code: 0,
    message: "success",
    data: {
      id: string,
      benchmark_id: string,
      benchmark_name: string,
      agent_id: string,
      agent_name: string,
      status: ExecutionStatus,
      result: {
        success: boolean,
        exit_code: number,
        output: string,
        error?: string,
        duration_ms: number,
        tokens_used: number,
        cost: number
      },
      progress: {
        current_step: number,
        total_steps: number,
        percentage: number,
        message: string
      },
      logs: LogEntry[],
      artifacts: Artifact[],
      started_at: string,
      completed_at?: string,
      created_at: string
    }
  }
  ```

**页面展示**:
1. 状态卡片: 状态、进度条、耗时
2. 结果卡片: 成功/失败、输出、错误信息
3. 日志面板: 分级别显示日志
4. 产物列表: 下载链接

### 步骤 5: 取消执行

**用户操作**: 用户点击"取消"按钮（仅在 status=running 时可用）

**前端行为**:
- 确认对话框
- API 请求: `POST /api/v1/executions/:id/cancel`

**后端响应**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    id: string,
    status: "cancelled"
  }
}
```

---

## 流程 2: 批量执行

### 步骤 1: 用户创建批量任务

**用户操作**: 用户点击"批量执行"按钮

**前端行为**:
- 打开批量执行对话框
- 表单:
  ```typescript
  interface CreateBatchRequest {
    name: string                    // 必填，1-255 字符
    description?: string
    agent_ids: string[]             // 必填，最多 100 个
    benchmark_ids: string[]         // 必填，最多 100 个
    task_config?: {
      max_steps: number
      timeout: number               // 纳秒
      priority: "p0" | "p1" | "p2" | "p3" | "p4"
    }
    agent_config?: {
      temperature: number
      max_tokens: number
    }
    options?: {
      parallel: boolean             // 默认 true
      max_parallel: number          // 默认 10，范围 1-50
      stop_on_first_failure: boolean
      generate_report: boolean      // 默认 true
    }
    organization_id?: string
  }
  ```

### 步骤 2: 提交批量任务

**用户操作**: 用户配置完成后点击"创建"

**前端行为**:
- API 请求: `POST /api/v1/batch-executions`
- 请求体: 上述表单数据

**后端响应**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    id: string,
    name: string,
    status: "pending",
    total_tasks: number,
    pending_tasks: number,
    running_tasks: number,
    completed_tasks: number,
    failed_tasks: number,
    created_at: number  // Unix 时间戳
  }
}
```

**状态变化**:
```typescript
submitting = true

// 成功后
message.success(`批量任务已创建，共 ${data.total_tasks} 个子任务`)
navigate(`/batch-executions/${data.id}`)
// 订阅批量进度
subscribeBatchProgress(data.id)
submitting = false
```

### 步骤 3: 跟踪批量执行进度

**WebSocket 推送**:
```typescript
// 批量进度更新
{
  event: "batch_progress",
  data: {
    batch_id: string,
    task_id?: string,           // 特定任务更新
    agent_id?: string,
    benchmark_id?: string,
    status: BatchStatus,
    completed_count: number,
    total_count: number,
    percentage: number,
    timestamp: number
  }
}

// 批量状态变更
{
  event: "batch_status_change",
  data: {
    batch_id: string,
    status: "pending" | "running" | "completed" | "failed" | "cancelled",
    timestamp: number
  }
}

// 批量完成
{
  event: "batch_completed",
  data: {
    batch_id: string,
    report_id: string,
    timestamp: number
  }
}

// 批量失败
{
  event: "batch_failed",
  data: {
    batch_id: string,
    error: string,
    timestamp: number
  }
}
```

**前端进度展示**:
```typescript
interface BatchProgress {
  batch_id: string
  status: BatchStatus
  total_tasks: number
  pending_tasks: number
  running_tasks: number
  completed_tasks: number
  failed_tasks: number
  cancelled_tasks: number
  percentage: number
  started_at?: string
  completed_at?: string
}

type BatchStatus =
  | "pending"    // 等待中
  | "running"    // 运行中
  | "completed"  // 已完成
  | "failed"     // 失败
  | "cancelled"  // 已取消
```

### 步骤 4: 查看批量任务列表

**用户操作**: 用户查看批量执行中的子任务

**前端行为**:
- API 请求: `GET /api/v1/batch-executions/:id/tasks`
- 查询参数:
  - `agent_id`: Agent 筛选
  - `benchmark_id`: Benchmark 筛选
  - `status`: 状态筛选（可多选）
  - `page`, `page_size`: 分页
  - `order_by`, `order_dir`: 排序

**响应**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    data: BatchTask[],
    total: number,
    page: number,
    size: number
  }
}

interface BatchTask {
  task_id: string
  agent_id: string
  benchmark_id: string
  status: "pending" | "running" | "completed" | "failed" | "skipped"
  error?: string
  started_at?: string
  completed_at?: string
  duration?: number  // 毫秒
}
```

### 步骤 5: 查看批量报告

**用户操作**: 用户在批量完成后点击"查看报告"

**前端行为**:
- API 请求: `GET /api/v1/batch-executions/:id/report`

**响应**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    id: string,
    batch_id: string,
    summary: {
      total_tasks: number
      completed_tasks: number
      failed_tasks: number
      success_rate: number
      avg_duration: number
      total_cost: number
    },
    agent_comparison: AgentComparison[],
    benchmark_comparison: BenchmarkComparison[],
    cost_summary: {
      total_cost: number
      currency: string
      cost_by_agent: Record<string, number>
      cost_by_benchmark: Record<string, number>
    },
    rankings: {
      by_success_rate: AgentRanking[]
      by_speed: AgentRanking[]
      by_cost: AgentRanking[]
      by_tokens: AgentRanking[]
    },
    charts_data: Record<string, any>,
    created_at: string
  }
}
```

### 步骤 6: 取消批量执行

**用户操作**: 用户点击"取消批量任务"

**前端行为**:
- 确认对话框: "确定要取消批量任务吗？已完成和运行中的任务不受影响。"
- API 请求: `POST /api/v1/batch-executions/:id/cancel`

**响应**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    id: string,
    status: "cancelled"
  }
}
```

---

## 流程 3: 重试失败任务

### 步骤 1: 用户重试单次执行

**用户操作**: 用户在失败任务详情页点击"重试"

**前端行为**:
- 确认对话框
- API 请求: `POST /api/v1/executions/:id/retry`

**响应**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    id: string,  // 新的 execution_id
    original_id: string
  }
}
```

---

## 异常场景处理

### Agent 不可用
- 提示"所选 Agent 不可用，请选择其他 Agent"
- 禁用不可用的 Agent 选项

### WebSocket 断线
- 自动重连
- 显示"连接断开，正在重连..."
- 重连后重新订阅

### 任务超时
- 显示"任务执行超时"
- 提供重试选项

### 批量任务部分失败
- 高亮失败任务
- 提供"仅重试失败任务"选项

---

## 相关页面

- [执行列表页](../02-pages/execution-list.md)
- [执行详情页](../02-pages/execution-detail.md)
- [批量执行页](../02-pages/batch-execution.md)
- [批量报告页](../02-pages/batch-report.md)

## 相关 API

- [Execution API](../03-api/execution-api.md)
- [Batch API](../03-api/batch-api.md)
- [WebSocket API](../03-api/websocket-api.md)
