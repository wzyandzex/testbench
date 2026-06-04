/**
 * 权限控制 Hook
 */

import { useMemo } from 'react';
import { useAuthStore } from '@/stores';

export type Permission =
  | 'users.read'
  | 'users.write'
  | 'users.delete'
  | 'organizations.read'
  | 'organizations.write'
  | 'organizations.delete'
  | 'benchmarks.read'
  | 'benchmarks.write'
  | 'benchmarks.delete'
  | 'agents.read'
  | 'agents.write'
  | 'agents.delete'
  | 'executions.read'
  | 'executions.write'
  | 'executions.delete'
  | 'batches.read'
  | 'batches.write'
  | 'batches.delete'
  | 'schedulers.read'
  | 'schedulers.write'
  | 'schedulers.delete'
  | 'metrics.read'
  | 'settings.read'
  | 'settings.write';

export type Role = 'admin' | 'user' | 'viewer' | 'operator';

// 角色默认权限映射
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    // 管理员拥有所有权限
    'users.read', 'users.write', 'users.delete',
    'organizations.read', 'organizations.write', 'organizations.delete',
    'benchmarks.read', 'benchmarks.write', 'benchmarks.delete',
    'agents.read', 'agents.write', 'agents.delete',
    'executions.read', 'executions.write', 'executions.delete',
    'batches.read', 'batches.write', 'batches.delete',
    'schedulers.read', 'schedulers.write', 'schedulers.delete',
    'metrics.read',
    'settings.read', 'settings.write',
  ],
  operator: [
    // 操作员可以执行和管理任务，但不能删除
    'users.read',
    'organizations.read',
    'benchmarks.read', 'benchmarks.write',
    'agents.read', 'agents.write',
    'executions.read', 'executions.write',
    'batches.read', 'batches.write',
    'schedulers.read', 'schedulers.write',
    'metrics.read',
  ],
  user: [
    // 普通用户只能查看和创建自己的资源
    'benchmarks.read',
    'agents.read',
    'executions.read',
    'metrics.read',
  ],
  viewer: [
    // 访客只能查看
    'benchmarks.read',
    'agents.read',
    'executions.read',
    'metrics.read',
  ],
};

export interface UsePermissionReturn {
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;
  hasAllPermissions: (permissions: Permission[]) => boolean;
  hasRole: (role: Role) => boolean;
  isAdmin: boolean;
  isOperator: boolean;
  isUser: boolean;
  isViewer: boolean;
}

/**
 * 权限控制 Hook
 */
export function usePermission(): UsePermissionReturn {
  const user = useAuthStore((state) => state.user);

  const userRole: Role = useMemo(() => {
    return user?.role as Role || 'viewer';
  }, [user?.role]);

  // 获取用户的所有权限
  const permissions = useMemo<Permission[]>(() => {
    return ROLE_PERMISSIONS[userRole] || [];
  }, [userRole]);

  // 检查是否有某个权限
  const hasPermission = useMemo(
    () => (permission: Permission): boolean => {
      return permissions.includes(permission);
    },
    [permissions]
  );

  // 检查是否有任意一个权限
  const hasAnyPermission = useMemo(
    () => (requiredPermissions: Permission[]): boolean => {
      return requiredPermissions.some((p) => permissions.includes(p));
    },
    [permissions]
  );

  // 检查是否拥有所有权限
  const hasAllPermissions = useMemo(
    () => (requiredPermissions: Permission[]): boolean => {
      return requiredPermissions.every((p) => permissions.includes(p));
    },
    [permissions]
  );

  // 检查是否有某个角色
  const hasRole = useMemo(
    () => (role: Role): boolean => {
      return userRole === role;
    },
    [userRole]
  );

  // 角色快捷判断
  const isAdmin = useMemo(() => userRole === 'admin', [userRole]);
  const isOperator = useMemo(() => userRole === 'operator' || userRole === 'admin', [userRole]);
  const isUser = useMemo(() => userRole === 'user' || userRole === 'operator' || userRole === 'admin', [userRole]);
  const isViewer = useMemo(() => userRole === 'viewer', [userRole]);

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isAdmin,
    isOperator,
    isUser,
    isViewer,
  };
}

export default usePermission;
