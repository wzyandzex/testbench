import api from './api';
import type {
  CreateScheduledTaskRequest,
  ScheduledTask,
  ScheduledTaskAgentConfig,
  ScheduledTaskExecutionConfig,
  ScheduledTaskDetail,
  ScheduledTaskListResponse,
  ScheduledTaskNotificationConfig,
  ScheduledTaskPriority,
  ScheduledTaskRetryConfig,
  ScheduledTaskRetryStrategy,
  ScheduledTaskRunStatus,
  ScheduledTaskScheduleType,
  ScheduledTaskStatus,
  ScheduleConfig,
  TaskRun,
  TaskRunListResponse,
  UpdateScheduledTaskRequest,
} from '@/types/api/scheduled-task';

export interface ScheduledTaskListParams {
  page?: number;
  page_size?: number;
  enabled?: boolean;
  status?: ScheduledTaskStatus;
}

export interface ScheduledTaskRunsParams {
  page?: number;
  page_size?: number;
}

const EMPTY_RUNS_RESPONSE: TaskRunListResponse = {
  total: 0,
  page: 1,
  size: 10,
  items: [],
};

const SCHEDULE_TYPES = new Set<ScheduledTaskScheduleType>(['cron', 'interval', 'once']);
const TASK_STATUSES = new Set<ScheduledTaskStatus>(['active', 'paused', 'archived']);
const RUN_STATUSES = new Set<ScheduledTaskRunStatus>([
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled',
]);
const PRIORITIES = new Set<ScheduledTaskPriority>(['p0', 'p1', 'p2', 'p3']);
const RETRY_STRATEGIES = new Set<ScheduledTaskRetryStrategy>([
  'fixed',
  'linear',
  'exponential',
]);

async function resolveApiResult<T>(promise: Promise<unknown>): Promise<T> {
  return (await promise) as T;
}

