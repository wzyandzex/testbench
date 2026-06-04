import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { metricsService } from '@/services/metrics';
import type { MetricsListParams, MetricsRanking, MetricsRecord } from '@/types/metrics';

interface MetricsStoreState {
  records: MetricsRecord[];
  ranking: MetricsRanking[];
  total: number;
  loading: boolean;
  error: string | null;
  filters: MetricsListParams;
  setFilters: (filters: Partial<MetricsListParams>) => void;
  fetchRecords: () => Promise<void>;
  fetchRanking: () => Promise<void>;
  reset: () => void;
}

const defaultFilters: MetricsListParams = {
  page: 1,
  page_size: 20,
  order_by: 'created_at',
  order_dir: 'desc',
};

function buildRankingFilters(filters: MetricsListParams): MetricsListParams {
  const { execution_id: _executionId, agent_id: _agentId, ...rest } = filters;
  return {
    ...rest,
    page: 1,
    page_size: 1000,
  };
}

export const useMetricsStore = create<MetricsStoreState>()(
  subscribeWithSelector((set, get) => ({
    records: [],
    ranking: [],
    total: 0,
    loading: false,
    error: null,
    filters: defaultFilters,

    setFilters: (filters) => {
      set((state) => ({
        filters: {
          ...state.filters,
          ...filters,
        },
      }));
    },

    fetchRecords: async () => {
      set({ loading: true, error: null });
      try {
        const response = await metricsService.list(get().filters);
        set({
          records: response.data,
          total: response.total,
          loading: false,
        });
      } catch (error) {
        set({
          loading: false,
          error: error instanceof Error ? error.message : '加载指标失败',
        });
      }
    },

    fetchRanking: async () => {
      try {
        const ranking = await metricsService.getRanking(buildRankingFilters(get().filters));
        set({ ranking });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '加载排行失败',
        });
      }
    },

    reset: () => {
      set({
        records: [],
        ranking: [],
        total: 0,
        error: null,
        filters: defaultFilters,
      });
    },
  }))
);

export const useMetricsOverview = () => useMetricsStore((state) => state.records);
export const useMetricsSeries = () => useMetricsStore((state) => state.ranking);
export const useMetricsLoading = () => useMetricsStore((state) => state.loading);

export default useMetricsStore;
