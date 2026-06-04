/**
 * LLM Quality 报告详情页面
 * Slice: S13
 *
 * 功能: 报告概览 / Aggregate / Diff / Findings / Case Reports / Report History
 */

import { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Card, Typography, Tag, Button, Space, Table, Statistic, Row, Col,
  Breadcrumb, Select, message, Collapse, Divider, Tooltip, Switch,
} from 'antd';
import {
  HomeOutlined, FileTextOutlined, ArrowUpOutlined, ArrowDownOutlined,
  MinusOutlined,
} from '@ant-design/icons';
import { useParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { benchmarkService } from '@/services/benchmark';
import type {
  BenchmarkLLMQualityReport,
  BenchmarkLLMQualityCaseReport,
  BenchmarkLLMQualityAggregate,
  LLMQualityDiffLatest,
} from '@/types/api/benchmark';
import { LLM_QUALITY_RISK_CONFIG } from '@/types/api/benchmark';
import type { PaginatedResponse } from '@/types';

const { Title, Text } = Typography;

export default function LLMQualityReportPage() {
  const { t } = useTranslation('governance');
  const { id: benchmarkId, jobId } = useParams<{ id: string; jobId: string }>();

  // ============ Latest Report ============
  const [report, setReport] = useState<BenchmarkLLMQualityReport | null>(null);
  const [reportLoading, setReportLoading] = useState(false);

  // ============ Aggregate ============
  const [aggregate, setAggregate] = useState<BenchmarkLLMQualityAggregate | null>(null);

  // ============ Diff ============
  const [diff, setDiff] = useState<LLMQualityDiffLatest | null>(null);

  const fetchReportData = useCallback(async () => {
    if (!benchmarkId) return;
    setReportLoading(true);
    try {
      const [reportRes, aggRes, diffRes] = await Promise.allSettled([
        benchmarkService.getLatestLLMQualityReport(benchmarkId),
        benchmarkService.getLatestLLMQualityAggregate(benchmarkId),
        benchmarkService.getLatestLLMQualityDiff(benchmarkId),
      ]);
      if (reportRes.status === 'fulfilled') setReport((reportRes.value as unknown) as BenchmarkLLMQualityReport);
      if (aggRes.status === 'fulfilled') setAggregate((aggRes.value as unknown) as BenchmarkLLMQualityAggregate);
      if (diffRes.status === 'fulfilled') setDiff((diffRes.value as unknown) as LLMQualityDiffLatest);
    } catch {
      message.error(t('llmQuality.messages.fetchReportFailed'));
    } finally {
      setReportLoading(false);
    }
  }, [benchmarkId]);

  useEffect(() => { fetchReportData(); }, [fetchReportData]);

  // ============ Case Reports ============
  const [cases, setCases] = useState<BenchmarkLLMQualityCaseReport[]>([]);
  const [caseTotal, setCaseTotal] = useState(0);
  const [casePage, setCasePage] = useState(1);
  const [caseLoading, setCaseLoading] = useState(false);
  const [caseRiskFilter, setCaseRiskFilter] = useState<string | undefined>(undefined);
  const [caseDecisionFilter, setCaseDecisionFilter] = useState<string | undefined>(undefined);
  const [caseChangedOnly, setCaseChangedOnly] = useState(false);

  const fetchCases = useCallback(async (page: number) => {
    if (!benchmarkId) return;
    setCaseLoading(true);
    try {
      const res = await benchmarkService.listLLMQualityCaseReports(benchmarkId, {
        page,
        page_size: 20,
        risk_gte: caseRiskFilter || undefined,
        decision: caseDecisionFilter || undefined,
        changed_only: caseChangedOnly || undefined,
      });
      const pd = (res as unknown) as PaginatedResponse<BenchmarkLLMQualityCaseReport>;
      setCases(pd.data ?? []);
      setCaseTotal(pd.total ?? 0);
      setCasePage(page);
    } catch {
      message.error(t('llmQuality.messages.fetchCasesFailed'));
    } finally {
      setCaseLoading(false);
    }
  }, [benchmarkId, caseRiskFilter, caseDecisionFilter, caseChangedOnly]);

  useEffect(() => { fetchCases(1); }, [fetchCases]);

  // ============ Report History ============
  const [history, setHistory] = useState<BenchmarkLLMQualityReport[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchHistory = useCallback(async (page: number) => {
    if (!benchmarkId) return;
    setHistoryLoading(true);
    try {
      const res = await benchmarkService.listLLMQualityReports(benchmarkId, { page, page_size: 10 });
      const pd = (res as unknown) as PaginatedResponse<BenchmarkLLMQualityReport>;
      setHistory(pd.data ?? []);
      setHistoryTotal(pd.total ?? 0);
      setHistoryPage(page);
    } catch {
      // ignore
    } finally {
      setHistoryLoading(false);
    }
  }, [benchmarkId]);

  const riskTag = (risk: string) => {
    const cfg = LLM_QUALITY_RISK_CONFIG[risk as keyof typeof LLM_QUALITY_RISK_CONFIG];
    return <Tag color={cfg?.color || 'default'}>{cfg?.label || risk}</Tag>;
  };

  const scoreDeltaTag = (delta: number) => {
    if (delta > 0) return <span style={{ color: '#52c41a' }}><ArrowUpOutlined /> +{delta}</span>;
    if (delta < 0) return <span style={{ color: '#ff4d4f' }}><ArrowDownOutlined /> {delta}</span>;
    return <span style={{ color: '#999' }}><MinusOutlined /> 0</span>;
  };

  const findingsColumns = [
    { title: t('llmQuality.findings.dimension'), dataIndex: 'dimension', width: 120 },
    {
      title: t('llmQuality.findings.severity'), dataIndex: 'severity', width: 80,
      render: (v: string) => riskTag(v),
    },
    { title: t('llmQuality.findings.title'), dataIndex: 'title', ellipsis: true },
    {
      title: t('llmQuality.findings.detail'), dataIndex: 'detail', width: 200, ellipsis: true,
      render: (v?: string) => v ? <Tooltip title={v}><Text ellipsis>{v}</Text></Tooltip> : '-',
    },
    {
      title: t('llmQuality.findings.confidence'), dataIndex: 'confidence', width: 80,
      render: (v: number) => `${(v * 100).toFixed(0)}%`,
    },
    {
      title: t('llmQuality.findings.suggestion'), dataIndex: 'suggestion', width: 200, ellipsis: true,
      render: (v?: string) => v ? <Tooltip title={v}><Text ellipsis>{v}</Text></Tooltip> : '-',
    },
  ];

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <Breadcrumb style={{ marginBottom: 24 }} items={[
        { title: <HomeOutlined />, href: '/dashboard' },
        { title: <span>Benchmarks</span>, href: '/benchmarks' },
        { title: <span>{benchmarkId?.slice(0, 8)}...</span>, href: `/benchmarks/${benchmarkId}` },
        { title: <span>{t('llmQuality.page.breadcrumb')}</span>, href: `/benchmarks/${benchmarkId}/llm-quality` },
        { title: <span>{t('llmQuality.report.breadcrumb')}</span> },
      ]} />

      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ marginBottom: 4 }}>
          <FileTextOutlined style={{ marginRight: 8 }} />
          {t('llmQuality.report.title')}
        </Title>
        <Space>
          <Text type="secondary">{t('llmQuality.report.jobLabel')}: {jobId?.slice(0, 8)}...</Text>
          {report && <Text type="secondary">| {t('llmQuality.report.reportLabel')}: {report.id.slice(0, 8)}...</Text>}
        </Space>
      </div>

      {/* Section 1: Overview + Aggregate + Diff */}
      <Card style={{ marginBottom: 24 }} loading={reportLoading}
        title={<span style={{ fontWeight: 600 }}>{t('llmQuality.report.overview')}</span>}>
        {report ? (
          <>
            {/* Overview Row */}
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={3}>
                <Statistic title="Risk" valueRender={() => riskTag(report.overall_risk)} />
              </Col>
              <Col span={3}><Statistic title="Score" value={report.score} suffix="/ 100" /></Col>
              <Col span={3}>
                <Statistic title="Authority" valueRender={() => (
                  <Tag color={report.authority_status === 'authoritative' ? 'success' : 'warning'}>
                    {report.authority_status || '-'}
                  </Tag>
                )} />
              </Col>
              <Col span={3}><Statistic title="Model" value={report.resolved_model || report.model} valueStyle={{ fontSize: 14 }} /></Col>
              <Col span={3}><Statistic title="Provider" value={report.provider_name || '-'} valueStyle={{ fontSize: 14 }} /></Col>
              <Col span={3}><Statistic title="Cost" value={`$${report.cost_usd.toFixed(4)}`} valueStyle={{ fontSize: 14 }} /></Col>
              <Col span={3}><Statistic title="Latency" value={`${(report.latency_ms / 1000).toFixed(1)}s`} valueStyle={{ fontSize: 14 }} /></Col>
              <Col span={3}>
                <Statistic title="LLM Call" valueRender={() => (
                  <Tag color={report.llm_call_succeeded ? 'success' : 'error'}>
                    {report.llm_call_succeeded ? t('llmQuality.report.callSucceeded') : t('llmQuality.report.callFailed')}
                  </Tag>
                )} />
              </Col>
            </Row>

            {report.degraded_reason && (
              <div style={{ marginBottom: 12 }}>
                <Tag color="warning">{t('llmQuality.report.degraded', { reason: report.degraded_reason })}</Tag>
                <Tag>{report.provider_execution_mode || '-'}</Tag>
              </div>
            )}

            {/* Aggregate */}
            {aggregate && (
              <>
                <Divider orientation="left" style={{ fontSize: 13, margin: '12px 0' }}>{t('llmQuality.report.aggregateTitle')}</Divider>
                <Row gutter={16}>
                  <Col span={3}><Statistic title={t('llmQuality.aggregate.totalCases')} value={aggregate.total_cases} /></Col>
                  <Col span={3}><Statistic title={t('llmQuality.aggregate.critical')} value={aggregate.critical_cases} valueStyle={{ color: aggregate.critical_cases > 0 ? '#ff4d4f' : undefined }} /></Col>
                  <Col span={3}><Statistic title={t('llmQuality.aggregate.high')} value={aggregate.high_cases} valueStyle={{ color: aggregate.high_cases > 0 ? '#fa8c16' : undefined }} /></Col>
                  <Col span={3}><Statistic title={t('llmQuality.aggregate.medium')} value={aggregate.medium_cases} /></Col>
                  <Col span={3}><Statistic title={t('llmQuality.aggregate.low')} value={aggregate.low_cases} /></Col>
                  <Col span={3}><Statistic title={t('llmQuality.aggregate.info')} value={aggregate.info_cases} /></Col>
                  <Col span={3}><Statistic title={t('llmQuality.aggregate.findings')} value={aggregate.total_findings} /></Col>
                  <Col span={3}><Statistic title={t('llmQuality.aggregate.avgScore')} value={aggregate.average_score} precision={1} /></Col>
                </Row>
              </>
            )}

            {/* Diff */}
            {diff && (
              <>
                <Divider orientation="left" style={{ fontSize: 13, margin: '16px 0 12px' }}>{t('llmQuality.report.diffTitle')}</Divider>
                {diff.previous_report_id ? (
                  <Row gutter={16}>
                    <Col span={3}>
                      <Statistic title={t('llmQuality.diff.scoreDelta')} valueRender={() => scoreDeltaTag(diff.score_delta)} />
                    </Col>
                    <Col span={3}><Statistic title={t('llmQuality.diff.changedCases')} value={diff.changed_cases} /></Col>
                    <Col span={3}><Statistic title={t('llmQuality.diff.added')} value={diff.added_cases} valueStyle={{ color: diff.added_cases > 0 ? '#1890ff' : undefined }} /></Col>
                    <Col span={3}><Statistic title={t('llmQuality.diff.removed')} value={diff.removed_cases} valueStyle={{ color: diff.removed_cases > 0 ? '#ff4d4f' : undefined }} /></Col>
                    <Col span={3}><Statistic title={t('llmQuality.diff.newHighRisk')} value={diff.new_high_risk_cases} valueStyle={{ color: diff.new_high_risk_cases > 0 ? '#ff4d4f' : undefined }} /></Col>
                    <Col span={3}><Statistic title={t('llmQuality.diff.resolvedHighRisk')} value={diff.resolved_high_risk_cases} valueStyle={{ color: diff.resolved_high_risk_cases > 0 ? '#52c41a' : undefined }} /></Col>
                    <Col span={3}>
                      <Space>
                        <Text type="secondary">{t('llmQuality.diff.riskLabel')}</Text> {riskTag(diff.previous_risk || '')} → {riskTag(diff.current_risk)}
                      </Space>
                    </Col>
                    <Col span={3}>
                      <Space>
                        <Text type="secondary">{t('llmQuality.diff.decisionLabel')}</Text> {diff.previous_decision || '-'} → {diff.current_decision}
                      </Space>
                    </Col>
                  </Row>
                ) : (
                  <Text type="secondary">{t('llmQuality.report.firstReport')}</Text>
                )}
              </>
            )}
          </>
        ) : !reportLoading ? <Text type="secondary">{t('llmQuality.report.noReport')}</Text> : null}
      </Card>

      {/* Section 2: Report Findings */}
      {report && report.findings && report.findings.length > 0 && (
        <Card title={<span style={{ fontWeight: 600 }}>{t('llmQuality.report.findingsCard', { count: report.findings.length })}</span>} style={{ marginBottom: 24 }}>
          <Table
            size="small" rowKey="id" dataSource={report.findings}
            pagination={false}
            columns={findingsColumns}
          />
        </Card>
      )}

      {/* Section 3: Case Reports */}
      <Card
        title={<span style={{ fontWeight: 600 }}>{t('llmQuality.cases.title')}</span>}
        extra={<Text type="secondary">{t('llmQuality.jobList.totalCount', { count: caseTotal })}</Text>}
        style={{ marginBottom: 24 }}
      >
        <div style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <Select allowClear placeholder={t('llmQuality.cases.riskFilter')} style={{ width: 120 }} value={caseRiskFilter}
            onChange={(v) => setCaseRiskFilter(v)}
            options={Object.entries(LLM_QUALITY_RISK_CONFIG).map(([key, cfg]) => ({ value: key, label: cfg.label }))} />
          <Select allowClear placeholder="Decision" style={{ width: 120 }} value={caseDecisionFilter}
            onChange={(v) => setCaseDecisionFilter(v)}
            options={[{ value: 'block', label: 'Block' }, { value: 'warn', label: 'Warn' }, { value: 'pass', label: 'Pass' }]} />
          <Space><Text>{t('llmQuality.cases.changedOnly')}</Text><Switch size="small" checked={caseChangedOnly} onChange={(v) => setCaseChangedOnly(v)} /></Space>
          <Button onClick={() => fetchCases(1)}>{t('llmQuality.cases.filterBtn')}</Button>
        </div>
        <Table
          size="small" loading={caseLoading}
          rowKey="id" dataSource={cases}
          scroll={{ x: 1400 }}
          pagination={{
            current: casePage, pageSize: 20, total: caseTotal, size: 'small',
            showTotal: (count) => t('llmQuality.jobList.totalCount', { count }),
            onChange: (p) => fetchCases(p),
          }}
          expandable={{
            expandedRowRender: (record) => (
              record.findings && record.findings.length > 0 ? (
                <Table
                  size="small" rowKey="id" dataSource={record.findings}
                  pagination={false} columns={findingsColumns}
                />
              ) : <Text type="secondary">{t('llmQuality.cases.noFindings')}</Text>
            ),
          }}
          columns={[
            {
              title: 'Case', width: 180,
              render: (_: unknown, r: BenchmarkLLMQualityCaseReport) => (
                <Space direction="vertical" size={0}>
                  <Text strong style={{ fontSize: 12 }}>{r.case_key}</Text>
                  <Text type="secondary" style={{ fontSize: 11 }}>{r.case_name || '-'}</Text>
                </Space>
              ),
            },
            { title: '#', dataIndex: 'case_index', width: 40 },
            {
              title: 'Risk', dataIndex: 'risk', width: 80,
              render: (v: string) => riskTag(v),
            },
            { title: 'Score', dataIndex: 'score', width: 60 },
            {
              title: 'Authority', dataIndex: 'authority_status', width: 90,
              render: (v?: string) => v ? <Tag color={v === 'authoritative' ? 'success' : 'warning'}>{v}</Tag> : '-',
            },
            {
              title: 'LLM', dataIndex: 'llm_call_succeeded', width: 60,
              render: (v: boolean) => <Tag color={v ? 'success' : 'error'}>{v ? 'OK' : 'Fail'}</Tag>,
            },
            {
              title: 'Findings', width: 70,
              render: (_: unknown, r: BenchmarkLLMQualityCaseReport) => r.findings?.length ?? 0,
            },
            {
              title: 'Summary', dataIndex: 'summary', ellipsis: true,
              render: (v?: string) => v ? <Tooltip title={v}><Text ellipsis>{v}</Text></Tooltip> : '-',
            },
          ]}
        />
      </Card>

      {/* Section 4: Report History */}
      <Collapse
        size="small"
        items={[{
          key: 'history',
          label: <span style={{ fontWeight: 600 }}>{t('llmQuality.report.history', { count: historyTotal })}</span>,
          children: (
            <Table
              size="small" loading={historyLoading}
              rowKey="id" dataSource={history}
              pagination={{
                current: historyPage, pageSize: 10, total: historyTotal, size: 'small',
                onChange: (p) => fetchHistory(p),
              }}
              columns={[
                {
                  title: t('llmQuality.jobList.columns.created'), dataIndex: 'created_at', width: 150,
                  render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
                },
                { title: 'Model', dataIndex: 'model', width: 120, ellipsis: true },
                {
                  title: 'Risk', dataIndex: 'overall_risk', width: 80,
                  render: (v: string) => riskTag(v),
                },
                { title: 'Score', dataIndex: 'score', width: 60 },
                {
                  title: 'Authority', dataIndex: 'authority_status', width: 100,
                  render: (v?: string) => v ? <Tag color={v === 'authoritative' ? 'success' : 'warning'}>{v}</Tag> : '-',
                },
                {
                  title: 'Findings', width: 70,
                  render: (_: unknown, r: BenchmarkLLMQualityReport) => r.findings?.length ?? 0,
                },
                {
                  title: 'Cost', dataIndex: 'cost_usd', width: 80,
                  render: (v: number) => `$${v.toFixed(4)}`,
                },
                {
                  title: 'Latency', dataIndex: 'latency_ms', width: 80,
                  render: (v: number) => `${(v / 1000).toFixed(1)}s`,
                },
              ]}
            />
          ),
        }]}
        onChange={() => { if (history.length === 0) fetchHistory(1); }}
      />
    </div>
  );
}
