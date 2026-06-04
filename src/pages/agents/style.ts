/**
 * Agent 页面动态样式 Hook
 * 根据当前主题模式返回对应的样式
 */

import { useMemo, type CSSProperties } from 'react';
import { useIsDark } from '@/theme';
import { AGENT_THEME } from './theme';

// ==================== 页面容器样式 ====================
export const usePageContainerStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = AGENT_THEME[isDark ? 'dark' : 'light'];

  return useMemo(
    () => ({
      padding: '24px',
      minHeight: '100vh',
      background: theme.background,
      position: 'relative' as const,
      overflow: 'hidden' as const,
    }),
    [theme.background]
  );
};

// ==================== 页面头部样式 ====================
export const usePageHeaderStyle = (): CSSProperties => {
  return useMemo(
    () => ({
      marginBottom: '32px',
      display: 'flex' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      position: 'relative' as const,
      zIndex: 1,
    }),
    []
  );
};

// ==================== 页面标题样式 ====================
export const useTitleStyle = (): CSSProperties => {
  const isDark = useIsDark();

  return useMemo(() => {
    const background = isDark
      ? 'linear-gradient(135deg, #00d4ff 0%, #7c3aed 100%)'
      : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)';

    return {
      fontSize: '28px',
      fontWeight: 700,
      margin: 0,
      background,
      backgroundClip: 'text' as const,
      WebkitBackgroundClip: 'text',
      color: 'transparent',
      letterSpacing: '-0.5px',
    };
  }, [isDark]);
};

// ==================== 副标题样式 ====================
export const useSubtitleStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = AGENT_THEME[isDark ? 'dark' : 'light'];

  return useMemo(
    () => ({
      fontSize: '14px',
      color: theme.textSecondary,
      marginTop: '4px',
    }),
    [theme.textSecondary]
  );
};

// ==================== 统计卡片网格样式 ====================
export const useStatsGridStyle = (): CSSProperties => {
  return useMemo(
    () => ({
      display: 'grid' as const,
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '24px',
      position: 'relative' as const,
      zIndex: 1,
    }),
    []
  );
};

// ==================== 统计卡片样式 ====================
export const useStatCardStyle = (_color: string): CSSProperties => {
  const isDark = useIsDark();
  const theme = AGENT_THEME[isDark ? 'dark' : 'light'];

  return useMemo(() => {
    const baseStyle: CSSProperties = {
      borderRadius: isDark ? 16 : 12,
      padding: isDark ? '20px' : '18px',
      display: 'flex' as const,
      alignItems: 'center' as const,
      gap: '16px',
      transition: 'all 0.3s ease',
      cursor: 'default',
      position: 'relative' as const,
      overflow: 'hidden' as const,
    };

    if (isDark) {
      return {
        ...baseStyle,
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        boxShadow: theme.cardShadow,
      };
    }

    return {
      ...baseStyle,
      background: '#ffffff',
      border: `1px solid ${theme.borderLight}`,
      boxShadow: theme.cardShadow,
    };
  }, [isDark, theme]);
};

// ==================== 统计图标容器样式 ====================
export const useStatIconStyle = (color: string): CSSProperties => {
  const isDark = useIsDark();

  return useMemo(() => {
    const bgColor = isDark ? `${color}20` : `${color}15`;

    return {
      width: isDark ? 52 : 48,
      height: isDark ? 52 : 48,
      borderRadius: '50%',
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      fontSize: isDark ? 22 : 20,
      background: bgColor,
      color,
      flexShrink: 0,
    };
  }, [isDark, color]);
};

// ==================== 统计数值样式 ====================
export const useStatValueStyle = (color: string): CSSProperties => {
  const isDark = useIsDark();

  return useMemo(
    () => ({
      fontSize: isDark ? 26 : 24,
      fontWeight: 700,
      lineHeight: 1,
      marginBottom: '4px',
      color,
    }),
    [isDark, color]
  );
};

// ==================== 统计标签样式 ====================
export const useStatLabelStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = AGENT_THEME[isDark ? 'dark' : 'light'];

  return useMemo(
    () => ({
      fontSize: '13px',
      color: theme.textTertiary,
      fontWeight: 500,
    }),
    [theme.textTertiary]
  );
};

// ==================== 筛选卡片样式 ====================
export const useFilterCardStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = AGENT_THEME[isDark ? 'dark' : 'light'];

  return useMemo(() => {
    const baseStyle: CSSProperties = {
      borderRadius: isDark ? 16 : 12,
      marginBottom: '20px',
      position: 'relative' as const,
      zIndex: 1,
    };

    if (isDark) {
      return {
        ...baseStyle,
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        boxShadow: theme.cardShadow,
      };
    }

    return {
      ...baseStyle,
      background: '#ffffff',
      border: `1px solid ${theme.borderLight}`,
      boxShadow: theme.cardShadow,
    };
  }, [isDark, theme]);
};

