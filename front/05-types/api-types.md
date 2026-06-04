# API 类型定义

## 通用类型

```typescript
// src/types/api/common.ts

// 统一响应格式
export interface ApiResponse<T = any> {
  code: number          // 0 表示成功
  message: string
  data: T
}

// 分页响应
export interface PaginatedResponse<T> {
  total: number
  page: number
  size: number
  data: T[]
}

// 分页请求参数
export interface PaginationParams {
  page?: number         // 默认 1
  page_size?: number    // 默认 20，最大 1000
}

// 错误响应
export interface APIError {
  code: number
  message: string
  details?: any
  request_id?: string
}
```

---

## 认证类型

```typescript
// src/types/api/auth.ts

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  expires_in: number     // 秒
  token_type: string
  user: UserInfo
}

export interface UserInfo {
  id: string
  username: string
  email: string
  role: 'admin' | 'user' | 'viewer'
  avatar: string
  created_at: string
}

export interface RefreshTokenRequest {
  refresh_token: string
}

export interface ChangePasswordRequest {
  old_password: string
  new_password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}
```

---

## Benchmark 类型

```typescript
// src/types/api/benchmark.ts

export type BenchmarkType =
  | 'code_fix'
  | 'code_complete'
  | 'terminal'
  | 'code_review'
  | 'refactor'
  | 'debug'
  | 'optimize'

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert'

export type BenchmarkStatus = 'draft' | 'active' | 'archived' | 'deprecated'

export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

export type Visibility = 'public' | 'private' | 'organization'

export interface Benchmark {
  id: string
  name: string
  display_name: string
  description: string
  type: BenchmarkType
  language: string
  difficulty: DifficultyLevel
  category: string
  tags: Tag[]
  status: BenchmarkStatus
  approval_status: ApprovalStatus
  visibility: Visibility
  config: BenchmarkConfig
  test_config: TestConfig
  created_by: string
  organization_id?: string
  created_at: string
  updated_at: string
}

export interface Tag {
  id: number
  name: string
  color: string
  created_at: string
}

export interface BenchmarkConfig {
  initial_state: CodeState
  required_files: string[]
  instructions: Instructions
  goal: string
  constraints?: string[]
  success_criteria?: string[]
  timeout: number
  max_attempts: number
  resource_limits: ResourceLimits
  agent_config: AgentTaskConfig
}

export interface CodeState {
  repo_url?: string
  commit_hash?: string
  branch?: string
  files: Record<string, string>
  diff?: string
  base_dir?: string
}

export interface Instructions {
  user_prompt: string
  system_prompt?: string
  context?: string
  examples?: string[]
  hints?: string[]
}

export interface ResourceLimits {
  max_memory_mb: number
  max_cpu_count: number
  max_duration: number
  max_disk_usage_mb: number
  network_access: boolean
}

export interface AgentTaskConfig {
  mode: 'code_edit' | 'terminal' | 'hybrid' | 'autonomous'
  tools: string[]
  temperature: number
  max_tokens: number
  max_steps: number
  allow_retry: boolean
  verbose: boolean
}

export interface TestConfig {
  type: 'unit' | 'integration' | 'e2e' | 'custom'
  script: string
  command: string
  args: string[]
  timeout: number
  env: Record<string, string>
  expected: TestExpectations
}

export interface TestExpectations {
  exit_code?: number
  output?: string
  not_contains?: string[]
  contains?: string[]
  min_pass_rate?: number
}

export interface BenchmarkFilter extends PaginationParams {
  name_like?: string
  type?: BenchmarkType
  language?: string
  difficulty?: DifficultyLevel
  category?: string
  status?: BenchmarkStatus
  tags?: string[]
}

export interface BenchmarkStats {
  id: string
  benchmark_id: string
  total_runs: number
  passed_runs: number
  failed_runs: number
  timeout_runs: number
  avg_duration: number
  min_duration: number
  max_duration: number
  success_rate: number
  last_run_at: string
  last_success_at: string
  last_failure_at: string
  agent_stats: Record<string, number>
}
```

---

## Execution 类型

```typescript
// src/types/api/execution.ts

export type ExecutionStatus =
  | 'pending'
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout'

export interface Execution {
  id: string
  benchmark_id: string
  benchmark_name: string
  agent_id: string
  agent_name: string
  status: ExecutionStatus
  result?: ExecutionResult
  progress?: ExecutionProgress
  started_at: string
  completed_at?: string
  created_at: string
}

export interface ExecutionResult {
  success: boolean
  exit_code: number
  output: string
  error?: string
  duration_ms: number
  tokens_used: number
  cost: number
}

export interface ExecutionProgress {
  current_step: number
  total_steps: number
  percentage: number
  message: string
}

export interface LogEntry {
  timestamp: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
}

export interface Artifact {
  name: string
  path: string
  size: number
  download_url: string
}

export interface CreateExecutionRequest {
  benchmark_id: string
  agent_id: string
  priority?: 'p1' | 'p2' | 'p3'
  config?: {
    max_steps?: number
    timeout?: number
    temperature?: number
    max_tokens?: number
  }
}

export interface ExecutionFilter extends PaginationParams {
  status?: ExecutionStatus
  benchmark_id?: string
  agent_id?: string
  start_date?: string
  end_date?: string
}
```

---

## Batch 类型

