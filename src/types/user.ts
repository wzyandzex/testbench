/**
 * 用户相关类型定义
 */

/**
 * 用户角色
 */
export type UserRole = 'admin' | 'user' | 'viewer' | 'operator';

/**
 * 用户状态
 */
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'deleted';

/**
 * 用户信息
 */
export interface User {
  id: string;
  username: string;
  email: string;
  fullName?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  organizationId?: string;
  department?: string;
  phone?: string;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 用户列表查询参数
 */
export interface UserListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: UserRole[];
  status?: UserStatus[];
  organizationId?: string;
  sortBy?: 'username' | 'email' | 'createdAt' | 'lastLoginAt';
  sortOrder?: 'asc' | 'desc';
}

/**
 * 用户列表响应
 */
export interface UserListResponse {
  list: User[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * 创建用户请求
 */
export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  fullName?: string;
  role: UserRole;
  organizationId?: string;
  department?: string;
  phone?: string;
}

/**
 * 更新用户请求
 */
export interface UpdateUserRequest {
  email?: string;
  fullName?: string;
  role?: UserRole;
  status?: UserStatus;
  organizationId?: string;
  department?: string;
  phone?: string;
}

/**
 * 修改密码请求
 */
export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

/**
 * 重置密码请求
 */
export interface ResetPasswordRequest {
  userId: string;
  newPassword: string;
}
