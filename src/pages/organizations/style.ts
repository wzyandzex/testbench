/**
 * Organizations 页面样式系统
 * 支持深色/浅色模式动态切换
 */

import { useMemo, type CSSProperties } from 'react';
import { useIsDark } from '@/theme';
import { ORG_THEME } from './theme';

// 页面容器样式
export const useOrgPageContainerStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = ORG_THEME[isDark ? 'dark' : 'light'];

  return useMemo(() => ({
    padding: '24px 48px',
    maxWidth: 1600,
    margin: '0 auto',
    minHeight: '100vh',
    background: isDark ? theme.background : '#ffffff',
    position: 'relative' as const,
    overflow: 'hidden' as const,
  }), [isDark, theme.background]);
};

// 页面头部样式
export const usePageHeaderStyle = (): CSSProperties => {
  return useMemo(() => ({
    marginBottom: 24,
  }), []);
};

// 标题样式
export const useTitleStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = ORG_THEME[isDark ? 'dark' : 'light'];

  return useMemo(() => ({
    margin: 0,
    fontSize: 28,
    fontWeight: 700,
    color: theme.textPrimary,
  }), [theme.textPrimary]);
};

// 副标题样式
export const useSubtitleStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = ORG_THEME[isDark ? 'dark' : 'light'];

  return useMemo(() => ({
    fontSize: 14,
    color: theme.textSecondary,
  }), [theme.textSecondary]);
};

// 统计卡片样式
export const useOrgStatCardStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = ORG_THEME[isDark ? 'dark' : 'light'];

  return useMemo(() => {
    const baseStyle: CSSProperties = {
      padding: '20px',
      borderRadius: isDark ? 16 : 12,
      border: isDark ? `1px solid ${theme.cardBorder}` : '1px solid #f0f0f0',
      boxShadow: isDark ? theme.cardShadow : '0 1px 2px rgba(0,0,0,0.05)',
      background: isDark ? theme.cardBg : '#fff',
      textAlign: 'center',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      transition: 'all 0.3s ease',
    };

    // 深色模式网格纹理
    if (isDark) {
      return {
        ...baseStyle,
        backgroundImage: theme.gridPattern,
        backgroundSize: '20px 20px',
      };
    }
    return baseStyle;
  }, [isDark, theme]);
};

// 统计卡片悬停样式
export const useOrgStatCardHoverStyle = (color: string): CSSProperties => {
  const isDark = useIsDark();

  return useMemo(() => ({
    transform: isDark ? 'translateY(-2px)' : 'none',
    boxShadow: isDark
      ? `0 8px 30px ${color}30, 0 0 40px ${color}15`
      : '0 4px 12px rgba(0, 0, 0, 0.1)',
    borderColor: isDark ? `${color}60` : undefined,
  }), [isDark, color]);
};

// 表格卡片样式
export const useOrgTableCardStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = ORG_THEME[isDark ? 'dark' : 'light'];

  return useMemo(() => {
    const baseStyle: CSSProperties = {
      borderRadius: isDark ? 16 : 12,
      border: isDark ? `1px solid ${theme.cardBorder}` : '1px solid #f0f0f0',
      boxShadow: isDark ? theme.cardShadow : '0 1px 2px rgba(0,0,0,0.05)',
      background: isDark ? theme.cardBg : '#fff',
      position: 'relative' as const,
      overflow: 'hidden' as const,
    };

    if (isDark) {
      return {
        ...baseStyle,
        backgroundImage: theme.gridPattern,
        backgroundSize: '20px 20px',
      };
    }
    return baseStyle;
  }, [isDark, theme]);
};

// 霓虹顶部边框效果
export const useNeonTopBorder = (color: string): CSSProperties => {
  return useMemo(() => ({
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
  }), [color]);
};

// 霓虹发光边框效果
export const useNeonGlowBorder = (color: string): CSSProperties => {
  return useMemo(() => ({
    position: 'absolute' as const,
    inset: 0,
    borderRadius: 16,
    padding: '1px',
    background: `linear-gradient(135deg, ${color}40, transparent, ${color}40)`,
    WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
    WebkitMaskComposite: 'xor',
    maskComposite: 'exclude',
    pointerEvents: 'none' as const,
  }), [color]);
};

// 表格行样式
export const useTableRowStyle = (): { base: CSSProperties; hover: CSSProperties } => {
  const isDark = useIsDark();
  const theme = ORG_THEME[isDark ? 'dark' : 'light'];

  return useMemo(() => ({
    base: {
      borderBottom: isDark ? `1px solid ${theme.borderLight}` : '1px solid #f5f5f5',
      transition: 'all 0.2s ease',
    } as CSSProperties,
    hover: {
      background: isDark ? 'rgba(0, 212, 255, 0.05)' : '#fafafa',
    } as CSSProperties,
  }), [isDark, theme]);
};

