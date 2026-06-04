# Agent 管理接口

## 基础信息

| 项目 | 值 |
|------|------|
| 基础路径 | `/api/v1/agents` |
| 需要认证 | 是 |
| 内容类型 | `application/json` |

## 错误码

| 错误码 | 说明 |
|--------|------|
| 400001 | Agent 名称已存在 |
| 400002 | Agent 未激活 |
| 400003 | 流式执行不支持 |
| 404001 | Agent 不存在 |
| 500001 | Agent 注册表未配置 |
| 503 | 健康检查失败 |

---

## 接口列表

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/agents` | 获取 Agent 列表 |
| GET | `/agents/:id` | 获取 Agent 详情 |
| POST | `/agents` | 创建 Agent |
| PUT | `/agents/:id` | 更新 Agent |
| DELETE | `/agents/:id` | 删除 Agent |
| GET | `/agents/:id/stats` | 获取 Agent 统计 |
| POST | `/agents/:id/execute` | 执行 Agent 任务 |
| POST | `/agents/:id/execute/stream` | 流式执行任务 (SSE) |
| GET | `/agents/:id/health` | 健康检查 |
| POST | `/agents/:id/sync` | 同步到注册表 |

---

## Agent 类型枚举

| 值 | 说明 |
|----|------|
| `code_edit` | 代码编辑型 |
| `terminal` | 终端型 |
| `hybrid` | 混合型 |
| `autonomous` | 自治型 |

---

## Agent 状态枚举

| 值 | 说明 |
|----|------|
| `active` | 激活 |
| `inactive` | 未激活 |
| `maintained` | 维护中 |
| `deprecated` | 已弃用 |

---

## 1. 获取 Agent 列表

### 请求

```http
GET /api/v1/agents?name_like=gpt&type=hybrid&status=active&page=1&page_size=20
Authorization: Bearer {access_token}
```

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| name_like | string | - | 名称模糊搜索 |
| type | string | - | 类型筛选（可多选） |
| status | string | - | 状态筛选（可多选） |
| has_capability | string | - | 能力筛选 |
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
    data: Agent[];
  };
}

interface Agent {
  id: string;
  name: string;
  display_name: string;
  description: string;
  type: AgentType;
  endpoint: string;
  api_key?: string;
  model_config: ModelConfig;
  capabilities: string[];
  tools?: any;
  status: AgentStatus;
  version: string;
  total_executions: number;
  success_rate: number;
  avg_duration: number;      // 毫秒
  metadata?: any;
  created_by: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

type AgentType = 'code_edit' | 'terminal' | 'hybrid' | 'autonomous';
type AgentStatus = 'active' | 'inactive' | 'maintained' | 'deprecated';

interface ModelConfig {
  provider: string;
  model_name: string;
  base_url: string;
  params?: Record<string, any>;
  temperature: number;
  max_tokens: number;
  top_p?: number;
  top_k?: number;
}
```

---

## 2. 获取 Agent 详情

### 请求

```http
GET /api/v1/agents/:id
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface AgentDetailResponse {
  code: number;
  message: string;
  data: Agent;
}
```

---

## 3. 创建 Agent

### 请求

