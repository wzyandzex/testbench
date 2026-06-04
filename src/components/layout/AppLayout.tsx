import { Layout, theme } from 'antd';
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

  return (
    <Layout style={{ minHeight: '100vh', background: token.colorBgLayout }}>
      <AppSidebar collapsed={sidebarCollapsed} />
      <Layout 
        style={{ 
          marginLeft: sidebarCollapsed ? 80 : 240, 
          transition: 'all 0.3s cubic-bezier(0.2, 0, 0, 1) 0s',
          background: 'transparent'
        }}
      >
        <AppHeader />
        <Content
          style={{
            margin: '24px',
            minHeight: 'calc(100vh - 64px - 48px)',
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG,
            boxShadow: isDark ? '0 1px 4px 0 rgba(0, 0, 0, 0.4)' : '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
            border: isDark ? `1px solid ${token.colorBorderSecondary}` : 'none',
            overflow: 'auto',
            transition: 'background 0.3s cubic-bezier(0.2, 0, 0, 1) 0s, border 0.3s',
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div style={{ flex: 1, padding: '24px' }}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
}
