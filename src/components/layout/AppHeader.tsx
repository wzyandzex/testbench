import { Layout, Button, Avatar, Dropdown, Badge, Space, theme, Grid } from 'antd';
import type { MenuProps } from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  BellOutlined,
  MoonOutlined,
  SunOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useUiStore, useAuthStore } from '@/stores';
import { OrgSwitcher } from '@/components/common/OrgSwitcher';
import { WSStatusDot } from '@/components/layout/WSStatusDot';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { useMemo } from 'react';

const { Header } = Layout;
const { useToken } = theme;

export function AppHeader() {
  const navigate = useNavigate();
  const { t } = useTranslation('nav');
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const notificationCount = useUiStore((state) => state.notificationCount);
  const themeMode = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const screens = Grid.useBreakpoint();
  const isCompact = !screens.lg;
  const isNarrow = !screens.sm;
  const effectiveSidebarCollapsed = isCompact || sidebarCollapsed;
  
  const { token } = useToken();
  const isDark = themeMode === 'dark';

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  const menuItems: MenuProps['items'] = useMemo(() => [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('profile'),
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('logout'),
      onClick: handleLogout,
    },
  ], [t, navigate, handleLogout]);

  const headerStyle = useMemo(() => ({
    padding: isCompact ? '0 12px' : '0 24px',
    background: isDark ? '#141414' : '#ffffff', // Use a slightly defined background 
    borderBottom: `1px solid ${token.colorBorderSecondary}`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
    boxShadow: isDark ? '0 1px 4px 0 rgba(0, 0, 0, 0.5)' : '0 1px 4px 0 rgba(0, 0, 0, 0.05)',
    transition: 'background 0.3s cubic-bezier(0.2, 0, 0, 1) 0s, box-shadow 0.3s cubic-bezier(0.2, 0, 0, 1) 0s',
  }), [isCompact, token.colorBorderSecondary, isDark]);

  return (
    <Header style={headerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: isCompact ? 8 : 16, minWidth: 0 }}>
        <Button
          type="text"
          icon={effectiveSidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleSidebar}
          style={{ fontSize: 16, width: 40, height: 40, borderRadius: token.borderRadiusLG, color: token.colorText }}
        />
        {!isCompact && <OrgSwitcher />}
      </div>

      <Space size={isCompact ? 8 : 'middle'} align="center" style={{ minWidth: 0 }}>
        <Button
          type="text"
          icon={isDark ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleTheme}
          style={{ fontSize: 16, width: 40, height: 40, borderRadius: token.borderRadiusLG, color: token.colorTextSecondary }}
          title={isDark ? t('theme.switchToLight') : t('theme.switchToDark')}
        />

        {!isNarrow && <WSStatusDot />}

        <LanguageSwitcher />

        <Badge count={notificationCount} size="small" offset={[-4, 4]}>
          <Button
            type="text"
            icon={<BellOutlined />}
            onClick={() => navigate('/notifications')}
            style={{ fontSize: 16, width: 40, height: 40, borderRadius: token.borderRadiusLG, color: token.colorTextSecondary }}
          />
        </Badge>

        <Dropdown menu={{ items: menuItems }} placement="bottomRight" arrow={{ pointAtCenter: true }}>
          <Space style={{ cursor: 'pointer', padding: '4px 8px', borderRadius: token.borderRadiusLG, transition: 'background 0.3s' }}>
            <Avatar size="small" icon={<UserOutlined />} src={user?.avatar} style={{ backgroundColor: token.colorPrimary, color: '#fff' }} />
            {!isCompact && <span style={{ color: token.colorText, fontWeight: 500 }}>{user?.username}</span>}
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
}
