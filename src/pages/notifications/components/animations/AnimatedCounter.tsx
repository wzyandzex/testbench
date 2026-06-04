/**
 * AnimatedCounter Component
 * 数字增长动画组件
 *
 * 特性:
 * - 1秒 duration 的数字滚动动画
 * - 支持 easeOutQuart 缓动
 * - 使用 requestAnimationFrame 优化性能
 * - 支持千分位格式化
 */

import { useState, useEffect, useRef, memo } from 'react';
import type { AnimatedCounterProps } from '../../types';

// 缓动函数 - easeOutQuart
const easeOutQuart = (t: number): number => {
  return 1 - Math.pow(1 - t, 4);
};

/**
 * 格式化数字（千分位）
 */
const formatNumber = (num: number, format: boolean): string => {
  if (!format) return Math.round(num).toString();
  return Math.round(num).toLocaleString('zh-CN');
};

export const AnimatedCounter = memo(function AnimatedCounter({
  value,
  duration = 1000,
  format = true,
  prefix = '',
  suffix = '',
  className = '',
  style,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);
  const startValueRef = useRef(0);

  // 启动动画
  useEffect(() => {
    startValueRef.current = displayValue;
    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const startTime = startTimeRef.current ?? currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutQuart(progress);

      const currentValue = startValueRef.current + (value - startValueRef.current) * easedProgress;
      setDisplayValue(currentValue);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [value, duration]);

  // 处理数值变化（不需要动画的情况）
  useEffect(() => {
    if (duration === 0) {
      setDisplayValue(value);
    }
  }, [value, duration]);

  return (
    <span className={className} style={style}>
      {prefix}
      {formatNumber(displayValue, format)}
      {suffix}
    </span>
  );
});

export default AnimatedCounter;
