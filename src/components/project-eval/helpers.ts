import i18next from 'i18next';

import type {
  ProjectEvalSourceIndexSummary,
  RunEvidencePostureView,
  RunPlanningGuidanceView,
  RunRemediationOutcomeView,
  RunReportOutcomeView,
} from '@/types/api/project-eval';

export interface ToneTag {
  label: string;
  color: string;
}

const PROJECT_TYPE_KEYS = new Set(['backend', 'frontend', 'llm_app', 'agent', 'unknown']);
const RUN_MODE_KEYS = new Set(['advisory', 'strict']);
const SCOPE_KEYS = new Set(['full', 'delta']);

const DECISION_COLORS: Record<string, string> = {
  pass: 'success',
  warn: 'warning',
  block: 'error',
  pending: 'default',
};

const STATUS_COLORS: Record<string, string> = {
  pending: 'default',
  planned: 'blue',
  running: 'processing',
  completed: 'success',
  failed: 'error',
  cancelled: 'default',
};

const SELECTION_STATUS_COLORS: Record<string, string> = {
  selected: 'success',
  skipped: 'default',
  forced_included: 'blue',
  forced_excluded: 'error',
};

const SCORE_MODE_KEYS = new Set(['evidence_fusion', 'heuristic_legacy', 'initial_plan']);
const RESULT_CLASS_KEYS = new Set(['authoritative', 'compatibility', 'advisory']);
const TRUTH_MODE_KEYS = new Set(['strict_fused', 'compatibility_fallback', 'explicit_run_outcome']);
const OUTCOME_AUTHORITY_KEYS = new Set(['explicit_run_outcome', 'legacy_report_json', 'remediation_feedback']);

const REPORT_OUTCOME_COLORS: Record<string, string> = {
  repair: 'error',
  replay: 'processing',
  refusal: 'warning',
  neutral: 'success',
};

const SELECTION_REASON_KEYS = new Set([
  'change_match',
  'history_failure',
  'high_static_risk',
  'validation_flaky',
  'validation_error',
  'review_low_confidence',
  'review_drift_up',
]);

const MAINLINE_ACTION_KEYS = new Set([
  'confirm_run_execution',
  'create_linked_repair_run',
  'start_repair_planning',
  'approve_repair_plan',
  'start_repair_apply',
  'request_replay',
]);

const REMEDIATION_CATEGORY_KEYS = new Set([
  'pending',
  'improved',
  'unchanged',
  'regressed',
  'non_comparable',
  'failed',
  'unavailable',
  'missing_feedback',
]);

const STAGE_KEYS = new Set([
  'eval_waiting_approval',
  'eval_pending_execution',
  'eval_running',
  'eval_failed',
  'eval_cancelled',
  'eval_completed_non_authoritative',
  'eval_completed_no_action',
  'repair_available',
  'repair_created',
  'repair_planning',
  'repair_approval_pending',
  'repair_approved',
  'repair_applying',
  'repair_failed',
  'repair_cancelled',
  'replay_available',
  'replay_pending',
  'replay_running',
  'replay_completed',
  'replay_failed',
  'replay_unavailable',
]);

const RISK_COLORS: Record<string, string> = {
  low: 'success',
  medium: 'warning',
  high: 'error',
  critical: 'volcano',
};

const SOURCE_INDEX_COLORS: Record<string, string> = {
  ready: 'success',
  building: 'processing',
  failed: 'error',
  not_built: 'default',
};

