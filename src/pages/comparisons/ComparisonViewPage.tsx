import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  Descriptions,
  Empty,
  Input,
  message,
  Skeleton,
  Space,
  Tabs,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  ReloadOutlined,
  SaveOutlined,
  ShareAltOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import type { ComparisonResult } from './service';
import { compareExecutions, getSession } from './service';
import { VerdictBanner } from './components/VerdictBanner';
import { ConfigDiffTab } from './components/ConfigDiffTab';
import { MetricsDiffTab } from './components/MetricsDiffTab';
import { TraceDiffTab } from './components/TraceDiffTab';
import { SaveSessionModal } from './components/SaveSessionModal';

const { Title, Text } = Typography;

export default function ComparisonViewPage() {
  const { t } = useTranslation('comparisons');
  const navigate = useNavigate();
  const { sessionId } = useParams<{ sessionId?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();

  // 两个来源：URL params (?ref=A&tgt=B) 或 session
  const initialRefId = searchParams.get('ref') || '';
  const initialTgtId = searchParams.get('tgt') || '';

  const [refId, setRefId] = useState(initialRefId);
  const [tgtId, setTgtId] = useState(initialTgtId);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [sessionNotes, setSessionNotes] = useState<string>('');
  const [saveModalOpen, setSaveModalOpen] = useState(false);

  // 从 session ID 加载
  const loadFromSession = useCallback(async () => {
    if (!sessionId) return;
    try {
      const session = await getSession(sessionId);
      setRefId(session.reference_id);
      setTgtId(session.target_id);
      setSessionNotes(session.notes || '');
    } catch {
      // handled by interceptor
    }
  }, [sessionId]);

  useEffect(() => {
    if (sessionId) {
      loadFromSession();
    }
  }, [sessionId, loadFromSession]);

  const runComparison = useCallback(async () => {
    if (!refId || !tgtId) return;
    if (refId === tgtId) {
      message.warning(t('view.sameExecutionWarning'));
      return;
    }
    setLoading(true);
    try {
      const r = await compareExecutions(refId, tgtId);
      setResult(r);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [refId, tgtId]);

  useEffect(() => {
    if (refId && tgtId) {
      runComparison();
    }
  }, [refId, tgtId, runComparison]);

  const handleCopyShareLink = () => {
    const url = `${window.location.origin}/comparisons?ref=${refId}&tgt=${tgtId}`;
    navigator.clipboard.writeText(url).then(
      () => message.success(t('view.copySuccess')),
      () => message.error(t('view.copyFailed'))
    );
  };

  return (
    <div>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Space>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/comparisons')}>
            {t('view.back')}
          </Button>
          <Title level={4} style={{ margin: 0 }}>
            {sessionId ? t('view.savedTitle') : t('view.newTitle')}
          </Title>
        </Space>
        {result && (
          <Space>
            <Button icon={<ShareAltOutlined />} onClick={handleCopyShareLink}>
              {t('view.copyLink')}
            </Button>
            {!sessionId && (
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => setSaveModalOpen(true)}
              >
                {t('view.save')}
              </Button>
            )}
          </Space>
        )}
      </Space>

      {/* Execution 输入栏 */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Space size={16} wrap>
          <Space>
            <Text type="secondary">{t('view.referenceLabel')}:</Text>
            <Input
              placeholder={t('view.executionPlaceholder')}
              value={refId}
              onChange={(e) => setRefId(e.target.value.trim())}
              style={{ width: 280 }}
              disabled={!!sessionId}
            />
          </Space>
          <Text type="secondary">{t('view.vs')}</Text>
          <Space>
            <Text type="secondary">{t('view.targetLabel')}:</Text>
            <Input
              placeholder={t('view.executionPlaceholder')}
              value={tgtId}
              onChange={(e) => setTgtId(e.target.value.trim())}
              style={{ width: 280 }}
              disabled={!!sessionId}
            />
          </Space>
          {!sessionId && (
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={() => {
                setSearchParams({ ref: refId, tgt: tgtId });
                runComparison();
              }}
              disabled={!refId || !tgtId || refId === tgtId}
            >
              {t('view.generate')}
            </Button>
          )}
        </Space>
      </Card>

      {/* 加载中 / 空状态 / 对比结果 */}
      {loading ? (
        <Card bordered={false}>
          <Skeleton active paragraph={{ rows: 10 }} />
        </Card>
      ) : !result ? (
        <Card bordered={false}>
          <Empty
            description={
              refId && tgtId
                ? t('view.emptyReady')
                : t('view.emptyInput')
            }
          />
        </Card>
      ) : (
        <>
          {/* Verdict 横幅 */}
          <VerdictBanner
            verdict={result.verdict}
            verdictNote={result.verdict_note}
            insights={result.insights}
            refLabel={`${result.reference.id.slice(0, 8)} (${result.reference.status})`}
            tgtLabel={`${result.target.id.slice(0, 8)} (${result.target.status})`}
          />

          {/* Session 备注（仅 session 模式） */}
          {sessionId && sessionNotes && (
            <Card bordered={false} title={t('view.notes')} size="small" style={{ marginBottom: 16 }}>
              <Text style={{ whiteSpace: 'pre-wrap' }}>{sessionNotes}</Text>
            </Card>
          )}

          {/* 两侧执行摘要 */}
          <Card bordered={false} size="small" style={{ marginBottom: 16 }}>
            <Descriptions column={2} size="small" bordered>
              <Descriptions.Item label={t('view.summary.referenceAgent')}>{result.reference.agent_id.slice(0, 12)}</Descriptions.Item>
              <Descriptions.Item label={t('view.summary.targetAgent')}>{result.target.agent_id.slice(0, 12)}</Descriptions.Item>
              <Descriptions.Item label={t('view.summary.referenceTime')}>
                {dayjs(result.reference.started_at).format('MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label={t('view.summary.targetTime')}>
                {dayjs(result.target.started_at).format('MM-DD HH:mm')}
              </Descriptions.Item>
              <Descriptions.Item label={t('view.summary.referenceStatus')}>
                <Tag color={result.reference.success ? 'success' : 'error'}>{result.reference.status}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('view.summary.targetStatus')}>
                <Tag color={result.target.success ? 'success' : 'error'}>{result.target.status}</Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {/* Tabs */}
          <Card bordered={false}>
            <Tabs
              defaultActiveKey="metrics"
              items={[
                {
                  key: 'metrics',
                  label: t('view.tabs.metrics', { count: result.metrics_diff.deltas.length }),
                  children: <MetricsDiffTab diff={result.metrics_diff} />,
                },
                {
                  key: 'config',
                  label: (
                    <span>
                      {t('view.tabs.config')} {result.config_diff.changed_count > 0 && (
                        <Tag color="orange" style={{ marginLeft: 4 }}>{result.config_diff.changed_count}</Tag>
                      )}
                    </span>
                  ),
                  children: <ConfigDiffTab diff={result.config_diff} />,
                },
                {
                  key: 'trace',
                  label: (
                    <span>
                      {t('view.tabs.trace')} {result.trace_diff.diverge_at >= 0 && (
                        <Tag color="warning" style={{ marginLeft: 4 }}>{t('view.tabs.diverged')}</Tag>
                      )}
                    </span>
                  ),
                  children: <TraceDiffTab diff={result.trace_diff} />,
                },
              ]}
            />
          </Card>
        </>
      )}

      <SaveSessionModal
        open={saveModalOpen}
        referenceId={refId}
        targetId={tgtId}
        onCancel={() => setSaveModalOpen(false)}
        onSuccess={(id) => {
          setSaveModalOpen(false);
          navigate(`/comparisons/sessions/${id}`);
        }}
      />
    </div>
  );
}
