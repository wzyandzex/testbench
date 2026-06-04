# 认证授权

## 概述

**业务目标**: 用户身份验证和授权管理

**涉及角色**: 普通用户、管理员

**前置条件**: 无

---

## 流程 1: 用户登录

### 步骤 1: 用户输入凭证

**用户操作**: 用户在登录页面输入用户名和密码，点击"登录"按钮

**前端行为**:
- 表单校验规则:
  - `username`: 必填，3-50 字符
  - `password`: 必填，最少 8 字符
- API 请求: `POST /api/v1/auth/login`
- 请求体:
  ```typescript
  {
    username: string,
    password: string
  }
  ```

**后端响应**:

成功响应 (200):
```typescript
{
  code: 0,
  message: "success",
  data: {
    access_token: string,    // JWT token
    refresh_token: string,   // 刷新 token
    expires_in: number,      // 秒，默认 3600
    token_type: string,
    user: {
      id: string,
      username: string,
      email: string,
      role: "admin" | "user" | "viewer",
      avatar: string
    }
  }
}
```

错误响应:
| HTTP Code | 错误码 | 说明 |
|-----------|--------|------|
| 401 | 401002 | 用户名或密码错误 |
| 403 | 403001 | 用户账户已被锁定 |
| 403 | 403002 | 用户账户未激活 |
| 429 | 429001 | 登录尝试过多，请稍后再试 |

**状态变化**:
```typescript
// loading 状态
loading = true

// 成功后
localStorage.setItem('access_token', data.access_token)
localStorage.setItem('refresh_token', data.refresh_token)
authStore.setAuth(data.user, data.access_token)
loading = false

// 失败后
loading = false
error = response.message
```

**用户反馈**:
- 成功: 跳转到首页，显示欢迎提示
- 失败: 显示错误提示 (Ant Design message.error)

---

## 流程 2: Token 刷新

### 步骤 1: 自动刷新 Token

**触发条件**: API 请求返回 401 状态码

**前端行为**:
- Axios 拦截器捕获 401
- API 请求: `POST /api/v1/auth/refresh`
- 请求体:
  ```typescript
  {
    refresh_token: string
  }
  ```

**后端响应**:

成功响应 (200):
```typescript
{
  code: 0,
  message: "success",
  data: {
    access_token: string,
    refresh_token: string,
    expires_in: number,
    user: UserInfo
  }
}
```

错误响应:
| HTTP Code | 错误码 | 说明 |
|-----------|--------|------|
| 401 | 401003 | 刷新令牌已过期，请重新登录 |
| 401 | 401004 | 刷新令牌已撤销，请重新登录 |

**状态变化**:
```typescript
// 成功后
localStorage.setItem('access_token', newAccessToken)
localStorage.setItem('refresh_token', newRefreshToken)
authStore.setAuth(user, newAccessToken)

// 失败后 - 清除认证状态
localStorage.clear()
authStore.clearAuth()
navigate('/login')
```

---

## 流程 3: 用户登出

### 步骤 1: 用户点击登出

**用户操作**: 用户点击右上角用户菜单中的"登出"按钮

**前端行为**:
- API 请求: `POST /api/v1/auth/logout`
- 请求体:
  ```typescript
  {
    refresh_token: string,
    all_devices?: boolean  // 是否撤销所有设备的令牌
  }
  ```

**后端响应**:

成功响应 (200):
```typescript
{
  code: 0,
  message: "success",
  data: {
    message: "logged out successfully"
  }
}
```

**状态变化**:
```typescript
loading = true

// 成功后
localStorage.clear()
authStore.clearAuth()
navigate('/login')
loading = false
```

---

## 流程 4: 密码重置

### 步骤 1: 请求重置邮件

**用户操作**: 用户在登录页点击"忘记密码"，输入邮箱

**前端行为**:
- 表单校验: `email` 必须是有效邮箱格式
- API 请求: `POST /api/v1/auth/password/reset`
- 请求体:
  ```typescript
  {
    email: string
  }
  ```

**后端响应**:

无论邮箱是否存在，都返回相同响应 (防止邮箱枚举):
```typescript
{
  code: 0,
  message: "success",
  data: {
    message: "如果该邮箱已注册，您将收到密码重置邮件"
  }
}
```

错误响应:
| HTTP Code | 错误码 | 说明 |
|-----------|--------|------|
| 501 | 501 | 邮件服务不可用 |

### 步骤 2: 通过邮件链接重置密码

**用户操作**: 用户点击邮件中的重置链接，跳转到重置页面，输入新密码

**前端行为**:
- URL 参数: `?token={token_id}`
- 表单校验:
  - `new_password`: 最少 8 字符
  - `confirm_password`: 必须与 new_password 一致
- API 请求: `POST /api/v1/auth/password/reset/confirm`
- 请求体:
  ```typescript
  {
    token_id: string,
    new_password: string
  }
  ```

**后端响应**:

成功响应 (200):
```typescript
{
  code: 0,
  message: "success",
  data: {
    message: "密码重置成功，请使用新密码登录"
  }
}
```

错误响应:
| HTTP Code | 说明 |
|-----------|------|
| 400 | 无效或已过期的重置链接 |

**状态变化**:
```typescript
loading = true

// 成功后
message.success("密码重置成功")
navigate('/login')
loading = false
```

---

## 流程 5: 修改密码

### 步骤 1: 用户在设置页修改密码

**用户操作**: 用户在设置页面输入旧密码和新密码

**前端行为**:
- 表单校验:
  - `old_password`: 必填
  - `new_password`: 必填，最少 8 字符，不能与旧密码相同
- API 请求: `PUT /api/v1/auth/password`
- 请求体:
  ```typescript
  {
    old_password: string,
    new_password: string
  }
  ```

**后端响应**:

成功响应 (200):
```typescript
{
  code: 0,
  message: "success",
  data: {
    message: "password changed successfully"
  }
}
```

错误响应:
| 错误码 | 说明 |
|--------|------|
| 401002 | 旧密码不正确 |

---

## 异常场景处理

### 网络超时
- 显示 "网络连接超时，请检查网络后重试"
- 提供"重试"按钮

### 账户被锁定
- 显示 "账户已被锁定，请联系管理员"
- 隐藏登录表单

### 登录尝试过多
- 显示 "登录尝试过多，请 X 分钟后再试"
- 显示倒计时

### Token 过期
- 自动尝试刷新 token
- 如果刷新失败，跳转登录页并提示 "会话已过期，请重新登录"

---

## 相关页面

- [登录/注册页](../02-pages/login-register.md)
- [设置页](../02-pages/settings.md)

## 相关 API

- [认证 API](../03-api/auth-api.md)
