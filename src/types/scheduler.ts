/**
 * 调度相关类型定义
 */

/**
 * 调度任务状态
 */
export type SchedulerStatus = 'active' | 'paused' | 'disabled' | 'archived';

/**
 * 调度任务执行状态
 */
export type SchedulerExecutionStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

/**
 * 调度频率类型
 */
export type ScheduleFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'cron';

/**
 * 调度任务
 */
export interface Scheduler {
  id: string;
  name: string;
  description?: string;
  status: SchedulerStatus;
  frequency: ScheduleFrequency;
  cronExpression?: string;
  timezone: string;
  nextRunAt?: Date;
  lastRunAt?: Date;
  lastExecutionStatus?: SchedulerExecutionStatus;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  executionCount: number;
  failureCount: number;
  successRate: number;
}

/**
 * 调度任务详情
 */
export interface SchedulerDetail extends Scheduler {
  config: SchedulerConfig;
  history: SchedulerExecution[];
}

/**
 * 调度配置
 */
export interface SchedulerConfig {
  benchmarkId: string;
  agentIds: string[];
  settings: {
    timeout: number;
    maxRetries: number;
    priority: 'low' | 'normal' | 'high';
  };
  notification: {
    onSuccess: boolean;
    onFailure: boolean;
    emails: string[];
  };
}

/**
 * 调度执行记录
 */
export interface SchedulerExecution {
  id: string;
  schedulerId: string;
  status: SchedulerExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  results?: Array<{
    agentId: string;
    agentName: string;
    executionId?: string;
    score?: number;
    error?: string;
  }>;
  error?: string;
}

/**
 * 调度列表查询参数
 */
export interface SchedulerListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: SchedulerStatus[];
  frequency?: ScheduleFrequency[];
  sortBy?: 'nextRunAt' | 'lastRunAt' | 'name' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 调度列表响应
 */
export interface SchedulerListResponse {
  list: Scheduler[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 创建调度任务请求
 */
export interface CreateSchedulerRequest {
  name: string;
  description?: string;
  frequency: ScheduleFrequency;
  cronExpression?: string;
  timezone: string;
  startDate?: Date;
  endDate?: Date;
  config: SchedulerConfig;
}

/**
 * 更新调度任务请求
 */
export interface UpdateSchedulerRequest {
  name?: string;
  description?: string;
  frequency?: ScheduleFrequency;
  cronExpression?: string;
  timezone?: string;
  status?: SchedulerStatus;
  config?: Partial<SchedulerConfig>;
}

/**
 * 调度任务操作
 */
export type SchedulerAction = 'pause' | 'resume' | 'trigger_now' | 'delete';
