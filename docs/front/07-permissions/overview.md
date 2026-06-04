# 权限系统概览

## 权限模型

### 用户角色

| 角色 | 说明 | 权限范围 |
|------|------|---------|
| **admin** | 系统管理员 | 拥有所有权限 |
| **user** | 普通用户 | 可执行读写操作 |
| **viewer** | 只读用户 | 仅可查看数据 |

### 组织角色

| 角色 | 说明 | 权限范围 |
|------|------|---------|
| **admin** | 组织管理员 | 管理组织成员、设置、资源 |
| **member** | 组织成员 | 查看数据、执行任务 |
| **guest** | 访客 | 只读权限 |

### 权限矩阵

| 操作 | admin | user | viewer | org_admin | org_member | org_guest |
|------|-------|------|--------|-----------|------------|-----------|
| 查看列表 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 查看详情 | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| 创建资源 | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ |
| 编辑资源 | ✓ | ✓ | ✗ | ✓ | 自有 | ✗ |
| 删除资源 | ✓ | ✗ | ✗ | ✓ | 自有 | ✗ |
| 执行任务 | ✓ | ✓ | ✗ | ✓ | ✓ | ✗ |
| 管理用户 | ✓ | ✗ | ✗ | ✓ | ✗ | ✗ |
| 系统设置 | ✓ | ✗ | ✗ | ✗ | ✗ | ✗ |

---

## 权限检查 Hook

```typescript
// src/hooks/usePermissions.ts
import { useAuthStore } from '@/stores/authStore';

export function usePermissions() {
  const user = useAuthStore((state) => state.user);
  const hasRole = useAuthStore((state) => state.hasRole);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  // 检查是否是管理员
  const isAdmin = hasRole(['admin']);

  // 检查是否可写
  const canWrite = hasRole(['admin', 'user']);

  // 检查是否是组织管理员
  const isOrgAdmin = user?.organization_role === 'admin';

  // 检查资源所有权
  const canEdit = (resourceUserId: string) => {
    return isAdmin || user?.id === resourceUserId;
  };

  // 检查操作权限
  const canPerformAction = (action: string, resource?: { user_id?: string }) => {
    // 管理员可以执行所有操作
    if (isAdmin) return true;

    // 检查具体权限
    const permissions: Record<string, string[]> = {
      'benchmarks.create': ['admin', 'user'],
      'benchmarks.delete': ['admin'],
      'executions.create': ['admin', 'user'],
      'agents.manage': ['admin'],
    };

    const allowedRoles = permissions[action];
    if (!allowedRoles) return false;

    return hasRole(allowedRoles);
  };

  return {
    user,
    isAdmin,
    canWrite,
    isOrgAdmin,
    canEdit,
    canPerformAction,
  };
}
```

---

## 权限指令组件

### PermissionGuard 组件

```typescript
// src/components/PermissionGuard.tsx
import { ReactNode } from 'react';
import { Result, Button } from 'antd';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
  requiredRoles?: string[];
  requiredPermissions?: string[];
  requireAll?: boolean;  // true: 需要所有权限，false: 任一权限即可
}

export function PermissionGuard({
  children,
  fallback,
  requiredRoles,
  requiredPermissions,
  requireAll = true,
}: PermissionGuardProps) {
  const { canPerformAction } = usePermissions();

  let hasPermission = true;

  // 检查角色
  if (requiredRoles) {
    // 角色检查逻辑...
  }

  // 检查权限
  if (requiredPermissions) {
    if (requireAll) {
      hasPermission = requiredPermissions.every(p => canPerformAction(p));
    } else {
      hasPermission = requiredPermissions.some(p => canPerformAction(p));
    }
  }

  if (!hasPermission) {
    return (
      fallback || (
        <Result
          status="403"
          title="403"
          subTitle="抱歉，您没有权限访问此内容"
        />
      )
    );
  }

  return <>{children}</>;
}
```

### 使用示例

```tsx
// 页面级权限
<PermissionGuard requiredRoles={['admin', 'user']}>
  <BenchmarkCreatePage />
</PermissionGuard>

// 操作级权限
<PermissionGuard requiredPermissions={['benchmarks.delete']}>
  <Button danger>删除</Button>
</PermissionGuard>

// 自定义降级 UI
<PermissionGuard
  requiredPermissions={['agents.manage']}
  fallback={<div>仅管理员可见</div>}
>
  <AgentConfigPanel />
</PermissionGuard>
```

---

## 按钮权限

```typescript
// src/components/ActionButton.tsx
import { Button, ButtonProps } from 'antd';
import { usePermissions } from '@/hooks/usePermissions';

interface ActionButtonProps extends ButtonProps {
  permission?: string;
  roles?: string[];
  fallback?: React.ReactNode;
}

export function ActionButton({
  permission,
  roles,
  fallback,
  children,
  ...props
}: ActionButtonProps) {
  const { canPerformAction } = usePermissions();

  let hasPermission = true;

  if (permission) {
    hasPermission = canPerformAction(permission);
  }

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <Button {...props}>{children}</Button>;
}

// 使用示例
<ActionButton permission="benchmarks.delete" danger>
  删除
</ActionButton>

<ActionButton permission="agents.manage" type="primary">
  创建 Agent
</ActionButton>

<ActionButton
  permission="executions.create"
  fallback={<Button disabled>创建任务</Button>}
>
  创建任务
</ActionButton>
```

