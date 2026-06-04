/**
 * Export 类型定义
 * 数据导出模块 - 支持执行记录、批量报告导出
 */

/**
 * 导出格式
 */
export type ExportFormat = 'json' | 'csv' | 'excel' | 'pdf';

/**
 * 导出数据类型
 */
export type ExportType = 'executions' | 'batch';

/**
 * 导出筛选条件
 */
export interface ExportFilters {
  execution_ids?: string[];
  benchmark_id?: string;
  agent_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

/**
 * 导出选项
 */
export interface ExportOptions {
  include_trace?: boolean;
  include_artifacts?: boolean;
  compress?: boolean;
}

/**
 * 导出请求
 */
export interface ExportRequest {
  format: ExportFormat;
  filters?: ExportFilters;
  options?: ExportOptions;
}

/**
 * 导出任务响应
 */
export interface ExportResponse {
  export_id: string;
  format: ExportFormat;
  file_name: string;
  download_url: string;
  expires_at: string;
  file_size_bytes?: number;
  record_count: number;
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
  max_records?: number;
  supports_compression: boolean;
  icon: string;
}

/**
 * 直接导出请求
 */
export interface DirectExportRequest {
  type: ExportType;
  format: ExportFormat;
  filters?: ExportFilters;
}

/**
 * 导出状态
 */
export interface ExportState {
  dialogVisible: boolean;
  exportType: ExportType | null;
  config: {
    format: ExportFormat;
    filters: ExportFilters;
    options: ExportOptions;
  };
  exporting: boolean;
  progress: number;
}
