import api from './api';
import type {
  DeadLetterEntry,
  DeadLetterListParams,
  DeadLetterListResponse,
  HistoryExportParams,
  Notification,
  NotificationAckStatus,
  NotificationAcknowledgeRequest,
  NotificationBulkAcknowledgeRequest,
  NotificationBulkAcknowledgeResult,
  NotificationListParams,
  NotificationListResponse,
  NotificationStats,
  NotificationType,
} from '@/types/notification';

type HistoryRecordPayload = {
  id: string;
  organization_id?: string;
  event_type: string;
  priority: string;
  task_id?: string;
  worker_id?: string;
  channel: string;
  message: string;
  status: string;
  error?: string;
  timestamp: string;
  retries: number;
  duration_ms: number;
  ack_status: NotificationAckStatus;
  acked_by?: string;
  acked_at?: string;
  ack_comment?: string;
  has_data?: boolean;
};

type HistoryListPayload = {
  total: number;
  page: number;
  page_size: number;
  records: HistoryRecordPayload[];
};

type HistoryStatsPayload = {
  total: number;
  by_status?: Record<string, number>;
  by_channel?: Record<string, number>;
  by_priority?: Record<string, number>;
  by_event_type?: Record<string, number>;
  by_ack_status?: Record<string, number>;
};

type PendingCountPayload = {
  count?: number;
};

type BulkAcknowledgePayload = {
  success_count?: number;
  failed_ids?: string[];
};

type DeadLetterEventPayload = {
  type?: string;
  priority?: string;
  timestamp: string;
  task_id?: string;
  worker_id?: string;
  message?: string;
  has_data?: boolean;
};

type DeadLetterEntryPayload = {
  id: string;
  source?: string;
  reason?: string;
  failed_at: string;
  event?: DeadLetterEventPayload;
};

type DeadLetterListPayload = {
  total: number;
  page: number;
  page_size: number;
  entries: DeadLetterEntryPayload[];
};

const eventWordMap: Record<string, string> = {
  ack: '确认',
  agent: 'Agent',
  alert: '告警',
  batch: '批次',
  benchmark: '基准',
  channel: '通道',
  completed: '完成',
  created: '创建',
  deadletter: '死信',
  delivery: '投递',
  error: '错误',
  execution: '执行',
  export: '导出',
  failed: '失败',
  health: '健康',
  import: '导入',
  job: '作业',
  notification: '通知',
  queue: '队列',
  reject: '拒绝',
  replay: '重放',
  retry: '重试',
  run: '运行',
  success: '成功',
  system: '系统',
  task: '任务',
  timeout: '超时',
  warning: '预警',
  worker: 'Worker',
};

function normalizeString(value?: string | null): string {
  return typeof value === 'string' ? value.trim() : '';
}