---

## 菜单权限

```typescript
// src/router/menuConfig.ts
import { PermissionGuard } from '@/components/PermissionGuard';

export const menuItems = [
  {
    key: '/dashboard',
    label: '仪表盘',
    icon: <DashboardOutlined />,
    roles: ['admin', 'user', 'viewer'],
  },
  {
    key: '/benchmarks',
    label: '评测任务',
    icon: <ExperimentOutlined />,
    roles: ['admin', 'user', 'viewer'],
  },
  {
    key: '/agents',
    label: 'Agent 管理',
    icon: <RobotOutlined />,
    roles: ['admin'],
    permission: 'agents.manage',
  },
  {
    key: '/admin',
    label: '系统管理',
    icon: <SettingOutlined />,
    roles: ['admin'],
    children: [
      { key: '/admin/users', label: '用户管理' },
      { key: '/admin/organizations', label: '组织管理' },
      { key: '/admin/system', label: '系统设置' },
    ],
  },
];

// 过滤菜单
export function filterMenuItems(items: MenuItem[], user: User): MenuItem[] {
  return items.filter(item => {
    // 检查角色
    if (item.roles && !item.roles.includes(user.role)) {
      return false;
    }

    // 检查权限
    if (item.permission && !canPerformAction(item.permission, user)) {
      return false;
    }

    // 递归过滤子菜单
    if (item.children) {
      item.children = filterMenuItems(item.children, user);
    }

    return true;
  });
}
```

---

## 权限常量定义

```typescript
// src/constants/permissions.ts
export const PERMISSIONS = {
  // Benchmark 权限
  BENCHMARK_VIEW: 'benchmarks.view',
  BENCHMARK_CREATE: 'benchmarks.create',
  BENCHMARK_EDIT: 'benchmarks.edit',
  BENCHMARK_DELETE: 'benchmarks.delete',
  BENCHMARK_EXECUTE: 'benchmarks.execute',
  BENCHMARK_IMPORT: 'benchmarks.import',
  BENCHMARK_EXPORT: 'benchmarks.export',

  // Execution 权限
  EXECUTION_VIEW: 'executions.view',
  EXECUTION_CREATE: 'executions.create',
  EXECUTION_CANCEL: 'executions.cancel',
  EXECUTION_RETRY: 'executions.retry',
  EXECUTION_DELETE: 'executions.delete',

  // Agent 权限
  AGENT_VIEW: 'agents.view',
  AGENT_CREATE: 'agents.create',
  AGENT_EDIT: 'agents.edit',
  AGENT_DELETE: 'agents.delete',
  AGENT_MANAGE: 'agents.manage',

  // Batch 权限
  BATCH_VIEW: 'batch.view',
  BATCH_CREATE: 'batch.create',
  BATCH_CANCEL: 'batch.cancel',

  // Organization 权限
  ORG_VIEW: 'organizations.view',
  ORG_CREATE: 'organizations.create',
  ORG_EDIT: 'organizations.edit',
  ORG_DELETE: 'organizations.delete',
  ORG_MANAGE_MEMBERS: 'organizations.manage_members',

  // User 权限
  USER_VIEW: 'users.view',
  USER_CREATE: 'users.create',
  USER_EDIT: 'users.edit',
  USER_DELETE: 'users.delete',
  USER_CHANGE_ROLE: 'users.change_role',

  // System 权限
  SYSTEM_VIEW: 'system.view',
  SYSTEM_SETTINGS: 'system.settings',
  SYSTEM_LOGS: 'system.logs',
  SYSTEM_METRICS: 'system.metrics',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];
```

---

## 权限 Hook

```typescript
// src/hooks/useAuthorization.ts
import { useMemo } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { PERMISSIONS } from '@/constants/permissions';

export function useAuthorization() {
  const user = useAuthStore((state) => state.user);

  // 检查单个权限
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    if (user.role === 'admin') return true;

    // TODO: 根据实际后端权限实现调整
    return true;
  };

  // 检查多个权限（满足其一即可）
  const hasAnyPermission = (...permissions: string[]): boolean => {
    return permissions.some(p => hasPermission(p));
  };

  // 检查多个权限（必须全部满足）
  const hasAllPermissions = (...permissions: string[]): boolean => {
    return permissions.every(p => hasPermission(p));
  };

  // 检查角色
  const hasRole = (roles: string[]): boolean => {
    if (!user) return false;
    return roles.includes(user.role);
  };

  // 检查是否是资源所有者
  const isOwner = (resourceUserId: string): boolean => {
    return user?.id === resourceUserId;
  };

  // 获取可执行的操作
  const getAvailableActions = (
    resourceType: string,
    resourceUserId?: string
  ): string[] => {
    const actions: string[] = [];

    if (hasPermission(`${resourceType}.view`)) {
      actions.push('view');
    }

    if (hasPermission(`${resourceType}.create`)) {
      actions.push('create');
    }

    if (hasPermission(`${resourceType}.edit`) || (resourceUserId && isOwner(resourceUserId))) {
      actions.push('edit');
    }

    if (hasPermission(`${resourceType}.delete`)) {
      actions.push('delete');
    }

    if (hasPermission(`${resourceType}.execute`)) {
      actions.push('execute');
    }

    return actions;
  };

  return {
    user,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
    isOwner,
    getAvailableActions,
  };
}
```
