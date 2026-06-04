/**
 * Benchmark 状态管理
 */

import { create } from 'zustand';
import type {
  Benchmark,
  BenchmarkDetail,
  BenchmarkFilter,
  CreateBenchmarkRequest,
  UpdateBenchmarkRequest,
  BenchmarkStats,
  PaginationParams,
  BenchmarkForkItem,
} from '@/types';

interface BenchmarkState {
  // 数据状态
  benchmarks: Benchmark[];
  currentBenchmark: BenchmarkDetail | null;
  currentStats: BenchmarkStats | null;
  forks: BenchmarkForkItem[];
  total: number;
  forksTotal: number;

  // 列表查询状态
  listParams: BenchmarkFilter;
  forksParams: PaginationParams;

  // UI 状态
  loading: boolean;
  forksLoading: boolean;
  error: string | null;
  viewMode: 'grid' | 'list';
  selectedIds: string[];

  // 操作 - 基础 CRUD
  fetchList: () => Promise<void>;
  fetchDetail: (id: string) => Promise<void>;
  fetchStats: (id: string) => Promise<void>;
  create: (data: CreateBenchmarkRequest) => Promise<BenchmarkDetail>;
  update: (id: string, data: UpdateBenchmarkRequest) => Promise<void>;
  remove: (id: string) => Promise<void>;
  batchRemove: (ids: string[]) => Promise<void>;

  // 操作 - Fork
  fetchMyForks: () => Promise<void>;
  fetchForks: (id: string) => Promise<void>;
  forkBenchmark: (id: string) => Promise<BenchmarkDetail>;
  markUpdateSeen: (forkId: string) => void;

  // UI 操作
  setListParams: (params: Partial<BenchmarkFilter>) => void;
  setForksParams: (params: Partial<PaginationParams>) => void;
  setViewMode: (mode: 'grid' | 'list') => void;
  setSelectedIds: (ids: string[]) => void;
  toggleSelectId: (id: string) => void;
  clearError: () => void;
}

// 分页响应类型
interface PaginatedData<T> {
  data: T[];
  total: number;
  page: number;
  size: number;
}

