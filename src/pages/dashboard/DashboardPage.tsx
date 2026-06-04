import { useState, useCallback, useEffect, useMemo } from 'react';
import { Row, Col, Card, Button, Table, Space, Progress, Typography, Avatar, Dropdown, Spin } from 'antd';
import {
  ExperimentOutlined,
  PlayCircleOutlined,
  RobotOutlined,
  CheckCircleOutlined,
  PlusOutlined,
  ThunderboltOutlined,
  ClockCircleOutlined,
  MoreOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ReactECharts from 'echarts-for-react';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';

import { StatCard, PageHeader } from '@/components/common';
import { useEchartsTheme, useIsDark, useThemeTokens, type ThemeTokens } from '@/theme';
import { logger } from '@/utils';
import { pageContainerStyle } from './style';
import { executionService } from '@/services/execution';
import { benchmarkService } from '@/services/benchmark';
import { agentService } from '@/services/agent';
import { costService } from '@/services/cost';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

const dashboardThemeCSS = `
  [data-theme='dark'] .dashboard-page .ant-card-head {
    border-bottom-color: rgba(255, 255, 255, 0.08);
  }

  [data-theme='dark'] .dashboard-page .ant-table,
  [data-theme='dark'] .dashboard-page .ant-table-container,
  [data-theme='dark'] .dashboard-page .ant-table-cell {
    background: transparent !important;
    color: rgba(255, 255, 255, 0.82);
  }

  [data-theme='dark'] .dashboard-page .ant-table-thead > tr > th {
    background: rgba(255, 255, 255, 0.04) !important;
    border-bottom-color: rgba(255, 255, 255, 0.08) !important;
    color: rgba(255, 255, 255, 0.68) !important;
  }

  [data-theme='dark'] .dashboard-page .ant-table-tbody > tr > td {
    border-bottom-color: rgba(255, 255, 255, 0.06) !important;
  }

  [data-theme='dark'] .dashboard-page .ant-table-tbody > tr.ant-table-placeholder:hover > td,
  [data-theme='dark'] .dashboard-page .ant-table-tbody > tr.ant-table-placeholder > td {
    background: transparent !important;
  }

  [data-theme='dark'] .dashboard-page .ant-empty-description {
    color: rgba(255, 255, 255, 0.52);
  }
`;

function createCardStyle(tokens: ThemeTokens, isDark: boolean): React.CSSProperties {
  return {
    borderRadius: 12,
    border: `1px solid ${tokens.border.default}`,
    background: tokens.bg.elevated,
    boxShadow: isDark ? '0 12px 32px rgba(0, 0, 0, 0.28)' : '0 1px 3px rgba(15, 23, 42, 0.08)',
  };
}

function formatSuccessRateValue(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  const percent = value <= 1 ? value * 100 : value;
  return Math.round(percent * 10) / 10;
}

// Status color config
const statusColors: Record<string, string> = {
  running: '#1677ff',
  completed: '#10b981',
  failed: '#ef4444',
  pending: '#d9d9d9',
};

const statusLabelKeys: Record<string, string> = {
  running: 'table.running',
  completed: 'table.completed',
  failed: 'table.failed',
  pending: 'table.pending',
};

// Trend chart component
interface TrendChartProps {
  delay?: number;
  dates: string[];
  executions: number[];
}

interface DashboardTrendPoint {
  date?: string;
  executions?: number;
  execution_count?: number;
  count?: number;
  total_executions?: number;
}

function getTrendExecutionCount(point: DashboardTrendPoint): number {
  const value =
    point.executions ?? point.execution_count ?? point.count ?? point.total_executions ?? 0;
  return Number.isFinite(Number(value)) ? Number(value) : 0;
}

function normalizeLast7DayTrend(
  trend: DashboardTrendPoint[]
): { dates: string[]; executions: number[] } {
  const byDate = new Map<string, number>();

  trend.forEach((point) => {
    if (!point.date || !dayjs(point.date).isValid()) {
      return;
    }
    const key = dayjs(point.date).format('YYYY-MM-DD');
    byDate.set(key, (byDate.get(key) ?? 0) + getTrendExecutionCount(point));
  });

  const days = Array.from({ length: 7 }, (_, index) =>
    dayjs()
      .subtract(6 - index, 'day')
      .format('YYYY-MM-DD')
  );

  return {
    dates: days.map((date) => dayjs(date).format('MM/DD')),
    executions: days.map((date) => byDate.get(date) ?? 0),
  };
}

function TrendChart({ delay = 0, dates, executions }: TrendChartProps) {
  const [visible, setVisible] = useState(false);
  const { t } = useTranslation('dashboard');
  const tokens = useThemeTokens();
  const isDark = useIsDark();
  const echartsTheme = useEchartsTheme();
  const cardStyle = useMemo(() => createCardStyle(tokens, isDark), [isDark, tokens]);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const getOption = () => {
    const lineColor = tokens.brand.primary;
    return {
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? 'rgba(18, 18, 18, 0.96)' : 'rgba(255, 255, 255, 0.96)',
        borderColor: tokens.border.default,
        borderRadius: 8,
        padding: [12, 16],
        textStyle: { color: tokens.text.primary, fontSize: 13 },
        axisPointer: { type: 'line', lineStyle: { color: tokens.border.hover, width: 1 } },
      },
      legend: {
        data: [t('chart.execCount')],
        top: 0, left: 0,
        textStyle: { color: tokens.text.secondary, fontSize: 13 },
        itemGap: 24,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: { lineStyle: { color: tokens.border.default } },
        axisLabel: { color: tokens.text.secondary, fontSize: 12 },
      },
      yAxis: [{
        type: 'value', name: t('chart.execCount'), position: 'left',
        nameTextStyle: { color: tokens.text.secondary },
        axisLine: { show: false }, axisTick: { show: false },
        axisLabel: { color: tokens.text.secondary, fontSize: 12 },
        splitLine: { lineStyle: { color: tokens.border.default, type: 'dashed' } },
      }],
      series: [{
        name: t('chart.execCount'), type: 'line', smooth: true, data: executions,
        itemStyle: { color: lineColor },
        lineStyle: { width: 3, color: lineColor },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: isDark ? 'rgba(102, 126, 234, 0.28)' : 'rgba(102, 126, 234, 0.18)' },
              { offset: 1, color: 'rgba(102, 126, 234, 0)' },
            ],
          },
        },
        symbolSize: 8, symbol: 'circle',
      }],
    };
  };

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ThunderboltOutlined style={{ color: tokens.brand.primary }} />
          <span style={{ fontWeight: 600, color: tokens.text.primary }}>{t('last7Days')}</span>
        </div>
      }
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        ...cardStyle,
      }}
      styles={{ body: { padding: '20px 24px' } }}
      extra={<Button type="text" icon={<ReloadOutlined />} size="small" style={{ color: tokens.text.primary }}>{t('chart.refresh')}</Button>}
    >
      <ReactECharts option={getOption()} theme={echartsTheme} style={{ height: 300 }} />
    </Card>
  );
}

