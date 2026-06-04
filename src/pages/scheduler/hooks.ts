/**
 * Scheduler Page Dynamic Style Hooks
 * 根据当前主题模式返回对应的样式
 */

import { useMemo, type CSSProperties } from 'react';
import { useIsDark } from '@/theme';
import { getSchedulerTheme } from './theme';

// ==================== 页面容器样式 ====================
export const useSchedulerPageStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = getSchedulerTheme(isDark);

  return useMemo(
    () => ({
      minHeight: '100vh',
      background: isDark ? theme.background : '#f8fafc',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      padding: '24px',
    }),
    [isDark, theme]
  );
};

// ==================== 页面头部样式 ====================
export const useHeaderStyle = (): CSSProperties => {
  const isDark = useIsDark();

  return useMemo(
    () => ({
      display: 'flex' as const,
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: isDark ? '32px' : '24px',
      position: 'relative' as const,
      zIndex: 2,
    }),
    [isDark]
  );
};

// ==================== 标题样式 ====================
export const useTitleStyle = (): CSSProperties => {
  const isDark = useIsDark();

  return useMemo(() => {
    const gradient = isDark
      ? 'linear-gradient(135deg, #00f5ff 0%, #a855f7 50%, #f472b6 100%)'
      : 'linear-gradient(135deg, #0891b2 0%, #8b5cf6 100%)';

    return {
      fontSize: isDark ? '32px' : '28px',
      fontWeight: 700,
      margin: 0,
      background: gradient,
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
  const theme = getSchedulerTheme(isDark);

  return useMemo(
    () => ({
      fontSize: '14px',
      color: theme.textSecondary,
      marginTop: '6px',
    }),
    [theme]
  );
};

// ==================== 统计卡片网格样式 ====================
export const useStatsGridStyle = (): CSSProperties => {
  const isDark = useIsDark();

  return useMemo(
    () => ({
      display: 'grid' as const,
      gridTemplateColumns: 'repeat(4, 1fr)',
      gap: isDark ? '20px' : '16px',
      marginBottom: isDark ? '32px' : '24px',
      position: 'relative' as const,
      zIndex: 1,
    }),
    [isDark]
  );
};

// ==================== 统计卡片样式 ====================
export const useStatCardStyle = (_color: string): CSSProperties => {
  const isDark = useIsDark();
  const theme = getSchedulerTheme(isDark);

  return useMemo(() => {
    const baseStyle: CSSProperties = {
      borderRadius: isDark ? '16px' : '12px',
      padding: isDark ? '24px' : '20px',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      transition: 'all 0.3s ease',
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
      border: `1px solid ${theme.cardBorder}`,
      boxShadow: theme.cardShadow,
    };
  }, [isDark, theme]);
};

// ==================== 统计图标样式 ====================
export const useStatIconStyle = (color: string): CSSProperties => {
  const isDark = useIsDark();

  return useMemo(() => {
    const bgWithOpacity = `${color}${isDark ? '20' : '15'}`;

    return {
      width: isDark ? '56px' : '48px',
      height: isDark ? '56px' : '48px',
      borderRadius: isDark ? '14px' : '12px',
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      fontSize: isDark ? '24px' : '20px',
      background: bgWithOpacity,
      color,
      flexShrink: 0,
    };
  }, [isDark, color]);
};

// ==================== 时间轴容器样式 ====================
export const useTimelineContainerStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = getSchedulerTheme(isDark);

  return useMemo(() => {
    const baseStyle: CSSProperties = {
      borderRadius: isDark ? '20px' : '16px',
      padding: isDark ? '32px' : '24px',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      marginBottom: isDark ? '32px' : '24px',
    };

    if (isDark) {
      return {
        ...baseStyle,
        background: theme.cardBg,
        border: `1px solid ${theme.cardBorder}`,
        backdropFilter: 'blur(20px)',
      };
    }

    return {
      ...baseStyle,
      background: '#ffffff',
      border: `1px solid ${theme.cardBorder}`,
    };
  }, [isDark, theme]);
};

// ==================== 任务卡片样式 ====================
export const useTaskCardStyle = (isActive: boolean): CSSProperties => {
  const isDark = useIsDark();
  const theme = getSchedulerTheme(isDark);

  return useMemo(() => {
    const baseStyle: CSSProperties = {
      borderRadius: isDark ? '14px' : '12px',
      padding: isDark ? '20px' : '16px',
      position: 'relative' as const,
      overflow: 'hidden' as const,
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: 'pointer',
    };

    if (isDark) {
      if (isActive) {
        return {
          ...baseStyle,
          background: `${theme.statusActiveBg}`,
          border: `1px solid ${theme.statusActive}`,
          boxShadow: theme.statusActiveGlow,
        };
      }
      return {
        ...baseStyle,
        background: 'rgba(30, 41, 59, 0.5)',
        border: `1px solid transparent`,
      };
    }

    return {
      ...baseStyle,
      background: '#ffffff',
      border: `1px solid ${theme.cardBorder}`,
    };
  }, [isDark, theme, isActive]);
};

// ==================== Cron 芯点样式 ====================
export const useCronDotStyle = (status: 'active' | 'paused' | 'disabled'): CSSProperties => {
  const isDark = useIsDark();
  const theme = getSchedulerTheme(isDark);

  return useMemo(() => {
    const statusConfig =
      status === 'active'
        ? { color: theme.statusActive, size: 8 }
        : status === 'paused'
        ? { color: theme.statusPaused, size: 6 }
        : { color: theme.statusDisabled, size: 6 };

    return {
      width: isDark ? '12px' : '10px',
      height: isDark ? '12px' : '10px',
      borderRadius: '50%',
      background: statusConfig.color,
      boxShadow: status === 'active' ? `0 0 10px ${statusConfig.color}` : 'none',
      ...(status === 'active' && {
        animation: 'scheduler-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }),
    };
  }, [isDark, theme, status]);
};

// ==================== 操作按钮样式 ====================
export const useActionButtonStyle = (type: 'primary' | 'danger' | 'default' = 'default'): CSSProperties => {
  const isDark = useIsDark();
  const theme = getSchedulerTheme(isDark);

  return useMemo(() => {
    const baseStyle: CSSProperties = {
      width: '36px',
      height: '36px',
      borderRadius: isDark ? '10px' : '8px',
      display: 'flex' as const,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      transition: 'all 0.2s ease',
      border: 'none',
      cursor: 'pointer',
    };

    if (isDark) {
      if (type === 'primary') {
        return {
          ...baseStyle,
          background: theme.gradientPrimary,
          color: '#fff',
        };
      }
      if (type === 'danger') {
        return {
          ...baseStyle,
          background: 'rgba(239, 68, 68, 0.2)',
          color: '#ef4444',
          border: `1px solid rgba(239, 68, 68, 0.3)`,
        };
      }
      return {
        ...baseStyle,
        background: 'rgba(148, 163, 184, 0.1)',
        color: theme.textSecondary,
      };
    }

    // Light mode
    if (type === 'primary') {
      return {
        ...baseStyle,
        background: theme.gradientPrimary,
        color: '#fff',
      };
    }
    if (type === 'danger') {
      return {
        ...baseStyle,
        background: 'rgba(239, 68, 68, 0.1)',
        color: '#ef4444',
      };
    }
    return baseStyle;
  }, [isDark, theme]);
};

// ==================== 模态框样式 ====================
export const useModalStyle = () => {
  const isDark = useIsDark();

  return useMemo(() => ({
    content: {
      borderRadius: isDark ? '16px' : '12px',
      background: isDark ? '#1a1f3a' : '#ffffff',
      border: isDark ? '1px solid rgba(99, 102, 241, 0.3)' : undefined,
      boxShadow: isDark
        ? '0 20px 60px rgba(0, 0, 0, 0.5)'
        : '0 10px 40px rgba(0, 0, 0, 0.15)',
    },
    header: {
      borderBottom: isDark ? '1px solid rgba(99, 102, 241, 0.2)' : undefined,
    },
  }), [isDark]);
};

// ==================== 导出所有样式 hook ====================
export const useSchedulerStyles = () => {
  const isDark = useIsDark();
  const theme = getSchedulerTheme(isDark);

  return {
    isDark,
    theme,
    page: useSchedulerPageStyle(),
    header: useHeaderStyle(),
    title: useTitleStyle(),
    subtitle: useSubtitleStyle(),
    statsGrid: useStatsGridStyle(),
    timelineContainer: useTimelineContainerStyle(),
    modal: useModalStyle(),
  };
};
