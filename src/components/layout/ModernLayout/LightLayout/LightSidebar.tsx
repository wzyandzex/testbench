import { memo, useCallback, useMemo, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons';
import {
  sidebarStyle,
  sidebarCollapsedStyle,
  sidebarGroupTitleStyle,
  sidebarMenuItemStyle,
  sidebarMenuItemActiveStyle,
  collapseBtnStyle,
} from './style';
import {
  buildWorkspaceNavigation,
  isNavigationItemActive,
  type WorkspaceNavigationItem,
} from '@/components/layout/navigation';
import { useWorkspaceStore } from '@/stores/workspaceStore';

interface LightSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const LightSidebar = memo<LightSidebarProps>(({ collapsed = false, onToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
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
  const mainNavItems = navigation.mainline;
  const otherNavItems = [...navigation.operations, ...navigation.compatibility];
  const bottomNavItems = navigation.bottom;
  const collapsedNavItems = [...mainNavItems, ...otherNavItems];

  // 检查路径是否激活
  const isActive = useCallback((path: string) => {
    return isNavigationItemActive(location.pathname, path);
  }, [location.pathname]);

  // 处理导航
  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  // 渲染菜单项
  const renderMenuItem = (item: WorkspaceNavigationItem) => {
    const active = isActive(item.path);
    const hovered = hoveredItem === item.path;

    return (
      <div
        key={item.path}
        onClick={() => handleNavigate(item.path)}
        onMouseEnter={() => setHoveredItem(item.path)}
        onMouseLeave={() => setHoveredItem(null)}
        style={{
          ...sidebarMenuItemStyle,
          ...(active || hovered ? sidebarMenuItemActiveStyle : {}),
        }}
      >
        <span style={{ fontSize: 16, color: active ? '#667eea' : 'inherit' }}>
          {item.icon}
        </span>
        {!collapsed && <span>{item.label}</span>}
      </div>
    );
  };

  return (
    <aside style={collapsed ? sidebarCollapsedStyle : sidebarStyle}>
      {/* 折叠按钮 */}
      <div
        onClick={onToggle}
        style={collapseBtnStyle}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#ffffff';
          e.currentTarget.style.color = '#111111';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#999999';
        }}
      >
        {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
      </div>

      {/* 主导航 */}
      {!collapsed && (
        <div style={{ marginBottom: 24 }}>
          <div style={sidebarGroupTitleStyle}>Main</div>
          {mainNavItems.map(renderMenuItem)}
        </div>
      )}

      {/* 折叠状态的主导航 */}
      {collapsed && collapsedNavItems.map((item) => {
        const active = isActive(item.path);
        return (
          <div
            key={item.path}
            onClick={() => handleNavigate(item.path)}
            title={item.label}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: 40,
              marginBottom: 4,
              borderRadius: 8,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              color: active ? '#667eea' : '#666666',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ffffff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {item.icon}
          </div>
        );
      })}

      {/* 其他导航 */}
      {!collapsed && (
        <div style={{ marginBottom: 24 }}>
          <div style={sidebarGroupTitleStyle}>Operations</div>
          {otherNavItems.map(renderMenuItem)}
        </div>
      )}

      {/* 底部导航 */}
      <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid rgba(0, 0, 0, 0.06)' }}>
        {!collapsed ? (
          bottomNavItems.map((item) => {
            const active = isActive(item.path);
            return (
              <div
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                onMouseEnter={() => setHoveredItem(item.path)}
                onMouseLeave={() => setHoveredItem(null)}
                style={{
                  ...sidebarMenuItemStyle,
                  ...(active || hoveredItem === item.path ? sidebarMenuItemActiveStyle : {}),
                }}
              >
                <span style={{ fontSize: 16, color: active ? '#667eea' : 'inherit' }}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </div>
            );
          })
        ) : (
          bottomNavItems.map((item) => {
            const active = isActive(item.path);
            return (
              <div
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                title={item.label}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100%',
                  height: 40,
                  marginBottom: 4,
                  borderRadius: 8,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  color: active ? '#667eea' : '#666666',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#ffffff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {item.icon}
              </div>
            );
          })
        )}
      </div>
    </aside>
  );
});

LightSidebar.displayName = 'LightSidebar';
