/**
 * Import API service
 * Data import module - supports HumanEval/MBPP/SWE-bench/CodeComplete import
 */

import api from '@/services/api';
import i18next from 'i18next';
import type { Benchmark } from '@/types';

// ========== 类型定义 ==========

/**
 * 数据集类型
 */
export type DatasetType = 'humaneval' | 'mbpp' | 'swebench' | 'codecomplete' | 'benchmark';

/**
 * 导入源类型
 */
export type SourceType = 'file' | 'url' | 'huggingface' | 'json' | 'yaml';

/**
 * 导入任务状态
 */
export type ImportTaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

/**
 * 数据集信息
 */
export interface DatasetInfo {
  type: DatasetType;
  name: string;
  description: string;
  icon: string;
  sampleCount: number;
  language: string;
  category: string;
}

/**
 * 导入配置
 */
export interface ImportConfigType {
  // 基础配置
  datasetType: DatasetType;
  sourceType: SourceType;

  // 文件上传
  file?: File;

  // URL 导入
  url?: string;

  // HuggingFace 导入
  huggingfaceRepo?: string;
  huggingfaceFilename?: string;

  // JSON 粘贴
  jsonData?: string;
  yamlData?: string;

  // 高级选项
  autoCreate?: boolean; // 自动创建 Benchmark
  requireApproval?: boolean; // 需要审批
  tags?: string[]; // 标签
  description?: string; // 描述
}

/**
 * 导入任务进度
 */
export interface ImportTaskProgress {
  current: number;
  total: number;
  percentage: number;
}

/**
 * 导入任务结果
 */
export interface ImportTaskResult {
  success: number;
  failed: number;
  skipped: number;
}

/**
 * 导入任务
 */
export interface ImportTask {
  id: string;
  datasetType: DatasetType;
  sourceType: SourceType;
  status: ImportTaskStatus;
  progress: ImportTaskProgress;
  result?: ImportTaskResult;
  error?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  createdBy: string;
  config: ImportConfigType;
}

/**
 * 创建导入任务请求
 */
export interface CreateImportTaskRequest extends Partial<ImportConfigType> {
  datasetType: DatasetType;
  sourceType: SourceType;
}

/**
 * 导入任务列表参数
 */
export interface ImportTaskListParams {
  page?: number;
  pageSize?: number;
  datasetType?: DatasetType;
  status?: ImportTaskStatus;
  search?: string;
}

/**
 * 导入任务列表响应
 */
export interface ImportTaskListResponse {
  total: number;
  page: number;
  pageSize: number;
  data: ImportTask[];
}

export interface BenchmarkImportSource {
  name: string;
  display_name: string;
  description: string;
  enabled: boolean;
  max_size?: string;
  formats?: string[];
  whitelist?: string[];
}

/**
 * 文件上传进度回调
 */
export type UploadProgressCallback = (progress: {
  loaded: number;
  total: number;
  percentage: number;
}) => void;

// ========== Dataset config ==========

export const DATASET_INFO: Record<DatasetType, DatasetInfo> = {
  humaneval: {
    type: 'humaneval',
    name: 'HumanEval',
    icon: 'CodeOutlined',
    sampleCount: 164,
    language: 'Python',
    get description() { return i18next.t('import:datasets.humaneval'); },
    get category() { return i18next.t('import:category.codeGen'); },
  },
  mbpp: {
    type: 'mbpp',
    name: 'MBPP',
    icon: 'PythonOutlined',
    sampleCount: 974,
    language: 'Python',
    get description() { return i18next.t('import:datasets.mbpp'); },
    get category() { return i18next.t('import:category.codeGen'); },
  },
  swebench: {
    type: 'swebench',
    name: 'SWE-bench',
    icon: 'GithubOutlined',
    sampleCount: 2294,
    language: 'Multi',
    get description() { return i18next.t('import:datasets.swebench'); },
    get category() { return i18next.t('import:category.codeFix'); },
  },
  codecomplete: {
    type: 'codecomplete',
    name: 'CodeComplete',
    icon: 'EditOutlined',
    sampleCount: 0,
    language: 'Multi',
    get description() { return i18next.t('import:datasets.codeCompletion'); },
    get category() { return i18next.t('import:category.codeCompletion'); },
  },
  benchmark: {
    type: 'benchmark',
    icon: 'FileTextOutlined',
    sampleCount: 0,
    language: 'Multi',
    get name() { return i18next.t('import:datasets.customName'); },
    get description() { return i18next.t('import:datasets.custom'); },
    get category() { return i18next.t('import:category.custom'); },
  },
};

// ========== API 服务 ==========

/**
 * 导入服务
 */