// Modal 样式
export const useModalStyles = () => {
  const isDark = useIsDark();
  const theme = ORG_THEME[isDark ? 'dark' : 'light'];

  return useMemo(() => ({
    content: {
      background: isDark ? theme.cardBg : '#fff',
      border: isDark ? `1px solid ${theme.cardBorder}` : 'none',
    },
    header: {
      background: isDark ? theme.cardBg : '#fff',
      borderBottom: isDark ? `1px solid ${theme.border}` : '1px solid #f0f0f0',
      padding: '16px 24px',
    },
    title: {
      color: theme.textPrimary,
      fontWeight: 600,
    },
    body: {
      background: isDark ? theme.cardBg : '#fff',
    },
  }), [isDark, theme]);
};

// Tab 样式
export const useTabStyles = () => {
  const isDark = useIsDark();
  const theme = ORG_THEME[isDark ? 'dark' : 'light'];

  return useMemo(() => ({
    color: theme.textPrimary,
    fontWeight: 500,
  }), [theme.textPrimary]);
};

// 计划标签样式
export const usePlanTagStyle = (color: string): CSSProperties => {
  const isDark = useIsDark();

  return useMemo(() => ({
    margin: 0,
    padding: '4px 10px',
    borderRadius: isDark ? 8 : 20,
    border: `1px solid ${color}40`,
    background: `${color}15`,
    color,
    fontSize: 12,
    fontWeight: 500,
    boxShadow: isDark ? `0 0 10px ${color}20` : 'none',
  }), [isDark, color]);
};

// 角色标签样式
export const useRoleTagStyle = (color: string): CSSProperties => {
  const isDark = useIsDark();

  return useMemo(() => ({
    margin: 0,
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    border: `1px solid ${color}40`,
    background: `${color}15`,
    color,
  }), [isDark, color]);
};

// 图表容器样式
export const useChartCardStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = ORG_THEME[isDark ? 'dark' : 'light'];

  return useMemo(() => ({
    borderRadius: isDark ? 16 : 12,
    border: isDark ? `1px solid ${theme.cardBorder}` : '1px solid #f0f0f0',
    background: isDark ? theme.cardBg : '#fff',
  }), [isDark, theme]);
};

// Descriptions 样式
export const useDescriptionsStyle = () => {
  const isDark = useIsDark();
  const theme = ORG_THEME[isDark ? 'dark' : 'light'];

  return useMemo(() => ({
    labelStyle: {
      color: theme.textSecondary,
      fontWeight: 500,
    } as CSSProperties,
    contentStyle: {
      color: theme.textPrimary,
    } as CSSProperties,
    borderColor: isDark ? theme.border : '#f0f0f0',
  }), [isDark, theme]);
};

// 活动日志项样式
export const useActivityItemStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = ORG_THEME[isDark ? 'dark' : 'light'];

  return useMemo(() => ({
    padding: '12px 0',
    borderBottom: isDark ? `1px solid ${theme.borderLight}` : '1px solid #f5f5f5',
  }), [isDark, theme]);
};

// 数字动画样式
export const useNumberStyle = (color: string): CSSProperties => {
  const isDark = useIsDark();
  const theme = ORG_THEME[isDark ? 'dark' : 'light'];

  return useMemo(() => ({
    fontSize: isDark ? 32 : 28,
    fontWeight: 700,
    color: isDark ? theme.textPrimary : '#000',
    textShadow: isDark ? `0 0 20px ${color}30` : 'none',
  }), [isDark, color, theme.textPrimary]);
};

// 图标样式
export const useIconStyle = (color: string, size?: number): CSSProperties => {
  const isDark = useIsDark();

  return useMemo(() => ({
    fontSize: size || (isDark ? 24 : 20),
    marginBottom: 8,
    color,
    textShadow: isDark ? `0 0 10px ${color}40` : 'none',
  }), [isDark, color, size]);
};

