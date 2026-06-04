import { useState, useCallback, useEffect, memo } from 'react';
import { Row, Col, Button, Table, Space, Progress, Typography, Avatar, Dropdown, Tabs, Select, Spin } from 'antd';
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
  DollarOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { useTranslation } from 'react-i18next';
import { useUiStore } from '@/stores';
import { StatCardModern, PageHeader } from '@/components/common';
import { logger } from '@/utils';
import { formatCost, formatTokens, costService } from '@/services/cost';
import { executionService } from '@/services/execution';
import { benchmarkService } from '@/services/benchmark';
import { agentService } from '@/services/agent';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

const bentoStyles = `
  .bento-trend-card {
    border-radius: 20px;
    overflow: hidden;
  }
  @media (min-width: 1200px) {
    .bento-trend-card {
      grid-column: span 2 !important;
    }
    .bento-recent-card {
      grid-column: span 1;
    }
    .bento-actions-card {
      grid-column: span 1;
    }
  }
  @media (min-width: 1600px) {
    .bento-trend-card {
      grid-column: span 2 !important;
    }
    .bento-recent-card {
      grid-column: span 1;
    }
    .bento-actions-card {
      grid-column: span 1;
    }
  }
`;

const { Option } = Select;

/**
 * Dashboard V2 页面
 * 使用现代布局设计，接入真实后端数据
 */

interface DashboardData {
  totalBenchmarks: number;
  runningExecutions: number;
  totalAgents: number;
  successRate: number;
  trendDates: string[];
  trendExecutions: number[];
  trendSuccessRate: number[];
  recentExecutions: Array<{
    id: string;
    taskName: string;
    agent: string;
    status: string;
    progress: number;
    duration: string;
    startTime: Date;
  }>;
  loading: boolean;
}

interface CostData {
  totalCost: number;
  totalTokens: number;
  executionCount: number;
  avgCostPerExecution: number;
  dailyCosts: Array<{ date: string; cost: number }>;
  byModel: Array<{ provider: string; model: string; cost: number; percentage: number }>;
}