function normalizePageResponse<T>(
  payload: unknown,
  fallbackSize: number
): {
  total: number;
  page: number;
  size: number;
  items: T[];
} {
  const response = payload && typeof payload === 'object' ? (payload as Record<string, unknown>) : {};
  const itemsFromData = Array.isArray(response.data) ? (response.data as T[]) : null;
  const itemsFromLegacy = Array.isArray(response.items) ? (response.items as T[]) : null;

  return {
    total: typeof response.total === 'number' ? response.total : 0,
    page: typeof response.page === 'number' ? response.page : 1,
    size: typeof response.size === 'number' ? response.size : fallbackSize,
    items: itemsFromData ?? itemsFromLegacy ?? [],
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function asEnum<T extends string>(value: unknown, allowed: Set<T>, fallback: T): T {
  return typeof value === 'string' && allowed.has(value as T) ? (value as T) : fallback;
}

function normalizeSchedule(value: unknown): ScheduleConfig {
  const schedule = asRecord(value);

  return {
    type: asEnum(schedule.type, SCHEDULE_TYPES, 'cron'),
    expression: asString(schedule.expression),
  };
}

function normalizeAgentConfig(value: unknown): ScheduledTaskAgentConfig {
  const config = asRecord(value);

  return {
    temperature: asNumber(config.temperature, 0.2),
    max_tokens: asNumber(config.max_tokens, 4096),
  };
}

function normalizeExecutionConfig(value: unknown): ScheduledTaskExecutionConfig {
  const config = asRecord(value);
  const taskConfig = asRecord(config.task_config);

  return {
    agent_ids: asStringArray(config.agent_ids),
    benchmark_ids: asStringArray(config.benchmark_ids),
    task_config: {
      max_steps: asNumber(taskConfig.max_steps, 10),
      timeout: asNumber(taskConfig.timeout, 300_000_000_000),
      priority: asEnum(taskConfig.priority, PRIORITIES, 'p2'),
    },
    agent_config: normalizeAgentConfig(config.agent_config),
  };
}

function normalizeRetry(value: unknown): ScheduledTaskRetryConfig {
  const retry = asRecord(value);

  return {
    enabled: asBoolean(retry.enabled),
    max_attempts: asNumber(retry.max_attempts, 3),
    backoff_strategy: asEnum(retry.backoff_strategy, RETRY_STRATEGIES, 'exponential'),
    initial_backoff: asNumber(retry.initial_backoff, 60_000_000_000),
    max_backoff: asNumber(retry.max_backoff, 600_000_000_000),
  };
}

function normalizeNotification(value: unknown): ScheduledTaskNotificationConfig {
  const notification = asRecord(value);

  return {
    enabled: asBoolean(notification.enabled),
    channels: asStringArray(notification.channels),
    on_events: asStringArray(notification.on_events),
  };
}

function normalizeScheduledTask(value: unknown): ScheduledTask {
  const task = asRecord(value);

  return {
    id: asString(task.id),
    name: asString(task.name),
    description: asString(task.description),
    schedule: normalizeSchedule(task.schedule),
    execution_config: normalizeExecutionConfig(task.execution_config),
    retry: normalizeRetry(task.retry),
    notification: normalizeNotification(task.notification),
    enabled: asBoolean(task.enabled),
    status: asEnum(task.status, TASK_STATUSES, 'active'),
    next_run_time: typeof task.next_run_time === 'string' ? task.next_run_time : null,
    last_run_time: typeof task.last_run_time === 'string' ? task.last_run_time : null,
    last_run_id: typeof task.last_run_id === 'string' ? task.last_run_id : null,
    last_run_status:
      typeof task.last_run_status === 'string'
        ? asEnum(task.last_run_status, RUN_STATUSES, 'pending')
        : null,
    created_by: asString(task.created_by),
    created_at: asString(task.created_at),
    updated_at: asString(task.updated_at),
  };
}

export const schedulerService = {
  getList: async (params: ScheduledTaskListParams = {}) => {
    const response = await resolveApiResult<unknown>(api.get('/scheduled-tasks', { params }));
    const page = normalizePageResponse<unknown>(
      response,
      params.page_size ?? EMPTY_RUNS_RESPONSE.size
    );

    return {
      ...page,
      items: page.items.map(normalizeScheduledTask),
    } as ScheduledTaskListResponse;
  },

  get: async (id: string) => {
    const response = await resolveApiResult<unknown>(
      api.get<ScheduledTask>(`/scheduled-tasks/${id}`)
    );
    return normalizeScheduledTask(response);
  },

  getDetail: async (
    id: string,
    runsParams: ScheduledTaskRunsParams = {}
  ): Promise<ScheduledTaskDetail> => {
    const [task, runs] = await Promise.all([
      schedulerService.get(id),
      schedulerService
        .getRuns(id, {
          page: runsParams.page ?? 1,
          page_size: runsParams.page_size ?? 10,
        })
        .catch(() => EMPTY_RUNS_RESPONSE),
    ]);

    return {
      ...task,
      runs: runs.items,
    };
  },

  create: async (data: CreateScheduledTaskRequest) => {
    const response = await resolveApiResult<unknown>(
      api.post<ScheduledTask>('/scheduled-tasks', data)
    );
    return normalizeScheduledTask(response);
  },

  update: async (id: string, data: UpdateScheduledTaskRequest) => {
    await resolveApiResult<void>(api.put<void>(`/scheduled-tasks/${id}`, data));
  },

  delete: async (id: string) => {
    await resolveApiResult<void>(api.delete<void>(`/scheduled-tasks/${id}`));
  },

  setEnabled: async (id: string, enabled: boolean) => {
    await resolveApiResult<void>(api.patch<void>(`/scheduled-tasks/${id}/status`, { enabled }));
  },

  trigger: async (id: string) => {
    return resolveApiResult<TaskRun>(api.post<TaskRun>(`/scheduled-tasks/${id}/trigger`, {}));
  },

  getRuns: async (id: string, params: ScheduledTaskRunsParams = {}) => {
    const response = await resolveApiResult<unknown>(
      api.get(`/scheduled-tasks/${id}/runs`, { params })
    );
    return normalizePageResponse<TaskRun>(
      response,
      params.page_size ?? EMPTY_RUNS_RESPONSE.size
    ) as TaskRunListResponse;
  },
};

export default schedulerService;
