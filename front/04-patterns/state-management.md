# 状态管理

## 概述

使用 Zustand 进行全局状态管理。

---

## Store 结构

```
stores/
├── index.ts              # 导出所有 store
├── authStore.ts          # 认证状态
├── uiStore.ts            # UI 状态
├── wsStore.ts            # WebSocket 状态
├── notificationStore.ts  # 通知状态
├── organizationStore.ts  # 组织状态
└── [domain]Store.ts      # 各领域状态
```

---

## 认证 Store

```typescript
// src/stores/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  // 状态
  user: UserInfo | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean

  // 操作
  setAuth: (user: UserInfo, token: string) => void
  setTokens: (token: string, refreshToken: string) => void
  clearAuth: () => void
  updateUser: (user: Partial<UserInfo>) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true })
      },

      setTokens: (token, refreshToken) => {
        set({ token, refreshToken })
        localStorage.setItem('access_token', token)
        localStorage.setItem('refresh_token', refreshToken)
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false
        })
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
      },

      updateUser: (updates) => {
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null
        }))
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken
      })
    }
  )
)
```

---

## UI Store

```typescript
// src/stores/uiStore.ts
interface UIState {
  // 侧边栏
  sidebarCollapsed: boolean
  toggleSidebar: () => void

  // 主题
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void

  // 语言
  language: string
  setLanguage: (language: string) => void

  // 加载状态
  globalLoading: boolean
  setGlobalLoading: (loading: boolean) => void

  // 当前组织上下文
  currentOrgId: string | null
  setCurrentOrgId: (orgId: string) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'light',
      language: 'zh-CN',
      globalLoading: false,
      currentOrgId: null,

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setTheme: (theme) => set({ theme }),

      setLanguage: (language) => set({ language }),

      setGlobalLoading: (loading) => set({ globalLoading: loading }),

      setCurrentOrgId: (orgId) => set({ currentOrgId: orgId })
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        theme: state.theme,
        language: state.language,
        currentOrgId: state.currentOrgId
      })
    }
  )
)
```

---

## 组织 Store

```typescript
// src/stores/organizationStore.ts
interface OrganizationState {
  // 状态
  organizations: Organization[]
  currentOrg: Organization | null
  loading: boolean

  // 操作
  fetchOrganizations: () => Promise<void>
  switchOrg: (orgId: string) => Promise<void>
  createOrganization: (data: CreateOrgRequest) => Promise<Organization>
  updateOrganization: (id: string, data: UpdateOrgRequest) => Promise<void>
  leaveOrganization: (id: string) => Promise<void>

  // 权限检查
  hasPermission: (permission: string) => boolean
  hasRole: (role: string) => boolean
}

export const useOrganizationStore = create<OrganizationState>((set, get) => ({
  organizations: [],
  currentOrg: null,
  loading: false,

  fetchOrganizations: async () => {
    set({ loading: true })
    try {
      const res = await api.get('/organizations')
      const orgs = res.data

      // 恢复当前组织
      const savedOrgId = useUIStore.getState().currentOrgId
      const currentOrg = orgs.find((o: Organization) => o.id === savedOrgId) || orgs[0] || null

      set({ organizations: orgs, currentOrg })
    } finally {
      set({ loading: false })
    }
  },

  switchOrg: async (orgId) => {
    const { organizations } = get()
    const org = organizations.find((o) => o.id === orgId)

    if (org) {
      set({ currentOrg: org })
      useUIStore.getState().setCurrentOrgId(orgId)

      // 更新 API header
      api.defaults.headers['X-Organization-ID'] = orgId

      // 重新获取数据
      window.location.reload() // 简单方式：刷新页面
    }
  },

  hasPermission: (permission) => {
    const { currentOrg, user } = get()
    if (!currentOrg || !user) return false

    // owner 拥有所有权限
    if (currentOrg.owner_id === user.id) return true

    // 检查角色权限
    const member = currentOrg.members?.find((m) => m.user_id === user.id)
    if (!member) return false

    return rolePermissions[member.role]?.includes(permission) || false
  }
}))

const rolePermissions: Record<string, string[]> = {
  owner: ['*'],
  admin: ['view', 'create', 'update', 'delete', 'manage_members'],
  member: ['view', 'create'],
  viewer: ['view']
}
```

