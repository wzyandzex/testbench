import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Result,
  Row,
  Select,
  Skeleton,
  Space,
  Statistic,
  Tabs,
  Tag,
  Timeline,
  Typography,
  message,
} from 'antd';
import type { MenuProps } from 'antd';
import { ArrowLeftOutlined, EditOutlined, PlayCircleOutlined, ReloadOutlined } from '@ant-design/icons';
import { Dropdown } from 'antd';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { agentPageService } from './service';
import {
  AGENT_STATUS_COLORS,
  AGENT_STATUS_LABELS,
  AGENT_TYPE_LABELS,
  formatDurationMs,
  formatDurationNs,
  formatSuccessRate,
  getAgentSubtitle,
  getAgentTitle,
  stringifyJSON,
} from './helpers';
import { useAgentPageStore } from './store';
import type { AgentExecutionResult, AgentHealthStatus, AgentStatus, ExecuteAgentDto } from '@/types/api/agent';

const { Paragraph, Text, Title } = Typography;

function renderJSON(value: unknown) {
  const content = stringifyJSON(value);
  if (!content) {
    return <Text type="secondary">-</Text>;
  }

  return (
    <pre
      style={{
        margin: 0,
        padding: 16,
        borderRadius: 12,
        background: '#0f172a',
        color: '#e2e8f0',
        overflow: 'auto',
        fontSize: 12,
      }}
    >
      {content}
    </pre>
  );
}

function buildStatusMenu(currentStatus: AgentStatus, onChange: (status: AgentStatus) => void): MenuProps['items'] {
  return (Object.keys(AGENT_STATUS_LABELS) as AgentStatus[]).map((status) => ({
    key: status,
    label: AGENT_STATUS_LABELS[status],
    disabled: status === currentStatus,
    onClick: () => onChange(status),
  }));
}

