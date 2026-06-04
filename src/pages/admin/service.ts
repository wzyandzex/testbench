// 系统默认 Agent 模板 - admin API client
import api from '@/services/api';

export type AgentType = 'code_edit' | 'terminal' | 'hybrid' | 'autonomous';

export interface DefaultAgentTemplate {
  id: string;
  display_name: string;
  description: string;
  type: AgentType;
  endpoint: string;
  has_api_key: boolean;
  model_config?: Record<string, unknown> | null;
  capabilities?: string[] | null;
  tools?: Record<string, unknown> | null;
  metadata?: Record<string, unknown> | null;
  is_active: boolean;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

/**
 * 更新模板请求 — APIKey 三态：
 *   - 字段不传/undefined → 不变
 *   - 空字符串 "" → 清空
 *   - 非空字符串 → 更新
 */
export interface UpdateDefaultAgentTemplateRequest {
  display_name?: string;
  description?: string;
  type?: AgentType;
  endpoint?: string;
  api_key?: string;
  model_config?: Record<string, unknown>;
  capabilities?: string[];
  tools?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  is_active?: boolean;
}

export const adminAgentTemplateService = {
  /** GET /api/v1/admin/agents/default-template */
  getDefaultTemplate: async (): Promise<DefaultAgentTemplate> => {
    return api.get('/admin/agents/default-template');
  },

  /** PUT /api/v1/admin/agents/default-template */
  updateDefaultTemplate: async (
    req: UpdateDefaultAgentTemplateRequest
  ): Promise<DefaultAgentTemplate> => {
    return api.put('/admin/agents/default-template', req);
  },
};
