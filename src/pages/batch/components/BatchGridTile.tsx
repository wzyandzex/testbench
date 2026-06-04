/**
 * 批量任务网格瓷砖组件
 * 六边形切角效果 + 霓虹边框 + 3D 悬停效果
 * 支持深色模式赛博科技风格
 */

import { useState, useCallback, useMemo, memo, CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '@/theme';
import { getBatchTheme, BATCH_STATUS_CONFIG } from '../theme';
import { ProgressRing } from './ProgressRing';
import { TiltCard } from '@/components/agent/TiltCard';

interface BatchGridTileProps {
  id?: string; // Optional for memo comparison
  name: string;
  description?: string;
  status: keyof typeof BATCH_STATUS_CONFIG;
  progress: number;
  total: number;
  failed: number;
  createdAt?: Date;
  onClick?: () => void;
  index?: number; // 用于交错动画
}

// ✅ rendering-hoist-jsx: 提取静态配置
const STATUS_ICONS = {
  pending: '⏳',
  running: '⚡',
  paused: '⏸️',
  completed: '✅',
  failed: '❌',
  cancelled: '⛔',
} as const;

/**
 * 批量任务网格瓷砖
 * ✅ rerender-memo: 使用 memo + 细粒度比较
 */
export const BatchGridTile = memo(function BatchGridTile({
  id: _id,
  name,
  description,
  status,
  progress,
  total,
  failed,
  createdAt,
  onClick,
  index = 0,
}: BatchGridTileProps) {
  const isDark = useIsDark();
  const { t } = useTranslation('batch');
  const theme = getBatchTheme(isDark);
  const [isHovered, setIsHovered] = useState(false);

  const statusConfig = BATCH_STATUS_CONFIG[status];
  const statusColor = theme[statusConfig.colorKey];
  const statusBg = theme[statusConfig.bgKey];

  // 容器样式
  const containerStyle = useMemo((): CSSProperties => {
    const baseStyle: CSSProperties = {
      position: 'relative',
      padding: 20,
      background: theme.cardBg,
      border: `1px solid ${status === 'running' ? statusColor : theme.cardBorder}`,
      borderRadius: isDark ? 0 : 12,
      boxShadow: isHovered ? theme.cardHoverShadow : theme.cardShadow,
      cursor: onClick ? 'pointer' : 'default',
      overflow: 'hidden',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      ...(isDark && {
        clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
        animation: `staggeredFadeIn 0.5s ease-out ${index * 0.05}s both`,
      }),
    };

    // 运行中任务的脉冲效果
    if (isDark && status === 'running') {
      baseStyle.boxShadow = `0 0 20px ${statusColor}40`;
    }

    return baseStyle;
  }, [isDark, theme, status, statusColor, isHovered, onClick, index]);

  // 顶部高光线（仅深色模式）
  const topHighlightStyle = useMemo((): CSSProperties => ({
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    height: 2,
    background: `linear-gradient(90deg, transparent, ${statusColor}, transparent)`,
    opacity: isDark ? 0.6 : 0,
  }), [isDark, statusColor]);

  // 状态徽章样式
  const statusBadgeStyle = useMemo((): CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '4px 10px',
    borderRadius: isDark ? 0 : 12,
    fontSize: 12,
    fontWeight: 600,
    color: statusColor,
    background: statusBg,
    border: isDark ? `1px solid ${statusColor}40` : 'none',
    ...(isDark && status === 'running' && {
      animation: 'batchStatusPulse 2s ease-in-out infinite',
    }),
  }), [isDark, status, statusColor, statusBg]);

  // 标题样式
  const titleStyle = useMemo((): CSSProperties => ({
    fontSize: 16,
    fontWeight: 600,
    color: theme.textPrimary,
    marginBottom: 4,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }), [theme.textPrimary]);

  // 描述样式
  const descStyle = useMemo((): CSSProperties => ({
    fontSize: 12,
    color: theme.textSecondary,
    marginBottom: 16,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  }), [theme.textSecondary]);

  const infoTextStyle = useMemo((): CSSProperties => ({
    fontSize: 12,
    color: theme.textSecondary,
  }), [theme.textSecondary]);

  const failedCountStyle = useMemo((): CSSProperties => ({
    fontSize: 12,
    color: theme.neonRed,
    fontWeight: 600,
  }), [theme]);

  // 进度环颜色
  const progressColor = useMemo(() => {
    if (failed > 0) return theme.neonRed;
    if (status === 'completed') return theme.neonGreen;
    if (status === 'running') return theme.neonCyan;
    return theme.statusPending;
  }, [failed, status, theme]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  // 计算进度百分比
  const progressPercent = total > 0 ? Math.round((progress / total) * 100) : 0;

  return (
    <TiltCard onClick={handleClick} intensity={12} glow={isDark}>
      <div
        style={containerStyle}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* 顶部高光线 */}
        <div style={topHighlightStyle} />

        {/* 头部：标题 + 状态 */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={titleStyle}>{name}</div>
            {description && <div style={descStyle}>{description}</div>}
          </div>
          <div style={statusBadgeStyle}>
            <span>{STATUS_ICONS[status]}</span>
            <span>{statusConfig.label}</span>
          </div>
        </div>

        {/* 进度区域 */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <ProgressRing
            progress={progressPercent}
            size={64}
            strokeWidth={5}
            color={progressColor}
            pulse={status === 'running'}
          />
          <div style={{ flex: 1 }}>
            <div style={infoTextStyle}>
              {progress} / {total} {t('stats.total')}
            </div>
            {failed > 0 && (
              <div style={failedCountStyle}>
                {failed} {t('statusLabel.failed')}
              </div>
            )}
            {createdAt && (
              <div style={{ ...infoTextStyle, fontSize: 11, marginTop: 4 }}>
                {typeof createdAt === 'string'
                  ? new Date(createdAt).toLocaleDateString()
                  : createdAt.toLocaleDateString()}
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
              backgroundSize: '20px 20px',
              opacity: 0.03,
              pointerEvents: 'none',
            }}
          />
        )}
      </div>
    </TiltCard>
  );
}, (prev, next) => {
  // 细粒度比较：只在关键 props 变化时重渲染
  return (
    prev.id === next.id &&
    prev.name === next.name &&
    prev.status === next.status &&
    prev.progress === next.progress &&
    prev.total === next.total &&
    prev.failed === next.failed
  );
});

export default BatchGridTile;
