/**
 * Benchmark detail page - enhanced
 * Integrates new data visualization components
 */

import { memo, useState, useCallback, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Typography,
  Tag,
  Button,
  Space,
  Table,
  Tabs,
  Avatar,
  Breadcrumb,
  Descriptions,
  Dropdown,
  type MenuProps,
  type TableProps,
  Empty,
  Grid,
} from 'antd';
import {
  HomeOutlined,
  ExperimentOutlined,
  EditOutlined,
  PlayCircleOutlined,
  DeleteOutlined,
  MoreOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  FireOutlined,
  BookOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import dayjs from 'dayjs';

import { useBenchmarkUpdates } from '@/hooks/useWebSocket';

// Import new visualization components
import {
  ExecutionChart,
  HeatmapView,
  MetricsPanel,
} from '@/components/benchmark/DataVisualization';
import { ForkButton } from '@/components/benchmark';
import { BenchmarkLeaderboardPanel } from './components/BenchmarkLeaderboardPanel';
import {
  useThemeTokens,
  useTextStyle,
  useStatCardStyle,
} from '@/theme';
import { isPersistedOrgAdmin } from '@/utils';
import * as styles from './style';
import { benchmarkService } from '@/services/benchmark';
import { agentService } from '@/services/agent';
import type {
  BenchmarkDetail,
  BenchmarkStats,
  BenchmarkStatus,
  ExecutionSummary,
  BenchmarkRunLaunch,
  BenchmarkRunPriority,
  BenchmarkCaseAsset,
  CaseAssetStatus,
  CaseGovernanceDetail,
  BenchmarkCaseDetectionReport,
  BenchmarkCaseDetectionDiff,
  BenchmarkCaseValidationJob,
  CaseValidationPreview,
  BenchmarkCaseValidationSummary,
  BenchmarkCaseValidationCaseReport,
  BenchmarkCaseExecutionEvidence,
  BenchmarkCaseReviewJob,
  BenchmarkCaseReviewReport,
  BenchmarkCaseReviewCaseReport,
  BenchmarkCaseFusionReport,
  BenchmarkCaseFusionCaseReport,
} from '@/types/api/benchmark';
import {
  CASE_ASSET_STATUS_CONFIG, CASE_ASSET_TYPE_CONFIG,
  GOVERNANCE_TRUST_CONFIG, GOVERNANCE_FRESHNESS_CONFIG, GOVERNANCE_CONFIDENCE_CONFIG,
  AUTHORITY_STATUS_CONFIG, LIFECYCLE_ACTION_CONFIG, GOVERNANCE_ACTION_CONFIG,
  QUALITY_GATE_STAGE_CONFIG, QUALITY_DECISION_CONFIG, QUALITY_SEVERITY_CONFIG, STATIC_AUTHORITY_STATUS_CONFIG,
  VALIDATION_JOB_STATUS_CONFIG, VALIDATION_OBSERVED_OUTCOME_CONFIG,
  REVIEW_DECISION_CONFIG, REVIEW_RISK_CONFIG, REVIEW_DRIFT_STATUS_CONFIG,
} from '@/types/api/benchmark';
import type { PaginatedResponse, Agent } from '@/types';
import { Select, message, theme, Drawer, Timeline, Alert, Collapse, Statistic, Row as AntRow, Col as AntCol, Modal, InputNumber, Input } from 'antd';

const { Title, Text } = Typography;

// Truncated text component
function TruncatedText({ text, maxLen = 200 }: { text: string; maxLen?: number }) {
  const { t } = useTranslation('benchmarks');
  const [expanded, setExpanded] = useState(false);
  if (text.length <= maxLen) return <Text style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{text}</Text>;
  return expanded
    ? <><Text style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{text}</Text><Button type="link" size="small" onClick={() => setExpanded(false)}>{t('detail.collapse')}</Button></>
    : <><Text style={{ fontSize: 12, whiteSpace: 'pre-wrap' }}>{text.slice(0, maxLen)}...</Text><Button type="link" size="small" onClick={() => setExpanded(true)}>{t('detail.expand')}</Button></>;
}

// Mock detail data
const mockBenchmarkDetail = {
  id: '1',
  get name() { return i18next.t('benchmarks:sample.name'); },
  get description() { return i18next.t('benchmarks:sample.description'); },
  language: 'python',
  category: 'coding',
  status: 'active',
  totalExecutions: 156,
  successRate: 94.2,
  avgDuration: 185,
  createdAt: '2024-01-15',
  updatedAt: '2024-02-10',
  config: {
    timeout: 300,
    maxRetries: 3,
    parallel: true,
  },
};

// Mock execution data
const mockExecutionData = [
  {
    timestamp: Date.now() - 7 * 24 * 60 * 60 * 1000,
    value: 88,
    agentId: 'gpt4',
    agentName: 'GPT-4 Agent',
    confidence: [85, 91] as [number, number],
  },
  {
    timestamp: Date.now() - 6 * 24 * 60 * 60 * 1000,
    value: 92,
    agentId: 'claude',
    agentName: 'Claude Agent',
    confidence: [89, 95] as [number, number],
  },
  {
    timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
    value: 90,
    agentId: 'gpt4',
    agentName: 'GPT-4 Agent',
    confidence: [87, 93] as [number, number],
  },
  {
    timestamp: Date.now() - 4 * 24 * 60 * 60 * 1000,
    value: 94,
    agentId: 'claude',
    agentName: 'Claude Agent',
    confidence: [91, 97] as [number, number],
  },
  {
    timestamp: Date.now() - 3 * 24 * 60 * 60 * 1000,
    value: 91,
    agentId: 'gemini',
    agentName: 'Gemini Agent',
    confidence: [88, 94] as [number, number],
    isAnomaly: true,
  },
  {
    timestamp: Date.now() - 2 * 24 * 60 * 60 * 1000,
    value: 95,
    agentId: 'gpt4',
    agentName: 'GPT-4 Agent',
    confidence: [92, 98] as [number, number],
  },
  {
    timestamp: Date.now() - 1 * 24 * 60 * 60 * 1000,
    value: 94.2,
    agentId: 'claude',
    agentName: 'Claude Agent',
    confidence: [91, 97] as [number, number],
  },
];

// Mock Agent data
const mockAgents = [
  { id: 'gpt4', name: 'GPT-4 Agent', color: '#1677ff' },
  { id: 'claude', name: 'Claude Agent', color: '#10b981' },
  { id: 'gemini', name: 'Gemini Agent', color: '#f59e0b' },
];

// Mock performance radar data
const mockPerformanceData = [
  {
    agentId: 'gpt4',
    agentName: 'GPT-4 Agent',
    color: '#1677ff',
    metrics: {
      accuracy: 95,
      speed: 88,
      efficiency: 92,
      robustness: 90,
      resource: 85,
      cost: 78,
    },
  },
  {
    agentId: 'claude',
    agentName: 'Claude Agent',
    color: '#10b981',
    metrics: {
      accuracy: 92,
      speed: 90,
      efficiency: 88,
      robustness: 94,
      resource: 80,
      cost: 85,
    },
  },
  {
    agentId: 'gemini',
    agentName: 'Gemini Agent',
    color: '#f59e0b',
    metrics: {
      accuracy: 88,
      speed: 95,
      efficiency: 90,
      robustness: 82,
      resource: 88,
      cost: 90,
    },
  },
];

// Mock heatmap data
const mockHeatmapData = [
  {
    agentId: 'all',
    get agentName() { return i18next.t('benchmarks:detail.fallback.allAgents'); },
    data: [
      { day: 0, hour: 9, value: 12 },
      { day: 0, hour: 10, value: 18 },
      { day: 0, hour: 14, value: 15 },
      { day: 1, hour: 9, value: 10 },
      { day: 1, hour: 11, value: 20 },
      { day: 2, hour: 10, value: 14 },
      { day: 3, hour: 9, value: 16 },
      { day: 3, hour: 15, value: 22 },
      { day: 4, hour: 10, value: 18 },
      { day: 4, hour: 16, value: 12 },
    ],
  },
];

// Mock execution metrics
const mockMetrics = {
  totalExecutions: { current: 156, previous: 142 },
  activeExecutions: 3,
  successRate: { current: 0.942, previous: 0.91 },
  p95Latency: { current: 185000, previous: 195000 },
  p99Latency: { current: 220000, previous: 235000 },
  totalCost: { current: 12.5, previous: 11.8 },
  avgCostPerExecution: 0.08,
  cpuUsage: 45,
  memoryUsage: 62,
  lastUpdated: Date.now(),
};

const mockExecutionHistory = [
  {
    id: '1',
    agent: 'GPT-4 Agent',
    status: 'completed',
    score: 95,
    duration: 178,
    startTime: dayjs().subtract(2, 'hour'),
  },
  {
    id: '2',
    agent: 'Claude Agent',
    status: 'completed',
    score: 92,
    duration: 195,
    startTime: dayjs().subtract(5, 'hour'),
  },
  {
    id: '3',
    agent: 'Gemini Agent',
    status: 'failed',
    score: 45,
    duration: 120,
    startTime: dayjs().subtract(1, 'day'),
  },
  {
    id: '4',
    agent: 'GPT-4 Agent',
    status: 'completed',
    score: 94,
    duration: 182,
    startTime: dayjs().subtract(2, 'day'),
  },
  {
    id: '5',
    agent: 'Claude Agent',
    status: 'completed',
    score: 91,
    duration: 188,
    startTime: dayjs().subtract(3, 'day'),
  },
];

const categoryConfig = {
  coding: { color: '#1677ff', icon: <CodeOutlined />, get text() { return i18next.t('benchmarks:detail.category.coding'); } },
  reasoning: { color: '#10b981', icon: <FireOutlined />, get text() { return i18next.t('benchmarks:detail.category.reasoning'); } },
  knowledge: { color: '#f59e0b', icon: <BookOutlined />, get text() { return i18next.t('benchmarks:detail.category.knowledge'); } },
};

// Status tag component
const StatusTag = memo(function StatusTag({ status }: { status: string }) {
  const { t } = useTranslation('benchmarks');
  const config: Record<string, { color: string; text: string }> = {
    completed: { color: '#10b981', text: t('detail.statusTag.completed') },
    failed: { color: '#ef4444', text: t('detail.statusTag.failed') },
    running: { color: '#1677ff', text: t('detail.statusTag.running') },
    pending: { color: '#9ca3af', text: t('detail.statusTag.pending') },
    queued: { color: '#9ca3af', text: t('detail.statusTag.queued') },
    cancelled: { color: '#8c8c8c', text: t('detail.statusTag.cancelled') },
    timeout: { color: '#faad14', text: t('detail.statusTag.timeout') },
  };
  const { color, text } = config[status] || config.pending;

  return (
    <Tag
      style={{
        margin: 0,
        padding: '4px 12px',
        borderRadius: 20,
        border: `1px solid ${color}30`,
        background: `${color}15`,
        color,
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      {text}
    </Tag>
  );
});

/**
 * Benchmark detail page component
 */
const benchmarkStatusConfig: Record<BenchmarkStatus, { color: string; text: string }> = {
  active: { color: 'success', text: 'Active' },
  draft: { color: 'default', text: 'Draft' },
  archived: { color: 'warning', text: 'Archived' },
  deprecated: { color: 'error', text: 'Deprecated' },
};

const executionAgentColors = ['#1677ff', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];
const DEFAULT_EXECUTION_HISTORY_PAGE_SIZE = 20;
const DEFAULT_BENCHMARK_RUN_PRIORITY: BenchmarkRunPriority = 'p2';
const BENCHMARK_RUN_PRIORITY_OPTIONS: Array<{
  value: BenchmarkRunPriority;
  label: string;
  descriptionKey: string;
}> = [
  { value: 'p0', label: 'P0', descriptionKey: 'detail.runPriority.p0' },
  { value: 'p1', label: 'P1', descriptionKey: 'detail.runPriority.p1' },
  { value: 'p2', label: 'P2', descriptionKey: 'detail.runPriority.p2' },
  { value: 'p3', label: 'P3', descriptionKey: 'detail.runPriority.p3' },
];

type ExecutionChartPoint = {
  timestamp: number;
  value: number;
  agentId: string;
  agentName: string;
};

type ExecutionChartAgent = {
  id: string;
  name: string;
  color: string;
};

type ExecutionHistoryRow = {
  id: string;
  agent: string;
  status: ExecutionSummary['status'];
  resultLabel: string;
  durationMs?: number;
  startTime: dayjs.Dayjs;
};

type ExecutionMetricsView = {
  totalExecutions: { current: number };
  activeExecutions: number;
  successRate: { current: number };
  p95Latency: { current: number };
  p99Latency: { current: number };
  totalCost: { current: number | null };
  avgCostPerExecution: number | null;
  cpuUsage: number;
  memoryUsage: number;
  lastUpdated: number;
};

function clampPercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
}

function formatDurationNs(value?: number) {
  if (!value || value <= 0) {
    return '-';
  }
  if (value < 1_000_000_000) {
    return `${(value / 1_000_000).toFixed(2)}ms`;
  }
  return `${(value / 1_000_000_000).toFixed(2)}s`;
}

function formatDurationMs(value?: number) {
  if (!value || value <= 0) {
    return '-';
  }
  if (value < 1000) {
    return `${Math.round(value)}ms`;
  }
  return `${(value / 1000).toFixed(2)}s`;
}

function getExecutionOutcomeValue(execution: ExecutionSummary) {
  if (execution.result) {
    return execution.result.success ? 100 : 0;
  }
  if (execution.status === 'running') {
    return execution.progress?.percentage ?? 0;
  }
  return 0;
}

function getExecutionResultLabel(execution: ExecutionSummary) {
  if (execution.result) {
    return execution.result.success ? 'pass' : 'fail';
  }
  if (execution.status === 'running') {
    return `${execution.progress?.percentage ?? 0}%`;
  }
  return execution.status;
}

function getExecutionTimestamp(execution: ExecutionSummary) {
  const parsed = dayjs(execution.started_at || execution.created_at);
  return parsed.isValid() ? parsed.valueOf() : Date.now();
}

function buildExecutionAgents(executions: ExecutionSummary[]): ExecutionChartAgent[] {
  const agentMap = new Map<string, ExecutionChartAgent>();
  executions.forEach((execution) => {
    const id = execution.agent_id || execution.agent_name || execution.id;
    if (agentMap.has(id)) {
      return;
    }
    agentMap.set(id, {
      id,
      name: execution.agent_name || execution.agent_id || 'unknown-agent',
      color: executionAgentColors[agentMap.size % executionAgentColors.length],
    });
  });
  return Array.from(agentMap.values());
}

function buildExecutionChartPoints(executions: ExecutionSummary[]): ExecutionChartPoint[] {
  return executions
    .slice()
    .sort((left, right) => getExecutionTimestamp(left) - getExecutionTimestamp(right))
    .map((execution) => ({
      timestamp: getExecutionTimestamp(execution),
      value: getExecutionOutcomeValue(execution),
      agentId: execution.agent_id || execution.agent_name || execution.id,
      agentName: execution.agent_name || execution.agent_id || 'unknown-agent',
    }));
}

function buildExecutionHeatmap(executions: ExecutionSummary[]) {
  const buckets = new Map<string, { day: number; hour: number; value: number }>();
  executions.forEach((execution) => {
    const date = dayjs(getExecutionTimestamp(execution));
    const day = date.day() === 0 ? 6 : date.day() - 1;
    const key = `${day}:${date.hour()}`;
    const current = buckets.get(key);
    if (current) {
      current.value += 1;
      return;
    }
    buckets.set(key, { day, hour: date.hour(), value: 1 });
  });
  return [{
    agentId: 'all',
    agentName: i18next.t('benchmarks:detail.fallback.allAgents'),
    data: Array.from(buckets.values()),
  }];
}

function percentile(values: number[], ratio: number) {
  if (values.length === 0) {
    return 0;
  }
  const sorted = values.slice().sort((left, right) => left - right);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil(sorted.length * ratio) - 1));
  return sorted[index];
}

