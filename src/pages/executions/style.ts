/**
 * @deprecated Use the theme system in src/theme/ instead.
 *
 * Legacy style constants kept for backward compatibility.
 * New code should use hooks like useThemeTokens and useCardStyle.
 *
 * @example
 * // Legacy (deprecated)
 * import { pageContainerStyle } from './style';
 *
 * // New (recommended)
 * import { useCardStyle, useThemeTokens } from '@/theme';
 *
 * const tokens = useThemeTokens();
 * const cardStyle = useCardStyle();
 *
 * @see {@link https://github.com/anthropics/claude-code/tree/main/src/theme} theme system docs
 */

import { CSSProperties } from 'react';

// page container
export const pageContainerStyle: CSSProperties = {
  padding: '32px 48px',
  maxWidth: 1600,
  margin: '0 auto',
};

// status tag
export const statusTagStyle = (color: string): CSSProperties => ({
  margin: 0,
  padding: '4px 12px',
  borderRadius: 20,
  border: `1px solid ${color}40`,
  background: `${color}15`,
  color,
  fontSize: 13,
  fontWeight: 500,
});

// log container
export const logContainerStyle: CSSProperties = {
  background: '#1e1e1e',
  borderRadius: 8,
  padding: 16,
  maxHeight: 400,
  overflow: 'auto',
  fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
  fontSize: 13,
  lineHeight: 1.6,
};

// log line (per level)
export const logLineStyle = (level: string): CSSProperties => {
  const colors = {
    info: '#60a5fa',
    warn: '#fbbf24',
    error: '#f87171',
    debug: '#9ca3af',
    success: '#34d399',
  };
  return {
    padding: '4px 0',
    color: colors[level as keyof typeof colors] || '#e5e7eb',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  };
};

// progress card
export const progressCardStyle: CSSProperties = {
  borderRadius: 12,
  border: '1px solid #f0f0f0',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
};

// timeline
export const timelineStyle: CSSProperties = {
  padding: '16px 0',
};

// UPPER_CASE aliases (compat)
export const PAGE_CONTAINER_STYLE: CSSProperties = {
  padding: '32px 48px',
  maxWidth: 1600,
  margin: '0 auto',
};

export const PAGE_HEADER_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 24,
};

export const PAGE_TITLE_STYLE: CSSProperties = {
  margin: 0,
  fontSize: 24,
  fontWeight: 600,
};

export const TIMELINE_STYLE: CSSProperties = {
  marginTop: 16,
};

export const EMPTY_STATE_STYLE: CSSProperties = {
  padding: 60,
  textAlign: 'center',
  color: '#999',
};

export const STATS_GRID_STYLE: CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: 16,
  marginBottom: 24,
};

export const STAT_CARD_STYLE: CSSProperties = {
  padding: '16px 20px',
  background: '#fff',
  borderRadius: 8,
  border: '1px solid #f0f0f0',
  display: 'flex',
  alignItems: 'center',
  gap: 16,
};

export const STAT_ICON_STYLE: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
};

export const STAT_INFO_STYLE: CSSProperties = {
  flex: 1,
};

export const STAT_LABEL_STYLE: CSSProperties = {
  fontSize: 12,
  color: '#999',
};

export const CARD_CONTAINER_STYLE: CSSProperties = {
  borderRadius: 8,
  marginBottom: 16,
};

export const ACTION_BAR_STYLE: CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 16,
  padding: '12px 16px',
  background: '#fff',
  borderRadius: 8,
  border: '1px solid #f0f0f0',
};

export const FILTER_BAR_STYLE: CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap' as const,
  alignItems: 'center',
};

export const STAT_VALUE_STYLE: CSSProperties = {
  fontSize: 24,
  fontWeight: 600,
};
