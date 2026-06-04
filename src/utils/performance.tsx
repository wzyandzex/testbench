/**
 * 性能优化工具
 */

import { useCallback, useRef, useEffect, useMemo, useState } from 'react';
import type { DependencyList } from 'react';

/**
 * 创建防抖函数
 * @param fn 要防抖的函数
 * @param delay 延迟时间（毫秒）
 */
export function useDebounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useMemo(() => {
    return ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        fn(...args);
      }, delay);
    }) as T;
  }, [fn, delay]);
}

/**
 * 创建节流函数
 * @param fn 要节流的函数
 * @param delay 延迟时间（毫秒）
 */
export function useThrottle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useMemo(() => {
    return ((...args: Parameters<T>) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delay) {
        fn(...args);
        lastRunRef.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          fn(...args);
          lastRunRef.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    }) as T;
  }, [fn, delay]);
}

/**
 * 创建稳定的回调函数
 * 类似 useCallback，但比较函数内容而非引用
 */
export function useStableCallback<T extends (...args: unknown[]) => unknown>(
  fn: T,
  deps: DependencyList
): (...args: Parameters<T>) => unknown {
  const fnRef = useRef(fn);

  // 更新函数引用
  useEffect(() => {
    fnRef.current = fn;
  });

  // 比较依赖项的 JSON 字符串
  const depsJson = JSON.stringify(deps);
  const prevDepsRef = useRef(depsJson);

  // 仅当依赖项变化时创建新的回调
  if (prevDepsRef.current !== depsJson) {
    prevDepsRef.current = depsJson;
  }

  return useCallback((...args: Parameters<T>) => {
    return fnRef.current(...args);
  }, []); // 空依赖数组，因为我们手动处理依赖
}

/**
 * 延迟渲染组件
 * 用于降低首屏渲染优先级
 */
export function useDeferredRender(delay = 0): boolean {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setReady(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return ready;
}

/**
 * 虚拟滚动 Hook
 * 用于优化长列表渲染
 */
export interface VirtualScrollOptions {
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualScroll(options: VirtualScrollOptions) {
  const { itemCount, itemHeight, containerHeight, overscan = 3 } = options;
  const [scrollTop, setScrollTop] = useState(0);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const visibleItems = useMemo(() => {
    const items = [];
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        offset: i * itemHeight,
      });
    }
    return items;
  }, [startIndex, endIndex, itemHeight]);

  const totalHeight = itemCount * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    handleScroll,
    startIndex,
    endIndex,
  };
}

/**
 * 资源预加载 Hook
 */
export function usePreload(urls: string[]) {
  useEffect(() => {
    urls.forEach((url) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.href = url;
      link.as = url.endsWith('.css') ? 'style' : 'fetch';
      document.head.appendChild(link);
    });
  }, [urls]);
}

/**
 * 图片懒加载 Hook
 */
export function useLazyImage(src: string, threshold = 100) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.src = src;
            img.onload = () => setLoaded(true);
            img.onerror = () => setError(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: `${threshold}px` }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src, threshold]);

  return { imgRef, loaded, error };
}
