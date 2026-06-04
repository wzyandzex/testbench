/**
 * Scheduler 页面样式常量
 */

export const PAGE_CONTAINER_STYLE = {
  padding: '32px 48px',
  maxWidth: 1600,
  margin: '0 auto',
} as const;

export const PAGE_HEADER_STYLE = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 24,
} as const;

export const PAGE_TITLE_STYLE = {
  margin: 0,
  fontSize: 24,
  fontWeight: 600,
} as const;

export const STATS_GRID_STYLE = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: 16,
  marginBottom: 24,
} as const;

export const STAT_CARD_STYLE = {
  padding: '16px 20px',
  background: '#fff',
  borderRadius: 8,
  border: '1px solid #f0f0f0',
  display: 'flex',
  alignItems: 'center',
  gap: 16,
} as const;

export const STAT_ICON_STYLE = {
  width: 48,
  height: 48,
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
  background: '#f5f5f5',
} as const;

export const STAT_INFO_STYLE = {
  flex: 1,
} as const;

export const STAT_LABEL_STYLE = {
  fontSize: 12,
  color: '#999',
} as const;

export const STAT_VALUE_STYLE = {
  fontSize: 24,
  fontWeight: 600,
} as const;

export const CARD_CONTAINER_STYLE = {
  borderRadius: 8,
  marginBottom: 16,
} as const;
