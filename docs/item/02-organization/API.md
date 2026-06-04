# 组织与成员 API（前端对接）

Base URL: `/api/v1`  
Consumer：`user-app`（系统管理端不建议承载组织业务页面）

## 1. 鉴权与组织上下文

- 全部接口都需要：`Authorization: Bearer <access_token>`
- 下列接口不强制组织上下文：
  - `POST /organizations`
  - `GET /organizations`
  - `POST /organizations/:id/join`
  - `POST /user/current-organization`
  - `GET/POST/DELETE /org-templates*`
- 其余组织详情/成员/邀请接口必须带：`X-Org-ID`

---

## 2. 接口总览

### 2.1 组织本体

| Method | Path | Consumer | 说明 |
|---|---|---|---|
| POST | `/organizations` | `user-app` | 创建组织 |
| GET | `/organizations` | `user-app` | 当前用户所属组织列表 |
| GET | `/organizations/:id` | `user-app` | 组织详情 |
| PUT | `/organizations/:id` | `user-app` | 更新组织信息 |
| DELETE | `/organizations/:id` | `user-app` | 删除组织（org admin） |
| PUT | `/organizations/:id/settings` | `user-app` | 更新组织设置（admin） |
| GET | `/organizations/:id/quota` | `user-app` | 组织配额 |
| POST | `/organizations/:id/join` | `user-app` | 通过邀请码加入组织 |
| POST | `/user/current-organization` | `shared` | 切换当前组织（返回新 token） |

### 2.2 成员与邀请

| Method | Path | Consumer | 说明 |
|---|---|---|---|
| GET | `/organizations/:id/members` | `user-app` | 成员列表 |
| PUT | `/organizations/:id/members/:user_id/role` | `user-app` | 更新成员角色 |
| DELETE | `/organizations/:id/members/:user_id` | `user-app` | 移除成员 |
| GET | `/organizations/:id/invitations` | `user-app` | 邀请列表 |
| POST | `/organizations/:id/invitations` | `user-app` | 发起邀请 |
| DELETE | `/organizations/:id/invitations/:invitation_id` | `user-app` | 取消邀请 |
| POST | `/organizations/:id/invitations/:invitation_id/resend` | `user-app` | 重发邀请 |

### 2.3 组织模板

| Method | Path | Consumer | 说明 |
|---|---|---|---|
| GET | `/org-templates` | `user-app` | 模板列表 |
| GET | `/org-templates/:id` | `user-app` | 模板详情 |
| POST | `/org-templates` | `admin-app` | 创建模板（系统管理员） |
| DELETE | `/org-templates/:id` | `admin-app` | 删除模板 |
| POST | `/org-templates/:template_id/create-org` | `user-app` | 基于模板创建组织 |

---

## 3. 关键请求与响应

## 3.1 创建组织 `POST /organizations`

请求体：

```json
{
  "name": "team001",
  "display_name": "Team 001",
  "description": "my team",
  "settings": {
    "max_members": 50,
    "max_executions_per_day": 1000,
    "max_storage_gb": 100,
    "default_role": "member",
    "allow_signup": false,
    "require_approval": false
  }
}
```

约束：

- `name` 必填，3~50，`alphanum`
- `display_name` 最长 255
- `description` 最长 1000

---

## 3.2 组织列表 `GET /organizations`

返回为 membership 数组（非分页）：

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "org_id": "org-1",
      "org_name": "team001",
      "display_name": "Team 001",
      "role": "admin",
      "is_owner": true,
      "is_default": true,
      "org_type": "team",
      "joined_at": "2026-02-28T10:00:00Z"
    }
  ]
}
```

---

## 3.3 加入组织 `POST /organizations/:id/join`

请求体：

```json
{
  "invite_code": "ABCDEF123"
}
```

注意：当前实现通过 `invite_code` 完成加入，path 上的 `:id` 不参与校验。

---

## 3.4 切换当前组织 `POST /user/current-organization`

请求体：

```json
{
  "org_id": "org-1"
}
```

成功返回新的 token 对（用于刷新前端登录态中的组织上下文）：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "access_token": "xxx",
    "refresh_token": "xxx",
    "expires_in": 7200,
    "token_type": "Bearer"
  }
}
```

说明：

1. 切换成功后，后端会把用户 `current_org_id` 持久化为本次 `org_id`。
2. 下次登录/刷新时，后端会优先按该 `current_org_id` 生成组织作用域。
3. 前端必须同时更新本地 token 与 `current_org_id`（取本次请求的 `org_id`）。

---

## 3.5 成员列表 `GET /organizations/:id/members`

Query：

- `role`：角色筛选
- `query`：用户名/邮箱搜索
- `page`：默认 1
- `page_size`：默认 20，最大 1000

