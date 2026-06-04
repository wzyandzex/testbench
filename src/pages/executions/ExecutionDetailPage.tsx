import { useCallback, useEffect, useMemo, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  Alert,
  Button,
  Col,
  Collapse,
  Descriptions,
  Divider,
  Empty,
  Modal,
  Progress,
  Row,
  Skeleton,
  Space,
  Statistic,
  Tabs,
  Tag,
  Timeline,
  Typography,
  message,
} from 'antd';
import type { CollapseProps, DescriptionsProps, TabsProps } from 'antd';
import {
  ArrowLeftOutlined,
  CodeOutlined,
  DiffOutlined,
  DownloadOutlined,
  FileTextOutlined,
  HistoryOutlined,
  ReloadOutlined,
  SettingOutlined,
  ShareAltOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useExecutionProgress } from '@/hooks/useWebSocket';
import { useExecutionLogs } from '@/hooks/useExecutionLogs';
import { HolographicLogViewer } from '@/pages/batch/components/HolographicLogViewer';
import { PageHeader } from '@/components/common';
import { ExecutionExportModal, type ExecutionExportDraft } from '@/components/execution/ExecutionExportModal';
import { ShareModal } from '@/pages/shares/components/ShareModal';
import { ExecutionStatusTag } from '@/components/execution';
import { agentService } from '@/services/agent';
import { benchmarkService } from '@/services/benchmark';
import executionService, {
  canCancelExecution,
  getExecutionDurationMs,
  getExecutionErrorText,
  getExecutionPrimaryOutput,
  getExecutionProgress,
} from '@/services/execution';
import { useCardStyle, useTextStyle, useThemeTokens } from '@/theme';
import type { CalculateCostResponse } from '@/types/cost';
import type { ExecutionRecord, ExecutionTrace } from '@/types/api/execution';
import type { MetricsRecord } from '@/types/metrics';

dayjs.extend(relativeTime);

const { Paragraph, Text } = Typography;

function renderJsonBlock(value: unknown, color: string) {
  return (
    <pre
      style={{
        margin: 0,
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        color,
        fontSize: 12,
        lineHeight: 1.6,
      }}
    >
      {JSON.stringify(value ?? null, null, 2)}
    </pre>
  );
}

function unwrapMaybeAxios<T>(value: T | { data: T; status: number } | null): T | null {
  if (!value) {
    return null;
  }
  if (
    typeof value === 'object' &&
    'status' in value &&
    'data' in value
  ) {
    return value.data;
  }
  return value as T;
}

function formatDuration(durationMs: number) {
  if (!durationMs || durationMs <= 0) {
    return '-';
  }
  if (durationMs < 1000) {
    return `${durationMs} ms`;
  }
  if (durationMs < 60_000) {
    return `${(durationMs / 1000).toFixed(1)} s`;
  }
  return `${(durationMs / 60_000).toFixed(1)} min`;
}

function formatPercent(value?: number) {
  if (value === undefined || value === null || Number.isNaN(value)) {
    return '-';
  }
  return `${(value * 100).toFixed(1)}%`;
}

function boolTag(value: boolean | undefined, yes: string, no: string, unknown: string) {
  if (value === undefined) {
    return <Tag>{unknown}</Tag>;
  }
  return value ? <Tag color="success">{yes}</Tag> : <Tag color="default">{no}</Tag>;
}

