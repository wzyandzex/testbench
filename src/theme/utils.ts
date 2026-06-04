/**
 * 主题感知的样式工具函数
 * 提供根据当前主题自动适配的样式对象
 */

import { CSSProperties } from 'react';
import { useThemeTokens, useIsDark } from './hooks';

/**
 * 卡片样式 - 适配主题
 */
export const useCardStyle = (): CSSProperties => {
  const tokens = useThemeTokens();

  return {
    background: tokens.bg.elevated,
    border: `1px solid ${tokens.border.default}`,
    borderRadius: 12,
    backdropFilter: tokens.bg.elevated.includes('rgba') ? 'blur(20px)' : undefined,
    WebkitBackdropFilter: tokens.bg.elevated.includes('rgba') ? 'blur(20px)' : undefined,
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  };
};

/**
 * 卡片悬停样式 - 适配主题
 */
export const useCardHoverStyle = (): CSSProperties => {
  const tokens = useThemeTokens();
  const isDark = useIsDark();

  return {
    borderColor: tokens.border.hover,
    boxShadow: isDark
      ? `0 8px 32px ${tokens.brand.primary}30`
      : '0 8px 24px rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-4px)',
  };
};

/**
 * 文字样式 - 适配主题
 */
export const useTextStyle = (type: 'primary' | 'secondary' | 'tertiary' | 'disabled'): CSSProperties => {
  const tokens = useThemeTokens();

  return {
    color: tokens.text[type],
  };
};

/**
 * 统计卡片样式 - 适配主题
 */
export const useStatCardStyle = (): CSSProperties => {
  const tokens = useThemeTokens();
  const isDark = useIsDark();

  return {
    padding: '16px 20px',
    background: tokens.bg.elevated,
    borderRadius: 12,
    border: `1px solid ${tokens.border.default}`,
    backdropFilter: isDark ? 'blur(20px)' : undefined,
    WebkitBackdropFilter: isDark ? 'blur(20px)' : undefined,
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  };
};

/**
 * 筛选栏样式 - 适配主题
 */
export const useFilterBarStyle = (): CSSProperties => {
  const tokens = useThemeTokens();
  const isDark = useIsDark();

  return {
    padding: '20px',
    background: tokens.bg.elevated,
    borderRadius: 12,
    border: `1px solid ${tokens.border.default}`,
    boxShadow: isDark ? '0 1px 2px rgba(0, 0, 0, 0.2)' : '0 1px 2px rgba(0, 0, 0, 0.05)',
    marginBottom: 20,
  };
};

/**
 * 工具栏样式 - 适配主题
 */
export const useToolbarStyle = (): CSSProperties => {
  const tokens = useThemeTokens();

  return {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: `1px solid ${tokens.border.default}`,
  };
};

/**
 * 表格行悬停样式 - 适配主题
 */
export const useTableRowHoverStyle = (): CSSProperties => {
  const tokens = useThemeTokens();

  return {
    backgroundColor: tokens.bg.tertiary,
  };
};

/**
 * 输入框容器样式 - 适配主题
 */
export const useInputWrapperStyle = (): CSSProperties => {
  const tokens = useThemeTokens();

  return {
    background: tokens.bg.secondary,
    border: `1px solid ${tokens.border.default}`,
    borderRadius: 8,
    padding: '16px',
    transition: 'all 0.3s ease',
  };
};

/**
 * 空状态样式 - 适配主题
 */
export const useEmptyStateStyle = (): CSSProperties => {
  const tokens = useThemeTokens();

  return {
    padding: 80,
    textAlign: 'center',
    background: tokens.bg.elevated,
    borderRadius: 12,
    border: `1px solid ${tokens.border.default}`,
  };
};

/**
 * 进度条背景色 - 适配主题
 */
export const useProgressTrailColor = (): string => {
  const tokens = useThemeTokens();
  return tokens.border.default;
};

/**
 * 获取语言颜色的带透明度版本
 */
export const useLanguageColor = (language: string): { bg: string; color: string } => {
  const languageColors: Record<string, string> = {
    python: '#3776ab',
    javascript: '#f7df1e',
    typescript: '#3178c6',
    java: '#b07219',
    go: '#00add8',
    rust: '#dea584',
    cpp: '#f34b7d',
    ruby: '#cc342d',
    default: '#8c8c8c',
  };

  const color = languageColors[language] || languageColors.default;
  return {
    bg: `${color}15`,
    color,
  };
};

/**
 * 获取带透明度的品牌色
 */
export const useBrandColorWithOpacity = (opacity: number = 0.15): string => {
  const tokens = useThemeTokens();
  const hex = tokens.brand.primary;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

/**
 * 光晕效果样式
 */
export const useGlowStyle = (color?: string, size: number = 8): CSSProperties => {
  const tokens = useThemeTokens();
  const glowColor = color || tokens.brand.primary;

  return {
    boxShadow: `0 ${size}px 32px ${glowColor}40`,
  };
};

/**
 * 渐变文字样式
 */
export const useGradientTextStyle = (): CSSProperties => {
  const isDark = useIsDark();

  return {
    background: isDark
      ? 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)'
      : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  };
};

/**
 * 标签样式（带图标）
 */
export const useTagStyle = (
  color: string,
  variant: 'default' | 'outline' = 'default'
): CSSProperties => {
  if (variant === 'outline') {
    return {
      margin: 0,
      padding: '2px 8px',
      borderRadius: 4,
      border: `1px solid ${color}30`,
      background: `${color}15`,
      color,
      fontSize: 12,
    };
  }

  return {
    margin: 0,
    padding: '4px 12px',
    borderRadius: 20,
    border: `1px solid ${color}30`,
    background: `${color}15`,
    color,
    fontSize: 13,
    fontWeight: 500,
  };
};

/**
 * 配置面板样式（用于表单页面）
 */
export const useConfigPanelStyle = (): CSSProperties => {
  const tokens = useThemeTokens();

  return {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: tokens.bg.secondary,
    borderRight: `1px solid ${tokens.border.default}`,
  };
};

/**
 * 编辑器面板样式（用于表单页面）
 */
export const useEditorPanelStyle = (): CSSProperties => {
  const tokens = useThemeTokens();

  return {
    height: '100%',
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
    background: tokens.bg.primary,
  };
};

/**
 * 操作栏样式
 */
export const useActionBarStyle = (): CSSProperties => {
  const tokens = useThemeTokens();

  return {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: 8,
    padding: '12px 16px',
    borderTop: `1px solid ${tokens.border.default}`,
    backgroundColor: tokens.bg.elevated,
  };
};

/**
 * 获取头像背景色
 */
export const useAvatarBgColor = (color: string): string => {
  const isDark = useIsDark();
  // 深色模式下使用更高的透明度
  return isDark ? `${color}25` : `${color}15`;
};
