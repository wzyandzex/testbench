export type UserRole = 'admin' | 'user' | 'viewer';
export type UserStatus = 'active' | 'inactive' | 'locked';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  orgRole?: 'admin' | 'member' | 'guest';
  current_org_id?: string;
  current_org_role?: 'admin' | 'member' | 'guest';
  status?: UserStatus;
  avatar?: string;
  organization_id?: string;
  language?: string;
  created_at?: string;
  updated_at?: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type?: string;
  current_org_id?: string;
  current_org_role?: 'admin' | 'member' | 'guest';
  user: User;
}

export interface ChangePasswordDto {
  old_password: string;
  new_password: string;
}

export interface ResetPasswordDto {
  token_id: string;
  new_password: string;
  confirm_password: string;
}

export interface SendEmailVerificationDto {
  new_email: string;
}

export interface ConfirmEmailDto {
  token_id: string;
}

export interface ConfirmEmailResponse {
  message: string;
  new_email: string;
}

export interface DeleteAccountDto {
  password: string;
  confirm: boolean;
}

export interface UserListParams {
  page?: number;
  page_size?: number;
  status?: UserStatus;
  role?: UserRole;
  search?: string;
}

export interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  page_size: number;
}

export interface LockUserDto {
  reason: string;
  duration_hours?: number;
}

export interface UpdateRoleDto {
  role: UserRole;
}

export interface AvatarResponse {
  avatar_url: string;
}
