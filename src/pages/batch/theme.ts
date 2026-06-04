/**
 * Batch page theme config
 * Light mode: clean minimalist
 * Dark mode: cyber tech command console - deep, neon, dynamic
 */

import type { CSSProperties } from 'react';
import i18next from 'i18next';

export interface BatchTheme {
  // Page background
  background: string;
  // Card background
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  cardHoverShadow: string;
  // Text colors
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  // Status colors
  statusPending: string;
  statusRunning: string;
  statusPaused: string;
  statusCompleted: string;
  statusFailed: string;
  statusCancelled: string;
  // Status background colors
  statusPendingBg: string;
  statusRunningBg: string;
  statusPausedBg: string;
  statusCompletedBg: string;
  statusFailedBg: string;
  statusCancelledBg: string;
  // Neon effects (dark mode)
  neonCyan: string;
  neonPurple: string;
  neonGreen: string;
  neonRed: string;
  neonAmber: string;
  neonBorder?: string;
  glow?: string;
  // Grid texture (dark mode)
  gridPattern?: string;
  // Gradients
  gradientPrimary: string;
  gradientSecondary: string;
  gradientSuccess: string;
  gradientDanger: string;
}

export const BATCH_THEME: Record<'light' | 'dark', BatchTheme> = {
  // ==================== 浅色模式 ====================
  light: {
    // 页面背景
    background: '#f5f5f5',

    // 卡片背景
    cardBg: '#ffffff',
    cardBorder: 'rgba(0,0,0,0.08)',
    cardShadow: '0 2px 8px rgba(0,0,0,0.06)',
    cardHoverShadow: '0 4px 16px rgba(0,0,0,0.1)',

    // 文字颜色
    textPrimary: '#1a1a2e',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',

    // 状态颜色
    statusPending: '#9ca3af',
    statusRunning: '#1677ff',
    statusPaused: '#f59e0b',
    statusCompleted: '#10b981',
    statusFailed: '#ef4444',
    statusCancelled: '#6b7280',

    // 状态背景色
    statusPendingBg: 'rgba(156, 163, 175, 0.1)',
    statusRunningBg: 'rgba(22, 119, 255, 0.1)',
    statusPausedBg: 'rgba(245, 158, 11, 0.1)',
    statusCompletedBg: 'rgba(16, 185, 129, 0.1)',
    statusFailedBg: 'rgba(239, 68, 68, 0.1)',
    statusCancelledBg: 'rgba(107, 114, 128, 0.1)',

    // 霓虹色 (浅色模式下使用柔和版本)
    neonCyan: '#00b8e6',
    neonPurple: '#7c3aed',
    neonGreen: '#10b981',
    neonRed: '#ef4444',
    neonAmber: '#f59e0b',

    // 渐变
    gradientPrimary: 'linear-gradient(135deg, #1677ff 0%, #7c3aed 100%)',
    gradientSecondary: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
    gradientSuccess: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    gradientDanger: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
  },

  // ==================== 深色模式 - 赛博科技指挥台 ====================
  dark: {
    // 页面背景 - 深空黑
    background: '#0a0a0f',

    // 卡片背景 - 深灰卡片
    cardBg: '#141419',
    cardBorder: 'rgba(0, 212, 255, 0.2)',
    cardShadow: '0 4px 20px rgba(0, 212, 255, 0.1)',
    cardHoverShadow: '0 8px 30px rgba(0, 212, 255, 0.25)',

    // 文字颜色
    textPrimary: '#e5e7eb',
    textSecondary: '#9ca3af',
    textTertiary: '#6b7280',

    // 状态颜色 - 霓虹效果
    statusPending: '#6b7280',
    statusRunning: '#00d4ff',
    statusPaused: '#f59e0b',
    statusCompleted: '#00ffaa',
    statusFailed: '#ff4466',
    statusCancelled: '#9ca3af',

    // 状态背景色 - 深色模式专用
    statusPendingBg: 'rgba(107, 114, 128, 0.15)',
    statusRunningBg: 'rgba(0, 212, 255, 0.15)',
    statusPausedBg: 'rgba(245, 158, 11, 0.15)',
    statusCompletedBg: 'rgba(0, 255, 170, 0.15)',
    statusFailedBg: 'rgba(255, 68, 102, 0.15)',
    statusCancelledBg: 'rgba(156, 163, 175, 0.15)',

    // 霓虹色 - 深色模式专用
    neonCyan: '#00d4ff',
    neonPurple: '#7c3aed',
    neonGreen: '#00ffaa',
    neonRed: '#ff4466',
    neonAmber: '#f59e0b',

    // 霓虹边框
    neonBorder: 'rgba(0, 212, 255, 0.5)',

    // 辉光效果
    glow: '0 0 20px rgba(0, 212, 255, 0.3)',

    // 网格纹理
    gridPattern: 'linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)',

    // 渐变 - 赛博朋克风
    gradientPrimary: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
    gradientSecondary: 'linear-gradient(135deg, #ff4466 0%, #ff9500 100%)',
    gradientSuccess: 'linear-gradient(135deg, #00ffaa 0%, #00d4ff 100%)',
    gradientDanger: 'linear-gradient(135deg, #ff4466 0%, #dc2626 100%)',
  },
};

