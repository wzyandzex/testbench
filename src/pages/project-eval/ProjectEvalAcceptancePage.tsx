import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { CSS } from '@dnd-kit/utilities';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { CSSProperties } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Input,
  InputNumber,
  List,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Switch,
  Table,
  Tag,
  Timeline,
  Tooltip,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  ArrowRightOutlined,
  BarChartOutlined,
  DeleteOutlined,
  DragOutlined,
  EditOutlined,
  FilterOutlined,
  HistoryOutlined,
  MessageOutlined,
  PlayCircleOutlined,
  PushpinOutlined,
  ReloadOutlined,
  SaveOutlined,
  StarFilled,
  StarOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { PageHeader } from '@/components/common';
import {
  formatDateTime,
  formatScore,
  getDecisionTone,
  humanizeKey,
} from '@/components/project-eval/helpers';
import { projectEvalService } from '@/services/project-eval';
import { useThemeTokens } from '@/theme';
import { isPersistedOrgAdmin } from '@/utils';
import type {
  ProjectEvalCapabilities,
  ProjectEvalSupportAcceptanceDashboard,
  ProjectEvalSupportAcceptanceDashboardParams,
  ProjectEvalSupportAcceptanceHistoryItem,
  ProjectEvalSupportAcceptanceHistoryParams,
  ProjectEvalSupportAcceptanceHistoryResponse,
  ProjectEvalSupportAcceptanceLaneReview,
  ProjectEvalSupportAcceptanceLaneReviewAudit,
  ProjectEvalSupportAcceptanceLaneReviewAuditListResponse,
  ProjectEvalSupportAcceptanceLaneReviewStatus,
  ProjectEvalSupportAcceptanceLaneSummary,
  ProjectEvalSupportAcceptanceOperatorReviewSummary,
  ProjectEvalSupportAcceptanceReviewQueueParams,
  ProjectEvalSupportAcceptanceReviewQueueResponse,
  ProjectEvalSupportAcceptanceRefreshCadence,
  ProjectEvalSupportAcceptanceRefreshPolicy,
  ProjectEvalSupportAcceptanceRefreshPolicyListResponse,
  ProjectEvalSupportAcceptanceSampleSchedule,
  ProjectEvalSupportAcceptanceSampleScheduleCandidate,
  ProjectEvalSupportAcceptanceSampleScheduleParams,
  ProjectEvalSupportAcceptanceWorkspaceColumn,
  ProjectEvalSupportAcceptanceWorkspaceFilters,
  ProjectEvalSupportAcceptanceWorkspaceSection,
  ProjectEvalSupportAcceptanceWorkspaceState,
  ProjectEvalSupportAcceptanceWorkspaceTableKey,
  ProjectEvalSupportAcceptanceWorkspaceView,
  ProjectEvalSupportAcceptanceWorkspaceViewListResponse,
  ProjectEvalSupportAcceptanceWorkspaceViewVisibility,
  RunDueSupportAcceptanceRefreshPoliciesResponse,
  UpsertProjectEvalSupportAcceptanceWorkspaceViewRequest,
  UpsertSupportAcceptanceLaneReviewRequest,
  UpsertSupportAcceptanceRefreshPolicyRequest,
} from '@/types/api/project-eval';

const { Text, Title } = Typography;

const HISTORY_PAGE_SIZE = 12;
const DASHBOARD_SCAN_LIMIT = 1000;
const SAMPLE_SCHEDULE_LIMIT = 20;
const WORKSPACE_VIEW_PAGE_SIZE = 100;
const ALL_VALUE = '__all__';

const STATUS_TONES: Record<string, { label: string; color: string }> = {
  accepted: { get label() { return i18next.t('projectEval:acceptancePage.status.accepted'); }, color: 'success' },
  provisional: { get label() { return i18next.t('projectEval:acceptancePage.status.provisional'); }, color: 'gold' },
  exploratory: { get label() { return i18next.t('projectEval:acceptancePage.status.exploratory'); }, color: 'default' },
};

const FRESHNESS_TONES: Record<string, { label: string; color: string }> = {
  fresh: { get label() { return i18next.t('projectEval:acceptancePage.freshness.fresh'); }, color: 'success' },
  aging: { get label() { return i18next.t('projectEval:acceptancePage.freshness.aging'); }, color: 'warning' },
  stale: { get label() { return i18next.t('projectEval:acceptancePage.freshness.stale'); }, color: 'error' },
  unknown: { get label() { return i18next.t('projectEval:acceptancePage.freshness.unknown'); }, color: 'default' },
};

const MATURITY_TONES: Record<string, { label: string; color: string }> = {
  stable: { get label() { return i18next.t('projectEval:acceptancePage.maturity.stable'); }, color: 'success' },
  beta: { get label() { return i18next.t('projectEval:acceptancePage.maturity.beta'); }, color: 'blue' },
  experimental: { get label() { return i18next.t('projectEval:acceptancePage.maturity.experimental'); }, color: 'default' },
};

const REVIEW_TONES: Record<string, { label: string; color: string }> = {
  current: { get label() { return i18next.t('projectEval:acceptancePage.reviewState.current'); }, color: 'success' },
  watch: { get label() { return i18next.t('projectEval:acceptancePage.reviewState.watch'); }, color: 'warning' },
  due: { get label() { return i18next.t('projectEval:acceptancePage.reviewState.due'); }, color: 'error' },
  stale: { get label() { return i18next.t('projectEval:acceptancePage.reviewState.stale'); }, color: 'volcano' },
};

const PRIORITY_TONES: Record<string, { label: string; color: string }> = {
  critical: { get label() { return i18next.t('projectEval:acceptancePage.priority.critical'); }, color: 'volcano' },
  high: { get label() { return i18next.t('projectEval:acceptancePage.priority.high'); }, color: 'error' },
  medium: { get label() { return i18next.t('projectEval:acceptancePage.priority.medium'); }, color: 'warning' },
  low: { get label() { return i18next.t('projectEval:acceptancePage.priority.low'); }, color: 'default' },
};

const SCHEDULE_STATUS_TONES: Record<string, { label: string; color: string }> = {
  executable: { get label() { return i18next.t('projectEval:acceptancePage.scheduleStatus.executable'); }, color: 'processing' },
  blocked: { get label() { return i18next.t('projectEval:acceptancePage.scheduleStatus.blocked'); }, color: 'default' },
  created: { get label() { return i18next.t('projectEval:acceptancePage.scheduleStatus.created'); }, color: 'blue' },
  confirmed: { get label() { return i18next.t('projectEval:acceptancePage.scheduleStatus.confirmed'); }, color: 'success' },
  create_failed: { get label() { return i18next.t('projectEval:acceptancePage.scheduleStatus.createFailed'); }, color: 'error' },
  confirm_failed: { get label() { return i18next.t('projectEval:acceptancePage.scheduleStatus.confirmFailed'); }, color: 'warning' },
};

const REFRESH_POLICY_STATUS_TONES: Record<string, { label: string; color: string }> = {
  never: { get label() { return i18next.t('projectEval:acceptancePage.refreshPolicyStatus.never'); }, color: 'default' },
  success: { get label() { return i18next.t('projectEval:acceptancePage.refreshPolicyStatus.success'); }, color: 'success' },
  partial: { get label() { return i18next.t('projectEval:acceptancePage.refreshPolicyStatus.partial'); }, color: 'warning' },
  empty: { get label() { return i18next.t('projectEval:acceptancePage.refreshPolicyStatus.empty'); }, color: 'default' },
  failed: { get label() { return i18next.t('projectEval:acceptancePage.refreshPolicyStatus.failed'); }, color: 'error' },
};

const OPERATOR_REVIEW_STATUS_TONES: Record<string, { label: string; color: string }> = {
  confirmed: { get label() { return i18next.t('projectEval:acceptancePage.operatorReviewStatus.confirmed'); }, color: 'success' },
  accepted_with_disclosure: { get label() { return i18next.t('projectEval:acceptancePage.operatorReviewStatus.acceptedWithDisclosure'); }, color: 'gold' },
  refresh_requested: { get label() { return i18next.t('projectEval:acceptancePage.operatorReviewStatus.refreshRequested'); }, color: 'warning' },
  promotion_approved: { get label() { return i18next.t('projectEval:acceptancePage.operatorReviewStatus.promotionApproved'); }, color: 'cyan' },
  demotion_approved: { get label() { return i18next.t('projectEval:acceptancePage.operatorReviewStatus.demotionApproved'); }, color: 'volcano' },
  blocked: { get label() { return i18next.t('projectEval:acceptancePage.operatorReviewStatus.blocked'); }, color: 'error' },
};

const SYSTEM_DECISION_TONES: Record<string, { label: string; color: string }> = {
  allow: { get label() { return i18next.t('projectEval:acceptancePage.systemDecision.allow'); }, color: 'success' },
  allow_with_disclosure: { get label() { return i18next.t('projectEval:acceptancePage.systemDecision.allowWithDisclosure'); }, color: 'gold' },
  refresh_recommended: { get label() { return i18next.t('projectEval:acceptancePage.systemDecision.refreshRecommended'); }, color: 'warning' },
  promote_review: { get label() { return i18next.t('projectEval:acceptancePage.systemDecision.promoteReview'); }, color: 'cyan' },
  demote_review: { get label() { return i18next.t('projectEval:acceptancePage.systemDecision.demoteReview'); }, color: 'volcano' },
  block: { get label() { return i18next.t('projectEval:acceptancePage.systemDecision.block'); }, color: 'error' },
};

const LANE_REVIEW_REASON_OPTIONS = [
  'fresh_authoritative_evidence',
  'fallback_evidence_requires_disclosure',
  'stale_lane_requires_refresh',
  'promotion_candidate_confirmed',
  'demotion_candidate_confirmed',
  'release_gate_unsuitable',
  'known_gap_requires_operator_override',
  'operator_confidence_check',
] as const;

const REFRESH_CADENCE_OPTIONS: Array<{
  value: ProjectEvalSupportAcceptanceRefreshCadence;
  label: string;
}> = [
  { value: 'manual', get label() { return i18next.t('projectEval:acceptancePage.refreshCadence.manual'); } },
  { value: 'daily', get label() { return i18next.t('projectEval:acceptancePage.refreshCadence.daily'); } },
  { value: 'weekly', get label() { return i18next.t('projectEval:acceptancePage.refreshCadence.weekly'); } },
  { value: 'monthly', get label() { return i18next.t('projectEval:acceptancePage.refreshCadence.monthly'); } },
];

const WORKSPACE_VIEW_VISIBILITY_OPTIONS = [
  { get label() { return i18next.t('projectEval:acceptancePage.workspace.visibilityPrivate'); }, value: 'private' },
  { get label() { return i18next.t('projectEval:acceptancePage.workspace.visibilityOrganization'); }, value: 'organization' },
] as const satisfies readonly {
  label: string;
  value: ProjectEvalSupportAcceptanceWorkspaceViewVisibility;
}[];

const WORKSPACE_SECTIONS = [
  { get label() { return i18next.t('projectEval:acceptancePage.sections.dashboard'); }, value: 'dashboard' },
  { get label() { return i18next.t('projectEval:acceptancePage.sections.laneDashboard'); }, value: 'lane_dashboard' },
  { get label() { return i18next.t('projectEval:acceptancePage.sections.history'); }, value: 'history' },
  { get label() { return i18next.t('projectEval:acceptancePage.sections.reviewQueue'); }, value: 'review_queue' },
  { get label() { return i18next.t('projectEval:acceptancePage.sections.sampleSchedule'); }, value: 'sample_schedule' },
  { get label() { return i18next.t('projectEval:acceptancePage.sections.refreshPolicies'); }, value: 'refresh_policies' },
] as const satisfies readonly {
  label: string;
  value: ProjectEvalSupportAcceptanceWorkspaceSection;
}[];

const DEFAULT_WORKSPACE_COLUMNS = [
  { key: 'lane', get label() { return i18next.t('projectEval:acceptancePage.columns.lane'); }, visible: true, order: 1, width: 310, pinned: 'left' },
  { key: 'latest', get label() { return i18next.t('projectEval:acceptancePage.columns.latestEvidence'); }, visible: true, order: 2, width: 230 },
  { key: 'review', get label() { return i18next.t('projectEval:acceptancePage.columns.review'); }, visible: true, order: 3, width: 210 },
  { key: 'coverage', get label() { return i18next.t('projectEval:acceptancePage.columns.coverage'); }, visible: true, order: 4, width: 280 },
  { key: 'signals', get label() { return i18next.t('projectEval:acceptancePage.columns.signals'); }, visible: true, order: 5, width: 260 },
  { key: 'action', get label() { return i18next.t('projectEval:acceptancePage.columns.action'); }, visible: true, order: 6, width: 250 },
] as const satisfies readonly ProjectEvalSupportAcceptanceWorkspaceColumn[];

const DEFAULT_HISTORY_COLUMNS = [
  { key: 'run', get label() { return i18next.t('projectEval:acceptancePage.columns.runEvidence'); }, visible: true, order: 1, width: 300, pinned: 'left' },
  { key: 'lane', get label() { return i18next.t('projectEval:acceptancePage.columns.lane'); }, visible: true, order: 2, width: 280 },
  { key: 'status', get label() { return i18next.t('projectEval:acceptancePage.columns.status'); }, visible: true, order: 3, width: 220 },
  { key: 'decision', get label() { return i18next.t('projectEval:acceptancePage.columns.decision'); }, visible: true, order: 4, width: 170 },
  { key: 'review', get label() { return i18next.t('projectEval:acceptancePage.columns.review'); }, visible: true, order: 5, width: 210 },
  { key: 'evidence', get label() { return i18next.t('projectEval:acceptancePage.columns.evidence'); }, visible: true, order: 6, width: 300 },
] as const satisfies readonly ProjectEvalSupportAcceptanceWorkspaceColumn[];

const DEFAULT_SAMPLE_SCHEDULE_COLUMNS = [
  { key: 'candidate', get label() { return i18next.t('projectEval:acceptancePage.columns.refreshCandidate'); }, visible: true, order: 1, width: 310, pinned: 'left' },
  { key: 'sample', get label() { return i18next.t('projectEval:acceptancePage.columns.sample'); }, visible: true, order: 2, width: 280 },
  { key: 'options', get label() { return i18next.t('projectEval:acceptancePage.columns.runOptions'); }, visible: true, order: 3, width: 260 },
  { key: 'status', get label() { return i18next.t('projectEval:acceptancePage.columns.status'); }, visible: true, order: 4, width: 230 },
  { key: 'action', get label() { return i18next.t('projectEval:acceptancePage.columns.action'); }, visible: true, order: 5, width: 170 },
] as const satisfies readonly ProjectEvalSupportAcceptanceWorkspaceColumn[];

const DEFAULT_REFRESH_POLICY_COLUMNS = [
  { key: 'policy', get label() { return i18next.t('projectEval:acceptancePage.columns.policy'); }, visible: true, order: 1, width: 280, pinned: 'left' },
  { key: 'cadence', get label() { return i18next.t('projectEval:acceptancePage.columns.cadence'); }, visible: true, order: 2, width: 180 },
  { key: 'controls', get label() { return i18next.t('projectEval:acceptancePage.columns.runControls'); }, visible: true, order: 3, width: 250 },
  { key: 'last', get label() { return i18next.t('projectEval:acceptancePage.columns.lastRun'); }, visible: true, order: 4, width: 240 },
  { key: 'action', get label() { return i18next.t('projectEval:acceptancePage.columns.action'); }, visible: true, order: 5, width: 210 },
] as const satisfies readonly ProjectEvalSupportAcceptanceWorkspaceColumn[];

const DEFAULT_WORKSPACE_TABLE_LAYOUTS = {
  lane_dashboard: DEFAULT_WORKSPACE_COLUMNS,
  history: DEFAULT_HISTORY_COLUMNS,
  sample_schedule: DEFAULT_SAMPLE_SCHEDULE_COLUMNS,
  refresh_policies: DEFAULT_REFRESH_POLICY_COLUMNS,
} as const satisfies Record<
  ProjectEvalSupportAcceptanceWorkspaceTableKey,
  readonly ProjectEvalSupportAcceptanceWorkspaceColumn[]
>;

const WORKSPACE_COLUMN_PIN_OPTIONS = [
  { get label() { return i18next.t('projectEval:acceptancePage.columns.noPin'); }, value: '' },
  { get label() { return i18next.t('projectEval:acceptancePage.columns.pinLeft'); }, value: 'left' },
  { get label() { return i18next.t('projectEval:acceptancePage.columns.pinRight'); }, value: 'right' },
] as const satisfies readonly {
  label: string;
  value: NonNullable<ProjectEvalSupportAcceptanceWorkspaceColumn['pinned']>;
}[];

const DEFAULT_VISIBLE_WORKSPACE_SECTIONS = WORKSPACE_SECTIONS.map((section) => section.value);
const DEFAULT_WORKSPACE_LAYOUT = {
  defaultSection: 'dashboard',
  visibleSections: DEFAULT_VISIBLE_WORKSPACE_SECTIONS,
} as const satisfies {
  defaultSection: ProjectEvalSupportAcceptanceWorkspaceSection;
  visibleSections: readonly ProjectEvalSupportAcceptanceWorkspaceSection[];
};

const ADMIN_ONLY_WORKSPACE_SECTIONS = new Set<ProjectEvalSupportAcceptanceWorkspaceSection>([
  'review_queue',
  'sample_schedule',
  'refresh_policies',
]);

interface SelectOption {
  value: string;
  label: string;
}

interface AcceptanceFilters {
  sourceID?: string;
  runID?: string;
  projectFamily?: string;
  frameworkFamily?: string;
  templateFamily?: string;
  evaluationDepth?: string;
  status?: string;
  freshness?: string;
  maturity?: string;
  decision?: string;
  operatorReviewStatus?: ProjectEvalSupportAcceptanceLaneReviewStatus | string;
  authoritative?: string;
  fallback?: string;
  hasOperatorReview?: string;
  operatorReviewStaleOnly?: boolean;
  reviewDueOnly?: boolean;
}

interface RefreshPolicyDraft {
  id?: string;
  name: string;
  description: string;
  cadence: ProjectEvalSupportAcceptanceRefreshCadence;
  enabled: boolean;
  limit: number;
  includeBlocked: boolean;
  force: boolean;
  autoConfirm: boolean;
  filters: AcceptanceFilters;
}

interface LaneReviewDraft {
  reviewStatus: ProjectEvalSupportAcceptanceLaneReviewStatus;
  reason: string;
  note: string;
}

interface WorkspaceViewDraft {
  id?: string;
  name: string;
  description: string;
  visibility: ProjectEvalSupportAcceptanceWorkspaceViewVisibility;
  isDefault: boolean;
  pinned: boolean;
  operatorMode: AcceptanceOperatorMode;
  defaultSection: ProjectEvalSupportAcceptanceWorkspaceSection;
  visibleSections: ProjectEvalSupportAcceptanceWorkspaceSection[];
  tableLayouts: Record<
    ProjectEvalSupportAcceptanceWorkspaceTableKey,
    ProjectEvalSupportAcceptanceWorkspaceColumn[]
  >;
}

interface SortableColumnPillProps {
  column: ProjectEvalSupportAcceptanceWorkspaceColumn;
  onChange: (patch: Partial<ProjectEvalSupportAcceptanceWorkspaceColumn>) => void;
}

