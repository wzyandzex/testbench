import { Empty, Progress, Space, Table, Tag, Tooltip, Typography } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined, MinusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

import type { MetricDelta, MetricsDiff } from '../service';

const { Text } = Typography;

interface MetricsDiffTabProps {
  diff: MetricsDiff;
}

const KIND_META: Record<string, { color: string; icon: React.ReactNode }> = {
  unchanged: { color: '#8c8c8c', icon: <MinusOutlined /> },
  improved:  { color: '#52c41a', icon: <ArrowUpOutlined /> },
  regressed: { color: '#f5222d', icon: <ArrowDownOutlined /> },
  different: { color: '#faad14', icon: <ArrowUpOutlined /> },
};

function formatValue(key: string, val: number) {
  if (key.endsWith('_score') || key === 'composite_score') return val.toFixed(3);
  if (key === 'duration_ms') {
    if (val < 1000) return `${val.toFixed(0)} ms`;
    return `${(val / 1000).toFixed(1)} s`;
  }
  return Math.round(val).toLocaleString();
}

export function MetricsDiffTab({ diff }: MetricsDiffTabProps) {
  const { t } = useTranslation('comparisons');

  if (!diff.deltas || diff.deltas.length === 0) {
    return <Empty description={t('metrics.empty')} />;
  }

  const columns = [
    {
      title: t('metrics.columns.metric'),
      dataIndex: 'label',
      key: 'label',
      width: 140,
      render: (text: string, record: MetricDelta) => (
        <Tooltip title={record.higher_is_better ? t('metrics.higherIsBetter') : t('metrics.lowerIsBetter')}>
          <Text strong>{text}</Text>
        </Tooltip>
      ),
    },
    {
      title: t('metrics.columns.reference'),
      dataIndex: 'reference',
      key: 'reference',
      width: 140,
      align: 'right' as const,
      render: (val: number, record: MetricDelta) => (
        <Text>{formatValue(record.key, val)}</Text>
      ),
    },
    {
      title: t('metrics.columns.target'),
      dataIndex: 'target',
      key: 'target',
      width: 140,
      align: 'right' as const,
      render: (val: number, record: MetricDelta) => (
        <Text strong>{formatValue(record.key, val)}</Text>
      ),
    },
    {
      title: t('metrics.columns.delta'),
      dataIndex: 'delta_pct',
      key: 'delta_pct',
      width: 120,
      align: 'right' as const,
      render: (pct: string, record: MetricDelta) => {
        const meta = KIND_META[record.change_kind] || KIND_META.unchanged;
        return (
          <Tag color={record.change_kind === 'unchanged' ? 'default' : record.change_kind} icon={meta.icon}>
            {pct}
          </Tag>
        );
      },
    },
    {
      title: t('metrics.columns.magnitude'),
      key: 'magnitude',
      render: (_: unknown, record: MetricDelta) => {
        // 用进度条直观表示变化幅度
        const pctVal = parseFloat(record.delta_pct.replace('%', '').replace('+', '')) || 0;
        const absPct = Math.min(Math.abs(pctVal), 100);
        const meta = KIND_META[record.change_kind] || KIND_META.unchanged;
        return (
          <Progress
            percent={absPct}
            showInfo={false}
            strokeColor={meta.color}
            size="small"
          />
        );
      },
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      {!diff.has_metrics && (
        <Tag color="orange">{t('metrics.fallbackOnly')}</Tag>
      )}
      <Table
        rowKey="key"
        columns={columns}
        dataSource={diff.deltas}
        pagination={false}
        size="middle"
        bordered
      />
    </Space>
  );
}
