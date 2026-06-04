# 认证接口

## 基础信息

| 项目 | 值 |
|------|------|
| 基础路径 | `/api/v1/auth` |
| 需要认证 | 部分（登录/注册/刷新/密码重置公开） |
| 内容类型 | `application/json` |

## 错误码

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| 400001 | 400 | 用户名已存在 |
| 400002 | 400 | 邮箱已存在 |
| 401002 | 401 | 用户名或密码错误 |
| 401003 | 401 | 刷新令牌已过期 |
| 401004 | 401 | 刷新令牌已撤销 |
| 403001 | 403 | 用户账户已被锁定 |
| 403002 | 403 | 用户账户未激活 |
| 429001 | 429 | 登录尝试过多，请稍后再试 |
| 501 | 501 | 邮件服务不可用 |

---

## 接口列表

| 方法 | 端点 | 需要认证 | 说明 |
|------|------|---------|------|
| POST | `/auth/login` | 否 | 用户登录 |
| POST | `/auth/register` | 否 | 用户注册（仅管理员） |
| POST | `/auth/refresh` | 否 | 刷新令牌 |
| POST | `/auth/logout` | 是 | 用户登出 |
| GET | `/auth/me` | 是 | 获取当前用户信息 |
| PUT | `/auth/password` | 是 | 修改密码 |
| POST | `/auth/password/reset` | 否 | 发送密码重置邮件 |
| POST | `/auth/password/reset/confirm` | 否 | 重置密码 |
| POST | `/auth/email/verify` | 是 | 发送邮箱验证（修改邮箱） |
| POST | `/auth/email/verify/confirm` | 否 | 验证邮箱变更 |
| POST | `/auth/avatar` | 是 | 上传头像 |
| POST | `/auth/delete` | 是 | 注销账户 |
| GET | `/admin/users` | 是 | 获取用户列表（仅管理员） |
| POST | `/admin/users/{id}/lock` | 是 | 锁定用户（仅管理员） |
| POST | `/admin/users/{id}/unlock` | 是 | 解锁用户（仅管理员） |
| PUT | `/admin/users/{id}/role` | 是 | 更新用户角色（仅管理员） |

---

## 1. 用户登录

### 请求

```http
POST /api/v1/auth/login
Content-Type: application/json
```

**请求体：**

```typescript
interface LoginRequest {
  username: string;  // 用户名
  password: string;  // 密码
}
```

### 响应

**成功响应（200）：**

```typescript
interface LoginResponse {
  code: number;
  message: string;
  data: {
    access_token: string;   // 访问令牌
    refresh_token: string;  // 刷新令牌
    expires_in: number;     // 访问令牌过期时间（秒）
    token_type: string;     // 令牌类型，通常为空或"Bearer"
    user: UserInfo;
  };
}

interface UserInfo {
  id: string;
  username: string;
  email: string;
  role: string;       // admin | user | viewer
  avatar: string;
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| 401002 | 用户名或密码错误 |
| 403001 | 用户账户已被锁定 |
| 403002 | 用户账户未激活 |
| 429001 | 登录尝试过多，请稍后再试 |

---

## 2. 用户注册（仅管理员）

### 请求

```http
POST /api/v1/auth/register
Content-Type: application/json
```

**请求体：**

```typescript
interface RegisterRequest {
  username: string;  // 用户名（3-50字符）
  email: string;     // 邮箱
  password: string;  // 密码（最少8字符）
}
```

### 响应

**成功响应（200）：**

```typescript
interface RegisterResponse {
  code: number;
  message: string;
  data: UserInfo;
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| 400001 | 用户名已存在 |
| 400002 | 邮箱已存在 |

---

## 3. 刷新令牌

### 请求

```http
POST /api/v1/auth/refresh
Content-Type: application/json
```

**请求体：**

```typescript
interface RefreshTokenRequest {
  refresh_token: string;
}
```

### 响应

**成功响应（200）：**

```typescript
interface RefreshTokenResponse {
  code: number;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    user: UserInfo;
  };
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| 401003 | 刷新令牌已过期，请重新登录 |
| 401004 | 刷新令牌已撤销，请重新登录 |

---

## 4. 用户登出

### 请求

```http
POST /api/v1/auth/logout
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface LogoutRequest {
  refresh_token: string;  // 要撤销的刷新令牌
  all_devices: boolean;    // 是否撤销所有设备的令牌
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "logged out successfully"
  }
}
```

---

## 5. 获取当前用户信息

### 请求

```http
GET /api/v1/auth/me
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

```typescript
interface UserInfoResponse {
  code: number;
  message: string;
  data: UserInfo;
}
```

---

## 6. 修改密码

### 请求

