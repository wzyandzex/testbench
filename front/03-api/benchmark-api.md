# 评测任务接口

## 基础信息

| 项目 | 值 |
|------|------|
| 基础路径 | `/api/v1/benchmarks` |
| 需要认证 | 是 |
| 内容类型 | `application/json` |

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 400001 | 400 | 评测任务名称已存在 |
| 404001 | 404 | 评测任务不存在 |
| 404002 | 404 | 标签不存在 |
| 403001 | 403 | 无权限操作 |

---

## 接口列表

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/benchmarks` | 获取评测任务列表 |
| GET | `/benchmarks/:id` | 获取评测任务详情 |
| POST | `/benchmarks` | 创建评测任务 |
| PUT | `/benchmarks/:id` | 更新评测任务 |
| DELETE | `/benchmarks/:id` | 删除评测任务 |
| GET | `/benchmarks/:id/stats` | 获取评测任务统计 |
| GET | `/benchmarks/:id/executions` | 获取评测任务的执行记录 |
| GET | `/benchmarks/tags` | 获取标签列表 |
| POST | `/benchmarks/tags` | 创建标签 |
| DELETE | `/benchmarks/tags/:id` | 删除标签 |

---

## 评测任务类型枚举

| 值 | 说明 |
|----|------|
| `code_fix` | 代码修复 - 给定含 bug 的代码，要求修复 |
| `code_complete` | 代码补全 - 给定部分代码，要求补全 |
| `terminal` | 终端任务 - 通过命令行完成任务 |
| `code_review` | 代码审查 - 分析代码问题 |
| `refactor` | 重构 - 优化代码结构 |
| `debug` | 调试 - 定位并修复问题 |
| `optimize` | 优化 - 提升性能 |

---

## 难度级别枚举

| 值 | 说明 |
|----|------|
| `easy` | 简单 |
| `medium` | 中等 |
| `hard` | 困难 |
| `expert` | 专家 |

---

## 评测任务状态枚举

| 值 | 说明 |
|----|------|
| `draft` | 草稿 - 未发布 |
| `active` | 活跃 - 可使用 |
| `archived` | 已归档 - 不可用但保留 |
| `deprecated` | 已弃用 - 不推荐使用 |

---

## 审批状态枚举

| 值 | 说明 |
|----|------|
| `pending` | 待审批 |
| `approved` | 已批准 |
| `rejected` | 已拒绝 |

---

## 可见性枚举

| 值 | 说明 |
|----|------|
| `public` | 公开 - 所有人可见 |
| `private` | 私有 - 仅创建者可见 |
| `organization` | 组织内 - 仅组织成员可见 |

---

## 1. 获取评测任务列表

### 请求

```http
GET /api/v1/benchmarks?page=1&page_size=20&name_like=test&language=python&status=active
Authorization: Bearer {access_token}
```

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| page_size | int | 20 | 每页数量（最大1000） |
| name_like | string | - | 名称模糊搜索 |
| type | string | - | 任务类型筛选 |
| language | string | - | 编程语言筛选 |
| difficulty | string | - | 难度筛选 |
| category | string | - | 分类筛选 |
| status | string | - | 状态筛选（可多选） |
| tags | string[] | - | 标签筛选（可多选） |
| visibility | string | - | 可见性筛选 |
| created_by | string | - | 创建者筛选 |
| order_by | string | created_at | 排序字段 |
| order_dir | string | desc | 排序方向 |

### 响应

```typescript
interface PaginatedResponse {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    data: Benchmark[];
  };
}

interface Benchmark {
  id: string;
  name: string;
  display_name: string;
  description: string;
  type: BenchmarkType;
  language: string;
  difficulty: DifficultyLevel;
  category: string;
  tags: Tag[];
  status: BenchmarkStatus;
  approval_status: ApprovalStatus;
  visibility: Visibility;
  created_by: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
  // 统计信息（仅在列表视图返回）
  stats?: {
    total_runs: number;
    success_rate: number;
  };
}
```

### 使用场景

1. **列表页面筛选**
   ```tsx
   const BenchmarkList = () => {
     const [filters, setFilters] = useState<BenchmarkFilter>({});

     const { data, loading } = useRequest(
       () => api.get('/benchmarks', { params: filters }),
       { refreshDeps: [filters] }
     );

     const handleFilterChange = (key: string, value: any) => {
       setFilters(prev => ({ ...prev, [key]: value }));
     };

     return (
       <div>
         <Space>
           <Select placeholder="任务类型" onChange={(v) => handleFilterChange('type', v)}>
             <Select.Option value="code_fix">代码修复</Select.Option>
             <Select.Option value="code_complete">代码补全</Select.Option>
           </Select>
           <Select placeholder="难度" onChange={(v) => handleFilterChange('difficulty', v)}>
             <Select.Option value="easy">简单</Select.Option>
             <Select.Option value="medium">中等</Select.Option>
             <Select.Option value="hard">困难</Select.Option>
           </Select>
         </Space>
         <Table dataSource={data?.data} columns={columns} />
       </div>
     );
   };
   ```

---

## 2. 获取评测任务详情

### 请求

```http
GET /api/v1/benchmarks/:id
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface BenchmarkDetailResponse {
  code: number;
  message: string;
  data: BenchmarkDetail;
}

