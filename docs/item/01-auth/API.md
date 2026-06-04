# 认证 API（前端对接）

Base URL: `/api/v1`  
Consumer：`shared`（用户端 + 系统管理端）

---

## 1. 接口总览

### 1.1 公开接口（shared）

| Method | Path | Consumer | 说明 |
|---|---|---|---|
| POST | `/auth/register` | `shared` | 注册 |
| POST | `/auth/login` | `shared` | 登录 |
| POST | `/auth/refresh` | `shared` | 刷新 token |
| POST | `/auth/password/reset` | `shared` | 发送密码重置邮件 |
| POST | `/auth/password/reset/confirm` | `shared` | 确认重置密码 |

### 1.2 需要登录（shared）

| Method | Path | Consumer | 说明 |
|---|---|---|---|
| GET | `/auth/me` | `shared` | 当前用户信息 |
| PUT | `/auth/password` | `shared` | 修改密码 |
| POST | `/auth/logout` | `shared` | 登出 |
| POST | `/auth/email/verify` | `shared` | 发送邮箱验证 |
| POST | `/auth/email/verify/confirm` | `shared` | 确认邮箱变更 |
| POST | `/auth/avatar` | `shared` | 更新头像（当前推荐 avatar_url） |
| DELETE | `/auth/delete` | `shared` | 注销账号 |

### 1.3 系统管理员接口（admin-app）

| Method | Path | Consumer | 说明 |
|---|---|---|---|
| GET | `/admin/users` | `admin-app` | 用户列表 |
| POST | `/admin/users/:id/lock` | `admin-app` | 锁定用户 |
| POST | `/admin/users/:id/unlock` | `admin-app` | 解锁用户 |
| PUT | `/admin/users/:id/role` | `admin-app` | 修改角色 |

说明：以上接口要求系统管理员身份，非管理员通常返回 `403`。

---

## 2. 关键请求与响应

## 2.1 登录 `POST /auth/login`

请求：

```json
{
  "username": "demo",
  "password": "Password123"
}
```

成功响应 `code=0`，`data` 示例：

```json
{
  "access_token": "xxx",
  "refresh_token": "xxx",
  "expires_in": 7200,
  "token_type": "Bearer",
  "current_org_id": "org-personal-1",
  "user": {
    "id": "u-1",
    "username": "demo",
    "email": "demo@example.com",
    "role": "user",
    "avatar": ""
  }
}
```

## 2.2 刷新 token `POST /auth/refresh`

```json
{
  "refresh_token": "xxx"
}
```

成功返回结构与登录一致（包含 `current_org_id`）。

示例：

```json
{
  "access_token": "xxx",
  "refresh_token": "xxx",
  "expires_in": 7200,
  "token_type": "Bearer",
  "current_org_id": "org-personal-1",
  "user": {
    "id": "u-1",
    "username": "demo",
    "email": "demo@example.com",
    "role": "user",
    "avatar": ""
  }
}
```

### 登录默认组织选择策略（后端已实现）

登录与刷新时，后端按以下顺序确定会话组织并回填 `current_org_id`：

1. 优先使用用户已保存的 `current_org_id`（且用户仍属于该组织）。
2. 否则回退到用户的 personal 组织（`org_type=personal`）。
3. 再否则回退到最近加入的组织（`joined_at DESC`）。

前端应始终以响应里的 `current_org_id` 作为当前组织来源，并注入请求头 `X-Org-ID`。

## 2.3 注册 `POST /auth/register`

```json
{
  "username": "demo",
  "email": "demo@example.com",
  "password": "Password123"
}
```

校验规则：

- `username`: 3~50
- `email`: 邮箱格式
- `password`: 最少 8 位

## 2.4 获取当前用户 `GET /auth/me`

Header：

```http
Authorization: Bearer <access_token>
```

## 2.5 修改密码 `PUT /auth/password`

```json
{
  "old_password": "OldPassword123",
  "new_password": "NewPassword123"
}
```

## 2.6 登出 `POST /auth/logout`

建议至少传 `{}`，推荐：

```json
{
  "refresh_token": "xxx",
  "all_devices": false
}
```

## 2.7 发送密码重置 `POST /auth/password/reset`

