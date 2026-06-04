/**
 * 表格数据管理 Hook
 * 遵循 vercel-react-best-practices 的 rerender-functional-setState 规则
 */

import { useState, useCallback, useMemo } from 'react';
import type { TablePaginationConfig } from 'antd/es/table';

export interface TableParams {
  page: number;
  pageSize: number;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface UseTableOptions<T> {
  fetchData: (params: TableParams) => Promise<{
    list: T[];
    total: number;
  }>;
  pageSize?: number;
  immediate?: boolean;
}

export interface UseTableReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  pagination: {
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger: boolean;
    showTotal: (total: number) => string;
  };
  hasData: boolean;
  refresh: () => Promise<void>;
  handleChange: (pagination: TablePaginationConfig, filters?: unknown, sorter?: any) => void;
}

/**
 * 表格数据管理 Hook
 */
export function useTable<T>({
  fetchData,
  pageSize = 20,
  immediate = true,
}: UseTableOptions<T>): UseTableReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [params, setParams] = useState<TableParams>({
    page: 1,
    pageSize,
    sortField: undefined,
    sortOrder: undefined,
  });
  const [total, setTotal] = useState(0);

  // 获取数据
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchData(params);
      setData(result.list);
      setTotal(result.total);
    } catch (err) {
      const message = err instanceof Error ? err.message : '加载数据失败';
      setError(message);
      setData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [fetchData, params]);

  // 初始加载
  useState(() => {
    if (immediate) {
      refresh();
    }
  });

  // 处理表格变化
  const handleChange = useCallback(
    (pagination: TablePaginationConfig, _filters?: unknown, sorter?: any) => {
      const newParams: TableParams = {
        page: pagination.current || 1,
        pageSize: pagination.pageSize || pageSize,
        sortField: sorter?.field ? String(sorter.field) : undefined,
        sortOrder: sorter?.order === 'ascend' ? 'asc' : sorter?.order === 'descend' ? 'desc' : undefined,
      };

      // ✅ 使用 functional setState 避免依赖 params
      setParams(() => newParams);
    },
    [pageSize]
  );

  // 派生状态
  const hasData = useMemo(() => data.length > 0, [data.length]);

  const paginationConfig = useMemo(
    () => ({
      current: params.page,
      pageSize: params.pageSize,
      total,
      showSizeChanger: true,
      showTotal: (t: number) => `共 ${t} 条`,
    }),
    [params.page, params.pageSize, total]
  );

  return {
    data,
    loading,
    error,
    pagination: paginationConfig,
    hasData,
    refresh,
    handleChange,
  };
}

export default useTable;
