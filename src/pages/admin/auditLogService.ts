// Audit Logs admin API client
//   GET /api/v1/collector/audit-logs            列表（按 triggered_by / date 范围筛选）
//   GET /api/v1/collector/cleanup-reports/:id   查看清理报告完整内容
import api from '@/services/api';

export interface AuditLogEntry {
  report_id: string;
  task_id: string;
  triggered_by: string;
  triggered_at: string;
  cleanup_type: string;
  reason: string;
  generated_at: string;
}

export interface AuditLogListResponse {
  total: number;
  page: number;
  size: number;
  data: AuditLogEntry[];
}

export interface ListAuditLogsParams {
  page?: number;
  page_size?: number;
  triggered_by?: string;
  /** YYYY-MM-DD */
  start_date?: string;
  /** YYYY-MM-DD */
  end_date?: string;
}

export interface CleanupReportDetail {
  organization_id?: string;
  report_id: string;
  task_id: string;
  generated_at: string;
  cleanup_type: string;
  dry_run: boolean;
  results: {
    sandboxes_cleaned: number;
    records_deleted: number;
    traces_deleted: number;
    total_duration_ms: number;
  };
  details?: Array<{
    resource_type: string;
    resource_id: string;
    action: string;
    timestamp: string;
  }>;
  errors?: Array<{
    resource_type: string;
    resource_id: string;
    error: string;
    timestamp: string;
  }>;
  audit_info: {
    triggered_by: string;
    triggered_at: string;
    reason?: string;
  };
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

export const auditLogService = {
  list: async (params: ListAuditLogsParams = {}): Promise<AuditLogListResponse> => {
    return api.get(`/collector/audit-logs${toQuery(params as Record<string, unknown>)}`);
  },

  getReport: async (id: string): Promise<CleanupReportDetail> => {
    return api.get(`/collector/cleanup-reports/${encodeURIComponent(id)}`);
  },
};
