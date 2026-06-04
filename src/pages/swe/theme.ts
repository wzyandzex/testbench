/**
 * SWE page theme - "Code Terminal Command Center"
 * Light mode: IDE light theme - clean, focused, code-friendly
 * Dark mode: cyber code terminal - syntax highlight, debug aesthetic, neon
 */

import i18next from 'i18next';

export interface SWETheme {
  // 页面背景
  background: string;
  // 卡片背景
  cardBg: string;
  cardBorder: string;
  cardShadow: string;
  cardHoverShadow: string;
  // 文字颜色
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  // 语法高亮颜色（SWE 特有）
  syntaxKeyword: string;
  syntaxString: string;
  syntaxNumber: string;
  syntaxFunction: string;
  syntaxVariable: string;
  syntaxComment: string;
  syntaxClass: string;
  // 状态颜色
  statusPending: string;
  statusRunning: string;
  statusFixing: string;
  statusTesting: string;
  statusCompleted: string;
  statusFailed: string;
  statusCancelled: string;
  // 状态背景色
  statusPendingBg: string;
  statusRunningBg: string;
  statusFixingBg: string;
  statusTestingBg: string;
  statusCompletedBg: string;
  statusFailedBg: string;
  // 强调色
  accent: string;
  accentHover: string;
  accentBg: string;
  // 边框
  border: string;
  borderLight: string;
  // 渐变
  gradientPrimary: string;
  gradientSecondary: string;
  // 霓虹效果 (深色模式)
  neonBorder?: string;
  glow?: string;
  bugGlow?: string;
  codeGlow?: string;
  // 网格纹理 (深色模式)
  gridPattern?: string;
  // 代码雨效果
  codeRainColor?: string;
}

export const SWE_THEME: Record<'light' | 'dark', SWETheme> = {
  // ==================== 浅色模式 - IDE 浅色主题 ====================
  light: {
    // 页面背景 - 温暖的浅色
    background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 50%, #dee2e6 100%)',

    // 卡片背景 - 纯白
    cardBg: '#ffffff',
    cardBorder: 'rgba(0,0,0,0.08)',
    cardShadow: '0 2px 8px rgba(0,0,0,0.06)',
    cardHoverShadow: '0 4px 16px rgba(0,0,0,0.1)',

    // 文字颜色
    textPrimary: '#212529',
    textSecondary: '#6c757d',
    textTertiary: '#adb5bd',

    // 语法高亮颜色 - 浅色主题
    syntaxKeyword: '#af00db',
    syntaxString: '#098658',
    syntaxNumber: '#b5200d',
    syntaxFunction: '#795e26',
    syntaxVariable: '#001080',
    syntaxComment: '#008000',
    syntaxClass: '#267f99',

    // 状态颜色 - 柔和自然
    statusPending: '#6c757d',
    statusRunning: '#0d6efd',
    statusFixing: '#fd7e14',
    statusTesting: '#6f42c1',
    statusCompleted: '#198754',
    statusFailed: '#dc3545',
    statusCancelled: '#6c757d',

    // 状态背景色
    statusPendingBg: 'rgba(108, 117, 125, 0.1)',
    statusRunningBg: 'rgba(13, 110, 253, 0.1)',
    statusFixingBg: 'rgba(253, 126, 20, 0.1)',
    statusTestingBg: 'rgba(111, 66, 193, 0.1)',
    statusCompletedBg: 'rgba(25, 135, 84, 0.1)',
    statusFailedBg: 'rgba(220, 53, 69, 0.1)',

    // 强调色 - 代码蓝
    accent: '#0d6efd',
    accentHover: '#0b5ed7',
    accentBg: 'rgba(13, 110, 253, 0.1)',

    // 边框
    border: 'rgba(0,0,0,0.1)',
    borderLight: 'rgba(0,0,0,0.05)',

    // 渐变
    gradientPrimary: 'linear-gradient(135deg, #0d6efd 0%, #6f42c1 100%)',
    gradientSecondary: 'linear-gradient(135deg, #fd7e14 0%, #dc3545 100%)',
  },

  // ==================== 深色模式 - 赛博代码终端 ====================
  dark: {
    // 页面背景 - GitHub Dark Dim 风格
    background: '#0d1117',

    // 卡片背景 - 深灰
    cardBg: '#161b22',
    cardBorder: 'rgba(139, 233, 253, 0.2)',
    cardShadow: '0 4px 20px rgba(139, 233, 253, 0.1)',
    cardHoverShadow: '0 8px 30px rgba(0, 212, 255, 0.2)',

    // 文字颜色
    textPrimary: '#e6edf3',
    textSecondary: '#8b949e',
    textTertiary: '#6e7681',

    // 语法高亮颜色 - 深色主题（Dracula/One Dark 风格）
    syntaxKeyword: '#ff79c6',
    syntaxString: '#f1fa8c',
    syntaxNumber: '#bd93f9',
    syntaxFunction: '#50fa7b',
    syntaxVariable: '#8be9fd',
    syntaxComment: '#6272a4',
    syntaxClass: '#ff79c6',

    // 状态颜色 - 霓虹效果
    statusPending: '#6b7280',
    statusRunning: '#8be9fd',
    statusFixing: '#ffb86c',
    statusTesting: '#bd93f9',
    statusCompleted: '#50fa7b',
    statusFailed: '#ff5555',
    statusCancelled: '#6b7280',

    // 状态背景色 - 带透明度
    statusPendingBg: 'rgba(107, 114, 128, 0.15)',
    statusRunningBg: 'rgba(139, 233, 253, 0.15)',
    statusFixingBg: 'rgba(255, 184, 108, 0.15)',
    statusTestingBg: 'rgba(189, 147, 249, 0.15)',
    statusCompletedBg: 'rgba(80, 250, 123, 0.15)',
    statusFailedBg: 'rgba(255, 85, 85, 0.15)',

    // 强调色 - 霓虹青
    accent: '#8be9fd',
    accentHover: '#70d4e0',
    accentBg: 'rgba(139, 233, 253, 0.15)',

    // 边框
    border: 'rgba(255,255,255,0.1)',
    borderLight: 'rgba(255,255,255,0.05)',

    // 渐变 - 赛朋克风
    gradientPrimary: 'linear-gradient(135deg, #8be9fd 0%, #bd93f9 100%)',
    gradientSecondary: 'linear-gradient(135deg, #ff5555 0%, #ffb86c 100%)',

    // 霓虹边框
    neonBorder: 'rgba(139, 233, 253, 0.5)',

    // 辉光效果
    glow: '0 0 20px rgba(139, 233, 253, 0.3)',
    bugGlow: '0 0 20px rgba(255, 85, 85, 0.5)',
    codeGlow: '0 0 15px rgba(139, 233, 253, 0.3)',

    // 网格纹理
    gridPattern: 'linear-gradient(rgba(139, 233, 253, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(139, 233, 253, 0.03) 1px, transparent 1px)',

    // 代码雨效果颜色
    codeRainColor: '#50fa7b',
  },
};

