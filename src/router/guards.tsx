import { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Spin, Result, Button } from 'antd';
import { useAuthStore, useWorkspaceStore } from '@/stores';
import { runtimeConfig } from '@/constants/runtime';

function AuthHydrationFallback() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <Spin size="large" tip="正在恢复登录状态..." />
    </div>
  );
}

/**
 * 根路径守卫 - 根据登录状态动态跳转
 * 未登录用户显示 Landing Page，已登录用户跳转到 Dashboard
 */
export function RootGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const location = useLocation();

  if (!hasHydrated) {
    return <AuthHydrationFallback />;
  }

  // 已登录用户访问根路径时重定向到 dashboard
  if (isAuthenticated && location.pathname === '/') {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

/**
 * 认证守卫
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const location = useLocation();

  if (!hasHydrated) {
    return <AuthHydrationFallback />;
  }

  if (!isAuthenticated) {
    // 保存原始路径，登录后跳转回来
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/**
 * 公开路由守卫（已登录用户跳转到首页）
 */
export function PublicGuard({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const hasHydrated = useAuthStore((state) => state.hasHydrated);

  if (!hasHydrated) {
    return <AuthHydrationFallback />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

/**
 * 权限守卫
 */
interface PermissionGuardProps {
  children: React.ReactNode;
  requiredRole?: string[];
  requiredPermission?: string;
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  children,
  requiredRole,
  requiredPermission,
  fallback,
}: PermissionGuardProps) {
  const hasRole = useAuthStore((state) => state.hasRole);
  const hasPermission = useAuthStore((state) => state.hasPermission);

  const roleAllowed = requiredRole ? hasRole(requiredRole as any) : true;
  const permissionAllowed = requiredPermission ? hasPermission(requiredPermission) : true;

  if (!roleAllowed || !permissionAllowed) {
    return (
      fallback || (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
          }}
        >
          <h2 style={{ fontSize: '72px', margin: 0, color: '#ff4d4f' }}>403</h2>
          <p style={{ fontSize: '16px', color: '#999' }}>抱歉，您没有权限访问此页面</p>
        </div>
      )
    );
  }

  return <>{children}</>;
}

/**
 * 组织守卫 - 确保用户有活跃的组织上下文
 */
export function OrgGuard({ children }: { children: React.ReactNode }) {
  const isInitialized = useWorkspaceStore((s) => s.isInitialized);
  const currentOrg = useWorkspaceStore((s) => s.currentOrg);
  const memberships = useWorkspaceStore((s) => s.memberships);
  const error = useWorkspaceStore((s) => s.error);
  const autoSelectOrg = useWorkspaceStore((s) => s.autoSelectOrg);

  useEffect(() => {
    if (!isInitialized) {
      autoSelectOrg();
    }
  }, [isInitialized, autoSelectOrg]);

  // 加载中
  if (!isInitialized) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        }}
      >
        <Spin size="large" tip="正在加载工作区..." />
      </div>
    );
  }

  // 错误
  if (error && !currentOrg) {
    return (
      <Result
        status="error"
        title="工作区加载失败"
        subTitle={error}
        extra={[
          <Button type="primary" key="retry" onClick={() => autoSelectOrg()}>
            重试
          </Button>,
        ]}
      />
    );
  }

  // 无组织
  if (memberships.length === 0 && !currentOrg) {
    return (
      <Result
        status="info"
        title="暂无组织"
        subTitle="您还没有加入任何组织，请先创建或加入一个组织。"
        extra={[
          <Button type="primary" key="create" href="/organizations">
            管理组织
          </Button>,
        ]}
      />
    );
  }

  return <>{children}</>;
}

export function LegacySWEGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();

  if (runtimeConfig.features.legacySWEEnabled) {
    return <>{children}</>;
  }

  return (
    <Result
      status="info"
      title="Legacy SWE compatibility is disabled"
      subTitle="The retained /swe surface is compatibility-only and is not part of the default mainline workflow."
      extra={[
        <Button type="primary" key="project-eval" onClick={() => navigate('/project-eval')}>
          Go to Project Eval
        </Button>,
        <Button key="governance" onClick={() => navigate('/governance')}>
          Go to Governance
        </Button>,
      ]}
    />
  );
}
