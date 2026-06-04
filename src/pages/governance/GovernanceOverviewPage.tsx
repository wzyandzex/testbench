/**
 * Organization governance overview
 * Slice: S11
 *
 * Capability: summary stats / benchmark hotspots / case governance list / action preview
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Card, Typography, Tag, Button, Space, Table, Statistic, Row, Col,
  Alert, Breadcrumb, Input, Select, Collapse, message, Modal, Switch,
} from 'antd';
import {
  HomeOutlined, DashboardOutlined, SafetyCertificateOutlined,
  WarningOutlined, EyeOutlined, ThunderboltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { benchmarkService } from '@/services/benchmark';
import type {
  CaseGovernanceSummary,
  CaseGovernanceBenchmarkHotspotView,
  CaseGovernanceListItem,
  CaseGovernanceActionPreview,
  GovernanceAction,
} from '@/types/api/benchmark';
import {
  GOVERNANCE_TRUST_CONFIG,
  GOVERNANCE_FRESHNESS_CONFIG,
  GOVERNANCE_CONFIDENCE_CONFIG,
  GOVERNANCE_ACTIONS,
  CASE_ASSET_STATUS_CONFIG,
  REVIEW_DECISION_CONFIG,
} from '@/types/api/benchmark';
import type { PaginatedResponse } from '@/types';

const { Title, Text } = Typography;

export default function GovernanceOverviewPage() {
  const { t } = useTranslation('governance');
  // ============ Summary ============
  const [summary, setSummary] = useState<CaseGovernanceSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);

  const fetchSummary = useCallback(async () => {
    setSummaryLoading(true);
    try {
      const res = await benchmarkService.getGovernanceSummary();
      setSummary((res as unknown) as CaseGovernanceSummary);
    } catch {
      message.error(t('overview.summaryFailed'));
    } finally {
      setSummaryLoading(false);
    }
  }, [t]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);

  // ============ Benchmark Hotspots ============
  const [benchmarks, setBenchmarks] = useState<CaseGovernanceBenchmarkHotspotView[]>([]);
  const [bmTotal, setBmTotal] = useState(0);
  const [bmPage, setBmPage] = useState(1);
  const [bmLoading, setBmLoading] = useState(false);
  const [bmSearch, setBmSearch] = useState('');
  const [bmAttentionOnly, setBmAttentionOnly] = useState(false);

  const fetchBenchmarks = useCallback(async (page: number) => {
    setBmLoading(true);
    try {
      const res = await benchmarkService.listGovernanceBenchmarks({
        benchmark_search: bmSearch || undefined,
        attention_required_only: bmAttentionOnly || undefined,
        page,
        page_size: 10,
      });
      const pd = (res as unknown) as PaginatedResponse<CaseGovernanceBenchmarkHotspotView>;
      setBenchmarks(pd.data ?? []);
      setBmTotal(pd.total ?? 0);
      setBmPage(page);
    } catch {
      message.error(t('overview.benchmarkFailed'));
    } finally {
      setBmLoading(false);
    }
  }, [bmSearch, bmAttentionOnly, t]);

  useEffect(() => { fetchBenchmarks(1); }, [fetchBenchmarks]);

  // ============ Case List ============
  const [cases, setCases] = useState<CaseGovernanceListItem[]>([]);
  const [caseTotal, setCaseTotal] = useState(0);
  const [casePage, setCasePage] = useState(1);
  const [caseLoading, setCaseLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [selectedRows, setSelectedRows] = useState<CaseGovernanceListItem[]>([]);

  // Filters
  const [filterBenchmarkId, setFilterBenchmarkId] = useState<string | undefined>(undefined);
  const [filterBenchmarkSearch, setFilterBenchmarkSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | undefined>(undefined);
  const [filterTrustPosture, setFilterTrustPosture] = useState<string | undefined>(undefined);
  const [filterEvidenceFreshness, setFilterEvidenceFreshness] = useState<string | undefined>(undefined);
  const [filterConfidencePosture, setFilterConfidencePosture] = useState<string | undefined>(undefined);
  const [filterPrimaryAction, setFilterPrimaryAction] = useState<string | undefined>(undefined);
  const [filterAttentionRequired, setFilterAttentionRequired] = useState(false);
  const [filterSearch, setFilterSearch] = useState('');

  const fetchCases = useCallback(async (page: number) => {
    setCaseLoading(true);
    try {
      const res = await benchmarkService.listGovernanceCases({
        benchmark_id: filterBenchmarkId || undefined,
        benchmark_search: filterBenchmarkSearch || undefined,
        status: filterStatus || undefined,
        trust_posture: filterTrustPosture || undefined,
        evidence_freshness: filterEvidenceFreshness || undefined,
        confidence_posture: filterConfidencePosture || undefined,
        primary_action: filterPrimaryAction || undefined,
        attention_required: filterAttentionRequired || undefined,
        search: filterSearch || undefined,
        page,
        page_size: 20,
      });
      const pd = (res as unknown) as PaginatedResponse<CaseGovernanceListItem>;
      setCases(pd.data ?? []);
      setCaseTotal(pd.total ?? 0);
      setCasePage(page);
    } catch {
      message.error(t('cases.loadFailed'));
    } finally {
      setCaseLoading(false);
    }
  }, [filterBenchmarkId, filterBenchmarkSearch, filterStatus, filterTrustPosture,
    filterEvidenceFreshness, filterConfidencePosture, filterPrimaryAction,
    filterAttentionRequired, filterSearch, t]);

  useEffect(() => { fetchCases(1); }, [fetchCases]);

  // ============ Action Preview ============
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewAction, setPreviewAction] = useState<GovernanceAction>('validate_cases');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewResult, setPreviewResult] = useState<CaseGovernanceActionPreview | null>(null);

  const handlePreviewAction = useCallback(async (action: GovernanceAction) => {
    if (selectedRows.length === 0) {
      message.warning(t('cases.selectFirst'));
      return;
    }
    setPreviewAction(action);
    setPreviewLoading(true);
    setPreviewModalVisible(true);
    setPreviewResult(null);
    try {
      const items = selectedRows.map((r) => ({
        benchmark_id: r.benchmark_id,
        case_key: r.case_key,
      }));
      const res = await benchmarkService.previewGovernanceAction({ action, items });
      setPreviewResult((res as unknown) as CaseGovernanceActionPreview);
    } catch {
      message.error(t('cases.previewFailed'));
    } finally {
      setPreviewLoading(false);
    }
  }, [selectedRows, t]);

  // Benchmark row click → filter cases
  const handleBenchmarkRowClick = useCallback((record: CaseGovernanceBenchmarkHotspotView) => {
    setFilterBenchmarkId(record.benchmark_id);
    setFilterBenchmarkSearch(record.benchmark_display_name || record.benchmark_name || '');
  }, []);

  const clearBenchmarkFilter = useCallback(() => {
    setFilterBenchmarkId(undefined);
    setFilterBenchmarkSearch('');
  }, []);

  // Summary card grouping
  const summaryCards = useMemo(() => {
    if (!summary) return null;
    return (
      <>
        <Row gutter={[16, 16]}>
          <Col span={4}><Card size="small"><Statistic title={t('stats.totalCases')} value={summary.total_cases} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title={t('stats.active')} value={summary.active_cases} valueStyle={{ color: '#52c41a' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title={t('stats.retired')} value={summary.retired_cases} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title={t('stats.needsAttention')} value={summary.attention_required_cases} valueStyle={{ color: summary.attention_required_cases > 0 ? '#faad14' : undefined }} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title={t('stats.lowConfidence')} value={summary.low_confidence_cases} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title={t('stats.flaky')} value={summary.flaky_cases} /></Card></Col>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
          <Col span={4}><Card size="small"><Statistic title={t('stats.insufficientEvidence')} value={summary.insufficient_evidence_cases} /></Card></Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title={<span><Tag color="success">{t('overview.trustTags.trusted')}</Tag></span>} value={summary.trusted_active_cases} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title={<span><Tag color="warning">{t('overview.trustTags.watch')}</Tag></span>} value={summary.watch_active_cases} />
            </Card>
          </Col>
          <Col span={4}>
            <Card size="small">
              <Statistic title={<span><Tag color="error">{t('overview.trustTags.untrusted')}</Tag></span>} value={summary.untrusted_active_cases} />
            </Card>
          </Col>
          <Col span={4}><Card size="small"><Statistic title={t('stats.remediationPending')} value={summary.remediation_pending_cases} /></Card></Col>
          <Col span={4}><Card size="small"><Statistic title={t('stats.remediationRegressed')} value={summary.remediation_regressed_cases} valueStyle={{ color: '#ff4d4f' }} /></Card></Col>
        </Row>
        <Row gutter={[16, 16]} style={{ marginTop: 12 }}>
          <Col span={6}>
            <Card size="small">
              <Statistic title={t('stats.retirementRate')} value={summary.retirement_rate} precision={2} suffix="%" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title={t('stats.flakinessRate')} value={summary.flakiness_rate} precision={2} suffix="%" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title={t('stats.lowConfidenceRate')} value={summary.low_confidence_rate} precision={2} suffix="%" />
            </Card>
          </Col>
          <Col span={6}>
            <Card size="small">
              <Statistic title={t('stats.insufficientEvidenceRate')} value={summary.insufficient_evidence_rate} precision={2} suffix="%" />
            </Card>
          </Col>
        </Row>
      </>
    );
  }, [summary, t]);

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <Breadcrumb style={{ marginBottom: 24 }} items={[
        { title: <HomeOutlined />, href: '/dashboard' },
        { title: <span>{t('overview.breadcrumb')}</span> },
      ]} />

      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          <DashboardOutlined style={{ marginRight: 8 }} />
          {t('overview.title')}
        </Title>
        <Space>
          <Text type="secondary">{t('overview.subtitle')}</Text>
          {summary?.effective_trust_policy && (
            <Tag color={summary.effective_trust_policy.organization_override_applied ? 'orange' : 'default'}>
              {t('policy.source')}: {summary.effective_trust_policy.organization_override_applied ? t('policy.orgOverride') : t('policy.systemDefault')}
            </Tag>
          )}
        </Space>
      </div>

      {/* Section 1: Summary Cards */}
      <Card
        title={<span style={{ fontWeight: 600 }}>{t('overview.summaryTitle')}</span>}
        style={{ marginBottom: 24 }}
        loading={summaryLoading}
      >
        {summaryCards}
        {!summary && !summaryLoading && <Text type="secondary">{t('overview.summaryEmpty')}</Text>}
      </Card>

      {/* Section 2: Benchmark Hotspots */}
      <Card
        title={<span style={{ fontWeight: 600 }}>{t('overview.benchmarkHotspots')}</span>}
        style={{ marginBottom: 24 }}
        extra={<Text type="secondary">{t('overview.benchmarkCount', { count: bmTotal })}</Text>}
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
          <Input.Search
            placeholder={t('overview.controls.search')}
            value={bmSearch}
            onChange={(e) => setBmSearch(e.target.value)}
            onSearch={() => fetchBenchmarks(1)}
            style={{ width: 280 }}
            allowClear
          />
          <Space>
            <Text>{t('overview.controls.attentionOnly')}</Text>
            <Switch checked={bmAttentionOnly} onChange={(v) => setBmAttentionOnly(v)} />
          </Space>
          <Button onClick={() => fetchBenchmarks(1)}>{t('overview.controls.refresh')}</Button>
        </div>
        <Table
          size="small"
          loading={bmLoading}
          rowKey="benchmark_id"
          dataSource={benchmarks}
          onRow={(record) => ({
            onClick: () => handleBenchmarkRowClick(record),
            style: { cursor: 'pointer' },
          })}
          pagination={{
            current: bmPage, pageSize: 10, total: bmTotal, size: 'small',
            showTotal: (count) => t('overview.benchmarkCount', { count }),
            onChange: (p) => fetchBenchmarks(p),
          }}
          scroll={{ x: 1600 }}
          columns={[
            {
              title: 'Benchmark', dataIndex: 'benchmark_display_name', width: 200, ellipsis: true,
              render: (v: string, r: CaseGovernanceBenchmarkHotspotView) => (
                <Space direction="vertical" size={0}>
                  <Text strong>{v || r.benchmark_name || r.benchmark_id}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>{r.benchmark_type} / {r.benchmark_language}</Text>
                </Space>
              ),
            },
            { title: t('overview.columns.total'), dataIndex: 'total_cases', width: 60, sorter: (a, b) => a.total_cases - b.total_cases },
            { title: t('overview.columns.active'), dataIndex: 'active_cases', width: 60 },
            { title: t('overview.columns.retired'), dataIndex: 'retired_cases', width: 60, render: (v: number) => v > 0 ? <Text type="danger">{v}</Text> : v },
            { title: t('overview.columns.attention'), dataIndex: 'attention_required_cases', width: 70, render: (v: number) => v > 0 ? <Tag color="warning">{v}</Tag> : v },
            {
              title: t('overview.columns.trustDistribution'), width: 180,
              render: (_: unknown, r: CaseGovernanceBenchmarkHotspotView) => (
                <Space size={4}>
                  <Tag color="success">{r.trusted_active_cases}</Tag>
                  <Tag color="warning">{r.watch_active_cases}</Tag>
                  <Tag color="error">{r.untrusted_active_cases}</Tag>
                </Space>
              ),
            },
            { title: t('overview.columns.flaky'), dataIndex: 'flaky_cases', width: 60 },
            { title: t('overview.columns.remediationPending'), dataIndex: 'remediation_pending_cases', width: 60 },
            { title: t('overview.columns.remediationRegressed'), dataIndex: 'remediation_regressed_cases', width: 70, render: (v: number) => v > 0 ? <Text type="danger">{v}</Text> : v },
            {
              title: t('overview.columns.latestEvidence'), dataIndex: 'latest_evidence_at', width: 140,
              render: (v?: string) => v ? dayjs(v).format('MM-DD HH:mm') : '-',
            },
          ]}
        />
      </Card>

      {/* Section 3: Case Governance List */}
      <Card
        title={<span style={{ fontWeight: 600 }}>{t('overview.casesTitle')}</span>}
        extra={
          <Space>
            {filterBenchmarkId && (
              <Tag closable onClose={clearBenchmarkFilter} color="blue">
                {t('overview.controls.filterTagPrefix')}: {filterBenchmarkSearch || filterBenchmarkId}
              </Tag>
            )}
            <Text type="secondary">{t('overview.casesCount', { count: caseTotal })}</Text>
          </Space>
        }
      >
        {/* Filter Bar */}
        <Collapse
          size="small"
          defaultActiveKey={filterBenchmarkId ? ['filters'] : []}
          items={[{
            key: 'filters',
            label: t('filter.title'),
            children: (
              <Row gutter={[12, 12]}>
                <Col span={6}>
                  <Input placeholder={t('overview.filters.benchmark')} value={filterBenchmarkSearch}
                    onChange={(e) => setFilterBenchmarkSearch(e.target.value)} allowClear />
                </Col>
                <Col span={4}>
                  <Select allowClear placeholder={t('overview.filters.status')} style={{ width: '100%' }} value={filterStatus}
                    onChange={(v) => setFilterStatus(v)}
                    options={Object.entries(CASE_ASSET_STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))} />
                </Col>
                <Col span={4}>
                  <Select allowClear placeholder={t('overview.filters.trust')} style={{ width: '100%' }} value={filterTrustPosture}
                    onChange={(v) => setFilterTrustPosture(v)}
                    options={Object.entries(GOVERNANCE_TRUST_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))} />
                </Col>
                <Col span={4}>
                  <Select allowClear placeholder={t('overview.filters.freshness')} style={{ width: '100%' }} value={filterEvidenceFreshness}
                    onChange={(v) => setFilterEvidenceFreshness(v)}
                    options={Object.entries(GOVERNANCE_FRESHNESS_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))} />
                </Col>
                <Col span={4}>
                  <Select allowClear placeholder={t('overview.filters.confidence')} style={{ width: '100%' }} value={filterConfidencePosture}
                    onChange={(v) => setFilterConfidencePosture(v)}
                    options={Object.entries(GOVERNANCE_CONFIDENCE_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))} />
                </Col>
                <Col span={4}>
                  <Select allowClear placeholder={t('overview.filters.primaryAction')} style={{ width: '100%' }} value={filterPrimaryAction}
                    onChange={(v) => setFilterPrimaryAction(v)}
                    options={Object.entries(GOVERNANCE_ACTIONS).map(([k, v]) => ({ value: k, label: v.label }))} />
                </Col>
                <Col span={6}>
                  <Input placeholder={t('overview.filters.commonSearch')} value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)} allowClear />
                </Col>
                <Col span={4}>
                  <Space>
                    <Text>{t('overview.filters.attentionShort')}</Text>
                    <Switch size="small" checked={filterAttentionRequired}
                      onChange={(v) => setFilterAttentionRequired(v)} />
                  </Space>
                </Col>
                <Col span={4}>
                  <Button type="primary" onClick={() => fetchCases(1)}>{t('overview.controls.applyFilter')}</Button>
                </Col>
              </Row>
            ),
          }]}
          style={{ marginBottom: 16 }}
        />

        {/* Batch Action Buttons */}
        {selectedRowKeys.length > 0 && (
          <Alert
            type="info"
            message={
              <Space>
                <Text>{t('overview.selection.selectedItems', { count: selectedRowKeys.length })}</Text>
                {Object.entries(GOVERNANCE_ACTIONS).map(([key, cfg]) => (
                  <Button key={key} size="small" icon={<ThunderboltOutlined />}
                    onClick={() => handlePreviewAction(key as GovernanceAction)}>
                    {cfg.label}
                  </Button>
                ))}
                <Button size="small" onClick={() => { setSelectedRowKeys([]); setSelectedRows([]); }}>{t('overview.selection.cancelSelection')}</Button>
              </Space>
            }
            style={{ marginBottom: 12 }}
          />
        )}

        <Table
          size="small"
          loading={caseLoading}
          rowKey={(r) => `${r.benchmark_id}:${r.case_key}`}
          dataSource={cases}
          rowSelection={{
            selectedRowKeys,
            onChange: (keys, rows) => { setSelectedRowKeys(keys as string[]); setSelectedRows(rows as CaseGovernanceListItem[]); },
          }}
          scroll={{ x: 2000 }}
          pagination={{
            current: casePage, pageSize: 20, total: caseTotal, size: 'small',
            showTotal: (count) => t('overview.casesCount', { count }),
            onChange: (p) => fetchCases(p),
          }}
          expandable={{
            expandedRowRender: (record) => (
              <Row gutter={16}>
                <Col span={8}>
                  <Text strong>{t('overview.expand.governanceIntel')}</Text>
                  <div style={{ marginTop: 4 }}>
                    {record.governance_intelligence ? (
                      <>
                        <div>{t('overview.expand.trust')}: <Tag color={GOVERNANCE_TRUST_CONFIG[record.governance_intelligence.trust_posture ?? 'trusted']?.color}>
                          {GOVERNANCE_TRUST_CONFIG[record.governance_intelligence.trust_posture ?? 'trusted']?.label}
                        </Tag> {record.governance_intelligence.trust_reason || '-'}</div>
                        <div>{t('overview.expand.evidence')}: <Tag color={GOVERNANCE_FRESHNESS_CONFIG[record.governance_intelligence.evidence_freshness ?? 'missing']?.color}>
                          {GOVERNANCE_FRESHNESS_CONFIG[record.governance_intelligence.evidence_freshness ?? 'missing']?.label}
                        </Tag></div>
                        <div>{t('overview.expand.confidence')}: <Tag color={GOVERNANCE_CONFIDENCE_CONFIG[record.governance_intelligence.confidence_posture ?? 'not_applicable']?.color}>
                          {GOVERNANCE_CONFIDENCE_CONFIG[record.governance_intelligence.confidence_posture ?? 'not_applicable']?.label}
                        </Tag></div>
                        <div>{t('overview.expand.activeSignals')}: {record.governance_intelligence.active_signals?.join(', ') || t('overview.expand.noSignals')}</div>
                      </>
                    ) : <Text type="secondary">{t('overview.expand.noIntel')}</Text>}
                  </div>
                </Col>
                <Col span={8}>
                  <Text strong>{t('overview.expand.detectionValidation')}</Text>
                  <div style={{ marginTop: 4 }}>
                    <div>{t('overview.expand.detection')}: {record.detection_decision || '-'} / {record.detection_risk_level || '-'} ({record.detection_issue_count} issues)</div>
                    <div>{t('overview.expand.validation')}: {record.validation_aggregate_outcome || '-'} / {record.validation_authority_status || '-'} {record.validation_flaky ? '(flaky)' : ''}</div>
                    {record.validation_pass_rate != null && <div>{t('overview.expand.passRate')}: {(record.validation_pass_rate * 100).toFixed(0)}%</div>}
                  </div>
                </Col>
                <Col span={8}>
                  <Text strong>{t('overview.expand.reviewFusion')}</Text>
                  <div style={{ marginTop: 4 }}>
                    <div>{t('overview.expand.review')}: {record.review_decision || '-'} / {record.review_risk || '-'} {record.review_low_confidence ? `(${t('overview.expand.lowConfidence')})` : ''}</div>
                    <div>{t('overview.expand.fusion')}: {record.fusion_decision || '-'} / {record.fusion_risk_level || '-'} {record.fusion_insufficient_evidence ? `(${t('overview.expand.insufficientEvidence')})` : ''}</div>
                    <div>{t('overview.expand.remediation')}: {record.remediation_attempt_count} {t('overview.expand.times')} {record.remediation_repair_state ? `/ ${record.remediation_repair_state}` : ''}</div>
                  </div>
                </Col>
              </Row>
            ),
          }}
          columns={[
            {
              title: 'Case', width: 200,
              render: (_: unknown, r: CaseGovernanceListItem) => (
                <Space direction="vertical" size={0}>
                  <Text strong style={{ fontSize: 12 }}>{r.case_key}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>{r.case_name || '-'}</Text>
                </Space>
              ),
            },
            {
              title: 'Benchmark', width: 160, ellipsis: true,
              render: (_: unknown, r: CaseGovernanceListItem) => r.benchmark_display_name || r.benchmark_name || r.benchmark_id,
            },
            {
              title: t('overview.columns.status'), dataIndex: 'status', width: 70,
              render: (v: string) => <Tag color={CASE_ASSET_STATUS_CONFIG[v as keyof typeof CASE_ASSET_STATUS_CONFIG]?.color}>{CASE_ASSET_STATUS_CONFIG[v as keyof typeof CASE_ASSET_STATUS_CONFIG]?.label || v}</Tag>,
            },
            {
              title: t('overview.columns.trust'), width: 90,
              render: (_: unknown, r: CaseGovernanceListItem) => {
                const tp = r.governance_intelligence?.trust_posture;
                if (!tp) return '-';
                const cfg = GOVERNANCE_TRUST_CONFIG[tp];
                return <Tag color={cfg?.color}>{cfg?.label}</Tag>;
              },
            },
            {
              title: t('overview.columns.evidence'), width: 80,
              render: (_: unknown, r: CaseGovernanceListItem) => {
                const ef = r.governance_intelligence?.evidence_freshness;
                if (!ef) return '-';
                const cfg = GOVERNANCE_FRESHNESS_CONFIG[ef];
                return <Tag color={cfg?.color}>{cfg?.label}</Tag>;
              },
            },
            {
              title: t('overview.columns.confidence'), width: 80,
              render: (_: unknown, r: CaseGovernanceListItem) => {
                const cp = r.governance_intelligence?.confidence_posture;
                if (!cp) return '-';
                const cfg = GOVERNANCE_CONFIDENCE_CONFIG[cp];
                return <Tag color={cfg?.color}>{cfg?.label}</Tag>;
              },
            },
            {
              title: t('overview.columns.detection'), width: 80,
              render: (_: unknown, r: CaseGovernanceListItem) => {
                if (!r.detection_decision) return '-';
                return <Tag color={r.detection_risk_level === 'critical' || r.detection_risk_level === 'high' ? 'error' : 'default'}>{r.detection_decision}</Tag>;
              },
            },
            {
              title: t('overview.columns.validation'), width: 80,
              render: (_: unknown, r: CaseGovernanceListItem) => {
                if (!r.validation_aggregate_outcome) return '-';
                return (
                  <Space size={2}>
                    <Tag color={r.validation_aggregate_outcome === 'pass' ? 'success' : 'error'}>{r.validation_aggregate_outcome}</Tag>
                    {r.validation_flaky && <WarningOutlined style={{ color: '#faad14' }} />}
                  </Space>
                );
              },
            },
            {
              title: t('overview.columns.review'), width: 80,
              render: (_: unknown, r: CaseGovernanceListItem) => {
                if (!r.review_decision) return '-';
                const cfg = REVIEW_DECISION_CONFIG[r.review_decision as keyof typeof REVIEW_DECISION_CONFIG];
                return <Tag color={cfg?.color}>{cfg?.label}</Tag>;
              },
            },
            {
              title: t('overview.columns.fusion'), width: 80,
              render: (_: unknown, r: CaseGovernanceListItem) => {
                if (!r.fusion_decision) return '-';
                const cfg = REVIEW_DECISION_CONFIG[r.fusion_decision as keyof typeof REVIEW_DECISION_CONFIG];
                return <Tag color={cfg?.color}>{cfg?.label}</Tag>;
              },
            },
            {
              title: t('overview.columns.primaryAction'), width: 100,
              render: (_: unknown, r: CaseGovernanceListItem) => {
                if (!r.primary_action) return '-';
                const cfg = GOVERNANCE_ACTIONS[r.primary_action as keyof typeof GOVERNANCE_ACTIONS];
                return <Tag color={cfg?.color}>{cfg?.label}</Tag>;
              },
            },
            {
              title: t('overview.columns.attention2'), width: 50, dataIndex: 'operator_attention_required',
              render: (v: boolean) => v ? <EyeOutlined style={{ color: '#faad14' }} /> : '-',
            },
          ]}
        />
      </Card>

      {/* Section 4: Action Preview Modal */}
      <Modal
        title={`${t('overview.preview.title')} - ${GOVERNANCE_ACTIONS[previewAction]?.label || previewAction}`}
        open={previewModalVisible}
        onCancel={() => setPreviewModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setPreviewModalVisible(false)}>{t('overview.preview.close')}</Button>,
        ]}
      >
        {previewLoading ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Text>{t('overview.preview.loading')}</Text></div>
        ) : previewResult ? (
          <>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}><Statistic title={t('overview.preview.selectedItems')} value={selectedRows.length} /></Col>
              <Col span={8}><Statistic title={t('overview.preview.accepted')} value={previewResult.accepted_items?.length ?? 0} valueStyle={{ color: '#52c41a' }} /></Col>
              <Col span={8}><Statistic title={t('overview.preview.rejected')} value={previewResult.rejected_items?.length ?? 0} valueStyle={{ color: '#ff4d4f' }} /></Col>
            </Row>

            {previewResult.accepted_items && previewResult.accepted_items.length > 0 && (
              <>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  <SafetyCertificateOutlined style={{ color: '#52c41a', marginRight: 4 }} />{t('overview.preview.accepted')}
                </Text>
                <Table
                  size="small" dataSource={previewResult.accepted_items} rowKey="case_key"
                  pagination={false} style={{ marginBottom: 16 }}
                  columns={[
                    { title: t('overview.preview.columns.benchmark'), dataIndex: 'benchmark_name', width: 160, ellipsis: true },
                    { title: t('overview.preview.columns.caseKey'), dataIndex: 'case_key', width: 200, ellipsis: true },
                    { title: t('overview.preview.columns.caseName'), dataIndex: 'case_name', width: 160, ellipsis: true, render: (v?: string) => v || '-' },
                    { title: t('overview.preview.columns.reason'), dataIndex: 'reason', ellipsis: true, render: (v?: string) => v || '-' },
                  ]}
                />
              </>
            )}

            {previewResult.rejected_items && previewResult.rejected_items.length > 0 && (
              <>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>
                  <WarningOutlined style={{ color: '#ff4d4f', marginRight: 4 }} />{t('overview.preview.rejected')}
                </Text>
                <Table
                  size="small" dataSource={previewResult.rejected_items}
                  rowKey={(r) => `${r.benchmark_id}:${r.case_key}`}
                  pagination={false} style={{ marginBottom: 16 }}
                  columns={[
                    { title: t('overview.preview.columns.benchmarkId'), dataIndex: 'benchmark_id', width: 160, ellipsis: true },
                    { title: t('overview.preview.columns.caseKey'), dataIndex: 'case_key', width: 200, ellipsis: true },
                    { title: t('overview.preview.columns.rejectReason'), dataIndex: 'reason', ellipsis: true, render: (v?: string) => <Text type="danger">{v || '-'}</Text> },
                  ]}
                />
              </>
            )}

            {previewResult.benchmark_actions && previewResult.benchmark_actions.length > 0 && (
              <>
                <Text strong style={{ display: 'block', marginBottom: 8 }}>{t('overview.preview.groupByBenchmark')}</Text>
                <Table
                  size="small" dataSource={previewResult.benchmark_actions}
                  rowKey="benchmark_id" pagination={false}
                  columns={[
                    { title: t('overview.preview.columns.benchmark'), dataIndex: 'benchmark_name', width: 160, ellipsis: true },
                    { title: t('overview.preview.columns.action'), dataIndex: 'action', width: 100, render: (v: string) => <Tag color={GOVERNANCE_ACTIONS[v as keyof typeof GOVERNANCE_ACTIONS]?.color}>{GOVERNANCE_ACTIONS[v as keyof typeof GOVERNANCE_ACTIONS]?.label}</Tag> },
                    { title: t('overview.preview.columns.method'), dataIndex: 'target_method', width: 70 },
                    { title: t('overview.preview.columns.caseCount'), dataIndex: 'item_count', width: 70 },
                    {
                      title: t('overview.preview.columns.cases'), dataIndex: 'case_keys', ellipsis: true,
                      render: (v?: string[]) => v?.slice(0, 3).join(', ') + (v && v.length > 3 ? `... +${v.length - 3}` : ''),
                    },
                  ]}
                />
              </>
            )}
          </>
        ) : <Text type="secondary">{t('overview.preview.noResult')}</Text>}
      </Modal>
    </div>
  );
}
