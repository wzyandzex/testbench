# 定时任务

## 概述

**业务目标**: 创建和管理定时执行的 Benchmark 任务

**涉及角色**: 普通用户、管理员

**前置条件**: 用户已登录

---

## 流程 1: 创建定时任务

### 步骤 1: 用户打开创建页面

**用户操作**: 用户点击"新建定时任务"按钮

**前端行为**:
- 导航到 `/scheduled-tasks/create`
- 初始化表单状态:
  ```typescript
  const [form] = Form.useForm()
  const initialValues = {
    name: '',
    description: '',
    benchmark_ids: [],
    agent_ids: [],
    schedule_config: {
      cron_expression: '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      start_date: null,
      end_date: null
    },
    execution_config: {
      priority: 'p2',
      timeout: 3600000000000,  // 1小时，纳秒
      max_steps: 100
    },
    notification_config: {
      enabled: true,
      on_success: true,
      on_failure: true,
      channels: ['web']
    },
    retry_config: {
      enabled: false,
      max_retries: 3,
      backoff_multiplier: 2
    },
    enabled: true,
    organization_id: currentOrg?.id
  }
  ```

### 步骤 2: 配置基本信息

**用户操作**: 用户填写名称、描述

**前端行为 - 字段校验**:

| 字段 | 校验规则 |
|------|----------|
| name | 必填，1-100 字符，同一组织内唯一 |
| description | 可选，最多 500 字符 |

### 步骤 3: 选择 Benchmark 和 Agent

**用户操作**: 用户选择要执行的 Benchmark 和 Agent

**前端行为**:
- 加载可用 Benchmark: `GET /api/v1/benchmarks?status=active`
- 加载可用 Agent: `GET /api/v1/agents?status=active`
- 多选支持

### 步骤 4: 配置调度规则

**用户操作**: 用户配置 cron 表达式

**前端行为**:
- Cron 表达式输入组件
- 预设选项:
  - 每 5 分钟: `*/5 * * * *`
  - 每小时: `0 * * * *`
  - 每天 0 点: `0 0 * * *`
  - 每周一 0 点: `0 0 * * 1`
  - 每月 1 号 0 点: `0 0 1 * *`
- 下次执行时间预览
- 时区选择

### 步骤 5: 配置重试规则

**用户操作**: 用户配置失败重试

**前端行为**:
- 表单:
  ```typescript
  {
    enabled: boolean,
    max_retries: number,      // 1-10
    backoff_multiplier: number // 1-5
  }
  ```

### 步骤 6: 配置通知

**用户操作**: 用户配置通知规则

**前端行为**:
- 表单:
  ```typescript
  {
    enabled: boolean,
    on_success: boolean,      // 成功时通知
    on_failure: boolean,      // 失败时通知
    channels: ('web' | 'email')[]
  }
  ```

### 步骤 7: 提交创建

**用户操作**: 用户点击"创建"按钮

**前端行为**:
- 表单校验
- API 请求: `POST /api/v1/scheduled-tasks`
- 请求体: 完整的 ScheduledTask 对象

**后端响应**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    id: string,
    name: string,
    status: "active" | "paused",
    next_run_time: string,
    created_at: string
  }
}
```

**状态变化**:
```typescript
loading = true

// 成功后
message.success("定时任务创建成功")
navigate(`/scheduled-tasks/${data.id}`)
loading = false
```

---

## 流程 2: 查看定时任务列表

### 步骤 1: 用户打开列表页

**用户操作**: 用户访问 `/scheduled-tasks`

**前端行为**:
- API 请求: `GET /api/v1/scheduled-tasks?page=1&page_size=20`
- 初始化筛选状态:
  ```typescript
  const filters = {
    status: undefined,
    benchmark_id: undefined
  }
  ```

**响应**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    data: ScheduledTaskSummary[],
    total: number,
    page: number,
    size: number
  }
}

interface ScheduledTaskSummary {
  id: string
  name: string
  description: string
  status: "active" | "paused" | "disabled"
  cron_expression: string
  next_run_time: string
  last_run_time?: string
  execution_count: number
  last_execution_status?: string
  created_at: string
}
```