function normalizeI18nKey(value?: string): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function baseHumanizeKey(value?: string): string {
  if (!value) {
    return '-';
  }

  return value
    .replace(/[\\/_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function humanizeKey(value?: string): string {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) {
    return '-';
  }

  const key = normalizeI18nKey(rawValue);
  return i18next.t(`projectEval:helpers.valueLabels.${key}`, {
    defaultValue: baseHumanizeKey(rawValue),
  });
}

export function translatePlanningGuidanceText(value?: string): string {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) {
    return '';
  }

  const dynamicKey = planningDynamicTextKey(rawValue);
  if (!dynamicKey) {
    return rawValue;
  }

  return i18next.t(`projectEval:helpers.planningDynamicText.${dynamicKey}`, {
    defaultValue: rawValue,
  });
}

export function getPlanningGuidanceSummaryText(guidance?: RunPlanningGuidanceView, fallback?: string): string {
  if (guidance) {
    return i18next.t('projectEval:helpers.planningDynamicText.summaryTemplate', {
      template: humanizeKey(guidance.template_family || 'selected_template'),
      depth: humanizeKey(guidance.evaluation_depth || 'selected_depth'),
      selection: humanizeKey(guidance.case_selection_mode || 'default'),
      budget: humanizeKey(guidance.budget_class || 'default'),
      runner: humanizeKey(guidance.runner_policy_hint || guidance.validation_lane || 'default'),
    });
  }
  return translatePlanningGuidanceText(fallback) || i18next.t('projectEval:helpers.planningDynamicText.sectionAvailable');
}

function planningDynamicTextKey(value: string): string | null {
  switch (value) {
    case 'first-pass triage': return 'recommendedFirstPassTriage';
    case 'unknown or low-confidence project profiles': return 'recommendedUnknownProfiles';
    case 'small delta checks': return 'recommendedSmallDeltaChecks';
    case 'risk-heavy changes': return 'recommendedRiskHeavyChanges';
    case 'pre-release engineering review': return 'recommendedPreReleaseReview';
    case 'projects that need integration/security/performance evidence': return 'recommendedIntegrationSecurityPerformance';
    case 'release gates': return 'recommendedReleaseGates';
    case 'policy enforcement checkpoints': return 'recommendedPolicyCheckpoints';
    case 'runs where missing required evidence must block': return 'recommendedMissingEvidenceMustBlock';
    case 'balanced project evaluation': return 'recommendedBalancedEvaluation';
    case 'regular engineering feedback': return 'recommendedRegularFeedback';
    case 'baseline project assessment': return 'recommendedBaselineAssessment';
    case 'large repositories that need staged coverage accounting': return 'recommendedLargeRepositories';
    case 'Optimizes speed by deferring integration, e2e, security, performance, and runtime-behavior evidence.': return 'tradeoffQuick';
    case 'Runs broader evidence and costs more time and compute than standard evaluation.': return 'tradeoffDeep';
    case 'Prefers strict outcomes; missing required evidence should not become a passing decision.': return 'tradeoffReleaseGate';
    case 'Balances speed and confidence by selecting standard project checks plus governed cases.': return 'tradeoffBalanced';
    case 'Large-project mode reports sampled, skipped, and deferred work instead of pretending full repository coverage.': return 'tradeoffLargeProject';
    case 'Support commands improve confidence but are diagnostic unless selected as authoritative evidence.': return 'tradeoffSupportCommands';
    case 'Project detection confidence is low; confirm framework and template before strict runs.': return 'warningLowDetection';
    case 'Candidate coverage is not whole-repository coverage; inspect large-project coverage disclosures.': return 'warningLargeCoverage';
    case 'No executable test command candidates are declared for this framework lane.': return 'warningNoTestCommands';
    case 'Mixed-project lanes require manual review of runtime and test command choices.': return 'warningMixedProject';
    case 'Confirm the detected project, framework, template, and evaluation depth before starting the run.': return 'nextConfirmProfile';
    case 'Keep technical or evidence report variants enabled when results will be used for engineering or governance review.': return 'nextKeepReportVariants';
    case 'Review the large-project coverage ledger for sampled, skipped, and deferred evidence.': return 'nextReviewLargeCoverage';
    case 'Provide or verify custom validation commands before relying on executable evidence.': return 'nextProvideValidationCommands';
    case 'Use strict mode and inspect missing evidence before treating the result as a release decision.': return 'nextStrictRelease';
    case 'Planning guidance is not available for this run.': return 'sectionUnavailable';
    case 'Planning guidance is available for this run.': return 'sectionAvailable';
    default: return null;
  }
}

export function formatDateTime(value?: string): string {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString();
}

export function formatScore(value?: number): string {
  return typeof value === 'number' ? value.toFixed(1) : '-';
}

export function formatConfidence(value?: number): string {
  if (typeof value !== 'number') {
    return '-';
  }

  return value <= 1 ? `${(value * 100).toFixed(0)}%` : `${value.toFixed(1)}%`;
}

export function formatCoverage(value?: number): string {
  if (typeof value !== 'number') {
    return '-';
  }

  return value <= 1 ? `${(value * 100).toFixed(0)}%` : `${value.toFixed(1)}%`;
}

export function getScoreColor(score?: number): string {
  if (typeof score !== 'number') {
    return '#999999';
  }
  if (score >= 85) {
    return '#10b981';
  }
  if (score >= 70) {
    return '#1677ff';
  }
  if (score >= 55) {
    return '#faad14';
  }
  return '#ef4444';
}

export function getProjectTypeLabel(value?: string): string {
  if (!value) return '-';
  if (PROJECT_TYPE_KEYS.has(value)) {
    return i18next.t(`projectEval:helpers.projectType.${value}`);
  }
  return humanizeKey(value);
}

export function getRunModeLabel(value?: string): string {
  if (!value) return '-';
  if (RUN_MODE_KEYS.has(value)) {
    return i18next.t(`projectEval:helpers.runMode.${value}`);
  }
  return humanizeKey(value);
}

export function getScopeLabel(value?: string): string {
  if (!value) return '-';
  if (SCOPE_KEYS.has(value)) {
    return i18next.t(`projectEval:helpers.scope.${value}`);
  }
  return humanizeKey(value);
}

export function getDecisionTone(value?: string): ToneTag {
  if (!value) {
    return { label: i18next.t('projectEval:helpers.decision.pending'), color: 'default' };
  }
  if (DECISION_COLORS[value]) {
    return { label: i18next.t(`projectEval:helpers.decision.${value}`), color: DECISION_COLORS[value] };
  }
  return { label: humanizeKey(value), color: 'default' };
}

export function getStatusTone(value?: string): ToneTag {
  if (!value) {
    return { label: i18next.t('projectEval:helpers.fallbackUnknown'), color: 'default' };
  }
  if (STATUS_COLORS[value]) {
    return { label: i18next.t(`projectEval:helpers.status.${value}`), color: STATUS_COLORS[value] };
  }
  return { label: humanizeKey(value), color: 'default' };
}

export function getSelectionStatusTone(value?: string): ToneTag {
  if (!value) {
    return { label: i18next.t('projectEval:helpers.fallbackUnknown'), color: 'default' };
  }
  if (SELECTION_STATUS_COLORS[value]) {
    return { label: i18next.t(`projectEval:helpers.selectionStatus.${value}`), color: SELECTION_STATUS_COLORS[value] };
  }
  return { label: humanizeKey(value), color: 'default' };
}

export function getRiskTone(value?: string): ToneTag {
  if (!value) {
    return { label: i18next.t('projectEval:helpers.fallbackUnknownRisk'), color: 'default' };
  }
  if (RISK_COLORS[value]) {
    return { label: i18next.t(`projectEval:helpers.risk.${value}`), color: RISK_COLORS[value] };
  }
  return { label: humanizeKey(value), color: 'default' };
}

export function getScoreModeLabel(value?: string): string {
  if (!value) return '-';
  if (SCORE_MODE_KEYS.has(value)) {
    return i18next.t(`projectEval:helpers.scoreMode.${value}`);
  }
  return humanizeKey(value);
}

export function getResultClassLabel(value?: string): string {
  if (!value) return '-';
  if (RESULT_CLASS_KEYS.has(value)) {
    return i18next.t(`projectEval:helpers.resultClass.${value}`);
  }
  return humanizeKey(value);
}

export function getTruthModeLabel(value?: string): string {
  if (!value) return '-';
  if (TRUTH_MODE_KEYS.has(value)) {
    return i18next.t(`projectEval:helpers.truthMode.${value}`);
  }
  return humanizeKey(value);
}

export function getOutcomeAuthorityLabel(value?: string): string {
  if (!value) return '-';
  if (OUTCOME_AUTHORITY_KEYS.has(value)) {
    return i18next.t(`projectEval:helpers.outcomeAuthority.${value}`);
  }
  return humanizeKey(value);
}

export function getEvidencePostureStatusColor(posture?: RunEvidencePostureView): string {
  if (!posture) {
    return 'default';
  }
  if (posture.authoritative_ready) {
    return 'green';
  }
  if (posture.insufficient_evidence) {
    return 'orange';
  }
  return 'blue';
}

export function getEvidencePostureAlertType(
  posture: RunEvidencePostureView
): 'success' | 'info' | 'warning' | 'error' {
  if (posture.authoritative_ready) {
    return 'success';
  }
  if (posture.insufficient_evidence) {
    return 'warning';
  }
  return 'info';
}

export function getEvidencePostureStatusLabel(status?: string): string {
  const key = normalizeI18nKey(status);
  return i18next.t(`projectEval:reportPage.evidencePosture.status.${key || 'unknown'}`, {
    defaultValue: status ? humanizeKey(status) : i18next.t('projectEval:stageProgress.unknown'),
  });
}

export function getEvidenceTruthSourceLabel(mode?: string): string {
  const key = normalizeI18nKey(mode);
  return i18next.t(`projectEval:reportPage.evidencePosture.truthSource.${key || 'unknown'}`, {
    defaultValue: mode ? humanizeKey(mode) : i18next.t('projectEval:stageProgress.unknown'),
  });
}

export function getEvidenceInsufficientReasonLabel(reason?: string): string {
  const key = normalizeI18nKey(reason);
  return i18next.t(`projectEval:reportPage.evidencePosture.reasons.${key || 'unknown'}`, {
    defaultValue: reason ? humanizeKey(reason) : i18next.t('projectEval:reportPage.common.empty'),
  });
}

export function getReportOutcomeTone(value?: string): ToneTag {
  if (!value) {
    return { label: i18next.t('projectEval:helpers.outcomeUnknownLabel'), color: 'default' };
  }
  if (REPORT_OUTCOME_COLORS[value]) {
    return { label: i18next.t(`projectEval:helpers.reportOutcome.${value}`), color: REPORT_OUTCOME_COLORS[value] };
  }
  return { label: humanizeKey(value), color: 'default' };
}

export function getReportOutcomeSummary(outcome?: RunReportOutcomeView): string {
  if (!outcome) {
    return i18next.t('projectEval:helpers.summaries.outcomeMissing');
  }

  if (outcome.explain?.trim()) {
    return outcome.explain.trim();
  }

  if (outcome.next_action_reason?.trim()) {
    return outcome.next_action_reason.trim();
  }

  switch (outcome.kind) {
    case 'repair':
      return i18next.t('projectEval:helpers.summaries.outcomeRepair');
    case 'replay':
      return i18next.t('projectEval:helpers.summaries.outcomeReplay');
    case 'refusal':
      return i18next.t('projectEval:helpers.summaries.outcomeRefusal');
    case 'neutral':
      return i18next.t('projectEval:helpers.summaries.outcomeNeutral');
    default:
      return i18next.t('projectEval:helpers.summaries.outcomeUnknown');
  }
}

export function getSelectionReasonLabel(value?: string): string {
  if (!value) return '-';
  if (SELECTION_REASON_KEYS.has(value)) {
    return i18next.t(`projectEval:helpers.selectionReason.${value}`);
  }
  return humanizeKey(value);
}

export function getMainlineActionText(value?: string): string {
  if (!value) return i18next.t('projectEval:helpers.noAction');
  if (MAINLINE_ACTION_KEYS.has(value)) {
    return i18next.t(`projectEval:helpers.mainlineAction.${value}`);
  }
  return humanizeKey(value);
}

export function getRemediationCategoryLabel(value?: string): string {
  if (!value) return '-';
  if (REMEDIATION_CATEGORY_KEYS.has(value)) {
    return i18next.t(`projectEval:helpers.remediationCategory.${value}`);
  }
  return humanizeKey(value);
}

export function getStageLabel(value?: string): string {
  if (!value) return '-';
  if (STAGE_KEYS.has(value)) {
    return i18next.t(`projectEval:helpers.stage.${value}`);
  }
  return humanizeKey(value);
}


export const ZIP_SOURCE_STATE_SEPARATION_TEXT_KEY = 'projectEval:helpers.zipSource.stateSeparation';
export const ZIP_SOURCE_MAINLINE_GAP_TEXT_KEY = 'projectEval:helpers.zipSource.mainlineGap';
export const ZIP_SOURCE_REUSE_SUMMARY_TEXT_KEY = 'projectEval:helpers.zipSource.reuseSummary';

// Legacy string export for older callers. New UI code should prefer the *_KEY
// constants with useTranslation so language changes re-render correctly.
export const ZIP_SOURCE_STATE_SEPARATION_TEXT = i18next.t(ZIP_SOURCE_STATE_SEPARATION_TEXT_KEY);

function formatUnitCount(value?: number, unit?: string): string | null {
  if (typeof value !== 'number' || value < 0 || !unit) {
    return null;
  }

  return `${value} ${unit}`;
}

export function getSourceIndexTone(value?: string): ToneTag {
  const defaultKey: keyof typeof SOURCE_INDEX_COLORS = 'not_built';
  if (!value) {
    return { label: i18next.t(`projectEval:helpers.sourceIndex.${defaultKey}`), color: SOURCE_INDEX_COLORS[defaultKey] };
  }
  if (SOURCE_INDEX_COLORS[value]) {
    return { label: i18next.t(`projectEval:helpers.sourceIndex.${value}`), color: SOURCE_INDEX_COLORS[value] };
  }
  return { label: humanizeKey(value), color: 'default' };
}

export function getSourceIndexLastUpdated(index?: ProjectEvalSourceIndexSummary): string | undefined {
  return index?.build_completed_at || index?.last_updated_at || index?.build_started_at || index?.created_at;
}

export function getSourceIndexSummary(index?: ProjectEvalSourceIndexSummary): string {
  if (!index) {
    return i18next.t('projectEval:helpers.summaries.indexMissing');
  }

  const fileCount = formatUnitCount(index.file_count, index.file_count === 1 ? 'file' : 'files');
  const chunkCount = formatUnitCount(index.chunk_count, index.chunk_count === 1 ? 'chunk' : 'chunks');
  const counts = [fileCount, chunkCount].filter(Boolean).join(' | ');

  switch (index.status) {
    case 'ready':
      return counts
        ? i18next.t('projectEval:helpers.summaries.indexReadyCounts', { counts })
        : i18next.t('projectEval:helpers.summaries.indexReady');
    case 'building':
      return counts
        ? i18next.t('projectEval:helpers.summaries.indexBuildingCounts', { counts })
        : i18next.t('projectEval:helpers.summaries.indexBuilding');
    case 'failed':
      return index.error_message?.trim() || i18next.t('projectEval:helpers.summaries.indexFailed');
    default:
      return counts
        ? i18next.t('projectEval:helpers.summaries.indexUnknownCounts', { counts })
        : i18next.t('projectEval:helpers.summaries.indexUnknown');
  }
}

export function getRemediationSummary(outcome?: RunRemediationOutcomeView): string {
  if (!outcome) {
    return i18next.t('projectEval:helpers.summaries.remediationMissing');
  }

  return i18next.t('projectEval:helpers.summaries.remediationSummary', {
    category: getRemediationCategoryLabel(outcome.category),
    improved: outcome.improved_cases,
    unchanged: outcome.unchanged_cases,
    regressed: outcome.regressed_cases,
    pending: outcome.pending_cases,
  });
}
