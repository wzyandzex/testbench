/**
 * Target System Acceptance admin 页
 *
 * Tabs: Runs / Baselines
 * - Runs: 表格 + 筛选 + 详情 Drawer (含 Compare to baseline)
 * - Baselines: 表格列出当前 baseline 集合
 */
import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Descriptions,
  Drawer,
  Form,
  Input,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { ReloadOutlined, EyeOutlined, DiffOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  targetAcceptanceService,
  type BaselineSummaryView,
  type Comparison,
  type ListRunsParams,
  type RunDetailView,
  type RunSummaryView,
} from './targetAcceptanceService';

const { Title, Paragraph, Text } = Typography;

const ACCEPTED_STATE_COLORS: Record<string, string> = {
  accepted: 'green',
  rejected: 'red',
  pending: 'orange',
  needs_review: 'gold',
};

const STATUS_COLORS: Record<string, string> = {
  passed: 'green',
  failed: 'red',
  running: 'blue',
  unknown: 'default',
};

function StateTag({ value, kind = 'state' }: { value?: string; kind?: 'state' | 'status' }) {
  const { t } = useTranslation('admin');
  if (!value) return <Tag>-</Tag>;
  const colors = kind === 'state' ? ACCEPTED_STATE_COLORS : STATUS_COLORS;
  return <Tag color={colors[value] ?? 'default'}>{t(`targetAcceptance.states.${value}`, { defaultValue: value })}</Tag>;
}

function JsonPreview({ value, max = 600 }: { value: unknown; max?: number }) {
  const { t } = useTranslation('admin');
  if (value == null) return <Text type="secondary">—</Text>;
  let str = '';
  try {
    str = typeof value === 'string' ? value : JSON.stringify(value, null, 2);
  } catch {
    return <Text type="secondary">{t('targetAcceptance.detail.unparseable')}</Text>;
  }
  if (str.length > max) {
    str = str.slice(0, max) + `\n${t('targetAcceptance.detail.truncated')}`;
  }
  return (
    <pre
      style={{
        background: '#0d1117',
        color: '#e6edf3',
        padding: 12,
        borderRadius: 6,
        fontSize: 12,
        maxHeight: 280,
        overflow: 'auto',
      }}
    >
      {str}
    </pre>
  );
}

