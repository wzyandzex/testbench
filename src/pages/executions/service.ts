import i18next from 'i18next';

import api from '@/services/api';
import executionService from '@/services/execution';
import type {
  ExecutionFilter,
  ExecutionRecord,
  ExecutionSummaryStats,
  ExecutionTrace,
} from '@/types/api/execution';

export type Execution = ExecutionRecord;
export type ExecutionDetail = ExecutionRecord;
export type ExecutionLog = ExecutionTrace;
export type ExecutionListParams = ExecutionFilter;

export interface ExecutionListResponse {
  total: number;
  page: number;
  pageSize: number;
  data: Execution[];
}

function unsupported(message: string): never {
  throw new Error(message);
}

export async function getExecutionList(params: ExecutionListParams): Promise<ExecutionListResponse> {
  const page = await executionService.list(params);
  return {
    total: page.total,
    page: page.page,
    pageSize: page.size,
    data: page.data,
  };
}

export async function getExecutionDetail(id: string): Promise<ExecutionDetail> {
  return executionService.get(id);
}

export async function getExecutionLogs(id: string): Promise<ExecutionLog[]> {
  return executionService.getTrace(id);
}

export async function cancelExecution(id: string): Promise<void> {
  await executionService.cancel(id);
}

export async function retryExecution(_id?: string): Promise<{ newExecutionId: string }> {
  return unsupported(i18next.t('executions:errors.retryNotSupported'));
}

export async function deleteExecution(_id?: string): Promise<void> {
  return unsupported(i18next.t('executions:errors.deleteNotSupported'));
}

export async function batchDeleteExecutions(_ids?: string[]): Promise<void> {
  return unsupported(i18next.t('executions:errors.batchDeleteNotSupported'));
}

export async function exportExecutionReport(id: string, format: 'pdf' | 'json' = 'pdf'): Promise<Blob> {
  if (format === 'json') {
    return unsupported(i18next.t('executions:errors.reportFormatNotSupported'));
  }
  return api.get(`/export/executions/${id}/direct`, {
    params: {
      type: format,
      template: 'summary',
    },
    responseType: 'blob',
  });
}

export async function getExecutionStats(): Promise<ExecutionSummaryStats> {
  return executionService.getSummary();
}