// ==================== 筛选栏样式 ====================
export const useFilterBarStyle = (): CSSProperties => {
  return useMemo(
    () => ({
      display: 'flex' as const,
      gap: '12px',
      alignItems: 'center' as const,
      flexWrap: 'wrap' as const,
    }),
    []
  );
};

// ==================== 操作栏样式 ====================
export const useActionBarStyle = (): CSSProperties => {
  return useMemo(
    () => ({
      display: 'flex' as const,
      justifyContent: 'space-between' as const,
      alignItems: 'center' as const,
      marginBottom: '16px',
      position: 'relative' as const,
      zIndex: 1,
    }),
    []
  );
};

// ==================== 卡片网格样式 ====================
export const useGridStyle = (): CSSProperties => {
  return useMemo(
    () => ({
      display: 'grid' as const,
      gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
      gap: '20px',
      position: 'relative' as const,
      zIndex: 1,
    }),
    []
  );
};

// ==================== 空状态样式 ====================
export const useEmptyStateStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = AGENT_THEME[isDark ? 'dark' : 'light'];

  return useMemo(() => {
    const baseStyle: CSSProperties = {
      textAlign: 'center',
      padding: '80px 20px',
      position: 'relative' as const,
      zIndex: 1,
    };

    if (isDark) {
      return {
        ...baseStyle,
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: 16,
      };
    }

    return {
      ...baseStyle,
      background: '#ffffff',
      border: `1px solid ${theme.borderLight}`,
      borderRadius: 12,
    };
  }, [isDark, theme]);
};

// ==================== 空状态图标样式 ====================
export const useEmptyIconStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = AGENT_THEME[isDark ? 'dark' : 'light'];

  return useMemo(
    () => ({
      fontSize: 64,
      color: theme.textTertiary,
      marginBottom: 20,
      opacity: 0.6,
    }),
    [theme.textTertiary]
  );
};

// ==================== 空状态文本样式 ====================
export const useEmptyTextStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = AGENT_THEME[isDark ? 'dark' : 'light'];

  return useMemo(
    () => ({
      fontSize: '16px',
      color: theme.textSecondary,
      marginBottom: 24,
    }),
    [theme.textSecondary]
  );
};

// ==================== 详情页布局样式 ====================
export const useDetailLayoutStyle = (): CSSProperties => {
  return useMemo(
    () => ({
      display: 'grid' as const,
      gridTemplateColumns: '1fr 400px',
      gap: '24px',
      position: 'relative' as const,
      zIndex: 1,
    }),
    []
  );
};

// ==================== 表单样式 ====================
export const useFormStyle = (): CSSProperties => {
  return useMemo(
    () => ({
      maxWidth: '600px',
    }),
    []
  );
};

// ==================== 图表容器样式 ====================
export const useChartContainerStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = AGENT_THEME[isDark ? 'dark' : 'light'];

  return useMemo(() => {
    const baseStyle: CSSProperties = {
      height: '300px',
      width: '100%',
    };

    if (isDark) {
      return {
        ...baseStyle,
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        borderRadius: 16,
        padding: '20px',
      };
    }

    return {
      ...baseStyle,
      background: '#ffffff',
      borderRadius: 12,
      padding: '20px',
    };
  }, [isDark, theme]);
};

// ==================== 创建页面专用样式 ====================

// 创建页面大卡片样式
export const useCreatePageCardStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = AGENT_THEME[isDark ? 'dark' : 'light'];

  return useMemo(
    () => ({
      backgroundColor: isDark ? theme.cardBg : '#ffffff',
      borderRadius: isDark ? 16 : 12,
      padding: isDark ? '32px' : '28px',
      border: isDark ? `1px solid ${theme.cardBorder}` : 'none',
      boxShadow: isDark ? theme.cardShadow : '0 2px 8px rgba(0,0,0,0.04)',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      marginBottom: 24,
    }),
    [isDark, theme]
  );
};

// 分区标题样式
export const useSectionTitleStyle = (): CSSProperties => {
  const isDark = useIsDark();

  return useMemo(
    () => ({
      fontSize: '16px',
      fontWeight: 600,
      marginBottom: '20px',
      paddingBottom: '12px',
      borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)'}`,
      display: 'flex' as const,
      alignItems: 'center' as const,
      gap: '10px',
      color: isDark ? '#e5e7eb' : '#1a1a2e',
    }),
    [isDark]
  );
};

// 分区图标容器样式
export const useSectionIconStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = AGENT_THEME[isDark ? 'dark' : 'light'];

  return useMemo(
    () => ({
      width: 32,
      height: 32,
      borderRadius: isDark ? 8 : 6,
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      fontSize: 16,
      background: theme.accentBg,
      color: theme.accent,
    }),
    [isDark, theme]
  );
};

// 分区标题颜色装饰条样式
export const useSectionTitleBarStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = AGENT_THEME[isDark ? 'dark' : 'light'];

  return useMemo(
    () => ({
      width: 4,
      height: 20,
      borderRadius: 2,
      background: isDark
        ? 'linear-gradient(180deg, #00d4ff 0%, #7c3aed 100%)'
        : 'linear-gradient(180deg, #6366f1 0%, #8b5cf6 100%)',
    }),
    [isDark, theme]
  );
};

