/**
 * Quality Policy management page
 * Slice: S14
 *
 * Features: general quality policy (dimension switches + audit) / LLM quality policy (enabled/model/budget/limits/gate)
 */

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, Typography, Tag, Button, Space, Table, Tabs,
  Alert, Breadcrumb, Row, Col, Switch, InputNumber, Select, Input, message, DatePicker, Divider,
} from 'antd';
import {
  HomeOutlined, SafetyCertificateOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { benchmarkService } from '@/services/benchmark';
import type {
  ResolvedQualityPolicy,
  OrganizationQualityPolicy,
  QualityPolicyAuditLog,
  UpsertLLMQualityPolicyRequest,
} from '@/types/api/benchmark';
import { QUALITY_DIMENSIONS, LLM_QUALITY_RISK_CONFIG } from '@/types/api/benchmark';
import type { PaginatedResponse } from '@/types';
import { isPersistedOrgAdmin } from '@/utils';

const { Title, Text } = Typography;

export default function QualityPolicyPage() {
  const { t } = useTranslation('governance');
  // permission
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    setIsAdmin(isPersistedOrgAdmin());
  }, []);

  // ============ Quality Policy ============
  const [resolved, setResolved] = useState<ResolvedQualityPolicy | null>(null);
  const [orgPolicy, setOrgPolicy] = useState<OrganizationQualityPolicy | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editExecutability, setEditExecutability] = useState(true);
  const [editStability, setEditStability] = useState(true);
  const [editCompliance, setEditCompliance] = useState(true);
  const [editBlockOnHigh, setEditBlockOnHigh] = useState(true);

  const fetchQualityPolicy = useCallback(async () => {
    setLoading(true);
    try {
      const [resRes, orgRes] = await Promise.allSettled([
        benchmarkService.getEffectiveQualityPolicy(),
        benchmarkService.getOrganizationQualityPolicy(),
      ]);
      if (resRes.status === 'fulfilled') setResolved((resRes.value as unknown) as ResolvedQualityPolicy);
      if (orgRes.status === 'fulfilled') {
        const org = (orgRes.value as unknown) as OrganizationQualityPolicy;
        setOrgPolicy(org);
        setEditExecutability(org.enable_executability);
        setEditStability(org.enable_stability);
        setEditCompliance(org.enable_compliance);
        setEditBlockOnHigh(org.block_on_high);
      }
    } catch {
      message.error(t('qualityPolicy.errors.fetchPolicy'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchQualityPolicy(); }, [fetchQualityPolicy]);

  // Audits
  const [audits, setAudits] = useState<QualityPolicyAuditLog[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditActorFilter, setAuditActorFilter] = useState('');
  const [auditDateRange, setAuditDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const fetchAudits = useCallback(async (page: number) => {
    setAuditLoading(true);
    try {
      const params: Record<string, unknown> = { page, page_size: 20, view: 'summary' };
      if (auditActorFilter) params.actor_user_id = auditActorFilter;
      if (auditDateRange?.[0]) params.created_from = auditDateRange[0].toISOString();
      if (auditDateRange?.[1]) params.created_to = auditDateRange[1].toISOString();
      const res = await benchmarkService.listQualityPolicyAudits(params as Parameters<typeof benchmarkService.listQualityPolicyAudits>[0]);
      const pd = (res as unknown) as PaginatedResponse<QualityPolicyAuditLog>;
      setAudits(pd.data ?? []);
      setAuditTotal(pd.total ?? 0);
      setAuditPage(page);
    } catch {
      message.error(t('qualityPolicy.errors.fetchAudits'));
    } finally {
      setAuditLoading(false);
    }
  }, [auditActorFilter, auditDateRange, t]);

  useEffect(() => { if (isAdmin) fetchAudits(1); }, [isAdmin, fetchAudits]);

  const handleSaveQuality = useCallback(async () => {
    setSaving(true);
    try {
      await benchmarkService.upsertOrganizationQualityPolicy({
        enable_executability: editExecutability,
        enable_stability: editStability,
        enable_compliance: editCompliance,
        block_on_high: editBlockOnHigh,
      });
      message.success(t('qualityPolicy.savedSuccess'));
      fetchQualityPolicy();
      fetchAudits(1);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || t('qualityPolicy.errors.saveFailed');
      message.error(msg);
    } finally {
      setSaving(false);
    }
  }, [editExecutability, editStability, editCompliance, editBlockOnHigh, fetchQualityPolicy, fetchAudits, t]);

  // ============ LLM Quality Policy ============
  const [llmPolicy, setLlmPolicy] = useState<Record<string, unknown> | null>(null);
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmSaving, setLlmSaving] = useState(false);
  const [llmValidating, setLlmValidating] = useState(false);
  const [llmValidationResult, setLlmValidationResult] = useState<{ valid: boolean; details?: { field: string; message: string }[] } | null>(null);

  // LLM edit state
  const [llmEnabled, setLlmEnabled] = useState(false);
  const [llmAllowedModels, setLlmAllowedModels] = useState<string[]>([]);
  const [llmDefaultModel, setLlmDefaultModel] = useState('');
  const [llmAllowStrict, setLlmAllowStrict] = useState(false);
  const [llmBudget, setLlmBudget] = useState(0);
  const [llmRequestLimit, setLlmRequestLimit] = useState(0);
  const [llmConcurrentLimit, setLlmConcurrentLimit] = useState(2);
  const [llmGateEnabled, setLlmGateEnabled] = useState(false);
  const [llmGateBlockRisk, setLlmGateBlockRisk] = useState('critical');
  const [llmGateFreshReport, setLlmGateFreshReport] = useState(false);

  const fetchLLMPolicy = useCallback(async () => {
    setLlmLoading(true);
    try {
      const res = await benchmarkService.getOrganizationLLMQualityPolicy();
      const p = (res as unknown) as Record<string, unknown>;
      setLlmPolicy(p);
      setLlmEnabled(p.enabled as boolean ?? false);
      setLlmAllowedModels((p.allowed_models as string[]) ?? []);
      setLlmDefaultModel((p.default_model as string) ?? '');
      setLlmAllowStrict(p.allow_strict_mode as boolean ?? false);
      setLlmBudget(p.daily_budget_usd as number ?? 0);
      setLlmRequestLimit(p.daily_request_limit as number ?? 0);
      setLlmConcurrentLimit(p.concurrent_job_limit as number ?? 2);
      setLlmGateEnabled(p.release_gate_enabled as boolean ?? false);
      setLlmGateBlockRisk(p.release_gate_block_risk as string ?? 'critical');
      setLlmGateFreshReport(p.release_gate_require_fresh_report as boolean ?? false);
    } catch {
      // ignore
    } finally {
      setLlmLoading(false);
    }
  }, []);

  useEffect(() => { fetchLLMPolicy(); }, [fetchLLMPolicy]);

  const getLLMEditData = useCallback((): UpsertLLMQualityPolicyRequest => ({
    enabled: llmEnabled,
    allowed_models: llmAllowedModels.length > 0 ? llmAllowedModels : undefined,
    default_model: llmDefaultModel || undefined,
    allow_strict_mode: llmAllowStrict,
    daily_budget_usd: llmBudget,
    daily_request_limit: llmRequestLimit,
    concurrent_job_limit: llmConcurrentLimit,
    release_gate_enabled: llmGateEnabled,
    release_gate_block_risk: llmGateBlockRisk || undefined,
    release_gate_require_fresh_report: llmGateFreshReport,
  }), [llmEnabled, llmAllowedModels, llmDefaultModel, llmAllowStrict, llmBudget,
    llmRequestLimit, llmConcurrentLimit, llmGateEnabled, llmGateBlockRisk, llmGateFreshReport]);

  const handleLLMValidate = useCallback(async () => {
    setLlmValidating(true);
    setLlmValidationResult(null);
    try {
      await benchmarkService.validateLLMQualityPolicy(getLLMEditData());
      setLlmValidationResult({ valid: true });
      message.success(t('qualityPolicy.validation.success'));
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { detail?: string; details?: { field: string; message: string }[] } } })?.response;
      if (resp?.data) {
        setLlmValidationResult({ valid: false, details: resp.data.details });
        message.error(resp.data.detail || t('qualityPolicy.validation.failed'));
      }
    } finally {
      setLlmValidating(false);
    }
  }, [getLLMEditData, t]);

  const handleLLMSave = useCallback(async () => {
    setLlmSaving(true);
    try {
      await benchmarkService.upsertOrganizationLLMQualityPolicy(getLLMEditData());
      message.success(t('qualityPolicy.llm.savedSuccess'));
      setLlmValidationResult(null);
      fetchLLMPolicy();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || t('qualityPolicy.errors.saveFailed');
      message.error(msg);
    } finally {
      setLlmSaving(false);
    }
  }, [getLLMEditData, fetchLLMPolicy, t]);

  const hasOverride = !!orgPolicy;
  const e = resolved?.effective;

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <Breadcrumb style={{ marginBottom: 24 }} items={[
        { title: <HomeOutlined />, href: '/dashboard' },
        { title: <span>{t('qualityPolicy.breadcrumb.governance')}</span> },
        { title: <span>{t('qualityPolicy.breadcrumb.quality')}</span> },
      ]} />

      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          <SafetyCertificateOutlined style={{ marginRight: 8 }} />
          {t('qualityPolicy.title')}
        </Title>
        <Text type="secondary">{t('qualityPolicy.description')}</Text>
      </div>

      <Tabs items={[
        {
          key: 'quality',
          label: t('qualityPolicy.tabs.quality'),
          children: (
            <>
              {/* Effective Policy */}
              <Card title={<span style={{ fontWeight: 600 }}>{t('qualityPolicy.effective.title')}</span>}
                extra={resolved && <Tag color={hasOverride ? 'orange' : 'default'}>{t('qualityPolicy.effective.sourceLabel')}: {hasOverride ? t('qualityPolicy.effective.sourceOverride') : t('qualityPolicy.effective.sourceDefault')}</Tag>}
                style={{ marginBottom: 24 }} loading={loading}>
                {e ? (
                  <>
                    <Row gutter={16}>
                      {QUALITY_DIMENSIONS.map((dim) => {
                        const enabled = e.enabled_dimensions[dim.key] !== false;
                        return (
                          <Col span={4} key={dim.key}>
                            <Space>
                              <Tag color={enabled ? 'success' : 'default'}>{enabled ? 'ON' : 'OFF'}</Tag>
                              <Text>{dim.label}</Text>
                              {dim.mandatory && <Text type="warning">*</Text>}
                            </Space>
                          </Col>
                        );
                      })}
                      <Col span={4}>
                        <Space>
                          <Tag color={e.block_on_high ? 'red' : 'default'}>{e.block_on_high ? 'ON' : 'OFF'}</Tag>
                          <Text>Block On High</Text>
                        </Space>
                      </Col>
                    </Row>
                    {resolved.decision_thresholds && (
                      <div style={{ marginTop: 12 }}>
                        <Text type="secondary">{t('qualityPolicy.effective.thresholds', { deny: resolved.decision_thresholds.deny_min_severity, warn: resolved.decision_thresholds.warn_min_severity })}</Text>
                      </div>
                    )}
                  </>
                ) : !loading ? <Text type="secondary">{t('qualityPolicy.effective.loadFailed')}</Text> : null}
              </Card>

              {/* Edit */}
              {isAdmin && (
                <Card title={<span style={{ fontWeight: 600 }}>{t('qualityPolicy.edit.title')}</span>} style={{ marginBottom: 24 }}>
                  <Row gutter={16}>
                    <Col span={6}>
                      <Space><Switch checked={editExecutability} onChange={setEditExecutability} /> {t('qualityPolicy.edit.executability')}</Space>
                    </Col>
                    <Col span={6}>
                      <Space><Switch checked={editStability} onChange={setEditStability} /> {t('qualityPolicy.edit.stability')}</Space>
                    </Col>
                    <Col span={6}>
                      <Space><Switch checked={editCompliance} onChange={setEditCompliance} /> {t('qualityPolicy.edit.compliance')}</Space>
                    </Col>
                    <Col span={6}>
                      <Space><Switch checked={editBlockOnHigh} onChange={setEditBlockOnHigh} /> Block On High</Space>
                    </Col>
                  </Row>
                  <Divider style={{ fontSize: 12, color: '#999', margin: '8px 0' }}>
                    {t('qualityPolicy.edit.mandatoryHint')}
                  </Divider>
                  <Button type="primary" onClick={handleSaveQuality} loading={saving}>{t('qualityPolicy.edit.save')}</Button>
                </Card>
              )}

              {/* Audits */}
              {isAdmin && (
                <Card title={<span style={{ fontWeight: 600 }}>{t('qualityPolicy.audits.title')}</span>}>
                  <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
                    <Input placeholder={t('qualityPolicy.audits.actorPlaceholder')} value={auditActorFilter} onChange={(e) => setAuditActorFilter(e.target.value)} style={{ width: 180 }} />
                    <DatePicker.RangePicker value={auditDateRange} onChange={(dates) => setAuditDateRange(dates)} style={{ width: 260 }} />
                    <Button onClick={() => fetchAudits(1)}>{t('qualityPolicy.audits.filter')}</Button>
                    <Text type="secondary">{t('qualityPolicy.audits.totalCount', { count: auditTotal })}</Text>
                  </div>
                  <Table
                    size="small" loading={auditLoading} rowKey="id" dataSource={audits}
                    pagination={{ current: auditPage, pageSize: 20, total: auditTotal, size: 'small', showTotal: (total) => t('qualityPolicy.audits.totalCount', { count: total }), onChange: (p) => fetchAudits(p) }}
                    columns={[
                      { title: 'ID', dataIndex: 'id', width: 60 },
                      { title: t('qualityPolicy.audits.actor'), dataIndex: 'actor_user_id', width: 140, ellipsis: true },
                      { title: t('qualityPolicy.audits.role'), dataIndex: 'actor_role', width: 80, render: (v: string) => <Tag>{v}</Tag> },
                      { title: t('qualityPolicy.audits.action'), dataIndex: 'action', width: 80, render: (v: string) => <Tag color="blue">{v}</Tag> },
                      { title: t('qualityPolicy.audits.time'), dataIndex: 'created_at', width: 160, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss') },
                    ]}
                    expandable={{
                      expandedRowRender: (record) => (
                        <Row gutter={16}>
                          <Col span={12}>
                            <Text strong>{t('qualityPolicy.audits.beforeChange')}</Text>
                            <pre style={{ fontSize: 11, maxHeight: 200, overflow: 'auto', margin: '4px 0', padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                              {record.before_snapshot ? JSON.stringify(record.before_snapshot, null, 2) : t('qualityPolicy.audits.firstCreation')}
                            </pre>
                          </Col>
                          <Col span={12}>
                            <Text strong>{t('qualityPolicy.audits.afterChange')}</Text>
                            <pre style={{ fontSize: 11, maxHeight: 200, overflow: 'auto', margin: '4px 0', padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                              {record.after_snapshot ? JSON.stringify(record.after_snapshot, null, 2) : '-'}
                            </pre>
                          </Col>
                        </Row>
                      ),
                    }}
                  />
                </Card>
              )}
            </>
          ),
        },
        {
          key: 'llm',
          label: t('qualityPolicy.tabs.llm'),
          children: (
            <>
              {/* Current LLM Policy */}
              <Card title={<span style={{ fontWeight: 600 }}>{t('qualityPolicy.llm.currentTitle')}</span>} style={{ marginBottom: 24 }} loading={llmLoading}>
                {llmPolicy ? (
                  <Row gutter={[24, 12]}>
                    <Col span={4}><Text strong>Enabled:</Text> <Tag color={llmPolicy.enabled ? 'success' : 'default'}>{llmPolicy.enabled ? t('qualityPolicy.llm.yes') : t('qualityPolicy.llm.no')}</Tag></Col>
                    <Col span={4}><Text strong>{t('qualityPolicy.llm.defaultModel')}:</Text> {llmPolicy.default_model as string || '-'}</Col>
                    <Col span={4}><Text strong>{t('qualityPolicy.llm.allowedModels')}:</Text> {(llmPolicy.allowed_models as string[] || []).join(', ') || t('qualityPolicy.llm.all')}</Col>
                    <Col span={4}><Text strong>Strict Mode:</Text> <Tag color={llmPolicy.allow_strict_mode ? 'success' : 'default'}>{llmPolicy.allow_strict_mode ? t('qualityPolicy.llm.allow') : t('qualityPolicy.llm.deny')}</Tag></Col>
                    <Col span={4}><Text strong>{t('qualityPolicy.llm.dailyBudget')}:</Text> ${(llmPolicy.daily_budget_usd as number ?? 0).toFixed(2)}</Col>
                    <Col span={4}><Text strong>{t('qualityPolicy.llm.dailyRequestLimit')}:</Text> {llmPolicy.daily_request_limit as number ?? 0}</Col>
                    <Col span={4}><Text strong>{t('qualityPolicy.llm.concurrentLimit')}:</Text> {llmPolicy.concurrent_job_limit as number ?? 2}</Col>
                    <Col span={4}><Text strong>Release Gate:</Text> <Tag color={llmPolicy.release_gate_enabled ? 'success' : 'default'}>{llmPolicy.release_gate_enabled ? t('qualityPolicy.llm.enabled') : t('qualityPolicy.llm.disabled')}</Tag></Col>
                    <Col span={4}><Text strong>Block Risk:</Text> {llmPolicy.release_gate_block_risk as string || '-'}</Col>
                    <Col span={4}><Text strong>{t('qualityPolicy.llm.requireFresh')}:</Text> <Tag color={llmPolicy.release_gate_require_fresh_report ? 'success' : 'default'}>{llmPolicy.release_gate_require_fresh_report ? t('qualityPolicy.llm.yes') : t('qualityPolicy.llm.no')}</Tag></Col>
                  </Row>
                ) : !llmLoading ? <Text type="secondary">{t('qualityPolicy.llm.loadFailed')}</Text> : null}
              </Card>

              {/* Edit LLM Policy */}
              {isAdmin && (
                <Card title={<span style={{ fontWeight: 600 }}>{t('qualityPolicy.llm.editTitle')}</span>} style={{ marginBottom: 24 }}>
                  <Row gutter={[16, 12]}>
                    <Col span={6}><Space><Switch checked={llmEnabled} onChange={setLlmEnabled} /> Enabled</Space></Col>
                    <Col span={6}><Space><Switch checked={llmAllowStrict} onChange={setLlmAllowStrict} /> Allow Strict Mode</Space></Col>
                    <Col span={6}>
                      <Text strong style={{ display: 'block', marginBottom: 4 }}>{t('qualityPolicy.llm.allowedModels')}</Text>
                      <Select mode="tags" value={llmAllowedModels} onChange={setLlmAllowedModels}
                        style={{ width: '100%' }} placeholder={t('qualityPolicy.llm.modelPlaceholder')} />
                    </Col>
                    <Col span={6}>
                      <Text strong style={{ display: 'block', marginBottom: 4 }}>{t('qualityPolicy.llm.defaultModel')}</Text>
                      <Select value={llmDefaultModel || undefined} onChange={setLlmDefaultModel}
                        style={{ width: '100%' }} allowClear placeholder={t('qualityPolicy.llm.defaultModelPlaceholder')}
                        options={llmAllowedModels.map((m) => ({ value: m, label: m }))} />
                    </Col>
                    <Col span={6}>
                      <Text strong style={{ display: 'block', marginBottom: 4 }}>{t('qualityPolicy.llm.dailyBudgetLabel')}</Text>
                      <InputNumber min={0} value={llmBudget} onChange={(v) => setLlmBudget(v ?? 0)} style={{ width: '100%' }} />
                    </Col>
                    <Col span={6}>
                      <Text strong style={{ display: 'block', marginBottom: 4 }}>{t('qualityPolicy.llm.dailyRequestLimit')}</Text>
                      <InputNumber min={0} value={llmRequestLimit} onChange={(v) => setLlmRequestLimit(v ?? 0)} style={{ width: '100%' }} />
                    </Col>
                    <Col span={6}>
                      <Text strong style={{ display: 'block', marginBottom: 4 }}>{t('qualityPolicy.llm.concurrentLimit')}</Text>
                      <InputNumber min={1} max={20} value={llmConcurrentLimit} onChange={(v) => setLlmConcurrentLimit(v ?? 2)} style={{ width: '100%' }} />
                    </Col>
                    <Col span={6}>
                      <Space><Switch checked={llmGateEnabled} onChange={setLlmGateEnabled} /> Release Gate</Space>
                    </Col>
                    <Col span={6}>
                      <Text strong style={{ display: 'block', marginBottom: 4 }}>Block Risk</Text>
                      <Select value={llmGateBlockRisk} onChange={setLlmGateBlockRisk} style={{ width: '100%' }}
                        options={Object.entries(LLM_QUALITY_RISK_CONFIG).map(([k, cfg]) => ({ value: k, label: cfg.label }))} />
                    </Col>
                    <Col span={6}>
                      <Space><Switch checked={llmGateFreshReport} onChange={setLlmGateFreshReport} /> {t('qualityPolicy.llm.requireFreshLabel')}</Space>
                    </Col>
                  </Row>

                  {llmValidationResult && (
                    <Alert
                      type={llmValidationResult.valid ? 'success' : 'error'}
                      icon={llmValidationResult.valid ? <CheckCircleOutlined /> : undefined}
                      message={llmValidationResult.valid ? t('qualityPolicy.validation.success') : t('qualityPolicy.validation.failed')}
                      description={llmValidationResult.details && llmValidationResult.details.length > 0 ? (
                        <ul style={{ margin: 0, paddingLeft: 16 }}>{llmValidationResult.details.map((d, i) => <li key={i}>{d.field}: {d.message}</li>)}</ul>
                      ) : null}
                      showIcon={llmValidationResult.valid}
                      style={{ marginTop: 16, marginBottom: 16 }}
                    />
                  )}

                  <Space style={{ marginTop: 16 }}>
                    <Button onClick={handleLLMValidate} loading={llmValidating}>{t('qualityPolicy.llm.preview')}</Button>
                    <Button type="primary" onClick={handleLLMSave} loading={llmSaving}
                      disabled={llmValidationResult !== null && !llmValidationResult.valid}>{t('qualityPolicy.edit.save')}</Button>
                  </Space>
                </Card>
              )}
            </>
          ),
        },
      ]} />
    </div>
  );
}
