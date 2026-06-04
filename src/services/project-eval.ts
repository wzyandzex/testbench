/**
 * Project Eval API 鏈嶅姟
 * Slice: S15, S16, S17
 */

import api, { type ApiRequestConfig } from './api';
import type {
  ProjectEvalSource,
  ProjectEvalSourceUpload,
  ProjectEvalSourceListParams,
  ProjectEvalSourceListResponse,
  ProjectEvalRun,
  ProjectEvalCapabilities,
  ProjectEvalDefaults,
  ProjectEvalRunListParams,
  ProjectEvalRunListResponse,
  ProjectEvalRunSavedView,
  ProjectEvalRunSavedViewListParams,
  ProjectEvalRunSavedViewListResponse,
  CreateSourceRequest,
  CreateRunRequest,
  RunDetailView,
  RunPlanView,
  RegeneratePlanRequest,
  ApplyOverridesRequest,
  CaseSelectionResponse,
  RunEvidenceResponse,
  RunMainlineView,
  ExecuteMainlineActionRequest,
  ExecuteReportActionRequest,
  MainlineActionResult,
  ReportActionResult,
  RunStageProgressView,
  RunStageRetryView,
  RunReportExportParams,
  RunReportExportView,
  RunReportView,
  RunExplainView,
  RunInsightsSummary,
  RunInsightsTrends,
  ProjectEvalPolicy,
  ProjectEvalSupportAcceptanceDashboard,
  ProjectEvalSupportAcceptanceDashboardParams,
  ProjectEvalSupportAcceptanceHistoryParams,
  ProjectEvalSupportAcceptanceHistoryResponse,
  ProjectEvalSupportAcceptanceReviewQueueParams,
  ProjectEvalSupportAcceptanceReviewQueueResponse,
  ProjectEvalSupportAcceptanceLaneReview,
  ProjectEvalSupportAcceptanceLaneReviewAuditListParams,
  ProjectEvalSupportAcceptanceLaneReviewAuditListResponse,
  ProjectEvalSupportAcceptanceLaneReviewListParams,
  ProjectEvalSupportAcceptanceLaneReviewListResponse,
  ProjectEvalSupportAcceptanceSampleSchedule,
  ProjectEvalSupportAcceptanceSampleScheduleParams,
  ProjectEvalSupportAcceptanceWorkspaceView,
  ProjectEvalSupportAcceptanceWorkspaceViewListParams,
  ProjectEvalSupportAcceptanceWorkspaceViewListResponse,
  ProjectEvalSupportAcceptanceRefreshPolicy,
  ProjectEvalSupportAcceptanceRefreshPolicyListResponse,
  ProjectEvalSupportAcceptanceRefreshPolicyParams,
  ProjectEvalSupportAcceptanceRefreshPolicyTrigger,
  RunDueSupportAcceptanceRefreshPoliciesRequest,
  RunDueSupportAcceptanceRefreshPoliciesResponse,
  ScheduleSupportAcceptanceSamplesRequest,
  UpsertProjectEvalRunSavedViewRequest,
  UpsertProjectEvalSupportAcceptanceWorkspaceViewRequest,
  UpsertSupportAcceptanceLaneReviewRequest,
  UpsertSupportAcceptanceRefreshPolicyRequest,
  UpsertPolicyRequest,
  PolicyPreview,
} from '@/types/api/project-eval';

type ReadRequestOptions = {
  silentError?: boolean;
};

type RunReportRequestOptions = ReadRequestOptions & {
  variant?: string;
};

type UploadProgressCallback = (progress: number) => void;

