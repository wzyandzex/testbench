import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { batchService } from '@/services/batch';
import type { BatchExecution, BatchListParams, BatchStatus, BatchSummary } from '@/types/api/batch';

interface BatchState {
  batches: BatchSummary[];
  currentBatch: BatchExecution | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
  runningCount: number;
  completedCount: number;
  fetchBatches: (params?: BatchListParams) => Promise<void>;
  fetchBatchDetail: (id: string) => Promise<void>;
  setCurrentBatch: (batch: BatchExecution | null) => void;
  cancelBatch: (id: string) => Promise<void>;
  clearCurrentBatch: () => void;
}

function countByStatus(items: BatchSummary[], status: BatchStatus): number {
  return items.filter((item) => item.status === status).length;
}

export const useBatchStore = create<BatchState>()(
  subscribeWithSelector((set, get) => ({
    batches: [],
    currentBatch: null,
    loading: false,
    error: null,
    totalCount: 0,
    runningCount: 0,
    completedCount: 0,

    fetchBatches: async (params) => {
      set({ loading: true, error: null });
      try {
        const response = await batchService.getList(params);
        set({
          batches: response.data,
          totalCount: response.total,
          runningCount: countByStatus(response.data, 'running'),
          completedCount: countByStatus(response.data, 'completed'),
          loading: false,
        });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '加载批量任务失败',
          loading: false,
        });
      }
    },

    fetchBatchDetail: async (id) => {
      set({ loading: true, error: null });
      try {
        const detail = await batchService.getDetail(id);
        set({ currentBatch: detail, loading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '加载批量任务详情失败',
          loading: false,
        });
      }
    },

    setCurrentBatch: (batch) => {
      set({ currentBatch: batch });
    },

    cancelBatch: async (id) => {
      await batchService.cancel(id);
      set((state) => ({
        batches: state.batches.map((item) =>
          item.id === id ? { ...item, status: 'cancelled' as const } : item
        ),
        currentBatch:
          state.currentBatch?.id === id
            ? { ...state.currentBatch, status: 'cancelled' as const }
            : state.currentBatch,
      }));

      const nextBatches = get().batches;
      set({
        runningCount: countByStatus(nextBatches, 'running'),
        completedCount: countByStatus(nextBatches, 'completed'),
      });
    },

    clearCurrentBatch: () => {
      set({ currentBatch: null });
    },
  }))
);

export const useBatches = () => useBatchStore((state) => state.batches);
export const useCurrentBatch = () => useBatchStore((state) => state.currentBatch);
export const useBatchLoading = () => useBatchStore((state) => state.loading);
export const useRunningBatchCount = () => useBatchStore((state) => state.runningCount);

export default useBatchStore;
