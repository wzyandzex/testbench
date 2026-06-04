/**
 * Export API service — data export functionality
 */

import i18next from 'i18next';
import api from '@/services/api';
import type {
  ExportFormat,
  ExportFormatInfo,
  ExportRequest,
  ExportResponse,
  ExportType,
} from './types';

// ========== Export format catalog ==========

export const EXPORT_FORMATS: Record<ExportFormat, ExportFormatInfo> = {
  json: {
    format: 'json',
    name: 'JSON',
    get description() { return i18next.t('common:components.export.formats.json'); },
    extension: '.json',
    mime_type: 'application/json',
    icon: 'CodeOutlined',
    max_records: 100000,
    supports_compression: true,
    color: '#f59e0b',
  },
  csv: {
    format: 'csv',
    name: 'CSV',
    get description() { return i18next.t('common:components.export.formats.csv'); },
    extension: '.csv',
    mime_type: 'text/csv',
    icon: 'FileTextOutlined',
    max_records: 1000000,
    supports_compression: true,
    color: '#10b981',
  },
  excel: {
    format: 'excel',
    name: 'Excel',
    get description() { return i18next.t('common:components.export.formats.excel'); },
    extension: '.xlsx',
    mime_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    icon: 'ExcelOutlined',
    max_records: 1000000,
    supports_compression: false,
    color: '#1677ff',
  },
  pdf: {
    format: 'pdf',
    name: 'PDF',
    get description() { return i18next.t('common:components.export.formats.pdf'); },
    extension: '.pdf',
    mime_type: 'application/pdf',
    icon: 'FilePdfOutlined',
    max_records: 10000,
    supports_compression: false,
    color: '#ef4444',
  },
};

// ========== API 服务 ==========

/**
 * 导出服务
 */
export const exportService = {
  /**
   * 导出执行记录
   * POST /api/v1/export/executions
   */
  async executions(request: ExportRequest): Promise<ExportResponse> {
    return api.post('/export/executions', request);
  },

  /**
   * 直接下载导出文件（流式响应）
   * POST /api/v1/export/executions/direct
   */
  async executionsDirect(
    request: ExportRequest,
    onProgress?: (progress: number) => void
  ): Promise<Blob> {
    return api.post('/export/executions/direct', request, {
      responseType: 'blob',
      onDownloadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },

  /**
   * 导出批量执行报告
   * POST /api/v1/export/batch
   */
  async batch(batchId: string, request: Omit<ExportRequest, 'type'>): Promise<ExportResponse> {
    return api.post(`/export/batch/${batchId}`, request);
  },

  /**
   * 导出评测任务
   * POST /api/v1/export/benchmarks
   */
  async benchmarks(request: ExportRequest): Promise<ExportResponse> {
    return api.post('/export/benchmarks', request);
  },

  /**
   * 导出指标分析
   * POST /api/v1/export/metrics
   */
  async metrics(request: ExportRequest): Promise<ExportResponse> {
    return api.post('/export/metrics', request);
  },

  /**
   * 获取支持的导出格式
   * GET /api/v1/export/formats
   */
  async getFormats(): Promise<ExportFormat[]> {
    return api.get('/export/formats');
  },

  /**
   * 获取导出任务状态
   * GET /api/v1/export/tasks/:id
   */
  async getTask(taskId: string): Promise<ExportResponse> {
    return api.get(`/export/tasks/${taskId}`);
  },

  /**
   * 下载导出文件
   * @param downloadUrl 下载链接
   * @param fileName 文件名（可选）
   */
  downloadFile(downloadUrl: string, fileName?: string): void {
    const link = document.createElement('a');
    link.href = downloadUrl;
    if (fileName) {
      link.download = fileName;
    }
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * 触发 Blob 下载
   * @param blob 文件数据
   * @param fileName 文件名
   */
  downloadBlob(blob: Blob, fileName: string): void {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};

// ========== 辅助函数 ==========

/**
 * 根据类型和格式获取文件名
 */
export function getExportFileName(
  type: ExportType,
  format: ExportFormat,
  suffix?: string
): string {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
  const formatInfo = EXPORT_FORMATS[format];
  const suffixStr = suffix ? `_${suffix}` : '';
  return `${type}_export${suffixStr}_${timestamp}${formatInfo.extension}`;
}

/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

/**
 * 估算文件大小（粗略估算）
 */
export function estimateFileSize(recordCount: number, format: ExportFormat): number {
  const bytesPerRecord: Record<ExportFormat, number> = {
    json: 500,
    csv: 300,
    excel: 400,
    pdf: 2000,
  };
  return recordCount * bytesPerRecord[format];
}

/**
 * 获取格式选项默认值
 */
export function getDefaultOptionsForFormat(format: ExportFormat) {
  switch (format) {
    case 'json':
      return { json_pretty: true, include_metadata: true };
    case 'csv':
      return { csv_include_header: true };
    case 'excel':
      return { excel_single_sheet: false };
    case 'pdf':
      return { pdf_page_size: 'a4' as const };
    default:
      return {};
  }
}

/**
 * 验证导出请求
 */
export function validateExportRequest(request: ExportRequest): { valid: boolean; error?: string } {
  if (!request.format) {
    return { valid: false, error: i18next.t('common:components.export.validation.formatRequired') };
  }

  if (!request.type) {
    return { valid: false, error: i18next.t('common:components.export.validation.typeRequired') };
  }

  const formatInfo = EXPORT_FORMATS[request.format];
  if (formatInfo.max_records && request.filters?.dataRange === 'all') {
    // record-count validation hook — backend support pending
  }

  return { valid: true };
}

/**
 * Export type display names (resolved at access time via i18next).
 */
export const EXPORT_TYPE_NAMES: Record<ExportType, string> = new Proxy({} as Record<ExportType, string>, {
  get: (_target, prop: string) => i18next.t(`common:components.export.typeNames.${prop}`),
});
