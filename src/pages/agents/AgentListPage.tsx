import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  Alert,
  Button,
  Card,
  Dropdown,
  Input,
  Popconfirm,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { MenuProps } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { MoreOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { agentPageService } from './service';
import {
  AGENT_STATUS_COLORS,
  AGENT_STATUS_LABELS,
  AGENT_STATUS_OPTIONS,
  AGENT_TYPE_LABELS,
  AGENT_TYPE_OPTIONS,
  formatDurationMs,
  formatSuccessRate,
  getAgentSubtitle,
  getAgentTitle,
} from './helpers';
import { useAgentPageStore, useAgentSummary } from './store';
import { useIsDark, useThemeTokens, type ThemeTokens } from '@/theme';
import type { Agent, AgentStatus } from '@/types/api/agent';

const { Search } = Input;
const { Text, Title } = Typography;

type AgentListStyles = Record<
  | 'page'
  | 'container'
  | 'header'
  | 'title'
  | 'panelCard'
  | 'tableCard'
  | 'summaryBar'
  | 'errorText',
  CSSProperties
>;

function buildStatusMenu(
  currentStatus: AgentStatus,
  onChange: (status: AgentStatus) => void,
): MenuProps['items'] {
  return (Object.keys(AGENT_STATUS_LABELS) as AgentStatus[]).map((status) => ({
    key: status,
    label: AGENT_STATUS_LABELS[status],
    disabled: status === currentStatus,
    onClick: () => onChange(status),
  }));
}

export function AgentListPage() {
  const { t } = useTranslation('agents');
  const navigate = useNavigate();
  const tokens = useThemeTokens();
  const isDark = useIsDark();
  const styles = useMemo(() => createAgentListStyles(tokens, isDark), [isDark, tokens]);

  const agents = useAgentPageStore((state) => state.agents);
  const filters = useAgentPageStore((state) => state.filters);
  const page = useAgentPageStore((state) => state.page);
  const pageSize = useAgentPageStore((state) => state.pageSize);
  const totalCount = useAgentPageStore((state) => state.totalCount);
  const listLoading = useAgentPageStore((state) => state.listLoading);
  const error = useAgentPageStore((state) => state.error);
  const fetchAgents = useAgentPageStore((state) => state.fetchAgents);
  const setFilters = useAgentPageStore((state) => state.setFilters);
  const setPage = useAgentPageStore((state) => state.setPage);
  const deleteAgent = useAgentPageStore((state) => state.deleteAgent);
  const updateAgentStatus = useAgentPageStore((state) => state.updateAgentStatus);
  const summary = useAgentSummary();

  const [searchValue, setSearchValue] = useState(filters.keyword ?? '');
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [restoringDefault, setRestoringDefault] = useState(false);

  const handleRestoreDefault = async () => {
    setRestoringDefault(true);
    try {
      await agentPageService.restoreDefault();
      message.success('默认 Agent 已恢复（如系统未配置模板则不会创建）');
      await fetchAgents();
    } catch (err) {
      message.error('恢复失败: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setRestoringDefault(false);
    }
  };

  useEffect(() => {
    void fetchAgents();
  }, [fetchAgents, filters, page, pageSize]);

  useEffect(() => {
    setSearchValue(filters.keyword ?? '');
  }, [filters.keyword]);

  async function handleSync(agentId: string) {
    try {
      setSyncingId(agentId);
      await agentPageService.syncToRegistry(agentId);
      message.success(t('actions.synced'));
    } finally {
      setSyncingId(null);
    }
  }

  async function handleStatusChange(agentId: string, status: AgentStatus) {
    try {
      setStatusUpdatingId(agentId);
      await updateAgentStatus(agentId, status);
      message.success(t('actions.updated'));
    } finally {
      setStatusUpdatingId(null);
    }
  }

  async function handleDelete(agentId: string) {
    await deleteAgent(agentId);
    message.success(t('actions.deleted'));
  }

  const columns: ColumnsType<Agent> = [
    {
      title: 'Agent',
      dataIndex: 'name',
      key: 'name',
      render: (_value, record) => (
        <div>
          <div style={{ fontWeight: 600 }}>{getAgentTitle(record)}</div>
          {getAgentSubtitle(record) ? (
            <Text type="secondary" style={{ fontSize: 12 }}>
              {getAgentSubtitle(record)}
            </Text>
          ) : null}
        </div>
      ),
    },
    {
      title: t('table.type'),
      key: 'type',
      width: 120,
      render: (_value, record) => AGENT_TYPE_LABELS[record.type],
    },
    {
      title: t('table.modelRuntime'),
      key: 'runtime',
      render: (_value, record) => (
        <Space size={[6, 6]} wrap>
          {record.model_config?.provider ? <Tag>{record.model_config.provider}</Tag> : null}
          {record.model_config?.model_name ? <Tag color="blue">{record.model_config.model_name}</Tag> : null}
          {record.model_config?.runtime_mode ? <Tag color="purple">{record.model_config.runtime_mode}</Tag> : null}
          {record.model_config?.tool_profile ? <Tag color="cyan">{record.model_config.tool_profile}</Tag> : null}
        </Space>
      ),
    },
    {
      title: t('table.status'),
      key: 'status',
      width: 120,
      render: (_value, record) => (
        <Space size={4} wrap>
          <Tag color={AGENT_STATUS_COLORS[record.status]}>
            {AGENT_STATUS_LABELS[record.status]}
          </Tag>
          {record.is_default && <Tag color="blue">默认</Tag>}
        </Space>
      ),
    },
    {
      title: t('table.stats'),
      key: 'stats',
      width: 220,
      render: (_value, record) => (
        <div>
          <div>{record.total_executions}</div>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatSuccessRate(record.success_rate)} · {formatDurationMs(record.avg_duration)}
          </Text>
        </div>
      ),
    },
    {
      title: t('table.apiKey'),
      key: 'has_api_key',
      width: 100,
      render: (_value, record) =>
        record.has_api_key ? <Tag color="gold">{t('configured')}</Tag> : <Tag>{t('notConfigured')}</Tag>,
    },
    {
      title: t('table.updatedAt'),
      dataIndex: 'updated_at',
      key: 'updated_at',
      width: 180,
      render: (value: string) => new Date(value).toLocaleString(),
    },
    {
      title: t('table.action'),
      key: 'actions',
      fixed: 'right',
      width: 260,
      render: (_value, record) => (
        <Space wrap>
          <Button size="small" onClick={() => navigate(`/agents/${record.id}`)}>
            {t('common:actions.detail')}
          </Button>
          <Button size="small" onClick={() => navigate(`/agents/${record.id}/edit`)}>
            {t('common:actions.edit')}
          </Button>
          <Button
            size="small"
            loading={syncingId === record.id}
            onClick={() => void handleSync(record.id)}
          >
            {t('actions.sync')}
          </Button>
          <Dropdown
            menu={{ items: buildStatusMenu(record.status, (status) => void handleStatusChange(record.id, status)) }}
            trigger={['click']}
          >
            <Button size="small" loading={statusUpdatingId === record.id} icon={<MoreOutlined />}>
              {t('table.status')}
            </Button>
          </Dropdown>
          <Popconfirm
            title={t('actions.deleteConfirm')}
            description={t('actions.deleteDesc')}
            onConfirm={() => void handleDelete(record.id)}
          >
            <Button size="small" danger>
              {t('common:actions.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <Title level={3} style={styles.title}>
              {t('list.title')}
            </Title>
          </div>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={() => void fetchAgents()}>
              {t('common:actions.refresh')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/agents/create')}>
              {t('list.create')}
            </Button>
          </Space>
        </div>

        {!listLoading && !agents.some((a) => a.is_default) && (
          <Alert
            type="info"
            showIcon
            message="未发现默认 Agent"
            description="可点击右侧按钮恢复系统默认 Agent。如果 admin 未启用默认模板，恢复操作不会创建任何 agent。"
            action={
              <Button
                size="small"
                type="primary"
                loading={restoringDefault}
                onClick={() => void handleRestoreDefault()}
              >
                恢复默认 Agent
              </Button>
            }
          />
        )}

        <Card style={styles.panelCard}>
          <Space wrap style={styles.summaryBar}>
            <Statistic title={t('list.totalActive')} value={summary.activeLoadedCount} />
            <Statistic title={t('list.totalMaintained')} value={summary.maintainedLoadedCount} />
          </Space>
          <Space wrap>
            <Search
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onSearch={(value) => setFilters({ keyword: value || undefined })}
              placeholder={t('list.searchPlaceholder')}
              allowClear
              style={{ width: 240 }}
            />
            <Select
              placeholder={t('list.statusFilter')}
              allowClear
              style={{ width: 140 }}
              value={filters.status}
              onChange={(value) => setFilters({ status: value })}
              options={AGENT_STATUS_OPTIONS}
            />
            <Select
              placeholder={t('list.typeFilter')}
              allowClear
              style={{ width: 140 }}
              value={filters.types?.[0]}
              onChange={(value) => setFilters({ types: value ? [value] : undefined })}
              options={AGENT_TYPE_OPTIONS}
            />
            <Button
              onClick={() => {
                setSearchValue('');
                setFilters({ keyword: undefined, status: undefined, types: undefined });
              }}
            >
              {t('common:actions.reset')}
            </Button>
          </Space>
          {error ? (
            <Text type="danger" style={styles.errorText}>
              {error}
            </Text>
          ) : null}
        </Card>

        <Card style={styles.tableCard}>
          <Table<Agent>
            rowKey="id"
            loading={listLoading}
            columns={columns}
            dataSource={agents}
            scroll={{ x: 1280 }}
            pagination={{
              current: page,
              pageSize,
              total: totalCount,
              showSizeChanger: true,
              showTotal: (value) => t('common:pagination.total', { total: value }),
              onChange: (nextPage, nextPageSize) => setPage(nextPage, nextPageSize),
            }}
          />
        </Card>
      </div>
    </div>
  );
}

function createAgentListStyles(tokens: ThemeTokens, isDark: boolean): AgentListStyles {
  const panelShadow = isDark ? '0 12px 32px rgba(0, 0, 0, 0.24)' : '0 10px 28px rgba(15, 23, 42, 0.06)';

  return {
    page: {
      minHeight: '100%',
      padding: 24,
      background: tokens.bg.primary,
    },
    container: {
      maxWidth: 1400,
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 16,
      flexWrap: 'wrap',
    },
    title: {
      margin: 0,
      color: tokens.text.primary,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif',
    },
    panelCard: {
      borderRadius: 16,
      border: `1px solid ${tokens.border.default}`,
      background: tokens.bg.elevated,
      boxShadow: panelShadow,
    },
    tableCard: {
      borderRadius: 16,
      border: `1px solid ${tokens.border.default}`,
      background: tokens.bg.elevated,
      boxShadow: panelShadow,
    },
    summaryBar: {
      marginBottom: 16,
    },
    errorText: {
      display: 'block',
      marginTop: 12,
    },
  };
}

export default AgentListPage;
