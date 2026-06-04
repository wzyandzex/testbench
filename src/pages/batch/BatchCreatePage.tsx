import {
  ArrowLeftOutlined,
  ExperimentOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Radio,
  Row,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common/PageHeader';
import { batchPageService } from './service';
import { useThemeTokens } from '@/theme';
import type {
  BatchAgentReference,
  BatchBenchmarkReference,
  BatchExecutionMode,
  BatchPriority,
  CreateBatchRequest,
} from '@/types/api/batch';
import { BATCH_PRIORITY_CONFIG } from '@/types/api/batch';

type CreateBatchFormValues = {
  name: string;
  description?: string;
  priority: BatchPriority;
  timeoutSeconds: number;
  maxSteps: number;
  temperature: number;
  maxTokens: number;
  executionMode: BatchExecutionMode;
  maxParallel: number;
  stopOnFirstFailure: boolean;
  generateReport: boolean;
};

function toDurationNanoseconds(seconds: number): number {
  return Math.max(1, Math.round(seconds)) * 1_000_000_000;
}

function normalizeAgentName(agent: BatchAgentReference): string {
  return agent.display_name?.trim() || agent.name || agent.id;
}

function normalizeBenchmarkName(item: BatchBenchmarkReference): string {
  return item.display_name?.trim() || item.name || item.id;
}

export default function BatchCreatePage() {
  const navigate = useNavigate();
  const { t } = useTranslation('batch');
  const tokens = useThemeTokens();
  const [form] = Form.useForm<CreateBatchFormValues>();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [agents, setAgents] = useState<BatchAgentReference[]>([]);
  const [benchmarks, setBenchmarks] = useState<BatchBenchmarkReference[]>([]);
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);
  const [selectedBenchmarkIds, setSelectedBenchmarkIds] = useState<string[]>([]);
  const [agentSearch, setAgentSearch] = useState('');
  const [benchmarkSearch, setBenchmarkSearch] = useState('');

  const timeoutPresets = useMemo(() => [
    { label: t('create.timeout30s'), value: 30 },
    { label: t('create.timeout2m'), value: 120 },
    { label: t('create.timeout5m'), value: 300 },
    { label: t('create.timeout15m'), value: 900 },
  ], [t]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [agentList, benchmarkList] = await Promise.all([
          batchPageService.listAgentReferences(),
          batchPageService.listBenchmarkReferences(),
        ]);
        if (cancelled) return;
        setAgents(agentList);
        setBenchmarks(benchmarkList);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : t('list.loadResourcesFailed'));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [t]);

  const filteredAgents = useMemo(() => {
    if (!agentSearch) return agents;
    const q = agentSearch.toLowerCase();
    return agents.filter(
      (a) =>
        normalizeAgentName(a).toLowerCase().includes(q) ||
        a.id.toLowerCase().includes(q) ||
        (a.description || '').toLowerCase().includes(q)
    );
  }, [agents, agentSearch]);

  const filteredBenchmarks = useMemo(() => {
    if (!benchmarkSearch) return benchmarks;
    const q = benchmarkSearch.toLowerCase();
    return benchmarks.filter(
      (b) =>
        normalizeBenchmarkName(b).toLowerCase().includes(q) ||
        b.id.toLowerCase().includes(q) ||
        (b.language || '').toLowerCase().includes(q) ||
        (b.category || '').toLowerCase().includes(q)
    );
  }, [benchmarks, benchmarkSearch]);

  const executionMode = Form.useWatch('executionMode', form);
  const effectiveMaxParallel = useMemo(() => {
    if (executionMode === 'sequential') return 1;
    if (executionMode === 'parallel') return Math.min(50, selectedAgentIds.length * selectedBenchmarkIds.length || 1);
    return Math.min(50, form.getFieldValue('maxParallel') || 5);
  }, [executionMode, selectedAgentIds.length, selectedBenchmarkIds.length, form]);

  const estimatedTasks = selectedAgentIds.length * selectedBenchmarkIds.length;

  const handleSubmit = useCallback(async () => {
    try {
      const values = await form.validateFields();
      if (!selectedAgentIds.length) {
        message.warning(t('create.selectAgent'));
        return;
      }
      if (!selectedBenchmarkIds.length) {
        message.warning(t('create.selectBenchmark'));
        return;
      }
      setSubmitting(true);
      const payload: CreateBatchRequest = {
        name: values.name,
        description: values.description,
        agent_ids: selectedAgentIds,
        benchmark_ids: selectedBenchmarkIds,
        task_config: {
          timeout: toDurationNanoseconds(values.timeoutSeconds),
          max_steps: values.maxSteps,
          priority: values.priority,
        },
        agent_config: {
          temperature: values.temperature,
          max_tokens: values.maxTokens,
        },
        options: {
          parallel: values.executionMode !== 'sequential',
          max_parallel: effectiveMaxParallel,
          stop_on_first_failure: values.stopOnFirstFailure,
          generate_report: values.generateReport,
        },
      };
      const result = await batchPageService.create(payload);
      message.success(t('create.success'));
      navigate(`/batch/${result.id}`);
    } finally {
      setSubmitting(false);
    }
  }, [form, selectedAgentIds, selectedBenchmarkIds, effectiveMaxParallel, navigate, t]);

  const agentColumns = useMemo(() => [
    {
      title: t('table.type'),
      dataIndex: 'type',
      width: 80,
      render: (v: string) => <Tag>{v || 'agent'}</Tag>,
    },
    {
      title: t('table.status'),
      dataIndex: 'status',
      width: 80,
      render: (v: string) => <Tag color={v === 'active' ? 'green' : 'default'}>{v}</Tag>,
    },
  ], [t]);

  const benchmarkColumns = useMemo(() => [
    {
      title: t('table.benchmark'),
      dataIndex: 'name',
      ellipsis: true,
      render: (_: unknown, record: BatchBenchmarkReference) => (
        <span>{normalizeBenchmarkName(record)}</span>
      ),
    },
    {
      title: t('table.language'),
      dataIndex: 'language',
      width: 120,
      render: (v: string, record: BatchBenchmarkReference) => (
        <Space size={4}>
          {v && <Tag>{v}</Tag>}
          {record.category && <Tag color="blue">{record.category}</Tag>}
        </Space>
      ),
    },
    {
      title: t('table.status'),
      dataIndex: 'status',
      width: 80,
      render: (v: string) => <Tag color={v === 'active' ? 'green' : 'default'}>{v}</Tag>,
    },
  ], [t]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <Spin tip={t('create.loadingResources')} />
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <PageHeader
        title={t('create.title')}
        description={t('create.description')}
        extra={
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/batch')}>
            {t('detail.backToList')}
          </Button>
        }
      />

      {error && (
        <Alert type="error" message={error} showIcon closable onClose={() => setError(null)} style={{ marginBottom: 16 }} />
      )}

      <Row gutter={24}>
        <Col xs={24} lg={16}>
          <Card>
            <Form
              form={form}
              layout="vertical"
              initialValues={{
                priority: 'p2',
                timeoutSeconds: 300,
                maxSteps: 50,
                temperature: 0,
                maxTokens: 8192,
                executionMode: 'limited',
                maxParallel: 5,
                stopOnFirstFailure: false,
                generateReport: true,
              }}
            >
              <Row gutter={16}>
                <Col span={16}>
                  <Form.Item
                    label={t('create.batchName')}
                    name="name"
                    rules={[{ required: true, message: t('create.batchNameRequired') }]}
                  >
                    <Input maxLength={255} placeholder={t('create.batchNamePlaceholder')} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label={t('create.priority')} name="priority" rules={[{ required: true }]}>
                    <Select
                      options={Object.entries(BATCH_PRIORITY_CONFIG).map(([value, config]) => ({
                        value,
                        label: `${config.label} ${value === 'p2' ? t('create.recommended') : ''}`,
                      }))}
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Form.Item label={t('create.descriptionLabel')} name="description">
                <Input.TextArea rows={3} maxLength={1000} placeholder={t('create.descriptionPlaceholder')} />
              </Form.Item>

              <Row gutter={16}>
                <Col span={8}>
                  <Form.Item label={t('create.taskTimeout')} name="timeoutSeconds" rules={[{ required: true }]}>
                    <Select options={timeoutPresets} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label={t('create.maxSteps')} name="maxSteps" rules={[{ required: true }]}>
                    <InputNumber min={1} max={200} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
                <Col span={8}>
                  <Form.Item label={t('create.maxTokens')} name="maxTokens" rules={[{ required: true }]}>
                    <InputNumber min={256} max={65536} step={1024} style={{ width: '100%' }} />
                  </Form.Item>
                </Col>
              </Row>

              <Row gutter={16}>
                <Col span={12}>
                  <Form.Item label={t('create.executionMode')} name="executionMode" rules={[{ required: true }]}>
                    <Radio.Group
                      optionType="button"
                      buttonStyle="solid"
                      options={[
                        { label: t('create.sequential'), value: 'sequential' },
                        { label: t('create.parallel'), value: 'parallel' },
                        { label: t('create.limited'), value: 'limited' },
                      ]}
                    />
                  </Form.Item>
                </Col>
                {executionMode === 'limited' && (
                  <Col span={12}>
                    <Form.Item label={t('create.maxParallel')} name="maxParallel" rules={[{ required: true }]}>
                      <InputNumber min={2} max={50} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                )}
              </Row>

              <Divider />

              <Typography.Title level={5}>
                <RobotOutlined /> Agent
              </Typography.Title>
              <Input.Search
                allowClear
                placeholder={t('create.searchAgent')}
                value={agentSearch}
                onChange={(e) => setAgentSearch(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <Table
                rowKey="id"
                size="small"
                dataSource={filteredAgents}
                columns={agentColumns}
                pagination={false}
                scroll={{ y: 200 }}
                rowSelection={{
                  selectedRowKeys: selectedAgentIds,
                  onChange: (keys) => setSelectedAgentIds(keys as string[]),
                }}
              />

              <Divider />

              <Typography.Title level={5}>
                <ExperimentOutlined /> Benchmark
              </Typography.Title>
              <Input.Search
                allowClear
                placeholder={t('create.searchBenchmark')}
                value={benchmarkSearch}
                onChange={(e) => setBenchmarkSearch(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <Table
                rowKey="id"
                size="small"
                dataSource={filteredBenchmarks}
                columns={benchmarkColumns}
                pagination={false}
                scroll={{ y: 200 }}
                rowSelection={{
                  selectedRowKeys: selectedBenchmarkIds,
                  onChange: (keys) => setSelectedBenchmarkIds(keys as string[]),
                }}
              />
            </Form>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card style={{ position: 'sticky', top: 80 }}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Alert
                type="info"
                showIcon
                message={t('detail.backendBehavior')}
                description={t('detail.backendBehaviorDesc')}
              />
              <div>
                <Typography.Text type="secondary">{t('create.estimatedSubtasks')}</Typography.Text>
                <Typography.Title level={2} style={{ marginTop: 6, marginBottom: 0, color: tokens.brand.primary }}>
                  {estimatedTasks}
                </Typography.Title>
                <Typography.Text type="secondary">
                  {t('create.agentCount', { count: selectedAgentIds.length, benchmarkCount: selectedBenchmarkIds.length })}
                </Typography.Text>
              </div>
              <div>
                <Typography.Text type="secondary">{t('create.actualMaxParallel')}</Typography.Text>
                <div style={{ marginTop: 6 }}>
                  <Tag color="blue">{effectiveMaxParallel}</Tag>
                  <Typography.Text type="secondary">
                    {t('create.maxParallelNote')}
                  </Typography.Text>
                </div>
              </div>
              <Divider style={{ margin: 0 }} />
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Button type="primary" size="large" block loading={submitting} onClick={handleSubmit}>
                  {t('create.submitAndView')}
                </Button>
                <Button block onClick={() => navigate('/batch')}>
                  {t('common:actions.cancel')}
                </Button>
              </Space>
            </Space>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
