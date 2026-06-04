// Cost Model admin API client
//   GET    /api/v1/cost/models          列表（?active_only=true|false）
//   POST   /api/v1/cost/models          创建（admin only）
//   PUT    /api/v1/cost/models/:id      更新（admin only）
//   DELETE /api/v1/cost/models/:id      删除（admin only）
import api from '@/services/api';

export interface ModelCost {
  id: string;
  provider: string;
  model_name: string;
  /** 输入价（每 1k tokens） */
  input_price: number;
  /** 输出价（每 1k tokens） */
  output_price: number;
  currency: string;
  effective_date: string;
  expiry_date?: string | null;
  is_active: boolean;
}

export interface ModelCostListResponse {
  models: ModelCost[];
  total: number;
}

export interface CreateModelCostRequest {
  provider: string;
  model_name: string;
  input_price: number;
  output_price: number;
  currency: string;
  effective_date: string;
  expiry_date?: string | null;
}

export interface UpdateModelCostRequest {
  input_price?: number;
  output_price?: number;
  currency?: string;
  expiry_date?: string | null;
  is_active?: boolean;
}

export const costModelService = {
  list: async (activeOnly = false): Promise<ModelCostListResponse> => {
    const qs = `?active_only=${activeOnly ? 'true' : 'false'}`;
    return api.get(`/cost/models${qs}`);
  },

  create: async (req: CreateModelCostRequest): Promise<ModelCost> => {
    return api.post('/cost/models', req);
  },

  update: async (id: string, req: UpdateModelCostRequest): Promise<ModelCost> => {
    return api.put(`/cost/models/${encodeURIComponent(id)}`, req);
  },

  delete: async (id: string): Promise<void> => {
    return api.delete(`/cost/models/${encodeURIComponent(id)}`);
  },
};
