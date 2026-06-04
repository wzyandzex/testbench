/**
 * Dashboard API service
 */

import api from '@/services/api';

export interface DashboardStats {
  totalBenchmarks: number;
  runningExecutions: number;
  totalAgents: number;
  successRate: number;
  benchmarksChange: number;
  executionsChange: number;
  agentsChange: number;
  successRateChange: number;
}

export interface TrendData {
  dates: string[];
  executions: number[];
  successRate: number[];
}

export interface RecentExecution {
  id: string;
  taskName: string;
  agent: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  duration: string;
  startTime: string;
}

/**
 * Get dashboard statistics
 */
export async function getDashboardStats(): Promise<DashboardStats> {
  return api.get('/dashboard/stats');
}

/**
 * Get trend data
 */
export async function getTrendData(period: 'week' | 'month' = 'week'): Promise<TrendData> {
  return api.get('/dashboard/trend', { params: { period } });
}

/**
 * Get recent executions
 */
export async function getRecentExecutions(limit = 10): Promise<RecentExecution[]> {
  return api.get('/dashboard/recent-executions', { params: { limit } });
}

/**
 * Refresh dashboard data
 */
export async function refreshDashboard(): Promise<{
  stats: DashboardStats;
  trend: TrendData;
  recentExecutions: RecentExecution[];
}> {
  return api.post('/dashboard/refresh');
}