// Quick actions component
interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  delay?: number;
}

function QuickAction({ icon, title, description, onClick, delay = 0 }: QuickActionProps) {
  const [visible, setVisible] = useState(false);
  const tokens = useThemeTokens();
  const isDark = useIsDark();

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const handleClick = useCallback(() => {
    logger.userAction('click_quick_action', { title });
    onClick();
  }, [onClick, title]);

  return (
    <div
      onClick={handleClick}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        padding: 20, borderRadius: 12,
        borderWidth: '1px', borderStyle: 'solid', borderColor: tokens.border.default,
        background: tokens.bg.elevated,
        boxShadow: isDark ? '0 8px 24px rgba(0, 0, 0, 0.22)' : '0 1px 3px rgba(15, 23, 42, 0.08)',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = tokens.border.hover;
        e.currentTarget.style.boxShadow = isDark ? '0 12px 28px rgba(0, 0, 0, 0.34)' : '0 8px 24px rgba(15, 23, 42, 0.1)';
        e.currentTarget.style.transform = 'translateY(-4px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = tokens.border.default;
        e.currentTarget.style.boxShadow = isDark ? '0 8px 24px rgba(0, 0, 0, 0.22)' : '0 1px 3px rgba(15, 23, 42, 0.08)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div style={{ width: 48, height: 48, borderRadius: 12, background: isDark ? 'rgba(102, 126, 234, 0.18)' : 'rgba(102, 126, 234, 0.12)', color: tokens.brand.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, marginBottom: 16 }}>
        {icon}
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 4, color: tokens.text.primary }}>{title}</div>
      <div style={{ fontSize: 13, color: tokens.text.secondary }}>{description}</div>
    </div>
  );
}

// Recent executions table component
interface ExecutionRecord {
  id: string;
  benchmark_id?: string;
  agent_id?: string;
  status: string;
  success?: boolean;
  duration?: number;
  started_at?: string;
  total_steps?: number;
  steps_taken?: number;
}

interface RecentExecutionsProps {
  delay?: number;
  data: ExecutionRecord[];
  loading: boolean;
}

