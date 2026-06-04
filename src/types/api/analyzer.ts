/**
 * Analyzer 类型定义
 * Slice: S20
 */

export type ReportType = 'performance_trends' | 'agent_comparison' | 'execution_stats';

export const REPORT_TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  performance_trends: { label: '性能趋势', color: 'blue' },
  agent_comparison: { label: 'Agent 对比', color: 'green' },
  execution_stats: { label: '执行统计', color: 'orange' },
};

export interface ReportListItem {
  report_id: string;
  report_type: ReportType;
  generated_at: string;
  date: string;
  object_name: string;
}

export interface ReportListResponse {
  total: number;
  page: number;
  size: number;
  data: ReportListItem[];
}

// Shared sub-types
export interface TimeRange {
  start: string;
  end: string;
}

export interface DataPoint {
  timestamp: string;
  value: number;
  labels?: Record<string, string>;
}

export interface AgentStats {
  agent_id: string;
  agent_name: string;
  exec_count: number;
  avg_duration_ms: number;
  pass_rate: number;
  avg_tokens: number;
}

export interface BenchmarkStats {
  benchmark_id: string;
  benchmark_name: string;
  exec_count: number;
  avg_duration_ms: number;
  pass_rate: number;
}

export interface ComparisonMetric {
  metric_name: string;
  values: Record<string, number>;
  leader: string;
}

// Report detail types
export interface PerformanceTrendReport {
  organization_id?: string;
  report_id: string;
  generated_at: string;
  time_range: TimeRange;
  avg_duration: DataPoint[];
  pass_rate: DataPoint[];
  token_usage: DataPoint[];
  agent_stats: AgentStats[];
  benchmark_stats: BenchmarkStats[];
}

export interface AgentComparisonReport {
  organization_id?: string;
  report_id: string;
  generated_at: string;
  compared_agents: string[];
  performance: ComparisonMetric;
  cost: ComparisonMetric;
  quality: ComparisonMetric;
  recommendation: string;
}

export interface ExecutionStatsReport {
  organization_id?: string;
  report_id: string;
  generated_at: string;
  time_range: TimeRange;
  total_executions: number;
  success_count: number;
  failure_count: number;
  overall_pass_rate: number;
  avg_duration_ms: number;
  agent_stats: AgentStats[];
  benchmark_stats: BenchmarkStats[];
}
