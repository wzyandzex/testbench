import { useState, useCallback, useMemo, useEffect } from 'react';
import { Row, Col, Button, Typography, Space, Dropdown, Modal, Select, message, Skeleton, Alert } from 'antd';
import {
  PlusOutlined,
  AppstoreOutlined,
  UnorderedListOutlined,
  SortAscendingOutlined,
  ImportOutlined,
  BranchesOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';

import { BenchmarkCard } from '@/components/benchmark/BenchmarkCard';
import { BenchmarkTable } from '@/components/benchmark/BenchmarkTable';
import { BenchmarkFilters } from '@/components/benchmark/BenchmarkFilters';
import { PageHeader, EmptyPage } from '@/components/common';
import { logger } from '@/utils';
import {
  useThemeTokens,
  useStatCardStyle,
  useTextStyle,
} from '@/theme';
import { pageContainerStyle } from './style';
import type { BenchmarkFilters as Filters } from '@/types/benchmark';
import type { BenchmarkTableRecord } from '@/components/benchmark';
import { benchmarkService } from '@/services/benchmark';
import { agentService } from '@/services/agent';
import type { PaginatedResponse } from '@/types';
import type { Agent } from '@/types/api/agent';
import {
  BENCHMARK_RUN_PRIORITY_CONFIG,
  type Benchmark as ApiBenchmark,
  type BenchmarkDetail as ApiBenchmarkDetail,
  type BenchmarkRunPriority,
} from '@/types/api/benchmark';

const { Text } = Typography;

/** Maps API benchmark to flat structure for card/table */
interface BenchmarkItem {
  id: string;
  name: string;
  description: string;
  language: string;
  category: string;
  status: 'active' | 'draft' | 'archived';
  totalExecutions: number;
  successRate: number;
  lastExecution: Date | null;
  createdAt: Date;
}

function mapBenchmark(b: ApiBenchmark): BenchmarkItem {
  return {
    id: b.id,
    name: b.display_name || b.name,
    description: b.description,
    language: b.language,
    category: b.category,
    status: (['active', 'draft', 'archived'].includes(b.status) ? b.status : 'draft') as BenchmarkItem['status'],
    totalExecutions: b.stats?.total_runs ?? 0,
    successRate: b.stats?.success_rate ?? 0,
    lastExecution: null,
    createdAt: new Date(b.created_at),
  };
}

type ViewMode = 'grid' | 'list';
type SortField = 'name' | 'created' | 'executions' | 'successRate';

/**
 * Benchmark list page
 */
export default function BenchmarkListPage() {
  const { t } = useTranslation('benchmarks');
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filters, setFilters] = useState<Filters>({});
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [loading, setLoading] = useState(false);
  const [runModalOpen, setRunModalOpen] = useState(false);
  const [runTarget, setRunTarget] = useState<BenchmarkTableRecord | null>(null);
  const [runAgents, setRunAgents] = useState<Agent[]>([]);
  const [runAgentsLoading, setRunAgentsLoading] = useState(false);
  const [runSubmitting, setRunSubmitting] = useState(false);
  const [runAgentID, setRunAgentID] = useState('');
  const [runPriority, setRunPriority] = useState<BenchmarkRunPriority>('p2');

  // Data state
  const [benchmarks, setBenchmarks] = useState<BenchmarkItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Theme hooks
  const tokens = useThemeTokens();
  const statCardStyle = useStatCardStyle();
  const secondaryText = useTextStyle('secondary');
  const priorityOptions = useMemo(
    () =>
      Object.entries(BENCHMARK_RUN_PRIORITY_CONFIG).map(([value, config]) => ({
        value,
        label: `${config.label} · ${config.description}`,
      })),
    []
  );

  // Fetch list data
  const fetchBenchmarks = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await benchmarkService.list({
        page: p,
        page_size: pageSize,
        ...(filters.status?.length ? { status: filters.status as ApiBenchmark['status'][] } : {}),
        ...(filters.category?.length ? { categories: filters.category } : {}),
        ...(filters.language?.length ? { languages: filters.language } : {}),
        ...(filters.search ? { name_like: filters.search } : {}),
      });
      const pd = (res as unknown) as PaginatedResponse<ApiBenchmark>;
      setBenchmarks((pd.data ?? []).map(mapBenchmark));
      setTotal(pd.total ?? 0);
      setPage(p);
    } catch (err) {
      message.error(t('list.loadFailed'));
      logger.error('fetchBenchmarks failed', err);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchBenchmarks(1); }, [fetchBenchmarks]);

  const loadRunAgents = useCallback(async () => {
    setRunAgentsLoading(true);
    try {
      const res = await agentService.list({
        page: 1,
        page_size: 100,
        order_by: 'name',
        order_dir: 'asc',
      });
      const pageData = res as PaginatedResponse<Agent>;
      const activeAgents = (pageData.data ?? [])
        .filter((agent) => agent.status === 'active')
        .sort((left, right) =>
          (left.display_name || left.name).localeCompare(right.display_name || right.name, 'zh-CN')
        );
      setRunAgents(activeAgents);
      setRunAgentID((current) => current || activeAgents[0]?.id || '');
    } catch (error) {
      logger.error('loadRunAgents failed', error);
      message.error(t('list.agentLoadFailed'));
    } finally {
      setRunAgentsLoading(false);
    }
  }, []);

  const closeRunModal = useCallback(() => {
    setRunModalOpen(false);
    setRunTarget(null);
    setRunSubmitting(false);
    setRunAgents([]);
    setRunAgentID('');
    setRunPriority('p2');
  }, []);

  // Client filtering (secondary filter on already-fetched data)
  const filteredBenchmarks = useMemo(() => {
    return benchmarks.filter((b) => {
      if (filters.status && filters.status.length > 0) {
        if (!filters.status.includes(b.status)) return false;
      }
      if (filters.category && filters.category.length > 0) {
        if (!filters.category.includes(b.category)) return false;
      }
      if (filters.language && filters.language.length > 0) {
        if (!filters.language.includes(b.language)) return false;
      }
      if (filters.search) {
        const s = filters.search.toLowerCase();
        if (!b.name.toLowerCase().includes(s) && !b.description.toLowerCase().includes(s)) {
          return false;
        }
      }
      return true;
    });
  }, [benchmarks, filters]);

  // Sort
  const sortedBenchmarks = useMemo(() => {
    const sorted = [...filteredBenchmarks];
    sorted.sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'name':
          comparison = a.name.localeCompare(b.name, 'zh-CN');
          break;
        case 'executions':
          comparison = a.totalExecutions - b.totalExecutions;
          break;
        case 'successRate':
          comparison = a.successRate - b.successRate;
          break;
        case 'created':
          comparison = a.createdAt.getTime() - b.createdAt.getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [filteredBenchmarks, sortField, sortOrder]);

  // Convert to table data
  const tableData: BenchmarkTableRecord[] = useMemo(() => {
    return sortedBenchmarks.map((b) => ({
      ...b,
      key: b.id,
      status: b.status as BenchmarkTableRecord['status'],
      category: b.category as BenchmarkTableRecord['category'],
    }));
  }, [sortedBenchmarks]);

  // Stats
  const stats = useMemo(() => ({
    total,
    active: benchmarks.filter((b) => b.status === 'active').length,
    draft: benchmarks.filter((b) => b.status === 'draft').length,
  }), [benchmarks, total]);

  // Sort menu
  const sortMenuItems: MenuProps['items'] = [
    { key: 'name', label: t('list.sortByName') },
    { key: 'created', label: t('list.sortByCreated') },
    { key: 'executions', label: t('list.sortByExecutions') },
    { key: 'successRate', label: t('list.sortBySuccessRate') },
  ];

  const handleSortChange: MenuProps['onClick'] = (info) => {
    const newSortField = info.key as SortField;
    if (sortField === newSortField) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(newSortField);
      setSortOrder('asc');
    }
    logger.userAction('sort_benchmarks', { key: info.key });
  };

  const handleEdit = useCallback((record: BenchmarkTableRecord) => {
    logger.userAction('edit_benchmark', { id: record.id });
    navigate(`/benchmarks/${record.id}/edit`);
  }, [navigate]);

  const handleFork = useCallback((record: BenchmarkTableRecord) => {
    Modal.confirm({
      title: t('list.forkTitle'),
      content: t('list.forkContent', { name: record.name }),
      okText: t('list.forkConfirm'),
      cancelText: t('list.cancel'),
      onOk: async () => {
        try {
          logger.userAction('fork_benchmark', { id: record.id, source: 'benchmark_list' });
          const result = await benchmarkService.fork(record.id) as unknown as ApiBenchmarkDetail;
          message.success(t('list.forkSuccess'));
          navigate(`/benchmarks/${result.id}/edit`);
        } catch (error) {
          logger.error('fork benchmark from list failed', error);
        }
      },
    });
  }, [navigate, t]);

  const handleExecute = useCallback(async (record: BenchmarkTableRecord) => {
    logger.userAction('execute_benchmark', { id: record.id, source: 'benchmark_list' });
    setRunTarget(record);
    setRunModalOpen(true);
    setRunPriority('p2');
    setRunAgentID('');
    await loadRunAgents();
  }, [loadRunAgents]);

  const handleSubmitRun = useCallback(async () => {
    if (!runTarget) {
      return;
    }
    if (!runAgentID.trim()) {
      message.warning(t('list.selectAgentWarning'));
      return;
    }

    setRunSubmitting(true);
    try {
      const launch = await benchmarkService.run(runTarget.id, {
        agent_id: runAgentID,
        priority: runPriority,
      });
      message.success(t('list.runSubmitted', { taskId: launch.dispatch.task_id }));
      closeRunModal();
    } catch (error) {
      logger.error('submit benchmark run from list failed', error);
    } finally {
      setRunSubmitting(false);
    }
  }, [closeRunModal, runAgentID, runPriority, runTarget]);

  const handleDelete = useCallback((record: BenchmarkTableRecord) => {
    Modal.confirm({
      title: t('list.deleteTitle'),
      content: t('list.deleteContent', { name: record.name }),
      okText: t('list.delete'),
      okType: 'danger',
      cancelText: t('list.cancel'),
      onOk: async () => {
        try {
          await benchmarkService.delete(record.id);
          message.success(t('list.deleteSuccess'));
          fetchBenchmarks(page);
        } catch {
          message.error(t('list.deleteFailed'));
        }
        logger.userAction('delete_benchmark', { id: record.id });
      },
    });
  }, [fetchBenchmarks, page, t]);

  const handleRefresh = useCallback(() => {
    fetchBenchmarks(page);
  }, [fetchBenchmarks, page]);

  const handleCreate = useCallback(() => {
    logger.userAction('click_create_benchmark');
    navigate('/benchmarks/create');
  }, [navigate]);

  const handleClearFilters = useCallback(() => {
    setFilters({});
  }, []);

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
    logger.userAction('change_view_mode', { mode });
  }, []);

  const StatCard = ({ title, value, color }: { title: string; value: number; color: string }) => (
    <div style={statCardStyle}>
      <Text style={{ fontSize: 13, ...secondaryText }}>
        {title}
      </Text>
      <div style={{ fontSize: 28, fontWeight: 700, color, marginTop: 4 }}>
        {value}
      </div>
    </div>
  );

  const SkeletonCard = () => (
    <div style={{
      ...statCardStyle,
      padding: '20px',
      height: 180,
    }}>
      <Skeleton.Node style={{ width: 48, height: 48, marginBottom: 16 }} active />
      <Skeleton.Input style={{ width: '80%', marginBottom: 8 }} active />
      <Skeleton.Input style={{ width: '60%' }} active />
    </div>
  );

  return (
    <div style={pageContainerStyle}>
      <PageHeader
        title={t('title')}
        description={t('list.pageDescription')}
        extra={
          <Space>
            <Button
              size="large"
              icon={<ImportOutlined />}
              onClick={() => navigate('/import')}
            >
              {t('list.dataImport')}
            </Button>
            <Button
              size="large"
              icon={<BranchesOutlined />}
              onClick={() => navigate('/benchmarks/my-forks')}
            >
              {t('list.myFork')}
            </Button>
            <Button type="primary" size="large" icon={<PlusOutlined />} onClick={handleCreate}>
              {t('list.create')}
            </Button>
          </Space>
        }
      />

      {/* Stats overview */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <StatCard title={t('list.statTotal')} value={stats.total} color={tokens.text.primary} />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard title={t('list.statActive')} value={stats.active} color={tokens.status.success} />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard title={t('list.statDraft')} value={stats.draft} color={tokens.status.warning} />
        </Col>
      </Row>

      {/* Filters */}
      <BenchmarkFilters filters={filters} onFiltersChange={setFilters} onRefresh={handleRefresh} />

      {/* Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
        }}
      >
        <Space>
          <Text style={{ fontSize: 14, ...secondaryText }}>
            {t('list.totalCount', { total })}
          </Text>
        </Space>
        <Space>
          <Button
            type={viewMode === 'grid' ? 'primary' : 'default'}
            icon={<AppstoreOutlined />}
            onClick={() => handleViewModeChange('grid')}
          >
            {t('list.grid')}
          </Button>
          <Button
            type={viewMode === 'list' ? 'primary' : 'default'}
            icon={<UnorderedListOutlined />}
            onClick={() => handleViewModeChange('list')}
          >
            {t('list.listMode')}
          </Button>
          <Dropdown menu={{ items: sortMenuItems, onClick: handleSortChange }}>
            <Button icon={<SortAscendingOutlined />}>{t('list.sort')}</Button>
          </Dropdown>
        </Space>
      </div>

      {/* Content */}
      {loading ? (
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={i}>
              <SkeletonCard />
            </Col>
          ))}
        </Row>
      ) : sortedBenchmarks.length === 0 ? (
        <EmptyPage
          type="no-result"
          actionText={t('list.clearFilters')}
          onAction={handleClearFilters}
        />
      ) : viewMode === 'grid' ? (
        <Row gutter={[16, 16]}>
          {sortedBenchmarks.map((benchmark, index) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={benchmark.id}>
              <BenchmarkCard {...benchmark} delay={index * 50} />
            </Col>
          ))}
        </Row>
      ) : (
        <BenchmarkTable
          dataSource={tableData}
          onEdit={handleEdit}
          onFork={handleFork}
          onExecute={handleExecute}
          onDelete={handleDelete}
        />
      )}

      <Modal
        title={runTarget ? t('list.runModalTitle', { name: runTarget.name }) : t('list.runModalDefaultTitle')}
        open={runModalOpen}
        onCancel={closeRunModal}
        onOk={() => void handleSubmitRun()}
        okText={t('list.submitRun')}
        cancelText={t('list.cancel')}
        confirmLoading={runSubmitting}
        okButtonProps={{ disabled: runAgentsLoading || runAgents.length === 0 }}
        destroyOnHidden
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Alert
            showIcon
            type="info"
            message={t('list.runModalInfoMessage')}
            description={t('list.runModalInfoDescription')}
          />

          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>{t('list.selectAgent')}</div>
            <Select
              style={{ width: '100%' }}
              placeholder={runAgentsLoading ? t('list.loadingAgent') : t('list.selectAgentPlaceholder')}
              loading={runAgentsLoading}
              value={runAgentID || undefined}
              onChange={setRunAgentID}
              options={runAgents.map((agent) => ({
                value: agent.id,
                label: agent.display_name || agent.name,
              }))}
              notFoundContent={runAgentsLoading ? t('list.loading') : t('list.noActiveAgent')}
            />
          </div>

          <div>
            <div style={{ marginBottom: 8, fontWeight: 500 }}>{t('list.priority')}</div>
            <Select
              style={{ width: '100%' }}
              value={runPriority}
              onChange={(value) => setRunPriority(value as BenchmarkRunPriority)}
              options={priorityOptions}
            />
          </div>
        </Space>
      </Modal>
    </div>
  );
}
