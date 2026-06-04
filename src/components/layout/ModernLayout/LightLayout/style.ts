/**
 * 亮色布局样式常量
 */

import { CSSProperties } from 'react';

// 导航栏样式
export const navbarStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: '56px',
  background: '#ffffff',
  borderBottom: '1px solid #e2e8f0',
  display: 'flex',
  alignItems: 'center',
  padding: '0 32px',
  zIndex: 1000,
};

// Logo 样式
export const logoStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: '#0f172a',
  letterSpacing: '-0.5px',
};

// 导航链接容器
export const navLinksStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 32,
  marginLeft: 48,
};

// 导航链接样式
export const navLinkStyle: CSSProperties = {
  color: '#64748b',
  fontSize: 14,
  fontWeight: 500,
  padding: '18px 0',
  cursor: 'pointer',
  transition: 'color 0.3s ease',
  position: 'relative',
  textDecoration: 'none',
};

// 导航链接激活状态
export const navLinkActiveStyle: CSSProperties = {
  color: '#0f172a',
};

// 侧边栏样式
export const sidebarStyle: CSSProperties = {
  position: 'fixed',
  left: 0,
  top: '56px',
  width: '240px',
  height: 'calc(100vh - 56px)',
  background: '#f8fafc',
  borderRight: '1px solid #e2e8f0',
  padding: '24px 16px',
  zIndex: 900,
  overflowY: 'auto',
};

// 侧边栏收起状态
export const sidebarCollapsedStyle: CSSProperties = {
  ...sidebarStyle,
  width: '72px',
};

// 侧边栏分组标题
export const sidebarGroupTitleStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: '#94a3b8',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: 12,
  paddingLeft: 12,
};

// 侧边栏菜单项样式
export const sidebarMenuItemStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  padding: '10px 12px',
  marginBottom: 4,
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  color: '#64748b',
  fontSize: 14,
  fontWeight: 500,
};

// 侧边栏菜单项悬停/激活
export const sidebarMenuItemActiveStyle: CSSProperties = {
  background: '#ffffff',
  color: '#0f172a',
  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
};

// 主内容区域样式
export const mainContentStyle: CSSProperties = {
  marginLeft: '240px',
  paddingTop: '56px',
  minHeight: '100vh',
  background: '#f8fafc',
  transition: 'margin-left 0.3s ease',
};

// 主内容区域（侧边栏收起）
export const mainContentCollapsedStyle: CSSProperties = {
  ...mainContentStyle,
  marginLeft: '72px',
};

// 页面内容容器
export const pageContentStyle: CSSProperties = {
  padding: '32px 48px',
  maxWidth: '1400px',
  margin: '0 auto',
};

// 卡片样式
export const cardStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  transition: 'all 0.3s ease',
};

// 卡片悬停
export const cardHoverStyle: CSSProperties = {
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  transform: 'translateY(-2px)',
};

// 统计卡片样式
export const statCardStyle: CSSProperties = {
  ...cardStyle,
  padding: 24,
};

// 图表卡片样式
export const chartCardStyle: CSSProperties = {
  ...cardStyle,
  padding: 24,
};

// 操作按钮样式
export const actionBtnStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 36,
  height: 36,
  background: 'transparent',
  border: 'none',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  color: '#64748b',
};

// 操作按钮悬停
export const actionBtnHoverStyle: CSSProperties = {
  background: '#f3f4f6',
  color: '#0f172a',
};

// 通知徽章样式
export const notificationBadgeStyle: CSSProperties = {
  position: 'absolute',
  top: '-4px',
  right: '-4px',
  minWidth: '16px',
  height: '16px',
  background: '#ef4444',
  borderRadius: '8px',
  fontSize: 10,
  fontWeight: 600,
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 4px',
};

// 用户菜单样式
export const userMenuStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 12px',
  borderRadius: 20,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

// 用户菜单悬停
export const userMenuHoverStyle: CSSProperties = {
  background: '#f3f4f6',
};

// 快捷操作卡片样式
export const quickActionCardStyle: CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 12,
  padding: 16,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  textAlign: 'center',
};

// 快捷操作卡片悬停
export const quickActionCardHoverStyle: CSSProperties = {
  borderColor: 'rgba(102, 126, 234, 0.3)',
  boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
  transform: 'translateY(-4px)',
};

// 快捷操作图标样式
export const quickActionIconStyle: CSSProperties = {
  width: 48,
  height: 48,
  margin: '0 auto 12px',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderRadius: 12,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#ffffff',
  fontSize: 20,
};

// 折叠按钮样式
export const collapseBtnStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  height: 40,
  marginBottom: 16,
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  color: '#94a3b8',
};

// 折叠按钮悬停
export const collapseBtnHoverStyle: CSSProperties = {
  background: '#ffffff',
  color: '#0f172a',
};
