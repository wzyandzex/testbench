import api from '@/services/api';

// Types
export type SectionKey =
  | 'execution_summary'
  | 'metrics_cards'
  | 'step_details'
  | 'charts'
  | 'cost_analysis'
  | 'custom_notes';

export interface SectionConfig {
  key: SectionKey;
  enabled: boolean;
  title: string;
  order: number;
  content?: string;
}

export interface TemplateInfo {
  id: string;
  org_id: string;
  name: string;
  description: string;
  base_template: 'summary' | 'detailed';
  sections: SectionConfig[];
  custom_header?: string;
  custom_footer?: string;
  logo_url?: string;
  theme_color?: string;
  is_default: boolean;
  is_system: boolean;
  created_by: string;
  created_by_name?: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  base_template: 'summary' | 'detailed';
  sections: SectionConfig[];
  custom_header?: string;
  custom_footer?: string;
  logo_url?: string;
  theme_color?: string;
}

export interface UpdateTemplateRequest {
  name?: string;
  description?: string;
  base_template?: 'summary' | 'detailed';
  sections?: SectionConfig[];
  custom_header?: string;
  custom_footer?: string;
  logo_url?: string;
  theme_color?: string;
}

export interface TemplateListResponse {
  total: number;
  page: number;
  size: number;
  data: TemplateInfo[];
}

export const SECTION_LABELS: Record<SectionKey, { label: string; description: string }> = {
  execution_summary: { label: '执行概览', description: '执行 ID、Agent、Benchmark、状态、耗时' },
  metrics_cards: { label: '核心指标', description: '成功率、通过数、平均延迟、成本' },
  step_details: { label: '步骤详情', description: '每一步的输入、输出、状态' },
  charts: { label: '指标图表', description: '趋势图、柱状图等可视化图表' },
  cost_analysis: { label: '成本分析', description: 'Token 消耗与费用明细' },
  custom_notes: { label: '自定义备注', description: '自定义 Markdown 内容区块' },
};

export const DEFAULT_SECTIONS: SectionConfig[] = [
  { key: 'execution_summary', enabled: true, title: '执行概览', order: 1 },
  { key: 'metrics_cards', enabled: true, title: '核心指标', order: 2 },
  { key: 'step_details', enabled: true, title: '步骤详情', order: 3 },
  { key: 'charts', enabled: false, title: '指标图表', order: 4 },
  { key: 'cost_analysis', enabled: true, title: '成本分析', order: 5 },
  { key: 'custom_notes', enabled: false, title: '备注', order: 6 },
];

// API calls
export async function listTemplates(params?: {
  status?: string;
  page?: number;
  page_size?: number;
}): Promise<TemplateListResponse> {
  return api.get('/report-templates', { params });
}

export async function getTemplate(id: string): Promise<TemplateInfo> {
  return api.get(`/report-templates/${id}`);
}

export async function createTemplate(req: CreateTemplateRequest): Promise<TemplateInfo> {
  return api.post('/report-templates', req);
}

export async function updateTemplate(id: string, req: UpdateTemplateRequest): Promise<TemplateInfo> {
  return api.put(`/report-templates/${id}`, req);
}

export async function deleteTemplate(id: string): Promise<void> {
  return api.delete(`/report-templates/${id}`);
}

export async function setDefaultTemplate(id: string): Promise<void> {
  return api.put(`/report-templates/${id}/default`);
}
