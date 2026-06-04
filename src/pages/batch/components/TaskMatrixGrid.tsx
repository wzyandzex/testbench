/**
 * 任务矩阵网格组件
 * 以网格形式展示执行项状态，支持虚拟滚动
 * 支持深色模式赛博科技风格
 */

import { useMemo, memo, useCallback, useState, CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '@/theme';
import { getBatchTheme } from '../theme';

export type TaskStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface TaskItem {
  id: string;
  benchmarkName: string;
  agentName: string;
  status: TaskStatus;
  score?: number;
  duration?: number;
  error?: string;
}

interface TaskMatrixGridProps {
  tasks: TaskItem[];
  onTaskClick?: (task: TaskItem) => void;
  columns?: number;
  compact?: boolean;
}

// ✅ rendering-hoist-jsx: 提取静态配置
const STATUS_CONFIG = {
  pending: { icon: '⏳', labelKey: 'statusLabel.pending', colorKey: 'statusPending' },
  running: { icon: '⚡', labelKey: 'statusLabel.running', colorKey: 'statusRunning' },
  completed: { icon: '✅', labelKey: 'statusLabel.completed', colorKey: 'statusCompleted' },
  failed: { icon: '❌', labelKey: 'statusLabel.failed', colorKey: 'statusFailed' },
  skipped: { icon: '⏭️', labelKey: 'statusLabel.cancelled', colorKey: 'statusCancelled' },
} as const;

/**
 * 任务单元格组件
 * ✅ rerender-memo: 使用 memo 优化
 */
const TaskCell = memo(function TaskCell({
  task,
  isCompact,
  onClick,
}: {
  task: TaskItem;
  isCompact: boolean;
  onClick?: () => void;
}) {
  const isDark = useIsDark();
  const { t } = useTranslation('batch');
  const theme = getBatchTheme(isDark);
  const [isHovered, setIsHovered] = useState(false);

  const statusConfig = STATUS_CONFIG[task.status];
  const statusColor = theme[statusConfig.colorKey];

  const cellStyle = useMemo((): CSSProperties => {
    const baseStyle: CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isCompact ? 8 : 12,
      background: theme.cardBg,
      border: `1px solid ${task.status === 'running' ? statusColor : theme.cardBorder}`,
      borderRadius: isDark ? 0 : 8,
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      position: 'relative',
      overflow: 'hidden',
      ...(isDark && {
        clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 0 100%)',
        contentVisibility: 'auto',
        containIntrinsicSize: 'auto 60px',
      }),
    };

    // 悬停效果
    if (isHovered) {
      baseStyle.transform = 'scale(1.05)';
      baseStyle.boxShadow = `0 0 15px ${statusColor}40`;
      baseStyle.zIndex = 10;
    }

    // 运行中任务的脉冲效果
    if (isDark && task.status === 'running') {
      baseStyle.animation = 'batchStatusPulse 2s ease-in-out infinite';
      baseStyle.boxShadow = `0 0 10px ${statusColor}40`;
    }

    return baseStyle;
  }, [isDark, theme, isCompact, task.status, statusColor, isHovered, onClick]);

  const iconStyle = useMemo((): CSSProperties => ({
    fontSize: isCompact ? 16 : 20,
    marginBottom: 4,
  }), [isCompact]);

  const statusTextStyle = useMemo((): CSSProperties => ({
    fontSize: isCompact ? 10 : 11,
    fontWeight: 600,
    color: statusColor,
  }), [isCompact, statusColor]);

  const infoTextStyle = useMemo((): CSSProperties => ({
    fontSize: isCompact ? 9 : 10,
    color: theme.textTertiary,
    textAlign: 'center',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    width: '100%',
  }), [isCompact, theme.textTertiary]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  return (
    <div
      className="task-cell"
      style={cellStyle}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      title={`${task.agentName} - ${task.benchmarkName}`}
    >
      <span style={iconStyle}>{statusConfig.icon}</span>
      {!isCompact && (
        <span style={statusTextStyle}>{t(statusConfig.labelKey)}</span>
      )}
      {task.score !== undefined && task.status === 'completed' && (
        <span style={{ ...infoTextStyle, color: theme.neonGreen }}>
          {task.score.toFixed(1)}
        </span>
      )}
    </div>
  );
}, (prev, next) => {
  return prev.task.id === next.task.id && prev.task.status === next.task.status;
});

/**
 * 统计汇总条
 */
