/**
 * Dashboard state management
 */

import { create } from 'zustand';
import i18next from 'i18next';
import type {
  DashboardStats,
  TrendData,
  RecentExecution,
} from './service';

interface DashboardState {
  // Data state
  stats: DashboardStats | null;
  trendData: TrendData | null;
  recentExecutions: RecentExecution[];

  // UI state
  loading: boolean;
  error: string | null;
  lastRefreshTime: number | null;

  // Actions
  fetchStats: () => Promise<void>;
  fetchTrendData: () => Promise<void>;
  fetchRecentExecutions: () => Promise<void>;
  refreshAll: () => Promise<void>;
  setError: (error: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  // Initial state
  stats: null,
  trendData: null,
  recentExecutions: [],
  loading: false,
  error: null,
  lastRefreshTime: null,

  // Fetch statistics
  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const { getDashboardStats } = await import('./service');
      const stats = await getDashboardStats();
      set({ stats, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : i18next.t('dashboard:errors.fetchStatsFailed');
      set({ error: message, loading: false });
    }
  },

  // Fetch trend data
  fetchTrendData: async () => {
    try {
      const { getTrendData } = await import('./service');
      const trendData = await getTrendData();
      set({ trendData });
    } catch (err) {
      console.error(i18next.t('dashboard:errors.fetchTrendsFailed'), err);
    }
  },

  // Fetch recent executions
  fetchRecentExecutions: async () => {
    try {
      const { getRecentExecutions } = await import('./service');
      const recentExecutions = await getRecentExecutions();
      set({ recentExecutions });
    } catch (err) {
      console.error(i18next.t('dashboard:errors.fetchRecentFailed'), err);
    }
  },

  // Refresh all data
  refreshAll: async () => {
    set({ loading: true, error: null });
    try {
      const { refreshDashboard } = await import('./service');
      const data = await refreshDashboard();
      set({
        stats: data.stats,
        trendData: data.trend,
        recentExecutions: data.recentExecutions,
        loading: false,
        lastRefreshTime: Date.now(),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : i18next.t('dashboard:errors.refreshFailed');
      set({ error: message, loading: false });
    }
  },

  // Set error
  setError: (error) => set({ error }),
}));
