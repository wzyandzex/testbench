import { Layout, Menu, Typography, theme } from 'antd';
import type { MenuProps } from 'antd';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  buildWorkspaceNavigation,
  resolveActiveNavigationKey,
  toMenuItems,
  type WorkspaceMenuItems,
} from './navigation';
import { useAuthStore } from '@/stores';
import { useUiStore } from '@/stores';
import { useWorkspaceStore } from '@/stores/workspaceStore';

const { Sider } = Layout;
const { Text } = Typography;

interface AppSidebarProps {
  collapsed?: boolean;
}

function toGroupedMenuItems(
  groups: Array<{ key: string; label: string; items: WorkspaceMenuItems }>
): MenuProps['items'] {
  return groups
    .filter((group) => group.items.length > 0)
    .map((group) => ({
      key: group.key,
      type: 'group' as const,
      label: group.label,
      children: group.items,
    }));
}

export function AppSidebar({ collapsed = false }: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('nav');
  const themeMode = useUiStore((state) => state.theme);
  const currentOrg = useWorkspaceStore((state) => state.currentOrg);
  const hasMultipleOrgs = useWorkspaceStore((state) => state.hasMultipleOrgs());
  const isAdmin = useAuthStore((state) => state.user?.role === 'admin');
  const { token } = theme.useToken();

  const navigation = buildWorkspaceNavigation({
    currentOrgId: currentOrg?.org_id,
    hasMultipleOrgs,
    dashboardPath: '/dashboard',
    isAdmin,
    t: (key) => t(key),
  });
  const allItems = [
    ...navigation.mainline,
    ...navigation.operations,
    ...navigation.compatibility,
    ...navigation.admin,
    ...navigation.bottom,
  ];
  const selectedKey = resolveActiveNavigationKey(location.pathname, allItems);
  const groupedItems = toGroupedMenuItems([
    { key: 'mainline', label: t('groups.mainline'), items: toMenuItems(navigation.mainline) },
    { key: 'operations', label: t('groups.operations'), items: toMenuItems(navigation.operations) },
    { key: 'compatibility', label: t('groups.compatibility'), items: toMenuItems(navigation.compatibility) },
    { key: 'admin', label: t('groups.admin'), items: toMenuItems(navigation.admin) },
  ]);

  return (
    <Sider
      collapsed={collapsed}
      width={240}
      theme={themeMode === 'dark' ? 'dark' : 'light'}
      trigger={null}
      style={{
        display: 'flex',
        flexDirection: 'column',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        overflow: 'auto',
        borderRight: themeMode === 'dark' ? undefined : `1px solid ${token.colorBorderSecondary}`,
        background: token.colorBgContainer,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          height: 64,
          padding: collapsed ? 0 : '0 20px',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <Text strong style={{ fontSize: collapsed ? 16 : 18 }}>
          {collapsed ? 'MA' : 'MyAgent'}
        </Text>
      </div>

      <Menu
        mode="inline"
        selectedKeys={selectedKey ? [selectedKey] : []}
        items={groupedItems}
        onClick={({ key }) => navigate(String(key))}
        style={{
          borderInlineEnd: 'none',
          paddingTop: 12,
        }}
      />

      <div
        style={{
          marginTop: 'auto',
          borderTop: `1px solid ${token.colorBorderSecondary}`,
          paddingTop: 8,
        }}
      >
        <Menu
          mode="inline"
          selectedKeys={selectedKey ? [selectedKey] : []}
          items={toMenuItems(navigation.bottom)}
          onClick={({ key }) => navigate(String(key))}
          style={{ borderInlineEnd: 'none' }}
        />
      </div>
    </Sider>
  );
}

export default AppSidebar;
