import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Empty,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Statistic,
  Switch,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  EyeOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
  SaveOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '@/components/common';
import {
  formatCoverage,
  formatDateTime,
  getProjectTypeLabel,
  getRunModeLabel,
  getScopeLabel,
  humanizeKey,
} from '@/components/project-eval/helpers';
import { projectEvalService } from '@/services/project-eval';
import { useThemeTokens } from '@/theme';
import { isPersistedOrgAdmin } from '@/utils';
import type {
  PolicyPreview,
  ProjectEvalCapabilities,
  ProjectEvalPolicy,
  RunDailyTrend,
  RunInsightsSummary,
  RunInsightsTrends,
  UpsertPolicyRequest,
} from '@/types/api/project-eval';

const { Paragraph, Text, Title } = Typography;

type ProjectEvalInsightsTab = 'insights' | 'policy';

const DEFAULT_PROJECT_TYPES = ['backend', 'frontend', 'llm_app', 'agent'] as const;
const DEFAULT_RUN_MODES = ['advisory', 'strict'] as const;
const DEFAULT_SCOPES = ['full', 'delta'] as const;

function getErrorMessage(error: unknown, fallback: string): string {
  const response = (error as { response?: { data?: { message?: string } } })?.response;
  return response?.data?.message || fallback;
}

function formatRate(value: number, total: number): string {
  if (total <= 0) {
    return '0%';
  }
  return `${Math.round((value / total) * 100)}%`;
}

function tagDistribution(values?: Record<string, number>) {
  const entries = Object.entries(values ?? {}).filter(([, count]) => count > 0);
  if (entries.length === 0) {
    return <Text type="secondary">-</Text>;
  }
  return (
    <Space size={[4, 4]} wrap>
      {entries.map(([name, count]) => <Tag key={name}>{humanizeKey(name)}: {count}</Tag>)}
    </Space>
  );
}

function renderTags(values: string[] | undefined, emptyLabel: string) {
  if (!values || values.length === 0) {
    return <Text type="secondary">{emptyLabel}</Text>;
  }
  return <Space size={[4, 4]} wrap>{values.map((value) => <Tag key={value}>{humanizeKey(value)}</Tag>)}</Space>;
}

