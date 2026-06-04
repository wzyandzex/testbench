/**
 * 文件服务
 * 处理文件上传、下载和导出
 */

import api from './api';

/**
 * 文件上传响应
 */
export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

/**
 * 上传进度回调
 */
export type UploadProgressCallback = (progress: number) => void;

/**
 * 文件服务
 */
export const fileService = {
  /**
   * 上传单个文件
   */
  async upload(
    file: File,
    options?: {
      onProgress?: UploadProgressCallback;
      path?: string;
    }
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.path) {
      formData.append('path', options.path);
    }

    return api.post('/files/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent: any) => {
        if (options?.onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          options.onProgress(progress);
        }
      },
    });
  },

  /**
   * 批量上传文件
   */
  async uploadMultiple(
    files: File[],
    options?: {
      onProgress?: UploadProgressCallback;
      path?: string;
    }
  ): Promise<UploadResponse[]> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (options?.path) {
      formData.append('path', options.path);
    }

    return api.post('/files/upload/multiple', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent: any) => {
        if (options?.onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          options.onProgress(progress);
        }
      },
    });
  },

  /**
   * 上传图片（自动压缩和优化）
   */
  async uploadImage(
    file: File,
    options?: {
      maxWidth?: number;
      maxHeight?: number;
      quality?: number;
      onProgress?: UploadProgressCallback;
    }
  ): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    if (options?.maxWidth) formData.append('maxWidth', options.maxWidth.toString());
    if (options?.maxHeight) formData.append('maxHeight', options.maxHeight.toString());
    if (options?.quality) formData.append('quality', options.quality.toString());

    return api.post('/files/upload/image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent: any) => {
        if (options?.onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          options.onProgress(progress);
        }
      },
    });
  },

  /**
   * 下载文件
   */
  async download(fileUrl: string, filename?: string): Promise<void> {
    const response = await api.get(fileUrl, { responseType: 'blob' as any });
    const url = window.URL.createObjectURL(response as any);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * 导出数据为文件
   */
  async exportData(
    data: unknown,
    filename: string,
    format: 'csv' | 'json' | 'xlsx' = 'json'
  ): Promise<void> {
    const blob = await api.post('/files/export', { data, format }, {
      responseType: 'blob' as any,
    });
    const url = window.URL.createObjectURL(blob as any);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },

  /**
   * 获取文件预览 URL（带签名）
   */
  getPreviewUrl(fileId: string, expiresIn = 3600): string {
    return `/files/preview/${fileId}?expiresIn=${expiresIn}`;
  },

  /**
   * 删除文件
   */
  async delete(fileId: string): Promise<void> {
    return api.delete(`/files/${fileId}`);
  },

  /**
   * 批量删除文件
   */
  async batchDelete(fileIds: string[]): Promise<void> {
    return api.post('/files/batch-delete', { fileIds });
  },

  /**
   * 导出执行报告
   */
  async exportExecutionReport(executionId: string, format: 'pdf' | 'xlsx' = 'pdf'): Promise<Blob> {
    return api.get(`/executions/${executionId}/export`, {
      params: { format },
      responseType: 'blob',
    });
  },

  /**
   * 导出批量执行结果
   */
  async exportBatchResults(batchId: string, format: 'csv' | 'xlsx' = 'xlsx'): Promise<Blob> {
    return api.get(`/batches/${batchId}/export`, {
      params: { format },
      responseType: 'blob',
    });
  },

  /**
   * 导出指标数据
   */
  async exportMetrics(params: {
    timeRange: string;
    format: 'csv' | 'xlsx';
    filters?: Record<string, unknown>;
  }): Promise<Blob> {
    return api.post('/metrics/export', params, { responseType: 'blob' });
  },
};

export default fileService;
