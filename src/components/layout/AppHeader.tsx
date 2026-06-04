import { Layout, Button, Avatar, Dropdown, Badge, Space, theme } from 'antd';
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
  const { t } = useTranslation();
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggleSidebar = useUiStore((state) => state.toggleSidebar);
  const notificationCount = useUiStore((state) => state.notificationCount);
  const themeMode = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  
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
      label: t('nav.profile'),
      onClick: () => navigate('/settings'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('nav.logout'),
      onClick: handleLogout,
    },
  ], [t, navigate, handleLogout]);

  const headerStyle = useMemo(() => ({
    padding: '0 24px',
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
  }), [token.colorBorderSecondary, isDark]);

  return (
    <Header style={headerStyle}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Button
          type="text"
          icon={sidebarCollapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          onClick={toggleSidebar}
          style={{ fontSize: 16, width: 40, height: 40, borderRadius: token.borderRadiusLG, color: token.colorText }}
        />
        <OrgSwitcher />
      </div>

      <Space size="middle" align="center">
        <Button
          type="text"
          icon={isDark ? <SunOutlined /> : <MoonOutlined />}
          onClick={toggleTheme}
          style={{ fontSize: 16, width: 40, height: 40, borderRadius: token.borderRadiusLG, color: token.colorTextSecondary }}
          title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        />

        <WSStatusDot />

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
            <span style={{ color: token.colorText, fontWeight: 500 }}>{user?.username}</span>
          </Space>
        </Dropdown>
      </Space>
    </Header>
  );
}
