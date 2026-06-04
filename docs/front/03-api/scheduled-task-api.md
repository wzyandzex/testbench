# 定时任务接口

## 基础信息

| 项目 | 值 |
|------|------|
| 基础路径 | `/api/v1/scheduled-tasks` |
| 需要认证 | 是 |
| 内容类型 | `application/json` |

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 400001 | 400 | 请求参数无效 |
| 400002 | 400 | Cron 表达式无效 |
| 401001 | 401 | 未认证 |
| 403001 | 403 | 无权限操作 |
| 404001 | 404 | 定时任务不存在 |
| 409001 | 409 | 定时任务名称已存在 |
| 500001 | 500 | 服务器内部错误 |

---

## 接口列表

### 任务管理

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/scheduled-tasks` | 创建定时任务 |
| GET | `/scheduled-tasks` | 获取定时任务列表 |
| GET | `/scheduled-tasks/:id` | 获取定时任务详情 |
| PUT | `/scheduled-tasks/:id` | 更新定时任务 |
| DELETE | `/scheduled-tasks/:id` | 删除定时任务 |

### 任务控制

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/scheduled-tasks/:id/trigger` | 立即触发执行 |
| POST | `/scheduled-tasks/:id/pause` | 暂停定时任务 |
| POST | `/scheduled-tasks/:id/resume` | 恢复定时任务 |
| PATCH | `/scheduled-tasks/:id/status` | 更新任务状态 |

### 执行历史

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/scheduled-tasks/:id/runs` | 获取任务执行历史 |
| GET | `/scheduled-tasks/:id/runs/:run_id` | 获取单次执行详情 |

---

## 定时任务状态枚举

| 值 | 说明 |
|----|------|
| `active` | 活跃 - 按计划执行 |
| `paused` | 暂停 - 已暂停，不会自动执行 |
| `archived` | 已归档 - 不再使用 |

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

## 调度类型枚举

| 值 | 说明 |
|----|------|
| `cron` | Cron 表达式调度 |
| `interval` | 固定间隔调度 |

---

## 重试策略枚举

| 值 | 说明 |
|----|------|
| `fixed` | 固定延迟 |
| `exponential` | 指数退避 |
| `linear` | 线性增长 |

---

## 1. 创建定时任务

### 请求

```http
POST /api/v1/scheduled-tasks
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 任务名称（必填，1-100字符） |
| description | string | 否 | 任务描述 |
| schedule | ScheduleConfig | 是 | 调度配置 |
| execution_config | ExecutionConfig | 是 | 执行配置 |
| retry_config | RetryConfig | 否 | 重试配置 |
| notification_config | NotificationConfig | 否 | 通知配置 |
| enabled | boolean | 否 | 是否启用（默认 true） |

