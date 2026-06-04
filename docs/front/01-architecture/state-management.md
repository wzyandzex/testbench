# Zustand 状态管理方案

## 概述

Zustand 是一个轻量级的状态管理库，具有以下优势：

- **简单** - 无需 Provider 包裹，API 简洁
- **TypeScript 友好** - 完整的类型推导
- **性能优秀** - 细粒度订阅，减少不必要渲染
- **无 Boilerplate** - 代码量少，易于维护

## Store 结构设计

### Store 分类

```
stores/
├── authStore.ts      # 认证状态
├── uiStore.ts        # UI 状态
├── wsStore.ts        # WebSocket 状态
├── benchmarkStore.ts # 评测任务状态
└── index.ts          # 统一导出
```

## 核心 Store 实现

### authStore - 认证状态

```typescript
// src/stores/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  avatar?: string;
  organization_id?: string;
}

interface AuthState {
  // 状态
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;

  // Actions
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<User>) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  hasPermission: (permission: string) => boolean;
  hasRole: (roles: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 初始状态
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,

      // 设置认证信息
      setAuth: (user, accessToken, refreshToken) => {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
        });
      },

      // 更新用户信息
      updateUser: (user) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...user } : null,
        }));
      },

      // 设置 Token
      setTokens: (accessToken, refreshToken) => {
        set({ accessToken, refreshToken });
      },

      // 清除认证信息
      clearAuth: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          isAuthenticated: false,
        });
      },

      // 检查权限
      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        if (user.role === 'admin') return true;
        // TODO: 实现具体权限检查逻辑
        return true;
      },

      // 检查角色
      hasRole: (roles) => {
        const { user } = get();
        if (!user) return false;
        return roles.includes(user.role);
      },
    }),
    {
      name: 'auth-storage',
      // 只持久化部分字段
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    }
  )
);
```

### uiStore - UI 状态

```typescript
// src/stores/uiStore.ts
import { create } from 'zustand';

interface UiState {
  // 侧边栏
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // 主题
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;

  // 全局加载
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;

  // 语言
  language: 'zh-CN' | 'en-US';
  setLanguage: (language: 'zh-CN' | 'en-US') => void;

  // 通知中心
  notificationVisible: boolean;
  notificationCount: number;
  setNotificationVisible: (visible: boolean) => void;
  setNotificationCount: (count: number) => void;
  incrementNotification: () => void;

  // 当前组织
  currentOrganization: string | null;
  setCurrentOrganization: (orgId: string | null) => void;
}

export const useUiStore = create<UiState>((set) => ({
  // 侧边栏
  sidebarCollapsed: false,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  // 主题
  theme: 'light',
  setTheme: (theme) => set({ theme }),

  // 全局加载
  globalLoading: false,
  setGlobalLoading: (loading) => set({ globalLoading: loading }),

  // 语言
  language: 'zh-CN',
  setLanguage: (language) => set({ language }),

  // 通知中心
  notificationVisible: false,
  notificationCount: 0,
  setNotificationVisible: (visible) => set({ notificationVisible: visible }),
  setNotificationCount: (count) => set({ notificationCount: count }),
  incrementNotification: () => set((state) => ({ notificationCount: state.notificationCount + 1 })),

  // 当前组织
  currentOrganization: null,
  setCurrentOrganization: (orgId) => set({ currentOrganization: orgId }),
}));
```

### wsStore - WebSocket 状态

```typescript
// src/stores/wsStore.ts
import { create } from 'zustand';

type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

interface WsMessage {
  type: string;
  data: any;
  timestamp: number;
}

interface WsState {
  // 连接状态
  connectionState: ConnectionState;
  setConnectionState: (state: ConnectionState) => void;

  // 消息队列
  messages: WsMessage[];
  addMessage: (message: WsMessage) => void;
  clearMessages: () => void;

  // 订阅管理
  subscriptions: Set<string>;
  subscribe: (channel: string) => void;
  unsubscribe: (channel: string) => void;
  isSubscribed: (channel: string) => boolean;

  // 任务状态缓存
  taskStates: Map<string, any>;
  updateTaskState: (taskId: string, state: any) => void;
  getTaskState: (taskId: string) => any;
}

export const useWsStore = create<WsState>((set, get) => ({
  // 连接状态
  connectionState: 'disconnected',
  setConnectionState: (state) => set({ connectionState: state }),

  // 消息队列
  messages: [],
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, { ...message, timestamp: Date.now() }],
  })),
  clearMessages: () => set({ messages: [] }),

  // 订阅管理
  subscriptions: new Set(),
  subscribe: (channel) => set((state) => {
    const newSubscriptions = new Set(state.subscriptions);
    newSubscriptions.add(channel);
    return { subscriptions: newSubscriptions };
  }),
  unsubscribe: (channel) => set((state) => {
    const newSubscriptions = new Set(state.subscriptions);
    newSubscriptions.delete(channel);
    return { subscriptions: newSubscriptions };
  }),
  isSubscribed: (channel) => get().subscriptions.has(channel),

  // 任务状态缓存
  taskStates: new Map(),
  updateTaskState: (taskId, state) => set((state) => {
    const newTaskStates = new Map(state.taskStates);
    newTaskStates.set(taskId, { ...newTaskStates.get(taskId), ...state });
    return { taskStates: newTaskStates };
  }),
  getTaskState: (taskId) => get().taskStates.get(taskId),
}));
```

