import type { PaginatedResponse } from './common';

export type BatchStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type BatchTaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
export type BatchPriority = 'p0' | 'p1' | 'p2' | 'p3' | 'p4';
export type BatchExecutionMode = 'sequential' | 'parallel' | 'limited';

export interface TaskConfig {
  max_steps: number;
  timeout: number;
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

export interface CancelBatchResponse {
  id: string;
  status: BatchStatus;
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
  started_at?: string | null;
  completed_at?: string | null;
  executionMode?: BatchExecutionMode;
}

export interface BatchSettings {
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  stopOnFirstFailure: boolean;
  emailOnCompletion: boolean;
}

export interface BatchItem {
  id: string;
  benchmarkId: string;
  benchmarkName: string;
  agentId: string;
  agentName: string;
  status: BatchTaskStatus;
  duration?: number;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  executionId?: string;
}

export interface BatchLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  itemId?: string;
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
  organization_id?: string | null;
  created_at: string;
  started_at?: string | null;
  completed_at?: string | null;
  report_id?: string | null;
  progress_percentage?: number;
  executionMode?: BatchExecutionMode;
  items?: BatchItem[];
  logs?: BatchLog[];
  report?: BatchReport | null;
}

export interface BatchTaskProgress {
  task_id: string;
  agent_id: string;
  benchmark_id: string;
  status: BatchTaskStatus;
  error?: string;
  started_at?: string | null;
  completed_at?: string | null;
  duration?: number;
}

export interface BatchTaskQueryParams {
  agent_id?: string;
  benchmark_id?: string;
  status?: BatchTaskStatus[];
  page?: number;
  page_size?: number;
  order_by?: 'created_at' | 'started_at' | 'completed_at';
  order_dir?: 'asc' | 'desc';
}

export interface BatchListParams {
  status?: BatchStatus;
  page?: number;
  page_size?: number;
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

export interface BatchReportBenchmarkStats {
  total_executions: number;
  success_count: number;
  failed_count: number;
  success_rate: number;
  avg_duration: number;
}

export interface BatchReportAgentStats {
  success_count: number;
  failed_count: number;
  success_rate: number;
  avg_duration: number;
  tokens_used: number;
  cost: number;
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
  benchmark_stats: Record<string, BatchReportBenchmarkStats>;
}

export interface BenchmarkComparison {
  benchmark_id: string;
  benchmark_name: string;
  total_executions: number;
  success_count: number;
  failed_count: number;
  success_rate: number;
  avg_duration: number;
  agent_stats: Record<string, BatchReportAgentStats>;
}

export interface CostSummary {
  total_cost: number;
  currency: string;
  cost_by_agent: Record<string, number>;
  cost_by_benchmark: Record<string, number>;
}

export interface AgentRanking {
  rank: number;
  agent_id: string;
  agent_name: string;
  value: number;
  unit: string;
}

export interface Rankings {
  by_success_rate: AgentRanking[];
  by_speed: AgentRanking[];
  by_cost: AgentRanking[];
  by_tokens: AgentRanking[];
}

export interface BatchReport {
  id: string;
  batch_id: string;
  summary: BatchSummaryReport;
  agent_comparison: AgentComparison[];
  benchmark_comparison: BenchmarkComparison[];
  cost_summary: CostSummary;
  rankings: Rankings;
  charts_data: Record<string, unknown>;
  created_at: string;
}

export interface BatchAgentReference {
  id: string;
  name: string;
  display_name?: string;
  description?: string;
  type?: string;
  status?: string;
}

export interface BatchBenchmarkReference {
  id: string;
  name: string;
  display_name?: string;
  description?: string;
  type?: string;
  language?: string;
  category?: string;
  difficulty?: string;
  status?: string;
  approval_status?: string;
}

export type BatchPageResponse<T> = PaginatedResponse<T>;

export const BATCH_STATUS_CONFIG = {
  pending: { label: '等待中', color: 'default' },
  running: { label: '运行中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  failed: { label: '失败', color: 'error' },
  cancelled: { label: '已取消', color: 'default' },
} as const satisfies Record<BatchStatus, { label: string; color: 'default' | 'processing' | 'success' | 'error' | 'warning' }>;

export const BATCH_TASK_STATUS_CONFIG = {
  pending: { label: '等待中', color: 'default' },
  running: { label: '运行中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  failed: { label: '失败', color: 'error' },
  skipped: { label: '已跳过', color: 'warning' },
} as const satisfies Record<BatchTaskStatus, { label: string; color: 'default' | 'processing' | 'success' | 'error' | 'warning' }>;

export const EXECUTION_MODE_CONFIG = {
  sequential: { label: '顺序执行', color: 'default' },
  parallel: { label: '全并发', color: 'success' },
  limited: { label: '受限并发', color: 'processing' },
} as const satisfies Record<BatchExecutionMode, { label: string; color: 'default' | 'processing' | 'success' | 'error' | 'warning' }>;

export const BATCH_PRIORITY_CONFIG = {
  p0: { label: 'P0', color: 'error' },
  p1: { label: 'P1', color: 'warning' },
  p2: { label: 'P2', color: 'processing' },
  p3: { label: 'P3', color: 'default' },
  p4: { label: 'P4', color: 'default' },
} as const satisfies Record<BatchPriority, { label: string; color: 'default' | 'processing' | 'success' | 'error' | 'warning' }>;
