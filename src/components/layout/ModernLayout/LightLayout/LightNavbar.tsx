import { memo, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Badge, Avatar, Dropdown } from 'antd';
import type { MenuProps } from 'antd';
import {
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useUiStore, useAuthStore } from '@/stores';
import { OrgSwitcher } from '@/components/common/OrgSwitcher';
import { WSStatusDot } from '@/components/layout/WSStatusDot';
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher';
import { navbarStyle, logoStyle, navLinksStyle, navLinkStyle, navLinkActiveStyle } from './style';
import { buildWorkspaceNavigation, isNavigationItemActive } from '@/components/layout/navigation';
import { useWorkspaceStore } from '@/stores/workspaceStore';

interface LightNavbarProps {
  onMenuClick?: () => void;
}

export const LightNavbar = memo<LightNavbarProps>(({ onMenuClick }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
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

  const handleNavClick = useCallback((path: string) => {
    navigate(path);
    onMenuClick?.();
  }, [navigate, onMenuClick]);

  const handleLogout = useCallback(() => {
    clearAuth();
    navigate('/login');
  }, [clearAuth, navigate]);

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
      <OrgSwitcher />

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
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* WS 连接状态 */}
        <WSStatusDot />

        <LanguageSwitcher variant="modern-light" />

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
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <BellOutlined style={{ color: '#666666', fontSize: 16 }} />
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
              borderRadius: 20,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f3f4f6';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            <Avatar
              size={28}
              icon={<UserOutlined />}
              src={user?.avatar}
              style={{ backgroundColor: '#f3f4f6', color: '#666666' }}
            />
            <span style={{ color: '#111111', fontSize: 14, fontWeight: 500 }}>
              {user?.username || 'User'}
            </span>
          </div>
        </Dropdown>
      </div>
    </nav>
  );
});

LightNavbar.displayName = 'LightNavbar';
