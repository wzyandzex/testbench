import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import {
  Alert,
  Avatar,
  Button,
  Col,
  DatePicker,
  Dropdown,
  Empty,
  Input,
  Modal,
  message,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { MenuProps, TableColumnsType } from 'antd';
import {
  DownloadOutlined,
  EyeOutlined,
  MoreOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SearchOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { PageHeader } from '@/components/common';
import { ExecutionExportModal, type ExecutionExportDraft } from '@/components/execution/ExecutionExportModal';
import { ExecutionStatusTag } from '@/components/execution';
import { useWSStore } from '@/stores/wsStore';
import { agentService } from '@/services/agent';
import { benchmarkService } from '@/services/benchmark';
import executionService, {
  canCancelExecution,
  getExecutionDurationMs,
  getExecutionProgress,
} from '@/services/execution';
import { useCardStyle, useTableRowHoverStyle, useTextStyle, useThemeTokens } from '@/theme';
import type { Agent } from '@/types/api/agent';
import type { Benchmark } from '@/types/api/benchmark';
import type { ExecutionFilter, ExecutionPriority, ExecutionRecord, ExecutionSummaryStats } from '@/types/api/execution';
import { PRIORITY_CONFIG } from '@/types/api/execution';

dayjs.extend(relativeTime);

const { RangePicker } = DatePicker;
const { Text } = Typography;

type ExecutionRow = ExecutionRecord & {
  benchmarkName: string;
  agentName: string;
};

type ExecutionExportTarget =
  | {
      mode: 'single';
      record: ExecutionRow;
    }
  | {
      mode: 'batch';
      ids: string[];
      count: number;
    };

function unwrapMaybeAxios<T>(value: T | { data: T; status: number }): T {
  if (
    value &&
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

function priorityTag(priority: ExecutionPriority) {
  const config = PRIORITY_CONFIG[priority as keyof typeof PRIORITY_CONFIG];
  if (!config) {
    return <Tag>{priority}</Tag>;
  }
  return <Tag color={config.color}>{config.label}</Tag>;
}

function buildSummaryFilter(filters: ExecutionFilter): ExecutionFilter {
  return {
    benchmark_id: filters.benchmark_id,
    agent_id: filters.agent_id,
    status: filters.status,
    priority: filters.priority,
    success: filters.success,
    started_after: filters.started_after,
    started_before: filters.started_before,
    completed_after: filters.completed_after,
    completed_before: filters.completed_before,
    sandbox_id: filters.sandbox_id,
    user_id: filters.user_id,
  };
}

export default function ExecutionListPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('executions');
  const tokens = useThemeTokens();
  const cardStyle = useCardStyle();
  const tableRowHoverStyle = useTableRowHoverStyle();
  const primaryTextStyle = useTextStyle('primary');
  const secondaryTextStyle = useTextStyle('secondary');

  const [records, setRecords] = useState<ExecutionRecord[]>([]);
  const [summary, setSummary] = useState<ExecutionSummaryStats | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [benchmarks, setBenchmarks] = useState<Benchmark[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeRowActionId, setActiveRowActionId] = useState<string | null>(null);
  const [exportTarget, setExportTarget] = useState<ExecutionExportTarget | null>(null);
  const [exportSubmitting, setExportSubmitting] = useState(false);
  const [filters, setFilters] = useState<ExecutionFilter>({
    page: 1,
    page_size: 20,
    order_by: 'started_at',
    order_dir: 'desc',
  });

  const deferredKeyword = useDeferredValue(searchKeyword.trim().toLowerCase());

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      setOptionsLoading(true);
      try {
        const [agentPage, benchmarkPage] = await Promise.all([
          agentService.list({ page: 1, page_size: 200, order_by: 'updated_at', order_dir: 'desc' }),
          benchmarkService.list({ page: 1, page_size: 200, order_by: 'updated_at', order_dir: 'desc' }),
        ]);

        if (cancelled) {
          return;
        }

        const normalizedAgentPage = unwrapMaybeAxios(agentPage);
        const normalizedBenchmarkPage = unwrapMaybeAxios(benchmarkPage);
        setAgents(normalizedAgentPage.data ?? []);
        setBenchmarks(normalizedBenchmarkPage.data ?? []);
      } catch {
        if (!cancelled) {
          setAgents([]);
          setBenchmarks([]);
        }
      } finally {
        if (!cancelled) {
          setOptionsLoading(false);
        }
      }
    }

    void loadOptions();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadPage() {
      setLoading(true);
      setError(null);
      try {
        const [page, nextSummary] = await Promise.all([
          executionService.list(filters),
          executionService.getSummary(buildSummaryFilter(filters)),
        ]);

        if (cancelled) {
          return;
        }

        setRecords(page.data ?? []);
        setSummary(nextSummary);
      } catch (loadError) {
        if (!cancelled) {
          const messageText = loadError instanceof Error ? loadError.message : t('list.loadFailed');
          setError(messageText);
          setRecords([]);
          setSummary(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadPage();
    return () => {
      cancelled = true;
    };
  }, [filters]);

  // Auto-refresh list when execution completes/fails via WS
  const wsConnectionState = useWSStore((state) => state.connectionState);
  const wsSubscribe = useWSStore((state) => state.subscribe);
  const wsConnected = wsConnectionState === 'connected';

  const silentRefresh = useCallback(async () => {
    try {
      const [page, nextSummary] = await Promise.all([
        executionService.list(filters),
        executionService.getSummary(buildSummaryFilter(filters)),
      ]);
      setRecords(page.data ?? []);
      setSummary(nextSummary);
    } catch { /* silent */ }
  }, [filters]);

  useEffect(() => {
    if (!wsConnected) return;

    const unsubscribe = wsSubscribe?.(
      {
        local_key: '__global__',
        event_types: ['task.completed', 'task.failed'],
      },
      (msg) => {
        if (msg.event === 'execution_completed' || msg.event === 'execution_failed') {
          silentRefresh();
        }
      }
    );

    return unsubscribe;
  }, [wsConnected, wsSubscribe, silentRefresh]);

  const agentNameMap = useMemo(() => {
    return new Map(
      agents.map((agent) => [agent.id, agent.display_name || agent.name || agent.id])
    );
  }, [agents]);

  const benchmarkNameMap = useMemo(() => {
    return new Map(
      benchmarks.map((benchmark) => [benchmark.id, benchmark.display_name || benchmark.name || benchmark.id])
    );
  }, [benchmarks]);

  const rows = useMemo<ExecutionRow[]>(() => {
    return records.map((record) => ({
      ...record,
      agentName: agentNameMap.get(record.agent_id) || record.agent_id || 'Unknown agent',
      benchmarkName: benchmarkNameMap.get(record.benchmark_id) || record.benchmark_id || 'Unbound benchmark',
    }));
  }, [agentNameMap, benchmarkNameMap, records]);

  const visibleRows = useMemo(() => {
    if (!deferredKeyword) {
      return rows;
    }

    return rows.filter((row) => {
      const candidates = [
        row.id,
        row.benchmarkName,
        row.benchmark_id,
        row.agentName,
        row.agent_id,
        row.contract?.execution_contract_mode,
        row.contract?.tool_profile,
      ];

      return candidates.some((candidate) =>
        typeof candidate === 'string' && candidate.toLowerCase().includes(deferredKeyword)
      );
    });
  }, [deferredKeyword, rows]);

  const selectedIds = useMemo(
    () => selectedRowKeys.map((item) => String(item)),
    [selectedRowKeys]
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      const [page, nextSummary] = await Promise.all([
        executionService.list(filters),
        executionService.getSummary(buildSummaryFilter(filters)),
      ]);
      setRecords(page.data ?? []);
      setSummary(nextSummary);
      message.success(t('detail.refreshSuccess'));
    } catch {
      message.error(t('detail.refreshFailed'));
    } finally {
      setRefreshing(false);
    }
  };

  const updateFilters = (patch: Partial<ExecutionFilter>) => {
    startTransition(() => {
      setFilters((current) => ({
        ...current,
        ...patch,
        page: patch.page ?? 1,
      }));
    });
  };

  const handleCancelExecution = async (executionId: string) => {
    Modal.confirm({
      title: t('actions.cancelConfirm'),
      content: t('actions.cancelContentAlt'),
      okText: t('actions.confirmCancel'),
      cancelText: t('actions.keepWatching'),
      okButtonProps: { danger: true },
      onOk: async () => {
        setActiveRowActionId(executionId);
        try {
          await executionService.cancel(executionId);
          message.success(t('actions.cancelSuccess'));
          await handleRefresh();
        } catch {
          message.error(t('actions.cancelFailed'));
        } finally {
          setActiveRowActionId(null);
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

  const showBatchExportSummary = (result: Awaited<ReturnType<typeof executionService.requestBatchExport>>) => {
    const successItems =
      result.results && result.results.length > 0
        ? result.results
        : result.result?.file_url
          ? [{ execution_id: '', ...result.result }]
          : [];
    const failureItems = result.failures ?? [];
    const opened = openExportFile(successItems[0]?.file_url);

    const title =
      failureItems.length === 0
        ? t('export.batchComplete')
        : successItems.length > 0
          ? t('export.batchPartial')
          : t('export.batchFailed');
    const showResult =
      failureItems.length === 0
        ? Modal.success
        : successItems.length > 0
          ? Modal.warning
          : Modal.error;

    showResult({
      title,
      width: 680,
      okText: t('export.gotIt'),
      content: (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Text>
            {t('export.completed', { completed: result.completed ?? successItems.length, total: result.total ?? successItems.length })}
          </Text>
          {opened ? (
            <Text style={secondaryTextStyle}>{t('export.autoOpened')}</Text>
          ) : null}
          {successItems.length > 0 ? (
            <Space wrap>
              {successItems.slice(0, 5).map((item, index) => (
                <Button
                  key={`${item.execution_id || 'result'}-${index}`}
                  size="small"
                  onClick={() => openExportFile(item.file_url)}
                >
                  {item.execution_id ? t('export.openResult', { id: item.execution_id }) : item.file_name || t('export.openResultDefault')}
                </Button>
              ))}
            </Space>
          ) : null}
          {successItems.length > 5 ? (
            <Text style={secondaryTextStyle}>{t('export.moreResults', { count: successItems.length - 5 })}</Text>
          ) : null}
          {failureItems.length > 0 ? (
            <Alert
              type="warning"
              showIcon
              message={t('export.failureCount', { count: failureItems.length })}
              description={failureItems.slice(0, 3).map((item) => `${item.execution_id}: ${item.error}`).join('\n')}
            />
          ) : null}
          {failureItems.length > 3 ? (
            <Text style={secondaryTextStyle}>{t('export.failureOmitted')}</Text>
          ) : null}
          {result.job_id && successItems.length === 0 ? (
            <Text style={secondaryTextStyle}>{t('export.jobId', { id: result.job_id })}</Text>
          ) : null}
        </Space>
      ),
    });
  };

  const handleSingleExport = async (record: ExecutionRow, draft: ExecutionExportDraft) => {
    setExportSubmitting(true);
    setActiveRowActionId(record.id);
    try {
      const result = await executionService.requestExport(record.id, {
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

      setExportTarget(null);
    } catch {
      message.error(t('actions.exportFailed'));
    } finally {
      setExportSubmitting(false);
      setActiveRowActionId(null);
    }
  };

  const handleBatchExport = async (draft: ExecutionExportDraft) => {
    if (!exportTarget || exportTarget.mode !== 'batch' || exportTarget.ids.length === 0) {
      return;
    }

    setExportSubmitting(true);
    try {
      const result = await executionService.requestBatchExport(exportTarget.ids, {
        format: draft.format,
        template: draft.template,
        templateId: draft.templateId,
        includeCharts: draft.includeCharts,
      });
      setExportTarget(null);
      showBatchExportSummary(result);
    } catch {
      message.error(t('export.batchFailed'));
    } finally {
      setExportSubmitting(false);
    }
  };

  const columns = useMemo<TableColumnsType<ExecutionRow>>(
    () => [
      {
        title: t('title'),
        key: 'execution',
        width: 280,
        render: (_, record) => (
          <Space direction="vertical" size={2}>
            <Button
              type="link"
              style={{ padding: 0, height: 'auto', ...primaryTextStyle, fontWeight: 600 }}
              onClick={() => navigate(`/executions/${record.id}`)}
            >
              {record.id}
            </Button>
            <Space size={[6, 6]} wrap>
              {priorityTag(record.priority)}
              {record.contract?.execution_contract_mode ? (
                <Tag color="blue">{record.contract.execution_contract_mode}</Tag>
              ) : null}
            </Space>
          </Space>
        ),
      },
      {
        title: t('detail.benchmark'),
        key: 'benchmark',
        width: 260,
        render: (_, record) => (
          <Space align="start">
            <Avatar
              size={30}
              style={{ background: tokens.bg.tertiary, color: tokens.text.secondary }}
            >
              B
            </Avatar>
            <Space direction="vertical" size={0}>
              <Text style={{ ...primaryTextStyle, fontWeight: 500 }}>{record.benchmarkName}</Text>
              <Text style={{ ...secondaryTextStyle, fontSize: 12 }}>{record.benchmark_id || t('detail.unbound')}</Text>
            </Space>
          </Space>
        ),
      },
      {
        title: 'Agent',
        key: 'agent',
        width: 220,
        render: (_, record) => (
          <Space align="start">
            <Avatar
              size={30}
              style={{ background: `${tokens.status.info}18`, color: tokens.status.info }}
            >
              {record.agentName.slice(0, 1).toUpperCase()}
            </Avatar>
            <Space direction="vertical" size={0}>
              <Text style={{ ...primaryTextStyle, fontWeight: 500 }}>{record.agentName}</Text>
              <Text style={{ ...secondaryTextStyle, fontSize: 12 }}>{record.agent_id}</Text>
            </Space>
          </Space>
        ),
      },
      {
        title: t('list.statusFilter'),
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (status: ExecutionRecord['status']) => <ExecutionStatusTag status={status} />,
      },
      {
        title: t('detail.steps'),
        key: 'progress',
        width: 180,
        render: (_, record) => {
          const progress = getExecutionProgress(record);
          if (!progress) {
            return (
              <Text style={secondaryTextStyle}>
                {record.total_steps > 0 ? `${record.steps_taken}/${record.total_steps}` : '-'}
              </Text>
            );
          }

          return (
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Progress percent={progress.percentage} showInfo={false} size="small" />
              <Text style={{ ...secondaryTextStyle, fontSize: 12 }}>
                {progress.current_step}/{progress.total_steps}
              </Text>
            </Space>
          );
        },
      },
      {
        title: t('detail.duration'),
        key: 'duration',
        width: 120,
        render: (_, record) => (
          <Text style={secondaryTextStyle}>{formatDuration(getExecutionDurationMs(record))}</Text>
        ),
      },
      {
        title: 'Token',
        dataIndex: 'total_tokens',
        key: 'total_tokens',
        width: 120,
        render: (value: number) => <Text style={secondaryTextStyle}>{value || 0}</Text>,
      },
      {
        title: t('detail.startTime'),
        dataIndex: 'started_at',
        key: 'started_at',
        width: 180,
        render: (value: string) => (
          <Space direction="vertical" size={0}>
            <Text style={secondaryTextStyle}>{dayjs(value).format('YYYY-MM-DD HH:mm:ss')}</Text>
            <Text style={{ ...secondaryTextStyle, fontSize: 12 }}>{dayjs(value).fromNow()}</Text>
          </Space>
        ),
      },
      {
        title: t('columnActions'),
        key: 'actions',
        width: 80,
        fixed: 'right',
        render: (_, record) => {
          const items: MenuProps['items'] = [
            {
              key: 'detail',
              icon: <EyeOutlined />,
              label: t('actions.viewDetail'),
            },
            {
              key: 'export',
              icon: <DownloadOutlined />,
              label: t('actions.exportReport'),
            },
          ];

          if (canCancelExecution(record)) {
            items.push({
              key: 'cancel',
              icon: <StopOutlined />,
              label: t('actions.cancel'),
              danger: true,
            });
          }

          return (
            <Dropdown
              trigger={['click']}
              menu={{
                items,
                onClick: ({ key }) => {
                  if (key === 'detail') {
                    navigate(`/executions/${record.id}`);
                    return;
                  }

                  if (key === 'cancel') {
                    void handleCancelExecution(record.id);
                    return;
                  }

                  if (key === 'export') {
                    setExportTarget({ mode: 'single', record });
                  }
                },
              }}
            >
              <Button
                type="text"
                icon={<MoreOutlined />}
                loading={activeRowActionId === record.id}
              />
            </Dropdown>
          );
        },
      },
    ],
    [activeRowActionId, navigate, primaryTextStyle, secondaryTextStyle, tokens, t]
  );

  const summaryCards = useMemo(
    () => [
      {
        key: 'total',
        title: t('stats.total'),
        value: summary?.total ?? 0,
        color: tokens.text.primary,
      },
      {
        key: 'running',
        title: t('status.running'),
        value: summary?.running ?? 0,
        color: tokens.status.info,
      },
      {
        key: 'success',
        title: t('stats.successRate'),
        value: `${(((summary?.success_rate ?? 0) * 100) || 0).toFixed(1)}%`,
        color: tokens.status.success,
      },
      {
        key: 'duration',
        title: t('stats.avgDuration'),
        value: formatDuration(summary?.avg_duration ?? 0),
        color: tokens.status.warning,
      },
    ],
    [summary, tokens, t]
  );

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1680, margin: '0 auto' }}>
      <PageHeader
        title={t('title')}
        description={t('list.description')}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void handleRefresh()} loading={refreshing}>
              {t('list.refresh')}
            </Button>
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => navigate('/benchmarks')}>
              {t('list.startFromBenchmark')}
            </Button>
          </Space>
        }
      />

      <div
        style={{
          ...cardStyle,
          marginBottom: 20,
          padding: 24,
          background: `linear-gradient(135deg, ${tokens.bg.primary}, ${tokens.bg.secondary})`,
        }}
      >
        <Row gutter={[16, 16]}>
          {summaryCards.map((card) => (
            <Col key={card.key} xs={12} md={6}>
              <div
                style={{
                  padding: 18,
                  borderRadius: 16,
                  background: tokens.bg.elevated,
                  border: `1px solid ${tokens.border.default}`,
                }}
              >
                <Statistic
                  title={card.title}
                  value={card.value}
                  valueStyle={{ color: card.color, fontSize: 28, fontWeight: 700 }}
                />
              </div>
            </Col>
          ))}
        </Row>
      </div>

      <div style={{ ...cardStyle, marginBottom: 16, padding: 20 }}>
        <Row gutter={[12, 12]}>
          <Col xs={24} md={8}>
            <Input
              allowClear
              value={searchKeyword}
              prefix={<SearchOutlined />}
              placeholder={t('list.searchPlaceholder')}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              allowClear
              mode="multiple"
              placeholder={t('list.statusFilter')}
              value={filters.status}
              options={[
                { label: t('status.pending'), value: 'pending' },
                { label: t('status.running'), value: 'running' },
                { label: t('status.completed'), value: 'completed' },
                { label: t('status.failed'), value: 'failed' },
                { label: t('status.cancelled'), value: 'cancelled' },
                { label: t('status.timeout'), value: 'timeout' },
              ]}
              onChange={(value) => updateFilters({ status: value })}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder={t('list.benchmarkFilter')}
              value={filters.benchmark_id}
              loading={optionsLoading}
              options={benchmarks.map((benchmark) => ({
                value: benchmark.id,
                label: benchmark.display_name || benchmark.name || benchmark.id,
              }))}
              onChange={(value) => updateFilters({ benchmark_id: value })}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Agent"
              value={filters.agent_id}
              loading={optionsLoading}
              options={agents.map((agent) => ({
                value: agent.id,
                label: agent.display_name || agent.name || agent.id,
              }))}
              onChange={(value) => updateFilters({ agent_id: value })}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              allowClear
              mode="multiple"
              placeholder={t('list.priorityFilter')}
              value={filters.priority}
              options={Object.entries(PRIORITY_CONFIG).map(([value, config]) => ({
                value,
                label: config.label,
              }))}
              onChange={(value) => updateFilters({ priority: value })}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={24} md={8}>
            <RangePicker
              style={{ width: '100%' }}
              showTime
              value={
                filters.started_after || filters.started_before
                  ? [
                      filters.started_after ? dayjs(filters.started_after) : null,
                      filters.started_before ? dayjs(filters.started_before) : null,
                    ]
                  : null
              }
              onChange={(values: null | [Dayjs | null, Dayjs | null]) =>
                updateFilters({
                  started_after: values?.[0]?.toISOString(),
                  started_before: values?.[1]?.toISOString(),
                })
              }
            />
          </Col>
          <Col xs={12} md={4}>
            <Select
              value={`${filters.order_by ?? 'started_at'}:${filters.order_dir ?? 'desc'}`}
              options={[
                { label: t('sort.startDesc'), value: 'started_at:desc' },
                { label: t('sort.startAsc'), value: 'started_at:asc' },
                { label: t('sort.durationDesc'), value: 'duration:desc' },
                { label: t('sort.durationAsc'), value: 'duration:asc' },
                { label: t('sort.updateDesc'), value: 'updated_at:desc' },
              ]}
              onChange={(value) => {
                const [orderBy, orderDir] = value.split(':') as [ExecutionFilter['order_by'], ExecutionFilter['order_dir']];
                updateFilters({ order_by: orderBy, order_dir: orderDir });
              }}
              style={{ width: '100%' }}
            />
          </Col>
          <Col xs={12} md={4}>
            <Button
              block
              onClick={() => {
                setSearchKeyword('');
                setSelectedRowKeys([]);
                setFilters({
                  page: 1,
                  page_size: 20,
                  order_by: 'started_at',
                  order_dir: 'desc',
                });
              }}
            >
              {t('list.resetFilter')}
            </Button>
          </Col>
        </Row>
      </div>

      {error ? (
        <Alert
          style={{ marginBottom: 16 }}
          type="error"
          showIcon
          message={t('list.loadFailed')}
          description={error}
        />
      ) : null}

      <div style={{ ...cardStyle, padding: 20 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 16,
            marginBottom: 16,
            flexWrap: 'wrap',
          }}
        >
          <Space size={12} wrap>
            <Text style={secondaryTextStyle}>
              {t('list.pageInfo', { count: visibleRows.length, total: summary?.total ?? 0 })}
            </Text>
            {selectedIds.length > 0 ? (
              <Text style={{ ...secondaryTextStyle, color: tokens.status.info }}>
                {t('list.selectedCount', { count: selectedIds.length })}
              </Text>
            ) : null}
          </Space>
          <Space wrap>
            <Button
              icon={<DownloadOutlined />}
              loading={exportSubmitting && exportTarget?.mode === 'batch'}
              disabled={selectedIds.length === 0}
              onClick={() => setExportTarget({ mode: 'batch', ids: selectedIds, count: selectedIds.length })}
            >
              {t('list.exportSelected')}
            </Button>
            <Button
              icon={<ReloadOutlined />}
              onClick={() => void handleRefresh()}
              loading={refreshing}
            >
              {t('list.refreshData')}
            </Button>
          </Space>
        </div>

        <Table<ExecutionRow>
          rowKey="id"
          loading={loading}
          dataSource={visibleRows}
          columns={columns}
          locale={{
            emptyText: (
              <Empty
                description={deferredKeyword ? t('list.noMatch') : t('list.empty')}
              />
            ),
          }}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys) => setSelectedRowKeys(keys.map((item) => String(item))),
            preserveSelectedRowKeys: true,
          }}
          pagination={{
            current: filters.page,
            pageSize: filters.page_size,
            total: summary?.total ?? 0,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => t('list.totalCount', { total }),
            onChange: (page, pageSize) => {
              startTransition(() => {
                setFilters((current) => ({
                  ...current,
                  page,
                  page_size: pageSize,
                }));
              });
            },
          }}
          scroll={{ x: 1500 }}
          onRow={(record) => ({
            onDoubleClick: () => navigate(`/executions/${record.id}`),
            style: {
              cursor: 'default',
              transition: 'all 0.2s ease',
            },
            onMouseEnter: (event) => {
              Object.assign(event.currentTarget.style, tableRowHoverStyle);
            },
            onMouseLeave: (event) => {
              event.currentTarget.style.background = 'transparent';
            },
          })}
        />
      </div>

      <ExecutionExportModal
        open={exportTarget !== null}
        mode={exportTarget?.mode ?? 'single'}
        targetCount={exportTarget?.mode === 'batch' ? exportTarget.count : 1}
        subjectLabel={
          exportTarget?.mode === 'batch'
            ? t('list.selectedExecs', { count: exportTarget.count })
            : exportTarget?.record
              ? t('detail.exportSubject', { id: exportTarget.record.id })
              : t('actions.exportReport')
        }
        loading={exportSubmitting}
        onCancel={() => {
          if (!exportSubmitting) {
            setExportTarget(null);
          }
        }}
        onSubmit={(draft) => {
          if (!exportTarget) {
            return;
          }
          if (exportTarget.mode === 'batch') {
            return handleBatchExport(draft);
          }
          return handleSingleExport(exportTarget.record, draft);
        }}
      />
    </div>
  );
}
