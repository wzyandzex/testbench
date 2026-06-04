/**
 * Export 模块类型定义
 * 数据导出功能 - 支持 Excel/CSV/JSON/PDF 格式
 */

/**
 * 导出格式
 */
export type ExportFormat = 'json' | 'csv' | 'excel' | 'pdf';

/**
 * 导出数据类型
 */
export type ExportType = 'executions' | 'batch' | 'benchmarks' | 'metrics';

/**
 * 数据范围选项
 */
export type DataRange = 'current_page' | 'filtered' | 'all';

/**
 * 导出筛选条件
 */
export interface ExportFilters {
  // 基础筛选
  execution_ids?: string[];
  benchmark_id?: string;
  agent_id?: string;
  status?: string[];
  // 时间范围
  start_date?: string;
  end_date?: string;
  // 数据范围
  dataRange?: DataRange;
  // 其他选项
  tags?: string[];
}

/**
 * 导出选项
 */
export interface ExportOptions {
  // 内容选项
  include_trace?: boolean;
  include_artifacts?: boolean;
  include_metadata?: boolean;
  // 压缩选项
  compress?: boolean;
  // 格式特定选项
  excel_single_sheet?: boolean; // Excel: 单工作表
  csv_include_header?: boolean; // CSV: 包含表头
  pdf_page_size?: 'a4' | 'a3' | 'letter'; // PDF: 页面大小
  json_pretty?: boolean; // JSON: 格式化输出
}

/**
 * 导出请求
 */
export interface ExportRequest {
  format: ExportFormat;
  type: ExportType;
  filters?: ExportFilters;
  options?: ExportOptions;
}

/**
 * 导出任务状态
 */
export type ExportTaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * 导出响应
 */
export interface ExportResponse {
  export_id: string;
  format: ExportFormat;
  type: ExportType;
  file_name: string;
  download_url: string;
  expires_at: string;
  file_size_bytes?: number;
  record_count: number;
  status: ExportTaskStatus;
}

/**
 * 导出格式信息
 */
export interface ExportFormatInfo {
  format: ExportFormat;
  name: string;
  description: string;
  extension: string;
  mime_type: string;
  icon: string;
  max_records?: number;
  supports_compression: boolean;
  color: string;
}

/**
 * 快速导出配置
 */
export interface QuickExportConfig {
  format: ExportFormat;
  type: ExportType;
  // 用于获取当前筛选结果
  getCurrentFilters?: () => ExportFilters;
  getTotalCount?: () => number;
}

/**
 * 导出配置上下文
 */
export interface ExportContext {
  type: ExportType;
  // 执行记录导出
  executionIds?: string[];
  benchmarkId?: string;
  agentId?: string;
  // 批量执行导出
  batchId?: string;
  // 通用筛选
  filters?: ExportFilters;
  // 总记录数（用于预估）
  totalCount?: number;
}