// 全局样式注入字符串
export const getGlobalStyles = (isDark: boolean): string => {
  if (!isDark) {
    return `
      .ant-table-thead > tr > th {
        background: #fafafa !important;
        border-bottom: 1px solid #f0f0f0 !important;
        color: #666 !important;
        font-weight: 600 !important;
        font-size: 13px !important;
        padding: 12px 16px !important;
      }

      .ant-table-tbody > tr > td {
        padding: 12px 16px !important;
        border-bottom: 1px solid #f5f5f5 !important;
      }

      .ant-btn-primary {
        background: #000 !important;
        border-color: #000 !important;
        border-radius: 8px !important;
        font-weight: 500 !important;
      }

      .ant-btn-primary:hover {
        background: #333 !important;
        border-color: #333 !important;
      }

      .ant-modal-header {
        border-bottom: 1px solid #f0f0f0 !important;
        padding: 16px 24px !important;
      }

      .ant-modal-title {
        font-size: 16px !important;
        font-weight: 600 !important;
        color: #000 !important;
      }
    `;
  }

  // 深色模式样式
  return `
    .ant-table-thead > tr > th {
      background: #0f0f14 !important;
      border-bottom: 1px solid rgba(255,255,255,0.1) !important;
      color: #9ca3af !important;
      font-weight: 600 !important;
      font-size: 13px !important;
      padding: 12px 16px !important;
    }

    .ant-table-tbody > tr > td {
      padding: 12px 16px !important;
      border-bottom: 1px solid rgba(255,255,255,0.05) !important;
      color: #e5e7eb !important;
    }

    .ant-table-tbody > tr:hover > td {
      background: rgba(0, 212, 255, 0.05) !important;
    }

    .ant-btn-primary {
      background: linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%) !important;
      border: none !important;
      border-radius: 8px !important;
      font-weight: 500 !important;
      box-shadow: 0 0 20px rgba(0, 212, 255, 0.3) !important;
    }

    .ant-btn-primary:hover {
      box-shadow: 0 0 30px rgba(0, 212, 255, 0.5) !important;
      transform: translateY(-1px);
    }

    .ant-modal-content {
      background: #141419 !important;
      border: 1px solid rgba(0, 212, 255, 0.2) !important;
      box-shadow: 0 4px 30px rgba(0, 212, 255, 0.15) !important;
    }

    .ant-modal-header {
      background: #141419 !important;
      border-bottom: 1px solid rgba(255,255,255,0.1) !important;
      padding: 16px 24px !important;
    }

    .ant-modal-title {
      font-size: 16px !important;
      font-weight: 600 !important;
      color: #e5e7eb !important;
    }

    .ant-modal-body {
      background: #141419 !important;
      color: #e5e7eb !important;
    }

    .ant-modal-footer {
      background: #141419 !important;
      border-top: 1px solid rgba(255,255,255,0.1) !important;
    }

    .ant-input,
    .ant-input-textarea textarea {
      background: #0a0a0f !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
      color: #e5e7eb !important;
    }

    .ant-input:hover,
    .ant-input-textarea textarea:hover {
      border-color: rgba(0, 212, 255, 0.3) !important;
    }

    .ant-input:focus,
    .ant-input-textarea textarea:focus {
      border-color: #00d4ff !important;
      box-shadow: 0 0 10px rgba(0, 212, 255, 0.2) !important;
    }

    .ant-select-selector {
      background: #0a0a0f !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
      color: #e5e7eb !important;
    }

    .ant-select:hover .ant-select-selector {
      border-color: rgba(0, 212, 255, 0.3) !important;
    }

    .ant-select-focused .ant-select-selector {
      border-color: #00d4ff !important;
      box-shadow: 0 0 10px rgba(0, 212, 255, 0.2) !important;
    }

    .ant-select-dropdown {
      background: #141419 !important;
      border: 1px solid rgba(255,255,255,0.1) !important;
    }

    .ant-select-item {
      color: #e5e7eb !important;
    }

    .ant-select-item-option-selected {
      background: rgba(0, 212, 255, 0.15) !important;
    }

    .ant-select-item-option-active {
      background: rgba(0, 212, 255, 0.1) !important;
    }

    .ant-tabs-tab {
      font-weight: 500 !important;
      font-size: 14px !important;
      color: #9ca3af !important;
    }

    .ant-tabs-tab-active {
      font-weight: 600 !important;
    }

    .ant-tabs-tab-active .ant-tabs-tab-btn {
      color: #00d4ff !important;
      text-shadow: 0 0 10px rgba(0, 212, 255, 0.5) !important;
    }

    .ant-tabs-ink-bar {
      background: linear-gradient(90deg, #00d4ff, #7c3aed) !important;
      height: 2px !important;
    }

    .ant-descriptions-item-label {
      font-weight: 500 !important;
      color: #9ca3af !important;
    }

    .ant-descriptions-item-content {
      color: #e5e7eb !important;
    }

    .ant-descriptions-bordered .ant-descriptions-item-label {
      background: rgba(0, 0, 0, 0.2) !important;
    }

    .ant-progress-text {
      color: #e5e7eb !important;
    }
  `;
};
