import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Empty,
  Input,
  Modal,
  Pagination,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  ArrowRightOutlined,
  BarChartOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  FileSearchOutlined,
  FilterOutlined,
  PlusOutlined,
  PushpinOutlined,
  ReloadOutlined,
  SaveOutlined,
  SafetyCertificateOutlined,
  StarFilled,
  StarOutlined,
  DeleteOutlined,
  QuestionCircleOutlined,
  ToolOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common';
import {
  formatDateTime,
  formatScore,
  getDecisionTone,
  getEvidenceInsufficientReasonLabel,
  getEvidencePostureStatusColor,
  getEvidencePostureStatusLabel,
  getEvidenceTruthSourceLabel,
  getProjectTypeLabel,
  getReportOutcomeTone,
  getRunModeLabel,
  getScoreModeLabel,
  getStatusTone,
  humanizeKey,
  ZIP_SOURCE_MAINLINE_GAP_TEXT_KEY,
} from '@/components/project-eval/helpers';
import { buildProjectEvalRepairDraftPath } from '@/pages/repair-run/links';
import {
  clearRecentProjectEvalRuns,
  loadRecentProjectEvalRuns,
  type RecentProjectEvalRun,
} from '@/components/project-eval/recentRuns';
import { projectEvalService } from '@/services/project-eval';
import { useThemeTokens } from '@/theme';
import { isPersistedOrgAdmin } from '@/utils/auth-storage';
import i18next from 'i18next';
import type {
  ProjectEvalCapabilities,
  ProjectEvalRunHealthPreset,
  ProjectEvalRunListItem,
  ProjectEvalRunListParams,
  ProjectEvalRunListResponse,
  ProjectEvalRunSavedView,
  ProjectEvalRunSavedViewColumn,
  ProjectEvalRunSavedViewFilters,
  ProjectEvalRunSavedViewListResponse,
  ProjectEvalRunSavedViewVisibility,
  RunInsightsSummary,
  RunReportOutcomeView,
  UpsertProjectEvalRunSavedViewRequest,
} from '@/types/api/project-eval';

const { Paragraph, Text, Title } = Typography;
const SERVER_RUNS_PAGE_SIZE = 6;
const RUN_SAVED_VIEW_PAGE_SIZE = 100;
const SERVER_RUN_STATUS_OPTIONS = [
  { get label() { return i18next.t('projectEval:home.options.status.planned'); }, value: 'planned' },
  { get label() { return i18next.t('projectEval:home.options.status.pending'); }, value: 'pending' },
  { get label() { return i18next.t('projectEval:home.options.status.running'); }, value: 'running' },
  { get label() { return i18next.t('projectEval:home.options.status.completed'); }, value: 'completed' },
  { get label() { return i18next.t('projectEval:home.options.status.failed'); }, value: 'failed' },
  { get label() { return i18next.t('projectEval:home.options.status.cancelled'); }, value: 'cancelled' },
];

const RUN_HEALTH_OPTIONS = [
  { get label() { return i18next.t('projectEval:home.options.health.retryRequired'); }, value: 'retry_required' },
  { get label() { return i18next.t('projectEval:home.options.health.failedStage'); }, value: 'failed_stage' },
  { get label() { return i18next.t('projectEval:home.options.health.staleStagePlan'); }, value: 'stale_stage_plan' },
  { get label() { return i18next.t('projectEval:home.options.health.insufficientEvidence'); }, value: 'insufficient_evidence' },
  { get label() { return i18next.t('projectEval:home.options.health.fallback'); }, value: 'fallback' },
  { get label() { return i18next.t('projectEval:home.options.health.authoritative'); }, value: 'authoritative' },
];

const RUN_ORCHESTRATION_OPTIONS = [
  { get label() { return i18next.t('projectEval:home.options.orchestration.staged'); }, value: 'staged' },
  { get label() { return i18next.t('projectEval:home.options.orchestration.large'); }, value: 'large' },
  { get label() { return i18next.t('projectEval:home.options.orchestration.singleStage'); }, value: 'single_stage' },
];

const RUN_DEPTH_OPTIONS = [
  { get label() { return i18next.t('projectEval:home.options.depth.quick'); }, value: 'quick' },
  { get label() { return i18next.t('projectEval:home.options.depth.standard'); }, value: 'standard' },
  { get label() { return i18next.t('projectEval:home.options.depth.deep'); }, value: 'deep' },
  { get label() { return i18next.t('projectEval:home.options.depth.releaseGate'); }, value: 'release_gate' },
];

const RUN_STAGE_STATUS_OPTIONS = [
  { get label() { return i18next.t('projectEval:home.options.stage.scheduled'); }, value: 'scheduled' },
  { get label() { return i18next.t('projectEval:home.options.stage.running'); }, value: 'running' },
  { get label() { return i18next.t('projectEval:home.options.stage.completed'); }, value: 'completed' },
  { get label() { return i18next.t('projectEval:home.options.stage.failed'); }, value: 'failed' },
  { get label() { return i18next.t('projectEval:home.options.stage.skipped'); }, value: 'skipped' },
];

const RUN_TRUTH_OPTIONS = [
  { get label() { return i18next.t('projectEval:home.options.truth.authoritative'); }, value: 'authoritative' },
  { get label() { return i18next.t('projectEval:home.options.truth.fallback'); }, value: 'fallback' },
  { get label() { return i18next.t('projectEval:home.options.truth.pendingTruth'); }, value: 'pending_truth' },
];

const RUN_SAVED_VIEW_VISIBILITY_OPTIONS = [
  { get label() { return i18next.t('projectEval:home.savedViews.visibility.private'); }, value: 'private' },
  { get label() { return i18next.t('projectEval:home.savedViews.visibility.organization'); }, value: 'organization' },
] as const satisfies readonly { label: string; value: ProjectEvalRunSavedViewVisibility }[];

const DEFAULT_RUN_SAVED_VIEW_COLUMNS = [
  { key: 'source', get label() { return i18next.t('projectEval:home.savedViews.columns.source'); }, visible: true, order: 1 },
  { key: 'status', get label() { return i18next.t('projectEval:home.savedViews.columns.status'); }, visible: true, order: 2 },
  { key: 'health', get label() { return i18next.t('projectEval:home.savedViews.columns.health'); }, visible: true, order: 3 },
  { key: 'decision', get label() { return i18next.t('projectEval:home.savedViews.columns.decision'); }, visible: true, order: 4 },
  { key: 'score', get label() { return i18next.t('projectEval:home.savedViews.columns.score'); }, visible: true, order: 5 },
  { key: 'project_type', get label() { return i18next.t('projectEval:home.savedViews.columns.projectType'); }, visible: true, order: 6 },
  { key: 'updated_at', get label() { return i18next.t('projectEval:home.savedViews.columns.updated'); }, visible: true, order: 7 },
] as const satisfies readonly ProjectEvalRunSavedViewColumn[];

interface RunBrowserPreset {
  key: ProjectEvalRunHealthPreset;
  label: string;
  description: string;
  icon: ReactNode;
}

const RUN_BROWSER_PRESETS = [
  {
    key: 'needs_attention',
    get label() { return i18next.t('projectEval:home.presets.needsAttention.label'); },
    get description() { return i18next.t('projectEval:home.presets.needsAttention.description'); },
    icon: <WarningOutlined />,
  },
  {
    key: 'failed_or_blocked',
    get label() { return i18next.t('projectEval:home.presets.failedOrBlocked.label'); },
    get description() { return i18next.t('projectEval:home.presets.failedOrBlocked.description'); },
    icon: <ExclamationCircleOutlined />,
  },
  {
    key: 'pending_approval',
    get label() { return i18next.t('projectEval:home.presets.pendingApproval.label'); },
    get description() { return i18next.t('projectEval:home.presets.pendingApproval.description'); },
    icon: <SafetyCertificateOutlined />,
  },
  {
    key: 'stale_running',
    get label() { return i18next.t('projectEval:home.presets.staleRunning.label'); },
    get description() { return i18next.t('projectEval:home.presets.staleRunning.description'); },
    icon: <ClockCircleOutlined />,
  },
  {
    key: 'low_evidence',
    get label() { return i18next.t('projectEval:home.presets.lowEvidence.label'); },
    get description() { return i18next.t('projectEval:home.presets.lowEvidence.description'); },
    icon: <FileSearchOutlined />,
  },
  {
    key: 'repair_recommended',
    get label() { return i18next.t('projectEval:home.presets.repairRecommended.label'); },
    get description() { return i18next.t('projectEval:home.presets.repairRecommended.description'); },
    icon: <ToolOutlined />,
  },
] as const satisfies readonly RunBrowserPreset[];

