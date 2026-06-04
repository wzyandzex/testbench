import { memo, useCallback, useState } from 'react';
import { DarkBackground } from './DarkBackground';
import { DarkNavbar } from './DarkNavbar';
import { DarkSidebar } from './DarkSidebar';
import { pageContentStyle } from './style';

interface DarkLayoutProps {
  children: React.ReactNode;
}

export const DarkLayout = memo<DarkLayoutProps>(({ children }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const handleSidebarToggle = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const handleMenuClick = useCallback(() => {
    // 可以在这里处理菜单点击后的额外逻辑
  }, []);

  return (
    <div data-modern-theme="dark" className="modern-grid-bg">
      {/* 背景 */}
      <DarkBackground enableParticles enableAnimation />

      {/* 导航栏 */}
      <DarkNavbar onMenuClick={handleMenuClick} />

      {/* 侧边栏 */}
      <DarkSidebar collapsed={sidebarCollapsed} onToggle={handleSidebarToggle} />

      {/* 主内容 */}
      <main style={pageContentStyle}>
        {children}
      </main>
    </div>
  );
});

DarkLayout.displayName = 'DarkLayout';
