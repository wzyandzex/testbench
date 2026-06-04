/**
 * Settings 页面服务
 */

import api from '@/services/api';

export interface UserSettings {
  theme: 'light' | 'dark' | 'auto';
  language: 'zh-CN' | 'en-US';
  notifications: {
    email: boolean;
    push: boolean;
    execution: boolean;
    benchmark: boolean;
    agent: boolean;
  };
  display: {
    density: 'comfortable' | 'middle' | 'small';
    showLabels: boolean;
  };
}

export interface OrganizationSettings {
  name: string;
  logo?: string;
  defaultTimeout: number;
  maxRetries: number;
  allowMemberInvite: boolean;
  allowMemberCreateAgent: boolean;
  allowMemberCreateBenchmark: boolean;
}

export const settingsPageService = {
  /**
   * 获取用户设置
   */
  async getUserSettings(): Promise<UserSettings> {
    return api.get('/settings/user');
  },

  /**
   * 更新用户设置
   */
  async updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    return api.patch('/settings/user', settings);
  },

  /**
   * 获取组织设置
   */
  async getOrganizationSettings(organizationId: string): Promise<OrganizationSettings> {
    return api.get(`/settings/organization/${organizationId}`);
  },

  /**
   * 更新组织设置
   */
  async updateOrganizationSettings(
    organizationId: string,
    settings: Partial<OrganizationSettings>
  ): Promise<OrganizationSettings> {
    return api.patch(`/settings/organization/${organizationId}`, settings);
  },

  /**
   * 上传头像
   */
  async uploadAvatar(file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/settings/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  /**
   * 修改密码
   */
  async changePassword(data: { oldPassword: string; newPassword: string }): Promise<void> {
    return api.post('/settings/change-password', data);
  },

  /**
   * 生成 API Token
   */
  async generateApiToken(description: string): Promise<{ token: string }> {
    return api.post('/settings/api-tokens', { description });
  },

  /**
   * 获取 API Tokens
   */
  async getApiTokens(): Promise<Array<{ id: string; description: string; createdAt: Date; lastUsed?: Date }>> {
    return api.get('/settings/api-tokens');
  },

  /**
   * 删除 API Token
   */
  async deleteApiToken(tokenId: string): Promise<void> {
    return api.delete(`/settings/api-tokens/${tokenId}`);
  },
};

export default settingsPageService;
