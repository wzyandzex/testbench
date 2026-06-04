import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Steps,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CheckCircleOutlined,
  EditOutlined,
  FileSearchOutlined,
  HistoryOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { PageHeader } from '@/components/common';
import ProjectEvalStageProgressPanel from '@/components/project-eval/ProjectEvalStageProgressPanel';
import { buildProjectEvalRepairPath } from '@/pages/repair-run/links';
import {
  formatConfidence,
  formatCoverage,
  formatDateTime,
  formatScore,
  getDecisionTone,
  getEvidenceInsufficientReasonLabel,
  getEvidencePostureAlertType,
  getEvidencePostureStatusColor,
  getEvidencePostureStatusLabel,
  getEvidenceTruthSourceLabel,
  getMainlineActionText,
  getOutcomeAuthorityLabel,
  getProjectTypeLabel,
  getRemediationCategoryLabel,
  getRemediationSummary,
  getRiskTone,
  getRunModeLabel,
  getScopeLabel,
  getSelectionReasonLabel,
  getSelectionStatusTone,
  getStageLabel,
  getStatusTone,
  humanizeKey,
} from '@/components/project-eval/helpers';
import { saveRecentProjectEvalRun } from '@/components/project-eval/recentRuns';
import { extractApiRateLimitError, type ApiRateLimitError } from '@/services/api';
import { projectEvalService } from '@/services/project-eval';
import { useThemeTokens, type ThemeTokens } from '@/theme';
import type {
  ApplyOverridesRequest,
  CaseSelectionRecord,
  CaseSelectionResponse,
  MainlineActionResult,
  RunDetailView,
  RunEvidenceResponse,
  RunMainlineView,
  RunPlanView,
  RunReportView,
  SnapshotGuard,
} from '@/types/api/project-eval';

const { Paragraph, Text, Title } = Typography;

type ProjectEvalDetailTab = 'stages' | 'plan' | 'evidence' | 'mainline';

const CASE_SELECTION_FILTERS = ['selected', 'skipped', 'forced_included', 'forced_excluded'] as const;
const EVIDENCE_DECISION_FILTERS = ['pass', 'warn', 'block'] as const;
const MAINLINE_STAGE_GROUPS = [
  {
    get label() { return i18next.t('projectEval:detail.mainlineGroupEvaluation'); },
    stages: [
      'eval_waiting_approval',
      'eval_pending_execution',
      'eval_running',
      'eval_completed_no_action',
      'eval_completed_non_authoritative',
      'eval_failed',
      'eval_cancelled',
    ],
  },
  {
    get label() { return i18next.t('projectEval:detail.mainlineGroupRepair'); },
    stages: [
      'repair_available',
      'repair_created',
      'repair_planning',
      'repair_approval_pending',
      'repair_approved',
      'repair_applying',
      'repair_failed',
      'repair_cancelled',
    ],
  },
  {
    get label() { return i18next.t('projectEval:detail.mainlineGroupReplay'); },
    stages: [
      'replay_available',
      'replay_pending',
      'replay_running',
      'replay_completed',
      'replay_failed',
      'replay_unavailable',
    ],
  },
] as const;
const FLAT_MAINLINE_STAGES: string[] = MAINLINE_STAGE_GROUPS.flatMap((group) => group.stages);

type DetailReadStatus = 'idle' | 'loading' | 'ready' | 'error';

interface DetailReadState<T> {
  status: DetailReadStatus;
  requestKey: string;
  data: T | null;
  errorMessage: string | null;
  rateLimit: ApiRateLimitError | null;
}

function createIdleReadState<T>(): DetailReadState<T> {
  return {
    status: 'idle',
    requestKey: '',
    data: null,
    errorMessage: null,
  rateLimit: null,
  };
}

function formatEvidencePostureCount(value?: number): string {
  return typeof value === 'number' ? String(value) : '-';
}

type JsonRecord = Record<string, unknown>;

function beginReadLoad<T>(previous: DetailReadState<T>, requestKey: string): DetailReadState<T> {
  const preserveData = previous.requestKey === requestKey;
  return {
    status: 'loading',
    requestKey,
    data: preserveData ? previous.data : null,
    errorMessage: null,
    rateLimit: null,
  };
}

function completeReadLoad<T>(requestKey: string, data: T): DetailReadState<T> {
  return {
    status: 'ready',
    requestKey,
    data,
    errorMessage: null,
    rateLimit: null,
  };
}

function failReadLoad<T>(
  previous: DetailReadState<T>,
  requestKey: string,
  errorMessage: string,
  rateLimit: ApiRateLimitError | null
): DetailReadState<T> {
  const preserveData = previous.requestKey === requestKey;
  return {
    status: 'error',
    requestKey,
    data: preserveData ? previous.data : null,
    errorMessage,
    rateLimit,
  };
}

function buildCaseSelectionRequestKey(page: number, status?: string): string {
  return `page:${page}|status:${status ?? 'all'}`;
}

function buildEvidenceRequestKey(page: number, decision?: string): string {
  return `page:${page}|decision:${decision ?? 'all'}`;
}

function buildReadErrorMessage(subject: string, error: unknown, fallback: string): string {
  if (extractApiRateLimitError(error)) {
    return i18next.t('projectEval:detail.rateLimitNoBudget', { subject });
  }
  return getErrorMessage(error, fallback);
}

function buildRateLimitDescription(rateLimit: ApiRateLimitError): string {
  const budget = rateLimit.limit > 0 ? `${rateLimit.count}/${rateLimit.limit}` : `${rateLimit.count}`;
  if (rateLimit.resetAt <= 0) {
    return i18next.t('projectEval:detail.rateLimitNoReset', { budget });
  }
  return i18next.t('projectEval:detail.rateLimitWithReset', {
    budget,
    time: formatDateTime(new Date(rateLimit.resetAt * 1000).toISOString()),
  });
}

function getErrorMessage(error: unknown, fallback: string): string {
  const response = (error as { response?: { data?: { message?: string } } })?.response;
  return response?.data?.message || fallback;
}

function readCountMap(summary: Record<string, unknown> | undefined, key: string): Array<[string, number]> {
  const raw = summary?.[key];
  if (!raw || typeof raw !== 'object') {
    return [];
  }

  return Object.entries(raw as Record<string, unknown>).flatMap(([name, value]) =>
    typeof value === 'number' ? [[name, value] as [string, number]] : []
  );
}

function asJsonRecord(value: unknown): JsonRecord | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  return value as JsonRecord;
}

function readJsonRecord(parent: JsonRecord | undefined, key: string): JsonRecord | undefined {
  return asJsonRecord(parent?.[key]);
}

function readBooleanValue(parent: JsonRecord | undefined, key: string): boolean | undefined {
  const value = parent?.[key];
  return typeof value === 'boolean' ? value : undefined;
}