---

## 使用示例

### 在组件中使用

```typescript
// src/components/Header.tsx
import { useAuthStore } from '@/stores/authStore'
import { useUIStore } from '@/stores/uiStore'
import { useOrganizationStore } from '@/stores/organizationStore'

function Header() {
  const user = useAuthStore((state) => state.user)
  const logout = useAuthStore((state) => state.clearAuth)
  const sidebarCollapsed = useUIStore((state) => state.sidebarCollapsed)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const currentOrg = useOrganizationStore((state) => state.currentOrg)
  const organizations = useOrganizationStore((state) => state.organizations)

  return (
    <Layout.Header>
      <Button onClick={toggleSidebar}>
        {sidebarCollapsed ? '展开' : '收起'}
      </Button>

      <Select
        value={currentOrg?.id}
        onChange={(orgId) => useOrganizationStore.getState().switchOrg(orgId)}
      >
        {organizations.map((org) => (
          <Select.Option key={org.id} value={org.id}>
            {org.display_name}
          </Select.Option>
        ))}
      </Select>

      <Dropdown menu={{
        items: [
          { key: 'settings', label: '设置' },
          { key: 'logout', label: '退出', onClick: logout }
        ]
      }}>
        <Space>
          <Avatar src={user?.avatar} />
          <span>{user?.username}</span>
        </Space>
      </Dropdown>
    </Layout.Header>
  )
}
```

### Selector 优化

```typescript
// ❌ 不好的写法：每次都创建新对象
const user = useAuthStore((state) => ({
  id: state.user?.id,
  username: state.user?.username
}))

// ✅ 好的写法：只选择需要的字段
const userId = useAuthStore((state) => state.user?.id)
const username = useAuthStore((state) => state.user?.username)

// ✅ 或使用 shallow 比较对象
import { shallow } from 'zustand/shallow'
const { id, username } = useAuthStore(
  (state) => ({
    id: state.user?.id,
    username: state.user?.username
  }),
  shallow
)
```

---

## 异步 Action

```typescript
// src/stores/benchmarkStore.ts
interface BenchmarkState {
  benchmarks: Benchmark[]
  loading: boolean
  error: string | null

  // 操作
  fetchBenchmarks: (params: FetchParams) => Promise<void>
  createBenchmark: (data: CreateBenchmarkRequest) => Promise<Benchmark>
  updateBenchmark: (id: string, data: UpdateBenchmarkRequest) => Promise<void>
  deleteBenchmark: (id: string) => Promise<void>
}

export const useBenchmarkStore = create<BenchmarkState>((set, get) => ({
  benchmarks: [],
  loading: false,
  error: null,

  fetchBenchmarks: async (params) => {
    set({ loading: true, error: null })

    try {
      const res = await api.get('/benchmarks', { params })
      set({ benchmarks: res.data.data, loading: false })
    } catch (err: any) {
      set({ error: err.message, loading: false })
    }
  },

  createBenchmark: async (data) => {
    set({ loading: true })

    try {
      const res = await api.post('/benchmarks', data)
      const newBenchmark = res.data

      set((state) => ({
        benchmarks: [...state.benchmarks, newBenchmark],
        loading: false
      }))

      return newBenchmark
    } catch (err) {
      set({ loading: false })
      throw err
    }
  },

  deleteBenchmark: async (id) => {
    try {
      await api.delete(`/benchmarks/${id}`)

      set((state) => ({
        benchmarks: state.benchmarks.filter((b) => b.id !== id)
      }))
    } catch (err) {
      throw err
    }
  }
}))
```
