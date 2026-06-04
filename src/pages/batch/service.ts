import { batchService } from '@/services/batch';
import type {
  BatchAgentReference,
  BatchBenchmarkReference,
  BatchExecution,
  BatchListParams,
  BatchReport,
  BatchSummary,
  BatchTaskProgress,
  BatchTaskQueryParams,
  CreateBatchRequest,
  CreateBatchResponse,
} from '@/types/api/batch';
import type { PaginatedResponse } from '@/types/api/common';

export const batchPageService = {
  getList(params?: BatchListParams): Promise<PaginatedResponse<BatchSummary>> {
    return batchService.getList(params);
  },

  getDetail(id: string): Promise<BatchExecution> {
    return batchService.getDetail(id);
  },

  create(data: CreateBatchRequest): Promise<CreateBatchResponse> {
    return batchService.create(data);
  },

  cancel(id: string) {
    return batchService.cancel(id);
  },

  getTasks(id: string, params?: BatchTaskQueryParams): Promise<PaginatedResponse<BatchTaskProgress>> {
    return batchService.getTasks(id, params);
  },

  getReport(id: string): Promise<BatchReport> {
    return batchService.getReport(id);
  },

  listAgentReferences(): Promise<BatchAgentReference[]> {
    return batchService.listAgentReferences();
  },

  listBenchmarkReferences(): Promise<BatchBenchmarkReference[]> {
    return batchService.listBenchmarkReferences();
  },
};

export default batchPageService;