### 步骤 2: 用户筛选

**前端行为**:
- 支持的筛选参数:
  - `status`: active | paused | disabled
  - `benchmark_id`: 按 Benchmark 筛选

---

## 流程 3: 查看定时任务详情

### 步骤 1: 用户打开详情页

**用户操作**: 用户点击列表中的任务

**前端行为**:
- API 请求: `GET /api/v1/scheduled-tasks/:id`

**响应**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    id: string,
    name: string,
    description: string,
    benchmark_ids: string[],
    agent_ids: string[],
    schedule_config: {
      cron_expression: string,
      timezone: string,
      start_date?: string,
      end_date?: string
    },
    execution_config: {
      priority: string,
      timeout: number,
      max_steps: number
    },
    notification_config: {...},
    retry_config: {...},
    status: string,
    next_run_time: string,
    last_run_time?: string,
    execution_count: number,
    created_by: string,
    created_at: string,
    updated_at: string
  }
}
```

### 步骤 2: 查看执行历史

**前端行为**:
- API 请求: `GET /api/v1/scheduled-tasks/:id/runs?page=1&page_size=10`

**响应**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    data: TaskRun[],
    total: number
  }
}

interface TaskRun {
  id: string,
  scheduled_task_id: string,
  status: "pending" | "running" | "completed" | "failed" | "cancelled",
  scheduled_time: string,
  started_at?: string,
  completed_at?: string,
  duration_ms?: number,
  error?: string,
  execution_count: number,
  success_count: number,
  failure_count: number
}
```

---

## 流程 4: 暂停/恢复定时任务

### 步骤 1: 用户暂停任务

**用户操作**: 用户点击"暂停"按钮

**前端行为**:
- 确认对话框
- API 请求: `POST /api/v1/scheduled-tasks/:id/pause`

**响应**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    id: string,
    status: "paused"
  }
}
```

### 步骤 2: 用户恢复任务

**用户操作**: 用户点击"恢复"按钮

**前端行为**:
- API 请求: `POST /api/v1/scheduled-tasks/:id/resume`

**响应**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    id: string,
    status: "active",
    next_run_time: string
  }
}
```

---

## 流程 5: 立即执行

### 步骤 1: 用户手动触发

**用户操作**: 用户点击"立即执行"按钮

**前端行为**:
- 确认对话框
- API 请求: `POST /api/v1/scheduled-tasks/:id/trigger`

**响应**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    run_id: string,
    status: "pending"
  }
}
```

---

## 流程 6: 编辑定时任务

### 步骤 1: 用户打开编辑页

**用户操作**: 用户点击"编辑"按钮

**前端行为**:
- 导航到 `/scheduled-tasks/:id/edit`
- 加载现有数据
- 禁止修改: `benchmark_ids`, `agent_ids`

### 步骤 2: 保存修改

**前端行为**:
- API 请求: `PUT /api/v1/scheduled-tasks/:id`

---

## 流程 7: 删除定时任务

### 步骤 1: 用户删除任务

**用户操作**: 用户点击"删除"按钮

**前端行为**:
- 确认对话框: "确定要删除定时任务吗？相关执行历史将保留。"
- API 请求: `DELETE /api/v1/scheduled-tasks/:id`

---

## 异常场景处理

### Cron 表达式无效
- 实时校验，显示"无效的 cron 表达式"
- 显示错误说明

### 下次执行时间为空
- 表示定时任务已过期（end_date 已过）
- 显示"此定时任务已过期"

### 执行失败
- 在历史记录中高亮失败记录
- 显示错误信息

---

## 相关页面

- [定时任务页](../02-pages/scheduled-tasks.md)

## 相关 API

- [Scheduled Task API](../03-api/scheduled-task-api.md)
