import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { orgTemplateService } from '@/services/organization-template';
import { organizationService } from '@/services/organization';
import type {
  CreateTemplateRequest,
  OrgTemplate,
  Organization,
  TemplateCategory,
} from '@/types/organization';

interface OrgTemplateState {
  templates: OrgTemplate[];
  loading: boolean;
  error: string | null;
  fetchTemplates: (params?: { category?: TemplateCategory; is_public?: boolean }) => Promise<void>;
  createTemplate: (data: CreateTemplateRequest) => Promise<OrgTemplate>;
  deleteTemplate: (id: string) => Promise<void>;
  createOrgFromTemplate: (
    templateId: string,
    data: { name: string; display_name?: string; description?: string }
  ) => Promise<Organization>;
  clearError: () => void;
}

export const useOrgTemplateStore = create<OrgTemplateState>()(
  subscribeWithSelector((set) => ({
    templates: [],
    loading: false,
    error: null,

    fetchTemplates: async (params) => {
      set({ loading: true, error: null });
      try {
        const response = await orgTemplateService.getList(params);
        set({ templates: response.templates, loading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : '加载组织模板失败',
          loading: false,
        });
      }
    },

    createTemplate: async (data) => {
      set({ loading: true, error: null });
      try {
        const template = await orgTemplateService.create(data);
        set((state) => ({
          templates: [template, ...state.templates],
          loading: false,
        }));
        return template;
      } catch (error) {
        const message = error instanceof Error ? error.message : '创建组织模板失败';
        set({ error: message, loading: false });
        throw error;
      }
    },

    deleteTemplate: async (id) => {
      set({ loading: true, error: null });
      try {
        await orgTemplateService.delete(id);
        set((state) => ({
          templates: state.templates.filter((template) => template.id !== id),
          loading: false,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : '删除组织模板失败';
        set({ error: message, loading: false });
        throw error;
      }
    },

    createOrgFromTemplate: async (templateId, data) => {
      set({ loading: true, error: null });
      try {
        const organization = await organizationService.createFromTemplate({
          template_id: templateId,
          name: data.name,
          display_name: data.display_name,
          description: data.description,
        });
        set({ loading: false });
        return organization;
      } catch (error) {
        const message = error instanceof Error ? error.message : '基于模板创建组织失败';
        set({ error: message, loading: false });
        throw error;
      }
    },

    clearError: () => {
      set({ error: null });
    },
  }))
);

export const useTemplates = () => useOrgTemplateStore((state) => state.templates);
export const useTemplateLoading = () => useOrgTemplateStore((state) => state.loading);
export const useTemplateError = () => useOrgTemplateStore((state) => state.error);

export default useOrgTemplateStore;
