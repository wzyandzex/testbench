/**
 * 批量执行相关类型定义
 */

/**
 * 批量任务状态
 */
export type BatchStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';

/**
 * 批量任务执行模式
 */
export type BatchExecutionMode = 'sequential' | 'parallel' | 'limited';

/**
 * 批量任务项状态
 */
export type BatchItemStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

/**
 * 批量任务项
 */
export interface BatchItem {
  id: string;
  benchmarkId: string;
  benchmarkName: string;
  agentId: string;
  agentName: string;
  status: BatchItemStatus;
  result?: {
    executionId?: string;
    score?: number;
    duration?: number;
    error?: string;
  };
  startedAt?: Date;
  completedAt?: Date;
  retryCount: number;
}

/**
 * 批量任务
 */
export interface Batch {
  id: string;
  name: string;
  description?: string;
  status: BatchStatus;
  executionMode: BatchExecutionMode;
  maxConcurrent?: number;
  createdBy: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  items: BatchItem[];
  summary: {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
    skipped: number;
  };
  progress: number;
}

/**
 * 批量任务详情
 */
export interface BatchDetail extends Batch {
  logs: BatchLog[];
  settings: BatchSettings;
}

/**
 * 批量任务日志
 */
export interface BatchLog {
  id: string;
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  itemId?: string;
}

/**
 * 批量任务设置
 */
export interface BatchSettings {
  timeout: number;
  maxRetries: number;
  retryDelay: number;
  stopOnFirstFailure: boolean;
  emailOnCompletion: boolean;
  emailRecipients?: string[];
}

/**
 * 批量任务列表查询参数
 */
export interface BatchListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: BatchStatus[];
  createdBy?: string;
  startDate?: Date;
  endDate?: Date;
  sortBy?: 'createdAt' | 'startedAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 批量任务列表响应
 */
export interface BatchListResponse {
  list: Batch[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 创建批量任务请求
 */
export interface CreateBatchRequest {
  name: string;
  description?: string;
  executionMode: BatchExecutionMode;
  maxConcurrent?: number;
  items: Array<{
    benchmarkId: string;
    agentId: string;
  }>;
  settings?: BatchSettings;
}

/**
 * 更新批量任务请求
 */
export interface UpdateBatchRequest {
  name?: string;
  description?: string;
  settings?: Partial<BatchSettings>;
}

/**
 * 批量任务操作
 */
export type BatchAction = 'start' | 'pause' | 'resume' | 'cancel' | 'retry_failed' | 'delete';