interface WorkspaceTableLayoutState {
  defaultSection: ProjectEvalSupportAcceptanceWorkspaceSection;
  visibleSections: ProjectEvalSupportAcceptanceWorkspaceSection[];
  tableLayouts: Record<
    ProjectEvalSupportAcceptanceWorkspaceTableKey,
    ProjectEvalSupportAcceptanceWorkspaceColumn[]
  >;
}

interface LaneReviewTarget {
  laneKey: string;
  projectFamily: string;
  frameworkFamily: string;
  templateFamily: string;
  latestRecordID?: string;
  latestRunID?: string;
  latestVerifiedAt?: string;
  latestSystemDecision?: string;
  latestStatus?: string;
  latestFreshness?: string;
  latestMaturity?: string;
  latestScore?: number;
  reviewState?: string;
  reviewPriority?: string;
  nextReviewDue?: string;
  validationLanes?: string[];
  evidenceClasses?: string[];
  knownGapCount?: number;
  representativeLabel?: string;
}

type AcceptanceOperatorMode =
  | 'overview'
  | 'triage'
  | 'evidence'
  | 'refresh_control'
  | 'custom';

const WORKSPACE_LAYOUT_EDITORS = [
  {
    key: 'lane_dashboard',
    get title() { return i18next.t('projectEval:acceptancePage.layoutEditors.laneDashboard.title'); },
    get description() { return i18next.t('projectEval:acceptancePage.layoutEditors.laneDashboard.description'); },
  },
  {
    key: 'history',
    get title() { return i18next.t('projectEval:acceptancePage.layoutEditors.history.title'); },
    get description() { return i18next.t('projectEval:acceptancePage.layoutEditors.history.description'); },
  },
  {
    key: 'sample_schedule',
    get title() { return i18next.t('projectEval:acceptancePage.layoutEditors.sampleSchedule.title'); },
    get description() { return i18next.t('projectEval:acceptancePage.layoutEditors.sampleSchedule.description'); },
  },
  {
    key: 'refresh_policies',
    get title() { return i18next.t('projectEval:acceptancePage.layoutEditors.refreshPolicies.title'); },
    get description() { return i18next.t('projectEval:acceptancePage.layoutEditors.refreshPolicies.description'); },
  },
] as const satisfies readonly {
  key: ProjectEvalSupportAcceptanceWorkspaceTableKey;
  title: string;
  description: string;
}[];

const OPERATOR_MODE_OPTIONS = [
  {
    key: 'overview',
    get label() { return i18next.t('projectEval:acceptancePage.operatorModes.overview.label'); },
    get description() { return i18next.t('projectEval:acceptancePage.operatorModes.overview.description'); },
    sections: ['dashboard', 'lane_dashboard', 'history'],
  },
  {
    key: 'triage',
    get label() { return i18next.t('projectEval:acceptancePage.operatorModes.triage.label'); },
    get description() { return i18next.t('projectEval:acceptancePage.operatorModes.triage.description'); },
    sections: ['dashboard', 'review_queue', 'history'],
  },
  {
    key: 'evidence',
    get label() { return i18next.t('projectEval:acceptancePage.operatorModes.evidence.label'); },
    get description() { return i18next.t('projectEval:acceptancePage.operatorModes.evidence.description'); },
    sections: ['lane_dashboard', 'history'],
  },
  {
    key: 'refresh_control',
    get label() { return i18next.t('projectEval:acceptancePage.operatorModes.refreshControl.label'); },
    get description() { return i18next.t('projectEval:acceptancePage.operatorModes.refreshControl.description'); },
    sections: ['dashboard', 'sample_schedule', 'refresh_policies'],
  },
] as const satisfies readonly {
  key: AcceptanceOperatorMode;
  label: string;
  description: string;
  sections: readonly ProjectEvalSupportAcceptanceWorkspaceSection[];
}[];

const BUILTIN_WORKSPACE_OPERATOR_MODE_BY_ID: Partial<Record<string, AcceptanceOperatorMode>> = {
  'builtin:acceptance_review_due': 'triage',
  'builtin:acceptance_stale_lanes': 'overview',
  'builtin:acceptance_fallback_evidence': 'evidence',
  'builtin:acceptance_release_gate': 'refresh_control',
};

function toneFor(
  value: string | undefined,
  tones: Record<string, { label: string; color: string }>
) {
  return value
    ? (tones[value] ?? { label: humanizeKey(value), color: 'default' })
    : { label: '-', color: 'default' };
}

function boolFilterValue(value?: string): boolean | undefined {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return undefined;
}

function countRate(value: number | undefined, total: number | undefined): string {
  if (!value || !total) {
    return '0%';
  }
  return `${Math.round((value / total) * 100)}%`;
}

const FILTER_LABEL_KEYS: Record<keyof AcceptanceFilters, string> = {
  sourceID: 'sourceId',
  runID: 'runId',
  projectFamily: 'projectFamily',
  frameworkFamily: 'frameworkFamily',
  templateFamily: 'templateFamily',
  evaluationDepth: 'depth',
  status: 'status',
  freshness: 'freshness',
  maturity: 'maturity',
  decision: 'decision',
  operatorReviewStatus: 'operatorReview',
  authoritative: 'authority',
  fallback: 'fallback',
  hasOperatorReview: 'reviewPresence',
  operatorReviewStaleOnly: 'operatorReviewStaleOnly',
  reviewDueOnly: 'reviewDueOnly',
};

const VALUE_LABEL_KEYS: Record<string, string> = {
  accepted: 'status.accepted',
  provisional: 'status.provisional',
  exploratory: 'status.exploratory',
  fresh: 'freshness.fresh',
  aging: 'freshness.aging',
  stale: 'freshness.stale',
  unknown: 'freshness.unknown',
  stable: 'maturity.stable',
  beta: 'maturity.beta',
  experimental: 'maturity.experimental',
  pass: 'decision.pass',
  warn: 'decision.warn',
  block: 'decision.block',
};

function acceptanceText(key: string, options?: Record<string, unknown>): string {
  return i18next.t(`projectEval:acceptancePage.${key}`, options);
}

function acceptanceValueLabel(value?: string): string {
  if (!value) {
    return '-';
  }
  const key = VALUE_LABEL_KEYS[value];
  return key ? acceptanceText(key) : humanizeKey(value);
}

function filterKeyLabel(key: string): string {
  const labelKey = FILTER_LABEL_KEYS[key as keyof AcceptanceFilters];
  return labelKey ? acceptanceText(`filters.${labelKey}`) : humanizeKey(key);
}

function getWorkspaceSectionLabel(section?: string): string {
  if (!section) {
    return '';
  }
  return WORKSPACE_SECTIONS.find((item) => item.value === section)?.label || humanizeKey(section);
}

function getOperatorModeLabel(mode: AcceptanceOperatorMode): string {
  return OPERATOR_MODE_OPTIONS.find((item) => item.key === mode)?.label || acceptanceText('workspace.customMode');
}

function normalizeAcceptanceFilterSet(filters: AcceptanceFilters): AcceptanceFilters {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) => value !== undefined && value !== '')
  ) as AcceptanceFilters;
}

function pickPolicyFilters(filters: AcceptanceFilters): AcceptanceFilters {
  return normalizeAcceptanceFilterSet({
    projectFamily: filters.projectFamily,
    frameworkFamily: filters.frameworkFamily,
    templateFamily: filters.templateFamily,
    evaluationDepth: filters.evaluationDepth,
    status: filters.status,
    freshness: filters.freshness,
    maturity: filters.maturity,
    operatorReviewStatus: filters.operatorReviewStatus,
    hasOperatorReview: filters.hasOperatorReview,
    operatorReviewStaleOnly: filters.operatorReviewStaleOnly,
  });
}

function reviewStatusOptions() {
  return Object.entries(OPERATOR_REVIEW_STATUS_TONES).map(([value, tone]) => ({
    value,
    label: tone.label,
  }));
}

function laneReviewReasonOptions() {
  return LANE_REVIEW_REASON_OPTIONS.map((value) => ({
    value,
    label: acceptanceText(`reviewReasons.${value}`),
  }));
}

function compactTags(values?: string[], max = 3): ReactNode {
  if (!values || values.length === 0) {
    return <Text type="secondary">-</Text>;
  }
  const visible = values.slice(0, max);
  const rest = values.length - visible.length;
  return (
    <Space size={[4, 4]} wrap>
      {visible.map((value) => (
        <Tag key={value}>{humanizeKey(value)}</Tag>
      ))}
      {rest > 0 && <Tag>+{rest}</Tag>}
    </Space>
  );
}

function systemDecisionTag(decision?: string): ReactNode {
  const tone = toneFor(decision, SYSTEM_DECISION_TONES);
  return <Tag color={tone.color}>{tone.label}</Tag>;
}

function operatorReviewSummaryBlock(
  review?: ProjectEvalSupportAcceptanceOperatorReviewSummary,
  emptyText = acceptanceText('empty.noOperatorReviewYet')
): ReactNode {
  if (!review) {
    return <Text type="secondary">{emptyText}</Text>;
  }
  const status = toneFor(review.review_status, OPERATOR_REVIEW_STATUS_TONES);
  return (
    <Space direction="vertical" size={4}>
      <Space size={[4, 4]} wrap>
        <Tag color={status.color}>{status.label}</Tag>
        {review.stale && (
          <Tag color="volcano" icon={<WarningOutlined />}>
            {acceptanceText('tags.stale')}
          </Tag>
        )}
      </Space>
      <Text>{review.reason}</Text>
      {review.note ? <Text type="secondary">{review.note}</Text> : null}
      <Text type="secondary">
        {review.updated_by} · {formatDateTime(review.updated_at)}
      </Text>
    </Space>
  );
}

function buildLaneReviewTargetFromLane(
  record: ProjectEvalSupportAcceptanceLaneSummary
): LaneReviewTarget {
  return {
    laneKey: record.lane_key,
    projectFamily: record.project_family,
    frameworkFamily: record.framework_family,
    templateFamily: record.template_family,
    latestRecordID: record.latest_record_id,
    latestRunID: record.latest_run_id,
    latestVerifiedAt: record.last_verified_at,
    latestSystemDecision: record.decision?.decision || record.latest_decision,
    latestStatus: record.latest_status,
    latestFreshness: record.latest_freshness,
    latestMaturity: record.latest_maturity,
    latestScore: record.latest_score,
    reviewState: record.review_state,
    reviewPriority: record.review_priority,
    nextReviewDue: record.next_review_due,
    validationLanes: record.validation_lanes,
    evidenceClasses: record.evidence_classes,
    knownGapCount: record.known_gap_count,
    representativeLabel: humanizeKey(record.framework_family),
  };
}

function buildLaneReviewTargetFromHistory(
  record: ProjectEvalSupportAcceptanceHistoryItem
): LaneReviewTarget {
  return {
    laneKey: record.lane_key,
    projectFamily: record.project_family,
    frameworkFamily: record.framework_family,
    templateFamily: record.template_family,
    latestRecordID: record.id,
    latestRunID: record.run_id,
    latestVerifiedAt: record.last_verified_at || record.verified_at,
    latestSystemDecision: record.decision,
    latestStatus: record.status,
    latestFreshness: record.freshness,
    latestMaturity: record.maturity,
    latestScore: record.score,
    reviewState: record.review_state,
    reviewPriority: record.review_priority,
    nextReviewDue: record.next_review_due,
    validationLanes: record.validation_lanes,
    evidenceClasses: record.evidence_classes,
    knownGapCount: record.known_gaps?.length,
    representativeLabel: record.sample_name || record.run_id,
  };
}

function buildLaneReviewDraft(review?: ProjectEvalSupportAcceptanceOperatorReviewSummary): LaneReviewDraft {
  return {
    reviewStatus: review?.review_status || 'confirmed',
    reason: review?.reason || '',
    note: review?.note || '',
  };
}

function distributionTags(values?: Record<string, number>): ReactNode {
  const entries = Object.entries(values ?? {}).filter(([, count]) => count > 0);
  if (entries.length === 0) {
    return <Text type="secondary">-</Text>;
  }
  return (
    <Space size={[4, 4]} wrap>
      {entries.map(([name, count]) => (
        <Tag key={name}>
          {humanizeKey(name)}: {count}
        </Tag>
      ))}
    </Space>
  );
}

function buildDashboardParams(
  filters: AcceptanceFilters
): ProjectEvalSupportAcceptanceDashboardParams {
  return {
    project_family: filters.projectFamily,
    framework_family: filters.frameworkFamily,
    template_family: filters.templateFamily,
    evaluation_depth: filters.evaluationDepth,
    status: filters.status,
    freshness: filters.freshness,
    maturity: filters.maturity,
    operator_review_status: filters.operatorReviewStatus,
    has_operator_review: boolFilterValue(filters.hasOperatorReview),
    operator_review_stale_only: filters.operatorReviewStaleOnly,
    limit: DASHBOARD_SCAN_LIMIT,
  };
}

function buildHistoryParams(
  filters: AcceptanceFilters,
  page: number
): ProjectEvalSupportAcceptanceHistoryParams {
  return {
    ...buildDashboardParams(filters),
    source_id: filters.sourceID,
    run_id: filters.runID,
    decision: filters.decision,
    operator_review_status: filters.operatorReviewStatus,
    authoritative_truth: boolFilterValue(filters.authoritative),
    legacy_fallback_used: boolFilterValue(filters.fallback),
    has_operator_review: boolFilterValue(filters.hasOperatorReview),
    operator_review_stale_only: filters.operatorReviewStaleOnly,
    review_due_only: filters.reviewDueOnly,
    page,
    page_size: HISTORY_PAGE_SIZE,
    order_by: 'verified_at',
    order_dir: 'desc',
  };
}

function buildReviewQueueParams(
  filters: AcceptanceFilters
): ProjectEvalSupportAcceptanceReviewQueueParams {
  return {
    project_family: filters.projectFamily,
    framework_family: filters.frameworkFamily,
    template_family: filters.templateFamily,
    evaluation_depth: filters.evaluationDepth,
    status: filters.status,
    freshness: filters.freshness,
    maturity: filters.maturity,
    operator_review_status: filters.operatorReviewStatus,
    has_operator_review: boolFilterValue(filters.hasOperatorReview),
    operator_review_stale_only: filters.operatorReviewStaleOnly,
    page: 1,
    page_size: 8,
  };
}

function buildSampleScheduleParams(
  filters: AcceptanceFilters,
  includeBlocked: boolean,
  force: boolean
): ProjectEvalSupportAcceptanceSampleScheduleParams {
  return {
    ...buildDashboardParams(filters),
    operator_review_status: filters.operatorReviewStatus,
    has_operator_review: boolFilterValue(filters.hasOperatorReview),
    operator_review_stale_only: filters.operatorReviewStaleOnly,
    limit: SAMPLE_SCHEDULE_LIMIT,
    include_blocked: includeBlocked,
    force,
    mode: 'strict',
    scope: 'full',
    report_variant: 'evidence',
    report_variants: 'evidence,technical,summary',
  };
}

function buildSampleScheduleRequest(
  filters: AcceptanceFilters,
  includeBlocked: boolean,
  force: boolean,
  autoConfirm: boolean
) {
  return {
    project_family: filters.projectFamily,
    framework_family: filters.frameworkFamily,
    template_family: filters.templateFamily,
    evaluation_depth: filters.evaluationDepth,
    status: filters.status,
    freshness: filters.freshness,
    maturity: filters.maturity,
    operator_review_status: filters.operatorReviewStatus,
    has_operator_review: boolFilterValue(filters.hasOperatorReview),
    operator_review_stale_only: filters.operatorReviewStaleOnly,
    limit: SAMPLE_SCHEDULE_LIMIT,
    include_blocked: includeBlocked,
    force,
    auto_confirm: autoConfirm,
    mode: 'strict' as const,
    scope: 'full' as const,
    report_variant: 'evidence',
    report_variants: ['evidence', 'technical', 'summary'],
  };
}

function buildRefreshPolicyDraft(filters: AcceptanceFilters): RefreshPolicyDraft {
  return {
    name: '',
    description: '',
    cadence: 'weekly',
    enabled: true,
    limit: SAMPLE_SCHEDULE_LIMIT,
    includeBlocked: true,
    force: false,
    autoConfirm: false,
    filters: pickPolicyFilters(filters),
  };
}

function workspaceTableDefaults(
  table: ProjectEvalSupportAcceptanceWorkspaceTableKey
): readonly ProjectEvalSupportAcceptanceWorkspaceColumn[] {
  return DEFAULT_WORKSPACE_TABLE_LAYOUTS[table];
}

function getWorkspaceOperatorMode(
  view?:
    | Pick<ProjectEvalSupportAcceptanceWorkspaceView, 'id' | 'metadata'>
    | { id?: string; metadata?: Record<string, unknown> }
): AcceptanceOperatorMode {
  const mode = view?.metadata?.operator_mode;
  if (
    typeof mode === 'string' &&
    OPERATOR_MODE_OPTIONS.some((option) => option.key === mode)
  ) {
    return mode as AcceptanceOperatorMode;
  }
  if (view?.id && BUILTIN_WORKSPACE_OPERATOR_MODE_BY_ID[view.id]) {
    return BUILTIN_WORKSPACE_OPERATOR_MODE_BY_ID[view.id] as AcceptanceOperatorMode;
  }
  return 'custom';
}

function getOperatorModeSections(
  mode: AcceptanceOperatorMode,
  admin: boolean
): ProjectEvalSupportAcceptanceWorkspaceSection[] | undefined {
  const preset = OPERATOR_MODE_OPTIONS.find((option) => option.key === mode);
  if (!preset) {
    return undefined;
  }
  return normalizeAvailableWorkspaceSections([...preset.sections], admin);
}

function normalizeWorkspaceColumns(
  table: ProjectEvalSupportAcceptanceWorkspaceTableKey,
  values?: readonly ProjectEvalSupportAcceptanceWorkspaceColumn[]
): ProjectEvalSupportAcceptanceWorkspaceColumn[] {
  const defaults = new Map<string, ProjectEvalSupportAcceptanceWorkspaceColumn>(
    workspaceTableDefaults(table).map((column) => [column.key, { ...column }])
  );
  const seen = new Set<string>();
  const out: ProjectEvalSupportAcceptanceWorkspaceColumn[] = [];
  for (const value of values ?? []) {
    const defaultColumn = defaults.get(value.key);
    if (!defaultColumn || seen.has(value.key)) {
      continue;
    }
    seen.add(value.key);
    const width = Math.min(Math.max(value.width ?? defaultColumn.width ?? 180, 120), 640);
    out.push({
      ...defaultColumn,
      ...value,
      label: value.label?.trim() || defaultColumn.label,
      visible: value.visible,
      width,
      pinned: value.pinned === 'left' || value.pinned === 'right' ? value.pinned : '',
    });
  }
  for (const defaultColumn of workspaceTableDefaults(table)) {
    if (!seen.has(defaultColumn.key)) {
      out.push({ ...defaultColumn });
    }
  }
  out.sort((left, right) => {
    const leftOrder = left.order ?? defaults.get(left.key)?.order ?? 0;
    const rightOrder = right.order ?? defaults.get(right.key)?.order ?? 0;
    return leftOrder - rightOrder;
  });
  const normalized = out.map((column, index) => ({ ...column, order: index + 1 }));
  if (!normalized.some((column) => column.visible)) {
    const fallbackKey =
      table === 'history'
        ? 'run'
        : table === 'sample_schedule'
          ? 'candidate'
          : table === 'refresh_policies'
            ? 'policy'
            : 'lane';
    return normalized.map((column) =>
      column.key === fallbackKey ? { ...column, visible: true } : column
    );
  }
  return normalized;
}