function useDashboardData(): DashboardData & { refresh: () => Promise<void> } {
  const [data, setData] = useState<DashboardData>({
    totalBenchmarks: 0,
    runningExecutions: 0,
    totalAgents: 0,
    successRate: 0,
    trendDates: [],
    trendExecutions: [],
    trendSuccessRate: [],
    recentExecutions: [],
    loading: true,
  });

  const refresh = useCallback(async () => {
    setData((prev) => ({ ...prev, loading: true }));
    try {
      const [benchRes, summaryRes, agentRes, recentRes, trendRes] = await Promise.all([
        benchmarkService.list({ page: 1, page_size: 1 } as Record<string, unknown>).catch(() => null),
        executionService.getSummary().catch(() => null),
        agentService.list({ page: 1, page_size: 1 } as Record<string, unknown>).catch(() => null),
        executionService.list({ page: 1, page_size: 5 } as Record<string, unknown>).catch(() => null),
        costService.getStatistics({
          start_date: dayjs().subtract(6, 'day').format('YYYY-MM-DD'),
          end_date: dayjs().format('YYYY-MM-DD'),
          period: 'day',
        }).catch(() => null),
      ]);

      const totalBenchmarks = (benchRes as any)?.total ?? 0;
      const runningExecutions = (summaryRes as any)?.running ?? 0;
      const successRate = (summaryRes as any)?.success_rate ?? 0;
      const totalAgents = (agentRes as any)?.total ?? 0;

      const execList = (recentRes as any)?.data ?? [];
      const recentExecutions = execList.map((e: any) => ({
        id: e.id,
        taskName: e.benchmark_name || e.benchmark_id?.slice(0, 8) || '',
        agent: e.agent_name || e.agent_id?.slice(0, 8) || '',
        status: e.status || 'pending',
        progress: e.status === 'completed' ? 100 : e.status === 'running' ? 50 : 0,
        duration: e.duration_ms ? `${(e.duration_ms / 1000).toFixed(0)}s` : '-',
        startTime: e.started_at ? new Date(e.started_at) : new Date(e.created_at),
      }));

      const trendData = (trendRes as any)?.trend_data ?? [];
      const trendDates = trendData.map((t: any) => dayjs(t.date).format('MM/DD'));
      const trendExecutions = trendData.map((t: any) => t.executions ?? t.count ?? 0);
      const trendSuccessRate = trendData.map((t: any) => t.success_rate ?? 0);

      setData({
        totalBenchmarks,
        runningExecutions,
        totalAgents,
        successRate,
        trendDates,
        trendExecutions,
        trendSuccessRate,
        recentExecutions,
        loading: false,
      });
    } catch {
      setData((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { ...data, refresh };
}

function useCostData(timeRange: 'today' | 'month'): { data: CostData | null; loading: boolean } {
  const [costData, setCostData] = useState<CostData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const startDate = timeRange === 'today'
      ? dayjs().startOf('day').format('YYYY-MM-DD')
      : dayjs().subtract(29, 'day').format('YYYY-MM-DD');
    const endDate = dayjs().format('YYYY-MM-DD');

    costService.getStatistics({ start_date: startDate, end_date: endDate, period: 'day' })
      .then((stats) => {
        if (cancelled) return;
        const trendData = stats.trend_data ?? [];
        const byModel = (stats.by_model ?? []).map((m: any) => ({
          provider: m.provider || m.model?.split('/')[0] || '-',
          model: m.model || '-',
          cost: m.total_cost ?? m.cost ?? 0,
          percentage: m.percentage ?? 0,
        }));
        const totalCost = trendData.reduce((sum: number, d: any) => sum + (d.cost ?? d.total_cost ?? 0), 0);
        const executionCount = trendData.reduce((sum: number, d: any) => sum + (d.executions ?? d.count ?? 0), 0);
        const totalTokens = trendData.reduce((sum: number, d: any) => sum + (d.tokens ?? d.total_tokens ?? 0), 0);

        setCostData({
          totalCost,
          totalTokens,
          executionCount,
          avgCostPerExecution: executionCount > 0 ? totalCost / executionCount : 0,
          dailyCosts: trendData.map((d: any) => ({
            date: dayjs(d.date).format(timeRange === 'today' ? 'HH:mm' : 'MM/DD'),
            cost: d.cost ?? d.total_cost ?? 0,
          })),
          byModel,
        });
      })
      .catch(() => { if (!cancelled) setCostData(null); })
      .finally(() => { if (!cancelled) setLoading(false); });

    return () => { cancelled = true; };
  }, [timeRange]);

  return { data: costData, loading };
}

// 状态颜色配置
const statusColors: Record<string, string> = {
  running: '#1677ff',
  completed: '#10b981',
  failed: '#ef4444',
  pending: '#d9d9d9',
};

// 趋势图表组件
interface TrendChartProps {
  delay?: number;
  dates: string[];
  executions: number[];
  successRate: number[];
}

const TrendChart = memo<TrendChartProps>(({ delay = 0, dates, executions, successRate }) => {
  const [visible, setVisible] = useState(false);
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === 'dark';
  const { t } = useTranslation('dashboard');

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const getOption = () => {
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.65)' : '#666666';
    const lineColor = isDark ? 'rgba(255, 255, 255, 0.9)' : '#111111';
    const successColor = '#10b981';

    return {
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderRadius: 8,
        padding: [12, 16],
        textStyle: {
          color: isDark ? '#fff' : '#111',
          fontSize: 13,
        },
      },
      legend: {
        data: [t('chart.execCount'), t('chart.successRate')],
        top: 0,
        left: 0,
        textStyle: {
          color: textColor,
          fontSize: 13,
        },
        itemGap: 24,
      },
      xAxis: {
        type: 'category',
        data: dates,
        axisLine: {
          lineStyle: { color: gridColor },
        },
        axisLabel: {
          color: textColor,
          fontSize: 12,
        },
      },
      yAxis: [
        {
          type: 'value',
          name: t('chart.execCount'),
          position: 'left',
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            color: textColor,
            fontSize: 12,
          },
          splitLine: {
            lineStyle: { color: gridColor, type: 'dashed' },
          },
        },
        {
          type: 'value',
          name: t('chart.successRate') + ' (%)',
          position: 'right',
          max: 100,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: {
            color: textColor,
            fontSize: 12,
            formatter: '{value}%',
          },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: t('chart.execCount'),
          type: 'line',
          smooth: true,
          data: executions,
          itemStyle: { color: lineColor },
          lineStyle: { width: 3, color: lineColor },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: isDark
                ? [
                    { offset: 0, color: 'rgba(255, 255, 255, 0.2)' },
                    { offset: 1, color: 'rgba(255, 255, 255, 0)' },
                  ]
                : [
                    { offset: 0, color: 'rgba(0, 0, 0, 0.1)' },
                    { offset: 1, color: 'rgba(0, 0, 0, 0)' },
                  ],
            },
          },
          symbolSize: 8,
          symbol: 'circle',
        },
        {
          name: t('chart.successRate'),
          type: 'line',
          smooth: true,
          yAxisIndex: 1,
          data: successRate,
          itemStyle: { color: successColor },
          lineStyle: { width: 3, color: successColor },
          symbolSize: 8,
          symbol: 'circle',
        },
      ],
    };
  };

  const cardStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(20px)',
    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    background: isDark ? 'rgba(26, 26, 26, 0.8)' : '#ffffff',
    backdropFilter: isDark ? 'blur(20px)' : 'none',
    WebkitBackdropFilter: isDark ? 'blur(20px)' : 'none',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: isDark ? 16 : 12,
    padding: 24,
    boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
  } as const;

  const titleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 16,
    fontWeight: 600,
    color: isDark ? 'rgba(255, 255, 255, 0.95)' : '#111111',
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={titleStyle}>
          <ThunderboltOutlined style={{ color: '#667eea' }} />
          <span>{t('weekTrend')}</span>
        </div>
        <Button type="text" icon={<ReloadOutlined />} size="small">
          {t('chart.refresh')}
        </Button>
      </div>
      <ReactECharts option={getOption()} style={{ height: 300 }} theme={isDark ? 'dark' : 'light'} />
    </div>
  );
});

