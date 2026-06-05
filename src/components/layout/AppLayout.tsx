import { Layout, theme, Grid } from 'antd';
import { useUiStore } from '@/stores';
import { AppSidebar } from './AppSidebar';
import { AppHeader } from './AppHeader';

const { Content } = Layout;
const { useToken } = theme;

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const { token } = useToken();
  const themeMode = useUiStore((state) => state.theme);
  const isDark = themeMode === 'dark';
  const screens = Grid.useBreakpoint();
  const isCompact = !screens.lg;
  const effectiveSidebarCollapsed = isCompact || sidebarCollapsed;
  const sidebarWidth = effectiveSidebarCollapsed ? 80 : 240;
  const contentMargin = isCompact ? 12 : 24;
  const contentPadding = isCompact ? 12 : 24;

  return (
    <Layout style={{ minHeight: '100vh', minWidth: 0, background: token.colorBgLayout }}>
      <AppSidebar collapsed={effectiveSidebarCollapsed} />
      <Layout 
        style={{ 
          marginLeft: sidebarWidth,
          minWidth: 0,
          transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1) 0s',
          background: 'transparent'
        }}
      >
        <AppHeader />
        <Content
          style={{
            margin: contentMargin,
            minHeight: `calc(100vh - 64px - ${contentMargin * 2}px)`,
            background: token.colorBgContainer,
            borderRadius: isCompact ? token.borderRadius : token.borderRadiusLG,
            boxShadow: isDark ? '0 1px 4px 0 rgba(0, 0, 0, 0.4)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            border: isDark ? `1px solid ${token.colorBorderSecondary}` : 'none',
            overflow: 'auto',
            minWidth: 0,
            transition: 'background 0.3s cubic-bezier(0.2, 0, 0, 1) 0s, border 0.3s',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ flex: 1, minWidth: 0, padding: contentPadding }}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
