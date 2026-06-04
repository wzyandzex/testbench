/**
 * 全息统计面板组件
 * 显示批量任务的统计信息
 * 支持深色模式赛博科技风格
 */

import { useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '@/theme';
import { theme as antdTheme } from 'antd';
import type { CSSProperties } from 'react';
import { getBatchTheme } from '../theme';
import { AnimatedCounter } from '@/pages/notifications/components/animations/AnimatedCounter';

interface StatCardProps {
  title: string;
  value: number;
  icon: string;
  color: string;
  delay?: number;
}

/**
 * 单个统计卡片
 */
const StatCard = memo(function StatCard({ title, value, icon, color, delay = 0 }: StatCardProps) {
  const isDark = useIsDark();
  const theme = getBatchTheme(isDark);
  const { token } = antdTheme.useToken();

  const cardStyle = useMemo((): CSSProperties => ({
    position: 'relative',
    padding: '20px 24px',
    background: isDark ? 'linear-gradient(135deg, rgba(20, 20, 25, 0.9), rgba(30, 30, 40, 0.8))' : token.colorBgContainer,
    border: `1px solid ${isDark ? `${color}30` : token.colorBorderSecondary}`,
    borderRadius: isDark ? 0 : token.borderRadiusLG,
    boxShadow: isDark
      ? `0 4px 20px ${color}15`
      : '0 2px 8px rgba(0, 0, 0, 0.06)',
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    ...(isDark && {
      backdropFilter: 'blur(10px)',
      clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)',
      animation: `staggeredFadeIn 0.5s ease-out ${delay}s both`,
    }),
  }), [isDark, color, delay]);

  const iconContainerStyle = useMemo((): CSSProperties => ({
    width: 48,
    height: 48,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 24,
    background: isDark ? `${color}15` : `${color}10`,
    borderRadius: isDark ? 0 : 12,
    marginBottom: 12,
  }), [isDark, color]);

  const valueStyle = useMemo((): CSSProperties => ({
    fontSize: 32,
    fontWeight: 700,
    color: isDark ? color : theme.textPrimary,
    marginBottom: 4,
    ...(isDark && {
      textShadow: `0 0 20px ${color}40`,
    }),
  }), [isDark, color, theme.textPrimary]);

  const labelStyle = useMemo((): CSSProperties => ({
    fontSize: 13,
    color: theme.textSecondary,
    fontWeight: 500,
  }), [theme.textSecondary]);

  const accentLineStyle = useMemo((): CSSProperties => ({
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
    background: `linear-gradient(180deg, ${color}, transparent)`,
  }), [color]);

  return (
    <div style={cardStyle}>
      {isDark && <div style={accentLineStyle} />}
      <div style={iconContainerStyle}>{icon}</div>
      <div style={valueStyle}>
        <AnimatedCounter value={value} format={false} />
      </div>
      <div style={labelStyle}>{title}</div>
    </div>
  );
});

interface HolographicStatsPanelProps {
  stats: {
    total: number;
    running: number;
    completed: number;
    failed: number;
    pending?: number;
  };
}

/**
 * 全息统计面板
 * ✅ rerender-memo: 使用 memo 优化性能
 */
export const HolographicStatsPanel = memo(function HolographicStatsPanel({
  stats,
}: HolographicStatsPanelProps) {
  const isDark = useIsDark();
  const { t } = useTranslation('batch');
  const theme = getBatchTheme(isDark);

  const containerStyle = useMemo((): CSSProperties => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: 16,
    marginBottom: 24,
  }), []);

  const cards = useMemo(() => {
    const colorMap = {
      total: theme.neonCyan,
      running: theme.statusRunning,
      completed: theme.statusCompleted,
      failed: theme.statusFailed,
      pending: theme.statusPending,
    };

    return [
      { title: t('stats.total'), value: stats.total, icon: '📊', color: colorMap.total, delay: 0 },
      { title: t('stats.running'), value: stats.running, icon: '⚡', color: colorMap.running, delay: 0.1 },
      { title: t('stats.completed'), value: stats.completed, icon: '✅', color: colorMap.completed, delay: 0.2 },
      { title: t('stats.failed'), value: stats.failed, icon: '❌', color: colorMap.failed, delay: 0.3 },
      ...(stats.pending !== undefined ? [{ title: t('stats.pending'), value: stats.pending, icon: '⏳', color: colorMap.pending, delay: 0.4 }] : []),
    ];
  }, [stats, theme]);

  return (
    <div style={containerStyle}>
      {cards.map((card) => (
        <StatCard key={card.title} {...card} />
      ))}
    </div>
  );
}, (prev, next) => {
  // 自定义比较函数
  return (
    prev.stats.total === next.stats.total &&
    prev.stats.running === next.stats.running &&
    prev.stats.completed === next.stats.completed &&
    prev.stats.failed === next.stats.failed &&
    prev.stats.pending === next.stats.pending
  );
});

export default HolographicStatsPanel;