// Phase color config — label uses getter for runtime i18n
export const PHASE_COLOR_CONFIG: Record<string, { light: string; dark: string; label: string }> = {
  idle: { light: '#d9d9d9', dark: '#6b7280', get label() { return i18next.t('swe:phases.idle'); } },
  cloning: { light: '#1890ff', dark: '#8be9fd', get label() { return i18next.t('swe:phases.cloning'); } },
  setup: { light: '#52c41a', dark: '#50fa7b', get label() { return i18next.t('swe:phases.setup'); } },
  analyzing: { light: '#722ed1', dark: '#bd93f9', get label() { return i18next.t('swe:phases.analyzing'); } },
  fixing: { light: '#fa8c16', dark: '#ffb86c', get label() { return i18next.t('swe:phases.fixing'); } },
  testing: { light: '#13c2c2', dark: '#ff79c6', get label() { return i18next.t('swe:phases.testing'); } },
  verifying: { light: '#eb2f96', dark: '#8be9fd', get label() { return i18next.t('swe:phases.verifying'); } },
  completed: { light: '#52c41a', dark: '#50fa7b', get label() { return i18next.t('swe:phases.completed'); } },
  failed: { light: '#ff4d4f', dark: '#ff5555', get label() { return i18next.t('swe:status.failed'); } },
};

// Status config — label uses getter for runtime i18n
export const STATUS_CONFIG: Record<
  'pending' | 'running' | 'completed' | 'failed' | 'cancelled',
  { light: string; dark: string; icon: string; label: string }
> = {
  pending: { light: '#6c757d', dark: '#6b7280', icon: '⏳', get label() { return i18next.t('swe:status.pending'); } },
  running: { light: '#0d6efd', dark: '#8be9fd', icon: '⚡', get label() { return i18next.t('swe:status.running'); } },
  completed: { light: '#198754', dark: '#50fa7b', icon: '✅', get label() { return i18next.t('swe:status.completed'); } },
  failed: { light: '#dc3545', dark: '#ff5555', icon: '❌', get label() { return i18next.t('swe:status.failed'); } },
  cancelled: { light: '#6c757d', dark: '#6b7280', icon: '⏹️', get label() { return i18next.t('swe:status.cancelled'); } },
};

// 获取主题样式的辅助函数
export const getSWETheme = (isDark: boolean): SWETheme =>
  isDark ? SWE_THEME.dark : SWE_THEME.light;

