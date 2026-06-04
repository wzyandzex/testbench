export type ExecutionStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'timeout';

export type ExecutionPriority = 'p0' | 'p1' | 'p2' | 'p3' | (string & {});

export interface ExecutionJSONObject {
  [key: string]: unknown;
}

export interface ExecutionContractView {
  execution_contract_mode?: string;
  tool_profile?: string;
  configured_tool_profile?: string;
  repair_plan_version?: number;
  repair_plan_hash?: string;
  repair_plan_source_execution_id?: string;
}

export interface ExecutionTerminalLog {
  command?: string;
  exit_code?: number;
  stdout?: string;
  stderr?: string;
  duration?: number;
  timestamp?: string;
}

export interface ExecutionTestResultDetail {
  total?: number;
  passed?: number;
  failed?: number;
  skipped?: number;
  pass_rate?: number;
  output?: string;
  coverage?: number;
  details?: Array<{
    name?: string;
    status?: string;
    duration?: number;
    message?: string;
    error?: string;
  }>;
}

export interface ExecutionResultOutputs {
  files?: Record<string, string>;
  terminal_logs?: ExecutionTerminalLog[];
  final_output?: string;
  summary?: string;
  test_results?: ExecutionTestResultDetail;
}

export interface ExecutionResultChanges {
  modified_files?: string[];
  new_files?: string[];
  deleted_files?: string[];
  git_diff?: string;
}

export interface ExecutionResultMetrics {
  reasoning_depth?: number;
  planning_steps?: number;
  self_corrections?: number;
  tool_calls?: number;
  tool_success_rate?: number;
  unique_tools?: number;
  average_step_duration?: number;
}

export interface ExecutionResultError {
  type?: string;
  message?: string;
  step?: number;
  details?: Record<string, string>;
  traceback?: string;
  retryable?: boolean;
}

export interface ExecutionStep {
  index: number;
  type: string;
  action?: string;
  input?: unknown;
  output?: unknown;
  error?: string;
  duration?: number;
  timestamp?: string;
  reasoning?: string;
}

export interface ExecutionResultPayload {
  status?: ExecutionStatus;
  success?: boolean;
  steps?: ExecutionStep[];
  outputs?: ExecutionResultOutputs;
  changes?: ExecutionResultChanges;
  test_result?: ExecutionTestResultDetail;
  metrics?: ExecutionResultMetrics;
  error?: ExecutionResultError;
}

export interface ExecutionRecord {
  id: string;
  benchmark_id: string;
  agent_id: string;
  task_id?: string;
  user_id?: string;
  organization_id?: string;
  idempotency_key?: string;
  status: ExecutionStatus;
  success: boolean;
  priority: ExecutionPriority;
  task_config?: ExecutionJSONObject | null;
  agent_config?: ExecutionJSONObject | null;
  result?: ExecutionResultPayload | null;
  error?: string;
  error_code?: string;
  artifact_key?: string;
  report_key?: string;
  started_at: string;
  completed_at?: string | null;
  duration: number;
  timeout: number;
  total_steps: number;
  steps_taken: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  sandbox_id?: string;
  sandbox_type?: string;
  metadata?: ExecutionJSONObject | null;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  contract?: ExecutionContractView | null;
}

export interface ExecutionTrace {
  id: number;
  record_id: string;
  step_index: number;
  step_type: string;
  action?: string;
  input?: string;
  output?: string;
  error?: string;
  duration?: number;
  timestamp: string;
  reasoning?: string;
  metadata?: ExecutionJSONObject | null;
}

export interface ExecutionSummaryStats {
  total: number;
  pending: number;
  running: number;
  completed: number;
  failed: number;
  timeout: number;
  cancelled: number;
  success_rate: number;
  avg_duration: number;
}

export interface CreateExecutionRequest {
  benchmark_id: string;
  agent_id: string;
  idempotency_key?: string;
  priority?: ExecutionPriority;
  task_config?: ExecutionJSONObject;
  agent_config?: ExecutionJSONObject;
  sandbox_id?: string;
  sandbox_type?: string;
  max_steps?: number;
}

export interface ExecutionFilter {
  ids?: string[];
  benchmark_id?: string;
  agent_id?: string;
  status?: ExecutionStatus[];
  priority?: string[];
  success?: boolean;
  started_after?: string;
  started_before?: string;
  completed_after?: string;
  completed_before?: string;
  sandbox_id?: string;
  user_id?: string;
  page?: number;
  page_size?: number;
  order_by?:
    | 'id'
    | 'benchmark_id'
    | 'agent_id'
    | 'status'
    | 'priority'
    | 'success'
    | 'started_at'
    | 'completed_at'
    | 'duration'
    | 'created_at'
    | 'updated_at';
  order_dir?: 'asc' | 'desc';
}

export const EXECUTION_STATUS_CONFIG = {
  pending: { label: '等待中', color: 'default' },
  running: { label: '运行中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  failed: { label: '失败', color: 'error' },
  cancelled: { label: '已取消', color: 'default' },
  timeout: { label: '超时', color: 'warning' },
} as const;

export const PRIORITY_CONFIG = {
  p0: { label: 'P0', color: 'error' },
  p1: { label: 'P1', color: 'warning' },
  p2: { label: 'P2', color: 'processing' },
  p3: { label: 'P3', color: 'default' },
} as const;
