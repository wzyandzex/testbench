/**
 * Analytics 类型定义
 * 已合并到 Metrics 模块，此文件保留用于类型兼容
 */

/**
 * 报告类型
 */
export type ReportType = 'performance' | 'agent_comparison' | 'benchmark_trend' | 'custom';

/**
 * 报告状态
 */
export type ReportStatus = 'pending' | 'generating' | 'completed' | 'failed';

/**
 * 报告格式
 */
export type ReportFormat = 'pdf' | 'html' | 'json';

/**
 * 性能趋势数据点
 */
export interface PerformanceTrendPoint {
  date: string;
  agent_id: string;
  agent_name: string;
  benchmark_id: string;
  benchmark_name: string;
  avg_score: number;
  execution_count: number;
  success_rate: number;
}

/**
 * Agent 对比数据
 */
export interface AgentComparisonData {
  agent_id: string;
  agent_name: string;
  total_executions: number;
  avg_score: number;
  success_rate: number;
  avg_duration: number;
  total_cost: number;
  by_benchmark: Array<{
    benchmark_id: string;
    benchmark_name: string;
    avg_score: number;
    execution_count: number;
  }>;
}

/**
 * 报告生成请求
 */
export interface GenerateReportRequest {
  type: ReportType;
  format: ReportFormat;
  title?: string;
  description?: string;
  filters: ReportFilters;
  options?: ReportOptions;
}

/**
 * 报告筛选条件
 */
export interface ReportFilters {
  agent_ids?: string[];
  benchmark_ids?: string[];
  start_date?: string;
  end_date?: string;
  min_score?: number;
  max_score?: number;
}

/**
 * 报告选项
 */
export interface ReportOptions {
  include_charts?: boolean;
  include_raw_data?: boolean;
  include_recommendations?: boolean;
}

/**
 * 报告
 */
export interface Report {
  id: string;
  type: ReportType;
  status: ReportStatus;
  format: ReportFormat;
  title: string;
  description?: string;
  filters: ReportFilters;
  options: ReportOptions;
  file_url?: string;
  file_size_bytes?: number;
  created_at: string;
  created_by: string;
  completed_at?: string;
  expires_at?: string;
  error?: string;
}

/**
 * 性能趋势查询参数
 */
export interface PerformanceTrendQuery {
  start_date: string;
  end_date: string;
  agent_ids?: string[];
  benchmark_ids?: string[];
  interval?: 'day' | 'week' | 'month';
}

/**
 * Agent 对比查询参数
 */
export interface AgentComparisonQuery {
  agent_ids: string[];
  benchmark_ids?: string[];
  start_date?: string;
  end_date?: string;
}

/**
 * 清理报告
 */
export interface CleanupReport {
  id: string;
  report_type: 'failed_executions' | 'orphaned_artifacts' | 'old_logs' | 'custom';
  status: ReportStatus;
  items_count: number;
  size_bytes: number;
  created_at: string;
  created_by: string;
  expires_at?: string;
  file_url?: string;
}
