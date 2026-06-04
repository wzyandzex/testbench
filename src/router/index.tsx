import { createBrowserRouter, Outlet } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { Spin } from 'antd';
import {
  AuthGuard,
  PublicGuard,
  RootGuard,
  OrgGuard,
  PermissionGuard,
  LegacySWEGuard,
} from './guards';
import * as Routes from './routes';

// 鍔犺浇涓粍浠?
const PageLoading = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    }}
  >
    <Spin size="large" />
  </div>
);

// 鍖呰鎳掑姞杞界粍浠?
const lazyLoad = (Component: React.LazyExoticComponent<React.ComponentType<any>>) => (
  <Suspense fallback={<PageLoading />}>
    <Component />
  </Suspense>
);

// 甯冨眬缁勪欢
const ProtectedLayout = lazy(() => import('@/components/layout/ProtectedLayout'));
const ModernLayout = lazy(() => import('@/components/layout/ModernLayout'));
const WorkspaceLayout = lazy(() => import('@/components/layout/WorkspaceLayout'));

// 璺敱閰嶇疆
export const router = createBrowserRouter([
  // === 1. 鍏紑璺敱锛堟棤闇€璁よ瘉锛?==
  {
    path: '/',
    element: (
      <RootGuard>
        <Suspense fallback={<PageLoading />}>
          <Routes.LandingPage />
        </Suspense>
      </RootGuard>
    ),
  },
  {
    path: '/preview',
    element: lazyLoad(Routes.PreviewPage),
  },
  {
    path: '/public/share/:token',
    element: lazyLoad(Routes.PublicSharePage),
  },
  {
    path: '/login',
    element: lazyLoad(Routes.AuthPage),
  },
  {
    path: '/register',
    element: lazyLoad(Routes.AuthPage),
  },
  {
    path: '/auth',
    element: (
      <PublicGuard>
        <Suspense fallback={<PageLoading />}>
          <Routes.AuthPage />
        </Suspense>
      </PublicGuard>
    ),
  },

  // === 2. 浠呰璇佽矾鐢憋紙涓嶉渶瑕佺粍缁囦笂涓嬫枃锛?==
  {
    path: '/organizations',
    element: (
      <AuthGuard>
        <Suspense fallback={<PageLoading />}>
          <ProtectedLayout />
        </Suspense>
      </AuthGuard>
    ),
    children: [
      { index: true, element: lazyLoad(Routes.OrgListPage) },
      { path: 'join', element: lazyLoad(Routes.OrgJoinPage) },
      { path: ':id', element: lazyLoad(Routes.OrgDetailPage) },
    ],
  },

  // === 3. 宸ヤ綔鍖鸿矾鐢憋紙璁よ瘉 + 缁勭粐涓婁笅鏂囷級===
  {
    element: (
      <AuthGuard>
        <OrgGuard>
          <Suspense fallback={<PageLoading />}>
            <WorkspaceLayout />
          </Suspense>
        </OrgGuard>
      </AuthGuard>
    ),
    children: [
      {
        path: '/dashboard',
        children: [{ index: true, element: lazyLoad(Routes.DashboardPage) }],
      },
      {
        path: '/benchmarks',
        children: [
          { index: true, element: lazyLoad(Routes.BenchmarkListPage) },
          { path: 'create/import', element: lazyLoad(Routes.BenchmarkImportWorkspacePage) },
          { path: 'create', element: lazyLoad(Routes.BenchmarkCreatePage) },
          { path: 'my-forks', element: lazyLoad(Routes.MyForksPage) },
          { path: ':id/edit', element: lazyLoad(Routes.BenchmarkEditPage) },
          { path: ':id', element: lazyLoad(Routes.BenchmarkDetailPage) },
          { path: ':id/llm-quality', element: lazyLoad(Routes.LLMQualityPage) },
          { path: ':id/llm-quality/:jobId', element: lazyLoad(Routes.LLMQualityReportPage) },
        ],
      },
      {
        path: '/executions',
        children: [
          { index: true, element: lazyLoad(Routes.ExecutionListPage) },
          { path: ':id', element: lazyLoad(Routes.ExecutionDetailPage) },
        ],
      },
      {
        path: '/agents',
        children: [
          { index: true, element: lazyLoad(Routes.AgentListPage) },
          { path: 'create', element: lazyLoad(Routes.AgentCreatePage) },
          { path: ':id/edit', element: lazyLoad(Routes.AgentEditPage) },
          { path: ':id', element: lazyLoad(Routes.AgentDetailPage) },
        ],
      },
      {
        path: '/batch',
        children: [
          { index: true, element: lazyLoad(Routes.BatchListPage) },
          { path: ':id', element: lazyLoad(Routes.BatchDetailPage) },
          { path: 'create', element: lazyLoad(Routes.BatchCreatePage) },
        ],
      },
      {
        path: '/metrics',
        children: [{ index: true, element: lazyLoad(Routes.MetricsPage) }],
      },
      {
        path: '/scheduler',
        children: [{ index: true, element: lazyLoad(Routes.SchedulerPage) }],
      },
      {
        path: '/analyzer',
        children: [{ index: true, element: lazyLoad(Routes.AnalyzerPage) }],
      },
      {
        path: '/shares',
        children: [
          { index: true, element: lazyLoad(Routes.ShareListPage) },
          { path: ':id', element: lazyLoad(Routes.SharedReportPage) },
        ],
      },
      {
        path: '/report-templates',
        children: [
          { index: true, element: lazyLoad(Routes.ReportTemplateListPage) },
          { path: 'create', element: lazyLoad(Routes.ReportTemplateEditorPage) },
          { path: ':id/edit', element: lazyLoad(Routes.ReportTemplateEditorPage) },
        ],
      },
      {
        path: '/quality-trends',
        children: [{ index: true, element: lazyLoad(Routes.QualityTrendsPage) }],
      },
      {
        path: '/comparisons',
        children: [
          { index: true, element: lazyLoad(Routes.ComparisonListPage) },
          { path: 'new', element: lazyLoad(Routes.ComparisonViewPage) },
          { path: 'sessions/:sessionId', element: lazyLoad(Routes.ComparisonViewPage) },
        ],
      },
      {
        path: '/settings',
        children: [{ index: true, element: lazyLoad(Routes.SettingsPage) }],
      },
      {
        path: '/admin/users',
        element: (
          <PermissionGuard requiredRole={['admin']}>{lazyLoad(Routes.UsersPage)}</PermissionGuard>
        ),
      },
      {
        path: '/admin/default-agent-template',
        element: (
          <PermissionGuard requiredRole={['admin']}>
            {lazyLoad(Routes.DefaultAgentTemplatePage)}
          </PermissionGuard>
        ),
      },
      {
        path: '/admin/org-templates',
        element: (
          <PermissionGuard requiredRole={['admin']}>
            {lazyLoad(Routes.OrgTemplateAdminPage)}
          </PermissionGuard>
        ),
      },
      {
        path: '/admin/target-acceptance',
        element: (
          <PermissionGuard requiredRole={['admin']}>
            {lazyLoad(Routes.TargetAcceptancePage)}
          </PermissionGuard>
        ),
      },
      {
        path: '/admin/benchmark-tags',
        element: (
          <PermissionGuard requiredRole={['admin']}>
            {lazyLoad(Routes.BenchmarkTagsAdminPage)}
          </PermissionGuard>
        ),
      },
      {
        path: '/admin/system-ops',
        element: (
          <PermissionGuard requiredRole={['admin']}>
            {lazyLoad(Routes.SystemOpsPage)}
          </PermissionGuard>
        ),
      },
      {
        path: '/admin/audit-logs',
        element: (
          <PermissionGuard requiredRole={['admin']}>
            {lazyLoad(Routes.AuditLogPage)}
          </PermissionGuard>
        ),
      },
      {
        path: '/admin/dlq',
        element: (
          <PermissionGuard requiredRole={['admin']}>
            {lazyLoad(Routes.DLQAdminPage)}
          </PermissionGuard>
        ),
      },
      {
        path: '/admin/cost-models',
        element: (
          <PermissionGuard requiredRole={['admin']}>
            {lazyLoad(Routes.CostModelAdminPage)}
          </PermissionGuard>
        ),
      },
      {
        path: '/notifications',
        children: [{ index: true, element: lazyLoad(Routes.NotificationPage) }],
      },
      {
        path: '/import',
        children: [{ index: true, element: lazyLoad(Routes.ImportPage) }],
      },
      {
        path: '/cost',
        children: [{ index: true, element: lazyLoad(Routes.CostPage) }],
      },
      {
        path: '/project-eval',
        children: [
          { index: true, element: lazyLoad(Routes.ProjectEvalHomePage) },
          { path: 'create', element: lazyLoad(Routes.ProjectEvalCreatePage) },
          { path: 'create/profile', element: lazyLoad(Routes.ProjectEvalProfilePage) },
          { path: 'create/profile/:sourceId', element: lazyLoad(Routes.ProjectEvalProfilePage) },
          { path: 'insights', element: lazyLoad(Routes.ProjectEvalInsightsPage) },
          { path: 'acceptance', element: lazyLoad(Routes.ProjectEvalAcceptancePage) },
          { path: ':id/report', element: lazyLoad(Routes.ProjectEvalReportPage) },
          { path: ':id/explain', element: lazyLoad(Routes.ProjectEvalExplainPage) },
          { path: ':id', element: lazyLoad(Routes.ProjectEvalDetailPage) },
        ],
      },
      {
        path: '/repair-runs',
        children: [
          { index: true, element: lazyLoad(Routes.RepairRunPage) },
          { path: ':id', element: lazyLoad(Routes.RepairRunPage) },
        ],
      },
      {
        path: '/swe',
        element: (
          <LegacySWEGuard>
            <Outlet />
          </LegacySWEGuard>
        ),
        children: [
          { index: true, element: lazyLoad(Routes.SWETaskListPage) },
          { path: 'create', element: lazyLoad(Routes.SWETaskCreatePage) },
          { path: ':id', element: lazyLoad(Routes.SWETaskDetailPage) },
        ],
      },
      {
        path: '/governance',
        children: [{ index: true, element: lazyLoad(Routes.GovernanceOverviewPage) }],
      },
      {
        path: '/governance/policies',
        children: [
          { path: 'trust', element: lazyLoad(Routes.TrustPolicyPage) },
          { path: 'decision', element: lazyLoad(Routes.DecisionPolicyPage) },
          { path: 'quality', element: lazyLoad(Routes.QualityPolicyPage) },
        ],
      },
    ],
  },

  // 鏂扮増 Dashboard锛堜娇鐢ㄧ幇浠ｅ竷灞€ + 宸ヤ綔鍖轰笂涓嬫枃锛?
  {
    path: '/dashboard-v2',
    element: (
      <AuthGuard>
        <OrgGuard>
          <Suspense fallback={<PageLoading />}>
            <ModernLayout>
              <Routes.DashboardPageV2 />
            </ModernLayout>
          </Suspense>
        </OrgGuard>
      </AuthGuard>
    ),
  },

  // 404
  {
    path: '*',
    element: lazyLoad(Routes.NotFoundPage),
  },
]);
