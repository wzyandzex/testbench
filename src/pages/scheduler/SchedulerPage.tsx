import { memo, useEffect, useMemo, useState } from 'react';
import {
  Breadcrumb,
  Button,
  Card,
  Col,
  Drawer,
  Empty,
  Input,
  Modal,
  Row,
  Segmented,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';
import { HomeOutlined, PlusOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '@/theme';
import { getGlobalStyles, getSchedulerTheme } from './theme';
import { schedulerPageService } from './service';
import CreateTaskModal from './components/CreateTaskModal';
import type {
  CreateScheduledTaskRequest,
  ScheduledTask,
  ScheduledTaskRunStatus,
  ScheduledTaskStatus,
  TaskRun,
  UpdateScheduledTaskRequest,
} from '@/types/api/scheduled-task';
import {
  SCHEDULED_TASK_PRIORITY_CONFIG,
  SCHEDULED_TASK_RUN_STATUS_CONFIG,
  SCHEDULED_TASK_STATUS_CONFIG,
  formatScheduleSummary,
} from '@/types/api/scheduled-task';
import type { SchedulerNotificationChannelOption, SchedulerResourceOption } from './service';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Search } = Input;
const { Text, Title } = Typography;

type ViewMode = 'cards' | 'table';
type StatusFilter = 'all' | ScheduledTaskStatus;
type EnabledFilter = 'all' | 'enabled' | 'disabled';

interface RunsState {
  task: ScheduledTask | null;
  items: TaskRun[];
  total: number;
  page: number;
  pageSize: number;
  loading: boolean;
}

const TASK_PAGE_SIZE = 100;

export const SchedulerPage = memo(function SchedulerPage() {
  const { t } = useTranslation('scheduler');
  const isDark = useIsDark();
  const theme = getSchedulerTheme(isDark);

  const [tasks, setTasks] = useState<ScheduledTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<ScheduledTask | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [enabledFilter, setEnabledFilter] = useState<EnabledFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [keyword, setKeyword] = useState('');
  const [agents, setAgents] = useState<SchedulerResourceOption[]>([]);
  const [benchmarks, setBenchmarks] = useState<SchedulerResourceOption[]>([]);
  const [channels, setChannels] = useState<SchedulerNotificationChannelOption[]>([]);
  const [runsState, setRunsState] = useState<RunsState>({
    task: null,
    items: [],
    total: 0,
    page: 1,
    pageSize: 10,
    loading: false,
  });

  useEffect(() => {
    void loadTasks(statusFilter, enabledFilter);
  }, [statusFilter, enabledFilter]);

  useEffect(() => {
    void loadCatalog();
  }, []);

  const agentMap = useMemo(() => new Map(agents.map((item) => [item.id, item.name])), [agents]);
  const benchmarkMap = useMemo(() => new Map(benchmarks.map((item) => [item.id, item.name])), [benchmarks]);

  const filteredTasks = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    if (!query) {
      return tasks;
    }

    return tasks.filter((task) => {
      const values = [
        task.name,
        task.description,
        task.schedule.expression,
        formatScheduleSummary(task.schedule),
        ...task.execution_config.agent_ids.map((id) => agentMap.get(id) || id),
        ...task.execution_config.benchmark_ids.map((id) => benchmarkMap.get(id) || id),
      ];

      return values.some((value) => value?.toLowerCase().includes(query));
    });
  }, [agentMap, benchmarkMap, keyword, tasks]);

  const stats = useMemo(
    () => ({
      total: tasks.length,
      enabled: tasks.filter((task) => task.enabled).length,
      paused: tasks.filter((task) => task.status === 'paused' || !task.enabled).length,
      notify: tasks.filter((task) => task.notification.enabled).length,
    }),
    [tasks]
  );

  const upcomingTasks = useMemo(
    () =>
      [...tasks]
        .filter((task) => task.enabled && task.status === 'active' && isFutureTime(task.next_run_time))
        .sort((left, right) => new Date(left.next_run_time || '').getTime() - new Date(right.next_run_time || '').getTime())
        .slice(0, 5),
    [tasks]
  );

  const columns = useMemo<ColumnsType<ScheduledTask>>(
    () => [
      {
        title: t('table.task'),
        key: 'name',
        render: (_value, task) => (
          <div>
            <Space wrap size={8}>
              <Text strong style={{ color: theme.textPrimary }}>{task.name}</Text>
              <StatusTag status={task.status} />
              {!task.enabled && task.status !== 'archived' ? <Tag>{t('filters.disabled')}</Tag> : null}
            </Space>
            {task.description ? <div style={{ marginTop: 4 }}><Text type="secondary">{task.description}</Text></div> : null}
          </div>
        ),
      },
      {
        title: t('table.schedule'),
        key: 'schedule',
        width: 220,
        render: (_value, task) => (
          <Space direction="vertical" size={4}>
            <Tag style={{ fontFamily: 'monospace', width: 'fit-content' }}>{task.schedule.expression}</Tag>
            <Text type="secondary">{formatScheduleSummary(task.schedule)}</Text>
          </Space>
        ),
      },
      {
        title: t('table.resource'),
        key: 'resource',
        width: 240,
        render: (_value, task) => (
          <Space direction="vertical" size={4}>
            <div>{renderNames(task.execution_config.benchmark_ids, benchmarkMap, t)}</div>
            <div>{renderNames(task.execution_config.agent_ids, agentMap, t)}</div>
          </Space>
        ),
      },
      {
        title: t('table.lastRun'),
        key: 'last',
        width: 170,
        render: (_value, task) => (
          <Space direction="vertical" size={0}>
            <Text type="secondary">{task.last_run_time ? dayjs(task.last_run_time).fromNow() : '-'}</Text>
            <div>{task.last_run_status ? <RunStatusTag status={task.last_run_status} /> : '-'}</div>
          </Space>
        ),
      },
      {
        title: t('table.nextRun'),
        dataIndex: 'next_run_time',
        key: 'next_run_time',
        width: 170,
        render: (value: string | null | undefined, task) =>
          renderNextRun(value, task, t),
      },
      {
        title: t('table.action'),
        key: 'action',
        width: 270,
        render: (_value, task) => (
          <Space wrap>
            <Button size="small" onClick={() => void openRuns(task)}>{t('actions.history')}</Button>
            <Button size="small" disabled={task.status === 'archived'} onClick={() => void handleTrigger(task)}>{t('actions.trigger')}</Button>
            <Button size="small" disabled={task.status === 'archived'} onClick={() => void handleToggle(task)}>
              {task.enabled ? t('actions.disable') : t('actions.enable')}
            </Button>
            <Button size="small" onClick={() => openEdit(task)}>{t('actions.edit')}</Button>
            <Button size="small" danger onClick={() => void handleDelete(task)}>{t('actions.remove')}</Button>
          </Space>
        ),
      },
    ],
    [agentMap, benchmarkMap, theme.textPrimary, t]
  );

  const runColumns = useMemo<ColumnsType<TaskRun>>(
    () => [
      { title: t('runColumns.status'), dataIndex: 'status', key: 'status', width: 110, render: (status: ScheduledTaskRunStatus) => <RunStatusTag status={status} /> },
      { title: t('runColumns.scheduled'), dataIndex: 'scheduled_time', key: 'scheduled_time', width: 170, render: (value: string) => dayjs(value).format('MM-DD HH:mm:ss') },
      {
        title: t('runColumns.lifecycle'),
        key: 'lifecycle',
        width: 220,
        render: (_value, run) => (
          <Space direction="vertical" size={0}>
            <Text type="secondary">{run.started_at ? dayjs(run.started_at).format('MM-DD HH:mm:ss') : '-'}</Text>
            <Text type="secondary">{run.completed_at ? dayjs(run.completed_at).format('MM-DD HH:mm:ss') : '-'}</Text>
          </Space>
        ),
      },
      {
        title: t('runColumns.result'),
        key: 'result',
        render: (_value, run) => (
          <Space direction="vertical" size={0}>
            <Text>{`${t('runColumns.totalTasks')}: ${run.total_tasks}`}</Text>
            <Text type="secondary">{`${t('runColumns.completed')} ${run.completed_tasks} / ${t('runColumns.failed')} ${run.failed_tasks}`}</Text>
          </Space>
        ),
      },
      {
        title: t('runColumns.retry'),
        key: 'retry',
        width: 180,
        render: (_value, run) => (
          <Space direction="vertical" size={0}>
            <Text>{`${run.retry_attempt} / ${t('runColumns.retry')}`}</Text>
            <Text type="secondary">{`${t('runColumns.nextRetry')}: ${run.next_retry_time ? dayjs(run.next_retry_time).format('MM-DD HH:mm:ss') : '-'}`}</Text>
          </Space>
        ),
      },
      { title: t('runColumns.error'), dataIndex: 'error', key: 'error', render: (value?: string) => value || '-' },
    ],
    [t]
  );

  async function loadTasks(nextStatus: StatusFilter, nextEnabled: EnabledFilter) {
    setLoading(true);
    try {
      const items: ScheduledTask[] = [];
      let page = 1;
      let total = 0;
      do {
        const response = await schedulerPageService.getList({
          page,
          page_size: TASK_PAGE_SIZE,
          ...(nextStatus !== 'all' ? { status: nextStatus } : {}),
          ...(nextEnabled !== 'all' ? { enabled: nextEnabled === 'enabled' } : {}),
        });
        items.push(...response.items);
        total = response.total;
        page += 1;
        if (response.items.length === 0) {
          break;
        }
      } while (items.length < total);
      setTasks(items);
    } catch {
      setTasks([]);
      message.error(t('messages.loadFail'));
    } finally {
      setLoading(false);
    }
  }

  async function loadCatalog() {
    setCatalogLoading(true);
    try {
      const catalog = await schedulerPageService.getCatalog();
      setAgents(catalog.agents);
      setBenchmarks(catalog.benchmarks);
      setChannels(catalog.notificationChannels);
    } catch {
      message.warning(t('messages.catalogFail'));
    } finally {
      setCatalogLoading(false);
    }
  }

  async function submitTask(payload: CreateScheduledTaskRequest) {
    try {
      if (editingTask) {
        await schedulerPageService.update(editingTask.id, toUpdatePayload(payload));
        message.success(t('messages.updateOk'));
      } else {
        await schedulerPageService.create(payload);
        message.success(t('messages.createOk'));
      }
      setModalOpen(false);
      setEditingTask(null);
      await loadTasks(statusFilter, enabledFilter);
    } catch {
      message.error(t('messages.actionFail'));
    }
  }

  function openEdit(task: ScheduledTask) {
    setEditingTask(task);
    setModalOpen(true);
  }

  async function handleToggle(task: ScheduledTask) {
    if (task.status === 'archived') {
      message.warning(t('messages.archivedBlocked'));
      return;
    }
    try {
      await schedulerPageService.setEnabled(task.id, !task.enabled);
      message.success(t('messages.toggleOk'));
      await loadTasks(statusFilter, enabledFilter);
    } catch {
      message.error(t('messages.actionFail'));
    }
  }

  async function handleTrigger(task: ScheduledTask) {
    if (task.status === 'archived') {
      message.warning(t('messages.archivedBlocked'));
      return;
    }
    try {
      await schedulerPageService.trigger(task.id);
      message.success(t('messages.triggerOk'));
      await openRuns(task);
      await loadTasks(statusFilter, enabledFilter);
    } catch {
      message.error(t('messages.actionFail'));
    }
  }

  async function handleDelete(task: ScheduledTask) {
    Modal.confirm({
      title: t('messages.deleteTitle'),
      content: `${t('messages.deleteText')}${task.name}`,
      okText: t('actions.remove'),
      okType: 'danger',
      cancelText: t('actions.cancel'),
      onOk: async () => {
        try {
          await schedulerPageService.delete(task.id);
          message.success(t('messages.deleteOk'));
          await loadTasks(statusFilter, enabledFilter);
          if (runsState.task?.id === task.id) {
            setRunsState((current) => ({ ...current, task: null, items: [], total: 0 }));
          }
        } catch {
          message.error(t('messages.actionFail'));
        }
      },
    });
  }

  async function openRuns(task: ScheduledTask, page = 1, pageSize = runsState.pageSize) {
    setRunsState((current) => ({ ...current, task, page, pageSize, loading: true }));
    try {
      const response = await schedulerPageService.getRuns(task.id, { page, page_size: pageSize });
      setRunsState({
        task,
        items: response.items,
        total: response.total,
        page: response.page,
        pageSize: response.size,
        loading: false,
      });
    } catch {
      setRunsState((current) => ({ ...current, task, items: [], total: 0, loading: false }));
      message.error(t('messages.actionFail'));
    }
  }

  return (
    <>
      <style>{getGlobalStyles(isDark)}</style>
      <div style={{ minHeight: '100%', padding: 24, background: theme.backgroundPattern || theme.background }}>
        <Breadcrumb style={{ marginBottom: 16 }} items={[{ href: '/', title: <HomeOutlined /> }, { title: t('page') }]} />

        <Card style={{ ...panelStyle(isDark, theme), marginBottom: 20 }} styles={{ body: { padding: 24 } }}>
          <Row gutter={[16, 16]} align="middle">
            <Col xs={24} xl={16}>
              <Title level={2} style={{ margin: 0, color: theme.textPrimary }}>{t('page')}</Title>
              <Text style={{ color: theme.textSecondary }}>{t('subtitle')}</Text>
            </Col>
            <Col xs={24} xl={8}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, flexWrap: 'wrap' }}>
                <Button icon={<ReloadOutlined />} onClick={() => void loadTasks(statusFilter, enabledFilter)}>{t('actions.refresh')}</Button>
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingTask(null); setModalOpen(true); }}>{t('actions.create')}</Button>
              </div>
            </Col>
          </Row>
        </Card>

        <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
          <Col xs={24} sm={12} xl={6}><MetricCard title={t('stats.total')} value={stats.total} accent={theme.accentCyan} isDark={isDark} /></Col>
          <Col xs={24} sm={12} xl={6}><MetricCard title={t('stats.enabled')} value={stats.enabled} accent={theme.accentAmber} isDark={isDark} /></Col>
          <Col xs={24} sm={12} xl={6}><MetricCard title={t('stats.paused')} value={stats.paused} accent={theme.accentMagenta} isDark={isDark} /></Col>
          <Col xs={24} sm={12} xl={6}><MetricCard title={t('stats.notify')} value={stats.notify} accent={theme.timelineProgress} isDark={isDark} /></Col>
        </Row>

        <Row gutter={[20, 20]}>
          <Col xs={24} xl={17}>
            <Card style={panelStyle(isDark, theme)} styles={{ body: { padding: 20 } }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
                <Space wrap>
                  <Search allowClear value={keyword} onChange={(event) => setKeyword(event.target.value)} placeholder={t('filters.search')} style={{ width: 320 }} />
                  <Select value={statusFilter} style={{ width: 140 }} onChange={(value: StatusFilter) => setStatusFilter(value)} options={[
                    { label: t('filters.all'), value: 'all' },
                    { label: t('filters.active'), value: 'active' },
                    { label: t('filters.paused'), value: 'paused' },
                    { label: t('filters.archived'), value: 'archived' },
                  ]} />
                  <Select value={enabledFilter} style={{ width: 140 }} onChange={(value: EnabledFilter) => setEnabledFilter(value)} options={[
                    { label: t('filters.all'), value: 'all' },
                    { label: t('filters.enabled'), value: 'enabled' },
                    { label: t('filters.disabled'), value: 'disabled' },
                  ]} />
                </Space>
                <Segmented<ViewMode> value={viewMode} onChange={(value) => setViewMode(value)} options={[
                  { label: t('filters.cards'), value: 'cards' },
                  { label: t('filters.table'), value: 'table' },
                ]} />
              </div>

              {filteredTasks.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('messages.noTasks')} style={{ padding: '48px 0' }} />
              ) : viewMode === 'cards' ? (
                <Row gutter={[16, 16]}>
                  {filteredTasks.map((task) => (
                    <Col xs={24} lg={12} key={task.id}>
                      <TaskCard task={task} theme={theme} benchmarkMap={benchmarkMap} agentMap={agentMap} onEdit={openEdit} onDelete={handleDelete} onOpenRuns={openRuns} onToggle={handleToggle} onTrigger={handleTrigger} />
                    </Col>
                  ))}
                </Row>
              ) : (
                <Table<ScheduledTask>
                  rowKey="id"
                  loading={loading}
                  dataSource={filteredTasks}
                  columns={columns}
                  pagination={{ defaultPageSize: 10, showSizeChanger: true, showTotal: (total) => `${t('table.totalLabel')} ${total} ${t('table.itemLabel')}` }}
                />
              )}
            </Card>
          </Col>

          <Col xs={24} xl={7}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Card style={panelStyle(isDark, theme)} styles={{ body: { padding: 18 } }}>
                <Text strong style={{ color: theme.textPrimary }}>{t('sidebar.upcoming')}</Text>
                <div style={{ marginTop: 14 }}>
                  {upcomingTasks.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('messages.noUpcoming')} /> : (
                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                      {upcomingTasks.map((task) => (
                        <div key={task.id} style={miniStyle(isDark, theme)}>
                          <Space direction="vertical" size={2} style={{ width: '100%' }}>
                            <Space wrap size={8}>
                              <Text strong style={{ color: theme.textPrimary }}>{task.name}</Text>
                              <StatusTag status={task.status} />
                            </Space>
                            <Text type="secondary">{formatScheduleSummary(task.schedule)}</Text>
                            <Text type="secondary">{formatNextRunInline(task.next_run_time, task, t)}</Text>
                          </Space>
                        </div>
                      ))}
                    </Space>
                  )}
                </div>
              </Card>

              <Card style={panelStyle(isDark, theme)} styles={{ body: { padding: 18 } }}>
                <Text strong style={{ color: theme.textPrimary }}>{t('sidebar.channels')}</Text>
                <div style={{ marginTop: 14 }}>
                  {channels.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('messages.noChannels')} /> : (
                    <Space direction="vertical" size={10} style={{ width: '100%' }}>
                      {channels.map((channel) => (
                        <div key={channel.type} style={miniStyle(isDark, theme)}>
                          <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                            <Text strong style={{ color: theme.textPrimary }}>{channel.type}</Text>
                            <Tag color={channel.healthy ? 'success' : 'error'}>{channel.healthy ? t('filters.enabled') : t('filters.disabled')}</Tag>
                          </Space>
                        </div>
                      ))}
                    </Space>
                  )}
                </div>
              </Card>
            </Space>
          </Col>
        </Row>

        <CreateTaskModal open={modalOpen} onCancel={() => { setModalOpen(false); setEditingTask(null); }} onSubmit={submitTask} editingTask={editingTask} loadingResources={catalogLoading} agents={agents} benchmarks={benchmarks} notificationChannels={channels} />

        <Drawer
          open={Boolean(runsState.task)}
          width={780}
          title={runsState.task ? `${runsState.task.name} / ${t('sidebar.runs')}` : t('sidebar.runs')}
          onClose={() => setRunsState((current) => ({ ...current, task: null }))}
          extra={runsState.task ? <Button onClick={() => void openRuns(runsState.task!, runsState.page, runsState.pageSize)}>{t('actions.refresh')}</Button> : null}
        >
          <Table<TaskRun>
            rowKey="id"
            loading={runsState.loading}
            dataSource={runsState.items}
            columns={runColumns}
            pagination={{
              current: runsState.page,
              pageSize: runsState.pageSize,
              total: runsState.total,
              showSizeChanger: true,
              showTotal: (total) => `${t('table.totalLabel')} ${total} ${t('table.itemLabel')}`,
            }}
            onChange={(pagination: TablePaginationConfig) => {
              if (!runsState.task) {
                return;
              }
              void openRuns(runsState.task, pagination.current ?? 1, pagination.pageSize ?? runsState.pageSize);
            }}
          />
        </Drawer>
      </div>
    </>
  );
});

