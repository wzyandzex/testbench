import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { organizationService } from '@/services/organization';
import { useWorkspaceStore } from './workspaceStore';
import type {
  CreateInvitationRequest,
  CreateOrganizationRequest,
  Organization,
  OrganizationDetail,
  OrganizationInvitation,
  OrganizationMember,
  OrganizationMembersPage,
  OrganizationQuota,
  UpdateOrganizationRequest,
  UpdateOrganizationSettingsRequest,
} from '@/types/organization';

interface OrganizationState {
  selectedOrganization: OrganizationDetail | null;
  members: OrganizationMember[];
  membersMeta: Omit<OrganizationMembersPage, 'data'> | null;
  invitations: OrganizationInvitation[];
  quota: OrganizationQuota | null;
  loading: boolean;
  error: string | null;
  fetchOrganizationDetail: (id: string) => Promise<OrganizationDetail>;
  fetchMembers: (
    organizationId: string,
    params?: { page?: number; pageSize?: number; role?: OrganizationMember['role']; query?: string }
  ) => Promise<OrganizationMembersPage>;
  fetchInvitations: (orgId: string) => Promise<OrganizationInvitation[]>;
  fetchQuota: (orgId: string) => Promise<OrganizationQuota>;
  setSelectedOrganization: (org: OrganizationDetail | null) => void;
  createOrganization: (data: CreateOrganizationRequest) => Promise<Organization>;
  updateOrganization: (id: string, data: UpdateOrganizationRequest) => Promise<Organization>;
  updateSettings: (id: string, data: UpdateOrganizationSettingsRequest) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;
  inviteMember: (organizationId: string, data: CreateInvitationRequest) => Promise<OrganizationInvitation>;
  cancelInvitation: (orgId: string, invitationId: string) => Promise<void>;
  resendInvitation: (orgId: string, invitationId: string, expiresIn?: number) => Promise<OrganizationInvitation>;
  updateMemberRole: (organizationId: string, userId: string, role: OrganizationMember['role']) => Promise<void>;
  removeMember: (organizationId: string, userId: string) => Promise<void>;
  clearSelectedOrganization: () => void;
  isPersonalOrg: (orgId: string) => boolean;
}

function mergeSelectedOrganization(
  current: OrganizationDetail | null,
  updater: (organization: OrganizationDetail) => OrganizationDetail
) {
  if (!current) {
    return null;
  }

  return updater(current);
}