```typescript
interface CreateScheduledTaskRequest {
  name: string;
  description?: string;
  schedule: ScheduleConfig;
  execution_config: ExecutionConfig;
  retry_config?: RetryConfig;
  notification_config?: NotificationConfig;
  enabled?: boolean;
}

interface ScheduleConfig {
  type: 'cron' | 'interval';
  cron_expression?: string;        // type=cron 时必填
  interval_seconds?: number;       // type=interval 时必填
  timezone?: string;               // 时区（默认 Asia/Shanghai）
}

interface ExecutionConfig {
  agent_ids: string[];             // Agent ID 列表（必填）
  benchmark_ids: string[];         // Benchmark ID 列表（必填）
  task_config?: {
    max_steps?: number;
    timeout?: number;              // 纳秒
    priority?: 'p0' | 'p1' | 'p2' | 'p3';
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
  enabled: boolean;
  max_attempts: number;            // 最大重试次数（1-10）
  initial_backoff: number;         // 初始退避时间（秒）
  max_backoff: number;             // 最大退避时间（秒）
  backoff_strategy: 'fixed' | 'exponential' | 'linear';
}

interface NotificationConfig {
  enabled: boolean;
  on_success: boolean;
  on_failure: boolean;
  channels: string[];              // email, webhook
  webhook_url?: string;
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
  retry_config: RetryConfig;
  notification_config: NotificationConfig;
  enabled: boolean;
  status: 'active' | 'paused' | 'archived';
  next_run_time?: string;
  last_run_time?: string;
  last_run_id?: string;
  last_run_status?: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  execution_count: number;
  created_by: string;
  created_by_name: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 400001 | 400 | 请求参数无效 |
| 400002 | 400 | Cron 表达式无效 |
| 409001 | 409 | 定时任务名称已存在 |

### 使用场景

1. **创建定时任务表单**
   ```tsx
   const CreateScheduledTask = () => {
     const [form] = Form.useForm();
     const [agents, setAgents] = useState<Agent[]>([]);
     const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);

     const handleSubmit = async (values: CreateScheduledTaskRequest) => {
       try {
         const response = await api.post('/scheduled-tasks', values);
         message.success('定时任务创建成功');
         navigate(`/scheduled-tasks/${response.data.id}`);
       } catch (error) {
         if (error.code === 400002) {
           message.error('Cron 表达式无效');
         }
       }
     };

     return (
       <Form form={form} layout="vertical" onFinish={handleSubmit}>
         <Form.Item name="name" label="任务名称" rules={[{ required: true }]}>
           <Input placeholder="例如：每日代码评估" />
         </Form.Item>

         <Form.Item name="description" label="描述">
           <TextArea rows={3} placeholder="任务描述..." />
         </Form.Item>

         <Form.Item label="Agent 选择">
           <Form.Item name={['execution_config', 'agent_ids']} rules={[{ required: true }]}>
             <Select mode="multiple" options={agents.map(a => ({ label: a.name, value: a.id }))} />
           </Form.Item>
         </Form.Item>

         <Form.Item label="Benchmark 选择">
           <Form.Item name={['execution_config', 'benchmark_ids']} rules={[{ required: true }]}>
             <Select mode="multiple" options={benchmarks.map(b => ({ label: b.display_name, value: b.id }))} />
           </Form.Item>
         </Form.Item>

         <Form.Item label="Cron 表达式">
           <Form.Item name={['schedule', 'cron_expression']} rules={[{ required: true }]}>
             <Space.Compact style={{ width: '100%' }}>
               <Input placeholder="0 0 * * *" />
               <Select
                 defaultValue={[]}
                 style={{ width: 200 }}
                 onChange={(value) => form.setFieldValue(['schedule', 'cron_expression'], value)}
               >
                 <Select.Option value="*/5 * * * *">每5分钟</Select.Option>
                 <Select.Option value="0 * * * *">每小时</Select.Option>
                 <Select.Option value="0 0 * * *">每天0点</Select.Option>
                 <Select.Option value="0 0 * * 1">每周一0点</Select.Option>
               </Select>
             </Space.Compact>
           </Form.Item>
           <Form.Item noStyle shouldUpdate={(prev, curr) => prev.schedule?.cron_expression !== curr.schedule?.cron_expression}>
             {({ getFieldValue }) => {
               const cron = getFieldValue(['schedule', 'cron_expression']);
               const nextRun = getNextRunTime(cron);
               return nextRun ? <Text type="secondary">下次执行: {nextRun}</Text> : null;
             }}
           </Form.Item>
         </Form.Item>

         <Form.Item name="enabled" label="启用状态" valuePropName="checked" initialValue={true}>
           <Switch checkedChildren="启用" unCheckedChildren="禁用" />
         </Form.Item>

         <Button type="primary" htmlType="submit">创建</Button>
       </Form>
     );
   };
   ```

2. **Cron 表达式验证**
   ```typescript
   const validateCronExpression = async (_: any, value: string) => {
     if (!value) return Promise.reject('请输入 Cron 表达式');

     // 基本格式验证（5-7 部分）
     const parts = value.trim().split(/\s+/);
     if (parts.length < 5 || parts.length > 7) {
       return Promise.reject('Cron 表达式应为 5-7 个部分');
     }

     // 每部分格式验证
     const cronRegex = /^(\*|[0-9,\-\/]+)$/;
     for (const part of parts) {
       if (!cronRegex.test(part)) {
         return Promise.reject(`无效的部分: ${part}`);
       }
     }

     return Promise.resolve();
   };
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
| status | string | - | 状态筛选 (active/paused/archived) |
| created_by | string | - | 创建者筛选 |
| search | string | - | 名称/描述搜索 |
| order_by | string | created_at | 排序字段 |
| order_dir | string | desc | 排序方向 |

