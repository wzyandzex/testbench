import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Descriptions,
  Empty,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  FileSearchOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { PageHeader } from '@/components/common';
import { saveRecentProjectEvalRun } from '@/components/project-eval/recentRuns';
import { projectEvalService } from '@/services/project-eval';
import type {
  RunExplainCaseSelectionView,
  RunExplainView,
} from '@/types/api/project-eval';
import {
  formatConfidence,
  formatCoverage,
  formatDateTime,
  formatScore,
  getDecisionTone,
  getEvidenceInsufficientReasonLabel,
  getEvidencePostureAlertType,
  getEvidencePostureStatusColor,
  getEvidencePostureStatusLabel,
  getEvidenceTruthSourceLabel,
  getOutcomeAuthorityLabel,
  getProjectTypeLabel,
  getResultClassLabel,
  getRiskTone,
  getRunModeLabel,
  getSelectionReasonLabel,
  getSelectionStatusTone,
  getStatusTone,
  getTruthModeLabel,
  humanizeKey,
} from '@/components/project-eval/helpers';

const { Paragraph, Text } = Typography;

function readCountMap(summary: Record<string, unknown> | undefined, key: string): Array<[string, number]> {
  const raw = summary?.[key];
  if (!raw || typeof raw !== 'object') {
    return [];
  }

  return Object.entries(raw as Record<string, unknown>).flatMap(([name, value]) =>
    typeof value === 'number' ? [[name, value] as [string, number]] : []
  );
}

