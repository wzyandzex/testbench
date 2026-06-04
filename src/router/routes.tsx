import { lazy } from 'react';

// 棰勮椤甸潰锛堜复鏃朵娇鐢紝鏃犻渶鐧诲綍锛?
export const PreviewPage = lazy(() => import('@/pages/preview/PreviewPage'));

// Landing Page
export const LandingPage = lazy(() => import('@/pages/landing'));

// 鍏紑璺敱
export const AuthPage = lazy(() => import('@/pages/auth/AuthPage'));

// 涓婚〉闈?
export const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
export const DashboardPageV2 = lazy(() => import('@/pages/dashboard/DashboardPageV2'));

// 璇勬祴浠诲姟
export const BenchmarkListPage = lazy(() => import('@/pages/benchmarks/BenchmarkListPage'));
export const BenchmarkDetailPage = lazy(() => import('@/pages/benchmarks/BenchmarkDetailPage'));
export const BenchmarkCreatePage = lazy(() => import('@/pages/benchmarks/BenchmarkCreateFlowPage'));
export const BenchmarkImportWorkspacePage = lazy(
  () => import('@/pages/benchmarks/BenchmarkImportWorkspacePage')
);
export const BenchmarkEditPage = lazy(() => import('@/pages/benchmarks/BenchmarkEditPage'));
export const MyForksPage = lazy(() => import('@/pages/benchmarks/MyForksPage'));

// 鎵ц璁板綍
export const ExecutionListPage = lazy(() => import('@/pages/executions/ExecutionListPage'));
export const ExecutionDetailPage = lazy(() => import('@/pages/executions/ExecutionDetailPage'));

// Agent 绠＄悊
export const AgentListPage = lazy(() => import('@/pages/agents/AgentListPage'));
export const AgentDetailPage = lazy(() => import('@/pages/agents/AgentDetailPage'));
export const AgentCreatePage = lazy(() => import('@/pages/agents/AgentCreatePage'));
export const AgentEditPage = lazy(() => import('@/pages/agents/AgentEditPage'));

// 鎵归噺鎵ц
export const BatchListPage = lazy(() => import('@/pages/batch/BatchListPage'));
export const BatchDetailPage = lazy(() => import('@/pages/batch/BatchDetailPage'));
export const BatchCreatePage = lazy(() => import('@/pages/batch/BatchCreatePage'));

// 鎸囨爣鍒嗘瀽
export const MetricsPage = lazy(() => import('@/pages/metrics/MetricsPage'));

// 璋冨害绠＄悊
export const SchedulerPage = lazy(() => import('@/pages/scheduler/SchedulerPage'));

// 缁勭粐绠＄悊
export const OrgListPage = lazy(() => import('@/pages/organizations/OrgListPage'));
export const OrgJoinPage = lazy(() => import('@/pages/organizations/OrgJoinPage'));
export const OrgDetailPage = lazy(() => import('@/pages/organizations/OrgDetailPage'));

// 璁剧疆
export const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));

// 閫氱煡涓績
export const NotificationPage = lazy(() => import('@/pages/notifications/NotificationPage'));

// 鏁版嵁瀵煎叆
export const ImportPage = lazy(() => import('@/pages/import'));

// 鎴愭湰鍒嗘瀽
export const CostPage = lazy(() => import('@/pages/cost'));

// SWE 浠诲姟
export const SWETaskListPage = lazy(() => import('@/pages/swe/SWETaskListPage'));
export const SWETaskCreatePage = lazy(() => import('@/pages/swe/SWETaskCreatePage'));
export const SWETaskDetailPage = lazy(() => import('@/pages/swe/SWETaskDetailPage'));

// 绠＄悊绔?
export const UsersPage = lazy(() => import('@/pages/admin/UsersPage'));
export const DefaultAgentTemplatePage = lazy(
  () => import('@/pages/admin/DefaultAgentTemplatePage')
);
export const OrgTemplateAdminPage = lazy(() => import('@/pages/admin/OrgTemplateAdminPage'));
export const TargetAcceptancePage = lazy(() => import('@/pages/admin/TargetAcceptancePage'));
export const BenchmarkTagsAdminPage = lazy(() => import('@/pages/admin/BenchmarkTagsAdminPage'));
export const SystemOpsPage = lazy(() => import('@/pages/admin/SystemOpsPage'));
export const AuditLogPage = lazy(() => import('@/pages/admin/AuditLogPage'));
export const DLQAdminPage = lazy(() => import('@/pages/admin/DLQAdminPage'));
export const CostModelAdminPage = lazy(() => import('@/pages/admin/CostModelAdminPage'));

// 娌荤悊绛栫暐
export const GovernanceOverviewPage = lazy(
  () => import('@/pages/governance/GovernanceOverviewPage')
);
export const TrustPolicyPage = lazy(() => import('@/pages/governance/TrustPolicyPage'));
export const DecisionPolicyPage = lazy(() => import('@/pages/governance/DecisionPolicyPage'));

// LLM Quality
export const LLMQualityPage = lazy(() => import('@/pages/benchmark-quality/LLMQualityPage'));
export const LLMQualityReportPage = lazy(
  () => import('@/pages/benchmark-quality/LLMQualityReportPage')
);

// Quality Policy
export const QualityPolicyPage = lazy(
  () => import('@/pages/governance-policies/quality/QualityPolicyPage')
);

// Project Eval
export const ProjectEvalHomePage = lazy(() => import('@/pages/project-eval/ProjectEvalHomePage'));
export const ProjectEvalCreatePage = lazy(
  () => import('@/pages/project-eval/ProjectEvalCreatePage')
);
export const ProjectEvalProfilePage = lazy(
  () => import('@/pages/project-eval/ProjectEvalProfilePage')
);
export const ProjectEvalDetailPage = lazy(
  () => import('@/pages/project-eval/ProjectEvalDetailPage')
);
export const ProjectEvalReportPage = lazy(
  () => import('@/pages/project-eval/ProjectEvalReportPage')
);
export const ProjectEvalExplainPage = lazy(
  () => import('@/pages/project-eval/ProjectEvalExplainPage')
);
export const ProjectEvalInsightsPage = lazy(
  () => import('@/pages/project-eval/ProjectEvalInsightsPage')
);
export const ProjectEvalAcceptancePage = lazy(
  () => import('@/pages/project-eval/ProjectEvalAcceptancePage')
);

// Repair Run
export const RepairRunPage = lazy(() => import('@/pages/repair-run/RepairRunPage'));

// Analyzer
export const AnalyzerPage = lazy(() => import('@/pages/analyzer/AnalyzerPage'));

// 报告分享
export const ShareListPage = lazy(() => import('@/pages/shares/ShareListPage'));
export const SharedReportPage = lazy(() => import('@/pages/shares/SharedReportPage'));
export const PublicSharePage = lazy(() => import('@/pages/public/PublicSharePage'));

// 报告模板
export const ReportTemplateListPage = lazy(
  () => import('@/pages/report-templates/ReportTemplateListPage')
);
export const ReportTemplateEditorPage = lazy(
  () => import('@/pages/report-templates/ReportTemplateEditorPage')
);

// 质量趋势
export const QualityTrendsPage = lazy(() => import('@/pages/quality-trends/QualityTrendsPage'));

// 评测对比
export const ComparisonListPage = lazy(() => import('@/pages/comparisons/ComparisonListPage'));
export const ComparisonViewPage = lazy(() => import('@/pages/comparisons/ComparisonViewPage'));

// 404
export const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
