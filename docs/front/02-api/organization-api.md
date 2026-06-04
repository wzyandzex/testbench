# 组织管理接口

## 基础信息

| 项目 | 值 |
|------|------|
| 基础路径 | `/api/v1/organizations` |
| 需要认证 | 是 |
| 内容类型 | `application/json` |

## 错误码

| HTTP 状态码 | 说明 |
|------------|------|
| 400 | 请求参数无效 |
| 401 | 未认证 |
| 403 | 无权限 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

---

## 接口列表

### 组织管理

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/organizations` | 创建组织 |
| GET | `/organizations` | 获取用户的组织列表 |
| GET | `/organizations/:id` | 获取组织详情 |
| PUT | `/organizations/:id` | 更新组织信息 |
| DELETE | `/organizations/:id` | 删除组织 |
| PUT | `/organizations/:id/settings` | 更新组织设置 |
| GET | `/organizations/:id/quota` | 获取组织配额 |

### 成员管理

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/organizations/:id/members` | 获取成员列表 |
| PUT | `/organizations/:id/members/:user_id/role` | 更新成员角色 |
| DELETE | `/organizations/:id/members/:user_id` | 移除成员 |

### 邀请管理

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/organizations/:id/invitations` | 邀请成员 |
| GET | `/organizations/:id/invitations` | 列出邀请 |
| DELETE | `/organizations/:id/invitations/:invitation_id` | 取消邀请 |
| POST | `/organizations/:id/invitations/:invitation_id/resend` | 重新发送邀请 |
| POST | `/organizations/:id/join` | 通过邀请码加入组织 |

### 用户操作

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/user/current-organization` | 切换当前组织 |

### 组织模板

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/org-templates` | 列出组织模板 |
| GET | `/org-templates/:id` | 获取组织模板详情 |
| POST | `/org-templates` | 创建组织模板（仅管理员） |
| DELETE | `/org-templates/:id` | 删除组织模板（仅管理员） |
| POST | `/org-templates/:template_id/create-org` | 基于模板创建组织 |

---

## 组织状态枚举

| 值 | 说明 |
|----|------|
| `active` | 活跃 |
| `inactive` | 未激活 |
| `suspended` | 已暂停 |

---

## 成员角色枚举

| 值 | 权限 |
|----|------|
| `admin` | 管理员：完全权限 |
| `member` | 成员：普通权限 |
| `guest` | 访客：只读权限 |

---

## 1. 创建组织

### 请求

```http
POST /api/v1/organizations
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface CreateOrganizationRequest {
  name: string;              // 名称（唯一，必填）
  display_name?: string;     // 显示名称
  description?: string;      // 描述
}
```

### 响应

**成功响应（200）：**

```typescript
interface CreateOrganizationResponse {
  code: number;
  message: string;
  data: Organization;
}

interface Organization {
  id: string;
  name: string;
  display_name: string;
  description: string;
  owner_id: string;
  // 设置
  max_members: number;
  max_executions_per_day: number;
  max_storage_gb: number;
  default_role: MemberRole;
  allow_signup: boolean;
  require_approval: boolean;
  // 状态
  status: OrgStatus;
  created_at: string;
  updated_at: string;
}

type MemberRole = 'admin' | 'member' | 'guest';
type OrgStatus = 'active' | 'inactive' | 'suspended';
```

**错误响应：**

| HTTP 状态码 | 说明 |
|------------|------|
| 400 | 组织名称已存在 |
| 401 | 未认证 |

---

## 2. 获取用户的组织列表

### 请求

```http
GET /api/v1/organizations
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface MembershipsResponse {
  code: number;
  message: string;
  data: Membership[];
}

