/**
 * Dashboard 页面样式常量
 */

import { CSSProperties } from 'react';

// 页面容器样式
export const pageContainerStyle: CSSProperties = {
  padding: '32px 48px',
  maxWidth: 1600,
  margin: '0 auto',
};

// 页面标题区域样式
export const headerStyle: CSSProperties = {
  marginBottom: 32,
  opacity: 0,
  animation: 'fadeInDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
};

// 统计卡片容器样式
export const statsContainerStyle: CSSProperties = {
  marginBottom: 32,
};

// 卡片基础样式
export const cardBaseStyle: CSSProperties = {
  borderRadius: 12,
  border: '1px solid #f0f0f0',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
};

// 动画进入样式
export const fadeUpStyle = (delay: number): CSSProperties => ({
  opacity: 0,
  animation: `fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms forwards`,
});

// 统计卡片样式
export const statCardStyle = (visible: boolean): CSSProperties => ({
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : 'translateY(20px)',
  transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
  borderRadius: 12,
  border: '1px solid #f0f0f0',
  boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
  overflow: 'hidden' as const,
  position: 'relative' as const,
});

// 图标容器样式
export const iconContainerStyle = (color: string): CSSProperties => ({
  width: 48,
  height: 48,
  borderRadius: 12,
  background: `${color}15`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
  color,
});

// 装饰性背景样式
export const decorationBgStyle = (color: string): CSSProperties => ({
  position: 'absolute' as const,
  top: -20,
  right: -20,
  width: 100,
  height: 100,
  background: `radial-gradient(circle, ${color}15 0%, transparent 70%)`,
  borderRadius: '50%',
});

// 趋势变化标签样式
export const trendTagStyle = (positive: boolean): CSSProperties => ({
  padding: '4px 10px',
  borderRadius: 20,
  fontSize: 12,
  fontWeight: 500,
  background: positive ? '#f6ffed' : '#fff2f0',
  color: positive ? '#52c41a' : '#ff4d4f',
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
});

// 数值样式
export const valueStyle: CSSProperties = {
  fontSize: 32,
  fontWeight: 600,
  color: '#000',
};

// 表格行悬停样式
export const tableRowHoverStyle = {
  transition: 'all 0.2s',
  cursor: 'pointer',
};

// 快捷操作卡片样式
export const quickActionCardStyle = (visible: boolean): CSSProperties => ({
  opacity: visible ? 1 : 0,
  transform: visible ? 'translateY(0)' : 'translateY(20px)',
  transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
  padding: 20,
  borderRadius: 12,
  border: '1px solid #f0f0f0',
  background: '#fff',
  cursor: 'pointer',
});

// 快捷操作图标容器样式
export const quickActionIconStyle: CSSProperties = {
  width: 48,
  height: 48,
  borderRadius: 12,
  background: '#000',
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: 20,
  marginBottom: 16,
};
