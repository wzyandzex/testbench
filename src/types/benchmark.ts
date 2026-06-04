export interface Benchmark {
  id: string;
  name: string;
  description?: string;
  language: string;
  category: string;
  status: 'active' | 'draft' | 'archived';
  totalExecutions: number;
  successRate: number;
  lastExecution?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface BenchmarkFilters {
  search?: string;
  status?: string[];
  category?: string[];
  language?: string[];
  page?: number;
  pageSize?: number;
}

export interface BenchmarkFormData {
  name: string;
  description?: string;
  language: string;
  category: string;
  status: 'active' | 'draft';
  config: {
    timeout?: number;
    maxRetries?: number;
    [key: string]: any;
  };
}
