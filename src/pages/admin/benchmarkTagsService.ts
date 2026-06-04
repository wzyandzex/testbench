// Benchmark Tags admin API client
//   GET    /api/v1/benchmarks/tags         (公开)
//   POST   /api/v1/benchmarks/tags         (admin only)
//   DELETE /api/v1/benchmarks/tags/:id     (admin only)
import api from '@/services/api';

export interface BenchmarkTag {
  id: number;
  name: string;
  color: string;
  created_at: string;
}

export interface CreateBenchmarkTagRequest {
  name: string;
  color: string;
}

export const benchmarkTagsService = {
  list: async (): Promise<BenchmarkTag[]> => {
    return api.get('/benchmarks/tags');
  },

  create: async (req: CreateBenchmarkTagRequest): Promise<BenchmarkTag> => {
    return api.post('/benchmarks/tags', req);
  },

  delete: async (id: number): Promise<void> => {
    return api.delete(`/benchmarks/tags/${id}`);
  },
};
