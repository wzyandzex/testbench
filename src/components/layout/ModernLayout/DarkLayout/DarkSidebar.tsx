import { memo, useCallback, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppstoreOutlined, DoubleLeftOutlined, DoubleRightOutlined } from '@ant-design/icons';
import { sidebarStyle, sidebarCollapsedStyle, quickActionBtnStyle, quickActionBtnHoverStyle } from './style';
import {
  buildWorkspaceNavigation,
  isNavigationItemActive,
  type WorkspaceNavigationItem,
} from '@/components/layout/navigation';
import { useAuthStore } from '@/stores';
import { useWorkspaceStore } from '@/stores/workspaceStore';

interface DarkSidebarProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export const DarkSidebar = memo<DarkSidebarProps>(({ collapsed = false, onToggle }) => {
  const { t } = useTranslation('nav');
  const navigate = useNavigate();
  const location = useLocation();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const currentOrg = useWorkspaceStore((state) => state.currentOrg);
  const hasMultipleOrgs = useWorkspaceStore((state) => state.hasMultipleOrgs());
  const isAdmin = useAuthStore((state) => state.user?.role === 'admin');
  const navigation = useMemo(
    () =>
      buildWorkspaceNavigation({
        currentOrgId: currentOrg?.org_id,
        hasMultipleOrgs,
        dashboardPath: '/dashboard-v2',
        isAdmin,
      }),
    [currentOrg?.org_id, hasMultipleOrgs, isAdmin]
  );
  const quickActions = navigation.quickActions;
  const otherNavItems = [...navigation.operations, ...navigation.compatibility, ...navigation.admin];

  const handleNavigate = useCallback((path: string) => {
    navigate(path);
  }, [navigate]);

  const isActive = useCallback(
    (path: string) => isNavigationItemActive(location.pathname, path),
    [location.pathname]
  );

  return (
    <div style={collapsed ? sidebarCollapsedStyle : sidebarStyle}>
      {/* 折叠/展开按钮 */}
      <div
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: 36,
          marginBottom: 12,
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
        {collapsed ? (
          <DoubleLeftOutlined style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }} />
        ) : (
          <DoubleRightOutlined style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }} />
        )}
      </div>

      {!collapsed ? (
        <>
          {/* 快捷操作 */}
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.45)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 8,
              paddingLeft: 4,
            }}>
              Quick Actions
            </div>
            {quickActions.map((action, index) => {
              const active = isActive(action.path);
              return (
              <div
                key={action.path}
                onClick={() => handleNavigate(action.path)}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
                style={{
                  ...quickActionBtnStyle,
                  ...(hoveredIndex === index || active ? quickActionBtnHoverStyle : {}),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <span style={{ fontSize: 16 }}>{action.icon}</span>
                <span>{action.label}</span>
              </div>
            )})}
          </div>

          {/* 其他导航 */}
          <div>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              color: 'rgba(255,255,255,0.45)',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              marginBottom: 8,
              paddingLeft: 4,
            }}>
              Navigation
            </div>
            {otherNavItems.map((item: WorkspaceNavigationItem) => {
              const active = isActive(item.path);
              return (
              <div
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                style={{
                  ...quickActionBtnStyle,
                  ...(active ? quickActionBtnHoverStyle : {}),
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 8,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(102, 126, 234, 0.15)';
                  e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.95)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.65)';
                }}
              >
                <span style={{ fontSize: 16 }}>{item.icon}</span>
                <span>{item.label}</span>
              </div>
            )})}
          </div>

          {/* 批量操作入口 */}
          <div
            onClick={() => handleNavigate('/batch')}
            style={{
              marginTop: 8,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              padding: 12,
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'rgba(102, 126, 234, 0.3)',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.3) 0%, rgba(118, 75, 162, 0.3) 100%)';
              e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.5)';
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.3)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)';
              e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <AppstoreOutlined style={{ fontSize: 16 }} />
            <span style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.95)' }}>
              {t('batch')}
            </span>
          </div>
        </>
      ) : (
        // 折叠状态 - 只显示图标
        <>
          {quickActions.map((action) => {
            const active = isActive(action.path);
            return (
            <div
              key={action.path}
              onClick={() => handleNavigate(action.path)}
              title={action.label}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: 36,
                marginBottom: 8,
                background: 'rgba(255, 255, 255, 0.05)',
                borderWidth: '1px',
                borderStyle: 'solid',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderRadius: 10,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                ...(active
                  ? {
                      background: 'rgba(102, 126, 234, 0.15)',
                      borderColor: 'rgba(102, 126, 234, 0.3)',
                    }
                  : {}),
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(102, 126, 234, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(102, 126, 234, 0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
              }}
            >
              {action.icon}
            </div>
          )})}
          <div
            onClick={() => handleNavigate('/batch')}
            title="Batch"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              height: 36,
              marginTop: 4,
              background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.2) 0%, rgba(118, 75, 162, 0.2) 100%)',
              borderWidth: '1px',
              borderStyle: 'solid',
              borderColor: 'rgba(102, 126, 234, 0.3)',
              borderRadius: 10,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
          >
            <AppstoreOutlined />
          </div>
        </>
      )}
    </div>
  );
});

DarkSidebar.displayName = 'DarkSidebar';
