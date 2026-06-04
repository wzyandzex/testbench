import dayjs from 'dayjs';
import type {
  BudgetInfo,
  CalculateCostRequest,
  CalculateCostResponse,
  CostOptimizationTip,
  CostQueryParams,
  CostStatistics,
  CostSummary,
  CreateModelCostRequest,
  ModelCost,
  OptimizationPriority,
  UpdateModelCostRequest,
} from '@/types/cost';
import { request } from './request';

function applyTimeRange(params: CostQueryParams = {}) {
  const next: Record<string, unknown> = { ...params };
  const { timeRange } = params;

  if ((!params.start_date || !params.end_date) && timeRange && timeRange !== 'custom') {
    const end = dayjs();
    const start =
      timeRange === 'today'
        ? end.startOf('day')
        : timeRange === 'week'
          ? end.subtract(6, 'day').startOf('day')
          : end.subtract(29, 'day').startOf('day');

    next.start_date = start.format('YYYY-MM-DD');
    next.end_date = end.format('YYYY-MM-DD');
  }

  if (!next.period) {
    next.period = 'day';
  }

  delete next.timeRange;
  return next;
}

function normalizeStatistics(stats: CostStatistics): CostStatistics {
  const trendData = stats.trend_data ?? [];

  return {
    ...stats,
    by_agent: stats.by_agent ?? [],
    by_benchmark: stats.by_benchmark ?? [],
    by_model: stats.by_model ?? [],
    trend_data: trendData,
    recommendations: stats.recommendations ?? [],
    daily_costs: trendData,
    by_project: stats.by_project ?? [],
    budget: stats.budget ?? null,
  };
}

function unsupported(message: string): never {
  throw new Error(message);
}

export const costService = {
  getStatistics: async (params: CostQueryParams = {}): Promise<CostStatistics> => {
    const result = await request.get<CostStatistics>('/cost/statistics', {
      params: applyTimeRange(params),
    });
    return normalizeStatistics(result);
  },

  getSummary: (params?: CostQueryParams): Promise<CostSummary> => {
    return request.get<CostSummary>('/cost/summary', {
      params: applyTimeRange(params),
    });
  },

  getTrends: async (params?: CostQueryParams): Promise<{ trend_data: CostStatistics['trend_data'] }> => {
    const statistics = await costService.getStatistics(params);
    return { trend_data: statistics.trend_data };
  },

  getByModel: async (params?: CostQueryParams): Promise<{ by_model: CostStatistics['by_model'] }> => {
    const statistics = await costService.getStatistics(params);
    return { by_model: statistics.by_model };
  },

  getByProject: async (): Promise<{ by_project: CostStatistics['by_project'] }> => {
    unsupported('当前后端未提供项目维度成本分布接口。');
  },

  getModelCosts: async (): Promise<ModelCost[]> => {
    const result = await request.get<{ models: ModelCost[]; total: number }>('/cost/models');
    return result.models ?? [];
  },

  createModelCost: (data: CreateModelCostRequest): Promise<ModelCost> => {
    return request.post<ModelCost>('/cost/models', data);
  },

  updateModelCost: (id: string, data: UpdateModelCostRequest): Promise<ModelCost> => {
    return request.put<ModelCost>(`/cost/models/${id}`, data);
  },

  deleteModelCost: async (id: string): Promise<void> => {
    await request.delete(`/cost/models/${id}`);
  },

  getBudget: async (): Promise<BudgetInfo | null> => {
    unsupported('当前后端未提供预算管理接口。');
  },

  setBudget: async (_data?: { limit: number }): Promise<BudgetInfo> => {
    unsupported('当前后端未提供预算管理接口。');
  },

  resetBudget: async (): Promise<void> => {
    unsupported('当前后端未提供预算管理接口。');
  },

  getOptimizationTips: async (params?: CostQueryParams): Promise<CostOptimizationTip[]> => {
    const statistics = await costService.getStatistics(params);
    return statistics.recommendations;
  },

  calculateCost: (data: CalculateCostRequest): Promise<CalculateCostResponse> => {
    return request.post<CalculateCostResponse>('/cost/calculate', data);
  },
};

export function formatCost(cost: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(cost);
}

export function formatTokens(tokens: number): string {
  if (tokens >= 1_000_000_000) {
    return `${(tokens / 1_000_000_000).toFixed(1)}B`;
  }
  if (tokens >= 1_000_000) {
    return `${(tokens / 1_000_000).toFixed(1)}M`;
  }
  if (tokens >= 1_000) {
    return `${(tokens / 1_000).toFixed(1)}K`;
  }
  return tokens.toString();
}

export function getBudgetStatusColor(percentage: number): string {
  if (percentage >= 100) return '#ef4444';
  if (percentage >= 80) return '#f59e0b';
  return '#10b981';
}

export function getBudgetStatusText(percentage: number): string {
  if (percentage >= 100) return '超支';
  if (percentage >= 80) return '临界';
  return '正常';
}

export function getTipPriority(tip: CostOptimizationTip): OptimizationPriority {
  const savings = tip.potential_savings ?? 0;
  if (savings >= 100) return 'high';
  if (savings >= 20) return 'medium';
  return 'low';
}

export function getPriorityColor(priority: OptimizationPriority): string {
  switch (priority) {
    case 'high':
      return '#ef4444';
    case 'medium':
      return '#f59e0b';
    case 'low':
      return '#10b981';
  }
}

export function getPriorityText(priority: OptimizationPriority): string {
  switch (priority) {
    case 'high':
      return '高';
    case 'medium':
      return '中';
    case 'low':
      return '低';
  }
}
