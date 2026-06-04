import { agentService } from '@/services/agent';
import { benchmarkService } from '@/services/benchmark';
import { metricsService } from '@/services/metrics';
import i18next from 'i18next';
import type {
  CreateMetricsAggregatedParams,
  MetricsComparison,
  MetricsComparisonParams,
  MetricsListParams,
  MetricsListResponse,
  MetricsRanking,
  MetricsReport,
} from '@/types/metrics';

export interface MetricsCatalogOption {
  value: string;
  label: string;
  secondary?: string;
}

export interface MetricsCatalog {
  agents: MetricsCatalogOption[];
  benchmarks: MetricsCatalogOption[];
  agentNameMap: Record<string, string>;
  benchmarkNameMap: Record<string, string>;
}

interface BenchmarkRuntimePage {
  data?: Array<{
    id: string;
    name: string;
    display_name?: string;
    type: string;
    language: string;
  }> | null;
}

function toArray<T>(value: T[] | null | undefined): T[] {
  return Array.isArray(value) ? value : [];
}

function toAgentOption(agent: {
  id: string;
  name: string;
  display_name?: string;
  type: string;
  status: string;
}): MetricsCatalogOption {
  const label = agent.display_name?.trim() || agent.name;
  return {
    value: agent.id,
    label,
    secondary: `${agent.type} / ${agent.status}`,
  };
}

function toBenchmarkOption(benchmark: {
  id: string;
  name: string;
  display_name?: string;
  type: string;
  language: string;
}): MetricsCatalogOption {
  const label = benchmark.display_name?.trim() || benchmark.name;
  return {
    value: benchmark.id,
    label,
    secondary: `${benchmark.type} / ${benchmark.language}`,
  };
}

function buildNameMap(options: MetricsCatalogOption[]) {
  return options.reduce<Record<string, string>>((acc, option) => {
    acc[option.value] = option.label;
    return acc;
  }, {});
}

export function buildRankingFilters(filters: MetricsListParams): MetricsListParams {
  const {
    execution_id: _executionId,
    agent_id: _agentId,
    page: _page,
    page_size: _pageSize,
    ...rest
  } = filters;

  return {
    ...rest,
    page: 1,
    page_size: 1000,
  };
}

export function formatMetricScore(score?: number | null) {
  if (score === undefined || score === null) {
    return '-';
  }
  return `${(score * 100).toFixed(1)} ${i18next.t('metrics:stats.points')}`;
}

export function formatDurationMs(duration?: number | null) {
  if (!duration) {
    return '-';
  }
  if (duration < 1000) {
    return `${duration} ms`;
  }
  if (duration < 60000) {
    return `${(duration / 1000).toFixed(1)} s`;
  }
  return `${(duration / 60000).toFixed(1)} min`;
}

export const metricsPageService = {
  loadCatalog: async (): Promise<MetricsCatalog> => {
    const [agentsResponse, benchmarksResponse] = await Promise.all([
      agentService.list({
        page: 1,
        page_size: 200,
        order_by: 'name',
        order_dir: 'asc',
      }),
      benchmarkService.list({
        page: 1,
        page_size: 200,
        order_by: 'updated_at',
        order_dir: 'desc',
      }),
    ]);

    const agents = toArray(agentsResponse.data).map(toAgentOption);
    const benchmarksPage = benchmarksResponse as unknown as BenchmarkRuntimePage;
    const benchmarks = toArray(benchmarksPage.data).map(toBenchmarkOption);

    return {
      agents,
      benchmarks,
      agentNameMap: buildNameMap(agents),
      benchmarkNameMap: buildNameMap(benchmarks),
    };
  },

  listMetrics: async (params: MetricsListParams): Promise<MetricsListResponse> => {
    const response = await metricsService.list(params);
    return {
      total: typeof response?.total === 'number' ? response.total : 0,
      page: typeof response?.page === 'number' ? response.page : params.page || 1,
      size: typeof response?.size === 'number' ? response.size : params.page_size || 20,
      data: toArray(response?.data),
    };
  },

  getRanking: async (params: MetricsListParams): Promise<MetricsRanking[]> => {
    const ranking = await metricsService.getRanking(buildRankingFilters(params));
    return toArray(ranking);
  },

  compareExecutions: async (params: MetricsComparisonParams): Promise<MetricsComparison> => {
    return metricsService.compare(params);
  },

  getReport: async (executionId: string): Promise<MetricsReport> => {
    return metricsService.getReport(executionId);
  },

  createAggregated: async (params: CreateMetricsAggregatedParams) => {
    return metricsService.createAggregated(params);
  },
};

export default metricsPageService;