interface ServerRunFilters {
  healthPreset?: ProjectEvalRunHealthPreset;
  status?: string;
  health?: string;
  orchestration?: string;
  evaluationDepth?: string;
  stageStatus?: string;
  truth?: string;
}

type EditableServerRunFilterKey = Exclude<keyof ServerRunFilters, 'healthPreset'>;

interface RunSavedViewDraft {
  id?: string;
  name: string;
  description: string;
  visibility: ProjectEvalRunSavedViewVisibility;
  isDefault: boolean;
  pinned: boolean;
}

function createDefaultRunSavedViewDraft(): RunSavedViewDraft {
  return {
    name: '',
    description: '',
    visibility: 'private',
    isDefault: false,
    pinned: true,
  };
}

function formatRate(value: number, total: number): string {
  if (total <= 0) {
    return '0%';
  }
  return `${Math.round((value / total) * 100)}%`;
}

function getAuthorityTone(run: ProjectEvalRunListItem): { label: string; color: string } {
  if (run.authoritative_truth) {
    return { label: i18next.t('projectEval:home.options.truth.authoritative'), color: 'success' };
  }
  if (run.legacy_fallback_used) {
    return { label: i18next.t('projectEval:home.options.truth.fallback'), color: 'gold' };
  }
  return { label: i18next.t('projectEval:home.options.truth.pendingTruth'), color: 'default' };
}

function getRunBrowserSummary(run: ProjectEvalRunListItem): string {
  if (run.evidence_posture?.insufficient_evidence) {
    return i18next.t('projectEval:home.runCard.insufficientEvidenceSummary', {
      reason: getEvidenceInsufficientReasonLabel(run.evidence_posture.insufficient_evidence_reason),
    });
  }
  if (run.evidence_posture && !run.evidence_posture.authoritative_ready) {
    return i18next.t('projectEval:home.runCard.evidencePostureSummary', {
      status: getEvidencePostureStatusLabel(run.evidence_posture.status),
      truthSource: getEvidenceTruthSourceLabel(run.evidence_posture.truth_source_mode),
    });
  }
  if (run.summary?.trim()) {
    return run.summary.trim();
  }
  if (run.outcome?.explain?.trim()) {
    return run.outcome.explain.trim();
  }
  if (run.error_message?.trim()) {
    return run.error_message.trim();
  }
  return i18next.t('projectEval:home.runCard.noSummary');
}

function getSourceTypeText(value?: string): string {
  if (!value) {
    return '';
  }
  if (value === 'zip') {
    return i18next.t('projectEval:home.sourceTypes.zip');
  }
  if (value === 'git') {
    return i18next.t('projectEval:home.sourceTypes.git');
  }
  return i18next.t('projectEval:home.sourceTypes.generic', { type: humanizeKey(value) });
}

function getRunOutcomeTone(outcome?: RunReportOutcomeView): { label: string; color: string } {
  if (!outcome) {
    return { label: i18next.t('projectEval:home.outcomeUnknown'), color: 'default' };
  }

  return getReportOutcomeTone(outcome.kind);
}

function getRunOutcomeActionLabel(outcome?: RunReportOutcomeView): string {
  if (!outcome) {
    return i18next.t('projectEval:home.openReport');
  }

  if (outcome.kind === 'repair') {
    return i18next.t('projectEval:home.createRepairDraft');
  }
  if (outcome.kind === 'replay') {
    return i18next.t('projectEval:home.viewReport');
  }
  if (outcome.kind === 'refusal') {
    return i18next.t('projectEval:home.viewExplain');
  }
  return i18next.t('projectEval:home.viewReport');
}

function buildOutcomeDraftTitle(run: ProjectEvalRunListItem): string {
  const summary = run.summary?.trim();
  if (summary) {
    return i18next.t('projectEval:home.draftTitleWithSummary', { summary: summary.slice(0, 24) });
  }
  const decision = run.decision ? humanizeKey(run.decision) : i18next.t('projectEval:title');
  return i18next.t('projectEval:home.draftTitleWithDecision', { decision });
}

function buildOutcomeDraftObjective(run: ProjectEvalRunListItem): string {
  const lines = [
    i18next.t('projectEval:home.draftFromSource', { id: run.id }),
    i18next.t('projectEval:home.draftConclusion', {
      decision: run.decision ? humanizeKey(run.decision) : i18next.t('projectEval:home.draftUnknownDecision'),
      score: formatScore(run.score),
    }),
  ];
  if (run.summary?.trim()) {
    lines.push(i18next.t('projectEval:home.draftSummary', { summary: run.summary.trim() }));
  }
  if (run.outcome?.label) {
    lines.push(i18next.t('projectEval:home.draftOutcome', { label: run.outcome.label }));
  }
  if (run.outcome?.explain?.trim()) {
    lines.push(i18next.t('projectEval:home.draftOutcomeExplain', { explain: run.outcome.explain.trim() }));
  }
  return lines.join('\n');
}

function getHealthTone(state?: string): { label: string; color: string } {
  switch (state) {
    case 'retry_required':
      return { label: i18next.t('projectEval:home.options.health.retryRequired'), color: 'volcano' };
    case 'failed_stage':
      return { label: i18next.t('projectEval:home.options.health.failedStage'), color: 'error' };
    case 'stale_stage_plan':
      return { label: i18next.t('projectEval:home.healthLabels.stalePlan'), color: 'magenta' };
    case 'insufficient_evidence':
      return { label: i18next.t('projectEval:home.options.health.insufficientEvidence'), color: 'gold' };
    case 'fallback':
      return { label: i18next.t('projectEval:home.options.health.fallback'), color: 'orange' };
    case 'staged_running':
      return { label: i18next.t('projectEval:home.healthLabels.stagedRunning'), color: 'processing' };
    case 'healthy':
      return { label: i18next.t('projectEval:home.healthLabels.healthy'), color: 'success' };
    case 'awaiting_approval':
      return { label: i18next.t('projectEval:home.healthLabels.awaitingApproval'), color: 'blue' };
    case 'queued':
      return { label: i18next.t('projectEval:home.options.status.pending'), color: 'default' };
    case 'running':
      return { label: i18next.t('projectEval:home.options.status.running'), color: 'processing' };
    case 'failed':
      return { label: i18next.t('projectEval:home.options.status.failed'), color: 'error' };
    case 'cancelled':
      return { label: i18next.t('projectEval:home.options.status.cancelled'), color: 'default' };
    default:
      return {
        label: state ? humanizeKey(state) : i18next.t('projectEval:home.healthLabels.pending'),
        color: 'default',
      };
  }
}

function hasActiveServerRunFilters(filters: ServerRunFilters): boolean {
  return Object.values(filters).some((value) => Boolean(value));
}

