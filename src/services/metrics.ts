import api from './api';
import type {
  CreateMetricsAggregatedParams,
  MetricsComparison,
  MetricsComparisonParams,
  MetricsListParams,
  MetricsListResponse,
  MetricsRanking,
  MetricsRecord,
  MetricsReport,
} from '@/types/metrics';

function appendString(searchParams: URLSearchParams, key: string, value?: string) {
  const normalized = value?.trim();
  if (normalized) {
    searchParams.append(key, normalized);
  }
}

function appendNumber(searchParams: URLSearchParams, key: string, value?: number) {
  if (value !== undefined && value !== null && Number.isFinite(value)) {
    searchParams.append(key, String(value));
  }
}

function buildMetricsQuery(params: MetricsListParams = {}) {
  const searchParams = new URLSearchParams();

  appendString(searchParams, 'execution_id', params.execution_id);
  appendString(searchParams, 'benchmark_id', params.benchmark_id);
  appendString(searchParams, 'agent_id', params.agent_id);
  appendNumber(searchParams, 'min_score', params.min_score);
  appendNumber(searchParams, 'max_score', params.max_score);
  appendString(searchParams, 'created_after', params.created_after);
  appendString(searchParams, 'created_before', params.created_before);
  appendNumber(searchParams, 'page', params.page);
  appendNumber(searchParams, 'page_size', params.page_size);
  appendString(searchParams, 'order_by', params.order_by);
  appendString(searchParams, 'order_dir', params.order_dir);

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export const metricsService = {
  list: async (params: MetricsListParams = {}): Promise<MetricsListResponse> => {
    return api.get(`/metrics${buildMetricsQuery(params)}`);
  },

  getExecutionMetrics: async (executionId: string): Promise<MetricsRecord> => {
    return api.get(`/metrics/execution/${executionId}`);
  },

  compare: async (params: MetricsComparisonParams): Promise<MetricsComparison> => {
    const searchParams = new URLSearchParams();
    appendString(searchParams, 'reference_id', params.reference_id);
    appendString(searchParams, 'target_id', params.target_id);
    return api.get(`/metrics/comparison?${searchParams.toString()}`);
  },

  getRanking: async (params: MetricsListParams = {}): Promise<MetricsRanking[]> => {
    return api.get(`/metrics/ranking${buildMetricsQuery(params)}`);
  },

  getReport: async (executionId: string): Promise<MetricsReport> => {
    return api.get(`/metrics/report/${executionId}`);
  },

  createAggregated: async (params: CreateMetricsAggregatedParams = {}): Promise<{ message: string }> => {
    const searchParams = new URLSearchParams();
    appendString(searchParams, 'period', params.period);
    appendString(searchParams, 'start_date', params.start_date);
    appendString(searchParams, 'end_date', params.end_date);
    const query = searchParams.toString();
    return api.post(`/metrics/aggregated${query ? `?${query}` : ''}`);
  },
};

export default metricsService;
