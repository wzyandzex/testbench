# 评测任务接口

## 基础信息

| 项目 | 值 |
|------|------|
| 基础路径 | `/api/v1/benchmarks` |
| 需要认证 | 是 |
| 内容类型 | `application/json` |

## 错误码

| 错误码 | 说明 |
|--------|------|
| 400001 | 评测任务名称已存在 |
| 404001 | 评测任务不存在 |
| 404002 | 标签不存在 |

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
| GET | `/benchmarks/tags` | 获取标签列表 |
| POST | `/benchmarks/tags` | 创建标签 |
| DELETE | `/benchmarks/tags/:id` | 删除标签 |

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
| language | string | - | 语言筛选 |
| difficulty | string | - | 难度筛选 |
| category | string | - | 分类筛选 |
| status | string | - | 状态筛选 |
| tags | string[] | - | 标签筛选（可多选） |

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
  type: BenchmarkType;       // code_fix | code_complete | terminal | code_review | refactor | debug | optimize
  language: string;
  difficulty: DifficultyLevel;  // easy | medium | hard | expert
  category: string;
  tags: Tag[];
  status: BenchmarkStatus;   // draft | active | archived | deprecated
  approval_status: ApprovalStatus; // pending | approved | rejected
  visibility: Visibility;     // public | private | organization
  config: BenchmarkConfig;
  test_config: TestConfig;
  created_by: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

type BenchmarkType =
  | 'code_fix'
  | 'code_complete'
  | 'terminal'
  | 'code_review'
  | 'refactor'
  | 'debug'
  | 'optimize';

type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

type BenchmarkStatus = 'draft' | 'active' | 'archived' | 'deprecated';

type ApprovalStatus = 'pending' | 'approved' | 'rejected';

type Visibility = 'public' | 'private' | 'organization';

interface Tag {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

interface BenchmarkConfig {
  initial_state: CodeState;
  required_files: string[];
  instructions: Instructions;
  goal: string;
  constraints: string[];
  success_criteria: string[];
  timeout: number;
  max_attempts: number;
  resource_limits: ResourceLimits;
  agent_config: AgentTaskConfig;
}

interface TestConfig {
  type: 'unit' | 'integration' | 'e2e' | 'custom';
  script: string;
  command: string;
  args: string[];
  timeout: number;
  env: Record<string, string>;
  expected: TestExpectations;
}
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
  data: Benchmark;
}
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

```typescript
interface CreateBenchmarkRequest {
  name: string;                    // 名称
  display_name?: string;            // 显示名称
  description?: string;             // 描述
  type: BenchmarkType;             // 类型
  language: string;                // 编程语言
  difficulty?: DifficultyLevel;     // 难度
  category?: string;                // 分类
  tags?: string[];                  // 标签ID列表
  status?: BenchmarkStatus;        // 状态（默认 draft）
  config?: BenchmarkConfig;         // 配置
  test_config?: TestConfig;         // 测试配置
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": { /* Benchmark 对象 */ }
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| 400001 | 评测任务名称已存在 |

---

## 4. 更新评测任务

### 请求

```http
PUT /api/v1/benchmarks/:id
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface UpdateBenchmarkRequest {
  name?: string;
  display_name?: string;
  description?: string;
  type?: BenchmarkType;
  language?: string;
  difficulty?: DifficultyLevel;
  category?: string;
  tags?: string[];
  status?: BenchmarkStatus;
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
  "data": { /* 更新后的 Benchmark 对象 */ }
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| 404001 | 评测任务不存在 |
| 400001 | 评测任务名称已存在 |

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

| 错误码 | 说明 |
|--------|------|
| 404001 | 评测任务不存在 |

---

## 6. 获取评测任务统计

### 请求

```http
GET /api/v1/benchmarks/:id/stats
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface BenchmarkStats {
  id: string;
  benchmark_id: string;
  total_runs: number;
  passed_runs: number;
  failed_runs: number;
  timeout_runs: number;
  avg_duration: number;
  min_duration: number;
  max_duration: number;
  success_rate: number;
  last_run_at: string;
  last_success_at: string;
  last_failure_at: string;
  agent_stats: Record<string, number>; // AgentID -> 执行次数
}
```

---

## 7. 获取标签列表

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
```

---

## 8. 创建标签

### 请求

```http
POST /api/v1/benchmarks/tags
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface CreateTagRequest {
  name: string;  // 标签名称
  color: string; // 颜色（可选）
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

## 9. 删除标签

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

| 错误码 | 说明 |
|--------|------|
| 404002 | 标签不存在 |

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

export interface Tag {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface CodeState {
  repo_url: string;
  commit_hash: string;
  branch: string;
  files: Record<string, string>;
  diff: string;
  base_dir: string;
}

export interface Instructions {
  user_prompt: string;
  system_prompt: string;
  context: string;
  examples: string[];
  hints: string[];
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
  temperature: number;
  max_tokens: number;
  max_steps: number;
  allow_retry: boolean;
  verbose: boolean;
}

export interface BenchmarkConfig {
  initial_state: CodeState;
  required_files: string[];
  instructions: Instructions;
  goal: string;
  constraints: string[];
  success_criteria: string[];
  timeout: number;
  max_attempts: number;
  resource_limits: ResourceLimits;
  agent_config: AgentTaskConfig;
}

export interface TestExpectations {
  exit_code: number;
  output: string;
  not_contains: string[];
  contains: string[];
  min_pass_rate: number;
}

export interface TestConfig {
  type: 'unit' | 'integration' | 'e2e' | 'custom';
  script: string;
  command: string;
  args: string[];
  timeout: number;
  env: Record<string, string>;
  expected: TestExpectations;
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
  config: BenchmarkConfig;
  test_config: TestConfig;
  created_by: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
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
}

export interface BenchmarkStats {
  id: string;
  benchmark_id: string;
  total_runs: number;
  passed_runs: number;
  failed_runs: number;
  timeout_runs: number;
  avg_duration: number;
  min_duration: number;
  max_duration: number;
  success_rate: number;
  last_run_at: string;
  last_success_at: string;
  last_failure_at: string;
  agent_stats: Record<string, number>;
}
```
