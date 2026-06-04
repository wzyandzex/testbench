/**
 * Frontend API type contracts for docs/item.
 * Source baseline:
 * - docs/item/00-overview/contracts/routes.catalog.json
 * - internal/api/router/router.go
 *
 * Version: 2026-03-09.v4
 * Encoding: UTF-8
 */

export type ID = string;
export type ISODateTime = string;
export type DateYMD = string;

export interface ApiEnvelope<T> {
  code: number;
  message: string;
  data: T;
}

export interface PageData<T> {
  total: number;
  page: number;
  size: number;
  data: T[];
}

export interface ImportTaskPageData<T> {
  tasks: T[];
  total: number;
}

export type Visibility = "private" | "organization" | "public";
export type TaskPriority = "p0" | "p1" | "p2" | "p3" | "p4";

// Auth
export interface UserProfile {
  id: ID;
  username: string;
  email: string;
  role: "user" | "admin" | string;
  avatar?: string;
}

export interface AuthTokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: "Bearer" | string;
  current_org_id?: ID;
  user?: UserProfile;
}

// Organization
export interface OrganizationMembership {
  org_id: ID;
  org_name: string;
  display_name: string;
  role: "admin" | "member" | "guest" | string;
  is_owner: boolean;
  is_default: boolean;
  org_type?: string;
  joined_at?: ISODateTime;
}

// Benchmark
export type BenchmarkStatus = "draft" | "pending" | "approved" | "rejected" | string;

export interface BenchmarkItem {
  id: ID;
  name: string;
  display_name?: string;
  description?: string;
  type: string;
  language: string;
  difficulty: string;
  category?: string;
  status: BenchmarkStatus;
  visibility: Visibility;
  tags?: string[];
  created_at?: ISODateTime;
  updated_at?: ISODateTime;
}

export type LLMQualityJobStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";
export type LLMQualityJobStatusFilter = LLMQualityJobStatus | "running" | "terminal";

export interface LLMQualityJob {
  job_id: ID;
  status: LLMQualityJobStatus;
  report_id?: ID;
  error_message?: string;
  created_at?: ISODateTime;
  updated_at?: ISODateTime;
}

export type RiskLevel = "critical" | "high" | "medium" | "low" | "info" | string;

export interface LLMQualityFinding {
  dimension: string;
  severity: RiskLevel;
  evidence?: string;
  recommendation?: string;
  confidence?: number;
}

export interface LLMQualityReport {
  report_id: ID;
  benchmark_id: ID;
  overall_risk: RiskLevel;
  score: number;
  summary?: string;
  findings: LLMQualityFinding[];
  token_usage?: number;
  cost_usd?: number;
  latency_ms?: number;
  created_at?: ISODateTime;
}

export interface LLMQualityDimensionCapability {
  name: string;
  cost_class: "low" | "medium" | "high" | string;
  latency_class: "fast" | "medium" | "slow" | string;
  requires_model?: string[];
}

export interface LLMQualityResultPostProcessorCapability {
  name: string;
  active: boolean;
  required: boolean;
}

export interface LLMQualityCapabilitiesPayload {
  dimensions: string[];
  dimension_catalog: LLMQualityDimensionCapability[];
  result_post_processor_catalog?: LLMQualityResultPostProcessorCapability[];
  allowed_models: string[];
  default_model?: string;
  default_dimensions?: string[];
  dimension_template_by_source_type?: Record<string, string[]>;
  dimension_template_by_benchmark_type?: Record<string, string[]>;
}

export interface ValidateOrganizationLLMQualityPolicyPayload {
  valid: boolean;
  normalized_policy: Record<string, unknown>;
}

export interface LLMQualityPolicyValidationDetail {
  field: string;
  code: string;
  message: string;
}

export interface LLMQualityPolicyValidationErrorPayload {
  detail?: string;
  details?: LLMQualityPolicyValidationDetail[];
}

// SWE
export type SWETaskStatus =
  | "pending"
  | "running"
  | "testing"
  | "fixing"
  | "completed"
  | "failed"
  | "cancelled"
  | string;

export interface SWETask {
  id: ID;
  status: SWETaskStatus;
  current_phase?: string;
  phase?: string;
  progress?: number;
  message?: string;
  repo_url?: string;
  repo_owner?: string;
  repo_name?: string;
  issue_number?: number;
  issue_title?: string;
  test_strategy?: string;
  fix_attempted?: boolean;
  fix_success?: boolean;
  created_at?: ISODateTime;
  updated_at?: ISODateTime;
  completed_at?: ISODateTime;
}

