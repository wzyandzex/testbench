import type { ListParams } from '@/types/api/common';

export type AgentType = 'code_edit' | 'terminal' | 'hybrid' | 'autonomous';
export type AgentStatus = 'active' | 'inactive' | 'maintained' | 'deprecated';
export type AgentRuntimeMode = 'native' | 'adk';
export type AgentToolProfile =
  | 'default'
  | 'readonly'
  | 'workspace_editor'
  | 'workspace_repair'
  | 'test_runner';
export type AgentExecutionStatus =
  | 'pending'
  | 'scheduled'
  | 'running'
  | 'completed'
  | 'failed'
  | 'timeout'
  | 'cancelled';
export type AgentExecutionStepType = 'reasoning' | 'tool_call' | 'observation' | 'correction';

export interface AgentJSONObject {
  [key: string]: unknown;
}

export interface AgentModelConfig extends AgentJSONObject {
  provider?: string;
  model_name?: string;
  base_url?: string;
  runtime_mode?: AgentRuntimeMode;
  tool_profile?: AgentToolProfile;
  params?: AgentJSONObject;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
}

export interface Agent {
  id: string;
  name: string;
  display_name?: string;
  description?: string;
  type: AgentType;
  endpoint: string;
  model_config?: AgentModelConfig;
  capabilities: string[];
  tools?: AgentJSONObject;
  status: AgentStatus;
  version?: string;
  metadata?: AgentJSONObject;
  has_api_key: boolean;
  total_executions: number;
  success_rate: number;
  avg_duration: number;
  created_by: string;
  organization_id?: string;
  is_default?: boolean;
  created_at: string;
  updated_at: string;
}

export interface AgentListParams extends ListParams {
  name_like?: string;
  types?: AgentType[];
  status?: AgentStatus[];
  has_capability?: string;
  order_by?:
    | 'id'
    | 'name'
    | 'type'
    | 'status'
    | 'created_by'
    | 'organization_id'
    | 'created_at'
    | 'updated_at';
  order_dir?: 'asc' | 'desc';
}

export interface CreateAgentDto {
  name: string;
  display_name?: string;
  description?: string;
  type: AgentType;
  endpoint: string;
  api_key?: string;
  model_config?: AgentModelConfig;
  capabilities?: string[];
  tools?: AgentJSONObject;
  status?: AgentStatus;
  version?: string;
  metadata?: AgentJSONObject;
}

export interface UpdateAgentDto {
  name?: string;
  display_name?: string;
  description?: string;
  type?: AgentType;
  endpoint?: string;
  api_key?: string;
  model_config?: AgentModelConfig;
  capabilities?: string[];
  tools?: AgentJSONObject;
  status?: AgentStatus;
  version?: string;
  metadata?: AgentJSONObject;
}

export interface AgentStats {
  id?: string;
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
  benchmark_stats?: unknown;
  first_execution_at?: string | null;
  last_execution_at?: string | null;
  updated_at?: string;
}

export interface AgentHealthStatus {
  status: string;
  agentId: string;
}

export interface AgentExecutionError {
  type: string;
  message: string;
  step: number;
  details?: Record<string, string>;
  retryable: boolean;
}

export interface AgentExecutionStep {
  index: number;
  type: AgentExecutionStepType;
  action: string;
  input?: unknown;
  output?: unknown;
  error?: string;
  duration: number;
  timestamp: string;
  reasoning?: string;
}

export interface AgentTokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  cache_read_tokens: number;
}

export interface AgentExecutionOutputs {
  files?: Record<string, string>;
  terminal_logs?: Array<{
    command: string;
    exit_code: number;
    stdout: string;
    stderr: string;
    duration: number;
    timestamp: string;
  }>;
  test_results?: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    output: string;
    coverage: number;
    details?: Array<{
      name: string;
      status: string;
      duration: number;
      message: string;
    }>;
  };
  final_output?: string;
  summary?: string;
}

export interface AgentExecutionChanges {
  modified_files?: string[];
  new_files?: string[];
  deleted_files?: string[];
  git_diff?: string;
}

export interface AgentExecutionMetrics {
  reasoning_depth?: number;
  planning_steps?: number;
  self_corrections?: number;
  tool_calls?: number;
  tool_success_rate?: number;
  unique_tools?: number;
  average_step_duration?: number;
  idle_time?: number;
}

export interface AgentExecutionResult {
  task_id: string;
  benchmark_id: string;
  execution_record_id?: string;
  status: AgentExecutionStatus;
  success: boolean;
  error?: AgentExecutionError | null;
  steps: AgentExecutionStep[];
  duration: number;
  steps_taken: number;
  tokens_used?: AgentTokenUsage;
  outputs?: AgentExecutionOutputs;
  changes?: AgentExecutionChanges;
  metrics?: AgentExecutionMetrics;
  metadata?: Record<string, string>;
}

export interface ExecuteAgentDto {
  prompt: string;
  max_steps?: number;
  timeout?: number;
  benchmark_id?: string;
  context?: AgentJSONObject;
  tools?: string[];
}
