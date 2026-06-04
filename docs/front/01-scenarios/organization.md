# 组织管理

## 概述

**业务目标**: 管理多租户组织，实现资源隔离和权限控制

**涉及角色**: 组织所有者、管理员、成员

**前置条件**: 用户已登录

---

## 核心概念

### 组织角色

| 角色 | 权限 |
|------|------|
| owner | 完全控制，可删除组织 |
| admin | 管理成员、资源，不可删除组织 |
| member | 查看和创建资源，不可管理成员 |
| viewer | 仅查看资源 |

### 资源可见性

| visibility | 说明 |
|-----------|------|
| public | 所有用户可见 |
| private | 仅创建者可见 |
| organization | 组织内成员可见 |

---

## 流程 1: 创建组织

### 步骤 1: 用户点击创建

**用户操作**: 用户在组织列表页点击"创建组织"

**前端行为**:
- 打开创建对话框
- 初始化表单:
  ```typescript
  {
    name: '',           // 必填，3-50 字符
    display_name: '',   // 必填，1-100 字符
    description: '',    // 可选，最多 500 字符
    logo_url: ''        // 可选
  }
  ```

### 步骤 2: 提交创建

**用户操作**: 用户填写完成后点击"创建"

**前端行为**:
- 表单校验
- API 请求: `POST /api/v1/organizations`
- 请求体: 上述表单数据

**后端响应**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    id: string,
    name: string,
    display_name: string,
    description: string,
    owner_id: string,  // 当前用户 ID
    member_count: 1,
    created_at: string
  }
}
```

**状态变化**:
```typescript
loading = true

// 成功后
message.success("组织创建成功")
// 自动切换到新组织
orgStore.switchOrg(data.id)
loading = false
```

---

## 流程 2: 切换组织

### 步骤 1: 用户切换组织

**用户操作**: 用户点击组织选择器，选择其他组织

**前端行为**:
- 更新 Zustand store:
  ```typescript
  orgStore.setCurrentOrg(orgId)
  ```
- 刷新页面数据
- 发送 WebSocket 消息更新订阅:
  ```typescript
  {
    event: "switch_org",
    data: { org_id: string }
  }
  ```

### 步骤 2: 组织上下文传递

**前端行为**:
- 方式 1: URL 参数 (可选)
  ```
  /organizations/:orgId/benchmarks
  ```
- 方式 2: Header (推荐)
  ```typescript
  api.defaults.headers['X-Organization-ID'] = orgId
  ```
- 方式 3: Query 参数 (兼容)
  ```typescript
  GET /api/v1/benchmarks?org_id={orgId}
  ```

---

## 流程 3: 邀请成员

### 步骤 1: 用户打开邀请对话框

**用户操作**: 组织所有者/管理员点击"邀请成员"

**前端行为**:
- 打开邀请对话框
- 表单:
  ```typescript
  {
    emails: string[],      // 邮箱列表
    role: 'admin' | 'member' | 'viewer',
    message: string        // 可选，附言
  }
  ```

### 步骤 2: 发送邀请

**用户操作**: 用户点击"发送邀请"

**前端行为**:
- API 请求: `POST /api/v1/organizations/:id/invitations`
- 请求体: 上述表单数据

**后端响应**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    invitations: Invitation[]
  }
}

interface Invitation {
  id: string,
  email: string,
  role: string,
  status: "pending",
  expires_at: string
}
```

**状态变化**:
```typescript
loading = true

// 成功后
message.success(`已发送 ${data.invitations.length} 封邀请邮件`)
loading = false
```

---

## 流程 4: 接受邀请

### 步骤 1: 用户点击邀请链接

**用户操作**: 用户打开邮件中的邀请链接

**前端行为**:
- URL 格式: `/invitations/{invitation_id}`
- API 请求: `GET /api/v1/organizations/invitations/:id`

**响应**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    id: string,
    organization: {
      id: string,
      name: string,
      display_name: string
    },
    inviter: {
      username: string
    },
    role: string
  }
}
```

### 步骤 2: 用户接受邀请

**用户操作**: 用户点击"接受邀请"

**前端行为**:
- API 请求: `POST /api/v1/organizations/invitations/:id/accept`

**响应**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    organization_id: string,
    role: string
  }
}
```

**状态变化**:
```typescript
loading = true

// 成功后
message.success("已加入组织")
orgStore.refreshOrganizations()
// 切换到新组织
orgStore.switchOrg(data.organization_id)
navigate(`/organizations/${data.organization_id}`)
loading = false
```

---

## 流程 5: 管理成员

### 步骤 1: 查看成员列表

**用户操作**: 用户打开组织成员页面

**前端行为**:
- API 请求: `GET /api/v1/organizations/:id/members`

**响应**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    members: OrganizationMember[],
    total: number
  }
}

interface OrganizationMember {
  id: string,
  user_id: string,
  username: string,
  email: string,
  avatar: string,
  role: "owner" | "admin" | "member" | "viewer",
  status: "active" | "pending",
  joined_at: string
}
```

### 步骤 2: 更新成员角色

**用户操作**: 所有者/管理员点击成员的角色下拉框

**前端行为**:
- 显示角色选择器
- API 请求: `PUT /api/v1/organizations/:id/members/:user_id/role`
- 请求体:
  ```typescript
  {
    role: string
  }
  ```

### 步骤 3: 移除成员

**用户操作**: 所有者点击"移除"按钮

**前端行为**:
- 确认对话框: "确定要移除该成员吗？"
- API 请求: `DELETE /api/v1/organizations/:id/members/:user_id`

---

## 流程 6: 组织设置

### 步骤 1: 编辑组织信息

**用户操作**: 用户点击"编辑"按钮

**前端行为**:
- 打开编辑对话框
- API 请求: `PUT /api/v1/organizations/:id`
- 请求体:
  ```typescript
  {
    display_name?: string,
    description?: string,
    logo_url?: string
  }
  ```

### 步骤 2: 删除组织

**用户操作**: 所有者点击"删除组织"

**前端行为**:
- 警告对话框:
  ```
  ⚠️ 危险操作

  删除组织将永久删除：
  - 组织内所有 Benchmark
  - 所有执行记录
  - 所有定时任务
  - 所有成员关系

  此操作不可撤销！

  请输入组织名称以确认删除
  ```
- 组织名称确认输入
- API 请求: `DELETE /api/v1/organizations/:id`

---

## 异常场景处理

### 组织名称冲突
- 创建时实时校验
- 提示"组织名称已存在"

### 邀请链接过期
- 显示"邀请链接已过期"
- 提供返回首页选项

### 无权限操作
- 隐藏无权限的按钮
- 操作失败提示"您没有权限执行此操作"

### 组织被删除
- 自动切换到默认组织
- 提示"原组织已被删除"

---

## 相关页面

- [组织管理页](../02-pages/organizations.md)

## 相关 API

- [Organization API](../03-api/organization-api.md)
