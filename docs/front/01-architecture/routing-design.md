# React Router v6 路由设计

## 路由配置

### 路由结构

```
/                          → 重定向到 /dashboard
/login                     → 登录页面
/register                  → 注册页面
/dashboard                 → 仪表盘
/benchmarks                → 评测任务列表
/benchmarks/:id            → 评测任务详情
/benchmarks/:id/edit       → 编辑评测任务
/benchmarks/create         → 创建评测任务
/executions                → 执行记录列表
/executions/:id            → 执行记录详情
/agents                    → Agent 管理
/agents/:id                → Agent 详情
/batch                     → 批量执行
/metrics                   → 指标分析
/scheduler                 → 调度管理
/organizations             → 组织管理
/settings                  → 用户设置
/notifications             → 通知中心
```

### 路由配置实现

```typescript
// src/router/routes.tsx
import { createLazyRoute, createRoute } from '@tanstack/react-router';

// 公开路由
export const loginRoute = createLazyRoute('/login')({
  component: () => import('@/pages/auth/LoginPage'),
});

export const registerRoute = createLazyRoute('/register')({
  component: () => import('@/pages/auth/RegisterPage'),
});

// 受保护路由布局
export const rootRoute = createRoute({
  component: () => import('@/components/layout/ProtectedLayout'),
});

// 子路由
export const dashboardRoute = createLazyRoute('/dashboard')({
  component: () => import('@/pages/dashboard/DashboardPage'),
});

export const benchmarksRoute = createLazyRoute('/benchmarks')({
  component: () => import('@/pages/benchmarks/BenchmarkListPage'),
});

export const benchmarksDetailRoute = createLazyRoute('/benchmarks/$id')({
  component: () => import('@/pages/benchmarks/BenchmarkDetailPage'),
});

// ... 更多路由
```

## 路由守卫

### 认证守卫

```typescript
// src/router/guards/authGuard.tsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const location = useLocation();

  if (!isAuthenticated) {
    // 保存原始路径，登录后跳转回来
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
```

### 权限守卫

```typescript
// src/router/guards/permissionGuard.tsx
import { useAuthStore } from '@/stores/authStore';
import { Result, Button } from 'antd';

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

  const roleAllowed = requiredRole ? hasRole(requiredRole) : true;
  const permissionAllowed = requiredPermission ? hasPermission(requiredPermission) : true;

  if (!roleAllowed || !permissionAllowed) {
    return (
      fallback || (
        <Result
          status="403"
          title="403"
          subTitle="抱歉，您没有权限访问此页面"
          extra={
            <Button type="primary" onClick={() => window.history.back()}>
              返回
            </Button>
          }
        />
      )
    );
  }

  return <>{children}</>;
}
```

### 组织上下文守卫

```typescript
// src/router/guards/orgGuard.tsx
import { useUiStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';
import { useNavigate } from 'react-router-dom';

export function OrgGuard({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const currentOrg = useUiStore((state) => state.currentOrganization);
  const navigate = useNavigate();

  useEffect(() => {
    // 如果用户属于组织但未选择组织，跳转到组织选择页
    if (user?.organization_id && !currentOrg) {
      navigate('/organizations/select');
    }
  }, [user, currentOrg, navigate]);

  if (user?.organization_id && !currentOrg) {
    return null; // 或显示加载状态
  }

  return <>{children}</>;
}
```

## 路由布局

### 主布局

```typescript
// src/components/layout/ProtectedLayout.tsx
import { Outlet } from 'react-router-dom';
import { AppLayout } from './AppLayout';

export function ProtectedLayout() {
  return (
    <AuthGuard>
      <AppLayout>
        <Outlet />
      </AppLayout>
    </AuthGuard>
  );
}
```

### AppLayout 结构

```typescript
// src/components/layout/AppLayout.tsx
import { Layout } from 'antd';
import { AppHeader } from './AppHeader';
import { AppSidebar } from './AppSidebar';

const { Content } = Layout;

export function AppLayout({ children }: { children: React.ReactNode }) {
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppSidebar collapsed={sidebarCollapsed} />
      <Layout>
        <AppHeader />
        <Content style={{ margin: '16px' }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
}
```

## 嵌套路由

### 父子路由配置

```typescript
// Benchmark 详情页的嵌套路由
{
  path: '/benchmarks/:id',
  element: <BenchmarkDetailLayout />,
  children: [
    { index: true, element: <BenchmarkOverview /> },
    { path: 'executions', element: <BenchmarkExecutions /> },
    { path: 'settings', element: <BenchmarkSettings /> },
    { path: 'edit', element: <BenchmarkEdit /> },
  ],
}
```

### 嵌套路由组件

```typescript
// src/pages/benchmarks/BenchmarkDetailLayout.tsx
import { Outlet, useParams, Link } from 'react-router-dom';
import { Tabs } from 'antd';

export function BenchmarkDetailLayout() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // 根据当前路径确定激活的 tab
  const getActiveKey = () => {
    if (location.pathname.endsWith('/executions')) return 'executions';
    if (location.pathname.endsWith('/settings')) return 'settings';
    if (location.pathname.endsWith('/edit')) return 'edit';
    return 'overview';
  };

  const handleTabChange = (key: string) => {
    navigate(`/benchmarks/${id}/${key === 'overview' ? '' : key}`);
  };

  return (
    <div>
      <Tabs activeKey={getActiveKey()} onChange={handleTabChange}>
        <Tabs.TabPane tab="概览" key="overview" />
        <Tabs.TabPane tab="执行记录" key="executions" />
        <Tabs.TabPane tab="设置" key="settings" />
      </Tabs>
      <Outlet />
    </div>
  );
}
```

