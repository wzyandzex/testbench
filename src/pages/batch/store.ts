import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { batchPageService } from './service';
import type {
  BatchExecution,
  BatchListParams,
  BatchStatus,
  BatchSummary,
  CreateBatchRequest,
} from '@/types/api/batch';

interface BatchCounts {
  totalCount: number;
  runningCount: number;
  completedCount: number;
  failedCount: number;
  pendingCount: number;
  cancelledCount: number;
}

interface BatchState extends BatchCounts {
  batches: BatchSummary[];
  currentBatch: BatchExecution | null;
  loading: boolean;
  error: string | null;
  fetchBatches: (params?: BatchListParams) => Promise<void>;
  fetchBatchDetail: (id: string) => Promise<void>;
  setCurrentBatch: (batch: BatchExecution | null) => void;
  createBatch: (data: CreateBatchRequest) => Promise<string>;
  cancelBatch: (id: string) => Promise<void>;
  clearCurrentBatch: () => void;
}

function buildCounts(batches: BatchSummary[]): BatchCounts {
  const countByStatus = (status: BatchStatus) => batches.filter((item) => item.status === status).length;

  return {
    totalCount: batches.length,
    runningCount: countByStatus('running'),
    completedCount: countByStatus('completed'),
    failedCount: countByStatus('failed'),
    pendingCount: countByStatus('pending'),
    cancelledCount: countByStatus('cancelled'),
  };
}

export const useBatchPageStore = create<BatchState>()(
  subscribeWithSelector((set, get) => ({
    batches: [],
    currentBatch: null,
    loading: false,
    error: null,
    totalCount: 0,
    runningCount: 0,
    completedCount: 0,
    failedCount: 0,
    pendingCount: 0,
    cancelledCount: 0,

    fetchBatches: async (params) => {
      set({ loading: true, error: null });
      try {
        const response = await batchPageService.getList(params);
        set({
          batches: response.data,
          ...buildCounts(response.data),
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
        const detail = await batchPageService.getDetail(id);
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

    createBatch: async (data) => {
      const response = await batchPageService.create(data);
      await get().fetchBatches();
      return response.id;
    },

    cancelBatch: async (id) => {
      await batchPageService.cancel(id);
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
      set(buildCounts(nextBatches));
    },

    clearCurrentBatch: () => {
      set({ currentBatch: null });
    },
  }))
);

export default useBatchPageStore;
