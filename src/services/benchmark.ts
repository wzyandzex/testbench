/**
 * Benchmark API 服务
 * 参考: front/03-api/benchmark-api.md
 *
 * 注意：API 响应拦截器会自动返回 response.data，所以我们需要添加类型断言
 */

import api, { type ApiRequestConfig } from './api';
import { request } from './request';
import type {
  PaginatedResponse,
  Benchmark,
  BenchmarkDetail,
  BenchmarkFilter,
  CreateBenchmarkRequest,
  UpdateBenchmarkRequest,
  BenchmarkStats,
  CreateTagRequest,
  Tag,
  ExecutionSummary,
  BenchmarkCreateTemplateCard,
  BenchmarkCreateSupportSourcesParams,
  BenchmarkCreateSupportSourcesResponse,
  BenchmarkCreateSupportResolveDraftResponse,
  ResolveBenchmarkCreateSupportDraftRequest,
} from '@/types';
import type { ExecutionFilter } from '@/types/api/execution';
import type {
  BenchmarkForkItem,
  UpdateBenchmarkStatusRequest,
  PaginationParams,
  CreateBenchmarkRunRequest,
  BenchmarkRunLaunch,
  BenchmarkCaseAsset,
  CaseGovernanceDetail,
  BenchmarkCaseLifecycleAuditLog,
  BenchmarkCaseDetectionReport,
  BenchmarkCaseDetectionDiff,
  BenchmarkCaseValidationJob,
  TriggerValidationResponse,
  CaseValidationPreview,
  CaseValidationCapabilitiesView,
  BenchmarkCaseValidationSummary,
  BenchmarkCaseValidationCaseReport,
  BenchmarkCaseExecutionEvidence,
  BenchmarkCaseReviewJob,
  TriggerReviewResponse,
  BenchmarkCaseReviewReport,
  BenchmarkCaseReviewCaseReport,
  BenchmarkCaseFusionReport,
  BenchmarkCaseFusionCaseReport,
  ResolvedCaseGovernanceTrustPolicy,
  OrganizationGovernanceTrustPolicy,
  TrustPolicyValidationResult,
  TrustPolicyAuditLog,
  ResolvedCaseGovernanceDecisionPolicy,
  OrganizationGovernanceDecisionPolicy,
  DecisionPolicyValidationResult,
  DecisionPolicyAuditLog,
  CaseGovernanceSummary,
  CaseGovernanceBenchmarkHotspotView,
  CaseGovernanceListItem,
  CaseGovernanceActionPreview,
  CaseGovernanceActionPreviewRequest,
  GovernanceBenchmarkFilter,
  GovernanceCaseFilter,
  BenchmarkLLMQualityJob,
  TriggerLLMQualityCheckResponse,
  LLMQualityJobSummary,
  LLMQualityCapabilities,
  TriggerLLMQualityCheckRequest,
  BenchmarkLLMQualityReport,
  BenchmarkLLMQualityCaseReport,
  BenchmarkLLMQualityAggregate,
  LLMQualityDiffLatest,
  OrganizationQualityPolicy,
  ResolvedQualityPolicy,
  QualityPolicyAuditLog,
  UpsertLLMQualityPolicyRequest,
  LeaderboardQueryParams,
  LeaderboardResponse,
} from '@/types/api/benchmark';

type ReadRequestOptions = {
  silentError?: boolean;
};

