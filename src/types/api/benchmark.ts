/**
 * Benchmark 类型定义
 * 参考: front/03-api/benchmark-api.md, front/05-types/api-types.md
 */

// ✅ rendering-hoist-jsx: 提取静态配置
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

// 标签
export interface Tag {
  id: number;
  name: string;
  color: string;
  usage_count?: number;
  created_at: string;
}

// 代码状态
export interface CodeState {
  repo_url?: string;
  commit_hash?: string;
  branch?: string;
  files: Record<string, string>;
  diff?: string;
  base_dir?: string;
}

// 指令
export interface Instructions {
  user_prompt: string;
  system_prompt?: string;
  context?: string;
  examples?: string[];
  hints?: string[];
}

// 资源限制
export interface ResourceLimits {
  max_memory_mb: number;
  max_cpu_count: number;
  max_duration: number;
  max_disk_usage_mb: number;
  network_access: boolean;
}

// Agent 任务配置
export interface AgentTaskConfig {
  mode: 'code_edit' | 'terminal' | 'hybrid' | 'autonomous';
  tools: string[];
  temperature?: number;
  max_tokens?: number;
  max_steps?: number;
  allow_retry?: boolean;
  verbose?: boolean;
}

// Benchmark 配置
export interface BenchmarkConfig {
  initial_state: CodeState;
  required_files: string[];
  instructions: Instructions;
  goal: string;
  constraints?: string[];
  success_criteria?: string[];
  timeout: number; // 纳秒
  max_attempts: number;
  resource_limits: ResourceLimits;
  agent_config: AgentTaskConfig;
}

// 测试期望
export interface TestExpectations {
  exit_code?: number;
  output?: string;
  not_contains?: string[];
  contains?: string[];
  min_pass_rate?: number;
}

// 测试配置
export interface TestConfig {
  type: 'unit' | 'integration' | 'e2e' | 'custom';
  script?: string;
  command: string;
  args?: string[];
  timeout: number;
  env?: Record<string, string>;
  expected: TestExpectations;
}

// Benchmark 文件
export interface BenchmarkFile {
  path: string;
  size: number;
  content_preview?: string;
}

// Benchmark 统计
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

// Benchmark 基础信息
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
  source_id?: string;
  source_type?: string;
  original_id?: string;
  url?: string;
  created_by: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
  stats?: {
    total_runs: number;
    success_rate: number;
  };
}

// Benchmark 详情
export interface BenchmarkDetail extends Benchmark {
  config: BenchmarkConfig;
  test_config: TestConfig;
  created_by_name: string;
  stats: BenchmarkStats;
  files: BenchmarkFile[];
}

// 筛选参数
export interface BenchmarkFilter {
  page?: number;
  page_size?: number;
  name_like?: string;
  type?: BenchmarkType;
  types?: BenchmarkType[];
  language?: string;
  languages?: string[];
  difficulty?: DifficultyLevel;
  difficulties?: DifficultyLevel[];
  category?: string;
  categories?: string[];
  status?: BenchmarkStatus[];
  tags?: string[];
  visibility?: Visibility;
  created_by?: string;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
}

// 创建请求
export interface CreateBenchmarkRequest {
  name: string;
  display_name?: string;
  description?: string;
  type: BenchmarkType;
  language: string;
  difficulty?: DifficultyLevel;
  category?: string;
  tags?: string[];
  source_id?: string;
  source_type?: string;
  original_id?: string;
  url?: string;
  status?: BenchmarkStatus;
  config: BenchmarkConfig;
  test_config: TestConfig;
}

