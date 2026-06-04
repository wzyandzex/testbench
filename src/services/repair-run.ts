/**
 * Repair Run API 服务
 * Slice: S18
 */

import api from './api';
import type {
  RepairRunListResponse,
  RepairRunView,
  CreateRepairRunRequest,
  CancelRepairRunRequest,
} from '@/types/api/repair-run';

export interface RepairRunListParams {
  page?: number;
  page_size?: number;
  state?: string;
  user_id?: string;
  agent_id?: string;
  project_eval_run_id?: string;
  replay_project_eval_run_id?: string;
}

export const repairRunService = {
  listRuns: (params?: RepairRunListParams) => {
    return api.get<RepairRunListResponse>('/repair-runs', { params });
  },

  getRun: (id: string) => {
    return api.get<RepairRunView>(`/repair-runs/${id}`);
  },

  createRun: (data: CreateRepairRunRequest) => {
    return api.post<RepairRunView>('/repair-runs', data);
  },

  startPlanning: (id: string) => {
    return api.post<RepairRunView>(`/repair-runs/${id}/plan`);
  },

  approvePlan: (id: string) => {
    return api.post<RepairRunView>(`/repair-runs/${id}/approve`);
  },

  startApply: (id: string) => {
    return api.post<RepairRunView>(`/repair-runs/${id}/apply`);
  },

  requestReplay: (id: string) => {
    return api.post<RepairRunView>(`/repair-runs/${id}/replay`);
  },

  cancelRun: (id: string, data?: CancelRepairRunRequest) => {
    return api.post<RepairRunView>(`/repair-runs/${id}/cancel`, data || {});
  },
};
