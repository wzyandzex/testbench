# 登录/注册页

## 页面概览

- **路由**: `/login`
- **所需权限**: 无（公开页面）
- **关联场景**: [认证授权](../01-scenarios/authentication.md)

---

## 页面状态

```typescript
interface LoginPageState {
  form: {
    username: string
    password: string
    remember: boolean
  }
  loading: boolean
  error: string | null
}
```

## 组件结构

```
LoginPage
├── Logo
├── LoginForm
│   ├── Form.Item (username)
│   │   ├── Input
│   │   └── 校验规则
│   ├── Form.Item (password)
│   │   ├── Input.Password
│   │   └── "忘记密码" 链接
│   ├── Form.Item (remember)
│   │   └── Checkbox
│   └── Submit Button
└── Footer (版权信息)
```

## API 调用

### 登录

```typescript
// POST /api/v1/auth/login
const login = async (values: LoginRequest): Promise<LoginResponse> => {
  const res = await api.post('/auth/login', values)
  return res.data
}
```

## 事件处理

### onSubmit

```typescript
const onSubmit = async (values: LoginRequest) => {
  setLoading(true)
  setError(null)

  try {
    const data = await login(values)

    // 存储 token
    localStorage.setItem('access_token', data.access_token)
    localStorage.setItem('refresh_token', data.refresh_token)

    // 更新 store
    authStore.setAuth(data.user, data.access_token)

    // 跳转
    const redirect = searchParams.get('redirect') || '/'
    navigate(redirect)
  } catch (err: any) {
    setError(err.message || '登录失败')
  } finally {
    setLoading(false)
  }
}
```

### 错误码处理

| 错误码 | 提示文案 |
|--------|----------|
| 401002 | 用户名或密码错误 |
| 403001 | 账户已被锁定，请联系管理员 |
| 403002 | 账户未激活 |
| 429001 | 登录尝试过多，请稍后再试 |

## UI 建议

- 使用 Ant Design `Form` 组件
- 密码框显示/隐藏切换
- 记住我 Checkbox
- 错误提示在表单上方显示
