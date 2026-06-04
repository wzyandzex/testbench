/**
 * SWE page style hooks
 * "Code Terminal Command Center" styling
 */

import { useMemo } from 'react';
import { useIsDark } from '@/theme';
import { getSWETheme } from './theme';
import type { CSSProperties } from 'react';

// ==================== Page container ====================

/**
 * SWE page container style
 */
export const useSWEPageContainerStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = getSWETheme(isDark);

  return useMemo((): CSSProperties => ({
    position: 'relative',
    minHeight: '100vh',
    padding: '32px 48px',
    maxWidth: 1600,
    margin: '0 auto',
    background: isDark ? theme.background : undefined,
    ...(isDark && {
      backgroundImage: `
        linear-gradient(rgba(139, 233, 253, 0.03) 1px, transparent 1px),
        linear-gradient(90deg, rgba(139, 233, 253, 0.03) 1px, transparent 1px)
      `,
      backgroundSize: '40px 40px',
    }),
  }), [isDark, theme]);
};

// ==================== Task grid ====================

/**
 * SWE task grid layout
 */
export const useSWETaskGridStyle = (): CSSProperties => {
  return useMemo((): CSSProperties => ({
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: 16,
  }), []);
};

// ==================== Filter bar ====================

/**
 * Filter bar card style
 */
export const useFilterBarStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = getSWETheme(isDark);

  return useMemo((): CSSProperties => ({
    marginBottom: 16,
    borderRadius: isDark ? 0 : 8,
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    ...(isDark && {
      clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 0 100%)',
    }),
  }), [isDark, theme]);
};

// ==================== Detail page ====================

/**
 * Issue code panel style
 */
export const useIssueCodePanelStyle = (): CSSProperties => {
  const isDark = useIsDark();

  return useMemo((): CSSProperties => ({
    padding: 16,
    background: isDark ? '#0d1117' : '#f5f5f5',
    border: `1px solid ${isDark ? 'rgba(139, 233, 253, 0.2)' : 'rgba(0,0,0,0.1)'}`,
    borderRadius: 8,
    fontFamily: '"Fira Code", monospace',
    fontSize: 13,
    lineHeight: 1.6,
    maxHeight: 200,
    overflowY: 'auto' as CSSProperties['overflowY'],
  }), [isDark]);
};

// ==================== SWE Create Page styles ====================
/**
 * SWE create page style - cyber terminal aesthetic
 */

export const useSWECreatePageStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = getSWETheme(isDark);

  return useMemo(
    () => ({
      padding: isDark ? '32px 40px' : '24px',
      minHeight: '100vh',
      background: isDark ? theme.background : '#f5f7fa',
      position: 'relative' as const,
      overflow: 'hidden' as const,
    }),
    [isDark, theme]
  );
};

export const useSWEPageHeaderStyle = (): CSSProperties => {
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

export const useSWETitleStyle = (): CSSProperties => {
  const isDark = useIsDark();

  return useMemo(() => {
    const background = isDark
      ? 'linear-gradient(135deg, #8be9fd 0%, #bd93f9 100%)'
      : 'linear-gradient(135deg, #0d6efd 0%, #6f42c1 100%)';

    return {
      fontSize: isDark ? '28px' : '26px',
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

export const useSWESubtitleStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = getSWETheme(isDark);

  return useMemo(
    () => ({
      fontSize: '14px',
      color: theme.textSecondary,
      marginTop: '6px',
    }),
    [theme]
  );
};

export const useSWEContentStyle = (): CSSProperties => {
  return useMemo(
    () => ({
      position: 'relative' as const,
      zIndex: 1,
      maxWidth: '1200px',
      margin: '0 auto',
    }),
    []
  );
};

export const useSWEFormContainerStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = getSWETheme(isDark);

  return useMemo(() => {
    const baseStyle: CSSProperties = {
      borderRadius: isDark ? '20px' : '16px',
      padding: isDark ? '40px' : '32px',
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
      boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    };
  }, [isDark, theme]);
};

export const useSWEAlertStyle = (): CSSProperties => {
  const isDark = useIsDark();
  const theme = getSWETheme(isDark);

  return useMemo(() => {
    const baseStyle: CSSProperties = {
      borderRadius: isDark ? '14px' : '10px',
      marginBottom: '24px',
      position: 'relative' as const,
      zIndex: 1,
    };

    if (isDark) {
      return {
        ...baseStyle,
        background: `${theme.accent}10`,
        border: `1px solid ${theme.accent}40`,
      };
    }

    return {
      ...baseStyle,
      background: '#e6f7ff',
      border: '1px solid #91d5ff',
    };
  }, [isDark, theme]);
};
