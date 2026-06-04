import { memo, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Badge, Avatar, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  MoonOutlined,
  SunOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useUiStore, useAuthStore } from '@/stores';
import { OrgSwitcherDark } from '@/components/common/OrgSwitcher';
import { WSStatusDot } from '@/components/layout/WSStatusDot';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { navbarStyle, logoStyle, navLinksStyle, navLinkStyle, navLinkActiveStyle } from './style';
import { buildWorkspaceNavigation, isNavigationItemActive } from '@/components/layout/navigation';
import { useWorkspaceStore } from '@/stores/workspaceStore';

interface DarkNavbarProps {
  onMenuClick?: () => void;
}

export const DarkNavbar = memo<DarkNavbarProps>(({ onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const theme = useUiStore((s) => s.theme);
  const setTheme = useUiStore((s) => s.setTheme);
  const notificationCount = useUiStore((s) => s.notificationCount);
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const currentOrg = useWorkspaceStore((state) => state.currentOrg);
  const hasMultipleOrgs = useWorkspaceStore((state) => state.hasMultipleOrgs());
  const navigation = useMemo(
    () =>
      buildWorkspaceNavigation({
        currentOrgId: currentOrg?.org_id,
        hasMultipleOrgs,
        dashboardPath: '/dashboard-v2',
      }),
    [currentOrg?.org_id, hasMultipleOrgs]
  );
  const navItems = navigation.navbar;

  // 处理导航点击
  const handleNavClick = useCallback((path: string) => {
    navigate(path);
    onMenuClick?.();
  }, [navigate, onMenuClick]);

  // 切换主题
  const handleThemeToggle = useCallback(() => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  }, [theme, setTheme]);

  // 登出
  const handleLogout = useCallback(() => {
    clearAuth();
    navigate('/login');
  }, [clearAuth, navigate]);

  // 用户菜单
  const userMenuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: t('nav.profile'),
      onClick: () => navigate('/settings'),
    },
    {
      key: 'settings',
      icon: <SettingOutlined />,
      label: t('nav.settings'),
      onClick: () => navigate('/settings'),
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('nav.logout'),
      onClick: handleLogout,
    },
  ];

  // 检查当前路径是否激活
  const isActive = useCallback((path: string) => {
    return isNavigationItemActive(location.pathname, path);
  }, [location.pathname]);

  return (
    <nav style={navbarStyle}>
      {/* Logo */}
      <div style={{ ...logoStyle, cursor: 'pointer' }} onClick={() => navigate(navItems[0]?.path || '/dashboard-v2')}>
        MyAgent
      </div>

      {/* 组织切换 */}
      <OrgSwitcherDark />

      {/* 主导航链接 */}
      <div style={navLinksStyle}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <span
              key={item.key}
              onClick={() => handleNavClick(item.path)}
              style={{
                ...navLinkStyle,
                ...(active ? navLinkActiveStyle : {}),
              }}
              className={`nav-link ${active ? 'active' : ''}`}
            >
              {item.label}
            </span>
          );
        })}
      </div>

      {/* 右侧操作区 */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* WS 连接状态 */}
        <WSStatusDot />

        {/* 主题切换 */}
        <div
          onClick={handleThemeToggle}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            background: 'rgba(255, 255, 255, 0.05)',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderRadius: 10,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
            e.currentTarget.style.background = 'rgba(102, 126, 234, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
          }}
        >
          {theme === 'dark' ? <MoonOutlined style={{ color: 'rgba(255,255,255,0.65)' }} /> : <SunOutlined />}
        </div>

        <LanguageSwitcher variant="modern-dark" />

        {/* 通知 */}
        <Badge count={notificationCount} size="small">
          <div
            onClick={() => navigate('/notifications')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 36,
              height: 36,
              background: 'rgba(255, 255, 255, 0.05)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 10,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            <BellOutlined style={{ color: 'rgba(255,255,255,0.65)' }} />
          </div>
        </Badge>

        {/* 用户菜单 */}
        <Dropdown menu={{ items: userMenuItems }} placement="bottomRight" trigger={['click']}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              background: 'rgba(255, 255, 255, 0.05)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 20,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
            }}
          >
            <Avatar
              size={24}
              icon={<UserOutlined />}
              src={user?.avatar}
              style={{ backgroundColor: 'rgba(102, 126, 234, 0.3)' }}
            />
            <span style={{ color: 'rgba(255,255,255,0.95)', fontSize: 14, fontWeight: 500 }}>
              {user?.username || 'User'}
            </span>
          </div>
        </Dropdown>
      </div>
    </nav>
  );
});

DarkNavbar.displayName = 'DarkNavbar';
