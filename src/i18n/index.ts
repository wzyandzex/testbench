import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import zhCommon from '@/locales/zh-CN/common.json';
import zhNav from '@/locales/zh-CN/nav.json';
import zhErrors from '@/locales/zh-CN/errors.json';
import zhDashboard from '@/locales/zh-CN/dashboard.json';
import zhExecutions from '@/locales/zh-CN/executions.json';
import zhBenchmarks from '@/locales/zh-CN/benchmarks.json';
import zhAgents from '@/locales/zh-CN/agents.json';
import zhBatch from '@/locales/zh-CN/batch.json';
import zhMetrics from '@/locales/zh-CN/metrics.json';
import zhScheduler from '@/locales/zh-CN/scheduler.json';
import zhOrganizations from '@/locales/zh-CN/organizations.json';
import zhSettings from '@/locales/zh-CN/settings.json';
import zhAuth from '@/locales/zh-CN/auth.json';
import zhNotifications from '@/locales/zh-CN/notifications.json';
import zhCost from '@/locales/zh-CN/cost.json';
import zhSwe from '@/locales/zh-CN/swe.json';
import zhProjectEval from '@/locales/zh-CN/projectEval.json';
import zhGovernance from '@/locales/zh-CN/governance.json';
import zhRepairRun from '@/locales/zh-CN/repairRun.json';
import zhImport from '@/locales/zh-CN/import.json';
import zhAdmin from '@/locales/zh-CN/admin.json';
import zhLanding from '@/locales/zh-CN/landing.json';
import zhAnalyzer from '@/locales/zh-CN/analyzer.json';
import zhPreview from '@/locales/zh-CN/preview.json';
import zhComparisons from '@/locales/zh-CN/comparisons.json';

import enCommon from '@/locales/en-US/common.json';
import enNav from '@/locales/en-US/nav.json';
import enErrors from '@/locales/en-US/errors.json';
import enDashboard from '@/locales/en-US/dashboard.json';
import enExecutions from '@/locales/en-US/executions.json';
import enBenchmarks from '@/locales/en-US/benchmarks.json';
import enAgents from '@/locales/en-US/agents.json';
import enBatch from '@/locales/en-US/batch.json';
import enMetrics from '@/locales/en-US/metrics.json';
import enScheduler from '@/locales/en-US/scheduler.json';
import enOrganizations from '@/locales/en-US/organizations.json';
import enSettings from '@/locales/en-US/settings.json';
import enAuth from '@/locales/en-US/auth.json';
import enNotifications from '@/locales/en-US/notifications.json';
import enCost from '@/locales/en-US/cost.json';
import enSwe from '@/locales/en-US/swe.json';
import enProjectEval from '@/locales/en-US/projectEval.json';
import enGovernance from '@/locales/en-US/governance.json';
import enRepairRun from '@/locales/en-US/repairRun.json';
import enImport from '@/locales/en-US/import.json';
import enAdmin from '@/locales/en-US/admin.json';
import enLanding from '@/locales/en-US/landing.json';
import enAnalyzer from '@/locales/en-US/analyzer.json';
import enPreview from '@/locales/en-US/preview.json';
import enComparisons from '@/locales/en-US/comparisons.json';

export const defaultNS = 'common';
export const ns = [
  'common', 'nav', 'errors', 'dashboard', 'executions', 'benchmarks',
  'agents', 'batch', 'metrics', 'scheduler', 'organizations', 'settings',
  'auth', 'notifications', 'cost', 'swe', 'projectEval', 'governance',
  'repairRun', 'import', 'admin', 'landing', 'analyzer', 'preview',
  'comparisons',
] as const;

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': {
        common: zhCommon,
        nav: zhNav,
        errors: zhErrors,
        dashboard: zhDashboard,
        executions: zhExecutions,
        benchmarks: zhBenchmarks,
        agents: zhAgents,
        batch: zhBatch,
        metrics: zhMetrics,
        scheduler: zhScheduler,
        organizations: zhOrganizations,
        settings: zhSettings,
        auth: zhAuth,
        notifications: zhNotifications,
        cost: zhCost,
        swe: zhSwe,
        projectEval: zhProjectEval,
        governance: zhGovernance,
        repairRun: zhRepairRun,
        import: zhImport,
        admin: zhAdmin,
        landing: zhLanding,
        analyzer: zhAnalyzer,
        preview: zhPreview,
        comparisons: zhComparisons,
      },
      'en-US': {
        common: enCommon,
        nav: enNav,
        errors: enErrors,
        dashboard: enDashboard,
        executions: enExecutions,
        benchmarks: enBenchmarks,
        agents: enAgents,
        batch: enBatch,
        metrics: enMetrics,
        scheduler: enScheduler,
        organizations: enOrganizations,
        settings: enSettings,
        auth: enAuth,
        notifications: enNotifications,
        cost: enCost,
        swe: enSwe,
        projectEval: enProjectEval,
        governance: enGovernance,
        repairRun: enRepairRun,
        import: enImport,
        admin: enAdmin,
        landing: enLanding,
        analyzer: enAnalyzer,
        preview: enPreview,
        comparisons: enComparisons,
      },
    },
    lng: 'zh-CN',
    fallbackLng: 'zh-CN',
    defaultNS,
    ns,
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
