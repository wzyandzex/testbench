/**
 * Trust policy management
 * Slice: S09
 *
 * Capability: view effective policy / edit organization policy / audit log
 */

import { memo, useState, useCallback, useEffect } from 'react';
import {
  Card, Typography, Tag, Descriptions, Button, Space, Table, Form,
  InputNumber, Switch, Alert, Breadcrumb, Row, Col, Statistic,
  DatePicker, Select, message, Divider,
} from 'antd';
import {
  HomeOutlined, SafetyOutlined, CheckCircleOutlined, InfoCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { benchmarkService } from '@/services/benchmark';
import type {
  ResolvedCaseGovernanceTrustPolicy,
  OrganizationGovernanceTrustPolicy,
  TrustPolicyValidationResult,
  TrustPolicyAuditLog,
  CaseGovernanceTrustPolicyProfile,
} from '@/types/api/benchmark';
import type { PaginatedResponse } from '@/types';
import { isPersistedOrgAdmin } from '@/utils';

const { Title, Text } = Typography;

// Field labels — resolved via i18next at runtime
const getFieldLabel = (field: keyof CaseGovernanceTrustPolicyProfile): string => {
  const map: Record<keyof CaseGovernanceTrustPolicyProfile, string> = {
    evidence_aging_hours: 'agingHours',
    evidence_stale_hours: 'staleHours',
    review_low_confidence_threshold: 'lowConfThreshold',
    auto_review_after_validation: 'autoReviewAfterValidation',
    auto_validation_after_review_low_confidence: 'autoValidationLowConf',
    auto_validation_on_quality_recheck: 'autoValidationRecheck',
  };
  return i18next.t(`governance:trust.fields.${map[field]}`);
};

const getFieldDesc = (field: keyof CaseGovernanceTrustPolicyProfile): string => {
  const map: Record<keyof CaseGovernanceTrustPolicyProfile, string> = {
    evidence_aging_hours: 'agingHours',
    evidence_stale_hours: 'staleHours',
    review_low_confidence_threshold: 'lowConfThreshold',
    auto_review_after_validation: 'autoReviewAfterValidation',
    auto_validation_after_review_low_confidence: 'autoValidationLowConf',
    auto_validation_on_quality_recheck: 'autoValidationRecheck',
  };
  return i18next.t(`governance:trust.fieldDesc.${map[field]}`);
};

/**
 * Policy comparison row
 */
const PolicyComparisonRow = memo(function PolicyComparisonRow({
  field,
  effective,
  systemDefault,
  organization,
  hasOverride,
}: {
  field: keyof CaseGovernanceTrustPolicyProfile;
  effective: CaseGovernanceTrustPolicyProfile;
  systemDefault: CaseGovernanceTrustPolicyProfile;
  organization?: CaseGovernanceTrustPolicyProfile;
  hasOverride: boolean;
}) {
  const { t } = useTranslation('governance');
  const isBool = typeof effective[field] === 'boolean';
  const isOverridden = hasOverride && organization && organization[field] !== systemDefault[field];

  const renderValue = (val: boolean | number) => {
    if (isBool) return val ? <Tag color="success">{t('trust.valueLabels.on')}</Tag> : <Tag color="default">{t('trust.valueLabels.off')}</Tag>;
    if (field === 'review_low_confidence_threshold') return `${(val as number * 100).toFixed(0)}%`;
    return `${val}h`;
  };

  return (
    <Descriptions.Item label={getFieldLabel(field)}>
      <Space size="small">
        <span>{renderValue(effective[field])}</span>
        {isOverridden && <Tag color="orange">{t('trust.overrideTag')}</Tag>}
      </Space>
    </Descriptions.Item>
  );
});

const FIELDS: (keyof CaseGovernanceTrustPolicyProfile)[] = [
  'evidence_aging_hours',
  'evidence_stale_hours',
  'review_low_confidence_threshold',
  'auto_review_after_validation',
  'auto_validation_after_review_low_confidence',
  'auto_validation_on_quality_recheck',
];

export default function TrustPolicyPage() {
  const { t } = useTranslation('governance');
  // Permission
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    setIsAdmin(isPersistedOrgAdmin());
  }, []);

  // Effective policy
  const [resolved, setResolved] = useState<ResolvedCaseGovernanceTrustPolicy | null>(null);
  const [effectiveLoading, setEffectiveLoading] = useState(false);

  const fetchEffective = useCallback(async () => {
    setEffectiveLoading(true);
    try {
      const res = await benchmarkService.getEffectiveTrustPolicy();
      setResolved((res as unknown) as ResolvedCaseGovernanceTrustPolicy);
    } catch {
      message.error(t('trust.loadFailed'));
    } finally {
      setEffectiveLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchEffective(); }, [fetchEffective]);

  // Edit form
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<TrustPolicyValidationResult | null>(null);

  // Load org policy into form
  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    benchmarkService.getOrganizationTrustPolicy()
      .then((res) => {
        if (cancelled) return;
        const org = (res as unknown) as OrganizationGovernanceTrustPolicy;
        form.setFieldsValue({
          evidence_aging_hours: org.evidence_aging_hours,
          evidence_stale_hours: org.evidence_stale_hours,
          review_low_confidence_threshold: org.review_low_confidence_threshold,
          auto_review_after_validation: org.auto_review_after_validation,
          auto_validation_after_review_low_confidence: org.auto_validation_after_review_low_confidence,
          auto_validation_on_quality_recheck: org.auto_validation_on_quality_recheck,
        });
      })
      .catch(() => {
        if (cancelled) return;
        // 404 = no org override, use system default
        if (resolved?.system_default) {
          form.setFieldsValue(resolved.system_default);
        }
      });
    return () => { cancelled = true; };
  }, [isAdmin, resolved, form]);

  const handleValidate = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setValidating(true);
      setValidationResult(null);
      const res = await benchmarkService.validateTrustPolicy(values);
      const result = (res as unknown) as TrustPolicyValidationResult;
      setValidationResult(result);
      if (result.valid) {
        message.success(t('trust.validationPass'));
      }
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { detail?: string; details?: string[] } } })?.response;
      if (resp?.data) {
        setValidationResult({ valid: false, detail: resp.data.detail, details: resp.data.details });
        message.error(resp.data.detail || t('trust.validationFail'));
      }
    } finally {
      setValidating(false);
    }
  }, [form, t]);

  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await benchmarkService.upsertTrustPolicy(values);
      message.success(t('trust.saved'));
      setValidationResult(null);
      fetchEffective();
      // Reload org policy
      try {
        const res = await benchmarkService.getOrganizationTrustPolicy();
        const org = (res as unknown) as OrganizationGovernanceTrustPolicy;
        form.setFieldsValue({
          evidence_aging_hours: org.evidence_aging_hours,
          evidence_stale_hours: org.evidence_stale_hours,
          review_low_confidence_threshold: org.review_low_confidence_threshold,
          auto_review_after_validation: org.auto_review_after_validation,
          auto_validation_after_review_low_confidence: org.auto_validation_after_review_low_confidence,
          auto_validation_on_quality_recheck: org.auto_validation_on_quality_recheck,
        });
      } catch { /* ignore */ }
      // Refresh audit
      fetchAudits(1);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || t('trust.saveFailed');
      message.error(msg);
    } finally {
      setSaving(false);
    }
  }, [form, fetchEffective, t]);

  // Audit log
  const [audits, setAudits] = useState<TrustPolicyAuditLog[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditActorFilter, setAuditActorFilter] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState<string | undefined>(undefined);
  const [auditDateRange, setAuditDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);

  const fetchAudits = useCallback(async (page: number) => {
    setAuditLoading(true);
    try {
      const params: Record<string, unknown> = { page, page_size: 20, view: 'summary' };
      if (auditActorFilter) params.actor_user_id = auditActorFilter;
      if (auditActionFilter) params.action = auditActionFilter;
      if (auditDateRange && auditDateRange[0]) params.created_from = auditDateRange[0].toISOString();
      if (auditDateRange && auditDateRange[1]) params.created_to = auditDateRange[1].toISOString();
      const res = await benchmarkService.listTrustPolicyAudits(params as Parameters<typeof benchmarkService.listTrustPolicyAudits>[0]);
      const pd = res as unknown as PaginatedResponse<TrustPolicyAuditLog>;
      setAudits(pd.data ?? []);
      setAuditTotal(pd.total ?? 0);
      setAuditPage(page);
    } catch {
      message.error(t('audit.loadFailed'));
    } finally {
      setAuditLoading(false);
    }
  }, [auditActorFilter, auditActionFilter, auditDateRange, t]);

  useEffect(() => {
    if (isAdmin) fetchAudits(1);
  }, [isAdmin, fetchAudits]);

  const hasOverride = !!resolved?.organization;

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <Breadcrumb style={{ marginBottom: 24 }} items={[
        { title: <HomeOutlined />, href: '/dashboard' },
        { title: <span>{t('decision.breadcrumbRoot')}</span> },
        { title: <span>{t('trust.breadcrumbTrust')}</span> },
      ]} />

      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          <SafetyOutlined style={{ marginRight: 8 }} />
          {t('trust.title')}
        </Title>
        <Text type="secondary">{t('trust.subtitle')}</Text>
      </div>

      {/* Card 1: effective policy */}
      <Card
        title={<span style={{ fontWeight: 600 }}>{t('trust.effectiveTitle')}</span>}
        extra={
          resolved && (
            <Space>
              <Tag color={resolved.organization ? 'orange' : 'default'}>
                {t('decision.sourceLabel')}: {resolved.organization ? t('decision.orgOverride') : t('decision.systemDefault')}
              </Tag>
              {resolved.organization_meta?.updated_at && (
                <Text type="secondary" style={{ fontSize: 12 }}>
                  {t('decision.updatedAt', { time: dayjs(resolved.organization_meta.updated_at).format('YYYY-MM-DD HH:mm') })}
                </Text>
              )}
            </Space>
          )
        }
        style={{ marginBottom: 24 }}
        loading={effectiveLoading}
      >
        {resolved ? (
          <Row gutter={[24, 16]}>
            <Col span={24}>
              <Row gutter={16}>
                <Col span={4}>
                  <Statistic
                    title={t('trust.stats.agingTime')}
                    value={resolved.effective.evidence_aging_hours}
                    suffix="h"
                    valueStyle={{ fontSize: 20 }}
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title={t('trust.stats.staleTime')}
                    value={resolved.effective.evidence_stale_hours}
                    suffix="h"
                    valueStyle={{ fontSize: 20 }}
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title={t('trust.stats.lowConfThreshold')}
                    value={(resolved.effective.review_low_confidence_threshold * 100).toFixed(0)}
                    suffix="%"
                    valueStyle={{ fontSize: 20 }}
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title={t('trust.stats.autoReview')}
                    value={resolved.effective.auto_review_after_validation ? t('trust.valueLabels.on') : t('trust.valueLabels.off')}
                    valueStyle={{ fontSize: 20, color: resolved.effective.auto_review_after_validation ? '#10b981' : '#9ca3af' }}
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title={t('trust.stats.lowConfAutoValidation')}
                    value={resolved.effective.auto_validation_after_review_low_confidence ? t('trust.valueLabels.on') : t('trust.valueLabels.off')}
                    valueStyle={{ fontSize: 20, color: resolved.effective.auto_validation_after_review_low_confidence ? '#10b981' : '#9ca3af' }}
                  />
                </Col>
                <Col span={4}>
                  <Statistic
                    title={t('trust.stats.recheckAutoValidation')}
                    value={resolved.effective.auto_validation_on_quality_recheck ? t('trust.valueLabels.on') : t('trust.valueLabels.off')}
                    valueStyle={{ fontSize: 20, color: resolved.effective.auto_validation_on_quality_recheck ? '#10b981' : '#9ca3af' }}
                  />
                </Col>
              </Row>
            </Col>

            {/* System default vs org override */}
            <Col span={24}>
              <Divider orientation="left" style={{ fontSize: 13, margin: '8px 0 16px' }}>
                {t('trust.policyDetail')}
              </Divider>
              <Descriptions bordered size="small" column={2}>
                {FIELDS.map((field) => (
                  <PolicyComparisonRow
                    key={field}
                    field={field}
                    effective={resolved.effective}
                    systemDefault={resolved.system_default}
                    organization={resolved.organization ?? undefined}
                    hasOverride={hasOverride}
                  />
                ))}
              </Descriptions>
            </Col>

            {!hasOverride && (
              <Col span={24}>
                <Alert
                  type="info"
                  icon={<InfoCircleOutlined />}
                  message={t('trust.noOverrideAlert')}
                  description={t('trust.noOverrideDesc')}
                  showIcon
                />
              </Col>
            )}
          </Row>
        ) : !effectiveLoading ? (
          <Text type="secondary">{t('trust.noPolicy')}</Text>
        ) : null}
      </Card>

      {/* Card 2: edit org policy (admin only) */}
      {isAdmin && (
        <Card
          title={<span style={{ fontWeight: 600 }}>{t('trust.editTitle')}</span>}
          style={{ marginBottom: 24 }}
        >
          <Form
            form={form}
            layout="vertical"
            initialValues={resolved?.system_default ?? {
              evidence_aging_hours: 168,
              evidence_stale_hours: 720,
              review_low_confidence_threshold: 0.65,
              auto_review_after_validation: false,
              auto_validation_after_review_low_confidence: false,
              auto_validation_on_quality_recheck: false,
            }}
          >
            <Row gutter={24}>
              <Col span={12}>
                <Form.Item
                  name="evidence_aging_hours"
                  label={getFieldLabel('evidence_aging_hours')}
                  rules={[{ required: true, message: t('trust.validation.agingRequired') }]}
                  extra={getFieldDesc('evidence_aging_hours')}
                >
                  <InputNumber min={1} step={24} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="evidence_stale_hours"
                  label={getFieldLabel('evidence_stale_hours')}
                  rules={[
                    { required: true, message: t('trust.validation.staleRequired') },
                    ({ getFieldValue }) => ({
                      validator(_, value) {
                        if (!value || getFieldValue('evidence_aging_hours') < value) return Promise.resolve();
                        return Promise.reject(new Error(t('trust.validation.staleGreater')));
                      },
                    }),
                  ]}
                  extra={getFieldDesc('evidence_stale_hours')}
                >
                  <InputNumber min={1} step={24} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="review_low_confidence_threshold"
                  label={getFieldLabel('review_low_confidence_threshold')}
                  rules={[
                    { required: true, message: t('trust.validation.thresholdRequired') },
                    { type: 'number', min: 0.01, max: 1, message: t('trust.validation.thresholdRange') },
                  ]}
                  extra={getFieldDesc('review_low_confidence_threshold')}
                >
                  <InputNumber min={0.01} max={1} step={0.05} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="auto_review_after_validation"
                  label={getFieldLabel('auto_review_after_validation')}
                  valuePropName="checked"
                  extra={getFieldDesc('auto_review_after_validation')}
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="auto_validation_after_review_low_confidence"
                  label={getFieldLabel('auto_validation_after_review_low_confidence')}
                  valuePropName="checked"
                  extra={getFieldDesc('auto_validation_after_review_low_confidence')}
                >
                  <Switch />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  name="auto_validation_on_quality_recheck"
                  label={getFieldLabel('auto_validation_on_quality_recheck')}
                  valuePropName="checked"
                  extra={getFieldDesc('auto_validation_on_quality_recheck')}
                >
                  <Switch />
                </Form.Item>
              </Col>
            </Row>

            {/* Validation result */}
            {validationResult && (
              <Alert
                type={validationResult.valid ? 'success' : 'error'}
                icon={validationResult.valid ? <CheckCircleOutlined /> : undefined}
                message={validationResult.valid ? t('trust.validationPass') : validationResult.detail || t('trust.validationFail')}
                description={
                  validationResult.valid && validationResult.normalized_policy ? (
                    <Descriptions column={2} size="small">
                      {(Object.entries(validationResult.normalized_policy) as [string, boolean | number][]).map(([key, val]) => (
                        <Descriptions.Item key={key} label={getFieldLabel(key as keyof CaseGovernanceTrustPolicyProfile)}>
                          {typeof val === 'boolean' ? (val ? t('trust.valueLabels.on') : t('trust.valueLabels.off')) : key === 'review_low_confidence_threshold' ? `${(val as number * 100).toFixed(0)}%` : `${val}h`}
                        </Descriptions.Item>
                      ))}
                    </Descriptions>
                  ) : validationResult.details ? (
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {validationResult.details.map((d, i) => <li key={i}>{d}</li>)}
                    </ul>
                  ) : null
                }
                showIcon={validationResult.valid}
                style={{ marginBottom: 16 }}
              />
            )}

            <Space>
              <Button onClick={handleValidate} loading={validating}>
                {t('trust.previewValidate')}
              </Button>
              <Button
                type="primary"
                onClick={handleSave}
                loading={saving}
                disabled={validationResult !== null && !validationResult.valid}
              >
                {t('trust.save')}
              </Button>
            </Space>
          </Form>
        </Card>
      )}

      {!isAdmin && (
        <Alert
          type="info"
          message={t('audit.onlyAdmin')}
          style={{ marginBottom: 24 }}
          showIcon
        />
      )}

      {/* Card 3: audit log (admin only) */}
      {isAdmin && (
        <Card title={<span style={{ fontWeight: 600 }}>{t('audit.title')}</span>}>
          <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <InputNumber
              placeholder={t('audit.actorPlaceholder')}
              value={auditActorFilter || undefined}
              onChange={(v) => setAuditActorFilter(v ? String(v) : '')}
              style={{ width: 180 }}
              prefix="actor:"
            />
            <Select
              allowClear
              placeholder={t('audit.actionPlaceholder')}
              style={{ width: 120 }}
              value={auditActionFilter}
              onChange={(v) => setAuditActionFilter(v)}
              options={[{ value: 'upsert', label: t('audit.actionUpsert') }]}
            />
            <DatePicker.RangePicker
              value={auditDateRange}
              onChange={(dates) => setAuditDateRange(dates)}
              style={{ width: 260 }}
            />
            <Button onClick={() => fetchAudits(1)}>{t('audit.filter')}</Button>
            <Text type="secondary">{t('audit.totalCount', { count: auditTotal })}</Text>
          </div>

          <Table
            size="small"
            loading={auditLoading}
            rowKey="id"
            dataSource={audits}
            pagination={{
              current: auditPage,
              pageSize: 20,
              total: auditTotal,
              size: 'small',
              showTotal: (count) => t('audit.totalCount', { count }),
              onChange: (p) => fetchAudits(p),
            }}
            columns={[
              { title: t('audit.columns.id'), dataIndex: 'id', width: 60 },
              { title: t('audit.columns.actor'), dataIndex: 'actor_user_id', width: 140, ellipsis: true },
              { title: t('audit.columns.role'), dataIndex: 'actor_role', width: 80, render: (v: string) => <Tag>{v}</Tag> },
              { title: t('audit.columns.action'), dataIndex: 'action', width: 80, render: (v: string) => <Tag color="blue">{v}</Tag> },
              { title: t('audit.columns.method'), dataIndex: 'request_method', width: 70 },
              { title: t('audit.columns.ip'), dataIndex: 'client_ip', width: 120, render: (v?: string) => v || '-' },
              { title: t('audit.columns.time'), dataIndex: 'created_at', width: 160, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss') },
            ]}
            expandable={{
              expandedRowRender: (record) => (
                <div style={{ padding: '8px 0' }}>
                  <Row gutter={16}>
                    <Col span={12}>
                      <Text strong>{t('audit.beforeChange')}</Text>
                      <pre style={{ fontSize: 11, maxHeight: 200, overflow: 'auto', margin: '4px 0', padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                        {record.before_snapshot ? JSON.stringify(record.before_snapshot, null, 2) : t('audit.firstCreate')}
                      </pre>
                    </Col>
                    <Col span={12}>
                      <Text strong>{t('audit.afterChange')}</Text>
                      <pre style={{ fontSize: 11, maxHeight: 200, overflow: 'auto', margin: '4px 0', padding: 8, background: '#f5f5f5', borderRadius: 4 }}>
                        {record.after_snapshot ? JSON.stringify(record.after_snapshot, null, 2) : '-'}
                      </pre>
                    </Col>
                  </Row>
                </div>
              ),
            }}
          />
        </Card>
      )}
    </div>
  );
}
