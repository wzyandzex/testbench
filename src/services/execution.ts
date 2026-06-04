import type { ApiRequestConfig } from './api';
import api from './api';
import { runtimeConfig } from '@/constants/runtime';
import type { CalculateCostResponse } from '@/types/cost';
import type { PaginatedResponse } from '@/types/api/common';
import type { MetricsRecord } from '@/types/metrics';
import type {
  CreateExecutionRequest,
  ExecutionFilter,
  ExecutionRecord,
  ExecutionResultPayload,
  ExecutionStatus,
  ExecutionSummaryStats,
  ExecutionTrace,
} from '@/types/api/execution';

type ExecutionQueryInput = ExecutionFilter | Record<string, unknown>;

export type ExecutionExportFormat = 'html' | 'pdf' | 'excel';
export type ExecutionExportTemplate = 'summary' | 'detailed' | 'comparison';

export interface ExecutionExportOptions {
  format?: ExecutionExportFormat;
  template?: ExecutionExportTemplate;
  templateId?: string;
  includeCharts?: boolean;
  locale?: string;
}

export interface ExecutionExportFormatInfo {
  format: ExecutionExportFormat;
  name: string;
  templates: ExecutionExportTemplate[];
  content_type: string;
  extension: string;
  supports_charts: boolean;
}

export interface ExecutionExportResult {
  file_url?: string;
  file_name?: string;
  file_size?: number;
  content_type?: string;
  expires_at?: string;
  generated_at?: string;
}

export interface ExecutionBatchExportFileResult extends ExecutionExportResult {
  execution_id: string;
}

export interface ExecutionBatchExportFailure {
  execution_id: string;
  error: string;
}

export interface ExecutionBatchExportResult {
  job_id?: string;
  status?: string;
  total?: number;
  completed?: number;
  result?: ExecutionExportResult | null;
  results?: ExecutionBatchExportFileResult[];
  failures?: ExecutionBatchExportFailure[];
  error?: string;
}

function appendString(searchParams: URLSearchParams, key: string, value: unknown) {
  if (typeof value !== 'string') {
    return;
  }
  const normalized = value.trim();
  if (normalized) {
    searchParams.append(key, normalized);
  }
}

function appendNumber(searchParams: URLSearchParams, key: string, value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    searchParams.append(key, String(value));
  }
}

function appendBoolean(searchParams: URLSearchParams, key: string, value: unknown) {
  if (typeof value === 'boolean') {
    searchParams.append(key, String(value));
  }
}

function appendStringArray(searchParams: URLSearchParams, key: string, value: unknown) {
  if (!Array.isArray(value)) {
    return;
  }
  for (const item of value) {
    if (typeof item !== 'string') {
      continue;
    }
    const normalized = item.trim();
    if (normalized) {
      searchParams.append(key, normalized);
    }
  }
}

