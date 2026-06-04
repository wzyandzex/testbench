/**
 * Agents 页面主题配置
 * 浅色模式：艺术画廊风格 - 温暖、有机、不对称
 * 深色模式：赛博指挥台风格 - 深邃、霓虹、动态
 */

import type { CSSProperties } from 'react';

export interface AgentTheme {
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
  // 状态颜色
  statusActive: string;
  statusInactive: string;
  statusError: string;
  statusActiveBg: string;
  statusInactiveBg: string;
  statusErrorBg: string;
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
  // 网格纹理 (深色模式)
  gridPattern?: string;
}

export const AGENT_THEME: Record<'light' | 'dark', AgentTheme> = {
  // ==================== 浅色模式 - 艺术画廊 ====================
  light: {
    // 页面背景 - 温暖的奶油色渐变
    background: 'linear-gradient(135deg, #faf8f5 0%, #f5f0e8 50%, #ede4d8 100%)',

    // 卡片背景 - 纯白
    cardBg: '#ffffff',
    cardBorder: 'rgba(0,0,0,0.06)',
    cardShadow: '0 4px 20px rgba(0,0,0,0.04)',
    cardHoverShadow: '0 8px 30px rgba(0,0,0,0.08)',

    // 文字颜色
    textPrimary: '#1a1a2e',
    textSecondary: '#6b7280',
    textTertiary: '#9ca3af',

    // 状态颜色 - 柔和自然
    statusActive: '#10b981',
    statusInactive: '#9ca3af',
    statusError: '#ef4444',
    statusActiveBg: 'rgba(16, 185, 129, 0.1)',
    statusInactiveBg: 'rgba(156, 163, 175, 0.1)',
    statusErrorBg: 'rgba(239, 68, 68, 0.1)',

    // 强调色 - 靛蓝紫
    accent: '#6366f1',
    accentHover: '#4f46e5',
    accentBg: 'rgba(99, 102, 241, 0.1)',

    // 边框
    border: 'rgba(0,0,0,0.08)',
    borderLight: 'rgba(0,0,0,0.04)',

    // 渐变
    gradientPrimary: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
    gradientSecondary: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  },

  // ==================== 深色模式 - 赛博指挥台 ====================
  dark: {
    // 页面背景 - 深邃空间
    background: '#0a0a0f',

    // 卡片背景 - 深灰带微蓝
    cardBg: '#141419',
    cardBorder: 'rgba(99, 102, 241, 0.2)',
    cardShadow: '0 4px 20px rgba(99, 102, 241, 0.1)',
    cardHoverShadow: '0 8px 30px rgba(0, 212, 255, 0.2)',

    // 文字颜色
    textPrimary: '#e5e7eb',
    textSecondary: '#9ca3af',
    textTertiary: '#6b7280',

    // 状态颜色 - 霓虹效果
    statusActive: '#00ffaa',
    statusInactive: '#6b7280',
    statusError: '#ff4466',
    statusActiveBg: 'rgba(0, 255, 170, 0.15)',
    statusInactiveBg: 'rgba(107, 114, 128, 0.15)',
    statusErrorBg: 'rgba(255, 68, 102, 0.15)',

    // 强调色 - 霓虹青
    accent: '#00d4ff',
    accentHover: '#00b8e6',
    accentBg: 'rgba(0, 212, 255, 0.15)',

    // 边框
    border: 'rgba(255,255,255,0.1)',
    borderLight: 'rgba(255,255,255,0.05)',

    // 渐变 - 赛博朋克风
    gradientPrimary: 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)',
    gradientSecondary: 'linear-gradient(135deg, #ff4466 0%, #ff9500 100%)',

    // 霓虹边框
    neonBorder: 'rgba(0, 212, 255, 0.5)',

    // 辉光效果
    glow: '0 0 20px rgba(0, 212, 255, 0.3)',

    // 网格纹理
    gridPattern: 'linear-gradient(rgba(0, 212, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 212, 255, 0.03) 1px, transparent 1px)',
  },
};

// Agent 类型配置
export const AGENT_TYPE_CONFIG = {
  openai: {
    color: '#10a37f',
    darkColor: '#00ffaa',
    icon: '🤖',
    text: 'OpenAI',
  },
  anthropic: {
    color: '#d97757',
    darkColor: '#ff9500',
    icon: '🧠',
    text: 'Anthropic',
  },
  google: {
    color: '#4285f4',
    darkColor: '#00d4ff',
    icon: '🔍',
    text: 'Google',
  },
  custom: {
    color: '#6b7280',
    darkColor: '#a78bfa',
    icon: '⚙️',
    text: 'Custom',
  },
} as const;

export type AgentType = keyof typeof AGENT_TYPE_CONFIG;

// 卡片尺寸配置 (用于不对称布局)
export const CARD_SIZES = [
  { width: '100%', height: 'auto' }, // 全宽
  { width: 'calc(50% - 8px)', height: 'auto' }, // 半宽
  { width: 'calc(33.333% - 11px)', height: 'auto' }, // 三分之一
] as const;

// 获取主题样式的辅助函数
export const getThemeStyle = (isDark: boolean): AgentTheme =>
  isDark ? AGENT_THEME.dark : AGENT_THEME.light;

// 状态脉冲动画 CSS
export const getStatusPulseStyle = (isDark: boolean, _color: string): CSSProperties => ({
  animation: isDark ? `statusPulse 2s ease-in-out infinite` : 'none',
  // 内联样式无法定义 keyframes，需要在组件中使用 style 标签
});

// 导出 keyframes (用于在组件中注入)
export const ANIMATIONS = {
  statusPulse: `
    @keyframes statusPulse {
      0%, 100% {
        box-shadow: 0 0 5px currentColor, 0 0 10px currentColor;
      }
      50% {
        box-shadow: 0 0 15px currentColor, 0 0 25px currentColor, 0 0 35px currentColor;
      }
    }
  `,
  shimmer: `
    @keyframes shimmer {
      0% { transform: translateX(-100%) rotate(45deg); }
      100% { transform: translateX(200%) rotate(45deg); }
    }
  `,
  float: `
    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-5px); }
    }
  `,
  glowPulse: `
    @keyframes glowPulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 1; }
    }
  `,
} as const;
