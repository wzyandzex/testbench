export type OrganizationMemberRole = 'admin' | 'member' | 'guest';
export type OrganizationStatus = 'active' | 'inactive' | 'suspended';
export type OrgType = 'personal' | 'team';
export type InvitationStatus = 'pending' | 'accepted' | 'cancelled' | 'expired';
export type InvitationDeliveryStatus = 'sent' | 'failed' | 'not_configured';
export type TemplateCategory = 'small' | 'medium' | 'large' | 'startup' | 'enterprise';

export interface OrganizationSettings {
  max_members: number;
  max_executions_per_day: number;
  max_storage_gb: number;
  default_role: OrganizationMemberRole;
  allow_signup: boolean;
  require_approval: boolean;
}

export interface Organization {
  id: string;
  name: string;
  display_name: string;
  description: string;
  owner_id: string;
  type: OrgType;
  status: OrganizationStatus;
  settings: OrganizationSettings;
  created_at: string;
  updated_at: string;
}

export interface OrganizationMember {
  id: string;
  user_id: string;
  username: string;
  email: string;
  avatar?: string;
  role: OrganizationMemberRole;
  invited_by?: string;
  joined_at: string;
  is_owner: boolean;
}

export interface OrganizationMembersPage {
  total: number;
  page: number;
  size: number;
  data: OrganizationMember[];
}

export interface OrganizationDetail extends Organization {
  members: OrganizationMember[];
  members_meta: Omit<OrganizationMembersPage, 'data'>;
}

export interface OrganizationQuotaItem {
  current: number;
  limit: number;
  remaining: number;
  percentage: number;
  unit?: 'GB';
}

export interface OrganizationQuota {
  executions: OrganizationQuotaItem;
  members: OrganizationQuotaItem;
  storage: OrganizationQuotaItem;
}

export interface OrganizationInvitation {
  id: string;
  org_id: string;
  email: string;
  role: OrganizationMemberRole;
  invite_code: string;
  message: string;
  invited_by?: string;
  expires_at: string;
  accepted_at?: string;
  status: InvitationStatus;
  created_at: string;
  delivery_status?: InvitationDeliveryStatus;
  delivery_error?: string;
  invite_url?: string;
}

export interface OrganizationUserInvitation extends OrganizationInvitation {
  organization_name?: string;
  organization_display_name?: string;
  inviter_username?: string;
  inviter_email?: string;
}

export interface OrgTemplate {
  id: string;
  name: string;
  display_name: string;
  description: string;
  settings: OrganizationSettings;
  category?: TemplateCategory;
  is_system: boolean;
  is_public: boolean;
  usage_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateOrganizationRequest {
  name: string;
  display_name?: string;
  description?: string;
  settings?: Partial<OrganizationSettings>;
}

export interface UpdateOrganizationRequest {
  display_name?: string;
  description?: string;
  settings?: Partial<OrganizationSettings>;
}

export interface UpdateOrganizationSettingsRequest {
  max_members?: number;
  max_executions_per_day?: number;
  max_storage_gb?: number;
  default_role?: OrganizationMemberRole;
  allow_signup?: boolean;
  require_approval?: boolean;
}

export interface CreateOrgFromTemplateRequest {
  template_id: string;
  name: string;
  display_name?: string;
  description?: string;
}

export interface CreateInvitationRequest {
  email: string;
  role: OrganizationMemberRole;
  message?: string;
  expires_in?: number;
}

export interface InviteMemberRequest extends CreateInvitationRequest {}

export interface UpdateMemberRoleRequest {
  role: OrganizationMemberRole;
}

export interface ListOrganizationMembersParams {
  page?: number;
  pageSize?: number;
  role?: OrganizationMemberRole;
  query?: string;
}

export interface CreateTemplateRequest {
  name: string;
  display_name?: string;
  description?: string;
  settings: OrganizationSettings;
  category?: TemplateCategory;
  is_public?: boolean;
}

export interface TemplateListResponse {
  templates: OrgTemplate[];
}

export type OrgMemberRole = OrganizationMemberRole;
