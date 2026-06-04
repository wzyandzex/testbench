/**
 * Analyzer Reports page
 * Slice: S20
 *
 * Features: report list (tabs by type) + detail Drawer (three report types)
 */

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, Typography, Button, Space, Select, Table, Tag, Tabs,
  Breadcrumb, Descriptions, Divider, Statistic, Row, Col, Drawer, Spin, message,
} from 'antd';
import {
  HomeOutlined, BarChartOutlined, EyeOutlined,
} from '@ant-design/icons';
import { analyzerService } from '@/services/analyzer';
import type {
  ReportListItem, ReportListResponse,
  PerformanceTrendReport, AgentComparisonReport, ExecutionStatsReport,
  AgentStats, BenchmarkStats,
} from '@/types/api/analyzer';
import { REPORT_TYPE_CONFIG } from '@/types/api/analyzer';

const { Title, Text } = Typography;

export default function AnalyzerPage() {
  const { t } = useTranslation('analyzer');
  const [activeTab, setActiveTab] = useState('all');
  const [reports, setReports] = useState<ReportListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);

  const fetchReports = useCallback(async (p: number, tab: string, tf?: string) => {
    setLoading(true);
    try {
      let res: unknown;
      const params = { page: p, page_size: 10 };
      if (tab === 'trends') {
        res = await analyzerService.listTrends(params);
      } else if (tab === 'comparisons') {
        res = await analyzerService.listComparisons(params);
      } else {
        res = await analyzerService.listReports({ ...params, report_type: tf });
      }
      const data = (res as unknown) as ReportListResponse;
      setReports(data?.data || []);
      setTotal(data?.total || 0);
      setPage(p);
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchReports(1, activeTab, typeFilter); }, [fetchReports, activeTab, typeFilter]);

  // Detail
  const [detail, setDetail] = useState<unknown>(null);
  const [detailId, setDetailId] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const openDetail = useCallback(async (id: string) => {
    setDetailId(id);
    setDrawerOpen(true);
    setDetailLoading(true);
    try {
      const res = await analyzerService.getReport(id);
      setDetail((res as unknown) as { data?: unknown } ?? res);
    } catch {
      message.error(t('loadFailed'));
    } finally {
      setDetailLoading(false);
    }
  }, [t]);

  const columns = [
    { title: t('columns.reportId'), dataIndex: 'report_id', key: 'id', width: 160, render: (v: string) => v.slice(0, 16) + '...' },
    { title: t('columns.type'), dataIndex: 'report_type', key: 'type', width: 120,
      render: (v: string) => { const cfg = REPORT_TYPE_CONFIG[v]; return <Tag color={cfg?.color}>{cfg?.label || v}</Tag>; } },
    { title: t('columns.date'), dataIndex: 'date', key: 'date', width: 120 },
    { title: t('columns.generatedAt'), dataIndex: 'generated_at', key: 'gen', width: 180,
      render: (v: string) => v?.slice(0, 19).replace('T', ' ') },
    { title: t('columns.action'), key: 'action', width: 80,
      render: (_: unknown, record: ReportListItem) => (
        <Button type="link" icon={<EyeOutlined />} onClick={() => openDetail(record.report_id)}>{t('columns.view')}</Button>
      ),
    },
  ];

  const renderDetail = () => {
    if (detailLoading) return <Spin />;
    if (!detail) return <Text type="secondary">{t('noData')}</Text>;
    const d = (detail as Record<string, unknown>)?.data ? (detail as Record<string, unknown>).data : detail;
    const obj = d as Record<string, unknown>;

    if (!obj || !obj.report_id) return <Text type="secondary">{t('parseError')}</Text>;
    const reportType = obj.report_type as string;

    if (reportType === 'performance_trends') return <PerformanceTrendDetailView report={obj as unknown as PerformanceTrendReport} />;
    if (reportType === 'agent_comparison') return <AgentComparisonDetailView report={obj as unknown as AgentComparisonReport} />;
    if (reportType === 'execution_stats') return <ExecutionStatsDetailView report={obj as unknown as ExecutionStatsReport} />;

    return <pre style={{ fontSize: 11, maxHeight: 400, overflow: 'auto' }}>{JSON.stringify(d, null, 2)}</pre>;
  };

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <Breadcrumb style={{ marginBottom: 24 }} items={[
        { title: <><HomeOutlined /> <a href="/dashboard">Dashboard</a></> },
        { title: <span>{t('breadcrumb')}</span> },
      ]} />

      <Title level={3} style={{ marginBottom: 24 }}>
        <BarChartOutlined style={{ marginRight: 8 }} />{t('title')}
      </Title>

      {activeTab === 'all' && (
        <Card size="small" style={{ marginBottom: 16 }}>
          <Space>
            <Text strong>{t('typeFilter')}</Text>
            <Select allowClear placeholder={t('allPlaceholder')} style={{ width: 140 }} value={typeFilter}
              onChange={(v) => { setTypeFilter(v); fetchReports(1, activeTab, v || undefined); }}
              options={Object.entries(REPORT_TYPE_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))} />
          </Space>
        </Card>
      )}

      <Card size="small">
        <Tabs activeKey={activeTab} onChange={(k: string) => { setActiveTab(k); setTypeFilter(undefined); fetchReports(1, k); }}
          items={[
            { key: 'all', label: t('tabs.all') },
            { key: 'trends', label: t('tabs.trends') },
            { key: 'comparisons', label: t('tabs.comparisons') },
          ]}
          style={{ marginBottom: 16 }} />

        <Table<ReportListItem>
          rowKey="report_id"
          size="small"
          loading={loading}
          dataSource={reports}
          pagination={{ current: page, pageSize: 10, total, onChange: (p) => fetchReports(p, activeTab, typeFilter) }}
          columns={columns}
        />
      </Card>

      <Drawer title={t('drawerTitle', { id: detailId.slice(0, 16) })} open={drawerOpen}
        onClose={() => { setDrawerOpen(false); setDetail(null); }} width={700}>
        {renderDetail()}
      </Drawer>
    </div>
  );
}