### 响应

```typescript
interface ListScheduledTasksResponse {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    data: ScheduledTask[];
  };
}
```

### 使用场景

1. **任务列表页面**
   ```tsx
   const ScheduledTasksList = () => {
     const [filters, setFilters] = useState<ScheduledTaskFilter>({});
     const { data, loading, refresh } = useRequest(
       () => api.get('/scheduled-tasks', { params: filters }),
       { refreshDeps: [filters] }
     );

     const columns: ColumnsType<ScheduledTask> = [
       { title: '名称', dataIndex: 'name', render: (name, record) => <Link to={`/scheduled-tasks/${record.id}`}>{name}</Link> },
       {
         title: 'Cron 表达式',
         dataIndex: ['schedule', 'cron_expression'],
         render: (cron) => <Text code>{cron}</Text>
       },
       {
         title: '下次执行',
         dataIndex: 'next_run_time',
         render: (time) => time ? formatRelativeTime(time) : '-'
       },
       { title: '执行次数', dataIndex: 'execution_count' },
       {
         title: '状态',
         dataIndex: 'status',
         render: (status) => {
           const config = {
             active: { color: 'success', text: '活跃' },
             paused: { color: 'warning', text: '暂停' },
             archived: { color: 'default', text: '已归档' },
           };
           return <Tag color={config[status].color}>{config[status].text}</Tag>;
         }
       },
       {
         title: '操作',
         render: (_, record) => (
           <Space>
             {record.status === 'active' && (
               <Button size="small" onClick={() => handlePause(record.id)}>暂停</Button>
             )}
             {record.status === 'paused' && (
               <Button size="small" type="primary" onClick={() => handleResume(record.id)}>恢复</Button>
             )}
             <Button size="small" onClick={() => handleTrigger(record.id)}>立即执行</Button>
           </Space>
         )
       }
     ];

     return (
       <div>
         <Space style={{ marginBottom: 16 }}>
           <Input.Search
             placeholder="搜索任务"
             allowClear
             onSearch={(value) => setFilters({ ...filters, search: value })}
             style={{ width: 300 }}
           />
           <Select
             placeholder="状态筛选"
             allowClear
             onChange={(value) => setFilters({ ...filters, status: value })}
           >
             <Select.Option value="active">活跃</Select.Option>
             <Select.Option value="paused">暂停</Select.Option>
             <Select.Option value="archived">已归档</Select.Option>
           </Select>
         </Space>
         <Table
           dataSource={data?.data}
           columns={columns}
           loading={loading}
           rowKey="id"
           pagination={{ total: data?.total, pageSize: filters.page_size }}
         />
       </div>
     );
   };
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
  data: ScheduledTaskDetail;
}

interface ScheduledTaskDetail extends ScheduledTask {
  // 包含 ScheduledTask 所有字段
  // 额外添加：
  recent_runs?: TaskRun[];  // 最近几次执行（最多10条）
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

所有字段均为可选，与创建请求相同结构。

```typescript
interface UpdateScheduledTaskRequest {
  name?: string;
  description?: string;
  schedule?: ScheduleConfig;
  execution_config?: ExecutionConfig;
  retry_config?: RetryConfig;
  notification_config?: NotificationConfig;
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": { /* 更新后的 ScheduledTask 对象 */ }
}
```

---

## 5. 删除定时任务

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
  "message": "success",
  "data": {
    "message": "Task deleted successfully"
  }
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 404001 | 404 | 定时任务不存在 |
| 403001 | 403 | 无权限删除 |

---

## 6. 立即触发执行

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
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
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

### 使用场景

1. **手动触发任务**
   ```tsx
   const TriggerButton = ({ taskId }: { taskId: string }) => {
     const [loading, setLoading] = useState(false);

     const handleTrigger = async () => {
       setLoading(true);
       try {
         const { data } = await api.post(`/scheduled-tasks/${taskId}/trigger`);
         message.success('任务已触发');
         // 可以跳转到执行详情页
         navigate(`/scheduled-tasks/${taskId}/runs/${data.id}`);
       } catch (error) {
         message.error('触发失败');
       } finally {
         setLoading(false);
       }
     };

     return (
       <Popconfirm title="确定要立即执行此任务吗？" onConfirm={handleTrigger}>
         <Button loading={loading} icon={<PlayCircleOutlined />}>
           立即执行
         </Button>
       </Popconfirm>
     );
   };
   ```

---

## 7. 暂停定时任务

### 请求

```http
POST /api/v1/scheduled-tasks/:id/pause
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "task_123",
    "status": "paused"
  }
}
```

---

## 8. 恢复定时任务

### 请求

```http
POST /api/v1/scheduled-tasks/:id/resume
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "task_123",
    "status": "active"
  }
}
```

---

## 9. 更新任务状态

### 请求

```http
PATCH /api/v1/scheduled-tasks/:id/status
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| enabled | boolean | 是 | 是否启用 |

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
  "message": "success",
  "data": {
    "message": "Status updated successfully"
  }
}
```

---

## 10. 获取任务执行历史

### 请求

```http
GET /api/v1/scheduled-tasks/:id/runs?page=1&page_size=20&status=completed
Authorization: Bearer {access_token}
```

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| page_size | int | 20 | 每页数量（最大100） |
| status | string | - | 状态筛选 |
| started_after | string | - | 开始时间之后 |
| started_before | string | - | 开始时间之前 |

### 响应

```typescript
interface ListTaskRunsResponse {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    data: TaskRun[];
  };
}
```

### 使用场景

1. **执行历史列表**
   ```tsx
   const TaskRunHistory = ({ taskId }: { taskId: string }) => {
     const { data, loading } = useRequest(() => api.get(`/scheduled-tasks/${taskId}/runs`));

     const columns: ColumnsType<TaskRun> = [
       { title: '执行时间', dataIndex: 'scheduled_time', render: formatDateTime },
       {
         title: '状态',
         dataIndex: 'status',
         render: (status) => {
           const config = {
             pending: { color: 'default', text: '等待中' },
             running: { color: 'processing', text: '运行中' },
             completed: { color: 'success', text: '已完成' },
             failed: { color: 'error', text: '失败' },
             cancelled: { color: 'default', text: '已取消' },
           };
           return <Badge status={config[status].color} text={config[status].text} />;
         }
       },
       { title: '进度', render: (_, r) => `${r.completed_tasks}/${r.total_tasks}` },
       {
         title: '耗时',
         dataIndex: 'duration_ms',
         render: (_, record) => {
           if (!record.started_at) return '-';
           const end = record.completed_at ? new Date(record.completed_at) : new Date();
           const start = new Date(record.started_at);
           return formatDuration(end.getTime() - start.getTime());
         }
       },
       {
         title: '操作',
         render: (_, record) => (
           <Link to={`/scheduled-tasks/${taskId}/runs/${record.id}`}>查看详情</Link>
         )
       }
     ];

     return (
       <Table
         dataSource={data?.data}
         columns={columns}
         loading={loading}
         rowKey="id"
         pagination={{ total: data?.total }}
       />
     );
   };
   ```

---

## 11. 获取单次执行详情

### 请求

```http
GET /api/v1/scheduled-tasks/:id/runs/:run_id
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface TaskRunDetailResponse {
  code: number;
  message: string;
  data: TaskRunDetail;
}

