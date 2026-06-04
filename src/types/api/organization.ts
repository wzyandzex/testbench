/**
 * Organization 类型定义
 * 参考: front/05-types/api-types.md
 */

export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer';

// 组织设置
export interface OrganizationSettings {
  allow_member_create_benchmark: boolean;
  allow_member_create_execution: boolean;
  default_benchmark_visibility: 'public' | 'private' | 'organization';
}

// 组织
export interface Organization {
  id: string;
  name: string;
  display_name: string;
  description: string;
  logo_url?: string;
  owner_id: string;
  member_count: number;
  type: 'personal' | 'team';
  settings: OrganizationSettings;
  plan: 'free' | 'team' | 'professional' | 'enterprise';
  created_at: string;
  updated_at: string;
}

// 组织成员
export interface OrganizationMember {
  id: string;
  user_id: string;
  username: string;
  email: string;
  avatar: string;
  role: OrgRole;
  status: 'active' | 'pending';
  joined_at: string;
}

// 邀请
export interface Invitation {
  id: string;
  organization_id: string;
  email: string;
  role: OrgRole;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expires_at: string;
  created_at: string;
}

// 创建组织请求
export interface CreateOrgRequest {
  name: string;
  display_name: string;
  description?: string;
  logo_url?: string;
}

// 更新组织请求
export interface UpdateOrgRequest {
  display_name?: string;
  description?: string;
  logo_url?: string;
}

// 邀请成员请求
export interface InviteMemberRequest {
  email: string;
  role: OrgRole;
}

// 更新成员角色请求
export interface UpdateMemberRoleRequest {
  role: OrgRole;
}

// 角色配置
export const ORG_ROLE_CONFIG = {
  owner: { label: '所有者', color: 'error', permissions: ['all'] },
  admin: { label: '管理员', color: 'warning', permissions: ['manage', 'create', 'edit', 'delete'] },
  member: { label: '成员', color: 'processing', permissions: ['create', 'edit'] },
  viewer: { label: '查看者', color: 'default', permissions: ['view'] },
} as const;

export const PLAN_CONFIG = {
  enterprise: { color: '#7c3aed', text: '企业版' },
  professional: { color: '#1677ff', text: '专业版' },
  team: { color: '#10b981', text: '团队版' },
  free: { color: '#9ca3af', text: '免费版' },
} as const;

export const MEMBER_STATUS_CONFIG = {
  active: { label: '活跃', color: 'success' },
  pending: { label: '待确认', color: 'warning' },
} as const;

export const INVITATION_STATUS_CONFIG = {
  pending: { label: '待接受', color: 'processing' },
  accepted: { label: '已接受', color: 'success' },
  declined: { label: '已拒绝', color: 'default' },
  expired: { label: '已过期', color: 'error' },
} as const;