function readStringValue(parent: JsonRecord | undefined, key: string): string {
  const value = parent?.[key];
  if (typeof value === 'string') {
    return value.trim();
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  return '';
}

function readStringArray(parent: JsonRecord | undefined, key: string): string[] {
  const value = parent?.[key];
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((item) => (typeof item === 'string' || typeof item === 'number' ? String(item).trim() : ''))
    .filter(Boolean);
}

function firstRecord(...records: Array<JsonRecord | undefined>): JsonRecord | undefined {
  return records.find(Boolean);
}

function firstText(...values: string[]): string {
  return values.find((value) => value.trim() !== '')?.trim() ?? '';
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function renderJsonBlock(value: unknown, emptyMessage?: string, tokens?: ThemeTokens): ReactNode {
  if (!value) {
    return <Text type="secondary">{emptyMessage ?? i18next.t('projectEval:detail.noStructuredPayload')}</Text>;
  }

  return (
    <pre
      style={{
        margin: 0,
        padding: 12,
        overflow: 'auto',
        maxWidth: '100%',
        borderRadius: 8,
        border: `1px solid ${tokens?.border.default ?? 'rgba(127, 127, 127, 0.18)'}`,
        background: tokens?.bg.tertiary ?? 'rgba(127, 127, 127, 0.08)',
        color: tokens?.text.primary ?? 'inherit',
        fontFamily:
          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace',
        fontSize: 12,
        lineHeight: 1.5,
      }}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

interface CaseSelectionTruthView {
  assetPurpose: string;
  capabilityID: string;
  frameworkFamily: string;
  templateFamily: string;
  applicableMatched?: boolean;
  bindingResolved?: boolean;
  bindingMode: string;
  executionContractPresent?: boolean;
  executionReady?: boolean;
  executionReadyReason: string;
  authoritativeReady?: boolean;
  authoritativeUnavailableReason: string;
  authoritativeCandidate?: boolean;
  validationProfileSupported?: boolean;
  validationUnsupportedReason: string;
  runLevelSourceIdentityReady?: boolean;
  runLevelSourceIdentityReason: string;
  runLevelBindingMode: string;
  validationLane: string;
  runnerFamily: string;
  launcherFamily: string;
  adapterName: string;
  runtimeImage: string;
  caseSourcePath: string;
  caseSourceScope: string;
  executionCommand: string;
  commandWorkDir: string;
  targetTests: string[];
  matchedFiles: string[];
  gapReason: string;
}

function buildCaseSelectionTruthView(record: CaseSelectionRecord): CaseSelectionTruthView {
  const evidence = asJsonRecord(record.evidence_summary);
  const decisionTrace = asJsonRecord(record.decision_trace);
  const decisionSignals = readJsonRecord(decisionTrace, 'signals');
  const sourceBinding = firstRecord(
    readJsonRecord(evidence, 'source_binding'),
    readJsonRecord(decisionTrace, 'source_binding')
  );
  const planningSignal = firstRecord(
    readJsonRecord(evidence, 'planning_signal'),
    readJsonRecord(decisionSignals, 'planning_signal')
  );
  const caseSchema = firstRecord(
    readJsonRecord(evidence, 'case_schema'),
    readJsonRecord(decisionTrace, 'case_schema')
  );
  const executableBinding = readJsonRecord(sourceBinding, 'executable_binding');
  const executionReady = readBooleanValue(sourceBinding, 'execution_ready') ?? readBooleanValue(executableBinding, 'ready');
  const authoritativeReady = readBooleanValue(planningSignal, 'authoritative_ready');
  const authoritativeCandidate =
    typeof authoritativeReady === 'boolean' || typeof executionReady === 'boolean'
      ? authoritativeReady === true && executionReady === true
      : undefined;
  const executionReadyReason = firstText(
    readStringValue(sourceBinding, 'execution_ready_reason'),
    readStringValue(executableBinding, 'ready_reason')
  );
  const authoritativeUnavailableReason = readStringValue(planningSignal, 'authoritative_unavailable_reason');
  const validationUnsupportedReason = firstText(
    readStringValue(sourceBinding, 'validation_unsupported_reason'),
    readStringValue(executableBinding, 'unsupported_reason')
  );
  const runLevelSourceIdentityReason = firstText(
    readStringValue(sourceBinding, 'run_level_source_identity_reason'),
    readStringValue(executableBinding, 'run_level_source_identity_reason')
  );
  const gapReason = firstText(
    executionReady === false ? executionReadyReason : '',
    authoritativeReady === false ? authoritativeUnavailableReason : '',
    validationUnsupportedReason,
    runLevelSourceIdentityReason,
    record.selection_reason
  );

  return {
    assetPurpose: readStringValue(caseSchema, 'asset_purpose'),
    capabilityID: readStringValue(caseSchema, 'capability_id'),
    frameworkFamily: readStringValue(caseSchema, 'framework_family'),
    templateFamily: readStringValue(caseSchema, 'template_family'),
    applicableMatched:
      readBooleanValue(sourceBinding, 'applicable_matched') ?? readBooleanValue(decisionSignals, 'source_applicable'),
    bindingResolved: readBooleanValue(sourceBinding, 'binding_resolved'),
    bindingMode: firstText(readStringValue(sourceBinding, 'binding_mode'), readStringValue(decisionSignals, 'source_match_mode')),
    executionContractPresent: readBooleanValue(sourceBinding, 'execution_contract_present'),
    executionReady,
    executionReadyReason,
    authoritativeReady,
    authoritativeUnavailableReason,
    authoritativeCandidate,
    validationProfileSupported:
      readBooleanValue(sourceBinding, 'validation_profile_supported') ?? readBooleanValue(executableBinding, 'supported'),
    validationUnsupportedReason,
    runLevelSourceIdentityReady:
      readBooleanValue(sourceBinding, 'run_level_source_identity_ready') ??
      readBooleanValue(executableBinding, 'run_level_source_identity_ready'),
    runLevelSourceIdentityReason,
    runLevelBindingMode: firstText(
      readStringValue(sourceBinding, 'run_level_binding_mode'),
      readStringValue(executableBinding, 'run_level_binding_mode')
    ),
    validationLane: firstText(
      readStringValue(sourceBinding, 'validation_lane'),
      readStringValue(executableBinding, 'validation_lane')
    ),
    runnerFamily: firstText(
      readStringValue(sourceBinding, 'runner_family'),
      readStringValue(executableBinding, 'runner_family')
    ),
    launcherFamily: firstText(
      readStringValue(sourceBinding, 'launcher_family'),
      readStringValue(executableBinding, 'launcher_family')
    ),
    adapterName: firstText(
      readStringValue(sourceBinding, 'adapter_name'),
      readStringValue(executableBinding, 'adapter_name'),
      readStringValue(sourceBinding, 'adapter_key'),
      readStringValue(executableBinding, 'adapter_key')
    ),
    runtimeImage: firstText(
      readStringValue(sourceBinding, 'runtime_image'),
      readStringValue(executableBinding, 'runtime_image')
    ),
    caseSourcePath: firstText(readStringValue(sourceBinding, 'case_source_path'), readStringValue(decisionTrace, 'source_path')),
    caseSourceScope: firstText(readStringValue(sourceBinding, 'case_source_scope'), readStringValue(decisionTrace, 'source_scope')),
    executionCommand: firstText(
      readStringValue(sourceBinding, 'execution_command'),
      readStringArray(executableBinding, 'command').join(' ')
    ),
    commandWorkDir: firstText(
      readStringValue(sourceBinding, 'command_work_dir'),
      readStringValue(executableBinding, 'command_work_dir')
    ),
    targetTests: uniqueStrings([
      ...readStringArray(sourceBinding, 'target_tests'),
      ...readStringArray(executableBinding, 'target_tests'),
    ]),
    matchedFiles: uniqueStrings([
      ...readStringArray(sourceBinding, 'matched_files'),
      ...readStringArray(decisionTrace, 'matched_files'),
    ]),
    gapReason,
  };
}

function formatCaseTruthReason(value?: string): string {
  const trimmed = String(value ?? '').trim();
  if (!trimmed) {
    return i18next.t('projectEval:detail.unknown');
  }
  return getSelectionReasonLabel(trimmed);
}

function renderBooleanTag(value: boolean | undefined, falseColor: string = 'warning'): ReactNode {
  if (typeof value !== 'boolean') {
    return <Tag>{i18next.t('projectEval:detail.unknown')}</Tag>;
  }
  return (
    <Tag color={value ? 'success' : falseColor}>
      {value ? i18next.t('projectEval:detail.yes') : i18next.t('projectEval:detail.no')}
    </Tag>
  );
}

function renderHumanizedValue(value?: string): ReactNode {
  if (!value || value.trim() === '') {
    return <Text type="secondary">-</Text>;
  }
  return humanizeKey(value);
}

function renderCodeValue(value?: string): ReactNode {
  if (!value || value.trim() === '') {
    return <Text type="secondary">-</Text>;
  }
  return <Text code style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{value}</Text>;
}

function renderMatchedFileTags(files: string[]): ReactNode {
  if (files.length === 0) {
    return <Text type="secondary">{i18next.t('projectEval:detail.noMatchedFiles')}</Text>;
  }
  const visibleFiles = files.slice(0, 8);
  return (
    <Space size={[4, 4]} wrap>
      {visibleFiles.map((file) => (
        <Tag key={file} style={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {file}
        </Tag>
      ))}
      {files.length > visibleFiles.length && (
        <Tag>{i18next.t('projectEval:detail.moreFiles', { count: files.length - visibleFiles.length })}</Tag>
      )}
    </Space>
  );
}

function renderLimitedTags(values: string[], emptyMessage: string): ReactNode {
  if (values.length === 0) {
    return <Text type="secondary">{emptyMessage}</Text>;
  }
  const visibleValues = values.slice(0, 8);
  return (
    <Space size={[4, 4]} wrap>
      {visibleValues.map((value) => (
        <Tag key={value} style={{ maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {value}
        </Tag>
      ))}
      {values.length > visibleValues.length && (
        <Tag>{i18next.t('projectEval:detail.moreItems', { count: values.length - visibleValues.length })}</Tag>
      )}
    </Space>
  );
}

function renderCaseSelectionTruthPanel(record: CaseSelectionRecord): ReactNode {
  const view = buildCaseSelectionTruthView(record);
  const ready = view.authoritativeCandidate === true;
  const reason = formatCaseTruthReason(view.gapReason);
  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Alert
        type={ready ? 'success' : 'warning'}
        showIcon
        message={ready ? i18next.t('projectEval:detail.caseTruthReady') : i18next.t('projectEval:detail.caseTruthBlocked')}
        description={
          ready
            ? i18next.t('projectEval:detail.caseTruthReadyDesc')
            : i18next.t('projectEval:detail.caseTruthBlockedDesc', { reason })
        }
      />
      <Descriptions size="small" column={2} bordered>
        <Descriptions.Item label={i18next.t('projectEval:detail.assetPurpose')}>
          {renderHumanizedValue(view.assetPurpose)}
        </Descriptions.Item>
        <Descriptions.Item label={i18next.t('projectEval:detail.capabilityId')}>
          {renderCodeValue(view.capabilityID)}
        </Descriptions.Item>
        <Descriptions.Item label={i18next.t('projectEval:detail.frameworkFamily')}>
          {renderHumanizedValue(view.frameworkFamily)}
        </Descriptions.Item>
        <Descriptions.Item label={i18next.t('projectEval:detail.templateFamily')}>
          {renderHumanizedValue(view.templateFamily)}
        </Descriptions.Item>
        <Descriptions.Item label={i18next.t('projectEval:detail.applicableMatched')}>
          {renderBooleanTag(view.applicableMatched)}
        </Descriptions.Item>
        <Descriptions.Item label={i18next.t('projectEval:detail.bindingResolved')}>
          {renderBooleanTag(view.bindingResolved)}
        </Descriptions.Item>
        <Descriptions.Item label={i18next.t('projectEval:detail.bindingMode')}>
          {renderHumanizedValue(view.bindingMode)}
        </Descriptions.Item>
        <Descriptions.Item label={i18next.t('projectEval:detail.executionContractPresent')}>
          {renderBooleanTag(view.executionContractPresent)}
        </Descriptions.Item>
        <Descriptions.Item label={i18next.t('projectEval:detail.executionReady')}>
          {renderBooleanTag(view.executionReady)}
        </Descriptions.Item>
        <Descriptions.Item label={i18next.t('projectEval:detail.authoritativeCandidate')}>
          {renderBooleanTag(view.authoritativeCandidate)}
        </Descriptions.Item>
        <Descriptions.Item label={i18next.t('projectEval:detail.validationProfileSupported')}>
          {renderBooleanTag(view.validationProfileSupported)}
        </Descriptions.Item>
        <Descriptions.Item label={i18next.t('projectEval:detail.runLevelSourceIdentity')}>
          {renderBooleanTag(view.runLevelSourceIdentityReady)}
        </Descriptions.Item>
        <Descriptions.Item label={i18next.t('projectEval:detail.gapReason')}>
          {formatCaseTruthReason(view.gapReason)}
        </Descriptions.Item>
        <Descriptions.Item label={i18next.t('projectEval:detail.runLevelBindingMode')}>
          {renderHumanizedValue(view.runLevelBindingMode)}
        </Descriptions.Item>
        <Descriptions.Item label={i18next.t('projectEval:detail.validationLane')}>
          {renderHumanizedValue(view.validationLane)}
        </Descriptions.Item>
        <Descriptions.Item label={i18next.t('projectEval:detail.runnerFamily')}>
          {renderHumanizedValue(view.runnerFamily)}
        </Descriptions.Item>
        <Descriptions.Item label={i18next.t('projectEval:detail.launcherFamily')}>
          {renderHumanizedValue(view.launcherFamily)}
        </Descriptions.Item>
        <Descriptions.Item label={i18next.t('projectEval:detail.adapterName')}>
          {renderHumanizedValue(view.adapterName)}
        </Descriptions.Item>
        <Descriptions.Item label={i18next.t('projectEval:detail.runtimeImage')}>
          {renderCodeValue(view.runtimeImage)}
        </Descriptions.Item>
        <Descriptions.Item label={i18next.t('projectEval:detail.commandWorkDir')}>
          {renderCodeValue(view.commandWorkDir)}
        </Descriptions.Item>
        <Descriptions.Item label={i18next.t('projectEval:detail.caseSourcePath')}>
          {renderCodeValue(view.caseSourcePath)}
        </Descriptions.Item>
        <Descriptions.Item label={i18next.t('projectEval:detail.caseSourceScope')}>
          {renderCodeValue(view.caseSourceScope)}
        </Descriptions.Item>
        <Descriptions.Item label={i18next.t('projectEval:detail.executionCommand')} span={2}>
          {renderCodeValue(view.executionCommand)}
        </Descriptions.Item>
        <Descriptions.Item label={i18next.t('projectEval:detail.targetTests')} span={2}>
          {renderLimitedTags(view.targetTests, i18next.t('projectEval:detail.noTargetTests'))}
        </Descriptions.Item>
        <Descriptions.Item label={i18next.t('projectEval:detail.matchedFiles')} span={2}>
          {renderMatchedFileTags(view.matchedFiles)}
        </Descriptions.Item>
      </Descriptions>
    </Space>
  );
}

function buildWhyThisVerdict(
  run: RunDetailView | null,
  plan: RunPlanView | null,
  report: RunReportView | null,
  mainline: RunMainlineView | null
): string {
  if (run?.error_message) {
    return run.error_message;
  }

  if (!run) {
    return i18next.t('projectEval:detail.noRunData');
  }

  const selectedCases =
    plan?.selected_case_count ??
    plan?.case_selection_summary?.selected_case_count ??
    report?.selected_case_count ??
    0;

  if (run.status === 'planned') {
    if (selectedCases > 0) {
      return i18next.t('projectEval:detail.postureRunReady', { selectedCases });
    }
    return i18next.t('projectEval:detail.postureRunNotReady');
  }

  if (run.status === 'running') {
    return i18next.t('projectEval:detail.postureRunning');
  }

  if (run.status === 'failed') {
    return i18next.t('projectEval:detail.postureFailed');
  }

  const evidencePosture = report?.evidence_posture ?? run.evidence_posture;
  if (evidencePosture?.insufficient_evidence) {
    return i18next.t('projectEval:detail.postureInsufficientEvidence', {
      reason: getEvidenceInsufficientReasonLabel(evidencePosture.insufficient_evidence_reason),
    });
  }

  if (evidencePosture && !evidencePosture.authoritative_ready) {
    return i18next.t('projectEval:detail.postureEvidenceNotReady', {
      status: getEvidencePostureStatusLabel(evidencePosture.status),
      truthSource: getEvidenceTruthSourceLabel(evidencePosture.truth_source_mode),
    });
  }

  if (report?.summary) {
    return report.summary;
  }

  if (report?.legacy_fallback_used) {
    return i18next.t('projectEval:detail.postureFallback');
  }

  if (report && !report.authoritative_truth) {
    return i18next.t('projectEval:detail.postureNotAuthoritative');
  }

  if (mainline?.explain) {
    return mainline.explain;
  }

  const decisionTone = getDecisionTone(run.decision);
  return i18next.t('projectEval:detail.postureFinal', {
    decision: decisionTone.label.toLowerCase(),
    score: formatScore(run.score),
  });
}

function buildNextActionCopy(
  run: RunDetailView | null,
  mainline: RunMainlineView | null,
  report: RunReportView | null
): string {
  if (mainline?.primary_action_reason) {
    return mainline.primary_action_reason;
  }

  if (mainline?.explain) {
    return mainline.explain;
  }

  if (run?.status === 'planned') {
    return i18next.t('projectEval:detail.actionPlanNotReady');
  }

  if (run?.status === 'running') {
    return i18next.t('projectEval:detail.actionWaiting');
  }

  if (mainline?.repair_eligible) {
    return i18next.t('projectEval:detail.actionRepairReady');
  }

  if (mainline?.replay_eligible) {
    return i18next.t('projectEval:detail.actionReplayReady');
  }

  if (report?.legacy_fallback_used) {
    return i18next.t('projectEval:detail.actionFallback');
  }

  if (mainline?.terminal) {
    return i18next.t('projectEval:detail.actionNoBlocking');
  }

  return i18next.t('projectEval:detail.actionContinueTabs');
}

export default function ProjectEvalDetailPage() {
  const { id: runId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const tokens = useThemeTokens();
  const { t } = useTranslation('projectEval');

  const [run, setRun] = useState<RunDetailView | null>(null);
  const [plan, setPlan] = useState<RunPlanView | null>(null);
  const [mainline, setMainline] = useState<RunMainlineView | null>(null);
  const [report, setReport] = useState<RunReportView | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTabKey, setActiveTabKey] = useState<ProjectEvalDetailTab>('plan');

  const [caseState, setCaseState] = useState<DetailReadState<CaseSelectionResponse>>(() => createIdleReadState());
  const [casePage, setCasePage] = useState(1);
  const [caseStatus, setCaseStatus] = useState<string | undefined>();

  const [evidenceState, setEvidenceState] = useState<DetailReadState<RunEvidenceResponse>>(() => createIdleReadState());
  const [evidencePage, setEvidencePage] = useState(1);
  const [evidenceDecision, setEvidenceDecision] = useState<string | undefined>();
  const caseRequestKeyRef = useRef('');
  const evidenceRequestKeyRef = useRef('');

  const [regenerating, setRegenerating] = useState(false);
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [includeKeys, setIncludeKeys] = useState<string[]>([]);
  const [excludeKeys, setExcludeKeys] = useState<string[]>([]);
  const [applying, setApplying] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const [actionLoading, setActionLoading] = useState(false);
  const [agentId, setAgentId] = useState('');
  const linkedRepairRunID =
    mainline?.latest_linked_repair?.id ??
    report?.mainline?.latest_linked_repair?.id ??
    report?.remediation?.latest_linked_repair?.id;
  const repairNavigationPath = useMemo(
    () => buildProjectEvalRepairPath(runId, linkedRepairRunID),
    [linkedRepairRunID, runId]
  );
  const renderRepairRunLink = useCallback(
    (repairRunID?: string) => {
      if (!repairRunID?.trim()) {
        return '-';
      }

      return (
        <Button type="link" style={{ paddingInline: 0 }} onClick={() => navigate(buildProjectEvalRepairPath(runId, repairRunID))}>
          {repairRunID}
        </Button>
      );
    },
    [navigate, runId]
  );
  const renderProjectEvalLink = useCallback(
    (projectEvalRunID?: string) => {
      if (!projectEvalRunID?.trim()) {
        return '-';
      }

      return (
        <Button type="link" style={{ paddingInline: 0 }} onClick={() => navigate(`/project-eval/${projectEvalRunID}`)}>
          {projectEvalRunID}
        </Button>
      );
    },
    [navigate]
  );

  const fetchInitial = useCallback(async () => {
    if (!runId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const [runResult, planResult, mainlineResult, reportResult] = await Promise.allSettled([
        projectEvalService.getRun(runId),
        projectEvalService.getRunPlan(runId),
        projectEvalService.getMainline(runId),
        projectEvalService.getRunReport(runId),
      ]);

      if (runResult.status !== 'fulfilled') {
        throw runResult.reason;
      }

      setRun(runResult.value as unknown as RunDetailView);
      setPlan(planResult.status === 'fulfilled' ? (planResult.value as unknown as RunPlanView) : null);
      setMainline(mainlineResult.status === 'fulfilled' ? (mainlineResult.value as unknown as RunMainlineView) : null);
      setReport(reportResult.status === 'fulfilled' ? (reportResult.value as unknown as RunReportView) : null);
    } catch (error) {
      setRun(null);
      setPlan(null);
      setMainline(null);
      setReport(null);
      message.error(getErrorMessage(error, 'Failed to load the project evaluation run.'));
    } finally {
      setLoading(false);
    }
  }, [runId]);

  const fetchCaseSelections = useCallback(
    async (page: number, status?: string) => {
      if (!runId) {
        return;
      }

      const requestKey = buildCaseSelectionRequestKey(page, status);
      caseRequestKeyRef.current = requestKey;
      setCasePage(page);
      setCaseState((current) => beginReadLoad(current, requestKey));
      try {
        const response = await projectEvalService.listCaseSelections(
          runId,
          {
            page,
            page_size: 10,
            status: status || undefined,
          },
          { silentError: true }
        );
        if (caseRequestKeyRef.current !== requestKey) {
          return;
        }
        setCaseState(completeReadLoad(requestKey, response as unknown as CaseSelectionResponse));
      } catch (error) {
        if (caseRequestKeyRef.current !== requestKey) {
          return;
        }
        const rateLimit = extractApiRateLimitError(error);
        setCaseState((current) =>
          failReadLoad(
            current,
            requestKey,
            buildReadErrorMessage('Case selection', error, 'Failed to load case selection.'),
            rateLimit
          )
        );
      }
    },
    [runId]
  );

  const fetchEvidence = useCallback(
    async (page: number, decision?: string) => {
      if (!runId) {
        return;
      }

      const requestKey = buildEvidenceRequestKey(page, decision);
      evidenceRequestKeyRef.current = requestKey;
      setEvidencePage(page);
      setEvidenceState((current) => beginReadLoad(current, requestKey));
      try {
        const response = await projectEvalService.listEvidence(
          runId,
          {
            page,
            page_size: 10,
            decision: decision || undefined,
          },
          { silentError: true }
        );
        if (evidenceRequestKeyRef.current !== requestKey) {
          return;
        }
        setEvidenceState(completeReadLoad(requestKey, response as unknown as RunEvidenceResponse));
      } catch (error) {
        if (evidenceRequestKeyRef.current !== requestKey) {
          return;
        }
        const rateLimit = extractApiRateLimitError(error);
        setEvidenceState((current) =>
          failReadLoad(
            current,
            requestKey,
            buildReadErrorMessage('Evidence records', error, 'Failed to load evidence records.'),
            rateLimit
          )
        );
      }
    },
    [runId]
  );

  useEffect(() => {
    void fetchInitial();
  }, [fetchInitial]);

  useEffect(() => {
    setActiveTabKey('plan');
    caseRequestKeyRef.current = '';
    evidenceRequestKeyRef.current = '';
    setCaseState(createIdleReadState());
    setCasePage(1);
    setCaseStatus(undefined);
    setEvidenceState(createIdleReadState());
    setEvidencePage(1);
    setEvidenceDecision(undefined);
    setIncludeKeys([]);
    setExcludeKeys([]);
    setAgentId('');
  }, [runId]);

  useEffect(() => {
    if (activeTabKey === 'plan' && caseState.status === 'idle') {
      void fetchCaseSelections(casePage, caseStatus);
    }

    if (activeTabKey === 'evidence' && evidenceState.status === 'idle') {
      void fetchEvidence(evidencePage, evidenceDecision);
    }
  }, [
    activeTabKey,
    casePage,
    caseState.status,
    caseStatus,
    evidenceDecision,
    evidencePage,
    evidenceState.status,
    fetchCaseSelections,
    fetchEvidence,
  ]);

  const handleRegenerate = useCallback(async () => {
    if (!runId) {
      return;
    }

    setRegenerating(true);
    try {
      await projectEvalService.regeneratePlan(runId);
      message.success(t('detail.planRegenerated'));
      await fetchInitial();
      void fetchCaseSelections(1, caseStatus);
    } catch (error) {
      message.error(getErrorMessage(error, t('detail.planRegenerateFailed')));
    } finally {
      setRegenerating(false);
    }
  }, [caseStatus, fetchCaseSelections, fetchInitial, runId, t]);

  const handleApplyOverrides = useCallback(async () => {
    if (!runId) {
      return;
    }

    setApplying(true);
    try {
      const payload: ApplyOverridesRequest = {};
      if (includeKeys.length > 0) {
        payload.include_case_keys = includeKeys;
      }
      if (excludeKeys.length > 0) {
        payload.exclude_case_keys = excludeKeys;
      }

      await projectEvalService.applyOverrides(runId, payload);
      message.success(t('detail.caseOverrideApplied'));
      setOverrideModalOpen(false);
      setIncludeKeys([]);
      setExcludeKeys([]);
      await fetchInitial();
      void fetchCaseSelections(1, caseStatus);
    } catch (error) {
      message.error(getErrorMessage(error, t('detail.caseOverrideFailed')));
    } finally {
      setApplying(false);
    }
  }, [caseStatus, excludeKeys, fetchCaseSelections, fetchInitial, includeKeys, runId, t]);

  const handleConfirm = useCallback(async () => {
    if (!runId) {
      return;
    }

    setConfirming(true);
    try {
      await projectEvalService.confirmRun(runId);
      message.success(t('detail.runConfirmed'));
      await fetchInitial();
    } catch (error) {
      message.error(getErrorMessage(error, t('detail.runConfirmFailed')));
    } finally {
      setConfirming(false);
    }
  }, [fetchInitial, runId, t]);

  const handleMainlineAction = useCallback(
    async (action: string) => {
      if (!runId || !mainline) {
        return;
      }

      const descriptor =
        mainline.available_actions.find((item) => item.action === action) ?? mainline.primary_action;

      if (descriptor?.required_inputs?.includes('agent_id') && !agentId.trim()) {
        message.warning(t('detail.agentIdRequired'));
        return;
      }

      setActionLoading(true);
      try {
        const payload: { agent_id?: string; snapshot_guard?: SnapshotGuard } = {};

        if (descriptor?.required_inputs?.includes('agent_id')) {
          payload.agent_id = agentId.trim();
        }

        if (descriptor?.snapshot_guard_required && mainline.snapshot_guard) {
          payload.snapshot_guard = mainline.snapshot_guard;
        }

        const response = await projectEvalService.executeMainlineAction(runId, action, payload);
        const result = response as unknown as MainlineActionResult;

        if (result.disposition === 'already_satisfied') {
          message.info(t('detail.actionAlreadySatisfied'));
        } else {
          message.success(t('detail.actionCompleted'));
        }

        await fetchInitial();
      } catch (error) {
        const response = (error as { response?: { status?: number } })?.response;
        if (response?.status === 409) {
          message.error(t('detail.actionStaleSnapshot'));
        } else {
          message.error(getErrorMessage(error, t('detail.actionFailed')));
        }
      } finally {
        setActionLoading(false);
      }
    },
    [agentId, fetchInitial, mainline, runId, t]
  );

  const caseData = caseState.data;
  const caseLoading = caseState.status === 'loading';
  const evidenceData = evidenceState.data;
  const evidenceLoading = evidenceState.status === 'loading';
  const decisionTone = getDecisionTone(report?.decision ?? run?.decision);
  const statusTone = getStatusTone(report?.status ?? run?.status);
  const evidenceSummary = evidenceData?.summary ?? report?.evidence_summary;
  const evidencePosture = report?.evidence_posture ?? run?.evidence_posture;
  const selectedCaseCount =
    plan?.selected_case_count ??
    plan?.case_selection_summary?.selected_case_count ??
    report?.selected_case_count ??
    evidenceSummary?.selected_cases ??
    0;
  const currentStageIndex = mainline?.stage ? FLAT_MAINLINE_STAGES.indexOf(mainline.stage) : -1;
  const whyThisVerdict = useMemo(() => buildWhyThisVerdict(run, plan, report, mainline), [mainline, plan, report, run]);
  const nextActionCopy = useMemo(() => buildNextActionCopy(run, mainline, report), [mainline, report, run]);
  const nonAuthoritativeDescription = evidencePosture?.insufficient_evidence
    ? getEvidenceInsufficientReasonLabel(evidencePosture.insufficient_evidence_reason)
    : evidencePosture && !evidencePosture.authoritative_ready
      ? t('detail.evidencePostureNotReadyDesc', {
          status: getEvidencePostureStatusLabel(evidencePosture.status),
          truthSource: getEvidenceTruthSourceLabel(evidencePosture.truth_source_mode),
        })
      : t('report.notAuthoritativeDesc');
  const statusCounts = useMemo(() => Object.entries(plan?.case_selection_summary?.status_counts ?? {}), [plan?.case_selection_summary?.status_counts]);
  const reasonCounts = useMemo(() => Object.entries(plan?.case_selection_summary?.reason_counts ?? {}), [plan?.case_selection_summary?.reason_counts]);
  const benchmarkCounts = useMemo(() => Object.entries(plan?.case_selection_summary?.selected_benchmark_counts ?? {}), [plan?.case_selection_summary?.selected_benchmark_counts]);
  const reportCaseStatusCounts = useMemo(() => readCountMap(report?.case_selection_summary, 'status_counts'), [report?.case_selection_summary]);
  const reportCaseReasonCounts = useMemo(() => readCountMap(report?.case_selection_summary, 'reason_counts'), [report?.case_selection_summary]);

  useEffect(() => {
    if (!run) {
      return;
    }

    saveRecentProjectEvalRun({
      id: run.id,
      status: run.status,
      decision: run.decision,
      score: run.score,
      projectType: run.project_type,
      mode: run.mode,
      updatedAt: run.updated_at,
    });
  }, [run]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 96 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!run || !runId) {
    return (
      <div style={{ padding: '0 24px 24px' }}>
        <PageHeader
          title={t('detail.runTitle')}
          description={t('run.runViewDesc')}
          breadcrumb={[
            { title: t('common.dashboard') },
            { title: t('title') },
            { title: t('detail.runBreadcrumb') },
          ]}
        />
        <Card>
          <Empty description={t('detail.noRunData')} />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <PageHeader
        title={t('detail.runTitle')}
        description={t('run.runViewDesc')}
        breadcrumb={[{ title: t('common.dashboard') }, { title: t('title') }, { title: runId }]}
        extra={
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => void fetchInitial()}>
              {t('detail.refresh')}
            </Button>
            <Button icon={<FileSearchOutlined />} onClick={() => navigate(`/project-eval/${runId}/report`)}>
              {t('detail.viewReport')}
            </Button>
            <Button icon={<QuestionCircleOutlined />} onClick={() => navigate(`/project-eval/${runId}/explain`)}>
              {t('detail.viewExplain')}
            </Button>
            <Button icon={<ToolOutlined />} onClick={() => navigate(repairNavigationPath)}>
              {t('detail.viewRepairRuns')}
            </Button>
          </Space>
        }
      />

      {report?.legacy_fallback_used && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('report.fallbackNotice')}
          description={report.legacy_fallback_reason || t('detail.fallbackBeforeFinal')}
        />
      )}

      {report && !report.authoritative_truth && !report.legacy_fallback_used && (
        <Alert
          type={evidencePosture ? getEvidencePostureAlertType(evidencePosture) : 'info'}
          showIcon
          style={{ marginBottom: 16 }}
          message={t('report.notAuthoritative')}
          description={nonAuthoritativeDescription}
        />
      )}

      {run.error_message && (
        <Alert
          type="error"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('detail.runReportError')}
          description={run.error_message}
        />
      )}

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
                <Tag color={decisionTone.color}>{decisionTone.label}</Tag>
                <Tag color={statusTone.color}>{statusTone.label}</Tag>
                <Tag>{getProjectTypeLabel(run.project_type)}</Tag>
                <Tag>{getRunModeLabel(run.mode)}</Tag>
                <Tag>{getScopeLabel(run.scope)}</Tag>
                {report?.authoritative_truth && <Tag color="success">{t('detail.authoritative')}</Tag>}
                {evidencePosture && (
                  <Tag color={getEvidencePostureStatusColor(evidencePosture)}>
                    {getEvidencePostureStatusLabel(evidencePosture.status)}
                  </Tag>
                )}
                {evidencePosture && (evidencePosture.missing_current_run_execution_cases ?? 0) > 0 && (
                  <Tag color="gold">
                    {t('detail.missingCurrentRunValidationTag', {
                      count: evidencePosture.missing_current_run_execution_cases,
                    })}
                  </Tag>
                )}
              </Space>

              <div>
                <Title level={3} style={{ marginBottom: 8 }}>
                  {t('detail.currentDecision', { decision: decisionTone.label })}
                </Title>
                <Paragraph style={{ marginBottom: 0 }}>{whyThisVerdict}</Paragraph>
              </div>

              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic title={t('detail.score')} value={run.score} precision={1} />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic title={t('detail.selectedCasesStat')} value={selectedCaseCount} />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic title={t('detail.evaluatedCasesStat')} value={evidenceSummary?.evaluated_cases ?? 0} />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Statistic title={t('detail.linkedRepair')} value={report?.remediation?.linked_repair_count ?? 0} />
                </Col>
              </Row>
            </Space>
          </Card>
        </Col>

        <Col xs={24} xl={9}>
          <Card title={t('detail.nextAction')} style={{ height: '100%' }}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Space wrap>
                <Tag>{getStageLabel(mainline?.stage ?? report?.mainline?.stage)}</Tag>
                {mainline?.repair_eligible && <Tag color="warning">{t('detail.repairEligible')}</Tag>}
                {mainline?.replay_eligible && <Tag color="blue">{t('detail.replayEligible')}</Tag>}
                {mainline?.terminal && <Tag>{t('detail.terminal')}</Tag>}
              </Space>

              <Text strong>
                {run.status === 'planned'
                  ? t('detail.confirmAndStart')
                  : getMainlineActionText(mainline?.primary_action?.action)}
              </Text>

              <Paragraph style={{ marginBottom: 0 }}>{nextActionCopy}</Paragraph>

              {run.status !== 'planned' && mainline?.primary_action?.required_inputs?.includes('agent_id') && (
                <Input
                  placeholder={t('detail.agentIdPlaceholder')}
                  value={agentId}
                  onChange={(event) => setAgentId(event.target.value)}
                />
              )}

              {run.status !== 'planned' && mainline?.primary_action?.snapshot_guard_required && (
                <Alert
                  type="info"
                  showIcon
                  message={t('detail.snapshotGuardMessage')}
                  description={t('detail.snapshotGuardDesc')}
                />
              )}

              <Space wrap>
                {run.status === 'planned' ? (
                  <Popconfirm
                    title={t('detail.confirmStartRunTitle')}
                    description={t('detail.confirmStartRunDesc')}
                    onConfirm={handleConfirm}
                    okText={t('detail.startRunOkText')}
                    cancelText={t('detail.cancel')}
                  >
                    <Button type="primary" icon={<CheckCircleOutlined />} loading={confirming}>
                      {t('detail.confirmStart')}
                    </Button>
                  </Popconfirm>
                ) : mainline?.primary_action ? (
                  <Popconfirm
                    title={t('detail.runActionTitle', { action: getMainlineActionText(mainline.primary_action.action) })}
                    description={
                      mainline.primary_action.snapshot_guard_required
                        ? t('detail.snapshotActionDesc')
                        : t('detail.lifecycleActionDesc')
                    }
                    onConfirm={() => void handleMainlineAction(mainline.primary_action!.action)}
                    okText={t('detail.executeAction')}
                    cancelText={t('detail.cancel')}
                  >
                    <Button type="primary" icon={<ThunderboltOutlined />} loading={actionLoading}>
                      {getMainlineActionText(mainline.primary_action.action)}
                    </Button>
                  </Popconfirm>
                ) : (
                  <Button icon={<HistoryOutlined />} onClick={() => setActiveTabKey('mainline')}>
                    {t('detail.openLifecycleTab')}
                  </Button>
                )}

                <Button icon={<FileSearchOutlined />} onClick={() => navigate(`/project-eval/${runId}/report`)}>
                  {t('detail.viewReport')}
                </Button>
                <Button icon={<QuestionCircleOutlined />} onClick={() => navigate(`/project-eval/${runId}/explain`)}>
                  {t('detail.viewExplain')}
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={12}>
          <Card title={t('detail.runPosture')} style={{ height: '100%' }}>
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label={t('detail.runId')}>{run.id}</Descriptions.Item>
              <Descriptions.Item label={t('detail.decision')}>{decisionTone.label}</Descriptions.Item>
              <Descriptions.Item label={t('detail.status')}>{statusTone.label}</Descriptions.Item>
              <Descriptions.Item label={t('detail.projectType')}>{getProjectTypeLabel(run.project_type)}</Descriptions.Item>
              <Descriptions.Item label={t('detail.runMode')}>{getRunModeLabel(run.mode)}</Descriptions.Item>
              <Descriptions.Item label={t('detail.scope')}>{getScopeLabel(run.scope)}</Descriptions.Item>
              {evidencePosture && (
                <>
                  <Descriptions.Item label={t('detail.evidencePosture')}>
                    <Tag color={getEvidencePostureStatusColor(evidencePosture)}>
                      {getEvidencePostureStatusLabel(evidencePosture.status)}
                    </Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label={t('detail.truthSource')}>
                    {getEvidenceTruthSourceLabel(evidencePosture.truth_source_mode)}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('detail.currentRunValidation')}>
                    {formatEvidencePostureCount(evidencePosture.current_run_execution_cases)}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('detail.missingCurrentRunValidation')}>
                    {formatEvidencePostureCount(evidencePosture.missing_current_run_execution_cases)}
                  </Descriptions.Item>
                  {evidencePosture.insufficient_evidence_reason && (
                    <Descriptions.Item label={t('detail.insufficientEvidenceReason')}>
                      {getEvidenceInsufficientReasonLabel(evidencePosture.insufficient_evidence_reason)}
                    </Descriptions.Item>
                  )}
                </>
              )}
              <Descriptions.Item label={t('detail.planVersion')}>v{run.plan_version}</Descriptions.Item>
              <Descriptions.Item label={t('detail.createdBy')}>{run.created_by || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('detail.createdAt')}>{formatDateTime(run.created_at)}</Descriptions.Item>
              <Descriptions.Item label={t('detail.updatedAt')}>{formatDateTime(run.updated_at)}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>

        <Col xs={24} lg={12}>
          <Card title={t('detail.lifecycleAndRepair')} style={{ height: '100%' }}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Text type="secondary">{t('detail.currentStage', { stage: getStageLabel(mainline?.stage ?? report?.mainline?.stage) })}</Text>
              <Paragraph style={{ marginBottom: 0 }}>
                {mainline?.explain ||
                  report?.mainline?.explain ||
                  t('detail.lifecycleSummary')}
              </Paragraph>

              {mainline?.latest_linked_repair && (
                <Descriptions size="small" column={1} bordered>
                  <Descriptions.Item label={t('detail.latestRepair')}>
                    {renderRepairRunLink(mainline.latest_linked_repair.id)}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('detail.repairState')}>{humanizeKey(mainline.latest_linked_repair.state)}</Descriptions.Item>
                  <Descriptions.Item label={t('detail.replayState')}>{humanizeKey(mainline.latest_linked_repair.replay_status)}</Descriptions.Item>
                  <Descriptions.Item label={t('detail.replayProjectEval')}>
                    {renderProjectEvalLink(mainline.latest_linked_repair.replay_project_eval_run_id)}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('detail.updatedAt')}>{formatDateTime(mainline.latest_linked_repair.updated_at)}</Descriptions.Item>
                </Descriptions>
              )}

              {mainline?.latest_remediation_outcome && (
                <Tag color="blue">{getRemediationCategoryLabel(mainline.latest_remediation_outcome.category)}</Tag>
              )}
            </Space>
          </Card>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTabKey}
        onChange={(key) => setActiveTabKey(key as ProjectEvalDetailTab)}
        items={[
          {
            key: 'stages',
            label: t('detail.tabStages'),
            children: (
              <ProjectEvalStageProgressPanel
                runId={runId}
                planVersion={run.plan_version}
                title={t('detail.stageProgressTitle')}
                onStageRetried={() => fetchInitial()}
              />
            ),
          },          {
            key: 'plan',
            label: t('detail.tabPlan'),
            children: plan ? (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Card title={t('detail.planSummary')}>
                  <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={12} lg={6}>
                      <Statistic
                        title={t('detail.candidateBenchmarksTitle')}
                        value={plan.case_selection_summary?.candidate_benchmark_count ?? 0}
                      />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <Statistic title={t('detail.candidateCases')} value={plan.case_selection_summary?.candidate_case_count ?? 0} />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <Statistic title={t('detail.selectedCasesTitle')} value={plan.selected_case_count ?? 0} />
                    </Col>
                    <Col xs={24} sm={12} lg={6}>
                      <Statistic title={t('detail.approvedPlanVersion')} value={plan.approved_plan_version ?? 0} />
                    </Col>
                  </Row>

                  <Descriptions size="small" column={1} bordered>
                    <Descriptions.Item label={t('detail.planVersion')}>v{plan.plan_version}</Descriptions.Item>
                    <Descriptions.Item label={t('detail.isApprovalRequired')}>{plan.approval_required ? t('detail.yes') : t('detail.no')}</Descriptions.Item>
                    <Descriptions.Item label={t('detail.isApproved')}>{plan.approved ? t('detail.yes') : t('detail.no')}</Descriptions.Item>
                    <Descriptions.Item label={t('detail.approvedBy')}>{plan.approved_by || '-'}</Descriptions.Item>
                    <Descriptions.Item label={t('detail.approvedAt')}>{formatDateTime(plan.approved_at)}</Descriptions.Item>
                    <Descriptions.Item label={t('detail.candidateBenchmarksTitle')}>
                      {plan.candidate_benchmark_ids?.length > 0 ? plan.candidate_benchmark_ids.join(', ') : '-'}
                    </Descriptions.Item>
                  </Descriptions>

                  {(statusCounts.length > 0 || reportCaseStatusCounts.length > 0) && (
                    <div style={{ marginTop: 16 }}>
                      <Text strong>{t('detail.statusDistribution')}</Text>
                      <div style={{ marginTop: 8 }}>
                        {(statusCounts.length > 0 ? statusCounts : reportCaseStatusCounts).map(([name, count]) => {
                          const tone = getSelectionStatusTone(name);
                          return (
                            <Tag key={name} color={tone.color}>
                              {tone.label}: {count}
                            </Tag>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {(reasonCounts.length > 0 || reportCaseReasonCounts.length > 0) && (
                    <div style={{ marginTop: 16 }}>
                      <Text strong>{t('detail.selectionReason')}</Text>
                      <div style={{ marginTop: 8 }}>
                        {(reasonCounts.length > 0 ? reasonCounts : reportCaseReasonCounts).map(([name, count]) => (
                          <Tag key={name}>
                            {getSelectionReasonLabel(name)}: {count}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}

                  {benchmarkCounts.length > 0 && (
                    <div style={{ marginTop: 16 }}>
                      <Text strong>{t('detail.benchmarkDistribution')}</Text>
                      <div style={{ marginTop: 8 }}>
                        {benchmarkCounts.map(([name, count]) => (
                          <Tag key={name}>
                            {name}: {count}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  )}
                </Card>

                {run.status === 'planned' && (
                  <Card title={t('detail.planControl')}>
                    <Space wrap>
                      <Button icon={<ReloadOutlined />} onClick={() => void handleRegenerate()} loading={regenerating}>
                        {t('detail.regeneratePlan')}
                      </Button>
                      <Button icon={<EditOutlined />} onClick={() => setOverrideModalOpen(true)}>
                        {t('detail.overrideCaseSelection')}
                      </Button>
                      <Popconfirm
                        title={t('detail.confirmStartRunTitle')}
                        description={t('run.confirmDesc')}
                        onConfirm={handleConfirm}
                        okText={t('detail.startRunOkText')}
                        cancelText={t('detail.cancel')}
                      >
                        <Button type="primary" icon={<CheckCircleOutlined />} loading={confirming}>
                          {t('detail.confirmStart')}
                        </Button>
                      </Popconfirm>
                    </Space>
                  </Card>
                )}

                <Card
                  title={t('caseSelection.title')}
                  extra={
                    <Button
                      size="small"
                      icon={<ReloadOutlined />}
                      loading={caseLoading}
                      onClick={() => void fetchCaseSelections(casePage, caseStatus)}
                    >
                      {t('detail.refresh')}
                    </Button>
                  }
                >
                  <div style={{ marginBottom: 12 }}>
                    <Space wrap>
                      <Text strong>{t('detail.filterByStatus')}</Text>
                      <Select
                        allowClear
                        placeholder={t('detail.allStatusPlaceholder')}
                        style={{ width: 220 }}
                        value={caseStatus}
                        onChange={(value) => {
                          const nextValue = value || undefined;
                          setCaseStatus(nextValue);
                          void fetchCaseSelections(1, nextValue);
                        }}
                        options={CASE_SELECTION_FILTERS.map((value) => ({
                          value,
                          label: getSelectionStatusTone(value).label,
                        }))}
                      />
                    </Space>
                  </div>

                  {caseState.status === 'error' && caseState.errorMessage && (
                    <Alert
                      type="error"
                      showIcon
                      style={{ marginBottom: 12 }}
                      message={caseState.errorMessage}
                      description={caseState.rateLimit ? buildRateLimitDescription(caseState.rateLimit) : undefined}
                      action={
                        <Button size="small" onClick={() => void fetchCaseSelections(casePage, caseStatus)}>
                          {t('detail.retry')}
                        </Button>
                      }
                    />
                  )}

                  <Table<CaseSelectionResponse['items'][number]>
                    rowKey="id"
                    size="small"
                    loading={caseLoading}
                    dataSource={caseData?.items || []}
                    scroll={{ x: 980 }}
                    locale={{
                      emptyText:
                        caseState.status === 'error' && !caseData
                          ? t('detail.caseLoadFailed')
                          : undefined,
                    }}
                    pagination={{
                      current: casePage,
                      pageSize: 10,
                      total: caseData?.total || 0,
                      onChange: (page) => {
                        void fetchCaseSelections(page, caseStatus);
                      },
                    }}
                    expandable={{
                      expandedRowRender: (record) => (
                        <Space direction="vertical" size={12} style={{ width: '100%' }}>
                          <Descriptions size="small" column={3} bordered>
                            <Descriptions.Item label={t('detail.selectionRank')}>{record.selection_rank}</Descriptions.Item>
                            <Descriptions.Item label={t('detail.matchScore')}>{record.match_score.toFixed(3)}</Descriptions.Item>
                            <Descriptions.Item label={t('detail.coverageScore')}>{record.coverage_score.toFixed(3)}</Descriptions.Item>
                            <Descriptions.Item label={t('detail.changeMatch')}>{record.change_match_score.toFixed(3)}</Descriptions.Item>
                            <Descriptions.Item label={t('detail.historyScore')}>{record.history_score.toFixed(3)}</Descriptions.Item>
                            <Descriptions.Item label={t('detail.riskScore')}>{record.risk_score.toFixed(3)}</Descriptions.Item>
                            <Descriptions.Item label={t('detail.freshnessScore')}>{record.freshness_score.toFixed(3)}</Descriptions.Item>
                            <Descriptions.Item label={t('detail.benchmark')}>{record.benchmark_id}</Descriptions.Item>
                            <Descriptions.Item label={t('detail.rowCreatedAt')}>{formatDateTime(record.created_at)}</Descriptions.Item>
                          </Descriptions>

                          <Collapse
                            items={[
                              {
                                key: 'truth-summary',
                                label: t('detail.caseTruthSummary'),
                                children: renderCaseSelectionTruthPanel(record),
                              },
                              {
                                key: 'evidence-summary',
                                label: t('detail.rawSelectionEvidence'),
                                children: renderJsonBlock(
                                  record.evidence_summary,
                                  t('detail.noSelectionEvidence'),
                                  tokens
                                ),
                              },
                              {
                                key: 'decision-trace',
                                label: t('detail.rawDecisionChain'),
                                children: renderJsonBlock(
                                  record.decision_trace,
                                  t('detail.noDecisionChain'),
                                  tokens
                                ),
                              },
                            ]}
                          />
                        </Space>
                      ),
                    }}
                    columns={[
                      {
                        title: t('detail.sortCol'),
                        dataIndex: 'selection_rank',
                        key: 'selection_rank',
                        width: 80,
                      },
                      {
                        title: t('detail.caseKey'),
                        dataIndex: 'case_key',
                        key: 'case_key',
                        width: 260,
                        ellipsis: true,
                      },
                      {
                        title: t('detail.statusCol'),
                        dataIndex: 'selection_status',
                        key: 'selection_status',
                        width: 140,
                        render: (value: string) => {
                          const tone = getSelectionStatusTone(value);
                          return <Tag color={tone.color}>{tone.label}</Tag>;
                        },
                      },
                      {
                        title: t('detail.reasonCol'),
                        dataIndex: 'selection_reason',
                        key: 'selection_reason',
                        width: 220,
                        ellipsis: true,
                        render: (value: string) => getSelectionReasonLabel(value),
                      },
                      {
                        title: t('detail.benchmark'),
                        dataIndex: 'benchmark_id',
                        key: 'benchmark_id',
                        width: 180,
                        ellipsis: true,
                      },
                      {
                        title: t('detail.matchCol'),
                        dataIndex: 'match_score',
                        key: 'match_score',
                        width: 90,
                        render: (value: number) => value.toFixed(2),
                      },
                      {
                        title: t('detail.coverageCol'),
                        dataIndex: 'coverage_score',
                        key: 'coverage_score',
                        width: 100,
                        render: (value: number) => value.toFixed(2),
                      },
                    ]}
                  />
                </Card>

                <Card title={t('detail.generatedPayload')}>
                  {renderJsonBlock(plan.plan ?? run.plan, t('detail.noPayload'), tokens)}
                </Card>
              </Space>
            ) : (
              <Card>
                <Empty description={t('detail.noPlanData')} />
              </Card>
            ),
          },
          {
            key: 'evidence',
            label: t('detail.tabEvidence'),
            children: (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Card title={t('detail.evidenceSummary')}>
                  {evidenceSummary ? (
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12} lg={6}>
                        <Statistic title={t('detail.selectedCasesTitle')} value={evidenceSummary.selected_cases} />
                      </Col>
                      <Col xs={24} sm={12} lg={6}>
                        <Statistic title={t('evidence.evaluatedCases')} value={evidenceSummary.evaluated_cases} />
                      </Col>
                      <Col xs={24} sm={12} lg={6}>
                        <Statistic title={t('evidence.pass')} value={evidenceSummary.pass_cases} valueStyle={{ color: '#10b981' }} />
                      </Col>
                      <Col xs={24} sm={12} lg={6}>
                        <Statistic title={t('evidence.warn')} value={evidenceSummary.warn_cases} valueStyle={{ color: '#faad14' }} />
                      </Col>
                      <Col xs={24} sm={12} lg={6}>
                        <Statistic title={t('evidence.block')} value={evidenceSummary.block_cases} valueStyle={{ color: '#ef4444' }} />
                      </Col>
                      <Col xs={24} sm={12} lg={6}>
                        <Statistic title={t('evidence.avgScore')} value={evidenceSummary.average_case_score} precision={1} />
                      </Col>
                      <Col xs={24} sm={12} lg={6}>
                        <Statistic title={t('evidence.confidence')} value={formatConfidence(evidenceSummary.average_confidence)} />
                      </Col>
                      <Col xs={24} sm={12} lg={6}>
                        <Statistic title={t('evidence.coverageRate')} value={formatCoverage(evidenceSummary.coverage_score)} />
                      </Col>
                    </Row>
                  ) : (
                    <Empty
                      image={Empty.PRESENTED_IMAGE_SIMPLE}
                      description={t('evidence.noSummary')}
                    />
                  )}
                </Card>

                <Card
                  title={t('detail.evidenceRecords')}
                  extra={
                    <Button
                      size="small"
                      icon={<ReloadOutlined />}
                      loading={evidenceLoading}
                      onClick={() => void fetchEvidence(evidencePage, evidenceDecision)}
                    >
                      {t('detail.refresh')}
                    </Button>
                  }
                >
                  <div style={{ marginBottom: 12 }}>
                    <Space wrap>
                      <Text strong>{t('detail.filterByDecision')}</Text>
                      <Select
                        allowClear
                        placeholder={t('detail.allDecisionsPlaceholder')}
                        style={{ width: 220 }}
                        value={evidenceDecision}
                        onChange={(value) => {
                          const nextValue = value || undefined;
                          setEvidenceDecision(nextValue);
                          void fetchEvidence(1, nextValue);
                        }}
                        options={EVIDENCE_DECISION_FILTERS.map((value) => ({
                          value,
                          label: getDecisionTone(value).label,
                        }))}
                      />
                    </Space>
                  </div>

                  {evidenceState.status === 'error' && evidenceState.errorMessage && (
                    <Alert
                      type="error"
                      showIcon
                      style={{ marginBottom: 12 }}
                      message={evidenceState.errorMessage}
                      description={evidenceState.rateLimit ? buildRateLimitDescription(evidenceState.rateLimit) : undefined}
                      action={
                        <Button size="small" onClick={() => void fetchEvidence(evidencePage, evidenceDecision)}>
                          {t('detail.retry')}
                        </Button>
                      }
                    />
                  )}

                  <Table<RunEvidenceResponse['items'][number]>
                    rowKey="id"
                    size="small"
                    loading={evidenceLoading}
                    dataSource={evidenceData?.items || []}
                    scroll={{ x: 1160 }}
                    locale={{
                      emptyText:
                        evidenceState.status === 'error' && !evidenceData
                          ? t('detail.loadEvidenceFailed')
                          : undefined,
                    }}
                    pagination={{
                      current: evidencePage,
                      pageSize: 10,
                      total: evidenceData?.total || 0,
                      onChange: (page) => {
                        void fetchEvidence(page, evidenceDecision);
                      },
                    }}
                    expandable={{
                      expandedRowRender: (record) => (
                        <Space direction="vertical" size={12} style={{ width: '100%' }}>
                          {record.warnings && record.warnings.length > 0 && (
                            <Alert
                              type="warning"
                              showIcon
                              message={t('detail.warningsMsg', { warnings: record.warnings.join(', ') })}
                            />
                          )}

                          <Collapse
                            items={[
                              {
                                key: 'binding',
                                label: t('detail.bindingPayload'),
                                children: renderJsonBlock(
                                  record.binding,
                                  t('detail.noBindingPayload'),
                                  tokens
                                ),
                              },
                              {
                                key: 'static',
                                label: t('detail.staticSignals'),
                                children: renderJsonBlock(
                                  record.provenance?.static,
                                  t('detail.noStaticSignals'),
                                  tokens
                                ),
                              },
                              {
                                key: 'validation',
                                label: t('detail.validationSignals'),
                                children: renderJsonBlock(
                                  record.provenance?.validation,
                                  t('detail.noValidationSignals'),
                                  tokens
                                ),
                              },
                              {
                                key: 'review',
                                label: t('detail.reviewSignals'),
                                children: renderJsonBlock(
                                  record.provenance?.review,
                                  t('detail.noReviewSignals'),
                                  tokens
                                ),
                              },
                            ]}
                          />
                        </Space>
                      ),
                    }}
                    columns={[
                      {
                        title: t('detail.caseKey'),
                        dataIndex: 'case_key',
                        key: 'case_key',
                        width: 260,
                        ellipsis: true,
                      },
                      {
                        title: t('detail.colDecision'),
                        dataIndex: 'final_decision',
                        key: 'final_decision',
                        width: 100,
                        render: (value: string) => {
                          const tone = getDecisionTone(value);
                          return <Tag color={tone.color}>{tone.label}</Tag>;
                        },
                      },
                      {
                        title: t('detail.colRisk'),
                        dataIndex: 'final_risk_level',
                        key: 'final_risk_level',
                        width: 130,
                        render: (value: string) => {
                          const tone = getRiskTone(value);
                          return <Tag color={tone.color}>{tone.label}</Tag>;
                        },
                      },
                      {
                        title: t('detail.colScore'),
                        dataIndex: 'final_score',
                        key: 'final_score',
                        width: 90,
                        render: (value: number) => formatScore(value),
                      },
                      {
                        title: t('detail.colConfidence'),
                        dataIndex: 'confidence',
                        key: 'confidence',
                        width: 110,
                        render: (value: number) => formatConfidence(value),
                      },
                      {
                        title: t('detail.colCompleteness'),
                        dataIndex: 'evidence_completeness',
                        key: 'evidence_completeness',
                        width: 120,
                        render: (value: number) => formatCoverage(value),
                      },
                      {
                        title: t('detail.colProjectionStatus'),
                        dataIndex: 'projection_status',
                        key: 'projection_status',
                        width: 160,
                        ellipsis: true,
                        render: (value: string) => humanizeKey(value),
                      },
                      {
                        title: t('detail.colInsufficientEvidence'),
                        dataIndex: 'insufficient_evidence',
                        key: 'insufficient_evidence',
                        width: 150,
                        render: (value: boolean) =>
                          value ? <Tag color="error">{t('detail.yes')}</Tag> : <Tag color="success">{t('detail.no')}</Tag>,
                      },
                    ]}
                  />
                </Card>
              </Space>
            ),
          },
          {
            key: 'mainline',
            label: t('detail.tabLifecycle'),
            children: mainline ? (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Card title={t('detail.lifecycleStatus')}>
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <Space wrap>
                      <Tag>{getStageLabel(mainline.stage)}</Tag>
                      {mainline.authoritative_run && <Tag color="success">{t('detail.authoritativeRun')}</Tag>}
                      {mainline.repair_eligible && <Tag color="warning">{t('detail.repairEligible')}</Tag>}
                      {mainline.replay_eligible && <Tag color="blue">{t('detail.replayEligible')}</Tag>}
                      {mainline.terminal && <Tag>{t('detail.terminal')}</Tag>}
                    </Space>

                    <Paragraph style={{ marginBottom: 0 }}>
                      {mainline.explain || t('detail.useViewToUnderstand')}
                    </Paragraph>

                    <Descriptions size="small" column={1} bordered>
                      <Descriptions.Item label={t('detail.lifecycleStage')}>{getStageLabel(mainline.stage)}</Descriptions.Item>
                      <Descriptions.Item label={t('detail.lifecycleNextAction')}>{getMainlineActionText(mainline.next_action)}</Descriptions.Item>
                      <Descriptions.Item label={t('detail.primaryAction')}>
                        {getMainlineActionText(mainline.primary_action?.action)}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('detail.isAuthoritative')}>
                        {mainline.authoritative_run ? t('detail.yes') : t('detail.no')}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('detail.canRepair')}>
                        {mainline.repair_eligible ? t('detail.yes') : t('detail.no')}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('detail.canReplay')}>
                        {mainline.replay_eligible ? t('detail.yes') : t('detail.no')}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('detail.isTerminal')}>{mainline.terminal ? t('detail.yes') : t('detail.no')}</Descriptions.Item>
                      <Descriptions.Item label={t('detail.outcomeAuthority')}>
                        {getOutcomeAuthorityLabel(mainline.outcome_authority_source)}
                      </Descriptions.Item>
                    </Descriptions>
                  </Space>
                </Card>

                <Card title={t('detail.lifecycleRoadmap')}>
                  <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
                    {t('detail.stageSequence', { sequence: MAINLINE_STAGE_GROUPS.map((group) => group.label).join(' -> ') })}
                  </Text>
                  <Steps
                    direction="vertical"
                    size="small"
                    current={currentStageIndex >= 0 ? currentStageIndex : 0}
                    items={FLAT_MAINLINE_STAGES.map((stage, index) => ({
                      title: (
                        <Space wrap>
                          <span>{getStageLabel(stage)}</span>
                          {index === currentStageIndex && <Tag color="blue">{t('detail.currentTag')}</Tag>}
                        </Space>
                      ),
                      description:
                        index === currentStageIndex && mainline.explain ? (
                          <Text type="secondary">{mainline.explain}</Text>
                        ) : undefined,
                      status: index < currentStageIndex ? 'finish' : index === currentStageIndex ? 'process' : 'wait',
                    }))}
                  />
                </Card>

                <Card title={t('detail.actionControl')}>
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <Space wrap>
                      {mainline.available_actions.length > 0 ? (
                        mainline.available_actions.map((action) => (
                          <Tag key={action.action}>{getMainlineActionText(action.action)}</Tag>
                        ))
                      ) : (
                        <Text type="secondary">{t('detail.noLifecycleAction')}</Text>
                      )}
                    </Space>

                    {mainline.primary_action ? (
                      <>
                        <Text strong>{getMainlineActionText(mainline.primary_action.action)}</Text>
                        <Paragraph style={{ marginBottom: 0 }}>
                          {mainline.primary_action_reason || mainline.explain || t('detail.recommendedAction')}
                        </Paragraph>

                        {mainline.primary_action.required_inputs?.includes('agent_id') && (
                          <Input
                            placeholder={t('detail.agentIdPlaceholder')}
                            value={agentId}
                            onChange={(event) => setAgentId(event.target.value)}
                          />
                        )}

                        {mainline.primary_action.snapshot_guard_required && (
                          <Alert
                            type="info"
                            showIcon
                            message={t('detail.snapshotGuardMessage')}
                            description={t('detail.snapshotGuardLifecycle')}
                          />
                        )}

                        <Popconfirm
                          title={t('detail.runActionTitle', { action: getMainlineActionText(mainline.primary_action.action) })}
                          description={t('detail.executeMigration')}
                          onConfirm={() => void handleMainlineAction(mainline.primary_action!.action)}
                          okText={t('detail.executeAction')}
                          cancelText={t('detail.cancel')}
                        >
                          <Button type="primary" icon={<ThunderboltOutlined />} loading={actionLoading}>
                            {getMainlineActionText(mainline.primary_action.action)}
                          </Button>
                        </Popconfirm>
                      </>
                    ) : (
                      <Text type="secondary">{t('detail.noPrimaryAction')}</Text>
                    )}

                    {mainline.snapshot_guard && (
                      <Collapse
                        items={[
                          {
                            key: 'snapshot-guard',
                            label: t('detail.snapshotGuardPayload'),
                            children: renderJsonBlock(mainline.snapshot_guard, undefined, tokens),
                          },
                        ]}
                      />
                    )}
                  </Space>
                </Card>

                {mainline.latest_linked_repair && (
                  <Card title={t('detail.linkedRepairRunTitle')}>
                    <Descriptions size="small" column={1} bordered>
                      <Descriptions.Item label={t('detail.repairRunId')}>
                        {renderRepairRunLink(mainline.latest_linked_repair.id)}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('detail.status')}>{humanizeKey(mainline.latest_linked_repair.state)}</Descriptions.Item>
                      <Descriptions.Item label={t('detail.repairCurrentStage')}>
                        {humanizeKey(mainline.latest_linked_repair.current_phase)}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('detail.dispatchStatus')}>
                        {humanizeKey(mainline.latest_linked_repair.dispatch_status)}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('detail.retryable')}>
                        {mainline.latest_linked_repair.retryable ? t('detail.yes') : t('detail.no')}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('detail.latestPlanVersion')}>
                        {mainline.latest_linked_repair.latest_plan_version}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('detail.approvedPlanVersionLabel')}>
                        {mainline.latest_linked_repair.approved_plan_version}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('detail.replayStatusLabel')}>
                        {humanizeKey(mainline.latest_linked_repair.replay_status)}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('detail.replayProjectEvalLabel')}>
                        {renderProjectEvalLink(mainline.latest_linked_repair.replay_project_eval_run_id)}
                      </Descriptions.Item>
                      <Descriptions.Item label={t('detail.updatedAt')}>
                        {formatDateTime(mainline.latest_linked_repair.updated_at)}
                      </Descriptions.Item>
                    </Descriptions>
                  </Card>
                )}

                {mainline.latest_remediation_outcome && (
                  <Card title={t('detail.remediationOutcome')}>
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                      <Tag color="blue">{getRemediationCategoryLabel(mainline.latest_remediation_outcome.category)}</Tag>

                      <Paragraph style={{ marginBottom: 0 }}>
                        {getRemediationSummary(mainline.latest_remediation_outcome)}
                      </Paragraph>

                      <Row gutter={[16, 16]}>
                        <Col xs={24} sm={12} lg={4}>
                          <Statistic title={t('detail.improvedCases')} value={mainline.latest_remediation_outcome.improved_cases} />
                        </Col>
                        <Col xs={24} sm={12} lg={4}>
                          <Statistic title={t('detail.unchangedCases')} value={mainline.latest_remediation_outcome.unchanged_cases} />
                        </Col>
                        <Col xs={24} sm={12} lg={4}>
                          <Statistic title={t('detail.regressedCases')} value={mainline.latest_remediation_outcome.regressed_cases} />
                        </Col>
                        <Col xs={24} sm={12} lg={4}>
                          <Statistic title={t('detail.pendingCases')} value={mainline.latest_remediation_outcome.pending_cases} />
                        </Col>
                        <Col xs={24} sm={12} lg={4}>
                          <Statistic title={t('detail.failedCases')} value={mainline.latest_remediation_outcome.failed_cases} />
                        </Col>
                        <Col xs={24} sm={12} lg={4}>
                          <Statistic title={t('detail.unavailableCases')} value={mainline.latest_remediation_outcome.unavailable_cases} />
                        </Col>
                      </Row>
                    </Space>
                  </Card>
                )}
              </Space>
            ) : (
              <Card>
                <Empty description={t('detail.noLifecycleData')} />
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title={t('detail.overrideTitle')}
        open={overrideModalOpen}
        onOk={() => void handleApplyOverrides()}
        onCancel={() => {
          setOverrideModalOpen(false);
          setIncludeKeys([]);
          setExcludeKeys([]);
        }}
        confirmLoading={applying}
        okText={t('detail.applyOverride')}
        cancelText={t('detail.cancel')}
        width={640}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>
              {t('detail.includeCaseKeys')}
            </Text>
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder={t('detail.includeCaseKeysPlaceholder')}
              value={includeKeys}
              onChange={setIncludeKeys}
            />
          </div>

          <div>
            <Text strong style={{ display: 'block', marginBottom: 6 }}>
              {t('detail.excludeCaseKeys')}
            </Text>
            <Select
              mode="tags"
              style={{ width: '100%' }}
              placeholder={t('detail.excludeCaseKeysPlaceholder')}
              value={excludeKeys}
              onChange={setExcludeKeys}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
}
