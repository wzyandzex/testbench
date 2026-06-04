/**
 * Import state management
 * Data import module Zustand store
 */

import { create } from 'zustand';
import i18next from 'i18next';
import type {
  ImportTask,
  ImportTaskListParams,
  ImportTaskStatus,
  DatasetType,
  SourceType,
  ImportConfigType,
  ImportTaskListResponse,
} from './service';
import { importService } from './service';

interface ImportState {
  // ========== 数据状态 ==========
  tasks: ImportTask[];
  total: number;
  currentTask: ImportTask | null;

  // ========== 查询状态 ==========
  listParams: ImportTaskListParams;

  // ========== UI 状态 ==========
  loading: boolean;
  submitting: boolean;
  error: string | null;

  // 向导状态
  wizard: {
    open: boolean;
    step: number;
    datasetType: DatasetType | null;
    sourceType: SourceType | null;
    config: Partial<ImportConfigType>;
  };

  // ========== 操作 ==========

  // 获取任务列表
  fetchTasks: () => Promise<void>;

  // 获取任务详情
  fetchTask: (id: string) => Promise<ImportTask>;

  // 创建导入任务
  createTask: (config: ImportConfigType) => Promise<ImportTask>;

  // 取消任务
  cancelTask: (id: string) => Promise<void>;

  // 删除任务
  deleteTask: (id: string) => Promise<void>;

  // 批量删除任务
  batchDeleteTasks: (ids: string[]) => Promise<void>;

  // 设置列表参数
  setListParams: (params: Partial<ImportTaskListParams>) => void;

  // 清除错误
  clearError: () => void;

  // ========== 向导操作 ==========

  // 打开向导
  openWizard: () => void;

  // 关闭向导
  closeWizard: () => void;

  // 设置向导步骤
  setWizardStep: (step: number) => void;

  // 设置数据集类型
  setDatasetType: (type: DatasetType) => void;

  // 设置导入源类型
  setSourceType: (type: SourceType | null) => void;

  // 更新向导配置
  updateWizardConfig: (config: Partial<ImportConfigType>) => void;

  // 重置向导
  resetWizard: () => void;
}

export const useImportStore = create<ImportState>((set, get) => ({
  // ========== 初始状态 ==========
  tasks: [],
  total: 0,
  currentTask: null,
  listParams: {
    page: 1,
    pageSize: 20,
    datasetType: undefined,
    status: undefined,
    search: '',
  },
  loading: false,
  submitting: false,
  error: null,
  wizard: {
    open: false,
    step: 1,
    datasetType: null,
    sourceType: null,
    config: {},
  },

  // ========== 操作实现 ==========

  // 获取任务列表
  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const result: ImportTaskListResponse = await importService.getTasks(get().listParams);
      set({
        tasks: result.data || [],
        total: result.total || 0,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : i18next.t('import:loadFailed.list');
      set({ error: message, loading: false });
      throw err;
    }
  },

  // Fetch task detail
  fetchTask: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const task = await importService.getTask(id);
      set({ currentTask: task, loading: false });
      return task;
    } catch (err) {
      const message = err instanceof Error ? err.message : i18next.t('import:loadFailed.detail');
      set({ error: message, loading: false });
      throw err;
    }
  },

  // Create import task
  createTask: async (config: ImportConfigType) => {
    set({ submitting: true, error: null });
    try {
      const task = await importService.createTask(config);
      set({ submitting: false });
      // refresh list
      get().fetchTasks();
      return task;
    } catch (err) {
      const message = err instanceof Error ? err.message : i18next.t('import:loadFailed.create');
      set({ error: message, submitting: false });
      throw err;
    }
  },

  // Cancel task
  cancelTask: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await importService.cancelTask(id);
      // update local task status
      const tasks = get().tasks.map(task =>
        task.id === id ? { ...task, status: 'cancelled' as ImportTaskStatus } : task
      );
      set({ tasks, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : i18next.t('import:loadFailed.cancel');
      set({ error: message, loading: false });
      throw err;
    }
  },

  // Delete task
  deleteTask: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await importService.deleteTask(id);
      // remove from list
      const tasks = get().tasks.filter(task => task.id !== id);
      set({ tasks, total: get().total - 1, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : i18next.t('import:loadFailed.delete');
      set({ error: message, loading: false });
      throw err;
    }
  },

  // Batch delete tasks
  batchDeleteTasks: async (ids: string[]) => {
    set({ loading: true, error: null });
    try {
      await Promise.all(ids.map(id => importService.deleteTask(id)));
      // remove from list
      const tasks = get().tasks.filter(task => !ids.includes(task.id));
      set({ tasks, total: get().total - ids.length, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : i18next.t('import:loadFailed.batchDelete');
      set({ error: message, loading: false });
      throw err;
    }
  },

  // 设置列表参数
  setListParams: (params) => {
    set({ listParams: { ...get().listParams, ...params } });
  },

  // 清除错误
  clearError: () => set({ error: null }),

  // ========== 向导操作实现 ==========

  // 打开向导
  openWizard: () => set({ wizard: { ...get().wizard, open: true, step: 1 } }),

  // 关闭向导
  closeWizard: () => set({
    wizard: {
      open: false,
      step: 1,
      datasetType: null,
      sourceType: null,
      config: {},
    },
  }),

  // 设置向导步骤
  setWizardStep: (step) => set({ wizard: { ...get().wizard, step } }),

  // 设置数据集类型
  setDatasetType: (type) => set({ wizard: { ...get().wizard, datasetType: type } }),

  // 设置导入源类型
  setSourceType: (type) => set({ wizard: { ...get().wizard, sourceType: type } }),

  // 更新向导配置
  updateWizardConfig: (config) => set({
    wizard: {
      ...get().wizard,
      config: { ...get().wizard.config, ...config },
    },
  }),

  // 重置向导
  resetWizard: () => set({
    wizard: {
      open: false,
      step: 1,
      datasetType: null,
      sourceType: null,
      config: {},
    },
  }),
}));

// ========== 选择器 Hooks ==========

/**
 * 获取导入任务列表
 */
export const useImportTasks = () => useImportStore((s) => s.tasks);

/**
 * 获取导入任务总数
 */
export const useImportTotal = () => useImportStore((s) => s.total);

/**
 * 获取当前导入任务
 */
export const useCurrentImportTask = () => useImportStore((s) => s.currentTask);

/**
 * 获取加载状态
 */
export const useImportLoading = () => useImportStore((s) => s.loading);

/**
 * 获取提交状态
 */
export const useImportSubmitting = () => useImportStore((s) => s.submitting);

/**
 * 获取向导状态
 */
export const useImportWizard = () => useImportStore((s) => s.wizard);

/**
 * 获取指定状态的任务数量
 */
export const useImportTaskCountByStatus = (status: ImportTaskStatus) =>
  useImportStore((s) => s.tasks.filter(t => t.status === status).length);

/**
 * 获取运行中的任务
 */
export const useRunningImportTasks = () =>
  useImportStore((s) => s.tasks.filter(t => t.status === 'running'));
