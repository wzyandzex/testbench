import api from '@/services/api';

// Types
export type Verdict = 'improved' | 'regressed' | 'mixed' | 'equivalent';
export type ChangeKind = 'unchanged' | 'improved' | 'regressed' | 'different';
export type StepDiffKind = 'common' | 'only_ref' | 'only_tgt' | 'differ' | 'skipped';
export type SessionVisibility = 'private' | 'org';

export interface ExecutionSummary {
  id: string;
  agent_id: string;
  agent_name?: string;
  benchmark_id: string;
  benchmark_name?: string;
  status: string;
  success: boolean;
  started_at: string;
  completed_at?: string;
  duration_ms: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  total_steps: number;
  steps_taken: number;
  error?: string;
}

export interface ConfigField {
  key: string;
  label: string;
  reference: string;
  target: string;
  change_kind: ChangeKind;
}

export interface ConfigDiff {
  fields: ConfigField[];
  same_benchmark: boolean;
  same_agent: boolean;
  changed_count: number;
}

export interface MetricDelta {
  key: string;
  label: string;
  reference: number;
  target: number;
  delta: number;
  delta_pct: string;
  change_kind: ChangeKind;
  higher_is_better: boolean;
}

export interface MetricsDiff {
  deltas: MetricDelta[];
  has_metrics: boolean;
  composite_ref: number;
  composite_tgt: number;
}

export interface StepTrace {
  step_index: number;
  step_type: string;
  action: string;
  duration_ms: number;
  has_error: boolean;
}

export interface StepDiffEntry {
  kind: StepDiffKind;
  step_index: number;
  reference?: StepTrace;
  target?: StepTrace;
  skipped_count?: number;
}

export interface TraceDiff {
  reference_step_count: number;
  target_step_count: number;
  common_prefix_len: number;
  diverge_at: number;
  entries: StepDiffEntry[];
  is_truncated: boolean;
  total_entries: number;
}

export interface ComparisonResult {
  reference: ExecutionSummary;
  target: ExecutionSummary;
  verdict: Verdict;
  verdict_note: string;
  insights: string[];
  config_diff: ConfigDiff;
  metrics_diff: MetricsDiff;
  trace_diff: TraceDiff;
  generated_at: string;
}

export interface SessionInfo {
  id: string;
  org_id: string;
  name: string;
  description?: string;
  reference_id: string;
  target_id: string;
  notes?: string;
  verdict?: Verdict;
  visibility: SessionVisibility;
  created_by: string;
  created_by_name?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateSessionRequest {
  name: string;
  description?: string;
  reference_id: string;
  target_id: string;
  notes?: string;
  visibility?: SessionVisibility;
}

export interface SessionListResponse {
  total: number;
  page: number;
  size: number;
  data: SessionInfo[];
}

// 显示元数据：label 通过 i18n 在渲染层解析，避免固定语言。
export const VERDICT_META: Record<Verdict, { color: string; bgColor: string; icon: string }> = {
  improved:   { color: '#52c41a', bgColor: '#f6ffed', icon: '🟢' },
  regressed:  { color: '#f5222d', bgColor: '#fff1f0', icon: '🔴' },
  mixed:      { color: '#faad14', bgColor: '#fffbe6', icon: '🟡' },
  equivalent: { color: '#8c8c8c', bgColor: '#fafafa', icon: '⚪' },
};

export const CHANGE_KIND_COLOR: Record<ChangeKind, string> = {
  unchanged: 'default',
  improved:  'success',
  regressed: 'error',
  different: 'warning',
};

// API calls
export async function compareExecutions(referenceId: string, targetId: string): Promise<ComparisonResult> {
  return api.get('/execution-comparisons', { params: { reference_id: referenceId, target_id: targetId } });
}

export async function listSessions(params?: {
  tab?: 'mine' | 'org';
  verdict?: Verdict;
  page?: number;
  page_size?: number;
}): Promise<SessionListResponse> {
  return api.get('/comparison-sessions', { params });
}

export async function getSession(id: string): Promise<SessionInfo> {
  return api.get(`/comparison-sessions/${id}`);
}

export async function createSession(req: CreateSessionRequest): Promise<SessionInfo> {
  return api.post('/comparison-sessions', req);
}

export async function updateSession(id: string, req: {
  name?: string;
  description?: string;
  notes?: string;
  visibility?: SessionVisibility;
}): Promise<SessionInfo> {
  return api.put(`/comparison-sessions/${id}`, req);
}

export async function deleteSession(id: string): Promise<void> {
  return api.delete(`/comparison-sessions/${id}`);
}
