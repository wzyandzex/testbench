/**
 * 筛选管理 Hook
 * 遵循 rerender-functional-setState 规则
 */

import { useState, useCallback, useMemo } from 'react';

export interface UseFiltersOptions<T> {
  defaultFilters?: T;
  debounceMs?: number;
}

export interface UseFiltersReturn<T> {
  filters: T;
  activeCount: number;
  hasActiveFilters: boolean;
  setFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  setFilters: (filters: T) => void;
  clearFilter: <K extends keyof T>(key: K) => void;
  clearAllFilters: () => void;
  resetFilters: () => void;
  isFilterActive: <K extends keyof T>(key: K) => boolean;
}

/**
 * 筛选管理 Hook
 */
export function useFilters<T extends Record<string, unknown>>({
  defaultFilters = {} as T,
}: UseFiltersOptions<T> = {}): UseFiltersReturn<T> {
  const [filters, setFilters] = useState<T>(defaultFilters);
  const [initialFilters] = useState<T>(defaultFilters);

  // 计算激活的筛选数量
  const activeCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      const initialValue = initialFilters[key as keyof T];
      if (Array.isArray(value)) {
        return value.length > 0 && JSON.stringify(value) !== JSON.stringify(initialValue);
      }
      return value !== initialValue && value !== '' && value !== null && value !== undefined;
    }).length;
  }, [filters, initialFilters]);

  const hasActiveFilters = useMemo(() => activeCount > 0, [activeCount]);

  // 设置单个筛选
  const setFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  // 批量设置筛选
  const handleSetFilters = useCallback((newFilters: T) => {
    setFilters(newFilters);
  }, []);

  // 清除单个筛选
  const clearFilter = useCallback(<K extends keyof T>(key: K) => {
    setFilters((prev) => ({
      ...prev,
      [key]: initialFilters[key],
    }));
  }, [initialFilters]);

  // 清除所有筛选
  const clearAllFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // 重置筛选
  const resetFilters = useCallback(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  // 检查筛选是否激活
  const isFilterActive = useCallback(<K extends keyof T>(key: K) => {
    const value = filters[key];
    const initialValue = initialFilters[key];

    if (Array.isArray(value)) {
      return value.length > 0 && JSON.stringify(value) !== JSON.stringify(initialValue);
    }
    return value !== initialValue && value !== '' && value !== null && value !== undefined;
  }, [filters, initialFilters]);

  return {
    filters,
    activeCount,
    hasActiveFilters,
    setFilter,
    setFilters: handleSetFilters,
    clearFilter,
    clearAllFilters,
    resetFilters,
    isFilterActive,
  };
}

export default useFilters;