```typescript
// src/types/api/batch.ts

export type BatchStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'

export type BatchTaskStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'

export type BatchPriority = 'p0' | 'p1' | 'p2' | 'p3' | 'p4'

export interface CreateBatchRequest {
  name: string
  description?: string
  agent_ids: string[]
  benchmark_ids: string[]
  task_config?: TaskConfig
  agent_config?: AgentConfig
  options?: BatchOptions
  organization_id?: string
}

export interface TaskConfig {
  max_steps: number
  timeout: number
  priority: BatchPriority
}

export interface AgentConfig {
  temperature: number
  max_tokens: number
}

export interface BatchOptions {
  parallel: boolean
  max_parallel: number
  stop_on_first_failure: boolean
  generate_report: boolean
}

export interface BatchExecution {
  id: string
  name: string
  description: string
  agent_ids: string[]
  benchmark_ids: string[]
  task_config: TaskConfig
  agent_config: AgentConfig
  options: BatchOptions
  status: BatchStatus
  total_tasks: number
  pending_tasks: number
  running_tasks: number
  completed_tasks: number
  failed_tasks: number
  created_by: string
  organization_id?: string
  created_at: string
  started_at?: string
  completed_at?: string
  report_id?: string
}

export interface BatchTaskProgress {
  task_id: string
  agent_id: string
  benchmark_id: string
  status: BatchTaskStatus
  error?: string
  started_at?: string
  completed_at?: string
  duration?: number
}

export interface BatchReport {
  id: string
  batch_id: string
  summary: BatchSummaryReport
  agent_comparison: AgentComparison[]
  benchmark_comparison: BenchmarkComparison[]
  cost_summary: CostSummary
  rankings: Rankings
  charts_data: Record<string, any>
  created_at: string
}

export interface BatchSummaryReport {
  total_tasks: number
  completed_tasks: number
  failed_tasks: number
  success_rate: number
  avg_duration: number
  total_cost: number
  min_duration: number
  max_duration: number
}

export interface AgentComparison {
  agent_id: string
  agent_name: string
  total_executions: number
  success_count: number
  failed_count: number
  success_rate: number
  avg_duration: number
  total_tokens: number
  total_cost: number
}

export interface CostSummary {
  total_cost: number
  currency: string
  cost_by_agent: Record<string, number>
  cost_by_benchmark: Record<string, number>
}
```

---

## Organization 类型

```typescript
// src/types/api/organization.ts

export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer'

export interface Organization {
  id: string
  name: string
  display_name: string
  description: string
  logo_url?: string
  owner_id: string
  member_count: number
  settings: OrganizationSettings
  created_at: string
  updated_at: string
}

export interface OrganizationSettings {
  allow_member_create_benchmark: boolean
  allow_member_create_execution: boolean
  default_benchmark_visibility: Visibility
}

export interface OrganizationMember {
  id: string
  user_id: string
  username: string
  email: string
  avatar: string
  role: OrgRole
  status: 'active' | 'pending'
  joined_at: string
}

export interface Invitation {
  id: string
  organization_id: string
  email: string
  role: OrgRole
  status: 'pending' | 'accepted' | 'declined' | 'expired'
  expires_at: string
  created_at: string
}

export interface CreateOrgRequest {
  name: string
  display_name: string
  description?: string
  logo_url?: string
}

export interface UpdateOrgRequest {
  display_name?: string
  description?: string
  logo_url?: string
}
```

---

## Scheduled Task 类型

```typescript
// src/types/api/scheduled-task.ts

export type ScheduledTaskStatus = 'active' | 'paused' | 'disabled'

export interface ScheduledTask {
  id: string
  name: string
  description: string
  benchmark_ids: string[]
  agent_ids: string[]
  schedule_config: ScheduleConfig
  execution_config: ExecutionConfig
  notification_config: NotificationConfig
  retry_config: RetryConfig
  status: ScheduledTaskStatus
  next_run_time: string
  last_run_time?: string
  execution_count: number
  created_by: string
  organization_id?: string
  created_at: string
  updated_at: string
}

export interface ScheduleConfig {
  cron_expression: string
  timezone: string
  start_date?: string
  end_date?: string
}

export interface ExecutionConfig {
  priority: 'p1' | 'p2' | 'p3'
  timeout: number
  max_steps: number
}

export interface NotificationConfig {
  enabled: boolean
  on_success: boolean
  on_failure: boolean
  channels: ('web' | 'email')[]
}

export interface RetryConfig {
  enabled: boolean
  max_retries: number
  backoff_multiplier: number
}

export interface TaskRun {
  id: string
  scheduled_task_id: string
  status: ExecutionStatus
  scheduled_time: string
  started_at?: string
  completed_at?: string
  duration_ms?: number
  error?: string
  execution_count: number
  success_count: number
  failure_count: number
}
```

---

## WebSocket 类型

```typescript
// src/types/websocket.ts

export type WSMessageType =
  | 'connected'
  | 'subscribed'
  | 'notification'
  | 'execution_progress'
  | 'execution_log'
  | 'execution_completed'
  | 'execution_failed'
  | 'batch_progress'
  | 'batch_status_change'
  | 'batch_completed'
  | 'batch_failed'
  | 'swe_progress'
  | 'error'

export interface WSMessage<T = any> {
  event: WSMessageType
  data: T
  timestamp?: number
}

export interface SubscribeFilters {
  user_id?: string
  organization_id?: string
  execution_id?: string
  batch_id?: string
}

export interface ExecutionProgressData {
  execution_id: string
  status: ExecutionStatus
  progress: number
  current_step: number
  total_steps: number
  message: string
  started_at: string
  updated_at: string
}

export interface BatchProgressData {
  batch_id: string
  task_id?: string
  agent_id?: string
  benchmark_id?: string
  status: BatchStatus
  completed_count: number
  total_count: number
  percentage: number
  timestamp: number
}
```
