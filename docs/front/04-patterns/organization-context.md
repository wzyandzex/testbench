# 组织上下文处理

## 概述

多租户系统需要正确处理组织上下文，确保资源隔离和权限控制。

---

## 上下文传递方式

### 方式 1: Header（推荐）

```typescript
// src/services/api.ts
// 在请求拦截器中添加组织 ID
api.interceptors.request.use((config) => {
  const orgId = useUIStore.getState().currentOrgId
  if (orgId) {
    config.headers['X-Organization-ID'] = orgId
  }
  return config
})
```

### 方式 2: Query 参数

```typescript
// 某些接口可能需要显式传递
const res = await api.get('/benchmarks', {
  params: { org_id: currentOrgId }
})
```

### 方式 3: URL 参数

```typescript
// 路由中携带组织 ID
<Route path="/organizations/:orgId/benchmarks" element={<BenchmarkList />} />

// 组件中读取
const { orgId } = useParams()
useUIStore.getState().setCurrentOrgId(orgId)
```

---

## 组织切换

### 切换流程

```typescript
// src/stores/organizationStore.ts
async function switchOrg(orgId: string) {
  // 1. 验证组织存在
  const org = organizations.find((o) => o.id === orgId)
  if (!org) {
    message.error('组织不存在')
    return
  }

  // 2. 保存到 store
  set({ currentOrg: org })
  useUIStore.getState().setCurrentOrgId(orgId)

  // 3. 更新 API header
  api.defaults.headers['X-Organization-ID'] = orgId

  // 4. 发送 WebSocket 消息
  wsStore.send({
    event: 'switch_org',
    data: { org_id: orgId }
  })

  // 5. 清空当前页面数据
  // 方式 A: 刷新页面
  window.location.reload()

  // 方式 B: 重新获取数据（不刷新）
  await Promise.all([
    benchmarkStore.fetchBenchmarks(),
    executionStore.fetchExecutions()
  ])
}
```

### 切换组件

```typescript
// src/components/OrgSelector.tsx
function OrgSelector() {
  const currentOrg = useOrganizationStore((state) => state.currentOrg)
  const organizations = useOrganizationStore((state) => state.organizations)
  const switchOrg = useOrganizationStore((state) => state.switchOrg)

  return (
    <Select
      value={currentOrg?.id}
      onChange={switchOrg}
      placeholder="选择组织"
    >
      {organizations.map((org) => (
        <Select.Option key={org.id} value={org.id}>
          {org.display_name}
        </Select.Option>
      ))}
    </Select>
  )
}
```

---

## 权限检查

### 权限 Hook

```typescript
// src/hooks/usePermission.ts
import { useOrganizationStore } from '@/stores/organizationStore'
import { useAuthStore } from '@/stores/authStore'

export function usePermission() {
  const { currentOrg } = useOrganizationStore()
  const user = useAuthStore((state) => state.user)

  const hasPermission = (permission: string): boolean => {
    if (!currentOrg || !user) return false

    // owner 拥有所有权限
    if (currentOrg.owner_id === user.id) return true

    // 查找成员角色
    const member = currentOrg.members?.find((m) => m.user_id === user.id)
    if (!member) return false

    // 检查角色权限
    const role = member.role
    if (role === 'admin') {
      return adminPermissions.includes(permission)
    }
    if (role === 'member') {
      return memberPermissions.includes(permission)
    }
    if (role === 'viewer') {
      return viewerPermissions.includes(permission)
    }

    return false
  }

  const hasRole = (role: string): boolean => {
    if (!currentOrg || !user) return false
    if (currentOrg.owner_id === user.id && role === 'owner') return true

    const member = currentOrg.members?.find((m) => m.user_id === user.id)
    return member?.role === role
  }

  return { hasPermission, hasRole }
}

const adminPermissions = [
  'view', 'create', 'update', 'delete',
  'manage_members', 'manage_settings'
]

const memberPermissions = [
  'view', 'create', 'update'
]

const viewerPermissions = [
  'view'
]
```

### 权限组件

```typescript
// src/components/PermissionGuard.tsx
interface PermissionGuardProps {
  permission?: string
  role?: string
  fallback?: React.ReactNode
  children: React.ReactNode
}

export function PermissionGuard({
  permission,
  role,
  fallback = null,
  children
}: PermissionGuardProps) {
  const { hasPermission, hasRole } = usePermission()

  const hasAccess = permission
    ? hasPermission(permission)
    : role
    ? hasRole(role)
    : true

  if (!hasAccess) {
    return <>{fallback}</>
  }

  return <>{children}</>
}

// 使用示例
<PermissionGuard permission="delete" fallback={<span>无权限</span>}>
  <Button danger onClick={onDelete}>删除</Button>
</PermissionGuard>

<PermissionGuard role="admin">
  <Button onClick={openSettings}>组织设置</Button>
</PermissionGuard>
```

---

## 资源可见性

### 资源筛选

```typescript
// src/utils/resource-filter.ts
interface Resource {
  id: string
  visibility: 'public' | 'private' | 'organization'
  organization_id?: string
  created_by: string
}

export function filterResourcesByOrg<T extends Resource>(
  resources: T[],
  currentOrgId: string | null,
  userId: string
): T[] {
  return resources.filter((resource) => {
    // public: 所有人可见
    if (resource.visibility === 'public') return true

    // private: 仅创建者可见
    if (resource.visibility === 'private') {
      return resource.created_by === userId
    }

    // organization: 组织内可见
    if (resource.visibility === 'organization') {
      return resource.organization_id === currentOrgId
    }

    return false
  })
}
```

### 使用示例

```typescript
// 在列表页筛选
const visibleBenchmarks = useMemo(() => {
  return filterResourcesByOrg(
    benchmarks,
    currentOrg?.id || null,
    user?.id || ''
  )
}, [benchmarks, currentOrg, user])
```

---

## 错误处理

### 组织无效

```typescript
// src/stores/organizationStore.ts
async function switchOrg(orgId: string) {
  const org = organizations.find((o) => o.id === orgId)

  if (!org) {
    // 组织不存在，可能被删除
    message.warning('组织不存在，已切换到默认组织')
    const defaultOrg = organizations[0]
    if (defaultOrg) {
      await switchOrg(defaultOrg.id)
    }
    return
  }

  // ... 继续切换
}
```

### 无权限访问

```typescript
// API 返回 403 时
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 403) {
      const orgId = error.response.config.headers['X-Organization-ID']

      if (orgId) {
        message.error('您没有权限访问该组织的资源')
        // 切换回有权限的组织
        useOrganizationStore.getState().switchToDefaultOrg()
      }
    }
    return Promise.reject(error)
  }
)
```
