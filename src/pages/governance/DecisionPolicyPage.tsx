/**
 * Decision policy management
 * Slice: S10
 *
 * Capability: view effective decision policy / edit reason classification & action mapping / audit log
 */

import { memo, useState, useCallback, useEffect, useMemo } from 'react';
import {
  Card, Typography, Tag, Button, Space, Table, Tabs,
  Alert, Breadcrumb, Row, Col, Input, Select, message, Divider, DatePicker,
} from 'antd';
import {
  HomeOutlined, BranchesOutlined, CheckCircleOutlined,
  ArrowUpOutlined, ArrowDownOutlined, PlusOutlined, DeleteOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { benchmarkService } from '@/services/benchmark';
import type {
  ResolvedCaseGovernanceDecisionPolicy,
  OrganizationGovernanceDecisionPolicy,
  DecisionPolicyValidationResult,
  DecisionPolicyAuditLog,
} from '@/types/api/benchmark';
import {
  GOVERNANCE_ACTIONS,
  TRUST_CLASSIFICATION_REASONS,
  DEFAULT_UNTRUSTED_REASONS,
  DEFAULT_WATCH_REASONS,
  DEFAULT_PRIMARY_ACTION_BY_REASON,
} from '@/types/api/benchmark';
import type { PaginatedResponse } from '@/types';
import { isPersistedOrgAdmin } from '@/utils';

const { Title, Text } = Typography;

/** Reason display label (i18n via lookup) */
const getReasonLabel = (reason: string): string => {
  const key = `governance:decision.reasonLabels.${reason}`;
  const v = i18next.t(key);
  return v === key ? reason : v;
};

/** Sortable reason list */
const SortableReasonList = memo(function SortableReasonList({
  items, color, onMoveUp, onMoveDown, onRemove, showRemove = true,
}: {
  items: string[]; color: string;
  onMoveUp: (idx: number) => void;
  onMoveDown: (idx: number) => void;
  onRemove?: (reason: string) => void;
  showRemove?: boolean;
}) {
  const { t } = useTranslation('governance');
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
      {items.map((reason, idx) => (
        <Tag
          key={reason}
          color={color}
          closable={showRemove && !!onRemove}
          onClose={() => onRemove?.(reason)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}
        >
          <span style={{ fontSize: 10, color: '#999', marginRight: 2 }}>{idx + 1}.</span>
          {getReasonLabel(reason)}
          <Button.Group size="small" style={{ marginLeft: 4 }}>
            <Button size="small" type="text" icon={<ArrowUpOutlined />} style={{ padding: '0 2px', fontSize: 10 }} onClick={() => onMoveUp(idx)} disabled={idx === 0} />
            <Button size="small" type="text" icon={<ArrowDownOutlined />} style={{ padding: '0 2px', fontSize: 10 }} onClick={() => onMoveDown(idx)} disabled={idx === items.length - 1} />
          </Button.Group>
        </Tag>
      ))}
      {items.length === 0 && <Text type="secondary">{t('decision.emptyList')}</Text>}
    </div>
  );
});

