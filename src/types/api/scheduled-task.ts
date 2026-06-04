export type ScheduledTaskStatus = 'active' | 'paused' | 'archived';
export type ScheduledTaskRunStatus =
  | 'pending'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';
export type ScheduledTaskScheduleType = 'cron' | 'interval' | 'once';
export type ScheduledTaskPriority = 'p0' | 'p1' | 'p2' | 'p3';
export type ScheduledTaskRetryStrategy = 'fixed' | 'linear' | 'exponential';

export interface ScheduleConfig {
  type: ScheduledTaskScheduleType;
  expression: string;
}

export interface ScheduledTaskTaskConfig {
  max_steps: number;
  timeout: number;
  priority: ScheduledTaskPriority;
}

export interface ScheduledTaskAgentConfig {
  temperature: number;
  max_tokens: number;
}

export interface ScheduledTaskExecutionConfig {
  agent_ids: string[];
  benchmark_ids: string[];
  task_config: ScheduledTaskTaskConfig;
  agent_config: ScheduledTaskAgentConfig;
}

export interface ScheduledTaskRetryConfig {
  enabled: boolean;
  max_attempts: number;
  backoff_strategy: ScheduledTaskRetryStrategy;
  initial_backoff: number;
  max_backoff: number;
}

export interface ScheduledTaskNotificationConfig {
  enabled: boolean;
  channels: string[];
  on_events: string[];
}

export interface ScheduledTask {
  id: string;
  name: string;
  description: string;
  schedule: ScheduleConfig;
  execution_config: ScheduledTaskExecutionConfig;
  retry: ScheduledTaskRetryConfig;
  notification: ScheduledTaskNotificationConfig;
  enabled: boolean;
  status: ScheduledTaskStatus;
  next_run_time?: string | null;
  last_run_time?: string | null;
  last_run_id?: string | null;
  last_run_status?: ScheduledTaskRunStatus | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface TaskRun {
  id: string;
  task_id: string;
  scheduled_time: string;
  started_at?: string | null;
  completed_at?: string | null;
  status: ScheduledTaskRunStatus;
  batch_id?: string | null;
  error?: string;
  retry_attempt: number;
  next_retry_time?: string | null;
  total_tasks: number;
  completed_tasks: number;
  failed_tasks: number;
  created_at: string;
}

export interface ScheduledTaskDetail extends ScheduledTask {
  runs: TaskRun[];
}

export interface CreateScheduledTaskRequest {
  name: string;
  description?: string;
  schedule: ScheduleConfig;
  execution_config: ScheduledTaskExecutionConfig;
  retry: ScheduledTaskRetryConfig;
  notification: ScheduledTaskNotificationConfig;
  enabled: boolean;
}

export interface UpdateScheduledTaskRequest {
  name?: string;
  description?: string;
  schedule?: ScheduleConfig;
  execution_config?: ScheduledTaskExecutionConfig;
  retry?: ScheduledTaskRetryConfig;
  notification?: ScheduledTaskNotificationConfig;
}

export interface UpdateTaskStatusRequest {
  enabled: boolean;
}

export interface ScheduledTaskListResponse {
  total: number;
  page: number;
  size: number;
  items: ScheduledTask[];
}

export interface TaskRunListResponse {
  total: number;
  page: number;
  size: number;
  items: TaskRun[];
}

export const CRON_FIELD_GUIDE = '\u79d2 \u5206 \u65f6 \u65e5 \u6708 \u5468';
export const CRON_PRESETS = [
  { label: '\u6bcf 5 \u5206\u949f', value: '0 */5 * * * *' },
  { label: '\u6bcf\u5c0f\u65f6', value: '0 0 * * * *' },
  { label: '\u6bcf 6 \u5c0f\u65f6', value: '0 0 */6 * * *' },
  { label: '\u5de5\u4f5c\u65e5 09:00', value: '0 0 9 * * 1-5' },
  { label: '\u6bcf\u5929 00:00', value: '0 0 0 * * *' },
  { label: '\u6bcf\u5468\u4e00 09:00', value: '0 0 9 * * 1' },
] as const;

export const SCHEDULED_TASK_STATUS_CONFIG = {
  active: { label: '\u8fd0\u884c\u4e2d', color: 'success' },
  paused: { label: '\u5df2\u6682\u505c', color: 'warning' },
  archived: { label: '\u5df2\u5f52\u6863', color: 'default' },
} as const;

export const SCHEDULED_TASK_RUN_STATUS_CONFIG = {
  pending: { label: '\u7b49\u5f85\u4e2d', color: 'default' },
  running: { label: '\u8fd0\u884c\u4e2d', color: 'processing' },
  completed: { label: '\u5df2\u5b8c\u6210', color: 'success' },
  failed: { label: '\u5931\u8d25', color: 'error' },
  cancelled: { label: '\u5df2\u53d6\u6d88', color: 'default' },
} as const;

export const SCHEDULED_TASK_PRIORITY_CONFIG = {
  p0: { label: 'P0', color: 'error' },
  p1: { label: 'P1', color: 'error' },
  p2: { label: 'P2', color: 'warning' },
  p3: { label: 'P3', color: 'default' },
} as const;

const CRON_TOKEN_PATTERN = /^[\d*/,\-?#A-Za-zL]+$/;
const NANOSECONDS_PER_SECOND = 1_000_000_000;

export function secondsToNanoseconds(value: number): number {
  return Math.max(0, Math.round(value * NANOSECONDS_PER_SECOND));
}

export function nanosecondsToSeconds(value?: number | null): number {
  if (!value || value <= 0) {
    return 0;
  }
  return Math.max(1, Math.round(value / NANOSECONDS_PER_SECOND));
}

export function isValidCronExpression(expression: string): boolean {
  const parts = expression.trim().split(/\s+/);
  return parts.length === 6 && parts.every((part) => CRON_TOKEN_PATTERN.test(part));
}

export function parseCronExpression(expression: string): string {
  const cron = expression.trim();
  if (!isValidCronExpression(cron)) {
    return cron;
  }

  if (cron === '0 */5 * * * *') {
    return '\u6bcf 5 \u5206\u949f';
  }
  if (cron === '0 0 * * * *') {
    return '\u6bcf\u5c0f\u65f6';
  }
  if (cron === '0 0 */6 * * *') {
    return '\u6bcf 6 \u5c0f\u65f6';
  }
  if (cron === '0 0 0 * * *') {
    return '\u6bcf\u5929 00:00';
  }
  if (cron === '0 0 9 * * 1-5') {
    return '\u5de5\u4f5c\u65e5 09:00';
  }
  if (cron === '0 0 9 * * 1') {
    return '\u6bcf\u5468\u4e00 09:00';
  }

  const [second, minute, hour, dayOfMonth, month, dayOfWeek] = cron.split(/\s+/);
  if (second === '0' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
    return `\u6bcf\u5929 ${padTime(hour)}:${padTime(minute)}`;
  }

  return cron;
}

export function formatScheduleSummary(schedule: ScheduleConfig): string {
  if (schedule.type === 'cron') {
    return parseCronExpression(schedule.expression);
  }

  if (schedule.type === 'interval') {
    const seconds = Number(schedule.expression);
    return Number.isFinite(seconds) && seconds > 0
      ? `\u6bcf ${seconds} \u79d2\u6267\u884c`
      : `interval: ${schedule.expression}`;
  }

  return `\u5355\u6b21\u6267\u884c: ${schedule.expression}`;
}

function padTime(value: string): string {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return value;
  }
  return String(parsed).padStart(2, '0');
}
