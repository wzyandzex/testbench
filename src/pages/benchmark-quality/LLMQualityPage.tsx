/**
 * LLM Quality 检查页面
 * Slice: S12
 *
 * 功能: 触发 LLM 质量检查 / Job 列表 / 汇总统计 / 取消/重试
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, Typography, Tag, Button, Space, Table, Statistic, Row, Col,
  Breadcrumb, Input, Select, message, Modal, Switch, Radio, InputNumber, Form,
} from 'antd';
import {
  HomeOutlined, ExperimentOutlined, PlayCircleOutlined,
  StopOutlined, ReloadOutlined, FileSearchOutlined,
} from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { benchmarkService } from '@/services/benchmark';
import { useBenchmarkUpdates } from '@/hooks/useWebSocket';
import type {
  BenchmarkLLMQualityJob,
  LLMQualityJobSummary,
  LLMQualityCapabilities,
  LLMQualityJobStatus,
} from '@/types/api/benchmark';
import { LLM_QUALITY_JOB_STATUS_CONFIG } from '@/types/api/benchmark';
import type { PaginatedResponse } from '@/types';

const { Title, Text } = Typography;

export default function LLMQualityPage() {
  const { t } = useTranslation('governance');
  const { id: benchmarkId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // ============ Capabilities ============
  const [capabilities, setCapabilities] = useState<LLMQualityCapabilities | null>(null);

  useEffect(() => {
    benchmarkService.getLLMQualityCapabilities()
      .then((res) => setCapabilities((res as unknown) as LLMQualityCapabilities))
      .catch(() => { /* ignore, form will be limited */ });
  }, []);

  // ============ Summary ============
  const [summary, setSummary] = useState<LLMQualityJobSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    if (!benchmarkId) return;
    setSummaryLoading(true);
    try {
      const res = await benchmarkService.getLLMQualityJobSummary(benchmarkId);
      setSummary((res as unknown) as LLMQualityJobSummary);
    } catch {
      // ignore
    } finally {
      setSummaryLoading(false);
    }
  }, [benchmarkId]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  // ============ Job List ============
  const [jobs, setJobs] = useState<BenchmarkLLMQualityJob[]>([]);
  const [jobTotal, setJobTotal] = useState(0);
  const [jobPage, setJobPage] = useState(1);
  const [jobLoading, setJobLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchJobs = useCallback(async (page: number) => {
    if (!benchmarkId) return;
    setJobLoading(true);
    try {
      const res = await benchmarkService.listLLMQualityJobs(benchmarkId, {
        page,
        page_size: 20,
        status: statusFilter || undefined,
      });
      const pd = (res as unknown) as PaginatedResponse<BenchmarkLLMQualityJob>;
      setJobs(pd.data ?? []);
      setJobTotal(pd.total ?? 0);
      setJobPage(page);
    } catch {
      message.error(t('llmQuality.messages.fetchJobsFailed'));
    } finally {
      setJobLoading(false);
    }
  }, [benchmarkId, statusFilter]);

  useEffect(() => { fetchJobs(1); }, [fetchJobs]);

  // Polling: 5s when pending/processing jobs exist
  useEffect(() => {
    const hasRunning = jobs.some((j) => j.status === 'pending' || j.status === 'processing');
    if (hasRunning) {
      if (!pollRef.current) {
        pollRef.current = setInterval(() => {
          fetchJobs(jobPage);
          fetchSummary();
        }, 30000);
      }
    } else if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [jobs, jobPage, fetchJobs, fetchSummary]);

  // WebSocket: instant refresh on benchmark update events
  useBenchmarkUpdates(
    benchmarkId || '',
    () => { fetchJobs(jobPage); fetchSummary(); },
    !!benchmarkId
  );

  // ============ Trigger Modal ============
  const [triggerModalVisible, setTriggerModalVisible] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [form] = Form.useForm();

  const handleTrigger = useCallback(async () => {
    if (!benchmarkId) return;
    try {
      const values = await form.validateFields();
      setTriggering(true);
      const data = {
        model: values.model || capabilities?.default_model || '',
        dimensions: values.dimensions || undefined,
        scope: values.scope || 'full',
        case_selector: values.scope === 'delta' && (values.case_keys || values.max_cases)
          ? { case_keys: values.case_keys || undefined, max_cases: values.max_cases || undefined }
          : undefined,
        strict_mode: values.strict_mode || false,
        idempotency_key: values.idempotency_key || undefined,
      };
      await benchmarkService.triggerLLMQualityCheck(benchmarkId, data);
      message.success(t('llmQuality.trigger.triggerOk'));
      setTriggerModalVisible(false);
      form.resetFields();
      fetchJobs(1);
      fetchSummary();
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { message?: string; detail?: string } } })?.response;
      message.error(resp?.data?.message || resp?.data?.detail || t('llmQuality.trigger.triggerFail'));
    } finally {
      setTriggering(false);
    }
  }, [benchmarkId, capabilities, form, fetchJobs, fetchSummary]);

  // ============ Cancel / Retry ============
  const handleCancel = useCallback(async (job: BenchmarkLLMQualityJob) => {
    if (!benchmarkId) return;
    Modal.confirm({
      title: t('llmQuality.messages.cancelConfirmTitle'),
      content: t('llmQuality.messages.cancelConfirmContent', { id: job.id.slice(0, 8) }),
      onOk: async () => {
        try {
          await benchmarkService.cancelLLMQualityJob(benchmarkId, job.id);
          message.success(t('llmQuality.messages.cancelOk'));
          fetchJobs(jobPage);
          fetchSummary();
        } catch (err: unknown) {
          const resp = (err as { response?: { data?: { message?: string } } })?.response;
          message.error(resp?.data?.message || t('llmQuality.messages.cancelFail'));
        }
      },
    });
  }, [benchmarkId, jobPage, fetchJobs, fetchSummary]);

  const handleRetry = useCallback(async (job: BenchmarkLLMQualityJob) => {
    if (!benchmarkId) return;
    Modal.confirm({
      title: t('llmQuality.messages.retryConfirmTitle'),
      content: t('llmQuality.messages.retryConfirmContent', { id: job.id.slice(0, 8) }),
      onOk: async () => {
        try {
          await benchmarkService.retryLLMQualityJob(benchmarkId, job.id);
          message.success(t('llmQuality.messages.retryOk'));
          fetchJobs(jobPage);
          fetchSummary();
        } catch (err: unknown) {
          const resp = (err as { response?: { data?: { message?: string } } })?.response;
          message.error(resp?.data?.message || t('llmQuality.messages.retryFail'));
        }
      },
    });
  }, [benchmarkId, jobPage, fetchJobs, fetchSummary]);

  const showScope = Form.useWatch('scope', form) || 'full';

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <Breadcrumb style={{ marginBottom: 24 }} items={[
        { title: <HomeOutlined />, href: '/dashboard' },
        { title: <span>Benchmarks</span>, href: '/benchmarks' },
        { title: <span>{benchmarkId?.slice(0, 8)}...</span>, href: `/benchmarks/${benchmarkId}` },
        { title: <span>{t('llmQuality.page.breadcrumb')}</span> },
      ]} />

      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          <ExperimentOutlined style={{ marginRight: 8 }} />
          {t('llmQuality.page.title')}
        </Title>
        <Text type="secondary">{t('llmQuality.page.subtitle')}</Text>
      </div>

      {/* Section 1: Summary */}
      <Card style={{ marginBottom: 24 }} loading={summaryLoading}>
        <Row gutter={16}>
          <Col span={3}><Statistic title={t('llmQuality.summary.total')} value={summary?.total ?? 0} /></Col>
          <Col span={3}><Statistic title={t('llmQuality.summary.pending')} value={summary?.pending ?? 0} /></Col>
          <Col span={3}><Statistic title={t('llmQuality.summary.processing')} value={summary?.processing ?? 0} valueStyle={{ color: '#1890ff' }} /></Col>
          <Col span={3}><Statistic title={t('llmQuality.summary.completed')} value={summary?.completed ?? 0} valueStyle={{ color: '#52c41a' }} /></Col>
          <Col span={3}><Statistic title={t('llmQuality.summary.failed')} value={summary?.failed ?? 0} valueStyle={{ color: '#ff4d4f' }} /></Col>
          <Col span={3}><Statistic title={t('llmQuality.summary.cancelled')} value={summary?.cancelled ?? 0} /></Col>
          <Col span={3}><Statistic title={t('llmQuality.summary.running')} value={summary?.running ?? 0} /></Col>
          <Col span={3}><Statistic title={t('llmQuality.summary.terminal')} value={summary?.terminal ?? 0} /></Col>
        </Row>
      </Card>

      {/* Section 2: Job List */}
      <Card
        title={<span style={{ fontWeight: 600 }}>{t('llmQuality.jobList.title')}</span>}
        extra={
          <Space>
            <Select allowClear placeholder={t('llmQuality.jobList.statusFilter')} style={{ width: 130 }} value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              options={[
                { value: 'running', label: t('llmQuality.jobList.runningGroup') },
                { value: 'terminal', label: t('llmQuality.jobList.terminalGroup') },
                ...Object.entries(LLM_QUALITY_JOB_STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label })),
              ]} />
            <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => {
              form.setFieldsValue({
                model: capabilities?.default_model || '',
                dimensions: capabilities?.default_dimensions || [],
                scope: 'full',
                strict_mode: false,
              });
              setTriggerModalVisible(true);
            }}>
              {t('llmQuality.jobList.triggerBtn')}
            </Button>
          </Space>
        }
      >
        <Table
          size="small"
          loading={jobLoading}
          rowKey="id"
          dataSource={jobs}
          pagination={{
            current: jobPage, pageSize: 20, total: jobTotal, size: 'small',
            showTotal: (count) => t('llmQuality.jobList.totalCount', { count }),
            onChange: (p) => fetchJobs(p),
          }}
          scroll={{ x: 1200 }}
          columns={[
            {
              title: 'ID', dataIndex: 'id', width: 100,
              render: (v: string) => <Text code style={{ fontSize: 11 }}>{v.slice(0, 8)}</Text>,
            },
            { title: 'Model', dataIndex: 'model', width: 120, ellipsis: true },
            {
              title: t('llmQuality.jobList.columns.status'), dataIndex: 'status', width: 100,
              render: (v: LLMQualityJobStatus) => {
                const cfg = LLM_QUALITY_JOB_STATUS_CONFIG[v];
                return <Tag color={cfg?.color}>{cfg?.label || v}</Tag>;
              },
            },
            {
              title: 'Strict', dataIndex: 'strict_mode', width: 60,
              render: (v: boolean) => v ? <Tag color="red">Yes</Tag> : <Tag>No</Tag>,
            },
            {
              title: t('llmQuality.jobList.columns.error'), dataIndex: 'error_message', width: 200, ellipsis: true,
              render: (v?: string) => v ? <Text type="danger" ellipsis title={v}>{v}</Text> : '-',
            },
            {
              title: t('llmQuality.jobList.columns.started'), dataIndex: 'started_at', width: 130,
              render: (v?: string) => v ? dayjs(v).format('MM-DD HH:mm:ss') : '-',
            },
            {
              title: t('llmQuality.jobList.columns.completed'), dataIndex: 'completed_at', width: 130,
              render: (v?: string) => v ? dayjs(v).format('MM-DD HH:mm:ss') : '-',
            },
            {
              title: t('llmQuality.jobList.columns.created'), dataIndex: 'created_at', width: 130,
              render: (v: string) => dayjs(v).format('MM-DD HH:mm:ss'),
            },
            {
              title: t('llmQuality.jobList.columns.action'), width: 180, fixed: 'right',
              render: (_: unknown, r: BenchmarkLLMQualityJob) => (
                <Space size={4}>
                  {(r.status === 'pending' || r.status === 'processing') && (
                    <Button size="small" danger icon={<StopOutlined />}
                      onClick={() => handleCancel(r)}>{t('llmQuality.jobList.actions.cancel')}</Button>
                  )}
                  {(r.status === 'failed' || r.status === 'cancelled') && (
                    <Button size="small" icon={<ReloadOutlined />}
                      onClick={() => handleRetry(r)}>{t('llmQuality.jobList.actions.retry')}</Button>
                  )}
                  {r.status === 'completed' && r.report_id && (
                    <Button size="small" type="link" icon={<FileSearchOutlined />}
                      onClick={() => navigate(`/benchmarks/${r.benchmark_id}/llm-quality/${r.id}`)}>
                      {t('llmQuality.jobList.actions.viewReport')}
                    </Button>
                  )}
                </Space>
              ),
            },
          ]}
        />
      </Card>

      {/* Section 3: Trigger Modal */}
      <Modal
        title={t('llmQuality.trigger.title')}
        open={triggerModalVisible}
        onOk={handleTrigger}
        onCancel={() => { setTriggerModalVisible(false); form.resetFields(); }}
        confirmLoading={triggering}
        width={560}
      >
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item name="model" label="Model" rules={[{ required: true, message: t('llmQuality.trigger.modelRequired') }]}>
            <Select placeholder={t('llmQuality.trigger.modelPlaceholder')} showSearch
              options={capabilities?.allowed_models?.map((m) => ({ value: m, label: m })) ?? []} />
          </Form.Item>
          <Form.Item name="dimensions" label="Dimensions">
            <Select mode="multiple" placeholder={t('llmQuality.trigger.dimensionsPlaceholder')}
              options={capabilities?.dimension_catalog?.map((d) => ({ value: d.name, label: `${d.name} (${d.cost_class})` })) ?? []} />
          </Form.Item>
          <Form.Item name="scope" label="Scope">
            <Radio.Group>
              <Radio value="full">{t('llmQuality.trigger.scopeFull')}</Radio>
              <Radio value="delta">{t('llmQuality.trigger.scopeDelta')}</Radio>
            </Radio.Group>
          </Form.Item>
          {showScope === 'delta' && (
            <>
              <Form.Item name="case_keys" label={t('llmQuality.trigger.caseKeysLabel')}>
                <Select mode="tags" placeholder={t('llmQuality.trigger.caseKeysPlaceholder')} style={{ width: '100%' }} />
              </Form.Item>
              <Form.Item name="max_cases" label="Max Cases">
                <InputNumber min={1} max={1000} placeholder={t('llmQuality.trigger.maxCasesPlaceholder')} style={{ width: '100%' }} />
              </Form.Item>
            </>
          )}
          <Form.Item name="strict_mode" label="Strict Mode" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name="idempotency_key" label={t('llmQuality.trigger.idempotencyLabel')}>
            <Input placeholder={t('llmQuality.trigger.idempotencyPlaceholder')} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