TrendChart.displayName = 'TrendChart';

// 快捷操作组件
interface QuickActionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  onClick: () => void;
  delay?: number;
}

const QuickAction = memo<QuickActionProps>(({ icon, title, description, onClick, delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === 'dark';

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const handleClick = useCallback(() => {
    logger.userAction('click_quick_action', { title });
    onClick();
  }, [onClick, title]);

  const cardStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(20px)',
    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    padding: 20,
    borderRadius: isDark ? 16 : 12,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    background: isDark ? 'rgba(26, 26, 26, 0.8)' : '#ffffff',
    backdropFilter: isDark ? 'blur(20px)' : 'none',
    WebkitBackdropFilter: isDark ? 'blur(20px)' : 'none',
    cursor: 'pointer',
    boxShadow: isDark ? '0 4px 16px rgba(0, 0, 0, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
  };

  const iconStyle: React.CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    marginBottom: 16,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 15,
    fontWeight: 600,
    marginBottom: 4,
    color: isDark ? 'rgba(255, 255, 255, 0.95)' : '#111111',
  };

  const descStyle: React.CSSProperties = {
    fontSize: 13,
    color: isDark ? 'rgba(255, 255, 255, 0.45)' : '#999999',
  };

  return (
    <div
      onClick={handleClick}
      style={cardStyle}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = isDark ? 'rgba(102, 126, 234, 0.3)' : 'rgba(102, 126, 234, 0.3)';
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = isDark
          ? '0 8px 24px rgba(102, 126, 234, 0.2)'
          : '0 8px 24px rgba(0, 0, 0, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = String(cardStyle.border || '');
        e.currentTarget.style.transform = visible ? 'translateY(0)' : 'translateY(20px)';
        e.currentTarget.style.boxShadow = isDark
          ? '0 4px 16px rgba(0, 0, 0, 0.3)'
          : '0 1px 3px rgba(0, 0, 0, 0.04)';
      }}
    >
      <div style={iconStyle}>{icon}</div>
      <div style={titleStyle}>{title}</div>
      <div style={descStyle}>{description}</div>
    </div>
  );
});

