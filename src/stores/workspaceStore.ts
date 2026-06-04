/**
 * 工作区 Store
 * 管理当前组织上下文、组织切换、memberships
 */

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { organizationService } from '@/services/organization';
import { useAuthStore } from './authStore';
import type { Membership } from '@/types/workspace';

interface WorkspaceState {
  currentOrg: Membership | null;
  memberships: Membership[];
  isSwitching: boolean;
  isInitialized: boolean;
  error: string | null;

  fetchMemberships: () => Promise<void>;
  switchOrg: (orgId: string) => Promise<void>;
  autoSelectOrg: () => Promise<void>;
  clearWorkspace: () => void;

  // Computed helpers
  isPersonalOrg: () => boolean;
  hasMultipleOrgs: () => boolean;
  currentOrgId: () => string | null;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    subscribeWithSelector((set, get) => ({
      currentOrg: null,
      memberships: [],
      isSwitching: false,
      isInitialized: false,
      error: null,

      fetchMemberships: async () => {
        try {
          const memberships = await organizationService.getMemberships();
          set({ memberships });
        } catch (error) {
          set({ error: error instanceof Error ? error.message : '获取组织列表失败' });
        }
      },

      switchOrg: async (orgId: string) => {
        const { memberships, currentOrg } = get();
        set({ isSwitching: true, error: null });
        try {
          const response = await organizationService.switchOrganization(orgId);
          // 用返回的新 token 更新 authStore
          useAuthStore.getState().setTokens(response.access_token, response.refresh_token, {
            currentOrgID: orgId,
            currentOrgRole: response.membership?.role,
          });

          const targetOrg = response.membership || memberships.find((m) => m.org_id === orgId);
          if (!targetOrg) {
            throw new Error('切换组织返回缺少 membership 且本地组织不存在');
          }

          useAuthStore.getState().updateUser({
            current_org_id: targetOrg.org_id,
            current_org_role: targetOrg.role,
            orgRole: targetOrg.role,
          });

          // Sync with localStorage according to Frontend Integration guide
          localStorage.setItem('current_org_id', targetOrg.org_id);

          // 更新 currentOrg
          set({
            currentOrg: targetOrg,
            isSwitching: false,
          });

          // 如果返回的 membership 不在列表中，更新列表
          const exists = memberships.some((m) => m.org_id === targetOrg.org_id);
          if (!exists) {
            set({ memberships: [...memberships, targetOrg] });
          }
        } catch (error) {
          // 切换失败时保持原组织上下文不变，避免 token/组织状态错配
          if (currentOrg?.org_id) {
            localStorage.setItem('current_org_id', currentOrg.org_id);
          }
          set({
            error: error instanceof Error ? error.message : '切换组织失败',
            isSwitching: false,
          });
          throw error;
        }
      },

      autoSelectOrg: async () => {
        const { currentOrg, fetchMemberships, switchOrg } = get();
        set({ error: null });

        try {
          await fetchMemberships();
          const { memberships } = get();

          if (memberships.length === 0) {
            set({ isInitialized: true });
            return;
          }

          // 如果已有 persisted currentOrg 且仍在列表中，保留并 switch
          if (currentOrg) {
            const stillExists = memberships.some((m) => m.org_id === currentOrg.org_id);
            if (stillExists) {
              await switchOrg(currentOrg.org_id);
              set({ isInitialized: true });
              return;
            }
          }

          // 否则选 is_default 的或列表第一个
          const defaultOrg = memberships.find((m) => m.is_default) || memberships[0];
          await switchOrg(defaultOrg.org_id);
          set({ isInitialized: true });
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '初始化工作区失败',
            isInitialized: true,
          });
        }
      },

      clearWorkspace: () => {
          localStorage.removeItem('current_org_id');
        set({
          currentOrg: null,
          memberships: [],
          isSwitching: false,
          isInitialized: false,
          error: null,
        });
      },

      isPersonalOrg: () => {
        return get().currentOrg?.org_type === 'personal';
      },

      hasMultipleOrgs: () => {
        return get().memberships.length > 1;
      },

      currentOrgId: () => {
        return get().currentOrg?.org_id ?? null;
      },
    })),
    {
      name: 'workspace-storage',
      partialize: (state) => ({
        currentOrg: state.currentOrg,
      }),
    }
  )
);