const SummaryBar = memo(function SummaryBar({
  tasks,
  isDark,
}: {
  tasks: TaskItem[];
  isDark: boolean;
}) {
  const theme = getBatchTheme(isDark);
  const { t } = useTranslation('batch');

  const stats = useMemo(() => {
    const summary = {
      total: tasks.length,
      pending: 0,
      running: 0,
      completed: 0,
      failed: 0,
      skipped: 0,
    };

    tasks.forEach(task => {
      summary[task.status]++;
    });

    return summary;
  }, [tasks]);

  const barStyle = useMemo((): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '12px 16px',
    background: isDark ? 'rgba(20, 20, 25, 0.8)' : '#fff',
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: isDark ? 0 : 8,
    marginBottom: 16,
    flexWrap: 'wrap',
  }), [isDark, theme]);

  const statItemStyle = useMemo((): CSSProperties => ({
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    fontSize: 13,
    color: theme.textSecondary,
  }), [theme.textSecondary]);

  const statValueStyle = useCallback((color: string): CSSProperties => ({
    fontSize: 16,
    fontWeight: 700,
    color: color,
  }), []);

  return (
    <div style={barStyle}>
      <div style={statItemStyle}>
        <span>{t('stats.total')}:</span>
        <span style={statValueStyle(theme.textPrimary)}>{stats.total}</span>
      </div>
      {stats.running > 0 && (
        <div style={statItemStyle}>
          <span>⚡</span>
          <span>{t('stats.running')}:</span>
          <span style={statValueStyle(theme.statusRunning)}>{stats.running}</span>
        </div>
      )}
      {stats.completed > 0 && (
        <div style={statItemStyle}>
          <span>✅</span>
          <span>{t('stats.completed')}:</span>
          <span style={statValueStyle(theme.statusCompleted)}>{stats.completed}</span>
        </div>
      )}
      {stats.failed > 0 && (
        <div style={statItemStyle}>
          <span>❌</span>
          <span>{t('stats.failed')}:</span>
          <span style={statValueStyle(theme.statusFailed)}>{stats.failed}</span>
        </div>
      )}
      {stats.pending > 0 && (
        <div style={statItemStyle}>
          <span>⏳</span>
          <span>{t('stats.pending')}:</span>
          <span style={statValueStyle(theme.statusPending)}>{stats.pending}</span>
        </div>
      )}
    </div>
  );
});

/**
 * 任务矩阵网格
 * ✅ rerender-memo: 使用 memo 优化性能
 */
export const TaskMatrixGrid = memo(function TaskMatrixGrid({
  tasks,
  onTaskClick,
  columns = 10,
  compact = false,
}: TaskMatrixGridProps) {
  const isDark = useIsDark();

  const containerStyle = useMemo((): CSSProperties => ({
    width: '100%',
  }), []);

  const gridStyle = useMemo((): CSSProperties => {
    const gap = compact ? 8 : 12;
    return {
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fill, minmax(${compact ? 60 : 80}px, 1fr))`,
      gap,
      ...(isDark && {
        '@media (min-width: 1200px)': {
          gridTemplateColumns: `repeat(${columns}, 1fr)`,
        },
      }),
    } as CSSProperties;
  }, [isDark, columns, compact]);

  const handleTaskClick = useCallback((task: TaskItem) => {
    onTaskClick?.(task);
  }, [onTaskClick]);

  return (
    <div style={containerStyle}>
      <SummaryBar tasks={tasks} isDark={isDark} />
      <div style={gridStyle}>
        {tasks.map((task) => (
          <TaskCell
            key={task.id}
            task={task}
            isCompact={compact}
            onClick={() => handleTaskClick(task)}
          />
        ))}
      </div>

      {/* 注入动画 keyframes */}
      {isDark && (
        <style>{`
          @keyframes batchStatusPulse {
            0%, 100% {
              box-shadow: 0 0 5px currentColor, 0 0 10px currentColor;
            }
            50% {
              box-shadow: 0 0 10px currentColor, 0 0 20px currentColor;
            }
          }

          .task-cell {
            content-visibility: auto;
            contain-intrinsic-size: auto 60px;
          }
        `}</style>
      )}
    </div>
  );
}, (prev, next) => {
  // 比较：只在任务列表长度或最后一个任务状态变化时重渲染
  return (
    prev.tasks.length === next.tasks.length &&
    prev.tasks[prev.tasks.length - 1]?.status === next.tasks[next.tasks.length - 1]?.status
  );
});

export default TaskMatrixGrid;
