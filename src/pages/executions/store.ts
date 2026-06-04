/**
 * Execution state store
 */

import { create } from 'zustand';
import i18next from 'i18next';
import type {
  Execution,
  ExecutionDetail,
  ExecutionListParams,
  ExecutionLog,
} from './service';

interface ExecutionState {
  // data state
  executions: Execution[];
  currentExecution: ExecutionDetail | null;
  logs: ExecutionLog[];
  total: number;

  // list query state
  listParams: ExecutionListParams;

  // UI state
  loading: boolean;
  logsLoading: boolean;
  error: string | null;
  autoRefresh: boolean;
  selectedIds: string[];

  // actions
  fetchList: () => Promise<void>;
  fetchDetail: (id: string) => Promise<void>;
  fetchLogs: (id: string) => Promise<void>;
  cancel: (id: string) => Promise<void>;
  retry: (id: string) => Promise<void>;
  remove: (id: string) => Promise<void>;
  batchRemove: (ids: string[]) => Promise<void>;
  setListParams: (params: Partial<ExecutionListParams>) => void;
  setAutoRefresh: (enabled: boolean) => void;
  setSelectedIds: (ids: string[]) => void;
  clearError: () => void;
  clearCurrent: () => void;
}

export const useExecutionStore = create<ExecutionState>((set, get) => ({
  // initial state
  executions: [],
  currentExecution: null,
  logs: [],
  total: 0,
  listParams: {
    page: 1,
    pageSize: 20,
    status: [],
    agentId: [],
    benchmarkId: [],
  },
  loading: false,
  logsLoading: false,
  error: null,
  autoRefresh: false,
  selectedIds: [],

  fetchList: async () => {
    set({ loading: true, error: null });
    try {
      const { getExecutionList } = await import('./service');
      const result = await getExecutionList(get().listParams);
      set({
        executions: result.data,
        total: result.total,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : i18next.t('executions:errors.fetchListFailed');
      set({ error: message, loading: false });
    }
  },

  fetchDetail: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { getExecutionDetail } = await import('./service');
      const execution = await getExecutionDetail(id);
      set({
        currentExecution: execution,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : i18next.t('executions:errors.fetchDetailFailed');
      set({ error: message, loading: false });
    }
  },

  fetchLogs: async (id: string) => {
    set({ logsLoading: true, error: null });
    try {
      const { getExecutionLogs } = await import('./service');
      const logs = await getExecutionLogs(id);
      set({ logs, logsLoading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : i18next.t('executions:errors.fetchLogsFailed');
      set({ error: message, logsLoading: false });
    }
  },

  cancel: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { cancelExecution } = await import('./service');
      await cancelExecution(id);
      set({ loading: false });
      get().fetchList();
    } catch (err) {
      const message = err instanceof Error ? err.message : i18next.t('executions:errors.cancelFailed');
      set({ error: message, loading: false });
      throw err;
    }
  },

  retry: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { retryExecution } = await import('./service');
      await retryExecution(id);
      set({ loading: false });
      get().fetchList();
    } catch (err) {
      const message = err instanceof Error ? err.message : i18next.t('executions:errors.retryFailed');
      set({ error: message, loading: false });
      throw err;
    }
  },

  remove: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { deleteExecution } = await import('./service');
      await deleteExecution(id);
      set({ loading: false });
      get().fetchList();
    } catch (err) {
      const message = err instanceof Error ? err.message : i18next.t('executions:errors.deleteFailed');
      set({ error: message, loading: false });
      throw err;
    }
  },

  batchRemove: async (ids: string[]) => {
    set({ loading: true, error: null });
    try {
      const { batchDeleteExecutions } = await import('./service');
      await batchDeleteExecutions(ids);
      set({ loading: false, selectedIds: [] });
      get().fetchList();
    } catch (err) {
      const message = err instanceof Error ? err.message : i18next.t('executions:errors.batchDeleteFailed');
      set({ error: message, loading: false });
      throw err;
    }
  },

  setListParams: (params) => {
    set({ listParams: { ...get().listParams, ...params } });
  },

  setAutoRefresh: (enabled) => set({ autoRefresh: enabled }),

  setSelectedIds: (ids) => set({ selectedIds: ids }),

  clearError: () => set({ error: null }),

  clearCurrent: () => set({ currentExecution: null, logs: [] }),
}));