### benchmarkStore - 评测任务状态

```typescript
// src/stores/benchmarkStore.ts
import { create } from 'zustand';

interface BenchmarkFilter {
  status?: string[];
  page: number;
  page_size: number;
}

interface BenchmarkState {
  // 列表数据
  benchmarks: any[];
  total: number;
  loading: boolean;

  // 筛选条件
  filter: BenchmarkFilter;

  // Actions
  setBenchmarks: (benchmarks: any[], total: number) => void;
  setLoading: (loading: boolean) => void;
  setFilter: (filter: Partial<BenchmarkFilter>) => void;
  resetFilter: () => void;

  // 选中项
  selectedIds: string[];
  setSelectedIds: (ids: string[]) => void;
  toggleSelect: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
}

const defaultFilter: BenchmarkFilter = {
  status: [],
  page: 1,
  page_size: 20,
};

export const useBenchmarkStore = create<BenchmarkState>((set, get) => ({
  // 初始状态
  benchmarks: [],
  total: 0,
  loading: false,
  filter: defaultFilter,
  selectedIds: [],

  // 数据操作
  setBenchmarks: (benchmarks, total) => set({ benchmarks, total }),
  setLoading: (loading) => set({ loading }),
  setFilter: (newFilter) => set((state) => ({
    filter: { ...state.filter, ...newFilter },
  })),
  resetFilter: () => set({ filter: defaultFilter }),

  // 选择操作
  setSelectedIds: (ids) => set({ selectedIds: ids }),
  toggleSelect: (id) => set((state) => ({
    selectedIds: state.selectedIds.includes(id)
      ? state.selectedIds.filter((sid) => sid !== id)
      : [...state.selectedIds, id],
  })),
  selectAll: () => set((state) => ({
    selectedIds: state.benchmarks.map((b) => b.id),
  })),
  clearSelection: () => set({ selectedIds: [] }),
}));
```

## 最佳实践

### 1. 细粒度订阅

```typescript
// ❌ 不好的做法 - 订阅整个 store
const { user, accessToken, refreshToken } = useAuthStore();

// ✅ 好的做法 - 只订阅需要的字段
const user = useAuthStore((state) => state.user);
const hasPermission = useAuthStore((state) => state.hasPermission);
```

### 2. Actions 稳定引用

```typescript
// Zustand actions 自动稳定引用，可以直接使用
const setTheme = useUiStore((state) => state.setTheme);

// 传递给子组件不会导致重渲染
<Button onClick={() => setTheme('dark')} />
```

### 3. 异步 Action

```typescript
// 在 store 中处理异步操作
interface AuthState {
  // ...
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  // ...
  login: async (username, password) => {
    set({ globalLoading: true });
    try {
      const response = await authApi.login({ username, password });
      set({
        user: response.user,
        accessToken: response.access_token,
        refreshToken: response.refresh_token,
        isAuthenticated: true,
      });
    } finally {
      set({ globalLoading: false });
    }
  },
  logout: async () => {
    await authApi.logout();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
    });
  },
}));
```

### 4. 组合多个 Store

```typescript
// 在组件中使用多个 store
function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const sidebarCollapsed = useUiStore((state) => state.sidebarCollapsed);
  const connectionState = useWsStore((state) => state.connectionState);

  // ...
}
```

### 5. DevTools 集成

```typescript
// 启用 Redux DevTools
import { devtools } from 'zustand/middleware';

export const useAuthStore = create<AuthState>()(
  devtools(
    (set, get) => ({
      // ...
    }),
    { name: 'AuthStore' }
  )
);
```

## 与组件集成

### 函数组件中使用

```typescript
import { useAuthStore } from '@/stores/authStore';

function UserProfile() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);

  if (!user) return null;

  return (
    <div>
      <h1>{user.username}</h1>
      <button onClick={() => updateUser({ username: 'new name' })}>
        更新名称
      </button>
    </div>
  );
}
```

### 在自定义 Hook 中使用

```typescript
function useRequireAuth() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    if (!isAuthenticated) {
      // 跳转到登录页
      navigate('/login');
    }
  }, [isAuthenticated]);

  return user;
}
```

## 持久化策略

### localStorage 持久化

```typescript
import { persist } from 'zustand/middleware';

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // ...
    }),
    {
      name: 'auth-storage',
      // 持久化部分字段
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
      }),
    }
  )
);
```

### sessionStorage 持久化

```typescript
import { persist, createJSONStorage } from 'zustand/middleware';

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      // ...
    }),
    {
      name: 'ui-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);
```

## 测试

### 测试 Store

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/stores/authStore';

describe('authStore', () => {
  it('should set auth correctly', () => {
    const { result } = renderHook(() => useAuthStore());

    act(() => {
      result.current.setAuth(
        { id: '1', username: 'test', email: 'test@test.com', role: 'user' },
        'access-token',
        'refresh-token'
      );
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.username).toBe('test');
  });
});
```
