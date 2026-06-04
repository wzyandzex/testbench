// DLQ (Dead Letter Queue) admin API client
//   GET    /api/v1/history/dlq              列表（task_id / worker_id / search / source / 时间范围）
//   GET    /api/v1/history/dlq/stats        总数
//   GET    /api/v1/history/dlq/:id          详情
//   POST   /api/v1/history/dlq/:id/replay   重放
//   DELETE /api/v1/history/dlq/:id          删除（不再重放）
import api from '@/services/api';

export interface DeadLetterEvent {
  type?: string;
  priority?: string;
  timestamp: string;
  task_id?: string;
  worker_id?: string;
  message?: string;
  has_data?: boolean;
}

export interface DeadLetterEntry {
  id: string;
  source?: string;
  reason?: string;
  failed_at: string;
  event?: DeadLetterEvent;
}

export interface DLQListResponse {
  total: number;
  page: number;
  page_size: number;
  entries: DeadLetterEntry[];
}

export interface DLQStats {
  count: number;
}

export interface ListDLQParams {
  page?: number;
  page_size?: number;
  task_id?: string;
  worker_id?: string;
  search?: string;
  source?: string;
  /** ISO timestamp e.g. 2026-05-25T00:00:00Z */
  start_time?: string;
  /** ISO timestamp */
  end_time?: string;
  /** asc | desc */
  sort_order?: 'asc' | 'desc';
}

function toQuery(params: Record<string, unknown>): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null || v === '') continue;
    usp.append(k, String(v));
  }
  const s = usp.toString();
  return s ? `?${s}` : '';
}

export const dlqService = {
  list: async (params: ListDLQParams = {}): Promise<DLQListResponse> => {
    return api.get(`/history/dlq${toQuery(params as Record<string, unknown>)}`);
  },

  stats: async (): Promise<DLQStats> => {
    return api.get('/history/dlq/stats');
  },

  get: async (id: string): Promise<DeadLetterEntry> => {
    return api.get(`/history/dlq/${encodeURIComponent(id)}`);
  },

  replay: async (id: string): Promise<{ id: string; status: string }> => {
    return api.post(`/history/dlq/${encodeURIComponent(id)}/replay`);
  },

  remove: async (id: string): Promise<{ id: string; status: string }> => {
    return api.delete(`/history/dlq/${encodeURIComponent(id)}`);
  },
};