// Alert 样式
export const useAlertStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = AGENT_THEME[isDark ? 'dark' : 'light'];

  return useMemo(
    () => ({
      marginBottom: 24,
      borderRadius: isDark ? 12 : 8,
      border: `1px solid ${theme.accent}30`,
      background: theme.accentBg,
      position: 'relative' as const,
      zIndex: 1,
    }),
    [isDark, theme]
  );
};

// 分区分隔线样式
export const useDividerStyle = (): CSSProperties => {
  const isDark = useIsDark();

  return useMemo(
    () => ({
      margin: '28px 0',
      borderStyle: 'dashed' as const,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
      opacity: 0.8,
    }),
    [isDark]
  );
};

// 操作按钮容器样式 (创建页面专用)
export const useCreatePageActionBarStyle = (): CSSProperties => {
  return useMemo(
    () => ({
      display: 'flex' as const,
      justifyContent: 'flex-end' as const,
      gap: '12px',
      marginTop: 24,
      position: 'relative' as const,
      zIndex: 1,
    }),
    []
  );
};

// 主按钮样式
export const usePrimaryButtonStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = AGENT_THEME[isDark ? 'dark' : 'light'];

  return useMemo(
    () => ({
      background: theme.gradientPrimary,
      border: 'none',
      height: 40,
      paddingLeft: 24,
      paddingRight: 24,
      borderRadius: isDark ? 10 : 8,
      fontWeight: 500,
    }),
    [isDark, theme]
  );
};

// 次要按钮样式
export const useSecondaryButtonStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = AGENT_THEME[isDark ? 'dark' : 'light'];

  return useMemo(
    () => ({
      height: 40,
      paddingLeft: 24,
      paddingRight: 24,
      borderRadius: isDark ? 10 : 8,
      borderColor: theme.border,
    }),
    [isDark, theme]
  );
};

// 温度标签描述样式
export const useTemperatureLabelStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = AGENT_THEME[isDark ? 'dark' : 'light'];

  return useMemo(
    () => ({
      fontSize: '12px',
      color: theme.textTertiary,
      marginTop: '4px',
    }),
    [isDark, theme]
  );
};

// ==================== 导出所有样式 hook ====================
export const useStyles = () => {
  const isDark = useIsDark();
  const theme = AGENT_THEME[isDark ? 'dark' : 'light'];

  return {
    isDark,
    theme,
    pageContainer: usePageContainerStyle(),
    pageHeader: usePageHeaderStyle(),
    title: useTitleStyle(),
    subtitle: useSubtitleStyle(),
    statsGrid: useStatsGridStyle(),
    filterCard: useFilterCardStyle(),
    filterBar: useFilterBarStyle(),
    actionBar: useActionBarStyle(),
    grid: useGridStyle(),
    emptyState: useEmptyStateStyle(),
    emptyIcon: useEmptyIconStyle(),
    emptyText: useEmptyTextStyle(),
    detailLayout: useDetailLayoutStyle(),
    form: useFormStyle(),
    chartContainer: useChartContainerStyle(),
  };
};

// ==================== 静态样式常量 (向后兼容) ====================
// 这些静态常量用于其他页面组件，提供基础样式
// 实际项目中应该逐步迁移到使用上面的动态 hooks

export const PAGE_CONTAINER_STYLE: CSSProperties = {
  padding: '24px',
  minHeight: '100vh',
  backgroundColor: '#f0f2f5',
};

export const CARD_CONTAINER_STYLE: CSSProperties = {
  backgroundColor: '#fff',
  borderRadius: '8px',
  padding: '24px',
  marginBottom: '24px',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
};

export const PAGE_HEADER_STYLE: CSSProperties = {
  marginBottom: '24px',
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
};

export const PAGE_TITLE_STYLE: CSSProperties = {
  fontSize: '20px',
  fontWeight: 600,
  margin: 0,
  color: '#262626',
};

export const STAT_VALUE_STYLE: CSSProperties = {
  fontSize: '24px',
  fontWeight: 600,
  lineHeight: 1,
  marginBottom: '4px',
};

export const TIMELINE_STYLE: CSSProperties = {
  marginTop: '16px',
};

export const EMPTY_STATE_STYLE: CSSProperties = {
  padding: '60px 0',
  textAlign: 'center',
};

export const FORM_STYLE: CSSProperties = {
  maxWidth: '600px',
};

export const TAG_STYLES = {
  active: {
    backgroundColor: '#f6ffed',
    borderColor: '#b7eb8f',
    color: '#52c41a',
  },
  inactive: {
    backgroundColor: '#fff1f0',
    borderColor: '#ffccc7',
    color: '#ff4d4f',
  },
  pending: {
    backgroundColor: '#e6f7ff',
    borderColor: '#91d5ff',
    color: '#1677ff',
  },
};
