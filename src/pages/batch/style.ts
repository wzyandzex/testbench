/**
 * Batch 页面样式常量 and Hooks
 * 支持深色模式赛博科技风格
 */

import { useMemo, CSSProperties } from 'react';
import { useIsDark } from '@/theme';
import { getBatchTheme, CLIPPED_CORNER_PATH, DOUBLE_CLIPPED_PATH } from './theme';

// ==================== 保留的原始样式常量 ====================

export const batchPageStyle = {
  container: {
    padding: '32px 48px',
    maxWidth: 1400,
    margin: '0 auto',
  } as const,

  statCard: {
    padding: 24,
    borderRadius: 12,
    border: '1px solid #f0f0f0',
    background: '#fff',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  } as const,

  itemCard: {
    padding: 16,
    borderRadius: 8,
    border: '1px solid #f0f0f0',
    background: '#fff',
    marginBottom: 8,
  } as const,
};

export const batchStatusStyle = {
  pending: { color: '#9ca3af', backgroundColor: '#9ca3af15', border: '1px solid #9ca3af30' },
  running: { color: '#1677ff', backgroundColor: '#1677ff15', border: '1px solid #1677ff30' },
  paused: { color: '#f59e0b', backgroundColor: '#f59e0b15', border: '1px solid #f59e0b30' },
  completed: { color: '#10b981', backgroundColor: '#10b98115', border: '1px solid #10b98130' },
  failed: { color: '#ef4444', backgroundColor: '#ef444415', border: '1px solid #ef444430' },
  cancelled: { color: '#9ca3af', backgroundColor: '#9ca3af15', border: '1px solid #9ca3af30' },
} as const;

export const itemStatusStyle = {
  pending: { color: '#9ca3af' },
  running: { color: '#1677ff' },
  completed: { color: '#10b981' },
  failed: { color: '#ef4444' },
  skipped: { color: '#d1d5db' },
} as const;

// 页面级样式常量（与其他页面保持一致）
export const PAGE_CONTAINER_STYLE = {
  padding: '32px 48px',
  maxWidth: 1600,
  margin: '0 auto',
} as const;

export const PAGE_HEADER_STYLE = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 24,
} as const;

export const PAGE_TITLE_STYLE = {
  margin: 0,
  fontSize: 24,
  fontWeight: 600,
} as const;

export const TIMELINE_STYLE = {
  marginTop: 16,
} as const;

export const EMPTY_STATE_STYLE = {
  padding: 60,
  textAlign: 'center',
  color: '#999',
} as const;

export const STATS_GRID_STYLE = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 16,
  marginBottom: 24,
} as const;

export const STAT_CARD_STYLE = {
  padding: '16px 20px',
  background: '#fff',
  borderRadius: 8,
  border: '1px solid #f0f0f0',
  display: 'flex',
  alignItems: 'center',
  gap: 16,
} as const;

export const STAT_ICON_STYLE = {
  width: 48,
  height: 48,
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
  background: '#f5f5f5',
} as const;

export const STAT_INFO_STYLE = {
  flex: 1,
} as const;

export const STAT_LABEL_STYLE = {
  fontSize: 12,
  color: '#999',
} as const;

export const STAT_VALUE_STYLE = {
  fontSize: 24,
  fontWeight: 600,
} as const;

// ==================== 深色模式赛博科技风格 Hooks ====================

/**
 * 页面容器样式
 * 深色模式：深空黑背景 + 粒子动画
 */
export const useBatchPageContainerStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = getBatchTheme(isDark);

  return useMemo(() => ({
    position: 'relative' as const,
    minHeight: '100vh',
    background: isDark ? theme.background : '#f5f5f5',
    padding: '32px 48px',
    maxWidth: 1600,
    margin: '0 auto',
    ...(isDark && {
      backgroundImage: theme.gridPattern,
      backgroundSize: '40px 40px',
    }),
  }), [isDark, theme]);
};

/**
 * 网格容器样式
 * 用于批量任务列表的网格布局
 */
export const useBatchGridStyle = (): CSSProperties => {
  const isDark = useIsDark();

  return useMemo(() => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
    gap: 20,
    position: 'relative' as const,
    zIndex: 1,
    ...(isDark && {
      '@media (max-width: 768px)': {
        gridTemplateColumns: '1fr',
      },
    }),
  }), [isDark]);
};

/**
 * 批量任务瓷砖样式
 * 六边形切角效果 + 霓虹边框
 */
export const useBatchTileStyle = (status: string, isHovered: boolean): CSSProperties => {
  const isDark = useIsDark();
  const theme = getBatchTheme(isDark);

  return useMemo(() => {
    const baseStyle: CSSProperties = {
      position: 'relative' as const,
      padding: 20,
      borderRadius: isDark ? 0 : 12,
      background: theme.cardBg,
      border: `1px solid ${theme.cardBorder}`,
      boxShadow: isHovered ? theme.cardHoverShadow : theme.cardShadow,
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
      overflow: 'hidden' as const,
    };

    if (isDark) {
      // 赛博风格切角
      baseStyle.clipPath = CLIPPED_CORNER_PATH;

      // 运行中任务的特殊效果
      if (status === 'running') {
        baseStyle.boxShadow = `0 0 20px rgba(0, 212, 255, 0.2)`;
      }

      // 悬停效果
      if (isHovered) {
        baseStyle.transform = 'scale(1.02)';
      }
    } else {
      if (isHovered) {
        baseStyle.transform = 'translateY(-2px)';
      }
    }

    return baseStyle;
  }, [isDark, theme, status, isHovered]);
};