// --- Detail Views ---

function PerformanceTrendDetailView({ report }: { report: PerformanceTrendReport }) {
  const { t } = useTranslation('analyzer');
  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Descriptions size="small" column={2} bordered>
        <Descriptions.Item label={t('trend.timeRangeStart')}>{report.time_range?.start?.slice(0, 19) || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('trend.timeRangeEnd')}>{report.time_range?.end?.slice(0, 19) || '-'}</Descriptions.Item>
        <Descriptions.Item label={t('trend.dataPointsDuration')}>{report.avg_duration?.length || 0}</Descriptions.Item>
        <Descriptions.Item label={t('trend.dataPointsPassRate')}>{report.pass_rate?.length || 0}</Descriptions.Item>
      </Descriptions>

      {report.agent_stats && report.agent_stats.length > 0 && (
        <>
          <Divider orientation="left" style={{ margin: '8px 0' }}>{t('trend.agentStats')}</Divider>
          <AgentStatsTable data={report.agent_stats} />
        </>
      )}

      {report.benchmark_stats && report.benchmark_stats.length > 0 && (
        <>
          <Divider orientation="left" style={{ margin: '8px 0' }}>{t('trend.benchmarkStats')}</Divider>
          <BenchmarkStatsTable data={report.benchmark_stats} />
        </>
      )}
    </Space>
  );
}

function AgentComparisonDetailView({ report }: { report: AgentComparisonReport }) {
  const { t } = useTranslation('analyzer');
  const renderMetric = (metric: { metric_name?: string; values?: Record<string, number>; leader?: string }, title: string) => {
    if (!metric?.values) return null;
    return (
      <Card title={title} size="small" style={{ marginBottom: 12 }}>
        <Descriptions size="small" column={1} bordered>
          <Descriptions.Item label={t('comparison.metric')}>{metric.metric_name || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('comparison.leader')}><Tag color="green">{metric.leader || '-'}</Tag></Descriptions.Item>
        </Descriptions>
        <Table size="small" dataSource={Object.entries(metric.values).map(([k, v]) => ({ agent: k, value: v }))}
          rowKey="agent" pagination={false}
          columns={[
            { title: 'Agent', dataIndex: 'agent', key: 'agent' },
            { title: t('columns.value'), dataIndex: 'value', key: 'value', render: (v: number) => v.toFixed(2) },
          ]} />
      </Card>
    );
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      <Descriptions size="small" column={1} bordered>
        <Descriptions.Item label={t('comparison.comparedAgents')}>{report.compared_agents?.join(', ') || '-'}</Descriptions.Item>
      </Descriptions>
      {renderMetric(report.performance, t('comparison.performance'))}
      {renderMetric(report.cost, t('comparison.cost'))}
      {renderMetric(report.quality, t('comparison.quality'))}
      {report.recommendation && (
        <Card title={t('comparison.recommendation')} size="small">
          <Text>{report.recommendation}</Text>
        </Card>
      )}
    </Space>
  );
}

