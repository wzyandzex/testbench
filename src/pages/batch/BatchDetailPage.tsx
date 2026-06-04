import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  ReloadOutlined,
  StopOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Popconfirm,
  Progress,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/common/PageHeader';
import { useBatchProgress } from '@/hooks/useWebSocket';
import { batchPageService } from './service';
import { batchService } from '@/services/batch';
import { useIsDark, useThemeTokens } from '@/theme';
import type {
  BatchAgentReference,
  BatchBenchmarkReference,
  BatchExecution,
  BatchReport,
  BatchTaskProgress,
  BatchTaskStatus,
} from '@/types/api/batch';
import { BATCH_STATUS_CONFIG, BATCH_TASK_STATUS_CONFIG, EXECUTION_MODE_CONFIG } from '@/types/api/batch';

function formatDateTime(value?: string | null): string {
  if (!value) {
    return '-';
  }
  return dayjs(value).format('YYYY-MM-DD HH:mm:ss');
}

function formatDuration(milliseconds?: number): string {
  if (!milliseconds) {
    return '-';
  }
  if (milliseconds < 1000) {
    return `${milliseconds} ms`;
  }
  if (milliseconds < 60_000) {
    return `${(milliseconds / 1000).toFixed(1)} s`;
  }
  return `${(milliseconds / 60_000).toFixed(1)} min`;
}

function getProcessedPercent(batch: BatchExecution | null): number {
  if (!batch?.total_tasks) {
    return 0;
  }
  return Math.round(((batch.completed_tasks + batch.failed_tasks) / batch.total_tasks) * 100);
}

function getSuccessPercent(batch: BatchExecution | null): number {
  if (!batch) {
    return 0;
  }
  const processed = batch.completed_tasks + batch.failed_tasks;
  if (!processed) {
    return 0;
  }
  return Math.round((batch.completed_tasks / processed) * 100);
}

function buildAgentMap(items: BatchAgentReference[]): Record<string, string> {
  return Object.fromEntries(items.map((item) => [item.id, item.display_name?.trim() || item.name || item.id]));
}

function buildBenchmarkMap(items: BatchBenchmarkReference[]): Record<string, string> {
  return Object.fromEntries(items.map((item) => [item.id, item.display_name?.trim() || item.name || item.id]));
}

