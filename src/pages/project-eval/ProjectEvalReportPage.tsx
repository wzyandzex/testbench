import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Collapse,
  Descriptions,
  Empty,
  message,
  Modal,
  Progress,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  QuestionCircleOutlined,
  ToolOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common';
import ProjectEvalStageProgressPanel from '@/components/project-eval/ProjectEvalStageProgressPanel';
import {
  buildProjectEvalRepairDraftPath,
  buildProjectEvalRepairPath,
} from '@/pages/repair-run/links';
import { saveRecentProjectEvalRun } from '@/components/project-eval/recentRuns';
import { useThemeTokens } from '@/theme';
import { projectEvalService } from '@/services/project-eval';
import type {
  ContractCheckResult,
  ContractCompliance,
  ContractComplianceStatus,
  ContractDeliverableResult,
  ContractGap,
  ExecuteReportActionRequest,
  ReportActionResult,
  RunEvidencePostureView,
  RunLargeProjectCoverageView,
  RunPlanningGuidanceView,
  RunReportExportFormat,
  RunReportExportView,
  RunReportNextActionView,
  RunReportOutcomeView,
  RunReportSectionView,
  RunReportVariant,
  RunReportView,
  RunSupportPostureView,
} from '@/types/api/project-eval';
import {
  formatConfidence,
  formatCoverage,
  formatDateTime,
  formatScore,
  getDecisionTone,
  getEvidenceInsufficientReasonLabel as evidenceInsufficientReasonLabel,
  getEvidencePostureAlertType as evidencePostureAlertType,
  getEvidencePostureStatusColor as evidencePostureStatusColor,
  getEvidencePostureStatusLabel as evidencePostureStatusLabel,
  getEvidenceTruthSourceLabel as evidenceTruthSourceLabel,
  getOutcomeAuthorityLabel,
  getMainlineActionText,
  getRemediationCategoryLabel,
  getRemediationSummary,
  getReportOutcomeSummary,
  getReportOutcomeTone,
  getResultClassLabel,
  getScoreColor,
  getScoreModeLabel,
  getStageLabel,
  getStatusTone,
  getTruthModeLabel,
  humanizeKey,
} from '@/components/project-eval/helpers';

const { Paragraph, Text, Title } = Typography;

const REPORT_VARIANT_LABELS: Record<RunReportVariant, string> = {
  get summary() { return i18next.t('projectEval:reportPage.variants.summary'); },
  get executive() { return i18next.t('projectEval:reportPage.variants.executive'); },
  get technical() { return i18next.t('projectEval:reportPage.variants.technical'); },
  get evidence() { return i18next.t('projectEval:reportPage.variants.evidence'); },
  get remediation() { return i18next.t('projectEval:reportPage.variants.remediation'); },
};

const REPORT_VARIANT_DESCRIPTIONS: Record<RunReportVariant, string> = {
  get summary() { return i18next.t('projectEval:reportPage.variantDescriptions.summary'); },
  get executive() { return i18next.t('projectEval:reportPage.variantDescriptions.executive'); },
  get technical() { return i18next.t('projectEval:reportPage.variantDescriptions.technical'); },
  get evidence() { return i18next.t('projectEval:reportPage.variantDescriptions.evidence'); },
  get remediation() { return i18next.t('projectEval:reportPage.variantDescriptions.remediation'); },
};

const DEFAULT_REPORT_VARIANTS: RunReportVariant[] = [
  'summary',
  'executive',
  'technical',
  'evidence',
  'remediation',
];
const SUPPORTED_EXPORT_FORMATS: RunReportExportFormat[] = ['json', 'markdown', 'csv'];

const EXPORT_FORMAT_LABELS: Record<RunReportExportFormat, string> = {
  json: 'JSON',
  markdown: 'Markdown',
  csv: 'CSV',
};

const TRACE_STAGE_FILTER_OPTIONS = [
  { value: 'failed', get label() { return i18next.t('projectEval:reportPage.traceFilter.failed'); } },
  { value: 'completed', get label() { return i18next.t('projectEval:reportPage.traceFilter.completed'); } },
  { value: 'all', get label() { return i18next.t('projectEval:reportPage.traceFilter.all'); } },
];

function normalizeReportVariant(value?: string | null): RunReportVariant {
  switch (value) {
    case 'executive':
    case 'technical':
    case 'evidence':
    case 'remediation':
      return value;
    default:
      return 'summary';
  }
}

function readCountMap(
  summary: Record<string, unknown> | undefined,
  key: string
): Array<[string, number]> {
  const raw = summary?.[key];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return [];
  }

  return Object.entries(raw as Record<string, unknown>).flatMap(([name, value]) =>
    typeof value === 'number' ? [[name, value] as [string, number]] : []
  );
}

function severityColor(value?: string): string {
  switch (value) {
    case 'critical':
      return 'red';
    case 'high':
    case 'medium':
      return 'orange';
    case 'low':
      return 'green';
    default:
      return 'blue';
  }
}

function actionPriorityColor(value?: string): string {
  switch (value) {
    case 'p0':
      return 'red';
    case 'p1':
      return 'orange';
    case 'p2':
      return 'blue';
    default:
      return 'default';
  }
}