function buildSavedViewFiltersFromServerFilters(
  filters: ServerRunFilters,
  includeDefaultOrder = true
): ProjectEvalRunSavedViewFilters {
  const out: ProjectEvalRunSavedViewFilters = {};
  if (includeDefaultOrder) {
    out.order_by = 'updated_at';
    out.order_dir = 'desc';
  }
  if (filters.status) {
    out.statuses = [filters.status];
  }
  if (filters.healthPreset) {
    out.health_preset = filters.healthPreset;
  }
  if (filters.evaluationDepth) {
    out.evaluation_depth = filters.evaluationDepth;
  }
  if (filters.stageStatus) {
    out.stage_status = filters.stageStatus;
  }

  switch (filters.health) {
    case 'retry_required':
      out.retry_required_only = true;
      break;
    case 'failed_stage':
      out.has_failed_stages = true;
      break;
    case 'stale_stage_plan':
      out.stale_stage_plan_only = true;
      break;
    case 'insufficient_evidence':
      out.insufficient_evidence_only = true;
      break;
    case 'fallback':
      out.legacy_fallback_used = true;
      break;
    case 'authoritative':
      out.authoritative_truth = true;
      break;
    default:
      break;
  }

  switch (filters.orchestration) {
    case 'staged':
      out.staged_only = true;
      break;
    case 'large':
      out.large_project_only = true;
      break;
    case 'single_stage':
      out.staged_only = false;
      break;
    default:
      break;
  }

  switch (filters.truth) {
    case 'authoritative':
      out.authoritative_truth = true;
      break;
    case 'fallback':
      out.legacy_fallback_used = true;
      break;
    case 'pending_truth':
      out.authoritative_truth = false;
      out.legacy_fallback_used = false;
      break;
    default:
      break;
  }

  return out;
}

function getServerFiltersFromSavedViewFilters(
  filters?: ProjectEvalRunSavedViewFilters
): ServerRunFilters {
  if (!filters) {
    return {};
  }

  const out: ServerRunFilters = {};
  if (filters.health_preset) {
    out.healthPreset = filters.health_preset;
  }
  if (filters.statuses?.length === 1) {
    out.status = filters.statuses[0];
  }
  if (filters.evaluation_depth) {
    out.evaluationDepth = filters.evaluation_depth;
  }
  if (filters.stage_status) {
    out.stageStatus = filters.stage_status;
  }
  if (filters.retry_required_only) {
    out.health = 'retry_required';
  } else if (filters.has_failed_stages) {
    out.health = 'failed_stage';
  } else if (filters.stale_stage_plan_only) {
    out.health = 'stale_stage_plan';
  } else if (filters.insufficient_evidence_only) {
    out.health = 'insufficient_evidence';
  } else if (filters.legacy_fallback_used) {
    out.health = 'fallback';
  } else if (filters.authoritative_truth) {
    out.health = 'authoritative';
  }

  if (filters.large_project_only) {
    out.orchestration = 'large';
  } else if (filters.staged_only === true) {
    out.orchestration = 'staged';
  } else if (filters.staged_only === false) {
    out.orchestration = 'single_stage';
  }

  if (filters.authoritative_truth === true) {
    out.truth = 'authoritative';
  } else if (filters.legacy_fallback_used === true) {
    out.truth = 'fallback';
  } else if (filters.authoritative_truth === false && filters.legacy_fallback_used === false) {
    out.truth = 'pending_truth';
  }

  return out;
}

function buildEffectiveSavedViewFilters(
  filters: ServerRunFilters,
  base?: ProjectEvalRunSavedViewFilters
): ProjectEvalRunSavedViewFilters {
  return {
    ...base,
    ...buildSavedViewFiltersFromServerFilters(filters),
  };
}

function buildServerRunListParams(
  page: number,
  filters: ServerRunFilters,
  savedViewID?: string
): ProjectEvalRunListParams {
  const params: ProjectEvalRunListParams = {
    page,
    page_size: SERVER_RUNS_PAGE_SIZE,
  };
  if (savedViewID) {
    params.saved_view_id = savedViewID;
  } else {
    params.order_by = 'updated_at';
    params.order_dir = 'desc';
  }

  if (filters.status) {
    params.status = filters.status;
  }
  if (filters.healthPreset) {
    params.health_preset = filters.healthPreset;
  }
  if (filters.evaluationDepth) {
    params.evaluation_depth = filters.evaluationDepth;
  }
  if (filters.stageStatus) {
    params.stage_status = filters.stageStatus;
  }

  switch (filters.health) {
    case 'retry_required':
      params.retry_required_only = true;
      break;
    case 'failed_stage':
      params.has_failed_stages = true;
      break;
    case 'stale_stage_plan':
      params.stale_stage_plan_only = true;
      break;
    case 'insufficient_evidence':
      params.insufficient_evidence_only = true;
      break;
    case 'fallback':
      params.legacy_fallback_used = true;
      break;
    case 'authoritative':
      params.authoritative_truth = true;
      break;
    default:
      break;
  }

  switch (filters.orchestration) {
    case 'staged':
      params.staged_only = true;
      break;
    case 'large':
      params.large_project_only = true;
      break;
    case 'single_stage':
      params.staged_only = false;
      break;
    default:
      break;
  }

  switch (filters.truth) {
    case 'authoritative':
      params.authoritative_truth = true;
      break;
    case 'fallback':
      params.legacy_fallback_used = true;
      break;
    case 'pending_truth':
      params.authoritative_truth = false;
      params.legacy_fallback_used = false;
      break;
    default:
      break;
  }

  return params;
}

function getRunSavedViewSummary(view: ProjectEvalRunSavedView): string {
  if (view.description?.trim()) {
    return view.description.trim();
  }
  const filters = view.filters || {};
  const parts = [
    filters.health_preset ? `preset ${humanizeKey(filters.health_preset)}` : '',
    filters.statuses?.length ? `${filters.statuses.length} status filter` : '',
    filters.evaluation_depth ? `depth ${humanizeKey(filters.evaluation_depth)}` : '',
    filters.stage_status ? `stage ${humanizeKey(filters.stage_status)}` : '',
    filters.large_project_only ? 'large projects' : '',
    filters.staged_only ? 'staged runs' : '',
    filters.legacy_fallback_used ? 'fallback truth' : '',
    filters.authoritative_truth ? 'authoritative truth' : '',
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' · ') : 'All organization-visible runs.';
}

function getRunSavedViewVisibilityLabel(visibility?: string): string {
  if (visibility === 'organization') {
    return 'Org';
  }
  return 'Private';
}

