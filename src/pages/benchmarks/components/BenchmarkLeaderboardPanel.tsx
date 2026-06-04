import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Empty,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CopyOutlined, ReloadOutlined, TrophyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';

import { agentService } from '@/services/agent';
import { benchmarkService } from '@/services/benchmark';
import type {
  LeaderboardEntry,
  LeaderboardMetric,
  LeaderboardPeriod,
} from '@/types/api/benchmark';
import type { Agent } from '@/types/api/agent';

const { Text } = Typography;

const DEFAULT_METRIC: LeaderboardMetric = 'pass_at_1';
const DEFAULT_PERIOD: LeaderboardPeriod = 'daily';
const DEFAULT_LIMIT = 20;

const METRICS: LeaderboardMetric[] = [
  'pass_at_1',
  'pass_at_5',
  'pass_at_10',
  'avg_score',
  'elo',
  'win_rate',
];

const PERIODS: LeaderboardPeriod[] = ['daily', 'weekly', 'monthly'];
const LIMITS = [20, 50, 100];

interface BenchmarkLeaderboardPanelProps {
  benchmarkId: string;
}

function formatPercent(value?: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '-';
  }
  return `${(value * 100).toFixed(1)}%`;
}

function formatScore(value?: number) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '-';
  }
  return value.toFixed(3);
}

function formatCost(cents?: number) {
  if (typeof cents !== 'number' || !Number.isFinite(cents)) {
    return '-';
  }
  return `$${(cents / 100).toFixed(2)}`;
}

function agentDisplayName(agent?: Agent, fallback?: string) {
  return agent?.display_name || agent?.name || fallback || '-';
}

type LeaderboardEntryWire = Partial<LeaderboardEntry> & {
  AgentID?: string;
  BenchmarkID?: string;
  SnapshotID?: string | null;
  Rank?: number;
  AvgScore?: number;
  PassAt1?: number;
  PassAt5?: number;
  PassAt10?: number;
  Elo?: number;
  WinRate?: number;
  TotalRuns?: number;
  RunCostCents?: number;
  UpdatedAt?: string;
};

function finiteNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function normalizeLeaderboardEntry(entry: LeaderboardEntryWire): LeaderboardEntry | null {
  const agentId = entry.agent_id ?? entry.AgentID;
  if (!agentId) {
    return null;
  }

  return {
    agent_id: agentId,
    benchmark_id: entry.benchmark_id ?? entry.BenchmarkID ?? '',
    snapshot_id: entry.snapshot_id ?? entry.SnapshotID ?? null,
    rank: finiteNumber(entry.rank ?? entry.Rank),
    avg_score: finiteNumber(entry.avg_score ?? entry.AvgScore),
    pass_at_1: finiteNumber(entry.pass_at_1 ?? entry.PassAt1),
    pass_at_5: finiteNumber(entry.pass_at_5 ?? entry.PassAt5),
    pass_at_10: finiteNumber(entry.pass_at_10 ?? entry.PassAt10),
    elo: finiteNumber(entry.elo ?? entry.Elo),
    win_rate: finiteNumber(entry.win_rate ?? entry.WinRate),
    total_runs: finiteNumber(entry.total_runs ?? entry.TotalRuns),
    run_cost_cents: finiteNumber(entry.run_cost_cents ?? entry.RunCostCents),
    updated_at: entry.updated_at ?? entry.UpdatedAt ?? '',
  };
}