function metricValueToNode(value: unknown): ReactNode {
  if (value === null || value === undefined || value === '') {
    return '-';
  }
  if (typeof value === 'boolean') {
    return value ? i18next.t('projectEval:reportPage.common.yes') : i18next.t('projectEval:reportPage.common.no');
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : Number(value.toFixed(3));
  }
  if (typeof value === 'string') {
    return value;
  }
  return (
    <pre
      style={{
        margin: 0,
        maxHeight: 180,
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
      }}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function actionTargetText(action: RunReportNextActionView): string {
  const parts = [action.target_type, action.target_id].filter(Boolean);
  if (action.target_variant) {
    parts.push(`variant=${action.target_variant}`);
  }
  return parts.length > 0 ? parts.join(':') : '-';
}

function reportVariantTabs(variants: string[] | undefined) {
  const normalized =
    variants && variants.length > 0
      ? variants.map((value) => normalizeReportVariant(value))
      : DEFAULT_REPORT_VARIANTS;
  const unique = Array.from(new Set(normalized));

  return unique.map((value) => ({
    key: value,
    label: REPORT_VARIANT_LABELS[value],
  }));
}

function normalizeExportFormat(value?: string): RunReportExportFormat | null {
  return SUPPORTED_EXPORT_FORMATS.find((format) => format === value) ?? null;
}

function reportExportFormats(
  targets: string[] | undefined,
  variant: RunReportVariant
): RunReportExportFormat[] {
  const normalized = (targets ?? [])
    .map(normalizeExportFormat)
    .filter((value): value is RunReportExportFormat => Boolean(value));
  const fallback: RunReportExportFormat[] =
    variant === 'evidence' || variant === 'technical'
      ? ['json', 'markdown', 'csv']
      : ['json', 'markdown'];
  return Array.from(new Set(normalized.length > 0 ? normalized : fallback));
}

function contentTypeForExport(format: string): string {
  if (format === 'markdown') {
    return 'text/markdown;charset=utf-8';
  }
  if (format === 'csv') {
    return 'text/csv;charset=utf-8';
  }
  return 'application/json;charset=utf-8';
}

function downloadReportExport(exportView: RunReportExportView) {
  if (!exportView.content) {
    return;
  }
  const blob = new Blob([exportView.content], {
    type: exportView.content_type || contentTypeForExport(exportView.format),
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = exportView.file_name || `project-eval-report.${exportView.format || 'json'}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function trimDraftText(value?: string, limit = 160): string | undefined {
  const normalized = value?.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return undefined;
  }

  if (normalized.length <= limit) {
    return normalized;
  }

  return `${normalized.slice(0, limit).trimEnd()}…`;
}

function isRepairOutcomeAction(outcome?: RunReportOutcomeView): boolean {
  return (
    outcome?.kind === 'repair' &&
    (outcome.repair_eligible || outcome.next_action === 'create_linked_repair_run')
  );
}

function isReportRepairAction(action?: RunReportNextActionView): boolean {
  return action?.id === 'create_repair' || action?.id === 'create_linked_repair_run';
}

function isReportRepairApplyAction(action?: RunReportNextActionView): boolean {
  return action?.id === 'rerun_repair_apply';
}

function shouldRenderNextActionButton(action: RunReportNextActionView): boolean {
  return (
    action.recommended ||
    Boolean(action.target_type) ||
    isReportRepairAction(action) ||
    isReportRepairApplyAction(action) ||
    action.id === 'request_replay' ||
    action.id === 'review_truth_posture' ||
    action.id === 'export_gap_report'
  );
}

function getOutcomeNextActionLabel(outcome?: RunReportOutcomeView): string {
  if (!outcome?.next_action || outcome.next_action === 'none') {
    return i18next.t('projectEval:reportPage.actions.noActions');
  }
  return outcome.next_action_label || getMainlineActionText(outcome.next_action);
}

function buildRepairDraftTitle(report: RunReportView | null, runId?: string): string {
  const summary = trimDraftText(report?.summary, 24);
  if (summary) {
    return i18next.t('projectEval:reportPage.draft.titleSummary', { summary });
  }

  const decision = report?.decision ? humanizeKey(report.decision) : undefined;
  if (decision) {
    return i18next.t('projectEval:reportPage.draft.titleDecision', { decision });
  }

  return i18next.t('projectEval:reportPage.draft.titleFallback', { run: trimDraftText(runId, 16) || 'run' });
}

function buildRepairDraftObjective(
  runId: string | undefined,
  report: RunReportView | null
): string {
  const lines: string[] = [
    i18next.t('projectEval:reportPage.draft.source', { run: runId || 'run' }),
    i18next.t('projectEval:reportPage.draft.conclusion', {
      decision: report?.decision ? humanizeKey(report.decision) : i18next.t('projectEval:reportPage.draft.decisionUnknown'),
      score: formatScore(report?.score ?? 0),
    }),
  ];

  const summary = trimDraftText(report?.summary, 140);
  if (summary) {
    lines.push(i18next.t('projectEval:reportPage.draft.summary', { summary }));
  }

  if (report?.outcome) {
    lines.push(
      i18next.t('projectEval:reportPage.draft.outcome', {
        label: report.outcome.label || getReportOutcomeTone(report.outcome.kind).label,
      })
    );
    const outcomeExplain = trimDraftText(getReportOutcomeSummary(report.outcome), 160);
    if (outcomeExplain) {
      lines.push(i18next.t('projectEval:reportPage.draft.outcomeExplain', { explain: outcomeExplain }));
    }
    if (report.outcome.refusal_reason) {
      lines.push(i18next.t('projectEval:reportPage.draft.refusalReason', { reason: humanizeKey(report.outcome.refusal_reason) }));
    }
  }

  if (report?.mainline?.stage) {
    lines.push(i18next.t('projectEval:reportPage.draft.mainlineStage', { stage: getStageLabel(report.mainline.stage) }));
  }

  if (
    report?.mainline?.repair_eligible ||
    report?.mainline?.primary_action?.action === 'create_repair' ||
    isRepairOutcomeAction(report?.outcome)
  ) {
    lines.push(i18next.t('projectEval:reportPage.draft.mainlineCanRepair'));
    const primaryReason = trimDraftText(
      report?.outcome?.next_action_reason || report?.mainline?.primary_action_reason,
      140
    );
    if (primaryReason) {
      lines.push(i18next.t('projectEval:reportPage.draft.mainlineSuggest', { reason: primaryReason }));
    }
  } else if (report?.mainline?.explain) {
    const explain = trimDraftText(report.mainline.explain, 140);
    if (explain) {
      lines.push(i18next.t('projectEval:reportPage.draft.mainlineNote', { explain }));
    }
  }

  const remediationOutcome =
    report?.remediation?.latest_outcome ?? report?.mainline?.latest_remediation_outcome;
  if (remediationOutcome) {
    lines.push(
      i18next.t('projectEval:reportPage.draft.remediation', {
        category: getRemediationCategoryLabel(remediationOutcome.category),
        improved: remediationOutcome.improved_cases,
        total: remediationOutcome.total_cases,
        regressed: remediationOutcome.regressed_cases,
      })
    );
  }

  const evidenceSummary = report?.evidence_summary;
  if (evidenceSummary) {
    lines.push(
      i18next.t('projectEval:reportPage.draft.evidenceCoverage', {
        selected: report?.selected_case_count ?? evidenceSummary.selected_cases,
        evaluated: evidenceSummary.evaluated_cases,
        coverage: formatCoverage(evidenceSummary.coverage_score),
        confidence: formatConfidence(evidenceSummary.average_confidence),
      })
    );
  }

  if (report?.authoritative_truth) {
    lines.push(i18next.t('projectEval:reportPage.draft.authoritativeOk'));
  } else if (report?.legacy_fallback_used) {
    lines.push(i18next.t('projectEval:reportPage.draft.fallbackUsed'));
  }

  lines.push(i18next.t('projectEval:reportPage.draft.completeScope'));
  return lines.join('\n');
}

function getNextActionButtonLabel(
  action: RunReportNextActionView,
  hasLinkedRepair: boolean
): string {
  if (isReportRepairApplyAction(action)) {
    return i18next.t('projectEval:reportPage.actions.rerunApply');
  }
  if (action.target_type === 'execution') {
    return i18next.t('projectEval:reportPage.actions.viewExecution');
  }
  if (action.target_type === 'report_section' || action.id === 'review_agent_contract_gaps') {
    if (action.target_id === 'planning_guidance' || action.id === 'review_planning_guidance') {
      return i18next.t('projectEval:reportPage.actions.viewPlanning');
    }
    return i18next.t('projectEval:reportPage.actions.viewGaps');
  }
  if (action.target_type === 'report_export' || action.id === 'export_gap_report') {
    return i18next.t('projectEval:reportPage.actions.prepareExport');
  }
  if (isReportRepairAction(action)) {
    return hasLinkedRepair
      ? i18next.t('projectEval:reportPage.actions.viewRepair')
      : i18next.t('projectEval:reportPage.actions.createDraft');
  }

  if (action.id === 'request_replay' || action.target_type === 'repair_run') {
    return hasLinkedRepair
      ? i18next.t('projectEval:reportPage.actions.viewRepair')
      : i18next.t('projectEval:reportPage.actions.openMainline');
  }

  if (action.id === 'review_truth_posture') {
    return i18next.t('projectEval:reportPage.openExplain');
  }

  return i18next.t('projectEval:reportPage.actions.openRelated');
}

function getNextActionButtonIcon(action: RunReportNextActionView): ReactNode {
  if (action.target_type === 'report_export' || action.id === 'export_gap_report') {
    return <DownloadOutlined />;
  }
  if (
    isReportRepairAction(action) ||
    action.id === 'request_replay' ||
    action.target_type === 'repair_run'
  ) {
    return <ToolOutlined />;
  }
  if (
    action.id === 'review_truth_posture' ||
    action.id === 'review_agent_contract_gaps' ||
    action.target_type === 'execution'
  ) {
    return <QuestionCircleOutlined />;
  }
  return null;
}

const AGENT_ORCHESTRATION_OWNED_METRICS = new Set([
  'agent_orchestration_contract',
  'contract_compliance',
  'contract_compliance_status',
  'contract_compliance_score',
  'contract_compliance_required_gap_count',
  'contract_compliance_gap_count',
  'support_posture',
  'candidate_case_count',
  'phase_count',
  'self_check_count',
]);

const SUPPORT_POSTURE_OWNED_METRICS = new Set([
  'acceptance',
  'evidence_classes',
  'evidence_refs',
  'known_gap_count',
  'limitation_count',
  'representative_samples',
  'sample_count',
  'supported_depths',
  'validation_lanes',
]);

const PLANNING_GUIDANCE_OWNED_METRICS = new Set([
  'planning_guidance',
  'template_family',
  'evaluation_depth',
  'budget_class',
  'validation_lane',
  'evidence_classes',
  'deferred_evidence_classes',
  'test_command_candidates',
  'support_command_candidates',
]);

const LARGE_PROJECT_COVERAGE_OWNED_METRICS = new Set([
  'coverage',
  'large_project_strategy',
  'staged_execution_plan',
  'module_slicing_plan',
  'evidence_accounting',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
}

function recordField(
  record: Record<string, unknown> | undefined,
  key: string
): Record<string, unknown> | undefined {
  const value = record?.[key];
  return isRecord(value) ? value : undefined;
}

function arrayLength(record: Record<string, unknown> | undefined, key: string): number | undefined {
  const value = record?.[key];
  return Array.isArray(value) ? value.length : undefined;
}

function complianceStatusColor(status?: ContractComplianceStatus): string {
  switch (status) {
    case 'satisfied':
      return 'green';
    case 'partial':
      return 'gold';
    case 'gap':
      return 'red';
    case 'unavailable':
      return 'default';
    case 'not_required':
      return 'blue';
    default:
      return 'default';
  }
}

function complianceStatusLabel(status?: ContractComplianceStatus): string {
  switch (status) {
    case 'satisfied':
      return i18next.t('projectEval:reportPage.compliance.satisfied');
    case 'partial':
      return i18next.t('projectEval:reportPage.compliance.partial');
    case 'gap':
      return i18next.t('projectEval:reportPage.compliance.gap');
    case 'unavailable':
      return i18next.t('projectEval:reportPage.compliance.unavailable');
    case 'not_required':
      return i18next.t('projectEval:reportPage.compliance.notRequired');
    case 'unknown':
      return i18next.t('projectEval:reportPage.compliance.unknown');
    default:
      return status ? humanizeKey(status) : i18next.t('projectEval:reportPage.compliance.unknown');
  }
}

function scoreText(value?: number): string {
  return typeof value === 'number' && Number.isFinite(value) ? formatScore(value) : '-';
}

function optionalNumberText(value?: number): string {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : '-';
}

function metricEntriesForSection(section: RunReportSectionView): Array<[string, unknown]> {
  const entries = Object.entries(section.metrics ?? {});
  if (section.id === 'agent_orchestration') {
    return entries.filter(([key]) => !AGENT_ORCHESTRATION_OWNED_METRICS.has(key));
  }
  if (section.id === 'support_posture') {
    return entries.filter(([key]) => !SUPPORT_POSTURE_OWNED_METRICS.has(key));
  }
  if (section.id === 'planning_guidance') {
    return entries.filter(([key]) => !PLANNING_GUIDANCE_OWNED_METRICS.has(key));
  }
  if (section.id === 'large_project_coverage') {
    return entries.filter(([key]) => !LARGE_PROJECT_COVERAGE_OWNED_METRICS.has(key));
  }
  return entries;
}

function readContractCompliance(value: unknown): ContractCompliance | undefined {
  if (!isRecord(value)) {
    return undefined;
  }

  const status = stringValue(value.status);
  const score = numberValue(value.score);
  const requiredGapCount = numberValue(value.required_gap_count);
  const gapCount = numberValue(value.gap_count);
  const contractKind = stringValue(value.contract_kind);
  const contractVersion = stringValue(value.contract_version);
  if (!status && !contractKind && !contractVersion) {
    return undefined;
  }

  return {
    contract_kind: contractKind,
    contract_version: contractVersion,
    owner: stringValue(value.owner),
    source: stringValue(value.source),
    execution_record_id: stringValue(value.execution_record_id),
    status: (status || 'unknown') as ContractComplianceStatus,
    score: score ?? 0,
    summary: stringValue(value.summary),
    required_satisfied: numberValue(value.required_satisfied) ?? 0,
    required_total: numberValue(value.required_total) ?? 0,
    optional_satisfied: numberValue(value.optional_satisfied) ?? 0,
    optional_total: numberValue(value.optional_total) ?? 0,
    required_gap_count: requiredGapCount ?? 0,
    gap_count: gapCount ?? 0,
    self_checks: Array.isArray(value.self_checks)
      ? (value.self_checks as ContractCheckResult[])
      : undefined,
    deliverables: Array.isArray(value.deliverables)
      ? (value.deliverables as ContractDeliverableResult[])
      : undefined,
    gaps: Array.isArray(value.gaps) ? (value.gaps as ContractGap[]) : undefined,
  };
}

function latestAgentContractCompliance(
  section: RunReportSectionView,
  report: RunReportView
): ContractCompliance | undefined {
  return (
    readContractCompliance(section.metrics?.contract_compliance) ??
    report.mainline?.latest_linked_repair?.latest_contract_compliance ??
    report.remediation?.latest_linked_repair?.latest_contract_compliance ??
    report.outcome?.linked_repair?.latest_contract_compliance
  );
}

function agentOrchestrationContract(
  section: RunReportSectionView,
  report: RunReportView
): Record<string, unknown> | undefined {
  const fromMetrics = section.metrics?.agent_orchestration_contract;
  if (isRecord(fromMetrics)) {
    return fromMetrics;
  }
  return isRecord(report.agent_orchestration_contract)
    ? report.agent_orchestration_contract
    : undefined;
}

function contractFactRows(
  section: RunReportSectionView,
  report: RunReportView
): Array<[string, ReactNode]> {
  const contract = agentOrchestrationContract(section, report);
  const metrics = section.metrics ?? {};
  const project = recordField(contract, 'project');
  const strategy = recordField(contract, 'case_strategy');
  const phases = numberValue(metrics.phase_count) ?? arrayLength(contract, 'phases');
  const selfChecks =
    numberValue(metrics.self_check_count) ?? arrayLength(contract, 'self_check_criteria');
  const candidateCount =
    numberValue(metrics.candidate_case_count) ?? numberValue(strategy?.candidate_case_count);
  const selectedCount = numberValue(strategy?.selected_case_count) ?? report.selected_case_count;

  return [
    [i18next.t('projectEval:reportPage.agent.labelFramework'), stringValue(project?.framework_family) ?? '-'],
    [i18next.t('projectEval:reportPage.agent.labelDepth'), stringValue(project?.evaluation_depth) ?? '-'],
    [i18next.t('projectEval:reportPage.agent.labelCandidateSelected'), `${optionalNumberText(candidateCount)} / ${optionalNumberText(selectedCount)}`],
    [i18next.t('projectEval:reportPage.agent.labelPhasesChecks'), `${optionalNumberText(phases)} / ${optionalNumberText(selfChecks)}`],
    [i18next.t('projectEval:reportPage.agent.labelContractVersion'), stringValue(contract?.contract_version) ?? '-'],
    ['Owner', stringValue(contract?.owner) ?? '-'],
  ];
}

function renderStatusTag(status?: ContractComplianceStatus) {
  return <Tag color={complianceStatusColor(status)}>{complianceStatusLabel(status)}</Tag>;
}

function renderEvidenceTags(evidence?: string[]) {
  if (!evidence || evidence.length === 0) {
    return <Text type="secondary">{i18next.t('projectEval:reportPage.support.noEvidenceRefs')}</Text>;
  }

  return (
    <Space wrap size={4}>
      {evidence.slice(0, 6).map((item) => (
        <Tag key={item}>{item}</Tag>
      ))}
      {evidence.length > 6 && <Tag>+{evidence.length - 6}</Tag>}
    </Space>
  );
}

function ContractCheckCards({ items }: { items?: ContractCheckResult[] }) {
  if (!items || items.length === 0) {
    return <Text type="secondary">{i18next.t('projectEval:reportPage.compliance.noChecks')}</Text>;
  }

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      {items.map((item) => (
        <Card key={item.id} size="small" bodyStyle={{ padding: 12 }}>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Space wrap>
              <Text strong>{item.id}</Text>
              {renderStatusTag(item.status)}
              {item.required && <Tag color="red">{i18next.t('projectEval:reportPage.compliance.required')}</Tag>}
              {item.severity && (
                <Tag color={severityColor(item.severity)}>{humanizeKey(item.severity)}</Tag>
              )}
            </Space>
            {(item.reason || item.expectation) && (
              <Text type="secondary">{item.reason || item.expectation}</Text>
            )}
            {renderEvidenceTags(item.evidence)}
          </Space>
        </Card>
      ))}
    </Space>
  );
}

function ContractDeliverableCards({ items }: { items?: ContractDeliverableResult[] }) {
  if (!items || items.length === 0) {
    return <Text type="secondary">{i18next.t('projectEval:reportPage.compliance.noDeliverables')}</Text>;
  }

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      {items.map((item) => (
        <Card key={item.id} size="small" bodyStyle={{ padding: 12 }}>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Space wrap>
              <Text strong>{item.id}</Text>
              {renderStatusTag(item.status)}
              {item.required && <Tag color="red">{i18next.t('projectEval:reportPage.compliance.required')}</Tag>}
              {item.audience && <Tag>{humanizeKey(item.audience)}</Tag>}
            </Space>
            {item.reason && <Text type="secondary">{item.reason}</Text>}
            {item.content && item.content.length > 0 && (
              <Space wrap size={4}>
                {item.content.map((content) => (
                  <Tag key={content}>{humanizeKey(content)}</Tag>
                ))}
              </Space>
            )}
            {renderEvidenceTags(item.evidence)}
          </Space>
        </Card>
      ))}
    </Space>
  );
}

function ContractGapCards({ gaps }: { gaps?: ContractGap[] }) {
  if (!gaps || gaps.length === 0) {
    return (
      <Alert
        type="success"
        showIcon
        message={i18next.t('projectEval:reportPage.compliance.noGapTitle')}
        description={i18next.t('projectEval:reportPage.compliance.noGapDesc')}
      />
    );
  }

  return (
    <Space direction="vertical" size={8} style={{ width: '100%' }}>
      {gaps.map((gap) => (
        <Card key={`${gap.type}:${gap.id}`} size="small" bodyStyle={{ padding: 12 }}>
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Space wrap>
              <Text strong>{gap.id}</Text>
              <Tag>{humanizeKey(gap.type)}</Tag>
              {gap.required && <Tag color="red">{i18next.t('projectEval:reportPage.compliance.required')}</Tag>}
              {gap.severity && (
                <Tag color={severityColor(gap.severity)}>{humanizeKey(gap.severity)}</Tag>
              )}
            </Space>
            {gap.message && <Text>{gap.message}</Text>}
            {gap.recommended_action && <Text type="secondary">{i18next.t('projectEval:reportPage.compliance.suggestion', { action: gap.recommended_action })}</Text>}
          </Space>
        </Card>
      ))}
    </Space>
  );
}

interface ReportSectionCardProps {
  section: RunReportSectionView;
}

function ReportSectionCard({ section }: ReportSectionCardProps) {
  const metrics = metricEntriesForSection(section);

  return (
    <Card
      title={
        <Space wrap>
          <span>{section.title || humanizeKey(section.id)}</span>
          {section.severity && (
            <Tag color={severityColor(section.severity)}>{humanizeKey(section.severity)}</Tag>
          )}
        </Space>
      }
      size="small"
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {section.summary && <Paragraph style={{ marginBottom: 0 }}>{section.summary}</Paragraph>}

        {section.items && section.items.length > 0 && (
          <Space direction="vertical" size={6}>
            {section.items.map((item) => (
              <Text key={item} type="secondary">
                - {item}
              </Text>
            ))}
          </Space>
        )}

        {metrics.length > 0 && (
          <Descriptions column={1} size="small" bordered>
            {metrics.map(([key, value]) => (
              <Descriptions.Item key={key} label={planningValueLabel(key)}>
                {metricValueToNode(value)}
              </Descriptions.Item>
            ))}
          </Descriptions>
        )}
      </Space>
    </Card>
  );
}

function supportStatusColor(status?: string): string {
  switch (status) {
    case 'accepted':
      return 'green';
    case 'provisional':
      return 'gold';
    case 'exploratory':
      return 'orange';
    default:
      return 'default';
  }
}

function supportFreshnessColor(freshness?: string): string {
  switch (freshness) {
    case 'fresh':
      return 'green';
    case 'aging':
      return 'gold';
    case 'stale':
      return 'red';
    default:
      return 'default';
  }
}

function operatorReviewStatusColor(status?: string): string {
  switch (status) {
    case 'confirmed':
      return 'green';
    case 'accepted_with_disclosure':
      return 'gold';
    case 'refresh_requested':
      return 'orange';
    case 'promotion_approved':
      return 'cyan';
    case 'demotion_approved':
      return 'volcano';
    case 'blocked':
      return 'red';
    default:
      return 'default';
  }
}

function supportLaneText(posture: RunSupportPostureView): string {
  return [
    posture.project_family_name || posture.project_family,
    posture.framework_family_name || posture.framework_family,
    posture.template_family_name || posture.template_family,
    posture.evaluation_depth,
  ]
    .filter(Boolean)
    .join(' / ');
}

function renderCompactTags(values?: string[], emptyText?: string): ReactNode {
  if (!values || values.length === 0) {
    return <Text type="secondary">{emptyText ?? i18next.t('projectEval:reportPage.common.empty')}</Text>;
  }

  return (
    <Space wrap size={4}>
      {values.slice(0, 8).map((value) => (
        <Tag key={value}>{humanizeKey(value)}</Tag>
      ))}
      {values.length > 8 && <Tag>+{values.length - 8}</Tag>}
    </Space>
  );
}


function planningI18nKey(value?: string): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function planningValueLabel(value?: string): string {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) {
    return '-';
  }
  const key = planningI18nKey(rawValue);
  return i18next.t(`projectEval:reportPage.planning.valueLabels.${key}`, {
    defaultValue: humanizeKey(rawValue),
  });
}

function renderPlanningTags(values?: string[], emptyText?: string): ReactNode {
  if (!values || values.length === 0) {
    return <Text type="secondary">{emptyText ?? i18next.t('projectEval:reportPage.common.empty')}</Text>;
  }

  return (
    <Space wrap size={4}>
      {values.slice(0, 8).map((value) => (
        <Tag key={value}>{planningValueLabel(value)}</Tag>
      ))}
      {values.length > 8 && <Tag>+{values.length - 8}</Tag>}
    </Space>
  );
}

function planningDynamicTextKey(value?: string): string | null {
  switch (String(value ?? '').trim()) {
    case 'first-pass triage':
      return 'recommendedFirstPassTriage';
    case 'unknown or low-confidence project profiles':
      return 'recommendedUnknownProfiles';
    case 'small delta checks':
      return 'recommendedSmallDeltaChecks';
    case 'risk-heavy changes':
      return 'recommendedRiskHeavyChanges';
    case 'pre-release engineering review':
      return 'recommendedPreReleaseReview';
    case 'projects that need integration/security/performance evidence':
      return 'recommendedIntegrationSecurityPerformance';
    case 'release gates':
      return 'recommendedReleaseGates';
    case 'policy enforcement checkpoints':
      return 'recommendedPolicyCheckpoints';
    case 'runs where missing required evidence must block':
      return 'recommendedMissingEvidenceMustBlock';
    case 'balanced project evaluation':
      return 'recommendedBalancedEvaluation';
    case 'regular engineering feedback':
      return 'recommendedRegularFeedback';
    case 'baseline project assessment':
      return 'recommendedBaselineAssessment';
    case 'large repositories that need staged coverage accounting':
      return 'recommendedLargeRepositories';
    case 'Optimizes speed by deferring integration, e2e, security, performance, and runtime-behavior evidence.':
      return 'tradeoffQuick';
    case 'Runs broader evidence and costs more time and compute than standard evaluation.':
      return 'tradeoffDeep';
    case 'Prefers strict outcomes; missing required evidence should not become a passing decision.':
      return 'tradeoffReleaseGate';
    case 'Balances speed and confidence by selecting standard project checks plus governed cases.':
      return 'tradeoffBalanced';
    case 'Large-project mode reports sampled, skipped, and deferred work instead of pretending full repository coverage.':
      return 'tradeoffLargeProject';
    case 'Support commands improve confidence but are diagnostic unless selected as authoritative evidence.':
      return 'tradeoffSupportCommands';
    case 'Project detection confidence is low; confirm framework and template before strict runs.':
      return 'warningLowDetection';
    case 'Candidate coverage is not whole-repository coverage; inspect large-project coverage disclosures.':
      return 'warningLargeCoverage';
    case 'No executable test command candidates are declared for this framework lane.':
      return 'warningNoTestCommands';
    case 'Mixed-project lanes require manual review of runtime and test command choices.':
      return 'warningMixedProject';
    case 'Confirm the detected project, framework, template, and evaluation depth before starting the run.':
      return 'nextConfirmProfile';
    case 'Keep technical or evidence report variants enabled when results will be used for engineering or governance review.':
      return 'nextKeepReportVariants';
    case 'Review the large-project coverage ledger for sampled, skipped, and deferred evidence.':
      return 'nextReviewLargeCoverage';
    case 'Provide or verify custom validation commands before relying on executable evidence.':
      return 'nextProvideValidationCommands';
    case 'Use strict mode and inspect missing evidence before treating the result as a release decision.':
      return 'nextStrictRelease';
    case 'Planning guidance is not available for this run.':
      return 'sectionUnavailable';
    case 'Planning guidance is available for this run.':
      return 'sectionAvailable';
    default:
      return null;
  }
}

function translatePlanningGuidanceText(value?: string): string {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) {
    return '';
  }
  const key = planningDynamicTextKey(rawValue);
  if (!key) {
    return rawValue;
  }
  return i18next.t(`projectEval:reportPage.planning.dynamicText.${key}`, {
    defaultValue: rawValue,
  });
}

function planningGuidanceSummaryText(
  guidance: RunPlanningGuidanceView,
  fallback?: string
): string {
  if (guidance) {
    return i18next.t('projectEval:reportPage.planning.dynamicText.summaryTemplate', {
      template: planningValueLabel(guidance.template_family || 'selected_template'),
      depth: planningValueLabel(guidance.evaluation_depth || 'selected_depth'),
      selection: planningValueLabel(guidance.case_selection_mode || 'default'),
      budget: planningValueLabel(guidance.budget_class || 'default'),
      runner: planningValueLabel(guidance.runner_policy_hint || guidance.validation_lane || 'default'),
    });
  }
  return translatePlanningGuidanceText(fallback) || i18next.t('projectEval:reportPage.planning.summaryFallback');
}

function renderRawTags(values?: string[], emptyText?: string): ReactNode {
  if (!values || values.length === 0) {
    return <Text type="secondary">{emptyText ?? i18next.t('projectEval:reportPage.common.empty')}</Text>;
  }

  return (
    <Space wrap size={4}>
      {values.slice(0, 8).map((value) => (
        <Tag key={value}>{value}</Tag>
      ))}
      {values.length > 8 && <Tag>+{values.length - 8}</Tag>}
    </Space>
  );
}

function percentNumber(value?: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) {
    return 0;
  }
  const percent = value <= 1 ? value * 100 : value;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

function coverageStatusColor(status?: string): string {
  switch (status) {
    case 'covered':
      return 'green';
    case 'disclosure_required':
    case 'partial':
      return 'gold';
    case 'action_required':
      return 'red';
    case 'not_applicable':
      return 'default';
    default:
      return 'blue';
  }
}

function coverageAlertType(
  coverage: RunLargeProjectCoverageView
): 'success' | 'info' | 'warning' | 'error' {
  if (coverage.status === 'action_required' || coverage.severity === 'high') {
    return 'error';
  }
  if (coverage.status === 'partial' || coverage.status === 'disclosure_required') {
    return 'warning';
  }
  return coverage.enabled ? 'success' : 'info';
}

function renderCountMapTags(counts?: Record<string, number>, emptyText?: string): ReactNode {
  if (!counts || Object.keys(counts).length === 0) {
    return <Text type="secondary">{emptyText ?? i18next.t('projectEval:reportPage.common.empty')}</Text>;
  }
  return (
    <Space wrap size={4}>
      {Object.entries(counts).map(([key, value]) => (
        <Tag key={key}>
          {humanizeKey(key)} · {value}
        </Tag>
      ))}
    </Space>
  );
}

function countText(value?: number): string {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : '-';
}

function planningGuidanceAlertType(
  guidance: RunPlanningGuidanceView
): 'success' | 'info' | 'warning' | 'error' {
  if ((guidance.warnings?.length ?? 0) > 0) {
    return 'warning';
  }
  if (guidance.evaluation_depth === 'release_gate') {
    return 'info';
  }
  return 'success';
}

interface PlanningGuidanceCardProps {
  section: RunReportSectionView;
  report: RunReportView;
}

function PlanningGuidanceCard({ section, report }: PlanningGuidanceCardProps) {
  const { t } = useTranslation('projectEval');
  const tokens = useThemeTokens();
  const guidance = report.planning_guidance;
  const metrics = metricEntriesForSection(section);

  if (!guidance) {
    return <ReportSectionCard section={section} />;
  }

  const warnings = guidance.warnings ?? [];
  const hasWarnings = warnings.length > 0;
  const commandCount =
    (guidance.test_command_candidates?.length ?? 0) +
    (guidance.support_command_candidates?.length ?? 0);

  return (
    <Card
      data-testid="project-eval-planning-guidance-card"
      title={
        <Space wrap>
          <span>{t('reportPage.planning.cardTitle')}</span>
          <Tag color="blue">{planningValueLabel(guidance.evaluation_depth)}</Tag>
          <Tag>{planningValueLabel(guidance.budget_class)}</Tag>
          {guidance.validation_lane && <Tag>{planningValueLabel(guidance.validation_lane)}</Tag>}
          {guidance.large_project_strategy_enabled && <Tag color="orange">{t('reportPage.planning.largeProject')}</Tag>}
          {hasWarnings && <Tag color="gold">{t('reportPage.planning.warningsCount', { count: warnings.length })}</Tag>}
        </Space>
      }
      size="small"
      style={{
        borderColor: hasWarnings ? '#f59e0b' : tokens.border.default,
        background: `linear-gradient(135deg, ${tokens.bg.primary}, ${tokens.bg.secondary})`,
      }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type={planningGuidanceAlertType(guidance)}
          showIcon
          message={planningGuidanceSummaryText(guidance, section.summary || guidance.summary)}
          description={t('reportPage.planning.summaryDesc')}
        />

        <Row gutter={[12, 12]}>
          <Col xs={12} lg={6}>
            <Card size="small" bodyStyle={{ padding: 12 }}>
              <Statistic title={t('reportPage.planning.statStages')} value={guidance.stage_count ?? 0} />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card size="small" bodyStyle={{ padding: 12 }}>
              <Statistic title={t('reportPage.planning.statModules')} value={guidance.module_slice_count ?? 0} />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card size="small" bodyStyle={{ padding: 12 }}>
              <Statistic title={t('reportPage.planning.statTestCandidates')} value={guidance.test_command_candidates?.length ?? 0} />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card size="small" bodyStyle={{ padding: 12 }}>
              <Statistic title={t('reportPage.planning.statSupportCommands')} value={guidance.support_command_candidates?.length ?? 0} />
            </Card>
          </Col>
        </Row>

        <Descriptions title={t('reportPage.planning.postureTitle')} size="small" column={{ xs: 1, md: 2 }} bordered>
          <Descriptions.Item label={t('reportPage.planning.labelTemplateFramework')}>
            {planningValueLabel(guidance.template_family)} / {planningValueLabel(guidance.framework_family)}
          </Descriptions.Item>
          <Descriptions.Item label={t('reportPage.planning.labelProjectFamilyScale')}>
            {planningValueLabel(guidance.project_family)} / {planningValueLabel(guidance.scale_profile)}
          </Descriptions.Item>
          <Descriptions.Item label={t('reportPage.planning.labelOrchestrationSelection')}>
            {planningValueLabel(guidance.orchestration_mode)} / {planningValueLabel(guidance.case_selection_mode)}
          </Descriptions.Item>
          <Descriptions.Item label={t('reportPage.planning.labelCostSpeed')}>
            {planningValueLabel(guidance.cost_posture)} / {planningValueLabel(guidance.speed_posture)}
          </Descriptions.Item>
          <Descriptions.Item label={t('reportPage.planning.labelRuntime')}>
            {guidance.runtime_image || '-'} · {planningValueLabel(guidance.resource_profile)}
          </Descriptions.Item>
          <Descriptions.Item label={t('reportPage.planning.labelTestPolicy')}>
            {planningValueLabel(guidance.test_selection_policy)}
          </Descriptions.Item>
          <Descriptions.Item label={t('reportPage.planning.labelPartialResult')}>
            {guidance.allow_partial ? t('reportPage.planning.allowPartial') : t('reportPage.planning.failClosed')}
          </Descriptions.Item>
          <Descriptions.Item label={t('reportPage.planning.labelTruthLineage')}>
            {guidance.requires_truth_lineage ? t('reportPage.planning.required') : t('reportPage.planning.notStrict')}
          </Descriptions.Item>
        </Descriptions>

        <Collapse
          defaultActiveKey={hasWarnings ? ['warnings', 'evidence'] : ['evidence']}
          items={[
            {
              key: 'warnings',
              label: t('reportPage.planning.warningsTab', { count: warnings.length + (guidance.tradeoffs?.length ?? 0) }),
              children: (
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  {warnings.length > 0 ? (
                    warnings.map((warning) => (
                      <Alert key={warning} type="warning" showIcon message={translatePlanningGuidanceText(warning)} />
                    ))
                  ) : (
                    <Text type="secondary">{t('reportPage.planning.warningsEmpty')}</Text>
                  )}
                  {(guidance.tradeoffs?.length ?? 0) > 0 && (
                    <Descriptions column={1} size="small" bordered>
                      <Descriptions.Item label={t('reportPage.planning.tradeoffsLabel')}>
                        <Space direction="vertical" size={4}>
                          {guidance.tradeoffs?.map((item) => (
                            <Text key={item} type="secondary">
                              - {translatePlanningGuidanceText(item)}
                            </Text>
                          ))}
                        </Space>
                      </Descriptions.Item>
                    </Descriptions>
                  )}
                </Space>
              ),
            },
            {
              key: 'evidence',
              label: t('reportPage.planning.evidenceTab', { count: guidance.evidence_classes?.length ?? 0 }),
              children: (
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label={t('reportPage.planning.labelEvidenceClasses')}>
                    {renderPlanningTags(guidance.evidence_classes)}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('reportPage.planning.labelAuthoritative')}>
                    {renderPlanningTags(guidance.authoritative_evidence_classes)}
                  </Descriptions.Item>
                  <Descriptions.Item label={i18next.t('projectEval:reportPage.planning.labelDiagnostic')}>
                    {renderPlanningTags(guidance.diagnostic_evidence_classes)}
                  </Descriptions.Item>
                  <Descriptions.Item label={i18next.t('projectEval:reportPage.planning.labelDeferred')}>
                    {renderPlanningTags(guidance.deferred_evidence_classes)}
                  </Descriptions.Item>
                </Descriptions>
              ),
            },
            {
              key: 'commands',
              label: t('reportPage.planning.commandsTab', { count: commandCount }),
              children: (
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label={t('reportPage.planning.labelSetup')}>
                    {renderRawTags(guidance.setup_command_candidates || guidance.setup_commands)}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('reportPage.planning.labelTest')}>
                    {renderRawTags(guidance.test_command_candidates)}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('reportPage.planning.labelSupport')}>
                    {renderRawTags(guidance.support_command_candidates)}
                  </Descriptions.Item>
                </Descriptions>
              ),
            },
            {
              key: 'next',
              label: t('reportPage.planning.nextActionsTab', { count: guidance.next_actions?.length ?? 0 }),
              children:
                guidance.next_actions && guidance.next_actions.length > 0 ? (
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    {guidance.next_actions.map((action) => (
                      <Alert key={action} type="info" showIcon message={translatePlanningGuidanceText(action)} />
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">{t('reportPage.planning.nextActionsEmpty')}</Text>
                ),
            },
            ...(metrics.length > 0
              ? [
                  {
                    key: 'extra-metrics',
                    label: t('reportPage.planning.otherMetrics'),
                    children: (
                      <Descriptions column={1} size="small" bordered>
                        {metrics.map(([key, value]) => (
                          <Descriptions.Item key={key} label={planningValueLabel(key)}>
                            {metricValueToNode(value)}
                          </Descriptions.Item>
                        ))}
                      </Descriptions>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Space>
    </Card>
  );
}

interface LargeProjectCoverageCardProps {
  section: RunReportSectionView;
  report: RunReportView;
}

function LargeProjectCoverageCard({ section, report }: LargeProjectCoverageCardProps) {
  const { t } = useTranslation('projectEval');
  const tokens = useThemeTokens();
  const coverage = report.large_project_coverage;
  const metrics = metricEntriesForSection(section);

  if (!coverage) {
    return <ReportSectionCard section={section} />;
  }

  const moduleReadinessPercent = percentNumber(coverage.module_slice_readiness_ratio);
  const evaluationCoveragePercent = percentNumber(coverage.evaluation_coverage_ratio);
  const hasRisk = (coverage.risk_flags?.length ?? 0) > 0 || coverage.status !== 'covered';

  return (
    <Card
      data-testid="project-eval-large-project-coverage-card"
      title={
        <Space wrap>
          <span>{t('reportPage.coverage.cardTitle')}</span>
          <Tag color={coverageStatusColor(coverage.status)}>{humanizeKey(coverage.status)}</Tag>
          <Tag color={severityColor(coverage.severity)}>{humanizeKey(coverage.severity)}</Tag>
          {coverage.scale_profile && <Tag>{humanizeKey(coverage.scale_profile)}</Tag>}
        </Space>
      }
      size="small"
      style={{
        borderColor: hasRisk ? '#f59e0b' : tokens.border.default,
        background: `linear-gradient(135deg, ${tokens.bg.primary}, ${tokens.bg.secondary})`,
      }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Alert
          type={coverageAlertType(coverage)}
          showIcon
          message={coverage.summary || section.summary || t('reportPage.coverage.summaryFallback')}
          description={t('reportPage.coverage.summaryDesc')}
        />

        <Row gutter={[12, 12]}>
          <Col xs={12} lg={6}>
            <Card size="small" bodyStyle={{ padding: 12 }}>
              <Statistic title={t('reportPage.coverage.statPlanStages')} value={coverage.stage_count ?? 0} />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card size="small" bodyStyle={{ padding: 12 }}>
              <Statistic
                title={t('reportPage.coverage.statModuleReady')}
                value={`${coverage.ready_module_slice_count ?? 0}/${coverage.module_slice_count ?? 0}`}
              />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card size="small" bodyStyle={{ padding: 12 }}>
              <Statistic
                title={i18next.t('projectEval:reportPage.coverage.statSampledSkipped')}
                value={`${coverage.sampled_case_count ?? 0}/${coverage.skipped_candidate_case_count ?? 0}`}
              />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card size="small" bodyStyle={{ padding: 12 }}>
              <Statistic
                title={i18next.t('projectEval:reportPage.coverage.statDeferred')}
                value={coverage.deferred_candidate_case_count ?? 0}
                valueStyle={{
                  color: (coverage.deferred_candidate_case_count ?? 0) > 0 ? '#f59e0b' : '#10b981',
                }}
              />
            </Card>
          </Col>
        </Row>

        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card size="small" title={t('reportPage.coverage.moduleReadinessTitle')} bodyStyle={{ padding: 12 }}>
              <Progress
                percent={moduleReadinessPercent}
                status={moduleReadinessPercent < 100 ? 'active' : 'success'}
              />
              <Text type="secondary">
                {t('reportPage.coverage.sourceBacked', { ready: coverage.source_backed_module_slice_count ?? 0, total: coverage.module_slice_count ?? 0 })}
              </Text>
            </Card>
          </Col>
          <Col xs={24} md={12}>
            <Card size="small" title={t('reportPage.coverage.evalCoverageTitle')} bodyStyle={{ padding: 12 }}>
              <Progress
                percent={evaluationCoveragePercent}
                status={coverage.insufficient_evidence_case_count ? 'exception' : 'success'}
              />
              <Text type="secondary">
                {t('reportPage.coverage.evaluatedLine', { evaluated: coverage.evaluated_case_count ?? 0, selected: coverage.selected_case_count ?? 0, score: formatCoverage(coverage.coverage_score) })}
              </Text>
            </Card>
          </Col>
        </Row>

        <Descriptions title={t('reportPage.coverage.strategyTitle')} size="small" column={{ xs: 1, md: 2 }} bordered>
          <Descriptions.Item label={t('reportPage.coverage.labelOrchestrationMode')}>
            {humanizeKey(coverage.orchestration_mode)}
          </Descriptions.Item>
          <Descriptions.Item label={t('reportPage.coverage.labelEvaluationDepth')}>
            {humanizeKey(coverage.evaluation_depth)}
          </Descriptions.Item>
          <Descriptions.Item label={t('reportPage.coverage.labelSamplingPolicy')}>
            {humanizeKey(coverage.sampling_policy)}
          </Descriptions.Item>
          <Descriptions.Item label={t('reportPage.coverage.labelCoverageFloor')}>
            {humanizeKey(coverage.coverage_floor_policy)}
          </Descriptions.Item>
          <Descriptions.Item label={t('reportPage.coverage.labelPartialResult')}>
            {humanizeKey(coverage.partial_result_policy)}
          </Descriptions.Item>
          <Descriptions.Item label={t('reportPage.coverage.labelTotalKnown')}>
            {coverage.total_repository_case_count_known ? t('reportPage.common.yes') : t('reportPage.common.no')}
          </Descriptions.Item>
        </Descriptions>

        <Collapse
          defaultActiveKey={hasRisk ? ['risks', 'actions'] : ['requirements']}
          items={[
            {
              key: 'risks',
              label: t('reportPage.coverage.risksTab', { count: coverage.risk_flags?.length ?? 0 }),
              children:
                coverage.risk_flags && coverage.risk_flags.length > 0 ? (
                  renderCompactTags(coverage.risk_flags)
                ) : (
                  <Text type="secondary">{t('reportPage.coverage.risksEmpty')}</Text>
                ),
            },
            {
              key: 'actions',
              label: t('reportPage.coverage.actionsTab', { count: coverage.next_actions?.length ?? 0 }),
              children:
                coverage.next_actions && coverage.next_actions.length > 0 ? (
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    {coverage.next_actions.map((action) => (
                      <Alert key={action} type="warning" showIcon message={translatePlanningGuidanceText(action)} />
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">{t('reportPage.coverage.actionsEmpty')}</Text>
                ),
            },
            {
              key: 'requirements',
              label: t('reportPage.coverage.requirementsTab', { count: coverage.disclosure_requirements?.length ?? 0 }),
              children: (
                <Descriptions column={1} size="small" bordered>
                  <Descriptions.Item label={i18next.t('projectEval:reportPage.coverage.labelDisclosureRequirements')}>
                    {renderCompactTags(coverage.disclosure_requirements)}
                  </Descriptions.Item>
                  <Descriptions.Item label={i18next.t('projectEval:reportPage.coverage.labelDeferredEvidenceClasses')}>
                    {renderCompactTags(coverage.deferred_evidence_classes)}
                  </Descriptions.Item>
                  <Descriptions.Item label={i18next.t('projectEval:reportPage.coverage.labelReadinessCounts')}>
                    {renderCountMapTags(coverage.module_slice_readiness_counts)}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('reportPage.coverage.labelCommandOutcomeCounts')}>
                    {renderCountMapTags(coverage.module_slice_command_outcome_counts)}
                  </Descriptions.Item>
                </Descriptions>
              ),
            },
            ...(metrics.length > 0
              ? [
                  {
                    key: 'extra-metrics',
                    label: t('reportPage.coverage.otherMetrics'),
                    children: (
                      <Descriptions column={1} size="small" bordered>
                        {metrics.map(([key, value]) => (
                          <Descriptions.Item key={key} label={planningValueLabel(key)}>
                            {metricValueToNode(value)}
                          </Descriptions.Item>
                        ))}
                      </Descriptions>
                    ),
                  },
                ]
              : []),
          ]}
        />
      </Space>
    </Card>
  );
}

interface SupportPostureCardProps {
  section: RunReportSectionView;
  report: RunReportView;
}

function SupportPostureCard({ section, report }: SupportPostureCardProps) {
  const { t } = useTranslation('projectEval');
  const tokens = useThemeTokens();
  const posture = report.support_posture;
  const metrics = metricEntriesForSection(section);

  if (!posture) {
    return <ReportSectionCard section={section} />;
  }

  const status = posture.status || posture.acceptance?.status;
  const freshness = posture.freshness || posture.acceptance?.freshness;
  const knownGaps = posture.known_gaps ?? [];
  const limitations = posture.limitations ?? [];
  const samples = posture.representative_samples ?? [];
  const hasSupportRisk =
    posture.policy_enabled === false ||
    posture.depth_supported === false ||
    freshness === 'stale' ||
    status === 'exploratory' ||
    knownGaps.length > 0 ||
    limitations.length > 0;

  return (
    <Card
      data-testid="project-eval-support-posture-card"
      title={
        <Space wrap>
          <span>{t('reportPage.support.cardTitle')}</span>
          <Tag color={supportStatusColor(status)}>{humanizeKey(status)}</Tag>
          <Tag color={supportFreshnessColor(freshness)}>{humanizeKey(freshness)}</Tag>
          {posture.maturity && <Tag>{humanizeKey(posture.maturity)}</Tag>}
          {section.severity && (
            <Tag color={severityColor(section.severity)}>{humanizeKey(section.severity)}</Tag>
          )}
        </Space>
      }
      size="small"
      style={{
        borderColor: hasSupportRisk ? '#f59e0b' : tokens.border.default,
        background: `linear-gradient(135deg, ${tokens.bg.primary}, ${tokens.bg.secondary})`,
      }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <Paragraph style={{ marginBottom: 0 }}>
          {section.summary || t('reportPage.support.summaryFallback')}
        </Paragraph>

        {hasSupportRisk ? (
          <Alert
            type="warning"
            showIcon
            message={t('reportPage.support.hasRiskTitle')}
            description={t('reportPage.support.hasRiskDesc')}
          />
        ) : (
          <Alert
            type="success"
            showIcon
            message={t('reportPage.support.noRiskTitle')}
            description={t('reportPage.support.noRiskDesc')}
          />
        )}

        {posture.operator_review ? (
          <Alert
            type={posture.operator_review.stale ? 'warning' : 'info'}
            showIcon
            message={
              posture.operator_review.stale
                ? t('reportPage.support.reviewStaleTitle')
                : t('reportPage.support.reviewHasTitle')
            }
            description={
              <Space direction="vertical" size={4}>
                <Space wrap size={4}>
                  <Tag color={operatorReviewStatusColor(posture.operator_review.review_status)}>
                    {humanizeKey(posture.operator_review.review_status)}
                  </Tag>
                  <Text type="secondary">
                    {posture.operator_review.updated_by} ·{' '}
                    {formatDateTime(posture.operator_review.updated_at)}
                  </Text>
                </Space>
                <Text>{posture.operator_review.reason}</Text>
                {posture.operator_review.note ? (
                  <Text type="secondary">{posture.operator_review.note}</Text>
                ) : null}
              </Space>
            }
          />
        ) : null}

        <Row gutter={[12, 12]}>
          <Col xs={12} lg={6}>
            <Card size="small" bodyStyle={{ padding: 12 }}>
              <Statistic title={t('reportPage.support.statEvidenceCount')} value={posture.acceptance?.evidence_count ?? 0} />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card size="small" bodyStyle={{ padding: 12 }}>
              <Statistic title={t('reportPage.support.statSamples')} value={posture.acceptance?.sample_count ?? samples.length} />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card size="small" bodyStyle={{ padding: 12 }}>
              <Statistic
                title={t('reportPage.support.statKnownGaps')}
                value={posture.acceptance?.known_gap_count ?? knownGaps.length}
                valueStyle={{ color: knownGaps.length > 0 ? '#f59e0b' : '#10b981' }}
              />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card size="small" bodyStyle={{ padding: 12 }}>
              <Statistic
                title={t('reportPage.support.statDepthSupport')}
                value={posture.depth_supported ? t('reportPage.common.yes') : t('reportPage.common.no')}
                valueStyle={{ color: posture.depth_supported ? '#10b981' : '#ef4444' }}
              />
            </Card>
          </Col>
        </Row>

        <Descriptions title={t('reportPage.support.laneSummaryTitle')} size="small" column={{ xs: 1, md: 2 }} bordered>
          <Descriptions.Item label={t('reportPage.support.labelLane')}>{supportLaneText(posture) || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('reportPage.support.labelMatrixVersion')}>{posture.matrix_version || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('reportPage.support.labelProjectType')}>{humanizeKey(posture.project_type)}</Descriptions.Item>
          <Descriptions.Item label={t('reportPage.support.labelScaleProfile')}>{humanizeKey(posture.scale_profile)}</Descriptions.Item>
          <Descriptions.Item label={t('reportPage.support.labelRecommendedScope')}>
            {humanizeKey(posture.recommended_scope)}
          </Descriptions.Item>
          <Descriptions.Item label={t('reportPage.support.labelDetectionConfidence')}>
            {humanizeKey(posture.detection_confidence)}
          </Descriptions.Item>
          <Descriptions.Item label={t('reportPage.support.labelPolicyEnabled')}>
            {posture.policy_enabled ? t('reportPage.common.yes') : t('reportPage.common.no')}
          </Descriptions.Item>
          <Descriptions.Item label={t('reportPage.support.labelLastVerified')}>
            {posture.acceptance?.last_verified_at || '-'}
          </Descriptions.Item>
          <Descriptions.Item label={t('reportPage.support.labelNextReview')}>
            {posture.acceptance?.next_review_due || '-'}
          </Descriptions.Item>
        </Descriptions>

        <Collapse
          defaultActiveKey={hasSupportRisk ? ['gaps'] : ['evidence']}
          items={[
            {
              key: 'gaps',
              label: t('reportPage.support.gapsTab', { count: knownGaps.length + limitations.length }),
              children:
                knownGaps.length > 0 || limitations.length > 0 ? (
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    {knownGaps.map((gap) => (
                      <Alert key={gap} type="warning" showIcon message={i18next.t('projectEval:reportPage.support.knownGap')} description={gap} />
                    ))}
                    {limitations.map((limitation) => (
                      <Alert
                        key={limitation}
                        type="info"
                        showIcon
                        message={i18next.t('projectEval:reportPage.support.limitation')}
                        description={limitation}
                      />
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">{t('reportPage.support.gapsEmpty')}</Text>
                ),
            },
            {
              key: 'evidence',
              label: t('reportPage.support.evidenceTab', { count: posture.evidence_refs?.length ?? 0 }),
              children: (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label={t('reportPage.support.labelValidationLanes')}>
                      {renderCompactTags(posture.validation_lanes)}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('reportPage.support.labelEvidenceClasses')}>
                      {renderCompactTags(posture.evidence_classes)}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('reportPage.support.labelSupportedDepths')}>
                      {renderCompactTags(posture.supported_depths)}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('reportPage.support.labelEvidenceRefs')}>
                      {renderCompactTags(posture.evidence_refs, t('reportPage.support.noEvidenceRefs'))}
                    </Descriptions.Item>
                  </Descriptions>
                </Space>
              ),
            },
            {
              key: 'samples',
              label: t('reportPage.support.samplesTab', { count: samples.length }),
              children:
                samples.length > 0 ? (
                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    {samples.map((sample) => (
                      <Card key={sample.id} size="small" bodyStyle={{ padding: 12 }}>
                        <Space direction="vertical" size={8} style={{ width: '100%' }}>
                          <Space wrap>
                            <Text strong>{sample.name || sample.id}</Text>
                            <Tag>{humanizeKey(sample.sample_type)}</Tag>
                            <Tag color={supportStatusColor(sample.status)}>
                              {humanizeKey(sample.status)}
                            </Tag>
                          </Space>
                          {sample.notes && <Text type="secondary">{sample.notes}</Text>}
                          <Space direction="vertical" size={4}>
                            <Text type="secondary">
                              {t('reportPage.support.sampleDepth')}{renderCompactTags(sample.depths, t('reportPage.support.notDeclared'))}
                            </Text>
                            <Text type="secondary">
                              {t('reportPage.support.sampleEvidence')}{renderCompactTags(sample.evidence_classes, t('reportPage.support.notDeclared'))}
                            </Text>
                          </Space>
                        </Space>
                      </Card>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary">{t('reportPage.support.samplesEmpty')}</Text>
                ),
            },
            ...(metrics.length > 0
              ? [
                  {
                    key: 'extra-metrics',
                    label: t('reportPage.support.otherMetrics'),
                    children: (
                      <Descriptions column={1} size="small" bordered>
                        {metrics.map(([key, value]) => (
                          <Descriptions.Item key={key} label={planningValueLabel(key)}>
                            {metricValueToNode(value)}
                          </Descriptions.Item>
                        ))}
                      </Descriptions>
                    ),
                  },
                ]
              : []),
          ]}
        />

        {section.items && section.items.length > 0 && (
          <Space direction="vertical" size={6}>
            {section.items.map((item) => (
              <Text key={item} type="secondary">
                - {item}
              </Text>
            ))}
          </Space>
        )}
      </Space>
    </Card>
  );
}

interface AgentOrchestrationComplianceCardProps {
  section: RunReportSectionView;
  report: RunReportView;
  linkedRepairID?: string;
  onOpenExecution: (executionID: string) => void;
  onOpenRepair: () => void;
  onOpenExplain: () => void;
}

function AgentOrchestrationComplianceCard({
  section,
  report,
  linkedRepairID,
  onOpenExecution,
  onOpenRepair,
  onOpenExplain,
}: AgentOrchestrationComplianceCardProps) {
  const { t } = useTranslation('projectEval');
  const tokens = useThemeTokens();
  const compliance = latestAgentContractCompliance(section, report);
  const metrics = metricEntriesForSection(section);
  const requiredGapCount =
    compliance?.required_gap_count ??
    numberValue(section.metrics?.contract_compliance_required_gap_count) ??
    0;
  const gapCount =
    compliance?.gap_count ?? numberValue(section.metrics?.contract_compliance_gap_count) ?? 0;
  const score = compliance?.score ?? numberValue(section.metrics?.contract_compliance_score);
  const status =
    compliance?.status ??
    (stringValue(section.metrics?.contract_compliance_status) as
      | ContractComplianceStatus
      | undefined);

  return (
    <Card
      data-testid="project-eval-agent-compliance-card"
      title={
        <Space wrap>
          <span>{t('reportPage.agent.cardTitle')}</span>
          {renderStatusTag(status)}
          {section.severity && (
            <Tag color={severityColor(section.severity)}>{humanizeKey(section.severity)}</Tag>
          )}
        </Space>
      }
      size="small"
      style={{
        borderColor: requiredGapCount > 0 ? '#ef4444' : tokens.border.default,
        background: `linear-gradient(135deg, ${tokens.bg.primary}, ${tokens.bg.secondary})`,
      }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {section.summary && <Paragraph style={{ marginBottom: 0 }}>{section.summary}</Paragraph>}

        {requiredGapCount > 0 ? (
          <Alert
            type="error"
            showIcon
            message={t('reportPage.agent.gapErrorTitle')}
            description={t('reportPage.agent.gapErrorDesc')}
          />
        ) : (
          <Alert
            type={compliance ? 'success' : 'info'}
            showIcon
            message={compliance ? t('reportPage.agent.okTitle') : t('reportPage.agent.noResultTitle')}
            description={
              compliance
                ? t('reportPage.agent.okDesc')
                : t('reportPage.agent.noResultDesc')
            }
          />
        )}

        <Row gutter={[12, 12]}>
          <Col xs={12} lg={6}>
            <Card size="small" bodyStyle={{ padding: 12 }}>
              <Statistic title={t('reportPage.agent.statScore')} value={scoreText(score)} />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card size="small" bodyStyle={{ padding: 12 }}>
              <Statistic
                title={t('reportPage.agent.statRequiredGaps')}
                value={requiredGapCount}
                valueStyle={{ color: requiredGapCount > 0 ? '#ef4444' : '#10b981' }}
              />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card size="small" bodyStyle={{ padding: 12 }}>
              <Statistic title={t('reportPage.agent.statTotalGaps')} value={gapCount} />
            </Card>
          </Col>
          <Col xs={12} lg={6}>
            <Card size="small" bodyStyle={{ padding: 12 }}>
              <Statistic
                title={t('reportPage.agent.statRequiredSatisfied')}
                value={`${compliance?.required_satisfied ?? 0}/${compliance?.required_total ?? 0}`}
              />
            </Card>
          </Col>
        </Row>

        {compliance?.summary && (
          <Alert type="info" showIcon message={t('reportPage.agent.summaryAlert')} description={compliance.summary} />
        )}

        <Descriptions title={t('reportPage.agent.contractTitle')} size="small" column={{ xs: 1, md: 2 }} bordered>
          {contractFactRows(section, report).map(([label, value]) => (
            <Descriptions.Item key={label} label={label}>
              {value}
            </Descriptions.Item>
          ))}
          <Descriptions.Item label={t('reportPage.agent.labelExecutionRecord')}>
            {compliance?.execution_record_id ? (
              <Button
                type="link"
                style={{ paddingInline: 0 }}
                onClick={() => onOpenExecution(compliance.execution_record_id!)}
              >
                {compliance.execution_record_id}
              </Button>
            ) : (
              '-'
            )}
          </Descriptions.Item>
          <Descriptions.Item label={t('reportPage.agent.labelLinkedRepair')}>
            {linkedRepairID ? (
              <Button type="link" style={{ paddingInline: 0 }} onClick={onOpenRepair}>
                {linkedRepairID}
              </Button>
            ) : (
              '-'
            )}
          </Descriptions.Item>
        </Descriptions>

        {section.items && section.items.length > 0 && (
          <Space direction="vertical" size={6}>
            {section.items.map((item) => (
              <Text key={item} type="secondary">
                - {item}
              </Text>
            ))}
          </Space>
        )}

        <Collapse
          defaultActiveKey={requiredGapCount > 0 ? ['gaps'] : ['checks']}
          items={[
            {
              key: 'gaps',
              label: t('reportPage.agent.gapsTab', { count: gapCount }),
              children: <ContractGapCards gaps={compliance?.gaps} />,
            },
            {
              key: 'checks',
              label: t('reportPage.agent.checksTab', { count: compliance?.self_checks?.length ?? 0 }),
              children: <ContractCheckCards items={compliance?.self_checks} />,
            },
            {
              key: 'deliverables',
              label: t('reportPage.agent.deliverablesTab', { count: compliance?.deliverables?.length ?? 0 }),
              children: <ContractDeliverableCards items={compliance?.deliverables} />,
            },
            ...(metrics.length > 0
              ? [
                  {
                    key: 'extra-metrics',
                    label: t('reportPage.agent.otherMetrics'),
                    children: (
                      <Descriptions column={1} size="small" bordered>
                        {metrics.map(([key, value]) => (
                          <Descriptions.Item key={key} label={planningValueLabel(key)}>
                            {metricValueToNode(value)}
                          </Descriptions.Item>
                        ))}
                      </Descriptions>
                    ),
                  },
                ]
              : []),
          ]}
        />

        <Space wrap>
          {compliance?.execution_record_id && (
            <Button onClick={() => onOpenExecution(compliance.execution_record_id!)}>
              {t('reportPage.actions.viewExecution')}
            </Button>
          )}
          {linkedRepairID && (
            <Button
              type={requiredGapCount > 0 ? 'primary' : 'default'}
              icon={<ToolOutlined />}
              onClick={onOpenRepair}
            >
              {t('reportPage.actions.viewRepair')}
            </Button>
          )}
          <Button icon={<QuestionCircleOutlined />} onClick={onOpenExplain}>
            {t('reportPage.openExplain')}
          </Button>
        </Space>
      </Space>
    </Card>
  );
}

interface NextActionsCardProps {
  actions?: RunReportNextActionView[];
  onPrimaryAction: (action: RunReportNextActionView) => void;
  getPrimaryActionLabel: (action: RunReportNextActionView) => string;
  executingActionId?: string | null;
}

function NextActionsCard({
  actions,
  onPrimaryAction,
  getPrimaryActionLabel,
  executingActionId,
}: NextActionsCardProps) {
  const { t } = useTranslation('projectEval');
  if (!actions || actions.length === 0) {
    return (
      <Card title={t('reportPage.nextActions.cardTitle')} size="small">
        <Text type="secondary">{t('reportPage.nextActions.empty')}</Text>
      </Card>
    );
  }

  return (
    <Card title={t('reportPage.nextActions.cardTitle')} size="small">
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        {actions.map((action) => (
          <Card key={`${action.id}:${action.label}`} size="small" bodyStyle={{ padding: 12 }}>
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              <Space wrap>
                <Text strong>{action.label}</Text>
                <Tag color={actionPriorityColor(action.priority)}>
                  {humanizeKey(action.priority)}
                </Tag>
                {action.recommended && <Tag color="green">{t('reportPage.nextActions.recommended')}</Tag>}
              </Space>
              {action.reason && <Text type="secondary">{action.reason}</Text>}
              {shouldRenderNextActionButton(action) && (
                <Button
                  size="small"
                  type={action.recommended ? 'primary' : 'default'}
                  icon={getNextActionButtonIcon(action)}
                  loading={executingActionId === action.id}
                  data-testid={`project-eval-next-action-${action.id}`}
                  onClick={() => onPrimaryAction(action)}
                >
                  {getPrimaryActionLabel(action)}
                </Button>
              )}
            </Space>
          </Card>
        ))}
      </Space>
    </Card>
  );
}

interface EvidencePostureCardProps {
  posture?: RunEvidencePostureView;
  onOpenExplain: () => void;
}

function EvidencePostureCard({ posture, onOpenExplain }: EvidencePostureCardProps) {
  const { t } = useTranslation('projectEval');

  if (!posture) {
    return (
      <Card title={t('reportPage.evidencePosture.cardTitle')} size="small">
        <Text type="secondary">{t('reportPage.evidencePosture.empty')}</Text>
      </Card>
    );
  }

  const missingExecution = posture.missing_current_run_execution_cases ?? 0;
  const hasBlockingGap = posture.insufficient_evidence || missingExecution > 0;

  return (
    <Card
      data-testid="project-eval-evidence-posture-card"
      title={
        <Space wrap>
          <span>{t('reportPage.evidencePosture.cardTitle')}</span>
          <Tag color={evidencePostureStatusColor(posture)}>
            {evidencePostureStatusLabel(posture.status)}
          </Tag>
        </Space>
      }
      size="small"
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Alert
          type={evidencePostureAlertType(posture)}
          showIcon
          message={
            posture.authoritative_ready
              ? t('reportPage.evidencePosture.readyTitle')
              : t('reportPage.evidencePosture.notReadyTitle')
          }
          description={
            posture.authoritative_ready
              ? t('reportPage.evidencePosture.readyDesc')
              : evidenceInsufficientReasonLabel(posture.insufficient_evidence_reason)
          }
        />

        <Row gutter={[12, 12]}>
          <Col xs={12}>
            <Card size="small" bodyStyle={{ padding: 12 }}>
              <Statistic
                title={t('reportPage.evidencePosture.statCurrentRun')}
                value={countText(posture.current_run_execution_cases)}
                valueStyle={{ color: posture.authoritative_ready ? '#10b981' : undefined }}
              />
            </Card>
          </Col>
          <Col xs={12}>
            <Card size="small" bodyStyle={{ padding: 12 }}>
              <Statistic
                title={t('reportPage.evidencePosture.statMissingRun')}
                value={countText(posture.missing_current_run_execution_cases)}
                valueStyle={{ color: missingExecution > 0 ? '#ef4444' : '#10b981' }}
              />
            </Card>
          </Col>
          <Col xs={12}>
            <Card size="small" bodyStyle={{ padding: 12 }}>
              <Statistic
                title={t('reportPage.evidencePosture.statSelected')}
                value={posture.selected_cases}
              />
            </Card>
          </Col>
          <Col xs={12}>
            <Card size="small" bodyStyle={{ padding: 12 }}>
              <Statistic
                title={t('reportPage.evidencePosture.statEvaluated')}
                value={posture.evaluated_cases}
              />
            </Card>
          </Col>
        </Row>

        <Descriptions size="small" column={1} bordered>
          <Descriptions.Item label={t('reportPage.evidencePosture.labelTruthSource')}>
            {evidenceTruthSourceLabel(posture.truth_source_mode)}
          </Descriptions.Item>
          <Descriptions.Item label={t('reportPage.evidencePosture.labelBenchmarkFusion')}>
            {countText(posture.benchmark_fusion_cases)}
          </Descriptions.Item>
          <Descriptions.Item label={t('reportPage.evidencePosture.labelInsufficientCases')}>
            {posture.insufficient_cases}
          </Descriptions.Item>
          {posture.reverification && (
            <Descriptions.Item label={t('reportPage.evidencePosture.labelReverification')}>
              <Space wrap>
                {posture.reverification.status && (
                  <Tag>{humanizeKey(posture.reverification.status)}</Tag>
                )}
                {posture.reverification.authority_status && (
                  <Tag
                    color={
                      posture.reverification.authority_status === 'authoritative'
                        ? 'green'
                        : 'orange'
                    }
                  >
                    {humanizeKey(posture.reverification.authority_status)}
                  </Tag>
                )}
                <Text type="secondary">
                  {countText(posture.reverification.matched_cases)} /{' '}
                  {countText(posture.reverification.observed_cases)}
                </Text>
              </Space>
            </Descriptions.Item>
          )}
        </Descriptions>

        <Collapse
          items={[
            {
              key: 'counts',
              label: t('reportPage.evidencePosture.rawCounts'),
              children: (
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <div>
                    <Text type="secondary">{t('reportPage.evidencePosture.truthSourceCounts')}</Text>
                    <div style={{ marginTop: 6 }}>
                      {renderCountMapTags(posture.truth_source_counts)}
                    </div>
                  </div>
                  <div>
                    <Text type="secondary">{t('reportPage.evidencePosture.bindingCounts')}</Text>
                    <div style={{ marginTop: 6 }}>
                      {renderCountMapTags(posture.binding_resolution_counts)}
                    </div>
                  </div>
                </Space>
              ),
            },
          ]}
        />

        {hasBlockingGap && (
          <Button icon={<QuestionCircleOutlined />} onClick={onOpenExplain}>
            {t('reportPage.openExplain')}
          </Button>
        )}
      </Space>
    </Card>
  );
}

interface OutcomePostureCardProps {
  outcome?: RunReportOutcomeView;
  linkedRepairID?: string;
  onOpenRepair: () => void;
  onOpenExplain: () => void;
}

function OutcomePostureCard({
  outcome,
  linkedRepairID,
  onOpenRepair,
  onOpenExplain,
}: OutcomePostureCardProps) {
  const { t } = useTranslation('projectEval');
  if (!outcome) {
    return (
      <Card title={t('reportPage.outcomePosture.cardTitle')} size="small">
        <Text type="secondary">{t('reportPage.outcomePosture.empty')}</Text>
      </Card>
    );
  }

  const tone = getReportOutcomeTone(outcome.kind);
  const summary = getReportOutcomeSummary(outcome);
  const showRepairButton =
    isRepairOutcomeAction(outcome) || (outcome.kind === 'replay' && Boolean(linkedRepairID));
  const showExplainButton = outcome.kind === 'refusal';

  return (
    <Card
      data-testid="project-eval-outcome-card"
      title={
        <Space wrap>
          <span>{t('reportPage.outcomePosture.cardTitle')}</span>
          <Tag color={tone.color}>{outcome.label || tone.label}</Tag>
        </Space>
      }
      size="small"
    >
      <Space direction="vertical" size={12} style={{ width: '100%' }}>
        <Paragraph style={{ marginBottom: 0 }}>{summary}</Paragraph>
        {outcome.kind === 'refusal' && (
          <Alert
            type="warning"
            showIcon
            message={t('reportPage.outcomePosture.refusalTitle')}
            description={
              outcome.refusal_reason
                ? humanizeKey(outcome.refusal_reason)
                : t('reportPage.outcomePosture.refusalDefault')
            }
          />
        )}
        <Descriptions size="small" column={1} bordered>
          <Descriptions.Item label={t('reportPage.outcomePosture.labelStage')}>{getStageLabel(outcome.stage)}</Descriptions.Item>
          <Descriptions.Item label={t('reportPage.outcomePosture.labelNext')}>{getOutcomeNextActionLabel(outcome)}</Descriptions.Item>
          <Descriptions.Item label={t('reportPage.outcomePosture.labelRepair')}>
            {outcome.repair_eligible ? t('reportPage.outcomePosture.repairEligible') : t('reportPage.outcomePosture.repairNot')}
          </Descriptions.Item>
          <Descriptions.Item label={t('reportPage.outcomePosture.labelReplay')}>
            {outcome.replay_eligible ? t('reportPage.outcomePosture.replayEligible') : t('reportPage.outcomePosture.replayNot')}
          </Descriptions.Item>
          <Descriptions.Item label={t('reportPage.outcomePosture.labelAuthority')}>
            {getOutcomeAuthorityLabel(outcome.outcome_authority_source)}
          </Descriptions.Item>
        </Descriptions>
        {(showRepairButton || showExplainButton) && (
          <Space wrap>
            {showRepairButton && (
              <Button type="primary" icon={<ToolOutlined />} onClick={onOpenRepair}>
                {linkedRepairID ? t('reportPage.actions.viewRepair') : t('reportPage.actions.createDraft')}
              </Button>
            )}
            {showExplainButton && (
              <Button icon={<QuestionCircleOutlined />} onClick={onOpenExplain}>
                {t('reportPage.openExplain')}
              </Button>
            )}
          </Space>
        )}
      </Space>
    </Card>
  );
}

export default function ProjectEvalReportPage() {
  const { t } = useTranslation('projectEval');
  const { id: runId } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokens = useThemeTokens();
  const [report, setReport] = useState<RunReportView | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [exportFormat, setExportFormat] = useState<RunReportExportFormat>('json');
  const [includeEvidenceRecords, setIncludeEvidenceRecords] = useState(true);
  const [includeRawTraces, setIncludeRawTraces] = useState(true);
  const [traceStageStatus, setTraceStageStatus] = useState('failed');
  const [exporting, setExporting] = useState(false);
  const [executingActionId, setExecutingActionId] = useState<string | null>(null);
  const [exportPreview, setExportPreview] = useState<RunReportExportView | null>(null);

  const selectedVariant = normalizeReportVariant(
    searchParams.get('variant') ?? searchParams.get('report_variant')
  );

  const fetchReport = useCallback(async () => {
    if (!runId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setLoadError(false);
    try {
      const response = await projectEvalService.getRunReport(runId, { variant: selectedVariant });
      setReport(response as unknown as RunReportView);
    } catch {
      setReport(null);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [runId, selectedVariant]);

  useEffect(() => {
    void fetchReport();
  }, [fetchReport]);

  useEffect(() => {
    if (!report) {
      return;
    }

    saveRecentProjectEvalRun({
      id: report.run_id,
      status: report.status,
      decision: report.decision,
      score: report.score,
    });
  }, [report]);

  const decisionTone = getDecisionTone(report?.decision);
  const statusTone = getStatusTone(report?.status);
  const evidenceSummary = report?.evidence_summary;
  const reportOutcome = report?.outcome;
  const linkedRepair =
    report?.remediation?.latest_linked_repair ??
    report?.mainline?.latest_linked_repair ??
    reportOutcome?.linked_repair;
  const remediationOutcome =
    report?.remediation?.latest_outcome ??
    report?.mainline?.latest_remediation_outcome ??
    reportOutcome?.remediation_outcome;
  const activeVariant = normalizeReportVariant(report?.view_variant || selectedVariant);
  const repairNavigationPath = useMemo(
    () => buildProjectEvalRepairPath(runId, linkedRepair?.id),
    [linkedRepair?.id, runId]
  );
  const tabs = useMemo(
    () => reportVariantTabs(report?.available_variants),
    [report?.available_variants]
  );
  const exportFormats = useMemo(
    () => reportExportFormats(report?.export_targets, activeVariant),
    [activeVariant, report?.export_targets]
  );
  const repairDraftTitle = useMemo(() => buildRepairDraftTitle(report, runId), [report, runId]);
  const repairDraftObjective = useMemo(
    () => buildRepairDraftObjective(runId, report),
    [report, runId]
  );
  const repairDraftPath = useMemo(
    () =>
      buildProjectEvalRepairDraftPath(runId, {
        task_title: repairDraftTitle,
        task_objective: repairDraftObjective,
      }),
    [repairDraftObjective, repairDraftTitle, runId]
  );
  const statusCounts = useMemo(
    () => readCountMap(report?.case_selection_summary, 'status_counts'),
    [report?.case_selection_summary]
  );
  const reasonCounts = useMemo(
    () => readCountMap(report?.case_selection_summary, 'reason_counts'),
    [report?.case_selection_summary]
  );
  const rawReport = useMemo(
    () => JSON.stringify(report?.report ?? report ?? {}, null, 2),
    [report]
  );
  const createRepairAction = report?.next_actions?.find(isReportRepairAction);
  const hasRepairAction = Boolean(
    linkedRepair ||
    report?.mainline?.repair_eligible ||
    createRepairAction ||
    isRepairOutcomeAction(reportOutcome) ||
    report?.mainline?.primary_action?.action === 'create_repair'
  );
  const repairPrimaryActionPath = linkedRepair ? repairNavigationPath : repairDraftPath;
  const repairPrimaryActionLabel = linkedRepair ? t('reportPage.actions.viewRepair') : t('reportPage.actions.createDraft');

  useEffect(() => {
    if (!exportFormats.includes(exportFormat)) {
      setExportFormat(exportFormats[0] ?? 'json');
    }
  }, [exportFormat, exportFormats]);

  const renderRepairRunLink = useCallback(
    (repairRunID?: string) => {
      if (!repairRunID?.trim()) {
        return '-';
      }

      return (
        <Button
          type="link"
          style={{ paddingInline: 0 }}
          onClick={() => navigate(buildProjectEvalRepairPath(runId, repairRunID))}
        >
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
        <Button
          type="link"
          style={{ paddingInline: 0 }}
          onClick={() => navigate(`/project-eval/${projectEvalRunID}`)}
        >
          {projectEvalRunID}
        </Button>
      );
    },
    [navigate]
  );

  const handleVariantChange = useCallback(
    (value: string) => {
      const nextVariant = normalizeReportVariant(value);
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.set('variant', nextVariant);
        next.delete('report_variant');
        next.delete('view');
        return next;
      });
    },
    [setSearchParams]
  );

  const executeRepairApplyReportAction = useCallback(
    async (action: RunReportNextActionView) => {
      if (!runId) {
        return;
      }
      const snapshotGuard = report?.mainline?.snapshot_guard;
      if (!snapshotGuard) {
        message.error(t('reportPage.messages.missingGuard'));
        return;
      }

      const payload: ExecuteReportActionRequest = {
        target_type: action.target_type,
        target_id: action.target_id,
        target_variant: action.target_variant,
        snapshot_guard: snapshotGuard,
      };

      setExecutingActionId(action.id);
      try {
        const response = await projectEvalService.executeRunReportAction(
          runId,
          action.id,
          payload,
          { silentError: true }
        );
        const result = response as unknown as ReportActionResult;
        if (result.disposition === 'executed') {
          message.success(result.message || t('reportPage.messages.applyDispatched'));
        } else if (result.disposition === 'already_satisfied') {
          message.info(result.message || t('reportPage.messages.alreadySatisfied'));
        } else if (result.disposition === 'stale') {
          message.warning(result.message || t('reportPage.messages.staleRefreshed'));
        } else {
          message.warning(result.message || t('reportPage.messages.cantExecute'));
        }
        await fetchReport();
      } catch {
        message.error(t('reportPage.messages.executeFailed'));
      } finally {
        setExecutingActionId(null);
      }
    },
    [fetchReport, report?.mainline?.snapshot_guard, runId]
  );

  const handlePrimaryAction = useCallback(
    (action: RunReportNextActionView) => {
      if (isReportRepairApplyAction(action)) {
        Modal.confirm({
          title: t('reportPage.modalApply.title'),
          content: t('reportPage.modalApply.content'),
          okText: t('reportPage.modalApply.ok'),
          cancelText: t('reportPage.modalApply.cancel'),
          onOk: () => executeRepairApplyReportAction(action),
        });
        return;
      }
      if (action.target_type === 'execution' && action.target_id) {
        navigate(`/executions/${action.target_id}`);
        return;
      }
      if (action.target_type === 'repair_run') {
        navigate(buildProjectEvalRepairPath(runId, action.target_id || linkedRepair?.id));
        return;
      }
      if (action.target_type === 'report_section' || action.id === 'review_agent_contract_gaps') {
        const targetTestId =
          action.target_id === 'planning_guidance' || action.id === 'review_planning_guidance'
            ? 'project-eval-planning-guidance-card'
            : 'project-eval-agent-compliance-card';
        const targetVariant = normalizeReportVariant(action.target_variant || 'technical');
        setSearchParams((current) => {
          const next = new URLSearchParams(current);
          next.set('variant', targetVariant);
          next.delete('report_variant');
          next.delete('view');
          return next;
        });
        window.setTimeout(() => {
          document
            .querySelector(`[data-testid="${targetTestId}"]`)
            ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 120);
        return;
      }
      if (action.target_type === 'report_export' || action.id === 'export_gap_report') {
        const targetVariant = normalizeReportVariant(action.target_variant || 'evidence');
        setSearchParams((current) => {
          const next = new URLSearchParams(current);
          next.set('variant', targetVariant);
          next.delete('report_variant');
          next.delete('view');
          return next;
        });
        setExportFormat('markdown');
        setIncludeEvidenceRecords(true);
        setIncludeRawTraces(true);
        message.info(t('reportPage.messages.switchedExport'));
        return;
      }
      if (isReportRepairAction(action) && linkedRepair) {
        navigate(repairNavigationPath);
        return;
      }
      if (isReportRepairAction(action)) {
        navigate(repairDraftPath);
        return;
      }
      if (action.id === 'request_replay' && linkedRepair) {
        navigate(repairNavigationPath);
        return;
      }
      if (action.id === 'review_truth_posture') {
        navigate(`/project-eval/${runId}/explain`);
        return;
      }
      navigate(`/project-eval/${runId}`);
    },
    [
      executeRepairApplyReportAction,
      linkedRepair,
      navigate,
      repairDraftPath,
      repairNavigationPath,
      runId,
      setSearchParams,
    ]
  );

  const handleExportReport = useCallback(async () => {
    if (!runId) {
      return;
    }
    setExporting(true);
    try {
      const response = await projectEvalService.exportRunReport(
        runId,
        {
          variant: activeVariant,
          format: exportFormat,
          include_evidence_records: exportFormat === 'csv' ? true : includeEvidenceRecords,
          evidence_limit: 200,
          include_raw_traces: includeRawTraces,
          trace_stage_status:
            includeRawTraces && traceStageStatus !== 'all' ? traceStageStatus : undefined,
          trace_limit: 50,
        },
        { silentError: true }
      );
      const exportView = response as unknown as RunReportExportView;
      setExportPreview(exportView);
      downloadReportExport(exportView);
      message.success(t('reportPage.messages.exportGenerated'));
    } catch {
      message.error(t('reportPage.messages.exportFailed'));
    } finally {
      setExporting(false);
    }
  }, [
    activeVariant,
    exportFormat,
    includeEvidenceRecords,
    includeRawTraces,
    runId,
    traceStageStatus,
  ]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 96 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!report || !runId) {
    return (
      <div style={{ padding: '0 24px 24px' }}>
        <PageHeader
          title={t('reportPage.title')}
          description={t('reportPage.descriptionSimple')}
          breadcrumb={[
            { title: t('common.dashboard') },
            { title: t('title') },
            { title: t('reportPage.breadcrumb') },
          ]}
        />
        <Card>
          <Empty
            description={loadError ? t('reportPage.empty.failedLoad') : t('reportPage.empty.noData')}
          />
        </Card>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <PageHeader
        title={t('reportPage.title')}
        description={t('reportPage.description')}
        breadcrumb={[
          { title: t('common.dashboard') },
          { title: t('title') },
          { title: t('reportPage.breadcrumb') },
        ]}
        extra={
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/project-eval/${runId}`)}>
              {t('reportPage.returnRun')}
            </Button>
            <Button
              icon={<QuestionCircleOutlined />}
              onClick={() => navigate(`/project-eval/${runId}/explain`)}
            >
              {t('reportPage.viewExplain')}
            </Button>
            {hasRepairAction && (
              <Button icon={<ToolOutlined />} onClick={() => navigate(repairPrimaryActionPath)}>
                {repairPrimaryActionLabel}
              </Button>
            )}
          </Space>
        }
      />

      {report.legacy_fallback_used && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('reportPage.header.fallbackAlertMessage')}
          description={
            report.legacy_fallback_reason ||
            t('reportPage.header.fallbackAlertDesc')
          }
        />
      )}

      {!report.authoritative_truth && !report.legacy_fallback_used && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('reportPage.header.nonAuthMessage')}
          description={t('reportPage.header.nonAuthDesc')}
        />
      )}

      <Card
        style={{
          marginBottom: 16,
          borderColor: tokens.border.default,
          background: `linear-gradient(135deg, ${tokens.bg.secondary}, ${tokens.bg.primary})`,
        }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Tabs activeKey={activeVariant} items={tabs} onChange={handleVariantChange} />
          <Space wrap>
            <Tag color="blue">{REPORT_VARIANT_LABELS[activeVariant]}</Tag>
            <Tag>{report.audience ? humanizeKey(report.audience) : t('reportPage.export.audienceUnknown')}</Tag>
            {(report.export_targets ?? []).map((target) => (
              <Tag key={target}>{t('reportPage.export.targetExport', { target: humanizeKey(target) })}</Tag>
            ))}
          </Space>
          <Text type="secondary">{REPORT_VARIANT_DESCRIPTIONS[activeVariant]}</Text>
        </Space>
      </Card>

      <Card
        title={
          <Space>
            <DownloadOutlined />
            <span>{t('reportPage.export.cardTitle')}</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            loading={exporting}
            onClick={handleExportReport}
          >
            {t('reportPage.export.downloadBtn')}
          </Button>
        }
        style={{ marginBottom: 16, borderColor: tokens.border.default }}
      >
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Space wrap>
            <Select
              value={exportFormat}
              style={{ width: 150 }}
              onChange={(value) => setExportFormat(value)}
              options={exportFormats.map((format) => ({
                value: format,
                label: EXPORT_FORMAT_LABELS[format],
              }))}
            />
            <Checkbox
              checked={exportFormat === 'csv' || includeEvidenceRecords}
              disabled={exportFormat === 'csv'}
              onChange={(event) => setIncludeEvidenceRecords(event.target.checked)}
            >
              {t('reportPage.export.evidenceRecord')}
            </Checkbox>
            <Checkbox
              checked={includeRawTraces}
              onChange={(event) => setIncludeRawTraces(event.target.checked)}
            >
              Raw trace
            </Checkbox>
            <Select
              value={traceStageStatus}
              style={{ width: 150 }}
              disabled={!includeRawTraces}
              onChange={setTraceStageStatus}
              options={TRACE_STAGE_FILTER_OPTIONS}
            />
          </Space>

          {exportPreview && (
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 4 }} bordered>
                <Descriptions.Item label={t('reportPage.export.labelFile')}>{exportPreview.file_name}</Descriptions.Item>
                <Descriptions.Item label={t('reportPage.export.labelFormat')}>
                  {EXPORT_FORMAT_LABELS[normalizeExportFormat(exportPreview.format) ?? 'json']}
                </Descriptions.Item>
                <Descriptions.Item label={t('reportPage.export.labelEvidenceRecord')}>
                  {exportPreview.evidence?.record_count ?? 0}
                </Descriptions.Item>
                <Descriptions.Item label={t('reportPage.export.labelTraceAttachment')}>
                  {exportPreview.attachment_package?.attachment_count ?? 0}
                </Descriptions.Item>
                {exportPreview.manifest?.evidence_posture && (
                  <>
                    <Descriptions.Item label={t('reportPage.export.labelEvidencePosture')}>
                      <Tag color={evidencePostureStatusColor(exportPreview.manifest.evidence_posture)}>
                        {evidencePostureStatusLabel(exportPreview.manifest.evidence_posture.status)}
                      </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label={t('reportPage.export.labelTruthSource')}>
                      {evidenceTruthSourceLabel(exportPreview.manifest.evidence_posture.truth_source_mode)}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('reportPage.export.labelCurrentRunExecution')}>
                      {countText(exportPreview.manifest.evidence_posture.current_run_execution_cases)}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('reportPage.export.labelMissingCurrentRunExecution')}>
                      {countText(exportPreview.manifest.evidence_posture.missing_current_run_execution_cases)}
                    </Descriptions.Item>
                  </>
                )}
              </Descriptions>

              {exportPreview.warnings && exportPreview.warnings.length > 0 && (
                <Alert
                  type="warning"
                  showIcon
                  message={t('reportPage.export.warnTitle')}
                  description={
                    <Space direction="vertical" size={4}>
                      {exportPreview.warnings.map((warning) => (
                        <Text key={warning}>{warning}</Text>
                      ))}
                    </Space>
                  }
                />
              )}

              {exportPreview.manifest?.next_actions &&
                exportPreview.manifest.next_actions.length > 0 && (
                  <Card title={t('reportPage.export.actionListTitle')} size="small" bodyStyle={{ padding: 12 }}>
                    <Space direction="vertical" size={8} style={{ width: '100%' }}>
                      {exportPreview.manifest.next_actions.map((action) => (
                        <Space key={`${action.id}:${action.target_type}:${action.target_id}`} wrap>
                          <Text strong>{action.label || humanizeKey(action.id)}</Text>
                          <Tag color={actionPriorityColor(action.priority)}>
                            {humanizeKey(action.priority)}
                          </Tag>
                          {action.recommended && <Tag color="green">{t('reportPage.nextActions.recommended')}</Tag>}
                          <Tag>{actionTargetText(action)}</Tag>
                          {action.reason && <Text type="secondary">{action.reason}</Text>}
                        </Space>
                      ))}
                    </Space>
                  </Card>
                )}

              {exportPreview.attachment_package && (
                <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 4 }} bordered>
                  <Descriptions.Item label={t('reportPage.export.labelTraceSelection')}>
                    {exportPreview.attachment_package.selection.include_raw_traces
                      ? t('reportPage.export.includesRaw')
                      : t('reportPage.export.noRaw')}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('reportPage.export.labelStageStatus')}>
                    {exportPreview.attachment_package.selection.stage_statuses?.length ? (
                      <Space wrap>
                        {exportPreview.attachment_package.selection.stage_statuses.map((status) => (
                          <Tag key={status}>{humanizeKey(status)}</Tag>
                        ))}
                      </Space>
                    ) : (
                      '-'
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('reportPage.export.labelMatchedGenerated')}>
                    {exportPreview.attachment_package.matched_count} /{' '}
                    {exportPreview.attachment_package.attachment_count}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('reportPage.export.labelTruncated')}>
                    {exportPreview.attachment_package.truncated ? t('reportPage.common.yes') : t('reportPage.common.no')}
                  </Descriptions.Item>
                </Descriptions>
              )}

              {exportPreview.attachment_package?.attachments &&
                exportPreview.attachment_package.attachments.length > 0 && (
                  <Space wrap>
                    {exportPreview.attachment_package.attachments.slice(0, 6).map((attachment) => (
                      <Tag key={attachment.id}>
                        {humanizeKey(attachment.artifact_kind || attachment.stage_kind)}
                      </Tag>
                    ))}
                    {exportPreview.attachment_package.attachments.length > 6 && (
                      <Tag>+{exportPreview.attachment_package.attachments.length - 6}</Tag>
                    )}
                  </Space>
                )}
            </Space>
          )}
        </Space>
      </Card>

      <Card
        style={{
          marginBottom: 16,
          borderColor: tokens.border.default,
        }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space wrap>
            <Tag color={decisionTone.color}>{decisionTone.label}</Tag>
            <Tag color={statusTone.color}>{statusTone.label}</Tag>
            {report.result_class && <Tag>{getResultClassLabel(report.result_class)}</Tag>}
            {report.truth_mode && <Tag>{getTruthModeLabel(report.truth_mode)}</Tag>}
          </Space>

          <div>
            <Title level={3} style={{ marginBottom: 8, color: getScoreColor(report.score) }}>
              {t('reportPage.header.score', { value: formatScore(report.score) })}
            </Title>
            <Paragraph style={{ marginBottom: 0 }}>
              {report.summary || t('reportPage.header.summaryFallback')}
            </Paragraph>
          </div>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Statistic
                title={t('reportPage.header.statSelectedCases')}
                value={report.selected_case_count ?? evidenceSummary?.selected_cases ?? 0}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Statistic title={t('reportPage.header.statEvaluatedCases')} value={evidenceSummary?.evaluated_cases ?? 0} />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Statistic
                title={t('reportPage.header.statWarnBlock')}
                value={(evidenceSummary?.warn_cases ?? 0) + (evidenceSummary?.block_cases ?? 0)}
              />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Statistic
                title={t('reportPage.header.statLinkedRepair')}
                value={report.remediation?.linked_repair_count ?? 0}
              />
            </Col>
          </Row>
        </Space>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {(report.sections ?? []).length > 0 ? (
              report.sections?.map((section) =>
                section.id === 'agent_orchestration' ? (
                  <AgentOrchestrationComplianceCard
                    key={section.id}
                    section={section}
                    report={report}
                    linkedRepairID={linkedRepair?.id}
                    onOpenExecution={(executionID) => navigate(`/executions/${executionID}`)}
                    onOpenRepair={() => navigate(repairPrimaryActionPath)}
                    onOpenExplain={() => navigate(`/project-eval/${runId}/explain`)}
                  />
                ) : section.id === 'support_posture' ? (
                  <SupportPostureCard key={section.id} section={section} report={report} />
                ) : section.id === 'planning_guidance' ? (
                  <PlanningGuidanceCard key={section.id} section={section} report={report} />
                ) : section.id === 'large_project_coverage' ? (
                  <LargeProjectCoverageCard key={section.id} section={section} report={report} />
                ) : (
                  <ReportSectionCard key={section.id} section={section} />
                )
              )
            ) : (
              <Card>
                <Empty description={t('reportPage.empty.noSections')} />
              </Card>
            )}
          </Space>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <OutcomePostureCard
              outcome={reportOutcome}
              linkedRepairID={linkedRepair?.id}
              onOpenRepair={() => navigate(repairPrimaryActionPath)}
              onOpenExplain={() => navigate(`/project-eval/${runId}/explain`)}
            />

            <EvidencePostureCard
              posture={report.evidence_posture}
              onOpenExplain={() => navigate(`/project-eval/${runId}/explain`)}
            />

            <Card title={t('reportPage.trust.cardTitle')} size="small">
              <Descriptions size="small" column={1} bordered>
                <Descriptions.Item label={t('reportPage.trust.labelDecision')}>{decisionTone.label}</Descriptions.Item>
                <Descriptions.Item label={t('reportPage.trust.labelStatus')}>{statusTone.label}</Descriptions.Item>
                <Descriptions.Item label={t('reportPage.trust.labelScoreMode')}>
                  {getScoreModeLabel(report.score_mode)}
                </Descriptions.Item>
                <Descriptions.Item label={t('reportPage.trust.labelResultClass')}>
                  {getResultClassLabel(report.result_class)}
                </Descriptions.Item>
                <Descriptions.Item label={t('reportPage.trust.labelTruthMode')}>
                  {getTruthModeLabel(report.truth_mode)}
                </Descriptions.Item>
                <Descriptions.Item label={t('reportPage.trust.labelAuthoritySource')}>
                  {getOutcomeAuthorityLabel(report.outcome_authority_source)}
                </Descriptions.Item>
                <Descriptions.Item label={t('reportPage.trust.labelIsAuthoritative')}>
                  {report.authoritative_truth ? t('reportPage.common.yes') : t('reportPage.common.no')}
                </Descriptions.Item>
                <Descriptions.Item label={t('reportPage.trust.labelProcessorProfile')}>
                  {humanizeKey(report.processor_profile)}
                </Descriptions.Item>
              </Descriptions>
            </Card>

            <NextActionsCard
              actions={report.next_actions}
              onPrimaryAction={handlePrimaryAction}
              getPrimaryActionLabel={(action) =>
                getNextActionButtonLabel(action, Boolean(linkedRepair))
              }
              executingActionId={executingActionId}
            />

            <Card title={t('reportPage.mainline.cardTitle')} size="small">
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Text type="secondary">{t('reportPage.mainline.currentStage', { stage: getStageLabel(report.mainline?.stage) })}</Text>
                <Paragraph style={{ marginBottom: 0 }}>
                  {report.mainline?.explain || getRemediationSummary(remediationOutcome)}
                </Paragraph>
                {(report.mainline?.repair_refusal_reason || reportOutcome?.refusal_reason) && (
                  <Tag color="warning">
                    {t('reportPage.mainline.repairLimit')}
                    {humanizeKey(
                      report.mainline?.repair_refusal_reason || reportOutcome?.refusal_reason
                    )}
                  </Tag>
                )}
                {hasRepairAction && (
                  <Space wrap>
                    <Button
                      type="primary"
                      icon={<ToolOutlined />}
                      onClick={() => navigate(repairPrimaryActionPath)}
                    >
                      {repairPrimaryActionLabel}
                    </Button>
                    <Button onClick={() => navigate(`/project-eval/${runId}/explain`)}>
                      {t('reportPage.openExplain')}
                    </Button>
                  </Space>
                )}
                {linkedRepair && (
                  <Descriptions size="small" column={1} bordered>
                    <Descriptions.Item label={t('reportPage.mainline.labelLatestRepair')}>
                      {renderRepairRunLink(linkedRepair.id)}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('reportPage.mainline.labelRepairStatus')}>
                      {humanizeKey(linkedRepair.state)}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('reportPage.mainline.labelReplayStatus')}>
                      {humanizeKey(linkedRepair.replay_status)}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('reportPage.mainline.labelReplayEval')}>
                      {renderProjectEvalLink(linkedRepair.replay_project_eval_run_id)}
                    </Descriptions.Item>
                    <Descriptions.Item label={t('reportPage.mainline.labelUpdateTime')}>
                      {formatDateTime(linkedRepair.updated_at)}
                    </Descriptions.Item>
                  </Descriptions>
                )}
                {remediationOutcome && (
                  <Tag color="blue">{getRemediationCategoryLabel(remediationOutcome.category)}</Tag>
                )}
              </Space>
            </Card>
          </Space>
        </Col>
      </Row>

      <ProjectEvalStageProgressPanel
        runId={runId}
        title={t('detail.stageProgressTitle')}
        compact
        reportSummary={report.module_slice_execution_summary}
        reportSignals={report.module_slice_execution_signals}
      />
      {evidenceSummary && (
        <Card title={t('reportPage.evidence.cardTitle')} style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={4}>
              <Statistic
                title={t('reportPage.evidence.statPass')}
                value={evidenceSummary.pass_cases}
                valueStyle={{ color: '#10b981' }}
              />
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Statistic
                title={t('reportPage.evidence.statWarn')}
                value={evidenceSummary.warn_cases}
                valueStyle={{ color: '#faad14' }}
              />
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Statistic
                title={t('reportPage.evidence.statBlock')}
                value={evidenceSummary.block_cases}
                valueStyle={{ color: '#ef4444' }}
              />
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Statistic
                title={t('reportPage.evidence.statAverage')}
                value={Number(formatScore(evidenceSummary.average_case_score))}
                precision={1}
              />
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Statistic
                title={t('reportPage.evidence.statConfidence')}
                value={formatConfidence(evidenceSummary.average_confidence)}
              />
            </Col>
            <Col xs={24} sm={12} lg={4}>
              <Statistic title={t('reportPage.evidence.statCoverage')} value={formatCoverage(evidenceSummary.coverage_score)} />
            </Col>
          </Row>
        </Card>
      )}

      {(statusCounts.length > 0 || reasonCounts.length > 0) && (
        <Card title={t('reportPage.caseSummary.cardTitle')} style={{ marginBottom: 16 }}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {statusCounts.length > 0 && (
              <div>
                <Text strong>{t('reportPage.caseSummary.statusStats')}</Text>
                <div style={{ marginTop: 8 }}>
                  {statusCounts.map(([name, value]) => (
                    <Tag key={name}>
                      {humanizeKey(name)}: {value}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
            {reasonCounts.length > 0 && (
              <div>
                <Text strong>{t('reportPage.caseSummary.reasonStats')}</Text>
                <div style={{ marginTop: 8 }}>
                  {reasonCounts.map(([name, value]) => (
                    <Tag key={name}>
                      {humanizeKey(name)}: {value}
                    </Tag>
                  ))}
                </div>
              </div>
            )}
          </Space>
        </Card>
      )}

      <Collapse
        items={[
          {
            key: 'raw-report',
            label: t('reportPage.empty.rawPayload'),
            children: (
              <pre
                style={{
                  margin: 0,
                  padding: 16,
                  overflow: 'auto',
                  borderRadius: 8,
                  background: tokens.bg.secondary,
                }}
              >
                {rawReport}
              </pre>
            ),
          },
        ]}
      />
    </div>
  );
}


