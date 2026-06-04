import { request } from './request';
import type { PaginatedResponse } from '@/types/api/common';
import type {
  BatchAgentReference,
  BatchBenchmarkReference,
  BatchExecution,
  BatchExecutionMode,
  BatchItem,
  BatchListParams,
  BatchPageResponse,
  BatchReport,
  BatchSummary,
  BatchTaskProgress,
  BatchTaskQueryParams,
  CancelBatchResponse,
  CreateBatchRequest,
  CreateBatchResponse,
} from '@/types/api/batch';

const LIST_PAGE_SIZE = 100;
const REFERENCE_PAGE_SIZE = 100;

function unsupported(message: string): never {
  throw new Error(message);
}

function getExecutionMode(batch: Pick<BatchExecution, 'options' | 'total_tasks'>): BatchExecutionMode {
  const maxParallel = batch.options?.max_parallel ?? 1;
  if (!batch.options?.parallel || maxParallel <= 1) {
    return 'sequential';
  }
  if (batch.total_tasks > 0 && maxParallel < batch.total_tasks) {
    return 'limited';
  }
  return 'parallel';
}

function decorateExecution(batch: BatchExecution): BatchExecution & { executionMode: BatchExecutionMode } {
  return {
    ...batch,
    executionMode: getExecutionMode(batch),
  };
}

function mapTaskToItem(task: BatchTaskProgress): BatchItem {
  return {
    id: task.task_id,
    agentId: task.agent_id,
    agentName: task.agent_id,
    benchmarkId: task.benchmark_id,
    benchmarkName: task.benchmark_id,
    status: task.status,
    error: task.error,
    startedAt: task.started_at ?? undefined,
    completedAt: task.completed_at ?? undefined,
    duration: task.duration,
  };
}

async function listAllPages<T>(path: string): Promise<T[]> {
  let page = 1;
  let total = 0;
  const items: T[] = [];

  do {
    const response = await request.get<PaginatedResponse<T>>(path, {
      params: {
        page,
        page_size: REFERENCE_PAGE_SIZE,
      },
    });

    items.push(...response.data);
    total = response.total;
    page += 1;
  } while (items.length < total);

  return items;
}

export const batchService = {
  getList: async (params: BatchListParams = {}): Promise<BatchPageResponse<BatchSummary>> => {
    return request.get<PaginatedResponse<BatchSummary>>('/batch-executions', {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? LIST_PAGE_SIZE,
        ...(params.status ? { status: params.status } : {}),
      },
    });
  },

  get: async (id: string): Promise<BatchExecution> => {
    const response = await request.get<BatchExecution>(`/batch-executions/${id}`);
    return decorateExecution(response);
  },

  getDetail: async (
    id: string,
    params: BatchTaskQueryParams = {}
  ): Promise<BatchExecution> => {
    const [batch, tasks, report] = await Promise.all([
      batchService.get(id),
      batchService.getTasks(id, {
        page: params.page ?? 1,
        page_size: params.page_size ?? 20,
        order_by: params.order_by ?? 'created_at',
        order_dir: params.order_dir ?? 'desc',
        ...(params.agent_id ? { agent_id: params.agent_id } : {}),
        ...(params.benchmark_id ? { benchmark_id: params.benchmark_id } : {}),
        ...(params.status?.length ? { status: params.status } : {}),
      }),
      batchService.getReportSafe(id),
    ]);

    return {
      ...batch,
      items: tasks.data.map(mapTaskToItem),
      logs: [],
      report,
    };
  },

  create: (data: CreateBatchRequest): Promise<CreateBatchResponse> => {
    return request.post<CreateBatchResponse>('/batch-executions', data);
  },

  cancel: (id: string): Promise<CancelBatchResponse> => {
    return request.post<CancelBatchResponse>(`/batch-executions/${id}/cancel`, {});
  },

  action: async (
    id: string,
    actionType: 'start' | 'pause' | 'resume' | 'cancel' | 'retry_failed'
  ): Promise<CancelBatchResponse> => {
    if (actionType !== 'cancel') {
      unsupported('后端当前仅支持取消批量执行，不支持开始、暂停、恢复或重试失败任务。');
    }
    return batchService.cancel(id);
  },

  getTasks: (id: string, params: BatchTaskQueryParams = {}): Promise<BatchPageResponse<BatchTaskProgress>> => {
    return request.get<PaginatedResponse<BatchTaskProgress>>(`/batch-executions/${id}/tasks`, {
      params: {
        page: params.page ?? 1,
        page_size: params.page_size ?? 20,
        order_by: params.order_by ?? 'created_at',
        order_dir: params.order_dir ?? 'desc',
        ...(params.agent_id ? { agent_id: params.agent_id } : {}),
        ...(params.benchmark_id ? { benchmark_id: params.benchmark_id } : {}),
        ...(params.status?.length ? { status: params.status } : {}),
      },
    });
  },

  getReport: (id: string): Promise<BatchReport> => {
    return request.get<BatchReport>(`/batch-executions/${id}/report`);
  },

  getReportSafe: async (id: string): Promise<BatchReport | null> => {
    try {
      return await request.get<BatchReport>(`/batch-executions/${id}/report`, {
        silentError: true,
      });
    } catch {
      return null;
    }
  },

  listAgentReferences: (): Promise<BatchAgentReference[]> => {
    return listAllPages<BatchAgentReference>('/agents');
  },

  listBenchmarkReferences: (): Promise<BatchBenchmarkReference[]> => {
    return listAllPages<BatchBenchmarkReference>('/benchmarks');
  },

  update: async (_id: string, _data: Partial<CreateBatchRequest>): Promise<never> => {
    unsupported('后端当前不支持修改已创建的批量执行配置。');
  },

  delete: async (_id: string): Promise<never> => {
    unsupported('后端当前不支持删除批量执行记录。');
  },

  retryFailed: async (_id: string): Promise<never> => {
    unsupported('后端当前不支持仅重试失败子任务。');
  },

  getProgress: async (_id: string): Promise<never> => {
    unsupported('后端当前没有单独的批量进度查询接口，请使用详情接口或 WebSocket 进度推送。');
  },

  exportResults: async (_id: string, _format: 'csv' | 'json' | 'xlsx' = 'xlsx'): Promise<never> => {
    unsupported('后端当前不支持导出批量执行结果。');
  },

  getLogs: async (_id: string): Promise<never> => {
    unsupported('后端当前没有批量执行日志查询接口。');
  },

  clone: async (_id: string): Promise<never> => {
    unsupported('后端当前不支持克隆批量执行任务。');
  },
};

export default batchService;