export function AgentDetailPage() {
  const { t } = useTranslation('agents');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const currentAgent = useAgentPageStore((state) => state.currentAgent);
  const detailLoading = useAgentPageStore((state) => state.detailLoading);
  const error = useAgentPageStore((state) => state.error);
  const fetchAgentDetail = useAgentPageStore((state) => state.fetchAgentDetail);
  const deleteAgent = useAgentPageStore((state) => state.deleteAgent);
  const updateAgentStatus = useAgentPageStore((state) => state.updateAgentStatus);

  const [healthStatus, setHealthStatus] = useState<AgentHealthStatus | null>(null);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [healthLoading, setHealthLoading] = useState(false);
  const [syncLoading, setSyncLoading] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const [executeOpen, setExecuteOpen] = useState(false);
  const [executeLoading, setExecuteLoading] = useState(false);
  const [executeResult, setExecuteResult] = useState<AgentExecutionResult | null>(null);
  const [executeForm] = Form.useForm();

  useEffect(() => {
    if (id) {
      void fetchAgentDetail(id);
    }
  }, [fetchAgentDetail, id]);

  async function handleHealthCheck() {
    if (!id) return;
    try {
      setHealthLoading(true);
      setHealthError(null);
      const result = await agentPageService.getHealth(id);
      setHealthStatus(result);
      if (result.status === 'healthy') {
        message.success(t('actions.healthPass'));
      } else {
        const reason = t('actions.healthFailed');
        setHealthError(reason);
        message.error(reason);
      }
    } catch (actionError) {
      const reason = actionError instanceof Error ? actionError.message : t('actions.healthFailed');
      setHealthError(reason);
      message.error(reason);
    } finally {
      setHealthLoading(false);
    }
  }

  async function handleSync() {
    if (!id) return;
    try {
      setSyncLoading(true);
      await agentPageService.syncToRegistry(id);
      message.success(t('actions.synced'));
    } finally {
      setSyncLoading(false);
    }
  }

  async function handleDelete() {
    if (!id) return;
    await deleteAgent(id);
    message.success(t('actions.deleted'));
    navigate('/agents');
  }

  async function handleStatusChange(status: AgentStatus) {
    if (!id) return;
    try {
      setStatusUpdating(true);
      await updateAgentStatus(id, status);
    } finally {
      setStatusUpdating(false);
    }
  }

  async function handleExecute(values: ExecuteAgentDto) {
    if (!id) return;
    try {
      setExecuteLoading(true);
      const result = await agentPageService.execute(id, values);
      setExecuteResult(result);
      message.success(result.success ? t('execute.success') : t('execute.returned'));
    } finally {
      setExecuteLoading(false);
    }
  }

  if (!id) {
    return <Result status="404" title={t('detail.missingId')} subTitle={t('detail.missingIdSub')} />;
  }

  if (detailLoading && currentAgent?.id !== id) {
    return <Skeleton active paragraph={{ rows: 12 }} style={{ padding: 24 }} />;
  }

  if (error && currentAgent?.id !== id) {
    return (
      <div style={{ padding: 24 }}>
        <Alert type="error" showIcon message={t('detail.loadFailed')} description={error} />
      </div>
    );
  }

  if (!currentAgent || currentAgent.id !== id) {
    return <Result status="404" title={t('detail.notFound')} subTitle={t('detail.notFoundSub')} />;
  }

  const tabItems = [
    {
      key: 'overview',
      label: t('tabs.overview'),
      children: (
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card bordered={false}>
              <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small" items={[
                {
                  key: 'type',
                  label: t('overview.type'),
                  children: AGENT_TYPE_LABELS[currentAgent.type],
                },
                {
                  key: 'status',
                  label: t('overview.status'),
                  children: (
                    <Tag color={AGENT_STATUS_COLORS[currentAgent.status]}>
                      {AGENT_STATUS_LABELS[currentAgent.status]}
                    </Tag>
                  ),
                },
                {
                  key: 'endpoint',
                  label: t('overview.endpoint'),
                  span: 2,
                  children: <Text copyable>{currentAgent.endpoint}</Text>,
                },
                {
                  key: 'apiKey',
                  label: 'API Key',
                  children: currentAgent.has_api_key ? t('configured') : t('notConfigured'),
                },
                {
                  key: 'version',
                  label: t('overview.version'),
                  children: currentAgent.version || '-',
                },
                {
                  key: 'creator',
                  label: t('overview.creator'),
                  children: currentAgent.created_by || '-',
                },
                {
                  key: 'updatedAt',
                  label: t('overview.updatedAt'),
                  children: currentAgent.updated_at ? new Date(currentAgent.updated_at).toLocaleString() : '-',
                },
                {
                  key: 'description',
                  label: t('overview.description'),
                  span: 2,
                  children: currentAgent.description || t('overview.noDescription'),
                },
              ]} />
            </Card>
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={8}>
                <Card bordered={false}>
                  <Statistic title={t('overview.totalExec')} value={currentAgent.stats.total_executions} />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false}>
                  <Statistic title={t('overview.successRate')} value={formatSuccessRate(currentAgent.stats.success_rate)} />
                </Card>
              </Col>
              <Col span={8}>
                <Card bordered={false}>
                  <Statistic title={t('overview.avgDuration')} value={formatDurationMs(currentAgent.stats.avg_duration)} />
                </Card>
              </Col>
            </Row>
          </Col>
          <Col xs={24} lg={8}>
            <Card title={t('overview.capabilities')} bordered={false}>
              <Space wrap>
                {currentAgent.capabilities?.map((cap) => (
                  <Tag key={cap} color="blue">
                    {cap}
                  </Tag>
                ))}
                {(!currentAgent.capabilities || currentAgent.capabilities.length === 0) && (
                  <Text type="secondary">-</Text>
                )}
              </Space>
            </Card>
          </Col>
          <Col span={24}>
            <Card title={t('overview.statsDetail')} bordered={false}>
              <Descriptions column={{ xs: 1, sm: 2, md: 3 }} bordered size="small" items={[
                {
                  key: 'success',
                  label: t('overview.successExec'),
                  children: currentAgent.stats.success_executions,
                },
                {
                  key: 'failed',
                  label: t('overview.failedExec'),
                  children: currentAgent.stats.failed_executions,
                },
                {
                  key: 'timeout',
                  label: t('overview.timeoutExec'),
                  children: currentAgent.stats.timeout_executions,
                },
                {
                  key: 'avgTokens',
                  label: t('overview.avgTokens'),
                  children: currentAgent.stats.avg_tokens?.toFixed(0) ?? '-',
                },
                {
                  key: 'avgSteps',
                  label: t('overview.avgSteps'),
                  children: currentAgent.stats.avg_steps?.toFixed(1) ?? '-',
                },
                {
                  key: 'avgToolCalls',
                  label: t('overview.avgToolCalls'),
                  children: currentAgent.stats.avg_tool_calls?.toFixed(1) ?? '-',
                },
                {
                  key: 'firstExec',
                  label: t('overview.firstExec'),
                  children: currentAgent.stats.first_execution_at
                    ? new Date(currentAgent.stats.first_execution_at).toLocaleString()
                    : '-',
                },
                {
                  key: 'lastExec',
                  label: t('overview.lastExec'),
                  children: currentAgent.stats.last_execution_at
                    ? new Date(currentAgent.stats.last_execution_at).toLocaleString()
                    : '-',
                },
                {
                  key: 'timeoutRate',
                  label: t('overview.timeoutRate'),
                  children: currentAgent.stats.timeout_rate != null
                    ? `${(currentAgent.stats.timeout_rate * 100).toFixed(1)}%`
                    : '-',
                },
              ]} />
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'config',
      label: t('tabs.config'),
      children: (
        <Row gutter={[24, 24]}>
          <Col span={24}>
            <Card title="Model Config" bordered={false}>
              {renderJSON(currentAgent.model_config)}
            </Card>
          </Col>
          <Col span={24}>
            <Card title="Tools" bordered={false}>
              {renderJSON(currentAgent.tools)}
            </Card>
          </Col>
          <Col span={24}>
            <Card title="Metadata" bordered={false}>
              {renderJSON(currentAgent.metadata)}
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'execute',
      label: t('tabs.manualExec'),
      children: executeResult ? (
        <Card bordered={false}>
          <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small" items={[
            { key: 'taskId', label: t('execute.taskId'), children: executeResult.task_id },
            { key: 'status', label: t('execute.status'), children: executeResult.status },
            { key: 'recordId', label: t('execute.recordId'), children: executeResult.execution_record_id || '-' },
            { key: 'duration', label: t('execute.duration'), children: formatDurationNs(executeResult.duration) },
            { key: 'steps', label: t('execute.stepsCount'), children: executeResult.steps_taken },
          ]} />
          <Row gutter={16} style={{ marginTop: 16 }}>
            {executeResult.outputs?.summary ? (
              <Col span={12}>
                <Card size="small" title={t('execute.summary')}>
                  <Paragraph style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
                    {executeResult.outputs.summary}
                  </Paragraph>
                </Card>
              </Col>
            ) : null}
            {executeResult.outputs?.final_output ? (
              <Col span={12}>
                <Card size="small" title={t('execute.finalOutput')}>
                  <pre style={{ margin: 0, whiteSpace: 'pre-wrap', fontSize: 12 }}>
                    {executeResult.outputs.final_output}
                  </pre>
                </Card>
              </Col>
            ) : null}
          </Row>
          {executeResult.steps?.length ? (
            <Col span={24} style={{ marginTop: 16 }}>
              <Card size="small" title={t('execute.execSteps')}>
                <Timeline
                  items={executeResult.steps.map((step, idx) => ({
                    key: idx,
                    children: (
                      <div>
                        <Text strong>
                          Step {idx + 1}: {step.action}
                        </Text>
                        {step.output ? (
                          <pre style={{ margin: '4px 0 0', fontSize: 11, color: '#666' }}>
                            {String(step.output).slice(0, 300)}
                          </pre>
                        ) : null}
                      </div>
                    ),
                  }))}
                />
              </Card>
            </Col>
          ) : null}
        </Card>
      ) : (
        <Card bordered={false}>
          <Text type="secondary">
            {t('execute.promptPlaceholder')}
          </Text>
        </Card>
      ),
    },
  ];

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <Space align="center" style={{ marginBottom: 8 }}>
            <Button type="text" icon={<ArrowLeftOutlined />} onClick={() => navigate('/agents')} />
            <Title level={3} style={{ margin: 0 }}>
              {getAgentTitle(currentAgent)}
            </Title>
            <Tag color={AGENT_STATUS_COLORS[currentAgent.status]}>
              {AGENT_STATUS_LABELS[currentAgent.status]}
            </Tag>
          </Space>
          {getAgentSubtitle(currentAgent) ? (
            <Text type="secondary" style={{ display: 'block', marginLeft: 40 }}>
              {getAgentSubtitle(currentAgent)}
            </Text>
          ) : null}
        </div>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={() => void fetchAgentDetail(id)} loading={detailLoading}>
            {t('common:actions.refresh')}
          </Button>
          <Button icon={<EditOutlined />} onClick={() => navigate(`/agents/${id}/edit`)}>
            {t('common:actions.edit')}
          </Button>
          <Button
            icon={<PlayCircleOutlined />}
            type="primary"
            onClick={() => setExecuteOpen(true)}
          >
            {t('tabs.manualExec')}
          </Button>
          <Dropdown
            menu={{ items: buildStatusMenu(currentAgent.status, (status) => void handleStatusChange(status)) }}
            trigger={['click']}
          >
            <Button loading={statusUpdating}>{t('table.status')}</Button>
          </Dropdown>
          <Button onClick={() => void handleSync()} loading={syncLoading}>
            Sync
          </Button>
          <Button onClick={() => void handleHealthCheck()} loading={healthLoading}>
            Health
          </Button>
          <Popconfirm
            title={t('actions.deleteConfirm')}
            description={t('actions.deleteDesc')}
            onConfirm={() => void handleDelete()}
          >
            <Button danger>{t('common:actions.delete')}</Button>
          </Popconfirm>
        </Space>
      </div>

      {healthStatus?.status === 'healthy' && (
        <Alert
          type="success"
          showIcon
          message={t('actions.healthPass')}
          style={{ marginBottom: 16 }}
          closable
        />
      )}
      {healthError && (
        <Alert type="error" showIcon message={t('actions.healthFailed')} description={healthError} style={{ marginBottom: 16 }} closable />
      )}

      <Tabs items={tabItems} />

      <Drawer
        title={t('execute.title')}
        open={executeOpen}
        onClose={() => setExecuteOpen(false)}
        width={640}
        destroyOnClose
      >
        <Form
          form={executeForm}
          layout="vertical"
          onFinish={(values) => void handleExecute(values)}
        >
          <Form.Item
            label="Prompt"
            name="prompt"
            rules={[{ required: true, message: t('execute.promptRequired') }]}
          >
            <Input.TextArea rows={6} placeholder={t('execute.promptPlaceholder')} />
          </Form.Item>

          <Row gutter={[16, 0]}>
            <Col xs={24} md={12}>
              <Form.Item label="Benchmark ID" name="benchmark_id">
                <Input placeholder={t('execute.optional')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('execute.toolsLabel')} name="tools">
                <Select mode="tags" tokenSeparators={[',']} placeholder={t('execute.toolsPlaceholder')} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('execute.maxSteps')} name="max_steps">
                <InputNumber min={1} max={500} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item label={t('execute.timeout')} name="timeout">
                <InputNumber min={1000} step={1000} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>

          <Space>
            <Button onClick={() => setExecuteOpen(false)}>{t('common:actions.close')}</Button>
            <Button type="primary" htmlType="submit" loading={executeLoading}>
              {t('common:actions.run')}
            </Button>
          </Space>
        </Form>
      </Drawer>
    </div>
  );
}

export default AgentDetailPage;
