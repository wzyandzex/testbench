import {
  BarChartOutlined,
  CalculatorOutlined,
  DollarOutlined,
  LineChartOutlined,
  PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Empty,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { lazy, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import type { FormInstance } from 'antd';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import i18n from '@/i18n';
import { PageHeader } from '@/components/common/PageHeader';
import {
  costService,
  formatCost,
  formatTokens,
  getPriorityColor,
  getPriorityText,
  getTipPriority,
} from '@/services/cost';
import { useIsDark, useThemeTokens } from '@/theme';
import type {
  CalculateCostResponse,
  CostQueryParams,
  CostTimeRange,
  ModelCost,
} from '@/types/cost';
import { useCostStore } from './store';

const ReactECharts = lazy(() => import('echarts-for-react'));

type ModelCostFormValues = {
  provider: string;
  model_name: string;
  input_price: number;
  output_price: number;
  currency: string;
  is_active?: boolean;
};

type EstimatorFormValues = {
  provider: string;
  model_name: string;
  input_tokens: number;
  output_tokens: number;
  currency: string;
};

const timeRangeOptions: Array<{ label: string; value: CostTimeRange }> = [
  { label: 'timeRange.today', value: 'today' },
  { label: 'timeRange.week', value: 'week' },
  { label: 'timeRange.month', value: 'month' },
];

const periodOptions: Array<{ label: string; value: CostQueryParams['period'] }> = [
  { label: 'granularity.day', value: 'day' },
  { label: 'granularity.week', value: 'week' },
  { label: 'granularity.month', value: 'month' },
];

const chartFallback = (
  <div style={{ height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
    <Spin tip={i18n.t('cost:trend.loading')} />
  </div>
);

export default function CostPage() {
  const { t } = useTranslation('cost');
  const tokens = useThemeTokens();
  const isDark = useIsDark();
  const statistics = useCostStore((state) => state.statistics);
  const summary = useCostStore((state) => state.summary);
  const modelCosts = useCostStore((state) => state.modelCosts);
  const optimizationTips = useCostStore((state) => state.optimizationTips);
  const queryParams = useCostStore((state) => state.queryParams);
  const loading = useCostStore((state) => state.loading);
  const modelCostSaving = useCostStore((state) => state.modelCostSaving);
  const error = useCostStore((state) => state.error);
  const setQueryParams = useCostStore((state) => state.setQueryParams);
  const clearError = useCostStore((state) => state.clearError);
  const refreshAll = useCostStore((state) => state.refreshAll);
  const createModelCost = useCostStore((state) => state.createModelCost);
  const updateModelCost = useCostStore((state) => state.updateModelCost);
  const deleteModelCost = useCostStore((state) => state.deleteModelCost);

  const [modelCostModalOpen, setModelCostModalOpen] = useState(false);
  const [editingModelCost, setEditingModelCost] = useState<ModelCost | null>(null);
  const [estimation, setEstimation] = useState<CalculateCostResponse | null>(null);

  const [modelCostForm] = Form.useForm<ModelCostFormValues>();
  const [estimatorForm] = Form.useForm<EstimatorFormValues>();

  useEffect(() => {
    refreshAll().catch(() => undefined);
  }, [refreshAll, queryParams.period, queryParams.timeRange]);

  const cardStyle = useMemo(
    () => ({
      background: tokens.bg.elevated,
      border: `1px solid ${tokens.border.default}`,
      borderRadius: 24,
      boxShadow: isDark ? '0 16px 48px rgba(0,0,0,0.28)' : '0 14px 40px rgba(15,23,42,0.08)',
    }),
    [isDark, tokens]
  );

  const currency = summary?.currency || statistics?.currency || 'USD';
  const overviewItems = useMemo(
    () => [
      {
        title: t('stats.totalCost'),
        value: formatCost(summary?.total_cost ?? statistics?.total_cost ?? 0, currency),
        icon: <DollarOutlined />,
      },
      {
        title: t('stats.totalTokens'),
        value: formatTokens(summary?.total_tokens ?? statistics?.total_tokens ?? 0),
        icon: <BarChartOutlined />,
      },
      {
        title: t('stats.execCount'),
        value: (summary?.execution_count ?? statistics?.execution_count ?? 0).toLocaleString(),
        icon: <LineChartOutlined />,
      },
      {
        title: t('stats.avgCost'),
        value: formatCost(summary?.avg_cost_per_exec ?? statistics?.avg_cost_per_exec ?? 0, currency),
        icon: <CalculatorOutlined />,
      },
    ],
    [currency, statistics, summary]
  );

  const trendOption = useMemo(() => {
    const trend = statistics?.trend_data ?? [];
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      grid: { left: 36, right: 16, top: 24, bottom: 28 },
      xAxis: {
        type: 'category',
        data: trend.map((item) => dayjs(item.date).format('MM-DD')),
        axisLabel: { color: tokens.text.secondary },
      },
      yAxis: {
        type: 'value',
        axisLabel: { color: tokens.text.secondary },
        splitLine: { lineStyle: { color: tokens.border.default, type: 'dashed' } },
      },
      series: [
        {
          type: 'line',
          smooth: true,
          data: trend.map((item) => item.cost),
          lineStyle: { color: tokens.brand.primary, width: 3 },
          itemStyle: { color: tokens.brand.primary },
          areaStyle: {
            color: isDark ? 'rgba(102, 126, 234, 0.20)' : 'rgba(102, 126, 234, 0.14)',
          },
        },
      ],
    };
  }, [isDark, statistics?.trend_data, tokens]);

  const modelChartOption = useMemo(() => {
    const rows = statistics?.by_model ?? [];
    return {
      backgroundColor: 'transparent',
      tooltip: { trigger: 'axis' },
      grid: { left: 120, right: 20, top: 20, bottom: 20 },
      xAxis: {
        type: 'value',
        axisLabel: { color: tokens.text.secondary },
        splitLine: { lineStyle: { color: tokens.border.default, type: 'dashed' } },
      },
      yAxis: {
        type: 'category',
        data: rows.map((item) => `${item.provider} / ${item.model_name}`),
        axisLabel: { color: tokens.text.secondary, width: 110, overflow: 'truncate' },
      },
      series: [
        {
          type: 'bar',
          data: rows.map((item) => item.total_cost),
          itemStyle: {
            color: isDark ? '#f59e0b' : '#d97706',
            borderRadius: [0, 8, 8, 0],
          },
        },
      ],
    };
  }, [isDark, statistics?.by_model, tokens]);

  const handleRefresh = useCallback(() => {
    refreshAll()
      .then(() => message.success(t('refreshed')))
      .catch(() => undefined);
  }, [refreshAll]);

  const handleOpenCreate = useCallback(() => {
    setEditingModelCost(null);
    modelCostForm.resetFields();
    modelCostForm.setFieldsValue({ currency: 'USD' });
    setModelCostModalOpen(true);
  }, [modelCostForm]);

  const handleOpenEdit = useCallback(
    (record: ModelCost) => {
      setEditingModelCost(record);
      modelCostForm.setFieldsValue({
        provider: record.provider,
        model_name: record.model_name,
        input_price: record.input_price,
        output_price: record.output_price,
        currency: record.currency,
        is_active: record.is_active,
      });
      setModelCostModalOpen(true);
    },
    [modelCostForm]
  );

  const handleSaveModelCost = useCallback(async () => {
    const values = await modelCostForm.validateFields();
    try {
      if (editingModelCost) {
        await updateModelCost(editingModelCost.id, {
          input_price: values.input_price,
          output_price: values.output_price,
          currency: values.currency,
          is_active: values.is_active,
        });
        message.success(t('pricing.updated'));
      } else {
        await createModelCost({
          provider: values.provider,
          model_name: values.model_name,
          input_price: values.input_price,
          output_price: values.output_price,
          currency: values.currency,
        });
        message.success(t('pricing.created'));
      }
      setModelCostModalOpen(false);
      modelCostForm.resetFields();
      setEditingModelCost(null);
    } catch {
      // handled by api layer
    }
  }, [createModelCost, editingModelCost, modelCostForm, updateModelCost]);

  const handleDeleteModelCost = useCallback(
    (record: ModelCost) => {
      Modal.confirm({
        title: t('pricing.deleteTitle'),
        content: t('pricing.deleteConfirm', { provider: record.provider, model: record.model_name }),
        okText: t('pricing.deleteOk'),
        okButtonProps: { danger: true },
        cancelText: t('common:actions.cancel'),
        onOk: async () => {
          await deleteModelCost(record.id);
          message.success(t('pricing.deleted'));
        },
      });
    },
    [deleteModelCost]
  );

  const handleEstimate = useCallback(async () => {
    const values = await estimatorForm.validateFields();
    try {
      const result = await costService.calculateCost(values);
      setEstimation(result);
      message.success(t('estimate.success'));
    } catch {
      // handled by api layer
    }
  }, [estimatorForm]);

  const modelColumns = [
    {
      title: 'Provider',
      dataIndex: 'provider',
      key: 'provider',
    },
    {
      title: 'Model',
      dataIndex: 'model_name',
      key: 'model_name',
    },
    {
      title: t('pricing.inputPrice'),
      dataIndex: 'input_price',
      key: 'input_price',
      render: (value: number, record: ModelCost) => formatCost(value, record.currency),
    },
    {
      title: t('pricing.outputPrice'),
      dataIndex: 'output_price',
      key: 'output_price',
      render: (value: number, record: ModelCost) => formatCost(value, record.currency),
    },
    {
      title: t('pricing.status'),
      dataIndex: 'is_active',
      key: 'is_active',
      render: (value: boolean) => <Tag color={value ? 'green' : 'default'}>{value ? t('pricing.enabled') : t('pricing.disabled')}</Tag>,
    },
    {
      title: t('pricing.effectiveDate'),
      dataIndex: 'effective_date',
      key: 'effective_date',
      render: (value: string) => dayjs(value).format('YYYY-MM-DD'),
    },
    {
      title: t('pricing.action'),
      key: 'actions',
      render: (_: unknown, record: ModelCost) => (
        <Space size={8}>
          <Button size="small" onClick={() => handleOpenEdit(record)}>
            {t('common:actions.edit')}
          </Button>
          <Button size="small" danger onClick={() => handleDeleteModelCost(record)}>
            {t('common:actions.delete')}
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ maxWidth: 1280, margin: '0 auto', padding: '24px 24px 40px' }}>
      <PageHeader
        title={t('title')}
        description={t('description')}
        extra={
          <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={loading}>
            {t('common:actions.refresh')}
          </Button>
        }
      />

      {error ? (
        <Alert
          type="error"
          closable
          message={error}
          onClose={clearError}
          style={{ marginBottom: 20 }}
        />
      ) : null}

      <Card bordered={false} style={{ ...cardStyle, marginBottom: 20 }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} md={8} lg={6}>
            <Typography.Text type="secondary">{t('timeRange.label')}</Typography.Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={queryParams.timeRange}
              options={timeRangeOptions.map(o => ({ ...o, label: t(o.label) }))}
              onChange={(value) => setQueryParams({ timeRange: value })}
            />
          </Col>
          <Col xs={24} md={8} lg={6}>
            <Typography.Text type="secondary">{t('granularity.label')}</Typography.Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={queryParams.period}
              options={periodOptions.map(o => ({ ...o, label: t(o.label) }))}
              onChange={(value) => setQueryParams({ period: value })}
            />
          </Col>
          <Col xs={24} md={8} lg={12}>
            <Alert
              type="info"
              showIcon
              message={t('dimensionNotice')}
              description={t('dimensionNoticeDesc')}
            />
          </Col>
        </Row>
      </Card>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {overviewItems.map((item) => (
          <Col xs={24} sm={12} xl={6} key={item.title}>
            <Card bordered={false} style={cardStyle}>
              <Statistic
                title={item.title}
                value={item.value}
                prefix={item.icon}
                valueStyle={{ color: tokens.text.primary, fontSize: 24 }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} xl={16}>
          <Card
            bordered={false}
            title={t('trend.title')}
            extra={<Tag color="blue">{statistics?.period || 'day'}</Tag>}
            style={cardStyle}
          >
            {statistics?.trend_data?.length ? (
              <Suspense fallback={chartFallback}>
                <ReactECharts option={trendOption} style={{ height: 320 }} />
              </Suspense>
            ) : (
              <Empty description={t('trend.noData')} />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={8}>
          <Card bordered={false} title={t('optimization.title')} style={cardStyle}>
            {optimizationTips.length ? (
              <Space direction="vertical" size={14} style={{ width: '100%' }}>
                {optimizationTips.map((tip, index) => {
                  const priority = getTipPriority(tip);
                  return (
                    <div
                      key={`${tip.title}-${index}`}
                      style={{
                        padding: 14,
                        borderRadius: 18,
                        border: `1px solid ${tokens.border.default}`,
                        background: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(248,250,252,0.9)',
                      }}
                    >
                      <Space style={{ marginBottom: 8 }} wrap>
                        <Tag color={getPriorityColor(priority)}>{getPriorityText(priority)}</Tag>
                        <Tag>{tip.type}</Tag>
                        {tip.potential_savings ? (
                          <Tag color="green">{t('optimization.canSave')} {formatCost(tip.potential_savings, currency)}</Tag>
                        ) : null}
                      </Space>
                      <Typography.Text strong>{tip.title}</Typography.Text>
                      <Typography.Paragraph style={{ margin: '8px 0 0' }}>
                        {tip.description}
                      </Typography.Paragraph>
                      <Typography.Text type="secondary">{tip.suggestion}</Typography.Text>
                    </div>
                  );
                })}
              </Space>
            ) : (
              <Empty description={t('optimization.noData')} />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={24} xl={12}>
          <Card bordered={false} title={t('modelDistribution.title')} style={cardStyle}>
            {statistics?.by_model?.length ? (
              <Suspense fallback={chartFallback}>
                <ReactECharts option={modelChartOption} style={{ height: 320 }} />
              </Suspense>
            ) : (
              <Empty description={t('modelDistribution.noData')} />
            )}
          </Card>
        </Col>
        <Col xs={24} xl={12}>
          <Card bordered={false} title={t('benchmarkRanking.title')} style={cardStyle}>
            {statistics?.by_benchmark?.length ? (
              <Table
                rowKey="benchmark_id"
                pagination={false}
                dataSource={statistics.by_benchmark}
                columns={[
                  {
                    title: 'Benchmark',
                    dataIndex: 'benchmark_name',
                    key: 'benchmark_name',
                    render: (value: string | undefined, record: { benchmark_id: string }) =>
                      value || record.benchmark_id,
                  },
                  {
                    title: t('benchmarkRanking.totalCost'),
                    dataIndex: 'total_cost',
                    key: 'total_cost',
                    render: (value: number) => formatCost(value, currency),
                  },
                  {
                    title: t('benchmarkRanking.totalTokens'),
                    dataIndex: 'total_tokens',
                    key: 'total_tokens',
                    render: (value: number) => formatTokens(value),
                  },
                  {
                    title: t('benchmarkRanking.execCount'),
                    dataIndex: 'execution_count',
                    key: 'execution_count',
                  },
                ]}
              />
            ) : (
              <Empty description={t('benchmarkRanking.noData')} />
            )}
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} xl={14}>
          <Card
            bordered={false}
            title={t('pricing.title')}
            extra={
              <Button type="primary" icon={<PlusOutlined />} onClick={handleOpenCreate}>
                {t('common:actions.create')}
              </Button>
            }
            style={cardStyle}
          >
            <Table
              rowKey="id"
              dataSource={modelCosts}
              columns={modelColumns}
              loading={loading || modelCostSaving}
              pagination={{ pageSize: 6 }}
              locale={{ emptyText: t('pricing.noData') }}
            />
          </Card>
        </Col>
        <Col xs={24} xl={10}>
          <Card bordered={false} title={t('estimate.title')} style={cardStyle}>
            <Form form={estimatorForm} layout="vertical">
              <Form.Item name="provider" label="Provider" rules={[{ required: true, message: t('pricing.providerRequired') }]}>
                <Input placeholder={t('pricing.providerPlaceholder')} />
              </Form.Item>
              <Form.Item name="model_name" label="Model" rules={[{ required: true, message: t('pricing.modelRequired') }]}>
                <Input placeholder={t('pricing.modelPlaceholder')} />
              </Form.Item>
              <Row gutter={12}>
                <Col span={12}>
                  <Form.Item
                    name="input_tokens"
                    label={t('estimate.inputTokens')}
                    rules={[{ required: true, message: t('estimate.inputTokensRequired') }]}
                  >
                    <InputNumber min={0} precision={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={12}>
                  <Form.Item
                    name="output_tokens"
                    label={t('estimate.outputTokens')}
                    rules={[{ required: true, message: t('estimate.outputTokensRequired') }]}
                  >
                    <InputNumber min={0} precision={0} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item name="currency" label="Currency" initialValue="USD">
                <Input />
              </Form.Item>
              <Button type="primary" icon={<CalculatorOutlined />} onClick={handleEstimate}>
                {t('common:actions.calculate')}
              </Button>
            </Form>

            <div style={{ marginTop: 20 }}>
              {estimation ? (
                <Space direction="vertical" size={12} style={{ width: '100%' }}>
                  <Statistic
                    title={t('estimate.estimatedCost')}
                    value={formatCost(estimation.total_cost, estimation.currency)}
                  />
                  <Alert
                    type="success"
                    showIcon
                    message={`Total tokens: ${formatTokens(estimation.total_tokens)}`}
                    description={`${estimation.provider} / ${estimation.model_name}`}
                  />
                </Space>
              ) : (
                <Empty description={t('estimate.hint')} />
              )}
            </div>
          </Card>
        </Col>
      </Row>

      <ModelCostModal
        open={modelCostModalOpen}
        form={modelCostForm}
        editingModelCost={editingModelCost}
        saving={modelCostSaving}
        onCancel={() => {
          setModelCostModalOpen(false);
          setEditingModelCost(null);
          modelCostForm.resetFields();
        }}
        onSubmit={handleSaveModelCost}
      />
    </div>
  );
}

type ModelCostModalProps = {
  open: boolean;
  form: FormInstance<ModelCostFormValues>;
  editingModelCost: ModelCost | null;
  saving: boolean;
  onCancel: () => void;
  onSubmit: () => void;
};

function ModelCostModal({
  open,
  form,
  editingModelCost,
  saving,
  onCancel,
  onSubmit,
}: ModelCostModalProps) {
  const { t } = useTranslation('cost');
  const isEditing = Boolean(editingModelCost);

  return (
    <Modal
      open={open}
      title={isEditing ? t('pricing.editTitle') : t('pricing.createTitle')}
      onCancel={onCancel}
      onOk={onSubmit}
      okText={isEditing ? t('pricing.editOk') : t('pricing.createOk')}
      cancelText={t('common:actions.cancel')}
      confirmLoading={saving}
      destroyOnHidden
    >
      <div style={{ marginTop: 16 }}>
        <Alert
          type="info"
          showIcon
          message={isEditing ? t('pricing.editHint') : t('pricing.createHint')}
          style={{ marginBottom: 16 }}
        />
        <Form form={form} layout="vertical">
          <Form.Item name="provider" label="Provider" rules={[{ required: true, message: t('pricing.providerRequired') }]}>
            <Input disabled={isEditing} placeholder={t('pricing.providerPlaceholder')} />
          </Form.Item>
          <Form.Item name="model_name" label="Model" rules={[{ required: true, message: t('pricing.modelRequired') }]}>
            <Input disabled={isEditing} placeholder={t('pricing.modelPlaceholder')} />
          </Form.Item>
          <Row gutter={12}>
            <Col span={12}>
              <Form.Item
                name="input_price"
                label={t('pricing.inputPrice')}
                rules={[{ required: true, message: t('pricing.inputPriceRequired') }]}
              >
                <InputNumber min={0} precision={6} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="output_price"
                label={t('pricing.outputPrice')}
                rules={[{ required: true, message: t('pricing.outputPriceRequired') }]}
              >
                <InputNumber min={0} precision={6} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="currency" label="Currency" rules={[{ required: true, message: t('pricing.currencyRequired') }]}>
            <Input placeholder="USD" />
          </Form.Item>
          {isEditing ? (
            <Form.Item name="is_active" label={t('pricing.status')}>
              <Select
                options={[
                  { label: t('pricing.enabled'), value: true },
                  { label: t('pricing.disabled'), value: false },
                ]}
              />
            </Form.Item>
          ) : null}
        </Form>
      </div>
    </Modal>
  );
}
