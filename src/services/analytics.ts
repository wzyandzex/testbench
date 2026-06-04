/**
 * Analytics API 服务
 * 已合并到 Metrics 模块，此文件保留用于服务兼容
 */

import api from '@/services/api';
import type {
  PerformanceTrendPoint,
  AgentComparisonData,
  GenerateReportRequest,
  Report,
  PerformanceTrendQuery,
  AgentComparisonQuery,
  CleanupReport,
  ReportType,
  ReportStatus,
} from '@/types/analytics';

/**
 * 分析服务
 */
export const analyticsService = {
  // ========== 性能趋势 ==========

  /**
   * 获取性能趋势数据
   * GET /api/v1/analytics/performance-trend
   */
  getPerformanceTrend: (query: PerformanceTrendQuery): Promise<PerformanceTrendPoint[]> => {
    return api.get('/analytics/performance-trend', { params: query });
  },

  // ========== Agent 对比 ==========

  /**
   * 获取 Agent 对比数据
   * GET /api/v1/analytics/agent-comparison
   */
  getAgentComparison: (query: AgentComparisonQuery): Promise<AgentComparisonData[]> => {
    return api.get('/analytics/agent-comparison', { params: query });
  },

  // ========== 报告生成 ==========

  /**
   * 生成报告
   * POST /api/v1/analytics/reports
   */
  generateReport: (data: GenerateReportRequest): Promise<Report> => {
    return api.post('/analytics/reports', data);
  },

  /**
   * 获取报告列表
   * GET /api/v1/analytics/reports
   */
  getReports: (params?: {
    type?: ReportType;
    status?: ReportStatus;
    page?: number;
    pageSize?: number;
  }): Promise<{ total: number; data: Report[] }> => {
    return api.get('/analytics/reports', { params });
  },

  /**
   * 获取报告详情
   * GET /api/v1/analytics/reports/:id
   */
  getReport: (id: string): Promise<Report> => {
    return api.get(`/analytics/reports/${id}`);
  },

  /**
   * 下载报告
   * GET /api/v1/analytics/reports/:id/download
   */
  downloadReport: (id: string): void => {
    window.open(`/api/v1/analytics/reports/${id}/download`, '_blank');
  },

  /**
   * 删除报告
   * DELETE /api/v1/analytics/reports/:id
   */
  deleteReport: (id: string): Promise<void> => {
    return api.delete(`/analytics/reports/${id}`);
  },

  // ========== 清理报告 ==========

  /**
   * 获取清理报告列表
   * GET /api/v1/analytics/cleanup-reports
   */
  getCleanupReports: (): Promise<CleanupReport[]> => {
    return api.get('/analytics/cleanup-reports');
  },

  /**
   * 创建清理报告
   * POST /api/v1/analytics/cleanup-reports
   */
  createCleanupReport: (data: {
    report_type: CleanupReport['report_type'];
    filters?: Record<string, unknown>;
  }): Promise<CleanupReport> => {
    return api.post('/analytics/cleanup-reports', data);
  },

  /**
   * 执行清理操作
   * POST /api/v1/analytics/cleanup-reports/:id/execute
   */
  executeCleanup: (id: string): Promise<{ deleted_count: number; freed_space_bytes: number }> => {
    return api.post(`/analytics/cleanup-reports/${id}/execute`);
  },

  /**
   * 删除清理报告
   * DELETE /api/v1/analytics/cleanup-reports/:id
   */
  deleteCleanupReport: (id: string): Promise<void> => {
    return api.delete(`/analytics/cleanup-reports/${id}`);
  },
};

// ========== 辅助函数 ==========

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 获取报告类型文本
 */
export function getReportTypeText(type: ReportType): string {
  const texts: Record<ReportType, string> = {
    performance: '性能趋势',
    agent_comparison: 'Agent 对比',
    benchmark_trend: 'Benchmark 趋势',
    custom: '自定义报告',
  };
  return texts[type];
}

/**
 * 获取报告状态文本
 */
export function getReportStatusText(status: ReportStatus): string {
  const texts: Record<ReportStatus, string> = {
    pending: '等待中',
    generating: '生成中',
    completed: '已完成',
    failed: '失败',
  };
  return texts[status];
}

/**
 * 获取报告状态颜色
 */
export function getReportStatusColor(status: ReportStatus): string {
  const colors: Record<ReportStatus, string> = {
    pending: 'default',
    generating: 'processing',
    completed: 'success',
    failed: 'error',
  };
  return colors[status];
}

/**
 * 获取报告格式图标
 */
export function getReportFormatIcon(format: string): string {
  const icons: Record<string, string> = {
    pdf: '📄',
    html: '🌐',
    json: '{ }',
  };
  return icons[format] || '📄';
}
