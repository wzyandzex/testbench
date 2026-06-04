import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Button,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Divider,
  Drawer,
  Empty,
  Form,
  Input,
  InputNumber,
  List,
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
import {
  BarChartOutlined,
  FileSearchOutlined,
  ReloadOutlined,
  RetweetOutlined,
  RobotOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import dayjs, { type Dayjs } from 'dayjs';
import { useAuthStore } from '@/stores/authStore';
import { useEchartsTheme, useThemeTokens } from '@/theme';
import { formatDurationMs, formatMetricScore, metricsPageService } from './service';
import { useMetricsPageStore } from './store';
import type { MetricsListParams, MetricsOrderBy, MetricsRecord } from '@/types/metrics';

const { RangePicker } = DatePicker;
const { Paragraph, Text, Title } = Typography;

const defaultFilters: MetricsListParams = {
  page: 1,
  page_size: 20,
  order_by: 'created_at',
  order_dir: 'desc',
};

const orderOptionValues: MetricsOrderBy[] = [
  'created_at',
  'updated_at',
  'score',
  'func_score',
  'eff_score',
  'qual_score',
  'stab_score',
  'reas_score',
];

const orderOptionLabelKeys: Partial<Record<MetricsOrderBy, string>> = {
  created_at: 'sort.createdAt',
  updated_at: 'sort.updatedAt',
  score: 'sort.score',
  func_score: 'sort.funcScore',
  eff_score: 'sort.effScore',
  qual_score: 'sort.qualScore',
  stab_score: 'sort.stabScore',
  reas_score: 'sort.reasScore',
};

const severityColorMap: Record<string, string> = {
  high: 'red',
  medium: 'orange',
  low: 'blue',
};

const metricsWorkbenchCSS = `
  [data-theme='dark'] .metrics-workbench {
    --metrics-bg: #0a0a0a;
    --metrics-panel: rgba(26, 26, 26, 0.8);
    --metrics-panel-strong: rgba(26, 26, 26, 0.92);
    --metrics-panel-muted: rgba(255, 255, 255, 0.05);
    --metrics-border: rgba(255, 255, 255, 0.08);
    --metrics-border-hover: rgba(102, 126, 234, 0.3);
    --metrics-ink: rgba(255, 255, 255, 0.95);
    --metrics-muted: rgba(255, 255, 255, 0.65);
    --metrics-soft: rgba(255, 255, 255, 0.45);
    --metrics-accent: #667eea;
    --metrics-accent-soft: rgba(102, 126, 234, 0.15);
    --metrics-sage: #10b981;
    --metrics-shadow: 0 16px 42px rgba(0, 0, 0, 0.28);
    --metrics-shadow-soft: 0 10px 28px rgba(0, 0, 0, 0.22);
  }

  [data-theme='light'] .metrics-workbench {
    --metrics-bg: #ffffff;
    --metrics-panel: #ffffff;
    --metrics-panel-strong: #ffffff;
    --metrics-panel-muted: #f3f4f6;
    --metrics-border: rgba(0, 0, 0, 0.08);
    --metrics-border-hover: rgba(0, 0, 0, 0.12);
    --metrics-ink: #111111;
    --metrics-muted: #666666;
    --metrics-soft: #999999;
    --metrics-accent: #667eea;
    --metrics-accent-soft: rgba(102, 126, 234, 0.1);
    --metrics-sage: #10b981;
    --metrics-shadow: 0 14px 36px rgba(15, 23, 42, 0.08);
    --metrics-shadow-soft: 0 10px 24px rgba(15, 23, 42, 0.06);
  }

  .metrics-workbench {
    min-height: 100%;
    padding: 28px;
    background: var(--metrics-bg);
    color: var(--metrics-ink);
  }

  .metrics-workbench .metrics-hero,
  .metrics-workbench .metrics-card {
    border: 1px solid var(--metrics-border);
    background: var(--metrics-panel);
    box-shadow: var(--metrics-shadow);
  }

  .metrics-workbench .metrics-hero {
    position: relative;
    overflow: hidden;
  }

  .metrics-workbench .metrics-stat-card {
    border: 1px solid var(--metrics-border);
    background: var(--metrics-panel-strong);
    box-shadow: var(--metrics-shadow-soft);
  }

  .metrics-workbench .ant-card,
  .metrics-workbench .ant-table-wrapper,
  .metrics-workbench .ant-table,
  .metrics-workbench .ant-input,
  .metrics-workbench .ant-input-number,
  .metrics-workbench .ant-select-selector,
  .metrics-workbench .ant-picker {
    border-color: var(--metrics-border) !important;
  }

  .metrics-workbench .ant-table-thead > tr > th {
    background: var(--metrics-panel-muted) !important;
    color: var(--metrics-ink) !important;
    font-weight: 600;
  }

  .metrics-workbench .ant-table-tbody > tr > td {
    background: var(--metrics-panel) !important;
    color: var(--metrics-ink) !important;
  }

  .metrics-workbench .ant-table-tbody > tr:hover > td {
    background: var(--metrics-panel-muted) !important;
  }

  .metrics-workbench .ant-card-head {
    border-bottom-color: var(--metrics-border) !important;
  }

  .metrics-workbench .ant-card-head-title,
  .metrics-workbench .ant-statistic-title,
  .metrics-workbench .ant-form-item-label > label {
    color: var(--metrics-muted) !important;
  }

  .metrics-workbench .ant-statistic-content,
  .metrics-workbench .ant-list-item,
  .metrics-workbench .ant-typography {
    color: var(--metrics-ink);
  }

  .metrics-workbench .ant-input,
  .metrics-workbench .ant-input-number,
  .metrics-workbench .ant-input-number-input,
  .metrics-workbench .ant-select-selector,
  .metrics-workbench .ant-picker {
    background: var(--metrics-panel-strong) !important;
    color: var(--metrics-ink) !important;
  }

  .metrics-workbench .ant-input::placeholder,
  .metrics-workbench .ant-input-number-input::placeholder {
    color: var(--metrics-soft) !important;
  }
`;

function toPercent(score?: number | null) {
  if (score === undefined || score === null) {
    return 0;
  }
  return Number((score * 100).toFixed(1));
}

function buildFilterValues(filters: MetricsListParams) {
  return {
    execution_id: filters.execution_id,
    benchmark_id: filters.benchmark_id,
    agent_id: filters.agent_id,
    min_score: filters.min_score,
    max_score: filters.max_score,
    date_range:
      filters.created_after && filters.created_before
        ? [dayjs(filters.created_after), dayjs(filters.created_before)]
        : undefined,
    order_by: filters.order_by,
    order_dir: filters.order_dir,
  };
}

export default function MetricsPage() {
  const { t } = useTranslation('metrics');
  const [form] = Form.useForm();
  const user = useAuthStore((state) => state.user);
  const tokens = useThemeTokens();
  const echartsTheme = useEchartsTheme();

  const filters = useMetricsPageStore((state) => state.filters);
  const records = useMetricsPageStore((state) => state.records);
  const ranking = useMetricsPageStore((state) => state.ranking);
  const total = useMetricsPageStore((state) => state.total);
  const loading = useMetricsPageStore((state) => state.loading);
  const rankingLoading = useMetricsPageStore((state) => state.rankingLoading);
  const catalogLoading = useMetricsPageStore((state) => state.catalogLoading);
  const comparisonLoading = useMetricsPageStore((state) => state.comparisonLoading);
  const reportLoading = useMetricsPageStore((state) => state.reportLoading);
  const error = useMetricsPageStore((state) => state.error);
  const catalog = useMetricsPageStore((state) => state.catalog);
  const comparisonDraft = useMetricsPageStore((state) => state.comparisonDraft);
  const comparison = useMetricsPageStore((state) => state.comparison);
  const report = useMetricsPageStore((state) => state.report);
  const reportOpen = useMetricsPageStore((state) => state.reportOpen);

  const loadCatalog = useMetricsPageStore((state) => state.loadCatalog);
  const refresh = useMetricsPageStore((state) => state.refresh);
  const applyFilters = useMetricsPageStore((state) => state.applyFilters);
  const setPage = useMetricsPageStore((state) => state.setPage);
  const setComparisonDraft = useMetricsPageStore((state) => state.setComparisonDraft);
  const setComparisonExecution = useMetricsPageStore((state) => state.useExecutionForComparison);
  const runComparison = useMetricsPageStore((state) => state.runComparison);
  const openReport = useMetricsPageStore((state) => state.openReport);
  const closeReport = useMetricsPageStore((state) => state.closeReport);
  const clearError = useMetricsPageStore((state) => state.clearError);

  const [aggregatePeriod, setAggregatePeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [aggregateRange, setAggregateRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [aggregateSubmitting, setAggregateSubmitting] = useState(false);

  const orderOptions = useMemo(
    () =>
      orderOptionValues.map((value) => {
        const key = orderOptionLabelKeys[value];
        return { value, label: key ? t(key) : value };
      }),
    [t]
  );

  const aggregationOptions = useMemo(
    () => [
      { label: t('aggregation.daily'), value: 'daily' as const },
      { label: t('aggregation.weekly'), value: 'weekly' as const },
      { label: t('aggregation.monthly'), value: 'monthly' as const },
    ],
    [t]
  );

  useEffect(() => {
    form.setFieldsValue(buildFilterValues(filters));
  }, [filters, form]);

  useEffect(() => {
    void loadCatalog();
    void refresh();
  }, [loadCatalog, refresh]);

  const rankingLeader = ranking[0];

  const currentPageAverage = useMemo(() => {
    if (!records.length) {
      return 0;
    }
    return records.reduce((sum, record) => sum + record.score, 0) / records.length;
  }, [records]);

  const currentPageAverageDuration = useMemo(() => {
    if (!records.length) {
      return 0;
    }
    return Math.round(
      records.reduce((sum, record) => sum + (record.efficiency.total_duration || 0), 0) / records.length
    );
  }, [records]);

  const rankingChartOption = useMemo(() => {
    const topItems = ranking.slice(0, 8);
    return {
      grid: { left: 16, right: 24, top: 24, bottom: 12, containLabel: true },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'value',
        max: 100,
        axisLabel: { formatter: '{value}%', color: tokens.text.secondary },
        splitLine: { lineStyle: { color: tokens.border.default } },
      },
      yAxis: {
        type: 'category',
        data: topItems.map((item) => catalog.agentNameMap[item.agent_id] || item.agent_id),
        axisLabel: { color: tokens.text.secondary },
      },
      series: [
        {
          type: 'bar',
          data: topItems.map((item) => Number((item.avg_score * 100).toFixed(1))),
          itemStyle: {
            color: tokens.brand.primary,
            borderRadius: [0, 8, 8, 0],
          },
          barWidth: 18,
          label: {
            show: true,
            position: 'right',
            formatter: '{c}%',
          },
        },
      ],
    };
  }, [catalog.agentNameMap, ranking, tokens]);

  const scoreDistributionOption = useMemo(() => {
    const bins = [0, 0, 0, 0, 0];
    for (const record of records) {
      const score = toPercent(record.score);
      if (score < 20) bins[0] += 1;
      else if (score < 40) bins[1] += 1;
      else if (score < 60) bins[2] += 1;
      else if (score < 80) bins[3] += 1;
      else bins[4] += 1;
    }

    return {
      grid: { left: 12, right: 12, top: 24, bottom: 24, containLabel: true },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'category',
        data: ['0-20', '20-40', '40-60', '60-80', '80-100'],
        axisLabel: { color: tokens.text.secondary },
      },
      yAxis: {
        type: 'value',
        minInterval: 1,
        axisLabel: { color: tokens.text.secondary },
        splitLine: { lineStyle: { color: tokens.border.default } },
      },
      series: [
        {
          type: 'bar',
          data: bins,
          itemStyle: {
            color: tokens.status.warning,
            borderRadius: [8, 8, 0, 0],
          },
          barMaxWidth: 42,
        },
      ],
    };
  }, [records, tokens]);

  const columns = [
    {
      title: t('table.executionId'),
      dataIndex: 'execution_id',
      key: 'execution_id',
      width: 220,
      render: (value: string) => (
        <Text copyable style={{ fontWeight: 600 }}>
          {value}
        </Text>
      ),
    },
    {
      title: t('table.benchmark'),
      dataIndex: 'benchmark_id',
      key: 'benchmark_id',
      width: 220,
      render: (value: string) => catalog.benchmarkNameMap[value] || value,
    },
    {
      title: t('table.agent'),
      dataIndex: 'agent_id',
      key: 'agent_id',
      width: 220,
      render: (value: string) => catalog.agentNameMap[value] || value,
    },
    {
      title: t('table.overallScore'),
      dataIndex: 'score',
      key: 'score',
      width: 150,
      render: (value: number) => (
        <Space direction="vertical" size={4} style={{ width: '100%' }}>
          <Text strong>{formatMetricScore(value)}</Text>
          <Progress percent={toPercent(value)} size="small" showInfo={false} strokeColor={tokens.brand.primary} />
        </Space>
      ),
    },
    {
      title: t('table.funcEffQual'),
      key: 'sub_scores',
      width: 220,
      render: (_: unknown, record: MetricsRecord) => (
        <Space size={6} wrap>
          <Tag color="blue">{t('table.tagFunc')} {toPercent(record.func_score)}</Tag>
          <Tag color="gold">{t('table.tagEff')} {toPercent(record.eff_score)}</Tag>
          <Tag color="purple">{t('table.tagQual')} {toPercent(record.qual_score)}</Tag>
        </Space>
      ),
    },
    {
      title: t('table.stabReas'),
      key: 'stability_reasoning',
      width: 160,
      render: (_: unknown, record: MetricsRecord) => (
        <Space size={6} wrap>
          <Tag color="cyan">{t('table.tagStab')} {toPercent(record.stab_score)}</Tag>
          <Tag color="geekblue">{t('table.tagReas')} {toPercent(record.reas_score)}</Tag>
        </Space>
      ),
    },
    {
      title: t('table.totalDuration'),
      key: 'duration',
      width: 140,
      render: (_: unknown, record: MetricsRecord) => formatDurationMs(record.efficiency.total_duration),
    },
    {
      title: t('table.createdAt'),
      dataIndex: 'created_at',
      key: 'created_at',
      width: 180,
      render: (value: string) => dayjs(value).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: t('table.action'),
      key: 'actions',
      width: 230,
      fixed: 'right' as const,
      render: (_: unknown, record: MetricsRecord) => (
        <Space size={4} wrap>
          <Button size="small" onClick={() => setComparisonExecution('reference', record.execution_id)}>
            {t('table.setAsReference')}
          </Button>
          <Button size="small" onClick={() => setComparisonExecution('target', record.execution_id)}>
            {t('table.setAsTarget')}
          </Button>
          <Button size="small" type="link" onClick={() => void openReport(record.execution_id)}>
            {t('table.viewReport')}
          </Button>
        </Space>
      ),
    },
  ];

  const handleSearch = async (values: {
    execution_id?: string;
    benchmark_id?: string;
    agent_id?: string;
    min_score?: number;
    max_score?: number;
    date_range?: [Dayjs, Dayjs];
    order_by?: MetricsOrderBy;
    order_dir?: 'asc' | 'desc';
  }) => {
    const dateRange = values.date_range;
    await applyFilters({
      execution_id: values.execution_id?.trim() || undefined,
      benchmark_id: values.benchmark_id || undefined,
      agent_id: values.agent_id || undefined,
      min_score: values.min_score,
      max_score: values.max_score,
      created_after: dateRange?.[0]?.startOf('day').toISOString(),
      created_before: dateRange?.[1]?.endOf('day').toISOString(),
      order_by: values.order_by || defaultFilters.order_by,
      order_dir: values.order_dir || defaultFilters.order_dir,
      page_size: filters.page_size || defaultFilters.page_size,
    });
  };

  const handleReset = async () => {
    form.resetFields();
    await applyFilters(defaultFilters);
  };

  const handleRefresh = async () => {
    clearError();
    await refresh();
  };

  const handleAggregate = async () => {
    if (!user || user.role !== 'admin') {
      return;
    }

    setAggregateSubmitting(true);
    try {
      await metricsPageService.createAggregated({
        period: aggregatePeriod,
        start_date: aggregateRange?.[0]?.startOf('day').toISOString(),
        end_date: aggregateRange?.[1]?.endOf('day').toISOString(),
      });
      message.success(t('aggregation.submitted'));
    } finally {
      setAggregateSubmitting(false);
    }
  };

  return (
    <div className="metrics-workbench">
      <Card className="metrics-hero" bordered={false} style={{ borderRadius: 28, marginBottom: 24 }}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} lg={15}>
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Tag color="processing" style={{ width: 'fit-content', paddingInline: 12 }}>
                backend-truth metrics workspace
              </Tag>
              <Title
                level={2}
                style={{
                  margin: 0,
                  color: 'var(--metrics-ink)',
                  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
                }}
              >
                {t('hero.title')}
              </Title>
              <Paragraph style={{ margin: 0, color: 'var(--metrics-muted)', maxWidth: 720, fontSize: 15 }}>
                {t('hero.desc1')}
                {t('hero.desc2')}
              </Paragraph>
            </Space>
          </Col>
          <Col xs={24} lg={9}>
            <Card
              className="metrics-card"
              bordered={false}
              style={{ borderRadius: 18, background: 'var(--metrics-panel-strong)' }}
              styles={{ body: { padding: 20 } }}
            >
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <Text strong style={{ color: 'var(--metrics-ink)' }}>
                  {t('hero.aggregationTitle')}
                </Text>
                <Text type="secondary">
                  {t('hero.aggregationDesc')}
                </Text>
                <Select value={aggregatePeriod} onChange={setAggregatePeriod} options={aggregationOptions} />
                <RangePicker value={aggregateRange} onChange={(value) => setAggregateRange(value as [Dayjs, Dayjs] | null)} />
                <Button
                  type="primary"
                  disabled={user?.role !== 'admin'}
                  loading={aggregateSubmitting}
                  onClick={() => void handleAggregate()}
                >
                  {t('hero.submit')}
                </Button>
                {user?.role !== 'admin' ? (
                  <Text type="secondary">{t('hero.adminOnly')}</Text>
                ) : null}
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      {error ? (
        <Alert
          showIcon
          type="warning"
          message={error}
          style={{ marginBottom: 16 }}
          closable
          onClose={clearError}
        />
      ) : null}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} xl={6}>
          <Card className="metrics-stat-card" bordered={false} style={{ borderRadius: 20 }}>
            <Statistic title={t('stats.matchCount')} value={total} prefix={<BarChartOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="metrics-stat-card" bordered={false} style={{ borderRadius: 20 }}>
            <Statistic title={t('stats.pageAvgScore')} value={toPercent(currentPageAverage)} suffix={t('stats.points')} />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="metrics-stat-card" bordered={false} style={{ borderRadius: 20 }}>
            <Statistic
              title={t('stats.rankingTop')}
              value={rankingLeader ? catalog.agentNameMap[rankingLeader.agent_id] || rankingLeader.agent_id : '-'}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} xl={6}>
          <Card className="metrics-stat-card" bordered={false} style={{ borderRadius: 20 }}>
            <Statistic title={t('stats.pageAvgDuration')} value={formatDurationMs(currentPageAverageDuration)} prefix={<RobotOutlined />} />
          </Card>
        </Col>
      </Row>

      <Card className="metrics-card" bordered={false} style={{ borderRadius: 24, marginBottom: 24 }}>
        <Form form={form} layout="vertical" onFinish={(values) => void handleSearch(values)}>
          <Row gutter={[16, 8]}>
            <Col xs={24} md={12} xl={8}>
              <Form.Item label={t('filter.executionId')} name="execution_id">
                <Input placeholder={t('filter.executionIdPlaceholder')} allowClear />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <Form.Item label="Agent" name="agent_id">
                <Select
                  allowClear
                  showSearch
                  loading={catalogLoading}
                  placeholder={t('filter.agentPlaceholder')}
                  optionFilterProp="label"
                  options={catalog.agents.map((item) => ({
                    value: item.value,
                    label: item.label,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={8}>
              <Form.Item label="Benchmark" name="benchmark_id">
                <Select
                  allowClear
                  showSearch
                  loading={catalogLoading}
                  placeholder={t('filter.benchmarkPlaceholder')}
                  optionFilterProp="label"
                  options={catalog.benchmarks.map((item) => ({
                    value: item.value,
                    label: item.label,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Form.Item label={t('filter.minScore')} name="min_score">
                <InputNumber style={{ width: '100%' }} min={0} max={1} step={0.05} placeholder="0 ~ 1" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Form.Item label={t('filter.maxScore')} name="max_score">
                <InputNumber style={{ width: '100%' }} min={0} max={1} step={0.05} placeholder="0 ~ 1" />
              </Form.Item>
            </Col>
            <Col xs={24} md={24} xl={8}>
              <Form.Item label={t('filter.dateRange')} name="date_range">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12} xl={6}>
              <Form.Item label={t('filter.sortField')} name="order_by" initialValue={defaultFilters.order_by}>
                <Select options={orderOptions} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Space wrap>
                <Button type="primary" htmlType="submit" icon={<FileSearchOutlined />} loading={loading}>
                  {t('filter.searchBtn')}
                </Button>
                <Button onClick={() => void handleReset()}>{t('filter.resetBtn')}</Button>
                <Button icon={<ReloadOutlined />} onClick={() => void handleRefresh()}>
                  {t('filter.refreshBtn')}
                </Button>
              </Space>
            </Col>
          </Row>
        </Form>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} xl={14}>
          <Card
            className="metrics-card"
            bordered={false}
            style={{ borderRadius: 24, height: '100%' }}
            title={t('ranking.title')}
            extra={<Text type="secondary">{t('ranking.subtitle')}</Text>}
          >
            {ranking.length ? (
              <>
                <ReactECharts option={rankingChartOption} theme={echartsTheme} style={{ height: 280 }} />
                <List
                  style={{ marginTop: 12 }}
                  dataSource={ranking.slice(0, 5)}
                  renderItem={(item) => (
                    <List.Item>
                      <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                        <Space>
                          <Tag color="green">#{item.rank}</Tag>
                          <Text strong>{catalog.agentNameMap[item.agent_id] || item.agent_id}</Text>
                        </Space>
                        <Space>
                          <Text>{formatMetricScore(item.avg_score)}</Text>
                          <Text type="secondary">{item.total_count} {t('ranking.records')}</Text>
                        </Space>
                      </Space>
                    </List.Item>
                  )}
                />
              </>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={rankingLoading ? t('ranking.loading') : t('ranking.noData')} />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card
            className="metrics-card"
            bordered={false}
            style={{ borderRadius: 24, marginBottom: 16 }}
            title={t('compare.title')}
            extra={<RetweetOutlined />}
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Input
                placeholder={t('compare.refPlaceholder')}
                value={comparisonDraft.reference_id}
                onChange={(event) => setComparisonDraft({ reference_id: event.target.value })}
              />
              <Input
                placeholder={t('compare.targetPlaceholder')}
                value={comparisonDraft.target_id}
                onChange={(event) => setComparisonDraft({ target_id: event.target.value })}
              />
              <Button type="primary" loading={comparisonLoading} onClick={() => void runComparison()}>
                {t('compare.executeBtn')}
              </Button>
              {comparison ? (
                <Space size={[8, 8]} wrap>
                  <Tag color={comparison.diff.score >= 0 ? 'success' : 'error'}>
                    {t('compare.dim.score')} {comparison.diff.score >= 0 ? '+' : ''}
                    {formatMetricScore(Math.abs(comparison.diff.score))}
                  </Tag>
                  <Tag>{t('compare.dim.func')} {comparison.diff.func_score >= 0 ? '+' : ''}{toPercent(comparison.diff.func_score)}</Tag>
                  <Tag>{t('compare.dim.eff')} {comparison.diff.eff_score >= 0 ? '+' : ''}{toPercent(comparison.diff.eff_score)}</Tag>
                  <Tag>{t('compare.dim.qual')} {comparison.diff.qual_score >= 0 ? '+' : ''}{toPercent(comparison.diff.qual_score)}</Tag>
                  <Tag>{t('compare.dim.stab')} {comparison.diff.stab_score >= 0 ? '+' : ''}{toPercent(comparison.diff.stab_score)}</Tag>
                  <Tag>{t('compare.dim.reas')} {comparison.diff.reas_score >= 0 ? '+' : ''}{toPercent(comparison.diff.reas_score)}</Tag>
                </Space>
              ) : (
                <Text type="secondary">{t('compare.placeholder')}</Text>
              )}
            </Space>
          </Card>

          <Card className="metrics-card" bordered={false} style={{ borderRadius: 24 }} title={t('distribution.title')}>
            {records.length ? (
              <ReactECharts option={scoreDistributionOption} theme={echartsTheme} style={{ height: 240 }} />
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('distribution.noRecords')} />
            )}
          </Card>
        </Col>
      </Row>

      <Card
        className="metrics-card"
        bordered={false}
        style={{ borderRadius: 24 }}
        title={t('workbench')}
        extra={
          <Text type="secondary">
            {t('table.rowSummary', { current: records.length, total })}
          </Text>
        }
      >
        <Table
          rowKey={(record) => record.id || record.execution_id}
          loading={loading}
          dataSource={records}
          columns={columns}
          scroll={{ x: 1600 }}
          pagination={{
            current: filters.page || 1,
            pageSize: filters.page_size || 20,
            total,
            showSizeChanger: true,
            pageSizeOptions: ['10', '20', '50', '100'],
            onChange: (page, pageSize) => {
              void setPage(page, pageSize);
            },
          }}
        />
      </Card>

      <Drawer
        title={report ? t('report.titleWithId', { id: report.execution_id }) : t('report.title')}
        open={reportOpen}
        onClose={closeReport}
        width={720}
      >
        {reportLoading ? (
          <Text type="secondary">{t('report.loading')}</Text>
        ) : report ? (
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label={t('report.executionId')}>{report.execution_id}</Descriptions.Item>
              <Descriptions.Item label={t('table.agent')}>
                {catalog.agentNameMap[report.agent_id] || report.agent_id}
              </Descriptions.Item>
              <Descriptions.Item label={t('table.benchmark')}>
                {catalog.benchmarkNameMap[report.benchmark_id] || report.benchmark_id}
              </Descriptions.Item>
              <Descriptions.Item label={t('report.generatedAt')}>
                {dayjs(report.generated_at).format('YYYY-MM-DD HH:mm:ss')}
              </Descriptions.Item>
              <Descriptions.Item label={t('report.overallEval')}>{report.analysis.overall}</Descriptions.Item>
            </Descriptions>

            <Row gutter={[12, 12]}>
              <Col span={12}>
                <Card size="small">
                  <Statistic title={t('report.overallScore')} value={toPercent(report.metrics.score)} suffix={t('stats.points')} />
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small">
                  <Statistic title={t('report.totalDuration')} value={formatDurationMs(report.metrics.efficiency.total_duration)} />
                </Card>
              </Col>
            </Row>

            <Card size="small" title={t('report.dimensionScores')}>
              <Space size={[8, 8]} wrap>
                <Tag color="blue">{t('report.dimFunc')} {toPercent(report.metrics.func_score)}</Tag>
                <Tag color="gold">{t('report.dimEff')} {toPercent(report.metrics.eff_score)}</Tag>
                <Tag color="purple">{t('report.dimQual')} {toPercent(report.metrics.qual_score)}</Tag>
                <Tag color="cyan">{t('report.dimStab')} {toPercent(report.metrics.stab_score)}</Tag>
                <Tag color="geekblue">{t('report.dimReas')} {toPercent(report.metrics.reas_score)}</Tag>
              </Space>
            </Card>

            <Card size="small" title={t('report.strengthsWeaknesses')}>
              <Row gutter={[16, 16]}>
                <Col xs={24} md={12}>
                  <Text strong>{t('report.strengths')}</Text>
                  <List
                    size="small"
                    dataSource={report.analysis.strengths}
                    locale={{ emptyText: t('report.noData') }}
                    renderItem={(item) => <List.Item>{item}</List.Item>}
                  />
                </Col>
                <Col xs={24} md={12}>
                  <Text strong>{t('report.weaknesses')}</Text>
                  <List
                    size="small"
                    dataSource={report.analysis.weaknesses}
                    locale={{ emptyText: t('report.noData') }}
                    renderItem={(item) => <List.Item>{item}</List.Item>}
                  />
                </Col>
              </Row>
            </Card>

            <Card size="small" title={t('report.diagnostics')}>
              <List
                dataSource={report.analysis.diagnostics}
                locale={{ emptyText: t('report.noDiagnostics') }}
                renderItem={(item) => (
                  <List.Item>
                    <Space direction="vertical" size={4} style={{ width: '100%' }}>
                      <Space>
                        <Tag color={severityColorMap[item.severity] || 'default'}>{item.severity || 'info'}</Tag>
                        <Text strong>{item.issue}</Text>
                      </Space>
                      <Text>{item.suggestion || t('report.noSuggestion')}</Text>
                      <Text type="secondary">{t('report.category', { category: item.category })}</Text>
                    </Space>
                  </List.Item>
                )}
              />
              <Divider />
              <Text strong>{t('report.recommendations')}</Text>
              <List
                size="small"
                dataSource={report.recommendations}
                locale={{ emptyText: t('report.noActions') }}
                renderItem={(item) => <List.Item>{item}</List.Item>}
              />
            </Card>
          </Space>
        ) : (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('report.notSelected')} />
        )}
      </Drawer>

      <style>{metricsWorkbenchCSS}</style>
    </div>
  );
}
