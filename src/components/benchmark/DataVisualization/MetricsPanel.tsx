/**
 * 实时指标面板组件
 * 显示实时执行数、平均成功率、P95/P99延迟、成本追踪、活跃执行计数
 */

import { memo, useEffect, useState, useCallback } from 'react';
import { Row, Col, Statistic, Progress, Space, Typography, Button } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarOutlined,
  FireOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useTranslation } from 'react-i18next';
import { useThemeTokens, useTextStyle, useStatCardStyle, useProgressTrailColor } from '@/theme';

const { Text } = Typography;

interface MetricValue {
  current: number;
  previous?: number;
  trend?: 'up' | 'down' | 'stable';
}

interface OptionalMetricValue {
  current: number | null;
  previous?: number | null;
  trend?: 'up' | 'down' | 'stable';
}

interface ExecutionMetrics {
  // 实时执行数
  totalExecutions: MetricValue;
  activeExecutions: number;

  // 成功率
  successRate: MetricValue;

  // 延迟 (ms)
  p50Latency?: number;
  p95Latency: MetricValue;
  p99Latency: MetricValue;

  // 成本
  totalCost: OptionalMetricValue;
  avgCostPerExecution: number | null;

  // 资源使用
  cpuUsage: number;
  memoryUsage: number;

  // 最后更新时间
  lastUpdated: number;
}

interface MetricsPanelProps {
  data: ExecutionMetrics;
  loading?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onRefresh?: () => void;
  showTrend?: boolean;
  className?: string;
}

