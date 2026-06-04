// Target System Acceptance admin API client
// 后端路由前缀: /api/v1/admin/target-system/acceptance/*
import api from '@/services/api';

export interface RunSummaryView {
  id: string;
  target_surface: string;
  contract_kind: string;
  scope_kind: string;
  environment_label: string;
  source_kind: string;
  source_ref?: string;
  external_run_id: string;
  git_revision?: string;
  status: string;
  classification: string;
  accepted_state: string;
  verdict_passed?: boolean;
  generated_at: string;
  recorded_at: string;
  accepted_at?: string;
  accepted_by?: string;
}

export interface RunDetailView extends RunSummaryView {
  assumptions?: Record<string, unknown>;
  normalized_facts?: Record<string, unknown>;
  artifact_manifest?: Record<string, unknown>;
  raw_payload?: Record<string, unknown>;
  narrative_summary?: string;
  created_at: string;
  updated_at: string;
}

export interface BaselineSummaryView {
  target_surface: string;
  contract_kind: string;
  scope_kind: string;
  environment_label: string;
  acceptance_run_id: string;
  promoted_by?: string;
  promoted_at: string;
  accepted_run?: RunSummaryView;
}

export interface Comparison {
  baseline_run_id?: string;
  current_run_id: string;
  diff_summary?: string;
  fields_changed?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface RunListResponse {
  total: number;
  page: number;
  size: number;
  data: RunSummaryView[];
}

export interface BaselineListResponse {
  total: number;
  page: number;
  size: number;
  data: BaselineSummaryView[];
}

export interface ListRunsParams {
  page?: number;
  page_size?: number;
  target_surface?: string;
  contract_kind?: string;
  scope_kind?: string;
  environment_label?: string;
  accepted_state?: string;
}

export interface ListBaselinesParams {
  page?: number;
  page_size?: number;
  target_surface?: string;
  contract_kind?: string;
  scope_kind?: string;
  environment_label?: string;
}

function toQuery(params: Record<string, unknown> | object): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params as Record<string, unknown>)) {
    if (v == null || v === '') continue;
    usp.append(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export const targetAcceptanceService = {
  listRuns: async (params: ListRunsParams = {}): Promise<RunListResponse> => {
    return api.get(`/admin/target-system/acceptance/runs${toQuery(params)}`);
  },

  getRun: async (id: string): Promise<RunDetailView> => {
    return api.get(`/admin/target-system/acceptance/runs/${id}`);
  },

  compareRun: async (id: string): Promise<Comparison> => {
    return api.get(`/admin/target-system/acceptance/runs/${id}/comparison`);
  },

  listBaselines: async (params: ListBaselinesParams = {}): Promise<BaselineListResponse> => {
    return api.get(`/admin/target-system/acceptance/baselines${toQuery(params)}`);
  },
};
