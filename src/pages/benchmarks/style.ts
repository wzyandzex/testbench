/**
 * Benchmark 页面样式常量
 *
 * @deprecated 此文件中的样式常量已被主题系统替代。
 * 请使用 @/theme 中的 hooks 和工具函数来获取主题感知的样式。
 * 新代码应使用 useThemeTokens、useCardStyle、useStatCardStyle 等 hooks。
 *
 * 迁移指南:
 * - statCardStyle -> useStatCardStyle()
 * - pageContainerStyle -> 使用内联样式或从主题系统获取
 * - 硬编码颜色 -> 使用 useThemeTokens() 获取主题颜色
 */

import { CSSProperties } from 'react';

// 页面容器样式
export const pageContainerStyle: CSSProperties = {
  padding: '32px 48px',
  maxWidth: 1600,
  margin: '0 auto',
};

// 统计卡片样式
export const statCardStyle: CSSProperties = {
  padding: '16px 20px',
  background: '#fff',
  borderRadius: 12,
  border: '1px solid #f0f0f0',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
};

// 统计数值样式
export const statValueStyle = (color: string): CSSProperties => ({
  fontSize: 28,
  fontWeight: 700,
  color,
  marginTop: 4,
});

// 空状态样式
export const emptyStateStyle: CSSProperties = {
  padding: 80,
  textAlign: 'center',
  background: '#fff',
  borderRadius: 12,
  border: '1px solid #f0f0f0',
};

// 筛选栏样式
export const filterBarStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: 20,
};

// 网格视图卡片样式
export const gridCardStyle: CSSProperties = {
  height: '100%',
  borderRadius: 12,
  border: '1px solid #f0f0f0',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
  cursor: 'pointer',
};

// 网格卡片悬停样式
export const gridCardHoverStyle = {
  borderColor: '#000',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  transform: 'translateY(-4px)',
};

// 通用页面样式（大写命名兼容）
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

export const FILTER_BAR_STYLE_COMPAT: CSSProperties = {
  display: 'flex',
  gap: 12,
  flexWrap: 'wrap' as const,
  alignItems: 'center',
};

export const STAT_VALUE_STYLE: CSSProperties = {
  fontSize: 24,
  fontWeight: 600,
};