```json
{
  "email": "demo@example.com"
}
```

## 2.8 确认密码重置 `POST /auth/password/reset/confirm`

```json
{
  "token_id": "token-xxx",
  "new_password": "NewPassword123",
  "confirm_password": "NewPassword123"
}
```

## 2.9 邮箱变更

1) `POST /auth/email/verify`

```json
{
  "new_email": "new@example.com"
}
```

2) `POST /auth/email/verify/confirm`

```json
{
  "token_id": "token-xxx"
}
```

## 2.10 更新头像 `POST /auth/avatar`

当前推荐 `multipart/form-data` 字段：

- `avatar_url=https://example.com/avatar.png`

如果传 `avatar` 文件，当前会返回 `501`。

## 2.11 注销账号 `DELETE /auth/delete`

```json
{
  "password": "Password123",
  "confirm": true
}
```

---

## 3. 管理员接口

### 3.1 用户列表 `GET /admin/users`

Query：

- `page`（默认 1）
- `page_size`（默认 20）
- `status`（可选）
- `role`（可选）

返回分页结构（`SuccessPageResponse`）。

### 3.2 锁定用户 `POST /admin/users/:id/lock`

无需 body，不能锁定自己。

### 3.3 解锁用户 `POST /admin/users/:id/unlock`

无需 body。

### 3.4 更新角色 `PUT /admin/users/:id/role`

```json
{
  "role": "admin"
}
```

---

## 4. 常见错误码

| code | 场景 |
|---|---|
| `401001` | 缺少 token |
| `401002` | token 无效 / 旧密码错误 / 登录失败 |
| `401003` | token 或 refresh token 过期 |
| `401004` | refresh token 被撤销/失效 |
| `403` | 管理员接口权限不足（非系统管理员） |
| `403001` | 账号锁定（登录场景） |
| `403002` | 账号未激活 |
| `429001` | 登录限流 |
| `400001` | 用户名重复 |
| `400002` | 邮箱重复 |
| `501` | 邮件服务不可用 / 头像文件直传未实现 |

---

## 5. 前端实现建议

1. 请求层统一处理 HTTP 错误和 `code !== 0`。
2. 401 自动 refresh，refresh 失败清 token 并跳登录页。
3. 登出成功后本地清空 `access_token` 与 `refresh_token`。


## 前端最小对接流程

1. 先接 `POST /auth/login`，拿到 `access_token`、`refresh_token`、`current_org_id` 并持久化。
2. 请求拦截器统一注入 `Authorization`，再接 `GET /auth/me` 校验登录态。
3. 接入 `POST /auth/refresh` 自动续期，401 时先刷新再重放原请求。
4. 完成 `POST /auth/logout` 与本地 token 清理，最后接密码重置与邮箱验证。


## 页面字段映射（接口 -> UI）

| 接口字段 | UI 字段/状态 | 说明 |
|---|---|---|
| `data.access_token` | `authStore.accessToken` | 请求拦截器统一注入 `Authorization` |
| `data.refresh_token` | `authStore.refreshToken` | 401 刷新与重放请求依赖该字段 |
| `data.current_org_id` | `orgStore.currentOrgId` | 当前登录组织，组织域请求头 `X-Org-ID` 必须使用该值 |
| `data.expires_in` | `authStore.expiresAt` | 用于前端提前刷新 token |
| `data.user.username` | `userStore.profile.name` | 导航栏和个人中心展示 |
| `data.user.role` | `userStore.role` | 控制管理员菜单与路由守卫 |
| `code/message` | `globalErrorToast` | 统一错误提示，避免各页面重复处理 |


## 页面接口调用时序（建议）

1. 登录页提交：`POST /auth/login`。
2. 登录成功后立即请求：`GET /auth/me`（初始化用户信息与权限），并用 `current_org_id` 初始化当前组织状态。
3. 业务请求统一带 token；组织域接口统一注入 `X-Org-ID=current_org_id`；遇到 401 先 `POST /auth/refresh` 再重放原请求。
4. 退出登录时调用：`POST /auth/logout`，随后清空本地 token 与用户态。


## 前端联调检查清单

