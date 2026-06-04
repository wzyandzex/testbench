/**
 * Frontend API SDK template for docs/item.
 * Copy this file into your frontend project and adjust import paths.
 *
 * Depends on:
 * - frontend-api-types.ts
 * - axios instance (or equivalent) with auth/org header interceptors
 *
 * Version: 2026-03-09.v4
 */

import type {
  AgentExecuteRequest,
  AgentItem,
  AnalyzerReportPayload,
  AnalyzerReportSummary,
  ApiEnvelope,
  AuthTokenPair,
  BatchSummary,
  BenchmarkItem,
  CostModelPrice,
  CostSummary,
  ExecutionItem,
  ExecutionTraceStep,
  ExportBatchResult,
  ExportFileInfo,
  HistoryRecord,
  ImportTask,
  ImportTaskPageData,
  LLMQualityJob,
  LLMQualityReport,
  OrganizationMembership,
  PageData,
  ScheduledTask,
  SWETask,
} from "./frontend-api-types";

type QueryValue = string | number | boolean | undefined | null;
type QueryRecord = Record<string, QueryValue | QueryValue[]>;

function toQuery(params: QueryRecord): URLSearchParams {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value)) {
      value.forEach((v) => {
        if (v !== undefined && v !== null) query.append(key, String(v));
      });
      return;
    }
    query.append(key, String(value));
  });
  return query;
}

// Replace with your actual HTTP client.
declare const api: {
  get<T = unknown>(url: string, config?: { params?: URLSearchParams | QueryRecord }): Promise<{ data: ApiEnvelope<T> }>;
  post<T = unknown>(url: string, body?: unknown, config?: { params?: URLSearchParams | QueryRecord }): Promise<{ data: ApiEnvelope<T> }>;
  put<T = unknown>(url: string, body?: unknown, config?: { params?: URLSearchParams | QueryRecord }): Promise<{ data: ApiEnvelope<T> }>;
  patch<T = unknown>(url: string, body?: unknown, config?: { params?: URLSearchParams | QueryRecord }): Promise<{ data: ApiEnvelope<T> }>;
  delete<T = unknown>(url: string, config?: { params?: URLSearchParams | QueryRecord }): Promise<{ data: ApiEnvelope<T> }>;
};

async function unwrap<T>(p: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const res = await p;
  if (res.data.code !== 0) {
    throw new Error(res.data.message || "business error");
  }
  return res.data.data;
}

// Auth
export const AuthAPI = {
  login(payload: { username: string; password: string }) {
    return unwrap<AuthTokenPair>(api.post("/auth/login", payload));
  },
  refresh(refresh_token: string) {
    return unwrap<AuthTokenPair>(api.post("/auth/refresh", { refresh_token }));
  },
  me() {
    return unwrap<Record<string, unknown>>(api.get("/auth/me"));
  },
  logout(payload?: { refresh_token?: string; all_devices?: boolean }) {
    return unwrap<Record<string, unknown>>(api.post("/auth/logout", payload ?? {}));
  },
};

// Organization
export const OrganizationAPI = {
  listOrganizations() {
    return unwrap<OrganizationMembership[]>(api.get("/organizations"));
  },
  switchCurrentOrganization(org_id: string) {
    return unwrap<AuthTokenPair>(api.post("/user/current-organization", { org_id }));
  },
};

// Benchmark
export const BenchmarkAPI = {
  list(params: QueryRecord = {}) {
    return unwrap<PageData<BenchmarkItem>>(api.get("/benchmarks", { params: toQuery(params) }));
  },
  get(id: string) {
    return unwrap<BenchmarkItem>(api.get(`/benchmarks/${id}`));
  },
  create(payload: Record<string, unknown>) {
    return unwrap<BenchmarkItem>(api.post("/benchmarks", payload));
  },
  update(id: string, payload: Record<string, unknown>) {
    return unwrap<BenchmarkItem>(api.put(`/benchmarks/${id}`, payload));
  },
  updateStatus(id: string, payload: { action: "approve" | "reject"; reason?: string }) {
    return unwrap<Record<string, unknown>>(api.patch(`/benchmarks/${id}/status`, payload));
  },
  triggerLLMCheck(id: string, payload: { model?: string; dimensions?: string[]; strict_mode?: boolean; idempotency_key?: string }) {
    return unwrap<{ job_id: string; status: string; created_at: string }>(
      api.post(`/benchmarks/${id}/quality/llm-checks`, payload)
    );
  },
  getLLMCheckJob(id: string, job_id: string) {
    return unwrap<LLMQualityJob>(api.get(`/benchmarks/${id}/quality/llm-checks/${job_id}`));
  },
  getLatestLLMReport(id: string) {
    return unwrap<LLMQualityReport>(api.get(`/benchmarks/${id}/quality/llm-reports/latest`));
  },
};

