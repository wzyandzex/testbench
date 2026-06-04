import type { PaginatedResponse } from '@/types/api/common';

export type MetricsOrderBy =
  | 'id'
  | 'execution_id'
  | 'benchmark_id'
  | 'agent_id'
  | 'score'
  | 'func_score'
  | 'eff_score'
  | 'qual_score'
  | 'stab_score'
  | 'reas_score'
  | 'created_at'
  | 'updated_at';

export type MetricsOrderDir = 'asc' | 'desc';
export type MetricsAggregatedPeriod = 'daily' | 'weekly' | 'monthly';

export interface FunctionalMetrics {
  test_pass_rate: number;
  test_coverage: number;
  test_case_count: number;
  requirement_met: boolean;
  constraint_met: boolean;
  success_criteria: number;
  regression_test: boolean;
}

export interface EfficiencyMetrics {
  total_duration: number;
  execution_time: number;
  planning_time: number;
  correction_time: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  tokens_per_step: number;
  total_steps: number;
  efficient_steps: number;
  efficiency_rate: number;
  memory_usage_mb: number;
  cpu_usage_percent: number;
}

export interface QualityMetrics {
  code_style_score: number;
  code_complexity: number;
  code_smell_count: number;
  violation_count: number;
  security_score: number;
  vulnerability_count: number;
  maintainability_index: number;
  tech_debt_ratio: number;
  documentation_score: number;
  comment_coverage: number;
}

export interface StabilityMetrics {
  success_rate: number;
  timeout_rate: number;
  error_rate: number;
  crash_rate: number;
  self_correction_count: number;
  self_correction_rate: number;
  retry_count: number;
  retry_success_count: number;
  consistency_score: number;
}

export interface ReasoningMetrics {
  reasoning_depth: number;
  planning_steps: number;
  backtracking_count: number;
  tool_call_count: number;
  tool_success_rate: number;
  unique_tool_count: number;
  context_usage: number;
  few_shot_count: number;
  improvement_rate: number;
}

export interface MetricsRecord {
  id: string;
  execution_id: string;
  benchmark_id: string;
  agent_id: string;
  functional: FunctionalMetrics;
  efficiency: EfficiencyMetrics;
  quality: QualityMetrics;
  stability: StabilityMetrics;
  reasoning: ReasoningMetrics;
  score: number;
  func_score: number;
  eff_score: number;
  qual_score: number;
  stab_score: number;
  reas_score: number;
  metadata?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface MetricsListParams {
  execution_id?: string;
  benchmark_id?: string;
  agent_id?: string;
  min_score?: number;
  max_score?: number;
  created_after?: string;
  created_before?: string;
  page?: number;
  page_size?: number;
  order_by?: MetricsOrderBy;
  order_dir?: MetricsOrderDir;
}

export interface MetricsComparisonParams {
  reference_id: string;
  target_id: string;
}

export interface MetricsDiff {
  score: number;
  func_score: number;
  eff_score: number;
  qual_score: number;
  stab_score: number;
  reas_score: number;
}

export interface MetricsComparison {
  reference: MetricsRecord;
  target: MetricsRecord;
  diff: MetricsDiff;
}

export interface MetricsDiagnostic {
  category: string;
  issue: string;
  severity: string;
  suggestion: string;
}

export interface MetricsAnalysisResult {
  strengths: string[];
  weaknesses: string[];
  diagnostics: MetricsDiagnostic[];
  improvements: string[];
  overall: string;
}

export interface MetricsReport {
  execution_id: string;
  benchmark_id: string;
  agent_id: string;
  metrics: MetricsRecord;
  comparison?: MetricsComparison;
  analysis: MetricsAnalysisResult;
  recommendations: string[];
  generated_at: string;
}

export interface MetricsRanking {
  rank: number;
  agent_id: string;
  avg_score: number;
  total_count: number;
  success_count: number;
}

export interface CreateMetricsAggregatedParams {
  period?: MetricsAggregatedPeriod;
  start_date?: string;
  end_date?: string;
}

export type MetricsListResponse = PaginatedResponse<MetricsRecord>;