// Status config — labels resolved via i18next at runtime
export const BATCH_STATUS_CONFIG = {
  pending: {
    icon: '⏳',
    colorKey: 'statusPending' as keyof BatchTheme,
    bgKey: 'statusPendingBg' as keyof BatchTheme,
    get label() { return i18next.t('batch:statusLabel.pending'); },
  },
  running: {
    icon: '▶️',
    colorKey: 'statusRunning' as keyof BatchTheme,
    bgKey: 'statusRunningBg' as keyof BatchTheme,
    get label() { return i18next.t('batch:statusLabel.running'); },
  },
  paused: {
    icon: '⏸️',
    colorKey: 'statusPaused' as keyof BatchTheme,
    bgKey: 'statusPausedBg' as keyof BatchTheme,
    get label() { return i18next.t('batch:statusLabel.paused'); },
  },
  completed: {
    icon: '✅',
    colorKey: 'statusCompleted' as keyof BatchTheme,
    bgKey: 'statusCompletedBg' as keyof BatchTheme,
    get label() { return i18next.t('batch:statusLabel.completed'); },
  },
  failed: {
    icon: '❌',
    colorKey: 'statusFailed' as keyof BatchTheme,
    bgKey: 'statusFailedBg' as keyof BatchTheme,
    get label() { return i18next.t('batch:statusLabel.failed'); },
  },
  cancelled: {
    icon: '⛔',
    colorKey: 'statusCancelled' as keyof BatchTheme,
    bgKey: 'statusCancelledBg' as keyof BatchTheme,
    get label() { return i18next.t('batch:statusLabel.cancelled'); },
  },
} as const;

export type BatchStatus = keyof typeof BATCH_STATUS_CONFIG;

// 获取主题样式的辅助函数
export const getBatchTheme = (isDark: boolean): BatchTheme =>
  isDark ? BATCH_THEME.dark : BATCH_THEME.light;

// 获取状态颜色
export const getStatusColor = (isDark: boolean, status: BatchStatus): string => {
  const theme = getBatchTheme(isDark);
  const config = BATCH_STATUS_CONFIG[status];
  return theme[config.colorKey] as string;
};

// 获取状态背景色
export const getStatusBg = (isDark: boolean, status: BatchStatus): string => {
  const theme = getBatchTheme(isDark);
  const config = BATCH_STATUS_CONFIG[status];
  return theme[config.bgKey] as string;
};

// 动画 keyframes (用于在组件中注入)
export const BATCH_ANIMATIONS = {
  // 状态脉冲动画 - 运行中任务
  statusPulse: `
    @keyframes batchStatusPulse {
      0%, 100% {
        box-shadow: 0 0 5px #00d4ff, 0 0 10px #00d4ff;
      }
      50% {
        box-shadow: 0 0 15px #00d4ff, 0 0 25px #00d4ff, 0 0 35px #00d4ff;
      }
    }
  `,

  // 霓虹边框动画
  neonBorder: `
    @keyframes neonBorderPulse {
      0%, 100% {
        border-color: rgba(0, 212, 255, 0.3);
        box-shadow: 0 0 10px rgba(0, 212, 255, 0.2);
      }
      50% {
        border-color: rgba(0, 212, 255, 0.6);
        box-shadow: 0 0 20px rgba(0, 212, 255, 0.4);
      }
    }
  `,

  // 扫描线动画 - 用于日志查看器
  scanline: `
    @keyframes scanline {
      0% {
        transform: translateY(-100%);
      }
      100% {
        transform: translateY(100%);
      }
    }
  `,

  // 闪烁动画 - 新日志高亮
  flash: `
    @keyframes flashHighlight {
      0% {
        background: rgba(0, 212, 255, 0.3);
      }
      100% {
        background: transparent;
      }
    }
  `,

  // 交错淡入动画 - 网格瓷砖入场
  staggeredFadeIn: `
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
  `,

  // 3D 悬停效果
  tileHover: `
    @keyframes tileHover {
      0% {
        transform: scale(1);
      }
      100% {
        transform: scale(1.02);
      }
    }
  `,

  // 进度环动画
  progressRing: `
    @keyframes progressRingPulse {
      0%, 100% {
        filter: drop-shadow(0 0 2px currentColor);
      }
      50% {
        filter: drop-shadow(0 0 6px currentColor);
      }
    }
  `,

  // 全息面板闪烁
  hologramFlicker: `
    @keyframes hologramFlicker {
      0%, 100% {
        opacity: 1;
      }
      92% {
        opacity: 1;
      }
      93% {
        opacity: 0.8;
      }
      94% {
        opacity: 1;
      }
      96% {
        opacity: 0.9;
      }
      97% {
        opacity: 1;
      }
    }
  `,

  // 数据流动动画
  dataFlow: `
    @keyframes dataFlow {
      0% {
        background-position: 0% 50%;
      }
      100% {
        background-position: 200% 50%;
      }
    }
  `,

  // 发光脉冲
  glowPulse: `
    @keyframes glowPulse {
      0%, 100% {
        opacity: 0.5;
      }
      50% {
        opacity: 1;
      }
    }
  `,
} as const;

// 赛博风格切角 clip-path
export const CLIPPED_CORNER_PATH = 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% 100%, 0 100%)';
export const DOUBLE_CLIPPED_PATH = 'polygon(0 0, calc(100% - 20px) 0, 100% 20px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)';

// 网格布局配置
export const GRID_LAYOUTS = {
  list: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(400px, 1fr))',
    gap: 20,
  },
  dense: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 16,
  },
  compact: {
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 12,
  },
} as const;

// 获取卡片样式
export const getCardStyle = (isDark: boolean): CSSProperties => {
  const theme = getBatchTheme(isDark);

  return {
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    boxShadow: theme.cardShadow,
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  };
};

// 获取霓虹边框样式（深色模式）
// Note: CSSProperties doesn't support pseudo-selectors, so this returns a simpler style
export const getNeonBorderStyles = (isDark: boolean, _color: string = '#00d4ff'): CSSProperties => {
  if (!isDark) return {};

  return {
    position: 'relative' as const,
  };
};