interface BenchmarkDetail {
  id: string;
  name: string;
  display_name: string;
  description: string;
  type: BenchmarkType;
  language: string;
  difficulty: DifficultyLevel;
  category: string;
  tags: Tag[];
  status: BenchmarkStatus;
  approval_status: ApprovalStatus;
  visibility: Visibility;
  config: BenchmarkConfig;
  test_config: TestConfig;
  created_by: string;
  created_by_name: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
  // 统计信息
  stats: BenchmarkStats;
  // 文件列表
  files: BenchmarkFile[];
}
```

### 使用场景

1. **详情页面展示**
   ```tsx
   const BenchmarkDetail = ({ id }: { id: string }) => {
     const { data, loading } = useRequest(() => api.get(`/benchmarks/${id}`));

     if (loading) return <Skeleton />;
     if (!data) return <Empty />;

     return (
       <div>
         <Descriptions title={data.display_name} bordered>
           <Descriptions.Item label="类型">{getBenchmarkTypeLabel(data.type)}</Descriptions.Item>
           <Descriptions.Item label="语言">{data.language}</Descriptions.Item>
           <Descriptions.Item label="难度">
             <Tag color={getDifficultyColor(data.difficulty)}>{data.difficulty}</Tag>
           </Descriptions.Item>
           <Descriptions.Item label="状态">
             <Badge status={getStatusStatus(data.status)} text={data.status} />
           </Descriptions.Item>
         </Descriptions>

         <Card title="统计信息" style={{ marginTop: 16 }}>
           <Row gutter={16}>
             <Col span={6}>
               <Statistic title="总执行次数" value={data.stats.total_runs} />
             </Col>
             <Col span={6}>
               <Statistic title="成功率" value={data.stats.success_rate} suffix="%" />
             </Col>
             <Col span={6}>
               <Statistic title="平均耗时" value={formatDuration(data.stats.avg_duration)} />
             </Col>
           </Row>
         </Card>
       </div>
     );
   };
   ```

---

## 3. 创建评测任务

### 请求

```http
POST /api/v1/benchmarks
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 名称（唯一标识） |
| display_name | string | 否 | 显示名称 |
| description | string | 否 | 描述 |
| type | BenchmarkType | 是 | 任务类型 |
| language | string | 是 | 编程语言 |
| difficulty | DifficultyLevel | 否 | 难度 |
| category | string | 否 | 分类 |
| tags | string[] | 否 | 标签ID列表 |
| status | BenchmarkStatus | 否 | 状态（默认 draft） |
| visibility | Visibility | 否 | 可见性（默认 private） |
| config | BenchmarkConfig | 是 | 配置 |
| test_config | TestConfig | 是 | 测试配置 |

