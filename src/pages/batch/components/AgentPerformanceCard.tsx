/**
 * Agent 性能卡片组件
 * 显示单个 Agent 在批量任务中的性能表现
 * 支持深色模式赛博科技风格
 */

import { useMemo, memo, CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '@/theme';
import { getBatchTheme } from '../theme';
import { ProgressRing } from './ProgressRing';

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  avgScore?: number;
  avgDuration?: number; // 毫秒
}

interface AgentPerformanceCardProps {
  performance: AgentPerformance;
  index?: number; // 用于交错动画
}

/**
 * 格式化时长
 */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const minutes = Math.floor(ms / 60000);
  const seconds = ((ms % 60000) / 1000).toFixed(0);
  return `${minutes}m ${seconds}s`;
}

/**
 * Agent 性能卡片
 * ✅ rerender-memo: 使用 memo 优化性能
 */
export const AgentPerformanceCard = memo(function AgentPerformanceCard({
  performance,
  index = 0,
}: AgentPerformanceCardProps) {
  const { t } = useTranslation('batch');
  const isDark = useIsDark();
  const theme = getBatchTheme(isDark);

  // 计算进度
  const progressPercent = performance.totalTasks > 0
    ? (performance.completedTasks / performance.totalTasks) * 100
    : 0;

  // 确定状态颜色
  const statusColor = useMemo(() => {
    if (performance.failedTasks > 0) return theme.neonRed;
    if (progressPercent >= 100) return theme.neonGreen;
    if (progressPercent > 0) return theme.neonCyan;
    return theme.statusPending;
  }, [performance.failedTasks, progressPercent, theme]);

  // 卡片样式
  const cardStyle = useMemo((): CSSProperties => ({
    position: 'relative',
    padding: 20,
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: isDark ? 0 : 12,
    boxShadow: theme.cardShadow,
    overflow: 'hidden',
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    ...(isDark && {
      clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)',
      backdropFilter: 'blur(10px)',
      animation: `staggeredFadeIn 0.5s ease-out ${index * 0.08}s both`,
    }),
    '&:hover': {
      boxShadow: theme.cardHoverShadow,
      transform: 'translateY(-2px)',
    },
  } as CSSProperties), [isDark, theme, index]);

  // 左侧强调条
  const accentBarStyle = useMemo((): CSSProperties => ({
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    background: `linear-gradient(180deg, ${statusColor}, ${statusColor}40, transparent)`,
  }), [statusColor]);

  // 头部样式
  const headerStyle = useMemo((): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  }), []);

  const nameStyle = useMemo((): CSSProperties => ({
    fontSize: 15,
    fontWeight: 600,
    color: theme.textPrimary,
  }), [theme.textPrimary]);

  const statusDotStyle = useMemo((): CSSProperties => ({
    width: 8,
    height: 8,
    borderRadius: '50%',
    background: statusColor,
    ...(isDark && performance.failedTasks === 0 && progressPercent < 100 && progressPercent > 0 && {
      animation: 'statusDotPulse 2s ease-in-out infinite',
    }),
  }), [isDark, statusColor, performance.failedTasks, progressPercent]);

  // 内容区域样式
  const contentStyle = useMemo((): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 20,
  }), []);

  // 统计信息样式
  const statsStyle = useMemo((): CSSProperties => ({
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    flex: 1,
  }), []);

  const statRowStyle = useMemo((): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 12,
  }), []);

  const labelStyle = useMemo((): CSSProperties => ({
    color: theme.textTertiary,
    minWidth: 60,
  }), [theme.textTertiary]);

  const valueStyle = useMemo((): CSSProperties => ({
    fontWeight: 500,
    color: theme.textPrimary,
  }), [theme.textPrimary]);

  const failedValueStyle = useMemo((): CSSProperties => ({
    ...valueStyle,
    color: theme.neonRed,
  }), [theme.neonRed]);

  const scoreValueStyle = useMemo((): CSSProperties => {
    let color = theme.textSecondary;
    if (performance.avgScore !== undefined) {
      if (performance.avgScore >= 80) color = theme.neonGreen;
      else if (performance.avgScore >= 60) color = theme.neonAmber;
      else color = theme.neonRed;
    }
    return {
      ...valueStyle,
      color,
    };
  }, [performance.avgScore, theme]);

  return (
    <div style={cardStyle}>
      {/* 左侧强调条 */}
      <div style={accentBarStyle} />

      {/* 头部 */}
      <div style={headerStyle}>
        <div style={nameStyle}>{performance.agentName}</div>
        <div style={statusDotStyle} />
      </div>

      {/* 内容区域 */}
      <div style={contentStyle}>
        {/* 进度环 */}
        <ProgressRing
          progress={progressPercent}
          size={64}
          strokeWidth={5}
          color={statusColor}
          pulse={progressPercent > 0 && progressPercent < 100 && performance.failedTasks === 0}
        />

        {/* 统计信息 */}
        <div style={statsStyle}>
          <div style={statRowStyle}>
            <span style={labelStyle}>{t('detail.completed')}:</span>
            <span style={valueStyle}>{performance.completedTasks} / {performance.totalTasks}</span>
          </div>
          {performance.failedTasks > 0 && (
            <div style={statRowStyle}>
              <span style={labelStyle}>{t('statusLabel.failed')}:</span>
              <span style={failedValueStyle}>{performance.failedTasks}</span>
            </div>
          )}
          {performance.avgScore !== undefined && (
            <div style={statRowStyle}>
              <span style={labelStyle}>{t('detail.successRate')}:</span>
              <span style={scoreValueStyle}>{performance.avgScore.toFixed(2)}</span>
            </div>
          )}
          {performance.avgDuration !== undefined && (
            <div style={statRowStyle}>
              <span style={labelStyle}>{t('report.avgDuration')}:</span>
              <span style={valueStyle}>{formatDuration(performance.avgDuration)}</span>
            </div>
          )}
        </div>
      </div>

      {/* 网格纹理覆盖层（仅深色模式） */}
      {isDark && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: theme.gridPattern,
            backgroundSize: '16px 16px',
            opacity: 0.02,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}, (prev, next) => {
  // 细粒度比较
  return (
    prev.performance.agentId === next.performance.agentId &&
    prev.performance.completedTasks === next.performance.completedTasks &&
    prev.performance.failedTasks === next.performance.failedTasks
  );
});

/**
 * Agent 性能卡片网格
 */
export const AgentPerformanceGrid = memo(function AgentPerformanceGrid({
  performances,
}: {
  performances: AgentPerformance[];
}) {
  const { t } = useTranslation('batch');
  const gridStyle = useMemo((): CSSProperties => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: 16,
  }), []);

  if (!performances || performances.length === 0) {
    const emptyStyle: CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 60,
      color: '#9ca3af',
    };

    return (
      <div style={emptyStyle}>
        <span style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>🤖</span>
        <span>{t('common:status.empty')}</span>
      </div>
    );
  }

  return (
    <div style={gridStyle}>
      {performances.map((performance, index) => (
        <AgentPerformanceCard
          key={performance.agentId}
          performance={performance}
          index={index}
        />
      ))}
    </div>
  );
});

export default AgentPerformanceCard;