export const useOrganizationStore = create<OrganizationState>()(
  subscribeWithSelector((set, get) => ({
    selectedOrganization: null,
    members: [],
    membersMeta: null,
    invitations: [],
    quota: null,
    loading: false,
    error: null,

    fetchOrganizationDetail: async (id) => {
      set({ loading: true, error: null });
      try {
        const detail = await organizationService.getDetail(id, { page: 1, pageSize: 50 });
        set({
          selectedOrganization: detail,
          members: detail.members,
          membersMeta: detail.members_meta,
          loading: false,
        });
        return detail;
      } catch (error) {
        const message = error instanceof Error ? error.message : '加载组织详情失败';
        set({ error: message, loading: false });
        throw error;
      }
    },

    fetchMembers: async (organizationId, params) => {
      set({ loading: true, error: null });
      try {
        const response = await organizationService.getMembers(organizationId, params);
        set((state) => ({
          members: response.data,
          membersMeta: {
            total: response.total,
            page: response.page,
            size: response.size,
          },
          selectedOrganization: state.selectedOrganization
            ? {
                ...state.selectedOrganization,
                members: response.data,
                members_meta: {
                  total: response.total,
                  page: response.page,
                  size: response.size,
                },
              }
            : state.selectedOrganization,
          loading: false,
        }));
        return response;
      } catch (error) {
        const message = error instanceof Error ? error.message : '加载成员列表失败';
        set({ error: message, loading: false });
        throw error;
      }
    },

    fetchInvitations: async (orgId) => {
      try {
        const invitations = await organizationService.getInvitations(orgId);
        set({ invitations });
        return invitations;
      } catch (error) {
        const message = error instanceof Error ? error.message : '加载邀请列表失败';
        set({ error: message });
        throw error;
      }
    },

    fetchQuota: async (orgId) => {
      try {
        const quota = await organizationService.getQuota(orgId);
        set({ quota });
        return quota;
      } catch (error) {
        const message = error instanceof Error ? error.message : '加载组织配额失败';
        set({ error: message });
        throw error;
      }
    },

    setSelectedOrganization: (org) => {
      set({
        selectedOrganization: org,
        members: org?.members || [],
        membersMeta: org?.members_meta || null,
      });
    },

    createOrganization: async (data) => {
      try {
        return await organizationService.create(data);
      } catch (error) {
        const message = error instanceof Error ? error.message : '创建组织失败';
        set({ error: message });
        throw error;
      }
    },

    updateOrganization: async (id, data) => {
      try {
        const updated = await organizationService.update(id, data);
        set((state) => ({
          selectedOrganization:
            state.selectedOrganization?.id === id
              ? {
                  ...state.selectedOrganization,
                  ...updated,
                  members: state.members,
                  members_meta: state.membersMeta || state.selectedOrganization.members_meta,
                }
              : state.selectedOrganization,
        }));
        return updated;
      } catch (error) {
        const message = error instanceof Error ? error.message : '更新组织失败';
        set({ error: message });
        throw error;
      }
    },

    updateSettings: async (id, data) => {
      try {
        await organizationService.updateSettings(id, data);
        set((state) => ({
          selectedOrganization: mergeSelectedOrganization(state.selectedOrganization, (organization) =>
            organization.id === id
              ? {
                  ...organization,
                  settings: {
                    ...organization.settings,
                    ...data,
                  },
                }
              : organization
          ),
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : '更新组织设置失败';
        set({ error: message });
        throw error;
      }
    },

    deleteOrganization: async (id) => {
      try {
        await organizationService.delete(id);
        set((state) => ({
          selectedOrganization: state.selectedOrganization?.id === id ? null : state.selectedOrganization,
          members: state.selectedOrganization?.id === id ? [] : state.members,
          membersMeta: state.selectedOrganization?.id === id ? null : state.membersMeta,
          invitations: state.selectedOrganization?.id === id ? [] : state.invitations,
          quota: state.selectedOrganization?.id === id ? null : state.quota,
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : '删除组织失败';
        set({ error: message });
        throw error;
      }
    },

    inviteMember: async (organizationId, data) => {
      try {
        const invitation = await organizationService.createInvitation(organizationId, data);
        set((state) => ({
          invitations: [invitation, ...state.invitations],
        }));
        return invitation;
      } catch (error) {
        const message = error instanceof Error ? error.message : '发送邀请失败';
        set({ error: message });
        throw error;
      }
    },

    cancelInvitation: async (orgId, invitationId) => {
      try {
        await organizationService.cancelInvitation(orgId, invitationId);
        set((state) => ({
          invitations: state.invitations.map((invitation) =>
            invitation.id === invitationId
              ? { ...invitation, status: 'cancelled' as const }
              : invitation
          ),
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : '取消邀请失败';
        set({ error: message });
        throw error;
      }
    },

    resendInvitation: async (orgId, invitationId, expiresIn) => {
      try {
        const invitation = await organizationService.resendInvitation(orgId, invitationId, expiresIn);
        set((state) => ({
          invitations: [
            invitation,
            ...state.invitations.map((item) =>
              item.id === invitationId ? { ...item, status: 'cancelled' as const } : item
            ),
          ],
        }));
        return invitation;
      } catch (error) {
        const message = error instanceof Error ? error.message : '重新发送邀请失败';
        set({ error: message });
        throw error;
      }
    },

    updateMemberRole: async (organizationId, userId, role) => {
      try {
        await organizationService.updateMemberRole(organizationId, userId, { role });
        set((state) => ({
          members: state.members.map((member) =>
            member.user_id === userId ? { ...member, role } : member
          ),
          selectedOrganization: mergeSelectedOrganization(state.selectedOrganization, (organization) => ({
            ...organization,
            members: organization.members.map((member) =>
              member.user_id === userId ? { ...member, role } : member
            ),
          })),
        }));
      } catch (error) {
        const message = error instanceof Error ? error.message : '更新成员角色失败';
        set({ error: message });
        throw error;
      }
    },

    removeMember: async (organizationId, userId) => {
      try {
        await organizationService.removeMember(organizationId, userId);
        set((state) => {
          const nextMembers = state.members.filter((member) => member.user_id !== userId);
          const nextMeta = state.membersMeta
            ? {
                ...state.membersMeta,
                total: Math.max(0, state.membersMeta.total - 1),
              }
            : null;

          return {
            members: nextMembers,
            membersMeta: nextMeta,
            selectedOrganization: mergeSelectedOrganization(state.selectedOrganization, (organization) => ({
              ...organization,
              members: organization.members.filter((member) => member.user_id !== userId),
              members_meta: nextMeta || organization.members_meta,
            })),
          };
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : '移除成员失败';
        set({ error: message });
        throw error;
      }
    },

    clearSelectedOrganization: () => {
      set({
        selectedOrganization: null,
        members: [],
        membersMeta: null,
        invitations: [],
        quota: null,
      });
    },

    isPersonalOrg: (orgId) => {
      const selectedOrganization = get().selectedOrganization;
      if (selectedOrganization?.id === orgId) {
        return selectedOrganization.type === 'personal';
      }

      return useWorkspaceStore
        .getState()
        .memberships.some((membership) => membership.org_id === orgId && membership.org_type === 'personal');
    },
  }))
);

export const useSelectedOrganization = () => useOrganizationStore((state) => state.selectedOrganization);
export const useOrganizationMembers = () => useOrganizationStore((state) => state.members);
export const useOrganizationLoading = () => useOrganizationStore((state) => state.loading);

export default useOrganizationStore;