QuickAction.displayName = 'QuickAction';

// 最近执行表格组件
interface RecentExecutionsProps {
  delay?: number;
  data: DashboardData['recentExecutions'];
  loading?: boolean;
}

const RecentExecutions = memo<RecentExecutionsProps>(({ delay = 0, data: execData, loading: tableLoading }) => {
  const [visible, setVisible] = useState(false);
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === 'dark';
  const { t } = useTranslation('dashboard');

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const actionMenuItems: MenuProps['items'] = [
    { key: 'view', label: t('table.viewDetail') },
    { key: 'logs', label: t('table.viewLogs') },
  ];

  const columns = [
    {
      title: t('table.taskName'),
      dataIndex: 'taskName',
      key: 'taskName',
      render: (text: string) => (
        <Text style={{ fontWeight: 500, color: isDark ? 'rgba(255,255,255,0.95)' : '#000' }}>
          {text}
        </Text>
      ),
    },
    {
      title: 'Agent',
      dataIndex: 'agent',
      key: 'agent',
      width: 140,
      render: (agent: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar
            size={24}
            style={{
              background: isDark ? 'rgba(255,255,255,0.1)' : '#f5f5f5',
              color: isDark ? 'rgba(255,255,255,0.65)' : '#999'
            }}
          >
            {agent.charAt(0)}
          </Avatar>
          <Text style={{ fontSize: 13, color: isDark ? 'rgba(255,255,255,0.65)' : '#666' }}>
            {agent}
          </Text>
        </div>
      ),
    },
    {
      title: t('table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => {
        const config: Record<string, { text: string; color: string }> = {
          running: { text: t('table.running'), color: '#1677ff' },
          completed: { text: t('table.completed'), color: '#10b981' },
          failed: { text: t('table.failed'), color: '#ef4444' },
          pending: { text: t('table.pending'), color: '#9ca3af' },
        };
        const { text, color } = config[status] || config.pending;
        const bgColor = isDark ? `${color}20` : `${color}15`;
        return (
          <span
            style={{
              padding: '4px 12px',
              borderRadius: 20,
              fontSize: 13,
              fontWeight: 500,
              border: `1px solid ${color}40`,
              background: bgColor,
              color,
            }}
          >
            {text}
          </span>
        );
      },
    },
    {
      title: t('table.progress'),
      dataIndex: 'progress',
      key: 'progress',
      width: 140,
      render: (progress: number, record: { status: string }) => (
        <Progress
          percent={progress}
          size="small"
          strokeColor={statusColors[record.status]}
          showInfo={false}
          style={{ maxWidth: 100 }}
        />
      ),
    },
    {
      title: t('table.duration'),
      dataIndex: 'duration',
      key: 'duration',
      width: 100,
      render: (text: string) => (
        <Text style={{ fontSize: 13, fontFamily: 'SFMono-Regular, Consolas, monospace', color: isDark ? 'rgba(255,255,255,0.65)' : '#666' }}>
          {text}
        </Text>
      ),
    },
    {
      title: t('table.startTime'),
      dataIndex: 'startTime',
      key: 'startTime',
      width: 120,
      render: (time: Date) => (
        <Text style={{ fontSize: 13, color: isDark ? 'rgba(255,255,255,0.45)' : '#999' }}>
          {dayjs(time).fromNow()}
        </Text>
      ),
    },
    {
      title: t('table.action'),
      key: 'action',
      width: 80,
      render: () => (
        <Dropdown menu={{ items: actionMenuItems }} trigger={['click']}>
          <Button
            type="text"
            icon={<MoreOutlined />}
            style={{ color: isDark ? 'rgba(255,255,255,0.45)' : '#999' }}
          />
        </Dropdown>
      ),
    },
  ];

  const cardStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(20px)',
    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    background: isDark ? 'rgba(26, 26, 26, 0.8)' : '#ffffff',
    backdropFilter: isDark ? 'blur(20px)' : 'none',
    WebkitBackdropFilter: isDark ? 'blur(20px)' : 'none',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: isDark ? 16 : 12,
    boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
  };

  const titleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 16,
    fontWeight: 600,
    color: isDark ? 'rgba(255, 255, 255, 0.95)' : '#111111',
  };

  return (
    <div style={cardStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={titleStyle}>
          <ClockCircleOutlined style={{ color: '#667eea' }} />
          <span>{t('recentExecutions')}</span>
        </div>
        <Button type="primary" size="small" icon={<PlusOutlined />}>
          {t('actions.newTask')}
        </Button>
      </div>
      <Table
        columns={columns}
        dataSource={execData}
        rowKey="id"
        pagination={false}
        size="small"
        loading={tableLoading}
        onRow={() => ({
          style: {
            transition: 'all 0.2s',
            cursor: 'pointer',
          },
          onMouseEnter: (e) => {
            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#fafafa';
          },
          onMouseLeave: (e) => {
            e.currentTarget.style.background = 'transparent';
          },
        })}
      />
    </div>
  );
});