1. 请求头：登录前无需 `Authorization`，登录后所有用户接口必须带 `Bearer token`。
2. 必填参数：`/auth/login` 的 `username/password`、`/auth/refresh` 的 `refresh_token` 必须传。
3. 成功判定：同时满足 HTTP 2xx 且 `code===0`，再写入本地 token、`current_org_id` 与用户态。
4. 失败分支：`401003/401004` 直接走重新登录；`429001` 显示限流提示并禁用按钮短时间重试。
5. 回流刷新：头像、密码、邮箱变更后刷新 `GET /auth/me`，确保页面状态一致。

## 通用错误处理与排错

- 错误码总览：`../00-overview/ERROR-CODES.md`
- 快速排错：`../00-overview/TROUBLESHOOTING.md`
- 请求层模板：`../00-overview/FRONTEND-INTEGRATION.md`

## 字段级契约（深度版）

### A. 登录 `POST /auth/login`（请求体 + 响应）

请求体：

| 字段 | 类型 | 必填 | 可空 | 默认值 | 约束 | 说明 |
|---|---|---|---|---|---|---|
| `username` | string | 是 | 否 | - | 非空 | 用户名 |
| `password` | string | 是 | 否 | - | 非空 | 密码 |

响应核心：

| 字段 | 类型 | 必有 | 说明 |
|---|---|---|---|
| `access_token` | string | 是 | 访问令牌 |
| `refresh_token` | string | 是 | 刷新令牌 |
| `expires_in` | int | 是 | access token 过期秒数 |
| `token_type` | string | 是 | 常见 `Bearer` |
| `current_org_id` | string | 否 | 当前组织 ID |
| `user.id/username/email/role` | mixed | 是 | 用户基础信息 |

### B. 刷新 `POST /auth/refresh`（请求体）

| 字段 | 类型 | 必填 | 可空 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `refresh_token` | string | 是 | 否 | - | 刷新令牌 |

### C. 注册 `POST /auth/register`（请求体）

| 字段 | 类型 | 必填 | 可空 | 默认值 | 约束 |
|---|---|---|---|---|---|
| `username` | string | 是 | 否 | - | 3~50 |
| `email` | string | 是 | 否 | - | 合法邮箱 |
| `password` | string | 是 | 否 | - | >=8 位 |

### D. 关键登录态接口（请求体约束）

`PUT /auth/password`：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `old_password` | string | 是 | 旧密码 |
| `new_password` | string | 是 | 新密码 |

`POST /auth/logout`：

| 字段 | 类型 | 必填 | 默认值 | 说明 |
|---|---|---|---|---|
| `refresh_token` | string | 否 | 空 | 建议传，便于精准注销 |
| `all_devices` | bool | 否 | false | 是否全端注销 |

`DELETE /auth/delete`：

| 字段 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `password` | string | 是 | 当前密码确认 |
| `confirm` | bool | 是 | 必须 true |

## 状态机与终态语义（深度版）

### A. 登录态状态机

`anonymous -> authenticating -> authenticated -> refreshing -> authenticated | expired -> anonymous`

前端行为：
1. `refreshing` 期间队列化请求，避免并发重复 refresh。
2. refresh 失败（`401004`）必须清 token 并回登录页。

### B. 邮箱变更流程状态

`idle -> verify_sending -> verify_sent -> confirming -> done|failed`

前端建议：
1. `verify_sent` 阶段展示“已发送验证邮件”并给重发入口。
2. token 失效场景走失败分支，提示重新发起。

## 页面级验收清单（新增）

1. 登录成功后本地同时持久化 `access_token/refresh_token/current_org_id`。  
2. 401 场景能触发一次 refresh 并重放原请求。  
3. refresh 失败后不会死循环重试，会回到登录页。  
4. 管理员路由对非 admin 隐藏，且后端 403 可兜底。  
5. 注销后清理本地所有身份态（token、用户信息、组织态）。  
6. 头像接口按当前能力仅走 `avatar_url`，文件直传路径不接入。  

## 文档可信来源

- `internal/api/router/router.go`
- `internal/api/handler/auth_handler.go`
- `internal/api/middleware/auth.go`

更新时间：2026-03-05