export default SchedulerPage;

function TaskCard({
  task,
  theme,
  benchmarkMap,
  agentMap,
  onEdit,
  onDelete,
  onOpenRuns,
  onToggle,
  onTrigger,
}: {
  task: ScheduledTask;
  theme: ReturnType<typeof getSchedulerTheme>;
  benchmarkMap: Map<string, string>;
  agentMap: Map<string, string>;
  onEdit: (task: ScheduledTask) => void;
  onDelete: (task: ScheduledTask) => Promise<void>;
  onOpenRuns: (task: ScheduledTask) => Promise<void>;
  onToggle: (task: ScheduledTask) => Promise<void>;
  onTrigger: (task: ScheduledTask) => Promise<void>;
}) {
  const { t } = useTranslation('scheduler');
  return (
    <Card className="scheduler-card-enter" style={{ ...panelStyle(true, theme), height: '100%' }} styles={{ body: { display: 'flex', flexDirection: 'column', gap: 12 } }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <Space wrap size={8}>
            <Text strong style={{ color: theme.textPrimary }}>{task.name}</Text>
            <StatusTag status={task.status} />
            {!task.enabled && task.status !== 'archived' ? <Tag>{t('filters.disabled')}</Tag> : null}
            <Tag color={SCHEDULED_TASK_PRIORITY_CONFIG[task.execution_config.task_config.priority].color}>
              {SCHEDULED_TASK_PRIORITY_CONFIG[task.execution_config.task_config.priority].label}
            </Tag>
          </Space>
          {task.description ? <div style={{ marginTop: 6 }}><Text type="secondary">{task.description}</Text></div> : null}
        </div>
        <Button size="small" onClick={() => void onOpenRuns(task)}>{t('actions.history')}</Button>
      </div>

      <div>
        <Text type="secondary">{t('table.schedule')}</Text>
        <div style={{ marginTop: 6 }}>
          <Tag style={{ fontFamily: 'monospace' }}>{task.schedule.expression}</Tag>
          <Text style={{ color: theme.textSecondary }}>{formatScheduleSummary(task.schedule)}</Text>
        </div>
      </div>

      <div><Text type="secondary">Benchmark</Text><div style={{ marginTop: 6 }}>{renderNames(task.execution_config.benchmark_ids, benchmarkMap, t)}</div></div>
      <div><Text type="secondary">Agent</Text><div style={{ marginTop: 6 }}>{renderNames(task.execution_config.agent_ids, agentMap, t)}</div></div>

      <Row gutter={12}>
        <Col span={12}><Text type="secondary">{t('table.nextRun')}</Text><div style={{ marginTop: 4 }}>{formatNextRunRelative(task.next_run_time, task, t)}</div></Col>
        <Col span={12}><Text type="secondary">{t('table.lastRun')}</Text><div style={{ marginTop: 4 }}>{task.last_run_status ? <RunStatusTag status={task.last_run_status} /> : '-'}</div></Col>
      </Row>

      <Space wrap>
        {task.retry.enabled ? <Tag color="gold">{`${t('runColumns.retry')}: ${task.retry.max_attempts}`}</Tag> : null}
        {task.notification.enabled ? <Tag color="blue">{`${t('sidebar.channels')}: ${task.notification.channels.join(', ')}`}</Tag> : null}
      </Space>

      <Space wrap>
        <Button disabled={task.status === 'archived'} onClick={() => void onToggle(task)}>{task.enabled ? t('actions.disable') : t('actions.enable')}</Button>
        <Button disabled={task.status === 'archived'} icon={<ThunderboltOutlined />} onClick={() => void onTrigger(task)}>{t('actions.trigger')}</Button>
        <Button onClick={() => onEdit(task)}>{t('actions.edit')}</Button>
        <Button danger onClick={() => void onDelete(task)}>{t('actions.remove')}</Button>
      </Space>
    </Card>
  );
}

function MetricCard({ title, value, accent, isDark }: { title: string; value: number; accent: string; isDark: boolean }) {
  return (
    <Card style={{ borderRadius: 18, border: isDark ? '1px solid rgba(99,102,241,0.18)' : '1px solid rgba(148,163,184,0.18)', background: isDark ? 'rgba(15,23,42,0.72)' : '#fff' }}>
      <Statistic title={title} value={value} valueStyle={{ color: accent, fontWeight: 700 }} />
    </Card>
  );
}

function StatusTag({ status }: { status: ScheduledTaskStatus }) {
  const config = SCHEDULED_TASK_STATUS_CONFIG[status];
  return <Tag color={config.color}>{config.label}</Tag>;
}

function RunStatusTag({ status }: { status: ScheduledTaskRunStatus }) {
  const config = SCHEDULED_TASK_RUN_STATUS_CONFIG[status];
  return <Tag color={config.color}>{config.label}</Tag>;
}

function isFutureTime(value?: string | null) {
  return Boolean(value && dayjs(value).isValid() && dayjs(value).isAfter(dayjs()));
}

function formatNextRunInline(
  value: string | null | undefined,
  task: ScheduledTask,
  t: (key: string) => string
) {
  if (!task.enabled || task.status !== 'active') {
    return '-';
  }
  if (!value || !dayjs(value).isValid()) {
    return t('messages.nextRunPending');
  }
  if (!dayjs(value).isAfter(dayjs())) {
    return t('messages.nextRunStale');
  }
  return `${dayjs(value).format('MM-DD HH:mm:ss')} / ${dayjs(value).fromNow()}`;
}

function formatNextRunRelative(
  value: string | null | undefined,
  task: ScheduledTask,
  t: (key: string) => string
) {
  if (!task.enabled || task.status !== 'active') {
    return '-';
  }
  if (!value || !dayjs(value).isValid()) {
    return <Text type="secondary">{t('messages.nextRunPending')}</Text>;
  }
  if (!dayjs(value).isAfter(dayjs())) {
    return <Text type="warning">{t('messages.nextRunStale')}</Text>;
  }
  return dayjs(value).fromNow();
}

function renderNextRun(
  value: string | null | undefined,
  task: ScheduledTask,
  t: (key: string) => string
) {
  if (!task.enabled || task.status !== 'active') {
    return <Text type="secondary">-</Text>;
  }
  if (!value || !dayjs(value).isValid()) {
    return <Text type="secondary">{t('messages.nextRunPending')}</Text>;
  }
  if (!dayjs(value).isAfter(dayjs())) {
    return <Text type="warning">{t('messages.nextRunStale')}</Text>;
  }
  return (
    <Space direction="vertical" size={0}>
      <Text>{dayjs(value).format('MM-DD HH:mm:ss')}</Text>
      <Text type="secondary">{dayjs(value).fromNow()}</Text>
    </Space>
  );
}

function renderNames(ids: string[], nameMap: Map<string, string>, t: (key: string) => string) {
  if (ids.length === 0) {
    return <Text type="secondary">{t('runColumns.none')}</Text>;
  }
  const names = ids.map((id) => nameMap.get(id) || id);
  return (
    <Space wrap size={[4, 4]}>
      {names.slice(0, 2).map((name) => <Tag key={name}>{name}</Tag>)}
      {names.length > 2 ? <Tag>+{names.length - 2}</Tag> : null}
    </Space>
  );
}

function toUpdatePayload(payload: CreateScheduledTaskRequest): UpdateScheduledTaskRequest {
  return {
    name: payload.name,
    description: payload.description,
    schedule: payload.schedule,
    execution_config: payload.execution_config,
    retry: payload.retry,
    notification: payload.notification,
  };
}

function panelStyle(isDark: boolean, theme: ReturnType<typeof getSchedulerTheme>) {
  return {
    borderRadius: 22,
    border: `1px solid ${isDark ? theme.cardBorder : 'rgba(148,163,184,0.24)'}`,
    background: isDark ? theme.cardBg : '#ffffff',
    boxShadow: isDark ? theme.cardShadow : '0 14px 36px rgba(15,23,42,0.08)',
  };
}

function miniStyle(isDark: boolean, theme: ReturnType<typeof getSchedulerTheme>) {
  return {
    borderRadius: 16,
    padding: '12px 14px',
    background: isDark ? 'rgba(15,23,42,0.55)' : '#f8fafc',
    border: `1px solid ${isDark ? theme.cardBorder : 'rgba(148,163,184,0.22)'}`,
  };
}
