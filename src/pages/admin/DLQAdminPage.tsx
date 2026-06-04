/**
 * Admin DLQ 死信队列管理页
 *
 * 来源: /api/v1/history/dlq*
 * 用途: 查看 notifier 发送失败而进入死信队列的事件，可重放或丢弃
 *
 * 支持：
 * - 实时总数统计
 * - 按 task_id / worker_id / 关键词 / source / 时间范围 筛选
 * - 列表分页
 * - 详情 Drawer
 * - 重放（POST /:id/replay）
 * - 删除（DELETE /:id）— 危险操作，需二次确认
 */
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Descriptions,
  Drawer,
  Empty,
  Form,
  Input,
  Popconfirm,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DeleteOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
  RedoOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { Trans, useTranslation } from 'react-i18next';
import {
  dlqService,
  type DeadLetterEntry,
  type ListDLQParams,
} from './dlqService';

const { Title, Paragraph, Text } = Typography;
const { RangePicker } = DatePicker;

function priorityTag(priority?: string) {
  if (!priority) return null;
  const colors: Record<string, string> = {
    high: 'red',
    normal: 'blue',
    low: 'default',
  };
  return <Tag color={colors[priority.toLowerCase()] || 'default'}>{priority}</Tag>;
}

function sourceTag(source?: string) {
  if (!source) return <Tag>-</Tag>;
  return <Tag color="geekblue">{source}</Tag>;
}

interface FilterFormValues {
  task_id?: string;
  worker_id?: string;
  search?: string;
  source?: string;
  range?: [Dayjs, Dayjs];
}