function RecentExecutions({ delay = 0, data, loading }: RecentExecutionsProps) {
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  const { t } = useTranslation('dashboard');
  const tokens = useThemeTokens();
  const isDark = useIsDark();
  const cardStyle = useMemo(() => createCardStyle(tokens, isDark), [isDark, tokens]);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const actionMenuItems: MenuProps['items'] = [
    { key: 'view', label: t('table.viewDetail') },
  ];

  const formatDuration = (ms: number | undefined) => {
    if (!ms) return '-';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(0)}${t('seconds')}`;
    return `${(ms / 60000).toFixed(1)}${t('minutes')}`;
  };

  const columns = [
    {
      title: t('table.benchmark'), dataIndex: 'benchmark_id', key: 'benchmark',
      render: (v: string) => <Text style={{ fontWeight: 500, color: tokens.text.primary }}>{v ? v.slice(0, 12) + '...' : '-'}</Text>,
    },
    {
      title: t('table.agent'), dataIndex: 'agent_id', key: 'agent', width: 140,
      render: (v: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size={24} style={{ background: tokens.bg.tertiary, color: tokens.text.secondary }}>{v ? v.charAt(0).toUpperCase() : '?'}</Avatar>
          <Text style={{ fontSize: 13, color: tokens.text.secondary }}>{v ? v.slice(0, 8) + '...' : '-'}</Text>
        </div>
      ),
    },
    {
      title: t('table.status'), dataIndex: 'status', key: 'status', width: 100,
      render: (status: string) => {
        const color = statusColors[status] || '#d9d9d9';
        const text = statusLabelKeys[status] ? t(statusLabelKeys[status]) : status;
        return (
          <span style={{ padding: '4px 12px', borderRadius: 20, fontSize: 13, fontWeight: 500, border: `1px solid ${color}40`, background: `${color}15`, color }}>
            {text}
          </span>
        );
      },
    },
    {
      title: t('table.progress'), key: 'progress', width: 140,
      render: (_: unknown, record: ExecutionRecord) => {
        const pct = record.total_steps ? Math.round((record.steps_taken || 0) / record.total_steps * 100) : 0;
        return <Progress percent={pct} size="small" strokeColor={statusColors[record.status]} showInfo={false} style={{ maxWidth: 100 }} />;
      },
    },
    {
      title: t('table.duration'), dataIndex: 'duration', key: 'duration', width: 100,
      render: (v: number) => <Text style={{ fontSize: 13, fontFamily: 'SFMono-Regular, Consolas, monospace', color: tokens.text.secondary }}>{formatDuration(v)}</Text>,
    },
    {
      title: t('table.startTime'), dataIndex: 'started_at', key: 'started_at', width: 120,
      render: (v: string) => <Text style={{ fontSize: 13, color: tokens.text.tertiary }}>{v ? dayjs(v).fromNow() : '-'}</Text>,
    },
    {
      title: t('table.action'), key: 'action', width: 80,
      render: (_: unknown, record: ExecutionRecord) => (
        <Dropdown menu={{ items: actionMenuItems, onClick: () => navigate(`/executions/${record.id}`) }} trigger={['click']}>
          <Button type="text" icon={<MoreOutlined />} style={{ color: tokens.text.tertiary }} />
        </Dropdown>
      ),
    },
  ];

  return (
    <Card
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClockCircleOutlined style={{ color: tokens.brand.primary }} />
          <span style={{ fontWeight: 600, color: tokens.text.primary }}>{t('recentExecutions')}</span>
        </div>
      }
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        ...cardStyle,
      }}
      styles={{ body: { padding: '16px 24px 24px' } }}
      extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={() => navigate('/benchmarks/create')}>{t('actions.newTask')}</Button>}
    >
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        pagination={false}
        size="small"
        loading={loading}
        onRow={() => ({
          style: { transition: 'all 0.2s', cursor: 'pointer' },
          onMouseEnter: (e) => { e.currentTarget.style.background = tokens.bg.tertiary; },
          onMouseLeave: (e) => { e.currentTarget.style.background = 'transparent'; },
        })}
      />
    </Card>
  );
}

// Main Dashboard component
export default function DashboardPage() {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation('dashboard');
  const tokens = useThemeTokens();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Stats
  const [totalBenchmarks, setTotalBenchmarks] = useState(0);
  const [runningExecutions, setRunningExecutions] = useState(0);
  const [totalAgents, setTotalAgents] = useState(0);
  const [successRate, setSuccessRate] = useState(0);

  // Trend
  const [trendDates, setTrendDates] = useState<string[]>([]);
  const [trendExecutions, setTrendExecutions] = useState<number[]>([]);

  // Recent executions
  const [recentExecutions, setRecentExecutions] = useState<ExecutionRecord[]>([]);
  const [recentLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [benchRes, summaryRes, agentRes, recentRes] = await Promise.all([
        benchmarkService.list({ page: 1, page_size: 1 } as Record<string, unknown>).catch(() => null),
        executionService.getSummary().catch(() => null),
        agentService.list({ page: 1, page_size: 1 } as Record<string, unknown>).catch(() => null),
        executionService.list({ page: 1, page_size: 5 } as Record<string, unknown>).catch(() => null),
      ]);

      if (benchRes) {
        const d = (benchRes as unknown) as { total?: number };
        setTotalBenchmarks(d?.total ?? 0);
      }
      if (summaryRes) {
        const d = (summaryRes as unknown) as Record<string, unknown>;
        setRunningExecutions((d?.running as number) ?? 0);
        setSuccessRate(formatSuccessRateValue((d?.success_rate as number) ?? 0));
      }
      if (agentRes) {
        const d = (agentRes as unknown) as { total?: number };
        setTotalAgents(d?.total ?? 0);
      }
      if (recentRes) {
        const d = (recentRes as unknown) as { data?: ExecutionRecord[] };
        setRecentExecutions(d?.data ?? []);
      }
    } catch {
      /* keep defaults */
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTrend = useCallback(async () => {
    try {
      const endDate = dayjs().format('YYYY-MM-DD');
      const startDate = dayjs().subtract(6, 'day').format('YYYY-MM-DD');
      const res = await costService.getStatistics({ start_date: startDate, end_date: endDate, period: 'day' } as Record<string, unknown>);
      const d = (res as unknown) as { trend_data?: DashboardTrendPoint[] };
      const trend = d?.trend_data || [];
      const normalizedTrend = normalizeLast7DayTrend(trend);
      setTrendDates(normalizedTrend.dates);
      setTrendExecutions(normalizedTrend.executions);
    } catch {
      /* keep defaults */
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchData(), fetchTrend()]);
    setRefreshing(false);
  }, [fetchData, fetchTrend]);

  useEffect(() => {
    dayjs.locale(i18n.language === 'zh-CN' ? 'zh-cn' : 'en');
  }, [i18n.language]);

  useEffect(() => { refreshAll(); }, [refreshAll]);

  // Quick actions
  const quickActions = [
    { icon: <PlusOutlined />, title: t('actions.createBenchmark'), description: t('actions.createBenchmarkDesc'), onClick: () => navigate('/benchmarks/create') },
    { icon: <PlayCircleOutlined />, title: t('actions.quickRun'), description: t('actions.quickRunDesc'), onClick: () => navigate('/executions') },
    { icon: <RobotOutlined />, title: t('actions.agentManage'), description: t('actions.agentManageDesc'), onClick: () => navigate('/agents') },
    { icon: <ExperimentOutlined />, title: t('actions.viewReport'), description: t('actions.viewReportDesc'), onClick: () => navigate('/benchmarks') },
  ];

  return (
    <div className="dashboard-page" style={pageContainerStyle}>
      <style>{dashboardThemeCSS}</style>
      <PageHeader
        title={t('title')}
        description={t('welcome')}
        extra={<Button onClick={refreshAll} loading={refreshing} icon={<ReloadOutlined />}>{t('refreshData')}</Button>}
      />

      {/* Stats cards */}
      {loading ? <div style={{ textAlign: 'center', padding: 40 }}><Spin size="large" /></div> : (
        <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
          <Col xs={24} sm={12} lg={6}>
            <StatCard title={t('stats.benchmarks')} value={totalBenchmarks} icon={<ExperimentOutlined />} color="#1677ff" delay={100} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard title={t('stats.running')} value={runningExecutions} icon={<PlayCircleOutlined />} color="#10b981" delay={150} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard title={t('stats.agentCount')} value={totalAgents} icon={<RobotOutlined />} color="#f59e0b" delay={200} />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <StatCard title={t('stats.successRate')} value={successRate} suffix="%" icon={<CheckCircleOutlined />} color="#ef4444" delay={250} />
          </Col>
        </Row>
      )}

      {/* Trend chart */}
      <Row gutter={20} style={{ marginBottom: 32 }}>
        <Col span={24}>
          <TrendChart delay={300} dates={trendDates} executions={trendExecutions} />
        </Col>
      </Row>

      {/* Quick actions + recent executions */}
      <Row gutter={20}>
        <Col xs={24} lg={8}>
          <div style={{ marginBottom: 16, fontSize: 16, fontWeight: 600, color: tokens.text.primary }}>{t('quickActions')}</div>
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {quickActions.map((action, index) => (
              <QuickAction key={index} {...action} delay={350 + index * 50} />
            ))}
          </Space>
        </Col>
        <Col xs={24} lg={16}>
          <RecentExecutions delay={550} data={recentExecutions} loading={recentLoading} />
        </Col>
      </Row>
    </div>
  );
}
