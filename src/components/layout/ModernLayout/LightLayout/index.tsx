import { memo, useCallback, useState } from 'react';
import { LightNavbar } from './LightNavbar';
import { LightSidebar } from './LightSidebar';
import { mainContentStyle, mainContentCollapsedStyle, pageContentStyle } from './style';

interface LightLayoutProps {
  children: React.ReactNode;
}

export const LightLayout = memo<LightLayoutProps>(({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const handleMenuClick = useCallback(() => {
    // 可以在这里处理菜单点击后的额外逻辑
  }, []);

  return (
    <div data-modern-theme="light">
      {/* 导航栏 */}
      <LightNavbar onMenuClick={handleMenuClick} />

      {/* 侧边栏 */}
      <LightSidebar collapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />

      {/* 主内容 */}
      <main style={sidebarCollapsed ? mainContentCollapsedStyle : mainContentStyle}>
        <div style={pageContentStyle}>
          {children}
        </div>
      </main>
    </div>
  );
});

LightLayout.displayName = 'LightLayout';