interface Membership {
  org_id: string;
  org_name: string;
  display_name: string;
  role: MemberRole;
  joined_at: string;
  is_owner: boolean;
  is_default: boolean;
}
```

---

## 3. 获取组织详情

### 请求

```http
GET /api/v1/organizations/:id
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface OrganizationDetailResponse {
  code: number;
  message: string;
  data: Organization;
}
```

**错误响应：**

| HTTP 状态码 | 说明 |
|------------|------|
| 400 | 组织 ID 必填 |
| 401 | 未认证 |
| 403 | 非组织成员 |
| 404 | 组织不存在 |

---

## 4. 更新组织信息

### 请求

```http
PUT /api/v1/organizations/:id
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface UpdateOrganizationRequest {
  display_name?: string;
  description?: string;
}
```

### 响应

```typescript
interface UpdateOrganizationResponse {
  code: number;
  message: string;
  data: Organization;
}
```

---

## 5. 删除组织

### 请求

```http
DELETE /api/v1/organizations/:id
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "organization deleted successfully"
  }
}
```

**错误响应：**

| HTTP 状态码 | 说明 |
|------------|------|
| 403 | 只有所有者可以删除组织 |
| 404 | 组织不存在 |

---

## 6. 更新组织设置

### 请求

```http
PUT /api/v1/organizations/:id/settings
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface UpdateSettingsRequest {
  max_members?: number;
  max_executions_per_day?: number;
  max_storage_gb?: number;
  default_role?: MemberRole;
  allow_signup?: boolean;
  require_approval?: boolean;
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "settings updated successfully"
  }
}
```

**错误响应：**

| HTTP 状态码 | 说明 |
|------------|------|
| 403 | 只有管理员可以更新设置 |

---

## 7. 获取组织配额

### 请求

```http
GET /api/v1/organizations/:id/quota
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface QuotaInfoResponse {
  code: number;
  message: string;
  data: QuotaInfo;
}

interface QuotaInfo {
  // 成员配额
  max_members: number;
  current_members: number;
  members_usage_percentage: number;

  // 执行配额
  max_executions_per_day: number;
  today_executions: number;
  executions_usage_percentage: number;

  // 存储配额
  max_storage_gb: number;
  used_storage_gb: number;
  storage_usage_percentage: number;

  // 总体状态
  overall_usage_percentage: number;
  near_limit: boolean;
}
```

---

## 8. 获取成员列表

### 请求

```http
GET /api/v1/organizations/:id/members?role=admin&query=john&page=1&page_size=20
Authorization: Bearer {access_token}
```

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| role | string | - | 角色筛选 |
| query | string | - | 用户名/邮箱搜索 |
| page | int | 1 | 页码 |
| page_size | int | 20 | 每页数量 |

### 响应

```typescript
interface ListMembersResponse {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    data: MemberInfo[];
  };
}

interface MemberInfo {
  id: string;
  user_id: string;
  username: string;
  email: string;
  avatar: string;
  role: MemberRole;
  invited_by: string;
  joined_at: string;
  is_owner: boolean;
}
```

---

## 9. 更新成员角色

### 请求

```http
PUT /api/v1/organizations/:id/members/:user_id/role
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface UpdateMemberRoleRequest {
  role: MemberRole;  // admin | member | guest
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "member role updated successfully"
  }
}
```

**错误响应：**

| HTTP 状态码 | 说明 |
|------------|------|
| 400 | 不能修改所有者角色 |
| 403 | 无权限或不是管理员 |
| 404 | 成员不存在 |

---

## 10. 移除成员

### 请求

```http
DELETE /api/v1/organizations/:id/members/:user_id
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "member removed successfully"
  }
}
```

**错误响应：**

| HTTP 状态码 | 说明 |
|------------|------|
| 400 | 不能移除组织所有者 |
| 403 | 无权限 |
| 404 | 成员不存在 |

---

## 11. 邀请成员

### 请求

```http
POST /api/v1/organizations/:id/invitations
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface InviteMemberRequest {
  email: string;           // 邀箱（必填）
  role?: MemberRole;       // 角色（默认 member）
  expires_in_hours?: number; // 过期时间（小时，默认 48）
}
```

### 响应

```typescript
interface InvitationResponse {
  code: number;
  message: string;
  data: Invitation;
}

interface Invitation {
  id: string;
  org_id: string;
  email: string;
  role: MemberRole;
  invite_code: string;
  expires_at: string;
  created_at: string;
}
```

**错误响应：**

| HTTP 状态码 | 说明 |
|------------|------|
| 400 | 成员配额已超 / 用户已是成员 / 邀请已存在 |
| 403 | 无权限（需要管理员） |

---

## 12. 列出邀请

### 请求

```http
GET /api/v1/organizations/:id/invitations
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface InvitationsResponse {
  code: number;
  message: string;
  data: Invitation[];
}
```

---

## 13. 取消邀请

### 请求

```http
DELETE /api/v1/organizations/:id/invitations/:invitation_id
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "invitation cancelled successfully"
  }
}
```

---

## 14. 重新发送邀请

### 请求

```http
POST /api/v1/organizations/:id/invitations/:invitation_id/resend
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface ResendInvitationRequest {
  expires_in_hours?: number;
}
```

### 响应

```typescript
interface InvitationResponse {
  code: number;
  message: string;
  data: Invitation;
}
```

---

## 15. 通过邀请码加入组织

### 请求

```http
POST /api/v1/organizations/:id/join
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface JoinOrganizationRequest {
  invite_code: string;      // 邀请码（必填）
}
```

### 响应

```typescript
interface MemberResponse {
  code: number;
  message: string;
  data: Member;
}

