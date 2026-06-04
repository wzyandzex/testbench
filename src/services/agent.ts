import api from './api';
import type { PaginatedResponse } from '@/types/api/common';
import type {
  Agent,
  AgentExecutionResult,
  AgentHealthStatus,
  AgentListParams,
  AgentStats,
  CreateAgentDto,
  ExecuteAgentDto,
  UpdateAgentDto,
} from '@/types/api/agent';

interface AgentActionResponse {
  message: string;
  agentId: string;
}

function appendArray(searchParams: URLSearchParams, key: string, values?: string[]) {
  for (const value of values ?? []) {
    const normalized = value.trim();
    if (normalized) {
      searchParams.append(key, normalized);
    }
  }
}

function appendValue(searchParams: URLSearchParams, key: string, value?: string | number) {
  if (value === undefined || value === null) {
    return;
  }

  const normalized = typeof value === 'number' ? String(value) : value.trim();
  if (normalized) {
    searchParams.append(key, normalized);
  }
}

function buildAgentListQuery(params: AgentListParams = {}) {
  const searchParams = new URLSearchParams();

  appendValue(searchParams, 'page', params.page);
  appendValue(searchParams, 'page_size', params.page_size);
  appendValue(searchParams, 'name_like', params.name_like);
  appendArray(searchParams, 'types', params.types);
  appendArray(searchParams, 'status', params.status);
  appendValue(searchParams, 'has_capability', params.has_capability);
  appendValue(searchParams, 'order_by', params.order_by);
  appendValue(searchParams, 'order_dir', params.order_dir);

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export const agentService = {
  list: async (params: AgentListParams = {}): Promise<PaginatedResponse<Agent>> => {
    return api.get(`/agents${buildAgentListQuery(params)}`);
  },

  get: async (id: string): Promise<Agent> => {
    return api.get(`/agents/${id}`);
  },

  create: async (data: CreateAgentDto): Promise<Agent> => {
    return api.post('/agents', data);
  },

  update: async (id: string, data: UpdateAgentDto): Promise<Agent> => {
    return api.put(`/agents/${id}`, data);
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/agents/${id}`);
  },

  getStats: async (id: string): Promise<AgentStats> => {
    return api.get(`/agents/${id}/stats`);
  },

  getHealth: async (id: string): Promise<AgentHealthStatus> => {
    return api.get(`/agents/${id}/health`);
  },

  syncToRegistry: async (id: string): Promise<AgentActionResponse> => {
    return api.post(`/agents/${id}/sync`);
  },

  /** Restore the system default agent for current org (idempotent: skips if one exists). */
  restoreDefault: async (): Promise<AgentActionResponse> => {
    return api.post('/agents/default/restore');
  },

  execute: async (id: string, data: ExecuteAgentDto): Promise<AgentExecutionResult> => {
    return api.post(`/agents/${id}/execute`, data);
  },
};
