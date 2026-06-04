/**
 * 暗色布局样式常量
 */

import { CSSProperties } from 'react';

// 背景容器样式
export const backgroundContainerStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  zIndex: -1,
  backgroundColor: '#030303',
};

// 网格背景样式
export const gridBgStyle: CSSProperties = {
  position: 'absolute',
  inset: 0,
  backgroundImage: `
    linear-gradient(rgba(102, 126, 234, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(102, 126, 234, 0.03) 1px, transparent 1px)
  `,
  backgroundSize: '50px 50px',
};

// 光球基础样式
export const orbBaseStyle = (size: number, color: string, top: string, left: string): CSSProperties => ({
  position: 'absolute',
  width: size,
  height: size,
  top,
  left,
  background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
  filter: 'blur(80px)',
  borderRadius: '50%',
  pointerEvents: 'none',
});

// 导航栏样式
export const navbarStyle: CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  height: '56px',
  background: 'rgba(5, 5, 5, 0.75)',
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
  borderBottom: '1px solid rgba(102, 126, 234, 0.3)',
  display: 'flex',
  alignItems: 'center',
  padding: '0 32px',
  zIndex: 1000,
};

// Logo 样式
export const logoStyle: CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
  letterSpacing: '-0.5px',
  animation: 'glow-pulse 3s ease-in-out infinite',
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
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: 14,
  fontWeight: 500,
  padding: '8px 0',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  position: 'relative',
  textDecoration: 'none',
};

// 导航链接激活状态
export const navLinkActiveStyle: CSSProperties = {
  color: '#ffffff',
};

// 侧边栏样式
export const sidebarStyle: CSSProperties = {
  position: 'fixed',
  right: '32px',
  top: '80px',
  width: '200px',
  background: 'rgba(15, 15, 15, 0.65)',
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '16px',
  padding: '16px',
  zIndex: 900,
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
};

// 侧边栏收起状态
export const sidebarCollapsedStyle: CSSProperties = {
  ...sidebarStyle,
  width: '60px',
  right: '32px',
};

// 快捷操作按钮样式
export const quickActionBtnStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%',
  padding: '12px',
  marginBottom: '8px',
  background: 'rgba(255, 255, 255, 0.05)',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: 13,
  fontWeight: 500,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

// 快捷操作按钮悬停
export const quickActionBtnHoverStyle: CSSProperties = {
  background: 'rgba(102, 126, 234, 0.15)',
  borderColor: 'rgba(102, 126, 234, 0.3)',
  color: '#ffffff',
};

// 主内容区域样式
export const mainContentStyle: CSSProperties = {
  paddingTop: '56px',
  minHeight: '100vh',
  position: 'relative',
};

// 页面内容容器
export const pageContentStyle: CSSProperties = {
  padding: '80px 48px 48px 300px',
  maxWidth: '1600px',
  margin: '0 auto',
};

// 统计卡片样式
export const statCardDarkStyle: CSSProperties = {
  background: 'rgba(15, 15, 15, 0.85)',
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'rgba(255, 255, 255, 0.08)',
  borderRadius: '16px',
  padding: '24px',
  position: 'relative',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
};

// 统计卡片悬停
export const statCardDarkHoverStyle: CSSProperties = {
  borderColor: 'rgba(102, 126, 234, 0.3)',
  boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2), 0 0 0 1px rgba(102, 126, 234, 0.4)',
  transform: 'translateY(-4px)',
};

// 统计卡片装饰性光晕
export const statCardGlowStyle = (color: string): CSSProperties => ({
  position: 'absolute' as const,
  top: -20,
  right: -20,
  width: 120,
  height: 120,
  background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
  borderRadius: '50%',
  pointerEvents: 'none',
});

// 图表卡片样式
export const chartCardDarkStyle: CSSProperties = {
  background: 'rgba(15, 15, 15, 0.85)',
  backdropFilter: 'blur(32px)',
  WebkitBackdropFilter: 'blur(32px)',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'rgba(255, 255, 255, 0.08)',
  borderRadius: '16px',
  padding: '24px',
};

// 右侧操作区样式
export const actionRightStyle: CSSProperties = {
  position: 'fixed',
  top: '80px',
  right: '32px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  zIndex: 900,
};

// 呼吸光晕动画
export const breatheGlowStyle = (color: string): CSSProperties => ({
  animation: 'breathe-glow 3s ease-in-out infinite',
  boxShadow: `0 0 20px ${color}40`,
});

// 用户菜单样式
export const userMenuStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '8px 16px',
  background: 'rgba(255, 255, 255, 0.05)',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '24px',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

// 通知按钮样式
export const notificationBtnStyle: CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '40px',
  height: '40px',
  background: 'rgba(255, 255, 255, 0.05)',
  borderWidth: '1px',
  borderStyle: 'solid',
  borderColor: 'rgba(255, 255, 255, 0.1)',
  borderRadius: '12px',
  color: 'rgba(255, 255, 255, 0.7)',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
};

// 通知徽章
export const notificationBadgeStyle: CSSProperties = {
  position: 'absolute',
  top: '-4px',
  right: '-4px',
  minWidth: '18px',
  height: '18px',
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  borderWidth: '2px',
  borderStyle: 'solid',
  borderColor: '#030303',
  borderRadius: '9px',
  fontSize: '11px',
  fontWeight: 600,
  color: '#fff',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0 5px',
};