RecentExecutions.displayName = 'RecentExecutions';

// 成本统计卡片组件
interface CostStatCardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  color: string;
  delay?: number;
}

const CostStatCard = memo<CostStatCardProps>(({ title, value, subtitle, icon, color, delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === 'dark';

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const cardStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(20px)',
    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    padding: 20,
    borderRadius: isDark ? 16 : 12,
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
    background: isDark ? 'rgba(26, 26, 26, 0.8)' : '#ffffff',
    backdropFilter: isDark ? 'blur(20px)' : 'none',
    WebkitBackdropFilter: isDark ? 'blur(20px)' : 'none',
  };

  const iconStyle: React.CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: `${color}20`,
    color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    marginBottom: 12,
  };

  const valueStyle: React.CSSProperties = {
    fontSize: 28,
    fontWeight: 700,
    color: isDark ? 'rgba(255, 255, 255, 0.95)' : '#111111',
    marginBottom: 4,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 13,
    color: isDark ? 'rgba(255, 255, 255, 0.55)' : '#999999',
    marginBottom: 4,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: 12,
    color: isDark ? 'rgba(255, 255, 255, 0.45)' : '#aaaaaa',
  };

  return (
    <div style={cardStyle}>
      <div style={iconStyle}>{icon}</div>
      <div style={titleStyle}>{title}</div>
      <div style={valueStyle}>{value}</div>
      <div style={subtitleStyle}>{subtitle}</div>
    </div>
  );
});

CostStatCard.displayName = 'CostStatCard';

// 成本图表组件
interface CostChartProps {
  data: CostData;
  title: string;
  delay?: number;
}