export default function DLQAdminPage() {
  const { t } = useTranslation('admin');
  const [form] = Form.useForm<FilterFormValues>();
  const [list, setList] = useState<DeadLetterEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [statsCount, setStatsCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ListDLQParams>({});

  const [detail, setDetail] = useState<DeadLetterEntry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  const sourceOptions = useMemo(
    () => [
      { value: '', label: t('dlq.sourceOptions.all') },
      { value: 'notifier', label: t('dlq.sourceOptions.notifier') },
      { value: 'worker', label: t('dlq.sourceOptions.worker') },
      { value: 'scheduler', label: t('dlq.sourceOptions.scheduler') },
    ],
    [t]
  );

  const fetchStats = useCallback(async () => {
    try {
      const s = await dlqService.stats();
      setStatsCount(s.count || 0);
    } catch (err) {
      // 静默：stats 失败不阻塞主表
      console.warn('DLQ stats failed', err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: ListDLQParams = {
        ...filters,
        page,
        page_size: pageSize,
      };
      const resp = await dlqService.list(params);
      setList(resp.entries || []);
      setTotal(resp.total || 0);
    } catch (err) {
      message.error(
        t('dlq.messages.loadFailed', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize, t]);

  useEffect(() => {
    void fetchData();
    void fetchStats();
  }, [fetchData, fetchStats]);

  const handleApplyFilter = (values: FilterFormValues) => {
    const next: ListDLQParams = {};
    if (values.task_id) next.task_id = values.task_id.trim();
    if (values.worker_id) next.worker_id = values.worker_id.trim();
    if (values.search) next.search = values.search.trim();
    if (values.source) next.source = values.source;
    if (values.range) {
      next.start_time = values.range[0].toISOString();
      next.end_time = values.range[1].toISOString();
    }
    setFilters(next);
    setPage(1);
  };

  const handleResetFilter = () => {
    form.resetFields();
    setFilters({});
    setPage(1);
  };

  const handleViewDetail = async (entry: DeadLetterEntry) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const data = await dlqService.get(entry.id);
      setDetail(data);
    } catch (err) {
      message.error(
        t('dlq.messages.loadDetailFailed', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const setRowLoading = (id: string, v: boolean) =>
    setActionLoading((prev) => ({ ...prev, [id]: v }));

  const handleReplay = async (entry: DeadLetterEntry) => {
    setRowLoading(entry.id, true);
    try {
      await dlqService.replay(entry.id);
      message.success(t('dlq.messages.replayed', { id: entry.id }));
      await Promise.all([fetchData(), fetchStats()]);
    } catch (err) {
      message.error(
        t('dlq.messages.replayFailed', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setRowLoading(entry.id, false);
    }
  };

  const handleRemove = async (entry: DeadLetterEntry) => {
    setRowLoading(entry.id, true);
    try {
      await dlqService.remove(entry.id);
      message.success(t('dlq.messages.deleted', { id: entry.id }));
      await Promise.all([fetchData(), fetchStats()]);
    } catch (err) {
      message.error(
        t('dlq.messages.deleteFailed', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setRowLoading(entry.id, false);
    }
  };

  const columns: ColumnsType<DeadLetterEntry> = useMemo(
    () => [
      {
        title: t('dlq.columns.failedAt'),
        dataIndex: 'failed_at',
        key: 'failed_at',
        width: 180,
        render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'),
      },
      {
        title: t('dlq.columns.source'),
        dataIndex: 'source',
        key: 'source',
        width: 110,
        render: sourceTag,
      },
      {
        title: t('dlq.columns.eventType'),
        key: 'event_type',
        width: 140,
        render: (_: unknown, r: DeadLetterEntry) => r.event?.type || '-',
      },
      {
        title: t('dlq.columns.priority'),
        key: 'priority',
        width: 90,
        render: (_: unknown, r: DeadLetterEntry) => priorityTag(r.event?.priority) || '-',
      },
      {
        title: t('dlq.columns.taskId'),
        key: 'task_id',
        width: 160,
        ellipsis: true,
        render: (_: unknown, r: DeadLetterEntry) => r.event?.task_id || '-',
      },
      {
        title: t('dlq.columns.worker'),
        key: 'worker_id',
        width: 140,
        ellipsis: true,
        render: (_: unknown, r: DeadLetterEntry) => r.event?.worker_id || '-',
      },
      {
        title: t('dlq.columns.reason'),
        dataIndex: 'reason',
        key: 'reason',
        ellipsis: true,
        render: (v: string) => v || '-',
      },
      {
        title: t('dlq.columns.actions'),
        key: 'actions',
        width: 220,
        fixed: 'right',
        render: (_: unknown, entry: DeadLetterEntry) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => void handleViewDetail(entry)}
            >
              {t('dlq.actions.detail')}
            </Button>
            <Popconfirm
              title={t('dlq.replayConfirm.title')}
              description={t('dlq.replayConfirm.description')}
              icon={<WarningOutlined style={{ color: '#faad14' }} />}
              onConfirm={() => void handleReplay(entry)}
            >
              <Button
                type="link"
                size="small"
                icon={<RedoOutlined />}
                loading={actionLoading[entry.id]}
              >
                {t('dlq.actions.replay')}
              </Button>
            </Popconfirm>
            <Popconfirm
              title={t('dlq.deleteConfirm.title')}
              description={t('dlq.deleteConfirm.description')}
              icon={<ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />}
              okButtonProps={{ danger: true }}
              onConfirm={() => void handleRemove(entry)}
            >
              <Button
                type="link"
                danger
                size="small"
                icon={<DeleteOutlined />}
                loading={actionLoading[entry.id]}
              >
                {t('dlq.actions.delete')}
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ],
    [actionLoading, t]
  );

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <Title level={3} style={{ marginBottom: 8 }}>
        <Space>
          <WarningOutlined />
          {t('dlq.title')}
        </Space>
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 16 }}>
        <Trans i18nKey="dlq.description" ns="admin" components={{ 1: <Text strong />, 2: <Text strong /> }} />
      </Paragraph>

      <Card style={{ marginBottom: 16 }} bordered={false}>
        <Space size="large" align="center">
          <Statistic
            title={t('dlq.stats.totalCount')}
            value={statsCount}
            valueStyle={{ color: statsCount > 0 ? '#cf1322' : '#3f8600' }}
          />
          {statsCount === 0 && (
            <Alert type="success" showIcon message={t('dlq.stats.noDeadLetters')} banner />
          )}
        </Space>
      </Card>

      <Card style={{ marginBottom: 16 }} bordered={false}>
        <Form<FilterFormValues> form={form} layout="inline" onFinish={handleApplyFilter}>
          <Form.Item name="task_id" label={t('dlq.filter.taskIdLabel')}>
            <Input
              placeholder={t('dlq.filter.taskIdPlaceholder')}
              style={{ width: 200 }}
              allowClear
            />
          </Form.Item>
          <Form.Item name="worker_id" label={t('dlq.filter.workerIdLabel')}>
            <Input
              placeholder={t('dlq.filter.workerIdPlaceholder')}
              style={{ width: 160 }}
              allowClear
            />
          </Form.Item>
          <Form.Item name="search" label={t('dlq.filter.searchLabel')}>
            <Input
              placeholder={t('dlq.filter.searchPlaceholder')}
              style={{ width: 200 }}
              allowClear
            />
          </Form.Item>
          <Form.Item name="source" label={t('dlq.filter.sourceLabel')}>
            <Select
              style={{ width: 140 }}
              options={sourceOptions}
              allowClear
              placeholder={t('dlq.filter.sourcePlaceholder')}
            />
          </Form.Item>
          <Form.Item name="range" label={t('dlq.filter.rangeLabel')}>
            <RangePicker
              showTime
              presets={[
                { label: t('dlq.filter.presets.today'), value: [dayjs().startOf('day'), dayjs()] },
                {
                  label: t('dlq.filter.presets.last24h'),
                  value: [dayjs().subtract(24, 'hour'), dayjs()],
                },
                {
                  label: t('dlq.filter.presets.last7d'),
                  value: [dayjs().subtract(7, 'day').startOf('day'), dayjs()],
                },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {t('dlq.filter.submit')}
              </Button>
              <Button onClick={handleResetFilter}>{t('dlq.filter.reset')}</Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  void fetchData();
                  void fetchStats();
                }}
              >
                {t('dlq.filter.refresh')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card bordered={false}>
        <Table<DeadLetterEntry>
          rowKey="id"
          dataSource={list}
          columns={columns}
          loading={loading}
          scroll={{ x: 1400 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ['10', '20', '50', '100', '200'],
            showTotal: (totalCount) => t('dlq.pagination.total', { total: totalCount }),
            onChange: (p, s) => {
              setPage(p);
              setPageSize(s);
            },
          }}
        />
      </Card>

      <Drawer
        title={
          <Space>
            <WarningOutlined />
            {t('dlq.drawer.title')}
          </Space>
        }
        width={680}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        destroyOnClose
        extra={
          detail && (
            <Space>
              <Popconfirm
                title={t('dlq.replayConfirm.title')}
                onConfirm={async () => {
                  await handleReplay(detail);
                  setDetailOpen(false);
                }}
              >
                <Button type="primary" icon={<RedoOutlined />}>
                  {t('dlq.actions.replay')}
                </Button>
              </Popconfirm>
              <Popconfirm
                title={t('dlq.deleteConfirm.shortTitle')}
                okButtonProps={{ danger: true }}
                onConfirm={async () => {
                  await handleRemove(detail);
                  setDetailOpen(false);
                }}
              >
                <Button danger icon={<DeleteOutlined />}>
                  {t('dlq.actions.delete')}
                </Button>
              </Popconfirm>
            </Space>
          )
        }
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>{t('dlq.drawer.loading')}</div>
        ) : detail ? (
          <>
            <Descriptions
              column={1}
              size="small"
              bordered
              labelStyle={{ width: 120 }}
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label={t('dlq.drawer.idLabel')}>
                <span style={{ fontFamily: 'monospace' }}>{detail.id}</span>
              </Descriptions.Item>
              <Descriptions.Item label={t('dlq.drawer.sourceLabel')}>
                {sourceTag(detail.source)}
              </Descriptions.Item>
              <Descriptions.Item label={t('dlq.drawer.failedAtLabel')}>
                {detail.failed_at ? dayjs(detail.failed_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('dlq.drawer.reasonLabel')}>
                <Text type="danger">{detail.reason || '-'}</Text>
              </Descriptions.Item>
            </Descriptions>

            {detail.event ? (
              <>
                <Title level={5}>{t('dlq.drawer.originalEventTitle')}</Title>
                <Descriptions column={1} size="small" bordered labelStyle={{ width: 120 }}>
                  <Descriptions.Item label={t('dlq.drawer.eventTypeLabel')}>
                    {detail.event.type || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('dlq.drawer.priorityLabel')}>
                    {priorityTag(detail.event.priority) || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('dlq.drawer.taskIdLabel')}>
                    {detail.event.task_id || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('dlq.drawer.workerIdLabel')}>
                    {detail.event.worker_id || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('dlq.drawer.eventTimeLabel')}>
                    {detail.event.timestamp
                      ? dayjs(detail.event.timestamp).format('YYYY-MM-DD HH:mm:ss')
                      : '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('dlq.drawer.messageLabel')}>
                    {detail.event.message || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('dlq.drawer.extraDataLabel')}>
                    {detail.event.has_data ? (
                      <Tag color="blue">{t('dlq.drawer.hasData')}</Tag>
                    ) : (
                      <Tag>{t('dlq.drawer.noExtraData')}</Tag>
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </>
            ) : (
              <Empty description={t('dlq.drawer.noPayload')} />
            )}
          </>
        ) : (
          <Empty description={t('dlq.drawer.noData')} />
        )}
      </Drawer>
    </div>
  );
}