```typescript
interface CreateBenchmarkRequest {
  name: string;
  display_name?: string;
  description?: string;
  type: BenchmarkType;
  language: string;
  difficulty?: DifficultyLevel;
  category?: string;
  tags?: string[];
  status?: BenchmarkStatus;
  visibility?: Visibility;
  config: BenchmarkConfig;
  test_config: TestConfig;
}

interface BenchmarkConfig {
  initial_state: {
    repo_url?: string;
    commit_hash?: string;
    branch?: string;
    files: Record<string, string>;  // 文件路径 -> 内容
    diff?: string;
    base_dir?: string;
  };
  required_files: string[];
  instructions: {
    user_prompt: string;
    system_prompt?: string;
    context?: string;
    examples?: string[];
    hints?: string[];
  };
  goal: string;
  constraints?: string[];
  success_criteria: string[];
  timeout: number;              // 超时时间（秒）
  max_attempts: number;
  resource_limits: {
    max_memory_mb: number;
    max_cpu_count: number;
    max_duration: number;
    max_disk_usage_mb: number;
    network_access: boolean;
  };
  agent_config: {
    mode: 'code_edit' | 'terminal' | 'hybrid' | 'autonomous';
    tools: string[];
    temperature?: number;
    max_tokens?: number;
    max_steps?: number;
    allow_retry?: boolean;
    verbose?: boolean;
  };
}

interface TestConfig {
  type: 'unit' | 'integration' | 'e2e' | 'custom';
  script?: string;
  command: string;
  args?: string[];
  timeout: number;
  env?: Record<string, string>;
  expected: {
    exit_code?: number;
    output?: string;
    not_contains?: string[];
    contains?: string[];
    min_pass_rate?: number;
  };
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": { /* BenchmarkDetail 对象 */ }
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 400001 | 400 | 评测任务名称已存在 |
| 403001 | 403 | 无权限创建 |

### 使用场景

1. **创建任务表单**
   ```tsx
   const CreateBenchmark = () => {
     const [form] = Form.useForm();
     const [step, setStep] = useState(0);

     const steps = [
       { title: '基本信息', content: <BasicInfoForm /> },
       { title: '代码配置', content: <CodeConfigForm /> },
       { title: '测试配置', content: <TestConfigForm /> },
       { title: '预览提交', content: <PreviewStep /> },
     ];

     const handleSubmit = async () => {
       try {
         const values = await form.validateFields();
         await api.post('/benchmarks', values);
         message.success('创建成功');
         navigate('/benchmarks');
       } catch (error) {
         message.error('创建失败');
       }
     };

     return (
       <div>
         <Steps current={step}>
           {steps.map(s => <Steps.Step key={s.title} title={s.title} />)}
         </Steps>
         <div style={{ marginTop: 24 }}>{steps[step].content}</div>
         <div style={{ marginTop: 24 }}>
           {step > 0 && <Button onClick={() => setStep(step - 1)}>上一步</Button>}
           {step < steps.length - 1 ? (
             <Button type="primary" onClick={() => setStep(step + 1)}>下一步</Button>
           ) : (
             <Button type="primary" onClick={handleSubmit}>提交</Button>
           )}
         </div>
       </div>
     );
   };
   ```

---

## 4. 更新评测任务

### 请求

```http
PUT /api/v1/benchmarks/:id
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

所有字段均为可选，与创建请求相同结构。

```typescript
interface UpdateBenchmarkRequest {
  display_name?: string;
  description?: string;
  type?: BenchmarkType;
  language?: string;
  difficulty?: DifficultyLevel;
  category?: string;
  tags?: string[];
  status?: BenchmarkStatus;
  visibility?: Visibility;
  config?: BenchmarkConfig;
  test_config?: TestConfig;
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": { /* 更新后的 BenchmarkDetail 对象 */ }
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 404001 | 404 | 评测任务不存在 |
| 403001 | 403 | 无权限编辑 |

---

## 5. 删除评测任务

### 请求

```http
DELETE /api/v1/benchmarks/:id
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "benchmark deleted successfully"
  }
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 404001 | 404 | 评测任务不存在 |
| 403001 | 403 | 无权限删除 |

### 使用场景

1. **删除确认对话框**
   ```tsx
   const DeleteBenchmark = ({ id, name }: { id: string; name: string }) => {
     const handleDelete = () => {
       Modal.confirm({
         title: '确认删除',
         content: `确定要删除评测任务 "${name}" 吗？此操作不可恢复。`,
         okText: '删除',
         okType: 'danger',
         onOk: async () => {
           try {
             await api.delete(`/benchmarks/${id}`);
             message.success('删除成功');
           } catch (error) {
             message.error('删除失败');
           }
         }
       });
     };

     return <Button danger onClick={handleDelete}>删除</Button>;
   };
   ```

---

## 6. 获取评测任务统计

### 请求

```http
GET /api/v1/benchmarks/:id/stats
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface BenchmarkStatsResponse {
  code: number;
  message: string;
  data: BenchmarkStats;
}

interface BenchmarkStats {
  id: string;
  benchmark_id: string;
  total_runs: number;
  passed_runs: number;
  failed_runs: number;
  timeout_runs: number;
  cancelled_runs: number;
  avg_duration: number;          // 毫秒
  min_duration: number;          // 毫秒
  max_duration: number;          // 毫秒
  success_rate: number;          // 百分比
  last_run_at?: string;
  last_success_at?: string;
  last_failure_at?: string;
  // Agent 统计
  agent_stats: Record<string, {
    agent_id: string;
    agent_name: string;
    total_runs: number;
    success_count: number;
    success_rate: number;
    avg_duration: number;
  }>;
  // 每日统计（最近30天）
  daily_stats?: Array<{
    date: string;
    total_runs: number;
    success_rate: number;
  }>;
}
```

