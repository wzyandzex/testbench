import { create } from 'zustand';
import i18n from '@/i18n';
import { costService } from '@/services/cost';
import type {
  BudgetInfo,
  CostOptimizationTip,
  CostQueryParams,
  CostStatistics,
  CostSummary,
  CreateModelCostRequest,
  ModelCost,
  UpdateModelCostRequest,
} from '@/types/cost';

interface CostState {
  statistics: CostStatistics | null;
  summary: CostSummary | null;
  modelCosts: ModelCost[];
  budget: BudgetInfo | null;
  optimizationTips: CostOptimizationTip[];
  queryParams: CostQueryParams;
  loading: boolean;
  modelCostSaving: boolean;
  error: string | null;
  activeTab: string;
  setQueryParams: (params: Partial<CostQueryParams>) => void;
  setActiveTab: (tab: string) => void;
  clearError: () => void;
  fetchStatistics: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  fetchModelCosts: () => Promise<void>;
  refreshAll: () => Promise<void>;
  createModelCost: (data: CreateModelCostRequest) => Promise<ModelCost>;
  updateModelCost: (id: string, data: UpdateModelCostRequest) => Promise<ModelCost>;
  deleteModelCost: (id: string) => Promise<void>;
  setBudget: (limit: number) => Promise<void>;
}

export const useCostStore = create<CostState>((set, get) => ({
  statistics: null,
  summary: null,
  modelCosts: [],
  budget: null,
  optimizationTips: [],
  queryParams: {
    timeRange: 'month',
    period: 'day',
  },
  loading: false,
  modelCostSaving: false,
  error: null,
  activeTab: 'overview',

  setQueryParams: (params) => {
    set({
      queryParams: {
        ...get().queryParams,
        ...params,
      },
    });
  },

  setActiveTab: (tab) => set({ activeTab: tab }),

  clearError: () => set({ error: null }),

  fetchStatistics: async () => {
    set({ loading: true, error: null });
    try {
      const statistics = await costService.getStatistics(get().queryParams);
      set({
        statistics,
        optimizationTips: statistics.recommendations,
        loading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : i18n.t('cost:loadFailed.stats');
      set({ error: message, loading: false });
      throw error;
    }
  },

  fetchSummary: async () => {
    try {
      const summary = await costService.getSummary(get().queryParams);
      set({ summary });
    } catch (error) {
      const message = error instanceof Error ? error.message : i18n.t('cost:loadFailed.summary');
      set({ error: message });
      throw error;
    }
  },

  fetchModelCosts: async () => {
    try {
      const modelCosts = await costService.getModelCosts();
      set({ modelCosts });
    } catch (error) {
      const message = error instanceof Error ? error.message : i18n.t('cost:loadFailed.pricing');
      set({ error: message });
      throw error;
    }
  },

  refreshAll: async () => {
    set({ loading: true, error: null });
    try {
      const [statistics, summary, modelCosts] = await Promise.all([
        costService.getStatistics(get().queryParams),
        costService.getSummary(get().queryParams),
        costService.getModelCosts(),
      ]);

      set({
        statistics,
        summary,
        modelCosts,
        budget: null,
        optimizationTips: statistics.recommendations,
        loading: false,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : i18n.t('cost:loadFailed.refresh');
      set({ error: message, loading: false });
      throw error;
    }
  },

  createModelCost: async (data) => {
    set({ modelCostSaving: true, error: null });
    try {
      const created = await costService.createModelCost(data);
      set((state) => ({
        modelCosts: [created, ...state.modelCosts],
        modelCostSaving: false,
      }));
      return created;
    } catch (error) {
      const message = error instanceof Error ? error.message : i18n.t('cost:loadFailed.create');
      set({ error: message, modelCostSaving: false });
      throw error;
    }
  },

  updateModelCost: async (id, data) => {
    set({ modelCostSaving: true, error: null });
    try {
      const updated = await costService.updateModelCost(id, data);
      set((state) => ({
        modelCosts: state.modelCosts.map((item) => (item.id === id ? updated : item)),
        modelCostSaving: false,
      }));
      return updated;
    } catch (error) {
      const message = error instanceof Error ? error.message : i18n.t('cost:loadFailed.update');
      set({ error: message, modelCostSaving: false });
      throw error;
    }
  },

  deleteModelCost: async (id) => {
    set({ modelCostSaving: true, error: null });
    try {
      await costService.deleteModelCost(id);
      set((state) => ({
        modelCosts: state.modelCosts.filter((item) => item.id !== id),
        modelCostSaving: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : i18n.t('cost:loadFailed.delete');
      set({ error: message, modelCostSaving: false });
      throw error;
    }
  },

  setBudget: async (limit) => {
    await costService.setBudget({ limit });
  },
}));

export const useCostStatistics = () => useCostStore((state) => state.statistics);
export const useTotalCost = () =>
  useCostStore((state) => state.summary?.total_cost ?? state.statistics?.total_cost ?? 0);
export const useModelCosts = () => useCostStore((state) => state.modelCosts);
export const useBudget = () => useCostStore((state) => state.budget);
export const useOptimizationTips = () => useCostStore((state) => state.optimizationTips);
export const useCostLoading = () => useCostStore((state) => state.loading);
export const useCostActiveTab = () => useCostStore((state) => state.activeTab);
