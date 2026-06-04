/**
 * Organization switcher component
 * Displays the current org in the header and lets the user switch orgs.
 */

import { Dropdown, Tag, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import type { MenuProps } from 'antd';
import {
  SwapOutlined,
  UserOutlined,
  TeamOutlined,
  SettingOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export function OrgSwitcher() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const currentOrg = useWorkspaceStore((s) => s.currentOrg);
  const memberships = useWorkspaceStore((s) => s.memberships);
  const isSwitching = useWorkspaceStore((s) => s.isSwitching);
  const switchOrg = useWorkspaceStore((s) => s.switchOrg);

  const handleSwitch = async (orgId: string) => {
    if (orgId === currentOrg?.org_id) return;
    try {
      await switchOrg(orgId);
    } catch {
      // handled in store
    }
  };

  const roleLabels: Record<string, string> = {
    admin: t('components.orgSwitcher.roleAdmin'),
    member: t('components.orgSwitcher.roleMember'),
    guest: t('components.orgSwitcher.roleGuest'),
  };

  const menuItems: MenuProps['items'] = [
    ...memberships.map((m) => ({
      key: m.org_id,
      icon: m.org_type === 'personal' ? <UserOutlined /> : <TeamOutlined />,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{m.display_name || m.org_name}</span>
          {m.org_type === 'personal' ? (
            <Tag color="blue" style={{ marginLeft: 'auto', marginRight: 0 }}>
              {t('components.orgSwitcher.personal')}
            </Tag>
          ) : (
            <Tag color="green" style={{ marginLeft: 'auto', marginRight: 0 }}>
              {roleLabels[m.role] || m.role}
            </Tag>
          )}
        </div>
      ),
      disabled: m.org_id === currentOrg?.org_id,
      onClick: () => handleSwitch(m.org_id),
    })),
    { type: 'divider' as const },
    {
      key: 'manage',
      icon: <SettingOutlined />,
      label: t('components.orgSwitcher.manageOrg'),
      onClick: () => navigate('/organizations'),
    },
    {
      key: 'create',
      icon: <PlusOutlined />,
      label: t('components.orgSwitcher.createOrg'),
      onClick: () => navigate('/organizations'),
    },
  ];

  if (!currentOrg) return null;

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomLeft" trigger={['click']}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 12px',
          borderRadius: 6,
          cursor: 'pointer',
          transition: 'background 0.2s',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(0,0,0,0.04)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
      >
        {isSwitching ? (
          <Spin size="small" />
        ) : (
          <>
            {currentOrg.org_type === 'personal' ? (
              <UserOutlined style={{ fontSize: 14 }} />
            ) : (
              <TeamOutlined style={{ fontSize: 14 }} />
            )}
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                maxWidth: 120,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {currentOrg.display_name || currentOrg.org_name}
            </span>
            <SwapOutlined style={{ fontSize: 12, opacity: 0.5 }} />
          </>
        )}
      </div>
    </Dropdown>
  );
}

/**
 * OrgSwitcher dark-theme variant (used by ModernLayout's DarkNavbar).
 */
export function OrgSwitcherDark() {
  const { t } = useTranslation('common');
  const navigate = useNavigate();
  const currentOrg = useWorkspaceStore((s) => s.currentOrg);
  const memberships = useWorkspaceStore((s) => s.memberships);
  const isSwitching = useWorkspaceStore((s) => s.isSwitching);
  const switchOrg = useWorkspaceStore((s) => s.switchOrg);

  const handleSwitch = async (orgId: string) => {
    if (orgId === currentOrg?.org_id) return;
    try {
      await switchOrg(orgId);
    } catch {
      // handled in store
    }
  };

  const roleLabels: Record<string, string> = {
    admin: t('components.orgSwitcher.roleAdmin'),
    member: t('components.orgSwitcher.roleMember'),
    guest: t('components.orgSwitcher.roleGuest'),
  };

  const menuItems: MenuProps['items'] = [
    ...memberships.map((m) => ({
      key: m.org_id,
      icon: m.org_type === 'personal' ? <UserOutlined /> : <TeamOutlined />,
      label: (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{m.display_name || m.org_name}</span>
          {m.org_type === 'personal' ? (
            <Tag color="blue" style={{ marginLeft: 'auto', marginRight: 0 }}>
              {t('components.orgSwitcher.personal')}
            </Tag>
          ) : (
            <Tag color="green" style={{ marginLeft: 'auto', marginRight: 0 }}>
              {roleLabels[m.role] || m.role}
            </Tag>
          )}
        </div>
      ),
      disabled: m.org_id === currentOrg?.org_id,
      onClick: () => handleSwitch(m.org_id),
    })),
    { type: 'divider' as const },
    {
      key: 'manage',
      icon: <SettingOutlined />,
      label: t('components.orgSwitcher.manageOrg'),
      onClick: () => navigate('/organizations'),
    },
    {
      key: 'create',
      icon: <PlusOutlined />,
      label: t('components.orgSwitcher.createOrg'),
      onClick: () => navigate('/organizations'),
    },
  ];

  if (!currentOrg) return null;

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomLeft" trigger={['click']}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '4px 12px',
          borderRadius: 10,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          userSelect: 'none',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: 'rgba(255, 255, 255, 0.1)',
          background: 'rgba(255, 255, 255, 0.05)',
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
        {isSwitching ? (
          <Spin size="small" />
        ) : (
          <>
            {currentOrg.org_type === 'personal' ? (
              <UserOutlined style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)' }} />
            ) : (
              <TeamOutlined style={{ fontSize: 14, color: 'rgba(255,255,255,0.65)' }} />
            )}
            <span
              style={{
                fontSize: 14,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.95)',
                maxWidth: 120,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {currentOrg.display_name || currentOrg.org_name}
            </span>
            <SwapOutlined style={{ fontSize: 12, color: 'rgba(255,255,255,0.45)' }} />
          </>
        )}
      </div>
    </Dropdown>
  );
}

export default OrgSwitcher;
