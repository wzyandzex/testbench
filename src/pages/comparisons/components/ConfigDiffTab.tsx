import { Alert, Empty, Space, Table, Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

import type { ConfigDiff } from '../service';

const { Text } = Typography;

interface ConfigDiffTabProps {
  diff: ConfigDiff;
}

const KIND_TAGS: Record<string, { color: string }> = {
  unchanged: { color: 'default' },
  improved:  { color: 'success' },
  regressed: { color: 'error' },
  different: { color: 'warning' },
};

export function ConfigDiffTab({ diff }: ConfigDiffTabProps) {
  const { t } = useTranslation('comparisons');

  if (!diff.fields || diff.fields.length === 0) {
    return <Empty description={t('config.empty')} />;
  }

  const columns = [
    {
      title: t('config.columns.item'),
      dataIndex: 'label',
      key: 'label',
      width: 140,
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: t('config.columns.reference'),
      dataIndex: 'reference',
      key: 'reference',
      render: (val: string) => <Text code style={{ fontSize: 12 }}>{val || '—'}</Text>,
    },
    {
      title: '',
      key: 'arrow',
      width: 40,
      align: 'center' as const,
      render: () => <span style={{ color: '#999' }}>→</span>,
    },
    {
      title: t('config.columns.target'),
      dataIndex: 'target',
      key: 'target',
      render: (val: string, record: ConfigDiff['fields'][number]) => (
        <Text
          code
          style={{
            fontSize: 12,
            background: record.change_kind !== 'unchanged' ? '#fffbe6' : undefined,
          }}
        >
          {val || '—'}
        </Text>
      ),
    },
    {
      title: t('config.columns.change'),
      dataIndex: 'change_kind',
      key: 'change_kind',
      width: 80,
      render: (kind: string) => {
        const meta = KIND_TAGS[kind] || KIND_TAGS.unchanged;
        return <Tag color={meta.color}>{t(`changeKind.${kind}`, { defaultValue: kind })}</Tag>;
      },
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      {!diff.same_benchmark && (
        <Alert
          type="warning"
          showIcon
          message={t('config.differentBenchmarkTitle')}
          description={t('config.differentBenchmarkDescription')}
        />
      )}
      {diff.same_benchmark && !diff.same_agent && (
        <Alert
          type="info"
          showIcon
          message={t('config.sameBenchmarkDifferentAgentTitle')}
          description={t('config.sameBenchmarkDifferentAgentDescription')}
        />
      )}
      <Table
        rowKey="key"
        columns={columns}
        dataSource={diff.fields}
        pagination={false}
        size="middle"
        bordered
      />
    </Space>
  );
}
