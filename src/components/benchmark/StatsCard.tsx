/**
 * StatsCard - 统计卡片组件
 * 用于展示评测任务的统计数据
 */

import { memo } from 'react';
import { Card, Row, Col, Statistic, Progress, Typography } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  StopOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { BenchmarkStats } from '@/types';

const { Text } = Typography;

interface StatsCardProps {
  /** 统计数据 */
  stats?: BenchmarkStats;
  /** 加载状态 */
  loading?: boolean;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

/**
 * StatsCard 组件
 *
 * 展示数据：
 * - 总执行次数、通过率、平均耗时
 * - 成功/失败/超时次数
 */
export const StatsCard = memo(function StatsCard({
  stats,
  loading = false,
  style,
  className,
}: StatsCardProps) {
  const { t } = useTranslation('benchmarks');

  if (!stats) {
    return (
      <Card
        loading={loading}
        title={t('components.stats.title')}
        style={style}
        className={className}
      >
        <Text type="secondary">{t('components.stats.empty')}</Text>
      </Card>
    );
  }

  const {
    total_runs,
    passed_runs,
    failed_runs,
    timeout_runs,
    cancelled_runs,
    success_rate,
    avg_duration,
    min_duration,
    max_duration,
    last_run_at,
    last_success_at,
    last_failure_at,
  } = stats;
  const successRatePercent = Math.max(0, Math.min(100, success_rate ?? 0));
  const successRateColor = successRatePercent >= 80 ? '#52c41a' : successRatePercent >= 50 ? '#faad14' : '#ff4d4f';
  const successRateGradientEnd = successRatePercent >= 80 ? '#73d13d' : successRatePercent >= 50 ? '#ffc53d' : '#ff7875';

  // 格式化耗时（纳秒转秒）
  const formatDuration = (ns: number) => {
    if (ns < 1_000_000_000) {
      return `${(ns / 1_000_000).toFixed(2)}ms`;
    }
    return `${(ns / 1_000_000_000).toFixed(2)}s`;
  };

  // 格式化时间
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '-';
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN');
  };

  return (
    <Card
      title={t('components.stats.title')}
      loading={loading}
      style={style}
      className={className}
    >
      <Row gutter={[16, 16]}>
        {/* 总执行次数 */}
        <Col xs={12} sm={8} md={6}>
          <Statistic
            title={t('components.stats.totalRuns')}
            value={total_runs}
            valueStyle={{ color: '#1677ff' }}
            prefix={<ThunderboltOutlined />}
          />
        </Col>

        {/* 成功率 */}
        <Col xs={12} sm={8} md={6}>
          <Statistic
            title={t('components.stats.passRate')}
            value={successRatePercent}
            precision={1}
            suffix="%"
            valueStyle={{
              color: successRateColor,
            }}
          />
          <Progress
            percent={Math.round(successRatePercent)}
            strokeColor={{
              '0%': successRateColor,
              '100%': successRateGradientEnd,
            }}
            showInfo={false}
            size="small"
          />
        </Col>

        {/* 平均耗时 */}
        <Col xs={12} sm={8} md={6}>
          <Statistic
            title={t('components.stats.avgDuration')}
            value={formatDuration(avg_duration)}
            valueStyle={{ color: '#1677ff' }}
          />
        </Col>

        {/* 最小/最大耗时 */}
        <Col xs={12} sm={8} md={6}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('components.stats.minMaxDuration')}
            </Text>
            <div style={{ fontSize: 16, fontWeight: 600 }}>
              {formatDuration(min_duration)} / {formatDuration(max_duration)}
            </div>
          </div>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        {/* 成功次数 */}
        <Col xs={12} sm={6}>
          <Statistic
            title={t('components.stats.passed')}
            value={passed_runs}
            valueStyle={{ color: '#52c41a' }}
            prefix={<CheckCircleOutlined />}
          />
        </Col>

        {/* 失败次数 */}
        <Col xs={12} sm={6}>
          <Statistic
            title={t('components.stats.failed')}
            value={failed_runs}
            valueStyle={{ color: '#ff4d4f' }}
            prefix={<CloseCircleOutlined />}
          />
        </Col>

        {/* 超时次数 */}
        <Col xs={12} sm={6}>
          <Statistic
            title={t('components.stats.timeout')}
            value={timeout_runs}
            valueStyle={{ color: '#faad14' }}
            prefix={<ClockCircleOutlined />}
          />
        </Col>

        {/* 取消次数 */}
        <Col xs={12} sm={6}>
          <Statistic
            title={t('components.stats.cancelled')}
            value={cancelled_runs}
            valueStyle={{ color: '#8c8c8c' }}
            prefix={<StopOutlined />}
          />
        </Col>
      </Row>

      {/* 最近执行时间 */}
      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={8}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('components.stats.lastRun')}
            </Text>
            <div style={{ fontSize: 13 }}>
              {formatTime(last_run_at)}
            </div>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('components.stats.lastSuccess')}
            </Text>
            <div style={{ fontSize: 13 }}>
              {formatTime(last_success_at)}
            </div>
          </div>
        </Col>
        <Col xs={24} sm={8}>
          <div>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('components.stats.lastFailure')}
            </Text>
            <div style={{ fontSize: 13 }}>
              {formatTime(last_failure_at)}
            </div>
          </div>
        </Col>
      </Row>

      {/* Agent 统计 */}
      {stats.agent_stats && Object.keys(stats.agent_stats).length > 0 && (
        <div style={{ marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('components.stats.agentStats')}
          </Text>
          <Row gutter={[8, 8]} style={{ marginTop: 8 }}>
            {Object.values(stats.agent_stats).map((agent) => (
              <Col xs={12} sm={8} md={6} key={agent.agent_id}>
                <div
                  style={{
                    padding: '8px',
                    background: '#f5f5f5',
                    borderRadius: 4,
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 600 }}>
                    {agent.agent_name}
                  </div>
                  <div style={{ fontSize: 11, color: '#666' }}>
                    {t('components.stats.agentSuccessRate', { rate: agent.success_rate.toFixed(1) })}
                  </div>
                  <div style={{ fontSize: 11, color: '#666' }}>
                    {t('components.stats.agentExecutions', { count: agent.total_runs })}
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      )}
    </Card>
  );
});

/**
 * 简化版统计卡片 - 只显示关键指标
 */
interface SimpleStatsProps {
  stats?: BenchmarkStats;
  loading?: boolean;
}

export const SimpleStatsCard = memo(function SimpleStatsCard({
  stats,
  loading,
}: SimpleStatsProps) {
  const { t } = useTranslation('benchmarks');

  if (!stats) {
    return null;
  }
  const successRatePercent = Math.max(0, Math.min(100, stats.success_rate ?? 0));
  const successRateColor = successRatePercent >= 80 ? '#52c41a' : successRatePercent >= 50 ? '#faad14' : '#ff4d4f';

  return (
    <Row gutter={16}>
      <Col span={8}>
        <Statistic
          title={t('components.stats.simpleTotal')}
          value={stats.total_runs}
          loading={loading}
        />
      </Col>
      <Col span={8}>
        <Statistic
          title={t('components.stats.simpleSuccess')}
          value={successRatePercent}
          precision={1}
          suffix="%"
          loading={loading}
          valueStyle={{
            color: successRateColor,
          }}
        />
      </Col>
      <Col span={8}>
        <Statistic
          title={t('components.stats.simpleAvg')}
          value={(stats.avg_duration / 1_000_000_000).toFixed(2)}
          suffix="s"
          loading={loading}
        />
      </Col>
    </Row>
  );
});

export default StatsCard;
