/**
 * SWE-bench API 服务
 * 参考: docs/item/04-swe/README.md
 */

import api from './api';
import type {
  ApiResponse,
  PaginatedResponse,
} from '@/types/api';
import type {
  SWEBenchTask,
  CreateSWETaskRequest,
  SWETaskFilters,
  SWECacheStats,
  SWETaskLog,
  SWEExportResult,
} from '@/types';

export const sweService = {
  /**
   * 获取任务列表
   * GET /api/v1/swenbench/tasks
   */
  list: (params: SWETaskFilters) => {
    return api.get<PaginatedResponse<SWEBenchTask>>('/swenbench/tasks', { params });
  },

  /**
   * 获取任务详情
   * GET /api/v1/swenbench/tasks/:id
   */
  get: (id: string) => {
    return api.get<SWEBenchTask>(`/swenbench/tasks/${id}`);
  },

  /**
   * 创建任务
   * POST /api/v1/swenbench/tasks
   */
  create: (data: CreateSWETaskRequest) => {
    return api.post<SWEBenchTask>('/swenbench/tasks', data);
  },

  /**
   * 重试任务
   * POST /api/v1/swenbench/tasks/:id/retry
   */
  retry: (id: string) => {
    return api.post<SWEBenchTask>(`/swenbench/tasks/${id}/retry`);
  },

  /**
   * 智能修复
   * POST /api/v1/swenbench/tasks/:id/fix
   */
  fix: (id: string) => {
    return api.post<SWEBenchTask>(`/swenbench/tasks/${id}/fix`);
  },

  /**
   * 导出代码
   * GET /api/v1/swenbench/tasks/:id/export
   */
  export: (id: string) => {
    return api.get<SWEExportResult>(`/swenbench/tasks/${id}/export`);
  },

  /**
   * 删除任务
   * DELETE /api/v1/swenbench/tasks/:id
   */
  delete: (id: string) => {
    return api.delete<ApiResponse<{ message: string }>>(`/swenbench/tasks/${id}`);
  },

  /**
   * 取消任务
   * POST /api/v1/swenbench/tasks/:id/cancel
   */
  cancel: (id: string) => {
    return api.post<SWEBenchTask>(`/swenbench/tasks/${id}/cancel`);
  },

  /**
   * 获取任务日志
   * GET /api/v1/swenbench/tasks/:id/logs
   */
  getLogs: (id: string, params?: { phase?: string; limit?: number }) => {
    return api.get<ApiResponse<SWETaskLog[]>>(`/swenbench/tasks/${id}/logs`, { params });
  },

  /**
   * 获取仓库缓存列表
   * GET /api/v1/swenbench/repo/cache
   */
  getCache: () => {
    return api.get<SWECacheStats>('/swenbench/repo/cache');
  },

  /**
   * 删除仓库缓存
   * DELETE /api/v1/swenbench/repo/cache/:repo
   */
  deleteCache: (repoName: string) => {
    return api.delete<ApiResponse<{ message: string }>>(`/swenbench/repo/cache/${repoName}`);
  },

  /**
   * 刷新仓库缓存
   * POST /api/v1/swenbench/repo/cache/:repo/refresh
   */
  refreshCache: (repoName: string) => {
    return api.post<ApiResponse<{ message: string }>>(`/swenbench/repo/cache/${repoName}/refresh`);
  },

  /**
   * 预热仓库缓存
   * POST /api/v1/swenbench/repo/cache/preheat
   */
  preheatCache: (repoUrls: string[]) => {
    return api.post<ApiResponse<{ message: string }>>('/swenbench/repo/cache/preheat', { repoUrls });
  },

  /**
   * 获取仓库统计
   * GET /api/v1/swenbench/stats
   */
  getStats: () => {
    return api.get<ApiResponse<{
      totalTasks: number;
      runningTasks: number;
      completedTasks: number;
      failedTasks: number;
      successRate: number;
    }>>('/swenbench/stats');
  },
};

export default sweService;
