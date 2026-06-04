/**
 * 进度环组件
 * SVG 圆形进度条，CSS 动画（非 JS 动画）
 * 支持深色模式赛博科技风格
 */

import { useMemo, memo, CSSProperties } from 'react';
import { useIsDark } from '@/theme';
import { getBatchTheme } from '../theme';

interface ProgressRingProps {
  /** 进度百分比 (0-100) */
  progress: number;
  /** 尺寸 */
  size?: number;
  /** 描边宽度 */
  strokeWidth?: number;
  /** 自定义颜色 */
  color?: string;
  /** 是否显示脉冲动画（仅深色模式） */
  pulse?: boolean;
  /** 中心内容 */
  children?: React.ReactNode;
  /** 自定义类名 */
  className?: string;
}

// ✅ rendering-animate-svg-wrapper: CSS 动画，非 JS 动画
export const ProgressRing = memo(function ProgressRing({
  progress,
  size = 80,
  strokeWidth = 6,
  color,
  pulse = false,
  children,
  className = '',
}: ProgressRingProps) {
  const isDark = useIsDark();
  const theme = getBatchTheme(isDark);

  // 根据进度自动选择颜色
  const autoColor = useMemo(() => {
    if (color) return color;
    if (progress >= 100) return theme.neonGreen;
    if (progress >= 50) return theme.neonCyan;
    return theme.neonAmber;
  }, [color, progress, theme]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  const containerStyle: CSSProperties = useMemo(() => ({
    position: 'relative',
    width: size,
    height: size,
  }), [size]);

  const svgStyle: CSSProperties = useMemo(() => ({
    transform: 'rotate(-90deg)',
    width: size,
    height: size,
  }), [size]);

  const backgroundCircleStyle: CSSProperties = useMemo(() => ({
    fill: 'none',
    stroke: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    strokeWidth,
    strokeLinecap: 'round' as const,
  }), [isDark, strokeWidth]);

  const progressCircleStyle: CSSProperties = useMemo(() => ({
    fill: 'none',
    stroke: autoColor,
    strokeWidth,
    strokeLinecap: 'round' as const,
    strokeDasharray: circumference,
    strokeDashoffset: offset,
    transition: 'stroke-dashoffset 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
    ...(isDark && pulse && progress < 100 && progress > 0 && {
      animation: 'progressRingPulse 2s ease-in-out infinite',
      filter: `drop-shadow(0 0 4px ${autoColor})`,
    }),
  }), [autoColor, circumference, offset, strokeWidth, isDark, pulse, progress]);

  const textStyle: CSSProperties = useMemo(() => ({
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: size / 4,
    fontWeight: 600,
    color: theme.textPrimary,
  }), [size, theme.textPrimary]);

  return (
    <div className={`progress-ring ${className}`} style={containerStyle}>
      <svg style={svgStyle}>
        {/* 背景圆 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          style={backgroundCircleStyle}
        />
        {/* 进度圆 */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          style={progressCircleStyle}
        />
      </svg>
      {/* 中心内容 */}
      <div style={textStyle}>
        {children ?? `${Math.round(progress)}%`}
      </div>

      {/* 注入动画 keyframes */}
      {isDark && (
        <style>{`
          @keyframes progressRingPulse {
            0%, 100% {
              filter: drop-shadow(0 0 2px currentColor);
            }
            50% {
              filter: drop-shadow(0 0 6px currentColor);
            }
          }
        `}</style>
      )}
    </div>
  );
});

/**
 * 小尺寸进度环变体
 */
export const SmallProgressRing = memo(function SmallProgressRing(props: Omit<ProgressRingProps, 'size'>) {
  return <ProgressRing {...props} size={48} strokeWidth={4} />;
});

/**
 * 大尺寸进度环变体
 */
export const LargeProgressRing = memo(function LargeProgressRing(props: Omit<ProgressRingProps, 'size'>) {
  return <ProgressRing {...props} size={120} strokeWidth={8} />;
});

export default ProgressRing;