const CostChart = memo<CostChartProps>(({ data, title, delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === 'dark';
  const { t } = useTranslation('dashboard');

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const getOption = () => {
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5';
    const textColor = isDark ? 'rgba(255, 255, 255, 0.65)' : '#666666';

    return {
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true,
      },
      tooltip: {
        trigger: 'axis',
        backgroundColor: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
        borderRadius: 8,
        padding: [12, 16],
        textStyle: {
          color: isDark ? '#fff' : '#111',
          fontSize: 13,
        },
        formatter: (params: any[]) => {
          const p = params[0];
          return `${p.name}<br/>${t('cost.cost')}: $${p.value}`;
        },
      },
      xAxis: {
        type: 'category',
        data: data.dailyCosts.map((d) => d.date),
        axisLine: {
          lineStyle: { color: gridColor },
        },
        axisLabel: {
          color: textColor,
          fontSize: 12,
        },
      },
      yAxis: {
        type: 'value',
        name: t('cost.costUsd'),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: {
          color: textColor,
          fontSize: 12,
        },
        splitLine: {
          lineStyle: { color: gridColor, type: 'dashed' },
        },
      },
      series: [
        {
          name: t('cost.cost'),
          type: 'line',
          smooth: true,
          data: data.dailyCosts.map((d) => d.cost),
          itemStyle: { color: '#667eea' },
          lineStyle: { width: 3, color: '#667eea' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: isDark
                ? [
                    { offset: 0, color: 'rgba(102, 126, 234, 0.3)' },
                    { offset: 1, color: 'rgba(102, 126, 234, 0)' },
                  ]
                : [
                    { offset: 0, color: 'rgba(102, 126, 234, 0.2)' },
                    { offset: 1, color: 'rgba(102, 126, 234, 0)' },
                  ],
            },
          },
          symbolSize: 6,
        },
      ],
    };
  };

  const cardStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(20px)',
    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    background: isDark ? 'rgba(26, 26, 26, 0.8)' : '#ffffff',
    backdropFilter: isDark ? 'blur(20px)' : 'none',
    WebkitBackdropFilter: isDark ? 'blur(20px)' : 'none',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: isDark ? 16 : 12,
    padding: 24,
    boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
  };

  const titleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 16,
    fontWeight: 600,
    color: isDark ? 'rgba(255, 255, 255, 0.95)' : '#111111',
    marginBottom: 16,
  };

  return (
    <div style={cardStyle}>
      <div style={titleStyle}>
        <DollarOutlined style={{ color: '#667eea' }} />
        <span>{title}</span>
      </div>
      <ReactECharts option={getOption()} style={{ height: 250 }} theme={isDark ? 'dark' : 'light'} />
    </div>
  );
});

CostChart.displayName = 'CostChart';

// 预算进度组件
// 模型成本表格组件
interface ModelCostTableProps {
  data: CostData;
  delay?: number;
}