```http
POST /api/v1/agents
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface CreateAgentRequest {
  name: string;                  // 名称（唯一）
  display_name?: string;         // 显示名称
  description?: string;          // 描述
  type: AgentType;              // 类型
  endpoint: string;             // 端点地址
  api_key?: string;             // API 密钥
  model_config?: ModelConfig;   // 模型配置
  capabilities?: string[];      // 能力列表
  tools?: any;                  // 工具配置
  status?: AgentStatus;         // 状态（默认 active）
  version?: string;             // 版本号
  metadata?: any;               // 元数据
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": { /* Agent 对象 */ }
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| 400001 | Agent 名称已存在 |

---

## 4. 更新 Agent

### 请求

```http
PUT /api/v1/agents/:id
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface UpdateAgentRequest {
  display_name?: string;
  description?: string;
  type?: AgentType;
  endpoint?: string;
  api_key?: string;
  model_config?: ModelConfig;
  capabilities?: string[];
  tools?: any;
  status?: AgentStatus;
  version?: string;
  metadata?: any;
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": { /* 更新后的 Agent 对象 */ }
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| 404001 | Agent 不存在 |
| 400001 | Agent 名称已存在 |

---

## 5. 删除 Agent

### 请求

```http
DELETE /api/v1/agents/:id
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "agent deleted successfully"
  }
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| 404001 | Agent 不存在 |

---

## 6. 获取 Agent 统计

### 请求

```http
GET /api/v1/agents/:id/stats
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface AgentStatsResponse {
  code: number;
  message: string;
  data: AgentStats;
}

interface AgentStats {
  agent_id: string;
  // 执行统计
  total_executions: number;
  success_executions: number;
  failed_executions: number;
  timeout_executions: number;
  // 成功率
  success_rate: number;
  timeout_rate: number;
  // 性能指标
  avg_duration: number;      // 毫秒
  min_duration: number;      // 毫秒
  max_duration: number;      // 毫秒
  // Token 使用
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  avg_tokens: number;
  // 步骤统计
  avg_steps: number;
  avg_tool_calls: number;
  // 按评测任务类型统计
  benchmark_stats?: any;
  // 时间统计
  first_execution_at?: string;
  last_execution_at?: string;
  updated_at: string;
}
```

---

## 7. 执行 Agent 任务

### 请求

```http
POST /api/v1/agents/:id/execute
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface ExecuteTaskRequest {
  task_id: string;           // 任务 ID
  input: any;                // 输入数据
  max_steps?: number;        // 最大步数（默认 100）
  timeout?: number;          // 超时时间（毫秒，默认 600000）
  config?: any;              // 额外配置
}
```

### 响应

```typescript
interface ExecuteTaskResponse {
  code: number;
  message: string;
  data: AgentResult;
}

interface AgentResult {
  success: boolean;
  output: any;
  error?: string;
  steps: AgentStep[];
  duration: number;          // 毫秒
  tokens_used: {
    input: number;
    output: number;
    total: number;
  };
}

interface AgentStep {
  index: number;
  type: string;
  action: string;
  input: any;
  output: any;
  error?: string;
  duration: number;
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| 404001 | Agent 不存在 |
| 400002 | Agent 未激活 |
| 500001 | Agent 注册表未配置 |

---

## 8. 流式执行任务 (SSE)

### 请求

```http
POST /api/v1/agents/:id/execute/stream
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：** 同 `ExecuteTaskRequest`

### 响应

返回 `text/event-stream` 格式的 Server-Sent Events：

```typescript
// 事件类型
type SSEEvent =
  | 'event'    // 正常执行事件
  | 'error'    // 错误事件
  | 'done';    // 完成事件

// event 事件数据
interface AgentStreamEvent {
  step_index: number;
  step_type: string;
  action: string;
  output: any;
  duration: number;
  tokens?: {
    input: number;
    output: number;
  };
}

// error 事件数据
interface AgentStreamError {
  code: number;
  message: string;
}

// done 事件数据
interface AgentStreamDone {
  message: string;
}
```

**错误响应（SSE 格式）：**

| 错误码 | 说明 |
|--------|------|
| 404001 | Agent 不存在 |
| 400002 | Agent 未激活 |
| 400003 | 流式执行不支持 |

---

## 9. 健康检查

### 请求

```http
GET /api/v1/agents/:id/health
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "status": "healthy",
    "agentId": "agent_123"
  }
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 404001 | 404 | Agent 不存在 |
| 400002 | 400 | Agent 未激活 |
| 503 | 503 | 健康检查失败 |

---

## 10. 同步到注册表

### 请求

```http
POST /api/v1/agents/:id/sync
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "agent synced to registry successfully",
    "agentId": "agent_123"
  }
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| 404001 | Agent 不存在 |
| 400002 | Agent 未激活 |
| 500001 | Agent 注册表未配置 |

---

## TypeScript 类型定义

```typescript
// src/types/api/agent.ts

export type AgentType = 'code_edit' | 'terminal' | 'hybrid' | 'autonomous';
export type AgentStatus = 'active' | 'inactive' | 'maintained' | 'deprecated';

export interface ModelConfig {
  provider: string;
  model_name: string;
  base_url: string;
  params?: Record<string, any>;
  temperature: number;
  max_tokens: number;
  top_p?: number;
  top_k?: number;
}

export interface Agent {
  id: string;
  name: string;
  display_name: string;
  description: string;
  type: AgentType;
  endpoint: string;
  api_key?: string;
  model_config: ModelConfig;
  capabilities: string[];
  tools?: any;
  status: AgentStatus;
  version: string;
  total_executions: number;
  success_rate: number;
  avg_duration: number;
  metadata?: any;
  created_by: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

export interface AgentStats {
  agent_id: string;
  total_executions: number;
  success_executions: number;
  failed_executions: number;
  timeout_executions: number;
  success_rate: number;
  timeout_rate: number;
  avg_duration: number;
  min_duration: number;
  max_duration: number;
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  avg_tokens: number;
  avg_steps: number;
  avg_tool_calls: number;
  benchmark_stats?: any;
  first_execution_at?: string;
  last_execution_at?: string;
  updated_at: string;
}

export interface CreateAgentRequest {
  name: string;
  display_name?: string;
  description?: string;
  type: AgentType;
  endpoint: string;
  api_key?: string;
  model_config?: ModelConfig;
  capabilities?: string[];
  tools?: any;
  status?: AgentStatus;
  version?: string;
  metadata?: any;
}

export interface UpdateAgentRequest {
  display_name?: string;
  description?: string;
  type?: AgentType;
  endpoint?: string;
  api_key?: string;
  model_config?: ModelConfig;
  capabilities?: string[];
  tools?: any;
  status?: AgentStatus;
  version?: string;
  metadata?: any;
}

export interface ExecuteTaskRequest {
  task_id: string;
  input: any;
  max_steps?: number;
  timeout?: number;
  config?: any;
}

export interface AgentResult {
  success: boolean;
  output: any;
  error?: string;
  steps: AgentStep[];
  duration: number;
  tokens_used: {
    input: number;
    output: number;
    total: number;
  };
}

export interface AgentStep {
  index: number;
  type: string;
  action: string;
  input: any;
  output: any;
  error?: string;
  duration: number;
}

export interface AgentFilter {
  name_like?: string;
  types?: AgentType[];
  status?: AgentStatus[];
  has_capability?: string;
  page?: number;
  page_size?: number;
}

// SSE 事件类型
export type SSEEventType = 'event' | 'error' | 'done';

export interface AgentStreamEvent {
  step_index: number;
  step_type: string;
  action: string;
  output: any;
  duration: number;
  tokens?: {
    input: number;
    output: number;
  };
}

export interface AgentStreamError {
  code: number;
  message: string;
}

export interface AgentStreamDone {
  message: string;
}

// 错误码
export const AgentErrorCode = {
  NAME_EXISTS: 400001,
  NOT_ACTIVE: 400002,
  STREAM_NOT_SUPPORTED: 400003,
  NOT_FOUND: 404001,
  REGISTRY_NOT_CONFIGURED: 500001,
} as const;
```
