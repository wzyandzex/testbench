/**
 * SWE-bench Store
 * 遵循 rerender-derived-state 规则，使用派生状态减少重渲染
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { sweService } from '@/services';
import type {
  SWEBenchTask,
  SWETaskFilters,
  SWECacheStats,
  CreateSWETaskRequest,
  SWETaskLog,
} from '@/types';

interface SWEState {
  // 列表状态
  tasks: SWEBenchTask[];
  currentTask: SWEBenchTask | null;
  taskLogs: SWETaskLog[];
  cacheStats: SWECacheStats | null;
  loading: boolean;
  error: string | null;

  // 派生状态（直接存储，避免在组件中计算）
  totalCount: number;
  runningCount: number;
  completedCount: number;
  failedCount: number;

  // 筛选条件
  filters: SWETaskFilters;

  // Actions
  setFilters: (filters: SWETaskFilters) => void;
  fetchTasks: (filters?: SWETaskFilters) => Promise<void>;
  fetchTask: (id: string) => Promise<void>;
  createTask: (data: CreateSWETaskRequest) => Promise<SWEBenchTask>;
  retryTask: (id: string) => Promise<void>;
  fixTask: (id: string) => Promise<void>;
  cancelTask: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  exportTask: (id: string) => Promise<string>;
  fetchLogs: (id: string, params?: { phase?: string; limit?: number }) => Promise<void>;
  fetchCache: () => Promise<void>;
  deleteCache: (repoName: string) => Promise<void>;
  refreshCache: (repoName: string) => Promise<void>;
  clearCurrentTask: () => void;
  updateTaskProgress: (taskId: string, progress: number, phase: string) => void;
  updateTaskStatus: (taskId: string, status: string) => void;
}

export const useSWEStore = create<SWEState>()(
  subscribeWithSelector((set, get) => ({
    // 初始状态
    tasks: [],
    currentTask: null,
    taskLogs: [],
    cacheStats: null,
    loading: false,
    error: null,
    totalCount: 0,
    runningCount: 0,
    completedCount: 0,
    failedCount: 0,
    filters: {
      page: 1,
      pageSize: 20,
      sortBy: 'createdAt',
      sortOrder: 'desc',
    },

    // 设置筛选条件
    setFilters: (filters) => {
      set({ filters: { ...get().filters, ...filters } });
    },

    // 获取任务列表
    fetchTasks: async (filters) => {
      set({ loading: true, error: null });
      try {
        const mergedFilters = { ...get().filters, ...filters };
        const response = await sweService.list(mergedFilters);
          const data = response as any;

        // 计算派生状态
        const tasks = data?.data || [];
        const runningCount = tasks.filter((t: SWEBenchTask) => t.status === 'running').length;
        const completedCount = tasks.filter((t: SWEBenchTask) => t.status === 'completed').length;
        const failedCount = tasks.filter((t: SWEBenchTask) => t.status === 'failed').length;

        set({
          tasks,
          totalCount: data?.total || 0,
          runningCount,
          completedCount,
          failedCount,
          loading: false,
          filters: mergedFilters,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '加载失败',
          loading: false,
        });
      }
    },

    // 获取任务详情
    fetchTask: async (id) => {
      set({ loading: true, error: null });
      try {
        const response = await sweService.get(id);
        const task = response as any;
        set({ currentTask: task, loading: false });

        // 同时更新列表中的任务
        if (task) {
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === id ? task : t)),
          }));
        }
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '加载失败',
          loading: false,
        });
      }
    },

    // 创建任务
    createTask: async (data) => {
      set({ loading: true, error: null });
      try {
        const response = await sweService.create(data);
        const task = response as any;

        if (task) {
          set((state) => ({
            tasks: [task, ...state.tasks],
            totalCount: state.totalCount + 1,
            loading: false,
          }));
          return task;
        }

        set({ loading: false });
        throw new Error('创建任务失败');
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '创建失败',
          loading: false,
        });
        throw error;
      }
    },

    // 重试任务
    retryTask: async (id) => {
      try {
        await sweService.retry(id);
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status: 'running' as const, progress: 0 } : t
          ),
        }));

        // 刷新当前任务
        if (get().currentTask?.id === id) {
          get().fetchTask(id);
        }
      } catch (error) {
        set({ error: error instanceof Error ? error.message : '重试失败' });
        throw error;
      }
    },

    // 智能修复
    fixTask: async (id) => {
      try {
        await sweService.fix(id);
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status: 'running' as const, fixAttempts: t.fixAttempts + 1 } : t
          ),
        }));

        // 刷新当前任务
        if (get().currentTask?.id === id) {
          get().fetchTask(id);
        }
      } catch (error) {
        set({ error: error instanceof Error ? error.message : '修复失败' });
        throw error;
      }
    },

    // 取消任务
    cancelTask: async (id) => {
      try {
        await sweService.cancel(id);
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === id ? { ...t, status: 'cancelled' as const } : t
          ),
        }));

        // 刷新当前任务
        if (get().currentTask?.id === id) {
          get().fetchTask(id);
        }
      } catch (error) {
        set({ error: error instanceof Error ? error.message : '取消失败' });
        throw error;
      }
    },

    // 删除任务
    deleteTask: async (id) => {
      try {
        await sweService.delete(id);
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== id),
          totalCount: state.totalCount - 1,
          currentTask: state.currentTask?.id === id ? null : state.currentTask,
        }));
      } catch (error) {
        set({ error: error instanceof Error ? error.message : '删除失败' });
        throw error;
      }
    },

    // 导出任务
    exportTask: async (id) => {
      try {
        const response = await sweService.export(id);
        const result = response as any;
        return result?.downloadUrl || '';
      } catch (error) {
        set({ error: error instanceof Error ? error.message : '导出失败' });
        throw error;
      }
    },

    // 获取任务日志
    fetchLogs: async (id, params) => {
      try {
        const response = await sweService.getLogs(id, params);
        const logs = response as any || [];
        set({ taskLogs: logs });
      } catch (error) {
        set({ error: error instanceof Error ? error.message : '加载日志失败' });
        throw error;
      }
    },

    // 获取缓存统计
    fetchCache: async () => {
      set({ loading: true, error: null });
      try {
        const response = await sweService.getCache();
        set({ cacheStats: response as any, loading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '加载缓存失败',
          loading: false,
        });
        throw error;
      }
    },

    // 删除缓存
    deleteCache: async (repoName) => {
      try {
        await sweService.deleteCache(repoName);
        // 刷新缓存列表
        get().fetchCache();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : '删除缓存失败' });
        throw error;
      }
    },

    // 刷新缓存
    refreshCache: async (repoName) => {
      try {
        await sweService.refreshCache(repoName);
        // 刷新缓存列表
        get().fetchCache();
      } catch (error) {
        set({ error: error instanceof Error ? error.message : '刷新缓存失败' });
        throw error;
      }
    },

    // 清空当前任务
    clearCurrentTask: () => {
      set({ currentTask: null, taskLogs: [] });
    },

    // 更新任务进度（WebSocket 回调）
    updateTaskProgress: (taskId, progress, phase) => {
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === taskId ? { ...t, progress, currentPhase: phase as any } : t
        ),
        currentTask:
          state.currentTask?.id === taskId
            ? { ...state.currentTask, progress, currentPhase: phase as any }
            : state.currentTask,
      }));
    },

    // 更新任务状态（WebSocket 回调）
    updateTaskStatus: (taskId, status) => {
      set((state) => {
        const updatedTasks = state.tasks.map((t) =>
          t.id === taskId ? { ...t, status: status as any } : t
        );

        // 更新派生状态
        const runningCount = updatedTasks.filter((t: SWEBenchTask) => t.status === 'running').length;
        const completedCount = updatedTasks.filter((t: SWEBenchTask) => t.status === 'completed').length;
        const failedCount = updatedTasks.filter((t: SWEBenchTask) => t.status === 'failed').length;

        return {
          tasks: updatedTasks,
          runningCount,
          completedCount,
          failedCount,
          currentTask:
            state.currentTask?.id === taskId
              ? { ...state.currentTask, status: status as any }
              : state.currentTask,
        };
      });
    },
  }))
);

// 细粒度选择器
export const useSWETasks = () => useSWEStore((state) => state.tasks);
export const useCurrentSWETask = () => useSWEStore((state) => state.currentTask);
export const useSWELoading = () => useSWEStore((state) => state.loading);
export const useSWEError = () => useSWEStore((state) => state.error);
export const useSWECacheStats = () => useSWEStore((state) => state.cacheStats);
export const useSWETaskLogs = () => useSWEStore((state) => state.taskLogs);
export const useSWETasksCount = () =>
  useSWEStore((state) => ({
    total: state.totalCount,
    running: state.runningCount,
    completed: state.completedCount,
    failed: state.failedCount,
  }));

export default useSWEStore;
