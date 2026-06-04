import { Card, Progress, Space, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { DatabaseOutlined, TeamOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useIsDark } from '@/theme';
import type { OrganizationQuota } from '@/types/organization';

const { Text } = Typography;

interface QuotaCardProps {
  quota: OrganizationQuota | null;
  loading?: boolean;
}

function formatQuotaValue(value: number, unit?: 'GB') {
  if (unit === 'GB') {
    return `${value} GB`;
  }

  return `${value}`;
}

export function QuotaCard({ quota, loading }: QuotaCardProps) {
  const { t } = useTranslation('organizations');
  const isDark = useIsDark();

  if (loading || !quota) {
    return (
      <Card
        title={
          <Space>
            <DatabaseOutlined />
            <span>{t('components.quotaCard.title')}</span>
          </Space>
        }
        loading={loading}
      />
    );
  }

  const progressColor = (percentage: number) => {
    if (percentage >= 90) {
      return isDark ? '#ff4466' : '#ff4d4f';
    }
    if (percentage >= 70) {
      return isDark ? '#ff9500' : '#faad14';
    }
    return isDark ? '#00d4ff' : '#1677ff';
  };

  const sections = [
    {
      key: 'members',
      label: t('components.quotaCard.members'),
      icon: <TeamOutlined />,
      item: quota.members,
    },
    {
      key: 'executions',
      label: t('components.quotaCard.executions'),
      icon: <ThunderboltOutlined />,
      item: quota.executions,
    },
    {
      key: 'storage',
      label: t('components.quotaCard.storage'),
      icon: <DatabaseOutlined />,
      item: quota.storage,
    },
  ];

  return (
    <Card
      title={
        <Space>
          <DatabaseOutlined />
          <span>{t('components.quotaCard.title')}</span>
        </Space>
      }
    >
      <Space direction="vertical" size={24} style={{ width: '100%' }}>
        {sections.map((section) => (
          <div key={section.key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <Space>
                {section.icon}
                <Text>{section.label}</Text>
              </Space>
              <Text>
                <strong style={{ color: isDark ? '#00d4ff' : '#1677ff' }}>
                  {formatQuotaValue(section.item.current, section.item.unit)}
                </strong>
                {' / '}
                {formatQuotaValue(section.item.limit, section.item.unit)}
              </Text>
            </div>
            <Progress
              percent={Number(section.item.percentage.toFixed(1))}
              strokeColor={progressColor(section.item.percentage)}
              showInfo={false}
              size="small"
            />
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('components.quotaCard.remaining', { value: formatQuotaValue(section.item.remaining, section.item.unit) })}
            </Text>
          </div>
        ))}
      </Space>
    </Card>
  );
}

export default QuotaCard;