export const importService = {
  /**
   * 获取导入任务列表
   * GET /api/v1/import/tasks
   */
  getTasks: (params: ImportTaskListParams = {}): Promise<ImportTaskListResponse> => {
    return api.get('/import/tasks', { params });
  },

  /**
   * 获取导入任务详情
   * GET /api/v1/import/tasks/:id
   */
  getTask: (id: string): Promise<ImportTask> => {
    return api.get(`/import/tasks/${id}`);
  },

  /**
   * 创建导入任务
   * POST /api/v1/import/tasks
   */
  createTask: (data: CreateImportTaskRequest): Promise<ImportTask> => {
    return api.post('/import/tasks', data);
  },

  /**
   * 取消导入任务
   * POST /api/v1/import/tasks/:id/cancel
   */
  cancelTask: (id: string): Promise<{ message: string }> => {
    return api.post(`/import/tasks/${id}/cancel`);
  },

  /**
   * 删除导入任务
   * DELETE /api/v1/import/tasks/:id
   */
  deleteTask: (id: string): Promise<{ message: string }> => {
    return api.delete(`/import/tasks/${id}`);
  },

  /**
   * 上传文件
   * POST /api/v1/import/tasks/upload
   */
  uploadFile: (file: File, onProgress?: UploadProgressCallback): Promise<{ taskId: string; filename: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post('/import/tasks/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage,
          });
        }
      },
    });
  },

  /**
   * 从文件导入 Benchmark
   * POST /api/v1/import/benchmarks/file
   */
  importFromFile: (data: { file: File }, onProgress?: UploadProgressCallback): Promise<Benchmark> => {
    const formData = new FormData();
    formData.append('file', data.file);

    return api.post('/import/benchmarks/file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress({
            loaded: progressEvent.loaded,
            total: progressEvent.total,
            percentage,
          });
        }
      },
    });
  },

  /**
   * 从 URL 导入 Benchmark
   * POST /api/v1/import/benchmarks/url
   */
  importFromUrl: (data: { url: string }): Promise<Benchmark> => {
    return api.post('/import/benchmarks/url', { url: data.url });
  },

  /**
   * 从 JSON 导入 Benchmark
   * POST /api/v1/import/benchmarks/json
   */
  importFromJson: (data: { jsonData: string }): Promise<Benchmark> => {
    return api.post('/import/benchmarks/json', data.jsonData, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  importFromYaml: (data: { yamlData: string }): Promise<Benchmark> => {
    return api.post('/import/benchmarks/yaml', data.yamlData, {
      headers: {
        'Content-Type': 'application/x-yaml',
      },
    });
  },

  /**
   * 从 HuggingFace 导入
   * POST /api/v1/import/humaneval/huggingface
   * POST /api/v1/import/swebench/huggingface
   */
  importFromHuggingFace: (datasetType: 'humaneval' | 'swebench', data: { repo?: string; filename?: string; config?: Partial<ImportConfigType> }): Promise<ImportTask> => {
    return api.post(`/import/${datasetType}/huggingface`, data);
  },

  /**
   * 获取可用的数据集来源
   * GET /api/v1/import/benchmarks/sources
   */
  getSources: (): Promise<BenchmarkImportSource[]> => {
    return api.get('/import/benchmarks/sources');
  },

  /**
   * 获取 HuggingFace 可用数据集
   * GET /api/v1/import/humaneval/datasets
   * GET /api/v1/import/swebench/datasets
   */
  getHuggingFaceDatasets: (datasetType: 'humaneval' | 'swebench'): Promise<Array<{ repo: string; description: string }>> => {
    return api.get(`/import/${datasetType}/datasets`);
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
 * 验证文件类型
 */
export function validateFileType(file: File, allowedTypes: string[] = ['application/json', 'text/yaml', 'text/csv', 'application/vnd.ms-excel']): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * 验证文件大小
 */
export function validateFileSize(file: File, maxSize: number = 100 * 1024 * 1024): boolean {
  return file.size <= maxSize;
}

/**
 * 验证 URL 格式
 */
export function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * 获取状态颜色
 */
export function getStatusColor(status: ImportTaskStatus): string {
  const colors: Record<ImportTaskStatus, string> = {
    pending: 'default',
    running: 'processing',
    completed: 'success',
    failed: 'error',
    cancelled: 'default',
  };
  return colors[status];
}

/**
 * Get status text (i18n)
 */
export function getStatusText(status: ImportTaskStatus): string {
  const keys: Record<ImportTaskStatus, string> = {
    pending: 'import:statusLabels.pending',
    running: 'import:statusLabels.running',
    completed: 'import:statusLabels.completed',
    failed: 'import:statusLabels.failed',
    cancelled: 'import:statusLabels.cancelled',
  };
  return i18next.t(keys[status]);
}


/**
 * 轮询导入任务状态 (Frontend Integration Standard)
 */
export async function pollImportTask(taskId: string, onUpdate: (task: ImportTask) => void): Promise<ImportTask> {
  const maxAttempts = 300;
  for (let i = 0; i < maxAttempts; i++) {
    const task = await importService.getTask(taskId);
    onUpdate(task);

    if (['completed', 'failed', 'cancelled'].includes(task.status)) {
      return task;
    }

    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error('polling timeout');
}
