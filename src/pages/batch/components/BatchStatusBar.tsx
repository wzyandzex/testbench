/**
 * 状态过滤栏组件
 * 用于批量任务列表的状态筛选
 * 支持深色模式赛博科技风格
 */

import { useMemo, memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '@/theme';
import type { CSSProperties } from 'react';
import { getBatchTheme } from '../theme';

const STATUS_FILTER_OPTIONS = [
  { labelKey: 'statusFilter.all', value: 'all', icon: '📊', color: '#9ca3af' },
  { labelKey: 'statusFilter.running', value: 'running', icon: '⚡', color: '#00d4ff' },
  { labelKey: 'statusFilter.completed', value: 'completed', icon: '✅', color: '#00ffaa' },
  { labelKey: 'statusFilter.failed', value: 'failed', icon: '❌', color: '#ff4466' },
  { labelKey: 'statusFilter.pending', value: 'pending', icon: '⏳', color: '#6b7280' },
] as const;

export type BatchStatusFilter = typeof STATUS_FILTER_OPTIONS[number]['value'];

interface BatchStatusBarProps {
  /** 当前选中的过滤器 */
  activeFilter: BatchStatusFilter;
  /** 过滤器变更回调 */
  onFilterChange: (filter: BatchStatusFilter) => void;
  /** 统计数据 */
  stats?: {
    total: number;
    running: number;
    completed: number;
    failed: number;
    pending: number;
  };
}

// ✅ rerender-memo: 使用 memo + 自定义比较避免不必要的重渲染
export const BatchStatusBar = memo(function BatchStatusBar({
  activeFilter,
  onFilterChange,
  stats,
}: BatchStatusBarProps) {
  const isDark = useIsDark();
  const { t } = useTranslation('batch');
  const theme = getBatchTheme(isDark);

  // 容器样式
  const containerStyle = useMemo((): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: isDark ? '16px 24px' : '12px 16px',
    background: isDark ? 'rgba(20, 20, 25, 0.8)' : '#fff',
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: isDark ? 0 : 12,
    marginBottom: 24,
    flexWrap: 'wrap',
    ...(isDark && {
      backdropFilter: 'blur(10px)',
      clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
    }),
  }), [isDark, theme]);

  // 按钮样式
  const getButtonStyle = useCallback((isActive: boolean, color: string): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 18px',
    borderRadius: isDark ? 0 : 8,
    fontSize: 14,
    fontWeight: 500,
    border: `1px solid ${isActive ? color : (isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)')}`,
    background: isActive ? `${color}20` : 'transparent',
    color: isActive ? color : (isDark ? '#9ca3af' : '#6b7280'),
    cursor: 'pointer',
    transition: 'all 0.2s',
    ...(isDark && !isActive && {
      clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
    }),
  }), [isDark]);

  // 统计标签样式
  const countStyle = useMemo((): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 20,
    height: 20,
    padding: '0 6px',
    borderRadius: isDark ? 0 : 10,
    fontSize: 12,
    fontWeight: 600,
    background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)',
    color: isDark ? '#e5e7eb' : '#1a1a2e',
  }), [isDark]);

  return (
    <div style={containerStyle}>
      {STATUS_FILTER_OPTIONS.map((option) => {
        const isActive = activeFilter === option.value;
        const count = stats?.[option.value === 'all' ? 'total' : option.value] ?? 0;

        return (
          <button
            key={option.value}
            onClick={() => onFilterChange(option.value)}
            style={getButtonStyle(isActive, option.color)}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = isDark
                  ? 'rgba(255, 255, 255, 0.05)'
                  : 'rgba(0, 0, 0, 0.03)';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            <span style={{ fontSize: 16 }}>{option.icon}</span>
            <span>{t(option.labelKey)}</span>
            {stats && (
              <span style={countStyle}>{count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}, (prev, next) => {
  // 自定义比较函数：只在相关 props 变化时重渲染
  return (
    prev.activeFilter === next.activeFilter &&
    prev.stats?.total === next.stats?.total &&
    prev.stats?.running === next.stats?.running &&
    prev.stats?.completed === next.stats?.completed &&
    prev.stats?.failed === next.stats?.failed &&
    prev.stats?.pending === next.stats?.pending
  );
});

export default BatchStatusBar;