const ModelCostTable = memo<ModelCostTableProps>(({ data, delay = 0 }) => {
  const [visible, setVisible] = useState(false);
  const theme = useUiStore((s) => s.theme);
  const isDark = theme === 'dark';
  const { t } = useTranslation('dashboard');

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const cardStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(20px)',
    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    background: isDark ? 'rgba(26, 26, 26, 0.8)' : '#ffffff',
    backdropFilter: isDark ? 'blur(20px)' : 'none',
    WebkitBackdropFilter: isDark ? 'blur(20px)' : 'none',
    border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: isDark ? 16 : 12,
    padding: 24,
    boxShadow: isDark ? '0 8px 32px rgba(0, 0, 0, 0.4)' : '0 1px 3px rgba(0, 0, 0, 0.04)',
  };

  const titleStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    fontSize: 16,
    fontWeight: 600,
    color: isDark ? 'rgba(255, 255, 255, 0.95)' : '#111111',
    marginBottom: 20,
  };

  return (
    <div style={cardStyle}>
      <div style={titleStyle}>
        <DollarOutlined style={{ color: '#667eea' }} />
        <span>{t('cost.byModel')}</span>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}` }}>
            <th style={{ padding: '12px', textAlign: 'left', color: isDark ? 'rgba(255, 255, 255, 0.55)' : '#999999', fontSize: 13, fontWeight: 500 }}>Provider</th>
            <th style={{ padding: '12px', textAlign: 'left', color: isDark ? 'rgba(255, 255, 255, 0.55)' : '#999999', fontSize: 13, fontWeight: 500 }}>Model</th>
            <th style={{ padding: '12px', textAlign: 'right', color: isDark ? 'rgba(255, 255, 255, 0.55)' : '#999999', fontSize: 13, fontWeight: 500 }}>Cost</th>
            <th style={{ padding: '12px', textAlign: 'right', color: isDark ? 'rgba(255, 255, 255, 0.55)' : '#999999', fontSize: 13, fontWeight: 500 }}>{t('cost.proportion')}</th>
          </tr>
        </thead>
        <tbody>
          {data.byModel.map((model, index) => (
            <tr key={index} style={{ borderBottom: `1px solid ${isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'}` }}>
              <td style={{ padding: '12px', color: isDark ? 'rgba(255, 255, 255, 0.85)' : '#333333' }}>{model.provider}</td>
              <td style={{ padding: '12px', color: isDark ? 'rgba(255, 255, 255, 0.85)' : '#333333' }}>{model.model}</td>
              <td style={{ padding: '12px', textAlign: 'right', color: isDark ? 'rgba(255, 255, 255, 0.85)' : '#333333', fontWeight: 500 }}>
                {formatCost(model.cost)}
              </td>
              <td style={{ padding: '12px', textAlign: 'right', color: isDark ? 'rgba(255, 255, 255, 0.85)' : '#333333' }}>
                {model.percentage}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

ModelCostTable.displayName = 'ModelCostTable';

// 成本分析 Tab 内容组件
interface CostTabContentProps {
  delay?: number;
}

const CostTabContent = memo<CostTabContentProps>(({ delay = 0 }) => {
  const [timeRange, setTimeRange] = useState<'today' | 'month'>('month');
  const isDark = useUiStore((s) => s.theme) === 'dark';
  const { data: costData, loading: costLoading } = useCostData(timeRange);
  const { t } = useTranslation('dashboard');

  if (costLoading || !costData) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
        <Spin />
      </div>
    );
  }

  const statCards = [
    {
      title: timeRange === 'today' ? t('cost.todayCost') : t('cost.monthCost'),
      value: formatCost(costData.totalCost),
      subtitle: `${t('cost.executions')} ${costData.executionCount}`,
      icon: <DollarOutlined />,
      color: '#667eea',
    },
    {
      title: timeRange === 'today' ? t('cost.todayTokens') : t('cost.monthTokens'),
      value: formatTokens(costData.totalTokens),
      subtitle: `${t('cost.avg')} ${formatTokens(Math.floor(costData.totalTokens / Math.max(costData.executionCount, 1)))}`,
      icon: <ThunderboltOutlined />,
      color: '#10b981',
    },
    {
      title: t('cost.avgCost'),
      value: formatCost(costData.avgCostPerExecution),
      subtitle: `${costData.executionCount} ${t('cost.totalExecs')}`,
      icon: <SettingOutlined />,
      color: '#f59e0b',
    },
    {
      title: t('cost.totalCost'),
      value: formatCost(costData.totalCost),
      subtitle: `${costData.dailyCosts.length} ${t('cost.daysData')}`,
      icon: <DollarOutlined />,
      color: '#10b981',
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 16, fontWeight: 600, color: isDark ? 'rgba(255, 255, 255, 0.95)' : '#111111' }}>
          {t('costAnalysis')}
        </div>
        <Select
          value={timeRange}
          onChange={setTimeRange}
          style={{ width: 100 }}
          size="small"
        >
          <Option value="today">{t('cost.today')}</Option>
          <Option value="month">{t('cost.month')}</Option>
        </Select>
      </div>

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        {statCards.map((card, index) => (
          <Col xs={12} sm={12} lg={6} key={card.title}>
            <CostStatCard {...card} delay={delay + index * 50} />
          </Col>
        ))}
      </Row>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={16}>
          <CostChart
            data={costData}
            title={timeRange === 'today' ? t('cost.todayTrend') : t('cost.monthTrend')}
            delay={delay + 200}
          />
        </Col>
        <Col xs={24} lg={8}>
          <ModelCostTable data={costData} delay={delay + 250} />
        </Col>
      </Row>
    </div>
  );
});

CostTabContent.displayName = 'CostTabContent';

