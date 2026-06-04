import { Card, Col, Row, Statistic, Tooltip, Typography } from 'antd';
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  RiseOutlined,
  FallOutlined,
  WarningOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import type { TrendSummary } from '../service';

const { Text } = Typography;

interface SummaryCardsProps {
  summary: TrendSummary;
  loading?: boolean;
}

export function SummaryCards({ summary, loading }: SummaryCardsProps) {
  const wowPositive = summary.wow_change >= 0;
  const momPositive = summary.mom_change >= 0;
  const wowColor = wowPositive ? '#3f8600' : '#cf1322';
  const momColor = momPositive ? '#3f8600' : '#cf1322';

  return (
    <Row gutter={16}>
      <Col xs={24} sm={12} md={6}>
        <Card loading={loading} hoverable>
          <Statistic
            title="当前平均质量分"
            value={summary.current_avg}
            precision={3}
            valueStyle={{
              color: summary.trend_direction === 'improving' ? '#3f8600' :
                     summary.trend_direction === 'declining' ? '#cf1322' : undefined,
            }}
            prefix={
              summary.trend_direction === 'improving' ? <RiseOutlined /> :
              summary.trend_direction === 'declining' ? <FallOutlined /> : null
            }
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            最近 30 天的均值（0.0 – 1.0）
          </Text>
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card loading={loading} hoverable>
          <Tooltip title={`本周 vs 上周：${summary.wow_change >= 0 ? '+' : ''}${summary.wow_change.toFixed(3)}`}>
            <Statistic
              title="周环比 (WoW)"
              value={summary.wow_change_pct}
              valueStyle={{ color: wowColor }}
              prefix={wowPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            />
          </Tooltip>
          <Text type="secondary" style={{ fontSize: 12 }}>
            最近 7 天 vs 之前 7 天
          </Text>
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card loading={loading} hoverable>
          <Tooltip title={`本月 vs 上月：${summary.mom_change >= 0 ? '+' : ''}${summary.mom_change.toFixed(3)}`}>
            <Statistic
              title="月环比 (MoM)"
              value={summary.mom_change_pct}
              valueStyle={{ color: momColor }}
              prefix={momPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            />
          </Tooltip>
          <Text type="secondary" style={{ fontSize: 12 }}>
            最近 30 天 vs 之前 30 天
          </Text>
        </Card>
      </Col>

      <Col xs={24} sm={12} md={6}>
        <Card loading={loading} hoverable>
          <Statistic
            title="异常天数"
            value={summary.anomaly_count}
            valueStyle={{ color: summary.anomaly_count > 0 ? '#faad14' : undefined }}
            prefix={summary.anomaly_count > 0 ? <WarningOutlined /> : <TrophyOutlined />}
            suffix="天"
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            最佳：{summary.best_score.toFixed(3)} ({dayjs(summary.best_date).format('MM-DD')})
          </Text>
        </Card>
      </Col>
    </Row>
  );
}
