import { organizationService } from './organization';
import type {
  CreateTemplateRequest,
  OrgTemplate,
  TemplateCategory,
  TemplateListResponse,
} from '@/types/organization';

export const orgTemplateService = {
  async getList(params?: {
    category?: TemplateCategory;
    is_public?: boolean;
  }): Promise<TemplateListResponse> {
    let templates = await organizationService.getTemplates();

    if (params?.category) {
      templates = templates.filter((template) => template.category === params.category);
    }

    if (params?.is_public !== undefined) {
      templates = templates.filter((template) => template.is_public === params.is_public);
    }

    return { templates };
  },

  async getDetail(id: string): Promise<OrgTemplate> {
    return organizationService.getTemplate(id);
  },

  async create(data: CreateTemplateRequest): Promise<OrgTemplate> {
    return organizationService.createTemplate(data);
  },

  async delete(id: string): Promise<void> {
    await organizationService.deleteTemplate(id);
  },
};

export default orgTemplateService;