export const useBenchmarkStore = create<BenchmarkState>((set, get) => ({
  // 初始状态
  benchmarks: [],
  currentBenchmark: null,
  currentStats: null,
  forks: [],
  total: 0,
  forksTotal: 0,
  listParams: {
    page: 1,
    page_size: 20,
  },
  forksParams: {
    page: 1,
    page_size: 20,
  },
  loading: false,
  forksLoading: false,
  error: null,
  viewMode: 'grid',
  selectedIds: [],

  // 获取列表
  fetchList: async () => {
    set({ loading: true, error: null });
    try {
      const { benchmarkService } = await import('@/services/benchmark');
      const result = await benchmarkService.list(get().listParams) as unknown as PaginatedData<Benchmark>;
      set({
        benchmarks: result.data || [],
        total: result.total || 0,
        loading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取评测任务列表失败';
      set({ error: message, loading: false });
    }
  },

  // 获取详情
  fetchDetail: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { benchmarkService } = await import('@/services/benchmark');
      const benchmark = await benchmarkService.get(id) as unknown as BenchmarkDetail;
      set({ currentBenchmark: benchmark, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取评测任务详情失败';
      set({ error: message, loading: false });
    }
  },

  // 获取统计
  fetchStats: async (id: string) => {
    try {
      const { benchmarkService } = await import('@/services/benchmark');
      const stats = await benchmarkService.getStats(id) as unknown as BenchmarkStats;
      set({ currentStats: stats });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取统计数据失败';
      set({ error: message });
    }
  },

  // 创建
  create: async (data) => {
    set({ loading: true, error: null });
    try {
      const { benchmarkService } = await import('@/services/benchmark');
      const result = await benchmarkService.create(data) as unknown as BenchmarkDetail;
      set({ loading: false });
      // 刷新列表
      get().fetchList();
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : '创建评测任务失败';
      set({ error: message, loading: false });
      throw err;
    }
  },

  // 更新
  update: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const { benchmarkService } = await import('@/services/benchmark');
      const result = await benchmarkService.update(id, data) as unknown as BenchmarkDetail;
      set({
        currentBenchmark: result,
        loading: false,
      });
      // 刷新列表
      get().fetchList();
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新评测任务失败';
      set({ error: message, loading: false });
      throw err;
    }
  },

  // 删除
  remove: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { benchmarkService } = await import('@/services/benchmark');
      await benchmarkService.delete(id);
      set({ loading: false });
      // 刷新列表
      get().fetchList();
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除评测任务失败';
      set({ error: message, loading: false });
      throw err;
    }
  },

  // 批量删除
  batchRemove: async (ids: string[]) => {
    set({ loading: true, error: null });
    try {
      // 使用 Promise.all 并行删除
      const { benchmarkService } = await import('@/services/benchmark');
      await Promise.all(ids.map((id) => benchmarkService.delete(id)));
      set({ loading: false, selectedIds: [] });
      // 刷新列表
      get().fetchList();
    } catch (err) {
      const message = err instanceof Error ? err.message : '批量删除评测任务失败';
      set({ error: message, loading: false });
      throw err;
    }
  },

  // ==================== Fork 操作 ====================

  // 获取我的 Fork 列表
  fetchMyForks: async () => {
    set({ forksLoading: true, error: null });
    try {
      const { benchmarkService } = await import('@/services/benchmark');
      const result = await benchmarkService.getMyForks(get().forksParams) as unknown as PaginatedData<BenchmarkForkItem>;
      set({
        forks: result.data || [],
        forksTotal: result.total || 0,
        forksLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取 Fork 列表失败';
      set({ error: message, forksLoading: false });
    }
  },

  // 获取指定题目的 Fork 列表
  fetchForks: async (id: string) => {
    set({ forksLoading: true, error: null });
    try {
      const { benchmarkService } = await import('@/services/benchmark');
      const result = await benchmarkService.getForks(id) as unknown as PaginatedData<BenchmarkForkItem>;
      set({
        forks: result.data || [],
        forksTotal: result.total || 0,
        forksLoading: false,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取 Fork 列表失败';
      set({ error: message, forksLoading: false });
    }
  },

  // Fork 题目
  forkBenchmark: async (id: string) => {
    set({ loading: true, error: null });
    try {
      const { benchmarkService } = await import('@/services/benchmark');
      const result = await benchmarkService.fork(id) as unknown as BenchmarkDetail;
      set({ loading: false });
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Fork 失败';
      set({ error: message, loading: false });
      throw err;
    }
  },

  // 标记更新已查看
  markUpdateSeen: (forkId: string) => {
    const forks = get().forks;
    const updatedForks = forks.map((f) =>
      f.id === forkId ? { ...f, parent_updates_seen: true } : f
    );
    set({ forks: updatedForks });
  },

  // ==================== UI 操作 ====================

  // 设置列表查询参数
  setListParams: (params) => {
    set({ listParams: { ...get().listParams, ...params } });
  },

  // 设置 Fork 列表查询参数
  setForksParams: (params) => {
    set({ forksParams: { ...get().forksParams, ...params } });
  },

  // 设置视图模式
  setViewMode: (mode) => set({ viewMode: mode }),

  // 设置选中的 IDs
  setSelectedIds: (ids) => set({ selectedIds: ids }),

  // 切换单个选中状态
  toggleSelectId: (id) => {
    const selectedIds = get().selectedIds;
    const index = selectedIds.indexOf(id);
    if (index > -1) {
      set({ selectedIds: selectedIds.filter((item) => item !== id) });
    } else {
      set({ selectedIds: [...selectedIds, id] });
    }
  },

  // 清除错误
  clearError: () => set({ error: null }),
}));
