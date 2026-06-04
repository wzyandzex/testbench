/**
 * 工作区相关类型定义
 */

export type OrgType = 'personal' | 'team';
export type MemberRole = 'admin' | 'member' | 'guest';

export interface Membership {
  org_id: string;
  org_name: string;
  display_name: string;
  role: MemberRole;
  joined_at: string;
  is_owner: boolean;
  is_default: boolean;
  org_type: OrgType;
}

export interface SwitchOrgResponse {
  access_token: string;
  refresh_token: string;
  membership?: Membership;
  expires_in?: number;
  token_type?: string;
}