function toTitleCase(value: string): string {
  if (!value) {
    return '';
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatEventType(eventType: string): string {
  const normalized = normalizeString(eventType);
  if (!normalized) {
    return '通知事件';
  }

  const words = normalized
    .split(/[._-]+/)
    .map((part) => normalizeString(part).toLowerCase())
    .filter(Boolean)
    .map((part) => eventWordMap[part] ?? toTitleCase(part));

  return words.length > 0 ? words.join(' ') : normalized;
}

function inferNotificationTone(record: HistoryRecordPayload): NotificationType {
  const channel = normalizeString(record.channel).toLowerCase();
  const eventType = normalizeString(record.event_type).toLowerCase();
  const status = normalizeString(record.status).toLowerCase();

  if (channel === 'dlq' || status === 'failed' || /failed|error|panic|timeout|dead/.test(eventType)) {
    return 'error';
  }
  if (/warning|degraded|limit|retry/.test(eventType)) {
    return 'warning';
  }
  if (/success|completed|done|passed|healthy|replayed/.test(eventType)) {
    return 'success';
  }
  if (/system|maintenance|deploy|config/.test(eventType)) {
    return 'system';
  }
  return 'info';
}

function mapHistoryRecord(record: HistoryRecordPayload): Notification {
  const ackStatus = record.ack_status === 'acked' || record.ack_status === 'rejected' ? record.ack_status : 'pending';
  const title = formatEventType(record.event_type);

  return {
    id: record.id,
    organizationId: normalizeString(record.organization_id) || undefined,
    eventType: record.event_type,
    priority: normalizeString(record.priority) || 'normal',
    taskId: normalizeString(record.task_id) || undefined,
    workerId: normalizeString(record.worker_id) || undefined,
    channel: normalizeString(record.channel) || 'unknown',
    message: normalizeString(record.message),
    deliveryStatus: (normalizeString(record.status) || 'pending') as Notification['deliveryStatus'],
    error: normalizeString(record.error) || undefined,
    timestamp: record.timestamp,
    retries: Number(record.retries ?? 0),
    durationMs: Number(record.duration_ms ?? 0),
    ackStatus,
    ackedBy: normalizeString(record.acked_by) || undefined,
    ackedAt: normalizeString(record.acked_at) || undefined,
    ackComment: normalizeString(record.ack_comment) || undefined,
    hasData: Boolean(record.has_data),
    type: inferNotificationTone(record),
    status: ackStatus === 'pending' ? 'unread' : 'read',
    title,
    content: normalizeString(record.message),
    createdAt: record.timestamp,
    readAt: normalizeString(record.acked_at) || undefined,
    metadata: {
      hasData: Boolean(record.has_data),
    },
  };
}

function mapStats(payload: HistoryStatsPayload): NotificationStats {
  const byAckStatus = payload.by_ack_status ?? {};

  return {
    total: Number(payload.total ?? 0),
    pending: Number(byAckStatus.pending ?? 0),
    acknowledged: Number(byAckStatus.acked ?? 0),
    rejected: Number(byAckStatus.rejected ?? 0),
    byStatus: payload.by_status ?? {},
    byChannel: payload.by_channel ?? {},
    byPriority: payload.by_priority ?? {},
    byEventType: payload.by_event_type ?? {},
    byAckStatus,
  };
}

function mapDeadLetterEntry(entry: DeadLetterEntryPayload): DeadLetterEntry {
  const eventType = normalizeString(entry.event?.type);

  return {
    id: entry.id,
    source: normalizeString(entry.source) || undefined,
    reason: normalizeString(entry.reason) || undefined,
    failedAt: entry.failed_at,
    event: entry.event
      ? {
          type: eventType || undefined,
          priority: normalizeString(entry.event.priority) || undefined,
          timestamp: entry.event.timestamp,
          taskId: normalizeString(entry.event.task_id) || undefined,
          workerId: normalizeString(entry.event.worker_id) || undefined,
          message: normalizeString(entry.event.message) || undefined,
          hasData: Boolean(entry.event.has_data),
        }
      : undefined,
    title: eventType ? `${formatEventType(eventType)} 死信` : '死信事件',
    content: normalizeString(entry.reason) || normalizeString(entry.event?.message) || '等待人工处理的死信事件',
    type: 'dlq',
  };
}

function appendArray(searchParams: URLSearchParams, key: string, values?: Array<string | undefined>) {
  for (const value of values ?? []) {
    const normalized = normalizeString(value);
    if (normalized) {
      searchParams.append(key, normalized);
    }
  }
}

function appendValue(searchParams: URLSearchParams, key: string, value?: string | number) {
  if (value === undefined || value === null) {
    return;
  }
  const normalized = typeof value === 'number' ? String(value) : normalizeString(value);
  if (normalized) {
    searchParams.append(key, normalized);
  }
}

function buildHistoryQuery(params?: NotificationListParams | HistoryExportParams): string {
  const searchParams = new URLSearchParams();
  if (!params) {
    return '';
  }

  if ('page' in params) {
    appendValue(searchParams, 'page', params.page);
  }
  if ('pageSize' in params) {
    appendValue(searchParams, 'page_size', params.pageSize);
  }
  appendArray(searchParams, 'event_types', params.eventTypes);
  appendArray(searchParams, 'priorities', params.priorities);
  appendArray(searchParams, 'statuses', params.statuses);
  appendArray(searchParams, 'channels', params.channels);
  appendArray(searchParams, 'ack_statuses', params.ackStatuses);
  appendValue(searchParams, 'task_id', params.taskId);
  appendValue(searchParams, 'worker_id', params.workerId);
  appendValue(searchParams, 'start_time', params.startTime);
  appendValue(searchParams, 'end_time', params.endTime);
  appendValue(searchParams, 'search', params.search);
  appendValue(searchParams, 'sort_by', params.sortBy);
  appendValue(searchParams, 'sort_order', params.sortOrder);
  if ('format' in params) {
    appendValue(searchParams, 'format', params.format);
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function buildDeadLetterQuery(params?: DeadLetterListParams): string {
  const searchParams = new URLSearchParams();
  if (!params) {
    return '';
  }

  appendValue(searchParams, 'page', params.page);
  appendValue(searchParams, 'page_size', params.pageSize);
  appendValue(searchParams, 'task_id', params.taskId);
  appendValue(searchParams, 'worker_id', params.workerId);
  appendValue(searchParams, 'search', params.search);
  appendValue(searchParams, 'source', params.source);
  appendValue(searchParams, 'start_time', params.startTime);
  appendValue(searchParams, 'end_time', params.endTime);
  appendValue(searchParams, 'sort_order', params.sortOrder);

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

export const notificationService = {
  async getList(params: NotificationListParams = {}): Promise<NotificationListResponse> {
    const response = (await api.get(`/history${buildHistoryQuery(params)}`)) as HistoryListPayload;
    const list = Array.isArray(response.records) ? response.records.map(mapHistoryRecord) : [];

    return {
      list,
      total: Number(response.total ?? 0),
      unreadCount: list.filter((item) => item.ackStatus === 'pending').length,
      page: Number(response.page ?? params.page ?? 1),
      pageSize: Number(response.page_size ?? params.pageSize ?? 20),
    };
  },

  async getPendingCount(): Promise<number> {
    const response = (await api.get('/history/pending-count')) as PendingCountPayload;
    return Number(response.count ?? 0);
  },

  async getStats(): Promise<NotificationStats> {
    const response = (await api.get('/history/stats')) as HistoryStatsPayload;
    return mapStats(response);
  },

  async getDetail(id: string): Promise<Notification> {
    const response = (await api.get(`/history/${id}`)) as HistoryRecordPayload;
    return mapHistoryRecord(response);
  },

  async acknowledge(id: string, payload: NotificationAcknowledgeRequest = {}): Promise<void> {
    await api.put(`/history/${id}/acknowledge`, payload);
  },

  async reject(id: string, payload: NotificationAcknowledgeRequest = {}): Promise<void> {
    await api.put(`/history/${id}/reject`, payload);
  },

  async bulkAcknowledge(
    payload: NotificationBulkAcknowledgeRequest,
  ): Promise<NotificationBulkAcknowledgeResult> {
    const response = (await api.post('/history/bulk-acknowledge', payload)) as BulkAcknowledgePayload;

    return {
      successCount: Number(response.success_count ?? 0),
      failedIds: Array.isArray(response.failed_ids) ? response.failed_ids : [],
    };
  },

  async export(params: HistoryExportParams = {}): Promise<Blob> {
    return (await api.post(`/history/export${buildHistoryQuery(params)}`, undefined, {
      responseType: 'blob',
    })) as Blob;
  },

  async getDLQList(params: DeadLetterListParams = {}): Promise<DeadLetterListResponse> {
    const response = (await api.get(`/history/dlq${buildDeadLetterQuery(params)}`)) as DeadLetterListPayload;
    const entries = Array.isArray(response.entries) ? response.entries.map(mapDeadLetterEntry) : [];

    return {
      entries,
      total: Number(response.total ?? 0),
      page: Number(response.page ?? params.page ?? 1),
      pageSize: Number(response.page_size ?? params.pageSize ?? 20),
    };
  },

  async getDLQCount(): Promise<number> {
    const response = (await api.get('/history/dlq/stats')) as PendingCountPayload;
    return Number(response.count ?? 0);
  },

  async getDLQDetail(id: string): Promise<DeadLetterEntry> {
    const response = (await api.get(`/history/dlq/${id}`)) as DeadLetterEntryPayload;
    return mapDeadLetterEntry(response);
  },

  async replayDLQ(id: string): Promise<void> {
    await api.post(`/history/dlq/${id}/replay`);
  },

  async removeDLQ(id: string): Promise<void> {
    await api.delete(`/history/dlq/${id}`);
  },
};

export default notificationService;