// SWE
export const SWEAPI = {
  listTasks(params: QueryRecord = {}) {
    return unwrap<PageData<SWETask>>(api.get("/swenbench/tasks", { params: toQuery(params) }));
  },
  getTask(id: string) {
    return unwrap<SWETask>(api.get(`/swenbench/tasks/${id}`));
  },
  createTask(payload: Record<string, unknown>) {
    return unwrap<SWETask>(api.post("/swenbench/tasks", payload));
  },
  retryTask(id: string) {
    return unwrap<Record<string, unknown>>(api.post(`/swenbench/tasks/${id}/retry`));
  },
  setTestStrategy(id: string, strategy: "full" | "smart" | "skip") {
    return unwrap<Record<string, unknown>>(api.post(`/swenbench/tasks/${id}/test-strategy`, { strategy }));
  },
};

// Execution
export const ExecutionAPI = {
  list(params: QueryRecord = {}) {
    return unwrap<PageData<ExecutionItem>>(api.get("/executions", { params: toQuery(params) }));
  },
  create(payload: Record<string, unknown>) {
    return unwrap<ExecutionItem>(api.post("/executions", payload));
  },
  get(id: string) {
    return unwrap<ExecutionItem>(api.get(`/executions/${id}`));
  },
  getTrace(id: string) {
    return unwrap<ExecutionTraceStep[]>(api.get(`/executions/${id}/trace`));
  },
  cancel(id: string) {
    return unwrap<Record<string, unknown>>(api.delete(`/executions/${id}`));
  },
};

// Batch
export const BatchAPI = {
  list(params: QueryRecord = {}) {
    return unwrap<PageData<BatchSummary>>(api.get("/batch-executions", { params: toQuery(params) }));
  },
  create(payload: Record<string, unknown>) {
    return unwrap<Record<string, unknown>>(api.post("/batch-executions", payload));
  },
  get(id: string) {
    return unwrap<Record<string, unknown>>(api.get(`/batch-executions/${id}`));
  },
  listTasks(id: string, params: QueryRecord = {}) {
    return unwrap<PageData<Record<string, unknown>>>(api.get(`/batch-executions/${id}/tasks`, { params: toQuery(params) }));
  },
};

// Scheduled
export const ScheduledAPI = {
  list(params: QueryRecord = {}) {
    return unwrap<PageData<ScheduledTask>>(api.get("/scheduled-tasks", { params: toQuery(params) }));
  },
  create(payload: Record<string, unknown>) {
    return unwrap<ScheduledTask>(api.post("/scheduled-tasks", payload));
  },
  update(id: string, payload: Record<string, unknown>) {
    return unwrap<ScheduledTask>(api.put(`/scheduled-tasks/${id}`, payload));
  },
  setStatus(id: string, enabled: boolean) {
    return unwrap<Record<string, unknown>>(api.patch(`/scheduled-tasks/${id}/status`, { enabled }));
  },
  trigger(id: string) {
    return unwrap<Record<string, unknown>>(api.post(`/scheduled-tasks/${id}/trigger`));
  },
};

// Agent
export const AgentAPI = {
  list(params: QueryRecord = {}) {
    return unwrap<PageData<AgentItem>>(api.get("/agents", { params: toQuery(params) }));
  },
  create(payload: Record<string, unknown>) {
    return unwrap<AgentItem>(api.post("/agents", payload));
  },
  execute(id: string, payload: AgentExecuteRequest) {
    return unwrap<Record<string, unknown>>(api.post(`/agents/${id}/execute`, payload));
  },
  health(id: string) {
    return unwrap<Record<string, unknown>>(api.get(`/agents/${id}/health`));
  },
};