export default function ProjectEvalHomePage() {
  const navigate = useNavigate();
  const { t } = useTranslation('projectEval');
  const tokens = useThemeTokens();
  const admin = useMemo(() => isPersistedOrgAdmin(), []);
  const [overviewLoading, setOverviewLoading] = useState(true);
  const [serverRunsLoading, setServerRunsLoading] = useState(true);
  const [savedViewsLoading, setSavedViewsLoading] = useState(true);
  const [savingView, setSavingView] = useState(false);
  const [capabilities, setCapabilities] = useState<ProjectEvalCapabilities | null>(null);
  const [summary, setSummary] = useState<RunInsightsSummary | null>(null);
  const [serverRuns, setServerRuns] = useState<ProjectEvalRunListItem[]>([]);
  const [serverRunsTotal, setServerRunsTotal] = useState(0);
  const [serverRunsPage, setServerRunsPage] = useState(1);
  const [serverRunsError, setServerRunsError] = useState<string | null>(null);
  const [serverRunFilters, setServerRunFilters] = useState<ServerRunFilters>({});
  const [runSavedViews, setRunSavedViews] = useState<ProjectEvalRunSavedView[]>([]);
  const [runSavedViewsError, setRunSavedViewsError] = useState<string | null>(null);
  const [activeRunSavedViewID, setActiveRunSavedViewID] = useState<string>();
  const [defaultRunSavedViewID, setDefaultRunSavedViewID] = useState<string>();
  const [savedViewModalOpen, setSavedViewModalOpen] = useState(false);
  const [savedViewDraft, setSavedViewDraft] = useState<RunSavedViewDraft>(() =>
    createDefaultRunSavedViewDraft()
  );
  const [recentRuns, setRecentRuns] = useState<RecentProjectEvalRun[]>([]);
  const [runIdInput, setRunIdInput] = useState('');

  const refreshRecentRuns = useCallback(() => {
    setRecentRuns(loadRecentProjectEvalRuns());
  }, []);

  const fetchOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const [capabilitiesResult, summaryResult] = await Promise.allSettled([
        projectEvalService.getCapabilities(),
        projectEvalService.getInsightsSummary({ days: 14 }),
      ]);
      setCapabilities(
        capabilitiesResult.status === 'fulfilled'
          ? (capabilitiesResult.value as unknown as ProjectEvalCapabilities)
          : null
      );
      setSummary(
        summaryResult.status === 'fulfilled'
          ? (summaryResult.value as unknown as RunInsightsSummary)
          : null
      );
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  const fetchRunSavedViews = useCallback(
    async (applyDefaultIfInactive = true) => {
      setSavedViewsLoading(true);
      try {
        const response = await projectEvalService.listRunSavedViews(
          {
            page: 1,
            page_size: RUN_SAVED_VIEW_PAGE_SIZE,
            order_by: 'sort_order',
            order_dir: 'asc',
          },
          { silentError: true }
        );
        const payload = response as unknown as ProjectEvalRunSavedViewListResponse;
        const builtinItems = Array.isArray(payload.builtin_items) ? payload.builtin_items : [];
        const customItems = Array.isArray(payload.items) ? payload.items : [];
        const nextViews = [...builtinItems, ...customItems];
        setRunSavedViews(nextViews);
        setDefaultRunSavedViewID(payload.default_view_id || undefined);
        setRunSavedViewsError(null);
        if (applyDefaultIfInactive && !activeRunSavedViewID && payload.default_view_id) {
          const defaultView = nextViews.find((view) => view.id === payload.default_view_id);
          if (defaultView) {
            setActiveRunSavedViewID(defaultView.id);
            setServerRunFilters(getServerFiltersFromSavedViewFilters(defaultView.filters));
            setServerRunsPage(1);
          }
        }
      } catch {
        setRunSavedViews([]);
        setDefaultRunSavedViewID(undefined);
        setRunSavedViewsError(t('home.errors.savedViewsUnavailable'));
      } finally {
        setSavedViewsLoading(false);
      }
    },
    [activeRunSavedViewID, t]
  );

  const fetchServerRuns = useCallback(
    async (page: number, filters: ServerRunFilters, savedViewID?: string) => {
      setServerRunsLoading(true);
      try {
        const response = await projectEvalService.listRuns(
          buildServerRunListParams(page, filters, savedViewID),
          { silentError: true }
        );
        const payload = response as unknown as ProjectEvalRunListResponse;
        setServerRuns(Array.isArray(payload.items) ? payload.items : []);
        setServerRunsTotal(typeof payload.total === 'number' ? payload.total : 0);
        setServerRunsError(null);
      } catch {
        setServerRuns([]);
        setServerRunsTotal(0);
        setServerRunsError(t('home.errors.runsUnavailable'));
      } finally {
        setServerRunsLoading(false);
      }
    },
    [t]
  );

  useEffect(() => {
    void fetchOverview();
  }, [fetchOverview]);

  useEffect(() => {
    void fetchRunSavedViews();
  }, [fetchRunSavedViews]);

  useEffect(() => {
    void fetchServerRuns(serverRunsPage, serverRunFilters, activeRunSavedViewID);
  }, [activeRunSavedViewID, fetchServerRuns, serverRunFilters, serverRunsPage]);

  useEffect(() => {
    refreshRecentRuns();
    const handleFocus = () => refreshRecentRuns();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshRecentRuns]);

  const totalRuns = summary?.total_runs ?? 0;
  const authoritativeRuns = summary?.authoritative_runs ?? summary?.evidence_backed_runs ?? 0;
  const insufficientEvidenceRuns = summary?.insufficient_evidence_runs ?? 0;
  const authoritativeRate = useMemo(
    () => formatRate(authoritativeRuns, totalRuns),
    [authoritativeRuns, totalRuns]
  );
  const insufficientEvidenceRate = useMemo(
    () => formatRate(insufficientEvidenceRuns, totalRuns),
    [insufficientEvidenceRuns, totalRuns]
  );
  const summaryStatusDistribution = summary?.status_distribution ?? {};
  const summaryDecisionDistribution = summary?.decision_distribution ?? {};
  const summaryScoreModeDistribution = summary?.score_mode_distribution ?? {};

  const serverRunsPageCount = useMemo(
    () => Math.max(1, Math.ceil(serverRunsTotal / SERVER_RUNS_PAGE_SIZE)),
    [serverRunsTotal]
  );

  const activeServerRunFilters = useMemo(
    () => hasActiveServerRunFilters(serverRunFilters),
    [serverRunFilters]
  );

  const activeRunSavedView = useMemo(
    () => runSavedViews.find((view) => view.id === activeRunSavedViewID),
    [activeRunSavedViewID, runSavedViews]
  );

  const customRunSavedViews = useMemo(
    () => runSavedViews.filter((view) => !view.builtin),
    [runSavedViews]
  );

  const pinnedRunSavedViews = useMemo(
    () => runSavedViews.filter((view) => view.builtin || view.pinned || view.is_default),
    [runSavedViews]
  );

  const canMutateActiveRunSavedView = Boolean(
    activeRunSavedView &&
    !activeRunSavedView.builtin &&
    (activeRunSavedView.visibility === 'private' || admin)
  );

  const activeRunBrowserPreset = useMemo(
    () => RUN_BROWSER_PRESETS.find((preset) => preset.key === serverRunFilters.healthPreset),
    [serverRunFilters.healthPreset]
  );

  const handleOpenRun = useCallback(() => {
    const runId = runIdInput.trim();
    if (!runId) {
      message.warning(t('home.messages.enterRunId'));
      return;
    }
    navigate(`/project-eval/${runId}`);
  }, [navigate, runIdInput, t]);

  const updateServerRunFilter = useCallback((key: EditableServerRunFilterKey, value?: string) => {
    setServerRunsPage(1);
    setServerRunFilters((prev) => {
      const next = { ...prev };
      if (value) {
        next[key] = value;
      } else {
        delete next[key];
      }
      if (key === 'health' && value) {
        delete next.healthPreset;
      }
      return next;
    });
  }, []);

  const applyRunSavedView = useCallback(
    (viewID?: string) => {
      setServerRunsPage(1);
      if (!viewID) {
        setActiveRunSavedViewID(undefined);
        setServerRunFilters({});
        return;
      }
      const view = runSavedViews.find((item) => item.id === viewID);
      setActiveRunSavedViewID(viewID);
      setServerRunFilters(getServerFiltersFromSavedViewFilters(view?.filters));
    },
    [runSavedViews]
  );

  const applyServerRunPreset = useCallback((preset: ProjectEvalRunHealthPreset) => {
    setServerRunsPage(1);
    setActiveRunSavedViewID(undefined);
    setServerRunFilters((prev) => {
      const next = { ...prev };
      if (next.healthPreset === preset) {
        delete next.healthPreset;
        return next;
      }
      next.healthPreset = preset;
      delete next.health;
      return next;
    });
  }, []);

  const clearServerRunFilters = useCallback(() => {
    setServerRunsPage(1);
    setActiveRunSavedViewID(undefined);
    setServerRunFilters({});
  }, []);

  const openCreateSavedViewModal = useCallback(() => {
    setSavedViewDraft({
      ...createDefaultRunSavedViewDraft(),
      name:
        activeRunSavedView && !activeRunSavedView.builtin
          ? t('home.savedViews.copyName', { name: activeRunSavedView.name })
          : '',
      description: activeRunSavedView?.description || '',
      visibility: admin ? 'organization' : 'private',
      isDefault: false,
      pinned: true,
    });
    setSavedViewModalOpen(true);
  }, [activeRunSavedView, admin, t]);

  const openEditSavedViewModal = useCallback((view: ProjectEvalRunSavedView) => {
    if (view.builtin) {
      message.info(t('home.messages.builtinCannotEdit'));
      return;
    }
    setSavedViewDraft({
      id: view.id,
      name: view.name,
      description: view.description || '',
      visibility: view.visibility,
      isDefault: view.is_default,
      pinned: view.pinned,
    });
    setSavedViewModalOpen(true);
  }, [t]);

  const submitRunSavedView = useCallback(async () => {
    const name = savedViewDraft.name.trim();
    if (!name) {
      message.warning(t('home.messages.nameSavedView'));
      return;
    }
    if (savedViewDraft.visibility === 'organization' && !admin) {
      message.warning(t('home.messages.adminRequiredSharedView'));
      return;
    }

    setSavingView(true);
    try {
      const editingActiveView =
        Boolean(activeRunSavedView) && savedViewDraft.id === activeRunSavedView?.id;
      const baseFilters = editingActiveView ? activeRunSavedView?.filters : undefined;
      const payload: UpsertProjectEvalRunSavedViewRequest = {
        name,
        description: savedViewDraft.description.trim(),
        visibility: savedViewDraft.visibility,
        is_default: savedViewDraft.isDefault,
        pinned: savedViewDraft.pinned,
        sort_order: savedViewDraft.pinned ? 100 : 0,
        filters: buildEffectiveSavedViewFilters(serverRunFilters, baseFilters),
        columns: [...DEFAULT_RUN_SAVED_VIEW_COLUMNS],
        metadata: {
          source: 'project_eval_home',
          active_saved_view_id: activeRunSavedView?.id,
        },
      };

      const response = savedViewDraft.id
        ? await projectEvalService.updateRunSavedView(savedViewDraft.id, payload, {
            silentError: true,
          })
        : await projectEvalService.createRunSavedView(payload, { silentError: true });
      const saved = response as unknown as ProjectEvalRunSavedView;
      setSavedViewModalOpen(false);
      setActiveRunSavedViewID(saved.id);
      setServerRunFilters(getServerFiltersFromSavedViewFilters(saved.filters));
      setServerRunsPage(1);
      await fetchRunSavedViews(false);
      message.success(savedViewDraft.id ? t('home.messages.savedViewUpdated') : t('home.messages.savedViewCreated'));
    } catch {
      message.error(t('home.messages.saveViewFailed'));
    } finally {
      setSavingView(false);
    }
  }, [activeRunSavedView, admin, fetchRunSavedViews, savedViewDraft, serverRunFilters, t]);

  const deleteRunSavedView = useCallback(
    async (view: ProjectEvalRunSavedView) => {
      if (view.builtin) {
        message.info(t('home.messages.builtinCannotDelete'));
        return;
      }
      try {
        await projectEvalService.deleteRunSavedView(view.id, { silentError: true });
        if (activeRunSavedViewID === view.id) {
          setActiveRunSavedViewID(undefined);
          setServerRunFilters({});
          setServerRunsPage(1);
        }
        await fetchRunSavedViews(false);
        message.success(t('home.messages.savedViewDeleted'));
      } catch {
        message.error(t('home.messages.deleteViewFailed'));
      }
    },
    [activeRunSavedViewID, fetchRunSavedViews, t]
  );

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <PageHeader
        title={t('home.pageTitle')}
        description={t('home.pageDescription')}
        breadcrumb={[{ title: t('home.workspace') }, { title: t('home.pageTitle') }]}
        extra={
          <Space wrap>
            <Button icon={<BarChartOutlined />} onClick={() => navigate('/project-eval/insights')}>
              {t('home.actions.insights')}
            </Button>
            <Button
              icon={<SafetyCertificateOutlined />}
              onClick={() => navigate('/project-eval/acceptance')}
            >
              {t('home.actions.acceptance')}
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/project-eval/create')}
            >
              {t('home.actions.newProjectEval')}
            </Button>
          </Space>
        }
      />

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message={t('home.mainlineNotice')}
      />

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} xl={15}>
          <Card
            style={{
              height: '100%',
              borderColor: tokens.border.default,
              background: `linear-gradient(135deg, ${tokens.bg.secondary}, ${tokens.bg.primary})`,
            }}
          >
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Space wrap>
                <Tag color="blue">{t('home.hero.tags.mainline')}</Tag>
                <Tag color="green">{t('home.hero.tags.evidenceBacked')}</Tag>
                <Tag>{t('home.hero.tags.reportsRepair')}</Tag>
              </Space>
              <div>
                <Title level={3} style={{ marginBottom: 8 }}>
                  {t('home.hero.title')}
                </Title>
                <Paragraph style={{ marginBottom: 0 }}>
                  {t('home.hero.description')}
                </Paragraph>
              </div>
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic
                    title={t('home.stats.runs14d')}
                    value={summary?.total_runs ?? 0}
                    loading={overviewLoading}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic
                    title={t('home.stats.authoritativeScore')}
                    value={summary?.authoritative_average_score ?? summary?.average_score ?? 0}
                    precision={1}
                    loading={overviewLoading}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic
                    title={t('home.stats.authoritativeRate')}
                    value={authoritativeRate}
                    loading={overviewLoading}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic title={t('home.stats.insufficientRate')} value={insufficientEvidenceRate} loading={overviewLoading} />
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={9}>
          <Card title={t('home.openRun.title')} style={{ height: '100%' }}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Text type="secondary">
                {t('home.openRun.description')}
              </Text>
              <Input
                placeholder={t('home.openRun.placeholder')}
                value={runIdInput}
                onChange={(event) => setRunIdInput(event.target.value)}
                onPressEnter={handleOpenRun}
              />
              <Space wrap>
                <Button type="primary" icon={<ArrowRightOutlined />} onClick={handleOpenRun}>
                  {t('home.actions.openRun')}
                </Button>
                <Button icon={<PlusOutlined />} onClick={() => navigate('/project-eval/create')}>
                  {t('home.actions.newProjectEval')}
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title={t('home.fastPaths.title')} style={{ height: '100%' }}>
            <Row gutter={[12, 12]}>
              {[
                {
                  icon: <PlusOutlined />,
                  title: t('home.fastPaths.newProjectEval.title'),
                  text: t('home.fastPaths.newProjectEval.text'),
                  path: '/project-eval/create',
                },
                {
                  icon: <BarChartOutlined />,
                  title: t('home.fastPaths.insights.title'),
                  text: t('home.fastPaths.insights.text'),
                  path: '/project-eval/insights',
                },
                {
                  icon: <SafetyCertificateOutlined />,
                  title: t('home.fastPaths.acceptance.title'),
                  text: t('home.fastPaths.acceptance.text'),
                  path: '/project-eval/acceptance',
                },
                {
                  icon: <ToolOutlined />,
                  title: t('home.fastPaths.repairRuns.title'),
                  text: t('home.fastPaths.repairRuns.text'),
                  path: '/repair-runs',
                },
              ].map((item) => (
                <Col xs={24} sm={12} key={item.path}>
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => navigate(item.path)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        navigate(item.path);
                      }
                    }}
                    style={{
                      cursor: 'pointer',
                      border: `1px solid ${tokens.border.default}`,
                      borderRadius: 8,
                      padding: 14,
                      minHeight: 120,
                    }}
                  >
                    <Space direction="vertical" size={8}>
                      <span style={{ color: tokens.brand.primary, fontSize: 18 }}>{item.icon}</span>
                      <Text strong>{item.title}</Text>
                      <Text type="secondary">{item.text}</Text>
                    </Space>
                  </div>
                </Col>
              ))}
            </Row>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card
            title={t('home.capability.title')}
            style={{ height: '100%' }}
            loading={overviewLoading && !capabilities}
          >
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <div>
                <Text strong>{t('home.capability.projectTypes')}</Text>
                <div style={{ marginTop: 8 }}>
                  {(capabilities?.project_types ?? ['backend', 'frontend', 'llm_app', 'agent']).map(
                    (value) => (
                      <Tag key={value}>{getProjectTypeLabel(value)}</Tag>
                    )
                  )}
                </div>
              </div>
              <div>
                <Text strong>{t('home.capability.runModes')}</Text>
                <div style={{ marginTop: 8 }}>
                  {(capabilities?.run_modes ?? ['advisory', 'strict']).map((value) => (
                    <Tag key={value}>{getRunModeLabel(value)}</Tag>
                  ))}
                </div>
              </div>
              <div>
                <Text strong>{t('home.capability.knownProductGaps')}</Text>
                <div style={{ marginTop: 8 }}>
                  <Tag>{i18next.t(ZIP_SOURCE_MAINLINE_GAP_TEXT_KEY)}</Tag>
                  <Tag>{t('home.capability.gapRunBrowserHealth')}</Tag>
                  <Tag>{t('home.capability.gapRawTraceArtifacts')}</Tag>
                </div>
              </div>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card
        title={t('home.organizationRuns.title')}
        extra={
          <Space size={8} wrap>
            {activeRunSavedView && (
              <Tag color={activeRunSavedView.builtin ? 'blue' : 'green'}>
                {t('home.savedViews.activeView', { name: activeRunSavedView.name })}
              </Tag>
            )}
            {activeRunBrowserPreset && <Tag color="blue">{activeRunBrowserPreset.label}</Tag>}
            <Text type="secondary">{t('home.organizationRuns.runCount', { count: serverRunsTotal })}</Text>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              loading={serverRunsLoading || savedViewsLoading}
              onClick={() => {
                void fetchRunSavedViews();
                void fetchServerRuns(serverRunsPage, serverRunFilters, activeRunSavedViewID);
              }}
            >
              {t('home.actions.refresh')}
            </Button>
          </Space>
        }
        loading={serverRunsLoading && serverRuns.length === 0}
        style={{ marginBottom: 16 }}
      >
        <Space direction="vertical" size={10} style={{ width: '100%', marginBottom: 18 }}>
          <Space wrap align="center">
            <Text strong>{t('home.savedViews.title')}</Text>
            <Text type="secondary">
              {t('home.savedViews.description')}
            </Text>
          </Space>
          {runSavedViewsError && <Alert type="warning" showIcon message={runSavedViewsError} />}
          <Row gutter={[12, 12]} align="middle">
            <Col xs={24} md={10} xl={8}>
              <Select
                allowClear
                showSearch
                loading={savedViewsLoading}
                placeholder={t('home.savedViews.selectPlaceholder')}
                value={activeRunSavedViewID}
                optionFilterProp="label"
                onChange={applyRunSavedView}
                style={{ width: '100%' }}
                options={runSavedViews.map((view) => ({
                  value: view.id,
                  label: `${view.name}${view.builtin ? ` · ${t('home.savedViews.builtIn')}` : ''}${view.is_default ? ` · ${t('home.savedViews.default')}` : ''}`,
                }))}
              />
            </Col>
            <Col xs={24} md={14} xl={16}>
              <Space wrap>
                <Button icon={<SaveOutlined />} onClick={openCreateSavedViewModal}>
                  {t('home.savedViews.saveCurrent')}
                </Button>
                <Button
                  icon={<StarOutlined />}
                  disabled={!canMutateActiveRunSavedView}
                  onClick={() => activeRunSavedView && openEditSavedViewModal(activeRunSavedView)}
                >
                  {t('home.savedViews.updateView')}
                </Button>
                <Popconfirm
                  title={t('home.savedViews.deleteConfirmTitle')}
                  description={t('home.savedViews.deleteConfirmDescription')}
                  okText={t('home.actions.delete')}
                  okButtonProps={{ danger: true }}
                  disabled={!canMutateActiveRunSavedView}
                  onConfirm={() =>
                    activeRunSavedView && void deleteRunSavedView(activeRunSavedView)
                  }
                >
                  <Button danger icon={<DeleteOutlined />} disabled={!canMutateActiveRunSavedView}>
                    {t('home.actions.delete')}
                  </Button>
                </Popconfirm>
                {activeRunSavedView && (
                  <Button onClick={() => applyRunSavedView(undefined)}>{t('home.savedViews.leaveView')}</Button>
                )}
                {!admin && <Tag>{t('home.savedViews.orgViewsReadOnly')}</Tag>}
              </Space>
            </Col>
          </Row>
          {pinnedRunSavedViews.length > 0 && (
            <Space wrap size={[8, 8]}>
              {pinnedRunSavedViews.map((view) => {
                const active = activeRunSavedViewID === view.id;
                return (
                  <Button
                    key={view.id}
                    size="small"
                    type={active ? 'primary' : 'default'}
                    icon={
                      view.is_default || defaultRunSavedViewID === view.id ? (
                        <StarFilled />
                      ) : view.pinned ? (
                        <PushpinOutlined />
                      ) : undefined
                    }
                    title={getRunSavedViewSummary(view)}
                    aria-pressed={active}
                    onClick={() => applyRunSavedView(view.id)}
                  >
                    {view.name}
                  </Button>
                );
              })}
            </Space>
          )}
          {activeRunSavedView && (
            <div
              style={{
                border: `1px solid ${tokens.border.default}`,
                borderRadius: 8,
                padding: 12,
                background: tokens.bg.secondary,
              }}
            >
              <Space direction="vertical" size={6}>
                <Space wrap>
                  <Tag color={activeRunSavedView.builtin ? 'blue' : 'green'}>
                    {activeRunSavedView.builtin ? t('home.savedViews.builtIn') : t('home.savedViews.saved')}
                  </Tag>
                  <Tag>{getRunSavedViewVisibilityLabel(activeRunSavedView.visibility)}</Tag>
                  {(activeRunSavedView.is_default ||
                    defaultRunSavedViewID === activeRunSavedView.id) && (
                    <Tag color="gold">{t('home.savedViews.default')}</Tag>
                  )}
                  {activeRunSavedView.pinned && <Tag>{t('home.savedViews.pinned')}</Tag>}
                </Space>
                <Text type="secondary">{getRunSavedViewSummary(activeRunSavedView)}</Text>
                <Text type="secondary">
                  {t('home.savedViews.serverDefaultHint')}
                </Text>
              </Space>
            </div>
          )}
        </Space>
        <Space direction="vertical" size={8} style={{ width: '100%', marginBottom: 16 }}>
          <Space wrap align="center">
            <Text strong>{t('home.queueViews.title')}</Text>
            <Text type="secondary">
              {activeRunBrowserPreset?.description ??
                t('home.queueViews.description')}
            </Text>
          </Space>
          <Space wrap size={[8, 8]}>
            {RUN_BROWSER_PRESETS.map((preset) => {
              const active = serverRunFilters.healthPreset === preset.key;
              return (
                <Button
                  key={preset.key}
                  size="small"
                  type={active ? 'primary' : 'default'}
                  icon={preset.icon}
                  title={preset.description}
                  aria-pressed={active}
                  onClick={() => applyServerRunPreset(preset.key)}
                >
                  {preset.label}
                </Button>
              );
            })}
          </Space>
        </Space>
        <Row gutter={[12, 12]} align="bottom" style={{ marginBottom: 16 }}>
          <Col xs={24} sm={12} lg={4}>
            <Text strong>{t('home.filters.status')}</Text>
            <Select
              allowClear
              placeholder={t('home.filters.anyStatus')}
              value={serverRunFilters.status}
              options={SERVER_RUN_STATUS_OPTIONS}
              onChange={(value) => updateServerRunFilter('status', value)}
              style={{ width: '100%', marginTop: 8 }}
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Text strong>{t('home.filters.health')}</Text>
            <Select
              allowClear
              placeholder={t('home.filters.anyHealth')}
              value={serverRunFilters.health}
              options={RUN_HEALTH_OPTIONS}
              onChange={(value) => updateServerRunFilter('health', value)}
              style={{ width: '100%', marginTop: 8 }}
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Text strong>{t('home.filters.execution')}</Text>
            <Select
              allowClear
              placeholder={t('home.filters.anyExecution')}
              value={serverRunFilters.orchestration}
              options={RUN_ORCHESTRATION_OPTIONS}
              onChange={(value) => updateServerRunFilter('orchestration', value)}
              style={{ width: '100%', marginTop: 8 }}
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Text strong>{t('home.filters.depth')}</Text>
            <Select
              allowClear
              placeholder={t('home.filters.anyDepth')}
              value={serverRunFilters.evaluationDepth}
              options={RUN_DEPTH_OPTIONS}
              onChange={(value) => updateServerRunFilter('evaluationDepth', value)}
              style={{ width: '100%', marginTop: 8 }}
            />
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Text strong>{t('home.filters.truth')}</Text>
            <Select
              allowClear
              placeholder={t('home.filters.anyTruth')}
              value={serverRunFilters.truth}
              options={RUN_TRUTH_OPTIONS}
              onChange={(value) => updateServerRunFilter('truth', value)}
              style={{ width: '100%', marginTop: 8 }}
            />
          </Col>
          <Col xs={24} sm={12} lg={3}>
            <Text strong>{t('home.filters.stage')}</Text>
            <Select
              allowClear
              placeholder={t('home.filters.anyStage')}
              value={serverRunFilters.stageStatus}
              options={RUN_STAGE_STATUS_OPTIONS}
              onChange={(value) => updateServerRunFilter('stageStatus', value)}
              style={{ width: '100%', marginTop: 8 }}
            />
          </Col>
          <Col xs={24} sm={12} lg={1}>
            <Button
              block
              icon={<FilterOutlined />}
              title={t('home.filters.reset')}
              aria-label={t('home.filters.reset')}
              disabled={!activeServerRunFilters}
              onClick={clearServerRunFilters}
            />
          </Col>
        </Row>
        {serverRunsError && (
          <Alert type="warning" showIcon message={serverRunsError} style={{ marginBottom: 16 }} />
        )}
        {serverRuns.length === 0 ? (
          <Empty
            description={t('home.organizationRuns.empty')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => navigate('/project-eval/create')}
            >
              {t('home.actions.startFirstRun')}
            </Button>
          </Empty>
        ) : (
          <>
            <Row gutter={[12, 12]}>
              {serverRuns.map((run) => {
                const authorityTone = getAuthorityTone(run);
                const decisionTone = getDecisionTone(run.decision);
                const statusTone = getStatusTone(run.status);
                const healthTone = getHealthTone(run.health?.health_state);
                const outcomeTone = getRunOutcomeTone(run.outcome);
                const evidencePosture = run.evidence_posture;
                const missingCurrentRunValidation =
                  evidencePosture?.missing_current_run_execution_cases ?? 0;
                const outcomeActionPath =
                  run.outcome?.kind === 'repair'
                    ? buildProjectEvalRepairDraftPath(run.id, {
                        task_title: buildOutcomeDraftTitle(run),
                        task_objective: buildOutcomeDraftObjective(run),
                      })
                    : `/project-eval/${run.id}/${run.outcome?.kind === 'refusal' ? 'explain' : 'report'}`;
                const showScore =
                  typeof run.score === 'number' && (run.score > 0 || Boolean(run.decision));
                return (
                  <Col xs={24} md={12} xl={8} key={run.id}>
                    <div
                      style={{
                        border: `1px solid ${tokens.border.default}`,
                        borderRadius: 8,
                        padding: 14,
                        height: '100%',
                      }}
                    >
                      <Space direction="vertical" size={10} style={{ width: '100%' }}>
                        <Space wrap>
                          <Tag color={statusTone.color}>{statusTone.label}</Tag>
                          {run.decision && (
                            <Tag color={decisionTone.color}>{decisionTone.label}</Tag>
                          )}
                          <Tag>{getProjectTypeLabel(run.project_type)}</Tag>
                          <Tag>{getRunModeLabel(run.mode)}</Tag>
                          <Tag color={authorityTone.color}>{authorityTone.label}</Tag>
                          {evidencePosture && (
                            <Tag color={getEvidencePostureStatusColor(evidencePosture)}>
                              {getEvidencePostureStatusLabel(evidencePosture.status)}
                            </Tag>
                          )}
                          {run.health && <Tag color={healthTone.color}>{healthTone.label}</Tag>}
                          {run.outcome && (
                            <Tag color={outcomeTone.color}>
                              {run.outcome.label || outcomeTone.label}
                            </Tag>
                          )}
                        </Space>
                        <div>
                          <Text strong>{run.source?.name || run.id}</Text>
                          <div style={{ marginTop: 6 }}>
                            <Text type="secondary">
                              {t('home.runCard.runId', { id: run.id })}
                              {run.source?.source_type
                                ? ` | ${getSourceTypeText(run.source.source_type)}`
                                : ''}
                              {run.updated_at ? ` | ${t('home.runCard.updatedAt', { time: formatDateTime(run.updated_at) })}` : ''}
                            </Text>
                          </div>
                        </div>
                        <Paragraph ellipsis={{ rows: 2 }} style={{ marginBottom: 0 }}>
                          {getRunBrowserSummary(run)}
                        </Paragraph>
                        <Space wrap>
                          {typeof run.selected_case_count === 'number' && (
                            <Tag>{t('home.runCard.selectedCases', { count: run.selected_case_count })}</Tag>
                          )}
                          {showScore && <Tag color="blue">{t('home.runCard.score', { score: formatScore(run.score) })}</Tag>}
                          {run.health?.staged && <Tag>{t('home.runCard.staged')}</Tag>}
                          {run.health?.large_project && <Tag>{t('home.runCard.largeProject')}</Tag>}
                          {run.health && run.health.failed_stage_count > 0 && (
                            <Tag color="red">{t('home.runCard.failedStages', { count: run.health.failed_stage_count })}</Tag>
                          )}
                          {run.health && run.health.retryable_stage_count > 0 && (
                            <Tag color="volcano">{t('home.runCard.retryableStages', { count: run.health.retryable_stage_count })}</Tag>
                          )}
                          {run.health && run.health.insufficient_evidence_cases > 0 && (
                            <Tag color="gold">
                              {t('home.runCard.insufficientEvidence', { count: run.health.insufficient_evidence_cases })}
                            </Tag>
                          )}
                          {evidencePosture?.truth_source_mode && (
                            <Tag>
                              {t('home.runCard.truthSource', {
                                source: getEvidenceTruthSourceLabel(evidencePosture.truth_source_mode),
                              })}
                            </Tag>
                          )}
                          {missingCurrentRunValidation > 0 && (
                            <Tag color="gold">
                              {t('home.runCard.missingCurrentRunValidation', {
                                count: missingCurrentRunValidation,
                              })}
                            </Tag>
                          )}
                        </Space>
                        {run.outcome?.next_action && run.outcome.next_action !== 'none' && (
                          <Text type="secondary">
                            {t('home.runCard.outcomePrefix')}{' '}
                            {run.outcome.next_action_label || getRunOutcomeActionLabel(run.outcome)}
                          </Text>
                        )}
                        {run.health && run.health.stage_count > 0 && (
                          <Progress
                            percent={Math.round(run.health.progress_percent)}
                            size="small"
                            status={
                              run.health.failed_stage_count > 0
                                ? 'exception'
                                : run.health.progress_percent >= 100
                                  ? 'success'
                                  : 'active'
                            }
                            format={() =>
                              t('home.runCard.stageProgress', {
                                completed: run.health?.completed_stage_count ?? 0,
                                total: run.health?.stage_count ?? 0,
                              })
                            }
                          />
                        )}
                        <Space wrap>
                          <Button
                            size="small"
                            type="primary"
                            onClick={() => navigate(`/project-eval/${run.id}`)}
                          >
                            {t('home.actions.open')}
                          </Button>
                          <Button
                            size="small"
                            onClick={() => navigate(`/project-eval/${run.id}/report`)}
                          >
                            {t('home.actions.report')}
                          </Button>
                          <Button
                            size="small"
                            onClick={() => navigate(`/project-eval/${run.id}/explain`)}
                          >
                            {t('home.actions.explain')}
                          </Button>
                          {run.outcome?.kind === 'repair' && (
                            <Button
                              size="small"
                              icon={<ToolOutlined />}
                              onClick={() => navigate(outcomeActionPath)}
                            >
                              {getRunOutcomeActionLabel(run.outcome)}
                            </Button>
                          )}
                          {run.outcome?.kind === 'refusal' && (
                            <Button
                              size="small"
                              icon={<QuestionCircleOutlined />}
                              onClick={() => navigate(outcomeActionPath)}
                            >
                              {getRunOutcomeActionLabel(run.outcome)}
                            </Button>
                          )}
                        </Space>
                      </Space>
                    </div>
                  </Col>
                );
              })}
            </Row>
            {serverRunsPageCount > 1 && (
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
                <Pagination
                  current={serverRunsPage}
                  pageSize={SERVER_RUNS_PAGE_SIZE}
                  total={serverRunsTotal}
                  size="small"
                  onChange={setServerRunsPage}
                  showSizeChanger={false}
                />
              </div>
            )}
          </>
        )}
      </Card>

      <Card
        title={t('home.localRecentRuns.title')}
        extra={
          recentRuns.length > 0 ? (
            <Button
              size="small"
              onClick={() => {
                clearRecentProjectEvalRuns();
                refreshRecentRuns();
              }}
            >
              {t('home.actions.clear')}
            </Button>
          ) : null
        }
        style={{ marginBottom: 16 }}
      >
        {recentRuns.length === 0 ? (
          <Empty
            description={t('home.localRecentRuns.empty')}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ) : (
          <Row gutter={[12, 12]}>
            {recentRuns.map((run) => {
              const decisionTone = getDecisionTone(run.decision);
              const statusTone = getStatusTone(run.status);
              return (
                <Col xs={24} md={12} xl={8} key={run.id}>
                  <div
                    style={{
                      border: `1px solid ${tokens.border.default}`,
                      borderRadius: 8,
                      padding: 14,
                      height: '100%',
                    }}
                  >
                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                      <Space wrap>
                        {run.status && <Tag color={statusTone.color}>{statusTone.label}</Tag>}
                        {run.decision && <Tag color={decisionTone.color}>{decisionTone.label}</Tag>}
                        {run.projectType && <Tag>{getProjectTypeLabel(run.projectType)}</Tag>}
                        {run.mode && <Tag>{getRunModeLabel(run.mode)}</Tag>}
                      </Space>
                      <Text strong>{run.id}</Text>
                      <Text type="secondary">{t('home.localRecentRuns.lastOpened', { time: formatDateTime(run.lastVisitedAt) })}</Text>
                      {typeof run.score === 'number' && (
                        <Text type="secondary">{t('home.runCard.score', { score: formatScore(run.score) })}</Text>
                      )}
                      <Space wrap>
                        <Button
                          size="small"
                          type="primary"
                          onClick={() => navigate(`/project-eval/${run.id}`)}
                        >
                          {t('home.actions.open')}
                        </Button>
                        <Button
                          size="small"
                          onClick={() => navigate(`/project-eval/${run.id}/report`)}
                        >
                          {t('home.actions.report')}
                        </Button>
                        <Button
                          size="small"
                          onClick={() => navigate(`/project-eval/${run.id}/explain`)}
                        >
                          {t('home.actions.explain')}
                        </Button>
                      </Space>
                    </Space>
                  </div>
                </Col>
              );
            })}
          </Row>
        )}
      </Card>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card title={t('home.snapshot.title')}>
            {summary ? (
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic title={t('home.snapshot.repairRuns')} value={summary.linked_repair_runs ?? 0} />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic title={t('home.snapshot.replayCompleted')} value={summary.replay_completed_runs ?? 0} />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic
                    title={t('home.snapshot.warnBlockCases')}
                    value={(summary.warn_cases ?? 0) + (summary.block_cases ?? 0)}
                  />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic
                    title={t('home.snapshot.coverage')}
                    value={summary.average_coverage_score ?? 0}
                    precision={1}
                  />
                </Col>
                <Col xs={24} md={8}>
                  <Text strong>{t('home.filters.status')}</Text>
                  <div style={{ marginTop: 8 }}>
                    {Object.entries(summaryStatusDistribution).map(([name, count]) => (
                      <Tag key={name}>
                        {getStatusTone(name).label}: {count}
                      </Tag>
                    ))}
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <Text strong>{t('home.snapshot.decision')}</Text>
                  <div style={{ marginTop: 8 }}>
                    {Object.entries(summaryDecisionDistribution).map(([name, count]) => (
                      <Tag key={name}>
                        {getDecisionTone(name).label}: {count}
                      </Tag>
                    ))}
                  </div>
                </Col>
                <Col xs={24} md={8}>
                  <Text strong>{t('home.snapshot.scoreMode')}</Text>
                  <div style={{ marginTop: 8 }}>
                    {Object.entries(summaryScoreModeDistribution).map(([name, count]) => (
                      <Tag key={name}>
                        {getScoreModeLabel(name)}: {count}
                      </Tag>
                    ))}
                  </div>
                </Col>
              </Row>
            ) : (
              <Empty
                description={t('home.snapshot.unavailable')}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title={t('home.workspaceMap.title')} style={{ height: '100%' }}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Paragraph style={{ marginBottom: 0 }}>
                {t('home.workspaceMap.description')}
              </Paragraph>
              <Button
                icon={<FileSearchOutlined />}
                onClick={() => navigate('/project-eval/acceptance')}
              >
                {t('home.actions.openAcceptance')}
              </Button>
            </Space>
          </Card>
        </Col>
      </Row>
      <Modal
        title={savedViewDraft.id ? t('home.savedViews.modal.updateTitle') : t('home.savedViews.modal.createTitle')}
        open={savedViewModalOpen}
        okText={savedViewDraft.id ? t('home.savedViews.updateView') : t('home.savedViews.modal.saveView')}
        confirmLoading={savingView}
        onOk={() => void submitRunSavedView()}
        onCancel={() => setSavedViewModalOpen(false)}
        destroyOnClose
      >
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <div>
            <Text strong>{t('home.savedViews.modal.name')}</Text>
            <Input
              placeholder={t('home.savedViews.modal.namePlaceholder')}
              value={savedViewDraft.name}
              maxLength={128}
              onChange={(event) =>
                setSavedViewDraft((current) => ({ ...current, name: event.target.value }))
              }
              style={{ marginTop: 8 }}
            />
          </div>
          <div>
            <Text strong>{t('home.savedViews.modal.description')}</Text>
            <Input.TextArea
              placeholder={t('home.savedViews.modal.descriptionPlaceholder')}
              value={savedViewDraft.description}
              rows={3}
              maxLength={512}
              onChange={(event) =>
                setSavedViewDraft((current) => ({ ...current, description: event.target.value }))
              }
              style={{ marginTop: 8 }}
            />
          </div>
          <div>
            <Text strong>{t('home.savedViews.modal.visibility')}</Text>
            <Select<ProjectEvalRunSavedViewVisibility>
              value={savedViewDraft.visibility}
              options={RUN_SAVED_VIEW_VISIBILITY_OPTIONS.map((option) => ({
                ...option,
                disabled: option.value === 'organization' && !admin,
              }))}
              onChange={(visibility) =>
                setSavedViewDraft((current) => ({ ...current, visibility }))
              }
              style={{ width: '100%', marginTop: 8 }}
            />
            {!admin && (
              <Text type="secondary">
                {t('home.savedViews.modal.adminOnly')}
              </Text>
            )}
          </div>
          <Space direction="vertical" size={8}>
            <Checkbox
              checked={savedViewDraft.pinned}
              onChange={(event) =>
                setSavedViewDraft((current) => ({ ...current, pinned: event.target.checked }))
              }
            >
              {t('home.savedViews.modal.pin')}
            </Checkbox>
            <Checkbox
              checked={savedViewDraft.isDefault}
              onChange={(event) =>
                setSavedViewDraft((current) => ({ ...current, isDefault: event.target.checked }))
              }
            >
              {t('home.savedViews.modal.makeDefault')}
            </Checkbox>
          </Space>
          <Alert
            type="info"
            showIcon
            message={t('home.savedViews.modal.captureHint')}
          />
          {customRunSavedViews.length > 0 && (
            <Text type="secondary">
              {t('home.savedViews.modal.customCount', { count: customRunSavedViews.length })}
            </Text>
          )}
        </Space>
      </Modal>
    </div>
  );
}