function ExecutionStatsDetailView({ report }: { report: ExecutionStatsReport }) {
  const { t } = useTranslation('analyzer');
  const formatMs = (ms: number) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}min`;
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size={16}>
      <Row gutter={16}>
        <Col span={6}><Statistic title={t('stats.totalExecutions')} value={report.total_executions} /></Col>
        <Col span={6}><Statistic title={t('stats.success')} value={report.success_count} valueStyle={{ color: '#3f8600' }} /></Col>
        <Col span={6}><Statistic title={t('stats.failed')} value={report.failure_count} valueStyle={{ color: '#cf1322' }} /></Col>
        <Col span={6}><Statistic title={t('stats.passRate')} value={report.overall_pass_rate} suffix="%" precision={1} /></Col>
      </Row>
      <Row gutter={16}>
        <Col span={12}><Statistic title={t('stats.avgDuration')} value={formatMs(report.avg_duration_ms)} /></Col>
        <Col span={12}><Descriptions size="small" column={1}>
          <Descriptions.Item label={t('stats.timeRange')}>{report.time_range?.start?.slice(0, 10)} ~ {report.time_range?.end?.slice(0, 10)}</Descriptions.Item>
        </Descriptions></Col>
      </Row>

      {report.agent_stats && report.agent_stats.length > 0 && (
        <>
          <Divider orientation="left" style={{ margin: '8px 0' }}>{t('stats.agentStats')}</Divider>
          <AgentStatsTable data={report.agent_stats} />
        </>
      )}

      {report.benchmark_stats && report.benchmark_stats.length > 0 && (
        <>
          <Divider orientation="left" style={{ margin: '8px 0' }}>{t('stats.benchmarkStats')}</Divider>
          <BenchmarkStatsTable data={report.benchmark_stats} />
        </>
      )}
    </Space>
  );
}

// --- Shared Tables ---

function AgentStatsTable({ data }: { data: AgentStats[] }) {
  const { t } = useTranslation('analyzer');
  return (
    <Table<AgentStats> rowKey="agent_id" size="small" dataSource={data} pagination={false}
      columns={[
        { title: 'Agent', dataIndex: 'agent_name', key: 'name', ellipsis: true },
        { title: t('stats.execCount'), dataIndex: 'exec_count', key: 'ec', width: 70 },
        { title: t('stats.avgDuration'), dataIndex: 'avg_duration_ms', key: 'ad', width: 90, render: (v: number) => v ? `${(v / 1000).toFixed(1)}s` : '-' },
        { title: t('stats.passRate'), dataIndex: 'pass_rate', key: 'pr', width: 80, render: (v: number) => `${(v * 100).toFixed(1)}%` },
        { title: t('stats.avgTokens'), dataIndex: 'avg_tokens', key: 'at', width: 100 },
      ]} />
  );
}

function BenchmarkStatsTable({ data }: { data: BenchmarkStats[] }) {
  const { t } = useTranslation('analyzer');
  return (
    <Table<BenchmarkStats> rowKey="benchmark_id" size="small" dataSource={data} pagination={false}
      columns={[
        { title: 'Benchmark', dataIndex: 'benchmark_name', key: 'name', ellipsis: true },
        { title: t('stats.execCount'), dataIndex: 'exec_count', key: 'ec', width: 70 },
        { title: t('stats.avgDuration'), dataIndex: 'avg_duration_ms', key: 'ad', width: 90, render: (v: number) => v ? `${(v / 1000).toFixed(1)}s` : '-' },
        { title: t('stats.passRate'), dataIndex: 'pass_rate', key: 'pr', width: 80, render: (v: number) => `${(v * 100).toFixed(1)}%` },
      ]} />
  );
}