// Cost
export const CostAPI = {
  summary(params: { start_date?: string; end_date?: string; currency?: string } = {}) {
    return unwrap<CostSummary>(api.get("/cost/summary", { params: toQuery(params) }));
  },
  statistics(params: QueryRecord = {}) {
    return unwrap<Record<string, unknown>>(api.get("/cost/statistics", { params: toQuery(params) }));
  },
  listModels(params: { active_only?: boolean } = {}) {
    return unwrap<{ models: CostModelPrice[]; total: number }>(api.get("/cost/models", { params: toQuery(params) }));
  },
  calculate(payload: {
    execution_id?: string;
    provider: string;
    model_name: string;
    input_tokens: number;
    output_tokens: number;
    currency?: string;
  }) {
    return unwrap<Record<string, unknown>>(api.post("/cost/calculate", payload));
  },
};

// Import
export const ImportAPI = {
  upload(dataset: string, file: File) {
    const form = new FormData();
    form.append("file", file);
    return unwrap<{ file_id: string; size: number }>(api.post(`/import/tasks/${dataset}/upload`, form));
  },
  createTask(dataset: string, payload: Record<string, unknown>) {
    return unwrap<{ task_id: string; status: string }>(api.post(`/import/tasks/${dataset}`, payload));
  },
  listTasks(params: QueryRecord = {}) {
    return unwrap<ImportTaskPageData<ImportTask>>(api.get("/import/tasks", { params: toQuery(params) }));
  },
  getTask(task_id: string) {
    return unwrap<ImportTask>(api.get(`/import/tasks/${task_id}`));
  },
  importBenchmarkByJSON(payload: Record<string, unknown>) {
    return unwrap<BenchmarkItem>(api.post("/import/benchmarks/json", payload));
  },
};

// Export
export const ExportAPI = {
  formats() {
    return unwrap<{ formats: Array<{ format: string; name: string; templates: string[]; content_type?: string; extension?: string }> }>(
      api.get("/export/formats")
    );
  },
  exportExecution(id: string, params: { type?: "pdf" | "excel" | "html"; template?: "summary" | "detailed" | "comparison"; charts?: boolean; locale?: string } = {}) {
    return unwrap<ExportFileInfo>(api.post(`/export/executions/${id}`, null, { params: toQuery(params) }));
  },
  exportBatch(payload: Record<string, unknown>) {
    return unwrap<ExportBatchResult>(api.post("/export/batch", payload));
  },
};

// Notification
export const HistoryAPI = {
  list(params: QueryRecord = {}) {
    return unwrap<{ total: number; page: number; page_size: number; records: HistoryRecord[] }>(
      api.get("/history", { params: toQuery(params) })
    );
  },
  acknowledge(id: string, payload: { comment?: string } = {}) {
    return unwrap<Record<string, unknown>>(api.put(`/history/${id}/acknowledge`, payload));
  },
  reject(id: string, payload: { comment?: string } = {}) {
    return unwrap<Record<string, unknown>>(api.put(`/history/${id}/reject`, payload));
  },
};

// Analytics
export const AnalyticsAPI = {
  listAnalyzerReports(params: QueryRecord = {}) {
    return unwrap<PageData<AnalyzerReportSummary>>(api.get("/analyzer/reports", { params: toQuery(params) }));
  },
  getAnalyzerReport(id: string) {
    return unwrap<AnalyzerReportPayload>(api.get(`/analyzer/reports/${id}`));
  },
  listCleanupReports(params: QueryRecord = {}) {
    return unwrap<PageData<Record<string, unknown>>>(api.get("/collector/cleanup-reports", { params: toQuery(params) }));
  },
  listMetrics(params: QueryRecord = {}) {
    return unwrap<PageData<Record<string, unknown>>>(api.get("/metrics", { params: toQuery(params) }));
  },
};

// Settings
export const SettingsAPI = {
  listLanguages() {
    return unwrap<Array<Record<string, unknown>>>(api.get("/languages"));
  },
  getCacheSummary() {
    return unwrap<Record<string, unknown>>(api.get("/cache/summary"));
  },
  // System-admin only. Non-admin receives 403001.
  getKafkaStats() {
    return unwrap<Record<string, unknown>>(api.get("/kafka/stats"));
  },
};
