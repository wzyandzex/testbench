/**
 * 分页管理 Hook
 * 遵循 rerender-functional-setState 规则
 */

import { useState, useCallback, useMemo } from 'react';

export interface UsePaginationOptions {
  defaultPage?: number;
  defaultPageSize?: number;
  total?: number;
  pageSizeOptions?: number[];
}

export interface UsePaginationReturn {
  page: number;
  pageSize: number;
  total: number;
  pageSizeOptions: number[];
  startIndex: number;
  endIndex: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  isFirstPage: boolean;
  isLastPage: boolean;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  setTotal: (total: number) => void;
  nextPage: () => void;
  prevPage: () => void;
  firstPage: () => void;
  lastPage: () => void;
  reset: () => void;
}

/**
 * 分页管理 Hook
 */
export function usePagination(options: UsePaginationOptions = {}): UsePaginationReturn {
  const {
    defaultPage = 1,
    defaultPageSize = 20,
    total: initialTotal = 0,
    pageSizeOptions = [10, 20, 50, 100],
  } = options;

  const [page, setPage] = useState(defaultPage);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [total, setTotal] = useState(initialTotal);

  // 派生状态
  const totalPages = useMemo(
    () => Math.ceil(total / pageSize) || 1,
    [total, pageSize]
  );

  const startIndex = useMemo(
    () => (page - 1) * pageSize,
    [page, pageSize]
  );

  const endIndex = useMemo(
    () => Math.min(page * pageSize, total),
    [page, pageSize, total]
  );

  const hasNextPage = useMemo(
    () => page < totalPages,
    [page, totalPages]
  );

  const hasPrevPage = useMemo(
    () => page > 1,
    [page]
  );

  const isFirstPage = useMemo(() => page === 1, [page]);
  const isLastPage = useMemo(() => page === totalPages, [page, totalPages]);

  // Actions
  const nextPage = useCallback(() => {
    setPage((prev) => Math.min(prev + 1, totalPages));
  }, [totalPages]);

  const prevPage = useCallback(() => {
    setPage((prev) => Math.max(prev - 1, 1));
  }, []);

  const firstPage = useCallback(() => {
    setPage(1);
  }, []);

  const lastPage = useCallback(() => {
    setPage(totalPages);
  }, [totalPages]);

  const reset = useCallback(() => {
    setPage(defaultPage);
    setPageSize(defaultPageSize);
  }, [defaultPage, defaultPageSize]);

  // 当 pageSize 改变时，重置到第一页
  const handleSetPageSize = useCallback((newPageSize: number) => {
    setPageSize(newPageSize);
    setPage(1);
  }, []);

  return {
    page,
    pageSize,
    total,
    pageSizeOptions,
    startIndex,
    endIndex,
    totalPages,
    hasNextPage,
    hasPrevPage,
    isFirstPage,
    isLastPage,
    setPage,
    setPageSize: handleSetPageSize,
    setTotal,
    nextPage,
    prevPage,
    firstPage,
    lastPage,
    reset,
  };
}

export default usePagination;
