// Admin 组织模板管理 - API client
//
// 后端接口：
//   GET    /api/v1/org-templates            (公开，列表)
//   GET    /api/v1/org-templates/:id        (公开，详情)
//   POST   /api/v1/org-templates            (admin only，创建)
//   DELETE /api/v1/org-templates/:id        (admin only，删除)
import api from '@/services/api';

export type TemplateCategory = 'small' | 'medium' | 'large' | 'startup' | 'enterprise';

export interface OrgTemplate {
  id: string;
  name: string;
  display_name: string;
  description: string;
  max_members: number;
  max_executions_per_day: number;
  max_storage_gb: number;
  default_role: string;
  allow_signup: boolean;
  require_approval: boolean;
  is_system: boolean;
  is_public: boolean;
  category: string;
  usage_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface OrgTemplateSettings {
  max_members: number;
  max_executions_per_day: number;
  max_storage_gb: number;
  default_role: string;
  allow_signup: boolean;
  require_approval: boolean;
}

export interface CreateOrgTemplateRequest {
  name: string;
  display_name?: string;
  description?: string;
  settings: OrgTemplateSettings;
  category?: TemplateCategory;
  is_public?: boolean;
}

export const orgTemplateAdminService = {
  list: async (): Promise<OrgTemplate[]> => {
    return api.get('/org-templates');
  },

  get: async (id: string): Promise<OrgTemplate> => {
    return api.get(`/org-templates/${id}`);
  },

  /** admin only */
  create: async (req: CreateOrgTemplateRequest): Promise<OrgTemplate> => {
    return api.post('/org-templates', req);
  },

  /** admin only — 系统模板（is_system=true）不可删 */
  delete: async (id: string): Promise<void> => {
    return api.delete(`/org-templates/${id}`);
  },
};