function normalizeWorkspaceTableLayouts(
  tableLayouts?: Partial<
    Record<ProjectEvalSupportAcceptanceWorkspaceTableKey, ProjectEvalSupportAcceptanceWorkspaceColumn[]>
  >,
  legacyColumns?: readonly ProjectEvalSupportAcceptanceWorkspaceColumn[]
): Record<ProjectEvalSupportAcceptanceWorkspaceTableKey, ProjectEvalSupportAcceptanceWorkspaceColumn[]> {
  return {
    lane_dashboard: normalizeWorkspaceColumns(
      'lane_dashboard',
      tableLayouts?.lane_dashboard ?? legacyColumns
    ),
    history: normalizeWorkspaceColumns('history', tableLayouts?.history),
    sample_schedule: normalizeWorkspaceColumns(
      'sample_schedule',
      tableLayouts?.sample_schedule
    ),
    refresh_policies: normalizeWorkspaceColumns(
      'refresh_policies',
      tableLayouts?.refresh_policies
    ),
  };
}

function createDefaultWorkspaceViewDraft(
  admin: boolean,
  activeView?: ProjectEvalSupportAcceptanceWorkspaceView
): WorkspaceViewDraft {
  const workspace = normalizeWorkspaceState(activeView?.workspace);
  const visibleSections = normalizeAvailableWorkspaceSections(workspace.visibleSections, admin);
  const defaultSection = visibleSections.includes(workspace.defaultSection)
    ? workspace.defaultSection
    : visibleSections[0];
  return {
    name: activeView && !activeView.builtin
      ? acceptanceText('workspace.copyName', { name: activeView.name })
      : '',
    description: activeView?.description ?? '',
    visibility: admin ? 'organization' : 'private',
    isDefault: false,
    pinned: true,
    operatorMode: getWorkspaceOperatorMode(activeView),
    defaultSection,
    visibleSections: [...visibleSections],
    tableLayouts: workspace.tableLayouts,
  };
}

function normalizeWorkspaceSections(
  values?: readonly string[]
): ProjectEvalSupportAcceptanceWorkspaceSection[] {
  const allowed = new Set(WORKSPACE_SECTIONS.map((section) => section.value));
  const out: ProjectEvalSupportAcceptanceWorkspaceSection[] = [];
  for (const value of values ?? []) {
    if (!allowed.has(value as ProjectEvalSupportAcceptanceWorkspaceSection)) {
      continue;
    }
    const section = value as ProjectEvalSupportAcceptanceWorkspaceSection;
    if (!out.includes(section)) {
      out.push(section);
    }
  }
  return out.length > 0 ? out : [...DEFAULT_VISIBLE_WORKSPACE_SECTIONS];
}

function normalizeWorkspaceState(
  workspace?: ProjectEvalSupportAcceptanceWorkspaceState
): WorkspaceTableLayoutState {
  const visibleSections = normalizeWorkspaceSections(workspace?.visible_sections);
  const requestedDefault = workspace?.default_section;
  const defaultSection =
    requestedDefault && visibleSections.includes(requestedDefault)
      ? requestedDefault
      : visibleSections[0] || DEFAULT_WORKSPACE_LAYOUT.defaultSection;
  return {
    defaultSection,
    visibleSections,
    tableLayouts: normalizeWorkspaceTableLayouts(workspace?.table_layouts, workspace?.columns),
  };
}

function isWorkspaceSectionAvailable(
  section: ProjectEvalSupportAcceptanceWorkspaceSection,
  admin: boolean
): boolean {
  return admin || !ADMIN_ONLY_WORKSPACE_SECTIONS.has(section);
}

function fallbackWorkspaceSections(
  admin: boolean
): ProjectEvalSupportAcceptanceWorkspaceSection[] {
  return DEFAULT_WORKSPACE_LAYOUT.visibleSections.filter((section) =>
    isWorkspaceSectionAvailable(section, admin)
  );
}

function normalizeAvailableWorkspaceSections(
  values: readonly string[] | undefined,
  admin: boolean
): ProjectEvalSupportAcceptanceWorkspaceSection[] {
  const sections = normalizeWorkspaceSections(values).filter((section) =>
    isWorkspaceSectionAvailable(section, admin)
  );
  return sections.length > 0 ? sections : fallbackWorkspaceSections(admin);
}

function buildWorkspaceFiltersFromPageFilters(
  filters: AcceptanceFilters
): ProjectEvalSupportAcceptanceWorkspaceFilters {
  return {
    source_id: filters.sourceID,
    run_id: filters.runID,
    project_family: filters.projectFamily,
    framework_family: filters.frameworkFamily,
    template_family: filters.templateFamily,
    evaluation_depth: filters.evaluationDepth,
    status: filters.status,
    freshness: filters.freshness,
    maturity: filters.maturity,
    decision: filters.decision,
    operator_review_status: filters.operatorReviewStatus,
    authoritative_truth: boolFilterValue(filters.authoritative),
    legacy_fallback_used: boolFilterValue(filters.fallback),
    has_operator_review: boolFilterValue(filters.hasOperatorReview),
    operator_review_stale_only: filters.operatorReviewStaleOnly,
    review_due_only: filters.reviewDueOnly,
    order_by: 'verified_at',
    order_dir: 'desc',
  };
}

function pageFiltersFromWorkspaceFilters(
  filters?: ProjectEvalSupportAcceptanceWorkspaceFilters
): AcceptanceFilters {
  if (!filters) {
    return {};
  }
  return {
    sourceID: filters.source_id,
    runID: filters.run_id,
    projectFamily: filters.project_family,
    frameworkFamily: filters.framework_family,
    templateFamily: filters.template_family,
    evaluationDepth: filters.evaluation_depth,
    status: filters.status,
    freshness: filters.freshness,
    maturity: filters.maturity,
    decision: filters.decision,
    operatorReviewStatus: filters.operator_review_status,
    authoritative:
      typeof filters.authoritative_truth === 'boolean'
        ? String(filters.authoritative_truth)
        : undefined,
    fallback:
      typeof filters.legacy_fallback_used === 'boolean'
        ? String(filters.legacy_fallback_used)
        : undefined,
    hasOperatorReview:
      typeof filters.has_operator_review === 'boolean'
        ? String(filters.has_operator_review)
        : undefined,
    operatorReviewStaleOnly: filters.operator_review_stale_only || undefined,
    reviewDueOnly: filters.review_due_only || undefined,
  };
}

function buildWorkspaceState(
  includeBlocked: boolean,
  force: boolean,
  autoConfirm: boolean,
  defaultSection: ProjectEvalSupportAcceptanceWorkspaceSection,
  visibleSections: readonly ProjectEvalSupportAcceptanceWorkspaceSection[],
  tableLayouts: Partial<
    Record<ProjectEvalSupportAcceptanceWorkspaceTableKey, ProjectEvalSupportAcceptanceWorkspaceColumn[]>
  >,
  base?: ProjectEvalSupportAcceptanceWorkspaceState
): ProjectEvalSupportAcceptanceWorkspaceState {
  const normalizedVisibleSections = normalizeWorkspaceSections(visibleSections);
  const normalizedDefaultSection = normalizedVisibleSections.includes(defaultSection)
    ? defaultSection
    : normalizedVisibleSections[0] || DEFAULT_WORKSPACE_LAYOUT.defaultSection;
  const normalizedTableLayouts = normalizeWorkspaceTableLayouts(tableLayouts, base?.columns);
  return {
    ...base,
    default_section: normalizedDefaultSection,
    visible_sections: normalizedVisibleSections,
    dashboard_limit: DASHBOARD_SCAN_LIMIT,
    history_page_size: HISTORY_PAGE_SIZE,
    sample_schedule: {
      ...base?.sample_schedule,
      limit: base?.sample_schedule?.limit || SAMPLE_SCHEDULE_LIMIT,
      include_blocked: includeBlocked,
      force,
      auto_confirm: autoConfirm,
    },
    columns: normalizedTableLayouts.lane_dashboard,
    table_layouts: normalizedTableLayouts,
  };
}

function getWorkspaceViewVisibilityLabel(visibility?: string): string {
  if (visibility === 'organization') {
    return acceptanceText('workspace.visibilityOrgShort');
  }
  return acceptanceText('workspace.visibilityPrivateShort');
}

function getWorkspaceViewSummary(view: ProjectEvalSupportAcceptanceWorkspaceView): string {
  if (view.description?.trim()) {
    return view.description.trim();
  }
  const filters = view.filters || {};
  const parts = [
    filters.review_due_only ? acceptanceText('workspace.summary.reviewDue') : '',
    filters.freshness
      ? acceptanceText('workspace.summary.freshness', {
          value: acceptanceValueLabel(filters.freshness),
        })
      : '',
    filters.status
      ? acceptanceText('workspace.summary.status', { value: acceptanceValueLabel(filters.status) })
      : '',
    filters.maturity
      ? acceptanceText('workspace.summary.maturity', {
          value: acceptanceValueLabel(filters.maturity),
        })
      : '',
    filters.operator_review_status
      ? acceptanceText('workspace.summary.operator', {
          value: toneFor(filters.operator_review_status, OPERATOR_REVIEW_STATUS_TONES).label,
        })
      : '',
    filters.operator_review_stale_only ? acceptanceText('workspace.summary.operatorReviewStale') : '',
    filters.project_family ? humanizeKey(filters.project_family) : '',
    filters.framework_family ? humanizeKey(filters.framework_family) : '',
    filters.evaluation_depth
      ? acceptanceText('workspace.summary.depth', { value: humanizeKey(filters.evaluation_depth) })
      : '',
    typeof filters.has_operator_review === 'boolean'
      ? filters.has_operator_review
        ? acceptanceText('workspace.summary.withOperatorReview')
        : acceptanceText('workspace.summary.withoutOperatorReview')
      : '',
    filters.legacy_fallback_used ? acceptanceText('workspace.summary.fallbackEvidence') : '',
    filters.authoritative_truth ? acceptanceText('workspace.summary.authoritativeEvidence') : '',
  ].filter(Boolean);
  const defaultSection = view.workspace?.default_section
    ? acceptanceText('workspace.summary.opensSection', {
        section: getWorkspaceSectionLabel(view.workspace.default_section),
      })
    : '';
  return [...parts, defaultSection].filter(Boolean).join(' · ') || acceptanceText('workspace.summary.allSupportLanes');
}

function refreshPolicyDraftFromPolicy(
  policy: ProjectEvalSupportAcceptanceRefreshPolicy
): RefreshPolicyDraft {
  return {
    id: policy.id,
    name: policy.name,
    description: policy.description ?? '',
    cadence: policy.cadence,
    enabled: policy.enabled,
    limit: policy.schedule.limit || SAMPLE_SCHEDULE_LIMIT,
    includeBlocked: policy.schedule.include_blocked,
    force: policy.schedule.force,
    autoConfirm: policy.schedule.auto_confirm,
    filters: {
      projectFamily: policy.schedule.project_family,
      frameworkFamily: policy.schedule.framework_family,
      templateFamily: policy.schedule.template_family,
      evaluationDepth: policy.schedule.evaluation_depth,
      status: policy.schedule.status,
      freshness: policy.schedule.freshness,
      maturity: policy.schedule.maturity,
      operatorReviewStatus: policy.schedule.operator_review_status,
      hasOperatorReview:
        typeof policy.schedule.has_operator_review === 'boolean'
          ? String(policy.schedule.has_operator_review)
          : undefined,
      operatorReviewStaleOnly: policy.schedule.operator_review_stale_only || undefined,
    },
  };
}

function buildRefreshPolicyRequest(
  draft: RefreshPolicyDraft
): UpsertSupportAcceptanceRefreshPolicyRequest {
  return {
    name: draft.name.trim(),
    description: draft.description.trim() || undefined,
    enabled: draft.enabled,
    cadence: draft.cadence,
    project_family: draft.filters.projectFamily,
    framework_family: draft.filters.frameworkFamily,
    template_family: draft.filters.templateFamily,
    evaluation_depth: draft.filters.evaluationDepth,
    status: draft.filters.status,
    freshness: draft.filters.freshness,
    maturity: draft.filters.maturity,
    operator_review_status: draft.filters.operatorReviewStatus,
    has_operator_review: boolFilterValue(draft.filters.hasOperatorReview),
    operator_review_stale_only: draft.filters.operatorReviewStaleOnly,
    limit: draft.limit,
    include_blocked: draft.includeBlocked,
    force: draft.force,
    auto_confirm: draft.autoConfirm,
    mode: 'strict',
    scope: 'full',
    report_variant: 'evidence',
    report_variants: ['evidence', 'technical', 'summary'],
  };
}

function getErrorMessage(error: unknown, fallback: string): string {
  const response = (error as { response?: { data?: { message?: string } }; message?: string })
    ?.response;
  return response?.data?.message || (error as { message?: string })?.message || fallback;
}

function sampleScheduleRowKey(record: ProjectEvalSupportAcceptanceSampleScheduleCandidate): string {
  return `${record.lane_key}:${record.source_id || record.latest_record_id || record.sample.sample_id}`;
}

function toSelectOptions(
  values: string[],
  labelForValue: (value: string) => string = humanizeKey
): SelectOption[] {
  return values.map((value) => ({ value, label: labelForValue(value) }));
}

function unique(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort();
}

function filterSummaryTags(filters: AcceptanceFilters): ReactNode {
  const normalized = normalizeAcceptanceFilterSet(filters);
  const entries = Object.entries(normalized);
  if (entries.length === 0) {
    return <Tag>{acceptanceText('filterSummary.allLanes')}</Tag>;
  }
  return (
    <Space size={[4, 4]} wrap>
      {entries.map(([key, value]) => {
        let label = humanizeKey(String(value));
        if (key === 'operatorReviewStatus') {
          label = toneFor(String(value), OPERATOR_REVIEW_STATUS_TONES).label;
        }
        if (key === 'hasOperatorReview') {
          label = value === 'true'
            ? acceptanceText('filterSummary.withReview')
            : acceptanceText('filterSummary.withoutReview');
        }
        if (
          typeof value === 'boolean' &&
          (key === 'reviewDueOnly' || key === 'operatorReviewStaleOnly')
        ) {
          label = acceptanceText('filterSummary.only');
        }
        return (
          <Tag key={key}>
            {filterKeyLabel(key)}: {label}
          </Tag>
        );
      })}
    </Space>
  );
}

function SortableColumnPill({ column, onChange }: SortableColumnPillProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: column.key,
  });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.72 : 1,
    border: '1px solid #d9d9d9',
    borderRadius: 10,
    padding: 12,
    background: '#fff',
  };

  return (
    <div ref={setNodeRef} style={style}>
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        <Space wrap align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space size={8}>
            <Button
              size="small"
              icon={<DragOutlined />}
              aria-label={acceptanceText('columns.reorder', { label: column.label || column.key })}
              {...attributes}
              {...listeners}
            />
            <Text strong>{column.label || humanizeKey(column.key)}</Text>
          </Space>
          <Checkbox
            checked={column.visible}
            onChange={(event) => onChange({ visible: event.target.checked })}
          >
            {acceptanceText('columns.visible')}
          </Checkbox>
        </Space>
        <Row gutter={[8, 8]}>
          <Col xs={24} sm={12}>
            <Select<NonNullable<ProjectEvalSupportAcceptanceWorkspaceColumn['pinned']>>
              size="small"
              value={column.pinned ?? ''}
              options={WORKSPACE_COLUMN_PIN_OPTIONS.map((option) => ({ ...option }))}
              style={{ width: '100%' }}
              onChange={(value) => onChange({ pinned: value })}
            />
          </Col>
          <Col xs={24} sm={12}>
            <InputNumber
              size="small"
              min={120}
              max={640}
              step={10}
              value={column.width}
              addonAfter="px"
              style={{ width: '100%' }}
              onChange={(value) => onChange({ width: value ?? undefined })}
            />
          </Col>
        </Row>
      </Space>
    </div>
  );
}