## 路由参数

### 路径参数

```typescript
// 获取路径参数
function BenchmarkDetail() {
  const { id } = useParams<'id'>();

  useEffect(() => {
    if (id) {
      fetchBenchmark(id);
    }
  }, [id]);

  // ...
}
```

### 查询参数

```typescript
// 处理查询参数
import { useSearchParams } from 'react-router-dom';

function BenchmarkList() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('page_size') || '20');
  const status = searchParams.get('status');

  const handlePageChange = (newPage: number) => {
    setSearchParams({ page: newPage.toString() });
  };

  const handleFilterChange = (newStatus: string) => {
    setSearchParams({ status: newStatus, page: '1' });
  };

  // ...
}
```

## 路由跳转

### 声明式导航

```typescript
import { Link, NavLink } from 'react-router-dom';

// Link - 基础导航
<Link to="/benchmarks">评测任务</Link>

// NavLink - 带激活状态
<NavLink
  to="/executions"
  className={({ isActive }) => isActive ? 'active' : ''}
>
  执行记录
</NavLink>

// 带参数的 Link
<Link to={`/benchmarks/${benchmark.id}`}>查看详情</Link>

// 带查询参数
<Link to="/benchmarks?page=2&status=active">下一页</Link>
```

### 命令式导航

```typescript
import { useNavigate } from 'react-router-dom';

function Component() {
  const navigate = useNavigate();

  // 基础跳转
  const handleClick = () => {
    navigate('/benchmarks');
  };

  // 带状态跳转
  const handleEdit = () => {
    navigate('/benchmarks/123/edit', {
      state: { from: 'list' },
    });
  };

  // 替换当前历史
  const handleReplace = () => {
    navigate('/login', { replace: true });
  };

  // 后退
  const goBack = () => {
    navigate(-1);
  };

  // ...
}
```

## 动态路由

### 基于权限的路由

```typescript
// src/router/dynamicRoutes.tsx
import { useAuthStore } from '@/stores/authStore';

export function useDynamicRoutes() {
  const user = useAuthStore((state) => state.user);
  const hasRole = useAuthStore((state) => state.hasRole);

  const adminRoutes = [
    {
      path: '/admin',
      label: '系统管理',
      icon: <SettingOutlined />,
      children: [
        { path: '/admin/users', label: '用户管理' },
        { path: '/admin/organizations', label: '组织管理' },
        { path: '/admin/system', label: '系统设置' },
      ],
    },
  ];

  const commonRoutes = [
    { path: '/dashboard', label: '仪表盘', icon: <DashboardOutlined /> },
    { path: '/benchmarks', label: '评测任务', icon: <ExperimentOutlined /> },
    { path: '/executions', label: '执行记录', icon: <PlayCircleOutlined /> },
    { path: '/agents', label: 'Agent 管理', icon: <RobotOutlined /> },
  ];

  if (hasRole(['admin'])) {
    return [...commonRoutes, ...adminRoutes];
  }

  return commonRoutes;
}
```

## 404 处理

```typescript
// src/router/routes.tsx
import { useRouteError, isRouteErrorResponse } from 'react-router-dom';

function NotFound() {
  const error = useRouteError();

  return (
    <Result
      status="404"
      title="404"
      subTitle="抱歉，您访问的页面不存在"
      extra={
        <Button type="primary" href="/">
          返回首页
        </Button>
      }
    />
  );
}

// 错误处理
function ErrorBoundary() {
  const error = useRouteError();

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      return <NotFound />;
    }
    if (error.status === 401) {
      return <Navigate to="/login" />;
    }
    if (error.status === 403) {
      return <Result status="403" title="403" subTitle="没有权限访问" />;
    }
  }

  return <Result status="500" title="500" subTitle="服务器错误" />;
}

// 路由配置中添加错误元素
{
  path: '*',
  element: <NotFound />,
  errorElement: <ErrorBoundary />,
}
```

## 路由过渡动画

```typescript
// src/components/layout/PageTransition.tsx
import { useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  return (
    <TransitionGroup>
      <CSSTransition
        key={location.pathname}
        classNames="page"
        timeout={300}
        unmountOnExit
      >
        {children}
      </CSSTransition>
    </TransitionGroup>
  );
}

// CSS
// .page-enter { opacity: 0; transform: translateX(20px); }
// .page-enter-active { opacity: 1; transform: translateX(0); transition: all 300ms; }
// .page-exit { opacity: 1; }
// .page-exit-active { opacity: 0; transition: all 300ms; }
```

## 路由配置最佳实践

1. **路由集中管理** - 统一在 router 目录下配置
2. **懒加载** - 使用 lazy 减少初始加载体积
3. **权限分层** - 路由级权限 + 组件级权限
4. **错误处理** - 404、403、500 等状态页面
5. **保持 URL 语义** - URL 应清晰表达资源层级