export default function BatchDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('batch');
  const tokens = useThemeTokens();
  const isDark = useIsDark();
  const [batch, setBatch] = useState<BatchExecution | null>(null);
  const [tasks, setTasks] = useState<BatchTaskProgress[]>([]);
  const [tasksTotal, setTasksTotal] = useState(0);
  const [report, setReport] = useState<BatchReport | null>(null);
  const [agentMap, setAgentMap] = useState<Record<string, string>>({});
  const [benchmarkMap, setBenchmarkMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<BatchTaskStatus | 'all'>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [benchmarkFilter, setBenchmarkFilter] = useState<string>('all');
  const [taskPage, setTaskPage] = useState(1);
  const [taskPageSize, setTaskPageSize] = useState(10);
  const [livePercent, setLivePercent] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const cardStyle = useMemo(
    () => ({
      background: isDark
        ? 'linear-gradient(145deg, rgba(15,23,42,0.96), rgba(30,41,59,0.82))'
        : 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(248,250,252,0.98))',
      border: `1px solid ${tokens.border.default}`,
      borderRadius: 24,
      boxShadow: isDark ? '0 18px 48px rgba(0,0,0,0.28)' : '0 18px 42px rgba(15,23,42,0.08)',
    }),
    [isDark, tokens]
  );

  const loadBatch = useCallback(async () => {
    if (!id) {
      return;
    }
    const [detail, nextReport] = await Promise.all([
      batchService.get(id),
      batchService.getReportSafe(id),
    ]);
    setBatch(detail);
    setReport(nextReport);
  }, [id]);

  const loadReferences = useCallback(async () => {
    const [agents, benchmarks] = await Promise.all([
      batchPageService.listAgentReferences(),
      batchPageService.listBenchmarkReferences(),
    ]);
    setAgentMap(buildAgentMap(agents));
    setBenchmarkMap(buildBenchmarkMap(benchmarks));
  }, []);

  const loadTasks = useCallback(async () => {
    if (!id) {
      return;
    }
    setTasksLoading(true);
    try {
      const response = await batchPageService.getTasks(id, {
        page: taskPage,
        page_size: taskPageSize,
        order_by: 'created_at',
        order_dir: 'desc',
        ...(statusFilter !== 'all' ? { status: [statusFilter] } : {}),
        ...(agentFilter !== 'all' ? { agent_id: agentFilter } : {}),
        ...(benchmarkFilter !== 'all' ? { benchmark_id: benchmarkFilter } : {}),
      });
      setTasks(response.data);
      setTasksTotal(response.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('detail.loadSubtasksFailed'));
    } finally {
      setTasksLoading(false);
    }
  }, [agentFilter, benchmarkFilter, id, statusFilter, taskPage, taskPageSize]);

  const loadAll = useCallback(async () => {
    if (!id) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await Promise.all([loadBatch(), loadReferences(), loadTasks()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('detail.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, [id, loadBatch, loadReferences, loadTasks]);

  useEffect(() => {
    if (!id) {
      return;
    }

    setLoading(true);
    setError(null);
    Promise.all([loadBatch(), loadReferences()])
      .catch((err) => {
        setError(err instanceof Error ? err.message : t('detail.loadFailed'));
      })
      .finally(() => setLoading(false));
  }, [id, loadBatch, loadReferences]);

  useEffect(() => {
    loadTasks().catch(() => undefined);
  }, [loadTasks]);

  const { connected: wsConnected } = useBatchProgress(
    id || '',
    {
      onProgress: (_completed, _total, percentage) => {
        setLivePercent(Math.round(percentage));
      },
      onCompleted: () => {
        setLivePercent(null);
        loadAll().catch(() => undefined);
        message.success(t('create.completed'));
      },
      onFailed: (msg) => {
        setLivePercent(null);
        loadAll().catch(() => undefined);
        if (msg) {
          message.error(msg);
        }
      },
    },
    batch?.status === 'running'
  );

  // Fallback polling when WS disconnected and batch is running
  useEffect(() => {
    if (batch?.status !== 'running') return;
    if (wsConnected) return;

    const timer = window.setInterval(() => {
      loadAll().catch(() => undefined);
    }, 30000);

    return () => { window.clearInterval(timer); };
  }, [batch?.status, wsConnected, loadAll]);

  const handleCancel = useCallback(async () => {
    if (!id) {
      return;
    }
    setActionLoading(true);
    try {
      await batchPageService.cancel(id);
      message.success(t('create.cancelled'));
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : t('create.cancelFailed'));
    } finally {
      setActionLoading(false);
    }
  }, [id, loadAll]);

  const processedPercent = livePercent ?? getProcessedPercent(batch);
  const successPercent = getSuccessPercent(batch);
  const statusConfig = batch ? BATCH_STATUS_CONFIG[batch.status] : null;

  const taskStatusOptions = useMemo(
    () => [
      { label: t('list.allStatus'), value: 'all' },
      ...Object.entries(BATCH_TASK_STATUS_CONFIG).map(([value, config]) => ({
        label: config.label,
        value,
      })),
    ],
    []
  );

  const taskColumns = useMemo(
    () => [
      {
        title: 'Agent',
        dataIndex: 'agent_id',
        key: 'agent_id',
        render: (value: string) => (
          <div>
            <Typography.Text strong>{agentMap[value] || value}</Typography.Text>
            <div style={{ marginTop: 4 }}>
              <Typography.Text type="secondary">{value}</Typography.Text>
            </div>
          </div>
        ),
      },
      {
        title: t('table.benchmark'),
        dataIndex: 'benchmark_id',
        key: 'benchmark_id',
        render: (value: string) => (
          <div>
            <Typography.Text strong>{benchmarkMap[value] || value}</Typography.Text>
            <div style={{ marginTop: 4 }}>
              <Typography.Text type="secondary">{value}</Typography.Text>
            </div>
          </div>
        ),
      },
      {
        title: t('table.status'),
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (value: BatchTaskStatus) => {
          const config = BATCH_TASK_STATUS_CONFIG[value];
          return <Tag color={config.color}>{config.label}</Tag>;
        },
      },
      {
        title: t('table.duration'),
        dataIndex: 'duration',
        key: 'duration',
        width: 120,
        render: (value?: number) => formatDuration(value),
      },
      {
        title: t('table.startTime'),
        dataIndex: 'started_at',
        key: 'started_at',
        width: 180,
        render: (value?: string | null) => formatDateTime(value),
      },
      {
        title: t('table.endTime'),
        dataIndex: 'completed_at',
        key: 'completed_at',
        width: 180,
        render: (value?: string | null) => formatDateTime(value),
      },
      {
        title: t('table.errorMsg'),
        dataIndex: 'error',
        key: 'error',
        ellipsis: true,
        render: (value?: string) => value || '-',
      },
    ],
    [agentMap, benchmarkMap, t]
  );

  const rankingCards = useMemo(() => {
    if (!report) {
      return [];
    }
    return [
      {
        title: t('detail.bestSuccessRate'),
        item: report.rankings.by_success_rate[0],
      },
      {
        title: t('detail.bestSpeed'),
        item: report.rankings.by_speed[0],
      },
      {
        title: t('detail.bestCost'),
        item: report.rankings.by_cost[0],
      },
    ].filter((item) => item.item);
  }, [report]);

  if (loading) {
    return (
      <div style={{ maxWidth: 1360, margin: '0 auto', padding: '24px 24px 40px' }}>
        <Card bordered={false} style={cardStyle}>
          <div style={{ minHeight: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography.Text type="secondary">{t('detail.loading')}</Typography.Text>
          </div>
        </Card>
      </div>
    );
  }

  if (!batch) {
    return (
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 24px 40px' }}>
        <Alert
          type="warning"
          message={t('detail.notFound')}
          action={<Button onClick={() => navigate('/batch')}>{t('detail.backToList')}</Button>}
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '24px 24px 40px' }}>
      <PageHeader
        title={batch.name}
        description={t('detail.description')}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => loadAll()}>
              {t('detail.refresh')}
            </Button>
            {batch.status === 'pending' || batch.status === 'running' ? (
              <Popconfirm
                title={t('detail.cancelConfirm')}
                description={t('detail.cancelConfirmDesc')}
                onConfirm={handleCancel}
                okButtonProps={{ danger: true, loading: actionLoading }}
              >
                <Button danger icon={<StopOutlined />} loading={actionLoading}>
                  {t('detail.cancel')}
                </Button>
              </Popconfirm>
            ) : null}
          </Space>
        }
      />

      {error ? (
        <Alert
          type="error"
          message={error}
          closable
          onClose={() => setError(null)}
          style={{ marginBottom: 20 }}
        />
      ) : null}

      <Card bordered={false} style={{ ...cardStyle, marginBottom: 20 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} xl={14}>
            <Space direction="vertical" size={10}>
              <Space size={10} wrap>
                {statusConfig ? <Tag color={statusConfig.color}>{statusConfig.label}</Tag> : null}
                <Tag color="blue">{EXECUTION_MODE_CONFIG[batch.executionMode || 'sequential'].label}</Tag>
                {batch.options?.generate_report ? <Tag color="purple">{t('autoReport')}</Tag> : <Tag>{t('noReport')}</Tag>}
              </Space>
              <Typography.Text type="secondary">
                {t('createdBy')}: {batch.created_by || '-'}
              </Typography.Text>
              {batch.description ? (
                <Typography.Paragraph style={{ marginBottom: 0 }}>{batch.description}</Typography.Paragraph>
              ) : null}
            </Space>
          </Col>
          <Col xs={24} xl={10}>
            <Progress
              percent={processedPercent}
              status={batch.status === 'failed' ? 'exception' : batch.status === 'completed' ? 'success' : 'active'}
              strokeColor={batch.status === 'failed' ? tokens.status.error : tokens.brand.primary}
            />
            <Typography.Text type="secondary">
              {t('progressNote')}
            </Typography.Text>
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} style={cardStyle}>
            <Statistic title={t('detail.totalTasks')} value={batch.total_tasks} prefix={<ClockCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} style={cardStyle}>
            <Statistic title={t('detail.running')} value={batch.running_tasks} valueStyle={{ color: tokens.status.info }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} style={cardStyle}>
            <Statistic title={t('detail.completed')} value={batch.completed_tasks} valueStyle={{ color: tokens.status.success }} prefix={<CheckCircleOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card bordered={false} style={cardStyle}>
            <Statistic title={t('detail.successRate')} value={successPercent} suffix="%" valueStyle={{ color: tokens.brand.primary }} prefix={<TrophyOutlined />} />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} xl={10}>
          <Card bordered={false} style={cardStyle} title={t('detail.basicInfo')}>
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label={t('detail.createdAt')}>{formatDateTime(batch.created_at)}</Descriptions.Item>
              <Descriptions.Item label={t('detail.startedAt')}>{formatDateTime(batch.started_at)}</Descriptions.Item>
              <Descriptions.Item label={t('detail.completedAt')}>{formatDateTime(batch.completed_at)}</Descriptions.Item>
              <Descriptions.Item label={t('detail.priority')}>{batch.task_config?.priority || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('detail.taskTimeout')}>{formatDuration(batch.task_config?.timeout ? batch.task_config.timeout / 1_000_000 : undefined)}</Descriptions.Item>
              <Descriptions.Item label={t('detail.maxSteps')}>{batch.task_config?.max_steps ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="Temperature">{batch.agent_config?.temperature ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="Max Tokens">{batch.agent_config?.max_tokens ?? '-'}</Descriptions.Item>
              <Descriptions.Item label={t('detail.maxParallel')}>{batch.options?.max_parallel ?? '-'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} xl={14}>
          <Card bordered={false} style={cardStyle} title={t('detail.resourceScope')}>
            <Space direction="vertical" size={14} style={{ width: '100%' }}>
              <div>
                <Typography.Text strong>Agent</Typography.Text>
                <div style={{ marginTop: 8 }}>
                  <Space size={[8, 8]} wrap>
                    {batch.agent_ids.map((agentId) => (
                      <Tag key={agentId}>{agentMap[agentId] || agentId}</Tag>
                    ))}
                  </Space>
                </div>
              </div>
              <div>
                <Typography.Text strong>{t('table.benchmark')}</Typography.Text>
                <div style={{ marginTop: 8 }}>
                  <Space size={[8, 8]} wrap>
                    {batch.benchmark_ids.map((benchmarkId) => (
                      <Tag key={benchmarkId}>{benchmarkMap[benchmarkId] || benchmarkId}</Tag>
                    ))}
                  </Space>
                </div>
              </div>
              <Alert
                type="info"
                showIcon
                message={t('detail.noLogApi')}
                description={t('detail.noLogApiDesc')}
              />
            </Space>
          </Card>
        </Col>
      </Row>

      <Card bordered={false} style={{ ...cardStyle, marginBottom: 20 }} title={t('detail.subtaskList')}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={8}>
              <Select
                style={{ width: '100%' }}
                value={statusFilter}
                options={taskStatusOptions}
                onChange={(value) => {
                  setStatusFilter(value);
                  setTaskPage(1);
                }}
              />
            </Col>
            <Col xs={24} md={8}>
              <Select
                style={{ width: '100%' }}
                value={agentFilter}
                options={[
                  { label: t('detail.allAgents'), value: 'all' },
                  ...batch.agent_ids.map((agentId) => ({ label: agentMap[agentId] || agentId, value: agentId })),
                ]}
                onChange={(value) => {
                  setAgentFilter(value);
                  setTaskPage(1);
                }}
              />
            </Col>
            <Col xs={24} md={8}>
              <Select
                style={{ width: '100%' }}
                value={benchmarkFilter}
                options={[
                  { label: t('detail.allBenchmarks'), value: 'all' },
                  ...batch.benchmark_ids.map((benchmarkId) => ({ label: benchmarkMap[benchmarkId] || benchmarkId, value: benchmarkId })),
                ]}
                onChange={(value) => {
                  setBenchmarkFilter(value);
                  setTaskPage(1);
                }}
              />
            </Col>
          </Row>

          <Table<BatchTaskProgress>
            rowKey="task_id"
            loading={tasksLoading}
            dataSource={tasks}
            columns={taskColumns}
            scroll={{ x: 1100 }}
            pagination={{
              current: taskPage,
              pageSize: taskPageSize,
              total: tasksTotal,
              showSizeChanger: true,
              showTotal: (total) => t('list.total', { count: total }),
              onChange: (page, size) => {
                setTaskPage(page);
                setTaskPageSize(size);
              },
            }}
            locale={{
              emptyText: <Empty description={t('detail.noSubtasks')} />,
            }}
          />
        </Space>
      </Card>

      <Card bordered={false} style={cardStyle} title={t('report.title')}>
        {report ? (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} xl={6}>
                <Statistic title={t('report.generatedAt')} value={formatDateTime(report.created_at)} />
              </Col>
              <Col xs={24} sm={12} xl={6}>
                <Statistic title={t('report.successRate')} value={report.summary.success_rate} suffix="%" />
              </Col>
              <Col xs={24} sm={12} xl={6}>
                <Statistic title={t('report.avgDuration')} value={formatDuration(report.summary.avg_duration)} />
              </Col>
              <Col xs={24} sm={12} xl={6}>
                <Statistic title={t('report.totalCost')} value={report.summary.total_cost} precision={4} suffix={report.cost_summary.currency || 'USD'} />
              </Col>
            </Row>

            {rankingCards.length ? (
              <Row gutter={[16, 16]}>
                {rankingCards.map(({ title, item }) => (
                  <Col xs={24} md={8} key={title}>
                    <Card size="small">
                      <Typography.Text type="secondary">{title}</Typography.Text>
                      <Typography.Title level={5} style={{ marginTop: 10, marginBottom: 6 }}>
                        {item?.agent_name || item?.agent_id}
                      </Typography.Title>
                      <Typography.Text>
                        {item?.value} {item?.unit}
                      </Typography.Text>
                    </Card>
                  </Col>
                ))}
              </Row>
            ) : null}

            <Table
              rowKey="agent_id"
              size="small"
              dataSource={report.agent_comparison}
              pagination={false}
              columns={[
                {
                  title: 'Agent',
                  dataIndex: 'agent_name',
                  key: 'agent_name',
                  render: (value: string, record: BatchReport['agent_comparison'][number]) => value || agentMap[record.agent_id] || record.agent_id,
                },
                { title: t('report.execCount'), dataIndex: 'total_executions', key: 'total_executions', width: 100 },
                { title: t('report.successRate'), dataIndex: 'success_rate', key: 'success_rate', width: 100, render: (value: number) => `${value.toFixed(1)}%` },
                { title: t('report.avgDurationCol'), dataIndex: 'avg_duration', key: 'avg_duration', width: 120, render: (value: number) => formatDuration(value) },
                { title: t('report.totalTokens'), dataIndex: 'total_tokens', key: 'total_tokens', width: 120 },
                { title: t('report.totalCost'), dataIndex: 'total_cost', key: 'total_cost', width: 120, render: (value: number) => value.toFixed(4) },
              ]}
            />

            <Table
              rowKey="benchmark_id"
              size="small"
              dataSource={report.benchmark_comparison}
              pagination={false}
              columns={[
                {
                  title: t('report.benchmark'),
                  dataIndex: 'benchmark_name',
                  key: 'benchmark_name',
                  render: (value: string, record: BatchReport['benchmark_comparison'][number]) => value || benchmarkMap[record.benchmark_id] || record.benchmark_id,
                },
                { title: t('report.execCount'), dataIndex: 'total_executions', key: 'total_executions', width: 100 },
                { title: t('report.successRate'), dataIndex: 'success_rate', key: 'success_rate', width: 100, render: (value: number) => `${value.toFixed(1)}%` },
                { title: t('report.avgDurationCol'), dataIndex: 'avg_duration', key: 'avg_duration', width: 120, render: (value: number) => formatDuration(value) },
              ]}
            />
          </Space>
        ) : (
          <Alert
            type="info"
            showIcon
            message={t('report.unavailable')}
            description={t('report.unavailableDesc')}
          />
        )}
      </Card>
    </div>
  );
}