export default function ProjectEvalAcceptancePage() {
  const navigate = useNavigate();
  const { t } = useTranslation('projectEval');
  const tokens = useThemeTokens();
  const admin = useMemo(() => isPersistedOrgAdmin(), []);
  const columnSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );
  const [capabilities, setCapabilities] = useState<ProjectEvalCapabilities | null>(null);
  const [dashboard, setDashboard] = useState<ProjectEvalSupportAcceptanceDashboard | null>(null);
  const [history, setHistory] = useState<ProjectEvalSupportAcceptanceHistoryResponse | null>(null);
  const [reviewQueue, setReviewQueue] =
    useState<ProjectEvalSupportAcceptanceReviewQueueResponse | null>(null);
  const [sampleSchedule, setSampleSchedule] =
    useState<ProjectEvalSupportAcceptanceSampleSchedule | null>(null);
  const [refreshPolicies, setRefreshPolicies] =
    useState<ProjectEvalSupportAcceptanceRefreshPolicyListResponse | null>(null);
  const [workspaceViews, setWorkspaceViews] = useState<
    ProjectEvalSupportAcceptanceWorkspaceView[]
  >([]);
  const [workspaceViewsError, setWorkspaceViewsError] = useState<string | null>(null);
  const [activeWorkspaceViewID, setActiveWorkspaceViewID] = useState<string>();
  const [defaultWorkspaceViewID, setDefaultWorkspaceViewID] = useState<string>();
  const [workspaceViewModalOpen, setWorkspaceViewModalOpen] = useState(false);
  const [workspaceViewDraft, setWorkspaceViewDraft] = useState<WorkspaceViewDraft>(() =>
    createDefaultWorkspaceViewDraft(false)
  );
  const [loadingDashboard, setLoadingDashboard] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [loadingReviewQueue, setLoadingReviewQueue] = useState(false);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [loadingRefreshPolicies, setLoadingRefreshPolicies] = useState(false);
  const [loadingWorkspaceViews, setLoadingWorkspaceViews] = useState(true);
  const [schedulingSamples, setSchedulingSamples] = useState(false);
  const [savingRefreshPolicy, setSavingRefreshPolicy] = useState(false);
  const [savingWorkspaceView, setSavingWorkspaceView] = useState(false);
  const [triggeringRefreshPolicyId, setTriggeringRefreshPolicyId] = useState<string>();
  const [runningDueRefreshPolicies, setRunningDueRefreshPolicies] = useState(false);
  const [laneReviewDrawerOpen, setLaneReviewDrawerOpen] = useState(false);
  const [selectedLaneReviewTarget, setSelectedLaneReviewTarget] = useState<LaneReviewTarget>();
  const [selectedLaneReviewSummary, setSelectedLaneReviewSummary] =
    useState<ProjectEvalSupportAcceptanceOperatorReviewSummary>();
  const [selectedLaneReview, setSelectedLaneReview] =
    useState<ProjectEvalSupportAcceptanceLaneReview | null>(null);
  const [laneReviewDraft, setLaneReviewDraft] = useState<LaneReviewDraft>(() =>
    buildLaneReviewDraft()
  );
  const [laneReviewAudits, setLaneReviewAudits] =
    useState<ProjectEvalSupportAcceptanceLaneReviewAuditListResponse | null>(null);
  const [loadingLaneReview, setLoadingLaneReview] = useState(false);
  const [loadingLaneReviewAudits, setLoadingLaneReviewAudits] = useState(false);
  const [savingLaneReview, setSavingLaneReview] = useState(false);
  const [includeBlockedSamples, setIncludeBlockedSamples] = useState(true);
  const [forceSampleRefresh, setForceSampleRefresh] = useState(false);
  const [autoConfirmSamples, setAutoConfirmSamples] = useState(false);
  const [workspaceLayout, setWorkspaceLayout] = useState<{
    defaultSection: ProjectEvalSupportAcceptanceWorkspaceSection;
    visibleSections: ProjectEvalSupportAcceptanceWorkspaceSection[];
    tableLayouts: Record<
      ProjectEvalSupportAcceptanceWorkspaceTableKey,
      ProjectEvalSupportAcceptanceWorkspaceColumn[]
    >;
  }>(() => ({
    defaultSection: DEFAULT_WORKSPACE_LAYOUT.defaultSection,
    visibleSections: [...DEFAULT_WORKSPACE_LAYOUT.visibleSections],
    tableLayouts: normalizeWorkspaceTableLayouts(),
  }));
  const [refreshPolicyDraft, setRefreshPolicyDraft] = useState<RefreshPolicyDraft>(() =>
    buildRefreshPolicyDraft({})
  );
  const [filters, setFilters] = useState<AcceptanceFilters>({});
  const [page, setPage] = useState(1);

  const projectFamilyOptions = useMemo(
    () =>
      toSelectOptions(
        (capabilities?.support_matrix?.project_families ?? []).map((item) => item.id)
      ),
    [capabilities]
  );

  const frameworkFamilyOptions = useMemo(
    () =>
      toSelectOptions(
        unique(
          (capabilities?.support_matrix?.framework_families ?? [])
            .filter(
              (item) => !filters.projectFamily || item.project_family === filters.projectFamily
            )
            .map((item) => item.id)
        )
      ),
    [capabilities, filters.projectFamily]
  );

  const templateFamilyOptions = useMemo(
    () =>
      toSelectOptions(
        unique(
          (capabilities?.support_matrix?.template_families ?? [])
            .filter(
              (item) =>
                !filters.frameworkFamily || item.framework_family === filters.frameworkFamily
            )
            .map((item) => item.id)
        )
      ),
    [capabilities, filters.frameworkFamily]
  );

  const depthOptions = useMemo(
    () =>
      toSelectOptions(
        (capabilities?.support_matrix?.evaluation_depths ?? []).map((item) => item.id)
      ),
    [capabilities]
  );

  const updateFilter = useCallback(
    <K extends keyof AcceptanceFilters>(key: K, value: AcceptanceFilters[K]) => {
      setActiveWorkspaceViewID(undefined);
      setFilters((current) => ({ ...current, [key]: value }));
      setPage(1);
    },
    []
  );

  const refreshDashboard = useCallback(async () => {
    setLoadingDashboard(true);
    try {
      const [capabilityResult, dashboardResult] = await Promise.allSettled([
        projectEvalService.getCapabilities(),
        projectEvalService.getSupportAcceptanceDashboard(buildDashboardParams(filters), {
          silentError: true,
        }),
      ]);
      setCapabilities(
        capabilityResult.status === 'fulfilled'
          ? (capabilityResult.value as unknown as ProjectEvalCapabilities)
          : null
      );
      setDashboard(
        dashboardResult.status === 'fulfilled'
          ? (dashboardResult.value as unknown as ProjectEvalSupportAcceptanceDashboard)
          : null
      );
    } finally {
      setLoadingDashboard(false);
    }
  }, [filters]);

  const refreshHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const response = await projectEvalService.listSupportAcceptanceHistory(
        buildHistoryParams(filters, page),
        { silentError: true }
      );
      setHistory(response as unknown as ProjectEvalSupportAcceptanceHistoryResponse);
    } catch {
      setHistory(null);
    } finally {
      setLoadingHistory(false);
    }
  }, [filters, page]);

  const refreshReviewQueue = useCallback(async () => {
    if (!admin) {
      setReviewQueue(null);
      return;
    }
    setLoadingReviewQueue(true);
    try {
      const response = await projectEvalService.listSupportAcceptanceReviewQueue(
        buildReviewQueueParams(filters),
        { silentError: true }
      );
      setReviewQueue(response as unknown as ProjectEvalSupportAcceptanceReviewQueueResponse);
    } catch {
      setReviewQueue(null);
    } finally {
      setLoadingReviewQueue(false);
    }
  }, [admin, filters]);

  const refreshSampleSchedule = useCallback(async () => {
    if (!admin) {
      setSampleSchedule(null);
      return;
    }
    setLoadingSchedule(true);
    try {
      const response = await projectEvalService.getSupportAcceptanceSampleSchedule(
        buildSampleScheduleParams(filters, includeBlockedSamples, forceSampleRefresh),
        { silentError: true }
      );
      setSampleSchedule(response as unknown as ProjectEvalSupportAcceptanceSampleSchedule);
    } catch {
      setSampleSchedule(null);
    } finally {
      setLoadingSchedule(false);
    }
  }, [admin, filters, forceSampleRefresh, includeBlockedSamples]);

  const refreshPolicyList = useCallback(async () => {
    if (!admin) {
      setRefreshPolicies(null);
      return;
    }
    setLoadingRefreshPolicies(true);
    try {
      const response = await projectEvalService.listSupportAcceptanceRefreshPolicies(
        {
          page: 1,
          page_size: 20,
          order_by: 'next_run_at',
          order_dir: 'asc',
        },
        { silentError: true }
      );
      setRefreshPolicies(
        response as unknown as ProjectEvalSupportAcceptanceRefreshPolicyListResponse
      );
    } catch {
      setRefreshPolicies(null);
    } finally {
      setLoadingRefreshPolicies(false);
    }
  }, [admin]);

  const refreshSelectedLaneReview = useCallback(async (target: LaneReviewTarget) => {
    setLoadingLaneReview(true);
    try {
      const response = await projectEvalService.listSupportAcceptanceLaneReviews(
        {
          lane_key: target.laneKey,
          page: 1,
          page_size: 1,
        },
        { silentError: true }
      );
      const payload = response as unknown as {
        items?: ProjectEvalSupportAcceptanceLaneReview[];
      };
      const currentReview = payload.items?.[0] ?? null;
      setSelectedLaneReview(currentReview);
      if (currentReview) {
        setSelectedLaneReviewSummary((current) =>
          current ?? {
            review_status: currentReview.review_status,
            reason: currentReview.reason,
            note: currentReview.note,
            reviewed_record_id: currentReview.reviewed_record_id,
            reviewed_run_id: currentReview.reviewed_run_id,
            reviewed_verified_at: currentReview.reviewed_verified_at,
            reviewed_system_decision: currentReview.reviewed_system_decision,
            updated_by: currentReview.updated_by,
            updated_at: currentReview.updated_at,
            stale: false,
          }
        );
      }
    } catch {
      setSelectedLaneReview(null);
    } finally {
      setLoadingLaneReview(false);
    }
  }, []);

  const refreshLaneReviewAudits = useCallback(async (target: LaneReviewTarget) => {
    setLoadingLaneReviewAudits(true);
    try {
      const response = await projectEvalService.listSupportAcceptanceLaneReviewAudits(
        {
          lane_key: target.laneKey,
          page: 1,
          page_size: 12,
        },
        { silentError: true }
      );
      setLaneReviewAudits(response as unknown as ProjectEvalSupportAcceptanceLaneReviewAuditListResponse);
    } catch {
      setLaneReviewAudits(null);
    } finally {
      setLoadingLaneReviewAudits(false);
    }
  }, []);

  const fetchWorkspaceViews = useCallback(
    async (applyDefaultIfInactive = true) => {
      setLoadingWorkspaceViews(true);
      try {
        const response = await projectEvalService.listSupportAcceptanceWorkspaceViews(
          {
            page: 1,
            page_size: WORKSPACE_VIEW_PAGE_SIZE,
            order_by: 'sort_order',
            order_dir: 'asc',
          },
          { silentError: true }
        );
        const payload = response as unknown as ProjectEvalSupportAcceptanceWorkspaceViewListResponse;
        const builtinItems = Array.isArray(payload.builtin_items) ? payload.builtin_items : [];
        const customItems = Array.isArray(payload.items) ? payload.items : [];
        const nextViews = [...builtinItems, ...customItems];
        setWorkspaceViews(nextViews);
        setDefaultWorkspaceViewID(payload.default_view_id || undefined);
        setWorkspaceViewsError(null);
        if (applyDefaultIfInactive && !activeWorkspaceViewID && payload.default_view_id) {
          const defaultView = nextViews.find((view) => view.id === payload.default_view_id);
          if (defaultView) {
            setActiveWorkspaceViewID(defaultView.id);
            setFilters(pageFiltersFromWorkspaceFilters(defaultView.filters));
            setPage(1);
            setWorkspaceLayout(normalizeWorkspaceState(defaultView.workspace));
            const sample = defaultView.workspace?.sample_schedule;
            if (sample) {
              setIncludeBlockedSamples(sample.include_blocked ?? true);
              setForceSampleRefresh(sample.force ?? false);
              setAutoConfirmSamples(sample.auto_confirm ?? false);
            }
          }
        }
      } catch {
        setWorkspaceViews([]);
        setDefaultWorkspaceViewID(undefined);
        setWorkspaceViewsError(
          acceptanceText('messages.workspaceViewsUnavailable')
        );
      } finally {
        setLoadingWorkspaceViews(false);
      }
    },
    [activeWorkspaceViewID]
  );

  const openLaneReviewDrawer = useCallback(
    async (
      target: LaneReviewTarget,
      summary?: ProjectEvalSupportAcceptanceOperatorReviewSummary
    ) => {
      setLaneReviewDrawerOpen(true);
      setSelectedLaneReviewTarget(target);
      setSelectedLaneReviewSummary(summary);
      setLaneReviewDraft(buildLaneReviewDraft(summary));
      setSelectedLaneReview(null);
      setLaneReviewAudits(null);
      await Promise.all([refreshSelectedLaneReview(target), refreshLaneReviewAudits(target)]);
    },
    [refreshLaneReviewAudits, refreshSelectedLaneReview]
  );

  const closeLaneReviewDrawer = useCallback(() => {
    setLaneReviewDrawerOpen(false);
    setSelectedLaneReviewTarget(undefined);
    setSelectedLaneReviewSummary(undefined);
    setSelectedLaneReview(null);
    setLaneReviewDraft(buildLaneReviewDraft());
    setLaneReviewAudits(null);
  }, []);

  const resetRefreshPolicyDraft = useCallback(() => {
    setRefreshPolicyDraft(buildRefreshPolicyDraft(filters));
  }, [filters]);

  const applyWorkspaceView = useCallback(
    (viewID?: string) => {
      setPage(1);
      if (!viewID) {
        setActiveWorkspaceViewID(undefined);
        setFilters({});
        setIncludeBlockedSamples(true);
        setForceSampleRefresh(false);
        setAutoConfirmSamples(false);
        setWorkspaceLayout({
          defaultSection: DEFAULT_WORKSPACE_LAYOUT.defaultSection,
          visibleSections: [...DEFAULT_WORKSPACE_LAYOUT.visibleSections],
          tableLayouts: normalizeWorkspaceTableLayouts(),
        });
        return;
      }
      const view = workspaceViews.find((item) => item.id === viewID);
      setActiveWorkspaceViewID(viewID);
      setFilters(pageFiltersFromWorkspaceFilters(view?.filters));
      setWorkspaceLayout(normalizeWorkspaceState(view?.workspace));
      const sample = view?.workspace?.sample_schedule;
      if (sample) {
        setIncludeBlockedSamples(sample.include_blocked ?? true);
        setForceSampleRefresh(sample.force ?? false);
        setAutoConfirmSamples(sample.auto_confirm ?? false);
      }
    },
    [workspaceViews]
  );

  const openCreateWorkspaceViewModal = useCallback(() => {
    const activeView = workspaceViews.find((view) => view.id === activeWorkspaceViewID);
    setWorkspaceViewDraft(createDefaultWorkspaceViewDraft(admin, activeView));
    setWorkspaceViewModalOpen(true);
  }, [activeWorkspaceViewID, admin, workspaceViews]);

  const openEditWorkspaceViewModal = useCallback((view: ProjectEvalSupportAcceptanceWorkspaceView) => {
    if (view.builtin) {
      message.info(acceptanceText('messages.builtinWorkspaceReadOnly'));
      return;
    }
    const layoutDraft = createDefaultWorkspaceViewDraft(admin, view);
    setWorkspaceViewDraft({
      id: view.id,
      name: view.name,
      description: view.description || '',
      visibility: view.visibility,
      isDefault: view.is_default,
      pinned: view.pinned,
      operatorMode: getWorkspaceOperatorMode(view),
      defaultSection: layoutDraft.defaultSection,
      visibleSections: layoutDraft.visibleSections,
      tableLayouts: layoutDraft.tableLayouts,
    });
    setWorkspaceViewModalOpen(true);
  }, [admin]);

  const updateWorkspaceDraftColumn = useCallback(
    (
      tableKey: ProjectEvalSupportAcceptanceWorkspaceTableKey,
      key: string,
      patch: Partial<ProjectEvalSupportAcceptanceWorkspaceColumn>
    ) => {
      setWorkspaceViewDraft((current) => ({
        ...current,
        tableLayouts: {
          ...current.tableLayouts,
          [tableKey]: normalizeWorkspaceColumns(
            tableKey,
            current.tableLayouts[tableKey].map((column) =>
              column.key === key ? { ...column, ...patch } : column
            )
          ),
        },
      }));
    },
    []
  );

  const handleWorkspaceColumnDragEnd = useCallback(
    (tableKey: ProjectEvalSupportAcceptanceWorkspaceTableKey, event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) {
      return;
    }
    setWorkspaceViewDraft((current) => {
      const activeKey = String(active.id);
      const overKey = String(over.id);
      const oldIndex = current.tableLayouts[tableKey].findIndex(
        (column) => column.key === activeKey
      );
      const newIndex = current.tableLayouts[tableKey].findIndex(
        (column) => column.key === overKey
      );
      if (oldIndex < 0 || newIndex < 0) {
        return current;
      }
      return {
        ...current,
        tableLayouts: {
          ...current.tableLayouts,
          [tableKey]: normalizeWorkspaceColumns(
            tableKey,
            arrayMove(current.tableLayouts[tableKey], oldIndex, newIndex)
          ),
        },
      };
    });
  }, []);

  const submitWorkspaceView = useCallback(async () => {
    const name = workspaceViewDraft.name.trim();
    if (!name) {
      message.warning(acceptanceText('messages.workspaceNameRequired'));
      return;
    }
    if (workspaceViewDraft.visibility === 'organization' && !admin) {
      message.warning(acceptanceText('messages.orgAdminRequiredForSharedWorkspace'));
      return;
    }

    setSavingWorkspaceView(true);
    try {
      const activeView = workspaceViews.find((view) => view.id === activeWorkspaceViewID);
      const editingActiveView =
        Boolean(activeView) && workspaceViewDraft.id === activeWorkspaceViewID;
      const payload: UpsertProjectEvalSupportAcceptanceWorkspaceViewRequest = {
        name,
        description: workspaceViewDraft.description.trim(),
        visibility: workspaceViewDraft.visibility,
        is_default: workspaceViewDraft.isDefault,
        pinned: workspaceViewDraft.pinned,
        sort_order: workspaceViewDraft.pinned ? 100 : 0,
        filters: {
          ...(editingActiveView ? activeView?.filters : undefined),
          ...buildWorkspaceFiltersFromPageFilters(filters),
        },
        workspace: buildWorkspaceState(
          includeBlockedSamples,
          forceSampleRefresh,
          autoConfirmSamples,
          workspaceViewDraft.defaultSection,
          workspaceViewDraft.visibleSections,
          workspaceViewDraft.tableLayouts,
          editingActiveView ? activeView?.workspace : undefined
        ),
        metadata: {
          source: 'project_eval_acceptance',
          active_workspace_view_id: activeWorkspaceViewID,
          operator_mode: workspaceViewDraft.operatorMode,
        },
      };
      const response = workspaceViewDraft.id
        ? await projectEvalService.updateSupportAcceptanceWorkspaceView(
            workspaceViewDraft.id,
            payload,
            { silentError: true }
          )
        : await projectEvalService.createSupportAcceptanceWorkspaceView(payload, {
            silentError: true,
          });
      const saved = response as unknown as ProjectEvalSupportAcceptanceWorkspaceView;
      setWorkspaceViewModalOpen(false);
      setActiveWorkspaceViewID(saved.id);
      setFilters(pageFiltersFromWorkspaceFilters(saved.filters));
      setWorkspaceLayout(normalizeWorkspaceState(saved.workspace));
      setPage(1);
      await fetchWorkspaceViews(false);
      message.success(
        workspaceViewDraft.id
          ? acceptanceText('messages.workspaceUpdated')
          : acceptanceText('messages.workspaceCreated')
      );
    } catch (error) {
      message.error(getErrorMessage(error, acceptanceText('messages.workspaceSaveFailed')));
    } finally {
      setSavingWorkspaceView(false);
    }
  }, [
    activeWorkspaceViewID,
    admin,
    autoConfirmSamples,
    fetchWorkspaceViews,
    filters,
    forceSampleRefresh,
    includeBlockedSamples,
    workspaceViewDraft,
    workspaceViews,
  ]);

  const deleteWorkspaceView = useCallback(
    async (view: ProjectEvalSupportAcceptanceWorkspaceView) => {
      if (view.builtin) {
        message.info(acceptanceText('messages.builtinWorkspaceCannotDelete'));
        return;
      }
      try {
        await projectEvalService.deleteSupportAcceptanceWorkspaceView(view.id, {
          silentError: true,
        });
        if (activeWorkspaceViewID === view.id) {
          setActiveWorkspaceViewID(undefined);
          setFilters({});
          setWorkspaceLayout({
            defaultSection: DEFAULT_WORKSPACE_LAYOUT.defaultSection,
            visibleSections: [...DEFAULT_WORKSPACE_LAYOUT.visibleSections],
            tableLayouts: normalizeWorkspaceTableLayouts(),
          });
          setPage(1);
        }
        await fetchWorkspaceViews(false);
        message.success(acceptanceText('messages.workspaceDeleted'));
      } catch (error) {
        message.error(getErrorMessage(error, acceptanceText('messages.workspaceDeleteFailed')));
      }
    },
    [activeWorkspaceViewID, fetchWorkspaceViews]
  );

  const handleScheduleSamples = useCallback(async () => {
    if (!admin) {
      return;
    }
    setSchedulingSamples(true);
    try {
      const response = await projectEvalService.scheduleSupportAcceptanceSamples(
        buildSampleScheduleRequest(
          filters,
          includeBlockedSamples,
          forceSampleRefresh,
          autoConfirmSamples
        )
      );
      const view = response as unknown as ProjectEvalSupportAcceptanceSampleSchedule;
      setSampleSchedule(view);
      const completed = view.created_runs + view.confirmed_runs;
      if (completed > 0) {
        message.success(
          acceptanceText('messages.samplesCompleted', {
            count: completed,
            action: autoConfirmSamples
              ? acceptanceText('messages.confirmed')
              : acceptanceText('messages.created'),
          })
        );
      } else if (view.blocked_candidates > 0) {
        message.warning(acceptanceText('messages.noExecutableSample'));
      } else {
        message.info(acceptanceText('messages.noRefreshCandidates'));
      }
      void refreshDashboard();
      void refreshHistory();
      void refreshReviewQueue();
    } catch (error) {
      message.error(getErrorMessage(error, acceptanceText('messages.scheduleSamplesFailed')));
    } finally {
      setSchedulingSamples(false);
    }
  }, [
    admin,
    autoConfirmSamples,
    filters,
    forceSampleRefresh,
    includeBlockedSamples,
    refreshDashboard,
    refreshHistory,
    refreshReviewQueue,
  ]);

  const handleSaveRefreshPolicy = useCallback(async () => {
    if (!admin) {
      return;
    }
    const request = buildRefreshPolicyRequest(refreshPolicyDraft);
    if (!request.name) {
      message.warning(acceptanceText('messages.policyNameRequired'));
      return;
    }
    setSavingRefreshPolicy(true);
    try {
      if (refreshPolicyDraft.id) {
        await projectEvalService.updateSupportAcceptanceRefreshPolicy(
          refreshPolicyDraft.id,
          request
        );
      } else {
        await projectEvalService.createSupportAcceptanceRefreshPolicy(request);
      }
      message.success(
        refreshPolicyDraft.id
          ? acceptanceText('messages.refreshPolicyUpdated')
          : acceptanceText('messages.refreshPolicySaved')
      );
      resetRefreshPolicyDraft();
      void refreshPolicyList();
    } catch (error) {
      message.error(getErrorMessage(error, acceptanceText('messages.refreshPolicySaveFailed')));
    } finally {
      setSavingRefreshPolicy(false);
    }
  }, [admin, refreshPolicyDraft, refreshPolicyList, resetRefreshPolicyDraft]);

  const refreshAcceptanceViews = useCallback(() => {
    void refreshDashboard();
    void refreshHistory();
    void refreshReviewQueue();
  }, [refreshDashboard, refreshHistory, refreshReviewQueue]);

  const handleSaveLaneReview = useCallback(async () => {
    if (!admin || !selectedLaneReviewTarget) {
      return;
    }
    if (!laneReviewDraft.reason.trim()) {
      message.warning(acceptanceText('messages.reasonRequired'));
      return;
    }
    const payload: UpsertSupportAcceptanceLaneReviewRequest = {
      project_family: selectedLaneReviewTarget.projectFamily,
      framework_family: selectedLaneReviewTarget.frameworkFamily,
      template_family: selectedLaneReviewTarget.templateFamily,
      lane_key: selectedLaneReviewTarget.laneKey,
      review_status: laneReviewDraft.reviewStatus,
      reason: laneReviewDraft.reason.trim(),
      note: laneReviewDraft.note.trim() || undefined,
      reviewed_record_id: selectedLaneReviewTarget.latestRecordID,
      reviewed_run_id: selectedLaneReviewTarget.latestRunID,
      reviewed_verified_at: selectedLaneReviewTarget.latestVerifiedAt,
      reviewed_system_decision: selectedLaneReviewTarget.latestSystemDecision,
      context: {
        source: 'project_eval_acceptance_workspace',
        latest_status: selectedLaneReviewTarget.latestStatus,
        latest_freshness: selectedLaneReviewTarget.latestFreshness,
        latest_maturity: selectedLaneReviewTarget.latestMaturity,
        review_state: selectedLaneReviewTarget.reviewState,
        review_priority: selectedLaneReviewTarget.reviewPriority,
        next_review_due: selectedLaneReviewTarget.nextReviewDue,
      },
    };
    setSavingLaneReview(true);
    try {
      const response = await projectEvalService.createOrUpdateSupportAcceptanceLaneReview(payload, {
        silentError: true,
      });
      const saved = response as unknown as ProjectEvalSupportAcceptanceLaneReview;
      setSelectedLaneReview(saved);
      setSelectedLaneReviewSummary({
        review_status: saved.review_status,
        reason: saved.reason,
        note: saved.note,
        reviewed_record_id: saved.reviewed_record_id,
        reviewed_run_id: saved.reviewed_run_id,
        reviewed_verified_at: saved.reviewed_verified_at,
        reviewed_system_decision: saved.reviewed_system_decision,
        updated_by: saved.updated_by,
        updated_at: saved.updated_at,
        stale: false,
      });
      message.success(acceptanceText('messages.laneReviewSaved'));
      await refreshLaneReviewAudits(selectedLaneReviewTarget);
      refreshAcceptanceViews();
    } catch (error) {
      message.error(getErrorMessage(error, acceptanceText('messages.laneReviewSaveFailed')));
    } finally {
      setSavingLaneReview(false);
    }
  }, [
    admin,
    laneReviewDraft,
    refreshAcceptanceViews,
    refreshLaneReviewAudits,
    selectedLaneReviewTarget,
  ]);

  const handleTriggerRefreshPolicy = useCallback(
    async (policy: ProjectEvalSupportAcceptanceRefreshPolicy) => {
      if (!admin) {
        return;
      }
      setTriggeringRefreshPolicyId(policy.id);
      try {
        const response = await projectEvalService.triggerSupportAcceptanceRefreshPolicy(policy.id);
        const view = response as unknown as { schedule?: ProjectEvalSupportAcceptanceSampleSchedule };
        const completed = (view.schedule?.created_runs ?? 0) + (view.schedule?.confirmed_runs ?? 0);
        if (completed > 0) {
          message.success(acceptanceText('messages.refreshRunsQueued', { count: completed }));
        } else {
          message.info(acceptanceText('messages.refreshPolicyNoCandidates'));
        }
        void refreshPolicyList();
        void refreshDashboard();
        void refreshHistory();
        void refreshReviewQueue();
        void refreshSampleSchedule();
      } catch (error) {
        message.error(getErrorMessage(error, acceptanceText('messages.refreshPolicyTriggerFailed')));
      } finally {
        setTriggeringRefreshPolicyId(undefined);
      }
    },
    [
      admin,
      refreshDashboard,
      refreshHistory,
      refreshPolicyList,
      refreshReviewQueue,
      refreshSampleSchedule,
    ]
  );

  const handleRunDueRefreshPolicies = useCallback(async () => {
    if (!admin) {
      return;
    }
    setRunningDueRefreshPolicies(true);
    try {
      const response = await projectEvalService.runDueSupportAcceptanceRefreshPolicies({
        limit: 10,
      });
      const view = response as unknown as RunDueSupportAcceptanceRefreshPoliciesResponse;
      const triggered = view.triggered_policies ?? 0;
      const failed = view.failed_policies ?? 0;
      if (triggered > 0) {
        message.success(acceptanceText('messages.duePoliciesTriggered', { count: triggered }));
      } else if (failed > 0) {
        message.warning(acceptanceText('messages.duePoliciesFailed', { count: failed }));
      } else {
        message.info(acceptanceText('messages.noDueRefreshPolicies'));
      }
      void refreshPolicyList();
      void refreshDashboard();
      void refreshHistory();
      void refreshReviewQueue();
      void refreshSampleSchedule();
    } catch (error) {
      message.error(getErrorMessage(error, acceptanceText('messages.runDueRefreshPoliciesFailed')));
    } finally {
      setRunningDueRefreshPolicies(false);
    }
  }, [
    admin,
    refreshDashboard,
    refreshHistory,
    refreshPolicyList,
    refreshReviewQueue,
    refreshSampleSchedule,
  ]);

  useEffect(() => {
    void fetchWorkspaceViews();
  }, [fetchWorkspaceViews]);

  useEffect(() => {
    void refreshDashboard();
  }, [refreshDashboard]);

  useEffect(() => {
    void refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    void refreshReviewQueue();
  }, [refreshReviewQueue]);

  useEffect(() => {
    void refreshSampleSchedule();
  }, [refreshSampleSchedule]);

  useEffect(() => {
    void refreshPolicyList();
  }, [refreshPolicyList]);

  const activeWorkspaceView = useMemo(
    () => workspaceViews.find((view) => view.id === activeWorkspaceViewID),
    [activeWorkspaceViewID, workspaceViews]
  );

  const customWorkspaceViews = useMemo(
    () => workspaceViews.filter((view) => !view.builtin),
    [workspaceViews]
  );

  const pinnedWorkspaceViews = useMemo(
    () => workspaceViews.filter((view) => view.builtin || view.pinned || view.is_default),
    [workspaceViews]
  );

  const activeOperatorMode = activeWorkspaceView
    ? getWorkspaceOperatorMode(activeWorkspaceView)
    : 'custom';

  const modePresetViews = useMemo(
    () =>
      OPERATOR_MODE_OPTIONS.map((mode) => ({
        ...mode,
        views: pinnedWorkspaceViews.filter((view) => getWorkspaceOperatorMode(view) === mode.key),
      })).filter((mode) => mode.views.length > 0),
    [pinnedWorkspaceViews]
  );

  const canMutateActiveWorkspaceView = Boolean(
    activeWorkspaceView &&
      !activeWorkspaceView.builtin &&
      (activeWorkspaceView.visibility === 'private' || admin)
  );

  const visibleWorkspaceSectionList = useMemo(
    () => normalizeAvailableWorkspaceSections(workspaceLayout.visibleSections, admin),
    [admin, workspaceLayout.visibleSections]
  );

  const visibleWorkspaceSections = useMemo(
    () => new Set(visibleWorkspaceSectionList),
    [visibleWorkspaceSectionList]
  );

  const effectiveWorkspaceColumns = useMemo(
    () => normalizeWorkspaceColumns('lane_dashboard', workspaceLayout.tableLayouts.lane_dashboard),
    [workspaceLayout.tableLayouts]
  );

  const workspaceAnchorTarget = visibleWorkspaceSections.has(workspaceLayout.defaultSection)
    ? workspaceLayout.defaultSection
    : visibleWorkspaceSectionList[0] || DEFAULT_WORKSPACE_LAYOUT.defaultSection;

  const scrollToWorkspaceSection = useCallback(
    (section: ProjectEvalSupportAcceptanceWorkspaceSection) => {
      const node = document.getElementById(`acceptance-section-${section}`);
      node?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    },
    []
  );

  useEffect(() => {
    if (!activeWorkspaceViewID) {
      return;
    }
    const timer = window.setTimeout(() => {
      scrollToWorkspaceSection(workspaceAnchorTarget);
    }, 80);
    return () => window.clearTimeout(timer);
  }, [activeWorkspaceViewID, scrollToWorkspaceSection, workspaceAnchorTarget]);

  const laneColumnDefinitions = useMemo(() => {
    const definitions: Record<
      string,
      ColumnsType<ProjectEvalSupportAcceptanceLaneSummary>[number]
    > = {
      lane: {
        title: t('acceptancePage.columns.lane'),
        key: 'lane',
        fixed: 'left',
        width: 310,
        render: (_, record) => (
          <Space direction="vertical" size={6}>
            <Text strong>{humanizeKey(record.framework_family)}</Text>
            <Space size={[4, 4]} wrap>
              <Tag>{humanizeKey(record.project_family)}</Tag>
              <Tag>{humanizeKey(record.template_family)}</Tag>
            </Space>
            <Text type="secondary">{record.lane_key}</Text>
          </Space>
        ),
      },
      latest: {
        title: t('acceptancePage.columns.latestEvidence'),
        key: 'latest',
        width: 230,
        render: (_, record) => {
          const status = toneFor(record.latest_status, STATUS_TONES);
          const freshness = toneFor(record.latest_freshness, FRESHNESS_TONES);
          return (
            <Space direction="vertical" size={6}>
              <Space size={[4, 4]} wrap>
                <Tag color={status.color}>{status.label}</Tag>
                <Tag color={freshness.color}>{freshness.label}</Tag>
              </Space>
              <Text type="secondary">{t('acceptancePage.text.verifiedValue', { value: record.last_verified_at || '-' })}</Text>
              <Text type="secondary">{t('acceptancePage.text.scoreValue', { value: formatScore(record.latest_score) })}</Text>
            </Space>
          );
        },
      },
      review: {
        title: t('acceptancePage.columns.review'),
        key: 'review',
        width: 210,
        render: (_, record) => {
          const review = toneFor(record.review_state, REVIEW_TONES);
          const priority = toneFor(record.review_priority, PRIORITY_TONES);
          return (
            <Space direction="vertical" size={6}>
              <Space size={[4, 4]} wrap>
                <Tag color={review.color}>{review.label}</Tag>
                <Tag color={priority.color}>{priority.label}</Tag>
              </Space>
              {record.queue_reasons?.length ? compactTags(record.queue_reasons, 2) : null}
              {operatorReviewSummaryBlock(record.operator_review, t('acceptancePage.empty.noOperatorDecision'))}
              <Text type="secondary">{t('acceptancePage.text.dueValue', { value: record.next_review_due || '-' })}</Text>
            </Space>
          );
        },
      },
      coverage: {
        title: t('acceptancePage.columns.coverage'),
        key: 'coverage',
        width: 280,
        render: (_, record) => (
          <Space direction="vertical" size={6}>
            <Space size={[4, 4]} wrap>
              <Tag>{t('acceptancePage.text.recordsCount', { count: record.record_count })}</Tag>
              <Tag color="green">{t('acceptancePage.text.authoritativeCount', { count: record.authoritative_count })}</Tag>
              {record.compatibility_fallback_count > 0 && (
                <Tag color="gold">{t('acceptancePage.text.fallbackCount', { count: record.compatibility_fallback_count })}</Tag>
              )}
              {record.known_gap_count > 0 && (
                <Tag color="warning">{t('acceptancePage.text.gapsCount', { count: record.known_gap_count })}</Tag>
              )}
            </Space>
            {compactTags(record.depths)}
          </Space>
        ),
      },
      signals: {
        title: t('acceptancePage.columns.signals'),
        key: 'signals',
        width: 260,
        render: (_, record) => (
          <Space direction="vertical" size={6}>
            {compactTags(record.validation_lanes)}
            {compactTags(record.evidence_classes)}
          </Space>
        ),
      },
      action: {
        title: t('acceptancePage.columns.action'),
        key: 'action',
        width: 170,
        render: (_, record) => (
          <Space wrap>
            <Button
              size="small"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate(`/project-eval/${record.latest_run_id}`)}
            >
              {t('acceptancePage.actions.run')}
            </Button>
            {admin && (
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() =>
                  void openLaneReviewDrawer(
                    buildLaneReviewTargetFromLane(record),
                    record.operator_review
                  )
                }
              >
                {t('acceptancePage.actions.reviewLane')}
              </Button>
            )}
            <Tooltip title={t('acceptancePage.actions.filterHistoryToLane')}>
              <Button
                size="small"
                icon={<FilterOutlined />}
                onClick={() => {
                  setActiveWorkspaceViewID(undefined);
                  setFilters((current) => ({
                    ...current,
                    projectFamily: record.project_family,
                    frameworkFamily: record.framework_family,
                    templateFamily: record.template_family,
                  }));
                  setPage(1);
                }}
              />
            </Tooltip>
          </Space>
        ),
      },
    };
    return definitions;
  }, [admin, navigate, openLaneReviewDrawer, t]);

  const laneColumns = useMemo<ColumnsType<ProjectEvalSupportAcceptanceLaneSummary>>(
    () =>
      effectiveWorkspaceColumns
        .filter((column) => column.visible)
        .flatMap((column) => {
          const definition = laneColumnDefinitions[column.key];
          if (!definition) {
            return [];
          }
          return [
            {
              ...definition,
              fixed: column.pinned || definition.fixed,
              width: column.width ?? definition.width,
            },
          ];
        }),
    [effectiveWorkspaceColumns, laneColumnDefinitions]
  );

  const historyColumnDefinitions = useMemo(() => {
    const definitions: Record<
      string,
      ColumnsType<ProjectEvalSupportAcceptanceHistoryItem>[number]
    > = {
      run: {
      title: t('acceptancePage.columns.runEvidence'),
      key: 'run',
      fixed: 'left',
      width: 300,
      render: (_, record) => (
        <Space direction="vertical" size={6}>
          <Button
            type="link"
            style={{ padding: 0 }}
            onClick={() => navigate(`/project-eval/${record.run_id}`)}
          >
            {record.sample_name || record.run_id}
          </Button>
          <Text type="secondary">{t('acceptancePage.text.runValue', { value: record.run_id })}</Text>
          <Text type="secondary">{t('acceptancePage.text.sourceValue', { value: record.source_id })}</Text>
        </Space>
      ),
      },
      lane: {
      title: t('acceptancePage.columns.lane'),
      key: 'lane',
      width: 280,
      render: (_, record) => (
        <Space direction="vertical" size={6}>
          <Text strong>{humanizeKey(record.framework_family)}</Text>
          <Space size={[4, 4]} wrap>
            <Tag>{humanizeKey(record.project_family)}</Tag>
            <Tag>{humanizeKey(record.template_family)}</Tag>
          </Space>
          <Space size={[4, 4]} wrap>
            <Tag>{humanizeKey(record.evaluation_depth)}</Tag>
            {compactTags(record.report_variants, 2)}
          </Space>
        </Space>
      ),
      },
      status: {
      title: t('acceptancePage.columns.status'),
      key: 'status',
      width: 220,
      render: (_, record) => {
        const status = toneFor(record.status, STATUS_TONES);
        const freshness = toneFor(record.freshness, FRESHNESS_TONES);
        const maturity = toneFor(record.maturity, MATURITY_TONES);
        return (
          <Space direction="vertical" size={6}>
            <Space size={[4, 4]} wrap>
              <Tag color={status.color}>{status.label}</Tag>
              <Tag color={freshness.color}>{freshness.label}</Tag>
              <Tag color={maturity.color}>{maturity.label}</Tag>
            </Space>
            {record.legacy_fallback_used && <Tag color="gold">{t('acceptancePage.tags.fallback')}</Tag>}
            {record.authoritative_truth && <Tag color="green">{t('acceptancePage.tags.authoritative')}</Tag>}
          </Space>
        );
      },
      },
      decision: {
      title: t('acceptancePage.columns.decision'),
      key: 'decision',
      width: 170,
      render: (_, record) => {
        const decision = getDecisionTone(record.decision);
        return (
          <Space direction="vertical" size={6}>
            <Tag color={decision.color}>{decision.label}</Tag>
            <Text type="secondary">{t('acceptancePage.text.scoreValue', { value: formatScore(record.score) })}</Text>
          </Space>
        );
      },
      },
      review: {
      title: t('acceptancePage.columns.review'),
      key: 'review',
      width: 210,
      render: (_, record) => {
        const review = toneFor(record.review_state, REVIEW_TONES);
        const priority = toneFor(record.review_priority, PRIORITY_TONES);
        return (
          <Space direction="vertical" size={6}>
            <Space size={[4, 4]} wrap>
              <Tag color={review.color}>{review.label}</Tag>
              <Tag color={priority.color}>{priority.label}</Tag>
            </Space>
            {operatorReviewSummaryBlock(record.operator_review, t('acceptancePage.empty.noOperatorDecision'))}
            <Text type="secondary">{t('acceptancePage.text.verifiedValue', { value: record.last_verified_at || '-' })}</Text>
            <Text type="secondary">{t('acceptancePage.text.dueValue', { value: record.next_review_due || '-' })}</Text>
            {admin && (
              <Button
                size="small"
                icon={<EditOutlined />}
                onClick={() =>
                  void openLaneReviewDrawer(
                    buildLaneReviewTargetFromHistory(record),
                    record.operator_review
                  )
                }
              >
                {t('acceptancePage.actions.reviewLane')}
              </Button>
            )}
          </Space>
        );
      },
      },
      evidence: {
      title: t('acceptancePage.columns.evidence'),
      key: 'evidence',
      width: 300,
      render: (_, record) => (
        <Space direction="vertical" size={6}>
          {compactTags(record.validation_lanes)}
          {compactTags(record.evidence_classes)}
          {record.known_gaps && record.known_gaps.length > 0 && (
            <Tag color="warning">{t('acceptancePage.text.knownGapsCount', { count: record.known_gaps.length })}</Tag>
          )}
        </Space>
      ),
      },
    };
    return definitions;
  }, [admin, navigate, openLaneReviewDrawer, t]);

  const historyColumns = useMemo<ColumnsType<ProjectEvalSupportAcceptanceHistoryItem>>(
    () =>
      normalizeWorkspaceColumns('history', workspaceLayout.tableLayouts.history)
        .filter((column) => column.visible)
        .flatMap((column) => {
          const definition = historyColumnDefinitions[column.key];
          if (!definition) {
            return [];
          }
          return [
            {
              ...definition,
              fixed: column.pinned || definition.fixed,
              width: column.width ?? definition.width,
            },
          ];
        }),
    [historyColumnDefinitions, workspaceLayout.tableLayouts]
  );

  const scheduleColumnDefinitions = useMemo(() => {
    const definitions: Record<
      string,
      ColumnsType<ProjectEvalSupportAcceptanceSampleScheduleCandidate>[number]
    > = {
      candidate: {
      title: t('acceptancePage.columns.refreshCandidate'),
      key: 'candidate',
      fixed: 'left',
      width: 310,
      render: (_, record) => (
        <Space direction="vertical" size={6}>
          <Text strong>{humanizeKey(record.framework_family)}</Text>
          <Space size={[4, 4]} wrap>
            <Tag>{humanizeKey(record.project_family)}</Tag>
            <Tag>{humanizeKey(record.template_family)}</Tag>
          </Space>
          {record.operator_review && (
            <Space size={[4, 4]} wrap>
              <Tag color={toneFor(record.operator_review.review_status, OPERATOR_REVIEW_STATUS_TONES).color}>
                {toneFor(record.operator_review.review_status, OPERATOR_REVIEW_STATUS_TONES).label}
              </Tag>
              {record.operator_review.stale && <Tag color="volcano">{t('acceptancePage.tags.staleReview')}</Tag>}
            </Space>
          )}
          <Space size={[4, 4]} wrap>
            {record.refresh_reasons.map((reason) => (
              <Tag key={reason} color="blue">
                {humanizeKey(reason)}
              </Tag>
            ))}
          </Space>
        </Space>
      ),
      },
      sample: {
      title: t('acceptancePage.columns.sample'),
      key: 'sample',
      width: 280,
      render: (_, record) => (
        <Space direction="vertical" size={6}>
          <Text>{record.sample.sample_name || record.sample.sample_id || '-'}</Text>
          <Text type="secondary">{t('acceptancePage.text.sourceValue', { value: record.source_id || '-' })}</Text>
          <Text type="secondary">
            {t('acceptancePage.text.verifiedValue', { value: record.last_verified_at || record.sample.verified_at || '-' })}
          </Text>
        </Space>
      ),
      },
      options: {
      title: t('acceptancePage.columns.runOptions'),
      key: 'options',
      width: 260,
      render: (_, record) => (
        <Space direction="vertical" size={6}>
          <Space size={[4, 4]} wrap>
            <Tag color="purple">{humanizeKey(record.evaluation_depth)}</Tag>
            <Tag>{humanizeKey(record.mode)}</Tag>
            <Tag>{humanizeKey(record.scope)}</Tag>
          </Space>
          <Text type="secondary">{record.report_variants.map(humanizeKey).join(', ')}</Text>
        </Space>
      ),
      },
      status: {
      title: t('acceptancePage.columns.status'),
      key: 'status',
      width: 230,
      render: (_, record) => {
        const status = toneFor(record.status, SCHEDULE_STATUS_TONES);
        const priority = toneFor(record.review_priority, PRIORITY_TONES);
        return (
          <Space direction="vertical" size={6}>
            <Space size={[4, 4]} wrap>
              <Tag color={status.color}>{status.label}</Tag>
              <Tag color={priority.color}>{priority.label}</Tag>
            </Space>
            {record.operator_review ? (
              <Text type="secondary">
                {t('acceptancePage.text.operatorValue', {
                  value: toneFor(record.operator_review.review_status, OPERATOR_REVIEW_STATUS_TONES).label,
                })}
              </Text>
            ) : null}
            {record.blocked_reason && (
              <Text type="secondary">{humanizeKey(record.blocked_reason)}</Text>
            )}
            {record.error_message && <Text type="danger">{record.error_message}</Text>}
          </Space>
        );
      },
      },
      action: {
      title: t('acceptancePage.columns.action'),
      key: 'action',
      width: 170,
      render: (_, record) => (
        <Space wrap>
          {record.refresh_run_id ? (
            <Button
              size="small"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate(`/project-eval/${record.refresh_run_id}`)}
            >
              {t('acceptancePage.actions.refreshRun')}
            </Button>
          ) : (
            <Button
              size="small"
              disabled={!record.latest_run_id}
              onClick={() =>
                record.latest_run_id && navigate(`/project-eval/${record.latest_run_id}`)
              }
            >
              {t('acceptancePage.actions.latestRun')}
            </Button>
          )}
        </Space>
      ),
      },
    };
    return definitions;
  }, [navigate, t]);

  const scheduleColumns = useMemo<ColumnsType<ProjectEvalSupportAcceptanceSampleScheduleCandidate>>(
    () =>
      normalizeWorkspaceColumns('sample_schedule', workspaceLayout.tableLayouts.sample_schedule)
        .filter((column) => column.visible)
        .flatMap((column) => {
          const definition = scheduleColumnDefinitions[column.key];
          if (!definition) {
            return [];
          }
          return [
            {
              ...definition,
              fixed: column.pinned || definition.fixed,
              width: column.width ?? definition.width,
            },
          ];
        }),
    [scheduleColumnDefinitions, workspaceLayout.tableLayouts]
  );

  const refreshPolicyColumnDefinitions = useMemo(() => {
    const definitions: Record<
      string,
      ColumnsType<ProjectEvalSupportAcceptanceRefreshPolicy>[number]
    > = {
      policy: {
      title: t('acceptancePage.columns.policy'),
      key: 'policy',
      fixed: 'left',
      width: 280,
      render: (_, record) => (
        <Space direction="vertical" size={6}>
          <Space size={[4, 4]} wrap>
            <Text strong>{record.name}</Text>
            {record.due && <Tag color="error">{t('acceptancePage.tags.due')}</Tag>}
            {!record.enabled && <Tag>{t('common.disabled')}</Tag>}
          </Space>
          <Text type="secondary">{record.description || record.id}</Text>
          {filterSummaryTags({
            projectFamily: record.schedule.project_family,
            frameworkFamily: record.schedule.framework_family,
            templateFamily: record.schedule.template_family,
            evaluationDepth: record.schedule.evaluation_depth,
            status: record.schedule.status,
            freshness: record.schedule.freshness,
            maturity: record.schedule.maturity,
            operatorReviewStatus: record.schedule.operator_review_status,
            hasOperatorReview:
              typeof record.schedule.has_operator_review === 'boolean'
                ? String(record.schedule.has_operator_review)
                : undefined,
            operatorReviewStaleOnly: record.schedule.operator_review_stale_only || undefined,
          })}
        </Space>
      ),
      },
      cadence: {
      title: t('acceptancePage.columns.cadence'),
      key: 'cadence',
      width: 180,
      render: (_, record) => (
        <Space direction="vertical" size={6}>
          <Tag color={record.cadence === 'manual' ? 'default' : 'blue'}>
            {humanizeKey(record.cadence)}
          </Tag>
          <Text type="secondary">
            {t('acceptancePage.text.nextValue', { value: record.next_run_at ? formatDateTime(record.next_run_at) : '-' })}
          </Text>
        </Space>
      ),
      },
      controls: {
      title: t('acceptancePage.columns.runControls'),
      key: 'controls',
      width: 250,
      render: (_, record) => (
        <Space direction="vertical" size={6}>
          <Space size={[4, 4]} wrap>
            <Tag>{t('acceptancePage.text.maxCount', { count: record.schedule.limit })}</Tag>
            <Tag>{humanizeKey(record.schedule.mode)}</Tag>
            <Tag>{humanizeKey(record.schedule.scope)}</Tag>
            <Tag>{humanizeKey(record.schedule.report_variant)}</Tag>
          </Space>
          <Space size={[4, 4]} wrap>
            {record.schedule.include_blocked && <Tag>{t('acceptancePage.tags.blockedVisible')}</Tag>}
            {record.schedule.force && <Tag color="gold">{t('acceptancePage.tags.force')}</Tag>}
            {record.schedule.auto_confirm && <Tag color="green">{t('acceptancePage.tags.autoConfirm')}</Tag>}
          </Space>
        </Space>
      ),
      },
      last: {
      title: t('acceptancePage.columns.lastRun'),
      key: 'last',
      width: 240,
      render: (_, record) => {
        const status = toneFor(record.last_trigger_status, REFRESH_POLICY_STATUS_TONES);
        return (
          <Space direction="vertical" size={6}>
            <Space size={[4, 4]} wrap>
              <Tag color={status.color}>{status.label}</Tag>
              {record.last_result && (
                <Tag>
                  {t('acceptancePage.text.runsCount', {
                    count: record.last_result.created_runs + record.last_result.confirmed_runs,
                  })}
                </Tag>
              )}
            </Space>
            <Text type="secondary">
              {record.last_run_at ? formatDateTime(record.last_run_at) : '-'}
            </Text>
            {record.last_trigger_error && (
              <Text type="danger">{record.last_trigger_error}</Text>
            )}
          </Space>
        );
      },
      },
      action: {
      title: t('acceptancePage.columns.action'),
      key: 'action',
      width: 210,
      render: (_, record) => (
        <Space wrap>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => setRefreshPolicyDraft(refreshPolicyDraftFromPolicy(record))}
          >
            {t('common.edit', { defaultValue: 'Edit' })}
          </Button>
          <Button
            size="small"
            icon={<PlayCircleOutlined />}
            disabled={!record.enabled}
            loading={triggeringRefreshPolicyId === record.id}
            onClick={() => void handleTriggerRefreshPolicy(record)}
          >
            {t('acceptancePage.actions.trigger')}
          </Button>
        </Space>
      ),
      },
    };
    return definitions;
  }, [handleTriggerRefreshPolicy, refreshPolicyDraftFromPolicy, t, triggeringRefreshPolicyId]);

  const refreshPolicyColumns = useMemo<
    ColumnsType<ProjectEvalSupportAcceptanceRefreshPolicy>
  >(
    () =>
      normalizeWorkspaceColumns('refresh_policies', workspaceLayout.tableLayouts.refresh_policies)
        .filter((column) => column.visible)
        .flatMap((column) => {
          const definition = refreshPolicyColumnDefinitions[column.key];
          if (!definition) {
            return [];
          }
          return [
            {
              ...definition,
              fixed: column.pinned || definition.fixed,
              width: column.width ?? definition.width,
            },
          ];
        }),
    [refreshPolicyColumnDefinitions, workspaceLayout.tableLayouts]
  );

  const activeFilterCount = Object.values(filters).filter(Boolean).length;
  const summary = dashboard?.summary;
  const executableScheduleCount = sampleSchedule?.executable_candidates ?? 0;
  const dueRefreshPolicyCount = refreshPolicies?.due_policies ?? 0;

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <PageHeader
        title={t('acceptancePage.title')}
        description={t('acceptancePage.description')}
        breadcrumb={[
          { title: t('common.dashboard') },
          { title: t('home.pageTitle') },
          { title: t('acceptancePage.breadcrumb') },
        ]}
        extra={
          <Space wrap>
            <Button icon={<HistoryOutlined />} onClick={() => navigate('/project-eval')}>
              {t('home.pageTitle')}
            </Button>
            <Button icon={<BarChartOutlined />} onClick={() => navigate('/project-eval/insights')}>
              {t('insightsPage.breadcrumb')}
            </Button>
            <Button
              icon={<ReloadOutlined />}
              loading={loadingDashboard || loadingHistory}
              onClick={() => {
                void fetchWorkspaceViews(false);
                void refreshDashboard();
                void refreshHistory();
                void refreshReviewQueue();
              }}
            >
              {t('common.refresh')}
            </Button>
          </Space>
        }
      />

      {dashboard?.truncated && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('acceptancePage.alerts.dashboardCapped', { count: dashboard.record_scan_limit })}
        />
      )}

      <Card
        size="small"
        style={{ marginBottom: 16, borderColor: tokens.border.default }}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space wrap size={[8, 8]}>
            <Text strong>{t('acceptancePage.workspace.operatorMode')}</Text>
            {OPERATOR_MODE_OPTIONS.map((mode) => (
              <Button
                key={mode.key}
                size="small"
                type={activeOperatorMode === mode.key ? 'primary' : 'default'}
                onClick={() => {
                  const modeView = pinnedWorkspaceViews.find(
                    (view) => getWorkspaceOperatorMode(view) === mode.key
                  );
                  if (modeView) {
                    applyWorkspaceView(modeView.id);
                    return;
                  }
                  const sections = getOperatorModeSections(mode.key, admin);
                  if (!sections) {
                    return;
                  }
                  setActiveWorkspaceViewID(undefined);
                  setWorkspaceLayout((current) => ({
                    ...current,
                    defaultSection: sections[0],
                    visibleSections: sections,
                  }));
                }}
              >
                {mode.label}
              </Button>
            ))}
            {activeWorkspaceView && (
              <Tag color="blue">{t('acceptancePage.workspace.activeWorkspace', { name: activeWorkspaceView.name })}</Tag>
            )}
            <Tag color={activeOperatorMode === 'custom' ? 'default' : 'cyan'}>
              {t('acceptancePage.workspace.activeMode', { mode: getOperatorModeLabel(activeOperatorMode) })}
            </Tag>
            <Tag>
              {t('acceptancePage.workspace.laneColumns', {
                visible: laneColumns.length,
                total: DEFAULT_WORKSPACE_COLUMNS.length,
              })}
            </Tag>
          </Space>
          {modePresetViews.length > 0 && (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {modePresetViews.map((mode) => (
                <Space key={mode.key} wrap size={[8, 8]}>
                  <Tag color={activeOperatorMode === mode.key ? 'blue' : 'default'}>
                    {mode.label}
                  </Tag>
                  {mode.views.map((view) => {
                    const active = activeWorkspaceViewID === view.id;
                    return (
                      <Button
                        key={view.id}
                        size="small"
                        type={active ? 'primary' : 'default'}
                        onClick={() => applyWorkspaceView(view.id)}
                        title={getWorkspaceViewSummary(view)}
                      >
                        {view.name}
                      </Button>
                    );
                  })}
                </Space>
              ))}
            </Space>
          )}
          <Space size={[8, 8]} wrap>
            <Text strong>{t('acceptancePage.workspace.openSection')}</Text>
            {WORKSPACE_SECTIONS.filter((section) =>
              visibleWorkspaceSections.has(section.value)
            ).map((section) => (
              <Button
                key={section.value}
                size="small"
                type={workspaceAnchorTarget === section.value ? 'primary' : 'default'}
                onClick={() => scrollToWorkspaceSection(section.value)}
              >
                {section.label}
              </Button>
            ))}
            <Button
              size="small"
              onClick={() => scrollToWorkspaceSection(workspaceAnchorTarget)}
            >
              {t('acceptancePage.workspace.goToDefault')}
            </Button>
          </Space>
        </Space>
      </Card>

      {visibleWorkspaceSections.has('dashboard') && (
        <Row id="acceptance-section-dashboard" gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col xs={24} lg={14}>
            <Card
              style={{
                height: '100%',
                borderColor: tokens.border.default,
                background: `linear-gradient(135deg, ${tokens.bg.secondary}, ${tokens.bg.primary})`,
              }}
            >
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Space wrap>
                  <Tag color="blue">{t('acceptancePage.hero.tags.acceptanceLedger')}</Tag>
                  <Tag color="green">{t('acceptancePage.hero.tags.dynamicEvidence')}</Tag>
                  <Tag color={admin ? 'gold' : 'default'}>
                    {admin ? t('acceptancePage.hero.tags.adminReviewQueue') : t('acceptancePage.hero.tags.readView')}
                  </Tag>
                  {activeFilterCount > 0 && <Tag>{t('acceptancePage.hero.tags.filters', { count: activeFilterCount })}</Tag>}
                </Space>
                <div>
                  <Title level={3} style={{ marginBottom: 8 }}>
                    {t('acceptancePage.hero.title')}
                  </Title>
                  <Text type="secondary">
                    {t('acceptancePage.hero.description')}
                  </Text>
                </div>
                <Row gutter={[16, 16]}>
                  <Col xs={12} md={6}>
                    <Statistic
                      title={t('acceptancePage.stats.lanes')}
                      value={dashboard?.total_lanes ?? 0}
                      loading={loadingDashboard}
                    />
                  </Col>
                  <Col xs={12} md={6}>
                    <Statistic
                      title={t('acceptancePage.stats.freshLanes')}
                      value={dashboard?.fresh_lanes ?? 0}
                      loading={loadingDashboard}
                    />
                  </Col>
                  <Col xs={12} md={6}>
                    <Statistic
                      title={t('acceptancePage.stats.staleLanes')}
                      value={dashboard?.stale_lanes ?? 0}
                      loading={loadingDashboard}
                    />
                  </Col>
                  <Col xs={12} md={6}>
                    <Statistic
                      title={t('acceptancePage.stats.reviewDue')}
                      value={dashboard?.review_due_lanes ?? 0}
                      loading={loadingDashboard}
                    />
                  </Col>
                </Row>
              </Space>
            </Card>
          </Col>
          <Col xs={24} lg={10}>
            <Card
              title={t('acceptancePage.cards.evidenceMix')}
              style={{ height: '100%' }}
              loading={loadingDashboard && !dashboard}
            >
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Row gutter={[12, 12]}>
                  <Col span={12}>
                    <Statistic title={t('acceptancePage.stats.authoritative')} value={dashboard?.authoritative_lanes ?? 0} />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={t('acceptancePage.stats.fallback')}
                      value={dashboard?.compatibility_fallback_lanes ?? 0}
                    />
                  </Col>
                  <Col span={12}>
                    <Statistic title={t('acceptancePage.stats.accepted')} value={summary?.accepted_records ?? 0} />
                  </Col>
                  <Col span={12}>
                    <Statistic
                      title={t('acceptancePage.stats.fallbackRate')}
                      value={countRate(
                        summary?.compatibility_fallback_records,
                        summary?.total_records
                      )}
                    />
                  </Col>
                </Row>
                <div>{distributionTags(summary?.freshness_distribution)}</div>
              </Space>
            </Card>
          </Col>
        </Row>
      )}

      <Card title={t('acceptancePage.filters.title')} style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Space wrap align="center">
              <Text strong>{t('acceptancePage.workspace.views')}</Text>
              <Text type="secondary">
                {t('acceptancePage.workspace.viewsDescription')}
              </Text>
            </Space>
            {workspaceViewsError && <Alert type="warning" showIcon message={workspaceViewsError} />}
            <Row gutter={[12, 12]} align="middle">
              <Col xs={24} md={10} xl={8}>
                <Select
                  allowClear
                  showSearch
                  loading={loadingWorkspaceViews}
                  placeholder={t('acceptancePage.workspace.selectPlaceholder')}
                  value={activeWorkspaceViewID}
                  optionFilterProp="label"
                  onChange={applyWorkspaceView}
                  style={{ width: '100%' }}
                  options={workspaceViews.map((view) => ({
                    value: view.id,
                    label: `${view.name}${view.builtin ? t('acceptancePage.workspace.builtinSuffix') : ''}${
                      view.is_default ? t('acceptancePage.workspace.defaultSuffix') : ''
                    }`,
                  }))}
                />
              </Col>
              <Col xs={24} md={14} xl={16}>
                <Space wrap>
                  <Button icon={<SaveOutlined />} onClick={openCreateWorkspaceViewModal}>
                    {t('acceptancePage.workspace.saveWorkspace')}
                  </Button>
                  <Button
                    icon={<StarOutlined />}
                    disabled={!canMutateActiveWorkspaceView}
                    onClick={() =>
                      activeWorkspaceView && openEditWorkspaceViewModal(activeWorkspaceView)
                    }
                  >
                    {t('acceptancePage.workspace.updateView')}
                  </Button>
                  <Popconfirm
                    title={t('acceptancePage.workspace.deleteTitle')}
                    description={t('acceptancePage.workspace.deleteDescription')}
                    okText={t('common.delete')}
                    okButtonProps={{ danger: true }}
                    disabled={!canMutateActiveWorkspaceView}
                    onConfirm={() =>
                      activeWorkspaceView && void deleteWorkspaceView(activeWorkspaceView)
                    }
                  >
                    <Button danger icon={<DeleteOutlined />} disabled={!canMutateActiveWorkspaceView}>
                      {t('common.delete')}
                    </Button>
                  </Popconfirm>
                {activeWorkspaceView && (
                  <Button onClick={() => applyWorkspaceView(undefined)}>{t('acceptancePage.workspace.leaveView')}</Button>
                )}
                {!admin && <Tag>{t('acceptancePage.workspace.orgViewsReadOnly')}</Tag>}
              </Space>
              </Col>
            </Row>
            {pinnedWorkspaceViews.length > 0 && (
              <Space wrap size={[8, 8]}>
                {pinnedWorkspaceViews.map((view) => {
                  const active = activeWorkspaceViewID === view.id;
                  return (
                    <Button
                      key={view.id}
                      size="small"
                      type={active ? 'primary' : 'default'}
                      icon={
                        view.is_default || defaultWorkspaceViewID === view.id ? (
                          <StarFilled />
                        ) : view.pinned ? (
                          <PushpinOutlined />
                        ) : undefined
                      }
                      title={getWorkspaceViewSummary(view)}
                      aria-pressed={active}
                      onClick={() => applyWorkspaceView(view.id)}
                    >
                      {view.name}
                    </Button>
                  );
                })}
              </Space>
            )}
            {activeWorkspaceView && (
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
                    <Tag color={activeWorkspaceView.builtin ? 'blue' : 'green'}>
                      {activeWorkspaceView.builtin ? t('acceptancePage.workspace.builtin') : t('acceptancePage.workspace.saved')}
                    </Tag>
                    <Tag>
                      {getWorkspaceViewVisibilityLabel(activeWorkspaceView.visibility)}
                    </Tag>
                    {(activeWorkspaceView.is_default ||
                      defaultWorkspaceViewID === activeWorkspaceView.id) && (
                      <Tag color="gold">{t('acceptancePage.workspace.default')}</Tag>
                    )}
                    {activeWorkspaceView.pinned && <Tag>{t('acceptancePage.workspace.pinned')}</Tag>}
                  </Space>
                  <Text type="secondary">{getWorkspaceViewSummary(activeWorkspaceView)}</Text>
                </Space>
              </div>
            )}
          </Space>

          <Space size={[12, 12]} wrap>
            <Input
              allowClear
              placeholder={t('acceptancePage.filters.sourceId')}
              style={{ width: 190 }}
              value={filters.sourceID}
              onChange={(event) => updateFilter('sourceID', event.target.value || undefined)}
            />
            <Input
              allowClear
              placeholder={t('acceptancePage.filters.runId')}
              style={{ width: 190 }}
              value={filters.runID}
              onChange={(event) => updateFilter('runID', event.target.value || undefined)}
            />
            <Select
              allowClear
              placeholder={t('acceptancePage.filters.projectFamily')}
              style={{ width: 190 }}
              value={filters.projectFamily}
              options={projectFamilyOptions}
              onChange={(value) => updateFilter('projectFamily', value)}
            />
            <Select
              allowClear
              placeholder={t('acceptancePage.filters.frameworkFamily')}
              style={{ width: 190 }}
              value={filters.frameworkFamily}
              options={frameworkFamilyOptions}
              onChange={(value) => updateFilter('frameworkFamily', value)}
            />
            <Select
              allowClear
              placeholder={t('acceptancePage.filters.templateFamily')}
              style={{ width: 190 }}
              value={filters.templateFamily}
              options={templateFamilyOptions}
              onChange={(value) => updateFilter('templateFamily', value)}
            />
            <Select
              allowClear
              placeholder={t('acceptancePage.filters.depth')}
              style={{ width: 150 }}
              value={filters.evaluationDepth}
              options={depthOptions}
              onChange={(value) => updateFilter('evaluationDepth', value)}
            />
            <Select
              allowClear
              placeholder={t('acceptancePage.filters.freshness')}
              style={{ width: 150 }}
              value={filters.freshness}
              options={toSelectOptions(['fresh', 'aging', 'stale'], acceptanceValueLabel)}
              onChange={(value) => updateFilter('freshness', value)}
            />
            <Select
              allowClear
              placeholder={t('acceptancePage.filters.status')}
              style={{ width: 150 }}
              value={filters.status}
              options={toSelectOptions(['accepted', 'provisional', 'exploratory'], acceptanceValueLabel)}
              onChange={(value) => updateFilter('status', value)}
            />
            <Select
              allowClear
              placeholder={t('acceptancePage.filters.maturity')}
              style={{ width: 150 }}
              value={filters.maturity}
              options={toSelectOptions(['stable', 'beta', 'experimental'], acceptanceValueLabel)}
              onChange={(value) => updateFilter('maturity', value)}
            />
            <Select
              allowClear
              placeholder={t('acceptancePage.filters.decision')}
              style={{ width: 150 }}
              value={filters.decision}
              options={toSelectOptions(['pass', 'warn', 'block'], acceptanceValueLabel)}
              onChange={(value) => updateFilter('decision', value)}
            />
            <Select
              placeholder={t('acceptancePage.filters.operatorReview')}
              style={{ width: 180 }}
              value={filters.operatorReviewStatus ?? ALL_VALUE}
              options={[
                { value: ALL_VALUE, label: t('acceptancePage.filters.anyOperatorReview') },
                ...reviewStatusOptions(),
              ]}
              onChange={(value) =>
                updateFilter('operatorReviewStatus', value === ALL_VALUE ? undefined : value)
              }
            />
            <Select
              placeholder={t('acceptancePage.filters.authority')}
              style={{ width: 170 }}
              value={filters.authoritative ?? ALL_VALUE}
              options={[
                { value: ALL_VALUE, label: t('acceptancePage.filters.anyAuthority') },
                { value: 'true', label: t('acceptancePage.filters.authoritativeOnly') },
                { value: 'false', label: t('acceptancePage.filters.nonAuthoritative') },
              ]}
              onChange={(value) =>
                updateFilter('authoritative', value === ALL_VALUE ? undefined : value)
              }
            />
            <Select
              placeholder={t('acceptancePage.filters.fallback')}
              style={{ width: 150 }}
              value={filters.fallback ?? ALL_VALUE}
              options={[
                { value: ALL_VALUE, label: t('acceptancePage.filters.anyFallback') },
                { value: 'true', label: t('acceptancePage.filters.fallbackOnly') },
                { value: 'false', label: t('acceptancePage.filters.noFallback') },
              ]}
              onChange={(value) =>
                updateFilter('fallback', value === ALL_VALUE ? undefined : value)
              }
            />
            <Select
              placeholder={t('acceptancePage.filters.reviewPresence')}
              style={{ width: 170 }}
              value={filters.hasOperatorReview ?? ALL_VALUE}
              options={[
                { value: ALL_VALUE, label: t('acceptancePage.filters.anyReviewPresence') },
                { value: 'true', label: t('acceptancePage.filters.withOperatorReview') },
                { value: 'false', label: t('acceptancePage.filters.withoutOperatorReview') },
              ]}
              onChange={(value) =>
                updateFilter('hasOperatorReview', value === ALL_VALUE ? undefined : value)
              }
            />
            <Checkbox
              checked={Boolean(filters.operatorReviewStaleOnly)}
              onChange={(event) =>
                updateFilter('operatorReviewStaleOnly', event.target.checked || undefined)
              }
            >
              {t('acceptancePage.filters.operatorReviewStaleOnly')}
            </Checkbox>
            <Checkbox
              checked={Boolean(filters.reviewDueOnly)}
              onChange={(event) => updateFilter('reviewDueOnly', event.target.checked || undefined)}
            >
              {t('acceptancePage.filters.reviewDueOnly')}
            </Checkbox>
            <Button
              onClick={() => {
                setActiveWorkspaceViewID(undefined);
                setFilters({});
                setPage(1);
              }}
            >
              {t('common.reset')}
            </Button>
          </Space>
        </Space>
      </Card>

      {admin && visibleWorkspaceSections.has('review_queue') && (
        <Card
          id="acceptance-section-review_queue"
          title={t('acceptancePage.cards.adminReviewQueue')}
          style={{ marginBottom: 16 }}
          extra={<Text type="secondary">{t('acceptancePage.text.lanesQueued', { count: reviewQueue?.total ?? 0 })}</Text>}
          loading={loadingReviewQueue}
        >
          {reviewQueue?.items?.length ? (
            <Row gutter={[12, 12]}>
              {reviewQueue.items.slice(0, 8).map((item) => {
                const review = toneFor(item.review_state, REVIEW_TONES);
                const priority = toneFor(item.review_priority, PRIORITY_TONES);
                return (
                  <Col xs={24} md={12} xl={6} key={item.lane_key}>
                    <div
                      style={{
                        border: `1px solid ${tokens.border.default}`,
                        borderRadius: 8,
                        padding: 12,
                        height: '100%',
                      }}
                    >
                      <Space direction="vertical" size={8} style={{ width: '100%' }}>
                        <Space size={[4, 4]} wrap>
                          <Tag color={review.color}>{review.label}</Tag>
                          <Tag color={priority.color}>{priority.label}</Tag>
                        </Space>
                        {item.queue_reasons?.length ? compactTags(item.queue_reasons, 2) : null}
                        {operatorReviewSummaryBlock(item.operator_review, t('acceptancePage.empty.noOperatorDecision'))}
                        <Text strong>{humanizeKey(item.framework_family)}</Text>
                        <Text type="secondary">{t('acceptancePage.text.dueValue', { value: item.next_review_due || '-' })}</Text>
                        <Text type="secondary">{t('acceptancePage.text.latestRunValue', { value: item.latest_run_id || '-' })}</Text>
                        <Space wrap>
                          <Button
                            size="small"
                            disabled={!item.latest_run_id}
                            onClick={() =>
                              item.latest_run_id && navigate(`/project-eval/${item.latest_run_id}`)
                            }
                          >
                            {t('acceptancePage.actions.openRun')}
                          </Button>
                          <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() =>
                              void openLaneReviewDrawer(
                                buildLaneReviewTargetFromLane(item),
                                item.operator_review
                              )
                            }
                          >
                            {t('acceptancePage.actions.reviewLane')}
                          </Button>
                        </Space>
                      </Space>
                    </div>
                  </Col>
                );
              })}
            </Row>
          ) : (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('acceptancePage.empty.noDueReviewLanes')}
            />
          )}
        </Card>
      )}

      {admin && visibleWorkspaceSections.has('refresh_policies') && (
        <Card
          id="acceptance-section-refresh_policies"
          title={t('acceptancePage.cards.refreshPolicies')}
          style={{ marginBottom: 16 }}
          extra={
            <Space wrap>
              <Button
                icon={<ReloadOutlined />}
                loading={loadingRefreshPolicies}
                onClick={() => void refreshPolicyList()}
              >
                {t('common.refresh')}
              </Button>
              <Popconfirm
                title={t('acceptancePage.refreshPolicies.runDueTitle')}
                okText={t('acceptancePage.refreshPolicies.runDue')}
                cancelText={t('common.cancel')}
                onConfirm={() => void handleRunDueRefreshPolicies()}
                disabled={dueRefreshPolicyCount === 0}
              >
                <Button
                  icon={<PlayCircleOutlined />}
                  loading={runningDueRefreshPolicies}
                  disabled={dueRefreshPolicyCount === 0}
                >
                  {t('acceptancePage.refreshPolicies.runDueCount', { count: dueRefreshPolicyCount })}
                </Button>
              </Popconfirm>
            </Space>
          }
        >
          <Row gutter={[16, 16]}>
            <Col xs={24} xl={8}>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Input
                  placeholder={t('acceptancePage.refreshPolicies.policyName')}
                  value={refreshPolicyDraft.name}
                  onChange={(event) =>
                    setRefreshPolicyDraft((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                />
                <Input.TextArea
                  placeholder={t('acceptancePage.refreshPolicies.description')}
                  value={refreshPolicyDraft.description}
                  autoSize={{ minRows: 2, maxRows: 4 }}
                  onChange={(event) =>
                    setRefreshPolicyDraft((current) => ({
                      ...current,
                      description: event.target.value,
                    }))
                  }
                />
                <Row gutter={[8, 8]}>
                  <Col xs={12}>
                    <Select<ProjectEvalSupportAcceptanceRefreshCadence>
                      value={refreshPolicyDraft.cadence}
                      options={REFRESH_CADENCE_OPTIONS}
                      style={{ width: '100%' }}
                      onChange={(value) =>
                        setRefreshPolicyDraft((current) => ({
                          ...current,
                          cadence: value,
                        }))
                      }
                    />
                  </Col>
                  <Col xs={12}>
                    <InputNumber
                      min={1}
                      max={50}
                      value={refreshPolicyDraft.limit}
                      style={{ width: '100%' }}
                      onChange={(value) =>
                        setRefreshPolicyDraft((current) => ({
                          ...current,
                          limit: value ?? SAMPLE_SCHEDULE_LIMIT,
                        }))
                      }
                    />
                  </Col>
                </Row>
                <Space size={[16, 8]} wrap>
                  <Space size={8}>
                    <Switch
                      size="small"
                      checked={refreshPolicyDraft.enabled}
                      onChange={(checked) =>
                        setRefreshPolicyDraft((current) => ({
                          ...current,
                          enabled: checked,
                        }))
                      }
                    />
                    <Text>{t('common.enabled')}</Text>
                  </Space>
                  <Checkbox
                    checked={refreshPolicyDraft.includeBlocked}
                    onChange={(event) =>
                      setRefreshPolicyDraft((current) => ({
                        ...current,
                        includeBlocked: event.target.checked,
                      }))
                    }
                  >
                    {t('acceptancePage.refreshPolicies.showBlocked')}
                  </Checkbox>
                  <Checkbox
                    checked={refreshPolicyDraft.force}
                    onChange={(event) =>
                      setRefreshPolicyDraft((current) => ({
                        ...current,
                        force: event.target.checked,
                      }))
                    }
                  >
                    {t('acceptancePage.refreshPolicies.includeCurrent')}
                  </Checkbox>
                  <Checkbox
                    checked={refreshPolicyDraft.autoConfirm}
                    onChange={(event) =>
                      setRefreshPolicyDraft((current) => ({
                        ...current,
                        autoConfirm: event.target.checked,
                      }))
                    }
                  >
                    {t('acceptancePage.refreshPolicies.autoConfirm')}
                  </Checkbox>
                </Space>
                <div
                  style={{
                    border: `1px solid ${tokens.border.default}`,
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <Text strong>{t('acceptancePage.refreshPolicies.scheduleFilters')}</Text>
                    {filterSummaryTags(refreshPolicyDraft.filters)}
                    <Space wrap>
                      <Button
                        size="small"
                        onClick={() =>
                          setRefreshPolicyDraft((current) => ({
                            ...current,
                            filters: pickPolicyFilters(filters),
                          }))
                        }
                      >
                        {t('acceptancePage.refreshPolicies.useCurrentFilters')}
                      </Button>
                      <Button
                        size="small"
                        onClick={() =>
                          setRefreshPolicyDraft((current) => ({
                            ...current,
                            filters: {},
                          }))
                        }
                      >
                        {t('acceptancePage.refreshPolicies.clearFilters')}
                      </Button>
                    </Space>
                  </Space>
                </div>
                <Space wrap>
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={savingRefreshPolicy}
                    onClick={() => void handleSaveRefreshPolicy()}
                  >
                    {refreshPolicyDraft.id
                      ? t('acceptancePage.refreshPolicies.updatePolicy')
                      : t('acceptancePage.refreshPolicies.savePolicy')}
                  </Button>
                  <Button onClick={resetRefreshPolicyDraft}>{t('acceptancePage.refreshPolicies.newPolicy')}</Button>
                </Space>
              </Space>
            </Col>
            <Col xs={24} xl={16}>
              <Table<ProjectEvalSupportAcceptanceRefreshPolicy>
                rowKey="id"
                columns={refreshPolicyColumns}
                dataSource={refreshPolicies?.items ?? []}
                loading={loadingRefreshPolicies}
                pagination={{ pageSize: 5, showSizeChanger: false }}
                scroll={{ x: 1160 }}
                locale={{
                  emptyText: (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={t('acceptancePage.empty.noRefreshPolicies')}
                    />
                  ),
                }}
              />
            </Col>
          </Row>
        </Card>
      )}

      {admin && visibleWorkspaceSections.has('sample_schedule') && (
        <Card
          id="acceptance-section-sample_schedule"
          title={t('acceptancePage.cards.sampleScheduling')}
          style={{ marginBottom: 16 }}
          extra={
            <Space wrap>
              <Button
                icon={<ReloadOutlined />}
                loading={loadingSchedule}
                onClick={() => void refreshSampleSchedule()}
              >
                {t('acceptancePage.actions.preview')}
              </Button>
              <Popconfirm
                title={t('acceptancePage.sampleScheduling.scheduleTitle')}
                description={
                  autoConfirmSamples
                    ? t('acceptancePage.sampleScheduling.scheduleConfirmNow')
                    : t('acceptancePage.sampleScheduling.scheduleCreateOnly')
                }
                okText={t('acceptancePage.actions.schedule')}
                cancelText={t('common.cancel')}
                onConfirm={() => void handleScheduleSamples()}
                disabled={executableScheduleCount === 0}
              >
                <Button
                  type="primary"
                  icon={<PlayCircleOutlined />}
                  loading={schedulingSamples}
                  disabled={executableScheduleCount === 0}
                >
                  {t('acceptancePage.sampleScheduling.scheduleCount', { count: executableScheduleCount })}
                </Button>
              </Popconfirm>
            </Space>
          }
        >
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Row gutter={[12, 12]}>
              <Col xs={12} md={6}>
                <Statistic
                  title={t('acceptancePage.stats.candidates')}
                  value={sampleSchedule?.total_candidates ?? 0}
                  loading={loadingSchedule && !sampleSchedule}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title={t('acceptancePage.stats.executable')}
                  value={sampleSchedule?.executable_candidates ?? 0}
                  loading={loadingSchedule && !sampleSchedule}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title={t('acceptancePage.stats.blocked')}
                  value={sampleSchedule?.blocked_candidates ?? 0}
                  loading={loadingSchedule && !sampleSchedule}
                />
              </Col>
              <Col xs={12} md={6}>
                <Statistic
                  title={autoConfirmSamples ? t('acceptancePage.stats.confirmed') : t('acceptancePage.stats.created')}
                  value={
                    autoConfirmSamples
                      ? (sampleSchedule?.confirmed_runs ?? 0)
                      : (sampleSchedule?.created_runs ?? 0)
                  }
                />
              </Col>
            </Row>
            <Space size={[16, 8]} wrap>
              <Checkbox
                checked={includeBlockedSamples}
                onChange={(event) => setIncludeBlockedSamples(event.target.checked)}
              >
                {t('acceptancePage.sampleScheduling.showBlockedSamples')}
              </Checkbox>
              <Checkbox
                checked={forceSampleRefresh}
                onChange={(event) => setForceSampleRefresh(event.target.checked)}
              >
                {t('acceptancePage.sampleScheduling.includeCurrentLanes')}
              </Checkbox>
              <Checkbox
                checked={autoConfirmSamples}
                onChange={(event) => setAutoConfirmSamples(event.target.checked)}
              >
                {t('acceptancePage.sampleScheduling.autoConfirmCreatedRuns')}
              </Checkbox>
              <Tag color="blue">strict / full / evidence</Tag>
              {sampleSchedule?.failed_runs ? (
                <Tag color="error">{t('acceptancePage.text.failedCount', { count: sampleSchedule.failed_runs })}</Tag>
              ) : null}
            </Space>
            <Table<ProjectEvalSupportAcceptanceSampleScheduleCandidate>
              rowKey={sampleScheduleRowKey}
              columns={scheduleColumns}
              dataSource={sampleSchedule?.items ?? []}
              loading={loadingSchedule}
              pagination={{ pageSize: 6, showSizeChanger: false }}
              scroll={{ x: 1250 }}
              locale={{
                emptyText: (
                  <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={t('acceptancePage.empty.noRefreshCandidates')}
                  />
                ),
              }}
            />
          </Space>
        </Card>
      )}

      {visibleWorkspaceSections.has('lane_dashboard') && (
        <Card
          id="acceptance-section-lane_dashboard"
          title={t('acceptancePage.cards.laneDashboard')}
          style={{ marginBottom: 16 }}
          extra={
            <Text type="secondary">
              {t('acceptancePage.text.generatedValue', { value: dashboard?.generated_at ? formatDateTime(dashboard.generated_at) : '-' })}
            </Text>
          }
        >
          <Table<ProjectEvalSupportAcceptanceLaneSummary>
            rowKey="lane_key"
            columns={laneColumns}
            dataSource={dashboard?.lane_summaries ?? []}
            loading={loadingDashboard}
            pagination={{ pageSize: 8, showSizeChanger: false }}
            scroll={{ x: 1450 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t('acceptancePage.empty.noSupportLanes')}
                />
              ),
            }}
          />
        </Card>
      )}

      {visibleWorkspaceSections.has('history') && (
        <Card
          id="acceptance-section-history"
          title={t('acceptancePage.cards.acceptanceHistory')}
          extra={<Text type="secondary">{t('acceptancePage.text.recordsCount', { count: history?.total ?? 0 })}</Text>}
        >
          <Table<ProjectEvalSupportAcceptanceHistoryItem>
            rowKey="id"
            columns={historyColumns}
            dataSource={history?.items ?? []}
            loading={loadingHistory}
            pagination={{
              current: page,
              pageSize: HISTORY_PAGE_SIZE,
              total: history?.total ?? 0,
              showSizeChanger: false,
              onChange: setPage,
            }}
            scroll={{ x: 1480 }}
            locale={{
              emptyText: (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t('acceptancePage.empty.noAcceptanceRecords')}
                />
              ),
            }}
          />
        </Card>
      )}

      <Drawer
        title={
          selectedLaneReviewTarget
            ? t('acceptancePage.drawer.titleWithLane', { lane: selectedLaneReviewTarget.laneKey })
            : t('acceptancePage.drawer.title')
        }
        width={640}
        open={laneReviewDrawerOpen}
        onClose={closeLaneReviewDrawer}
        extra={
          admin ? (
            <Button
              type="primary"
              icon={<SaveOutlined />}
              loading={savingLaneReview}
              onClick={() => void handleSaveLaneReview()}
            >
              {t('acceptancePage.actions.saveReview')}
            </Button>
          ) : null
        }
      >
        {selectedLaneReviewTarget ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {selectedLaneReviewSummary?.stale ? (
              <Alert
                type="warning"
                showIcon
                message={t('acceptancePage.drawer.staleReviewTitle')}
                description={t('acceptancePage.drawer.staleReviewDescription')}
              />
            ) : null}
            <Card size="small" title={t('acceptancePage.drawer.laneIdentity')}>
              <Descriptions size="small" column={1} bordered>
                <Descriptions.Item label={t('acceptancePage.drawer.laneKey')}>
                  {selectedLaneReviewTarget.laneKey}
                </Descriptions.Item>
                <Descriptions.Item label={t('acceptancePage.filters.projectFamily')}>
                  {humanizeKey(selectedLaneReviewTarget.projectFamily)}
                </Descriptions.Item>
                <Descriptions.Item label={t('acceptancePage.filters.frameworkFamily')}>
                  {humanizeKey(selectedLaneReviewTarget.frameworkFamily)}
                </Descriptions.Item>
                <Descriptions.Item label={t('acceptancePage.filters.templateFamily')}>
                  {humanizeKey(selectedLaneReviewTarget.templateFamily)}
                </Descriptions.Item>
                <Descriptions.Item label={t('acceptancePage.drawer.reviewPosture')}>
                  <Space size={[4, 4]} wrap>
                    <Tag color={toneFor(selectedLaneReviewTarget.reviewState, REVIEW_TONES).color}>
                      {toneFor(selectedLaneReviewTarget.reviewState, REVIEW_TONES).label}
                    </Tag>
                    <Tag
                      color={toneFor(
                        selectedLaneReviewTarget.reviewPriority,
                        PRIORITY_TONES
                      ).color}
                    >
                      {toneFor(selectedLaneReviewTarget.reviewPriority, PRIORITY_TONES).label}
                    </Tag>
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title={t('acceptancePage.drawer.latestEvidenceSnapshot')} loading={loadingLaneReview}>
              <Descriptions size="small" column={1} bordered>
                <Descriptions.Item label={t('acceptancePage.drawer.systemDecision')}>
                  {systemDecisionTag(selectedLaneReviewTarget.latestSystemDecision)}
                </Descriptions.Item>
                <Descriptions.Item label={t('acceptancePage.drawer.latestRecord')}>
                  {selectedLaneReviewTarget.latestRecordID || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('acceptancePage.drawer.latestRun')}>
                  {selectedLaneReviewTarget.latestRunID || '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('acceptancePage.drawer.verifiedAt')}>
                  {selectedLaneReviewTarget.latestVerifiedAt
                    ? formatDateTime(selectedLaneReviewTarget.latestVerifiedAt)
                    : '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('acceptancePage.drawer.evidenceStatus')}>
                  <Space size={[4, 4]} wrap>
                    <Tag>{humanizeKey(selectedLaneReviewTarget.latestStatus)}</Tag>
                    <Tag color={toneFor(selectedLaneReviewTarget.latestFreshness, FRESHNESS_TONES).color}>
                      {toneFor(selectedLaneReviewTarget.latestFreshness, FRESHNESS_TONES).label}
                    </Tag>
                    <Tag>{humanizeKey(selectedLaneReviewTarget.latestMaturity)}</Tag>
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label={t('acceptancePage.drawer.score')}>
                  {formatScore(selectedLaneReviewTarget.latestScore)}
                </Descriptions.Item>
                <Descriptions.Item label={t('acceptancePage.drawer.knownGaps')}>
                  {selectedLaneReviewTarget.knownGapCount ?? 0}
                </Descriptions.Item>
                <Descriptions.Item label={t('acceptancePage.drawer.validationLanes')}>
                  {compactTags(selectedLaneReviewTarget.validationLanes)}
                </Descriptions.Item>
                <Descriptions.Item label={t('acceptancePage.drawer.evidenceClasses')}>
                  {compactTags(selectedLaneReviewTarget.evidenceClasses)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <Card size="small" title={t('acceptancePage.drawer.currentOperatorReview')}>
              {operatorReviewSummaryBlock(
                selectedLaneReviewSummary,
                t('acceptancePage.empty.noOperatorReviewStored')
              )}
              {selectedLaneReview && (
                <List
                  size="small"
                  style={{ marginTop: 12 }}
                  dataSource={[
                    [t('acceptancePage.drawer.createdBy'), selectedLaneReview.created_by],
                    [t('acceptancePage.drawer.createdAt'), formatDateTime(selectedLaneReview.created_at)],
                    [t('acceptancePage.drawer.lastUpdatedBy'), selectedLaneReview.updated_by],
                    [t('acceptancePage.drawer.lastUpdatedAt'), formatDateTime(selectedLaneReview.updated_at)],
                  ]}
                  renderItem={(item) => (
                    <List.Item>
                      <Text type="secondary">{item[0]}</Text>
                      <Text>{item[1]}</Text>
                    </List.Item>
                  )}
                />
              )}
            </Card>

            <Card
              size="small"
              title={admin ? t('acceptancePage.drawer.updateOperatorReview') : t('acceptancePage.drawer.operatorReviewSnapshot')}
            >
              {admin ? (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Select<ProjectEvalSupportAcceptanceLaneReviewStatus>
                    value={laneReviewDraft.reviewStatus}
                    options={reviewStatusOptions()}
                    style={{ width: '100%' }}
                    onChange={(value) =>
                      setLaneReviewDraft((current) => ({
                        ...current,
                        reviewStatus: value,
                      }))
                    }
                  />
                  <Select
                    showSearch
                    value={laneReviewDraft.reason || undefined}
                    options={laneReviewReasonOptions()}
                    placeholder={t('acceptancePage.drawer.chooseReviewReason')}
                    style={{ width: '100%' }}
                    onChange={(value) =>
                      setLaneReviewDraft((current) => ({
                        ...current,
                        reason: value,
                      }))
                    }
                  />
                  <Input.TextArea
                    value={laneReviewDraft.note}
                    autoSize={{ minRows: 3, maxRows: 6 }}
                    placeholder={t('acceptancePage.drawer.reviewNotePlaceholder')}
                    onChange={(event) =>
                      setLaneReviewDraft((current) => ({
                        ...current,
                        note: event.target.value,
                      }))
                    }
                  />
                  <Alert
                    type="info"
                    showIcon
                    icon={<MessageOutlined />}
                    message={t('acceptancePage.drawer.reviewReferenceTitle')}
                    description={t('acceptancePage.drawer.reviewReferenceDescription')}
                  />
                </Space>
              ) : (
                operatorReviewSummaryBlock(
                  selectedLaneReviewSummary,
                  t('acceptancePage.empty.onlyOrgAdminsCanEditReviews')
                )
              )}
            </Card>

            <Card
              size="small"
              title={t('acceptancePage.drawer.auditHistory', { count: laneReviewAudits?.total ?? 0 })}
              loading={loadingLaneReviewAudits}
              extra={
                selectedLaneReviewTarget ? (
                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={() => void refreshLaneReviewAudits(selectedLaneReviewTarget)}
                  >
                    {t('common.refresh')}
                  </Button>
                ) : null
              }
            >
              {laneReviewAudits?.items?.length ? (
                <Timeline
                  items={laneReviewAudits.items.map((item: ProjectEvalSupportAcceptanceLaneReviewAudit) => ({
                    color: toneFor(item.review_status, OPERATOR_REVIEW_STATUS_TONES).color,
                    children: (
                      <Space direction="vertical" size={4}>
                        <Space size={[4, 4]} wrap>
                          <Tag>{humanizeKey(item.action)}</Tag>
                          <Tag color={toneFor(item.review_status, OPERATOR_REVIEW_STATUS_TONES).color}>
                            {toneFor(item.review_status, OPERATOR_REVIEW_STATUS_TONES).label}
                          </Tag>
                          <Text type="secondary">
                            {item.actor_user_id} · {formatDateTime(item.created_at)}
                          </Text>
                        </Space>
                        <Text>{item.reason}</Text>
                        {item.note ? <Text type="secondary">{item.note}</Text> : null}
                      </Space>
                    ),
                  }))}
                />
              ) : (
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={t('acceptancePage.empty.noOperatorReviewAudits')}
                />
              )}
            </Card>
          </Space>
        ) : null}
      </Drawer>

      <Modal
        title={workspaceViewDraft.id ? t('acceptancePage.workspace.updateAcceptanceWorkspace') : t('acceptancePage.workspace.saveAcceptanceWorkspace')}
        open={workspaceViewModalOpen}
        okText={workspaceViewDraft.id ? t('acceptancePage.workspace.updateWorkspace') : t('acceptancePage.workspace.saveWorkspace')}
        confirmLoading={savingWorkspaceView}
        onOk={() => void submitWorkspaceView()}
        onCancel={() => setWorkspaceViewModalOpen(false)}
      >
        <Space direction="vertical" size={14} style={{ width: '100%' }}>
          <Input
            placeholder={t('acceptancePage.workspace.namePlaceholder')}
            value={workspaceViewDraft.name}
            onChange={(event) =>
              setWorkspaceViewDraft((current) => ({
                ...current,
                name: event.target.value,
              }))
            }
          />
          <Input.TextArea
            placeholder={t('acceptancePage.workspace.descriptionPlaceholder')}
            value={workspaceViewDraft.description}
            autoSize={{ minRows: 2, maxRows: 4 }}
            onChange={(event) =>
              setWorkspaceViewDraft((current) => ({
                ...current,
                description: event.target.value,
              }))
            }
          />
          <Select<ProjectEvalSupportAcceptanceWorkspaceViewVisibility>
            value={workspaceViewDraft.visibility}
            options={WORKSPACE_VIEW_VISIBILITY_OPTIONS.map((option) => ({
              ...option,
              disabled: option.value === 'organization' && !admin,
            }))}
            style={{ width: '100%' }}
            onChange={(value) =>
              setWorkspaceViewDraft((current) => ({
                ...current,
                visibility: value,
              }))
            }
          />
          <div>
            <Text strong>{t('acceptancePage.workspace.operatorMode')}</Text>
            <Select<AcceptanceOperatorMode>
              value={workspaceViewDraft.operatorMode}
              options={[
                ...OPERATOR_MODE_OPTIONS.map((mode) => ({
                  label: mode.label,
                  value: mode.key,
                })),
                { label: t('acceptancePage.workspace.customMode'), value: 'custom' as const },
              ]}
              style={{ width: '100%', marginTop: 8 }}
              onChange={(value) =>
                setWorkspaceViewDraft((current) => {
                  const presetSections = getOperatorModeSections(value, admin);
                  if (!presetSections) {
                    return {
                      ...current,
                      operatorMode: value,
                    };
                  }
                  return {
                    ...current,
                    operatorMode: value,
                    visibleSections: presetSections,
                    defaultSection: presetSections.includes(current.defaultSection)
                      ? current.defaultSection
                      : presetSections[0],
                  };
                })
              }
            />
            <Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
              {workspaceViewDraft.operatorMode === 'custom'
                ? t('acceptancePage.workspace.customModeDescription')
                : OPERATOR_MODE_OPTIONS.find((mode) => mode.key === workspaceViewDraft.operatorMode)
                    ?.description}
            </Text>
          </div>
          <Row gutter={[12, 12]}>
            <Col xs={24} md={10}>
              <Text strong>{t('acceptancePage.workspace.defaultSection')}</Text>
              <Select<ProjectEvalSupportAcceptanceWorkspaceSection>
                value={workspaceViewDraft.defaultSection}
                options={WORKSPACE_SECTIONS.map((section) => ({
                  label: section.label,
                  value: section.value,
                  disabled:
                    !workspaceViewDraft.visibleSections.includes(section.value) ||
                    !isWorkspaceSectionAvailable(section.value, admin),
                }))}
                style={{ width: '100%', marginTop: 8 }}
                onChange={(value) =>
                  setWorkspaceViewDraft((current) => ({
                    ...current,
                    defaultSection: value,
                  }))
                }
              />
            </Col>
            <Col xs={24} md={14}>
              <Text strong>{t('acceptancePage.workspace.visibleSections')}</Text>
              <Select<ProjectEvalSupportAcceptanceWorkspaceSection[]>
                mode="multiple"
                value={workspaceViewDraft.visibleSections}
                options={WORKSPACE_SECTIONS.map((section) => ({
                  label: section.label,
                  value: section.value,
                  disabled: !isWorkspaceSectionAvailable(section.value, admin),
                }))}
                style={{ width: '100%', marginTop: 8 }}
                onChange={(values) =>
                  setWorkspaceViewDraft((current) => {
                    const visibleSections = normalizeAvailableWorkspaceSections(values, admin);
                    const defaultSection = visibleSections.includes(current.defaultSection)
                      ? current.defaultSection
                      : visibleSections[0];
                    return {
                      ...current,
                      visibleSections,
                      defaultSection,
                    };
                  })
                }
              />
            </Col>
          </Row>
          <Space wrap>
            <Checkbox
              checked={workspaceViewDraft.pinned}
              onChange={(event) =>
                setWorkspaceViewDraft((current) => ({
                  ...current,
                  pinned: event.target.checked,
                }))
              }
            >
              {t('acceptancePage.workspace.pinInWorkspaceBar')}
            </Checkbox>
            <Checkbox
              checked={workspaceViewDraft.isDefault}
              onChange={(event) =>
                setWorkspaceViewDraft((current) => ({
                  ...current,
                  isDefault: event.target.checked,
                }))
              }
            >
              {t('acceptancePage.workspace.makeDefault')}
            </Checkbox>
          </Space>
          {WORKSPACE_LAYOUT_EDITORS.map((editor) => (
            <Card
              key={editor.key}
              size="small"
              title={editor.title}
              styles={{ body: { padding: 12 } }}
            >
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Text type="secondary">{editor.description}</Text>
                <DndContext
                  sensors={columnSensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(event) => handleWorkspaceColumnDragEnd(editor.key, event)}
                >
                  <SortableContext
                    items={workspaceViewDraft.tableLayouts[editor.key].map((column) => column.key)}
                    strategy={verticalListSortingStrategy}
                  >
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      {workspaceViewDraft.tableLayouts[editor.key].map((column) => (
                        <SortableColumnPill
                          key={`${editor.key}:${column.key}`}
                          column={column}
                          onChange={(patch) =>
                            updateWorkspaceDraftColumn(editor.key, column.key, patch)
                          }
                        />
                      ))}
                    </Space>
                  </SortableContext>
                </DndContext>
                <Space wrap size={[8, 8]}>
                  {workspaceViewDraft.tableLayouts[editor.key]
                    .filter((column) => column.visible)
                    .map((column) => (
                      <Tag
                        key={`${editor.key}:${column.key}`}
                        color={column.pinned ? 'blue' : 'default'}
                      >
                        {column.label || humanizeKey(column.key)}
                      </Tag>
                    ))}
                </Space>
              </Space>
            </Card>
          ))}
          <Alert
            type="info"
            showIcon
            message={t('acceptancePage.workspace.saveInfo')}
          />
          {customWorkspaceViews.length > 0 && (
            <Text type="secondary">
              {t('acceptancePage.workspace.customWorkspaceCount', { count: customWorkspaceViews.length })}
            </Text>
          )}
        </Space>
      </Modal>
    </div>
  );
}
