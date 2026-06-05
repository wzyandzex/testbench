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

type NavigationTranslator = (key: string) => string;

interface BuildWorkspaceNavigationOptions {
  currentOrgId?: string;
  dashboardPath?: string;
  hasMultipleOrgs?: boolean;
  isAdmin?: boolean;
  t?: NavigationTranslator;
}

function defaultNavTranslator(key: string): string {
  return String(i18next.t(`nav:${key}`));
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
  const t = options.t ?? defaultNavTranslator;

  const mainline = [
    createNavigationItem(dashboardPath, t('dashboard'), dashboardPath, <DashboardOutlined />),
    createNavigationItem('/benchmarks', t('benchmarks'), '/benchmarks', <ExperimentOutlined />),
    createNavigationItem(
      '/project-eval',
      t('projectEval'),
      '/project-eval',
      <DeploymentUnitOutlined />
    ),
    createNavigationItem('/repair-runs', t('repairRun'), '/repair-runs', <ToolOutlined />),
    createNavigationItem('/governance', t('governance'), '/governance', <SafetyCertificateOutlined />),
  ];

  const operations = [
    createNavigationItem('/executions', t('executions'), '/executions', <PlayCircleOutlined />),
    createNavigationItem('/agents', t('agents'), '/agents', <RobotOutlined />),
    createNavigationItem('/batch', t('batch'), '/batch', <AppstoreOutlined />),
    createNavigationItem('/metrics', t('metrics'), '/metrics', <LineChartOutlined />),
    createNavigationItem('/quality-trends', t('qualityTrends'), '/quality-trends', <RiseOutlined />),
    createNavigationItem('/comparisons', t('comparisons'), '/comparisons', <DiffOutlined />),
    createNavigationItem('/scheduler', t('scheduler'), '/scheduler', <ScheduleOutlined />),
    createNavigationItem('/import', t('import'), '/import', <CloudUploadOutlined />),
    createNavigationItem('/cost', t('cost'), '/cost', <DollarOutlined />),
    createNavigationItem('/shares', t('shares'), '/shares', <ShareAltOutlined />),
    createNavigationItem('/report-templates', t('templates'), '/report-templates', <FileTextOutlined />),
  ];

  if (hasMultipleOrgs) {
    operations.push(
      createNavigationItem(
        '/organizations',
        t('organizations'),
        currentOrgId ? `/organizations/${currentOrgId}` : '/organizations',
        <TeamOutlined />
      )
    );
  }

  const compatibility = runtimeConfig.features.legacySWEEnabled
    ? [createNavigationItem('/swe', t('legacySWE'), '/swe', <BugOutlined />)]
    : [];

  const admin: WorkspaceNavigationItem[] = isAdmin
    ? [
        createNavigationItem(
          '/admin/default-agent-template',
          t('defaultAgent'),
          '/admin/default-agent-template',
          <RobotOutlined />
        ),
        createNavigationItem(
          '/admin/org-templates',
          t('orgTemplates'),
          '/admin/org-templates',
          <AppstoreOutlined />
        ),
        createNavigationItem(
          '/admin/target-acceptance',
          t('targetAcceptance'),
          '/admin/target-acceptance',
          <SafetyCertificateOutlined />
        ),
        createNavigationItem(
          '/admin/benchmark-tags',
          t('benchmarkTags'),
          '/admin/benchmark-tags',
          <ExperimentOutlined />
        ),
        createNavigationItem(
          '/admin/system-ops',
          t('systemOps'),
          '/admin/system-ops',
          <ToolOutlined />
        ),
        createNavigationItem(
          '/admin/audit-logs',
          t('auditLogs'),
          '/admin/audit-logs',
          <AuditOutlined />
        ),
        createNavigationItem('/admin/dlq', t('dlq'), '/admin/dlq', <WarningOutlined />),
        createNavigationItem(
          '/admin/cost-models',
          t('costModels'),
          '/admin/cost-models',
          <DollarOutlined />
        ),
        createNavigationItem('/admin/users', t('users'), '/admin/users', <UserSwitchOutlined />),
      ]
    : [];

  const bottom = [
    createNavigationItem('/notifications', t('notifications'), '/notifications', <BellOutlined />),
    createNavigationItem('/settings', t('settings'), '/settings', <SettingOutlined />),
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
