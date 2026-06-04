/**
 * 表单管理 Hook
 * 遵循 rerender-functional-setState 规则
 */

import { useState, useCallback } from 'react';

export interface UseFormOptions<T> {
  initialValues?: T;
  onSubmit: (values: T) => Promise<void>;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export interface UseFormReturn<T> {
  values: T;
  touched: boolean;
  submitting: boolean;
  error: string | null;
  handleChange: (key: keyof T, value: T[keyof T]) => void;
  handleSubmit: () => Promise<void>;
  handleReset: () => void;
  setValues: (values: T) => void;
  setError: (error: string | null) => void;
}

/**
 * 表单管理 Hook
 */
export function useForm<T extends Record<string, unknown>>({
  initialValues,
  onSubmit,
  onSuccess,
  onError,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [values, setValues] = useState<T>((initialValues || {}) as T);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  // 处理值变化
  const handleChange = useCallback((key: keyof T, value: T[keyof T]) => {
    // ✅ 使用 functional setState
    setValues((prev) => ({ ...prev, [key]: value }));
    setTouched(true);
    setError(null);
  }, []);

  // 提交表单
  const handleSubmit = useCallback(async () => {
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(values);
      setTouched(false);
      onSuccess?.();
    } catch (err) {
      const message = err instanceof Error ? err.message : '提交失败';
      setError(message);
      onError?.(err instanceof Error ? err : new Error(message));
    } finally {
      setSubmitting(false);
    }
  }, [values, submitting, onSubmit, onSuccess, onError]);

  // 重置表单
  const handleReset = useCallback(() => {
    setValues((initialValues || {}) as T);
    setTouched(false);
    setError(null);
  }, [initialValues]);

  return {
    values,
    touched,
    submitting,
    error,
    handleChange,
    handleSubmit,
    handleReset,
    setValues,
    setError,
  };
}

export default useForm;
