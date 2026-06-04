import { Card, Col, Row, Space, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

import type { Verdict } from '../service';
import { VERDICT_META } from '../service';

const { Title, Text } = Typography;

interface VerdictBannerProps {
  verdict: Verdict;
  verdictNote: string;
  insights: string[];
  refLabel: string;
  tgtLabel: string;
}

export function VerdictBanner({
  verdict,
  verdictNote,
  insights,
  refLabel,
  tgtLabel,
}: VerdictBannerProps) {
  const { t } = useTranslation('comparisons');
  const meta = VERDICT_META[verdict];

  return (
    <Card
      bordered={false}
      style={{
        background: meta.bgColor,
        borderLeft: `4px solid ${meta.color}`,
        marginBottom: 16,
      }}
    >
      <Row gutter={24} align="middle">
        <Col flex="120px">
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48, lineHeight: 1 }}>{meta.icon}</div>
            <Title level={5} style={{ color: meta.color, margin: '8px 0 0 0' }}>
              {t(`verdict.${verdict}`)}
            </Title>
          </div>
        </Col>
        <Col flex="auto">
          <Space direction="vertical" size={4} style={{ width: '100%' }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('verdict.pair', { reference: refLabel, target: tgtLabel })}
            </Text>
            <Text strong style={{ fontSize: 15 }}>{verdictNote}</Text>
            {insights.length > 0 && (
              <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
                {insights.map((insight, idx) => (
                  <li key={idx} style={{ marginBottom: 2 }}>
                    <Text>{insight}</Text>
                  </li>
                ))}
              </ul>
            )}
          </Space>
        </Col>
      </Row>
    </Card>
  );
}