function buildExecutionQuery(params: ExecutionQueryInput = {}) {
  const input = params as Record<string, unknown>;
  const searchParams = new URLSearchParams();

  appendStringArray(searchParams, 'ids', input.ids);
  appendString(searchParams, 'benchmark_id', input.benchmark_id);
  appendString(searchParams, 'agent_id', input.agent_id);
  appendStringArray(searchParams, 'status', input.status);
  appendStringArray(searchParams, 'priority', input.priority);
  appendBoolean(searchParams, 'success', input.success);
  appendString(searchParams, 'started_after', input.started_after);
  appendString(searchParams, 'started_before', input.started_before);
  appendString(searchParams, 'completed_after', input.completed_after);
  appendString(searchParams, 'completed_before', input.completed_before);
  appendString(searchParams, 'sandbox_id', input.sandbox_id);
  appendString(searchParams, 'user_id', input.user_id);
  appendNumber(searchParams, 'page', input.page);
  appendNumber(searchParams, 'page_size', input.page_size);
  appendString(searchParams, 'order_by', input.order_by);
  appendString(searchParams, 'order_dir', input.order_dir);

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function isNotFoundError(error: unknown) {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const bizError = error as {
    isBizError?: boolean;
    code?: number;
    response?: {
      status?: number;
      data?: {
        code?: number;
      };
    };
  };

  if (bizError.isBizError && bizError.code === 404001) {
    return true;
  }

  return bizError.response?.status === 404 || bizError.response?.data?.code === 404001;
}

function apiPath(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${runtimeConfig.apiBaseUrl}${normalizedPath}`;
}

export function isExecutionTerminal(status: ExecutionStatus) {
  return status === 'completed' || status === 'failed' || status === 'cancelled' || status === 'timeout';
}

export function canCancelExecution(statusOrRecord: ExecutionStatus | Pick<ExecutionRecord, 'status'>) {
  const status = typeof statusOrRecord === 'string' ? statusOrRecord : statusOrRecord.status;
  return status === 'pending' || status === 'running';
}

export function getExecutionDurationMs(record: Pick<ExecutionRecord, 'duration' | 'started_at' | 'completed_at'>) {
  if (record.duration > 0) {
    return record.duration;
  }
  if (!record.completed_at) {
    return 0;
  }

  const startedAt = Date.parse(record.started_at);
  const completedAt = Date.parse(record.completed_at);
  if (!Number.isFinite(startedAt) || !Number.isFinite(completedAt)) {
    return 0;
  }
  return Math.max(0, completedAt - startedAt);
}

export function getExecutionProgress(record: Pick<ExecutionRecord, 'status' | 'steps_taken' | 'total_steps'>) {
  if (isExecutionTerminal(record.status)) {
    return null;
  }

  const currentStep = Math.max(0, record.steps_taken || 0);
  const totalSteps = Math.max(currentStep, record.total_steps || 0);
  if (currentStep <= 0 && totalSteps <= 0) {
    return null;
  }

  const percentage = totalSteps > 0 ? Math.min(100, Math.round((currentStep / totalSteps) * 100)) : 0;
  return {
    current_step: currentStep,
    total_steps: totalSteps,
    percentage,
    message: record.status === 'running' ? 'Execution in progress' : 'Execution pending',
  };
}

export function getExecutionPrimaryOutput(result?: ExecutionResultPayload | null) {
  const outputs = result?.outputs;
  if (!outputs) {
    return '';
  }
  if (typeof outputs.final_output === 'string' && outputs.final_output.trim()) {
    return outputs.final_output.trim();
  }
  if (typeof outputs.summary === 'string' && outputs.summary.trim()) {
    return outputs.summary.trim();
  }
  if (typeof outputs.test_results?.output === 'string' && outputs.test_results.output.trim()) {
    return outputs.test_results.output.trim();
  }

  const terminalLogs = outputs.terminal_logs ?? [];
  for (let index = terminalLogs.length - 1; index >= 0; index -= 1) {
    const terminalLog = terminalLogs[index];
    if (typeof terminalLog.stdout === 'string' && terminalLog.stdout.trim()) {
      return terminalLog.stdout.trim();
    }
    if (typeof terminalLog.stderr === 'string' && terminalLog.stderr.trim()) {
      return terminalLog.stderr.trim();
    }
  }

  return '';
}

export function getExecutionErrorText(record: Pick<ExecutionRecord, 'error'>, result?: ExecutionResultPayload | null) {
  if (typeof record.error === 'string' && record.error.trim()) {
    return record.error.trim();
  }
  if (typeof result?.error?.message === 'string' && result.error.message.trim()) {
    return result.error.message.trim();
  }

  const terminalLogs = result?.outputs?.terminal_logs ?? [];
  for (let index = terminalLogs.length - 1; index >= 0; index -= 1) {
    const terminalLog = terminalLogs[index];
    if (typeof terminalLog.stderr === 'string' && terminalLog.stderr.trim()) {
      return terminalLog.stderr.trim();
    }
  }

  return '';
}

export function buildExecutionExportDirectUrl(
  executionId: string,
  options: {
    format?: ExecutionExportFormat;
    template?: ExecutionExportTemplate;
    templateId?: string;
    includeCharts?: boolean;
    locale?: string;
  } = {}
) {
  const searchParams = new URLSearchParams();
  searchParams.set('type', options.format ?? 'html');
  searchParams.set('template', options.template ?? 'summary');
  if (options.templateId) {
    searchParams.set('template_id', options.templateId);
  }
  if (options.includeCharts) {
    searchParams.set('charts', 'true');
  }
  if (options.locale) {
    searchParams.set('locale', options.locale);
  }
  return `${apiPath(`/export/executions/${executionId}/direct`)}?${searchParams.toString()}`;
}

export const executionService = {
  list: async (params: ExecutionQueryInput = {}): Promise<PaginatedResponse<ExecutionRecord>> => {
    return api.get(`/executions${buildExecutionQuery(params)}`);
  },

  get: async (id: string): Promise<ExecutionRecord> => {
    return api.get(`/executions/${id}`);
  },

  create: async (data: CreateExecutionRequest): Promise<ExecutionRecord> => {
    return api.post('/executions', data);
  },

  cancel: async (id: string): Promise<{ message: string }> => {
    return api.delete(`/executions/${id}`);
  },

  getTrace: async (id: string): Promise<ExecutionTrace[]> => {
    return api.get(`/executions/${id}/trace`);
  },

  getSummary: async (params: ExecutionQueryInput = {}): Promise<ExecutionSummaryStats> => {
    return api.get(`/executions/summary${buildExecutionQuery(params)}`);
  },

  getMetrics: async (id: string): Promise<MetricsRecord | null> => {
    try {
      return await api.get(`/metrics/execution/${id}`, { silentError: true } as ApiRequestConfig);
    } catch (error) {
      if (isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  },

  getCost: async (id: string): Promise<CalculateCostResponse | null> => {
    try {
      return await api.get(`/cost/execution/${id}`, { silentError: true } as ApiRequestConfig);
    } catch (error) {
      if (isNotFoundError(error)) {
        return null;
      }
      throw error;
    }
  },

  getExportFormats: async (): Promise<{ formats: ExecutionExportFormatInfo[] }> => {
    return api.get('/export/formats');
  },

  requestExport: async (
    id: string,
    options: ExecutionExportOptions = {}
  ): Promise<ExecutionExportResult & { task_id?: string; status?: string }> => {
    const searchParams = new URLSearchParams();
    searchParams.set('type', options.format ?? 'html');
    searchParams.set('template', options.template ?? 'summary');
    if (options.templateId) {
      searchParams.set('template_id', options.templateId);
    }
    if (options.includeCharts) {
      searchParams.set('charts', 'true');
    }
    if (options.locale) {
      searchParams.set('locale', options.locale);
    }
    return api.post(`/export/executions/${id}?${searchParams.toString()}`, {});
  },

  requestBatchExport: async (
    executionIds: string[],
    options: {
      format?: ExecutionExportFormat;
      template?: ExecutionExportTemplate;
      templateId?: string;
      merge?: boolean;
      includeCharts?: boolean;
    } = {}
  ): Promise<ExecutionBatchExportResult> => {
    return api.post('/export/batch', {
      execution_ids: executionIds,
      format: options.format ?? 'html',
      template: options.template ?? 'summary',
      template_id: options.templateId,
      merge: options.merge ?? false,
      include_charts: options.includeCharts ?? false,
    });
  },
};

export default executionService;