export const benchmarkService = {
  /**
   * 获取列表
   * GET /api/v1/benchmarks
   */
  list: (params: BenchmarkFilter) => {
    return api.get<PaginatedResponse<Benchmark>>('/benchmarks', { params });
  },

  /**
   * 获取详情
   * GET /api/v1/benchmarks/:id
   */
  get: (id: string) => {
    return api.get<BenchmarkDetail>(`/benchmarks/${id}`);
  },

  /**
   * 创建
   * POST /api/v1/benchmarks
   */
  create: (data: CreateBenchmarkRequest) => {
    return api.post<BenchmarkDetail>('/benchmarks', data);
  },

  /**
   * 更新
   * PUT /api/v1/benchmarks/:id
   */
  update: (id: string, data: UpdateBenchmarkRequest) => {
    return api.put<BenchmarkDetail>(`/benchmarks/${id}`, data);
  },

  listCreateSupportTemplates: (options?: ReadRequestOptions) => {
    return api.get<BenchmarkCreateTemplateCard[]>('/benchmarks/create-support/templates', {
      silentError: options?.silentError,
    } as ApiRequestConfig);
  },

  listCreateSupportSources: (params?: BenchmarkCreateSupportSourcesParams, options?: ReadRequestOptions) => {
    return api.get<BenchmarkCreateSupportSourcesResponse>('/benchmarks/create-support/sources', {
      params,
      silentError: options?.silentError,
    } as ApiRequestConfig);
  },

  resolveCreateSupportDraft: (data: ResolveBenchmarkCreateSupportDraftRequest, options?: ReadRequestOptions) => {
    return api.post<BenchmarkCreateSupportResolveDraftResponse>('/benchmarks/create-support/resolve-draft', data, {
      silentError: options?.silentError,
    } as ApiRequestConfig);
  },

  /**
   * 删除
   * DELETE /api/v1/benchmarks/:id
   */
  delete: (id: string) => {
    return api.delete(`/benchmarks/${id}`);
  },

  /**
   * 获取统计
   * GET /api/v1/benchmarks/:id/stats
   */
  getStats: (id: string) => {
    return api.get<BenchmarkStats>(`/benchmarks/${id}/stats`);
  },

  /**
   * 获取执行记录
   * GET /api/v1/benchmarks/:id/executions
   */
  getExecutions: (id: string, params: ExecutionFilter) => {
    return api.get<PaginatedResponse<ExecutionSummary>>(
      `/benchmarks/${id}/executions`,
      { params }
    );
  },

  getLeaderboard: (id: string, params?: LeaderboardQueryParams) => {
    return api.get(
      `/benchmarks/${id}/leaderboard`,
      { params }
    ) as Promise<LeaderboardResponse>;
  },

  /**
   * 获取标签列表
   * GET /api/v1/benchmarks/tags
   */
  getTags: () => {
    return api.get<Tag[]>('/benchmarks/tags');
  },

  /**
   * 创建标签
   * POST /api/v1/benchmarks/tags
   */
  createTag: (data: CreateTagRequest) => {
    return api.post<Tag>('/benchmarks/tags', data);
  },

  /**
   * 删除标签
   * DELETE /api/v1/benchmarks/tags/:id
   */
  deleteTag: (id: number) => {
    return api.delete(`/benchmarks/tags/${id}`);
  },

  /**
   * 提交单次 benchmark run
   * POST /api/v1/benchmarks/:id/runs
   */
  run: (id: string, data: CreateBenchmarkRunRequest) => {
    return request.post<BenchmarkRunLaunch>(`/benchmarks/${id}/runs`, data);
  },

  /**
   * 导入 (保留兼容)
   */
  import: (file: File, onProgress?: (progress: number) => void) => {
    return request.upload('/benchmarks/import', file, onProgress);
  },

  /**
   * 导出 (保留兼容)
   */
  export: (ids: string[]) => {
    return request.post('/benchmarks/export', { ids });
  },

  // ==================== Fork 相关 ====================

  /**
   * Fork 题目
   * POST /api/v1/benchmarks/:id/fork
   */
  fork: (id: string) => {
    return api.post<BenchmarkDetail>(`/benchmarks/${id}/fork`);
  },

  /**
   * 获取指定题目的 Fork 列表
   * GET /api/v1/benchmarks/:id/forks
   */
  getForks: (id: string, params?: PaginationParams) => {
    return api.get<PaginatedResponse<BenchmarkForkItem>>(
      `/benchmarks/${id}/forks`,
      { params }
    );
  },

  /**
   * 获取当前用户的所有 Fork（含更新通知）
   * GET /api/v1/benchmarks/my-forks
   */
  getMyForks: (params?: PaginationParams) => {
    return api.get<PaginatedResponse<BenchmarkForkItem>>(
      '/benchmarks/my-forks',
      { params }
    );
  },

  // ==================== 审批相关 ====================

  /**
   * 更新审批状态
   * PATCH /api/v1/benchmarks/:id/status
   */
  updateStatus: (id: string, data: UpdateBenchmarkStatusRequest) => {
    return api.patch<{ message: string }>(
      `/benchmarks/${id}/status`,
      data
    );
  },

  /**
   * 获取待审批列表
   * GET /api/v1/benchmarks/pending
   */
  getPendingApprovals: (params?: PaginationParams) => {
    return api.get<PaginatedResponse<Benchmark>>(
      '/benchmarks/pending',
      { params }
    );
  },

  // ==================== Case Asset 相关 ====================

  /**
   * 获取 Benchmark 下的用例资产列表
   * GET /api/v1/benchmarks/:id/cases
   */
  getCases: (benchmarkId: string, params?: PaginationParams) => {
    return api.get<PaginatedResponse<BenchmarkCaseAsset>>(
      `/benchmarks/${benchmarkId}/cases`,
      { params }
    );
  },

  /**
   * 获取用例治理详情
   * GET /api/v1/benchmarks/:id/cases/:caseKey/governance
   */
  getCaseGovernanceDetail: (benchmarkId: string, caseKey: string) => {
    return api.get<CaseGovernanceDetail>(
      `/benchmarks/${benchmarkId}/cases/${encodeURIComponent(caseKey)}/governance`
    );
  },

  /**
   * 获取用例生命周期审计（分页）
   * GET /api/v1/benchmarks/:id/cases/:caseKey/lifecycle-audits
   */
  getCaseLifecycleAudits: (benchmarkId: string, caseKey: string, params?: PaginationParams) => {
    return api.get<PaginatedResponse<BenchmarkCaseLifecycleAuditLog>>(
      `/benchmarks/${benchmarkId}/cases/${encodeURIComponent(caseKey)}/lifecycle-audits`,
      { params }
    );
  },

  // ==================== Case Detection 相关 ====================

  /**
   * 获取用例检测历史（分页）
   * GET /api/v1/benchmarks/:id/cases/:caseKey/detections
   */
  getCaseDetectionHistory: (benchmarkId: string, caseKey: string, params?: PaginationParams) => {
    return api.get<PaginatedResponse<BenchmarkCaseDetectionReport>>(
      `/benchmarks/${benchmarkId}/cases/${encodeURIComponent(caseKey)}/detections`,
      { params }
    );
  },

  /**
   * 获取最新检测 diff
   * GET /api/v1/benchmarks/:id/cases/detections/diff/latest
   */
  getLatestDetectionDiff: (benchmarkId: string, params?: { stage?: string }) => {
    return api.get<BenchmarkCaseDetectionDiff>(
      `/benchmarks/${benchmarkId}/cases/detections/diff/latest`,
      { params }
    );
  },

  // ==================== Case Validation 相关 ====================

  /**
   * 触发验证 Job
   * POST /api/v1/benchmarks/:id/cases/validate  → 202 Accepted
   */
  triggerCaseValidation: (benchmarkId: string, data?: {
    case_keys?: string[];
    repeat_runs?: number;
    idempotency_key?: string;
    trigger_source?: string;
  }) => {
    return api.post<TriggerValidationResponse>(
      `/benchmarks/${benchmarkId}/cases/validate`,
      data
    );
  },

  /**
   * 获取验证 Job 列表（分页）
   * GET /api/v1/benchmarks/:id/cases/validation-jobs
   */
  listValidationJobs: (benchmarkId: string, params?: PaginationParams & { status?: string }) => {
    return api.get<PaginatedResponse<BenchmarkCaseValidationJob>>(
      `/benchmarks/${benchmarkId}/cases/validation-jobs`,
      { params }
    );
  },

  /**
   * 获取验证能力清单
   * GET /api/v1/benchmarks/:id/cases/validation/capabilities
   */
  getValidationCapabilities: (benchmarkId: string) => {
    return api.get<CaseValidationCapabilitiesView>(
      `/benchmarks/${benchmarkId}/cases/validation/capabilities`
    );
  },

  /**
   * 预览验证范围
   * POST /api/v1/benchmarks/:id/cases/validation/preview
   */
  previewValidation: (benchmarkId: string, data?: { case_keys?: string[] }) => {
    return api.post<CaseValidationPreview>(
      `/benchmarks/${benchmarkId}/cases/validation/preview`,
      data
    );
  },

  /**
   * 获取最新验证 Summary
   * GET /api/v1/benchmarks/:id/cases/validation/latest
   */
  getLatestValidationSummary: (benchmarkId: string) => {
    return api.get<BenchmarkCaseValidationSummary>(
      `/benchmarks/${benchmarkId}/cases/validation/latest`
    );
  },

  /**
   * 获取 Case 级验证报告（分页）
   * GET /api/v1/benchmarks/:id/cases/validation/cases
   */
  listValidationCaseReports: (benchmarkId: string, params?: PaginationParams & {
    job_id?: string; outcome?: string; flaky?: string; matched?: string;
  }) => {
    return api.get<PaginatedResponse<BenchmarkCaseValidationCaseReport>>(
      `/benchmarks/${benchmarkId}/cases/validation/cases`,
      { params }
    );
  },

  /**
   * 获取单 Case Evidence（分页）
   * GET /api/v1/benchmarks/:id/cases/:caseKey/evidence
   */
  listValidationEvidence: (benchmarkId: string, caseKey: string, params?: PaginationParams & {
    job_id?: string; outcome?: string;
  }) => {
    return api.get<PaginatedResponse<BenchmarkCaseExecutionEvidence>>(
      `/benchmarks/${benchmarkId}/cases/${encodeURIComponent(caseKey)}/evidence`,
      { params }
    );
  },

  /**
   * 获取单 Case 验证历史（分页）
   * GET /api/v1/benchmarks/:id/cases/:caseKey/validation-history
   */
  listValidationHistory: (benchmarkId: string, caseKey: string, params?: PaginationParams) => {
    return api.get<PaginatedResponse<BenchmarkCaseValidationCaseReport>>(
      `/benchmarks/${benchmarkId}/cases/${encodeURIComponent(caseKey)}/validation-history`,
      { params }
    );
  },

  // ==================== Case Review 相关 ====================

  triggerCaseReview: (benchmarkId: string, data?: {
    case_keys?: string[]; model?: string; idempotency_key?: string; trigger_source?: string;
  }) => {
    return api.post<TriggerReviewResponse>(
      `/benchmarks/${benchmarkId}/cases/review`, data
    );
  },

  listReviewJobs: (benchmarkId: string, params?: PaginationParams & { status?: string }) => {
    return api.get<PaginatedResponse<BenchmarkCaseReviewJob>>(
      `/benchmarks/${benchmarkId}/cases/review-jobs`, { params }
    );
  },

  getLatestReviewReport: (benchmarkId: string) => {
    return api.get<BenchmarkCaseReviewReport>(
      `/benchmarks/${benchmarkId}/cases/review/latest`
    );
  },

  listReviewCaseReports: (benchmarkId: string, params?: PaginationParams & {
    report_id?: string; decision?: string; risk_gte?: string;
    low_confidence?: string; drift_status?: string;
  }) => {
    return api.get<PaginatedResponse<BenchmarkCaseReviewCaseReport>>(
      `/benchmarks/${benchmarkId}/cases/review/cases`, { params }
    );
  },

  listReviewHistory: (benchmarkId: string, caseKey: string, params?: PaginationParams) => {
    return api.get<PaginatedResponse<BenchmarkCaseReviewCaseReport>>(
      `/benchmarks/${benchmarkId}/cases/${encodeURIComponent(caseKey)}/review-history`, { params }
    );
  },

  // ==================== Case Fusion 相关 ====================

  getLatestFusionReport: (benchmarkId: string) => {
    return api.get<BenchmarkCaseFusionReport>(
      `/benchmarks/${benchmarkId}/cases/fusion/latest`
    );
  },

  listFusionCaseReports: (benchmarkId: string, params?: PaginationParams & {
    report_id?: string; decision?: string; insufficient_evidence?: string;
  }) => {
    return api.get<PaginatedResponse<BenchmarkCaseFusionCaseReport>>(
      `/benchmarks/${benchmarkId}/cases/fusion/cases`, { params }
    );
  },

  listFusionHistory: (benchmarkId: string, caseKey: string, params?: PaginationParams) => {
    return api.get<PaginatedResponse<BenchmarkCaseFusionCaseReport>>(
      `/benchmarks/${benchmarkId}/cases/${encodeURIComponent(caseKey)}/fusion-history`, { params }
    );
  },

  // ==================== Case Lifecycle 相关 ====================

  retireCase: (benchmarkId: string, caseKey: string, reason: string) => {
    return api.post(
      `/benchmarks/${benchmarkId}/cases/${encodeURIComponent(caseKey)}/retire`,
      { reason }
    );
  },

  restoreCase: (benchmarkId: string, caseKey: string, reason: string) => {
    return api.post(
      `/benchmarks/${benchmarkId}/cases/${encodeURIComponent(caseKey)}/restore`,
      { reason }
    );
  },

  batchRetireCases: (benchmarkId: string, caseKeys: string[], reason: string) => {
    return api.post(
      `/benchmarks/${benchmarkId}/cases/retire`,
      { case_keys: caseKeys, reason }
    );
  },

  batchRestoreCases: (benchmarkId: string, caseKeys: string[], reason: string) => {
    return api.post(
      `/benchmarks/${benchmarkId}/cases/restore`,
      { case_keys: caseKeys, reason }
    );
  },

  reextractCases: (benchmarkId: string, reason?: string) => {
    return api.post(
      `/benchmarks/${benchmarkId}/cases/reextract`,
      reason ? { reason } : undefined
    );
  },

  // ==================== Governance Trust Policy 相关 ====================

  getEffectiveTrustPolicy: () => {
    return api.get<ResolvedCaseGovernanceTrustPolicy>(
      '/benchmarks/governance/policies/effective'
    );
  },

  getOrganizationTrustPolicy: () => {
    return api.get<OrganizationGovernanceTrustPolicy>(
      '/benchmarks/governance/policies/organization'
    );
  },

  validateTrustPolicy: (data: {
    evidence_aging_hours?: number;
    evidence_stale_hours?: number;
    review_low_confidence_threshold?: number;
    auto_review_after_validation?: boolean;
    auto_validation_after_review_low_confidence?: boolean;
    auto_validation_on_quality_recheck?: boolean;
  }) => {
    return api.post<TrustPolicyValidationResult>(
      '/benchmarks/governance/policies/organization/validate',
      data
    );
  },

  upsertTrustPolicy: (data: {
    evidence_aging_hours?: number;
    evidence_stale_hours?: number;
    review_low_confidence_threshold?: number;
    auto_review_after_validation?: boolean;
    auto_validation_after_review_low_confidence?: boolean;
    auto_validation_on_quality_recheck?: boolean;
  }) => {
    return api.put<OrganizationGovernanceTrustPolicy>(
      '/benchmarks/governance/policies/organization',
      data
    );
  },

  listTrustPolicyAudits: (params?: PaginationParams & {
    actor_user_id?: string; action?: string; created_from?: string; created_to?: string; view?: string;
  }) => {
    return api.get<PaginatedResponse<TrustPolicyAuditLog>>(
      '/benchmarks/governance/policies/organization/audits',
      { params }
    );
  },

  // ==================== Governance Decision Policy 相关 ====================

  getEffectiveDecisionPolicy: () => {
    return api.get<ResolvedCaseGovernanceDecisionPolicy>(
      '/benchmarks/governance/policies/decision/effective'
    );
  },

  getOrganizationDecisionPolicy: () => {
    return api.get<OrganizationGovernanceDecisionPolicy>(
      '/benchmarks/governance/policies/decision/organization'
    );
  },

  validateDecisionPolicy: (data: {
    untrusted_reason_priority?: string[];
    watch_reason_priority?: string[];
    attention_reason_priority?: string[];
    primary_action_reason_priority?: string[];
    primary_action_by_reason?: Record<string, string>;
  }) => {
    return api.post<DecisionPolicyValidationResult>(
      '/benchmarks/governance/policies/decision/organization/validate',
      data
    );
  },

  upsertDecisionPolicy: (data: {
    untrusted_reason_priority?: string[];
    watch_reason_priority?: string[];
    attention_reason_priority?: string[];
    primary_action_reason_priority?: string[];
    primary_action_by_reason?: Record<string, string>;
  }) => {
    return api.put<OrganizationGovernanceDecisionPolicy>(
      '/benchmarks/governance/policies/decision/organization',
      data
    );
  },

  listDecisionPolicyAudits: (params?: PaginationParams & {
    actor_user_id?: string; action?: string; created_from?: string; created_to?: string; view?: string;
  }) => {
    return api.get<PaginatedResponse<DecisionPolicyAuditLog>>(
      '/benchmarks/governance/policies/decision/organization/audits',
      { params }
    );
  },

  // ==================== Governance Overview 相关 ====================

  getGovernanceSummary: (params?: GovernanceCaseFilter) => {
    return api.get<CaseGovernanceSummary>(
      '/benchmarks/governance/summary',
      { params }
    );
  },

  listGovernanceBenchmarks: (params?: GovernanceBenchmarkFilter) => {
    return api.get<PaginatedResponse<CaseGovernanceBenchmarkHotspotView>>(
      '/benchmarks/governance/benchmarks',
      { params }
    );
  },

  listGovernanceCases: (params?: GovernanceCaseFilter) => {
    return api.get<PaginatedResponse<CaseGovernanceListItem>>(
      '/benchmarks/governance/cases',
      { params }
    );
  },

  previewGovernanceAction: (data: CaseGovernanceActionPreviewRequest) => {
    return api.post<CaseGovernanceActionPreview>(
      '/benchmarks/governance/actions/preview',
      data
    );
  },

  // ==================== LLM Quality 相关 ====================

  getLLMQualityCapabilities: () => {
    return api.get<LLMQualityCapabilities>('/quality/llm/capabilities');
  },

  triggerLLMQualityCheck: (benchmarkId: string, data: TriggerLLMQualityCheckRequest) => {
    return api.post<TriggerLLMQualityCheckResponse>(
      `/benchmarks/${benchmarkId}/quality/llm-checks`,
      data
    );
  },

  listLLMQualityJobs: (benchmarkId: string, params?: { page?: number; page_size?: number; status?: string }) => {
    return api.get<PaginatedResponse<BenchmarkLLMQualityJob>>(
      `/benchmarks/${benchmarkId}/quality/llm-checks`,
      { params }
    );
  },

  getLLMQualityJobSummary: (benchmarkId: string) => {
    return api.get<LLMQualityJobSummary>(
      `/benchmarks/${benchmarkId}/quality/llm-checks/summary`
    );
  },

  getLLMQualityJob: (benchmarkId: string, jobId: string) => {
    return api.get<BenchmarkLLMQualityJob>(
      `/benchmarks/${benchmarkId}/quality/llm-checks/${jobId}`
    );
  },

  cancelLLMQualityJob: (benchmarkId: string, jobId: string) => {
    return api.post<BenchmarkLLMQualityJob>(
      `/benchmarks/${benchmarkId}/quality/llm-checks/${jobId}/cancel`
    );
  },

  retryLLMQualityJob: (benchmarkId: string, jobId: string) => {
    return api.post<TriggerLLMQualityCheckResponse>(
      `/benchmarks/${benchmarkId}/quality/llm-checks/${jobId}/retry`
    );
  },

  // ==================== LLM Quality Report 相关 ====================

  getLatestLLMQualityReport: (benchmarkId: string) => {
    return api.get<BenchmarkLLMQualityReport>(
      `/benchmarks/${benchmarkId}/quality/llm-reports/latest`
    );
  },

  listLLMQualityReports: (benchmarkId: string, params?: { page?: number; page_size?: number }) => {
    return api.get<PaginatedResponse<BenchmarkLLMQualityReport>>(
      `/benchmarks/${benchmarkId}/quality/llm-reports/history`,
      { params }
    );
  },

  getLatestLLMQualityAggregate: (benchmarkId: string) => {
    return api.get<BenchmarkLLMQualityAggregate>(
      `/benchmarks/${benchmarkId}/quality/aggregate/latest`
    );
  },

  getLatestLLMQualityDiff: (benchmarkId: string) => {
    return api.get<LLMQualityDiffLatest>(
      `/benchmarks/${benchmarkId}/quality/diff/latest`
    );
  },

  listLLMQualityCaseReports: (benchmarkId: string, params?: {
    page?: number; page_size?: number; report_id?: string;
    risk_gte?: string; decision?: string; dimension?: string; changed_only?: boolean;
  }) => {
    return api.get<PaginatedResponse<BenchmarkLLMQualityCaseReport>>(
      `/benchmarks/${benchmarkId}/quality/cases`,
      { params }
    );
  },

  // ==================== Quality Policy 相关 ====================

  getEffectiveQualityPolicy: (params?: { quality_mode?: string; quality_dimensions?: string }) => {
    return api.get<ResolvedQualityPolicy>(
      '/quality/policies/effective',
      { params }
    );
  },

  getOrganizationQualityPolicy: () => {
    return api.get<OrganizationQualityPolicy>(
      '/quality/policies/organization'
    );
  },

  upsertOrganizationQualityPolicy: (data: {
    enable_executability?: boolean;
    enable_stability?: boolean;
    enable_compliance?: boolean;
    block_on_high?: boolean;
  }) => {
    return api.put<OrganizationQualityPolicy>(
      '/quality/policies/organization',
      data
    );
  },

  listQualityPolicyAudits: (params?: PaginationParams & {
    actor_user_id?: string; action?: string; created_from?: string; created_to?: string; view?: string;
  }) => {
    return api.get<PaginatedResponse<QualityPolicyAuditLog>>(
      '/quality/policies/organization/audits',
      { params }
    );
  },

  getOrganizationLLMQualityPolicy: () => {
    return api.get<Record<string, unknown>>(
      '/quality/llm/policies/organization'
    );
  },

  validateLLMQualityPolicy: (data: UpsertLLMQualityPolicyRequest) => {
    return api.post<Record<string, unknown>>(
      '/quality/llm/policies/organization/validate',
      data
    );
  },

  upsertOrganizationLLMQualityPolicy: (data: UpsertLLMQualityPolicyRequest) => {
    return api.put<Record<string, unknown>>(
      '/quality/llm/policies/organization',
      data
    );
  },
};