/**
 * 霓虹边框高光线样式
 * 用于深色模式下的顶部高光效果
 */
export const useNeonTopBorder = (color: string = '#00d4ff'): CSSProperties => {
  const isDark = useIsDark();

  return useMemo(() => ({
    position: 'absolute' as const,
    top: 0,
    left: 20,
    right: 20,
    height: 2,
    background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
    opacity: isDark ? 0.6 : 0,
    transition: 'opacity 0.3s',
  }), [isDark, color]);
};

/**
 * 进度环样式
 */
export const useProgressRingStyle = (size: number = 80, strokeWidth: number = 6): {
  container: CSSProperties;
  svg: CSSProperties;
  circle: CSSProperties;
  text: CSSProperties;
} => {
  const isDark = useIsDark();
  const theme = getBatchTheme(isDark);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  return useMemo(() => ({
    container: {
      position: 'relative' as const,
      width: size,
      height: size,
    },
    svg: {
      transform: 'rotate(-90deg)',
      width: size,
      height: size,
    },
    circle: {
      fill: 'none',
      strokeWidth,
      strokeLinecap: 'round' as const,
      transition: 'stroke-dashoffset 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
    },
    text: {
      position: 'absolute' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: size / 4,
      fontWeight: 600,
      color: theme.textPrimary,
    },
  }), [isDark, theme, size, strokeWidth, circumference]);
};

/**
 * 全息卡片样式
 * 用于统计面板和详情页
 */
export const useHolographicCardStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = getBatchTheme(isDark);

  return useMemo(() => ({
    position: 'relative' as const,
    background: isDark
      ? 'linear-gradient(135deg, rgba(20, 20, 25, 0.9), rgba(30, 30, 40, 0.8))'
      : theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: isDark ? 0 : 12,
    padding: 24,
    boxShadow: theme.cardShadow,
    ...(isDark && {
      backdropFilter: 'blur(10px)',
      clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 0 100%)',
    }),
  }), [isDark, theme]);
};

/**
 * 全息日志查看器样式
 */
