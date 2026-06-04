import api from './api';
import type {
  CreateInvitationRequest,
  CreateOrganizationRequest,
  CreateOrgFromTemplateRequest,
  OrgTemplate,
  Organization,
  OrganizationDetail,
  OrganizationInvitation,
  OrganizationMember,
  OrganizationMembersPage,
  OrganizationQuota,
  OrganizationSettings,
  OrganizationUserInvitation,
  UpdateMemberRoleRequest,
  UpdateOrganizationRequest,
  UpdateOrganizationSettingsRequest,
  ListOrganizationMembersParams,
} from '@/types/organization';
import type { Membership, SwitchOrgResponse } from '@/types/workspace';

type BackendOrganization = {
  id: string;
  name: string;
  display_name?: string;
  description?: string;
  owner_id: string;
  type: Organization['type'];
  status: Organization['status'];
  max_members: number;
  max_executions_per_day: number;
  max_storage_gb: number;
  default_role: OrganizationSettings['default_role'];
  allow_signup: boolean;
  require_approval: boolean;
  created_at: string;
  updated_at: string;
};

type BackendOrganizationQuota = {
  executions: { limit: number; used: number; remaining: number; percentage: number };
  members: { limit: number; used: number; remaining: number; percentage: number };
  storage: { limit: number; used: number; remaining: number; percentage: number };
};

type BackendOrganizationMember = OrganizationMember;

type BackendOrganizationMembersPage = {
  total: number;
  page: number;
  size: number;
  data: BackendOrganizationMember[];
};

type BackendOrganizationInvitation = {
  id: string;
  org_id: string;
  email: string;
  role: OrganizationInvitation['role'];
  invite_code: string;
  message?: string;
  invited_by?: string;
  expires_at: string;
  accepted_at?: string;
  status: OrganizationInvitation['status'];
  created_at: string;
  delivery_status?: OrganizationInvitation['delivery_status'];
  delivery_error?: string;
  invite_url?: string;
};

type BackendOrganizationUserInvitation = BackendOrganizationInvitation & {
  organization_name?: string;
  organization_display_name?: string;
  inviter_username?: string;
  inviter_email?: string;
};