// Execution
export type ExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "timeout"
  | "cancelled";

export interface ExecutionItem {
  id: ID;
  benchmark_id?: ID;
  agent_id?: ID;
  status: ExecutionStatus;
  success?: boolean;
  priority?: TaskPriority;
  started_at?: ISODateTime;
  completed_at?: ISODateTime;
  duration?: number;
}

export interface ExecutionTraceStep {
  id?: number;
  record_id?: ID;
  step_index: number;
  step_type?: string;
  action?: string;
  input?: unknown;
  output?: unknown;
  error?: string;
  duration?: number;
  timestamp?: ISODateTime;
  reasoning?: string;
  metadata?: Record<string, unknown>;
}

// Batch
export type BatchStatus = "pending" | "running" | "completed" | "failed" | "cancelled" | string;

export interface BatchSummary {
  id: ID;
  name?: string;
  status: BatchStatus;
  progress_percentage?: number;
  created_at?: ISODateTime;
}

// Scheduled
export interface ScheduledTask {
  id: ID;
  name: string;
  description?: string;
  enabled: boolean;
  status?: string;
  schedule?: {
    type: "cron" | "interval" | "once" | string;
    expression?: string;
  };
  created_at?: ISODateTime;
  updated_at?: ISODateTime;
}

// Agent
export interface AgentItem {
  id: ID;
  name: string;
  display_name?: string;
  type: string;
  endpoint: string;
  status: "active" | "inactive" | string;
  model_config?: Record<string, unknown>;
  capabilities?: string[];
}

export interface AgentExecuteRequest {
  prompt: string;
  max_steps?: number;
  timeout?: number;
  context?: Record<string, unknown>;
  tools?: string[];
}

// Cost
export interface CostSummary {
  total_cost: number;
  total_tokens: number;
  execution_count: number;
  currency: string;
  avg_cost_per_exec?: number;
}

export interface CostModelPrice {
  id?: ID;
  provider: string;
  model_name: string;
  input_price: number;
  output_price: number;
  currency?: string;
  is_active?: boolean;
  effective_date?: ISODateTime;
  expiry_date?: ISODateTime | null;
}

// Import
export type ImportTaskStatus = "pending" | "processing" | "completed" | "failed" | "cancelled";

export interface ImportTask {
  id: ID;
  dataset?: string;
  status: ImportTaskStatus;
  total?: number;
  imported?: number;
  failed?: number;
  error_msg?: string;
  created_at?: ISODateTime;
}

export interface ImportQualitySummary {
  checked: number;
  passed: number;
  denied: number;
  warnings: number;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  skipped?: number;
  total: number;
  quality_summary?: ImportQualitySummary;
  items?: unknown[];
}

// Export
export interface ExportFileInfo {
  file_url: string;
  file_name: string;
  file_size?: number;
  content_type?: string;
  expires_at?: ISODateTime;
  generated_at?: ISODateTime;
}

export interface ExportBatchResult {
  job_id?: ID;
  status: string;
  completed?: number;
  total?: number;
  result?: ExportFileInfo;
  error?: string;
}

// Notification (history)
export interface HistoryRecord {
  id: ID;
  organization_id?: ID;
  event_type?: string;
  priority?: string;
  task_id?: ID;
  worker_id?: ID;
  channel?: string;
  status?: string;
  ack_status?: "pending" | "acked" | "rejected" | string;
  acked_by?: string;
  acked_at?: ISODateTime;
  ack_comment?: string;
  message?: string;
  error?: string;
  timestamp?: ISODateTime;
  retries?: number;
  duration_ms?: number;
  data?: Record<string, unknown>;
}

export interface HistoryStats {
  [key: string]: number | Record<string, number>;
}

// Analytics
export interface AnalyzerReportSummary {
  report_id: ID;
  report_type: "performance_trends" | "agent_comparison" | "execution_stats" | string;
  generated_at?: ISODateTime;
  date?: DateYMD;
  object_name?: string;
}

export type AnalyzerReportPayload = Record<string, unknown>;

// Settings
export interface CacheAlert {
  level: "warning" | "critical" | string;
  prefix: string;
  metric: string;
  value: number;
  threshold: number;
  observed_at?: ISODateTime;
}

export interface KafkaTopicInfo {
  name: string;
  partitions?: number;
  replication?: number;
}