---

## 3.6 邀请成员 `POST /organizations/:id/invitations`

```json
{
  "email": "user@example.com",
  "role": "member",
  "message": "join us",
  "expires_in": 168
}
```

约束：

- `email` 必填且合法
- `role` 必填，`admin|member|guest`
- `message` 最长 500
- `expires_in` 小于等于 0 时后端默认 168 小时

---

## 3.7 更新成员角色 `PUT /organizations/:id/members/:user_id/role`

```json
{
  "role": "admin"
}
```

约束：`role` 必填，`admin|member|guest`。

---

## 3.8 更新组织设置 `PUT /organizations/:id/settings`

```json
{
  "max_members": 100,
  "max_executions_per_day": 2000,
  "max_storage_gb": 200,
  "default_role": "member",
  "allow_signup": false,
  "require_approval": true
}
```

字段均可选；后端按指针更新。

---

## 3.9 模板相关

创建模板 `POST /org-templates` 请求体：

```json
{
  "name": "startup",
  "display_name": "Startup",
  "description": "template",
  "settings": {
    "max_members": 20,
    "max_executions_per_day": 500,
    "max_storage_gb": 50,
    "default_role": "member",
    "allow_signup": false,
    "require_approval": false
  },
  "category": "startup",
  "is_public": true
}
```

`category` 可选：`small|medium|large|startup|enterprise`。

---

## 4. 常见错误与前端处理

- `400`：参数错误、邀请码无效、成员配额超限等
- `401001`：未登录或登录态无效
- `403001`：组织管理员权限不足（如更新设置、成员管理）
- `404001/404`：组织不可见或不存在（含“非成员/组织停用”的防枚举返回）
- `500`：服务内部错误

建议：

1. 对组织管理页统一处理 `403001` 为“权限不足”。
2. 对邀请与加入流程单独展示后端 message（用户可理解性更高）。
3. 切换组织成功后立即替换前端 token 和当前 org 状态。

---

## 5. 前端避坑

- `X-Org-ID` 不要写成 `X-Organization-ID`。
- 组织中间件错误返回已对齐 HTTP 状态码；前端仍建议同时判断 HTTP 与 `code`。
- 删除组织前建议前端二次确认，避免误删团队数据。


## 前端最小对接流程

1. 登录后先调 `GET /organizations` 拉取组织列表，提供组织切换入口。
2. 用户切换组织时调用 `POST /user/current-organization`，成功后同时更新本地 token 与 `current_org_id=org_id`。
3. 业务请求统一注入 `X-Org-ID`，再接成员列表、邀请列表等组织页面。
4. 管理后台再补管理员接口（设置、成员角色、邀请管理）。


## 页面字段映射（接口 -> UI）

| 接口字段 | UI 字段/状态 | 说明 |
|---|---|---|
| `data[].org_id` | `orgStore.currentOrgId` | 组织切换后用于注入 `X-Org-ID` |
| `data[].display_name` | `orgSwitcher.options[].label` | 顶部组织下拉展示 |
| `data[].role` | `orgStore.currentRole` | 控制成员管理与设置页权限 |
| `data[].is_default` | `orgSwitcher.defaultBadge` | 标记默认组织 |
| `POST /user/current-organization -> token` | `authStore.tokens` | 切换组织后需覆盖本地 token |
| `POST /user/current-organization -> req.org_id` | `orgStore.currentOrgId` | 切换成功后本地当前组织必须更新为该值 |
| `members/invitations 列表字段` | `memberTable/inviteTable` | 推荐保留原始状态值用于状态色映射 |


## 页面接口调用时序（建议）

1. 进入工作台先拉组织：`GET /organizations`。
2. 用户切换组织时：`POST /user/current-organization`，并覆盖本地 token + `current_org_id`。
3. 后续业务请求统一注入 `X-Org-ID`。
4. 组织管理页按需调用：成员列表/邀请列表/设置更新等接口。


## 前端联调检查清单

1. 请求头：组织域接口统一携带 `X-Org-ID`，并确保值来自当前选中组织。
2. 必填参数：加入组织需 `invite_code`；切换组织需 `org_id`。
3. 成功判定：切换组织接口成功后必须替换本地 token，并更新 `current_org_id`，再发后续业务请求。
4. 失败分支：`403001` 统一提示权限不足并隐藏管理入口；`404001/404` 统一提示组织或邀请不可用。
5. 回流刷新：成员或邀请操作后刷新对应列表，并同步刷新组织基本信息。

## 通用错误处理与排错

- 错误码总览：`../00-overview/ERROR-CODES.md`
- 快速排错：`../00-overview/TROUBLESHOOTING.md`
- 请求层模板：`../00-overview/FRONTEND-INTEGRATION.md`

