import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Empty,
  Radio,
  Select,
  Space,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  ReloadOutlined,
  SwapOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import type {
  AgentTrendOption,
  CompareResponse,
  DimensionKey,
  Granularity,
  TrendPoint,
  TrendResponse,
} from './service';
import {
  compareAgents,
  DIMENSION_LABELS,
  getTrend,
  listAgents,
} from './service';
import { SummaryCards } from './components/SummaryCards';
import { TrendChart } from './components/TrendChart';
import { MilestoneModal } from './components/MilestoneModal';
import { DailyExecutionDrawer } from './components/DailyExecutionDrawer';

const { Title, Text } = Typography;

const RANGE_OPTIONS = [
  { value: '7d', label: '7 天' },
  { value: '30d', label: '30 天' },
  { value: '90d', label: '90 天' },
];

const GRANULARITY_OPTIONS: Array<{ value: Granularity; label: string }> = [
  { value: 'day', label: '日' },
  { value: 'week', label: '周' },
  { value: 'month', label: '月' },
];

// 对比模式下的颜色池
const COMPARE_COLORS = ['#1890ff', '#52c41a', '#722ed1', '#fa8c16', '#eb2f96', '#13c2c2'];

export default function QualityTrendsPage() {
  const [agents, setAgents] = useState<AgentTrendOption[]>([]);
  const [agentId, setAgentId] = useState<string | undefined>();
  const [range, setRange] = useState('30d');
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [dimension, setDimension] = useState<DimensionKey>('composite_score');

  const [trend, setTrend] = useState<TrendResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // 对比模式
  const [compareMode, setCompareMode] = useState(false);
  const [compareAgentIds, setCompareAgentIds] = useState<string[]>([]);
  const [compareData, setCompareData] = useState<CompareResponse | null>(null);

  // 弹窗状态
  const [milestoneModalOpen, setMilestoneModalOpen] = useState(false);
  const [drawerPoint, setDrawerPoint] = useState<TrendPoint | null>(null);

  const fetchAgents = useCallback(async () => {
    try {
      const list = await listAgents();
      setAgents(list || []);
      if (list && list.length > 0 && !agentId) {
        setAgentId(list[0].agent_id);
      }
    } catch {
      // handled by interceptor
    }
  }, [agentId]);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const fetchTrend = useCallback(async () => {
    if (compareMode) {
      if (compareAgentIds.length === 0) {
        setCompareData(null);
        return;
      }
      setLoading(true);
      try {
        const data = await compareAgents({
          agent_ids: compareAgentIds.join(','),
          range,
          granularity,
        });
        setCompareData(data);
      } catch {
        setCompareData(null);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (!agentId) return;
    setLoading(true);
    try {
      const data = await getTrend({
        agent_id: agentId,
        range,
        granularity,
      });
      setTrend(data);
    } catch {
      setTrend(null);
    } finally {
      setLoading(false);
    }
  }, [agentId, range, granularity, compareMode, compareAgentIds]);

  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  const comparisonSeries = useMemo(() => {
    if (!compareMode || !compareData) return undefined;
    return Object.entries(compareData.agents).map(([id, t], idx) => ({
      agentId: id,
      agentName: t.agent_name || id.slice(0, 8),
      points: t.points || [],
      color: COMPARE_COLORS[idx % COMPARE_COLORS.length],
    }));
  }, [compareMode, compareData]);

  const hasData = compareMode
    ? comparisonSeries && comparisonSeries.length > 0
    : trend && trend.points && trend.points.length > 0;

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={4} style={{ margin: 0 }}>
          项目质量趋势
          <Text type="secondary" style={{ fontSize: 13, marginLeft: 12, fontWeight: 'normal' }}>
            合成分 = 功能×0.30 + 质量×0.25 + 稳定×0.25 + 推理×0.10 + 效率×0.10
          </Text>
        </Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchTrend} loading={loading}>
            刷新
          </Button>
          {!compareMode && agentId && (
            <Button icon={<PlusOutlined />} onClick={() => setMilestoneModalOpen(true)}>
              添加里程碑
            </Button>
          )}
          <Button
            icon={<SwapOutlined />}
            type={compareMode ? 'primary' : 'default'}
            onClick={() => {
              setCompareMode(!compareMode);
              if (!compareMode && agentId) {
                setCompareAgentIds([agentId]);
              }
            }}
          >
            {compareMode ? '退出对比' : '对比模式'}
          </Button>
        </Space>
      </div>

      {/* 顶部控制栏 */}
      <Card bordered={false} style={{ marginBottom: 16 }}>
        <Space wrap size={[16, 12]}>
          {compareMode ? (
            <div>
              <Text type="secondary" style={{ marginRight: 8 }}>对比 Agent：</Text>
              <Select
                mode="multiple"
                style={{ minWidth: 320 }}
                placeholder="选择多个 Agent"
                value={compareAgentIds}
                onChange={setCompareAgentIds}
                maxTagCount={3}
                options={agents.map((a) => ({
                  value: a.agent_id,
                  label: `${a.agent_name || a.agent_id.slice(0, 8)} (${a.execution_count}次)`,
                }))}
              />
            </div>
          ) : (
            <div>
              <Text type="secondary" style={{ marginRight: 8 }}>Agent：</Text>
              <Select
                style={{ minWidth: 240 }}
                value={agentId}
                onChange={setAgentId}
                showSearch
                optionFilterProp="label"
                options={agents.map((a) => ({
                  value: a.agent_id,
                  label: `${a.agent_name || a.agent_id.slice(0, 8)}`,
                }))}
              />
            </div>
          )}

          <div>
            <Text type="secondary" style={{ marginRight: 8 }}>时间范围：</Text>
            <Radio.Group value={range} onChange={(e) => setRange(e.target.value)} optionType="button">
              {RANGE_OPTIONS.map((o) => <Radio.Button key={o.value} value={o.value}>{o.label}</Radio.Button>)}
            </Radio.Group>
          </div>

          <div>
            <Text type="secondary" style={{ marginRight: 8 }}>粒度：</Text>
            <Radio.Group value={granularity} onChange={(e) => setGranularity(e.target.value)} optionType="button">
              {GRANULARITY_OPTIONS.map((o) => <Radio.Button key={o.value} value={o.value}>{o.label}</Radio.Button>)}
            </Radio.Group>
          </div>
        </Space>
      </Card>

      {/* 汇总卡片（仅单 Agent 模式） */}
      {!compareMode && trend && trend.summary && (
        <div style={{ marginBottom: 16 }}>
          <SummaryCards summary={trend.summary} loading={loading} />
        </div>
      )}

      {/* 趋势图 */}
      <Card
        bordered={false}
        title={
          <Space>
            <span>
              {compareMode ? '多 Agent 对比' : trend?.agent_name || 'Agent 趋势'}
            </span>
            {!compareMode && trend?.summary && (
              <Tooltip title={`最佳：${trend.summary.best_score.toFixed(3)} (${dayjs(trend.summary.best_date).format('MM-DD')}) · 最差：${trend.summary.worst_score.toFixed(3)} (${dayjs(trend.summary.worst_date).format('MM-DD')})`}>
                <Tag color={
                  trend.summary.trend_direction === 'improving' ? 'green' :
                  trend.summary.trend_direction === 'declining' ? 'red' : 'default'
                }>
                  {trend.summary.trend_direction === 'improving' ? '上升中' :
                   trend.summary.trend_direction === 'declining' ? '下降中' : '稳定'}
                </Tag>
              </Tooltip>
            )}
          </Space>
        }
      >
        {!hasData ? (
          <Empty description="暂无数据" />
        ) : (
          <>
            {/* 维度切换（仅单 Agent 模式） */}
            {!compareMode && (
              <Tabs
                activeKey={dimension}
                onChange={(key) => setDimension(key as DimensionKey)}
                items={(Object.keys(DIMENSION_LABELS) as DimensionKey[]).map((key) => ({
                  key,
                  label: DIMENSION_LABELS[key].label,
                }))}
              />
            )}

            <TrendChart
              points={compareMode ? [] : (trend?.points || [])}
              milestones={compareMode ? [] : (trend?.milestones || [])}
              dimension={dimension}
              loading={loading}
              onPointClick={(p) => setDrawerPoint(p)}
              comparisonSeries={comparisonSeries}
            />

            {!compareMode && trend?.summary && trend.summary.anomaly_count > 0 && (
              <Alert
                type="warning"
                showIcon
                style={{ marginTop: 12 }}
                message={`检测到 ${trend.summary.anomaly_count} 个异常天`}
                description="趋势图上的橙色 pin 标记了显著偏离最近 7 天均值的天。点击趋势点可查看详情。"
              />
            )}
          </>
        )}
      </Card>

      <MilestoneModal
        open={milestoneModalOpen}
        scopeType="agent"
        scopeId={agentId}
        onCancel={() => setMilestoneModalOpen(false)}
        onSuccess={() => {
          setMilestoneModalOpen(false);
          fetchTrend();
        }}
      />

      <DailyExecutionDrawer
        open={drawerPoint !== null}
        point={drawerPoint}
        agentId={agentId}
        onClose={() => setDrawerPoint(null)}
      />
    </div>
  );
}
