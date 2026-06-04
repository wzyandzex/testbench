import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Collapse,
  Descriptions,
  Empty,
  Popconfirm,
  Progress,
  Row,
  Segmented,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
  theme,
  type TableProps,
} from 'antd';
import {
  BranchesOutlined,
  CodeOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  RetweetOutlined,
} from '@ant-design/icons';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { formatDateTime, humanizeKey } from '@/components/project-eval/helpers';
import { formatBytes } from '@/utils/format';
import { projectEvalService } from '@/services/project-eval';
import { isPersistedOrgAdmin } from '@/utils';
import type {
  ModuleSliceExecutionSignals,
  ModuleSliceExecutionSummary,
  RunStageProgressView,
  RunStageRecordView,
} from '@/types/api/project-eval';

const { Paragraph, Text } = Typography;

interface ProjectEvalStageProgressPanelProps {
  runId?: string;
  planVersion?: number;
  title?: string;
  compact?: boolean;
  reportSummary?: ModuleSliceExecutionSummary;
  reportSignals?: ModuleSliceExecutionSignals[];
  onStageRetried?: () => void | Promise<void>;
}

interface Tone {
  label: string;
  color: string;
}

type StageDetailViewMode = 'friendly' | 'json';

const STAGE_STATUS_TONES: Record<string, Tone> = {
  scheduled: { get label() { return i18next.t('projectEval:stageProgress.status.scheduled'); }, color: 'blue' },
  running: { get label() { return i18next.t('projectEval:stageProgress.status.running'); }, color: 'processing' },
  completed: { get label() { return i18next.t('projectEval:stageProgress.status.completed'); }, color: 'success' },
  failed: { get label() { return i18next.t('projectEval:stageProgress.status.failed'); }, color: 'error' },
  skipped: { get label() { return i18next.t('projectEval:stageProgress.status.skipped'); }, color: 'default' },
};

const COMMAND_OUTCOME_TONES: Record<string, Tone> = {
  pass: { get label() { return i18next.t('projectEval:stageProgress.commandOutcome.pass'); }, color: 'success' },
  fail: { get label() { return i18next.t('projectEval:stageProgress.commandOutcome.fail'); }, color: 'error' },
  timeout: { get label() { return i18next.t('projectEval:stageProgress.commandOutcome.timeout'); }, color: 'warning' },
  sandbox_error: { get label() { return i18next.t('projectEval:stageProgress.commandOutcome.sandboxError'); }, color: 'error' },
  executor_error: { get label() { return i18next.t('projectEval:stageProgress.commandOutcome.executorError'); }, color: 'error' },
  unknown: { get label() { return i18next.t('projectEval:stageProgress.unknown'); }, color: 'default' },
};

const SIGNAL_OUTCOME_TONES: Record<string, Tone> = {
  execution_signals_ready: { get label() { return i18next.t('projectEval:stageProgress.signalOutcome.executionSignalsReady'); }, color: 'success' },
  validation_command_passed: { get label() { return i18next.t('projectEval:stageProgress.signalOutcome.validationPassed'); }, color: 'success' },
  validation_command_failed: { get label() { return i18next.t('projectEval:stageProgress.signalOutcome.validationFailed'); }, color: 'error' },
  validation_command_timed_out: { get label() { return i18next.t('projectEval:stageProgress.signalOutcome.validationTimeout'); }, color: 'warning' },
  command_execution_unavailable: { get label() { return i18next.t('projectEval:stageProgress.signalOutcome.commandUnavailable'); }, color: 'warning' },
  no_test_entrypoint_detected: { get label() { return i18next.t('projectEval:stageProgress.signalOutcome.noTestEntrypoint'); }, color: 'warning' },
  test_files_without_validation_entrypoint: { get label() { return i18next.t('projectEval:stageProgress.signalOutcome.testsWithoutEntrypoint'); }, color: 'warning' },
  module_slice_missing: { get label() { return i18next.t('projectEval:stageProgress.signalOutcome.sliceMissing'); }, color: 'error' },
  execution_signals_unavailable: { get label() { return i18next.t('projectEval:stageProgress.signalOutcome.signalsUnavailable'); }, color: 'default' },
};

function getErrorMessage(error: unknown, fallback: string): string {
  const payload = error as { response?: { data?: { message?: string } }; message?: string };
  return payload.response?.data?.message || payload.message || fallback;
}

