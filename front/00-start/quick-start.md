# 快速上手

## 5 分钟开始开发

### 1. 初始化项目

```bash
# 创建项目
npm create vite@latest myagent-frontend -- --template react-ts
cd myagent-frontend

# 安装依赖
npm install

# 核心依赖
npm install antd @ant-design/icons react-router-dom zustand axios
npm install echarts echarts-for-react i18next react-i18next dayjs

# 开发依赖
npm install -D @types/node
```

### 2. 环境变量配置

创建 `.env.development`:

```bash
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_WS_BASE_URL=ws://localhost:8005/ws
```

### 3. 创建 API 客户端

```typescript
// src/services/api.ts
import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 30000,
})

// 请求拦截器 - 添加 Token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 响应拦截器 - 处理 401
api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      // TODO: 实现 token 刷新
    }
    return Promise.reject(error.response?.data || error)
  }
)

export default api
```

### 4. 创建 Zustand Store

```typescript
// src/stores/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: UserInfo | null
  token: string | null
  setAuth: (user: UserInfo, token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      setAuth: (user, token) => set({ user, token }),
      clearAuth: () => set({ user: null, token: null }),
    }),
    { name: 'auth-storage' }
  )
)
```

### 5. 登录示例

```typescript
// src/services/auth.ts
import api from './api'

export interface LoginRequest {
  username: string
  password: string
}

export interface LoginResponse {
  access_token: string
  refresh_token: string
  expires_in: number
  user: UserInfo
}

export const authService = {
  login: async (data: LoginRequest): Promise<LoginResponse> => {
    const res = await api.post('/auth/login', data)
    return res.data
  },
}
```

```typescript
// src/pages/LoginPage.tsx
import { Form, Input, Button } from 'antd'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { authService } from '@/services/auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((state) => state.setAuth)

  const onFinish = async (values: LoginRequest) => {
    try {
      const data = await authService.login(values)
      localStorage.setItem('access_token', data.access_token)
      localStorage.setItem('refresh_token', data.refresh_token)
      setAuth(data.user, data.access_token)
      navigate('/')
    } catch (error) {
      // 处理错误
    }
  }

  return (
    <Form onFinish={onFinish}>
      <Form.Item name="username" rules={[{ required: true }]}>
        <Input placeholder="用户名" />
      </Form.Item>
      <Form.Item name="password" rules={[{ required: true }]}>
        <Input.Password placeholder="密码" />
      </Form.Item>
      <Button type="primary" htmlType="submit">
        登录
      </Button>
    </Form>
  )
}
```

### 6. 路由配置

```typescript
// src/router/index.tsx
import { createBrowserRouter } from 'react-router-dom'
import { Layout } from '@/components/Layout'
import { LoginPage } from '@/pages/LoginPage'
import { ProtectedRoute } from '@/components/ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: <ProtectedRoute><Layout /></ProtectedRoute>,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'benchmarks', element: <BenchmarkListPage /> },
      { path: 'executions', element: <ExecutionListPage /> },
    ],
  },
])
```

### 7. 路由守卫

```typescript
// src/components/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((state) => state.token)
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
```

## 下一步

1. 阅读场景文档了解业务流程
2. 查看页面文档了解组件设计
3. 参考 API 文档了解接口定义
4. 查看技术模式了解最佳实践