const MetricsPanel = memo(function MetricsPanel({
  data,
  loading = false,
  autoRefresh = true,
  refreshInterval = 30000,
  onRefresh,
  showTrend = true,
  className = '',
}: MetricsPanelProps) {
  const { t } = useTranslation('benchmarks');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // 主题
  const tokens = useThemeTokens();
  const primaryText = useTextStyle('primary');
  const secondaryText = useTextStyle('secondary');
  const statCardStyle = useStatCardStyle();
  const progressTrailColor = useProgressTrailColor();

  useEffect(() => {
    if (autoRefresh) {
      const timer = setInterval(() => {
        onRefresh?.();
        setLastRefresh(new Date());
      }, refreshInterval);

      return () => clearInterval(timer);
    }
  }, [autoRefresh, refreshInterval, onRefresh]);

  // 计算趋势百分比
  const getTrendPercent = useCallback((current: number, previous?: number) => {
    if (!previous || previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  }, []);

  // 趋势指示器
  const TrendIndicator = memo(function TrendIndicator({
    current,
    previous,
    inverse = false,
  }: {
    current: number;
    previous?: number;
    inverse?: boolean;
  }) {
    if (!showTrend || !previous) return null;

    const trend = current > previous ? 'up' : current < previous ? 'down' : 'stable';
    const percent = Math.abs(getTrendPercent(current, previous));

    // 对于成功率等指标，上升是好的；对于延迟等指标，下降是好的
    const isPositive = inverse ? trend === 'down' : trend === 'up';

    if (trend === 'stable' || percent < 0.1) return null;

    return (
      <span
        style={{
          fontSize: 12,
          marginLeft: 8,
          color: isPositive ? '#52c41a' : '#ff4d4f',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        {isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
        {percent.toFixed(1)}%
      </span>
    );
  });

  // 格式化成本
  const formatCost = useCallback((value: number | null) => {
    if (value === null || !Number.isFinite(value)) {
      return t('components.viz.metrics.notAvailable');
    }
    if (value < 0.01) return `$${(value * 1000).toFixed(2)}µ`;
    if (value < 1) return `$${(value * 100).toFixed(2)}c`;
    return `$${value.toFixed(4)}`;
  }, [t]);

  // 格式化延迟
  const formatLatency = useCallback((value: number) => {
    if (value < 1000) return `${value.toFixed(0)}ms`;
    return `${(value / 1000).toFixed(2)}s`;
  }, []);

  // 资源使用颜色
  const getResourceColor = useCallback((usage: number) => {
    if (usage < 50) return tokens.status.success;
    if (usage < 80) return tokens.status.warning;
    return tokens.status.error;
  }, [tokens.status]);

  const statIconStyle = (color: string): React.CSSProperties => ({
    width: 40,
    height: 40,
    borderRadius: 8,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 18,
    backgroundColor: `${color}15`,
    color: color,
  });
  const successRatePercent = Math.max(0, Math.min(100, data.successRate.current * 100));

  return (
    <div className={`metrics-panel ${className}`}>
      {/* 头部 */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}>
        <Space>
          <Text strong style={{ fontSize: 14, ...primaryText }}>{t('components.viz.metrics.header')}</Text>
          {autoRefresh && (
            <Text style={{ fontSize: 12, ...secondaryText }}>
              {t('components.viz.metrics.autoRefresh', { time: dayjs(lastRefresh).format('HH:mm:ss') })}
            </Text>
          )}
        </Space>
        <Button
          type="text"
          icon={<ReloadOutlined spin={loading} />}
          onClick={() => {
            onRefresh?.();
            setLastRefresh(new Date());
          }}
          size="small"
        >
          {t('components.viz.metrics.refresh')}
        </Button>
      </div>

      {/* 指标卡片网格 */}
      <Row gutter={[16, 16]}>
        {/* 实时执行数 */}
        <Col xs={24} sm={12} lg={6}>
          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={statIconStyle(tokens.brand.primary)}>
                <ThunderboltOutlined />
              </div>
              <div style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, ...secondaryText }}>{t('components.viz.metrics.totalExecutions')}</Text>
                <Statistic
                  value={data.totalExecutions.current}
                  valueStyle={{ fontSize: 24, fontWeight: 600, ...primaryText }}
                  suffix={
                    <TrendIndicator
                      current={data.totalExecutions.current}
                      previous={data.totalExecutions.previous}
                    />
                  }
                />
              </div>
            </div>
            {/* 活跃执行 */}
            {data.activeExecutions > 0 && (
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${tokens.border.default}` }}>
                <Space>
                  <FireOutlined style={{ color: tokens.status.warning }} />
                  <Text style={{ fontSize: 12, ...secondaryText }}>{t('components.viz.metrics.activeExecutions')}</Text>
                  <Text strong style={{ fontSize: 14, ...primaryText }}>{data.activeExecutions}</Text>
                </Space>
              </div>
            )}
          </div>
        </Col>

        {/* 成功率 */}
        <Col xs={24} sm={12} lg={6}>
          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={statIconStyle(tokens.status.success)}>
                <CheckCircleOutlined />
              </div>
              <div style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, ...secondaryText }}>{t('components.viz.metrics.successRate')}</Text>
                <div>
                  <span style={{ fontSize: 24, fontWeight: 600, ...primaryText }}>
                    {successRatePercent.toFixed(1)}%
                  </span>
                  <TrendIndicator
                    current={data.successRate.current}
                    previous={data.successRate.previous}
                  />
                </div>
                <Progress
                  percent={successRatePercent}
                  showInfo={false}
                  strokeColor={{
                    '0%': tokens.status.success,
                    '100%': '#73d13d',
                  }}
                  trailColor={progressTrailColor}
                  strokeWidth={6}
                  style={{ marginTop: 8 }}
                />
              </div>
            </div>
          </div>
        </Col>

        {/* 延迟 */}
        <Col xs={24} sm={12} lg={6}>
          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={statIconStyle(tokens.brand.secondary)}>
                <ClockCircleOutlined />
              </div>
              <div style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, ...secondaryText }}>{t('components.viz.metrics.p95Latency')}</Text>
                <div>
                  <span style={{ fontSize: 24, fontWeight: 600, ...primaryText }}>
                    {formatLatency(data.p95Latency.current)}
                  </span>
                  <TrendIndicator
                    current={data.p95Latency.current}
                    previous={data.p95Latency.previous}
                    inverse
                  />
                </div>
                {/* P99 延迟 */}
                <div style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 11, ...secondaryText }}>
                    {t('components.viz.metrics.p99Latency', { value: formatLatency(data.p99Latency.current) })}
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </Col>

        {/* 成本 */}
        <Col xs={24} sm={12} lg={6}>
          <div style={statCardStyle}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={statIconStyle(tokens.status.warning)}>
                <DollarOutlined />
              </div>
              <div style={{ flex: 1 }}>
                <Text style={{ fontSize: 12, ...secondaryText }}>{t('components.viz.metrics.totalCost')}</Text>
                <div>
                  <span style={{ fontSize: 24, fontWeight: 600, ...primaryText }}>
                    {formatCost(data.totalCost.current)}
                  </span>
                  {data.totalCost.current !== null && (
                    <TrendIndicator
                      current={data.totalCost.current}
                      previous={data.totalCost.previous ?? undefined}
                      inverse
                    />
                  )}
                </div>
                <div style={{ marginTop: 8 }}>
                  <Text style={{ fontSize: 11, ...secondaryText }}>
                    {data.avgCostPerExecution === null
                      ? t('components.viz.metrics.avgCostUnavailable')
                      : t('components.viz.metrics.avgCost', { value: formatCost(data.avgCostPerExecution) })}
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </Col>
      </Row>

      {/* 资源使用 */}
      {(data.cpuUsage > 0 || data.memoryUsage > 0) && (
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} md={12}>
            <div style={statCardStyle}>
              <Space style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: 12, ...primaryText }}>{t('components.viz.metrics.cpuUsage')}</Text>
                <Text style={{ fontSize: 14, color: getResourceColor(data.cpuUsage) }}>
                  {data.cpuUsage.toFixed(1)}%
                </Text>
              </Space>
              <Progress
                percent={data.cpuUsage}
                strokeColor={getResourceColor(data.cpuUsage)}
                trailColor={progressTrailColor}
                showInfo={false}
                strokeWidth={8}
              />
            </div>
          </Col>
          <Col xs={24} md={12}>
            <div style={statCardStyle}>
              <Space style={{ marginBottom: 12 }}>
                <Text strong style={{ fontSize: 12, ...primaryText }}>{t('components.viz.metrics.memoryUsage')}</Text>
                <Text style={{ fontSize: 14, color: getResourceColor(data.memoryUsage) }}>
                  {data.memoryUsage.toFixed(1)}%
                </Text>
              </Space>
              <Progress
                percent={data.memoryUsage}
                strokeColor={getResourceColor(data.memoryUsage)}
                trailColor={progressTrailColor}
                showInfo={false}
                strokeWidth={8}
              />
            </div>
          </Col>
        </Row>
      )}
    </div>
  );
});

export default MetricsPanel;