```http
PUT /api/v1/auth/password
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface ChangePasswordRequest {
  old_password: string;  // 旧密码
  new_password: string;  // 新密码（最少8字符）
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "password changed successfully"
  }
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| 401002 | 旧密码不正确 |

---

## 7. 发送密码重置邮件

### 请求

```http
POST /api/v1/auth/password/reset
Content-Type: application/json
```

**请求体：**

```typescript
interface SendPasswordResetRequest {
  email: string;
}
```

### 响应

无论邮箱是否存在，都返回相同响应（防止邮箱枚举攻击）：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "如果该邮箱已注册，您将收到密码重置邮件"
  }
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| 501 | 邮件服务不可用 |

---

## 8. 重置密码

### 请求

```http
POST /api/v1/auth/password/reset/confirm
Content-Type: application/json
```

**请求体：**

```typescript
interface ResetPasswordRequest {
  token_id: string;      // 重置令牌ID
  new_password: string;  // 新密码
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "密码重置成功，请使用新密码登录"
  }
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| 400 | 无效或已过期的重置链接 |

---

## 9. 发送邮箱验证（修改邮箱）

### 请求

```http
POST /api/v1/auth/email/verify
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface SendEmailVerificationRequest {
  new_email: string;
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "验证邮件已发送到新邮箱"
  }
}
```

---

## 10. 验证邮箱变更

### 请求

```http
POST /api/v1/auth/email/verify/confirm
Content-Type: application/json
```

**请求体：**

```typescript
interface VerifyEmailRequest {
  token_id: string;
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "邮箱验证成功",
    "new_email": "new@example.com"
  }
}
```

---

## 11. 上传头像

### 请求

```http
POST /api/v1/auth/avatar
Content-Type: multipart/form-data
Authorization: Bearer {access_token}
```

**表单字段：**

| 字段 | 类型 | 说明 |
|------|------|------|
| avatar_url | string | 头像 URL（推荐） |
| avatar | File | 头像文件（暂未实现） |

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "avatar_url": "https://example.com/avatar.jpg"
  }
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| 501 | 直接文件上传暂未实现，请使用 avatar_url 字段 |

---

## 12. 注销账户

### 请求

```http
POST /api/v1/auth/delete
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface DeleteAccountRequest {
  password: string;  // 确认密码
  confirm: boolean;  // 确认注销
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "账户已成功注销，所有数据已被删除"
  }
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| 403 | 密码验证失败 |
| 400 | 请确认账户删除 |

---

## 管理员接口

### 13. 获取用户列表（仅管理员）

### 请求

```http
GET /api/v1/admin/users?page=1&page_size=20&status=active&role=user
Authorization: Bearer {access_token}
```

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| page_size | int | 20 | 每页数量（最大100） |
| status | string | - | 用户状态筛选 |
| role | string | - | 用户角色筛选 |

### 响应

```typescript
interface AdminUserInfo {
  id: string;
  username: string;
  email: string;
  role: string;
  avatar: string;
  status: string;      // active | inactive | locked
  created_at: string;
}

interface UserListResponse {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    data: AdminUserInfo[];
  };
}
```

### 14. 锁定用户（仅管理员）

### 请求

```http
POST /api/v1/admin/users/{id}/lock
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "user locked successfully"
  }
}
```

### 15. 解锁用户（仅管理员）

### 请求

```http
POST /api/v1/admin/users/{id}/unlock
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "user unlocked successfully"
  }
}
```

### 16. 更新用户角色（仅管理员）

### 请求

```http
PUT /api/v1/admin/users/{id}/role
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface UpdateRoleRequest {
  role: string;  // admin | user | viewer
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "user role updated successfully"
  }
}
```

---

## TypeScript 类型定义

```typescript
// src/types/api/auth.ts

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  avatar: string;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
  all_devices?: boolean;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface SendPasswordResetRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token_id: string;
  new_password: string;
}

export interface SendEmailVerificationRequest {
  new_email: string;
}

export interface VerifyEmailRequest {
  token_id: string;
}

export interface DeleteAccountRequest {
  password: string;
  confirm: boolean;
}

export interface UpdateAvatarRequest {
  avatar_url?: string;
}

export interface AdminUserInfo {
  id: string;
  username: string;
  email: string;
  role: string;
  avatar: string;
  status: 'active' | 'inactive' | 'locked';
  created_at: string;
}

export interface UpdateRoleRequest {
  role: string;
}

// 错误码
export const AuthErrorCode = {
  USERNAME_EXISTS: 400001,
  EMAIL_EXISTS: 400002,
  INVALID_CREDENTIALS: 401002,
  REFRESH_TOKEN_EXPIRED: 401003,
  REFRESH_TOKEN_REVOKED: 401004,
  USER_LOCKED: 403001,
  USER_INACTIVE: 403002,
  RATE_LIMITED: 429001,
} as const;
```