### 使用场景

1. **统计图表展示**
   ```tsx
   const BenchmarkStatsChart = ({ benchmarkId }: { benchmarkId: string }) => {
     const { data } = useRequest(() => api.get(`/benchmarks/${benchmarkId}/stats`));

     const dailyData = data?.daily_stats || [];

     return (
       <Card title="执行趋势">
         <Line
           data={dailyData}
           xField="date"
           yField="success_rate"
           seriesField={[{ name: '成功率', color: '#52c41a' }]}
         />
       </Card>
     );
   };
   ```

---

## 7. 获取评测任务的执行记录

### 请求

```http
GET /api/v1/benchmarks/:id/executions?page=1&page_size=20&agent_id=xxx&status=running
Authorization: Bearer {access_token}
```

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| page_size | int | 20 | 每页数量（最大100） |
| agent_id | string | - | Agent ID 筛选 |
| status | string[] | - | 状态筛选（可多选） |
| success | boolean | - | 成功状态筛选 |
| started_after | string | - | 开始时间之后（ISO 8601） |
| started_before | string | - | 开始时间之前（ISO 8601） |
| order_by | string | created_at | 排序字段 |
| order_dir | string | desc | 排序方向 |

### 响应

```typescript
interface ExecutionsResponse {
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

type ExecutionStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';

interface ExecutionProgress {
  current_step: number;
  total_steps: number;
  percentage: number;
  message: string;
}

interface ExecutionResult {
  success: boolean;
  exit_code: number;
  output: string;
  error?: string;
  duration_ms: number;
  tokens_used: number;
  cost: number;
}
```

---

## 8. 获取标签列表

### 请求

```http
GET /api/v1/benchmarks/tags
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface TagsResponse {
  code: number;
  message: string;
  data: Tag[];
}

interface Tag {
  id: number;
  name: string;
  color: string;
  usage_count?: number;
  created_at: string;
}
```

---

## 9. 创建标签

### 请求

```http
POST /api/v1/benchmarks/tags
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 标签名称 |
| color | string | 否 | 颜色（十六进制，如 #1890ff） |

```typescript
interface CreateTagRequest {
  name: string;
  color?: string;
}
```

### 响应

```typescript
interface TagResponse {
  code: number;
  message: string;
  data: Tag;
}
```

---

## 10. 删除标签

### 请求

```http
DELETE /api/v1/benchmarks/tags/:id
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "tag deleted successfully"
  }
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 404002 | 404 | 标签不存在 |

---

## TypeScript 类型定义