## 字段级契约（深度版）

### A. 创建组织 `POST /organizations`（请求体）

| 字段 | 类型 | 必填 | 可空 | 默认值 | 枚举/约束 | 说明 |
|---|---|---|---|---|---|---|
| `name` | string | 是 | 否 | - | 3~50，字母数字 | 组织唯一标识名（业务名） |
| `display_name` | string | 否 | 是 | `name` 或后端默认 | <=255 | 展示名 |
| `description` | string | 否 | 是 | 空 | <=1000 | 组织描述 |
| `settings.max_members` | int | 否 | 是 | 后端默认 | >0 | 成员上限 |
| `settings.max_executions_per_day` | int | 否 | 是 | 后端默认 | >=0 | 每日执行配额 |
| `settings.max_storage_gb` | int | 否 | 是 | 后端默认 | >=0 | 存储配额 |
| `settings.default_role` | string | 否 | 是 | `member` | `admin/member/guest` | 新成员默认角色 |
| `settings.allow_signup` | bool | 否 | 是 | false | - | 是否允许自助加入 |
| `settings.require_approval` | bool | 否 | 是 | false | - | 是否要求审批 |

### B. 邀请成员 `POST /organizations/:id/invitations`（请求体）

| 字段 | 类型 | 必填 | 可空 | 默认值 | 枚举/约束 | 说明 |
|---|---|---|---|---|---|---|
| `email` | string | 是 | 否 | - | email 格式 | 被邀请用户邮箱 |
| `role` | string | 是 | 否 | - | `admin/member/guest` | 加入后角色 |
| `message` | string | 否 | 是 | 空 | <=500 | 邀请附言 |
| `expires_in` | int | 否 | 是 | 168 | >0 时生效 | 邀请有效小时数 |

### C. 切换组织 `POST /user/current-organization`（请求体 + 响应）

请求字段：

| 字段 | 类型 | 必填 | 可空 | 默认值 | 枚举/约束 | 说明 |
|---|---|---|---|---|---|---|
| `org_id` | string | 是 | 否 | - | 必须属于当前用户 | 目标组织 ID |

响应字段：

| 字段 | 类型 | 必有 | 说明 |
|---|---|---|---|
| `data.access_token` | string | 是 | 新访问令牌 |
| `data.refresh_token` | string | 是 | 新刷新令牌 |
| `data.expires_in` | int | 是 | 过期秒数 |
| `data.token_type` | string | 是 | 常见为 `Bearer` |

### D. 更新组织设置 `PUT /organizations/:id/settings`（请求体）

说明：所有字段均可选，后端按“只更新传入字段”处理。

| 字段 | 类型 | 必填 | 可空 | 默认值 | 枚举/约束 |
|---|---|---|---|---|---|
| `max_members` | int | 否 | 是 | 不变 | >0 |
| `max_executions_per_day` | int | 否 | 是 | 不变 | >=0 |
| `max_storage_gb` | int | 否 | 是 | 不变 | >=0 |
| `default_role` | string | 否 | 是 | 不变 | `admin/member/guest` |
| `allow_signup` | bool | 否 | 是 | 不变 | - |
| `require_approval` | bool | 否 | 是 | 不变 | - |

## 状态机与终态语义（深度版）

### A. 组织切换流程状态

1. `idle`：未切换。  
2. `switching`：调用 `POST /user/current-organization`。  
3. `success`：保存新 token + `currentOrgId`，后续请求注入新 `X-Org-ID`。  
4. `failed`：切换失败，保持旧 token 与旧组织状态。  

前端要求：切换期间阻止并发业务请求（或队列化），避免“旧 token + 新 org 头”混用。

### B. 邀请状态（页面语义）

后端邀请列表常见可映射为：`pending` / `accepted` / `expired` / `cancelled`。  
前端建议：
- `pending` 显示“重发/取消”按钮；
- 其他终态只读展示，不再允许操作。

## 页面级验收清单（新增）

1. 组织切换后首个业务请求必须携带新 `X-Org-ID`，且 Authorization 已更新。  
2. 切换失败时不应污染本地登录态（token、currentOrgId 必须回滚）。  
3. 邀请创建后列表可回流刷新，新增项状态为可操作状态（pending）。  
4. 非 org-admin 登录时，组织设置和成员角色修改按钮必须不可见。  
5. 任何 `404001/404` 场景统一文案“资源不存在或无访问权限”。  

## 文档可信来源

- `internal/api/router/router.go`
- `internal/api/handler/organization_handler.go`
- `internal/domain/organization/types.go`
- `internal/domain/organization/member.go`
- `internal/domain/organization/invitation.go`

更新时间：2026-03-05

