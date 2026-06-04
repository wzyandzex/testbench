import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import i18next from 'i18next';
import { metricsPageService, type MetricsCatalog } from './service';
import type {
  MetricsComparison,
  MetricsListParams,
  MetricsRanking,
  MetricsRecord,
  MetricsReport,
} from '@/types/metrics';

interface ComparisonDraft {
  reference_id: string;
  target_id: string;
}

interface MetricsWorkbenchState {
  filters: MetricsListParams;
  records: MetricsRecord[];
  ranking: MetricsRanking[];
  total: number;
  loading: boolean;
  rankingLoading: boolean;
  catalogLoading: boolean;
  comparisonLoading: boolean;
  reportLoading: boolean;
  error: string | null;
  catalog: MetricsCatalog;
  comparisonDraft: ComparisonDraft;
  comparison: MetricsComparison | null;
  activeReportExecutionId: string | null;
  report: MetricsReport | null;
  reportOpen: boolean;
  setFilters: (patch: Partial<MetricsListParams>) => void;
  applyFilters: (patch?: Partial<MetricsListParams>) => Promise<void>;
  setPage: (page: number, pageSize?: number) => Promise<void>;
  loadCatalog: () => Promise<void>;
  loadMetrics: () => Promise<void>;
  loadRanking: () => Promise<void>;
  refresh: () => Promise<void>;
  setComparisonDraft: (patch: Partial<ComparisonDraft>) => void;
  useExecutionForComparison: (slot: 'reference' | 'target', executionId: string) => void;
  runComparison: () => Promise<void>;
  openReport: (executionId: string) => Promise<void>;
  closeReport: () => void;
  clearError: () => void;
}

const defaultFilters: MetricsListParams = {
  page: 1,
  page_size: 20,
  order_by: 'created_at',
  order_dir: 'desc',
};

const emptyCatalog: MetricsCatalog = {
  agents: [],
  benchmarks: [],
  agentNameMap: {},
  benchmarkNameMap: {},
};

function asArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

export const useMetricsPageStore = create<MetricsWorkbenchState>()(
  subscribeWithSelector((set, get) => ({
    filters: defaultFilters,
    records: [],
    ranking: [],
    total: 0,
    loading: false,
    rankingLoading: false,
    catalogLoading: false,
    comparisonLoading: false,
    reportLoading: false,
    error: null,
    catalog: emptyCatalog,
    comparisonDraft: {
      reference_id: '',
      target_id: '',
    },
    comparison: null,
    activeReportExecutionId: null,
    report: null,
    reportOpen: false,

    setFilters: (patch) => {
      set((state) => ({
        filters: {
          ...state.filters,
          ...patch,
        },
      }));
    },

    applyFilters: async (patch) => {
      set((state) => ({
        filters: {
          ...state.filters,
          ...patch,
          page: 1,
        },
      }));
      await get().refresh();
    },

    setPage: async (page, pageSize) => {
      set((state) => ({
        filters: {
          ...state.filters,
          page,
          page_size: pageSize ?? state.filters.page_size,
        },
      }));
      await get().loadMetrics();
    },

    loadCatalog: async () => {
      set({ catalogLoading: true, error: null });
      try {
        const catalog = await metricsPageService.loadCatalog();
        set({ catalog, catalogLoading: false });
      } catch (error) {
        set({
          catalogLoading: false,
          error: error instanceof Error ? error.message : i18next.t('metrics:loadFailed.catalog'),
        });
      }
    },

    loadMetrics: async () => {
      set({ loading: true, error: null });
      try {
        const response = await metricsPageService.listMetrics(get().filters);
        set({
          records: asArray(response.data),
          total: typeof response.total === 'number' ? response.total : 0,
          loading: false,
        });
      } catch (error) {
        set({
          loading: false,
          error: error instanceof Error ? error.message : i18next.t('metrics:loadFailed.records'),
        });
      }
    },

    loadRanking: async () => {
      set({ rankingLoading: true, error: null });
      try {
        const ranking = await metricsPageService.getRanking(get().filters);
        set({ ranking: asArray(ranking), rankingLoading: false });
      } catch (error) {
        set({
          rankingLoading: false,
          error: error instanceof Error ? error.message : i18next.t('metrics:loadFailed.ranking'),
        });
      }
    },

    refresh: async () => {
      await Promise.all([get().loadMetrics(), get().loadRanking()]);
    },

    setComparisonDraft: (patch) => {
      set((state) => ({
        comparisonDraft: {
          ...state.comparisonDraft,
          ...patch,
        },
      }));
    },

    useExecutionForComparison: (slot, executionId) => {
      set((state) => ({
        comparisonDraft: {
          ...state.comparisonDraft,
          [slot === 'reference' ? 'reference_id' : 'target_id']: executionId,
        },
      }));
    },

    runComparison: async () => {
      const draft = get().comparisonDraft;
      if (!draft.reference_id || !draft.target_id) {
        set({ error: i18next.t('metrics:compare.requireIds') });
        return;
      }

      set({ comparisonLoading: true, error: null });
      try {
        const comparison = await metricsPageService.compareExecutions(draft);
        set({ comparison, comparisonLoading: false });
      } catch (error) {
        set({
          comparisonLoading: false,
          error: error instanceof Error ? error.message : i18next.t('metrics:loadFailed.compare'),
        });
      }
    },

    openReport: async (executionId) => {
      set({
        reportLoading: true,
        reportOpen: true,
        activeReportExecutionId: executionId,
        error: null,
      });
      try {
        const report = await metricsPageService.getReport(executionId);
        set({
          report,
          reportLoading: false,
        });
      } catch (error) {
        set({
          reportLoading: false,
          error: error instanceof Error ? error.message : i18next.t('metrics:loadFailed.report'),
        });
      }
    },

    closeReport: () => {
      set({
        reportOpen: false,
        report: null,
        activeReportExecutionId: null,
      });
    },

    clearError: () => {
      set({ error: null });
    },
  }))
);

export default useMetricsPageStore;
