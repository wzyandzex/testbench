import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import {
  Alert,
  Button,
  Card,
  Collapse,
  Descriptions,
  Empty,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Typography,
  message,
} from 'antd';
import type { TableProps } from 'antd';
import {
  ArrowLeftOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  PlusOutlined,
  PlayCircleOutlined,
  RedoOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/common';
import {
  buildProjectEvalDetailPath,
  buildProjectEvalExplainPath,
  buildProjectEvalReportPath,
} from '@/pages/project-eval/links';
import { repairRunService } from '@/services/repair-run';
import { useThemeTokens } from '@/theme';
import type {
  CreateRepairRunRequest,
  RepairPlan,
  RepairRunSummary,
  RepairRunView,
} from '@/types/api/repair-run';
import { REPLAY_STATUS_CONFIG, RUN_STATE_CONFIG } from '@/types/api/repair-run';
import {
  buildRepairRunDetailPath,
  buildRepairRunListPath,
  buildRepairRunSearchParams,
  readRepairRunRouteContext,
  type RepairRunRouteContext,
} from './links';

const { Paragraph, Text, Title } = Typography;

const LIST_PAGE_SIZE = 10;

type RepairRunAction = {
  label: string;
  icon: ReactNode;
  action: () => Promise<unknown>;
  danger?: boolean;
};

function formatTimestamp(value?: string): string {
  if (!value) {
    return '-';
  }

  return value.slice(0, 19).replace('T', ' ');
}

function formatIdentifier(value?: string, visible = 12): string {
  if (!value) {
    return '-';
  }

  return value.length > visible ? `${value.slice(0, visible)}...` : value;
}

function renderIdentifierLink(value: string | undefined, onOpen: () => void) {
  if (!value?.trim()) {
    return '-';
  }

  return (
    <Button
      type="link"
      style={{ paddingInline: 0 }}
      onClick={(event) => {
        event.stopPropagation();
        onOpen();
      }}
    >
      {formatIdentifier(value)}
    </Button>
  );
}

function renderPlan(plan: RepairPlan | undefined, title: string) {
  if (!plan) {
    return null;
  }

  return (
    <Collapse
      items={[
        {
          key: title,
          label: <Text strong>{title}</Text>,
          children: (
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <Descriptions size="small" column={1} bordered>
                <Descriptions.Item label={i18next.t('repairRun:plan.version')}>{plan.version ?? '-'}</Descriptions.Item>
                <Descriptions.Item label="Plan hash">{plan.plan_hash || '-'}</Descriptions.Item>
                <Descriptions.Item label="Source execution">{plan.source_execution_id || '-'}</Descriptions.Item>
                <Descriptions.Item label={i18next.t('repairRun:plan.summary')}>{plan.summary || '-'}</Descriptions.Item>
                <Descriptions.Item label="Scope">
                  {plan.scope_paths?.length ? (
                    <Space wrap>
                      {plan.scope_paths.map((path) => (
                        <Tag key={path}>{path}</Tag>
                      ))}
                    </Space>
                  ) : (
                    '-'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label={i18next.t('repairRun:plan.risk')}>
                  {plan.risks?.length ? (
                    <Space wrap>
                      {plan.risks.map((risk) => (
                        <Tag color="orange" key={risk}>
                          {risk}
                        </Tag>
                      ))}
                    </Space>
                  ) : (
                    '-'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label={i18next.t('repairRun:plan.description')}>
                  {plan.notes?.length ? (
                    <Space direction="vertical" size={4}>
                      {plan.notes.map((note) => (
                        <Text key={note}>{note}</Text>
                      ))}
                    </Space>
                  ) : (
                    '-'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label={i18next.t('repairRun:plan.steps')}>
                  {plan.steps?.length ? (
                    <Space direction="vertical" size={4}>
                      {plan.steps.map((step, index) => (
                        <Text key={`${step.kind || 'step'}-${index}`}>
                          {index + 1}. {step.kind || 'step'} - {step.target || '-'} - {step.summary || '-'}
                        </Text>
                      ))}
                    </Space>
                  ) : (
                    '-'
                  )}
                </Descriptions.Item>
              </Descriptions>
            </Space>
          ),
        },
      ]}
    />
  );
}

export default function RepairRunPage() {
  const { t } = useTranslation('repairRun');
  const navigate = useNavigate();
  const tokens = useThemeTokens();
  const { id: routeRunID } = useParams<{ id?: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const routeContext = useMemo(() => readRepairRunRouteContext(searchParams), [searchParams]);
  const currentPage = routeContext.page ?? 1;
  const listRoutePath = useMemo(() => buildRepairRunListPath(routeContext), [routeContext]);

  const [runs, setRuns] = useState<RepairRunSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [listLoading, setListLoading] = useState(false);
  const [detailRun, setDetailRun] = useState<RepairRunView | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [agentID, setAgentID] = useState('');
  const [taskTitle, setTaskTitle] = useState('');
  const [taskObjective, setTaskObjective] = useState('');
  const draftAutoOpenKeyRef = useRef<string | null>(null);

  const updateRouteContext = useCallback(
    (updates: Partial<RepairRunRouteContext>, options?: { replace?: boolean }) => {
      const nextContext: RepairRunRouteContext = {
        ...routeContext,
        ...updates,
      };
      setSearchParams(buildRepairRunSearchParams(nextContext), options?.replace ? { replace: true } : undefined);
    },
    [routeContext, setSearchParams]
  );

  const clearCreateDraftContext = useCallback(() => {
    updateRouteContext({
      create: undefined,
      agent_id: undefined,
      task_title: undefined,
      task_objective: undefined,
    }, { replace: true });
  }, [updateRouteContext]);

  const createDraftKey = useMemo(
    () =>
      [
        routeRunID || '',
        routeContext.create ? '1' : '0',
        routeContext.project_eval_run_id || '',
        routeContext.replay_project_eval_run_id || '',
        routeContext.agent_id || '',
        routeContext.task_title || '',
        routeContext.task_objective || '',
      ].join('::'),
    [
      routeContext.agent_id,
      routeContext.create,
      routeContext.project_eval_run_id,
      routeContext.replay_project_eval_run_id,
      routeContext.task_objective,
      routeContext.task_title,
      routeRunID,
    ]
  );

  useEffect(() => {
    if (routeRunID || !routeContext.create) {
      draftAutoOpenKeyRef.current = null;
      return;
    }

    if (draftAutoOpenKeyRef.current === createDraftKey) {
      return;
    }

    draftAutoOpenKeyRef.current = createDraftKey;
    setCreateOpen(true);
    setAgentID(routeContext.agent_id ?? '');
    setTaskTitle(routeContext.task_title ?? '');
    setTaskObjective(routeContext.task_objective ?? '');
  }, [createDraftKey, routeContext.agent_id, routeContext.create, routeContext.task_objective, routeContext.task_title, routeRunID]);

  const openProjectEval = useCallback(
    (runID?: string) => {
      const path = buildProjectEvalDetailPath(runID);
      if (path) {
        navigate(path);
      }
    },
    [navigate]
  );

  const fetchList = useCallback(async () => {
    setListLoading(true);
    try {
      const response = await repairRunService.listRuns({
        page: currentPage,
        page_size: LIST_PAGE_SIZE,
        state: routeContext.state,
        project_eval_run_id: routeContext.project_eval_run_id,
        replay_project_eval_run_id: routeContext.replay_project_eval_run_id,
      });
      const payload = response as unknown as {
        items?: RepairRunSummary[];
        total?: number;
      };
      setRuns(Array.isArray(payload.items) ? payload.items : []);
      setTotal(typeof payload.total === 'number' ? payload.total : 0);
    } catch {
      setRuns([]);
      setTotal(0);
    } finally {
      setListLoading(false);
    }
  }, [currentPage, routeContext.project_eval_run_id, routeContext.replay_project_eval_run_id, routeContext.state]);

  const fetchDetail = useCallback(async () => {
    if (!routeRunID) {
      setDetailRun(null);
      setDetailError(null);
      return;
    }

    setDetailLoading(true);
    setDetailError(null);
    try {
      const response = await repairRunService.getRun(routeRunID);
      setDetailRun(response as unknown as RepairRunView);
    } catch {
      setDetailRun(null);
      setDetailError(t('detail.loadFailed'));
    } finally {
      setDetailLoading(false);
    }
  }, [routeRunID]);

  useEffect(() => {
    if (routeRunID) {
      return;
    }

    void fetchList();
  }, [fetchList, routeRunID]);

  useEffect(() => {
    if (!routeRunID) {
      setDetailRun(null);
      setDetailError(null);
      return;
    }

    void fetchDetail();
  }, [fetchDetail, routeRunID]);

  const handleCreate = useCallback(async () => {
    if (!agentID.trim()) {
      message.warning(t('actions.agentIdRequired'));
      return;
    }

    const payload: CreateRepairRunRequest = { agent_id: agentID.trim() };
    if (taskTitle.trim() || taskObjective.trim()) {
      payload.repair_task = {
        title: taskTitle.trim() || undefined,
        objective: taskObjective.trim() || undefined,
      };
    }

    setCreating(true);
    try {
      const createdRun = await repairRunService.createRun(payload);
      message.success(t('create.success'));
      setCreateOpen(false);
      setAgentID('');
      setTaskTitle('');
      setTaskObjective('');
      clearCreateDraftContext();
      navigate(
        buildRepairRunDetailPath(createdRun.data.id, {
          project_eval_run_id: routeContext.project_eval_run_id,
          replay_project_eval_run_id: routeContext.replay_project_eval_run_id,
        })
      );
    } catch (error: unknown) {
      const response = (error as { response?: { data?: { message?: string } } })?.response;
      message.error(response?.data?.message || t('create.failed'));
    } finally {
      setCreating(false);
    }
  }, [
    agentID,
    clearCreateDraftContext,
    navigate,
    routeContext.project_eval_run_id,
    routeContext.replay_project_eval_run_id,
    taskObjective,
    taskTitle,
  ]);

  const getActions = useCallback((run: RepairRunView | null): RepairRunAction[] => {
    if (!run) {
      return [];
    }

    const actions: RepairRunAction[] = [];
    if (run.state === 'created' || run.state === 'planning') {
      actions.push({
        label: t('actions.startPlanning'),
        icon: <PlayCircleOutlined />,
        action: () => repairRunService.startPlanning(run.id),
      });
    }
    if (run.state === 'approval_pending') {
      actions.push({
        label: t('actions.approvePlan'),
        icon: <CheckCircleOutlined />,
        action: () => repairRunService.approvePlan(run.id),
      });
    }
    if (run.state === 'approved' || run.state === 'applying') {
      actions.push({
        label: t('actions.startApply'),
        icon: <ThunderboltOutlined />,
        action: () => repairRunService.startApply(run.id),
      });
    }
    if (run.state === 'completed' && run.replay_status === 'not_requested' && run.project_eval_run_id) {
      actions.push({
        label: t('actions.requestReplay'),
        icon: <RedoOutlined />,
        action: () => repairRunService.requestReplay(run.id),
      });
    }
    if (run.state === 'failed' && run.retryable) {
      actions.push({
        label: run.last_failure_phase === 'planning' ? t('actions.retryPlanning') : t('actions.retryApply'),
        icon: <RedoOutlined />,
        action:
          run.last_failure_phase === 'planning'
            ? () => repairRunService.startPlanning(run.id)
            : () => repairRunService.startApply(run.id),
      });
    }
    if (!['completed', 'failed', 'cancelled'].includes(run.state)) {
      actions.push({
        label: t('actions.cancelRun'),
        icon: <CloseCircleOutlined />,
        action: () => repairRunService.cancelRun(run.id),
        danger: true,
      });
    }

    return actions;
  }, [t]);

  const handleAction = useCallback(
    async (action: () => Promise<unknown>, label: string) => {
      setActionLoading(true);
      try {
        await action();
        message.success(t('actions.completed', { label }));
        await fetchDetail();
      } catch (error: unknown) {
        const response = (error as { response?: { data?: { message?: string } } })?.response;
        message.error(response?.data?.message || t('actions.failed', { label }));
      } finally {
        setActionLoading(false);
      }
    },
    [fetchDetail, t]
  );

  const listColumns = useMemo<TableProps<RepairRunSummary>['columns']>(
    () => [
      {
        title: 'Run ID',
        dataIndex: 'id',
        key: 'id',
        width: 160,
        render: (value: string) =>
          renderIdentifierLink(value, () => navigate(buildRepairRunDetailPath(value, routeContext))),
      },
      {
        title: t('table.status'),
        dataIndex: 'state',
        key: 'state',
        width: 140,
        render: (value: string) => (
          <Tag color={RUN_STATE_CONFIG[value]?.color}>{RUN_STATE_CONFIG[value]?.label || value}</Tag>
        ),
      },
      {
        title: t('table.phase'),
        dataIndex: 'current_phase',
        key: 'current_phase',
        width: 140,
        render: (value?: string) => value || '-',
      },
      {
        title: 'Replay',
        dataIndex: 'replay_status',
        key: 'replay_status',
        width: 140,
        render: (value: string) => (
          <Tag color={REPLAY_STATUS_CONFIG[value]?.color}>{REPLAY_STATUS_CONFIG[value]?.label || value}</Tag>
        ),
      },
      {
        title: 'Project Eval',
        dataIndex: 'project_eval_run_id',
        key: 'project_eval_run_id',
        width: 180,
        render: (value?: string) => renderIdentifierLink(value, () => openProjectEval(value)),
      },
      {
        title: 'Replay Eval',
        dataIndex: 'replay_project_eval_run_id',
        key: 'replay_project_eval_run_id',
        width: 180,
        render: (value?: string) => renderIdentifierLink(value, () => openProjectEval(value)),
      },
      {
        title: t('table.updatedAt'),
        dataIndex: 'updated_at',
        key: 'updated_at',
        width: 180,
        render: (value?: string) => formatTimestamp(value),
      },
    ],
    [navigate, openProjectEval, routeContext, t]
  );

  const detailActions = useMemo(() => getActions(detailRun), [detailRun, getActions]);
  const sourceProjectEvalPath = detailRun ? buildProjectEvalDetailPath(detailRun.project_eval_run_id) : null;
  const replayProjectEvalPath = detailRun ? buildProjectEvalDetailPath(detailRun.replay_project_eval_run_id) : null;
  const replayProjectEvalReportPath = detailRun
    ? buildProjectEvalReportPath(detailRun.replay_project_eval_run_id)
    : null;
  const replayProjectEvalExplainPath = detailRun
    ? buildProjectEvalExplainPath(detailRun.replay_project_eval_run_id)
    : null;

  if (routeRunID) {
    return (
      <div style={{ padding: '0 24px 24px' }}>
        <PageHeader
          title="Repair Run"
          description={t('list.detailDesc')}
          breadcrumb={[
            { title: 'Dashboard' },
            { title: 'Repair Runs' },
            { title: routeRunID },
          ]}
          extra={
            <Space wrap>
              <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(listRoutePath)}>
                {t('actions.backToList')}
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => void fetchDetail()}>
                {t('actions.refresh')}
              </Button>
              {sourceProjectEvalPath && (
                <Button onClick={() => navigate(sourceProjectEvalPath)}>{t('actions.openSourceProjectEval')}</Button>
              )}
              {replayProjectEvalPath && (
                <Button onClick={() => navigate(replayProjectEvalPath)}>{t('actions.openReplayProjectEval')}</Button>
              )}
              {replayProjectEvalReportPath && (
                <Button onClick={() => navigate(replayProjectEvalReportPath)}>{t('actions.openReplayReport')}</Button>
              )}
              {replayProjectEvalExplainPath && (
                <Button onClick={() => navigate(replayProjectEvalExplainPath)}>{t('actions.openReplayExplain')}</Button>
              )}
            </Space>
          }
        />

        {(routeContext.project_eval_run_id || routeContext.replay_project_eval_run_id) && (
          <Alert
            type="info"
            showIcon
            style={{ marginBottom: 16 }}
            message={t('detail.continuityNotice')}
            description={
              <Space wrap>
                {routeContext.project_eval_run_id && (
                  <Tag color="blue">Project Eval: {routeContext.project_eval_run_id}</Tag>
                )}
                {routeContext.replay_project_eval_run_id && (
                  <Tag color="purple">Replay Eval: {routeContext.replay_project_eval_run_id}</Tag>
                )}
              </Space>
            }
          />
        )}

        {detailLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 96 }}>
            <Spin size="large" />
          </div>
        ) : detailError ? (
          <Alert type="error" showIcon message={detailError} />
        ) : !detailRun ? (
          <Card>
            <Empty description={t('list.noData')} />
          </Card>
        ) : (
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            <Card
              style={{
                borderColor: tokens.border.default,
                background: `linear-gradient(135deg, ${tokens.bg.secondary}, ${tokens.bg.primary})`,
              }}
            >
              <Space direction="vertical" size={16} style={{ width: '100%' }}>
                <Space wrap>
                  <Tag color={RUN_STATE_CONFIG[detailRun.state]?.color}>
                    {RUN_STATE_CONFIG[detailRun.state]?.label || detailRun.state}
                  </Tag>
                  <Tag color={REPLAY_STATUS_CONFIG[detailRun.replay_status]?.color}>
                    {REPLAY_STATUS_CONFIG[detailRun.replay_status]?.label || detailRun.replay_status}
                  </Tag>
                  {detailRun.current_phase && <Tag>{detailRun.current_phase}</Tag>}
                  {detailRun.dispatch_status && <Tag>{detailRun.dispatch_status}</Tag>}
                </Space>

                <div>
                  <Title level={3} style={{ marginBottom: 8 }}>
                    {formatIdentifier(detailRun.id, 18)}
                  </Title>
                  <Paragraph style={{ marginBottom: 0 }}>
                    {t('detail.urlHint')}
                  </Paragraph>
                </div>

                <Space wrap>
                  {detailActions.map((action) =>
                    action.danger ? (
                      <Popconfirm
                        key={action.label}
                        title={t('actions.confirmAction', { label: action.label })}
                        onConfirm={() => void handleAction(action.action, action.label)}
                        okText={t('actions.confirm')}
                        cancelText={t('actions.cancel')}
                      >
                        <Button danger icon={action.icon} loading={actionLoading}>
                          {action.label}
                        </Button>
                      </Popconfirm>
                    ) : (
                      <Button
                        key={action.label}
                        icon={action.icon}
                        loading={actionLoading}
                        onClick={() => void handleAction(action.action, action.label)}
                      >
                        {action.label}
                      </Button>
                    )
                  )}
                </Space>
              </Space>
            </Card>

            {detailRun.error && <Alert type="error" showIcon message={detailRun.error} />}

            <Card title={t('detail.lifecycle')}>
              <Descriptions size="small" column={2} bordered>
                <Descriptions.Item label="Run ID">{detailRun.id}</Descriptions.Item>
                <Descriptions.Item label="Agent ID">{detailRun.agent_id || '-'}</Descriptions.Item>
                <Descriptions.Item label={t('detail.status')}>
                  {RUN_STATE_CONFIG[detailRun.state]?.label || detailRun.state}
                </Descriptions.Item>
                <Descriptions.Item label={t('detail.currentPhase')}>{detailRun.current_phase || '-'}</Descriptions.Item>
                <Descriptions.Item label={t('detail.latestPlanVersion')}>
                  {detailRun.latest_plan_version ?? '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('detail.approvedPlanVersion')}>
                  {detailRun.approved_plan_version ?? '-'}
                </Descriptions.Item>
                <Descriptions.Item label={t('detail.dispatchStatus')}>{detailRun.dispatch_status || '-'}</Descriptions.Item>
                <Descriptions.Item label={t('detail.retryable')}>{detailRun.retryable ? t('bool.yes') : t('bool.no')}</Descriptions.Item>
                <Descriptions.Item label="Project Eval" span={2}>
                  {sourceProjectEvalPath ? (
                    <Space wrap>
                      <Button type="link" style={{ paddingInline: 0 }} onClick={() => navigate(sourceProjectEvalPath)}>
                        {detailRun.project_eval_run_id}
                      </Button>
                      <Button
                        size="small"
                        onClick={() =>
                          navigate(
                            buildRepairRunListPath({
                              project_eval_run_id: detailRun.project_eval_run_id,
                            })
                          )
                        }
                      >
                        {t('actions.openFilteredList')}
                      </Button>
                    </Space>
                  ) : (
                    '-'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="Replay Eval" span={2}>
                  {replayProjectEvalPath ? (
                    <Space wrap>
                      <Button type="link" style={{ paddingInline: 0 }} onClick={() => navigate(replayProjectEvalPath)}>
                        {detailRun.replay_project_eval_run_id}
                      </Button>
                      {replayProjectEvalReportPath && (
                        <Button size="small" onClick={() => navigate(replayProjectEvalReportPath)}>
                          {t('actions.openReplayReport')}
                        </Button>
                      )}
                      {replayProjectEvalExplainPath && (
                        <Button size="small" onClick={() => navigate(replayProjectEvalExplainPath)}>
                          {t('actions.openReplayExplain')}
                        </Button>
                      )}
                      <Button
                        size="small"
                        onClick={() =>
                          navigate(
                            buildRepairRunListPath({
                              replay_project_eval_run_id: detailRun.replay_project_eval_run_id,
                            })
                          )
                        }
                      >
                        {t('actions.openRelatedRepairs')}
                      </Button>
                    </Space>
                  ) : (
                    '-'
                  )}
                </Descriptions.Item>
                <Descriptions.Item label={t('detail.approvedBy')}>{detailRun.approved_by || '-'}</Descriptions.Item>
                <Descriptions.Item label={t('detail.approvedAt')}>{formatTimestamp(detailRun.approved_at)}</Descriptions.Item>
                <Descriptions.Item label={t('detail.createdAt')}>{formatTimestamp(detailRun.created_at)}</Descriptions.Item>
                <Descriptions.Item label={t('detail.updatedAt')}>{formatTimestamp(detailRun.updated_at)}</Descriptions.Item>
              </Descriptions>
            </Card>

            {detailRun.repair_task && (
              <Card title={t('detail.repairTaskCard')}>
                <Descriptions size="small" column={1} bordered>
                  <Descriptions.Item label={t('detail.taskTitle')}>{detailRun.repair_task.title || '-'}</Descriptions.Item>
                  <Descriptions.Item label={t('detail.taskGoal')}>
                    {detailRun.repair_task.objective || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Scope">
                    {detailRun.repair_task.scope_paths?.length ? (
                      <Space wrap>
                        {detailRun.repair_task.scope_paths.map((path) => (
                          <Tag key={path}>{path}</Tag>
                        ))}
                      </Space>
                    ) : (
                      '-'
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('detail.constraints')}>
                    {detailRun.repair_task.constraints?.length ? (
                      <Space direction="vertical" size={4}>
                        {detailRun.repair_task.constraints.map((constraint) => (
                          <Text key={constraint}>{constraint}</Text>
                        ))}
                      </Space>
                    ) : (
                      '-'
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {detailRun.trigger_snapshot && (
              <Card title={t('detail.triggerSnapshotCard')}>
                <Descriptions size="small" column={1} bordered>
                  <Descriptions.Item label={t('detail.triggerReason')}>
                    {detailRun.trigger_snapshot.trigger_reason || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('detail.summary')}>
                    {detailRun.trigger_snapshot.summary || '-'}
                  </Descriptions.Item>
                  <Descriptions.Item label="Scope">
                    {detailRun.trigger_snapshot.scope_paths?.length ? (
                      <Space wrap>
                        {detailRun.trigger_snapshot.scope_paths.map((path) => (
                          <Tag key={path}>{path}</Tag>
                        ))}
                      </Space>
                    ) : (
                      '-'
                    )}
                  </Descriptions.Item>
                  <Descriptions.Item label={t('detail.selectedCases')}>
                    {detailRun.trigger_snapshot.selected_cases?.length ? (
                      <Space wrap>
                        {detailRun.trigger_snapshot.selected_cases.map((selectedCase, index) => (
                          <Tag key={`${selectedCase.case_key || 'case'}-${index}`}>
                            {selectedCase.case_key || 'unknown case'}
                          </Tag>
                        ))}
                      </Space>
                    ) : (
                      '-'
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </Card>
            )}

            {renderPlan(detailRun.latest_plan_snapshot, t('detail.latestPlanLabel'))}
            {renderPlan(detailRun.approved_plan_snapshot, t('detail.approvedPlanLabel'))}
          </Space>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: '0 24px 24px' }}>
      <PageHeader
        title="Repair Runs"
        description={t('list.repairViewDesc')}
        breadcrumb={[{ title: 'Dashboard' }, { title: 'Repair Runs' }]}
        extra={
          <Space wrap>
            <Button icon={<ReloadOutlined />} onClick={() => void fetchList()}>
              {t('actions.refresh')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
              {t('create.title')}
            </Button>
          </Space>
        }
      />

      {(routeContext.project_eval_run_id || routeContext.replay_project_eval_run_id) ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('list.continuityFiltered')}
          description={
            <Space wrap>
              {routeContext.project_eval_run_id && (
                <>
                  <Tag color="blue">Project Eval: {routeContext.project_eval_run_id}</Tag>
                  <Button size="small" onClick={() => openProjectEval(routeContext.project_eval_run_id)}>
                    {t('actions.openSourceProjectEval')}
                  </Button>
                </>
              )}
              {routeContext.replay_project_eval_run_id && (
                <>
                  <Tag color="purple">Replay Eval: {routeContext.replay_project_eval_run_id}</Tag>
                  <Button size="small" onClick={() => openProjectEval(routeContext.replay_project_eval_run_id)}>
                    {t('actions.openReplayProjectEval')}
                  </Button>
                </>
              )}
              <Button
                size="small"
                onClick={() =>
                  updateRouteContext({
                    page: undefined,
                    project_eval_run_id: undefined,
                    replay_project_eval_run_id: undefined,
                  })
                }
              >
                {t('actions.clearContinuity')}
              </Button>
            </Space>
          }
        />
      ) : (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('list.hubNotice')}
          description={t('list.hubNoticeDesc')}
        />
      )}

      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap size={16}>
          <Space size={8}>
            <Text strong>{t('detail.status')}</Text>
            <Select
              allowClear
              placeholder={t('list.allStatus')}
              style={{ width: 180 }}
              value={routeContext.state}
              onChange={(value) => updateRouteContext({ state: value || undefined, page: undefined })}
              options={Object.entries(RUN_STATE_CONFIG).map(([value, config]) => ({
                value,
                label: config.label,
              }))}
            />
          </Space>
          <Text type="secondary">{t('list.filterShareHint')}</Text>
        </Space>
      </Card>

      <Card size="small">
        <Table<RepairRunSummary>
          rowKey="id"
          size="small"
          loading={listLoading}
          dataSource={runs}
          columns={listColumns}
          scroll={{ x: 1100 }}
          pagination={{
            current: currentPage,
            pageSize: LIST_PAGE_SIZE,
            total,
            onChange: (page) => updateRouteContext({ page }),
          }}
          onRow={(record) => ({
            onClick: () => navigate(buildRepairRunDetailPath(record.id, routeContext)),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>

      <Modal
        title={t('create.title')}
        open={createOpen}
        onCancel={() => {
          setCreateOpen(false);
          setAgentID('');
          setTaskTitle('');
          setTaskObjective('');
          clearCreateDraftContext();
        }}
        onOk={() => void handleCreate()}
        confirmLoading={creating}
        okText={t('create.okText')}
        cancelText={t('actions.cancel')}
      >
        <div data-testid="repair-run-create-modal">
          <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {(routeContext.project_eval_run_id || routeContext.replay_project_eval_run_id) && (
              <Alert
                type="info"
                showIcon
                message={t('create.prefilled')}
                description={(
                  <Space wrap>
                    {routeContext.project_eval_run_id && (
                      <Tag color="blue">Project Eval: {routeContext.project_eval_run_id}</Tag>
                    )}
                    {routeContext.replay_project_eval_run_id && (
                      <Tag color="purple">Replay Eval: {routeContext.replay_project_eval_run_id}</Tag>
                    )}
                  </Space>
                )}
              />
            )}
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                Agent ID
              </Text>
              <Input
                data-testid="repair-run-agent-id-input"
                placeholder="agent-id"
                value={agentID}
                onChange={(event) => setAgentID(event.target.value)}
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                {t('create.taskTitleLabel')}
              </Text>
              <Input
                data-testid="repair-run-task-title-input"
                placeholder={t('create.titlePlaceholder')}
                value={taskTitle}
                onChange={(event) => setTaskTitle(event.target.value)}
              />
            </div>
            <div>
              <Text strong style={{ display: 'block', marginBottom: 4 }}>
                {t('create.taskObjectiveLabel')}
              </Text>
              <Input.TextArea
                data-testid="repair-run-task-objective-input"
                rows={4}
                placeholder={t('create.goalPlaceholder')}
                value={taskObjective}
                onChange={(event) => setTaskObjective(event.target.value)}
              />
            </div>
          </Space>
        </div>
      </Modal>
    </div>
  );
}
