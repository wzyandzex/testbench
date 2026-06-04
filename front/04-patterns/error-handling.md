# 统一错误处理

## 概述

统一处理 API 错误，提供一致的用户体验。

---

## 错误响应格式

```typescript
interface APIError {
  code: number
  message: string
  details?: any
  request_id?: string
}

interface APIResponse<T> {
  code: number        // 0 表示成功
  message: string
  data: T
}
```

---

## Axios 拦截器

### 响应拦截器

```typescript
// src/services/api.ts
import { message } from 'antd'

api.interceptors.response.use(
  (response) => {
    // 业务错误 (code !== 0)
    if (response.data.code !== 0) {
      return Promise.reject(response.data)
    }
    return response.data.data  // 返回 data 部分
  },
  async (error) => {
    // 网络错误 / HTTP 错误
    if (error.response) {
      const { status, data } = error.response

      // 401 未认证
      if (status === 401) {
        return handleUnauthorized()
      }

      // 403 无权限
      if (status === 403) {
        message.error('您没有权限执行此操作')
        return Promise.reject(data)
      }

      // 404 未找到
      if (status === 404) {
        message.error(data.message || '请求的资源不存在')
        return Promise.reject(data)
      }

      // 429 限流
      if (status === 429) {
        message.error('请求过于频繁，请稍后再试')
        return Promise.reject(data)
      }

      // 500 服务器错误
      if (status >= 500) {
        message.error('服务器错误，请稍后重试')
        return Promise.reject(data)
      }

      // 其他错误
      return Promise.reject(data)
    }

    // 网络错误
    if (error.code === 'ERR_NETWORK') {
      message.error('网络连接失败，请检查网络')
      return Promise.reject(error)
    }

    // 超时
    if (error.code === 'ECONNABORTED') {
      message.error('请求超时，请稍后重试')
      return Promise.reject(error)
    }

    return Promise.reject(error)
  }
)
```

---

## Token 刷新

```typescript
// src/services/auth.ts
let isRefreshing = false
let refreshSubscribers: Array<(token: string) => void> = []

function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback)
}

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach(callback => callback(token))
  refreshSubscribers = []
}

async function handleUnauthorized() {
  // 如果正在刷新，加入队列
  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeTokenRefresh((token) => {
        resolve(token)
      })
    })
  }

  isRefreshing = true

  try {
    const refreshToken = localStorage.getItem('refresh_token')
    const res = await api.post('/auth/refresh', { refresh_token })

    const { access_token, refresh_token, user } = res.data

    localStorage.setItem('access_token', access_token)
    localStorage.setItem('refresh_token', refresh_token)
    authStore.setAuth(user, access_token)

    onTokenRefreshed(access_token)
    return access_token
  } catch (err) {
    // 刷新失败，清除认证状态
    localStorage.clear()
    authStore.clearAuth()
    window.location.href = '/login'
    throw err
  } finally {
    isRefreshing = false
  }
}
```

---

## 错误码映射

```typescript
// src/utils/error-codes.ts
export const ERROR_CODES: Record<number, string> = {
  // 通用错误 0-999
  0: '成功',
  1: '未知错误',
  400: '请求参数错误',

  // 认证错误 1000-1999
  1001: '未登录',
  1002: '登录已过期',
  1003: 'Token 无效',
  1004: '刷新 Token 已过期',
  1005: '密码错误',
  1006: '账户已被锁定',
  1007: '账户未激活',

  // Benchmark 错误 2000-2999
  2001: 'Benchmark 不存在',
  2002: 'Benchmark 名称已存在',
  2003: 'Benchmark 状态无效',

  // Execution 错误 3000-3999
  3001: '执行不存在',
  3002: '执行状态无效',
  3003: '执行已完成，无法取消',

  // Scheduler 错误 4000-4999
  4001: '任务不存在',
  4002: '任务已完成，无法取消',

  // 数据库错误 5000-5999
  5001: '数据库错误',
  5002: '记录已存在',
  5003: '记录不存在',
}

export function getErrorMessage(code: number, defaultMessage = '操作失败'): string {
  return ERROR_CODES[code] || defaultMessage
}
```

---

## 使用示例

### 在组件中使用

```typescript
// src/pages/BenchmarkCreatePage.tsx
import { message } from 'antd'

async function handleSubmit(values: CreateBenchmarkRequest) {
  setLoading(true)

  try {
    const result = await createBenchmark(values)
    message.success('创建成功')
    navigate(`/benchmarks/${result.id}`)
  } catch (err: APIError) {
    // 错误已被拦截器处理，这里只需处理特定逻辑
    if (err.code === 2002) {
      // 名称已存在，聚焦到名称输入框
      form.setFields([{ name: 'name', errors: ['名称已存在'] }])
    }
  } finally {
    setLoading(false)
  }
}
```

### 自定义错误处理

```typescript
// 禁用自动 toast
const res = await api.post('/benchmarks', values, {
  skipErrorHandler: true
})

if (res.data.code !== 0) {
  // 自定义处理
  Modal.error({
    title: '创建失败',
    content: res.data.message
  })
}
```

---

## 错误日志

```typescript
// src/utils/error-logger.ts
export function logError(error: APIError, context?: string) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    code: error.code,
    message: error.message,
    details: error.details,
    request_id: error.request_id,
    context,
    url: window.location.href,
    user_id: authStore.user?.id,
    organization_id: authStore.currentOrg?.id
  }

  // 开发环境打印
  if (import.meta.env.DEV) {
    console.error('[API Error]', errorLog)
  }

  // 生产环境上报
  if (import.meta.env.PROD) {
    // 发送到错误追踪服务（如 Sentry）
    // Sentry.captureException(error)
  }
}
```