export default function DecisionPolicyPage() {
  const { t } = useTranslation('governance');
  // Permission
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    setIsAdmin(isPersistedOrgAdmin());
  }, []);

  // Effective policy
  const [resolved, setResolved] = useState<ResolvedCaseGovernanceDecisionPolicy | null>(null);
  const [effectiveLoading, setEffectiveLoading] = useState(false);

  const fetchEffective = useCallback(async () => {
    setEffectiveLoading(true);
    try {
      const res = await benchmarkService.getEffectiveDecisionPolicy();
      setResolved((res as unknown) as ResolvedCaseGovernanceDecisionPolicy);
    } catch {
      message.error(t('decision.loadFailed'));
    } finally {
      setEffectiveLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchEffective(); }, [fetchEffective]);

  // 编辑状态
  const [untrustedReasons, setUntrustedReasons] = useState<string[]>([]);
  const [watchReasons, setWatchReasons] = useState<string[]>([]);
  const [attentionReasons, setAttentionReasons] = useState<string[]>([]);
  const [actionPriorityReasons, setActionPriorityReasons] = useState<string[]>([]);
  const [actionByReason, setActionByReason] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<DecisionPolicyValidationResult | null>(null);

  // 加载组织策略到编辑状态
  useEffect(() => {
    if (!isAdmin) return;
    benchmarkService.getOrganizationDecisionPolicy()
      .then((res) => {
        const org = (res as unknown) as OrganizationGovernanceDecisionPolicy;
        setUntrustedReasons(org.untrusted_reason_priority ?? []);
        setWatchReasons(org.watch_reason_priority ?? []);
        setAttentionReasons(org.attention_reason_priority ?? []);
        setActionPriorityReasons(org.primary_action_reason_priority ?? []);
        setActionByReason(org.primary_action_by_reason ?? {});
      })
      .catch(() => {
        // 404 = 无组织覆盖，用系统默认
        if (resolved?.system_default) {
          const d = resolved.system_default;
          setUntrustedReasons([...d.untrusted_reason_priority]);
          setWatchReasons([...d.watch_reason_priority]);
          setAttentionReasons([...d.attention_reason_priority]);
          setActionPriorityReasons([...d.primary_action_reason_priority]);
          setActionByReason({ ...d.primary_action_by_reason });
        } else {
          setUntrustedReasons([...DEFAULT_UNTRUSTED_REASONS]);
          setWatchReasons([...DEFAULT_WATCH_REASONS]);
          setActionByReason({ ...DEFAULT_PRIMARY_ACTION_BY_REASON });
        }
      });
  }, [isAdmin, resolved]);

  // 分类验证: untrusted + watch 必须覆盖所有 23 个 trust reason
  const partitionStatus = useMemo(() => {
    const all = new Set<string>(TRUST_CLASSIFICATION_REASONS);
    const inWatch = new Set(watchReasons);
    const overlap = untrustedReasons.filter((r) => inWatch.has(r));
    const covered = new Set<string>([...untrustedReasons, ...watchReasons]);
    const missing = [...all].filter((r) => !covered.has(r));
    const extra = [...covered].filter((r) => !all.has(r));
    return { overlap, missing, extra, valid: overlap.length === 0 && missing.length === 0 && extra.length === 0 };
  }, [untrustedReasons, watchReasons]);

  // 列表操作 helper
  const moveItem = useCallback((list: string[], idx: number, dir: -1 | 1): string[] => {
    const next = [...list];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return next;
    [next[idx], next[target]] = [next[target], next[idx]];
    return next;
  }, []);

  const moveUntrusted = useCallback((idx: number, dir: -1 | 1) => setUntrustedReasons((l) => moveItem(l, idx, dir)), [moveItem]);
  const moveWatch = useCallback((idx: number, dir: -1 | 1) => setWatchReasons((l) => moveItem(l, idx, dir)), [moveItem]);
  const moveActionPriority = useCallback((idx: number, dir: -1 | 1) => setActionPriorityReasons((l) => moveItem(l, idx, dir)), [moveItem]);

  // 在 untrusted/watch 间移动
  const moveToWatch = useCallback((reason: string) => {
    setUntrustedReasons((l) => l.filter((r) => r !== reason));
    setWatchReasons((l) => [...l, reason]);
  }, []);
  const moveToUntrusted = useCallback((reason: string) => {
    setWatchReasons((l) => l.filter((r) => r !== reason));
    setUntrustedReasons((l) => [...l, reason]);
  }, []);

  // Action mapping 操作
  const addActionMapping = useCallback(() => {
    const used = new Set(Object.keys(actionByReason));
    const available = Object.keys(DEFAULT_PRIMARY_ACTION_BY_REASON).filter((r) => !used.has(r));
    if (available.length === 0) { message.info(t('decision.noMoreReasons')); return; }
    const reason = available[0];
    setActionByReason((prev) => ({ ...prev, [reason]: DEFAULT_PRIMARY_ACTION_BY_REASON[reason] }));
  }, [actionByReason, t]);

  const removeActionMapping = useCallback((reason: string) => {
    setActionByReason((prev) => {
      const next = { ...prev };
      delete next[reason];
      return next;
    });
  }, []);

  // Validate
  const handleValidate = useCallback(async () => {
    setValidating(true);
    setValidationResult(null);
    try {
      const res = await benchmarkService.validateDecisionPolicy({
        untrusted_reason_priority: untrustedReasons,
        watch_reason_priority: watchReasons,
        attention_reason_priority: attentionReasons,
        primary_action_reason_priority: actionPriorityReasons,
        primary_action_by_reason: actionByReason,
      });
      const result = (res as unknown) as DecisionPolicyValidationResult;
      setValidationResult(result);
      if (result.valid) message.success(t('decision.validationPass'));
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { detail?: string; details?: DecisionPolicyValidationResult['details'] } } })?.response;
      if (resp?.data) {
        setValidationResult({ valid: false, detail: resp.data.detail, details: resp.data.details });
        message.error(resp.data.detail || t('decision.validationFail'));
      }
    } finally {
      setValidating(false);
    }
  }, [untrustedReasons, watchReasons, attentionReasons, actionPriorityReasons, actionByReason, t]);

  // Save
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await benchmarkService.upsertDecisionPolicy({
        untrusted_reason_priority: untrustedReasons,
        watch_reason_priority: watchReasons,
        attention_reason_priority: attentionReasons,
        primary_action_reason_priority: actionPriorityReasons,
        primary_action_by_reason: actionByReason,
      });
      message.success(t('decision.saved'));
      setValidationResult(null);
      fetchEffective();
      fetchAudits(1);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || t('decision.saveFailed');
      message.error(msg);
    } finally {
      setSaving(false);
    }
  }, [untrustedReasons, watchReasons, attentionReasons, actionPriorityReasons, actionByReason, fetchEffective, t]);

  // 审计日志
  const [audits, setAudits] = useState<DecisionPolicyAuditLog[]>([]);
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
      if (auditDateRange?.[0]) params.created_from = auditDateRange[0].toISOString();
      if (auditDateRange?.[1]) params.created_to = auditDateRange[1].toISOString();
      const res = await benchmarkService.listDecisionPolicyAudits(params as Parameters<typeof benchmarkService.listDecisionPolicyAudits>[0]);
      const pd = res as unknown as PaginatedResponse<DecisionPolicyAuditLog>;
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
  const e = resolved?.effective;

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <Breadcrumb style={{ marginBottom: 24 }} items={[
        { title: <HomeOutlined />, href: '/dashboard' },
        { title: <span>{t('decision.breadcrumbRoot')}</span> },
        { title: <span>{t('decision.breadcrumbDecision')}</span> },
      ]} />

      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          <BranchesOutlined style={{ marginRight: 8 }} />
          {t('decision.title')}
        </Title>
        <Text type="secondary">{t('decision.subtitle')}</Text>
      </div>

      {/* Card 1: effective policy */}
      <Card
        title={<span style={{ fontWeight: 600 }}>{t('decision.effectiveTitle')}</span>}
        extra={
          resolved && (
            <Space>
              <Tag color={hasOverride ? 'orange' : 'default'}>{t('decision.sourceLabel')}: {hasOverride ? t('decision.orgOverride') : t('decision.systemDefault')}</Tag>
              {resolved.organization_meta?.updated_at && (
                <Text type="secondary" style={{ fontSize: 12 }}>{t('decision.updatedAt', { time: dayjs(resolved.organization_meta.updated_at).format('YYYY-MM-DD HH:mm') })}</Text>
              )}
            </Space>
          )
        }
        style={{ marginBottom: 24 }}
        loading={effectiveLoading}
      >
        {e ? (
          <>
            {/* Reason classification */}
            <Divider orientation="left" style={{ fontSize: 13, margin: '0 0 12px' }}>{t('decision.reasonClassification')}</Divider>
            <Row gutter={24}>
              <Col span={12}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  <Tag color="red" style={{ marginRight: 4 }}>{t('decision.untrusted')}</Tag>Untrusted ({e.untrusted_reason_priority.length})
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {e.untrusted_reason_priority.map((r, i) => (
                    <Tag key={r} color="error"><span style={{ fontSize: 10, marginRight: 2 }}>{i + 1}.</span>{getReasonLabel(r)}</Tag>
                  ))}
                </div>
              </Col>
              <Col span={12}>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  <Tag color="warning" style={{ marginRight: 4 }}>{t('decision.watch')}</Tag>Watch ({e.watch_reason_priority.length})
                </Text>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {e.watch_reason_priority.map((r, i) => (
                    <Tag key={r} color="warning"><span style={{ fontSize: 10, marginRight: 2 }}>{i + 1}.</span>{getReasonLabel(r)}</Tag>
                  ))}
                </div>
              </Col>
            </Row>

            {/* Attention */}
            <Divider orientation="left" style={{ fontSize: 13, margin: '16px 0 12px' }}>{t('decision.attentionReasons')} ({e.attention_reason_priority.length})</Divider>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
              {e.attention_reason_priority.map((r) => (
                <Tag key={r} color="blue">{getReasonLabel(r)}</Tag>
              ))}
            </div>

            {/* Action Mapping */}
            <Divider orientation="left" style={{ fontSize: 13, margin: '16px 0 12px' }}>{t('decision.actionMapping')}</Divider>
            <Table
              size="small"
              rowKey={(r) => r[0]}
              dataSource={Object.entries(e.primary_action_by_reason)}
              pagination={false}
              columns={[
                { title: 'Reason', dataIndex: 0, width: 280, render: (r: string) => <Text code>{getReasonLabel(r)}</Text> },
                { title: 'Action', dataIndex: 1, width: 150, render: (a: string) => <Tag color={GOVERNANCE_ACTIONS[a as keyof typeof GOVERNANCE_ACTIONS]?.color}>{GOVERNANCE_ACTIONS[a as keyof typeof GOVERNANCE_ACTIONS]?.label || a}</Tag> },
              ]}
            />

            {!hasOverride && (
              <Alert type="info" message={t('decision.noOverrideAlert')} style={{ marginTop: 16 }} showIcon />
            )}
          </>
        ) : !effectiveLoading ? <Text type="secondary">{t('decision.noPolicy')}</Text> : null}
      </Card>

      {/* Card 2: edit org policy (admin only) */}
      {isAdmin && (
        <Card
          title={<span style={{ fontWeight: 600 }}>{t('decision.editTitle')}</span>}
          style={{ marginBottom: 24 }}
        >
          {/* Partition status */}
          {!partitionStatus.valid && (
            <Alert
              type="warning"
              message={t('decision.partitionWarning')}
              description={
                <ul style={{ margin: 0, paddingLeft: 16 }}>
                  {partitionStatus.overlap.length > 0 && <li>{t('decision.partitionOverlap')}: {partitionStatus.overlap.map((r) => getReasonLabel(r)).join(', ')}</li>}
                  {partitionStatus.missing.length > 0 && <li>{t('decision.partitionMissing')}: {partitionStatus.missing.map((r) => getReasonLabel(r)).join(', ')}</li>}
                  {partitionStatus.extra.length > 0 && <li>{t('decision.partitionExtra')}: {partitionStatus.extra.map((r) => getReasonLabel(r)).join(', ')}</li>}
                </ul>
              }
              style={{ marginBottom: 16 }}
              showIcon
            />
          )}

          <Tabs items={[
            {
              key: 'classification',
              label: t('decision.tabClassification'),
              children: (
                <Row gutter={24}>
                  <Col span={12}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                      <Tag color="red">{t('decision.untrusted')}</Tag> Untrusted ({untrustedReasons.length})
                    </Text>
                    <SortableReasonList
                      items={untrustedReasons} color="error"
                      onMoveUp={(i) => moveUntrusted(i, -1)}
                      onMoveDown={(i) => moveUntrusted(i, 1)}
                      onRemove={moveToWatch}
                    />
                  </Col>
                  <Col span={12}>
                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                      <Tag color="warning">{t('decision.watch')}</Tag> Watch ({watchReasons.length})
                    </Text>
                    <SortableReasonList
                      items={watchReasons} color="warning"
                      onMoveUp={(i) => moveWatch(i, -1)}
                      onMoveDown={(i) => moveWatch(i, 1)}
                      onRemove={moveToUntrusted}
                    />
                  </Col>
                </Row>
              ),
            },
            {
              key: 'attention-action',
              label: t('decision.tabAttention'),
              children: (
                <>
                  {/* Attention Reasons */}
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>{t('decision.attentionReasons')}</Text>
                  <Select
                    mode="multiple"
                    value={attentionReasons}
                    onChange={setAttentionReasons}
                    style={{ width: '100%', marginBottom: 24 }}
                    placeholder={t('decision.attentionSelectPlaceholder')}
                    options={TRUST_CLASSIFICATION_REASONS.map((k) => ({ value: k, label: getReasonLabel(k) }))}
                    maxTagCount={10}
                  />

                  {/* Primary Action Priority */}
                  <Text strong style={{ display: 'block', marginBottom: 8 }}>{t('decision.primaryActionPriority')}</Text>
                  <SortableReasonList
                    items={actionPriorityReasons} color="blue"
                    onMoveUp={(i) => moveActionPriority(i, -1)}
                    onMoveDown={(i) => moveActionPriority(i, 1)}
                    showRemove={false}
                  />

                  {/* Action Mapping Table */}
                  <Divider orientation="left" style={{ fontSize: 13, margin: '24px 0 12px' }}>
                    {t('decision.actionMappingCount', { count: Object.keys(actionByReason).length })}
                  </Divider>
                  <div style={{ marginBottom: 8 }}>
                    <Button size="small" icon={<PlusOutlined />} onClick={addActionMapping}>{t('decision.addMapping')}</Button>
                  </div>
                  <Table
                    size="small"
                    rowKey={(r) => r[0]}
                    dataSource={Object.entries(actionByReason)}
                    pagination={false}
                    columns={[
                      {
                        title: 'Reason', dataIndex: 0, width: 250,
                        render: (reason: string) => {
                          const used = new Set(Object.keys(actionByReason));
                          return (
                            <Select
                              size="small" value={reason} style={{ width: '100%' }}
                              onChange={(newReason) => {
                                setActionByReason((prev) => {
                                  const next = { ...prev };
                                  const action = next[reason];
                                  delete next[reason];
                                  next[newReason] = action || DEFAULT_PRIMARY_ACTION_BY_REASON[newReason] || 'inspect_detail';
                                  return next;
                                });
                              }}
                              options={TRUST_CLASSIFICATION_REASONS
                                .filter((k) => k === reason || !used.has(k))
                                .map((k) => ({ value: k, label: getReasonLabel(k) }))}
                            />
                          );
                        },
                      },
                      {
                        title: 'Action', dataIndex: 1, width: 180,
                        render: (action: string, entry: [string, string]) => (
                          <Select
                            size="small" value={action} style={{ width: '100%' }}
                            onChange={(a) => setActionByReason((prev) => ({ ...prev, [entry[0]]: a }))}
                            options={Object.entries(GOVERNANCE_ACTIONS).map(([k, v]) => ({ value: k, label: v.label }))}
                          />
                        ),
                      },
                      {
                        title: '', width: 40,
                        render: (_: unknown, entry: [string, string]) => (
                          <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => removeActionMapping(entry[0])} />
                        ),
                      },
                    ]}
                  />
                </>
              ),
            },
          ]} />

          {/* Validation result */}
          {validationResult && (
            <Alert
              type={validationResult.valid ? 'success' : 'error'}
              icon={validationResult.valid ? <CheckCircleOutlined /> : undefined}
              message={validationResult.valid ? t('decision.validationPass') : validationResult.detail || t('decision.validationFail')}
              description={
                validationResult.details && validationResult.details.length > 0 ? (
                  <ul style={{ margin: 0, paddingLeft: 16 }}>
                    {validationResult.details.map((d, i) => <li key={i}>{d.message}</li>)}
                  </ul>
                ) : null
              }
              showIcon={validationResult.valid}
              style={{ marginTop: 16, marginBottom: 16 }}
            />
          )}

          <Space style={{ marginTop: 16 }}>
            <Button onClick={handleValidate} loading={validating}>{t('decision.previewValidate')}</Button>
            <Button type="primary" onClick={handleSave} loading={saving} disabled={validationResult !== null && !validationResult.valid}>{t('decision.save')}</Button>
          </Space>
        </Card>
      )}

      {!isAdmin && <Alert type="info" message={t('audit.onlyAdmin')} style={{ marginBottom: 24 }} showIcon />}

      {/* Card 3: audit log */}
      {isAdmin && (
        <Card title={<span style={{ fontWeight: 600 }}>{t('audit.title')}</span>}>
          <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <Input placeholder={t('audit.actorPlaceholder')} value={auditActorFilter} onChange={(e) => setAuditActorFilter(e.target.value)} style={{ width: 180 }} />
            <Select allowClear placeholder={t('audit.actionPlaceholder')} style={{ width: 120 }} value={auditActionFilter} onChange={(v) => setAuditActionFilter(v)} options={[{ value: 'upsert', label: t('audit.actionUpsert') }]} />
            <DatePicker.RangePicker
              value={auditDateRange}
              onChange={(dates) => setAuditDateRange(dates)}
              style={{ width: 260 }}
            />
            <Button onClick={() => fetchAudits(1)}>{t('audit.filter')}</Button>
            <Text type="secondary">{t('audit.totalCount', { count: auditTotal })}</Text>
          </div>
          <Table
            size="small" loading={auditLoading} rowKey="id" dataSource={audits}
            pagination={{ current: auditPage, pageSize: 20, total: auditTotal, size: 'small', showTotal: (count) => t('audit.totalCount', { count }), onChange: (p) => fetchAudits(p) }}
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
              ),
            }}
          />
        </Card>
      )}
    </div>
  );
}