interface TaskRunDetail extends TaskRun {
  // 包含 TaskRun 所有字段
  // 额外添加：
  batch_execution?: BatchExecution;
  error_details?: string;
}
```

---

## WebSocket 事件推送

定时任务执行状态通过 WebSocket 实时推送：

```typescript
// 订阅定时任务事件
wsStore.subscribe(
  { task_id: 'task_123' },
  (message) => {
    switch (message.event) {
      case 'scheduled_task_triggered':
        // 任务被触发
        console.log('Task triggered:', message.data.task_run_id);
        break;

      case 'scheduled_task_progress':
        // 任务进度更新
        console.log('Progress:', message.data.completed, '/', message.data.total);
        break;

      case 'scheduled_task_completed':
        // 任务完成
        console.log('Task completed:', message.data.task_run_id);
        break;

      case 'scheduled_task_failed':
        // 任务失败
        console.error('Task failed:', message.data.error);
        break;
    }
  }
);
```

---

## TypeScript 类型定义

```typescript
// src/types/api/scheduled-task.ts

export type TaskStatus = 'active' | 'paused' | 'archived';
export type RunStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type ScheduleType = 'cron' | 'interval';
export type BackoffStrategy = 'fixed' | 'exponential' | 'linear';
export type TaskPriority = 'p0' | 'p1' | 'p2' | 'p3';

