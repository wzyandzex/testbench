export type CostTimeRange = 'today' | 'week' | 'month' | 'custom';

export type CostPeriod = 'day' | 'week' | 'month';

export interface AgentCostStat {
  agent_id: string;
  agent_name?: string;
  total_cost: number;
  total_tokens: number;
  execution_count: number;
  avg_cost_per_exec: number;
}

export interface BenchmarkCostStat {
  benchmark_id: string;
  benchmark_name?: string;
  total_cost: number;
  total_tokens: number;
  execution_count: number;
  avg_cost_per_exec: number;
}

export interface ModelCostStat {
  provider: string;
  model_name: string;
  total_cost: number;
  total_tokens: number;
  execution_count: number;
  avg_cost_per_exec: number;
}

export interface TrendDataPoint {
  date: string;
  cost: number;
  tokens: number;
  execution_count: number;
}

export type DailyCost = TrendDataPoint;
export type ModelCostBreakdown = ModelCostStat;

export interface ProjectCostBreakdown {
  key: string;
  title: string;
  total_cost: number;
  execution_count: number;
  avg_cost_per_exec: number;
  note?: string;
}

export interface BudgetInfo {
  limit: number;
  used: number;
  remaining: number;
  percentage: number;
  reset_date: string;
  is_over: boolean;
  supported?: boolean;
  note?: string;
}

export interface CostOptimizationTip {
  type: string;
  title: string;
  description: string;
  suggestion: string;
  potential_savings?: number;
}

export interface CostStatistics {
  period: string;
  start_date: string;
  end_date: string;
  total_cost: number;
  total_tokens: number;
  execution_count: number;
  currency: string;
  avg_cost_per_exec: number;
  avg_tokens_per_exec: number;
  by_agent: AgentCostStat[];
  by_benchmark: BenchmarkCostStat[];
  by_model: ModelCostStat[];
  trend_data: TrendDataPoint[];
  recommendations: CostOptimizationTip[];
  // Legacy compatibility fields kept optional for older imports.
  daily_costs?: DailyCost[];
  by_project?: ProjectCostBreakdown[];
  budget?: BudgetInfo | null;
}

export interface CostSummary {
  total_cost: number;
  total_tokens: number;
  execution_count: number;
  currency: string;
  avg_cost_per_exec: number;
}

export interface ModelCost {
  id: string;
  provider: string;
  model_name: string;
  input_price: number;
  output_price: number;
  currency: string;
  effective_date: string;
  expiry_date?: string;
  is_active: boolean;
}

export interface CostQueryParams {
  timeRange?: CostTimeRange;
  start_date?: string;
  end_date?: string;
  period?: CostPeriod;
  currency?: string;
  agent_ids?: string[];
  benchmark_ids?: string[];
  providers?: string[];
  model_names?: string[];
  min_cost?: number;
  max_cost?: number;
}

export interface CreateModelCostRequest {
  provider: string;
  model_name: string;
  input_price: number;
  output_price: number;
  currency?: string;
  effective_date?: string;
  expiry_date?: string | null;
}

export interface UpdateModelCostRequest {
  input_price?: number;
  output_price?: number;
  currency?: string;
  expiry_date?: string | null;
  is_active?: boolean;
}

export interface SetBudgetRequest {
  limit: number;
}

export interface CalculateCostRequest {
  execution_id?: string;
  provider: string;
  model_name: string;
  input_tokens: number;
  output_tokens: number;
  currency?: string;
}

export interface CalculateCostResponse {
  execution_id: string;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  input_cost: number;
  output_cost: number;
  total_cost: number;
  provider: string;
  model_name: string;
  currency: string;
}

export type OptimizationPriority = 'high' | 'medium' | 'low';
