import {
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Progress,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/common/PageHeader';
import { batchService } from '@/services/batch';
import { useWSStore } from '@/stores/wsStore';
import { useIsDark, useThemeTokens } from '@/theme';
import type { BatchStatus, BatchSummary } from '@/types/api/batch';
import { BATCH_STATUS_CONFIG } from '@/types/api/batch';

const STATUS_KEYS: Array<{ key: string; value: BatchStatus | 'all' }> = [
  { key: 'statusFilter.all', value: 'all' },
  { key: 'statusFilter.pending', value: 'pending' },
  { key: 'statusFilter.running', value: 'running' },
  { key: 'statusFilter.completed', value: 'completed' },
  { key: 'statusFilter.failed', value: 'failed' },
  { key: 'statusLabel.cancelled', value: 'cancelled' },
];

function getProcessedPercent(batch: BatchSummary): number {
  if (!batch.total_tasks) {
    return 0;
  }
  return Math.round(((batch.completed_tasks + batch.failed_tasks) / batch.total_tasks) * 100);
}

function getProgressStatus(batch: BatchSummary): 'success' | 'exception' | 'active' | 'normal' {
  if (batch.status === 'failed') {
    return 'exception';
  }
  if (batch.status === 'completed') {
    return 'success';
  }
  if (batch.status === 'running') {
    return 'active';
  }
  return 'normal';
}

function formatDateTime(value?: string | null): string {
  if (!value) {
    return '-';
  }
  return dayjs(value).format('YYYY-MM-DD HH:mm');
}

export default function BatchListPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('batch');
  const tokens = useThemeTokens();
  const isDark = useIsDark();
  const [batches, setBatches] = useState<BatchSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<BatchStatus | 'all'>('all');

  const cardStyle = useMemo(
    () => ({
      background: isDark
        ? 'linear-gradient(145deg, rgba(17,24,39,0.96), rgba(30,41,59,0.78))'
        : 'linear-gradient(145deg, rgba(255,255,255,0.98), rgba(248,250,252,0.96))',
      border: `1px solid ${tokens.border.default}`,
      borderRadius: 24,
      boxShadow: isDark ? '0 20px 48px rgba(0,0,0,0.30)' : '0 18px 42px rgba(15,23,42,0.08)',
    }),
    [isDark, tokens]
  );

  const loadBatches = useCallback(async (showSuccess = false) => {
    setLoading(true);
    setError(null);
    try {
      let page = 1;
      let total = 0;
      const rows: BatchSummary[] = [];

      do {
        const response = await batchService.getList({ page, page_size: 100 });
        rows.push(...response.data);
        total = response.total;
        page += 1;
      } while (rows.length < total);

      setBatches(rows);
      if (showSuccess) {
        message.success(t('list.refreshed'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('list.loadFailed'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBatches().catch(() => undefined);
  }, [loadBatches]);

  // Auto-refresh list when batch completes/fails via WS
  const wsConnectionState = useWSStore((state) => state.connectionState);
  const wsSubscribe = useWSStore((state) => state.subscribe);
  const wsConnected = wsConnectionState === 'connected';

  useEffect(() => {
    if (!wsConnected) return;

    const unsubscribe = wsSubscribe?.(
      {
        local_key: '__global__',
        event_types: ['batch.completed', 'batch.failed'],
      },
      (msg) => {
        if (msg.event === 'batch_completed' || msg.event === 'batch_failed') {
          loadBatches().catch(() => undefined);
        }
      }
    );

    return unsubscribe;
  }, [wsConnected, wsSubscribe, loadBatches]);

  const filteredBatches = useMemo(() => {
    const lowered = keyword.trim().toLowerCase();

    return batches.filter((item) => {
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      if (!lowered) {
        return true;
      }
      return [item.name, item.created_by].some((field) => field?.toLowerCase().includes(lowered));
    });
  }, [batches, keyword, statusFilter]);

  const overview = useMemo(() => {
    const count = (status: BatchStatus) => batches.filter((item) => item.status === status).length;
    return [
      { title: t('stats.currentBatch'), value: batches.length, accent: tokens.brand.primary },
      { title: t('stats.running'), value: count('running'), accent: tokens.status.info },
      { title: t('stats.completed'), value: count('completed'), accent: tokens.status.success },
      { title: t('stats.failed'), value: count('failed'), accent: tokens.status.error },
      { title: t('stats.pending'), value: count('pending'), accent: tokens.status.warning },
    ];
  }, [batches, tokens, t]);

  const STATUS_OPTIONS = useMemo(() => STATUS_KEYS.map((item) => ({ label: t(item.key), value: item.value })), [t]);

  const columns = useMemo(
    () => [
      {
        title: t('table.batchName'),
        dataIndex: 'name',
        key: 'name',
        render: (_: unknown, record: BatchSummary) => (
          <div>
            <Typography.Text strong style={{ fontSize: 15, color: tokens.text.primary }}>
              {record.name}
            </Typography.Text>
            <div style={{ marginTop: 6 }}>
              <Typography.Text type="secondary">
                {t('createdBy')} {record.created_by || '-'}
              </Typography.Text>
            </div>
          </div>
        ),
      },
      {
        title: t('table.status'),
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (status: BatchStatus) => {
          const config = BATCH_STATUS_CONFIG[status];
          return <Tag color={config.color}>{config.label}</Tag>;
        },
      },
      {
        title: t('table.progress'),
        key: 'progress',
        width: 280,
        render: (_: unknown, record: BatchSummary) => (
          <div>
            <Progress
              percent={getProcessedPercent(record)}
              size="small"
              status={getProgressStatus(record)}
              strokeColor={record.status === 'failed' ? tokens.status.error : tokens.brand.primary}
            />
            <Typography.Text type="secondary">
              {record.completed_tasks + record.failed_tasks} / {record.total_tasks}
            </Typography.Text>
          </div>
        ),
      },
      {
        title: t('table.createdAt'),
        dataIndex: 'created_at',
        key: 'created_at',
        width: 170,
        render: (value: string) => formatDateTime(value),
      },
      {
        title: t('table.lastStatusTime'),
        key: 'last_time',
        width: 170,
        render: (_: unknown, record: BatchSummary) =>
          formatDateTime(record.completed_at || record.started_at || record.created_at),
      },
      {
        title: t('table.action'),
        key: 'actions',
        width: 120,
        render: (_: unknown, record: BatchSummary) => (
          <Button type="link" onClick={(event) => {
            event.stopPropagation();
            navigate(`/batch/${record.id}`);
          }}>
            {t('detail.backToList')}
          </Button>
        ),
      },
    ],
    [navigate, tokens]
  );

  return (
    <div style={{ maxWidth: 1360, margin: '0 auto', padding: '24px 24px 40px' }}>
      <PageHeader
        title={t('title')}
        description={t('description')}
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => loadBatches(true)} loading={loading}>
              {t('detail.refresh')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/batch/create')}>
              {t('create.title')}
            </Button>
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

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {overview.map((item) => (
          <Col xs={24} sm={12} xl={4} key={item.title}>
            <Card bordered={false} style={cardStyle}>
              <Typography.Text type="secondary">{item.title}</Typography.Text>
              <div style={{ marginTop: 10, display: 'flex', alignItems: 'baseline', gap: 12 }}>
                <Typography.Title level={3} style={{ margin: 0, color: item.accent }}>
                  {item.value}
                </Typography.Title>
                <div
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    background: item.accent,
                    boxShadow: `0 0 18px ${item.accent}`,
                  }}
                />
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      <Card bordered={false} style={cardStyle}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Row gutter={[16, 16]}>
            <Col xs={24} md={14}>
              <Input.Search
                allowClear
                placeholder={t('list.searchPlaceholder')}
                value={keyword}
                onChange={(event) => setKeyword(event.target.value)}
              />
            </Col>
            <Col xs={24} md={10}>
              <Select
                style={{ width: '100%' }}
                value={statusFilter}
                options={STATUS_OPTIONS}
                onChange={(value) => setStatusFilter(value)}
              />
            </Col>
          </Row>

          <Table<BatchSummary>
            rowKey="id"
            loading={loading}
            columns={columns}
            dataSource={filteredBatches}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              showTotal: (total) => t('list.total', { count: total }),
            }}
            scroll={{ x: 960 }}
            locale={{
              emptyText: (
                <Empty
                  description={statusFilter === 'all' ? t('list.noTasks') : t('list.noTasksFiltered')}
                />
              ),
            }}
            onRow={(record) => ({
              onClick: () => navigate(`/batch/${record.id}`),
              style: { cursor: 'pointer' },
            })}
          />
        </Space>
      </Card>
    </div>
  );
}