function RunsTab() {
  const { t } = useTranslation('admin');
  const [list, setList] = useState<RunSummaryView[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [filters, setFilters] = useState<ListRunsParams>({});

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<RunDetailView | null>(null);
  const [comparison, setComparison] = useState<Comparison | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [comparing, setComparing] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await targetAcceptanceService.listRuns({
        ...filters,
        page,
        page_size: pageSize,
      });
      setList(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      message.error(
        t('targetAcceptance.messages.loadFailed', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setLoading(false);
    }
  }, [filters, page, pageSize, t]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const openDetail = async (id: string) => {
    setDrawerOpen(true);
    setDetail(null);
    setComparison(null);
    setDetailLoading(true);
    try {
      const d = await targetAcceptanceService.getRun(id);
      setDetail(d);
    } catch (err) {
      message.error(
        t('targetAcceptance.messages.loadDetailFailed', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setDetailLoading(false);
    }
  };

  const handleCompare = async () => {
    if (!detail) return;
    setComparing(true);
    try {
      const c = await targetAcceptanceService.compareRun(detail.id);
      setComparison(c);
    } catch (err) {
      message.error(
        t('targetAcceptance.messages.compareFailed', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setComparing(false);
    }
  };

  const columns: ColumnsType<RunSummaryView> = [
    {
      title: t('targetAcceptance.columns.surfaceKind'),
      key: 'surface',
      width: 200,
      render: (_, r) => (
        <Space direction="vertical" size={0}>
          <Text strong>{r.target_surface}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {r.contract_kind} · {r.scope_kind}
          </Text>
        </Space>
      ),
    },
    {
      title: t('targetAcceptance.columns.env'),
      dataIndex: 'environment_label',
      key: 'environment_label',
      width: 100,
      render: (v: string) => <Tag>{v || '-'}</Tag>,
    },
    {
      title: t('targetAcceptance.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (v: string) => <StateTag value={v} kind="status" />,
    },
    {
      title: t('targetAcceptance.columns.classification'),
      dataIndex: 'classification',
      key: 'classification',
      width: 140,
    },
    {
      title: t('targetAcceptance.columns.accepted'),
      dataIndex: 'accepted_state',
      key: 'accepted_state',
      width: 120,
      render: (v: string) => <StateTag value={v} />,
    },
    {
      title: t('targetAcceptance.columns.verdict'),
      dataIndex: 'verdict_passed',
      key: 'verdict_passed',
      width: 90,
      render: (v?: boolean) =>
        v == null ? <Tag>-</Tag> : v ? <Tag color="green">{t('targetAcceptance.verdict.pass')}</Tag> : <Tag color="red">{t('targetAcceptance.verdict.fail')}</Tag>,
    },
    {
      title: t('targetAcceptance.columns.generated'),
      dataIndex: 'generated_at',
      key: 'generated_at',
      width: 170,
      render: (v: string) => (v ? new Date(v).toLocaleString() : '-'),
    },
    {
      title: '',
      key: 'actions',
      width: 80,
      render: (_, r) => (
        <Button size="small" icon={<EyeOutlined />} onClick={() => void openDetail(r.id)}>
          {t('targetAcceptance.actions.detail')}
        </Button>
      ),
    },
  ];

  return (
    <>
      <Card
        bordered={false}
        size="small"
        style={{ marginBottom: 12 }}
        title={
          <Form
            layout="inline"
            onFinish={(values) => {
              setFilters(values as ListRunsParams);
              setPage(1);
            }}
            initialValues={filters}
          >
            <Form.Item name="target_surface">
              <Input placeholder={t('targetAcceptance.filters.targetSurface')} size="small" allowClear style={{ width: 160 }} />
            </Form.Item>
            <Form.Item name="contract_kind">
              <Input placeholder={t('targetAcceptance.filters.contractKind')} size="small" allowClear style={{ width: 140 }} />
            </Form.Item>
            <Form.Item name="scope_kind">
              <Input placeholder={t('targetAcceptance.filters.scopeKind')} size="small" allowClear style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="environment_label">
              <Input placeholder={t('targetAcceptance.filters.environment')} size="small" allowClear style={{ width: 100 }} />
            </Form.Item>
            <Form.Item name="accepted_state">
              <Select
                placeholder={t('targetAcceptance.filters.acceptedState')}
                size="small"
                allowClear
                style={{ width: 140 }}
                options={[
                  { value: 'accepted', label: t('targetAcceptance.states.accepted') },
                  { value: 'rejected', label: t('targetAcceptance.states.rejected') },
                  { value: 'pending', label: t('targetAcceptance.states.pending') },
                  { value: 'needs_review', label: t('targetAcceptance.states.needs_review') },
                ]}
              />
            </Form.Item>
            <Button type="primary" size="small" htmlType="submit">
              {t('targetAcceptance.filter.submit')}
            </Button>
            <Button
              size="small"
              icon={<ReloadOutlined />}
              onClick={() => void fetchList()}
              style={{ marginLeft: 8 }}
            >
              {t('targetAcceptance.filter.refresh')}
            </Button>
          </Form>
        }
      />
      <Table<RunSummaryView>
        rowKey="id"
        columns={columns}
        dataSource={list}
        loading={loading}
        pagination={{
          current: page,
          pageSize,
          total,
          showSizeChanger: true,
          onChange: (p, ps) => {
            setPage(p);
            setPageSize(ps);
          },
        }}
      />

      <Drawer
        title={detail ? t('targetAcceptance.drawer.title', { id: detail.id }) : t('targetAcceptance.drawer.titleFallback')}
        width={720}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        extra={
          detail && (
            <Button icon={<DiffOutlined />} loading={comparing} onClick={() => void handleCompare()}>
              {t('targetAcceptance.actions.compare')}
            </Button>
          )
        }
      >
        {detailLoading && <Paragraph>{t('targetAcceptance.drawer.loading')}</Paragraph>}
        {detail && (
          <>
            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label={t('targetAcceptance.detail.surface')}>{detail.target_surface}</Descriptions.Item>
              <Descriptions.Item label={t('targetAcceptance.detail.contract')}>{detail.contract_kind}</Descriptions.Item>
              <Descriptions.Item label={t('targetAcceptance.detail.scope')}>{detail.scope_kind}</Descriptions.Item>
              <Descriptions.Item label={t('targetAcceptance.detail.env')}>{detail.environment_label}</Descriptions.Item>
              <Descriptions.Item label={t('targetAcceptance.detail.source')}>
                {detail.source_kind} {detail.source_ref ? `(${detail.source_ref})` : ''}
              </Descriptions.Item>
              <Descriptions.Item label={t('targetAcceptance.detail.externalRun')}>{detail.external_run_id || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('targetAcceptance.detail.gitRevision')}>{detail.git_revision || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('targetAcceptance.detail.status')}>
                <StateTag value={detail.status} kind="status" />
              </Descriptions.Item>
              <Descriptions.Item label={t('targetAcceptance.detail.acceptedState')}>
                <StateTag value={detail.accepted_state} />
              </Descriptions.Item>
              <Descriptions.Item label={t('targetAcceptance.detail.acceptedBy')}>{detail.accepted_by || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('targetAcceptance.detail.generated')}>
                {new Date(detail.generated_at).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label={t('targetAcceptance.detail.recorded')}>
                {new Date(detail.recorded_at).toLocaleString()}
              </Descriptions.Item>
            </Descriptions>

            {detail.narrative_summary && (
              <>
                <Title level={5} style={{ marginTop: 16 }}>
                  {t('targetAcceptance.detail.narrative')}
                </Title>
                <Paragraph>{detail.narrative_summary}</Paragraph>
              </>
            )}

            <Title level={5} style={{ marginTop: 16 }}>
              {t('targetAcceptance.detail.assumptions')}
            </Title>
            <JsonPreview value={detail.assumptions} />

            <Title level={5} style={{ marginTop: 16 }}>
              {t('targetAcceptance.detail.normalizedFacts')}
            </Title>
            <JsonPreview value={detail.normalized_facts} />

            <Title level={5} style={{ marginTop: 16 }}>
              {t('targetAcceptance.detail.artifactManifest')}
            </Title>
            <JsonPreview value={detail.artifact_manifest} />

            {comparison && (
              <>
                <Title level={5} style={{ marginTop: 16 }}>
                  {t('targetAcceptance.detail.comparisonToBaseline')}
                </Title>
                <JsonPreview value={comparison} max={2000} />
              </>
            )}
          </>
        )}
      </Drawer>
    </>
  );
}

function BaselinesTab() {
  const { t } = useTranslation('admin');
  const [list, setList] = useState<BaselineSummaryView[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await targetAcceptanceService.listBaselines({ page, page_size: pageSize });
      setList(res.data ?? []);
      setTotal(res.total ?? 0);
    } catch (err) {
      message.error(
        t('targetAcceptance.messages.loadFailed', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, t]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const columns: ColumnsType<BaselineSummaryView> = [
    {
      title: t('targetAcceptance.columns.surfaceKind'),
      key: 'surface',
      width: 240,
      render: (_, b) => (
        <Space direction="vertical" size={0}>
          <Text strong>{b.target_surface}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {b.contract_kind} · {b.scope_kind}
          </Text>
        </Space>
      ),
    },
    { title: t('targetAcceptance.columns.env'), dataIndex: 'environment_label', key: 'environment_label', width: 120 },
    { title: t('targetAcceptance.columns.runId'), dataIndex: 'acceptance_run_id', key: 'acceptance_run_id', width: 240 },
    { title: t('targetAcceptance.columns.promotedBy'), dataIndex: 'promoted_by', key: 'promoted_by', width: 160 },
    {
      title: t('targetAcceptance.columns.promotedAt'),
      dataIndex: 'promoted_at',
      key: 'promoted_at',
      width: 180,
      render: (v: string) => new Date(v).toLocaleString(),
    },
  ];

  return (
    <Table<BaselineSummaryView>
      rowKey={(b) => `${b.target_surface}-${b.contract_kind}-${b.scope_kind}-${b.environment_label}`}
      columns={columns}
      dataSource={list}
      loading={loading}
      pagination={{
        current: page,
        pageSize,
        total,
        onChange: (p, ps) => {
          setPage(p);
          setPageSize(ps);
        },
      }}
    />
  );
}

export default function TargetAcceptancePage() {
  const { t } = useTranslation('admin');
  return (
    <div style={{ padding: 24, maxWidth: 1500, margin: '0 auto' }}>
      <Title level={3} style={{ marginBottom: 8 }}>
        {t('targetAcceptance.title')}
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 16 }}>
        {t('targetAcceptance.description')}
      </Paragraph>

      <Card bordered={false}>
        <Tabs
          items={[
            { key: 'runs', label: t('targetAcceptance.tabs.runs'), children: <RunsTab /> },
            {
              key: 'baselines',
              label: t('targetAcceptance.tabs.baselines'),
              children: <BaselinesTab />,
            },
          ]}
        />
      </Card>
    </div>
  );
}
