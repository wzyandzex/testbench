/**
 * Scheduler Page Theme Configuration
 * "Temporal Command Center" - 赛博时空指挥中心主题
 *
 * 深色模式：赛博朋克时空指挥台 - 霓虹时钟、全息时间轴、脉冲信号
 * 浅色模式：现代简约时间管理中心 - 干净、通透、精确
 */

export interface SchedulerTheme {
  // 页面背景
  background: string;
  backgroundPattern?: string;

  // 卡片样式
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  cardHoverShadow: string;

  // 文字颜色
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;

  // 状态颜色
  statusActive: string;
  statusActiveBg: string;
  statusActiveGlow: string;
  statusPaused: string;
  statusPausedBg: string;
  statusDisabled: string;
  statusDisabledBg: string;

  // 强调色 - 霓虹系列
  accentCyan: string;
  accentAmber: string;
  accentMagenta: string;
  accentPurple: string;

  // 渐变
  gradientPrimary: string;
  gradientSecondary: string;
  gradientSuccess: string;

  // 特殊效果
  neonGlow: string;
  pulseAnimation: string;
  glassBg: string;
  glassBorder: string;

  // 时间轴相关
  timelineTrack: string;
  timelineProgress: string;
  currentTime: string;

  // 网格装饰
  gridColor: string;
  scanlineColor: string;
}

export const SCHEDULER_THEME: Record<'light' | 'dark', SchedulerTheme> = {
  // ==================== 深色模式 - 赛博时空指挥台 ====================
  dark: {
    // 深空背景
    background: '#0a0e27',
    backgroundPattern: `
      radial-gradient(ellipse at 20% 20%, rgba(99, 102, 241, 0.1) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 50%),
      linear-gradient(180deg, #0a0e27 0%, #1a1f3a 100%)
    `,

    // 全息卡片
    cardBg: 'rgba(26, 31, 58, 0.6)',
    cardBorder: 'rgba(99, 102, 241, 0.3)',
    cardShadow: '0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
    cardHoverShadow: '0 12px 48px rgba(99, 102, 241, 0.2), inset 0 1px 0 rgba(255, 255, 255, 0.1)',

    // 文字
    textPrimary: '#e0e7ff',
    textSecondary: '#94a3b8',
    textTertiary: '#64748b',

    // 状态颜色 - 霓虹风格
    statusActive: '#00f5ff',
    statusActiveBg: 'rgba(0, 245, 255, 0.15)',
    statusActiveGlow: '0 0 20px rgba(0, 245, 255, 0.5), 0 0 40px rgba(0, 245, 255, 0.3)',
    statusPaused: '#fbbf24',
    statusPausedBg: 'rgba(251, 191, 36, 0.15)',
    statusDisabled: '#6b7280',
    statusDisabledBg: 'rgba(107, 114, 128, 0.15)',

    // 霓虹强调色
    accentCyan: '#00f5ff',
    accentAmber: '#fbbf24',
    accentMagenta: '#f472b6',
    accentPurple: '#a855f7',

    // 渐变
    gradientPrimary: 'linear-gradient(135deg, #00f5ff 0%, #a855f7 100%)',
    gradientSecondary: 'linear-gradient(135deg, #fbbf24 0%, #f472b6 100%)',
    gradientSuccess: 'linear-gradient(135deg, #10b981 0%, #00f5ff 100%)',

    // 特殊效果
    neonGlow: '0 0 20px rgba(0, 245, 255, 0.4), 0 0 40px rgba(0, 245, 255, 0.2)',
    pulseAnimation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    glassBg: 'rgba(15, 23, 42, 0.6)',
    glassBorder: 'rgba(99, 102, 241, 0.2)',

    // 时间轴
    timelineTrack: 'rgba(148, 163, 184, 0.2)',
    timelineProgress: '#00f5ff',
    currentTime: '#f472b6',

    // 网格和扫描线
    gridColor: 'rgba(99, 102, 241, 0.05)',
    scanlineColor: 'rgba(0, 245, 255, 0.03)',
  },

  // ==================== 浅色模式 - 现代时间管理中心 ====================
  light: {
    background: '#f8fafc',

    cardBg: '#ffffff',
    cardBorder: 'rgba(148, 163, 184, 0.2)',
    cardShadow: '0 2px 12px rgba(0, 0, 0, 0.08)',
    cardHoverShadow: '0 4px 24px rgba(148, 163, 184, 0.15)',

    textPrimary: '#1e293b',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',

    statusActive: '#0891b2',
    statusActiveBg: 'rgba(8, 145, 178, 0.1)',
    statusActiveGlow: '0 0 0px transparent',
    statusPaused: '#f59e0b',
    statusPausedBg: 'rgba(245, 158, 11, 0.1)',
    statusDisabled: '#94a3b8',
    statusDisabledBg: 'rgba(148, 163, 184, 0.1)',

    accentCyan: '#0891b2',
    accentAmber: '#f59e0b',
    accentMagenta: '#ec4899',
    accentPurple: '#8b5cf6',

    gradientPrimary: 'linear-gradient(135deg, #0891b2 0%, #8b5cf6 100%)',
    gradientSecondary: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 100%)',
    gradientSuccess: 'linear-gradient(135deg, #10b981 0%, #0891b2 100%)',

    neonGlow: 'none',
    pulseAnimation: 'none',
    glassBg: 'rgba(255, 255, 255, 0.8)',
    glassBorder: 'rgba(148, 163, 184, 0.3)',

    timelineTrack: 'rgba(148, 163, 184, 0.3)',
    timelineProgress: '#0891b2',
    currentTime: '#ec4899',

    gridColor: 'rgba(148, 163, 184, 0.05)',
    scanlineColor: 'transparent',
  },
};