export interface ScheduleConfig {
  type: ScheduleType;
  cron_expression?: string;
  interval_seconds?: number;
  timezone?: string;
}

export interface TaskConfig {
  max_steps?: number;
  timeout?: number;
  priority?: TaskPriority;
}

export interface AgentConfig {
  temperature?: number;
  max_tokens?: number;
}

export interface BatchOptions {
  parallel?: boolean;
  max_parallel?: number;
  stop_on_first_failure?: boolean;
  generate_report?: boolean;
}

export interface ExecutionConfig {
  agent_ids: string[];
  benchmark_ids: string[];
  task_config?: TaskConfig;
  agent_config?: AgentConfig;
  options?: BatchOptions;
}

export interface RetryConfig {
  enabled: boolean;
  max_attempts: number;
  initial_backoff: number;
  max_backoff: number;
  backoff_strategy: BackoffStrategy;
}

export interface NotificationConfig {
  enabled: boolean;
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
  retry_config: RetryConfig;
  notification_config: NotificationConfig;
  enabled: boolean;
  status: TaskStatus;
  next_run_time?: string;
  last_run_time?: string;
  last_run_id?: string;
  last_run_status?: RunStatus;
  execution_count: number;
  created_by: string;
  created_by_name: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
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

export interface CreateScheduledTaskRequest {
  name: string;
  description?: string;
  schedule: ScheduleConfig;
  execution_config: ExecutionConfig;
  retry_config?: RetryConfig;
  notification_config?: NotificationConfig;
  enabled?: boolean;
}

export interface UpdateScheduledTaskRequest {
  name?: string;
  description?: string;
  schedule?: ScheduleConfig;
  execution_config?: ExecutionConfig;
  retry_config?: RetryConfig;
  notification_config?: NotificationConfig;
}

export interface UpdateTaskStatusRequest {
  enabled: boolean;
}

export interface ScheduledTaskFilter {
  page?: number;
  page_size?: number;
  enabled?: boolean;
  status?: TaskStatus;
  created_by?: string;
  search?: string;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
}

export interface TaskRunFilter {
  page?: number;
  page_size?: number;
  status?: RunStatus;
  started_after?: string;
  started_before?: string;
}

// 错误码
export const ScheduledTaskErrorCode = {
  INVALID_PARAMS: 400001,
  INVALID_CRON: 400002,
  NOT_FOUND: 404001,
  NAME_EXISTS: 409001,
  NO_PERMISSION: 403001,
} as const;

// 辅助函数
export const getStatusColor = (status: TaskStatus): string => {
  const colors: Record<TaskStatus, string> = {
    active: 'success',
    paused: 'warning',
    archived: 'default',
  };
  return colors[status];
};

export const getRunStatusBadge = (status: RunStatus) => {
  const config: Record<RunStatus, { status: 'success' | 'processing' | 'error' | 'default'; text: string }> = {
    pending: { status: 'default', text: '等待中' },
    running: { status: 'processing', text: '运行中' },
    completed: { status: 'success', text: '已完成' },
    failed: { status: 'error', text: '失败' },
    cancelled: { status: 'default', text: '已取消' },
  };
  return config[status];
};

// Cron 表达式预设
export const CronPresets: Record<string, { expression: string; description: string }> = {
  '5min': { expression: '*/5 * * * *', description: '每5分钟' },
  'hourly': { expression: '0 * * * *', description: '每小时' },
  'daily': { expression: '0 0 * * *', description: '每天0点' },
  'weekly': { expression: '0 0 * * 1', description: '每周一0点' },
  'monthly': { expression: '0 0 1 * *', description: '每月1号0点' },
};
```