// 获取阶段颜色
export const getPhaseColor = (phase: string, isDark: boolean): string => {
  const config = PHASE_COLOR_CONFIG[phase];
  return config ? (isDark ? config.dark : config.light) : PHASE_COLOR_CONFIG.idle.dark;
};

// 获取状态颜色
export const getStatusColor = (status: string, isDark: boolean): string => {
  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
  return config ? (isDark ? config.dark : config.light) : STATUS_CONFIG.pending.dark;
};

// 导出动画 keyframes (用于在组件中注入)
export const SWE_ANIMATIONS = {
  // Glitch 效果 - 用于标题或重要文本
  glitch: `
    @keyframes glitch {
      0% { transform: translate(0); }
      20% { transform: translate(-2px, 2px); }
      40% { transform: translate(-2px, -2px); }
      60% { transform: translate(2px, 2px); }
      80% { transform: translate(2px, -2px); }
      100% { transform: translate(0); }
    }
  `,

  // Typing 效果 - 用于代码输入展示
  typing: `
    @keyframes typing {
      from { width: 0; }
      to { width: 100%; }
    }
    @keyframes blink-caret {
      from, to { border-color: transparent; }
      50% { border-color: #8be9fd; }
    }
  `,

  // Scanline 效果 - 用于终端屏幕
  scanline: `
    @keyframes scanline {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(100%); }
    }
  `,

  // Bug 脉冲动画 - 用于运行中的 bug 图标
  bugPulse: `
    @keyframes bugPulse {
      0%, 100% {
        transform: scale(1);
        filter: drop-shadow(0 0 5px rgba(255, 85, 85, 0.5));
      }
      25% {
        transform: scale(1.1) rotate(-5deg);
        filter: drop-shadow(0 0 15px rgba(255, 85, 85, 0.8));
      }
      50% {
        transform: scale(1);
        filter: drop-shadow(0 0 5px rgba(255, 85, 85, 0.5));
      }
      75% {
        transform: scale(1.1) rotate(5deg);
        filter: drop-shadow(0 0 15px rgba(255, 85, 85, 0.8));
      }
    }
  `,

  // 光标闪烁
  cursorBlink: `
    @keyframes cursorBlink {
      0%, 50% { opacity: 1; }
      51%, 100% { opacity: 0; }
    }
  `,

  // 霓虹边框脉冲
  neonPulse: `
    @keyframes neonPulse {
      0%, 100% {
        box-shadow: 0 0 5px rgba(139, 233, 253, 0.5), 0 0 10px rgba(139, 233, 253, 0.3);
      }
      50% {
        box-shadow: 0 0 10px rgba(139, 233, 253, 0.8), 0 0 20px rgba(139, 233, 253, 0.5), 0 0 30px rgba(139, 233, 253, 0.3);
      }
    }
  `,

  // 进度条填充动画
  progressFill: `
    @keyframes progressFill {
      from { transform: scaleX(0); }
      to { transform: scaleX(1); }
    }
  `,

  // 卡片进入动画
  staggeredFadeIn: `
    @keyframes staggeredFadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `,

  // 代码片段浮动
  float: `
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-5px); }
    }
  `,

  // CRT 闪烁效果
  crtFlicker: `
    @keyframes crtFlicker {
      0% { opacity: 0.97; }
      5% { opacity: 0.95; }
      10% { opacity: 0.9; }
      15% { opacity: 0.95; }
      20% { opacity: 0.99; }
      100% { opacity: 0.97; }
    }
  `,

  // 终端光标移动
  terminalCursor: `
    @keyframes terminalCursor {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
  `,
} as const;

/**
 * 获取全局样式（用于深色模式的动画）
 */
export const getGlobalStyles = (isDark: boolean): string => {
  if (!isDark) return '';

  return `
    /* SWE Page Animations */
    ${SWE_ANIMATIONS.glitch}
    ${SWE_ANIMATIONS.typing}
    ${SWE_ANIMATIONS.scanline}
    ${SWE_ANIMATIONS.bugPulse}
    ${SWE_ANIMATIONS.cursorBlink}
    ${SWE_ANIMATIONS.neonPulse}
    ${SWE_ANIMATIONS.progressFill}
    ${SWE_ANIMATIONS.staggeredFadeIn}
    ${SWE_ANIMATIONS.float}
    ${SWE_ANIMATIONS.crtFlicker}
    ${SWE_ANIMATIONS.terminalCursor}

    /* 隐藏滚动条但保留功能 */
    .swe-terminal::-webkit-scrollbar {
      width: 6px;
    }
    .swe-terminal::-webkit-scrollbar-track {
      background: #0d1117;
    }
    .swe-terminal::-webkit-scrollbar-thumb {
      background: rgba(139, 233, 253, 0.3);
      border-radius: 3px;
    }
    .swe-terminal::-webkit-scrollbar-thumb:hover {
      background: rgba(139, 233, 253, 0.5);
    }
  `;
};
