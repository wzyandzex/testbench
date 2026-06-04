/**
 * Benchmark API 服务
 */

import api from '@/services/api';

export interface Benchmark {
  id: string;
  name: string;
  description: string;
  language: string;
  category: 'coding' | 'reasoning' | 'knowledge' | 'multimodal';
  status: 'draft' | 'active' | 'archived';
  totalExecutions: number;
  successRate: number;
  lastExecution: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBenchmarkDto {
  name: string;
  description: string;
  language: string;
  category: string;
  config?: Record<string, unknown>;
}

export interface UpdateBenchmarkDto extends Partial<CreateBenchmarkDto> {
  id: string;
}

export interface BenchmarkListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string[];
  category?: string[];
  language?: string[];
  sortBy?: string;
  order?: 'asc' | 'desc';
}

export interface BenchmarkListResponse {
  total: number;
  page: number;
  pageSize: number;
  data: Benchmark[];
}

/**
 * 获取评测任务列表
 */
export function getBenchmarkList(params: BenchmarkListParams): Promise<BenchmarkListResponse> {
  return api.get('/benchmarks', { params });
}

/**
 * 获取评测任务详情
 */
export function getBenchmarkDetail(id: string): Promise<Benchmark> {
  return api.get(`/benchmarks/${id}`);
}

/**
 * 创建评测任务
 */
export function createBenchmark(data: CreateBenchmarkDto): Promise<Benchmark> {
  return api.post('/benchmarks', data);
}

/**
 * 更新评测任务
 */
export function updateBenchmark(id: string, data: UpdateBenchmarkDto): Promise<Benchmark> {
  return api.put(`/benchmarks/${id}`, data);
}

/**
 * 删除评测任务
 */
export function deleteBenchmark(id: string): Promise<void> {
  return api.delete(`/benchmarks/${id}`);
}

/**
 * 批量删除评测任务
 */
export function batchDeleteBenchmark(ids: string[]): Promise<void> {
  return api.post('/benchmarks/batch-delete', { ids });
}

/**
 * 执行评测任务
 */
export function runBenchmark(id: string, data: { agent_id: string; priority?: 'p0' | 'p1' | 'p2' | 'p3' }) {
  return api.post(`/benchmarks/${id}/runs`, data);
}

/**
 * 更改评测任务状态
 */
export function changeBenchmarkStatus(id: string, status: 'active' | 'archived' | 'draft'): Promise<Benchmark> {
  return api.patch(`/benchmarks/${id}/status`, { status });
}

/**
 * 复制评测任务
 */
export function duplicateBenchmark(id: string): Promise<Benchmark> {
  return api.post(`/benchmarks/${id}/duplicate`);
}
