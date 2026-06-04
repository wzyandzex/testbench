import type { MenuProps } from 'antd';
import type { ReactNode } from 'react';
import {
  AppstoreOutlined,
  AuditOutlined,
  BellOutlined,
  BugOutlined,
  CloudUploadOutlined,
  DashboardOutlined,
  DeploymentUnitOutlined,
  DiffOutlined,
  DollarOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  LineChartOutlined,
  PlayCircleOutlined,
  RiseOutlined,
  RobotOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  SettingOutlined,
  ShareAltOutlined,
  TeamOutlined,
  ToolOutlined,
  UserSwitchOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import i18next from 'i18next';

import { runtimeConfig } from '@/constants/runtime';

export interface WorkspaceNavigationItem {
  icon: ReactNode;
  key: string;
  label: string;
  path: string;
}

export interface WorkspaceNavigationModel {
  mainline: WorkspaceNavigationItem[];
  operations: WorkspaceNavigationItem[];
  compatibility: WorkspaceNavigationItem[];
  admin: WorkspaceNavigationItem[];
  bottom: WorkspaceNavigationItem[];
  navbar: WorkspaceNavigationItem[];
  quickActions: WorkspaceNavigationItem[];
}

export type WorkspaceMenuItems = NonNullable<MenuProps['items']>;

interface BuildWorkspaceNavigationOptions {
  currentOrgId?: string;
  dashboardPath?: string;
  hasMultipleOrgs?: boolean;
  isAdmin?: boolean;
}

function createNavigationItem(
  key: string,
  label: string,
  path: string,
  icon: ReactNode
): WorkspaceNavigationItem {
  return {
    icon,
    key,
    label,
    path,
  };
}

export function buildWorkspaceNavigation(
  options: BuildWorkspaceNavigationOptions = {}
): WorkspaceNavigationModel {
  const { currentOrgId, dashboardPath = '/dashboard', hasMultipleOrgs = false, isAdmin = false } = options;

  const mainline = [
    createNavigationItem(dashboardPath, 'Dashboard', dashboardPath, <DashboardOutlined />),
    createNavigationItem('/benchmarks', 'Benchmarks', '/benchmarks', <ExperimentOutlined />),
    createNavigationItem(
      '/project-eval',
      'Project Eval',
      '/project-eval',
      <DeploymentUnitOutlined />
    ),
    createNavigationItem('/repair-runs', 'Repair Runs', '/repair-runs', <ToolOutlined />),
    createNavigationItem('/governance', 'Governance', '/governance', <SafetyCertificateOutlined />),
  ];

  const operations = [
    createNavigationItem('/executions', 'Executions', '/executions', <PlayCircleOutlined />),
    createNavigationItem('/agents', 'Agents', '/agents', <RobotOutlined />),
    createNavigationItem('/batch', 'Batch', '/batch', <AppstoreOutlined />),
    createNavigationItem('/metrics', 'Metrics', '/metrics', <LineChartOutlined />),
    createNavigationItem('/quality-trends', 'Quality Trends', '/quality-trends', <RiseOutlined />),
    createNavigationItem('/comparisons', i18next.t('comparisons:navLabel'), '/comparisons', <DiffOutlined />),
    createNavigationItem('/scheduler', 'Scheduler', '/scheduler', <ScheduleOutlined />),
    createNavigationItem('/import', 'Import', '/import', <CloudUploadOutlined />),
    createNavigationItem('/cost', 'Cost', '/cost', <DollarOutlined />),
    createNavigationItem('/shares', 'Shares', '/shares', <ShareAltOutlined />),
    createNavigationItem('/report-templates', 'Templates', '/report-templates', <FileTextOutlined />),
  ];

  if (hasMultipleOrgs) {
    operations.push(
      createNavigationItem(
        '/organizations',
        'Organizations',
        currentOrgId ? `/organizations/${currentOrgId}` : '/organizations',
        <TeamOutlined />
      )
    );
  }

  const compatibility = runtimeConfig.features.legacySWEEnabled
    ? [createNavigationItem('/swe', 'Legacy SWE', '/swe', <BugOutlined />)]
    : [];

  const admin: WorkspaceNavigationItem[] = isAdmin
    ? [
        createNavigationItem(
          '/admin/default-agent-template',
          'Default Agent',
          '/admin/default-agent-template',
          <RobotOutlined />
        ),
        createNavigationItem(
          '/admin/org-templates',
          'Org Templates',
          '/admin/org-templates',
          <AppstoreOutlined />
        ),
        createNavigationItem(
          '/admin/target-acceptance',
          'Target Acceptance',
          '/admin/target-acceptance',
          <SafetyCertificateOutlined />
        ),
        createNavigationItem(
          '/admin/benchmark-tags',
          'Benchmark Tags',
          '/admin/benchmark-tags',
          <ExperimentOutlined />
        ),
        createNavigationItem(
          '/admin/system-ops',
          'System Ops',
          '/admin/system-ops',
          <ToolOutlined />
        ),
        createNavigationItem(
          '/admin/audit-logs',
          'Audit Logs',
          '/admin/audit-logs',
          <AuditOutlined />
        ),
        createNavigationItem('/admin/dlq', 'DLQ', '/admin/dlq', <WarningOutlined />),
        createNavigationItem(
          '/admin/cost-models',
          'Cost Models',
          '/admin/cost-models',
          <DollarOutlined />
        ),
        createNavigationItem('/admin/users', 'Users', '/admin/users', <UserSwitchOutlined />),
      ]
    : [];

  const bottom = [
    createNavigationItem('/notifications', 'Notifications', '/notifications', <BellOutlined />),
    createNavigationItem('/settings', 'Settings', '/settings', <SettingOutlined />),
  ];

  return {
    mainline,
    operations,
    compatibility,
    admin,
    bottom,
    navbar: [mainline[0], mainline[1], mainline[2], mainline[4], mainline[3]],
    quickActions: [mainline[2], mainline[4], mainline[3]],
  };
}

export function flattenWorkspaceNavigation(
  navigation: WorkspaceNavigationModel
): WorkspaceNavigationItem[] {
  return [
    ...navigation.mainline,
    ...navigation.operations,
    ...navigation.compatibility,
    ...navigation.admin,
    ...navigation.bottom,
  ];
}

export function isNavigationItemActive(pathname: string, itemPath: string): boolean {
  return pathname === itemPath || pathname.startsWith(`${itemPath}/`);
}

export function resolveActiveNavigationKey(
  pathname: string,
  items: WorkspaceNavigationItem[]
): string | undefined {
  return items.find((item) => isNavigationItemActive(pathname, item.path))?.key;
}

export function toMenuItems(items: WorkspaceNavigationItem[]): WorkspaceMenuItems {
  return items.map((item) => ({
    icon: item.icon,
    key: item.key,
    label: item.label,
  }));
}
