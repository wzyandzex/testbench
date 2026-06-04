import { useState, useCallback } from 'react';

interface UseRequestOptions<T> {
  // 是否立即执行
  immediate?: boolean;
  // 成功回调
  onSuccess?: (data: T) => void;
  // 错误回调
  onError?: (error: Error) => void;
  // 完成回调
  onFinally?: () => void;
}

export function useRequest<T>(
  apiFunc: () => Promise<T>,
  options: UseRequestOptions<T> = {}
) {
  const { onSuccess, onError, onFinally } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiFunc();
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
      onFinally?.();
    }
  }, [apiFunc, onSuccess, onError, onFinally]);

  return {
    data,
    loading,
    error,
    execute,
    // 重置状态
    reset: () => {
      setData(null);
      setError(null);
      setLoading(false);
    },
  };
}