export const useLogViewerStyle = (maxHeight: number = 400): CSSProperties => {
  const isDark = useIsDark();
  const theme = getBatchTheme(isDark);

  return useMemo(() => ({
    position: 'relative' as const,
    background: isDark ? '#0d0d12' : '#1e1e1e',
    border: `1px solid ${isDark ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
    borderRadius: isDark ? 0 : 8,
    padding: 16,
    maxHeight,
    overflow: 'auto',
    fontFamily: 'monospace',
    fontSize: 12,
    lineHeight: 1.6,
    ...(isDark && {
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 212, 255, 0.03) 2px, rgba(0, 212, 255, 0.03) 4px)',
        pointerEvents: 'none' as const,
      },
    }),
  }), [isDark, theme, maxHeight]);
};

/**
 * 任务矩阵单元格样式
 */
export const useTaskCellStyles = (status: string): CSSProperties => {
  const isDark = useIsDark();
  const theme = getBatchTheme(isDark);

  return useMemo(() => {
    const colors: Record<string, string> = {
      pending: theme.statusPending,
      running: theme.statusRunning,
      completed: theme.statusCompleted,
      failed: theme.statusFailed,
      skipped: theme.statusCancelled,
    };

    return {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 12,
      border: `1px solid ${theme.cardBorder}`,
      borderRadius: isDark ? 0 : 6,
      background: theme.cardBg,
      cursor: 'pointer',
      transition: 'all 0.2s',
      color: colors[status] || theme.textSecondary,
      ...(isDark && {
        clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
      }),
      '&:hover': {
        transform: 'scale(1.05)',
        boxShadow: `0 0 15px ${colors[status]}40`,
      },
      contentVisibility: 'auto',
      containIntrinsicSize: 'auto 60px',
    } as CSSProperties;
  }, [isDark, theme, status]);
};

/**
 * 状态徽章样式
 */
export const useStatusBadgeStyle = (status: string): CSSProperties => {
  const isDark = useIsDark();
  const theme = getBatchTheme(isDark);

  return useMemo(() => {
    const colors: Record<string, { color: string; bg: string }> = {
      pending: { color: theme.statusPending, bg: theme.statusPendingBg },
      running: { color: theme.statusRunning, bg: theme.statusRunningBg },
      paused: { color: theme.statusPaused, bg: theme.statusPausedBg },
      completed: { color: theme.statusCompleted, bg: theme.statusCompletedBg },
      failed: { color: theme.statusFailed, bg: theme.statusFailedBg },
      cancelled: { color: theme.statusCancelled, bg: theme.statusCancelledBg },
    };

    const config = colors[status] || colors.pending;

    return {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 12px',
      borderRadius: isDark ? 0 : 20,
      fontSize: 13,
      fontWeight: 500,
      color: config.color,
      background: config.bg,
      border: isDark ? `1px solid ${config.color}40` : 'none',
      ...(isDark && status === 'running' && {
        animation: 'batchStatusPulse 2s ease-in-out infinite',
      }),
    } as CSSProperties;
  }, [isDark, theme, status]);
};

/**
 * 过滤按钮样式
 */
export const useFilterButtonStyle = (active: boolean, color: string): CSSProperties => {
  const isDark = useIsDark();

  return useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 18px',
    borderRadius: isDark ? 0 : 8,
    fontSize: 14,
    fontWeight: 500,
    border: `1px solid ${active ? color : 'rgba(255, 255, 255, 0.1)'}`,
    background: active ? `${color}20` : 'transparent',
    color: active ? color : (isDark ? '#9ca3af' : '#6b7280'),
    cursor: 'pointer',
    transition: 'all 0.2s',
    ...(isDark && !active && {
      clipPath: CLIPPED_CORNER_PATH,
    }),
    '&:hover': {
      background: active ? `${color}30` : 'rgba(255, 255, 255, 0.05)',
    },
  } as CSSProperties), [isDark, active, color]);
};

/**
 * Agent 性能卡片样式
 */
export const useAgentCardStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = getBatchTheme(isDark);

  return useMemo(() => ({
    position: 'relative' as const,
    padding: 20,
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: isDark ? 0 : 12,
    boxShadow: theme.cardShadow,
    transition: 'all 0.3s',
    overflow: 'hidden' as const,
    ...(isDark && {
      clipPath: DOUBLE_CLIPPED_PATH,
    }),
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: 4,
      height: '100%',
      background: theme.gradientPrimary,
    },
  } as CSSProperties), [isDark, theme]);
};

/**
 * 详情页头部样式
 */
export const useDetailHeaderStyle = (status: string): CSSProperties => {
  const isDark = useIsDark();
  const theme = getBatchTheme(isDark);

  return useMemo(() => {
    const statusColors: Record<string, string> = {
      pending: theme.statusPending,
      running: theme.statusRunning,
      paused: theme.statusPaused,
      completed: theme.statusCompleted,
      failed: theme.statusFailed,
      cancelled: theme.statusCancelled,
    };

    const color = statusColors[status] || theme.neonCyan;

    return {
      position: 'relative' as const,
      padding: '24px 32px',
      background: isDark
        ? `linear-gradient(135deg, ${color}10, transparent)`
        : theme.cardBg,
      border: `1px solid ${isDark ? `${color}40` : theme.cardBorder}`,
      borderRadius: isDark ? 0 : 12,
      marginBottom: 24,
      ...(isDark && {
        clipPath: 'polygon(0 0, calc(100% - 24px) 0, 100% 24px, 100% 100%, 0 100%)',
        '&::after': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: `linear-gradient(90deg, ${color}, transparent)`,
        },
      }),
    } as CSSProperties;
  }, [isDark, theme, status]);
};

/**
 * 获取全局样式字符串
 * 用于注入动画 keyframes
 */
export const getGlobalStyles = (isDark: boolean): string => {
  if (!isDark) return '';

  return `
    @keyframes batchStatusPulse {
      0%, 100% {
        box-shadow: 0 0 5px #00d4ff, 0 0 10px #00d4ff;
      }
      50% {
        box-shadow: 0 0 15px #00d4ff, 0 0 25px #00d4ff, 0 0 35px #00d4ff;
      }
    }

    @keyframes scanline {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(100%); }
    }

    @keyframes staggeredFadeIn {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes flashHighlight {
      0% { background: rgba(0, 212, 255, 0.3); }
      100% { background: transparent; }
    }

    @keyframes hologramFlicker {
      0%, 100% { opacity: 1; }
      92% { opacity: 1; }
      93% { opacity: 0.8; }
      94% { opacity: 1; }
      96% { opacity: 0.9; }
      97% { opacity: 1; }
    }

    /* 滚动条样式 */
    ::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }

    ::-webkit-scrollbar-track {
      background: #141419;
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb {
      background: rgba(0, 212, 255, 0.3);
      border-radius: 4px;
    }

    ::-webkit-scrollbar-thumb:hover {
      background: rgba(0, 212, 255, 0.5);
    }

    /* 任务单元格 */
    .task-cell {
      content-visibility: auto;
      contain-intrinsic-size: auto 60px;
    }

    /* 日志行 */
    .log-line {
      content-visibility: auto;
      contain-intrinsic-size: auto 24px;
    }
  `;
};

// 导出类型
export interface BatchTileProps {
  id: string;
  name: string;
  status: string;
  progress: number;
  total: number;
  failed: number;
  onClick?: () => void;
}

export interface StatusFilterOption {
  label: string;
  value: string;
  icon: string;
  color: string;
}