// 获取主题样式
export const getSchedulerTheme = (isDark: boolean): SchedulerTheme => {
  return isDark ? SCHEDULER_THEME.dark : SCHEDULER_THEME.light;
};

// 动画关键帧
export const SCHEDULER_ANIMATIONS = {
  // 脉冲效果 - 用于活跃状态
  pulse: `
    @keyframes scheduler-pulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.8;
        transform: scale(1.02);
      }
    }
  `,

  // 霓虹边框闪烁
  neonBorder: `
    @keyframes neon-border {
      0%, 100% {
        border-color: rgba(0, 245, 255, 0.3);
        box-shadow: 0 0 10px rgba(0, 245, 255, 0.2);
      }
      50% {
        border-color: rgba(0, 245, 255, 0.8);
        box-shadow: 0 0 20px rgba(0, 245, 255, 0.4), 0 0 30px rgba(0, 245, 255, 0.2);
      }
    }
  `,

  // 时间流动画
  timeFlow: `
    @keyframes time-flow {
      0% {
        background-position: 0% 50%;
      }
      100% {
        background-position: 100% 50%;
      }
    }
  `,

  // 扫描线效果
  scanline: `
    @keyframes scanline {
      0% {
        transform: translateY(-100%);
        opacity: 0;
      }
      50% {
        opacity: 1;
      }
      100% {
        transform: translateY(100vh);
        opacity: 0;
      }
    }
  `,

  // 卡片进入
  cardEnter: `
    @keyframes card-enter {
      from {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `,

  // 旋转动画
  rotate: `
    @keyframes rotate {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  `,

  // 数字跳动
  numberBounce: `
    @keyframes number-bounce {
      0% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-5px);
      }
      100% {
        transform: translateY(0);
      }
    }
  `,

  // 进度条填充
  progressFill: `
    @keyframes progress-fill {
      from {
        transform: scaleX(0);
      }
      to {
        transform: scaleX(1);
      }
    }
  `,
};

// 获取全局样式（用于动画）
export const getGlobalStyles = (isDark: boolean): string => {
  if (!isDark) return '';

  return `
    ${SCHEDULER_ANIMATIONS.pulse}
    ${SCHEDULER_ANIMATIONS.neonBorder}
    ${SCHEDULER_ANIMATIONS.timeFlow}
    ${SCHEDULER_ANIMATIONS.scanline}
    ${SCHEDULER_ANIMATIONS.cardEnter}
    ${SCHEDULER_ANIMATIONS.rotate}
    ${SCHEDULER_ANIMATIONS.numberBounce}
    ${SCHEDULER_ANIMATIONS.progressFill}

    .scheduler-neon-border {
      animation: neon-border 2s ease-in-out infinite;
    }

    .scheduler-pulse {
      animation: scheduler-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
    }

    .scheduler-card-enter {
      animation: card-enter 0.4s ease-out forwards;
    }

    .scheduler-rotate {
      animation: rotate 20s linear infinite;
    }
  `;
};

// 状态配置扩展 - 增强版
export const STATUS_CONFIG = {
  active: {
    icon: '●',
    color: '#00f5ff',
    bgColor: 'rgba(0, 245, 255, 0.15)',
    glow: '0 0 20px rgba(0, 245, 255, 0.5)',
    text: '运行中',
    animation: 'scheduler-pulse',
  },
  paused: {
    icon: '❚❚',
    color: '#fbbf24',
    bgColor: 'rgba(251, 191, 36, 0.15)',
    glow: 'none',
    text: '已暂停',
    animation: 'none',
  },
  disabled: {
    icon: '○',
    color: '#6b7280',
    bgColor: 'rgba(107, 114, 128, 0.15)',
    glow: 'none',
    text: '已禁用',
    animation: 'none',
  },
} as const;
