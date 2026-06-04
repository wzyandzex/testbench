/**
 * 认证相关 Hook
 * 封装用户认证状态和操作
 */

import { useCallback, useState } from 'react';
import type { TokenResponse } from '@/types/api/auth';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';

import { useAuthStore } from '@/stores/authStore';
import { authService } from '@/services/auth';
import { logger } from '@/utils';
import type { User, LoginDto, RegisterDto } from '@/types';

/**
 * 认证 Hook 返回值
 */
interface UseAuthReturn {
  // 状态
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // 操作
  login: (credentials: LoginDto) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (data: RegisterDto) => Promise<boolean>;
  updateUser: (data: Partial<User>) => Promise<void>;

  // 权限检查
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: string[]) => boolean;

  // Token 管理
  getAccessToken: () => string | null;
  getRefreshToken: () => string | null;
}

/**
 * 认证 Hook
 *
 * @example
 * ```tsx
 * const { user, isAuthenticated, login, logout } = useAuth();
 * ```
 */
export function useAuth(): UseAuthReturn {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    setAuth,
    updateUser,
    clearAuth,
    hasPermission: storeHasPermission,
    hasRole: storeHasRole,
  } = useAuthStore();

  /**
   * 用户登录
   */
  const login = useCallback(
    async (credentials: LoginDto): Promise<boolean> => {
      setIsLoading(true);
      try {
        logger.userAction('login_attempt', { username: credentials.username });

        const response: TokenResponse = await authService.login(credentials);

        setAuth(
          response.user,
          response.access_token,
          response.refresh_token,
          {
            currentOrgID: response.current_org_id,
            currentOrgRole: response.current_org_role,
          }
        );

        logger.info('用户登录成功', { userId: response.user.id });
        message.success('登录成功');

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '登录失败';
        logger.error('登录失败', error);
        message.error(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [setAuth]
  );

  /**
   * 用户登出
   */
  const logout = useCallback(async (): Promise<void> => {
    try {
      logger.userAction('logout', { userId: user?.id });

      // 调用登出 API
      await authService.logout();
    } catch (error) {
      logger.error('登出 API 调用失败', error);
    } finally {
      // 无论 API 调用成功与否，都清除本地认证状态
      clearAuth();
      message.success('已退出登录');
      navigate('/login');
    }
  }, [user, clearAuth, navigate]);

  /**
   * 用户注册
   */
  const register = useCallback(
    async (data: RegisterDto): Promise<boolean> => {
      setIsLoading(true);
      try {
        logger.userAction('register_attempt', { username: data.username, email: data.email });

        await authService.register(data);
        const response: TokenResponse = await authService.login({
          username: data.username,
          password: data.password,
        });

        setAuth(
          response.user,
          response.access_token,
          response.refresh_token,
          {
            currentOrgID: response.current_org_id,
            currentOrgRole: response.current_org_role,
          }
        );

        logger.info('用户注册成功', { userId: response.user.id });
        message.success('注册成功');

        return true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '注册失败';
        logger.error('注册失败', error);
        message.error(errorMessage);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    [setAuth]
  );

  /**
   * 更新用户信息
   */
  const updateUserProfile = useCallback(
    async (data: Partial<User>): Promise<void> => {
      try {
        logger.userAction('update_profile_start', { userId: user?.id });

        const updatedUser = await authService.updateProfile(data);
        updateUser(updatedUser);

        logger.info('用户信息更新成功', { userId: user?.id });
        message.success('个人信息已更新');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '更新失败';
        logger.error('更新用户信息失败', error);
        message.error(errorMessage);
        throw error;
      }
    },
    [user, updateUser]
  );

  /**
   * 获取访问 Token
   */
  const getAccessToken = useCallback((): string | null => {
    return accessToken;
  }, [accessToken]);

  /**
   * 获取刷新 Token
   */
  const getRefreshToken = useCallback((): string | null => {
    return refreshToken;
  }, [refreshToken]);

  /**
   * 检查权限
   */
  const checkPermission = useCallback(
    (permission: string): boolean => {
      return storeHasPermission(permission);
    },
    [storeHasPermission]
  );

  /**
   * 检查角色
   */
  const checkRole = useCallback(
    (roles: string[]): boolean => {
      return storeHasRole(roles as any);
    },
    [storeHasRole]
  );

  return {
    // 状态
    user,
    isAuthenticated,
    isLoading,

    // 操作
    login,
    logout,
    register,
    updateUser: updateUserProfile,

    // 权限检查
    hasPermission: checkPermission,
    hasRole: checkRole,

    // Token 管理
    getAccessToken,
    getRefreshToken,
  };
}

/**
 * 权限控制 Hook
 * 用于在组件中检查用户是否有特定权限
 *
 * @example
 * ```tsx
 * const canCreate = usePermission('benchmark.create');
 * if (!canCreate) return <NoPermission />;
 * ```
 */
export function usePermission(permission: string): boolean {
  const { hasPermission } = useAuth();
  return hasPermission(permission);
}

/**
 * 角色控制 Hook
 * 用于在组件中检查用户是否具有特定角色
 *
 * @example
 * ```tsx
 * const isAdmin = useRole(['admin', 'owner']);
 * if (!isAdmin) return <NoPermission />;
 * ```
 */
export function useRole(roles: string[]): boolean {
  const { hasRole } = useAuth();
  return hasRole(roles);
}
