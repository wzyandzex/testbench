export type NotificationType =
  | 'info'
  | 'success'
  | 'warning'
  | 'error'
  | 'execution_completed'
  | 'execution_failed'
  | 'benchmark_created'
  | 'agent_created'
  | 'system'
  | 'dlq'
  | (string & {});

export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent' | (string & {});

export type NotificationStatus = 'unread' | 'read' | 'archived';

export type NotificationAckStatus = 'pending' | 'acked' | 'rejected';

export type NotificationDeliveryStatus = 'pending' | 'sent' | 'failed' | 'dropped' | (string & {});

export interface Notification {
  id: string;
  organizationId?: string;
  eventType: string;
  priority: NotificationPriority;
  taskId?: string;
  workerId?: string;
  channel: string;
  message: string;
  deliveryStatus: NotificationDeliveryStatus;
  error?: string;
  timestamp: string;
  retries: number;
  durationMs: number;
  ackStatus: NotificationAckStatus;
  ackedBy?: string;
  ackedAt?: string;
  ackComment?: string;
  hasData: boolean;
  type: NotificationType;
  status: NotificationStatus;
  title: string;
  content: string;
  createdAt: string;
  readAt?: string;
  link?: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationListParams {
  page?: number;
  pageSize?: number;
  eventTypes?: string[];
  priorities?: string[];
  statuses?: string[];
  channels?: string[];
  ackStatuses?: NotificationAckStatus[];
  taskId?: string;
  workerId?: string;
  startTime?: string;
  endTime?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface NotificationListResponse {
  list: Notification[];
  total: number;
  unreadCount: number;
  page: number;
  pageSize: number;
}

export interface NotificationStats {
  total: number;
  pending: number;
  acknowledged: number;
  rejected: number;
  byStatus: Record<string, number>;
  byChannel: Record<string, number>;
  byPriority: Record<string, number>;
  byEventType: Record<string, number>;
  byAckStatus: Record<string, number>;
}

export interface NotificationAcknowledgeRequest {
  comment?: string;
}

export interface NotificationBulkAcknowledgeRequest {
  ids: string[];
  comment?: string;
}

export interface NotificationBulkAcknowledgeResult {
  successCount: number;
  failedIds: string[];
}

export type HistoryExportFormat = 'json' | 'csv';

export interface HistoryExportParams extends Omit<NotificationListParams, 'page' | 'pageSize'> {
  format?: HistoryExportFormat;
}

export interface DeadLetterEvent {
  type?: string;
  priority?: string;
  timestamp: string;
  taskId?: string;
  workerId?: string;
  message?: string;
  hasData?: boolean;
}

export interface DeadLetterEntry {
  id: string;
  source?: string;
  reason?: string;
  failedAt: string;
  event?: DeadLetterEvent;
  title: string;
  content: string;
  type: NotificationType;
}

export interface DeadLetterListParams {
  page?: number;
  pageSize?: number;
  taskId?: string;
  workerId?: string;
  search?: string;
  source?: string;
  startTime?: string;
  endTime?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DeadLetterListResponse {
  entries: DeadLetterEntry[];
  total: number;
  page: number;
  pageSize: number;
}