export default function ExecutionDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('executions');
  const tokens = useThemeTokens();
  const cardStyle = useCardStyle();
  const primaryTextStyle = useTextStyle('primary');
  const secondaryTextStyle = useTextStyle('secondary');

  const [detail, setDetail] = useState<ExecutionRecord | null>(null);
  const [trace, setTrace] = useState<ExecutionTrace[]>([]);
  const [metrics, setMetrics] = useState<MetricsRecord | null>(null);
  const [cost, setCost] = useState<CalculateCostResponse | null>(null);
  const [benchmarkName, setBenchmarkName] = useState('');
  const [agentName, setAgentName] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadExecution = useCallback(
    async (mode: 'initial' | 'refresh' | 'poll' = 'initial') => {
      if (!id) {
        return;
      }

      if (mode === 'initial') {
        setLoading(true);
      } else if (mode === 'refresh') {
        setRefreshing(true);
      }

      try {
        const record = await executionService.get(id);
        const [traceResult, metricsResult, costResult, benchmarkResult, agentResult] = await Promise.all([
          executionService.getTrace(id).catch(() => []),
          executionService.getMetrics(id).catch(() => null),
          executionService.getCost(id).catch(() => null),
          record.benchmark_id ? benchmarkService.get(record.benchmark_id).catch(() => null) : Promise.resolve(null),
          record.agent_id ? agentService.get(record.agent_id).catch(() => null) : Promise.resolve(null),
        ]);

        setDetail(record);
        setTrace(traceResult);
        setMetrics(metricsResult);
        setCost(costResult);
        const normalizedBenchmark = unwrapMaybeAxios(benchmarkResult);
        const normalizedAgent = unwrapMaybeAxios(agentResult);
        setBenchmarkName(normalizedBenchmark?.display_name || normalizedBenchmark?.name || record.benchmark_id || '');
        setAgentName(normalizedAgent?.display_name || normalizedAgent?.name || record.agent_id || '');
        setError(null);
      } catch (loadError) {
        const messageText = loadError instanceof Error ? loadError.message : t('detail.loadFailed');
        setError(messageText);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [id]
  );

  useEffect(() => {
    void loadExecution('initial');
  }, [loadExecution]);

  const isRunning = detail != null && canCancelExecution(detail);
  const { logs: liveLogs, appendLog, setHistoricalLogs } = useExecutionLogs();

  // When execution finishes and we have trace, populate historical logs
  useEffect(() => {
    if (!isRunning && trace.length > 0 && liveLogs.length === 0) {
      setHistoricalLogs(trace);
    }
  }, [isRunning, trace, liveLogs.length, setHistoricalLogs]);

  // WebSocket real-time updates
  const { connected: wsConnected } = useExecutionProgress(
    id,
    {
      onProgress: () => {
        void loadExecution('poll');
      },
      onLog: (data) => {
        appendLog(data);
      },
      onCompleted: () => {
        void loadExecution('refresh');
      },
      onFailed: () => {
        void loadExecution('refresh');
      },
    },
    isRunning
  );

  // Fallback polling: 30s when WS disconnected, disabled when WS is live
  useEffect(() => {
    if (!isRunning) return;
    if (wsConnected) return;

    const timer = window.setInterval(() => {
      void loadExecution('poll');
    }, 30000);

    return () => {
      window.clearInterval(timer);
    };
  }, [isRunning, wsConnected, loadExecution]);

  const handleCancel = async () => {
    if (!detail) {
      return;
    }

    Modal.confirm({
      title: t('actions.cancelConfirm'),
      content: t('actions.cancelContent'),
      okText: t('actions.confirmCancel'),
      cancelText: t('actions.keepWatching'),
      okButtonProps: { danger: true },
      onOk: async () => {
        setCancelling(true);
        try {
          await executionService.cancel(detail.id);
          message.success(t('actions.cancelSuccess'));
          await loadExecution('refresh');
        } catch {
          message.error(t('actions.cancelFailed'));
        } finally {
          setCancelling(false);
        }
      },
    });
  };

  const openExportFile = (fileUrl?: string) => {
    if (!fileUrl) {
      return false;
    }

    window.open(fileUrl, '_blank', 'noopener,noreferrer');
    return true;
  };

  const handleExport = async (draft: ExecutionExportDraft) => {
    if (!detail) {
      return;
    }

    setExporting(true);
    try {
      const result = await executionService.requestExport(detail.id, {
        format: draft.format,
        template: draft.template,
        templateId: draft.templateId,
        includeCharts: draft.includeCharts,
      });

      if (result.file_url) {
        openExportFile(result.file_url);
        message.success(result.file_name ? t('actions.exportSuccess', { name: result.file_name }) : t('actions.exportSuccessNoName'));
      } else {
        message.success(result.task_id ? t('actions.exportTaskCreated', { id: result.task_id }) : t('actions.exportTaskSubmitted'));
      }

      setExportModalOpen(false);
    } catch {
      message.error(t('actions.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  const progress = detail ? getExecutionProgress(detail) : null;
  const primaryOutput = detail ? getExecutionPrimaryOutput(detail.result) : '';
  const errorText = detail ? getExecutionErrorText(detail, detail.result) : '';
  const durationMs = detail ? getExecutionDurationMs(detail) : 0;

  const topStats = useMemo(
    () => [
      {
        key: 'duration',
        title: t('detail.duration'),
        value: formatDuration(durationMs),
        color: tokens.text.primary,
      },
      {
        key: 'tokens',
        title: t('detail.totalTokens'),
        value: detail?.total_tokens ?? 0,
        color: tokens.status.info,
      },
      {
        key: 'cost',
        title: t('detail.cost'),
        value: cost ? `${cost.currency} ${cost.total_cost.toFixed(4)}` : '-',
        color: tokens.status.warning,
      },
      {
        key: 'score',
        title: t('detail.overallScore'),
        value: metrics ? metrics.score.toFixed(2) : '-',
        color: tokens.status.success,
      },
    ],
    [cost, detail?.total_tokens, durationMs, metrics, tokens, t]
  );

  const overviewItems = useMemo<DescriptionsProps['items']>(() => {
    if (!detail) {
      return [];
    }

    return [
      { key: 'id', label: t('detail.executionId'), children: detail.id },
      { key: 'status', label: t('list.statusFilter'), children: <ExecutionStatusTag status={detail.status} /> },
      { key: 'benchmark', label: t('detail.benchmark'), children: benchmarkName || detail.benchmark_id || t('detail.unbound') },
      { key: 'agent', label: 'Agent', children: agentName || detail.agent_id || '-' },
      { key: 'priority', label: t('detail.priority'), children: detail.priority || '-' },
      { key: 'sandbox', label: t('detail.sandbox'), children: detail.sandbox_type || detail.sandbox_id || '-' },
      { key: 'started', label: t('detail.startTime'), children: dayjs(detail.started_at).format('YYYY-MM-DD HH:mm:ss') },
      {
        key: 'completed',
        label: t('detail.completedTime'),
        children: detail.completed_at ? dayjs(detail.completed_at).format('YYYY-MM-DD HH:mm:ss') : '-',
      },
      { key: 'duration', label: t('detail.duration'), children: formatDuration(durationMs) },
      {
        key: 'tokens',
        label: 'Token',
        children: `${detail.input_tokens} / ${detail.output_tokens} / ${detail.total_tokens}`,
      },
      { key: 'steps', label: t('detail.steps'), children: `${detail.steps_taken} / ${detail.total_steps}` },
      { key: 'success', label: t('detail.success'), children: boolTag(detail.success, t('bool.yes'), t('bool.no'), t('status.unknown')) },
    ];
  }, [agentName, benchmarkName, detail, durationMs, t]);

  const metricsSections = useMemo(() => {
    if (!metrics) {
      return [];
    }

    return [
      {
        key: 'scores',
        label: t('metrics.scores'),
        content: (
          <Row gutter={[12, 12]}>
            <Col xs={12} md={8}><Statistic title={t('metrics.totalScore')} value={metrics.score} precision={2} /></Col>
            <Col xs={12} md={8}><Statistic title={t('metrics.functional')} value={metrics.func_score} precision={2} /></Col>
            <Col xs={12} md={8}><Statistic title={t('metrics.efficiency')} value={metrics.eff_score} precision={2} /></Col>
            <Col xs={12} md={8}><Statistic title={t('metrics.quality')} value={metrics.qual_score} precision={2} /></Col>
            <Col xs={12} md={8}><Statistic title={t('metrics.stability')} value={metrics.stab_score} precision={2} /></Col>
            <Col xs={12} md={8}><Statistic title={t('metrics.reasoning')} value={metrics.reas_score} precision={2} /></Col>
          </Row>
        ),
      },
      {
        key: 'functional',
        label: t('metrics.functionalMetrics'),
        content: (
          <Descriptions size="small" column={2} bordered>
            <Descriptions.Item label={t('metrics.testPassRate')}>{formatPercent(metrics.functional.test_pass_rate)}</Descriptions.Item>
            <Descriptions.Item label={t('metrics.testCoverage')}>{formatPercent(metrics.functional.test_coverage)}</Descriptions.Item>
            <Descriptions.Item label={t('metrics.testCaseCount')}>{metrics.functional.test_case_count}</Descriptions.Item>
            <Descriptions.Item label={t('metrics.requirementMet')}>{boolTag(metrics.functional.requirement_met, t('bool.yes'), t('bool.no'), t('status.unknown'))}</Descriptions.Item>
            <Descriptions.Item label={t('metrics.constraintMet')}>{boolTag(metrics.functional.constraint_met, t('bool.yes'), t('bool.no'), t('status.unknown'))}</Descriptions.Item>
            <Descriptions.Item label={t('metrics.regressionTest')}>{boolTag(metrics.functional.regression_test, t('bool.yes'), t('bool.no'), t('status.unknown'))}</Descriptions.Item>
          </Descriptions>
        ),
      },
      {
        key: 'efficiency',
        label: t('metrics.efficiencyMetrics'),
        content: (
          <Descriptions size="small" column={2} bordered>
            <Descriptions.Item label={t('metrics.totalDuration')}>{formatDuration(metrics.efficiency.total_duration)}</Descriptions.Item>
            <Descriptions.Item label={t('metrics.executionTime')}>{formatDuration(metrics.efficiency.execution_time)}</Descriptions.Item>
            <Descriptions.Item label={t('metrics.planningTime')}>{formatDuration(metrics.efficiency.planning_time)}</Descriptions.Item>
            <Descriptions.Item label={t('metrics.correctionTime')}>{formatDuration(metrics.efficiency.correction_time)}</Descriptions.Item>
            <Descriptions.Item label={t('metrics.tokensPerStep')}>{metrics.efficiency.tokens_per_step.toFixed(2)}</Descriptions.Item>
            <Descriptions.Item label={t('metrics.efficiencyRate')}>{formatPercent(metrics.efficiency.efficiency_rate)}</Descriptions.Item>
          </Descriptions>
        ),
      },
      {
        key: 'reasoning',
        label: t('metrics.reasoningMetrics'),
        content: (
          <Descriptions size="small" column={2} bordered>
            <Descriptions.Item label={t('metrics.reasoningDepth')}>{metrics.reasoning.reasoning_depth}</Descriptions.Item>
            <Descriptions.Item label={t('metrics.planningSteps')}>{metrics.reasoning.planning_steps}</Descriptions.Item>
            <Descriptions.Item label={t('metrics.backtrackingCount')}>{metrics.reasoning.backtracking_count}</Descriptions.Item>
            <Descriptions.Item label={t('metrics.toolCallCount')}>{metrics.reasoning.tool_call_count}</Descriptions.Item>
            <Descriptions.Item label={t('metrics.toolSuccessRate')}>{formatPercent(metrics.reasoning.tool_success_rate)}</Descriptions.Item>
            <Descriptions.Item label={t('metrics.contextUsage')}>{formatPercent(metrics.reasoning.context_usage)}</Descriptions.Item>
          </Descriptions>
        ),
      },
    ];
  }, [metrics, t]);

  const traceTimelineItems = useMemo(() => {
    if (trace.length === 0) {
      return [];
    }

    return trace.map((item) => ({
      color: item.error ? tokens.status.error : tokens.status.info,
      children: (
        <div
          style={{
            padding: 14,
            borderRadius: 14,
            border: `1px solid ${tokens.border.default}`,
            background: tokens.bg.secondary,
          }}
        >
          <Space direction="vertical" size={8} style={{ width: '100%' }}>
            <Space wrap>
              <Tag color="blue">#{item.step_index}</Tag>
              <Tag>{item.step_type || 'unknown'}</Tag>
              <Text style={secondaryTextStyle}>
                {dayjs(item.timestamp).format('YYYY-MM-DD HH:mm:ss')}
              </Text>
              {item.duration ? <Text style={secondaryTextStyle}>{formatDuration(item.duration)}</Text> : null}
            </Space>
            {item.action ? <Text style={primaryTextStyle}>{item.action}</Text> : null}
            {item.reasoning ? (
              <Paragraph style={{ marginBottom: 0, ...secondaryTextStyle }}>
                {item.reasoning}
              </Paragraph>
            ) : null}
            {item.input ? (
              <div>
                <Text strong>{t('trace.input')}</Text>
                <div style={{ marginTop: 6 }}>{renderJsonBlock(item.input, tokens.text.secondary)}</div>
              </div>
            ) : null}
            {item.output ? (
              <div>
                <Text strong>{t('trace.output')}</Text>
                <div style={{ marginTop: 6 }}>{renderJsonBlock(item.output, tokens.text.secondary)}</div>
              </div>
            ) : null}
            {item.error ? (
              <Alert
                type="error"
                showIcon
                message={t('detail.stepError')}
                description={item.error}
              />
            ) : null}
          </Space>
        </div>
      ),
    }));
  }, [primaryTextStyle, secondaryTextStyle, tokens, trace]);

  const rawPanels = useMemo<CollapseProps['items']>(() => {
    if (!detail) {
      return [];
    }

    return [
      {
        key: 'task_config',
        label: 'task_config',
        children: renderJsonBlock(detail.task_config, tokens.text.secondary),
      },
      {
        key: 'agent_config',
        label: 'agent_config',
        children: renderJsonBlock(detail.agent_config, tokens.text.secondary),
      },
      {
        key: 'metadata',
        label: 'metadata',
        children: renderJsonBlock(detail.metadata, tokens.text.secondary),
      },
      {
        key: 'result',
        label: 'result',
        children: renderJsonBlock(detail.result, tokens.text.secondary),
      },
    ];
  }, [detail, tokens.text.secondary]);

  const tabs = useMemo<TabsProps['items']>(() => {
    return [
      {
        key: 'overview',
        label: (
          <span>
            <FileTextOutlined /> {t('detail.overview')}
          </span>
        ),
        children: (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div style={{ ...cardStyle, padding: 20 }}>
              <Descriptions title={t('detail.executionInfo')} bordered column={2} items={overviewItems} />
            </div>

            {progress ? (
              <div style={{ ...cardStyle, padding: 20 }}>
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  <Text style={{ ...primaryTextStyle, fontWeight: 600 }}>{t('detail.liveProgress')}</Text>
                  <Progress percent={progress.percentage} status="active" />
                  <Text style={secondaryTextStyle}>
                    {progress.message} · {progress.current_step}/{progress.total_steps}
                  </Text>
                </Space>
              </div>
            ) : null}

            {primaryOutput ? (
              <div style={{ ...cardStyle, padding: 20 }}>
                <Text style={{ ...primaryTextStyle, fontWeight: 600 }}>{t('detail.resultSummary')}</Text>
                <Paragraph style={{ marginTop: 12, marginBottom: 0 }}>
                  {primaryOutput}
                </Paragraph>
              </div>
            ) : null}

            {detail?.contract ? (
              <div style={{ ...cardStyle, padding: 20 }}>
                <Descriptions title={t('detail.contract')} bordered size="small" column={2}>
                  <Descriptions.Item label={t('detail.contractMode')}>{detail.contract.execution_contract_mode || '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('detail.toolProfile')}>{detail.contract.tool_profile || '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('detail.configuredProfile')}>{detail.contract.configured_tool_profile || '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('detail.planVersion')}>
                    {detail.contract.repair_plan_version ?? '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('detail.planHash')} span={2}>
                    {detail.contract.repair_plan_hash || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('detail.sourceExecutionId')} span={2}>
                    {detail.contract.repair_plan_source_execution_id || '-'}
                  </Descriptions.Item>
                </Descriptions>
              </div>
            ) : null}
          </Space>
        ),
      },
      {
        key: 'live-logs',
        label: (
          <span>
            <CodeOutlined /> {t('detail.liveLogs')}
          </span>
        ),
        children: (
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: wsConnected ? '#52c41a' : '#faad14',
                  display: 'inline-block',
                }}
              />
              <Text style={secondaryTextStyle}>
                {wsConnected ? t('detail.realtime') : t('detail.polling')}
              </Text>
            </div>
            <HolographicLogViewer logs={liveLogs} maxHeight={560} />
          </Space>
        ),
      },
      {
        key: 'trace',
        label: (
          <span>
            <HistoryOutlined /> {t('detail.trace')}
          </span>
        ),
        children:
          traceTimelineItems.length > 0 ? (
            <div style={{ ...cardStyle, padding: 20 }}>
              <Timeline items={traceTimelineItems} />
            </div>
          ) : (
            <div style={{ ...cardStyle, padding: 32 }}>
              <Empty description={t('detail.noTraceData')} />
            </div>
          ),
      },
      {
        key: 'metrics',
        label: (
          <span>
            <FileTextOutlined /> {t('detail.metricsTab')}
          </span>
        ),
        children:
          metricsSections.length > 0 ? (
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              {metricsSections.map((section) => (
                <div key={section.key} style={{ ...cardStyle, padding: 20 }}>
                  <Text style={{ ...primaryTextStyle, fontWeight: 600 }}>{section.label}</Text>
                  <Divider style={{ margin: '12px 0' }} />
                  {section.content}
                </div>
              ))}
            </Space>
          ) : (
            <div style={{ ...cardStyle, padding: 32 }}>
              <Empty description={t('detail.noMetricsData')} />
            </div>
          ),
      },
      {
        key: 'raw',
        label: (
          <span>
            <SettingOutlined /> {t('detail.rawData')}
          </span>
        ),
        children: (
          <div style={{ ...cardStyle, padding: 20 }}>
            <Collapse items={rawPanels} defaultActiveKey={['task_config']} />
          </div>
        ),
      },
    ];
  }, [
    cardStyle,
    detail?.contract,
    liveLogs,
    metricsSections,
    overviewItems,
    primaryOutput,
    primaryTextStyle,
    progress,
    rawPanels,
    secondaryTextStyle,
    traceTimelineItems,
    wsConnected,
  ]);

  if (loading) {
    return (
      <div style={{ padding: '32px 40px', maxWidth: 1680, margin: '0 auto' }}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    );
  }

  if (error && !detail) {
    return (
      <div style={{ padding: '32px 40px', maxWidth: 1680, margin: '0 auto' }}>
        <Alert
          type="error"
          showIcon
          message={t('detail.loadFailed')}
          description={error}
          action={
            <Button onClick={() => void loadExecution('refresh')}>
              {t('actions.retry')}
            </Button>
          }
        />
      </div>
    );
  }

  if (!detail) {
    return (
      <div style={{ padding: '32px 40px', maxWidth: 1680, margin: '0 auto' }}>
        <Empty description={t('detail.notFound')} />
      </div>
    );
  }

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1680, margin: '0 auto' }}>
      <PageHeader
        title={benchmarkName || detail.benchmark_id || t('detail.title')}
        description={`${t('detail.executionId')}: ${detail.id}`}
        breadcrumb={[
          { title: t('title'), href: '/executions' },
          { title: detail.id },
        ]}
        extra={
          <Space wrap>
            {isRunning && (
              <Tag
                color={wsConnected ? 'success' : 'warning'}
                style={{ marginRight: 0 }}
              >
                {wsConnected ? t('detail.realtimeShort') : t('detail.pollingShort')}
              </Tag>
            )}
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/executions')}>
              {t('detail.backToList')}
            </Button>
            <Button icon={<ReloadOutlined />} onClick={() => void loadExecution('refresh')} loading={refreshing}>
              {t('detail.refresh')}
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => setExportModalOpen(true)}>
              {t('detail.export')}
            </Button>
            <Button icon={<ShareAltOutlined />} onClick={() => setShareModalOpen(true)}>
              {t('detail.share')}
            </Button>
            <Button
              icon={<DiffOutlined />}
              onClick={() => navigate(`/comparisons/new?ref=${detail.id}`)}
            >
              {t('detail.compare')}
            </Button>
            {canCancelExecution(detail) ? (
              <Button danger icon={<StopOutlined />} onClick={() => void handleCancel()} loading={cancelling}>
                {t('detail.cancelExecution')}
              </Button>
            ) : null}
          </Space>
        }
      />

      {error ? (
        <Alert
          style={{ marginBottom: 16 }}
          type="warning"
          showIcon
          message={t('detail.partialLoadFailed')}
          description={error}
        />
      ) : null}

      {errorText ? (
        <Alert
          style={{ marginBottom: 16 }}
          type={detail.status === 'failed' || detail.status === 'timeout' ? 'error' : 'warning'}
          showIcon
          message={t('detail.executionError')}
          description={errorText}
        />
      ) : null}

      <div
        style={{
          ...cardStyle,
          marginBottom: 20,
          padding: 24,
          background: `linear-gradient(135deg, ${tokens.bg.primary}, ${tokens.bg.secondary})`,
        }}
      >
        <Space direction="vertical" size={18} style={{ width: '100%' }}>
          <Space size={12} wrap>
            <ExecutionStatusTag status={detail.status} />
            <Tag color="blue">{agentName || detail.agent_id || 'Unknown agent'}</Tag>
            <Tag>{detail.priority || 'P2'}</Tag>
            <Text style={secondaryTextStyle}>{t('detail.createdAt', { time: dayjs(detail.created_at).fromNow() })}</Text>
          </Space>
          <Row gutter={[16, 16]}>
            {topStats.map((stat) => (
              <Col key={stat.key} xs={12} md={6}>
                <div
                  style={{
                    padding: 18,
                    borderRadius: 16,
                    background: tokens.bg.elevated,
                    border: `1px solid ${tokens.border.default}`,
                  }}
                >
                  <Statistic
                    title={stat.title}
                    value={stat.value}
                    valueStyle={{ color: stat.color, fontSize: 26, fontWeight: 700 }}
                  />
                </div>
              </Col>
            ))}
          </Row>
        </Space>
      </div>

      <Row gutter={[20, 20]}>
        <Col xs={24} lg={16}>
          <Tabs items={tabs} />
        </Col>
        <Col xs={24} lg={8}>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <div style={{ ...cardStyle, padding: 20 }}>
              <Text style={{ ...primaryTextStyle, fontWeight: 600 }}>{t('detail.timeline')}</Text>
              <Divider style={{ margin: '12px 0' }} />
              <Space direction="vertical" size={8} style={{ width: '100%' }}>
                <div>
                  <Text style={secondaryTextStyle}>{t('detail.start')}</Text>
                  <div><Text>{dayjs(detail.started_at).format('YYYY-MM-DD HH:mm:ss')}</Text></div>
                </div>
                <div>
                  <Text style={secondaryTextStyle}>{t('detail.ended')}</Text>
                  <div><Text>{detail.completed_at ? dayjs(detail.completed_at).format('YYYY-MM-DD HH:mm:ss') : t('detail.notEnded')}</Text></div>
                </div>
                <div>
                  <Text style={secondaryTextStyle}>{t('detail.lastUpdate')}</Text>
                  <div><Text>{dayjs(detail.updated_at).fromNow()}</Text></div>
                </div>
              </Space>
            </div>

            <div style={{ ...cardStyle, padding: 20 }}>
              <Text style={{ ...primaryTextStyle, fontWeight: 600 }}>{t('detail.costBreakdown')}</Text>
              <Divider style={{ margin: '12px 0' }} />
              {cost ? (
                <Descriptions size="small" column={1} bordered>
                  <Descriptions.Item label="Provider">{cost.provider}</Descriptions.Item>
                  <Descriptions.Item label="Model">{cost.model_name}</Descriptions.Item>
                  <Descriptions.Item label={t('detail.inputCost')}>{`${cost.currency} ${cost.input_cost.toFixed(4)}`}</Descriptions.Item>
                  <Descriptions.Item label={t('detail.outputCost')}>{`${cost.currency} ${cost.output_cost.toFixed(4)}`}</Descriptions.Item>
                  <Descriptions.Item label={t('detail.totalCost')}>{`${cost.currency} ${cost.total_cost.toFixed(4)}`}</Descriptions.Item>
                </Descriptions>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('detail.noCostData')} />
              )}
            </div>
          </Space>
        </Col>
      </Row>

      <ExecutionExportModal
        open={exportModalOpen}
        mode="single"
        subjectLabel={t('detail.exportSubject', { id: detail.id })}
        loading={exporting}
        onCancel={() => {
          if (!exporting) {
            setExportModalOpen(false);
          }
        }}
        onSubmit={handleExport}
      />

      <ShareModal
        open={shareModalOpen}
        executionId={detail.id}
        executionName={detail.benchmark_id}
        onCancel={() => setShareModalOpen(false)}
        onSuccess={() => setShareModalOpen(false)}
      />
    </div>
  );
}