function buildExecutionMetrics(stats: BenchmarkStats | null, executions: ExecutionSummary[]): ExecutionMetricsView | null {
  if (!stats && executions.length === 0) {
    return null;
  }
  const durations = executions
    .map((execution) => execution.result?.duration_ms ?? execution.duration_ms)
    .filter((value): value is number => typeof value === 'number' && value > 0);
  const knownCosts = executions
    .map((execution) => execution.result?.cost)
    .filter((value): value is number => typeof value === 'number' && Number.isFinite(value) && value > 0);
  const totalCost = knownCosts.length > 0
    ? knownCosts.reduce((sum, value) => sum + value, 0)
    : null;
  const activeExecutions = executions.filter((execution) =>
    execution.status === 'pending' || execution.status === 'queued' || execution.status === 'running'
  ).length;

  return {
    totalExecutions: { current: stats?.total_runs ?? executions.length },
    activeExecutions,
    successRate: { current: clampPercent(stats?.success_rate ?? 0) / 100 },
    p95Latency: { current: percentile(durations, 0.95) },
    p99Latency: { current: percentile(durations, 0.99) },
    totalCost: { current: totalCost },
    avgCostPerExecution: totalCost !== null ? totalCost / knownCosts.length : null,
    cpuUsage: 0,
    memoryUsage: 0,
    lastUpdated: Date.now(),
  };
}

function buildExecutionHistoryRows(executions: ExecutionSummary[]): ExecutionHistoryRow[] {
  return executions.map((execution) => ({
    id: execution.id,
    agent: execution.agent_name || execution.agent_id || 'unknown-agent',
    status: execution.status,
    resultLabel: getExecutionResultLabel(execution),
    durationMs: execution.result?.duration_ms ?? execution.duration_ms,
    startTime: dayjs(execution.started_at || execution.created_at),
  }));
}

function resolveCategoryInfo(category?: string) {
  if (category && category in categoryConfig) {
    return categoryConfig[category as keyof typeof categoryConfig];
  }
  return {
    color: '#1677ff',
    icon: <ExperimentOutlined />,
    text: category || i18next.t('benchmarks:detail.fallback.benchmark'),
  };
}