export function BenchmarkLeaderboardPanel({ benchmarkId }: BenchmarkLeaderboardPanelProps) {
  const { t } = useTranslation('benchmarks');
  const [metric, setMetric] = useState<LeaderboardMetric>(DEFAULT_METRIC);
  const [period, setPeriod] = useState<LeaderboardPeriod>(DEFAULT_PERIOD);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [agentsById, setAgentsById] = useState<Record<string, Agent>>({});
  const [loading, setLoading] = useState(false);

  const fetchAgents = useCallback(async () => {
    try {
      const response = await agentService.list({ page: 1, page_size: 100 });
      const nextAgentsById: Record<string, Agent> = {};
      for (const agent of response.data ?? []) {
        nextAgentsById[agent.id] = agent;
      }
      setAgentsById(nextAgentsById);
    } catch {
      setAgentsById({});
    }
  }, []);

  const fetchLeaderboard = useCallback(async () => {
    if (!benchmarkId) {
      return;
    }

    setLoading(true);
    try {
      const response = await benchmarkService.getLeaderboard(benchmarkId, {
        metric,
        period,
        limit,
      });
      const normalizedEntries = (response.entries ?? [])
        .map((entry) => normalizeLeaderboardEntry(entry as LeaderboardEntryWire))
        .filter((entry): entry is LeaderboardEntry => entry !== null);
      setEntries(normalizedEntries);
    } catch {
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }, [benchmarkId, limit, metric, period]);

  useEffect(() => {
    void fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    void fetchLeaderboard();
  }, [fetchLeaderboard]);

  const lastUpdated = useMemo(() => {
    const times = entries
      .map((entry) => dayjs(entry.updated_at))
      .filter((time) => time.isValid())
      .sort((a, b) => b.valueOf() - a.valueOf());

    return times[0];
  }, [entries]);

  const columns = useMemo<ColumnsType<LeaderboardEntry>>(() => [
    {
      title: t('detail.leaderboard.columns.rank'),
      dataIndex: 'rank',
      width: 72,
      fixed: 'left',
      render: (rank: number) => (
        <Space size={6}>
          {rank <= 3 && <TrophyOutlined style={{ color: rank === 1 ? '#f59e0b' : '#8c8c8c' }} />}
          <Text strong={rank <= 3}>#{rank}</Text>
        </Space>
      ),
    },
    {
      title: t('detail.leaderboard.columns.agent'),
      dataIndex: 'agent_id',
      width: 220,
      fixed: 'left',
      render: (agentId?: string) => {
        const safeAgentId = agentId ?? '';
        const agent = safeAgentId ? agentsById[safeAgentId] : undefined;
        return (
          <Space direction="vertical" size={0}>
            <Text strong>{agentDisplayName(agent, safeAgentId)}</Text>
            <Space size={4}>
              <Text code style={{ fontSize: 11 }}>{safeAgentId ? safeAgentId.slice(0, 12) : '-'}</Text>
              <Tooltip title={t('detail.leaderboard.copyAgentId')}>
                <Button
                  type="text"
                  size="small"
                  icon={<CopyOutlined />}
                  disabled={!safeAgentId}
                  onClick={() => {
                    if (!safeAgentId) {
                      return;
                    }
                    void navigator.clipboard.writeText(safeAgentId);
                    message.success(t('detail.leaderboard.copySuccess'));
                  }}
                />
              </Tooltip>
            </Space>
          </Space>
        );
      },
    },
    {
      title: t('detail.leaderboard.columns.passAt1'),
      dataIndex: 'pass_at_1',
      width: 110,
      align: 'right',
      render: formatPercent,
    },
    {
      title: t('detail.leaderboard.columns.passAt5'),
      dataIndex: 'pass_at_5',
      width: 110,
      align: 'right',
      render: formatPercent,
    },
    {
      title: t('detail.leaderboard.columns.passAt10'),
      dataIndex: 'pass_at_10',
      width: 110,
      align: 'right',
      render: formatPercent,
    },
    {
      title: t('detail.leaderboard.columns.avgScore'),
      dataIndex: 'avg_score',
      width: 110,
      align: 'right',
      render: formatScore,
    },
    {
      title: t('detail.leaderboard.columns.elo'),
      dataIndex: 'elo',
      width: 100,
      align: 'right',
      render: (value: number) => formatScore(value),
    },
    {
      title: t('detail.leaderboard.columns.winRate'),
      dataIndex: 'win_rate',
      width: 110,
      align: 'right',
      render: formatPercent,
    },
    {
      title: t('detail.leaderboard.columns.totalRuns'),
      dataIndex: 'total_runs',
      width: 110,
      align: 'right',
    },
    {
      title: t('detail.leaderboard.columns.cost'),
      dataIndex: 'run_cost_cents',
      width: 110,
      align: 'right',
      render: formatCost,
    },
    {
      title: t('detail.leaderboard.columns.updatedAt'),
      dataIndex: 'updated_at',
      width: 160,
      render: (value: string) => value ? dayjs(value).format('YYYY-MM-DD HH:mm') : '-',
    },
  ], [agentsById, t]);

  return (
    <Space direction="vertical" size="middle" style={{ width: '100%' }}>
      <Card bordered={false} styles={{ body: { padding: 16 } }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space wrap>
            <Select<LeaderboardMetric>
              value={metric}
              style={{ width: 160 }}
              onChange={setMetric}
              options={METRICS.map((value) => ({
                value,
                label: t(`detail.leaderboard.metrics.${value}`),
              }))}
            />
            <Select<LeaderboardPeriod>
              value={period}
              style={{ width: 140 }}
              onChange={setPeriod}
              options={PERIODS.map((value) => ({
                value,
                label: t(`detail.leaderboard.periods.${value}`),
              }))}
            />
            <Select
              value={limit}
              style={{ width: 120 }}
              onChange={setLimit}
              options={LIMITS.map((value) => ({
                value,
                label: t('detail.leaderboard.limitOption', { limit: value }),
              }))}
            />
          </Space>
          <Button icon={<ReloadOutlined />} loading={loading} onClick={() => void fetchLeaderboard()}>
            {t('detail.leaderboard.refresh')}
          </Button>
        </Space>
      </Card>

      <Card bordered={false} styles={{ body: { padding: 16 } }}>
        <Space wrap size="large">
          <Space direction="vertical" size={0}>
            <Text type="secondary">{t('detail.leaderboard.summary.metric')}</Text>
            <Tag color="blue">{t(`detail.leaderboard.metrics.${metric}`)}</Tag>
          </Space>
          <Space direction="vertical" size={0}>
            <Text type="secondary">{t('detail.leaderboard.summary.period')}</Text>
            <Text strong>{t(`detail.leaderboard.periods.${period}`)}</Text>
          </Space>
          <Space direction="vertical" size={0}>
            <Text type="secondary">{t('detail.leaderboard.summary.rows')}</Text>
            <Text strong>{entries.length}</Text>
          </Space>
          <Space direction="vertical" size={0}>
            <Text type="secondary">{t('detail.leaderboard.summary.lastUpdated')}</Text>
            <Text strong>{lastUpdated ? lastUpdated.format('YYYY-MM-DD HH:mm') : '-'}</Text>
          </Space>
        </Space>
      </Card>

      <Card bordered={false} styles={{ body: { padding: 0 } }}>
        <Table
          rowKey={(record) => `${record.agent_id || 'unknown'}-${record.snapshot_id || 'benchmark'}-${record.rank}`}
          columns={columns}
          dataSource={entries}
          loading={loading}
          scroll={{ x: 1320 }}
          pagination={false}
          locale={{
            emptyText: (
              <Empty
                description={t('detail.leaderboard.emptyTitle')}
              >
                <Text type="secondary">{t('detail.leaderboard.emptyDescription')}</Text>
              </Empty>
            ),
          }}
        />
      </Card>
    </Space>
  );
}

export default BenchmarkLeaderboardPanel;