function normalizeI18nKey(value?: string): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function stageValueLabel(value?: string): string {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) {
    return '-';
  }
  const key = normalizeI18nKey(rawValue);
  return i18next.t(`projectEval:stageProgress.valueLabels.${key}`, {
    defaultValue: humanizeKey(rawValue),
  });
}

function stageTokenDescription(value?: string): string {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) {
    return '';
  }
  const key = normalizeI18nKey(rawValue);
  return i18next.t(`projectEval:stageProgress.tokenDescriptions.${key}`, {
    defaultValue: i18next.t('projectEval:stageProgress.tokenDescriptions.default', {
      label: stageValueLabel(rawValue),
    }),
  });
}

function stageReadableText(value?: unknown, fallback?: string): string {
  const rawValue = String(value ?? '').trim();
  if (!rawValue) {
    return fallback || '';
  }
  const key = normalizeI18nKey(rawValue);
  return i18next.t(`projectEval:stageProgress.dynamicText.${key}`, {
    defaultValue: rawValue.includes('_') ? stageValueLabel(rawValue) : rawValue,
  });
}

function toneFromMap(map: Record<string, Tone>, value?: string): Tone {
  if (!value) {
    return { label: i18next.t('projectEval:stageProgress.unknown'), color: 'default' };
  }
  return map[value] ?? { label: stageValueLabel(value), color: 'default' };
}

function countEntries(counts?: Record<string, number>): Array<[string, number]> {
  if (!counts) {
    return [];
  }
  return Object.entries(counts).filter((entry): entry is [string, number] => typeof entry[1] === 'number');
}

function getCount(counts: Record<string, number> | undefined, key: string): number {
  const value = counts?.[key];
  return typeof value === 'number' ? value : 0;
}