function renderJsonBlock(value: unknown) {
  if (!value) {
    return <Text type="secondary">{i18next.t('projectEval:explain.noStructuredPayload')}</Text>;
  }

  return (
    <pre
      style={{
        margin: 0,
        padding: 12,
        overflow: 'auto',
        borderRadius: 12,
        background: '#f7f7f7',
      }}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function countText(value?: number): string {
  return typeof value === 'number' && Number.isFinite(value) ? String(value) : '-';
}

export default function ProjectEvalExplainPage() {
  const { id: runId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation('projectEval');
  const [view, setView] = useState<RunExplainView | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchExplain = useCallback(async () => {
    if (!runId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await projectEvalService.getRunExplain(runId);
      setView(response as unknown as RunExplainView);
    } finally {
      setLoading(false);
    }
  }, [runId]);

  useEffect(() => {
    void fetchExplain();
  }, [fetchExplain]);

  useEffect(() => {
    if (!view) {
      return;
    }

    saveRecentProjectEvalRun({
      id: view.run_id,
      status: view.status,
      decision: view.decision,
      score: view.score,
      projectType: view.project_type,
      mode: view.mode,
    });
  }, [view]);

  const caseSelections = useMemo(() => {
    return [...(view?.case_selections ?? [])].sort((left, right) => left.selection_rank - right.selection_rank);
  }, [view?.case_selections]);

  const statusCounts = useMemo(
    () => readCountMap(view?.case_selection_summary, 'status_counts'),
    [view?.case_selection_summary]
  );
  const reasonCounts = useMemo(
    () => readCountMap(view?.case_selection_summary, 'reason_counts'),
    [view?.case_selection_summary]
  );

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 96 }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!view || !runId) {
    return (
      <div style={{ padding: '0 24px 24px' }}>
        <PageHeader
          title={t('explain.title')}
          description={t('explain.pageDescriptionEmpty')}
          breadcrumb={[
            { title: t('common.dashboard') },
            { title: t('title') },
            { title: t('explain.breadcrumb') },
          ]}
        />
        <Card>
          <Empty description={t('explain.noExplainData')} />
        </Card>
      </div>
    );
  }

  const decisionTone = getDecisionTone(view.decision);
  const statusTone = getStatusTone(view.status);
  const evidenceSummary = view.evidence_summary;
  const evidencePosture = view.evidence_posture;
  const evidenceBackedCases = caseSelections.filter((item) => item.evidence_available).length;

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <PageHeader
        title={t('explain.title')}
        description={t('explain.pageDescription')}
        breadcrumb={[
          { title: t('common.dashboard') },
          { title: t('title') },
          { title: t('explain.breadcrumb') },
        ]}
        extra={(
          <Space wrap>
            <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/project-eval/${runId}`)}>
              {t('explain.backToRun')}
            </Button>
            <Button icon={<FileSearchOutlined />} onClick={() => navigate(`/project-eval/${runId}/report`)}>
              {t('explain.viewReport')}
            </Button>
          </Space>
        )}
      />

      {view.legacy_fallback_used && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('explain.legacyFallbackMessage')}
          description={view.legacy_fallback_reason || t('explain.legacyFallbackDefaultReason')}
        />
      )}

      {!view.authoritative_truth && !view.legacy_fallback_used && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('explain.notAuthoritativeMessage')}
          description={t('explain.notAuthoritativeDesc')}
        />
      )}

      <Card style={{ marginBottom: 16 }}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space wrap>
            <Tag color={decisionTone.color}>{decisionTone.label}</Tag>
            <Tag color={statusTone.color}>{statusTone.label}</Tag>
            <Tag>{getProjectTypeLabel(view.project_type)}</Tag>
            <Tag>{getRunModeLabel(view.mode)}</Tag>
            {view.result_class && <Tag>{getResultClassLabel(view.result_class)}</Tag>}
          </Space>

          <Paragraph style={{ marginBottom: 0 }}>
            {t('explain.overviewParagraph')}
          </Paragraph>

          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={6}>
              <Statistic title={t('explain.selectedCases')} value={view.selected_case_count} />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Statistic title={t('explain.evaluatedCases')} value={view.evaluated_case_count} />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Statistic title={t('explain.evidenceBackedCases')} value={evidenceBackedCases} />
            </Col>
            <Col xs={24} sm={12} lg={6}>
              <Statistic title={t('explain.score')} value={Number(formatScore(view.score))} precision={1} />
            </Col>
          </Row>
        </Space>
      </Card>

      {evidencePosture && (
        <Card title={t('explain.evidencePosture')} style={{ marginBottom: 16 }}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Alert
              type={getEvidencePostureAlertType(evidencePosture)}
              showIcon
              message={
                <Space wrap>
                  <span>{t('explain.evidencePostureMessage')}</span>
                  <Tag color={getEvidencePostureStatusColor(evidencePosture)}>
                    {getEvidencePostureStatusLabel(evidencePosture.status)}
                  </Tag>
                </Space>
              }
              description={
                evidencePosture.authoritative_ready
                  ? t('explain.evidencePostureReadyDesc')
                  : getEvidenceInsufficientReasonLabel(evidencePosture.insufficient_evidence_reason)
              }
            />
            <Descriptions size="small" column={{ xs: 1, sm: 2, lg: 4 }} bordered>
              <Descriptions.Item label={t('explain.truthSource')}>
                {getEvidenceTruthSourceLabel(evidencePosture.truth_source_mode)}
              </Descriptions.Item>
              <Descriptions.Item label={t('explain.currentRunValidation')}>
                {countText(evidencePosture.current_run_execution_cases)}
              </Descriptions.Item>
              <Descriptions.Item label={t('explain.missingCurrentRunValidation')}>
                {countText(evidencePosture.missing_current_run_execution_cases)}
              </Descriptions.Item>
              <Descriptions.Item label={t('explain.insufficientCases')}>
                {countText(evidencePosture.insufficient_cases)}
              </Descriptions.Item>
            </Descriptions>
          </Space>
        </Card>
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={10}>
          <Card title={t('explain.runPosture')} style={{ height: '100%' }}>
            <Descriptions size="small" column={1} bordered>
              <Descriptions.Item label={t('explain.decision')}>{decisionTone.label}</Descriptions.Item>
              <Descriptions.Item label={t('explain.status')}>{statusTone.label}</Descriptions.Item>
              <Descriptions.Item label={t('explain.planVersion')}>{view.plan_version}</Descriptions.Item>
              <Descriptions.Item label={t('explain.approved')}>{view.approved ? t('yes') : t('no')}</Descriptions.Item>
              <Descriptions.Item label={t('explain.approvedBy')}>{view.approved_by || '-'}</Descriptions.Item>
              <Descriptions.Item label={t('explain.approvedAt')}>{formatDateTime(view.approved_at)}</Descriptions.Item>
              <Descriptions.Item label={t('explain.resultClass')}>{getResultClassLabel(view.result_class)}</Descriptions.Item>
              <Descriptions.Item label={t('explain.truthMode')}>{getTruthModeLabel(view.truth_mode)}</Descriptions.Item>
              <Descriptions.Item label={t('explain.authoritySource')}>{getOutcomeAuthorityLabel(view.outcome_authority_source)}</Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
        <Col xs={24} lg={14}>
          <Card title={t('explain.evidenceSummary')} style={{ height: '100%' }}>
            {evidenceSummary ? (
              <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={8}>
                  <Statistic title={t('explain.pass')} value={evidenceSummary.pass_cases} valueStyle={{ color: '#10b981' }} />
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Statistic title={t('explain.warn')} value={evidenceSummary.warn_cases} valueStyle={{ color: '#faad14' }} />
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Statistic title={t('explain.block')} value={evidenceSummary.block_cases} valueStyle={{ color: '#ef4444' }} />
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Statistic title={t('explain.avgScore')} value={Number(formatScore(evidenceSummary.average_case_score))} precision={1} />
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Statistic title={t('explain.confidence')} value={formatConfidence(evidenceSummary.average_confidence)} />
                </Col>
                <Col xs={24} sm={12} lg={8}>
                  <Statistic title={t('explain.coverageRate')} value={formatCoverage(evidenceSummary.coverage_score)} />
                </Col>
              </Row>
            ) : (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('explain.noEvidenceSummary')} />
            )}
          </Card>
        </Col>
      </Row>

      {(statusCounts.length > 0 || reasonCounts.length > 0) && (
        <Card title={t('explain.selectionSummary')} style={{ marginBottom: 16 }}>
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            {statusCounts.length > 0 && (
              <div>
                <Text strong>{t('explain.statusCounts')}</Text>
                <div style={{ marginTop: 8 }}>
                  {statusCounts.map(([name, value]) => (
                    <Tag key={name}>{humanizeKey(name)}: {value}</Tag>
                  ))}
                </div>
              </div>
            )}
            {reasonCounts.length > 0 && (
              <div>
                <Text strong>{t('explain.reasonCounts')}</Text>
                <div style={{ marginTop: 8 }}>
                  {reasonCounts.map(([name, value]) => (
                    <Tag key={name}>{getSelectionReasonLabel(name)}: {value}</Tag>
                  ))}
                </div>
              </div>
            )}
          </Space>
        </Card>
      )}

      <Card title={t('explain.caseSelectionAndEvidence')}>
        <Table<RunExplainCaseSelectionView>
          rowKey={(record) => record.selection_record_id || `${record.benchmark_id}:${record.case_key}`}
          dataSource={caseSelections}
          pagination={{ pageSize: 10 }}
          expandable={{
            expandedRowRender: (record) => (
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Descriptions size="small" column={2} bordered>
                  <Descriptions.Item label={t('explain.selectionRecord')}>{record.selection_record_id || '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('explain.benchmark')}>{record.benchmark_id}</Descriptions.Item>
                  <Descriptions.Item label={t('explain.caseAsset')}>{record.case_asset_id || '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('explain.assetVersion')}>{record.case_asset_version_id || '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('explain.fusionReport')}>{record.fusion_report_id || '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('explain.fusionCaseReport')}>{record.fusion_case_report_id || '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('explain.finalScore')}>{formatScore(record.final_score)}</Descriptions.Item>
                  <Descriptions.Item label={t('explain.evidenceCompleteness')}>{formatCoverage(record.evidence_completeness)}</Descriptions.Item>
                </Descriptions>

                <div>
                  <Text strong>{t('explain.bindingInfo')}</Text>
                  <div style={{ marginTop: 8 }}>{renderJsonBlock(record.binding)}</div>
                </div>

                <div>
                  <Text strong>{t('explain.evidencePayload')}</Text>
                  <div style={{ marginTop: 8 }}>{renderJsonBlock(record.evidence)}</div>
                </div>
              </Space>
            ),
          }}
          columns={[
            {
              title: t('explain.caseColumn'),
              dataIndex: 'case_key',
              key: 'case_key',
              ellipsis: true,
              width: 280,
            },
            {
              title: t('explain.reasonCol'),
              dataIndex: 'selection_reason',
              key: 'selection_reason',
              width: 220,
              render: (value: string) => getSelectionReasonLabel(value),
            },
            {
              title: t('explain.statusCol'),
              dataIndex: 'selection_status',
              key: 'selection_status',
              width: 140,
              render: (value: string) => {
                const tone = getSelectionStatusTone(value);
                return <Tag color={tone.color}>{tone.label}</Tag>;
              },
            },
            {
              title: t('explain.evidenceCol'),
              dataIndex: 'evidence_available',
              key: 'evidence_available',
              width: 120,
              render: (value: boolean) => <Tag color={value ? 'green' : 'default'}>{value ? t('explain.evidenceAvailable') : t('explain.evidenceMissing')}</Tag>,
            },
            {
              title: t('explain.decisionCol'),
              dataIndex: 'final_decision',
              key: 'final_decision',
              width: 120,
              render: (value?: string) => {
                if (!value) {
                  return '-';
                }
                const tone = getDecisionTone(value);
                return <Tag color={tone.color}>{tone.label}</Tag>;
              },
            },
            {
              title: t('explain.riskCol'),
              dataIndex: 'final_risk_level',
              key: 'final_risk_level',
              width: 120,
              render: (value?: string) => {
                if (!value) {
                  return '-';
                }
                const tone = getRiskTone(value);
                return <Tag color={tone.color}>{tone.label}</Tag>;
              },
            },
            {
              title: t('explain.confidenceCol'),
              dataIndex: 'confidence',
              key: 'confidence',
              width: 120,
              render: (value?: number) => formatConfidence(value),
            },
          ]}
        />
      </Card>
    </div>
  );
}