type BackendOrgTemplate = {
  id: string;
  name: string;
  display_name?: string;
  description?: string;
  max_members: number;
  max_executions_per_day: number;
  max_storage_gb: number;
  default_role: OrganizationSettings['default_role'];
  allow_signup: boolean;
  require_approval: boolean;
  category?: OrgTemplate['category'];
  is_system: boolean;
  is_public: boolean;
  usage_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

function normalizeSettings(source: {
  max_members: number;
  max_executions_per_day: number;
  max_storage_gb: number;
  default_role: OrganizationSettings['default_role'];
  allow_signup: boolean;
  require_approval: boolean;
}): OrganizationSettings {
  return {
    max_members: source.max_members,
    max_executions_per_day: source.max_executions_per_day,
    max_storage_gb: source.max_storage_gb,
    default_role: source.default_role,
    allow_signup: source.allow_signup,
    require_approval: source.require_approval,
  };
}

function normalizeOrganization(source: BackendOrganization): Organization {
  return {
    id: source.id,
    name: source.name,
    display_name: source.display_name || source.name,
    description: source.description || '',
    owner_id: source.owner_id,
    type: source.type,
    status: source.status,
    settings: normalizeSettings(source),
    created_at: source.created_at,
    updated_at: source.updated_at,
  };
}

function normalizeMembersPage(source: BackendOrganizationMembersPage): OrganizationMembersPage {
  return {
    total: source.total,
    page: source.page,
    size: source.size,
    data: source.data,
  };
}

function normalizeQuota(source: BackendOrganizationQuota): OrganizationQuota {
  return {
    executions: {
      current: source.executions.used,
      limit: source.executions.limit,
      remaining: source.executions.remaining,
      percentage: source.executions.percentage,
    },
    members: {
      current: source.members.used,
      limit: source.members.limit,
      remaining: source.members.remaining,
      percentage: source.members.percentage,
    },
    storage: {
      current: source.storage.used,
      limit: source.storage.limit,
      remaining: source.storage.remaining,
      percentage: source.storage.percentage,
      unit: 'GB',
    },
  };
}

function normalizeInvitation(source: BackendOrganizationInvitation): OrganizationInvitation {
  return {
    id: source.id,
    org_id: source.org_id,
    email: source.email,
    role: source.role,
    invite_code: source.invite_code,
    message: source.message || '',
    invited_by: source.invited_by,
    expires_at: source.expires_at,
    accepted_at: source.accepted_at,
    status: source.status,
    created_at: source.created_at,
    delivery_status: source.delivery_status,
    delivery_error: source.delivery_error,
    invite_url: source.invite_url,
  };
}

function normalizeUserInvitation(
  source: BackendOrganizationUserInvitation
): OrganizationUserInvitation {
  return {
    ...normalizeInvitation(source),
    organization_name: source.organization_name,
    organization_display_name: source.organization_display_name,
    inviter_username: source.inviter_username,
    inviter_email: source.inviter_email,
  };
}

function normalizeTemplate(source: BackendOrgTemplate): OrgTemplate {
  return {
    id: source.id,
    name: source.name,
    display_name: source.display_name || source.name,
    description: source.description || '',
    settings: normalizeSettings(source),
    category: source.category,
    is_system: source.is_system,
    is_public: source.is_public,
    usage_count: source.usage_count,
    created_by: source.created_by,
    created_at: source.created_at,
    updated_at: source.updated_at,
  };
}

function toOrganizationSettingsPayload(settings?: Partial<OrganizationSettings>) {
  if (!settings) {
    return undefined;
  }

  return {
    ...(settings.max_members !== undefined ? { max_members: settings.max_members } : {}),
    ...(settings.max_executions_per_day !== undefined
      ? { max_executions_per_day: settings.max_executions_per_day }
      : {}),
    ...(settings.max_storage_gb !== undefined ? { max_storage_gb: settings.max_storage_gb } : {}),
    ...(settings.default_role !== undefined ? { default_role: settings.default_role } : {}),
    ...(settings.allow_signup !== undefined ? { allow_signup: settings.allow_signup } : {}),
    ...(settings.require_approval !== undefined
      ? { require_approval: settings.require_approval }
      : {}),
  };
}

export const organizationService = {
  async getMemberships(): Promise<Membership[]> {
    return api.get('/organizations');
  },

  async switchOrganization(orgId: string): Promise<SwitchOrgResponse> {
    return api.post('/user/current-organization', { org_id: orgId });
  },

  async getOrganization(id: string): Promise<Organization> {
    const organization = (await api.get(`/organizations/${id}`)) as BackendOrganization;
    return normalizeOrganization(organization);
  },

  async getMembers(
    id: string,
    params?: ListOrganizationMembersParams
  ): Promise<OrganizationMembersPage> {
    const response = (await api.get(`/organizations/${id}/members`, {
      params: {
        ...(params?.page !== undefined ? { page: params.page } : {}),
        ...(params?.pageSize !== undefined ? { page_size: params.pageSize } : {}),
        ...(params?.role ? { role: params.role } : {}),
        ...(params?.query ? { query: params.query } : {}),
      },
    })) as BackendOrganizationMembersPage;

    return normalizeMembersPage(response);
  },

  async getDetail(id: string, params?: ListOrganizationMembersParams): Promise<OrganizationDetail> {
    const [organization, members] = await Promise.all([
      this.getOrganization(id),
      this.getMembers(id, params),
    ]);

    return {
      ...organization,
      members: members.data,
      members_meta: {
        total: members.total,
        page: members.page,
        size: members.size,
      },
    };
  },

  async create(data: CreateOrganizationRequest): Promise<Organization> {
    const response = (await api.post('/organizations', {
      name: data.name,
      display_name: data.display_name || data.name,
      description: data.description || '',
      ...(data.settings ? { settings: toOrganizationSettingsPayload(data.settings) } : {}),
    })) as BackendOrganization;

    return normalizeOrganization(response);
  },

  async update(id: string, data: UpdateOrganizationRequest): Promise<Organization> {
    const response = (await api.put(`/organizations/${id}`, {
      ...(data.display_name !== undefined ? { display_name: data.display_name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.settings ? { settings: toOrganizationSettingsPayload(data.settings) } : {}),
    })) as BackendOrganization;

    return normalizeOrganization(response);
  },

  async updateSettings(id: string, settings: UpdateOrganizationSettingsRequest): Promise<void> {
    await api.put(`/organizations/${id}/settings`, toOrganizationSettingsPayload(settings));
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/organizations/${id}`);
  },

  async updateMemberRole(
    organizationId: string,
    userId: string,
    data: UpdateMemberRoleRequest
  ): Promise<void> {
    await api.put(`/organizations/${organizationId}/members/${userId}/role`, data);
  },

  async removeMember(organizationId: string, userId: string): Promise<void> {
    await api.delete(`/organizations/${organizationId}/members/${userId}`);
  },

  async getQuota(id: string): Promise<OrganizationQuota> {
    const response = (await api.get(`/organizations/${id}/quota`)) as BackendOrganizationQuota;
    return normalizeQuota(response);
  },

  async getInvitations(id: string): Promise<OrganizationInvitation[]> {
    const response = (await api.get(
      `/organizations/${id}/invitations`
    )) as BackendOrganizationInvitation[];
    return response.map(normalizeInvitation);
  },

  async getMyInvitations(): Promise<OrganizationUserInvitation[]> {
    const response = (await api.get(
      '/organizations/invitations/me'
    )) as BackendOrganizationUserInvitation[];
    return response.map(normalizeUserInvitation);
  },

  async createInvitation(
    id: string,
    data: CreateInvitationRequest
  ): Promise<OrganizationInvitation> {
    const response = (await api.post(`/organizations/${id}/invitations`, {
      email: data.email,
      role: data.role,
      ...(data.message ? { message: data.message } : {}),
      ...(data.expires_in !== undefined ? { expires_in: data.expires_in } : {}),
    })) as BackendOrganizationInvitation;

    return normalizeInvitation(response);
  },

  async cancelInvitation(orgId: string, invitationId: string): Promise<void> {
    await api.delete(`/organizations/${orgId}/invitations/${invitationId}`);
  },

  async resendInvitation(
    orgId: string,
    invitationId: string,
    expiresIn = 168
  ): Promise<OrganizationInvitation> {
    const response = (await api.post(`/organizations/${orgId}/invitations/${invitationId}/resend`, {
      expires_in: expiresIn,
    })) as BackendOrganizationInvitation;

    return normalizeInvitation(response);
  },

  async joinOrganization(id: string, inviteCode: string) {
    return api.post(`/organizations/${id}/join`, { invite_code: inviteCode });
  },

  async createFromTemplate(data: CreateOrgFromTemplateRequest): Promise<Organization> {
    const response = (await api.post(`/org-templates/${data.template_id}/create-org`, {
      name: data.name,
      display_name: data.display_name || data.name,
      description: data.description || '',
    })) as BackendOrganization;

    return normalizeOrganization(response);
  },

  async getTemplates(): Promise<OrgTemplate[]> {
    const response = (await api.get('/org-templates')) as BackendOrgTemplate[];
    return response.map(normalizeTemplate);
  },

  async getTemplate(id: string): Promise<OrgTemplate> {
    const response = (await api.get(`/org-templates/${id}`)) as BackendOrgTemplate;
    return normalizeTemplate(response);
  },

  async createTemplate(data: {
    name: string;
    display_name?: string;
    description?: string;
    settings: OrganizationSettings;
    category?: OrgTemplate['category'];
    is_public?: boolean;
  }): Promise<OrgTemplate> {
    const response = (await api.post('/org-templates', {
      name: data.name,
      display_name: data.display_name,
      description: data.description,
      settings: toOrganizationSettingsPayload(data.settings),
      category: data.category,
      is_public: data.is_public,
    })) as BackendOrgTemplate;

    return normalizeTemplate(response);
  },

  async deleteTemplate(id: string): Promise<void> {
    await api.delete(`/org-templates/${id}`);
  },
};

export default organizationService;