```typescript
// src/types/api/benchmark.ts

export type BenchmarkType =
  | 'code_fix'
  | 'code_complete'
  | 'terminal'
  | 'code_review'
  | 'refactor'
  | 'debug'
  | 'optimize';

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

export type BenchmarkStatus = 'draft' | 'active' | 'archived' | 'deprecated';

export type ApprovalStatus = 'pending' | 'approved' | 'rejected';

export type Visibility = 'public' | 'private' | 'organization';

export type ExecutionStatus = 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';

export interface Tag {
  id: number;
  name: string;
  color: string;
  usage_count?: number;
  created_at: string;
}

export interface CodeState {
  repo_url?: string;
  commit_hash?: string;
  branch?: string;
  files: Record<string, string>;
  diff?: string;
  base_dir?: string;
}

export interface Instructions {
  user_prompt: string;
  system_prompt?: string;
  context?: string;
  examples?: string[];
  hints?: string[];
}

export interface ResourceLimits {
  max_memory_mb: number;
  max_cpu_count: number;
  max_duration: number;
  max_disk_usage_mb: number;
  network_access: boolean;
}

export interface AgentTaskConfig {
  mode: 'code_edit' | 'terminal' | 'hybrid' | 'autonomous';
  tools: string[];
  temperature?: number;
  max_tokens?: number;
  max_steps?: number;
  allow_retry?: boolean;
  verbose?: boolean;
}

export interface BenchmarkConfig {
  initial_state: CodeState;
  required_files: string[];
  instructions: Instructions;
  goal: string;
  constraints?: string[];
  success_criteria: string[];
  timeout: number;
  max_attempts: number;
  resource_limits: ResourceLimits;
  agent_config: AgentTaskConfig;
}

export interface TestExpectations {
  exit_code?: number;
  output?: string;
  not_contains?: string[];
  contains?: string[];
  min_pass_rate?: number;
}

export interface TestConfig {
  type: 'unit' | 'integration' | 'e2e' | 'custom';
  script?: string;
  command: string;
  args?: string[];
  timeout: number;
  env?: Record<string, string>;
  expected: TestExpectations;
}

export interface BenchmarkFile {
  path: string;
  size: number;
  content_preview?: string;
}

export interface Benchmark {
  id: string;
  name: string;
  display_name: string;
  description: string;
  type: BenchmarkType;
  language: string;
  difficulty: DifficultyLevel;
  category: string;
  tags: Tag[];
  status: BenchmarkStatus;
  approval_status: ApprovalStatus;
  visibility: Visibility;
  created_by: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
  stats?: {
    total_runs: number;
    success_rate: number;
  };
}

export interface BenchmarkDetail extends Benchmark {
  config: BenchmarkConfig;
  test_config: TestConfig;
  created_by_name: string;
  stats: BenchmarkStats;
  files: BenchmarkFile[];
}

export interface BenchmarkStats {
  id: string;
  benchmark_id: string;
  total_runs: number;
  passed_runs: number;
  failed_runs: number;
  timeout_runs: number;
  cancelled_runs: number;
  avg_duration: number;
  min_duration: number;
  max_duration: number;
  success_rate: number;
  last_run_at?: string;
  last_success_at?: string;
  last_failure_at?: string;
  agent_stats: Record<string, AgentStat>;
  daily_stats?: DailyStat[];
}

export interface AgentStat {
  agent_id: string;
  agent_name: string;
  total_runs: number;
  success_count: number;
  success_rate: number;
  avg_duration: number;
}

export interface DailyStat {
  date: string;
  total_runs: number;
  success_rate: number;
}

export interface ExecutionProgress {
  current_step: number;
  total_steps: number;
  percentage: number;
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

export interface ExecutionSummary {
  id: string;
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

export interface CreateBenchmarkRequest {
  name: string;
  display_name?: string;
  description?: string;
  type: BenchmarkType;
  language: string;
  difficulty?: DifficultyLevel;
  category?: string;
  tags?: string[];
  status?: BenchmarkStatus;
  visibility?: Visibility;
  config: BenchmarkConfig;
  test_config: TestConfig;
}

export interface UpdateBenchmarkRequest {
  display_name?: string;
  description?: string;
  type?: BenchmarkType;
  language?: string;
  difficulty?: DifficultyLevel;
  category?: string;
  tags?: string[];
  status?: BenchmarkStatus;
  visibility?: Visibility;
  config?: BenchmarkConfig;
  test_config?: TestConfig;
}

export interface BenchmarkFilter {
  page?: number;
  page_size?: number;
  name_like?: string;
  type?: BenchmarkType;
  language?: string;
  difficulty?: DifficultyLevel;
  category?: string;
  status?: BenchmarkStatus[];
  tags?: string[];
  visibility?: Visibility;
  created_by?: string;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
}

export interface ExecutionFilter {
  page?: number;
  page_size?: number;
  agent_id?: string;
  status?: ExecutionStatus[];
  success?: boolean;
  started_after?: string;
  started_before?: string;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
}

export interface CreateTagRequest {
  name: string;
  color?: string;
}

// 错误码
export const BenchmarkErrorCode = {
  NAME_EXISTS: 400001,
  NOT_FOUND: 404001,
  TAG_NOT_FOUND: 404002,
  NO_PERMISSION: 403001,
} as const;

// 辅助函数
export const getBenchmarkTypeLabel = (type: BenchmarkType): string => {
  const labels: Record<BenchmarkType, string> = {
    code_fix: '代码修复',
    code_complete: '代码补全',
    terminal: '终端任务',
    code_review: '代码审查',
    refactor: '重构',
    debug: '调试',
    optimize: '优化',
  };
  return labels[type];
};

export const getDifficultyColor = (difficulty: DifficultyLevel): string => {
  const colors: Record<DifficultyLevel, string> = {
    easy: 'green',
    medium: 'blue',
    hard: 'orange',
    expert: 'red',
  };
  return colors[difficulty];
};

export const getStatusStatus = (status: BenchmarkStatus): 'success' | 'processing' | 'error' | 'default' => {
  const statusMap: Record<BenchmarkStatus, 'success' | 'processing' | 'error' | 'default'> = {
    active: 'success',
    draft: 'processing',
    archived: 'default',
    deprecated: 'error',
  };
  return statusMap[status];
};
```