export default function ProjectEvalInsightsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation('projectEval');
  const tokens = useThemeTokens();
  const [activeTabKey, setActiveTabKey] = useState<ProjectEvalInsightsTab>('insights');
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<RunInsightsSummary | null>(null);
  const [trends, setTrends] = useState<RunDailyTrend[]>([]);
  const [capabilities, setCapabilities] = useState<ProjectEvalCapabilities | null>(null);
  const [days, setDays] = useState(14);
  const [filterType, setFilterType] = useState<string | undefined>();
  const [filterMode, setFilterMode] = useState<string | undefined>();
  const [filterScope, setFilterScope] = useState<string | undefined>();

  const [policy, setPolicy] = useState<ProjectEvalPolicy | null>(null);
  const [policyLoading, setPolicyLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<UpsertPolicyRequest>({});
  const [preview, setPreview] = useState<PolicyPreview | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const admin = useMemo(() => isPersistedOrgAdmin(), []);

  const fetchInsights = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryResult, trendsResult, capabilitiesResult] = await Promise.allSettled([
        projectEvalService.getInsightsSummary({
          days,
          project_type: filterType,
          mode: filterMode,
          scope: filterScope,
        }),
        projectEvalService.getInsightsTrends({
          days,
          project_type: filterType,
          mode: filterMode,
          scope: filterScope,
        }),
        projectEvalService.getCapabilities(),
      ]);
      setSummary(summaryResult.status === 'fulfilled' ? (summaryResult.value as unknown as RunInsightsSummary) : null);
      setTrends(
        trendsResult.status === 'fulfilled'
          ? ((trendsResult.value as unknown as RunInsightsTrends).daily_trends ?? [])
          : []
      );
      setCapabilities(
        capabilitiesResult.status === 'fulfilled'
          ? (capabilitiesResult.value as unknown as ProjectEvalCapabilities)
          : null
      );
    } finally {
      setLoading(false);
    }
  }, [days, filterMode, filterScope, filterType]);

  const fetchPolicy = useCallback(async () => {
    setPolicyLoading(true);
    try {
      const response = await projectEvalService.getEffectivePolicy();
      setPolicy(response as unknown as ProjectEvalPolicy);
    } catch {
      setPolicy(null);
    } finally {
      setPolicyLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchInsights();
  }, [fetchInsights]);

  useEffect(() => {
    if (activeTabKey === 'policy' && !policy && !policyLoading) {
      void fetchPolicy();
    }
  }, [activeTabKey, fetchPolicy, policy, policyLoading]);

  const startEdit = useCallback(() => {
    if (!policy) {
      return;
    }
    setForm({
      pass_threshold: policy.pass_threshold,
      warn_threshold: policy.warn_threshold,
      strict_block_threshold: policy.strict_block_threshold,
      dimension_weights: policy.dimension_weights || {},
      max_daily_runs: policy.max_daily_runs,
      max_concurrent_runs: policy.max_concurrent_runs,
      delta_max_files: policy.delta_max_files,
      enable_cost_optimize: policy.enable_cost_optimize,
      enabled_project_types: policy.enabled_project_types || [],
      enabled_run_modes: policy.enabled_run_modes || [],
      enabled_scopes: policy.enabled_scopes || [],
      dimension_controls: policy.dimension_controls || {},
    });
    setEditing(true);
  }, [policy]);

  const handlePreview = useCallback(async () => {
    setPreviewLoading(true);
    try {
      const response = await projectEvalService.previewPolicy(form);
      setPreview(response as unknown as PolicyPreview);
      setPreviewOpen(true);
    } catch (error) {
      message.error(getErrorMessage(error, t('insightsPage.messages.previewFailed')));
    } finally {
      setPreviewLoading(false);
    }
  }, [form, t]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await projectEvalService.upsertPolicy(form);
      message.success(t('insightsPage.messages.policyUpdated'));
      setEditing(false);
      await fetchPolicy();
    } catch (error) {
      message.error(getErrorMessage(error, t('insightsPage.messages.saveFailed')));
    } finally {
      setSaving(false);
    }
  }, [fetchPolicy, form, t]);

  const availableProjectTypes = capabilities?.project_types ?? [...DEFAULT_PROJECT_TYPES];
  const availableRunModes = capabilities?.run_modes ?? [...DEFAULT_RUN_MODES];
  const availableScopes = capabilities?.scopes ?? [...DEFAULT_SCOPES];
  const availableDimensions = capabilities?.dimensions ?? [];
  const authoritativeRuns = summary?.authoritative_runs ?? summary?.evidence_backed_runs ?? 0;
  const compatibilityRuns = summary?.compatibility_runs ?? summary?.legacy_fallback_runs ?? 0;
  const insufficientEvidenceRuns = summary?.insufficient_evidence_runs ?? 0;
  const currentRunExecutionReadyRuns = summary?.current_run_execution_ready_runs ?? 0;
  const missingCurrentRunExecutionRuns = summary?.missing_current_run_execution_runs ?? 0;
  const currentRunExecutionCases = summary?.current_run_execution_cases ?? 0;
  const missingCurrentRunExecutionCases = summary?.missing_current_run_execution_cases ?? 0;
  const currentRunExecutionReadyRate = summary ? formatRate(currentRunExecutionReadyRuns, summary.total_runs) : '0%';
  const insufficientEvidenceRate = summary ? formatRate(insufficientEvidenceRuns, summary.total_runs) : '0%';
  const repairRate = summary ? formatRate(summary.linked_repair_runs, summary.total_runs) : '0%';
  const replayRate = summary ? formatRate(summary.replay_completed_runs, summary.total_runs) : '0%';

  const trendColumns: ColumnsType<RunDailyTrend> = [
    { title: t('insightsPage.trend.date'), dataIndex: 'run_date', key: 'run_date', width: 130 },
    { title: t('insightsPage.common.runs'), dataIndex: 'total_runs', key: 'total_runs', width: 100 },
    { title: t('insightsPage.common.currentRunReady'), dataIndex: 'current_run_execution_ready_runs', key: 'current_run_execution_ready_runs', width: 170 },
    { title: t('insightsPage.common.missingCurrentRun'), dataIndex: 'missing_current_run_execution_runs', key: 'missing_current_run_execution_runs', width: 170 },
    { title: t('insightsPage.common.currentRunCases'), dataIndex: 'current_run_execution_cases', key: 'current_run_execution_cases', width: 160 },
    { title: t('insightsPage.common.missingCurrentRunCases'), dataIndex: 'missing_current_run_execution_cases', key: 'missing_current_run_execution_cases', width: 180 },
    { title: t('insightsPage.common.authoritativeScore'), dataIndex: 'authoritative_average_score', key: 'authoritative_average_score', width: 150, render: (value: number) => (value ?? 0).toFixed(1) },
    { title: t('insightsPage.common.authoritativeRuns'), dataIndex: 'authoritative_runs', key: 'authoritative_runs', width: 140 },
    { title: t('insightsPage.common.insufficientRuns'), dataIndex: 'insufficient_evidence_runs', key: 'insufficient_evidence_runs', width: 150 },
    { title: t('insightsPage.common.fallback'), dataIndex: 'compatibility_runs', key: 'compatibility_runs', width: 110 },
    { title: t('insightsPage.common.replayCompleted'), dataIndex: 'replay_completed_runs', key: 'replay_completed_runs', width: 150 },
    { title: t('insightsPage.common.coverage'), dataIndex: 'average_coverage_score', key: 'average_coverage_score', width: 120, render: (value: number) => formatCoverage(value) },
  ];

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <PageHeader
        title={t('insightsPage.title')}
        description={t('insightsPage.description')}
        breadcrumb={[{ title: t('common.dashboard') }, { title: t('home.pageTitle') }, { title: t('insightsPage.breadcrumb') }]}
        extra={(
          <Space wrap>
            <Button onClick={() => navigate('/project-eval')}>{t('home.pageTitle')}</Button>
            <Button icon={<SafetyCertificateOutlined />} onClick={() => navigate('/project-eval/acceptance')}>{t('insightsPage.actions.acceptance')}</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/project-eval/create')}>{t('home.actions.newProjectEval')}</Button>
          </Space>
        )}
      />

      <Tabs
        activeKey={activeTabKey}
        onChange={(key) => setActiveTabKey(key as ProjectEvalInsightsTab)}
        items={[
          {
            key: 'insights',
            label: t('insightsPage.tabs.insights'),
            children: (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Card
                  style={{
                    borderColor: tokens.border.default,
                    background: `linear-gradient(135deg, ${tokens.bg.secondary}, ${tokens.bg.primary})`,
                  }}
                >
                  <Space direction="vertical" size={16} style={{ width: '100%' }}>
                    <Space wrap>
                      <Tag color="blue">{t('insightsPage.hero.tags.organization')}</Tag>
                      <Tag color="green">{t('insightsPage.hero.tags.policyAware')}</Tag>
                      {filterType && <Tag>{getProjectTypeLabel(filterType)}</Tag>}
                      {filterMode && <Tag>{getRunModeLabel(filterMode)}</Tag>}
                      {filterScope && <Tag>{getScopeLabel(filterScope)}</Tag>}
                    </Space>
                    <div>
                      <Title level={3} style={{ marginBottom: 8 }}>{t('insightsPage.hero.title')}</Title>
                      <Paragraph style={{ marginBottom: 0 }}>
                        {t('insightsPage.hero.description')}
                      </Paragraph>
                    </div>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} sm={12} lg={6}><Statistic title={t('insightsPage.common.runs')} value={summary?.total_runs ?? 0} loading={loading} /></Col>
                      <Col xs={24} sm={12} lg={6}><Statistic title={t('insightsPage.common.currentRunReadyRate')} value={currentRunExecutionReadyRate} loading={loading} /></Col>
                      <Col xs={24} sm={12} lg={6}><Statistic title={t('insightsPage.common.missingCurrentRun')} value={missingCurrentRunExecutionRuns} loading={loading} /></Col>
                      <Col xs={24} sm={12} lg={6}><Statistic title={t('insightsPage.common.insufficientRate')} value={insufficientEvidenceRate} loading={loading} /></Col>
                    </Row>
                  </Space>
                </Card>

                <Card title={t('insightsPage.filters.title')}>
                  <Space wrap>
                    <Select
                      style={{ width: 140 }}
                      value={days}
                      onChange={setDays}
                      options={[7, 14, 30, 60, 90].map((value) => ({ value, label: t('insightsPage.filters.days', { count: value }) }))}
                    />
                    <Select
                      allowClear
                      placeholder={t('insightsPage.filters.projectType')}
                      style={{ width: 180 }}
                      value={filterType}
                      onChange={(value) => setFilterType(value || undefined)}
                      options={availableProjectTypes.map((value) => ({ value, label: getProjectTypeLabel(value) }))}
                    />
                    <Select
                      allowClear
                      placeholder={t('insightsPage.filters.runMode')}
                      style={{ width: 180 }}
                      value={filterMode}
                      onChange={(value) => setFilterMode(value || undefined)}
                      options={availableRunModes.map((value) => ({ value, label: getRunModeLabel(value) }))}
                    />
                    <Select
                      allowClear
                      placeholder={t('insightsPage.filters.scope')}
                      style={{ width: 180 }}
                      value={filterScope}
                      onChange={(value) => setFilterScope(value || undefined)}
                      options={availableScopes.map((value) => ({ value, label: getScopeLabel(value) }))}
                    />
                    <Button onClick={() => { setDays(14); setFilterType(undefined); setFilterMode(undefined); setFilterScope(undefined); }}>{t('common.reset')}</Button>
                  </Space>
                </Card>

                {loading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 96 }}><Spin size="large" /></div>
                ) : !summary ? (
                  <Card><Empty description={t('insightsPage.empty.insights')} /></Card>
                ) : (
                  <>
                    <Alert
                      type={missingCurrentRunExecutionRuns > 0 ? 'warning' : 'success'}
                      showIcon
                      message={
                        missingCurrentRunExecutionRuns > 0
                          ? t('insightsPage.validation.missingTitle', { count: missingCurrentRunExecutionRuns })
                          : t('insightsPage.validation.readyTitle')
                      }
                      description={
                        missingCurrentRunExecutionRuns > 0
                          ? t('insightsPage.validation.missingDesc', { cases: missingCurrentRunExecutionCases })
                          : t('insightsPage.validation.readyDesc')
                      }
                    />
                    <Row gutter={[16, 16]}>
                      <Col xs={24} lg={12} xl={6}>
                        <Card title={t('insightsPage.cards.currentRunValidation')} style={{ height: '100%' }}>
                          <Row gutter={[16, 16]}>
                            <Col span={12}><Statistic title={t('insightsPage.common.currentRunReady')} value={currentRunExecutionReadyRuns} /></Col>
                            <Col span={12}><Statistic title={t('insightsPage.common.missingCurrentRun')} value={missingCurrentRunExecutionRuns} /></Col>
                            <Col span={12}><Statistic title={t('insightsPage.common.currentRunCases')} value={currentRunExecutionCases} /></Col>
                            <Col span={12}><Statistic title={t('insightsPage.common.missingCurrentRunCases')} value={missingCurrentRunExecutionCases} /></Col>
                          </Row>
                        </Card>
                      </Col>
                      <Col xs={24} lg={12} xl={6}>
                        <Card title={t('insightsPage.cards.runQuality')} style={{ height: '100%' }}>
                          <Row gutter={[16, 16]}>
                            <Col span={12}><Statistic title={t('insightsPage.common.authoritativeRuns')} value={authoritativeRuns} /></Col>
                            <Col span={12}><Statistic title={t('insightsPage.common.insufficientRuns')} value={insufficientEvidenceRuns} /></Col>
                            <Col span={12}><Statistic title={t('insightsPage.common.compatibilityRuns')} value={compatibilityRuns} /></Col>
                            <Col span={12}><Statistic title={t('insightsPage.common.diagnosticAverageScore')} value={summary.average_score} precision={1} /></Col>
                            <Col span={12}><Statistic title={t('insightsPage.common.confidence')} value={summary.average_confidence} precision={2} /></Col>
                            <Col span={12}><Statistic title={t('insightsPage.common.coverage')} value={summary.average_coverage_score} precision={1} /></Col>
                          </Row>
                        </Card>
                      </Col>
                      <Col xs={24} lg={12} xl={6}>
                        <Card title={t('insightsPage.cards.repairReplay')} style={{ height: '100%' }}>
                          <Row gutter={[16, 16]}>
                            <Col span={12}><Statistic title={t('insightsPage.common.repairLinked')} value={repairRate} /></Col>
                            <Col span={12}><Statistic title={t('insightsPage.common.replayCompleted')} value={replayRate} /></Col>
                            <Col span={12}><Statistic title={t('insightsPage.common.replayFailed')} value={summary.replay_failed_runs} /></Col>
                            <Col span={12}><Statistic title={t('insightsPage.common.replayUnavailable')} value={summary.replay_unavailable_runs} /></Col>
                          </Row>
                        </Card>
                      </Col>
                      <Col xs={24} lg={12} xl={6}>
                        <Card title={t('insightsPage.cards.caseResults')} style={{ height: '100%' }}>
                          <Row gutter={[16, 16]}>
                            <Col span={12}><Statistic title={t('helpers.decision.pass')} value={summary.pass_cases} valueStyle={{ color: tokens.status.success }} /></Col>
                            <Col span={12}><Statistic title={t('helpers.decision.warn')} value={summary.warn_cases} valueStyle={{ color: tokens.status.warning }} /></Col>
                            <Col span={12}><Statistic title={t('helpers.decision.block')} value={summary.block_cases} valueStyle={{ color: tokens.status.error }} /></Col>
                            <Col span={12}><Statistic title={t('insightsPage.common.insufficient')} value={summary.insufficient_cases} /></Col>
                          </Row>
                        </Card>
                      </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                      <Col xs={24} xl={10}>
                        <Card title={t('insightsPage.cards.distributions')} style={{ height: '100%' }}>
                          <Space direction="vertical" size={16} style={{ width: '100%' }}>
                            <div><Text strong>{t('insightsPage.common.status')}</Text><div style={{ marginTop: 8 }}>{tagDistribution(summary.status_distribution)}</div></div>
                            <div><Text strong>{t('insightsPage.common.decision')}</Text><div style={{ marginTop: 8 }}>{tagDistribution(summary.decision_distribution)}</div></div>
                            <div><Text strong>{t('insightsPage.common.compatibilityReasons')}</Text><div style={{ marginTop: 8 }}>{tagDistribution(summary.compatibility_reason_distribution)}</div></div>
                          </Space>
                        </Card>
                      </Col>
                      <Col xs={24} xl={14}>
                        <Card title={t('insightsPage.cards.dailyTrend')}>
                          <Table<RunDailyTrend>
                            rowKey="run_date"
                            columns={trendColumns}
                            dataSource={trends}
                            pagination={{ pageSize: 7, showSizeChanger: false }}
                            scroll={{ x: 1310 }}
                            locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('insightsPage.empty.trendRows')} /> }}
                          />
                        </Card>
                      </Col>
                    </Row>
                  </>
                )}
              </Space>
            ),
          },
          {
            key: 'policy',
            label: t('insightsPage.tabs.policy'),
            children: (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {!admin && (
                  <Alert type="info" showIcon message={t('insightsPage.policy.readOnly')} />
                )}
                {policyLoading ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: 96 }}><Spin size="large" /></div>
                ) : !policy ? (
                  <Card><Empty description={t('insightsPage.empty.policy')} /></Card>
                ) : !editing ? (
                  <>
                    <Card
                      title={t('insightsPage.policy.effectivePolicy')}
                      extra={admin ? <Button icon={<SettingOutlined />} onClick={startEdit}>{t('insightsPage.policy.editPolicy')}</Button> : null}
                    >
                      <Descriptions size="small" column={2} bordered>
                        <Descriptions.Item label={t('insightsPage.policy.passThreshold')}>{policy.pass_threshold}</Descriptions.Item>
                        <Descriptions.Item label={t('insightsPage.policy.warnThreshold')}>{policy.warn_threshold}</Descriptions.Item>
                        <Descriptions.Item label={t('insightsPage.policy.strictBlockThreshold')}>{policy.strict_block_threshold}</Descriptions.Item>
                        <Descriptions.Item label={t('insightsPage.policy.dailyRuns')}>{policy.max_daily_runs}</Descriptions.Item>
                        <Descriptions.Item label={t('insightsPage.policy.concurrentRuns')}>{policy.max_concurrent_runs}</Descriptions.Item>
                        <Descriptions.Item label={t('insightsPage.policy.deltaMaxFiles')}>{policy.delta_max_files}</Descriptions.Item>
                        <Descriptions.Item label={t('insightsPage.policy.costOptimize')}>{policy.enable_cost_optimize ? t('common.enabled') : t('common.disabled')}</Descriptions.Item>
                        <Descriptions.Item label={t('common.updated')}>{formatDateTime(policy.updated_at)}</Descriptions.Item>
                      </Descriptions>
                    </Card>
                    <Row gutter={[16, 16]}>
                      <Col xs={24} lg={8}><Card title={t('insightsPage.policy.projectTypes')}>{renderTags(policy.enabled_project_types, t('insightsPage.empty.noAllowlist'))}</Card></Col>
                      <Col xs={24} lg={8}><Card title={t('insightsPage.policy.runModes')}>{renderTags(policy.enabled_run_modes, t('insightsPage.empty.noAllowlist'))}</Card></Col>
                      <Col xs={24} lg={8}><Card title={t('insightsPage.policy.scopes')}>{renderTags(policy.enabled_scopes, t('insightsPage.empty.noAllowlist'))}</Card></Col>
                    </Row>
                    <Card title={t('insightsPage.policy.dimensionWeights')}>
                      {policy.dimension_weights && Object.keys(policy.dimension_weights).length > 0 ? (
                        <Space size={[4, 4]} wrap>
                          {Object.entries(policy.dimension_weights).map(([name, weight]) => (
                            <Tag key={name}>{humanizeKey(name)}: {Math.round(weight * 100)}%</Tag>
                          ))}
                        </Space>
                      ) : (
                        <Text type="secondary">{t('insightsPage.empty.noDimensionWeights')}</Text>
                      )}
                    </Card>
                  </>
                ) : (
                  <Card title={t('insightsPage.policy.editPolicy')} extra={<Button onClick={() => setEditing(false)}>{t('common.cancel')}</Button>}>
                    <Space direction="vertical" size={20} style={{ width: '100%' }}>
                      <Row gutter={[16, 16]}>
                        <Col xs={24} md={8}><Text strong>{t('insightsPage.policy.passThreshold')}</Text><InputNumber min={0} max={100} style={{ width: '100%', marginTop: 6 }} value={form.pass_threshold} onChange={(value) => setForm((current) => ({ ...current, pass_threshold: value ?? undefined }))} /></Col>
                        <Col xs={24} md={8}><Text strong>{t('insightsPage.policy.warnThreshold')}</Text><InputNumber min={0} max={100} style={{ width: '100%', marginTop: 6 }} value={form.warn_threshold} onChange={(value) => setForm((current) => ({ ...current, warn_threshold: value ?? undefined }))} /></Col>
                        <Col xs={24} md={8}><Text strong>{t('insightsPage.policy.strictBlockThreshold')}</Text><InputNumber min={0} max={100} style={{ width: '100%', marginTop: 6 }} value={form.strict_block_threshold} onChange={(value) => setForm((current) => ({ ...current, strict_block_threshold: value ?? undefined }))} /></Col>
                        <Col xs={24} md={8}><Text strong>{t('insightsPage.policy.dailyRuns')}</Text><InputNumber min={1} style={{ width: '100%', marginTop: 6 }} value={form.max_daily_runs} onChange={(value) => setForm((current) => ({ ...current, max_daily_runs: value ?? undefined }))} /></Col>
                        <Col xs={24} md={8}><Text strong>{t('insightsPage.policy.concurrentRuns')}</Text><InputNumber min={1} style={{ width: '100%', marginTop: 6 }} value={form.max_concurrent_runs} onChange={(value) => setForm((current) => ({ ...current, max_concurrent_runs: value ?? undefined }))} /></Col>
                        <Col xs={24} md={8}><Text strong>{t('insightsPage.policy.deltaMaxFiles')}</Text><InputNumber min={1} style={{ width: '100%', marginTop: 6 }} value={form.delta_max_files} onChange={(value) => setForm((current) => ({ ...current, delta_max_files: value ?? undefined }))} /></Col>
                      </Row>

                      <div>
                        <Text strong style={{ display: 'block', marginBottom: 10 }}>{t('insightsPage.policy.costOptimization')}</Text>
                        <Switch checked={Boolean(form.enable_cost_optimize)} onChange={(checked) => setForm((current) => ({ ...current, enable_cost_optimize: checked }))} />
                      </div>

                      <div>
                        <Text strong style={{ display: 'block', marginBottom: 10 }}>{t('insightsPage.policy.enabledProjectTypes')}</Text>
                        <Checkbox.Group value={form.enabled_project_types} onChange={(values) => setForm((current) => ({ ...current, enabled_project_types: values as string[] }))}>
                          <Space wrap>{availableProjectTypes.map((value) => <Checkbox key={value} value={value}>{getProjectTypeLabel(value)}</Checkbox>)}</Space>
                        </Checkbox.Group>
                      </div>

                      <div>
                        <Text strong style={{ display: 'block', marginBottom: 10 }}>{t('insightsPage.policy.enabledRunModes')}</Text>
                        <Checkbox.Group value={form.enabled_run_modes} onChange={(values) => setForm((current) => ({ ...current, enabled_run_modes: values as string[] }))}>
                          <Space wrap>{availableRunModes.map((value) => <Checkbox key={value} value={value}>{getRunModeLabel(value)}</Checkbox>)}</Space>
                        </Checkbox.Group>
                      </div>

                      <div>
                        <Text strong style={{ display: 'block', marginBottom: 10 }}>{t('insightsPage.policy.enabledScopes')}</Text>
                        <Checkbox.Group value={form.enabled_scopes} onChange={(values) => setForm((current) => ({ ...current, enabled_scopes: values as string[] }))}>
                          <Space wrap>{availableScopes.map((value) => <Checkbox key={value} value={value}>{getScopeLabel(value)}</Checkbox>)}</Space>
                        </Checkbox.Group>
                      </div>

                      <div>
                        <Text strong style={{ display: 'block', marginBottom: 10 }}>{t('insightsPage.policy.dimensionWeights')}</Text>
                        {availableDimensions.length === 0 ? (
                          <Text type="secondary">{t('insightsPage.empty.noConfigurableDimensions')}</Text>
                        ) : (
                          <Row gutter={[12, 12]}>
                            {availableDimensions.map((dimension) => (
                              <Col xs={24} md={12} xl={8} key={dimension.name}>
                                <div style={{ border: `1px solid ${tokens.border.default}`, borderRadius: 8, padding: 12, height: '100%' }}>
                                  <Space direction="vertical" size={8} style={{ width: '100%' }}>
                                    <Text strong>{dimension.display_name || humanizeKey(dimension.name)}</Text>
                                    <Text type="secondary">{dimension.description}</Text>
                                    <InputNumber
                                      min={0}
                                      max={1}
                                      step={0.05}
                                      style={{ width: '100%' }}
                                      value={form.dimension_weights?.[dimension.name] ?? dimension.effective_weight}
                                      onChange={(value) => setForm((current) => ({
                                        ...current,
                                        dimension_weights: {
                                          ...(current.dimension_weights || {}),
                                          [dimension.name]: value ?? 0,
                                        },
                                      }))}
                                    />
                                  </Space>
                                </div>
                              </Col>
                            ))}
                          </Row>
                        )}
                      </div>

                      <Space wrap>
                        <Button icon={<EyeOutlined />} onClick={() => void handlePreview()} loading={previewLoading}>{t('insightsPage.policy.previewPolicy')}</Button>
                        <Button type="primary" icon={<SaveOutlined />} onClick={() => void handleSave()} loading={saving}>{t('insightsPage.policy.savePolicy')}</Button>
                      </Space>
                    </Space>
                  </Card>
                )}
              </Space>
            ),
          },
        ]}
      />

      <Modal title={t('insightsPage.preview.title')} open={previewOpen} onCancel={() => setPreviewOpen(false)} footer={null} width={860}>
        {!preview ? (
          <Empty description={t('insightsPage.empty.policyPreview')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Alert
              type={preview.valid ? 'success' : 'warning'}
              showIcon
              message={preview.valid ? t('insightsPage.preview.valid') : t('insightsPage.preview.hasWarnings')}
            />
            {preview.diff?.summary && (
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}><Statistic title={t('insightsPage.preview.blocks')} value={preview.diff.summary.block_count} /></Col>
                <Col xs={24} sm={12} lg={6}><Statistic title={t('insightsPage.preview.highWarnings')} value={preview.diff.summary.warn_high_count} /></Col>
                <Col xs={24} sm={12} lg={6}><Statistic title={t('insightsPage.preview.mediumWarnings')} value={preview.diff.summary.warn_medium_count} /></Col>
                <Col xs={24} sm={12} lg={6}><Statistic title={t('insightsPage.preview.lowWarnings')} value={preview.diff.summary.warn_low_count} /></Col>
              </Row>
            )}
            <Card title={t('insightsPage.preview.setChanges')}>
              <Space direction="vertical" size={12} style={{ width: '100%' }}>
                <div><Text strong>{t('insightsPage.preview.projectTypesAdded')}</Text><div style={{ marginTop: 8 }}>{renderTags(preview.diff?.project_types?.added, t('common.none'))}</div></div>
                <div><Text strong>{t('insightsPage.preview.projectTypesRemoved')}</Text><div style={{ marginTop: 8 }}>{renderTags(preview.diff?.project_types?.removed, t('common.none'))}</div></div>
                <div><Text strong>{t('insightsPage.preview.runModesAdded')}</Text><div style={{ marginTop: 8 }}>{renderTags(preview.diff?.run_modes?.added, t('common.none'))}</div></div>
                <div><Text strong>{t('insightsPage.preview.scopesRemoved')}</Text><div style={{ marginTop: 8 }}>{renderTags(preview.diff?.scopes?.removed, t('common.none'))}</div></div>
              </Space>
            </Card>
            <Card title={t('insightsPage.preview.potentialRunBlocks')}>
              {preview.diff?.potential_run_blocks && preview.diff.potential_run_blocks.length > 0 ? (
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                  {preview.diff.potential_run_blocks.map((item, index) => (
                    <Alert
                      key={`${item.option_type}-${item.value}-${index}`}
                      type={item.severity === 'block' ? 'error' : 'warning'}
                      showIcon
                      message={`${humanizeKey(item.option_type)}: ${humanizeKey(item.value)}`}
                      description={item.message || item.reason}
                    />
                  ))}
                </Space>
              ) : (
                <Text type="secondary">{t('insightsPage.empty.noPotentialRunBlocks')}</Text>
              )}
            </Card>
          </Space>
        )}
      </Modal>
    </div>
  );
}