function formatDuration(ms?: number): string {
  if (typeof ms !== 'number' || ms < 0) {
    return '-';
  }
  if (ms < 1000) {
    return `${ms}ms`;
  }
  const seconds = ms / 1000;
  if (seconds < 60) {
    return `${seconds.toFixed(seconds >= 10 ? 0 : 1)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}m ${remainder}s`;
}

function stageDurationMs(record: RunStageRecordView): number | undefined {
  if (!record.started_at) {
    return undefined;
  }
  const started = new Date(record.started_at).getTime();
  const completed = record.completed_at ? new Date(record.completed_at).getTime() : Date.now();
  if (Number.isNaN(started) || Number.isNaN(completed) || completed < started) {
    return undefined;
  }
  return completed - started;
}

function executionTimingMs(record: RunStageRecordView, key: 'duration_ms' | 'wall_duration_ms' | 'acquire_duration_ms' | 'exec_duration_ms' | 'timeout_ms'): number | undefined {
  const execution = record.execution_signals?.execution;
  const nested = execution?.timing?.[key];
  if (typeof nested === 'number') {
    return nested;
  }
  const flat = execution?.[key];
  return typeof flat === 'number' ? flat : undefined;
}

function commandDurationMs(record: RunStageRecordView): number | undefined {
  return executionTimingMs(record, 'duration_ms') ?? executionTimingMs(record, 'wall_duration_ms') ?? stageDurationMs(record);
}

function executionFailure(record: RunStageRecordView) {
  const execution = record.execution_signals?.execution;
  const failure = execution?.failure;
  const failureClass = failure?.class || execution?.failure_class;
  const reason = failure?.reason || execution?.failure_reason;
  const retryable = typeof failure?.retryable === 'boolean' ? failure.retryable : execution?.retryable;
  if (!failureClass && !reason && typeof retryable !== 'boolean') {
    return null;
  }
  return {
    className: failureClass,
    reason,
    retryable,
  };
}

function executionLogStream(record: RunStageRecordView, stream: 'stdout' | 'stderr') {
  const execution = record.execution_signals?.execution;
  const nested = execution?.logs?.[stream];
  const text = nested?.text ?? execution?.[stream];
  const bytes = typeof nested?.bytes === 'number'
    ? nested.bytes
    : stream === 'stdout'
      ? execution?.stdout_bytes
      : execution?.stderr_bytes;
  const originalBytes = typeof nested?.original_bytes === 'number'
    ? nested.original_bytes
    : stream === 'stdout'
      ? execution?.stdout_original_bytes
      : execution?.stderr_original_bytes;
  const truncated = typeof nested?.truncated === 'boolean'
    ? nested.truncated
    : stream === 'stdout'
      ? execution?.stdout_truncated
      : execution?.stderr_truncated;
  return {
    text,
    bytes,
    originalBytes,
    truncated: Boolean(truncated),
  };
}

function logStreamLabel(title: string, stream: ReturnType<typeof executionLogStream>): string {
  const parts = [title];
  if (typeof stream.bytes === 'number') {
    const original = typeof stream.originalBytes === 'number' && stream.originalBytes !== stream.bytes
      ? ` / ${formatBytes(stream.originalBytes)}`
      : '';
    parts.push(`(${formatBytes(stream.bytes)}${original}${stream.truncated ? `, ${i18next.t('projectEval:stageProgress.truncated')}` : ''})`);
  } else if (stream.truncated) {
    parts.push(`(${i18next.t('projectEval:stageProgress.truncated')})`);
  }
  return parts.join(' ');
}

function commandText(record: RunStageRecordView): string {
  const execution = record.execution_signals?.execution;
  if (execution?.command_text) {
    return execution.command_text;
  }
  const selected = record.execution_signals?.commands?.selected_candidate;
  if (selected?.command_text) {
    return selected.command_text;
  }
  if (selected?.command && selected.command.length > 0) {
    return selected.command.join(' ');
  }
  return '-';
}

function executionOutcome(record: RunStageRecordView): string | undefined {
  return record.execution_signals?.execution?.outcome || record.execution_signals?.outcome;
}

function commandWasExecuted(record: RunStageRecordView): boolean {
  const execution = record.execution_signals?.execution;
  return record.execution_signals?.command_execution === 'executed'
    || Boolean(execution?.started_at || execution?.completed_at)
    || typeof execution?.exit_code === 'number';
}

function commandCandidateCounts(record: RunStageRecordView) {
  const commands = record.execution_signals?.commands;
  return {
    planned: commands?.planned_validation?.length ?? 0,
    discovered: commands?.discovered_validation?.length ?? 0,
  };
}

function selectedCommandText(record: RunStageRecordView): string | undefined {
  const value = commandText(record);
  return value === '-' ? undefined : value;
}

function commandDecisionText(record: RunStageRecordView): string {
  const command = selectedCommandText(record);
  const signals = record.execution_signals;
  const outcome = executionOutcome(record);

  if (commandWasExecuted(record)) {
    return i18next.t('projectEval:stageProgress.friendly.commandExecuted', {
      command: command || i18next.t('projectEval:stageProgress.friendly.unknownCommand'),
      outcome: toneFromMap(COMMAND_OUTCOME_TONES, outcome || 'unknown').label,
    });
  }

  if (command) {
    return i18next.t('projectEval:stageProgress.friendly.commandSelectedNotRun', {
      command,
      reason: stageValueLabel(signals?.command_execution || signals?.readiness || signals?.outcome),
    });
  }

  return i18next.t('projectEval:stageProgress.friendly.commandNotSelected', {
    reason: stageValueLabel(signals?.command_execution || signals?.readiness || signals?.outcome),
  });
}

function stageSummaryDescription(record: RunStageRecordView): string {
  const signals = record.execution_signals;
  const failure = executionFailure(record);
  const outcome = executionOutcome(record) || signals?.outcome;

  if (failure) {
    return i18next.t('projectEval:stageProgress.friendly.summaryFailure', {
      reason: stageValueLabel(failure.reason || failure.className),
      retryable: failure.retryable
        ? i18next.t('projectEval:common.yes')
        : i18next.t('projectEval:common.no'),
    });
  }

  if (commandWasExecuted(record)) {
    return i18next.t('projectEval:stageProgress.friendly.summaryExecuted', {
      outcome: toneFromMap(COMMAND_OUTCOME_TONES, outcome || 'unknown').label,
      duration: formatDuration(commandDurationMs(record)),
    });
  }

  if (signals?.readiness && signals.readiness !== 'ready') {
    return i18next.t('projectEval:stageProgress.friendly.summaryNotReady', {
      readiness: stageValueLabel(signals.readiness),
      reason: stageTokenDescription(signals.readiness),
    });
  }

  if (signals?.command_execution && signals.command_execution !== 'executed') {
    return i18next.t('projectEval:stageProgress.friendly.summaryCommandSkipped', {
      state: stageValueLabel(signals.command_execution),
      reason: stageTokenDescription(signals.command_execution),
    });
  }

  return i18next.t('projectEval:stageProgress.friendly.summaryDefault', {
    outcome: toneFromMap(SIGNAL_OUTCOME_TONES, outcome || 'execution_signals_ready').label,
  });
}

function renderCountTags(counts: Record<string, number> | undefined, emptyText: string) {
  const entries = countEntries(counts);
  if (entries.length === 0) {
    return <Text type="secondary">{emptyText}</Text>;
  }
  return (
    <Space wrap size={[4, 6]}>
      {entries.map(([key, value]) => (
        <Tag key={key}>{stageValueLabel(key)}: {value}</Tag>
      ))}
    </Space>
  );
}

function renderJsonBlock(value: unknown, token?: ReturnType<typeof theme.useToken>['token']) {
  if (!value) {
    return <Text type="secondary">{i18next.t('projectEval:stageProgress.noStructuredPayload')}</Text>;
  }
  return (
    <pre
      style={{
        margin: 0,
        maxHeight: 280,
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        background: token?.colorFillTertiary,
        border: token ? `1px solid ${token.colorBorderSecondary}` : undefined,
        borderRadius: token?.borderRadiusSM,
        color: token?.colorText,
        padding: token ? 12 : undefined,
      }}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function renderLogBlock(title: string, stream: ReturnType<typeof executionLogStream>, token?: ReturnType<typeof theme.useToken>['token']) {
  if (!stream.text?.trim()) {
    return null;
  }
  return {
    key: title,
    label: logStreamLabel(title, stream),
    children: (
      <pre
        style={{
          margin: 0,
          maxHeight: 260,
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          background: token?.colorFillTertiary,
          border: token ? `1px solid ${token.colorBorderSecondary}` : undefined,
          borderRadius: token?.borderRadiusSM,
          color: token?.colorText,
          padding: token ? 12 : undefined,
        }}
      >
        {stream.text}
      </pre>
    ),
  };
}

function StageDetails({ record }: { record: RunStageRecordView }) {
  const { t } = useTranslation('projectEval');
  const { token } = theme.useToken();
  const [viewMode, setViewMode] = useState<StageDetailViewMode>('friendly');
  const signals = record.execution_signals;
  const execution = signals?.execution;
  const failure = executionFailure(record);
  const artifacts = execution?.artifacts;
  const outcome = executionOutcome(record) || signals?.outcome;
  const signalTone = toneFromMap(SIGNAL_OUTCOME_TONES, outcome);
  const commandTone = toneFromMap(COMMAND_OUTCOME_TONES, outcome);
  const commandCounts = commandCandidateCounts(record);
  const risks = Array.isArray(signals?.risks) ? signals.risks.filter(Boolean) : [];
  const stageName = record.stage_name || stageValueLabel(record.stage_id);
  const summaryAlertType = failure || record.status === 'failed'
    ? 'error'
    : risks.length > 0 || (!commandWasExecuted(record) && record.status !== 'completed')
      ? 'warning'
      : 'success';
  const traceAvailable = Boolean(artifacts?.raw_trace_available || artifacts?.trace_ref || artifacts?.object_key || artifacts?.download_url);
  const traceMeta = [
    typeof artifacts?.size_bytes === 'number' ? formatBytes(artifacts.size_bytes) : undefined,
    artifacts?.download_url_expires_at
      ? t('stageProgress.traceExpires', { time: formatDateTime(artifacts.download_url_expires_at) })
      : undefined,
    artifacts?.sha256 ? `sha256 ${artifacts.sha256.slice(0, 12)}` : undefined,
  ].filter((item): item is string => Boolean(item));
  const traceLabel = artifacts?.trace_ref || artifacts?.object_key || t('stageProgress.available');
  const traceUnavailableReason = artifacts?.download_error || artifacts?.error_message || artifacts?.reason;
  const logItems = [
    renderLogBlock('stdout', executionLogStream(record, 'stdout'), token),
    renderLogBlock('stderr', executionLogStream(record, 'stderr'), token),
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Space wrap align="center" style={{ width: '100%', justifyContent: 'space-between' }}>
        <Text strong>{t('stageProgress.detail.stageRecord')}</Text>
        <Segmented
          size="small"
          value={viewMode}
          options={[
            { label: t('stageProgress.detailView.friendly'), value: 'friendly' },
            { label: t('stageProgress.detailView.json'), value: 'json' },
          ]}
          onChange={(value) => setViewMode(value as StageDetailViewMode)}
        />
      </Space>

      {failure && (
        <Alert
          type={failure.retryable ? 'warning' : 'error'}
          showIcon
          message={failure.className ? stageValueLabel(failure.className) : t('stageProgress.commandFailureRecorded')}
          description={failure.reason ? stageTokenDescription(failure.reason) || stageValueLabel(failure.reason) : undefined}
        />
      )}
      {record.error_message && <Alert type="error" showIcon message={record.error_message} />}
      {execution?.error_message && <Alert type="error" showIcon message={execution.error_message} />}

      {viewMode === 'friendly' ? (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Alert
            type={summaryAlertType}
            showIcon
            message={t('stageProgress.friendly.summaryTitle', { stage: stageName })}
            description={stageSummaryDescription(record)}
          />

          <Descriptions size="small" column={{ xs: 1, md: 2 }} bordered>
            <Descriptions.Item label={t('stageProgress.friendly.moduleScope')}>
              <Space direction="vertical" size={2}>
                <Text>{record.module_slice_id || t('stageProgress.friendly.wholeRunStage')}</Text>
                {record.module_path && <Text type="secondary">{record.module_path}</Text>}
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label={t('stageProgress.friendly.signalResult')}>
              <Space wrap size={4}>
                <Tag color={signalTone.color}>{signalTone.label}</Tag>
                <Tag>{stageValueLabel(signals?.readiness)}</Tag>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label={t('stageProgress.friendly.testDiscovery')}>
              {t('stageProgress.friendly.testDiscoveryValue', commandCounts)}
            </Descriptions.Item>
            <Descriptions.Item label={t('stageProgress.friendly.commandDecision')}>
              {commandDecisionText(record)}
            </Descriptions.Item>
            <Descriptions.Item label={t('stageProgress.friendly.commandOutcome')}>
              <Space wrap size={4}>
                <Tag>{stageValueLabel(signals?.command_execution)}</Tag>
                <Tag color={commandTone.color}>{commandTone.label}</Tag>
                <Text type="secondary">{formatDuration(commandDurationMs(record))}</Text>
              </Space>
            </Descriptions.Item>
            <Descriptions.Item label={t('stageProgress.friendly.resultMeaning')}>
              {stageTokenDescription(outcome) || signalTone.label}
            </Descriptions.Item>
          </Descriptions>

          {risks.length > 0 && (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {risks.map((risk) => (
                <Alert
                  key={risk}
                  type="warning"
                  showIcon
                  message={stageValueLabel(risk)}
                  description={stageTokenDescription(risk)}
                />
              ))}
            </Space>
          )}

          <Descriptions size="small" column={{ xs: 1, md: 2 }} bordered>
            <Descriptions.Item label={t('stageProgress.detail.scheduled')}>{formatDateTime(record.scheduled_at)}</Descriptions.Item>
            <Descriptions.Item label={t('stageProgress.detail.started')}>{formatDateTime(record.started_at)}</Descriptions.Item>
            <Descriptions.Item label={t('stageProgress.detail.completed')}>{formatDateTime(record.completed_at)}</Descriptions.Item>
            <Descriptions.Item label={t('stageProgress.detail.duration')}>{formatDuration(commandDurationMs(record))}</Descriptions.Item>
            <Descriptions.Item label={t('stageProgress.detail.wallTime')}>{formatDuration(executionTimingMs(record, 'wall_duration_ms'))}</Descriptions.Item>
            <Descriptions.Item label={t('stageProgress.detail.sandboxAcquire')}>{formatDuration(executionTimingMs(record, 'acquire_duration_ms'))}</Descriptions.Item>
            <Descriptions.Item label={t('stageProgress.detail.commandExec')}>{formatDuration(executionTimingMs(record, 'exec_duration_ms'))}</Descriptions.Item>
            <Descriptions.Item label={t('stageProgress.detail.timeout')}>{formatDuration(executionTimingMs(record, 'timeout_ms'))}</Descriptions.Item>
            <Descriptions.Item label={t('stageProgress.detail.runtimeImage')}>{execution?.runtime_image || signals?.runtime_image || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('stageProgress.detail.validationLane')}>{stageValueLabel(signals?.validation_lane)}</Descriptions.Item>
            <Descriptions.Item label={t('stageProgress.detail.authority')}>{stageValueLabel(signals?.authority)}</Descriptions.Item>
            <Descriptions.Item label={t('stageProgress.detail.exitCode')}>{typeof execution?.exit_code === 'number' ? execution.exit_code : '-'}</Descriptions.Item>
            <Descriptions.Item label={t('stageProgress.detail.sandbox')}>{execution?.sandbox_id || '-'}</Descriptions.Item>
            <Descriptions.Item label={t('stageProgress.detail.traceArtifact')}>
              <Space direction="vertical" size={2}>
                {traceAvailable ? (
                  artifacts?.download_url ? (
                    <a href={artifacts.download_url} target="_blank" rel="noreferrer">{t('stageProgress.openTrace')}</a>
                  ) : (
                    <Text>{traceLabel}</Text>
                  )
                ) : (
                  <Text type="secondary">{stageValueLabel(traceUnavailableReason)}</Text>
                )}
                {traceMeta.length > 0 && <Text type="secondary">{traceMeta.join(' | ')}</Text>}
              </Space>
            </Descriptions.Item>
          </Descriptions>
        </Space>
      ) : (
        <Collapse
          size="small"
          items={[
            {
              key: 'signals',
              label: t('stageProgress.detail.executionSignals'),
              children: renderJsonBlock(signals, token),
            },
            {
              key: 'result',
              label: t('stageProgress.detail.stageResult'),
              children: renderJsonBlock(record.result, token),
            },
            {
              key: 'record',
              label: t('stageProgress.detail.stageRecordPayload'),
              children: renderJsonBlock(record, token),
            },
          ]}
        />
      )}

      {logItems.length > 0 && (
        <Collapse
          size="small"
          items={[
            {
              key: 'logs',
              label: execution?.logs?.limit_bytes
                ? t('stageProgress.detail.commandLogsWithLimit', { limit: formatBytes(execution.logs.limit_bytes) })
                : t('stageProgress.detail.commandLogs'),
              children: <Collapse size="small" items={logItems} />,
            },
          ]}
        />
      )}
    </Space>
  );
}

export default function ProjectEvalStageProgressPanel({
  runId,
  planVersion,
  title,
  compact = false,
  reportSummary,
  reportSignals,
  onStageRetried,
}: ProjectEvalStageProgressPanelProps) {
  const { t } = useTranslation('projectEval');
  const { token } = theme.useToken();
  const [progress, setProgress] = useState<RunStageProgressView | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [retryingStageId, setRetryingStageId] = useState<string | null>(null);

  const admin = useMemo(() => isPersistedOrgAdmin(), []);
  const signalFallbackItems = useMemo<RunStageRecordView[]>(() => {
    if (!reportSignals || reportSignals.length === 0) {
      return [];
    }
    return reportSignals.map((signal, index) => ({
      id: signal.stage_record_id || `${signal.module_slice_id || 'module-slice'}:${index}`,
      run_id: signal.run_id || runId || '',
      organization_id: signal.organization_id || '',
      source_id: signal.source_id || '',
      plan_version: typeof signal.plan_version === 'number' ? signal.plan_version : 0,
      stage_id: signal.stage_id || 'module_slice_validation',
      stage_order: typeof signal.stage_order === 'number' ? signal.stage_order : index + 1,
      stage_kind: signal.stage_kind || 'module_slice',
      stage_name: t('stageProgress.moduleSliceValidation'),
      module_slice_id: signal.module_slice_id,
      module_path: signal.module_path,
      status: signal.status || 'completed',
      terminal: false,
      retryable: false,
      execution_signals: signal,
      scheduled_at: signal.generated_at || '',
      created_at: signal.generated_at || '',
      updated_at: signal.generated_at || '',
    }));
  }, [reportSignals, runId, t]);

  const fetchProgress = useCallback(async () => {
    if (!runId) {
      setProgress(null);
      return;
    }

    setLoading(true);
    setErrorMessage(null);
    try {
      const response = await projectEvalService.listRunStages(
        runId,
        planVersion ? { plan_version: planVersion } : undefined,
        { silentError: true },
      );
      setProgress(response as unknown as RunStageProgressView);
    } catch (error) {
      setProgress(null);
      setErrorMessage(getErrorMessage(error, t('stageProgress.messages.loadFailed')));
    } finally {
      setLoading(false);
    }
  }, [planVersion, runId, t]);

  useEffect(() => {
    void fetchProgress();
  }, [fetchProgress]);

  const handleRetry = useCallback(
    async (record: RunStageRecordView) => {
      if (!runId) {
        return;
      }
      setRetryingStageId(record.id);
      try {
        await projectEvalService.retryRunStage(runId, record.id);
        message.success(t('stageProgress.messages.retryQueued'));
        await fetchProgress();
        await onStageRetried?.();
      } catch (error) {
        message.error(getErrorMessage(error, t('stageProgress.messages.retryFailed')));
      } finally {
        setRetryingStageId(null);
      }
    },
    [fetchProgress, onStageRetried, runId, t],
  );

  const rows = progress?.items?.length ? progress.items : signalFallbackItems;
  const effectiveSummary = progress?.module_slice_execution_summary ?? reportSummary;
  const stageCount = progress?.stage_count ?? rows.length;
  const completedCount = progress?.completed_count ?? rows.filter((item) => item.status === 'completed' || item.status === 'skipped').length;
  const failedCount = progress?.failed_count ?? rows.filter((item) => item.status === 'failed').length;
  const retryableCount = progress?.retryable_count ?? rows.filter((item) => item.retryable).length;
  const progressPercent = typeof progress?.progress_percent === 'number'
    ? Math.min(100, Math.max(0, progress.progress_percent))
    : stageCount > 0
      ? Math.round((completedCount / stageCount) * 100)
      : 0;

  const commandExecutionCounts = effectiveSummary?.command_execution_counts;
  const commandOutcomeCounts = effectiveSummary?.command_outcome_counts;
  const commandExecutedCount = getCount(commandExecutionCounts, 'executed');
  const commandFailedCount = getCount(commandOutcomeCounts, 'fail');
  const commandTimeoutCount = getCount(commandOutcomeCounts, 'timeout');
  const commandSandboxErrorCount = getCount(commandOutcomeCounts, 'sandbox_error') + getCount(commandOutcomeCounts, 'executor_error');

  const columns: TableProps<RunStageRecordView>['columns'] = [
    {
      title: t('stageProgress.columns.stage'),
      dataIndex: 'stage_name',
      key: 'stage_name',
      width: 260,
      render: (_value, record) => (
        <Space direction="vertical" size={2}>
          <Space wrap size={4}>
            <Text strong>{record.stage_name || stageValueLabel(record.stage_id)}</Text>
            {record.terminal && <Tag>{t('stageProgress.terminal')}</Tag>}
          </Space>
          <Text type="secondary">#{record.stage_order} | {stageValueLabel(record.stage_kind)}</Text>
        </Space>
      ),
    },
    {
      title: t('stageProgress.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 130,
      render: (value) => {
        const tone = toneFromMap(STAGE_STATUS_TONES, String(value || ''));
        return <Tag color={tone.color}>{tone.label}</Tag>;
      },
    },
    {
      title: t('stageProgress.columns.moduleSlice'),
      dataIndex: 'module_slice_id',
      key: 'module_slice_id',
      width: 240,
      render: (_value, record) => (
        <Space direction="vertical" size={2}>
          <Text>{record.module_slice_id || '-'}</Text>
          {record.module_path && <Text type="secondary">{record.module_path}</Text>}
        </Space>
      ),
    },
    {
      title: t('stageProgress.columns.signals'),
      key: 'signals',
      width: 210,
      render: (_value, record) => {
        const signalTone = toneFromMap(SIGNAL_OUTCOME_TONES, record.execution_signals?.outcome);
        return (
          <Space direction="vertical" size={4}>
            <Tag color={signalTone.color}>{signalTone.label}</Tag>
            <Text type="secondary">{stageValueLabel(record.execution_signals?.readiness)}</Text>
          </Space>
        );
      },
    },
    {
      title: t('stageProgress.columns.command'),
      key: 'command',
      width: 300,
      ellipsis: true,
      render: (_value, record) => {
        const outcome = executionOutcome(record) || 'unknown';
        const tone = toneFromMap(COMMAND_OUTCOME_TONES, outcome);
        return (
          <Space direction="vertical" size={4}>
            <Text code>{commandText(record)}</Text>
            <Space wrap size={4}>
              <Tag>{stageValueLabel(record.execution_signals?.command_execution)}</Tag>
              <Tag color={tone.color}>{tone.label}</Tag>
            </Space>
          </Space>
        );
      },
    },
    {
      title: t('stageProgress.columns.timing'),
      key: 'timing',
      width: 140,
      render: (_value, record) => formatDuration(commandDurationMs(record)),
    },
    {
      title: t('stageProgress.columns.action'),
      key: 'action',
      fixed: 'right',
      width: 150,
      render: (_value, record) => {
        if (!record.retryable) {
          return record.retry_blocked_reason ? <Text type="secondary">{stageValueLabel(record.retry_blocked_reason)}</Text> : '-';
        }
        if (!admin) {
          return <Tag color="gold">{t('stageProgress.adminRetry')}</Tag>;
        }
        return (
          <Popconfirm
            title={t('stageProgress.retryConfirm.title')}
            description={t('stageProgress.retryConfirm.description')}
            okText={t('stageProgress.retryConfirm.ok')}
            cancelText={t('stageProgress.retryConfirm.cancel')}
            onConfirm={() => void handleRetry(record)}
          >
            <Button size="small" icon={<RetweetOutlined />} loading={retryingStageId === record.id}>
              {t('stageProgress.retry')}
            </Button>
          </Popconfirm>
        );
      },
    },
  ];

  return (
    <Card
      title={(
        <Space wrap>
          <BranchesOutlined />
          <span>{title ?? t('stageProgress.title')}</span>
          {progress?.plan_version && <Tag>{t('stageProgress.planVersion', { version: progress.plan_version })}</Tag>}
          {effectiveSummary?.supports_admin_stage_retry && <Tag color="blue">{t('stageProgress.adminRetry')}</Tag>}
        </Space>
      )}
      extra={(
        <Button size="small" icon={<ReloadOutlined />} loading={loading} onClick={() => void fetchProgress()}>
          {t('common.refresh')}
        </Button>
      )}
      style={{ marginBottom: compact ? 16 : undefined }}
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {errorMessage && (
          <Alert
            type={effectiveSummary ? 'warning' : 'error'}
            showIcon
            message={errorMessage}
            description={effectiveSummary ? t('stageProgress.reportEmbeddedSummary') : undefined}
          />
        )}

        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={6}>
            <Statistic title={t('stageProgress.stats.stages')} value={stageCount} loading={loading && !progress} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic title={t('stageProgress.stats.completed')} value={completedCount} loading={loading && !progress} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic title={t('stageProgress.stats.failed')} value={failedCount} loading={loading && !progress} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Statistic title={t('stageProgress.stats.retryable')} value={retryableCount} loading={loading && !progress} />
          </Col>
        </Row>

        {stageCount > 0 && <Progress percent={progressPercent} status={failedCount > 0 ? 'exception' : undefined} />}

        {effectiveSummary && (
          <>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} lg={6}>
                <Statistic title={t('stageProgress.stats.moduleSlices')} value={effectiveSummary.module_slice_count ?? 0} />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic title={t('stageProgress.stats.readySlices')} value={effectiveSummary.ready_count ?? 0} />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic title={t('stageProgress.stats.commandsRun')} value={commandExecutedCount} prefix={<PlayCircleOutlined />} />
              </Col>
              <Col xs={24} sm={12} lg={6}>
                <Statistic title={t('stageProgress.stats.commandRisk')} value={commandFailedCount + commandTimeoutCount + commandSandboxErrorCount} />
              </Col>
            </Row>

            <Row gutter={[16, 16]}>
              <Col xs={24} lg={12}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Text strong>{t('stageProgress.readiness')}</Text>
                  {renderCountTags(effectiveSummary.readiness_counts, t('stageProgress.empty.readinessCounts'))}
                </Space>
              </Col>
              <Col xs={24} lg={12}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Text strong>{t('stageProgress.commandOutcomes')}</Text>
                  {renderCountTags(commandOutcomeCounts, t('stageProgress.empty.commandOutcomeCounts'))}
                </Space>
              </Col>
            </Row>
          </>
        )}

        {rows.length === 0 ? (
          <Empty description={t('stageProgress.empty.noDurableRecords')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Table<RunStageRecordView>
            rowKey="id"
            size="small"
            loading={loading && rows.length === 0}
            dataSource={rows}
            columns={columns}
            scroll={{ x: 1320 }}
            pagination={compact ? { pageSize: 5, showSizeChanger: false } : { pageSize: 10, showSizeChanger: false }}
            expandable={{
              expandedRowRender: (record) => <StageDetails record={record} />,
            }}
          />
        )}

        {progress?.staged_execution_plan && (
          <Collapse
            size="small"
            items={[
              {
                key: 'stage-plan',
                label: (
                  <Space>
                    <CodeOutlined />
                    <span>{t('stageProgress.stagedExecutionPlan')}</span>
                  </Space>
                ),
                children: (
                  <Space direction="vertical" size={12} style={{ width: '100%' }}>
                    <Paragraph style={{ marginBottom: 0 }}>
                      {stageReadableText(
                        progress.staged_execution_plan.partial_result_semantics,
                        t('stageProgress.defaultPlanSemantics'),
                      )}
                    </Paragraph>
                    <Collapse
                      size="small"
                      items={[
                        {
                          key: 'raw-plan',
                          label: t('stageProgress.detail.rawJson'),
                          children: renderJsonBlock({
                            staged_execution_plan: progress.staged_execution_plan,
                            module_slicing_plan: progress.module_slicing_plan,
                          }, token),
                        },
                      ]}
                    />
                  </Space>
                ),
              },
            ]}
          />
        )}
      </Space>
    </Card>
  );
}