// 更新请求
export interface UpdateBenchmarkRequest {
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

export interface BenchmarkCreateTemplateCard {
  key: string;
  display_name: string;
  description: string;
  workflow: 'source_first' | 'template_first' | 'import';
  source_requirement: 'required' | 'optional' | 'none';
  supported_source_types?: Array<'git' | 'zip'>;
  standard_asset_purpose?: 'sample_acceptance' | 'reusable_capability' | string;
  supported_framework_families?: string[];
  validation_lanes?: string[];
  default_benchmark_type?: BenchmarkType;
  suggested_languages?: string[];
  visible_field_groups?: string[];
  advanced_field_groups?: string[];
  recommended: boolean;
}

export interface BenchmarkCreateSourceIndexView {
  status: string;
  chunk_count: number;
  file_count: number;
  error_message?: string;
  build_started_at?: string;
  build_completed_at?: string;
  last_updated_at?: string;
  created_at: string;
}

export interface BenchmarkCreateSourceListItemView {
  id: string;
  name: string;
  source_type: 'git' | 'zip';
  git_url?: string;
  branch?: string;
  commit_sha?: string;
  detected_type?: 'backend' | 'frontend' | 'llm_app' | 'agent' | 'unknown';
  created_by: string;
  created_at: string;
  updated_at: string;
  index?: BenchmarkCreateSourceIndexView;
  recommended_template_keys?: string[];
}

export interface BenchmarkCreateSupportSourcesResponse {
  page: number;
  page_size: number;
  total: number;
  items: BenchmarkCreateSourceListItemView[];
}

export interface BenchmarkCreateSupportSourcesParams {
  page?: number;
  page_size?: number;
  name?: string;
  source_type?: 'git' | 'zip';
  detected_type?: 'backend' | 'frontend' | 'llm_app' | 'agent' | 'unknown';
  created_by?: string;
  order_by?: 'created_at' | 'updated_at' | 'name' | 'source_type' | 'detected_type';
  order_dir?: 'asc' | 'desc';
}

export interface ResolveBenchmarkCreateSupportDraftRequest {
  template_key: string;
  source_id?: string;
}

export interface BenchmarkCreateDraftRequirement {
  code: string;
  field: string;
  message: string;
}

export interface BenchmarkCreateDraftWarning {
  code: string;
  message: string;
}

export interface BenchmarkCreateSupportResolveDraftResponse {
  template: BenchmarkCreateTemplateCard;
  source?: BenchmarkCreateSourceListItemView;
  can_submit: boolean;
  language_candidates?: string[];
  create_request: CreateBenchmarkRequest;
  missing_requirements?: BenchmarkCreateDraftRequirement[];
  warnings?: BenchmarkCreateDraftWarning[];
}

// 执行进度 (Benchmark 专用，避免与 execution.ts 冲突)
export interface BenchmarkExecutionProgress {
  current_step: number;
  total_steps: number;
  percentage: number;
  message: string;
}

// 执行结果 (Benchmark 专用，避免与 execution.ts 冲突)
export interface BenchmarkExecutionResult {
  success: boolean;
  exit_code: number;
  output: string;
  error?: string;
  duration_ms: number;
  tokens_used: number;
  cost: number;
}

// 执行摘要
export interface ExecutionSummary {
  id: string;
  agent_id: string;
  agent_name: string;
  status: 'pending' | 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';
  progress?: BenchmarkExecutionProgress;
  result?: BenchmarkExecutionResult;
  started_at: string;
  completed_at?: string;
  duration_ms?: number;
  created_at: string;
}

export type BenchmarkRunPriority = 'p0' | 'p1' | 'p2' | 'p3';

export interface CreateBenchmarkRunRequest {
  agent_id: string;
  priority?: BenchmarkRunPriority;
}

export interface BenchmarkRunDispatch {
  task_id: string;
  status: string;
  priority: BenchmarkRunPriority;
  submitted_at: string;
}

export interface BenchmarkRunLaunch {
  benchmark_id: string;
  agent_id: string;
  launch_state: 'submitted';
  dispatch: BenchmarkRunDispatch;
}

export const BENCHMARK_RUN_PRIORITY_CONFIG = {
  p0: { label: 'P0', color: 'error', description: '最高优先级，立即调度' },
  p1: { label: 'P1', color: 'warning', description: '高优先级，适合人工触发紧急验证' },
  p2: { label: 'P2', color: 'processing', description: '默认优先级' },
  p3: { label: 'P3', color: 'default', description: '低优先级，适合后台排队' },
} as const;

// 标签创建请求
export interface CreateTagRequest {
  name: string;
  color?: string;
}

// Fork 关系
export interface BenchmarkFork {
  id: string;
  parent_id: string;
  child_id: string;
  forked_by: string;
  parent_version: number;
  parent_updated_at: string;
  has_updates: boolean;
  has_parent_updates: boolean;
  parent_updates_seen: boolean;
  last_check_at?: string;
  forked_at: string;
  created_at: string;
  updated_at: string;
  // 关联的 Benchmark 简要信息（API 可能返回）
  parent?: Benchmark;
  child?: Benchmark;
}

// Fork 列表项（包含额外的显示信息）
export interface BenchmarkForkItem extends BenchmarkFork {
  parent_name: string;
  child_name: string;
}

// 审批状态更新请求
export interface UpdateBenchmarkStatusRequest {
  action: 'approve' | 'reject';
  reason?: string;
}

// ==================== Case Asset 相关 ====================

export type CaseAssetStatus = 'active' | 'inactive' | 'retired';
export type CaseAssetType = 'selector' | 'structured' | 'assertion_body' | 'assertion_line';

export interface BenchmarkCaseAsset {
  id: string;
  benchmark_id: string;
  organization_id: string;
  case_key: string;
  case_name?: string;
  source_scope: string;
  source_path: string;
  case_type: CaseAssetType;
  status: CaseAssetStatus;
  current_version: number;
  current_version_id?: string;
  content_hash: string;
  last_seen_benchmark_version: number;
  last_present_benchmark_version: number;
  lifecycle_source?: string;
  lifecycle_reason?: string;
  lifecycle_updated_by?: string;
  lifecycle_updated_at?: string;
  created_at: string;
  updated_at: string;
}

export const CASE_ASSET_STATUS_CONFIG = {
  active: { label: '活跃', color: 'success' },
  inactive: { label: '未激活', color: 'default' },
  retired: { label: '已退休', color: 'error' },
} as const;

export const CASE_ASSET_TYPE_CONFIG = {
  selector: { label: '选择器', color: 'blue' },
  structured: { label: '结构化', color: 'green' },
  assertion_body: { label: '断言体', color: 'orange' },
  assertion_line: { label: '断言行', color: 'purple' },
} as const;

// ==================== Case Governance 相关 ====================

export type GovernanceTrustPosture = 'trusted' | 'watch' | 'untrusted' | 'inactive';
export type GovernanceEvidenceFreshness = 'missing' | 'fresh' | 'aging' | 'stale';
export type GovernanceConfidencePosture =
  | 'not_applicable' | 'authoritative' | 'degraded'
  | 'insufficient_evidence' | 'low_confidence' | 'decayed';
export type LifecycleAction = 'created' | 'versioned' | 'deactivated' | 'reactivated' | 'retired' | 'restored';
export type GovernanceAction = 'validate_cases' | 'review_cases' | 'recheck_quality' | 'inspect_detail';

export const GOVERNANCE_TRUST_CONFIG = {
  trusted: { label: '可信', color: 'success' },
  watch: { label: '观察', color: 'warning' },
  untrusted: { label: '不可信', color: 'error' },
  inactive: { label: '未激活', color: 'default' },
} as const;

export const GOVERNANCE_FRESHNESS_CONFIG = {
  fresh: { label: '新鲜', color: 'success' },
  aging: { label: '老化', color: 'warning' },
  stale: { label: '过时', color: 'error' },
  missing: { label: '缺失', color: 'default' },
} as const;

export const GOVERNANCE_CONFIDENCE_CONFIG = {
  authoritative: { label: '权威', color: 'success' },
  degraded: { label: '退化', color: 'warning' },
  insufficient_evidence: { label: '证据不足', color: 'default' },
  low_confidence: { label: '低置信', color: 'warning' },
  decayed: { label: '衰减', color: 'error' },
  not_applicable: { label: '不适用', color: 'default' },
} as const;

export const AUTHORITY_STATUS_CONFIG = {
  authoritative: { label: '权威', color: 'success' },
  degraded: { label: '退化', color: 'warning' },
  insufficient_evidence: { label: '证据不足', color: 'default' },
} as const;

export const LIFECYCLE_ACTION_CONFIG = {
  created: { label: '创建', color: 'blue' },
  versioned: { label: '版本更新', color: 'cyan' },
  deactivated: { label: '停用', color: 'default' },
  reactivated: { label: '重新激活', color: 'green' },
  retired: { label: '退休', color: 'red' },
  restored: { label: '恢复', color: 'green' },
} as const;

export const GOVERNANCE_ACTION_CONFIG = {
  validate_cases: { label: '执行验证' },
  review_cases: { label: '执行审查' },
  recheck_quality: { label: '质量复查' },
  inspect_detail: { label: '查看详情' },
} as const;

export interface CaseGovernanceIntelligenceView {
  trust_posture?: GovernanceTrustPosture;
  trust_reason?: string;
  evidence_freshness?: GovernanceEvidenceFreshness;
  confidence_posture?: GovernanceConfidencePosture;
  active_signals?: string[];
}

export interface CaseGovernanceView {
  case_asset_id: string;
  benchmark_id: string;
  case_key: string;
  case_name?: string;
  source_path?: string;
  case_type: CaseAssetType;
  status: CaseAssetStatus;
  current_version: number;
  governance_risk?: string;
  governance_drift_status?: string;
  detection_decision?: string;
  detection_risk_level?: string;
  detection_authority_status?: string;
  detection_degraded_reason?: string;
  detection_issue_count: number;
  validation_aggregate_outcome?: string;
  validation_authority_status?: string;
  validation_degraded_reason?: string;
  validation_pass_rate?: number;
  validation_flaky: boolean;
  review_decision?: string;
  review_risk?: string;
  review_authority_status?: string;
  review_degraded_reason?: string;
  review_low_confidence: boolean;
  fusion_decision?: string;
  fusion_risk_level?: string;
  fusion_insufficient_evidence: boolean;
  remediation_attempt_count: number;
  remediation_repair_state?: string;
  remediation_comparison_outcome?: string;
  governance_intelligence?: CaseGovernanceIntelligenceView;
  operator_attention_required: boolean;
  operator_attention_reason?: string;
  available_actions?: GovernanceAction[];
  primary_action?: GovernanceAction;
  primary_action_reason?: string;
}

export interface BenchmarkCaseLifecycleAuditLog {
  id: string;
  case_key: string;
  action: LifecycleAction;
  from_status?: CaseAssetStatus;
  to_status?: CaseAssetStatus;
  trigger_source: string;
  reason?: string;
  actor_user_id?: string;
  created_at: string;
}

// ==================== Case Detection 相关 ====================

export type QualityGateStage = 'import' | 'activation' | 'recheck';
export type QualityDecision = 'allow' | 'allow_with_warnings' | 'deny';
export type QualitySeverity = 'critical' | 'high' | 'medium' | 'low';
export type StaticAuthorityStatus = 'authoritative' | 'degraded' | 'mixed';

export const QUALITY_GATE_STAGE_CONFIG = {
  import: { label: '导入', color: 'blue' },
  activation: { label: '激活', color: 'green' },
  recheck: { label: '复查', color: 'orange' },
} as const;

export const QUALITY_DECISION_CONFIG = {
  allow: { label: '通过', color: 'success' },
  allow_with_warnings: { label: '警告通过', color: 'warning' },
  deny: { label: '拒绝', color: 'error' },
} as const;

export const QUALITY_SEVERITY_CONFIG = {
  critical: { label: '严重', color: 'red' },
  high: { label: '高', color: 'orange' },
  medium: { label: '中', color: 'gold' },
  low: { label: '低', color: 'green' },
} as const;

export const STATIC_AUTHORITY_STATUS_CONFIG = {
  authoritative: { label: '权威', color: 'success' },
  degraded: { label: '退化', color: 'warning' },
  mixed: { label: '混合', color: 'default' },
} as const;

export interface BenchmarkCaseDetectionIssue {
  id?: number;
  rule_code: string;
  rule_name?: string;
  dimension: string;
  severity: QualitySeverity;
  confidence?: number;
  field_path?: string;
  message: string;
  suggestion?: string;
}

export interface BenchmarkCaseDetectionReport {
  id: string;
  benchmark_id: string;
  case_key: string;
  case_name?: string;
  stage: QualityGateStage;
  decision: QualityDecision;
  risk_level: QualitySeverity;
  authority_status: StaticAuthorityStatus;
  degraded_reason?: string;
  confidence: number;
  score: number;
  critical_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  issue_count: number;
  issues: BenchmarkCaseDetectionIssue[];
  trigger_source?: string;
  created_at: string;
}

export interface BenchmarkCaseDetectionDiff {
  current_report_id: string;
  previous_report_id: string;
  benchmark_id?: string;
  stage?: QualityGateStage;
  current_decision?: QualityDecision;
  previous_decision?: QualityDecision;
  changed_cases: number;
  added_cases: number;
  removed_cases: number;
  new_high_risk_cases: number;
  resolved_high_risk_cases: number;
  score_delta: number;
  generated_at: string;
}

// ==================== Case Validation 相关 ====================

export type ValidationJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
export type ValidationExpectedOutcome = 'unknown' | 'pass' | 'fail';
export type ValidationObservedOutcome = 'pass' | 'fail' | 'error' | 'unsupported';
export type ValidationAuthorityStatus = 'authoritative' | 'degraded' | 'mixed';

export const VALIDATION_JOB_STATUS_CONFIG = {
  pending: { label: '等待中', color: 'default' },
  processing: { label: '处理中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  failed: { label: '失败', color: 'error' },
  cancelled: { label: '已取消', color: 'default' },
} as const;

export const VALIDATION_OBSERVED_OUTCOME_CONFIG = {
  pass: { label: '通过', color: 'success' },
  fail: { label: '失败', color: 'error' },
  error: { label: '错误', color: 'warning' },
  unsupported: { label: '不支持', color: 'default' },
} as const;

export interface BenchmarkCaseValidationJob {
  id: string;
  benchmark_id: string;
  organization_id: string;
  created_by: string;
  status: ValidationJobStatus;
  request_payload?: unknown;
  error_message?: string;
  idempotency_key?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TriggerValidationResponse {
  job_id: string;
  status: ValidationJobStatus;
  created_at: string;
}

export interface CaseValidationPreview {
  benchmark_id: string;
  organization_id?: string;
  manifest_version?: string;
  total_cases: number;
  supported_cases: number;
  unsupported_cases: number;
  cases?: CaseValidationPreviewCase[];
}

export interface CaseValidationPreviewCase {
  case_key: string;
  case_name?: string;
  supported: boolean;
  adapter_name?: string;
  expected_outcome: ValidationExpectedOutcome;
  unsupported_reason_code?: string;
  unsupported_reason_description?: string;
}

export interface CaseValidationCapabilitiesView {
  benchmark_id: string;
  organization_id?: string;
  manifest?: unknown;
}

export interface BenchmarkCaseValidationSummary {
  job_id: string;
  benchmark_id: string;
  organization_id?: string;
  total_cases: number;
  supported_cases: number;
  unsupported_cases: number;
  expected_pass_cases: number;
  expected_fail_cases: number;
  matched_cases: number;
  mismatched_cases: number;
  flaky_cases: number;
  error_cases: number;
  authority_status: ValidationAuthorityStatus;
  authoritative_cases: number;
  degraded_cases: number;
  degraded_reason?: string;
  stats_json?: unknown;
  generated_at: string;
}

export interface BenchmarkCaseValidationCaseReport {
  id: string;
  job_id: string;
  benchmark_id: string;
  organization_id?: string;
  case_key: string;
  case_name?: string;
  case_content_hash?: string;
  adapter_name?: string;
  expected_outcome: ValidationExpectedOutcome;
  aggregation_policy?: string;
  attempt_count: number;
  pass_attempts: number;
  fail_attempts: number;
  error_attempts: number;
  unsupported_attempts: number;
  matched_attempts: number;
  mismatched_attempts: number;
  pass_rate: number;
  match_rate: number;
  authority_status: ValidationAuthorityStatus;
  degraded_reason?: string;
  flaky: boolean;
  aggregate_outcome: ValidationObservedOutcome;
  aggregate_matched?: boolean;
  created_at: string;
}

export interface BenchmarkCaseExecutionEvidence {
  id: string;
  job_id: string;
  case_key: string;
  case_name?: string;
  attempt: number;
  adapter_name?: string;
  expected_outcome: ValidationExpectedOutcome;
  observed_outcome: ValidationObservedOutcome;
  matched_expectation?: boolean;
  unsupported_reason?: string;
  output_text?: string;
  error_message?: string;
  exit_code?: number;
  duration_ms: number;
  created_at: string;
}

// ==================== Case Review 相关 ====================

export type ReviewDecision = 'pass' | 'warn' | 'block';
export type ReviewRisk = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type ReviewDriftStatus = 'new' | 'stable' | 'risk_up' | 'risk_down' | 'decision_changed' | 'confidence_down';
export type ReviewProviderExecutionMode = 'llm_success' | 'llm_response_fallback' | 'llm_error_fallback' | 'benchmark_context_fallback' | 'snapshot_build_failed' | 'heuristic_fallback' | 'mixed';

export const REVIEW_DECISION_CONFIG = {
  pass: { label: '通过', color: 'success' },
  warn: { label: '警告', color: 'warning' },
  block: { label: '阻止', color: 'error' },
} as const;

export const REVIEW_RISK_CONFIG = {
  critical: { label: '严重', color: 'red' },
  high: { label: '高', color: 'orange' },
  medium: { label: '中', color: 'gold' },
  low: { label: '低', color: 'green' },
  info: { label: '信息', color: 'blue' },
} as const;

export const REVIEW_DRIFT_STATUS_CONFIG = {
  new: { label: '新', color: 'blue' },
  stable: { label: '稳定', color: 'green' },
  risk_up: { label: '风险升高', color: 'orange' },
  risk_down: { label: '风险降低', color: 'green' },
  decision_changed: { label: '决策变更', color: 'red' },
  confidence_down: { label: '置信度下降', color: 'warning' },
} as const;

export interface BenchmarkCaseReviewJob {
  id: string;
  benchmark_id: string;
  organization_id: string;
  created_by: string;
  model?: string;
  status: ValidationJobStatus;
  request_payload?: unknown;
  error_message?: string;
  report_id?: string;
  idempotency_key?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TriggerReviewResponse {
  job_id: string;
  status: ValidationJobStatus;
  created_at: string;
}

export interface BenchmarkCaseReviewReport {
  id: string;
  job_id: string;
  benchmark_id: string;
  organization_id?: string;
  model?: string;
  prompt_version?: string;
  decision: ReviewDecision;
  total_cases: number;
  pass_cases: number;
  warn_cases: number;
  block_cases: number;
  low_confidence_cases: number;
  recommended_recheck_cases?: number;
  triggered_recheck_cases?: number;
  error_cases?: number;
  average_confidence: number;
  authority_status: ValidationAuthorityStatus;
  authoritative_cases: number;
  degraded_cases: number;
  provider_execution_mode?: ReviewProviderExecutionMode;
  provider_name?: string;
  resolved_model?: string;
  llm_call_succeeded?: boolean;
  degraded_reason?: string;
  summary?: string;
  generated_at: string;
}

export interface BenchmarkCaseReviewCaseReport {
  id: string;
  report_id: string;
  benchmark_id: string;
  case_key: string;
  case_name?: string;
  decision: ReviewDecision;
  risk: ReviewRisk;
  confidence: number;
  low_confidence: boolean;
  low_confidence_reason?: string;
  authority_status: ValidationAuthorityStatus;
  provider_execution_mode?: ReviewProviderExecutionMode;
  degraded_reason?: string;
  summary?: string;
  findings_json?: unknown;
  drift_status?: ReviewDriftStatus;
  drift_summary?: string;
  previous_decision?: ReviewDecision;
  previous_risk?: ReviewRisk;
  previous_confidence?: number;
  validation_outcome?: string;
  validation_flaky?: boolean;
  recheck_recommended?: boolean;
  recheck_reason?: string;
  created_at: string;
}

// ==================== Case Fusion 相关 ====================

export interface BenchmarkCaseFusionReport {
  id: string;
  benchmark_id: string;
  organization_id?: string;
  trigger_source?: string;
  static_report_id?: string;
  validation_summary_job_id?: string;
  review_report_id?: string;
  total_cases: number;
  pass_cases: number;
  warn_cases: number;
  block_cases: number;
  insufficient_cases: number;
  average_confidence: number;
  stats_json?: unknown;
  generated_at: string;
}

export interface BenchmarkCaseFusionCaseReport {
  id: string;
  fusion_report_id: string;
  benchmark_id: string;
  case_key: string;
  case_name?: string;
  final_decision: ReviewDecision;
  final_risk_level: ReviewRisk;
  final_score: number;
  confidence: number;
  evidence_completeness: number;
  insufficient_evidence: boolean;
  // 三大支柱信号
  static_decision?: string;
  static_risk_level?: string;
  static_issue_count?: number;
  validation_outcome?: string;
  validation_matched?: boolean;
  validation_flaky?: boolean;
  validation_evidence_count?: number;
  review_decision?: string;
  review_risk?: string;
  review_confidence?: number;
  // 派生
  low_confidence?: boolean;
  drift_status?: string;
  summary?: string;
  decision_trace_json?: unknown;
  created_at: string;
}

// ==================== Governance Trust Policy 相关 ====================

export interface CaseGovernanceTrustPolicyProfile {
  evidence_aging_hours: number;
  evidence_stale_hours: number;
  review_low_confidence_threshold: number;
  auto_review_after_validation: boolean;
  auto_validation_after_review_low_confidence: boolean;
  auto_validation_on_quality_recheck: boolean;
}

export interface CaseGovernanceTrustPolicyMeta {
  updated_by?: string;
  updated_at?: string;
}

export interface ResolvedCaseGovernanceTrustPolicy {
  effective: CaseGovernanceTrustPolicyProfile;
  system_default: CaseGovernanceTrustPolicyProfile;
  organization?: CaseGovernanceTrustPolicyProfile;
  organization_meta?: CaseGovernanceTrustPolicyMeta;
}

export interface OrganizationGovernanceTrustPolicy extends CaseGovernanceTrustPolicyProfile {
  organization_id: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface TrustPolicyValidationResult {
  valid: boolean;
  normalized_policy?: CaseGovernanceTrustPolicyProfile;
  detail?: string;
  details?: string[];
}

export interface TrustPolicyAuditLog {
  id: number;
  organization_id: string;
  actor_user_id: string;
  actor_role: string;
  action: string;
  before_snapshot?: Record<string, unknown>;
  after_snapshot?: Record<string, unknown>;
  request_method: string;
  request_path: string;
  client_ip?: string;
  created_at: string;
}

// ==================== Governance Decision Policy 相关 ====================

export const GOVERNANCE_ACTIONS = {
  validate_cases: { label: '执行验证', color: 'blue' },
  review_cases: { label: '执行审查', color: 'purple' },
  recheck_quality: { label: '质量复查', color: 'orange' },
  inspect_detail: { label: '查看详情', color: 'default' },
} as const;

export const TRUST_CLASSIFICATION_REASONS = [
  'replay_regressed', 'replay_unavailable', 'repeated_unimproved_remediation',
  'version_shifted_after_repair', 'review_degraded', 'validation_degraded',
  'review_recheck_triggered', 'validation_environmental_failure',
  'validation_retryable_failure', 'missing_validation_evidence',
  'missing_review_evidence', 'fusion_insufficient_evidence',
  'detection_security_high_risk', 'detection_executability_high_risk',
  'detection_blocking', 'review_recheck_recommended', 'review_low_confidence',
  'validation_flaky', 'governance_drift_detected', 'detection_degraded',
  'detection_issues_present', 'evidence_stale', 'evidence_aging',
] as const;

export const DEFAULT_UNTRUSTED_REASONS = [
  'replay_regressed', 'replay_unavailable', 'repeated_unimproved_remediation',
  'version_shifted_after_repair', 'review_degraded', 'validation_degraded',
  'review_recheck_triggered', 'validation_environmental_failure',
  'validation_retryable_failure', 'missing_validation_evidence',
  'missing_review_evidence', 'fusion_insufficient_evidence',
  'detection_security_high_risk', 'detection_executability_high_risk',
  'detection_blocking',
] as const;

export const DEFAULT_WATCH_REASONS = [
  'review_recheck_recommended', 'review_low_confidence', 'validation_flaky',
  'governance_drift_detected', 'detection_degraded', 'detection_issues_present',
  'evidence_stale', 'evidence_aging',
] as const;

export const DEFAULT_PRIMARY_ACTION_BY_REASON: Record<string, string> = {
  retired: 'inspect_detail',
  inactive_case: 'inspect_detail',
  replay_regressed: 'inspect_detail',
  replay_unavailable: 'inspect_detail',
  repeated_unimproved_remediation: 'recheck_quality',
  version_shifted_after_repair: 'inspect_detail',
  review_degraded: 'review_cases',
  validation_degraded: 'validate_cases',
  review_recheck_triggered: 'inspect_detail',
  validation_environmental_failure: 'validate_cases',
  validation_retryable_failure: 'validate_cases',
  review_recheck_recommended: 'recheck_quality',
  missing_validation_evidence: 'validate_cases',
  missing_review_evidence: 'review_cases',
  fusion_insufficient_evidence: 'recheck_quality',
  review_low_confidence: 'review_cases',
  validation_flaky: 'validate_cases',
  governance_drift_detected: 'recheck_quality',
  detection_degraded: 'recheck_quality',
  detection_blocking: 'inspect_detail',
  detection_security_high_risk: 'inspect_detail',
  detection_executability_high_risk: 'inspect_detail',
  detection_issues_present: 'recheck_quality',
  evidence_stale: 'recheck_quality',
  evidence_aging: 'recheck_quality',
};

export interface CaseGovernanceDecisionPolicyProfile {
  untrusted_reason_priority: string[];
  watch_reason_priority: string[];
  attention_reason_priority: string[];
  primary_action_reason_priority: string[];
  primary_action_by_reason: Record<string, string>;
}

export interface CaseGovernanceDecisionPolicyMeta {
  organization_id?: string;
  updated_by?: string;
  updated_at?: string;
}

export interface ResolvedCaseGovernanceDecisionPolicy {
  effective: CaseGovernanceDecisionPolicyProfile;
  system_default: CaseGovernanceDecisionPolicyProfile;
  organization?: CaseGovernanceDecisionPolicyProfile;
  organization_meta?: CaseGovernanceDecisionPolicyMeta;
}

export interface OrganizationGovernanceDecisionPolicy extends CaseGovernanceDecisionPolicyProfile {
  organization_id: string;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export interface DecisionPolicyValidationResult {
  valid: boolean;
  normalized_policy?: CaseGovernanceDecisionPolicyProfile;
  detail?: string;
  details?: { field: string; code: string; message: string }[];
}

export interface DecisionPolicyAuditLog {
  id: number;
  organization_id: string;
  actor_user_id: string;
  actor_role: string;
  action: string;
  before_snapshot?: Record<string, unknown>;
  after_snapshot?: Record<string, unknown>;
  request_method: string;
  request_path: string;
  client_ip?: string;
  created_at: string;
}

// ==================== Governance Overview 相关 ====================

// Effective 策略视图 (嵌入到 summary/hotspot/list 响应中)
export interface CaseGovernanceEffectivePolicyView {
  resolution_source: string;
  organization_override_applied: boolean;
  evidence_aging_hours: number;
  evidence_stale_hours: number;
  review_low_confidence_threshold: number;
  auto_review_after_validation: boolean;
  auto_validation_after_review_low_confidence: boolean;
  auto_validation_on_quality_recheck: boolean;
  organization_policy_updated_by?: string;
  organization_policy_updated_at?: string;
}

export interface CaseGovernanceEffectiveDecisionPolicyView {
  resolution_source: string;
  organization_override_applied: boolean;
  untrusted_reason_priority?: string[];
  watch_reason_priority?: string[];
  attention_reason_priority?: string[];
  primary_action_reason_priority?: string[];
  primary_action_by_reason?: Record<string, string>;
  organization_policy_updated_by?: string;
  organization_policy_updated_at?: string;
}

// 治理汇总统计
export interface CaseGovernanceSummary {
  benchmark_id: string;
  organization_id: string;
  benchmark_count: number;
  total_cases: number;
  active_cases: number;
  missing_cases: number;
  retired_cases: number;
  attention_required_cases: number;
  review_degraded_cases: number;
  low_confidence_cases: number;
  recheck_recommended_cases: number;
  recheck_triggered_cases: number;
  flaky_cases: number;
  insufficient_evidence_cases: number;
  authoritative_confidence_cases: number;
  decayed_confidence_cases: number;
  low_confidence_posture_cases: number;
  insufficient_evidence_posture_cases: number;
  degraded_confidence_cases: number;
  trusted_active_cases: number;
  watch_active_cases: number;
  untrusted_active_cases: number;
  aging_evidence_cases: number;
  stale_evidence_cases: number;
  validation_retryable_failure_cases: number;
  validation_environmental_failure_cases: number;
  fusion_pass_cases: number;
  fusion_warn_cases: number;
  fusion_block_cases: number;
  remediation_cases: number;
  remediation_pending_cases: number;
  remediation_improved_cases: number;
  remediation_unchanged_cases: number;
  remediation_regressed_cases: number;
  remediation_unavailable_cases: number;
  remediation_failed_cases: number;
  remediation_version_shifted_cases: number;
  remediation_missing_in_replay_cases: number;
  retirement_rate: number;
  flakiness_rate: number;
  low_confidence_rate: number;
  insufficient_evidence_rate: number;
  effective_trust_policy?: CaseGovernanceEffectivePolicyView;
  effective_decision_policy?: CaseGovernanceEffectiveDecisionPolicyView;
}

// Benchmark 治理热点
export interface CaseGovernanceBenchmarkHotspotView {
  benchmark_id: string;
  benchmark_name?: string;
  benchmark_display_name?: string;
  benchmark_type?: string;
  benchmark_language?: string;
  organization_id: string;
  total_cases: number;
  active_cases: number;
  missing_cases: number;
  retired_cases: number;
  attention_required_cases: number;
  review_degraded_cases: number;
  low_confidence_cases: number;
  recheck_recommended_cases: number;
  recheck_triggered_cases: number;
  flaky_cases: number;
  insufficient_evidence_cases: number;
  authoritative_confidence_cases: number;
  decayed_confidence_cases: number;
  low_confidence_posture_cases: number;
  insufficient_evidence_posture_cases: number;
  degraded_confidence_cases: number;
  trusted_active_cases: number;
  watch_active_cases: number;
  untrusted_active_cases: number;
  aging_evidence_cases: number;
  stale_evidence_cases: number;
  validation_retryable_failure_cases: number;
  validation_environmental_failure_cases: number;
  remediation_cases: number;
  remediation_pending_cases: number;
  remediation_regressed_cases: number;
  remediation_unavailable_cases: number;
  remediation_failed_cases: number;
  remediation_version_shifted_cases: number;
  latest_evidence_at?: string;
  effective_trust_policy?: CaseGovernanceEffectivePolicyView;
  effective_decision_policy?: CaseGovernanceEffectiveDecisionPolicyView;
}

// Case 治理列表项 (扩展 S02 的 CaseGovernanceView)
export interface CaseGovernanceListItem extends CaseGovernanceView {
  benchmark_name?: string;
  benchmark_display_name?: string;
  benchmark_type?: string;
  benchmark_language?: string;
  organization_id: string;
  source_scope?: string;
  current_version_id?: string;
  content_hash?: string;
  last_seen_benchmark_version: number;
  last_present_benchmark_version: number;
  lifecycle_source?: string;
  lifecycle_reason?: string;
  lifecycle_updated_by?: string;
  lifecycle_updated_at?: string;
  latest_evidence_at?: string;
  detection_dimension_risks?: Record<string, string>;
  detection_signal_summary?: string;
  detection_signal_resolution_source?: string;
  detection_created_at?: string;
  detection_report_id?: string;
  validation_matched?: boolean;
  validation_created_at?: string;
  validation_job_id?: string;
  validation_case_report_id?: string;
  validation_primary_failure_kind?: string;
  validation_primary_failure_class?: string;
  validation_primary_failure_stage?: string;
  validation_primary_failure_reason?: string;
  validation_primary_failure_retryable?: boolean;
  validation_primary_failure_environmental?: boolean;
  validation_has_retryable_failures?: boolean;
  validation_has_environmental_failures?: boolean;
  review_drift_status?: string;
  review_recheck_recommended?: boolean;
  review_recheck_triggered?: boolean;
  review_created_at?: string;
  review_report_id?: string;
  review_case_report_id?: string;
  review_triggered_validation_job_id?: string;
  fusion_drift_status?: string;
  fusion_created_at?: string;
  fusion_report_id?: string;
  fusion_case_report_id?: string;
  remediation_repair_run_id?: string;
  remediation_replay_status?: string;
  remediation_comparison_mode?: string;
  remediation_latest_feedback_at?: string;
  effective_trust_policy?: CaseGovernanceEffectivePolicyView;
  effective_decision_policy?: CaseGovernanceEffectiveDecisionPolicyView;
}

// 操作预览
export interface CaseGovernanceActionPreviewRequest {
  action: GovernanceAction;
  items: { benchmark_id: string; case_key: string }[];
}

export interface CaseGovernanceActionPreview {
  action: GovernanceAction;
  normalized_items?: { benchmark_id: string; case_key: string }[];
  accepted_items?: CaseGovernanceActionPreviewAccepted[];
  rejected_items?: CaseGovernanceActionPreviewRejected[];
  benchmark_actions?: CaseGovernanceBenchmarkActionPreview[];
}

export interface CaseGovernanceActionPreviewAccepted {
  benchmark_id: string;
  benchmark_name?: string;
  case_key: string;
  case_name?: string;
  action: GovernanceAction;
  reason?: string;
}

export interface CaseGovernanceActionPreviewRejected {
  benchmark_id: string;
  case_key: string;
  action: GovernanceAction;
  reason?: string;
}

export interface CaseGovernanceBenchmarkActionPreview {
  benchmark_id: string;
  benchmark_name?: string;
  action: GovernanceAction;
  target_method: string;
  target_route?: string;
  payload?: Record<string, unknown>;
  item_count: number;
  case_keys?: string[];
  item_routes?: { case_key: string; route: string; method: string }[];
}

// 筛选接口
export interface GovernanceBenchmarkFilter {
  benchmark_search?: string;
  attention_required_only?: boolean;
  page?: number;
  page_size?: number;
}

export interface GovernanceCaseFilter {
  benchmark_id?: string;
  benchmark_search?: string;
  status?: string;
  risk_gte?: string;
  drift_status?: string;
  trust_posture?: string;
  trust_reason?: string;
  evidence_freshness?: string;
  confidence_posture?: string;
  primary_action?: string;
  attention_required?: boolean;
  low_confidence?: boolean;
  flaky?: boolean;
  insufficient_evidence?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}

// ==================== LLM Quality 相关 ====================

export type LLMQualityJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export const LLM_QUALITY_JOB_STATUS_CONFIG = {
  pending: { label: '等待中', color: 'default' },
  processing: { label: '处理中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  failed: { label: '失败', color: 'error' },
  cancelled: { label: '已取消', color: 'default' },
} as const;

export interface BenchmarkLLMQualityJob {
  id: string;
  benchmark_id: string;
  organization_id: string;
  created_by: string;
  model: string;
  dimensions?: unknown;
  strict_mode: boolean;
  status: LLMQualityJobStatus;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  report_id?: string;
  idempotency_key?: string;
  created_at: string;
  updated_at: string;
}

export interface TriggerLLMQualityCheckResponse {
  job_id: string;
  status: LLMQualityJobStatus;
  created_at: string;
}

export interface LLMQualityJobSummary {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  running: number;
  terminal: number;
}

export interface LLMQualityDimensionCapability {
  name: string;
  cost_class: string;
  latency_class: string;
  requires_model?: string[];
}

export interface LLMQualityCapabilities {
  dimensions: string[];
  dimension_catalog: LLMQualityDimensionCapability[];
  result_post_processor_catalog?: { name: string; active: boolean; required: boolean }[];
  allowed_models: string[];
  default_model?: string;
  default_dimensions?: string[];
  dimension_template_by_source_type?: Record<string, string[]>;
  dimension_template_by_benchmark_type?: Record<string, string[]>;
}

export interface TriggerLLMQualityCheckRequest {
  model: string;
  dimensions?: string[];
  scope?: string;
  case_selector?: { case_keys?: string[]; max_cases?: number };
  strict_mode?: boolean;
  idempotency_key?: string;
}

export const LLM_QUALITY_RISK_CONFIG = {
  critical: { label: '严重', color: 'red' },
  high: { label: '高', color: 'orange' },
  medium: { label: '中', color: 'gold' },
  low: { label: '低', color: 'green' },
  info: { label: '信息', color: 'blue' },
} as const;

export interface LLMQualityFinding {
  id: number;
  report_id: string;
  dimension: string;
  severity: string;
  title: string;
  detail?: string;
  evidence?: string;
  suggestion?: string;
  confidence: number;
  created_at: string;
}

export interface BenchmarkLLMQualityReport {
  id: string;
  job_id: string;
  benchmark_id: string;
  organization_id: string;
  model: string;
  prompt_version?: string;
  dimensions?: unknown;
  overall_risk: string;
  score: number;
  authority_status?: string;
  provider_execution_mode?: string;
  provider_name?: string;
  resolved_model?: string;
  llm_call_succeeded: boolean;
  degraded_reason?: string;
  summary?: string;
  suggestions?: unknown;
  token_usage?: unknown;
  cost_usd: number;
  latency_ms: number;
  raw_response?: unknown;
  provider_runtime_json?: unknown;
  created_at: string;
  findings?: LLMQualityFinding[];
}

export interface LLMQualityCaseFinding {
  id: number;
  case_report_id: string;
  dimension: string;
  severity: string;
  title: string;
  detail?: string;
  evidence?: string;
  suggestion?: string;
  confidence: number;
  created_at: string;
}

export interface BenchmarkLLMQualityCaseReport {
  id: string;
  report_id: string;
  benchmark_id: string;
  organization_id: string;
  case_key: string;
  case_name?: string;
  case_index: number;
  risk: string;
  score: number;
  authority_status?: string;
  provider_execution_mode?: string;
  provider_name?: string;
  resolved_model?: string;
  llm_call_succeeded: boolean;
  degraded_reason?: string;
  summary?: string;
  dimensions?: unknown;
  provider_runtime_json?: unknown;
  created_at: string;
  findings?: LLMQualityCaseFinding[];
}

export interface BenchmarkLLMQualityAggregate {
  report_id: string;
  benchmark_id: string;
  organization_id: string;
  total_cases: number;
  critical_cases: number;
  high_cases: number;
  medium_cases: number;
  low_cases: number;
  info_cases: number;
  total_findings: number;
  average_score: number;
  created_at: string;
}

export interface LLMQualityDiffLatest {
  current_report_id: string;
  previous_report_id?: string;
  current_risk: string;
  previous_risk?: string;
  current_decision: string;
  previous_decision?: string;
  current_score: number;
  previous_score: number;
  score_delta: number;
  changed_cases: number;
  added_cases: number;
  removed_cases: number;
  new_high_risk_cases: number;
  resolved_high_risk_cases: number;
  generated_at: string;
}

export type LeaderboardMetric =
  | 'avg_score'
  | 'pass_at_1'
  | 'pass_at_5'
  | 'pass_at_10'
  | 'elo'
  | 'win_rate';

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly';

export interface LeaderboardEntry {
  agent_id: string;
  benchmark_id: string;
  snapshot_id?: string | null;
  rank: number;
  avg_score: number;
  pass_at_1: number;
  pass_at_5: number;
  pass_at_10: number;
  elo: number;
  win_rate: number;
  total_runs: number;
  run_cost_cents: number;
  updated_at: string;
}

export interface LeaderboardResponse {
  benchmark_id?: string;
  snapshot_id?: string;
  metric: LeaderboardMetric;
  period: LeaderboardPeriod;
  limit: number;
  entries: LeaderboardEntry[];
}

export interface LeaderboardQueryParams {
  metric?: LeaderboardMetric;
  period?: LeaderboardPeriod;
  limit?: number;
}

// ==================== Quality Policy 相关 ====================

export interface OrganizationQualityPolicy {
  organization_id: string;
  enable_schema: boolean;
  enable_semantic: boolean;
  enable_executability: boolean;
  enable_stability: boolean;
  enable_security: boolean;
  enable_compliance: boolean;
  block_on_high: boolean;
  updated_by?: string;
  created_at: string;
  updated_at: string;
}

export const QUALITY_DIMENSIONS = [
  { key: 'schema', label: 'Schema', mandatory: true },
  { key: 'semantic', label: 'Semantic', mandatory: true },
  { key: 'executability', label: '可执行性', mandatory: false },
  { key: 'stability', label: '稳定性', mandatory: false },
  { key: 'security', label: '安全', mandatory: true },
  { key: 'compliance', label: '合规', mandatory: false },
] as const;

export interface ResolvedQualityPolicy {
  effective: {
    name: string;
    enabled_dimensions: Record<string, boolean>;
    block_on_high: boolean;
  };
  system_default: {
    name: string;
    enabled_dimensions: Record<string, boolean>;
    block_on_high: boolean;
  };
  organization?: {
    name: string;
    enabled_dimensions: Record<string, boolean>;
    block_on_high: boolean;
  };
  decision_thresholds: {
    deny_min_severity: string;
    warn_min_severity: string;
  };
  weights: Record<string, number>;
}

export interface QualityPolicyAuditLog {
  id: number;
  organization_id: string;
  actor_user_id: string;
  actor_role: string;
  action: string;
  before_snapshot?: Record<string, unknown>;
  after_snapshot?: Record<string, unknown>;
  request_method: string;
  request_path: string;
  client_ip?: string;
  created_at: string;
}

export interface UpsertLLMQualityPolicyRequest {
  enabled?: boolean;
  allowed_models?: string[];
  default_model?: string;
  default_dimensions?: string[];
  allow_strict_mode?: boolean;
  daily_budget_usd?: number;
  daily_request_limit?: number;
  concurrent_job_limit?: number;
  delta_sampling_default_max_cases?: number;
  delta_sampling_strict_min_cases?: number;
  delta_sampling_enable_cost_optimization?: boolean;
  delta_sampling_enable_budget_optimization?: boolean;
  release_gate_enabled?: boolean;
  release_gate_block_risk?: string;
  release_gate_require_fresh_report?: boolean;
}

export interface LLMQualityPolicyValidationDetail {
  field: string;
  code: string;
  message: string;
}

export interface CaseGovernanceDetail {
  benchmark_id: string;
  organization_id: string;
  case_key: string;
  current?: CaseGovernanceView;
  lifecycle_audits?: BenchmarkCaseLifecycleAuditLog[];
  lifecycle_audit_total: number;
  version_total: number;
  latest_detection?: unknown;
  latest_validation?: unknown;
  latest_review?: unknown;
  latest_fusion?: unknown;
  remediation_feedback_total: number;
}

// 分页参数
export interface PaginationParams {
  page?: number;
  page_size?: number;
}

// 辅助函数配置
export const BENCHMARK_TYPE_CONFIG = {
  code_fix: { label: '代码修复', color: 'blue' },
  code_complete: { label: '代码补全', color: 'cyan' },
  terminal: { label: '终端任务', color: 'green' },
  code_review: { label: '代码审查', color: 'purple' },
  refactor: { label: '重构', color: 'orange' },
  debug: { label: '调试', color: 'red' },
  optimize: { label: '优化', color: 'magenta' },
} as const;

export const DIFFICULTY_CONFIG = {
  easy: { label: '简单', color: 'success' },
  medium: { label: '中等', color: 'processing' },
  hard: { label: '困难', color: 'warning' },
  expert: { label: '专家', color: 'error' },
} as const;

export const STATUS_CONFIG = {
  draft: { label: '草稿', color: 'default' },
  active: { label: '活跃', color: 'success' },
  archived: { label: '已归档', color: 'default' },
  deprecated: { label: '已弃用', color: 'error' },
} as const;

export const VISIBILITY_CONFIG = {
  public: { label: '公开', color: 'blue' },
  private: { label: '私有', color: 'default' },
  organization: { label: '组织内', color: 'green' },
} as const;