interface Member {
  id: string;
  org_id: string;
  user_id: string;
  role: MemberRole;
  invited_by: string;
  joined_at: string;
}
```

---

## 16. 切换当前组织

### 请求

```http
POST /api/v1/user/current-organization
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface SwitchOrganizationRequest {
  org_id: string;  // 组织 ID（必填）
}
```

### 响应

**成功响应（200）：**

```typescript
interface SwitchOrganizationResponse {
  code: number;
  message: string;
  data: TokenPair;
}

interface TokenPair {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: UserInfo;
}
```

---

## 17. 列出组织模板

### 请求

```http
GET /api/v1/org-templates
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface OrgTemplatesResponse {
  code: number;
  message: string;
  data: OrgTemplate[];
}

interface OrgTemplate {
  id: string;
  name: string;
  display_name: string;
  description: string;
  // 设置
  max_members: number;
  max_executions_per_day: number;
  max_storage_gb: number;
  default_role: MemberRole;
  allow_signup: boolean;
  require_approval: boolean;
  // 模板信息
  is_system: boolean;
  is_public: boolean;
  category: TemplateCategory;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

type TemplateCategory = 'small' | 'medium' | 'large' | 'startup' | 'enterprise';
```

---

## 18. 基于模板创建组织

### 请求

```http
POST /api/v1/org-templates/:template_id/create-org
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface CreateOrganizationRequest {
  name: string;
  display_name?: string;
  description?: string;
}
```

### 响应

```typescript
interface CreateOrganizationResponse {
  code: number;
  message: string;
  data: Organization;
}
```

---

## TypeScript 类型定义

```typescript
// src/types/api/organization.ts

export type MemberRole = 'admin' | 'member' | 'guest';
export type OrgStatus = 'active' | 'inactive' | 'suspended';
export type TemplateCategory = 'small' | 'medium' | 'large' | 'startup' | 'enterprise';

export interface Organization {
  id: string;
  name: string;
  display_name: string;
  description: string;
  owner_id: string;
  max_members: number;
  max_executions_per_day: number;
  max_storage_gb: number;
  default_role: MemberRole;
  allow_signup: boolean;
  require_approval: boolean;
  status: OrgStatus;
  created_at: string;
  updated_at: string;
}

export interface Membership {
  org_id: string;
  org_name: string;
  display_name: string;
  role: MemberRole;
  joined_at: string;
  is_owner: boolean;
  is_default: boolean;
}

export interface QuotaInfo {
  max_members: number;
  current_members: number;
  members_usage_percentage: number;
  max_executions_per_day: number;
  today_executions: number;
  executions_usage_percentage: number;
  max_storage_gb: number;
  used_storage_gb: number;
  storage_usage_percentage: number;
  overall_usage_percentage: number;
  near_limit: boolean;
}

export interface MemberInfo {
  id: string;
  user_id: string;
  username: string;
  email: string;
  avatar: string;
  role: MemberRole;
  invited_by: string;
  joined_at: string;
  is_owner: boolean;
}

export interface Invitation {
  id: string;
  org_id: string;
  email: string;
  role: MemberRole;
  invite_code: string;
  expires_at: string;
  created_at: string;
}

export interface OrgTemplate {
  id: string;
  name: string;
  display_name: string;
  description: string;
  max_members: number;
  max_executions_per_day: number;
  max_storage_gb: number;
  default_role: MemberRole;
  allow_signup: boolean;
  require_approval: boolean;
  is_system: boolean;
  is_public: boolean;
  category: TemplateCategory;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateOrganizationRequest {
  name: string;
  display_name?: string;
  description?: string;
}

export interface UpdateOrganizationRequest {
  display_name?: string;
  description?: string;
}

export interface UpdateSettingsRequest {
  max_members?: number;
  max_executions_per_day?: number;
  max_storage_gb?: number;
  default_role?: MemberRole;
  allow_signup?: boolean;
  require_approval?: boolean;
}

export interface UpdateMemberRoleRequest {
  role: MemberRole;
}

export interface InviteMemberRequest {
  email: string;
  role?: MemberRole;
  expires_in_hours?: number;
}

export interface JoinOrganizationRequest {
  invite_code: string;
}

export interface SwitchOrganizationRequest {
  org_id: string;
}
```