export const projectEvalService = {
  // S15: Create
  getCapabilities: () => {
    return api.get<ProjectEvalCapabilities>('/project-evals/capabilities');
  },

  createSourceUpload: (file: File, onProgress?: UploadProgressCallback) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post<ProjectEvalSourceUpload>('/project-evals/source-uploads', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (!onProgress || !progressEvent.total) {
          return;
        }
        onProgress(Math.min(100, Math.round((progressEvent.loaded / progressEvent.total) * 100)));
      },
    } as ApiRequestConfig<FormData>);
  },

  getSourceUpload: (id: string, options?: ReadRequestOptions) => {
    return api.get<ProjectEvalSourceUpload>(`/project-evals/source-uploads/${id}`, {
      silentError: options?.silentError,
    } as ApiRequestConfig);
  },

  createSource: (data: CreateSourceRequest) => {
    return api.post<ProjectEvalSource>('/project-evals/sources', data);
  },

  getSource: (id: string, options?: ReadRequestOptions) => {
    return api.get<ProjectEvalSource>(`/project-evals/sources/${id}`, {
      silentError: options?.silentError,
    } as ApiRequestConfig);
  },

  getEvaluationDefaults: (sourceId: string, options?: ReadRequestOptions) => {
    return api.get<ProjectEvalDefaults>(`/project-evals/sources/${sourceId}/evaluation-defaults`, {
      silentError: options?.silentError,
    } as ApiRequestConfig);
  },

  listSources: (params?: ProjectEvalSourceListParams, options?: ReadRequestOptions) => {
    return api.get<ProjectEvalSourceListResponse>('/project-evals/sources', {
      params,
      silentError: options?.silentError,
    } as ApiRequestConfig);
  },

  createRun: (data: CreateRunRequest) => {
    return api.post<ProjectEvalRun>('/project-evals/runs', data);
  },

  listRuns: (params?: ProjectEvalRunListParams, options?: ReadRequestOptions) => {
    return api.get<ProjectEvalRunListResponse>('/project-evals/runs', {
      params,
      silentError: options?.silentError,
    } as ApiRequestConfig);
  },

  listRunSavedViews: (params?: ProjectEvalRunSavedViewListParams, options?: ReadRequestOptions) => {
    return api.get<ProjectEvalRunSavedViewListResponse>('/project-evals/run-saved-views', {
      params,
      silentError: options?.silentError,
    } as ApiRequestConfig);
  },

  createRunSavedView: (
    data: UpsertProjectEvalRunSavedViewRequest,
    options?: ReadRequestOptions
  ) => {
    return api.post<ProjectEvalRunSavedView>('/project-evals/run-saved-views', data, {
      silentError: options?.silentError,
    } as ApiRequestConfig<UpsertProjectEvalRunSavedViewRequest>);
  },

  updateRunSavedView: (
    id: string,
    data: UpsertProjectEvalRunSavedViewRequest,
    options?: ReadRequestOptions
  ) => {
    return api.put<ProjectEvalRunSavedView>(`/project-evals/run-saved-views/${id}`, data, {
      silentError: options?.silentError,
    } as ApiRequestConfig<UpsertProjectEvalRunSavedViewRequest>);
  },

  deleteRunSavedView: (id: string, options?: ReadRequestOptions) => {
    return api.delete<{ deleted: boolean }>(`/project-evals/run-saved-views/${id}`, {
      silentError: options?.silentError,
    } as ApiRequestConfig);
  },

  // S16: Run Detail + Plan + Evidence + Mainline
  getRun: (id: string) => {
    return api.get<RunDetailView>(`/project-evals/runs/${id}`);
  },

  getRunPlan: (id: string) => {
    return api.get<RunPlanView>(`/project-evals/runs/${id}/plan`);
  },

  regeneratePlan: (id: string, data?: RegeneratePlanRequest) => {
    return api.post<ProjectEvalRun>(`/project-evals/runs/${id}/plan/regenerate`, data || {});
  },

  applyOverrides: (id: string, data: ApplyOverridesRequest) => {
    return api.post<ProjectEvalRun>(`/project-evals/runs/${id}/plan/overrides`, data);
  },

  confirmRun: (id: string) => {
    return api.post<ProjectEvalRun>(`/project-evals/runs/${id}/confirm`);
  },

  listCaseSelections: (
    id: string,
    params?: {
      page?: number;
      page_size?: number;
      status?: string;
      reason?: string;
      benchmark_id?: string;
      plan_version?: number;
    },
    options?: ReadRequestOptions
  ) => {
    return api.get<CaseSelectionResponse>(`/project-evals/runs/${id}/case-selection`, {
      params,
      silentError: options?.silentError,
    } as ApiRequestConfig);
  },

  listEvidence: (
    id: string,
    params?: {
      page?: number;
      page_size?: number;
      decision?: string;
      plan_version?: number;
      benchmark_id?: string;
      case_key?: string;
    },
    options?: ReadRequestOptions
  ) => {
    return api.get<RunEvidenceResponse>(`/project-evals/runs/${id}/evidence`, {
      params,
      silentError: options?.silentError,
    } as ApiRequestConfig);
  },

  getMainline: (id: string) => {
    return api.get<RunMainlineView>(`/project-evals/runs/${id}/mainline`);
  },

  executeMainlineAction: (id: string, action: string, data?: ExecuteMainlineActionRequest) => {
    return api.post<MainlineActionResult>(
      `/project-evals/runs/${id}/mainline/actions/${action}`,
      data || {}
    );
  },

  listRunStages: (id: string, params?: { plan_version?: number }, options?: ReadRequestOptions) => {
    return api.get<RunStageProgressView>(`/project-evals/runs/${id}/stages`, {
      params,
      silentError: options?.silentError,
    } as ApiRequestConfig);
  },

  retryRunStage: (id: string, stageRecordId: string) => {
    return api.post<RunStageRetryView>(
      `/project-evals/runs/${id}/stages/${stageRecordId}/retry`,
      {}
    );
  },

  // S17: Report + Insights + Policy
  getRunReport: (id: string, options?: RunReportRequestOptions) => {
    return api.get<RunReportView>(`/project-evals/runs/${id}/report`, {
      params: options?.variant ? { variant: options.variant } : undefined,
      silentError: options?.silentError,
    } as ApiRequestConfig);
  },

  executeRunReportAction: (
    id: string,
    action: string,
    data?: ExecuteReportActionRequest,
    options?: ReadRequestOptions
  ) => {
    return api.post<ReportActionResult>(
      `/project-evals/runs/${id}/report/actions/${action}`,
      data || {},
      {
        silentError: options?.silentError,
      } as ApiRequestConfig<ExecuteReportActionRequest>
    );
  },

  exportRunReport: (id: string, params?: RunReportExportParams, options?: ReadRequestOptions) => {
    return api.get<RunReportExportView>(`/project-evals/runs/${id}/report/export`, {
      params,
      silentError: options?.silentError,
    } as ApiRequestConfig);
  },

  getRunExplain: (id: string) => {
    return api.get<RunExplainView>(`/project-evals/runs/${id}/explain`);
  },

  getInsightsSummary: (params?: {
    days?: number;
    project_type?: string;
    scope?: string;
    mode?: string;
    source_id?: string;
    created_by?: string;
  }) => {
    return api.get<RunInsightsSummary>('/project-evals/insights/summary', { params });
  },

  getInsightsTrends: (params?: {
    days?: number;
    project_type?: string;
    scope?: string;
    mode?: string;
    source_id?: string;
    created_by?: string;
  }) => {
    return api.get<RunInsightsTrends>('/project-evals/insights/trends', { params });
  },

  listSupportAcceptanceHistory: (
    params?: ProjectEvalSupportAcceptanceHistoryParams,
    options?: ReadRequestOptions
  ) => {
    return api.get<ProjectEvalSupportAcceptanceHistoryResponse>(
      '/project-evals/support-acceptance/history',
      {
        params,
        silentError: options?.silentError,
      } as ApiRequestConfig
    );
  },

  getSupportAcceptanceDashboard: (
    params?: ProjectEvalSupportAcceptanceDashboardParams,
    options?: ReadRequestOptions
  ) => {
    return api.get<ProjectEvalSupportAcceptanceDashboard>(
      '/project-evals/support-acceptance/dashboard',
      {
        params,
        silentError: options?.silentError,
      } as ApiRequestConfig
    );
  },

  listSupportAcceptanceReviewQueue: (
    params?: ProjectEvalSupportAcceptanceReviewQueueParams,
    options?: ReadRequestOptions
  ) => {
    return api.get<ProjectEvalSupportAcceptanceReviewQueueResponse>(
      '/project-evals/support-acceptance/review-queue',
      {
        params,
        silentError: options?.silentError,
      } as ApiRequestConfig
    );
  },

  listSupportAcceptanceLaneReviews: (
    params?: ProjectEvalSupportAcceptanceLaneReviewListParams,
    options?: ReadRequestOptions
  ) => {
    return api.get<ProjectEvalSupportAcceptanceLaneReviewListResponse>(
      '/project-evals/support-acceptance/lane-reviews',
      {
        params,
        silentError: options?.silentError,
      } as ApiRequestConfig
    );
  },

  createOrUpdateSupportAcceptanceLaneReview: (
    data: UpsertSupportAcceptanceLaneReviewRequest,
    options?: ReadRequestOptions
  ) => {
    return api.post<ProjectEvalSupportAcceptanceLaneReview>(
      '/project-evals/support-acceptance/lane-reviews',
      data,
      {
        silentError: options?.silentError,
      } as ApiRequestConfig<UpsertSupportAcceptanceLaneReviewRequest>
    );
  },

  listSupportAcceptanceLaneReviewAudits: (
    params?: ProjectEvalSupportAcceptanceLaneReviewAuditListParams,
    options?: ReadRequestOptions
  ) => {
    return api.get<ProjectEvalSupportAcceptanceLaneReviewAuditListResponse>(
      '/project-evals/support-acceptance/lane-review-audits',
      {
        params,
        silentError: options?.silentError,
      } as ApiRequestConfig
    );
  },

  getSupportAcceptanceSampleSchedule: (
    params?: ProjectEvalSupportAcceptanceSampleScheduleParams,
    options?: ReadRequestOptions
  ) => {
    return api.get<ProjectEvalSupportAcceptanceSampleSchedule>(
      '/project-evals/support-acceptance/sample-schedule',
      {
        params,
        silentError: options?.silentError,
      } as ApiRequestConfig
    );
  },

  listSupportAcceptanceWorkspaceViews: (
    params?: ProjectEvalSupportAcceptanceWorkspaceViewListParams,
    options?: ReadRequestOptions
  ) => {
    return api.get<ProjectEvalSupportAcceptanceWorkspaceViewListResponse>(
      '/project-evals/support-acceptance/workspace-views',
      {
        params,
        silentError: options?.silentError,
      } as ApiRequestConfig
    );
  },

  createSupportAcceptanceWorkspaceView: (
    data: UpsertProjectEvalSupportAcceptanceWorkspaceViewRequest,
    options?: ReadRequestOptions
  ) => {
    return api.post<ProjectEvalSupportAcceptanceWorkspaceView>(
      '/project-evals/support-acceptance/workspace-views',
      data,
      {
        silentError: options?.silentError,
      } as ApiRequestConfig<UpsertProjectEvalSupportAcceptanceWorkspaceViewRequest>
    );
  },

  updateSupportAcceptanceWorkspaceView: (
    id: string,
    data: UpsertProjectEvalSupportAcceptanceWorkspaceViewRequest,
    options?: ReadRequestOptions
  ) => {
    return api.put<ProjectEvalSupportAcceptanceWorkspaceView>(
      `/project-evals/support-acceptance/workspace-views/${id}`,
      data,
      {
        silentError: options?.silentError,
      } as ApiRequestConfig<UpsertProjectEvalSupportAcceptanceWorkspaceViewRequest>
    );
  },

  deleteSupportAcceptanceWorkspaceView: (id: string, options?: ReadRequestOptions) => {
    return api.delete<{ deleted: boolean }>(
      `/project-evals/support-acceptance/workspace-views/${id}`,
      {
        silentError: options?.silentError,
      } as ApiRequestConfig
    );
  },

  scheduleSupportAcceptanceSamples: (data?: ScheduleSupportAcceptanceSamplesRequest) => {
    return api.post<ProjectEvalSupportAcceptanceSampleSchedule>(
      '/project-evals/support-acceptance/sample-schedule',
      data || {}
    );
  },

  listSupportAcceptanceRefreshPolicies: (
    params?: ProjectEvalSupportAcceptanceRefreshPolicyParams,
    options?: ReadRequestOptions
  ) => {
    return api.get<ProjectEvalSupportAcceptanceRefreshPolicyListResponse>(
      '/project-evals/support-acceptance/refresh-policies',
      {
        params,
        silentError: options?.silentError,
      } as ApiRequestConfig
    );
  },

  createSupportAcceptanceRefreshPolicy: (data: UpsertSupportAcceptanceRefreshPolicyRequest) => {
    return api.post<ProjectEvalSupportAcceptanceRefreshPolicy>(
      '/project-evals/support-acceptance/refresh-policies',
      data
    );
  },

  updateSupportAcceptanceRefreshPolicy: (
    id: string,
    data: UpsertSupportAcceptanceRefreshPolicyRequest
  ) => {
    return api.put<ProjectEvalSupportAcceptanceRefreshPolicy>(
      `/project-evals/support-acceptance/refresh-policies/${id}`,
      data
    );
  },

  triggerSupportAcceptanceRefreshPolicy: (id: string) => {
    return api.post<ProjectEvalSupportAcceptanceRefreshPolicyTrigger>(
      `/project-evals/support-acceptance/refresh-policies/${id}/trigger`,
      {}
    );
  },

  runDueSupportAcceptanceRefreshPolicies: (
    data?: RunDueSupportAcceptanceRefreshPoliciesRequest
  ) => {
    return api.post<RunDueSupportAcceptanceRefreshPoliciesResponse>(
      '/project-evals/support-acceptance/refresh-policies/run-due',
      data || {}
    );
  },

  getEffectivePolicy: () => {
    return api.get<ProjectEvalPolicy>('/project-evals/policies/effective');
  },

  previewPolicy: (data: UpsertPolicyRequest) => {
    return api.post<PolicyPreview>('/project-evals/policies/organization/preview', data);
  },

  upsertPolicy: (data: UpsertPolicyRequest) => {
    return api.put<ProjectEvalPolicy>('/project-evals/policies/organization', data);
  },
};