// 主 Dashboard 组件
function DashboardPageV2() {
  const navigate = useNavigate();
  const theme = useUiStore((s) => s.theme);
  const [activeTab, setActiveTab] = useState<'overview' | 'cost'>('overview');
  const dashboardData = useDashboardData();
  const { t } = useTranslation('dashboard');

  const handleRefresh = useCallback(async () => {
    await dashboardData.refresh();
  }, [dashboardData.refresh]);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key as 'overview' | 'cost');
  }, []);

  const statCardsConfig = [
    { title: t('stats.benchmarks'), value: dashboardData.totalBenchmarks, icon: <ExperimentOutlined />, color: '#667eea' },
    { title: t('stats.running'), value: dashboardData.runningExecutions, icon: <PlayCircleOutlined />, color: '#10b981' },
    { title: t('stats.agentCount'), value: dashboardData.totalAgents, icon: <RobotOutlined />, color: '#f59e0b' },
    { title: t('stats.successRate'), value: dashboardData.successRate, suffix: '%', icon: <CheckCircleOutlined />, color: '#ef4444' },
  ];

  const quickActions = [
    { icon: <PlusOutlined />, title: t('actions.createBenchmark'), description: t('actions.createBenchmarkDesc'), onClick: () => navigate('/benchmarks/create') },
    { icon: <PlayCircleOutlined />, title: t('actions.quickRun'), description: t('actions.quickRunDesc'), onClick: () => navigate('/executions') },
    { icon: <RobotOutlined />, title: t('actions.agentManage'), description: t('actions.agentManageDesc'), onClick: () => navigate('/agents') },
    { icon: <ExperimentOutlined />, title: t('actions.viewReport'), description: t('actions.viewReportDesc'), onClick: () => navigate('/benchmarks') },
  ];

  const isDark = theme === 'dark';

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <style>{bentoStyles}</style>
      <PageHeader
        title="Dashboard"
        description={t('welcome')}
        extra={
          <Button onClick={handleRefresh} loading={dashboardData.loading} icon={<ReloadOutlined />}>
            {t('refreshData')}
          </Button>
        }
      />

      <Tabs
        activeKey={activeTab}
        onChange={handleTabChange}
        style={{ marginBottom: 24 }}
        items={[
          {
            key: 'overview',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ThunderboltOutlined />
                {t('overview')}
              </span>
            ),
            children: (
              <>
                <Row gutter={[20, 20]} style={{ marginBottom: 32 }}>
                  {statCardsConfig.map((config, index) => (
                    <Col xs={24} sm={12} lg={6} key={config.title}>
                      <StatCardModern
                        {...config}
                        loading={dashboardData.loading}
                        theme={theme}
                        delay={100 + index * 50}
                      />
                    </Col>
                  ))}
                </Row>

                <Row gutter={20} style={{ marginBottom: 32 }}>
                  <Col span={24}>
                    <TrendChart
                      delay={300}
                      dates={dashboardData.trendDates}
                      executions={dashboardData.trendExecutions}
                      successRate={dashboardData.trendSuccessRate}
                    />
                  </Col>
                </Row>

                <Row gutter={20}>
                  <Col xs={24} lg={8}>
                    <div style={{
                      marginBottom: 16,
                      fontSize: 16,
                      fontWeight: 600,
                      color: isDark ? 'rgba(255, 255, 255, 0.95)' : '#111111'
                    }}>
                      {t('quickActions')}
                    </div>
                    <Space direction="vertical" size={16} style={{ width: '100%' }}>
                      {quickActions.map((action, index) => (
                        <QuickAction key={index} {...action} delay={350 + index * 50} />
                      ))}
                    </Space>
                  </Col>
                  <Col xs={24} lg={16}>
                    <RecentExecutions delay={550} data={dashboardData.recentExecutions} loading={dashboardData.loading} />
                  </Col>
                </Row>
              </>
            ),
          },
          {
            key: 'cost',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <DollarOutlined />
                {t('costAnalysis')}
              </span>
            ),
            children: <CostTabContent delay={100} />,
          },
        ]}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

export default DashboardPageV2;