export default function BenchmarkDetailPage() {
  const { t } = useTranslation('benchmarks');
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [refreshing, setRefreshing] = useState(false);
  const [benchmarkDetail, setBenchmarkDetail] = useState<BenchmarkDetail | null>(null);
  const [benchmarkStats, setBenchmarkStats] = useState<BenchmarkStats | null>(null);
  const [executionHistory, setExecutionHistory] = useState<ExecutionSummary[]>([]);
  const [executionHistoryTotal, setExecutionHistoryTotal] = useState(0);
  const [executionHistoryPage, setExecutionHistoryPage] = useState(1);
  const [executionHistoryPageSize, setExecutionHistoryPageSize] = useState(DEFAULT_EXECUTION_HISTORY_PAGE_SIZE);
  const [executionHistoryLoading, setExecutionHistoryLoading] = useState(false);
  const [benchmarkLoading, setBenchmarkLoading] = useState(false);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [runSubmitting, setRunSubmitting] = useState(false);
  const [runAgentsLoading, setRunAgentsLoading] = useState(false);
  const [runAgents, setRunAgents] = useState<Agent[]>([]);
  const [runAgentID, setRunAgentID] = useState('');
  const [runPriority, setRunPriority] = useState<BenchmarkRunPriority>(DEFAULT_BENCHMARK_RUN_PRIORITY);
  const [lastLaunchReceipt, setLastLaunchReceipt] = useState<BenchmarkRunLaunch | null>(null);

  const legacyMockDataRetained = [
    mockBenchmarkDetail,
    mockExecutionData,
    mockAgents,
    mockPerformanceData,
    mockHeatmapData,
    mockMetrics,
    mockExecutionHistory,
  ];
  void legacyMockDataRetained;
  const fetchBenchmarkDetail = useCallback(async () => {
    if (!id) return;
    setBenchmarkLoading(true);
    try {
      const [detailRes, statsRes] = await Promise.all([
        benchmarkService.get(id),
        benchmarkService.getStats(id),
      ]);
      setBenchmarkDetail(detailRes as unknown as BenchmarkDetail);
      setBenchmarkStats(statsRes as unknown as BenchmarkStats);
    } catch {
      message.error(t('detail.runModal.loadDetailFailed'));
    } finally {
      setBenchmarkLoading(false);
    }
  }, [id]);

  const fetchExecutionHistory = useCallback(async (
    page: number = 1,
    pageSize: number = DEFAULT_EXECUTION_HISTORY_PAGE_SIZE,
  ) => {
    if (!id) return;
    setExecutionHistoryLoading(true);
    try {
      const res = await benchmarkService.getExecutions(id, { page, page_size: pageSize });
      const pageData = res as unknown as PaginatedResponse<ExecutionSummary>;
      setExecutionHistory(pageData.data ?? []);
      setExecutionHistoryTotal(pageData.total ?? 0);
      setExecutionHistoryPage(page);
      setExecutionHistoryPageSize(pageSize);
    } catch {
      message.error(t('detail.runModal.loadExecFailed'));
    } finally {
      setExecutionHistoryLoading(false);
    }
  }, [id]);

  const loadRunAgents = useCallback(async () => {
    setRunAgentsLoading(true);
    try {
      const res = await agentService.list({ page: 1, page_size: 100, order: 'asc' });
      const pageData = res as unknown as PaginatedResponse<Agent>;
      const activeAgents = (pageData.data ?? [])
        .filter((agent) => agent.status === 'active')
        .sort((left, right) => left.name.localeCompare(right.name));
      setRunAgents(activeAgents);
      setRunAgentID((current) => current || activeAgents[0]?.id || '');
    } catch {
      message.error(t('detail.runModal.loadAgentsFailed'));
    } finally {
      setRunAgentsLoading(false);
    }
  }, []);

  const refreshExecutionHistoryAfterLaunch = useCallback(() => {
    void fetchExecutionHistory(1, executionHistoryPageSize);
    window.setTimeout(() => {
      void fetchExecutionHistory(1, executionHistoryPageSize);
    }, 2000);
  }, [executionHistoryPageSize, fetchExecutionHistory]);

  const openRunModal = useCallback(async () => {
    setRunModalOpen(true);
    await loadRunAgents();
  }, [loadRunAgents]);

  const handleSubmitRun = useCallback(async () => {
    if (!id) {
      return;
    }
    if (!runAgentID.trim()) {
      message.warning(t('detail.runModal.selectAgentWarning'));
      return;
    }

    setRunSubmitting(true);
    try {
      const launch = await benchmarkService.run(id, {
        agent_id: runAgentID,
        priority: runPriority,
      });
      setLastLaunchReceipt(launch);
      setRunModalOpen(false);
      message.success(t('detail.runModal.runSubmitted', { taskId: launch.dispatch.task_id }));
      await fetchBenchmarkDetail();
      refreshExecutionHistoryAfterLaunch();
    } finally {
      setRunSubmitting(false);
    }
  }, [fetchBenchmarkDetail, id, refreshExecutionHistoryAfterLaunch, runAgentID, runPriority]);

  useEffect(() => {
    fetchBenchmarkDetail();
    fetchExecutionHistory(1, DEFAULT_EXECUTION_HISTORY_PAGE_SIZE);
  }, [fetchBenchmarkDetail, fetchExecutionHistory]);

  // WebSocket: instant refresh on benchmark update events
  useBenchmarkUpdates(
    id || '',
    () => { fetchBenchmarkDetail(); },
    !!id
  );

  // Cases Tab state
  const [cases, setCases] = useState<BenchmarkCaseAsset[]>([]);
  const [casesTotal, setCasesTotal] = useState(0);
  const [casesPage, setCasesPage] = useState(1);
  const [casesLoading, setCasesLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<CaseAssetStatus | undefined>(undefined);

  const casesPageSize = 20;

  const fetchCases = useCallback(async (page: number) => {
    if (!id) return;
    setCasesLoading(true);
    try {
      const res = await benchmarkService.getCases(id, { page, page_size: casesPageSize });
      const pageData = res as unknown as PaginatedResponse<BenchmarkCaseAsset>;
      setCases(pageData.data ?? []);
      setCasesTotal(pageData.total ?? 0);
      setCasesPage(page);
    } catch {
      message.error(t('detail.cases.loadFailed'));
    } finally {
      setCasesLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCases(1);
  }, [fetchCases]);

  // Lifecycle action state
  const [selectedCaseKeys, setSelectedCaseKeys] = useState<string[]>([]);
  const [lifecycleModalOpen, setLifecycleModalOpen] = useState(false);
  const [lifecycleAction, setLifecycleAction] = useState<'retire' | 'restore' | 'reextract'>('retire');
  const [lifecycleTargets, setLifecycleTargets] = useState<{ keys: string[]; single?: string }>({ keys: [] });
  const [lifecycleReason, setLifecycleReason] = useState('');
  const [lifecycleSubmitting, setLifecycleSubmitting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check org-admin permission (from localStorage auth context)
  useEffect(() => {
    setIsAdmin(isPersistedOrgAdmin());
  }, [fetchBenchmarkDetail, fetchExecutionHistory]);

  const executeLifecycle = useCallback(async () => {
    if (!id) return;
    if ((lifecycleAction === 'retire' || lifecycleAction === 'restore') && !lifecycleReason.trim()) {
      message.error(t('detail.lifecycleModal.enterReason'));
      return;
    }
    setLifecycleSubmitting(true);
    try {
      if (lifecycleAction === 'reextract') {
        await benchmarkService.reextractCases(id, lifecycleReason || undefined);
        message.success(t('detail.lifecycleModal.reExtractDone'));
      } else if (lifecycleTargets.single) {
        if (lifecycleAction === 'retire') {
          await benchmarkService.retireCase(id, lifecycleTargets.single, lifecycleReason);
          message.success(t('detail.lifecycleModal.retired'));
        } else {
          await benchmarkService.restoreCase(id, lifecycleTargets.single, lifecycleReason);
          message.success(t('detail.lifecycleModal.restored'));
        }
      } else {
        if (lifecycleAction === 'retire') {
          await benchmarkService.batchRetireCases(id, lifecycleTargets.keys, lifecycleReason);
          message.success(t('detail.lifecycleModal.batchRetired', { count: lifecycleTargets.keys.length }));
        } else {
          await benchmarkService.batchRestoreCases(id, lifecycleTargets.keys, lifecycleReason);
          message.success(t('detail.lifecycleModal.batchRestored', { count: lifecycleTargets.keys.length }));
        }
      }
      setLifecycleModalOpen(false);
      setLifecycleReason('');
      setSelectedCaseKeys([]);
      fetchCases(1);
    } catch (err: unknown) {
      const resp = (err as { response?: { status?: number; data?: { message?: string } } })?.response;
      const msg = resp?.data?.message || (resp?.status === 409 ? t('detail.lifecycleModal.conflictRetry') : t('detail.lifecycleModal.operationFailed'));
      message.error(msg);
    } finally {
      setLifecycleSubmitting(false);
    }
  }, [id, lifecycleAction, lifecycleTargets, lifecycleReason, fetchCases]);

  const openLifecycleModal = useCallback((action: 'retire' | 'restore' | 'reextract', keys: string[], single?: string) => {
    setLifecycleAction(action);
    setLifecycleTargets({ keys, single });
    setLifecycleReason('');
    setLifecycleModalOpen(true);
  }, []);

  // Case Governance Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedCaseKey, setSelectedCaseKey] = useState<string>('');
  const [caseDetail, setCaseDetail] = useState<CaseGovernanceDetail | null>(null);
  const [caseDetailLoading, setCaseDetailLoading] = useState(false);

  const openCaseDrawer = useCallback(async (caseKey: string) => {
    if (!id) return;
    setSelectedCaseKey(caseKey);
    setDrawerOpen(true);
    setCaseDetailLoading(true);
    try {
      const res = await benchmarkService.getCaseGovernanceDetail(id, caseKey);
      setCaseDetail((res as unknown) as CaseGovernanceDetail);
    } catch {
      message.error(t('governance.detailFailed'));
    } finally {
      setCaseDetailLoading(false);
    }
  }, [id]);

  // Detection state
  const [detectionReports, setDetectionReports] = useState<BenchmarkCaseDetectionReport[]>([]);
  const [detectionTotal, setDetectionTotal] = useState(0);
  const [detectionPage, setDetectionPage] = useState(1);
  const [detectionLoading, setDetectionLoading] = useState(false);
  const [detectionDiff, setDetectionDiff] = useState<BenchmarkCaseDetectionDiff | null>(null);

  const fetchDetections = useCallback(async (caseKey: string, page: number) => {
    if (!id) return;
    setDetectionLoading(true);
    try {
      const [histRes, diffRes] = await Promise.allSettled([
        benchmarkService.getCaseDetectionHistory(id, caseKey, { page, page_size: 10 }),
        benchmarkService.getLatestDetectionDiff(id),
      ]);
      if (histRes.status === 'fulfilled') {
        const pd = histRes.value as unknown as PaginatedResponse<BenchmarkCaseDetectionReport>;
        setDetectionReports(pd.data ?? []);
        setDetectionTotal(pd.total ?? 0);
        setDetectionPage(page);
      }
      if (diffRes.status === 'fulfilled') {
        setDetectionDiff((diffRes.value as unknown) as BenchmarkCaseDetectionDiff);
      } else {
        setDetectionDiff(null);
      }
    } catch {
      message.error(t('detail.detection.loadFailed'));
    } finally {
      setDetectionLoading(false);
    }
  }, [id]);

  // Validation state
  const [validationJobs, setValidationJobs] = useState<BenchmarkCaseValidationJob[]>([]);
  const [validationTotal, setValidationTotal] = useState(0);
  const [validationPage, setValidationPage] = useState(1);
  const [validationLoading, setValidationLoading] = useState(false);
  const [validationEnabled, setValidationEnabled] = useState(true);
  const [validationDisabledReason, setValidationDisabledReason] = useState('');
  const [triggerModalOpen, setTriggerModalOpen] = useState(false);
  const [triggering, setTriggering] = useState(false);
  const [previewData, setPreviewData] = useState<CaseValidationPreview | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [repeatRuns, setRepeatRuns] = useState(1);
  const validationPollRef = useState<ReturnType<typeof setInterval> | null>(null);

  const fetchValidationJobs = useCallback(async (page: number) => {
    if (!id) return;
    setValidationLoading(true);
    try {
      const res = await benchmarkService.listValidationJobs(id, { page, page_size: 10 });
      const pd = res as unknown as PaginatedResponse<BenchmarkCaseValidationJob>;
      setValidationJobs(pd.data ?? []);
      setValidationTotal(pd.total ?? 0);
      setValidationPage(page);
      // Check whether polling is needed
      const hasRunning = (pd.data ?? []).some(
        (j) => j.status === 'pending' || j.status === 'processing'
      );
      if (hasRunning && !validationPollRef[0]) {
        validationPollRef[1](setInterval(() => fetchValidationJobs(1), 30000));
      } else if (!hasRunning && validationPollRef[0]) {
        clearInterval(validationPollRef[0]);
        validationPollRef[1](null);
      }
    } catch {
      message.error(t('detail.validationSection.loadFailed'));
    } finally {
      setValidationLoading(false);
    }
  }, [id]);

  // Stop polling when drawer closes
  const stopValidationPoll = useCallback(() => {
    if (validationPollRef[0]) {
      clearInterval(validationPollRef[0]);
      validationPollRef[1](null);
    }
  }, []);

  const checkValidationCapabilities = useCallback(async () => {
    if (!id) return;
    try {
      await benchmarkService.getValidationCapabilities(id);
      setValidationEnabled(true);
      setValidationDisabledReason('');
    } catch (err: unknown) {
      const msg = (err as { response?: { status?: number; data?: { message?: string } } })?.response?.data?.message || '';
      setValidationEnabled(false);
      if ((err as { response?: { status?: number } })?.response?.status === 403) {
        setValidationDisabledReason(t('detail.validationSection.disabled'));
      } else if ((err as { response?: { status?: number } })?.response?.status === 503) {
        setValidationDisabledReason(t('detail.validationSection.unavailable'));
      } else if ((err as { response?: { status?: number } })?.response?.status === 501) {
        setValidationDisabledReason(t('detail.validationSection.repoNotConfigured'));
      } else {
        setValidationDisabledReason(msg || t('detail.validationSection.notAvailable'));
      }
    }
  }, [id]);

  const handleTriggerValidation = useCallback(async () => {
    if (!id) return;
    setTriggering(true);
    try {
      const idempotencyKey = `ui-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await benchmarkService.triggerCaseValidation(id, {
        repeat_runs: repeatRuns,
        idempotency_key: idempotencyKey,
        trigger_source: 'manual_ui',
      });
      message.success(t('detail.validationSection.triggered'));
      setTriggerModalOpen(false);
      setPreviewData(null);
      fetchValidationJobs(1);
    } catch (err: unknown) {
      const resp = (err as { response?: { status?: number; data?: { message?: string } } })?.response;
      const msg = resp?.data?.message || t('detail.validationSection.triggerFailed');
      message.error(msg);
    } finally {
      setTriggering(false);
    }
  }, [id, repeatRuns, fetchValidationJobs]);

  const openTriggerModal = useCallback(async () => {
    setTriggerModalOpen(true);
    setPreviewLoading(true);
    try {
      const res = await benchmarkService.previewValidation(id!);
      setPreviewData((res as unknown) as CaseValidationPreview);
    } catch {
      setPreviewData(null);
    } finally {
      setPreviewLoading(false);
    }
  }, [id]);

  // Validation Report Modal state
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportJobId, setReportJobId] = useState('');
  const [reportSummary, setReportSummary] = useState<BenchmarkCaseValidationSummary | null>(null);
  const [reportLoading, setReportLoading] = useState(false);
  const [caseReports, setCaseReports] = useState<BenchmarkCaseValidationCaseReport[]>([]);
  const [caseReportsTotal, setCaseReportsTotal] = useState(0);
  const [caseReportsPage, setCaseReportsPage] = useState(1);
  const [caseReportsLoading, setCaseReportsLoading] = useState(false);
  const [outcomeFilter, setOutcomeFilter] = useState<string | undefined>(undefined);
  const [evidenceMap, setEvidenceMap] = useState<Record<string, BenchmarkCaseExecutionEvidence[]>>({});
  const [evidenceLoadingMap, setEvidenceLoadingMap] = useState<Record<string, boolean>>({});

  const openReportModal = useCallback(async (job: BenchmarkCaseValidationJob) => {
    if (!id || job.status !== 'completed') return;
    setReportJobId(job.id);
    setReportModalOpen(true);
    setReportLoading(true);
    setCaseReports([]);
    setReportSummary(null);
    setEvidenceMap({});
    try {
      const [sumRes, crRes] = await Promise.allSettled([
        benchmarkService.getLatestValidationSummary(id),
        benchmarkService.listValidationCaseReports(id, { page: 1, page_size: 20, job_id: job.id }),
      ]);
      if (sumRes.status === 'fulfilled') setReportSummary((sumRes.value as unknown) as BenchmarkCaseValidationSummary);
      if (crRes.status === 'fulfilled') {
        const pd = (crRes.value as unknown) as PaginatedResponse<BenchmarkCaseValidationCaseReport>;
        setCaseReports(pd.data ?? []);
        setCaseReportsTotal(pd.total ?? 0);
        setCaseReportsPage(1);
      }
    } catch {
      message.error(t('detail.validationReport.loadFailed'));
    } finally {
      setReportLoading(false);
    }
  }, [id]);

  const fetchCaseReports = useCallback(async (page: number, jobId: string, outcome?: string) => {
    if (!id) return;
    setCaseReportsLoading(true);
    try {
      const params: Record<string, unknown> = { page, page_size: 20, job_id: jobId };
      if (outcome) params.outcome = outcome;
      const res = await benchmarkService.listValidationCaseReports(id, params as Parameters<typeof benchmarkService.listValidationCaseReports>[1]);
      const pd = res as unknown as PaginatedResponse<BenchmarkCaseValidationCaseReport>;
      setCaseReports(pd.data ?? []);
      setCaseReportsTotal(pd.total ?? 0);
      setCaseReportsPage(page);
    } catch {
      message.error(t('detail.validationReport.loadCaseFailed'));
    } finally {
      setCaseReportsLoading(false);
    }
  }, [id]);

  const fetchEvidence = useCallback(async (caseKey: string) => {
    if (!id || evidenceLoadingMap[caseKey]) return;
    setEvidenceLoadingMap((prev) => ({ ...prev, [caseKey]: true }));
    try {
      const res = await benchmarkService.listValidationEvidence(id, caseKey, { job_id: reportJobId, page_size: 50 });
      const pd = res as unknown as PaginatedResponse<BenchmarkCaseExecutionEvidence>;
      setEvidenceMap((prev) => ({ ...prev, [caseKey]: pd.data ?? [] }));
    } catch {
      setEvidenceMap((prev) => ({ ...prev, [caseKey]: [] }));
    } finally {
      setEvidenceLoadingMap((prev) => ({ ...prev, [caseKey]: false }));
    }
  }, [id, reportJobId, evidenceLoadingMap]);

  // Review state
  const [reviewJobs, setReviewJobs] = useState<BenchmarkCaseReviewJob[]>([]);
  const [reviewTotal, setReviewTotal] = useState(0);
  const [reviewPage, setReviewPage] = useState(1);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewTriggerOpen, setReviewTriggerOpen] = useState(false);
  const [reviewTriggering, setReviewTriggering] = useState(false);
  const [reviewModel, setReviewModel] = useState('');
  const reviewPollRef = useState<ReturnType<typeof setInterval> | null>(null);

  // Review Report Modal
  const [reviewReportOpen, setReviewReportOpen] = useState(false);
  const [reviewReportJobId, setReviewReportJobId] = useState('');
  const [reviewReport, setReviewReport] = useState<BenchmarkCaseReviewReport | null>(null);
  const [reviewReportLoading, setReviewReportLoading] = useState(false);
  const [reviewCaseReports, setReviewCaseReports] = useState<BenchmarkCaseReviewCaseReport[]>([]);
  const [reviewCaseTotal, setReviewCaseTotal] = useState(0);
  const [reviewCasePage, setReviewCasePage] = useState(1);
  const [reviewCaseLoading, setReviewCaseLoading] = useState(false);
  const [reviewDecisionFilter, setReviewDecisionFilter] = useState<string | undefined>(undefined);
  const [reviewDriftFilter, setReviewDriftFilter] = useState<string | undefined>(undefined);

  const fetchReviewJobs = useCallback(async (page: number) => {
    if (!id) return;
    setReviewLoading(true);
    try {
      const res = await benchmarkService.listReviewJobs(id, { page, page_size: 10 });
      const pd = res as unknown as PaginatedResponse<BenchmarkCaseReviewJob>;
      setReviewJobs(pd.data ?? []);
      setReviewTotal(pd.total ?? 0);
      setReviewPage(page);
      const hasRunning = (pd.data ?? []).some((j) => j.status === 'pending' || j.status === 'processing');
      if (hasRunning && !reviewPollRef[0]) {
        reviewPollRef[1](setInterval(() => fetchReviewJobs(1), 30000));
      } else if (!hasRunning && reviewPollRef[0]) {
        clearInterval(reviewPollRef[0]);
        reviewPollRef[1](null);
      }
    } catch {
      message.error(t('detail.reviewSection.loadFailed'));
    } finally {
      setReviewLoading(false);
    }
  }, [id]);

  const stopReviewPoll = useCallback(() => {
    if (reviewPollRef[0]) { clearInterval(reviewPollRef[0]); reviewPollRef[1](null); }
  }, []);

  const handleTriggerReview = useCallback(async () => {
    if (!id) return;
    setReviewTriggering(true);
    try {
      const idemKey = `ui-review-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      await benchmarkService.triggerCaseReview(id, {
        model: reviewModel || undefined,
        idempotency_key: idemKey,
        trigger_source: 'manual_ui',
      });
      message.success(t('detail.reviewSection.triggered'));
      setReviewTriggerOpen(false);
      setReviewModel('');
      fetchReviewJobs(1);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || t('detail.reviewSection.triggerFailed');
      message.error(msg);
    } finally {
      setReviewTriggering(false);
    }
  }, [id, reviewModel, fetchReviewJobs]);

  const openReviewReport = useCallback(async (job: BenchmarkCaseReviewJob) => {
    if (!id || job.status !== 'completed') return;
    setReviewReportJobId(job.id);
    setReviewReportOpen(true);
    setReviewReportLoading(true);
    setReviewCaseReports([]);
    setReviewReport(null);
    setReviewDecisionFilter(undefined);
    setReviewDriftFilter(undefined);
    try {
      const [rRes, crRes] = await Promise.allSettled([
        benchmarkService.getLatestReviewReport(id),
        benchmarkService.listReviewCaseReports(id, { page: 1, page_size: 20 }),
      ]);
      if (rRes.status === 'fulfilled') setReviewReport((rRes.value as unknown) as BenchmarkCaseReviewReport);
      if (crRes.status === 'fulfilled') {
        const pd = (crRes.value as unknown) as PaginatedResponse<BenchmarkCaseReviewCaseReport>;
        setReviewCaseReports(pd.data ?? []);
        setReviewCaseTotal(pd.total ?? 0);
        setReviewCasePage(1);
      }
    } catch {
      message.error(t('detail.reviewReport.loadFailed'));
    } finally {
      setReviewReportLoading(false);
    }
  }, [id]);

  const fetchReviewCaseReports = useCallback(async (page: number, decision?: string, drift?: string) => {
    if (!id) return;
    setReviewCaseLoading(true);
    try {
      const params: Record<string, unknown> = { page, page_size: 20 };
      if (decision) params.decision = decision;
      if (drift) params.drift_status = drift;
      const res = await benchmarkService.listReviewCaseReports(id, params as Parameters<typeof benchmarkService.listReviewCaseReports>[1]);
      const pd = res as unknown as PaginatedResponse<BenchmarkCaseReviewCaseReport>;
      setReviewCaseReports(pd.data ?? []);
      setReviewCaseTotal(pd.total ?? 0);
      setReviewCasePage(page);
    } catch {
      message.error(t('detail.reviewReport.loadFailed'));
    } finally {
      setReviewCaseLoading(false);
    }
  }, [id]);

  // Fusion state
  const [fusionReport, setFusionReport] = useState<BenchmarkCaseFusionReport | null>(null);
  const [fusionCases, setFusionCases] = useState<BenchmarkCaseFusionCaseReport[]>([]);
  const [fusionTotal, setFusionTotal] = useState(0);
  const [fusionPage, setFusionPage] = useState(1);
  const [fusionLoading, setFusionLoading] = useState(false);
  const [fusionLoaded, setFusionLoaded] = useState(false);
  const [fusionDecisionFilter, setFusionDecisionFilter] = useState<string | undefined>(undefined);
  const [fusionInsufficientFilter, setFusionInsufficientFilter] = useState<string | undefined>(undefined);

  const fetchFusion = useCallback(async (page: number, decision?: string, insufficient?: string) => {
    if (!id) return;
    setFusionLoading(true);
    try {
      const params: Record<string, unknown> = { page, page_size: 20 };
      if (decision) params.decision = decision;
      if (insufficient) params.insufficient_evidence = insufficient;
      const [rRes, crRes] = await Promise.allSettled([
        page === 1 && !fusionLoaded ? benchmarkService.getLatestFusionReport(id) : Promise.resolve(null),
        benchmarkService.listFusionCaseReports(id, params as Parameters<typeof benchmarkService.listFusionCaseReports>[1]),
      ]);
      if (rRes.status === 'fulfilled' && rRes.value) {
        setFusionReport((rRes.value as unknown) as BenchmarkCaseFusionReport);
        setFusionLoaded(true);
      }
      if (crRes.status === 'fulfilled') {
        const pd = (crRes.value as unknown) as PaginatedResponse<BenchmarkCaseFusionCaseReport>;
        setFusionCases(pd.data ?? []);
        setFusionTotal(pd.total ?? 0);
        setFusionPage(page);
      }
    } catch {
      message.error(t('detail.fusion.loadFailed'));
    } finally {
      setFusionLoading(false);
    }
  }, [id, fusionLoaded]);

  // Theme hooks
  const tokens = useThemeTokens();
  const { token: antToken } = theme.useToken();
  const screens = Grid.useBreakpoint();
  const isCompact = !screens.md;
  const shouldStackHeader = !screens.lg;
  const primaryText = useTextStyle('primary');
  const secondaryText = useTextStyle('secondary');
  const statCardStyle = useStatCardStyle();

  const benchmarkName = benchmarkDetail?.display_name || benchmarkDetail?.name || t('detail.fallback.benchmark');
  const benchmarkDescription = benchmarkDetail?.description || t('detail.fallback.noDescription');
  const categoryInfo = resolveCategoryInfo(benchmarkDetail?.category);
  const statusInfo = benchmarkDetail ? benchmarkStatusConfig[benchmarkDetail.status] : null;
  const statusLabel = benchmarkDetail
    ? t(`status.${benchmarkDetail.status}`, {
        defaultValue: benchmarkStatusConfig[benchmarkDetail.status]?.text || benchmarkDetail.status,
      })
    : t('status.unknown');
  const executionAgents = buildExecutionAgents(executionHistory);
  const executionChartData = buildExecutionChartPoints(executionHistory);
  const executionHeatmapData = buildExecutionHeatmap(executionHistory);
  const executionMetrics = buildExecutionMetrics(benchmarkStats, executionHistory);
  const executionRows = buildExecutionHistoryRows(executionHistory);
  const hasExecutionData = executionHistoryTotal > 0;
  const pageContainerStyle: React.CSSProperties = {
    ...styles.PAGE_CONTAINER_STYLE,
    maxWidth: '100%',
    minWidth: 0,
    padding: isCompact ? '16px 12px' : screens.xl ? styles.PAGE_CONTAINER_STYLE.padding : '24px 20px',
  };
  const pageHeaderStyle: React.CSSProperties = {
    ...styles.PAGE_HEADER_STYLE,
    alignItems: 'stretch',
    minWidth: 0,
  };
  const pageHeaderInnerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 16,
    width: '100%',
    minWidth: 0,
    flexWrap: shouldStackHeader ? 'wrap' : 'nowrap',
  };
  const titleBlockStyle: React.CSSProperties = {
    flex: shouldStackHeader ? '1 1 100%' : '1 1 360px',
    minWidth: 0,
    maxWidth: '100%',
  };
  const titleMetaStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
    minWidth: 0,
    flexWrap: 'wrap',
  };
  const pageTitleStyle: React.CSSProperties = {
    ...styles.PAGE_TITLE_STYLE,
    flex: '1 1 280px',
    minWidth: 0,
    maxWidth: '100%',
    lineHeight: 1.25,
    whiteSpace: 'normal',
    wordBreak: 'normal',
    overflowWrap: 'break-word',
  };
  const pageDescriptionStyle: React.CSSProperties = {
    display: 'block',
    maxWidth: 880,
    fontSize: 14,
    lineHeight: 1.6,
    whiteSpace: 'normal',
    overflowWrap: 'break-word',
  };
  const pageActionsStyle: React.CSSProperties = {
    flex: shouldStackHeader ? '1 1 100%' : '0 0 auto',
    maxWidth: '100%',
    minWidth: 0,
    justifyContent: shouldStackHeader ? 'flex-start' : 'flex-end',
  };

  // More actions menu
  const moreMenuItems: MenuProps['items'] = [
    { key: 'edit', label: t('detail.moreMenu.edit'), icon: <EditOutlined /> },
    { key: 'duplicate', label: t('detail.moreMenu.duplicate'), icon: <ExperimentOutlined /> },
    { type: 'divider' },
    { key: 'archive', label: t('detail.moreMenu.archive'), icon: <ClockCircleOutlined /> },
    { key: 'delete', label: t('detail.moreMenu.delete'), icon: <DeleteOutlined />, danger: true },
  ];

  const handleMoreAction: MenuProps['onClick'] = ({ key }) => {
    if (key === 'edit') {
      navigate(`/benchmarks/${id}/edit`);
    }
  };

  const handleRun = useCallback(() => {
    void openRunModal();
  }, [openRunModal]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        fetchBenchmarkDetail(),
        fetchExecutionHistory(executionHistoryPage, executionHistoryPageSize),
      ]);
    } finally {
      setRefreshing(false);
    }
  }, [executionHistoryPage, executionHistoryPageSize, fetchBenchmarkDetail, fetchExecutionHistory]);

  const handleTimeRangeChange = useCallback((start: number, end: number) => {
    console.log('Time range changed:', { start, end });
  }, []);

  const handleDataPointClick = useCallback((day: number, hour: number, agentId: string) => {
    console.log('Data point clicked:', { day, hour, agentId });
  }, []);

  // Execution history table columns
  const executionColumns: TableProps<ExecutionHistoryRow>['columns'] = [
    {
      title: 'Agent',
      dataIndex: 'agent',
      key: 'agent',
      width: 200,
      render: (agent: string) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Avatar size={24} style={{ flex: '0 0 auto', background: '#f5f5f5', color: '#999' }}>
            {agent.charAt(0)}
          </Avatar>
          <Text ellipsis={{ tooltip: agent }} style={{ display: 'block', maxWidth: 150, fontSize: 13 }}>
            {agent}
          </Text>
        </div>
      ),
    },
    {
      title: t('detail.execTable.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: string) => <StatusTag status={status} />,
    },
    {
      title: t('detail.execTable.score'),
      dataIndex: 'resultLabel',
      key: 'resultLabel',
      width: 120,
      render: (resultLabel: string) => (
        <Text style={{ fontWeight: 600, color: '#000' }}>{resultLabel}</Text>
      ),
    },
    {
      title: t('detail.execTable.duration'),
      dataIndex: 'durationMs',
      key: 'durationMs',
      width: 100,
      responsive: ['sm'],
      render: (durationMs?: number) => (
        <Text style={{ fontSize: 13, fontFamily: 'monospace' }}>{formatDurationMs(durationMs)}</Text>
      ),
    },
    {
      title: t('detail.execTable.executionTime'),
      dataIndex: 'startTime',
      key: 'startTime',
      width: 150,
      responsive: ['md'],
      render: (time: dayjs.Dayjs) => (
        <Text type="secondary" style={{ fontSize: 13 }}>
          {time.fromNow()}
        </Text>
      ),
    },
  ];

  const tabItems = [
    {
      key: 'overview',
      label: t('detail.overview'),
      children: (
        <Row gutter={[24, 24]}>
          {/* Realtime metrics panel */}
          <Col span={24}>
            {hasExecutionData && executionMetrics ? (
              <MetricsPanel
                data={executionMetrics}
                loading={refreshing || executionHistoryLoading}
                onRefresh={handleRefresh}
              />
            ) : (
              <Card style={styles.CARD_CONTAINER_STYLE}>
                <Empty description={t('detail.emptyStates.noMetrics')} />
              </Card>
            )}
          </Col>

          {/* Execution trend chart */}
          <Col span={24}>
            {hasExecutionData ? (
              <ExecutionChart
                key={executionAgents.map((agent) => agent.id).join(',') || 'execution-chart'}
                data={executionChartData}
                agents={executionAgents}
                height={350}
                title={t('detail.emptyStates.executionTrendTitle')}
                onTimeRangeChange={handleTimeRangeChange}
              />
            ) : (
              <Card style={styles.CARD_CONTAINER_STYLE}>
                <Empty description={t('detail.emptyStates.noExecutionTrend')} />
              </Card>
            )}
          </Col>

          {/* Performance radar and heatmap */}
          <Col xs={24} lg={12}>
            <Card style={styles.CARD_CONTAINER_STYLE}>
              <Empty description={t('detail.emptyStates.noPerformanceModel')} />
            </Card>
          </Col>

          <Col xs={24} lg={12}>
            {hasExecutionData ? (
              <HeatmapView
                data={executionHeatmapData}
                height={400}
                valueType="count"
                onDataPointClick={handleDataPointClick}
              />
            ) : (
              <Card style={styles.CARD_CONTAINER_STYLE}>
                <Empty description={t('detail.emptyStates.noHeatmap')} />
              </Card>
            )}
          </Col>

          {/* Recent executions */}
          <Col span={24}>
            <Card
              title={<span style={{ fontWeight: 600 }}>{t('detail.recentExecutions')}</span>}
              extra={
                <Button type="link" onClick={() => fetchExecutionHistory(1, executionHistoryPageSize)}>
                  {t('detail.viewAll')}
                </Button>
              }
              style={styles.CARD_CONTAINER_STYLE}
              styles={{ body: { padding: 0 } }}
            >
              <Table
                columns={executionColumns}
                dataSource={executionRows.slice(0, 10)}
                rowKey="id"
                pagination={false}
                loading={executionHistoryLoading}
                size="small"
                tableLayout="fixed"
                scroll={{ x: isCompact ? 520 : 760 }}
              />
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'cases',
      label: t('detail.caseManagement'),
      icon: <FileTextOutlined />,
      children: (
        <Card style={styles.CARD_CONTAINER_STYLE} styles={{ body: { padding: 0 } }}>
          <div style={{ padding: isCompact ? '12px 12px 0' : '16px 16px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Space wrap>
              <Select
                allowClear
                placeholder={t('detail.cases.filterByStatus')}
                style={{ width: isCompact ? 180 : 160 }}
                value={statusFilter}
                onChange={(val) => setStatusFilter(val)}
                options={Object.entries(CASE_ASSET_STATUS_CONFIG).map(([key, cfg]) => ({
                  value: key,
                  label: cfg.label,
                }))}
              />
              {isAdmin && (
                <>
                  <Button size="small" danger disabled={selectedCaseKeys.length === 0} onClick={() => openLifecycleModal('retire', selectedCaseKeys)}>
                    {t('detail.cases.batchRetire', { count: selectedCaseKeys.length })}
                  </Button>
                  <Button size="small" disabled={selectedCaseKeys.length === 0} onClick={() => openLifecycleModal('restore', selectedCaseKeys)}>
                    {t('detail.cases.batchRestore', { count: selectedCaseKeys.length })}
                  </Button>
                  <Button size="small" onClick={() => openLifecycleModal('reextract', [])}>
                    {t('detail.cases.reExtract')}
                  </Button>
                </>
              )}
            </Space>
            <Text type="secondary">{t('detail.cases.totalRows', { total: casesTotal })}</Text>
          </div>
          <Table
            style={{ marginTop: 8 }}
            columns={[
              {
                title: t('detail.cases.caseKey'),
                dataIndex: 'case_key',
                key: 'case_key',
                ellipsis: true,
                render: (text: string) => (
                  <Text
                    style={{ color: antToken.colorPrimary, cursor: 'pointer' }}
                    code
                    onClick={() => openCaseDrawer(text)}
                  >
                    {text}
                  </Text>
                ),
              },
              {
                title: t('detail.cases.caseName'),
                dataIndex: 'case_name',
                key: 'case_name',
                ellipsis: true,
                render: (name: string, record: BenchmarkCaseAsset) => name || record.case_key,
              },
              {
                title: t('detail.cases.type'),
                dataIndex: 'case_type',
                key: 'case_type',
                width: 100,
                render: (type: BenchmarkCaseAsset['case_type']) => {
                  const cfg = CASE_ASSET_TYPE_CONFIG[type];
                  return <Tag color={cfg.color}>{cfg.label}</Tag>;
                },
              },
              {
                title: t('detail.cases.sourcePath'),
                dataIndex: 'source_path',
                key: 'source_path',
                ellipsis: true,
                render: (path: string) => (
                  <Text type="secondary" style={{ fontSize: 12 }}>{path}</Text>
                ),
              },
              {
                title: t('detail.cases.status'),
                dataIndex: 'status',
                key: 'status',
                width: 90,
                render: (status: CaseAssetStatus) => {
                  const cfg = CASE_ASSET_STATUS_CONFIG[status];
                  return <Tag color={cfg.color}>{cfg.label}</Tag>;
                },
              },
              {
                title: t('detail.cases.version'),
                dataIndex: 'current_version',
                key: 'current_version',
                width: 70,
                align: 'center',
              },
              {
                title: t('detail.cases.updateTime'),
                dataIndex: 'updated_at',
                key: 'updated_at',
                width: 160,
                render: (val: string) => dayjs(val).format('YYYY-MM-DD HH:mm'),
              },
              ...(isAdmin ? [{
                title: t('detail.cases.actions'),
                key: 'actions',
                width: 100,
                render: (_: unknown, record: BenchmarkCaseAsset) => (
                  record.status === 'active' || record.status === 'inactive'
                    ? <Button type="link" size="small" danger onClick={() => openLifecycleModal('retire', [record.case_key])}>{t('detail.cases.retire')}</Button>
                    : record.status === 'retired'
                    ? <Button type="link" size="small" onClick={() => openLifecycleModal('restore', [record.case_key])}>{t('detail.cases.restore')}</Button>
                    : null
                ),
              }] : []),
            ]}
            dataSource={
              statusFilter
                ? cases.filter((c) => c.status === statusFilter)
                : cases
            }
            rowKey="id"
            loading={casesLoading}
            tableLayout="fixed"
            scroll={{ x: isAdmin ? 1120 : 980 }}
            rowSelection={isAdmin ? {
              selectedRowKeys: selectedCaseKeys,
              onChange: (keys: React.Key[]) => setSelectedCaseKeys(keys as string[]),
              getCheckboxProps: (record: BenchmarkCaseAsset) => ({ name: record.case_key }),
            } : undefined}
            pagination={{
              current: casesPage,
              pageSize: casesPageSize,
              total: statusFilter
                ? cases.filter((c) => c.status === statusFilter).length
                : casesTotal,
              showTotal: (total) => t('detail.cases.totalRows', { total }),
              onChange: (page) => fetchCases(page),
            }}
          />
        </Card>
      ),
    },
    {
      key: 'analytics',
      label: t('detail.analytics'),
      children: (
        <Row gutter={[24, 24]}>
          <Col span={24}>
            {hasExecutionData ? (
              <ExecutionChart
                key={executionAgents.map((agent) => agent.id).join(',') || 'analytics-chart'}
                data={executionChartData}
                agents={executionAgents}
                height={400}
                title={t('detail.analyticsAgentComparison')}
              />
            ) : (
              <Card style={styles.CARD_CONTAINER_STYLE}>
                <Empty description={t('detail.emptyStates.noAnalytics')} />
              </Card>
            )}
          </Col>
          <Col span={24}>
            <Card style={styles.CARD_CONTAINER_STYLE}>
              <Empty description={t('detail.emptyStates.noPerformanceModel')} />
            </Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'leaderboard',
      label: t('detail.leaderboard.tab'),
      children: id ? (
        <BenchmarkLeaderboardPanel benchmarkId={id} />
      ) : (
        <Card style={styles.CARD_CONTAINER_STYLE}>
          <Empty description={t('detail.leaderboard.emptyTitle')} />
        </Card>
      ),
    },
    {
      key: 'history',
      label: <span data-testid="benchmark-history-tab">{t('detail.executionHistoryTab')}</span>,
      children: (
        <Card data-testid="benchmark-history-table" style={styles.CARD_CONTAINER_STYLE} styles={{ body: { padding: 0 } }}>
          <Table
            columns={executionColumns}
            dataSource={executionRows}
            rowKey="id"
            loading={executionHistoryLoading}
            tableLayout="fixed"
            scroll={{ x: isCompact ? 520 : 760 }}
            pagination={{
              current: executionHistoryPage,
              pageSize: executionHistoryPageSize,
              total: executionHistoryTotal,
              showSizeChanger: true,
              showTotal: (total) => t('detail.tableTotal', { total }),
              onChange: (page, pageSize) => {
                void fetchExecutionHistory(page, pageSize);
              },
            }}
          />
        </Card>
      ),
    },
    {
      key: 'settings',
      label: t('detail.settings'),
      children: (
        <Card style={styles.CARD_CONTAINER_STYLE} loading={benchmarkLoading && !benchmarkDetail}>
          <Descriptions column={isCompact ? 1 : 2} bordered>
            <Descriptions.Item label={t('detail.config2.timeout')}>
              {benchmarkDetail?.config.timeout ?? '-'} {t('detail.config2.timeoutUnit')}
            </Descriptions.Item>
            <Descriptions.Item label={t('detail.config2.maxAttempts')}>
              {benchmarkDetail?.config.max_attempts ?? '-'} {t('detail.config2.attemptsUnit')}
            </Descriptions.Item>
            <Descriptions.Item label={t('detail.config2.testType')}>
              {benchmarkDetail?.test_config.type ?? '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('detail.config2.createdAt')}>
              {benchmarkDetail?.created_at
                ? dayjs(benchmarkDetail.created_at).format('YYYY-MM-DD HH:mm')
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('detail.config2.testCommand')}>
              {benchmarkDetail?.test_config.command || '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('detail.config2.updatedAt')}>
              {benchmarkDetail?.updated_at
                ? dayjs(benchmarkDetail.updated_at).format('YYYY-MM-DD HH:mm')
                : '-'}
            </Descriptions.Item>
            <Descriptions.Item label={t('detail.config2.language')}>
              {benchmarkDetail?.language || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
  ];

  return (
    <div style={pageContainerStyle}>
      {/* Breadcrumb */}
      <Breadcrumb style={{ marginBottom: 24 }} items={[
        { title: <HomeOutlined />, href: '/dashboard' },
        { title: <span>{t('detail.breadcrumbBenchmarks')}</span>, href: '/benchmarks' },
        {
          title: (
            <span
              title={benchmarkName}
              style={{
                display: 'inline-block',
                maxWidth: isCompact ? 160 : 360,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                verticalAlign: 'bottom',
              }}
            >
              {benchmarkName}
            </span>
          ),
        },
      ]} />

      {/* Page title */}
      <div style={pageHeaderStyle}>
        <div style={pageHeaderInnerStyle}>
          <div style={titleBlockStyle}>
            <div style={titleMetaStyle}>
              <Title level={2} style={pageTitleStyle}>
                {benchmarkName}
              </Title>
              <Tag
                icon={categoryInfo.icon}
                style={{
                  margin: 0,
                  padding: '4px 12px',
                  borderRadius: 20,
                  border: `1px solid ${categoryInfo.color}30`,
                  background: `${categoryInfo.color}15`,
                  color: categoryInfo.color,
                }}
              >
                {categoryInfo.text}
              </Tag>
              <Tag
                icon={<CheckCircleOutlined />}
                color={statusInfo?.color || 'default'}
                style={{ margin: 0, borderRadius: 20 }}
              >
                {statusLabel || t('detail.fallback.unknownStatus')}
              </Tag>
            </div>
            <Text type="secondary" style={pageDescriptionStyle}>
              {benchmarkDescription}
            </Text>
          </div>
          <Space wrap style={pageActionsStyle}>
            <Button icon={<EditOutlined />} onClick={() => navigate(`/benchmarks/${id}/edit`)}>
              {t('detail.edit')}
            </Button>
            <ForkButton
              benchmarkId={id!}
              benchmarkName={benchmarkName}
              type="default"
            >
              {t('detail.fork')}
            </ForkButton>
            <Button data-testid="benchmark-run-open" type="primary" icon={<PlayCircleOutlined />} onClick={handleRun}>
              {t('detail.run')}
            </Button>
            <Dropdown menu={{ items: moreMenuItems, onClick: handleMoreAction }}>
              <Button icon={<MoreOutlined />} />
            </Dropdown>
          </Space>
        </div>
      </div>

      {/* Stats overview */}
      {lastLaunchReceipt && (
        <div data-testid="benchmark-run-receipt">
        <Alert
          showIcon
          closable
          type="success"
          style={{ marginBottom: 24 }}
          message={t('detail.runReceipt.title')}
          description={(
            <Space direction="vertical" size={4}>
              <Text>{t('detail.runReceipt.taskId')}: {lastLaunchReceipt.dispatch.task_id}</Text>
              <Text>{t('detail.runReceipt.agentId')}: {lastLaunchReceipt.agent_id}</Text>
              <Text>{t('detail.runReceipt.priority')}: {lastLaunchReceipt.dispatch.priority}</Text>
              <Text>{t('detail.runReceipt.submittedAt')}: {dayjs(lastLaunchReceipt.dispatch.submitted_at).format('YYYY-MM-DD HH:mm:ss')}</Text>
              <Text type="secondary">
                {t('detail.runReceipt.description')}
              </Text>
            </Space>
          )}
          onClose={() => setLastLaunchReceipt(null)}
        />
        </div>
      )}

      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6} style={{ minWidth: 0 }}>
          <div style={statCardStyle}>
            <Text style={{ fontSize: 12, ...secondaryText }}>
              {t('detail.stats.totalRuns')}
            </Text>
            <div style={{ fontSize: 24, fontWeight: 600, ...primaryText }}>
              {benchmarkStats?.total_runs ?? 0}
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6} style={{ minWidth: 0 }}>
          <div style={statCardStyle}>
            <Text style={{ fontSize: 12, ...secondaryText }}>
              {t('detail.stats.successRate')}
            </Text>
            <div style={{ fontSize: 24, fontWeight: 600, color: tokens.status.success }}>
              {Math.max(0, Math.min(100, benchmarkStats?.success_rate ?? 0)).toFixed(1)}%
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6} style={{ minWidth: 0 }}>
          <div style={statCardStyle}>
            <Text style={{ fontSize: 12, ...secondaryText }}>
              {t('detail.stats.avgDuration')}
            </Text>
            <div style={{ fontSize: 24, fontWeight: 600, ...primaryText }}>
              {formatDurationNs(benchmarkStats?.avg_duration)}
            </div>
          </div>
        </Col>
        <Col xs={24} sm={12} lg={6} style={{ minWidth: 0 }}>
          <div style={statCardStyle}>
            <Text style={{ fontSize: 12, ...secondaryText }}>
              {t('detail.stats.language')}
            </Text>
            <div
              style={{
                fontSize: 20,
                fontWeight: 600,
                ...primaryText,
                marginTop: 12,
                textTransform: 'uppercase',
              }}
            >
              {benchmarkDetail?.language || '-'}
            </div>
          </div>
        </Col>
      </Row>

      {/* Tabs */}
      <Tabs defaultActiveKey="overview" items={tabItems} style={{ minWidth: 0 }} />

      {/* Case Governance Detail Drawer */}
      <Drawer
        open={drawerOpen}
        onClose={() => { setDrawerOpen(false); stopValidationPoll(); stopReviewPoll(); }}
        title={
          <Space>
            <Text code>{selectedCaseKey}</Text>
            {caseDetail?.current?.case_name && (
              <Text type="secondary">{caseDetail.current.case_name}</Text>
            )}
            {caseDetail?.current?.status && (
              <Tag color={CASE_ASSET_STATUS_CONFIG[caseDetail.current.status as CaseAssetStatus]?.color}>
                {CASE_ASSET_STATUS_CONFIG[caseDetail.current.status as CaseAssetStatus]?.label}
              </Tag>
            )}
          </Space>
        }
        width={isCompact ? 'calc(100vw - 32px)' : 680}
        loading={caseDetailLoading}
      >
        {caseDetail?.current ? (
          <>
            {/* Governance intelligence */}
            {caseDetail.current.governance_intelligence && (
              <Card size="small" title={t('detail.governanceCard.title')} style={{ marginBottom: 16 }}>
                <Space size="middle" wrap>
                  {(() => {
                    const gi = caseDetail.current!.governance_intelligence!;
                    return (
                      <>
                        {gi.trust_posture && (
                          <span>{t('detail.governanceCard.trustPosture')}: <Tag color={GOVERNANCE_TRUST_CONFIG[gi.trust_posture]?.color}>{GOVERNANCE_TRUST_CONFIG[gi.trust_posture]?.label}</Tag></span>
                        )}
                        {gi.evidence_freshness && (
                          <span>{t('detail.governanceCard.evidenceFreshness')}: <Tag color={GOVERNANCE_FRESHNESS_CONFIG[gi.evidence_freshness]?.color}>{GOVERNANCE_FRESHNESS_CONFIG[gi.evidence_freshness]?.label}</Tag></span>
                        )}
                        {gi.confidence_posture && (
                          <span>{t('detail.governanceCard.confidence')}: <Tag color={GOVERNANCE_CONFIDENCE_CONFIG[gi.confidence_posture]?.color}>{GOVERNANCE_CONFIDENCE_CONFIG[gi.confidence_posture]?.label}</Tag></span>
                        )}
                        {gi.trust_reason && (
                          <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
                            {t('detail.governanceCard.reason')}: {gi.trust_reason}
                          </Text>
                        )}
                      </>
                    );
                  })()}
                </Space>
              </Card>
            )}

            {/* Operator attention */}
            {caseDetail.current.operator_attention_required && (
              <Alert
                type="warning"
                showIcon
                message={t('detail.operatorAttention.title')}
                description={caseDetail.current.operator_attention_reason || caseDetail.current.primary_action_reason}
                style={{ marginBottom: 16 }}
              />
            )}

            {/* Five pillar status */}
            <Card size="small" title={t('detail.summary.title')} style={{ marginBottom: 16 }}>
              <Descriptions column={1} size="small">
                <Descriptions.Item label={t('detail.summary.staticDetection')}>
                  <Space size="small">
                    {caseDetail.current.detection_decision && <Tag>{caseDetail.current.detection_decision}</Tag>}
                    {caseDetail.current.detection_risk_level && <Tag color={caseDetail.current.detection_risk_level === 'high' || caseDetail.current.detection_risk_level === 'critical' ? 'error' : undefined}>{caseDetail.current.detection_risk_level}</Tag>}
                    {caseDetail.current.detection_authority_status && (
                      <Tag color={AUTHORITY_STATUS_CONFIG[caseDetail.current.detection_authority_status as keyof typeof AUTHORITY_STATUS_CONFIG]?.color}>
                        {AUTHORITY_STATUS_CONFIG[caseDetail.current.detection_authority_status as keyof typeof AUTHORITY_STATUS_CONFIG]?.label}
                      </Tag>
                    )}
                    {caseDetail.current.detection_degraded_reason && <Text type="warning" style={{ fontSize: 12 }}>({caseDetail.current.detection_degraded_reason})</Text>}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label={t('detail.summary.dynamicValidation')}>
                  <Space size="small">
                    {caseDetail.current.validation_aggregate_outcome && <Tag>{caseDetail.current.validation_aggregate_outcome}</Tag>}
                    {caseDetail.current.validation_pass_rate !== undefined && <Text>{(caseDetail.current.validation_pass_rate * 100).toFixed(0)}%</Text>}
                    {caseDetail.current.validation_flaky && <Tag color="warning">flaky</Tag>}
                    {caseDetail.current.validation_authority_status && (
                      <Tag color={AUTHORITY_STATUS_CONFIG[caseDetail.current.validation_authority_status as keyof typeof AUTHORITY_STATUS_CONFIG]?.color}>
                        {AUTHORITY_STATUS_CONFIG[caseDetail.current.validation_authority_status as keyof typeof AUTHORITY_STATUS_CONFIG]?.label}
                      </Tag>
                    )}
                    {caseDetail.current.validation_degraded_reason && <Text type="warning" style={{ fontSize: 12 }}>({caseDetail.current.validation_degraded_reason})</Text>}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label={t('detail.summary.enhancedReview')}>
                  <Space size="small">
                    {caseDetail.current.review_decision && <Tag>{caseDetail.current.review_decision}</Tag>}
                    {caseDetail.current.review_risk && <Tag>{caseDetail.current.review_risk}</Tag>}
                    {caseDetail.current.review_low_confidence && <Tag color="warning">{t('detail.summary.lowConfidence')}</Tag>}
                    {caseDetail.current.review_authority_status && (
                      <Tag color={AUTHORITY_STATUS_CONFIG[caseDetail.current.review_authority_status as keyof typeof AUTHORITY_STATUS_CONFIG]?.color}>
                        {AUTHORITY_STATUS_CONFIG[caseDetail.current.review_authority_status as keyof typeof AUTHORITY_STATUS_CONFIG]?.label}
                      </Tag>
                    )}
                    {caseDetail.current.review_degraded_reason && <Text type="warning" style={{ fontSize: 12 }}>({caseDetail.current.review_degraded_reason})</Text>}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label={t('detail.summary.evidenceFusion')}>
                  <Space size="small">
                    {caseDetail.current.fusion_decision && <Tag>{caseDetail.current.fusion_decision}</Tag>}
                    {caseDetail.current.fusion_risk_level && <Tag>{caseDetail.current.fusion_risk_level}</Tag>}
                    {caseDetail.current.fusion_insufficient_evidence && <Tag color="warning">{t('detail.summary.insufficient')}</Tag>}
                  </Space>
                </Descriptions.Item>
                <Descriptions.Item label={t('detail.summary.repairFeedback')}>
                  <Space size="small">
                    <Text>{t('detail.summary.attempts', { count: caseDetail.current.remediation_attempt_count })}</Text>
                    {caseDetail.current.remediation_repair_state && <Tag>{caseDetail.current.remediation_repair_state}</Tag>}
                    {caseDetail.current.remediation_comparison_outcome && <Tag>{caseDetail.current.remediation_comparison_outcome}</Tag>}
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </Card>

            {/* Available actions */}
            {caseDetail.current.available_actions && caseDetail.current.available_actions.length > 0 && (
              <Card size="small" title={t('detail.availableActions.title')} style={{ marginBottom: 16 }}>
                <Space wrap>
                  {caseDetail.current.available_actions.map((action) => (
                    <Button
                      key={action}
                      size="small"
                      type={action === caseDetail.current!.primary_action ? 'primary' : 'default'}
                      onClick={() => message.info(t('detail.availableActions.developing', { label: GOVERNANCE_ACTION_CONFIG[action]?.label || action }))}
                    >
                      {GOVERNANCE_ACTION_CONFIG[action]?.label || action}
                    </Button>
                  ))}
                </Space>
              </Card>
            )}

            {/* Lifecycle timeline */}
            {caseDetail.lifecycle_audits && caseDetail.lifecycle_audits.length > 0 && (
              <Card size="small" title={t('detail.lifecycleSection.title', { total: caseDetail.lifecycle_audit_total })} style={{ marginBottom: 16 }}>
                <Timeline
                  items={caseDetail.lifecycle_audits.map((audit) => ({
                    color: audit.action === 'retired' ? 'red' : audit.action === 'restored' ? 'green' : 'blue',
                    children: (
                      <div>
                        <div>
                          <Tag color={LIFECYCLE_ACTION_CONFIG[audit.action]?.color}>
                            {LIFECYCLE_ACTION_CONFIG[audit.action]?.label}
                          </Tag>
                          {audit.from_status && audit.to_status && (
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              {CASE_ASSET_STATUS_CONFIG[audit.from_status as CaseAssetStatus]?.label} → {CASE_ASSET_STATUS_CONFIG[audit.to_status as CaseAssetStatus]?.label}
                            </Text>
                          )}
                        </div>
                        {audit.reason && <Text type="secondary" style={{ fontSize: 12 }}>{audit.reason}</Text>}
                        <div><Text type="secondary" style={{ fontSize: 11 }}>{dayjs(audit.created_at).format('YYYY-MM-DD HH:mm')}</Text></div>
                      </div>
                    ),
                  }))}
                />
              </Card>
            )}

            {/* Detection report history */}
            <Collapse
              size="small"
              style={{ marginBottom: 16 }}
              onChange={(keys) => {
                if (keys.includes('detection') && detectionReports.length === 0) {
                  fetchDetections(selectedCaseKey, 1);
                }
              }}
              items={[{
                key: 'detection',
                label: t('detail.detection.title', { total: detectionTotal }),
                children: (
                  <>
                    {detectionDiff && (
                      <AntRow gutter={12} style={{ marginBottom: 12 }}>
                        <AntCol span={4}><Statistic title={t('detail.detection.diff.changed')} value={detectionDiff.changed_cases} valueStyle={{ fontSize: 14 }} /></AntCol>
                        <AntCol span={4}><Statistic title={t('detail.detection.diff.added')} value={detectionDiff.added_cases} valueStyle={{ fontSize: 14 }} /></AntCol>
                        <AntCol span={4}><Statistic title={t('detail.detection.diff.removed')} value={detectionDiff.removed_cases} valueStyle={{ fontSize: 14 }} /></AntCol>
                        <AntCol span={4}><Statistic title={t('detail.detection.diff.newHighRisk')} value={detectionDiff.new_high_risk_cases} valueStyle={{ fontSize: 14, color: '#ef4444' }} /></AntCol>
                        <AntCol span={4}><Statistic title={t('detail.detection.diff.resolvedHighRisk')} value={detectionDiff.resolved_high_risk_cases} valueStyle={{ fontSize: 14, color: '#10b981' }} /></AntCol>
                        <AntCol span={4}><Statistic title={t('detail.detection.diff.scoreDelta')} value={detectionDiff.score_delta > 0 ? `+${detectionDiff.score_delta}` : detectionDiff.score_delta} valueStyle={{ fontSize: 14 }} /></AntCol>
                      </AntRow>
                    )}
                    <Table
                      size="small"
                      loading={detectionLoading}
                      rowKey="id"
                      dataSource={detectionReports}
                      pagination={{
                        current: detectionPage,
                        pageSize: 10,
                        total: detectionTotal,
                        size: 'small',
                        showTotal: (n) => t('detail.tableTotal', { total: n }),
                        onChange: (p) => fetchDetections(selectedCaseKey, p),
                      }}
                      expandable={{
                        expandedRowRender: (record) =>
                          record.issues && record.issues.length > 0 ? (
                            <Table
                              size="small"
                              rowKey={(r) => `${record.id}-${r.rule_code}`}
                              dataSource={record.issues}
                              pagination={false}
                              columns={[
                                { title: t('detail.detection.issues.rule'), dataIndex: 'rule_code', width: 160 },
                                { title: t('detail.detection.issues.dimension'), dataIndex: 'dimension', width: 100, render: (v: string) => <Tag>{v}</Tag> },
                                { title: t('detail.detection.issues.severity'), dataIndex: 'severity', width: 80, render: (v: string) => <Tag color={QUALITY_SEVERITY_CONFIG[v as keyof typeof QUALITY_SEVERITY_CONFIG]?.color}>{QUALITY_SEVERITY_CONFIG[v as keyof typeof QUALITY_SEVERITY_CONFIG]?.label || v}</Tag> },
                                { title: t('detail.detection.issues.message'), dataIndex: 'message' },
                                { title: t('detail.detection.issues.suggestion'), dataIndex: 'suggestion', width: 200 },
                              ]}
                            />
                          ) : <Text type="secondary">{t('detail.detection.issues.empty')}</Text>,
                      }}
                      columns={[
                        { title: t('detail.detection.table.stage'), dataIndex: 'stage', width: 80, render: (v: string) => <Tag color={QUALITY_GATE_STAGE_CONFIG[v as keyof typeof QUALITY_GATE_STAGE_CONFIG]?.color}>{QUALITY_GATE_STAGE_CONFIG[v as keyof typeof QUALITY_GATE_STAGE_CONFIG]?.label || v}</Tag> },
                        { title: t('detail.detection.table.decision'), dataIndex: 'decision', width: 90, render: (v: string) => <Tag color={QUALITY_DECISION_CONFIG[v as keyof typeof QUALITY_DECISION_CONFIG]?.color}>{QUALITY_DECISION_CONFIG[v as keyof typeof QUALITY_DECISION_CONFIG]?.label || v}</Tag> },
                        { title: t('detail.detection.table.risk'), dataIndex: 'risk_level', width: 80, render: (v: string) => <Tag color={QUALITY_SEVERITY_CONFIG[v as keyof typeof QUALITY_SEVERITY_CONFIG]?.color}>{QUALITY_SEVERITY_CONFIG[v as keyof typeof QUALITY_SEVERITY_CONFIG]?.label || v}</Tag> },
                        { title: t('detail.detection.table.authority'), dataIndex: 'authority_status', width: 80, render: (v: string) => <Tag color={STATIC_AUTHORITY_STATUS_CONFIG[v as keyof typeof STATIC_AUTHORITY_STATUS_CONFIG]?.color}>{STATIC_AUTHORITY_STATUS_CONFIG[v as keyof typeof STATIC_AUTHORITY_STATUS_CONFIG]?.label || v}</Tag> },
                        { title: t('detail.detection.table.score'), dataIndex: 'score', width: 60, align: 'center' as const },
                        { title: t('detail.detection.table.issueCount'), dataIndex: 'issue_count', width: 70, align: 'center' as const },
                        { title: t('detail.detection.table.createdAt'), dataIndex: 'created_at', width: 130, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
                      ]}
                    />
                  </>
                ),
              }]}
            />

            {/* Validation management */}
            <Collapse
              size="small"
              style={{ marginBottom: 16 }}
              onChange={(keys) => {
                if (keys.includes('validation')) {
                  if (validationJobs.length === 0) fetchValidationJobs(1);
                  if (validationEnabled && validationDisabledReason === '') checkValidationCapabilities();
                }
              }}
              items={[{
                key: 'validation',
                label: t('detail.validationSection.title', { total: validationTotal }),
                children: (
                  <>
                    {!validationEnabled && (
                      <Alert type="warning" message={validationDisabledReason} showIcon style={{ marginBottom: 12 }} />
                    )}
                    <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="secondary">{t('detail.validationSection.jobsLabel')}</Text>
                      <Button
                        size="small"
                        type="primary"
                        disabled={!validationEnabled}
                        onClick={openTriggerModal}
                      >
                        {t('detail.validationSection.trigger')}
                      </Button>
                    </div>
                    <Table
                      size="small"
                      loading={validationLoading}
                      rowKey="id"
                      dataSource={validationJobs}
                      pagination={{
                        current: validationPage,
                        pageSize: 10,
                        total: validationTotal,
                        size: 'small',
                        showTotal: (n) => t('detail.tableTotal', { total: n }),
                        onChange: (p) => fetchValidationJobs(p),
                      }}
                      columns={[
                        { title: t('detail.validationSection.table.status'), dataIndex: 'status', width: 100, render: (v: string) => <Tag color={VALIDATION_JOB_STATUS_CONFIG[v as keyof typeof VALIDATION_JOB_STATUS_CONFIG]?.color}>{VALIDATION_JOB_STATUS_CONFIG[v as keyof typeof VALIDATION_JOB_STATUS_CONFIG]?.label || v}</Tag> },
                        { title: t('detail.validationSection.table.trigger'), dataIndex: 'created_by', width: 120, ellipsis: true },
                        { title: t('detail.validationSection.table.createdAt'), dataIndex: 'created_at', width: 130, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
                        { title: t('detail.validationSection.table.completedAt'), dataIndex: 'completed_at', width: 130, render: (v?: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
                        { title: t('detail.validationSection.table.errorMessage'), dataIndex: 'error_message', ellipsis: true, render: (v?: string) => v ? <Text type="danger" style={{ fontSize: 12 }}>{v}</Text> : '-' },
                        { title: t('detail.validationSection.table.actions'), width: 90, render: (_: unknown, record: BenchmarkCaseValidationJob) => record.status === 'completed' ? <Button type="link" size="small" onClick={() => openReportModal(record)}>{t('detail.validationSection.table.viewReport')}</Button> : null },
                      ]}
                    />
                  </>
                ),
              }]}
            />

            {/* Review management */}
            <Collapse
              size="small"
              style={{ marginBottom: 16 }}
              onChange={(keys) => {
                if (keys.includes('review') && reviewJobs.length === 0) fetchReviewJobs(1);
              }}
              items={[{
                key: 'review',
                label: t('detail.reviewSection.title', { total: reviewTotal }),
                children: (
                  <>
                    <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="secondary">{t('detail.reviewSection.jobsLabel')}</Text>
                      <Button size="small" type="primary" onClick={() => setReviewTriggerOpen(true)}>
                        {t('detail.reviewSection.trigger')}
                      </Button>
                    </div>
                    <Table
                      size="small"
                      loading={reviewLoading}
                      rowKey="id"
                      dataSource={reviewJobs}
                      pagination={{
                        current: reviewPage, pageSize: 10, total: reviewTotal, size: 'small',
                        showTotal: (n) => t('detail.tableTotal', { total: n }), onChange: (p) => fetchReviewJobs(p),
                      }}
                      columns={[
                        { title: t('detail.reviewSection.table.status'), dataIndex: 'status', width: 100, render: (v: string) => <Tag color={VALIDATION_JOB_STATUS_CONFIG[v as keyof typeof VALIDATION_JOB_STATUS_CONFIG]?.color}>{VALIDATION_JOB_STATUS_CONFIG[v as keyof typeof VALIDATION_JOB_STATUS_CONFIG]?.label || v}</Tag> },
                        { title: t('detail.reviewSection.table.model'), dataIndex: 'model', width: 120, ellipsis: true, render: (v?: string) => v || '-' },
                        { title: t('detail.reviewSection.table.trigger'), dataIndex: 'created_by', width: 100, ellipsis: true },
                        { title: t('detail.reviewSection.table.createdAt'), dataIndex: 'created_at', width: 130, render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
                        { title: t('detail.reviewSection.table.completedAt'), dataIndex: 'completed_at', width: 130, render: (v?: string) => v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-' },
                        { title: t('detail.reviewSection.table.errorMessage'), dataIndex: 'error_message', ellipsis: true, render: (v?: string) => v ? <Text type="danger" style={{ fontSize: 12 }}>{v}</Text> : '-' },
                        { title: t('detail.reviewSection.table.actions'), width: 90, render: (_: unknown, record: BenchmarkCaseReviewJob) => record.status === 'completed' ? <Button type="link" size="small" onClick={() => openReviewReport(record)}>{t('detail.reviewSection.table.viewReport')}</Button> : null },
                      ]}
                    />
                  </>
                ),
              }]}
            />

            {/* Evidence fusion */}
            <Collapse
              size="small"
              style={{ marginBottom: 16 }}
              onChange={(keys) => {
                if (keys.includes('fusion') && !fusionLoaded) fetchFusion(1);
              }}
              items={[{
                key: 'fusion',
                label: t('detail.fusion.title', { total: fusionTotal }),
                children: (
                  <>
                    {fusionReport ? (
                      <>
                        <AntRow gutter={12} style={{ marginBottom: 12 }}>
                          <AntCol span={4}><Statistic title={t('detail.fusion.stats.totalCases')} value={fusionReport.total_cases} valueStyle={{ fontSize: 16 }} /></AntCol>
                          <AntCol span={4}><Statistic title={t('detail.fusion.stats.pass')} value={fusionReport.pass_cases} valueStyle={{ fontSize: 16, color: '#10b981' }} /></AntCol>
                          <AntCol span={4}><Statistic title={t('detail.fusion.stats.warn')} value={fusionReport.warn_cases} valueStyle={{ fontSize: 16, color: '#f59e0b' }} /></AntCol>
                          <AntCol span={4}><Statistic title={t('detail.fusion.stats.block')} value={fusionReport.block_cases} valueStyle={{ fontSize: 16, color: '#ef4444' }} /></AntCol>
                          <AntCol span={4}><Statistic title={t('detail.fusion.stats.insufficient')} value={fusionReport.insufficient_cases} valueStyle={{ fontSize: 16, color: '#9ca3af' }} /></AntCol>
                          <AntCol span={4}>
                            <div>
                              <Text type="secondary" style={{ fontSize: 12 }}>{t('detail.fusion.stats.averageConfidence')}</Text>
                              <div style={{ fontSize: 16, fontWeight: 600 }}>{(fusionReport.average_confidence * 100).toFixed(0)}%</div>
                            </div>
                          </AntCol>
                        </AntRow>
                      </>
                    ) : !fusionLoading && fusionLoaded ? (
                      <Alert type="info" message={t('detail.fusion.emptyData')} style={{ marginBottom: 12 }} />
                    ) : null}
                    <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
                      <Select
                        allowClear placeholder={t('detail.fusion.filterByDecision')} style={{ width: 120 }}
                        value={fusionDecisionFilter}
                        onChange={(v) => { setFusionDecisionFilter(v); fetchFusion(1, v, fusionInsufficientFilter); }}
                        options={[{ value: 'pass', label: t('detail.fusion.decision.pass') }, { value: 'warn', label: t('detail.fusion.decision.warn') }, { value: 'block', label: t('detail.fusion.decision.block') }]}
                      />
                      <Select
                        allowClear placeholder={t('detail.fusion.filterInsufficient')} style={{ width: 120 }}
                        value={fusionInsufficientFilter}
                        onChange={(v) => { setFusionInsufficientFilter(v); fetchFusion(1, fusionDecisionFilter, v); }}
                        options={[{ value: 'true', label: t('detail.fusion.bool.true') }, { value: 'false', label: t('detail.fusion.bool.false') }]}
                      />
                      <Text type="secondary">{t('detail.fusion.totalRows', { total: fusionTotal })}</Text>
                    </div>
                    <Table
                      size="small"
                      loading={fusionLoading}
                      rowKey="id"
                      dataSource={fusionCases}
                      pagination={{
                        current: fusionPage, pageSize: 20, total: fusionTotal, size: 'small',
                        showTotal: (n) => t('detail.tableTotal', { total: n }),
                        onChange: (p) => fetchFusion(p, fusionDecisionFilter, fusionInsufficientFilter),
                      }}
                      rowClassName={(record) => record.insufficient_evidence ? 'ant-table-row-warning' : ''}
                      columns={[
                        { title: t('detail.fusion.table.case'), dataIndex: 'case_key', width: 130, ellipsis: true, render: (v: string, r: BenchmarkCaseFusionCaseReport) => r.case_name || v },
                        { title: t('detail.fusion.table.decision'), dataIndex: 'final_decision', width: 70, render: (v: string) => <Tag color={REVIEW_DECISION_CONFIG[v as keyof typeof REVIEW_DECISION_CONFIG]?.color}>{REVIEW_DECISION_CONFIG[v as keyof typeof REVIEW_DECISION_CONFIG]?.label || v}</Tag> },
                        { title: t('detail.fusion.table.risk'), dataIndex: 'final_risk_level', width: 70, render: (v: string) => <Tag color={REVIEW_RISK_CONFIG[v as keyof typeof REVIEW_RISK_CONFIG]?.color}>{REVIEW_RISK_CONFIG[v as keyof typeof REVIEW_RISK_CONFIG]?.label || v}</Tag> },
                        { title: t('detail.fusion.table.score'), dataIndex: 'final_score', width: 65, render: (v: number) => <Text style={{ color: v >= 80 ? '#10b981' : v >= 60 ? '#f59e0b' : '#ef4444' }}>{v.toFixed(1)}</Text> },
                        { title: t('detail.fusion.table.confidence'), dataIndex: 'confidence', width: 70, render: (v: number) => `${(v * 100).toFixed(0)}%` },
                        { title: t('detail.fusion.table.completeness'), dataIndex: 'evidence_completeness', width: 70, render: (v: number) => `${(v * 100).toFixed(0)}%` },
                        { title: t('detail.fusion.table.insufficient'), dataIndex: 'insufficient_evidence', width: 75, render: (v: boolean) => v ? <Tag color="default">{t('detail.fusion.bool.true')}</Tag> : null },
                        { title: t('detail.fusion.table.drift'), dataIndex: 'drift_status', width: 100, render: (v?: string) => v ? <Tag color={REVIEW_DRIFT_STATUS_CONFIG[v as keyof typeof REVIEW_DRIFT_STATUS_CONFIG]?.color}>{REVIEW_DRIFT_STATUS_CONFIG[v as keyof typeof REVIEW_DRIFT_STATUS_CONFIG]?.label || v}</Tag> : '-' },
                      ]}
                      expandable={{
                        expandedRowRender: (record) => (
                          <div style={{ padding: '8px 0' }}>
                            {record.summary && <div style={{ marginBottom: 8 }}><Text strong>{t('detail.fusion.expand.fusionSummary')}: </Text><Text>{record.summary}</Text></div>}
                            <Card size="small" title={t('detail.fusion.expand.threePillars')} style={{ marginBottom: 8 }}>
                              <Descriptions column={3} size="small">
                                <Descriptions.Item label={t('detail.fusion.expand.staticDecision')}>{record.static_decision || '-'}</Descriptions.Item>
                                <Descriptions.Item label={t('detail.fusion.expand.staticRisk')}>{record.static_risk_level || '-'}</Descriptions.Item>
                                <Descriptions.Item label={t('detail.fusion.expand.issueCount')}>{record.static_issue_count ?? '-'}</Descriptions.Item>
                                <Descriptions.Item label={t('detail.fusion.expand.validationOutcome')}>{record.validation_outcome || '-'}</Descriptions.Item>
                                <Descriptions.Item label={t('detail.fusion.expand.validationMatched')}>{record.validation_matched === true ? t('detail.fusion.bool.true') : record.validation_matched === false ? t('detail.fusion.bool.false') : '-'}</Descriptions.Item>
                                <Descriptions.Item label={t('detail.fusion.expand.flaky')}>{record.validation_flaky ? <Tag color="warning">{t('detail.fusion.bool.true')}</Tag> : t('detail.fusion.bool.false')}</Descriptions.Item>
                                <Descriptions.Item label={t('detail.fusion.expand.reviewDecision')}>{record.review_decision || '-'}</Descriptions.Item>
                                <Descriptions.Item label={t('detail.fusion.expand.reviewRisk')}>{record.review_risk || '-'}</Descriptions.Item>
                                <Descriptions.Item label={t('detail.fusion.expand.reviewConfidence')}>{record.review_confidence != null ? `${(record.review_confidence * 100).toFixed(0)}%` : '-'}</Descriptions.Item>
                              </Descriptions>
                            </Card>
                          </div>
                        ),
                      }}
                    />
                  </>
                ),
              }]}
            />
          </>
        ) : (
          !caseDetailLoading && <Text type="secondary">{t('detail.drawer.noGovernance')}</Text>
        )}
      </Drawer>

      {/* Lifecycle confirm Modal */}
      <Modal
        title={lifecycleAction === 'retire' ? (lifecycleTargets.single ? t('detail.lifecycleModal.retireSingle') : t('detail.lifecycleModal.retireBatch', { count: lifecycleTargets.keys.length })) : lifecycleAction === 'restore' ? (lifecycleTargets.single ? t('detail.lifecycleModal.restoreSingle') : t('detail.lifecycleModal.restoreBatch', { count: lifecycleTargets.keys.length })) : t('detail.lifecycleModal.reextractTitle')}
        open={lifecycleModalOpen}
        onCancel={() => { setLifecycleModalOpen(false); setLifecycleReason(''); }}
        onOk={executeLifecycle}
        confirmLoading={lifecycleSubmitting}
        okText={t('detail.lifecycleModal.confirm')}
        okButtonProps={{ danger: lifecycleAction === 'retire' }}
      >
        {lifecycleAction === 'reextract' ? (
          <Alert type="info" message={t('detail.lifecycleModal.reextractInfo')} style={{ marginBottom: 12 }} />
        ) : (
          <Alert type={lifecycleAction === 'retire' ? 'warning' : 'info'} message={lifecycleAction === 'retire' ? t('detail.lifecycleModal.retireWarn') : t('detail.lifecycleModal.restoreInfo')} style={{ marginBottom: 12 }} />
        )}
        {lifecycleTargets.single && (
          <div style={{ marginBottom: 8 }}>
            <Text>{t('detail.lifecycleModal.targetCase')}: <Text code>{lifecycleTargets.single}</Text></Text>
          </div>
        )}
        {!lifecycleTargets.single && lifecycleTargets.keys.length > 0 && (
          <div style={{ marginBottom: 8 }}>
            <Text>{t('detail.lifecycleModal.selectedCount', { count: lifecycleTargets.keys.length })}</Text>
          </div>
        )}
        <div>
          <Text>{lifecycleAction === 'reextract' ? t('detail.lifecycleModal.reasonOptional') : t('detail.lifecycleModal.reasonRequired')}</Text>
          <Input.TextArea
            rows={3}
            value={lifecycleReason}
            onChange={(e) => setLifecycleReason(e.target.value)}
            placeholder={lifecycleAction === 'reextract' ? t('detail.lifecycleModal.reasonOptionalPlaceholder') : t('detail.lifecycleModal.reasonRequiredPlaceholder')}
            style={{ marginTop: 4 }}
          />
        </div>
      </Modal>

      {/* Review Trigger Modal */}
      <Modal
        title={t('detail.reviewTriggerModal.title')}
        open={reviewTriggerOpen}
        onCancel={() => { setReviewTriggerOpen(false); setReviewModel(''); }}
        onOk={handleTriggerReview}
        confirmLoading={reviewTriggering}
        okText={t('detail.reviewTriggerModal.okText')}
      >
        <div style={{ marginBottom: 12 }}>
          <Text>{t('detail.reviewTriggerModal.llmModel')} </Text>
          <Input
            placeholder={t('detail.reviewTriggerModal.modelPlaceholder')}
            value={reviewModel}
            onChange={(e) => setReviewModel(e.target.value)}
            style={{ marginTop: 4 }}
          />
        </div>
        <Alert type="info" message={t('detail.reviewTriggerModal.infoMessage')} style={{ marginBottom: 12 }} />
      </Modal>

      {/* Review Report Modal */}
      <Modal
        title={`${t('detail.reviewReport.title')} ${reviewReportJobId ? `- ${reviewReportJobId.slice(0, 8)}` : ''}`}
        open={reviewReportOpen}
        onCancel={() => setReviewReportOpen(false)}
        footer={null}
        width={900}
        loading={reviewReportLoading}
      >
        {reviewReport ? (
          <>
            {/* Report summary */}
            <AntRow gutter={12} style={{ marginBottom: 12 }}>
              <AntCol span={3}><Statistic title={t('detail.reviewReport.stats.totalCases')} value={reviewReport.total_cases} valueStyle={{ fontSize: 16 }} /></AntCol>
              <AntCol span={3}><Statistic title={t('detail.reviewReport.stats.pass')} value={reviewReport.pass_cases} valueStyle={{ fontSize: 16, color: '#10b981' }} /></AntCol>
              <AntCol span={3}><Statistic title={t('detail.reviewReport.stats.warn')} value={reviewReport.warn_cases} valueStyle={{ fontSize: 16, color: '#f59e0b' }} /></AntCol>
              <AntCol span={3}><Statistic title={t('detail.reviewReport.stats.block')} value={reviewReport.block_cases} valueStyle={{ fontSize: 16, color: '#ef4444' }} /></AntCol>
              <AntCol span={3}><Statistic title={t('detail.reviewReport.stats.lowConfidence')} value={reviewReport.low_confidence_cases} valueStyle={{ fontSize: 16, color: '#f59e0b' }} /></AntCol>
              <AntCol span={3}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t('detail.reviewReport.stats.averageConfidence')}</Text>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>{(reviewReport.average_confidence * 100).toFixed(0)}%</div>
                </div>
              </AntCol>
              <AntCol span={3}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t('detail.reviewReport.stats.overallDecision')}</Text>
                  <div><Tag color={REVIEW_DECISION_CONFIG[reviewReport.decision]?.color}>{REVIEW_DECISION_CONFIG[reviewReport.decision]?.label}</Tag></div>
                </div>
              </AntCol>
              <AntCol span={3}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t('detail.reviewReport.stats.authorityStatus')}</Text>
                  <div><Tag color={STATIC_AUTHORITY_STATUS_CONFIG[reviewReport.authority_status as keyof typeof STATIC_AUTHORITY_STATUS_CONFIG]?.color}>{STATIC_AUTHORITY_STATUS_CONFIG[reviewReport.authority_status as keyof typeof STATIC_AUTHORITY_STATUS_CONFIG]?.label}</Tag></div>
                </div>
              </AntCol>
            </AntRow>

            {/* Provider info */}
            {(reviewReport.provider_name || reviewReport.resolved_model) && (
              <Alert type="info" style={{ marginBottom: 12 }} message={
                <Space size="small">
                  {reviewReport.provider_name && <Text type="secondary">Provider: {reviewReport.provider_name}</Text>}
                  {reviewReport.resolved_model && <Text type="secondary">Model: {reviewReport.resolved_model}</Text>}
                  {reviewReport.provider_execution_mode && <Tag>{reviewReport.provider_execution_mode}</Tag>}
                  {reviewReport.llm_call_succeeded !== undefined && <Tag color={reviewReport.llm_call_succeeded ? 'success' : 'error'}>{reviewReport.llm_call_succeeded ? t('detail.reviewReport.llmSuccess') : t('detail.reviewReport.llmFailed')}</Tag>}
                </Space>
              } />
            )}
            {reviewReport.summary && (
              <Card size="small" title={t('detail.reviewReport.summary')} style={{ marginBottom: 12 }}>
                <Text style={{ fontSize: 13 }}>{reviewReport.summary}</Text>
              </Card>
            )}

            {/* Filters */}
            <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <Select
                allowClear placeholder={t('detail.reviewReport.filterByDecision')} style={{ width: 120 }}
                value={reviewDecisionFilter}
                onChange={(v) => { setReviewDecisionFilter(v); fetchReviewCaseReports(1, v, reviewDriftFilter); }}
                options={[{ value: 'pass', label: t('detail.reviewReport.decision.pass') }, { value: 'warn', label: t('detail.reviewReport.decision.warn') }, { value: 'block', label: t('detail.reviewReport.decision.block') }]}
              />
              <Select
                allowClear placeholder={t('detail.reviewReport.filterByDrift')} style={{ width: 140 }}
                value={reviewDriftFilter}
                onChange={(v) => { setReviewDriftFilter(v); fetchReviewCaseReports(1, reviewDecisionFilter, v); }}
                options={Object.entries(REVIEW_DRIFT_STATUS_CONFIG).map(([k, v]) => ({ value: k, label: v.label }))}
              />
              <Text type="secondary">{t('detail.reviewReport.totalRows', { total: reviewCaseTotal })}</Text>
            </div>

            {/* Case Reports Table */}
            <Table
              size="small"
              loading={reviewCaseLoading}
              rowKey="id"
              dataSource={reviewCaseReports}
              pagination={{
                current: reviewCasePage, pageSize: 20, total: reviewCaseTotal, size: 'small',
                showTotal: (n) => t('detail.tableTotal', { total: n }),
                onChange: (p) => fetchReviewCaseReports(p, reviewDecisionFilter, reviewDriftFilter),
              }}
              rowClassName={(record) => record.authority_status !== 'authoritative' ? 'ant-table-row-warning' : ''}
              columns={[
                { title: t('detail.reviewReport.table.case'), dataIndex: 'case_key', width: 130, ellipsis: true, render: (v: string, r: BenchmarkCaseReviewCaseReport) => r.case_name || v },
                { title: t('detail.reviewReport.table.decision'), dataIndex: 'decision', width: 70, render: (v: string) => <Tag color={REVIEW_DECISION_CONFIG[v as keyof typeof REVIEW_DECISION_CONFIG]?.color}>{REVIEW_DECISION_CONFIG[v as keyof typeof REVIEW_DECISION_CONFIG]?.label || v}</Tag> },
                { title: t('detail.reviewReport.table.risk'), dataIndex: 'risk', width: 70, render: (v: string) => <Tag color={REVIEW_RISK_CONFIG[v as keyof typeof REVIEW_RISK_CONFIG]?.color}>{REVIEW_RISK_CONFIG[v as keyof typeof REVIEW_RISK_CONFIG]?.label || v}</Tag> },
                { title: t('detail.reviewReport.table.confidence'), dataIndex: 'confidence', width: 70, render: (v: number) => `${(v * 100).toFixed(0)}%` },
                { title: t('detail.reviewReport.table.lowConfidence'), dataIndex: 'low_confidence', width: 55, render: (v: boolean) => v ? <Tag color="warning">{t('detail.reviewReport.yes')}</Tag> : null },
                { title: t('detail.reviewReport.table.drift'), dataIndex: 'drift_status', width: 100, render: (v?: string) => v ? <Tag color={REVIEW_DRIFT_STATUS_CONFIG[v as keyof typeof REVIEW_DRIFT_STATUS_CONFIG]?.color}>{REVIEW_DRIFT_STATUS_CONFIG[v as keyof typeof REVIEW_DRIFT_STATUS_CONFIG]?.label || v}</Tag> : '-' },
                { title: t('detail.reviewReport.table.authority'), dataIndex: 'authority_status', width: 70, render: (v: string) => <Tag color={STATIC_AUTHORITY_STATUS_CONFIG[v as keyof typeof STATIC_AUTHORITY_STATUS_CONFIG]?.color}>{STATIC_AUTHORITY_STATUS_CONFIG[v as keyof typeof STATIC_AUTHORITY_STATUS_CONFIG]?.label || v}</Tag> },
              ]}
              expandable={{
                expandedRowRender: (record) => (
                  <div style={{ padding: '8px 0' }}>
                    {record.summary && <div style={{ marginBottom: 8 }}><Text strong>{t('detail.reviewReport.expand.summary')}: </Text><Text>{record.summary}</Text></div>}
                    {record.drift_summary && <div style={{ marginBottom: 8 }}><Text strong>{t('detail.reviewReport.expand.driftSummary')}: </Text><Text>{record.drift_summary}</Text></div>}
                    {(record.previous_decision || record.previous_risk) && (
                      <div style={{ marginBottom: 8 }}>
                        <Text strong>{t('detail.reviewReport.expand.previousReview')}: </Text>
                        {record.previous_decision && <Tag>{REVIEW_DECISION_CONFIG[record.previous_decision as keyof typeof REVIEW_DECISION_CONFIG]?.label || record.previous_decision}</Tag>}
                        {record.previous_risk && <Tag>{REVIEW_RISK_CONFIG[record.previous_risk as keyof typeof REVIEW_RISK_CONFIG]?.label || record.previous_risk}</Tag>}
                        {record.previous_confidence !== undefined && <Text type="secondary"> {(record.previous_confidence * 100).toFixed(0)}%</Text>}
                        <Text> → </Text>
                        <Tag color={REVIEW_DECISION_CONFIG[record.decision as keyof typeof REVIEW_DECISION_CONFIG]?.color}>{REVIEW_DECISION_CONFIG[record.decision as keyof typeof REVIEW_DECISION_CONFIG]?.label}</Tag>
                        <Tag color={REVIEW_RISK_CONFIG[record.risk as keyof typeof REVIEW_RISK_CONFIG]?.color}>{REVIEW_RISK_CONFIG[record.risk as keyof typeof REVIEW_RISK_CONFIG]?.label}</Tag>
                        <Text>{(record.confidence * 100).toFixed(0)}%</Text>
                      </div>
                    )}
                    {record.low_confidence && record.low_confidence_reason && <div style={{ marginBottom: 8 }}><Tag color="warning">{t('detail.reviewReport.expand.lowConfidenceReason')}</Tag><Text type="secondary"> {record.low_confidence_reason}</Text></div>}
                    {record.validation_outcome && <div style={{ marginBottom: 8 }}><Text strong>{t('detail.reviewReport.expand.validationOutcome')}: </Text><Tag>{record.validation_outcome}</Tag>{record.validation_flaky && <Tag color="warning">flaky</Tag>}</div>}
                    {record.findings_json != null && (
                      <div>
                        <Text strong>{t('detail.reviewReport.expand.findings')}: </Text>
                        <pre style={{ fontSize: 11, maxHeight: 200, overflow: 'auto', margin: 0, padding: 4, background: '#f5f5f5', borderRadius: 4 }}>
                          {typeof record.findings_json === 'string' ? record.findings_json : JSON.stringify(record.findings_json, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                ),
              }}
            />
          </>
        ) : (
          !reviewReportLoading && <Text type="secondary">{t('detail.reviewReport.emptyReport')}</Text>
        )}
      </Modal>

      {/* Validation Report Modal */}
      <Modal
        title={`${t('detail.validationReport.title')} ${reportJobId ? `- ${reportJobId.slice(0, 8)}` : ''}`}
        open={reportModalOpen}
        onCancel={() => setReportModalOpen(false)}
        footer={null}
        width={900}
        loading={reportLoading}
      >
        {reportSummary ? (
          <>
            {/* Summary statistics */}
            <AntRow gutter={12} style={{ marginBottom: 12 }}>
              <AntCol span={4}><Statistic title={t('detail.validationReport.stats.totalCases')} value={reportSummary.total_cases} valueStyle={{ fontSize: 16 }} /></AntCol>
              <AntCol span={4}><Statistic title={t('detail.validationReport.stats.matched')} value={reportSummary.matched_cases} valueStyle={{ fontSize: 16, color: '#10b981' }} /></AntCol>
              <AntCol span={4}><Statistic title={t('detail.validationReport.stats.mismatched')} value={reportSummary.mismatched_cases} valueStyle={{ fontSize: 16, color: '#ef4444' }} /></AntCol>
              <AntCol span={4}><Statistic title={t('detail.validationReport.stats.flaky')} value={reportSummary.flaky_cases} valueStyle={{ fontSize: 16, color: '#f59e0b' }} /></AntCol>
              <AntCol span={4}><Statistic title={t('detail.validationReport.stats.error')} value={reportSummary.error_cases} valueStyle={{ fontSize: 16, color: '#ef4444' }} /></AntCol>
              <AntCol span={4}>
                <div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{t('detail.validationReport.stats.authorityStatus')}</Text>
                  <div>
                    <Tag color={STATIC_AUTHORITY_STATUS_CONFIG[reportSummary.authority_status as keyof typeof STATIC_AUTHORITY_STATUS_CONFIG]?.color}>
                      {STATIC_AUTHORITY_STATUS_CONFIG[reportSummary.authority_status as keyof typeof STATIC_AUTHORITY_STATUS_CONFIG]?.label || reportSummary.authority_status}
                    </Tag>
                  </div>
                </div>
                {reportSummary.degraded_reason && <Text type="warning" style={{ fontSize: 11 }}>({reportSummary.degraded_reason})</Text>}
              </AntCol>
            </AntRow>

            {/* Filters */}
            <div style={{ marginBottom: 8, display: 'flex', gap: 8, alignItems: 'center' }}>
              <Select
                allowClear
                placeholder={t('detail.validationReport.filterByOutcome')}
                style={{ width: 140 }}
                value={outcomeFilter}
                onChange={(v) => { setOutcomeFilter(v); fetchCaseReports(1, reportJobId, v); }}
                options={[
                  { value: 'pass', label: t('detail.validationReport.outcome.pass') },
                  { value: 'fail', label: t('detail.validationReport.outcome.fail') },
                  { value: 'error', label: t('detail.validationReport.outcome.error') },
                  { value: 'unsupported', label: t('detail.validationReport.outcome.unsupported') },
                ]}
              />
              <Text type="secondary">{t('detail.validationReport.totalRows', { total: caseReportsTotal })}</Text>
            </div>

            {/* Case Reports Table */}
            <Table
              size="small"
              loading={caseReportsLoading}
              rowKey="id"
              dataSource={caseReports}
              pagination={{
                current: caseReportsPage,
                pageSize: 20,
                total: caseReportsTotal,
                size: 'small',
                showTotal: (n) => t('detail.tableTotal', { total: n }),
                onChange: (p) => fetchCaseReports(p, reportJobId, outcomeFilter),
              }}
              rowClassName={(record) => record.authority_status !== 'authoritative' ? 'ant-table-row-warning' : ''}
              columns={[
                { title: t('detail.validationReport.table.case'), dataIndex: 'case_key', width: 140, ellipsis: true, render: (v: string, r: BenchmarkCaseValidationCaseReport) => r.case_name || v },
                { title: t('detail.validationReport.table.expected'), dataIndex: 'expected_outcome', width: 70, render: (v: string) => <Tag>{v}</Tag> },
                { title: t('detail.validationReport.table.actual'), dataIndex: 'aggregate_outcome', width: 80, render: (v: string) => <Tag color={VALIDATION_OBSERVED_OUTCOME_CONFIG[v as keyof typeof VALIDATION_OBSERVED_OUTCOME_CONFIG]?.color}>{VALIDATION_OBSERVED_OUTCOME_CONFIG[v as keyof typeof VALIDATION_OBSERVED_OUTCOME_CONFIG]?.label || v}</Tag> },
                { title: t('detail.validationReport.table.passRate'), dataIndex: 'pass_rate', width: 80, render: (v: number) => `${(v * 100).toFixed(0)}%` },
                { title: t('detail.validationReport.table.matchRate'), dataIndex: 'match_rate', width: 80, render: (v: number) => `${(v * 100).toFixed(0)}%` },
                { title: t('detail.validationReport.table.attempts'), dataIndex: 'attempt_count', width: 55, align: 'center' as const },
                { title: t('detail.validationReport.table.flaky'), dataIndex: 'flaky', width: 55, render: (v: boolean) => v ? <Tag color="warning">{t('detail.validationReport.yes')}</Tag> : null },
                { title: t('detail.validationReport.table.authority'), dataIndex: 'authority_status', width: 70, render: (v: string) => <Tag color={STATIC_AUTHORITY_STATUS_CONFIG[v as keyof typeof STATIC_AUTHORITY_STATUS_CONFIG]?.color}>{STATIC_AUTHORITY_STATUS_CONFIG[v as keyof typeof STATIC_AUTHORITY_STATUS_CONFIG]?.label || v}</Tag> },
              ]}
              expandable={{
                onExpand: (expanded, record) => { if (expanded && !evidenceMap[record.case_key]) fetchEvidence(record.case_key); },
                expandedRowRender: (record) => {
                  const evList = evidenceMap[record.case_key];
                  if (evidenceLoadingMap[record.case_key]) return <Text type="secondary">{t('detail.validationReport.evidence.loading')}</Text>;
                  if (!evList || evList.length === 0) return <Text type="secondary">{t('detail.validationReport.evidence.empty')}</Text>;
                  return (
                    <Table
                      size="small"
                      rowKey="id"
                      dataSource={evList}
                      pagination={false}
                      columns={[
                        { title: t('detail.validationReport.evidence.index'), dataIndex: 'attempt', width: 40, align: 'center' as const },
                        { title: t('detail.validationReport.evidence.adapter'), dataIndex: 'adapter_name', width: 120, ellipsis: true },
                        { title: t('detail.validationReport.evidence.expected'), dataIndex: 'expected_outcome', width: 60, render: (v: string) => <Tag>{v}</Tag> },
                        { title: t('detail.validationReport.evidence.actual'), dataIndex: 'observed_outcome', width: 70, render: (v: string) => <Tag color={VALIDATION_OBSERVED_OUTCOME_CONFIG[v as keyof typeof VALIDATION_OBSERVED_OUTCOME_CONFIG]?.color}>{VALIDATION_OBSERVED_OUTCOME_CONFIG[v as keyof typeof VALIDATION_OBSERVED_OUTCOME_CONFIG]?.label || v}</Tag> },
                        { title: t('detail.validationReport.evidence.matched'), dataIndex: 'matched_expectation', width: 55, render: (v?: boolean) => v === true ? <Tag color="success">{t('detail.validationReport.yes')}</Tag> : v === false ? <Tag color="error">{t('detail.validationReport.no')}</Tag> : <Tag>?</Tag> },
                        { title: t('detail.validationReport.evidence.exitCode'), dataIndex: 'exit_code', width: 50, render: (v?: number) => v ?? '-' },
                        { title: t('detail.validationReport.evidence.duration'), dataIndex: 'duration_ms', width: 70, render: (v: number) => v >= 1000 ? `${(v / 1000).toFixed(1)}s` : `${v}ms` },
                        { title: t('detail.validationReport.evidence.output'), dataIndex: 'output_text', render: (v?: string) => v ? <TruncatedText text={v} maxLen={200} /> : '-' },
                        { title: t('detail.validationReport.evidence.errorMessage'), dataIndex: 'error_message', render: (v?: string) => v ? <TruncatedText text={v} maxLen={200} /> : '-' },
                      ]}
                    />
                  );
                },
              }}
            />
          </>
        ) : (
          !reportLoading && <Text type="secondary">{t('detail.validationReport.emptyReport')}</Text>
        )}
      </Modal>

      {/* Trigger Validation Modal */}
      <Modal
        title={t('detail.triggerValidationModal.title')}
        open={triggerModalOpen}
        onCancel={() => { setTriggerModalOpen(false); setPreviewData(null); }}
        onOk={handleTriggerValidation}
        confirmLoading={triggering}
        okText={t('detail.triggerValidationModal.okText')}
        okButtonProps={{ disabled: !validationEnabled }}
      >
        {previewLoading ? (
          <Text type="secondary">{t('detail.triggerValidationModal.loadingPreview')}</Text>
        ) : previewData ? (
          <>
            <AntRow gutter={16} style={{ marginBottom: 16 }}>
              <AntCol span={8}><Statistic title={t('detail.triggerValidationModal.stats.totalCases')} value={previewData.total_cases} /></AntCol>
              <AntCol span={8}><Statistic title={t('detail.triggerValidationModal.stats.supportedCases')} value={previewData.supported_cases} valueStyle={{ color: '#10b981' }} /></AntCol>
              <AntCol span={8}><Statistic title={t('detail.triggerValidationModal.stats.unsupportedCases')} value={previewData.unsupported_cases} valueStyle={{ color: '#ef4444' }} /></AntCol>
            </AntRow>
            {previewData.supported_cases === 0 && (
              <Alert type="warning" message={t('detail.triggerValidationModal.noSupportedCases')} style={{ marginBottom: 12 }} />
            )}
            <div style={{ marginBottom: 12 }}>
              <Text>{t('detail.triggerValidationModal.repeatRuns')} </Text>
              <InputNumber min={1} max={10} value={repeatRuns} onChange={(v) => setRepeatRuns(v ?? 1)} size="small" style={{ width: 80 }} />
            </div>
          </>
        ) : (
          <Alert type="warning" message={t('detail.triggerValidationModal.previewError')} />
        )}
      </Modal>
      <Modal
        title={t('detail.runModal.title')}
        open={runModalOpen}
        onCancel={() => setRunModalOpen(false)}
        onOk={handleSubmitRun}
        okText={t('detail.runModal.okText')}
        confirmLoading={runSubmitting}
        okButtonProps={{ disabled: runAgentsLoading || !runAgentID, 'data-testid': 'benchmark-run-submit' }}
      >
        <div data-testid="benchmark-run-modal">
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Alert
            showIcon
            type="info"
            message={t('detail.runModal.infoMessage')}
            description={t('detail.runModal.infoDescription')}
          />

          <Descriptions size="small" column={1} bordered>
            <Descriptions.Item label={t('detail.runModal.benchmarkLabel')}>{benchmarkName}</Descriptions.Item>
            <Descriptions.Item label={t('detail.runModal.benchmarkIdLabel')}>{id || '-'}</Descriptions.Item>
          </Descriptions>

          <div data-testid="benchmark-run-agent-field">
            <Text strong>{t('detail.runModal.selectAgent')}</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              placeholder={t('detail.runModal.selectActiveAgent')}
              loading={runAgentsLoading}
              value={runAgentID || undefined}
              onChange={setRunAgentID}
              options={runAgents.map((agent) => ({
                value: agent.id,
                label: `${agent.name} (${agent.id.slice(0, 8)})`,
              }))}
            />
          </div>

          <div data-testid="benchmark-run-priority-field">
            <Text strong>{t('detail.runModal.priority')}</Text>
            <Select
              style={{ width: '100%', marginTop: 8 }}
              value={runPriority}
              onChange={(value) => setRunPriority(value)}
              options={BENCHMARK_RUN_PRIORITY_OPTIONS.map((option) => ({
                value: option.value,
                label: `${option.label} · ${t(option.descriptionKey)}`,
              }))}
            />
          </div>

          {!runAgentsLoading && runAgents.length === 0 && (
            <div data-testid="benchmark-run-no-agents">
              <Alert
                type="warning"
                showIcon
                message={t('detail.runModal.noAgentsTitle')}
                description={t('detail.runModal.noAgentsDesc')}
              />
            </div>
          )}
        </Space>
        </div>
      </Modal>
    </div>
  );
}
