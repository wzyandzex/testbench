import api from '@/services/api';

// Types
export type Granularity = 'day' | 'week' | 'month';
export type TrendDirection = 'improving' | 'declining' | 'stable';
export type MilestoneScope = 'agent' | 'benchmark' | 'global';
export type MilestoneCategory = 'deployment' | 'model_change' | 'incident' | 'config' | 'custom';

export interface TrendPoint {
  date: string;
  composite_score: number;
  func_score: number;
  qual_score: number;
  stab_score: number;
  reas_score: number;
  eff_score: number;
  execution_count: number;
  is_anomaly: boolean;
  anomaly_reason?: string;
}

export interface TrendSummary {
  current_avg: number;
  wow_change: number;
  wow_change_pct: string;
  mom_change: number;
  mom_change_pct: string;
  trend_direction: TrendDirection;
  best_score: number;
  best_date: string;
  worst_score: number;
  worst_date: string;
  anomaly_count: number;
  total_executions: number;
}

export interface Milestone {
  id: string;
  org_id: string;
  scope_type: MilestoneScope;
  scope_id?: string;
  occurred_at: string;
  label: string;
  description?: string;
  category: MilestoneCategory;
  color?: string;
  created_by: string;
  created_at: string;
}

export interface TrendResponse {
  agent_id?: string;
  agent_name?: string;
  benchmark_id?: string;
  range: string;
  granularity: Granularity;
  points: TrendPoint[];
  summary: TrendSummary;
  milestones: Milestone[];
}

export interface AgentTrendOption {
  agent_id: string;
  agent_name: string;
  execution_count: number;
  last_executed_at: string;
  latest_score: number;
}

export interface CompareResponse {
  range: string;
  granularity: Granularity;
  agents: Record<string, TrendResponse>;
}

export interface CreateMilestoneRequest {
  scope_type: MilestoneScope;
  scope_id?: string;
  occurred_at: string;
  label: string;
  description?: string;
  category: MilestoneCategory;
  color?: string;
}

export const CATEGORY_LABELS: Record<MilestoneCategory, { label: string; color: string }> = {
  deployment: { label: '部署', color: '#1890ff' },
  model_change: { label: '模型变更', color: '#722ed1' },
  incident: { label: '故障', color: '#f5222d' },
  config: { label: '配置调整', color: '#faad14' },
  custom: { label: '自定义', color: '#52c41a' },
};

export const DIMENSION_LABELS = {
  composite_score: { label: '合成质量分', color: '#1890ff' },
  func_score: { label: '功能', color: '#52c41a' },
  qual_score: { label: '质量', color: '#722ed1' },
  stab_score: { label: '稳定性', color: '#13c2c2' },
  reas_score: { label: '推理', color: '#fa8c16' },
  eff_score: { label: '效率', color: '#eb2f96' },
} as const;

export type DimensionKey = keyof typeof DIMENSION_LABELS;

// API calls
export async function getTrend(params: {
  agent_id: string;
  benchmark_id?: string;
  range?: string;
  start?: string;
  end?: string;
  granularity?: Granularity;
}): Promise<TrendResponse> {
  return api.get('/quality-trends', { params });
}

export async function listAgents(): Promise<AgentTrendOption[]> {
  return api.get('/quality-trends/agents');
}

export async function compareAgents(params: {
  agent_ids: string;
  benchmark_id?: string;
  range?: string;
  granularity?: Granularity;
}): Promise<CompareResponse> {
  return api.get('/quality-trends/compare', { params });
}

export async function listMilestones(params: {
  scope_type?: MilestoneScope;
  scope_id?: string;
  start?: string;
  end?: string;
}): Promise<Milestone[]> {
  return api.get('/quality-milestones', { params });
}

export async function createMilestone(req: CreateMilestoneRequest): Promise<Milestone> {
  return api.post('/quality-milestones', req);
}

export async function deleteMilestone(id: string): Promise<void> {
  return api.delete(`/quality-milestones/${id}`);
}
