/**
 * Admin 系统审计日志页
 *
 * 来源: GET /api/v1/collector/audit-logs
 * 用途: 查看系统级清理操作的审计记录（沙箱清理、记录清理、追踪清理等）
 *
 * 支持：
 * - 按 triggered_by 过滤（scheduler / manual / cron）
 * - 按日期范围过滤（YYYY-MM-DD）
 * - 分页
 * - 点击行查看完整报告（results / details / errors）
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
  Select,
  Space,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  AuditOutlined,
  ExclamationCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import {
  auditLogService,
  type AuditLogEntry,
  type CleanupReportDetail,
  type ListAuditLogsParams,
} from './auditLogService';

const { Title, Paragraph } = Typography;
const { RangePicker } = DatePicker;

const CLEANUP_TYPE_COLOR: Record<string, string> = {
  sandbox: 'cyan',
  records: 'blue',
  traces: 'purple',
  all: 'magenta',
};

function cleanupTypeTag(type: string) {
  if (!type) return <Tag>-</Tag>;
  return <Tag color={CLEANUP_TYPE_COLOR[type] || 'default'}>{type}</Tag>;
}

function triggeredByTag(t: string) {
  if (!t) return <Tag>-</Tag>;
  const color = t === 'manual' ? 'orange' : t === 'scheduler' ? 'geekblue' : 'green';
  return <Tag color={color}>{t}</Tag>;
}

interface FilterFormValues {
  triggered_by?: string;
  range?: [Dayjs, Dayjs];
}

export default function AuditLogPage() {
  const { t } = useTranslation('admin');
  const [form] = Form.useForm<FilterFormValues>();
  const [list, setList] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<ListAuditLogsParams>({});

  const [detail, setDetail] = useState<CleanupReportDetail | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const triggeredByOptions = useMemo(
    () => [
      { value: 'scheduler', label: t('auditLog.triggeredByOptions.scheduler') },
      { value: 'manual', label: t('auditLog.triggeredByOptions.manual') },
      { value: 'cron', label: t('auditLog.triggeredByOptions.cron') },
    ],
    [t]
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: ListAuditLogsParams = {
        ...filters,
        page,
        page_size: pageSize,
      };
      const resp = await auditLogService.list(params);
      setList(resp.data || []);
      setTotal(resp.total || 0);
    } catch (err) {
      message.error(
        t('auditLog.messages.loadFailed', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize, t]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleApplyFilter = (values: FilterFormValues) => {
    const next: ListAuditLogsParams = {};
    if (values.triggered_by) next.triggered_by = values.triggered_by;
    if (values.range) {
      next.start_date = values.range[0].format('YYYY-MM-DD');
      next.end_date = values.range[1].format('YYYY-MM-DD');
    }
    setFilters(next);
    setPage(1);
  };

  const handleResetFilter = () => {
    form.resetFields();
    setFilters({});
    setPage(1);
  };

  const handleViewDetail = async (entry: AuditLogEntry) => {
    setDetailOpen(true);
    setDetailLoading(true);
    setDetail(null);
    try {
      const report = await auditLogService.getReport(entry.report_id);
      setDetail(report);
    } catch (err) {
      message.error(
        t('auditLog.messages.loadDetailFailed', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const columns: ColumnsType<AuditLogEntry> = useMemo(
    () => [
      {
        title: t('auditLog.columns.triggeredAt'),
        dataIndex: 'triggered_at',
        key: 'triggered_at',
        width: 180,
        render: (v: string) => (v ? dayjs(v).format('YYYY-MM-DD HH:mm:ss') : '-'),
      },
      {
        title: t('auditLog.columns.triggeredBy'),
        dataIndex: 'triggered_by',
        key: 'triggered_by',
        width: 140,
        render: (v: string) => triggeredByTag(v),
      },
      {
        title: t('auditLog.columns.cleanupType'),
        dataIndex: 'cleanup_type',
        key: 'cleanup_type',
        width: 120,
        render: (v: string) => cleanupTypeTag(v),
      },
      {
        title: t('auditLog.columns.taskId'),
        dataIndex: 'task_id',
        key: 'task_id',
        ellipsis: true,
        render: (v: string) => v || '-',
      },
      {
        title: t('auditLog.columns.reportId'),
        dataIndex: 'report_id',
        key: 'report_id',
        width: 200,
        ellipsis: true,
        render: (v: string) => <span style={{ fontFamily: 'monospace' }}>{v}</span>,
      },
      {
        title: t('auditLog.columns.reason'),
        dataIndex: 'reason',
        key: 'reason',
        ellipsis: true,
        render: (v: string) => v || '-',
      },
      {
        title: t('auditLog.columns.actions'),
        key: 'actions',
        width: 100,
        fixed: 'right',
        render: (_: unknown, entry: AuditLogEntry) => (
          <Button
            type="link"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => void handleViewDetail(entry)}
          >
            {t('auditLog.actions.detail')}
          </Button>
        ),
      },
    ],
    [t]
  );

  const detailErrors = detail?.errors || [];
  const detailDetails = detail?.details || [];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <Title level={3} style={{ marginBottom: 8 }}>
        <Space>
          <AuditOutlined />
          {t('auditLog.title')}
        </Space>
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 16 }}>
        {t('auditLog.description')}
      </Paragraph>

      <Card style={{ marginBottom: 16 }} bordered={false}>
        <Form<FilterFormValues> form={form} layout="inline" onFinish={handleApplyFilter}>
          <Form.Item name="triggered_by" label={t('auditLog.filter.triggeredByLabel')}>
            <Select
              allowClear
              placeholder={t('auditLog.filter.triggeredByPlaceholder')}
              style={{ width: 200 }}
              options={triggeredByOptions}
            />
          </Form.Item>
          <Form.Item name="range" label={t('auditLog.filter.rangeLabel')}>
            <RangePicker
              presets={[
                {
                  label: t('auditLog.filter.presets.today'),
                  value: [dayjs().startOf('day'), dayjs()],
                },
                {
                  label: t('auditLog.filter.presets.yesterday'),
                  value: [
                    dayjs().subtract(1, 'day').startOf('day'),
                    dayjs().subtract(1, 'day').endOf('day'),
                  ],
                },
                {
                  label: t('auditLog.filter.presets.last7d'),
                  value: [dayjs().subtract(7, 'day').startOf('day'), dayjs()],
                },
                {
                  label: t('auditLog.filter.presets.last30d'),
                  value: [dayjs().subtract(30, 'day').startOf('day'), dayjs()],
                },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {t('auditLog.filter.submit')}
              </Button>
              <Button onClick={handleResetFilter}>{t('auditLog.filter.reset')}</Button>
              <Button icon={<ReloadOutlined />} onClick={() => void fetchData()}>
                {t('auditLog.filter.refresh')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card bordered={false}>
        <Table<AuditLogEntry>
          rowKey="report_id"
          dataSource={list}
          columns={columns}
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: page,
            pageSize,
            total,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (totalCount) => t('auditLog.pagination.total', { total: totalCount }),
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
            <AuditOutlined />
            {t('auditLog.drawer.title')}
          </Space>
        }
        width={720}
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        destroyOnClose
      >
        {detailLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>{t('auditLog.drawer.loading')}</div>
        ) : detail ? (
          <>
            <Descriptions
              column={1}
              size="small"
              bordered
              labelStyle={{ width: 140 }}
              style={{ marginBottom: 16 }}
            >
              <Descriptions.Item label={t('auditLog.drawer.reportIdLabel')}>
                <span style={{ fontFamily: 'monospace' }}>{detail.report_id}</span>
              </Descriptions.Item>
              <Descriptions.Item label={t('auditLog.drawer.taskIdLabel')}>
                {detail.task_id || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('auditLog.drawer.organizationIdLabel')}>
                {detail.organization_id || '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('auditLog.drawer.cleanupTypeLabel')}>
                {cleanupTypeTag(detail.cleanup_type)}
                {detail.dry_run && (
                  <Tag color="warning" style={{ marginLeft: 8 }}>
                    {t('auditLog.drawer.dryRun')}
                  </Tag>
                )}
              </Descriptions.Item>
              <Descriptions.Item label={t('auditLog.drawer.triggeredByLabel')}>
                {triggeredByTag(detail.audit_info?.triggered_by || '')}
              </Descriptions.Item>
              <Descriptions.Item label={t('auditLog.drawer.triggeredAtLabel')}>
                {detail.audit_info?.triggered_at
                  ? dayjs(detail.audit_info.triggered_at).format('YYYY-MM-DD HH:mm:ss')
                  : '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('auditLog.drawer.generatedAtLabel')}>
                {detail.generated_at ? dayjs(detail.generated_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
              </Descriptions.Item>
              <Descriptions.Item label={t('auditLog.drawer.reasonLabel')}>
                {detail.audit_info?.reason || '-'}
              </Descriptions.Item>
            </Descriptions>

            <Title level={5} style={{ marginTop: 8 }}>
              {t('auditLog.drawer.cleanupResultsTitle')}
            </Title>
            <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label={t('auditLog.drawer.sandboxesCleaned')}>
                {detail.results?.sandboxes_cleaned ?? 0}
              </Descriptions.Item>
              <Descriptions.Item label={t('auditLog.drawer.recordsDeleted')}>
                {detail.results?.records_deleted ?? 0}
              </Descriptions.Item>
              <Descriptions.Item label={t('auditLog.drawer.tracesDeleted')}>
                {detail.results?.traces_deleted ?? 0}
              </Descriptions.Item>
              <Descriptions.Item label={t('auditLog.drawer.totalDuration')}>
                {detail.results?.total_duration_ms ?? 0}
              </Descriptions.Item>
            </Descriptions>

            {detailErrors.length > 0 && (
              <>
                <Alert
                  type="error"
                  showIcon
                  icon={<ExclamationCircleOutlined />}
                  message={t('auditLog.drawer.errorAlert', { count: detailErrors.length })}
                  style={{ marginBottom: 8 }}
                />
                <Table
                  rowKey={(r) => `${r.resource_type}-${r.resource_id}-${r.timestamp}`}
                  dataSource={detailErrors}
                  pagination={false}
                  size="small"
                  style={{ marginBottom: 16 }}
                  columns={[
                    {
                      title: t('auditLog.drawer.errorColumns.resourceType'),
                      dataIndex: 'resource_type',
                      width: 100,
                    },
                    {
                      title: t('auditLog.drawer.errorColumns.resourceId'),
                      dataIndex: 'resource_id',
                      ellipsis: true,
                    },
                    {
                      title: t('auditLog.drawer.errorColumns.error'),
                      dataIndex: 'error',
                      ellipsis: true,
                    },
                    {
                      title: t('auditLog.drawer.errorColumns.timestamp'),
                      dataIndex: 'timestamp',
                      width: 160,
                      render: (v: string) => (v ? dayjs(v).format('MM-DD HH:mm:ss') : '-'),
                    },
                  ]}
                />
              </>
            )}

            <Title level={5}>
              {t('auditLog.drawer.detailsTitle', { count: detailDetails.length })}
            </Title>
            {detailDetails.length === 0 ? (
              <Empty description={t('auditLog.drawer.noDetails')} />
            ) : (
              <Table
                rowKey={(r) => `${r.resource_type}-${r.resource_id}-${r.timestamp}`}
                dataSource={detailDetails}
                pagination={{ pageSize: 10, size: 'small' }}
                size="small"
                columns={[
                  {
                    title: t('auditLog.drawer.detailColumns.resourceType'),
                    dataIndex: 'resource_type',
                    width: 100,
                  },
                  {
                    title: t('auditLog.drawer.detailColumns.resourceId'),
                    dataIndex: 'resource_id',
                    ellipsis: true,
                  },
                  {
                    title: t('auditLog.drawer.detailColumns.action'),
                    dataIndex: 'action',
                    width: 100,
                  },
                  {
                    title: t('auditLog.drawer.detailColumns.timestamp'),
                    dataIndex: 'timestamp',
                    width: 160,
                    render: (v: string) => (v ? dayjs(v).format('MM-DD HH:mm:ss') : '-'),
                  },
                ]}
              />
            )}
          </>
        ) : (
          <Empty description={t('auditLog.drawer.noData')} />
        )}
      </Drawer>
    </div>
  );
}
