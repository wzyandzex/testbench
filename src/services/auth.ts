import { useAuthStore } from '@/stores/authStore';
import type {
  AvatarResponse,
  ChangePasswordDto,
  ConfirmEmailDto,
  ConfirmEmailResponse,
  DeleteAccountDto,
  LockUserDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  SendEmailVerificationDto,
  TokenResponse,
  UpdateRoleDto,
  User,
  UserListParams,
  UserListResponse,
} from '@/types/api/auth';
import { request } from './request';

function normalizeTokenInput(input: string) {
  const trimmed = input.trim();
  if (!trimmed) {
    return trimmed;
  }

  try {
    const url = new URL(trimmed);
    return url.searchParams.get('token') || url.searchParams.get('token_id') || trimmed;
  } catch {
    if (trimmed.startsWith('?')) {
      const params = new URLSearchParams(trimmed.slice(1));
      return params.get('token') || params.get('token_id') || trimmed;
    }
    return trimmed;
  }
}

export const authService = {
  login: (data: LoginDto) => {
    return request.post<TokenResponse>('/auth/login', data);
  },

  register: (data: RegisterDto) => {
    return request.post<User>('/auth/register', data);
  },

  me: () => {
    return request.get<User>('/auth/me');
  },

  refresh: (refreshToken: string) => {
    return request.post<TokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
  },

  logout: () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    return request.post('/auth/logout', refreshToken ? { refresh_token: refreshToken } : {});
  },

  changePassword: (data: ChangePasswordDto) => {
    return request.put('/auth/password', data);
  },

  updateProfile: async (_data: Partial<User>) => {
    throw new Error('当前后端未开放个人资料编辑接口，请先使用系统已支持的邮箱、密码和头像设置。');
  },

  sendPasswordResetEmail: (email: string) => {
    return request.post('/auth/password/reset', { email });
  },

  resetPassword: (data: ResetPasswordDto) => {
    return request.post('/auth/password/reset/confirm', {
      token_id: normalizeTokenInput(data.token_id),
      new_password: data.new_password,
      confirm_password: data.confirm_password,
    });
  },

  sendEmailVerification: (data: SendEmailVerificationDto) => {
    return request.post('/auth/email/verify', data);
  },

  confirmEmail: (data: ConfirmEmailDto) => {
    return request.post<ConfirmEmailResponse>('/auth/email/verify/confirm', {
      token_id: normalizeTokenInput(data.token_id),
    });
  },

  updateAvatar: (avatarUrl: string) => {
    const formData = new FormData();
    formData.append('avatar_url', avatarUrl);
    return request.upload<AvatarResponse>('/auth/avatar', formData);
  },

  deleteAccount: (data: DeleteAccountDto) => {
    return request.delete('/auth/delete', { data });
  },

  getUsers: (params: UserListParams) => {
    return request.get<UserListResponse>('/admin/users', { params });
  },

  getUserById: (id: string) => {
    return request.get<User>(`/admin/users/${id}`);
  },

  lockUser: (id: string, data: LockUserDto) => {
    return request.post(`/admin/users/${id}/lock`, data);
  },

  unlockUser: (id: string) => {
    return request.post(`/admin/users/${id}/unlock`);
  },

  updateUserRole: (id: string, data: UpdateRoleDto) => {
    return request.put(`/admin/users/${id}/role`, data);
  },

  deleteUser: (id: string) => {
    return request.delete(`/admin/users/${id}`);
  },
};
