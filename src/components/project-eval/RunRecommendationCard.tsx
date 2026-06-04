import { Card, Space, Tag, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { useThemeTokens } from '@/theme';

const { Paragraph, Text, Title } = Typography;

export interface RunRecommendationCardProps {
  title: string;
  description: string;
  bullets?: string[];
  footnote?: string;
  selected?: boolean;
  recommended?: boolean;
  onClick?: () => void;
}

export default function RunRecommendationCard({
  title,
  description,
  bullets,
  footnote,
  selected = false,
  recommended = false,
  onClick,
}: RunRecommendationCardProps) {
  const { t } = useTranslation('projectEval');
  const tokens = useThemeTokens();

  return (
    <Card
      hoverable={Boolean(onClick)}
      onClick={onClick}
      style={{
        height: '100%',
        cursor: onClick ? 'pointer' : 'default',
        borderColor: selected ? tokens.brand.primary : tokens.border.default,
        boxShadow: selected ? `0 0 0 1px ${tokens.brand.primary} inset` : undefined,
      }}
      bodyStyle={{ height: '100%' }}
    >
      <Space direction="vertical" size={10} style={{ width: '100%' }}>
        <Space wrap>
          <Title level={5} style={{ margin: 0 }}>
            {title}
          </Title>
          {recommended && <Tag color="blue">{t('recommendation.recommended')}</Tag>}
          {selected && <Tag color="green">{t('recommendation.selected')}</Tag>}
        </Space>

        <Text type="secondary">{description}</Text>

        {bullets && bullets.length > 0 && (
          <Space direction="vertical" size={6} style={{ width: '100%' }}>
            {bullets.map((bullet) => (
              <Text key={bullet}>- {bullet}</Text>
            ))}
          </Space>
        )}

        {footnote && (
          <Paragraph type="secondary" style={{ marginBottom: 0 }}>
            {footnote}
          </Paragraph>
        )}
      </Space>
    </Card>
  );
}
