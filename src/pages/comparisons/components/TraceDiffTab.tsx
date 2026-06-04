import { Alert, Col, Empty, Row, Space, Tag, Typography } from 'antd';
import { CheckCircleOutlined, EllipsisOutlined, MinusCircleOutlined, WarningOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import type { StepDiffEntry, StepTrace, TraceDiff } from '../service';

const { Text } = Typography;

interface TraceDiffTabProps {
  diff: TraceDiff;
}

function StepCell({
  step,
  highlight,
}: {
  step?: StepTrace;
  highlight?: 'add' | 'remove' | 'differ' | 'same';
}) {
  const { t } = useTranslation('comparisons');

  if (!step) {
    return (
      <div style={{ padding: 8, color: '#bfbfbf', fontStyle: 'italic', textAlign: 'center' }}>
        ({t('trace.none')})
      </div>
    );
  }

  const bgMap = {
    add:    '#f6ffed',
    remove: '#fff1f0',
    differ: '#fffbe6',
    same:   '#fafafa',
    undefined: '#fafafa',
  };

  return (
    <div
      style={{
        padding: 8,
        borderRadius: 4,
        background: bgMap[highlight || 'undefined'],
        borderLeft: `3px solid ${
          highlight === 'add'    ? '#52c41a'
          : highlight === 'remove' ? '#f5222d'
          : highlight === 'differ' ? '#faad14'
          : '#d9d9d9'
        }`,
      }}
    >
      <Space size={4}>
        <Tag color="blue">{t('trace.step', { index: step.step_index })}</Tag>
        <Tag>{step.step_type}</Tag>
        {step.has_error && <Tag color="error" icon={<WarningOutlined />}>{t('trace.error')}</Tag>}
      </Space>
      <div style={{ marginTop: 4, fontSize: 13, fontFamily: 'monospace', wordBreak: 'break-all' }}>
        {step.action || <Text type="secondary">({t('trace.noAction')})</Text>}
      </div>
      <Text type="secondary" style={{ fontSize: 11 }}>
        {step.duration_ms < 1000 ? `${step.duration_ms}ms` : `${(step.duration_ms / 1000).toFixed(1)}s`}
      </Text>
    </div>
  );
}

function SkippedRow({ count }: { count: number }) {
  const { t } = useTranslation('comparisons');

  return (
    <Row style={{ marginBottom: 8 }}>
      <Col span={24}>
        <div
          style={{
            padding: 10,
            textAlign: 'center',
            background: '#fafafa',
            border: '1px dashed #d9d9d9',
            borderRadius: 4,
            color: '#8c8c8c',
            fontSize: 13,
          }}
        >
          <EllipsisOutlined style={{ marginRight: 8 }} />
          {t('trace.skipped', { count })}
          <EllipsisOutlined style={{ marginLeft: 8 }} />
        </div>
      </Col>
    </Row>
  );
}

function EntryRow({ entry }: { entry: StepDiffEntry }) {
  // skipped 用专门的行
  if (entry.kind === 'skipped') {
    return <SkippedRow count={entry.skipped_count || 0} />;
  }

  const refHl = entry.kind === 'common' ? 'same'
              : entry.kind === 'only_ref' ? 'remove'
              : entry.kind === 'differ' ? 'differ' : undefined;
  const tgtHl = entry.kind === 'common' ? 'same'
              : entry.kind === 'only_tgt' ? 'add'
              : entry.kind === 'differ' ? 'differ' : undefined;

  return (
    <Row gutter={12} style={{ marginBottom: 8 }}>
      <Col span={11}>
        <StepCell step={entry.reference} highlight={refHl} />
      </Col>
      <Col span={2} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {entry.kind === 'common'   && <CheckCircleOutlined style={{ color: '#52c41a' }} />}
        {entry.kind === 'differ'   && <MinusCircleOutlined style={{ color: '#faad14' }} />}
        {entry.kind === 'only_ref' && <span style={{ color: '#f5222d', fontSize: 18 }}>−</span>}
        {entry.kind === 'only_tgt' && <span style={{ color: '#52c41a', fontSize: 18 }}>+</span>}
      </Col>
      <Col span={11}>
        <StepCell step={entry.target} highlight={tgtHl} />
      </Col>
    </Row>
  );
}

export function TraceDiffTab({ diff }: TraceDiffTabProps) {
  const { t } = useTranslation('comparisons');

  if (!diff.entries || diff.entries.length === 0) {
    return <Empty description={t('trace.empty')} />;
  }

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Row gutter={16}>
        <Col span={11}>
          <Alert
            type="info"
            message={
              <Space>
                <Text strong>Reference</Text>
                <Text type="secondary">{t('trace.totalSteps', { count: diff.reference_step_count })}</Text>
              </Space>
            }
          />
        </Col>
        <Col span={2} />
        <Col span={11}>
          <Alert
            type="info"
            message={
              <Space>
                <Text strong>Target</Text>
                <Text type="secondary">{t('trace.totalSteps', { count: diff.target_step_count })}</Text>
              </Space>
            }
          />
        </Col>
      </Row>

      {diff.diverge_at >= 0 ? (
        <Alert
          type="warning"
          showIcon
          message={t('trace.divergedTitle', { index: diff.diverge_at })}
          description={t('trace.divergedDescription', { prefix: diff.common_prefix_len, index: diff.diverge_at })}
        />
      ) : (
        <Alert type="success" showIcon message={t('trace.identical')} />
      )}

      <div>
        {diff.entries.map((entry, idx) => (
          <EntryRow key={`${entry.kind}-${entry.step_index}-${idx}`} entry={entry} />
        ))}
      </div>

      {diff.is_truncated && (
        <Alert
          type="warning"
          showIcon
          message={t('trace.truncatedTitle', { shown: diff.entries.length, total: diff.total_entries })}
          description={t('trace.truncatedDescription')}
        />
      )}

      <Alert
        type="info"
        message={t('trace.legend')}
        description={
          <Space wrap>
            <Tag color="default">{t('trace.legendCommon')}</Tag>
            <Tag color="warning">{t('trace.legendDifferent')}</Tag>
            <Tag color="success">{t('trace.legendOnlyTarget')}</Tag>
            <Tag color="error">{t('trace.legendOnlyReference')}</Tag>
            <Tag color="default" icon={<EllipsisOutlined />}>{t('trace.legendCollapsed')}</Tag>
          </Space>
        }
      />
    </Space>
  );
}
