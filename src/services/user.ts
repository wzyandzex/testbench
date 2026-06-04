/**
 * 用户服务
 * 遵循 async-parallel 规则，并行获取独立数据
 */

import api from './api';
import type {
  User,
  UserListParams,
  UserListResponse,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  ResetPasswordRequest,
} from '@/types/user';

/**
 * 用户服务
 */
export const userService = {
  /**
   * 获取用户列表
   */
  async getList(params: UserListParams): Promise<UserListResponse> {
    return api.get('/users', { params });
  },

  /**
   * 获取用户详情
   */
  async getDetail(id: string): Promise<User> {
    return api.get(`/users/${id}`);
  },

  /**
   * 获取当前用户信息
   */
  async getCurrentUser(): Promise<User> {
    return api.get('/users/me');
  },

  /**
   * 创建用户
   */
  async create(data: CreateUserRequest): Promise<User> {
    return api.post('/users', data);
  },

  /**
   * 更新用户
   */
  async update(id: string, data: UpdateUserRequest): Promise<User> {
    return api.patch(`/users/${id}`, data);
  },

  /**
   * 删除用户
   */
  async delete(id: string): Promise<void> {
    return api.delete(`/users/${id}`);
  },

  /**
   * 批量删除用户
   */
  async batchDelete(ids: string[]): Promise<void> {
    return api.post('/users/batch-delete', { ids });
  },

  /**
   * 修改密码
   */
  async changePassword(data: ChangePasswordRequest): Promise<void> {
    return api.post('/users/change-password', data);
  },

  /**
   * 重置密码（管理员）
   */
  async resetPassword(data: ResetPasswordRequest): Promise<{ newPassword: string }> {
    return api.post('/users/reset-password', data);
  },

  /**
   * 更新用户状态
   */
  async updateStatus(id: string, status: User['status']): Promise<User> {
    return api.patch(`/users/${id}/status`, { status });
  },

  /**
   * 更新用户角色
   */
  async updateRole(id: string, role: User['role']): Promise<User> {
    return api.patch(`/users/${id}/role`, { role });
  },

  /**
   * 获取用户的组织和权限信息
   * ✅ 遵循 async-parallel：并行获取组织和权限
   */
  async getUserWithPermissions(userId: string): Promise<{
    user: User;
    organizations: Array<{ id: string; name: string; role: string }>;
    permissions: string[];
  }> {
    const [user, organizations, permissions] = await Promise.all([
      api.get<User>(`/users/${userId}`),
      api.get<Array<{ id: string; name: string; role: string }>>(`/users/${userId}/organizations`),
      api.get<string[]>(`/users/${userId}/permissions`),
    ]);
    return {
      user: user as any,
      organizations: organizations as any,
      permissions: permissions as any,
    };
  },

  /**
   * 获取用户活动日志
   */
  async getActivityLogs(userId: string, params: { page?: number; pageSize?: number }) {
    return api.get(`/users/${userId}/activity-logs`, { params });
  },
};

export default userService;
