# 请求客户端封装（Axios）

## 概述

基于 Axios 封装的 HTTP 客户端，统一处理请求拦截、响应拦截、错误处理和 Token 刷新。

## 基础配置

### Axios 实例

```typescript
// src/services/api.ts
import axios, { AxiosError, AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';

// 创建 Axios 实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    // 添加 Token
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // 添加请求 ID（用于追踪）
    config.headers['X-Request-ID'] = generateRequestId();

    // 添加组织上下文
    const orgId = localStorage.getItem('current_org_id');
    if (orgId) {
      config.headers['X-Organization-ID'] = orgId;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 生成请求 ID
function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export default api;
```

### 响应拦截器

```typescript
// src/services/api.ts (续)

// 响应拦截器
api.interceptors.response.use(
  (response: AxiosResponse) => {
    const { code, message: msg, data } = response.data;

    // 成功响应
    if (code === 0) {
      return data;
    }

    // 业务错误
    const error = new Error(msg || '请求失败');
    (error as any).code = code;
    (error as any).response = response;

    // 根据错误码显示提示
    showErrorMessage(code, msg);

    return Promise.reject(error);
  },
  async (error: AxiosError) => {
    const { response, code } = error;

    // 网络错误
    if (!response) {
      if (code === 'ECONNABORTED') {
        message.error('请求超时，请重试');
      } else if (!window.navigator.onLine) {
        message.error('网络连接已断开，请检查网络');
      } else {
        message.error('网络错误，请稍后重试');
      }
      return Promise.reject(error);
    }

    // HTTP 状态码处理
    const status = response.status;
    const data = response.data as any;

    switch (status) {
      case 401:
        // Token 过期或无效
        return handleUnauthorized(error);

      case 403:
        message.error(data?.message || '没有权限访问');
        break;

      case 404:
        message.error(data?.message || '请求的资源不存在');
        break;

      case 422:
        message.error(data?.message || '请求参数验证失败');
        break;

      case 429:
        message.error('请求过于频繁，请稍后再试');
        break;

      case 500:
      case 502:
      case 503:
        message.error('服务器错误，请稍后重试');
        break;

      default:
        message.error(data?.message || '请求失败');
    }

    return Promise.reject(error);
  }
);

// 显示业务错误消息
function showErrorMessage(code: number, msg: string) {
  const errorMessages: Record<number, string> = {
    400001: '用户名已存在',
    400002: '邮箱已被使用',
    422001: '用户名或密码错误',
    422002: '旧密码错误',
  };

  const message = errorMessages[code] || msg;
  if (message) {
    message.error(message);
  }
}
```

## Token 刷新机制

### 无感刷新

```typescript
// src/services/api.ts (续)

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

// 订阅 Token 刷新
function subscribeTokenRefresh(callback: (token: string) => void) {
  refreshSubscribers.push(callback);
}

// 通知订阅者
function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

// 处理 401 未授权
async function handleUnauthorized(error: AxiosError) {
  const refreshToken = localStorage.getItem('refresh_token');

  // 没有 refresh token，直接跳转登录
  if (!refreshToken) {
    clearAuthAndRedirect();
    return Promise.reject(error);
  }

  // 正在刷新，加入队列
  if (isRefreshing) {
    return new Promise((resolve) => {
      subscribeTokenRefresh((token: string) => {
        if (error.config) {
          error.config.headers.Authorization = `Bearer ${token}`;
          resolve(api(error.config));
        }
      });
    });
  }

  isRefreshing = true;

  try {
    // 刷新 Token
    const response = await axios.post('/auth/refresh', {
      refresh_token: refreshToken,
    });

    const { access_token, refresh_token: newRefreshToken } = response.data.data;

    // 更新存储
    localStorage.setItem('access_token', access_token);
    if (newRefreshToken) {
      localStorage.setItem('refresh_token', newRefreshToken);
    }

    // 通知所有订阅者
    onTokenRefreshed(access_token);

    // 重试原请求
    if (error.config) {
      error.config.headers.Authorization = `Bearer ${access_token}`;
      return api(error.config);
    }
  } catch (refreshError) {
    // 刷新失败，清除认证信息并跳转登录
    clearAuthAndRedirect();
    return Promise.reject(refreshError);
  } finally {
    isRefreshing = false;
  }
}

// 清除认证信息并跳转登录
function clearAuthAndRedirect() {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');

  // 清除 Zustand store
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('auth-logout'));
  }

  // 跳转登录页
  window.location.href = '/login';
}
```

## 请求封装

### 通用请求方法

```typescript
// src/services/request.ts
import api from './api';
import type { ApiResponse } from '@/types';

export interface RequestConfig extends AxiosRequestConfig {
  // 是否显示错误消息
  showError?: boolean;
  // 是否显示加载状态
  loading?: boolean;
  // 请求取消标识
  cancelKey?: string;
}

// 取消令牌存储
const cancelTokens = new Map<string, AbortController>();

export const request = {
  get: <T = any>(url: string, config?: RequestConfig): Promise<T> => {
    return api.get(url, config);
  },

  post: <T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> => {
    return api.post(url, data, config);
  },

  put: <T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> => {
    return api.put(url, data, config);
  },

  delete: <T = any>(url: string, config?: RequestConfig): Promise<T> => {
    return api.delete(url, config);
  },

  patch: <T = any>(url: string, data?: any, config?: RequestConfig): Promise<T> => {
    return api.patch(url, data, config);
  },

  // 文件上传
  upload: <T = any>(url: string, file: File | FormData, onProgress?: (progress: number) => void): Promise<T> => {
    const formData = file instanceof FormData ? file : new FormData();
    if (file instanceof File) {
      formData.append('file', file);
    }

    return api.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
  },

  // 文件下载
  download: (url: string, filename?: string): Promise<void> => {
    return api.get(url, {
      responseType: 'blob',
    }).then((data) => {
      const blobUrl = URL.createObjectURL(data);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    });
  },
};

// 取消请求
export function cancelRequest(key: string) {
  const controller = cancelTokens.get(key);
  if (controller) {
    controller.abort();
    cancelTokens.delete(key);
  }
}

// 取消所有请求
export function cancelAllRequests() {
  cancelTokens.forEach((controller) => controller.abort());
  cancelTokens.clear();
}
```

## 服务模块封装

### 认证服务

```typescript
// src/services/auth.ts
import { request } from './request';
import type { LoginDto, RegisterDto, User, TokenResponse } from '@/types';

export const authService = {
  // 登录
  login: (data: LoginDto) => {
    return request.post<TokenResponse>('/auth/login', data);
  },

  // 注册
  register: (data: RegisterDto) => {
    return request.post<TokenResponse>('/auth/register', data);
  },

  // 获取当前用户
  me: () => {
    return request.get<User>('/auth/me');
  },

  // 刷新 Token
  refresh: (refreshToken: string) => {
    return request.post<TokenResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
  },

  // 登出
  logout: () => {
    return request.post('/auth/logout');
  },

  // 修改密码
  changePassword: (data: { old_password: string; new_password: string }) => {
    return request.put('/auth/password', data);
  },
};
```

### Benchmark 服务

```typescript
// src/services/benchmark.ts
import { request } from './request';
import type { Benchmark, CreateBenchmarkDto, UpdateBenchmarkDto, ListParams, PaginatedResponse } from '@/types';

export const benchmarkService = {
  // 获取列表
  list: (params: ListParams) => {
    return request.get<PaginatedResponse<Benchmark>>('/benchmarks', { params });
  },

  // 获取详情
  get: (id: string) => {
    return request.get<Benchmark>(`/benchmarks/${id}`);
  },

  // 创建
  create: (data: CreateBenchmarkDto) => {
    return request.post<Benchmark>('/benchmarks', data);
  },

  // 更新
  update: (id: string, data: UpdateBenchmarkDto) => {
    return request.put<Benchmark>(`/benchmarks/${id}`, data);
  },

  // 删除
  delete: (id: string) => {
    return request.delete(`/benchmarks/${id}`);
  },

  // 执行
  run: (id: string, data: { agent_id: string; priority?: 'p0' | 'p1' | 'p2' | 'p3' }) => {
    return request.post(`/benchmarks/${id}/runs`, data);
  },

  // 导入
  import: (file: File, onProgress?: (progress: number) => void) => {
    return request.upload('/benchmarks/import', file, onProgress);
  },

  // 导出
  export: (ids: string[]) => {
    return request.post('/benchmarks/export', { ids }, {
      responseType: 'blob',
    });
  },
};
```

### Execution 服务

```typescript
// src/services/execution.ts
import { request } from './request';
import type { Execution, ListParams, PaginatedResponse, ExecutionLog } from '@/types';

export const executionService = {
  // 获取列表
  list: (params: ListParams) => {
    return request.get<PaginatedResponse<Execution>>('/executions', { params });
  },

  // 获取详情
  get: (id: string) => {
    return request.get<Execution>(`/executions/${id}`);
  },

  // 取消执行
  cancel: (id: string) => {
    return request.post(`/executions/${id}/cancel`);
  },

  // 获取日志
  getLogs: (id: string) => {
    return request.get<ExecutionLog[]>(`/executions/${id}/logs`);
  },

  // 获取实时日志流
  streamLogs: (id: string) => {
    return `/executions/${id}/stream`;
  },

  // 重试执行
  retry: (id: string) => {
    return request.post(`/executions/${id}/retry`);
  },
};
```

## 类型定义

```typescript
// src/types/api/common.ts
export interface ApiResponse<T = any> {
  code: number;
  message: string;
  data?: T;
  request_id?: string;
}

export interface PaginatedResponse<T> {
  total: number;
  page: number;
  size: number;
  data: T[];
}

export interface ListParams {
  page?: number;
  page_size?: number;
  sort_by?: string;
  order?: 'asc' | 'desc';
  [key: string]: any;
}

export interface ErrorResponse {
  code: number;
  message: string;
  details?: string;
  request_id?: string;
}
```

## 自定义 Hook

### useRequest Hook

```typescript
// src/hooks/useRequest.ts
import { useState, useCallback } from 'react';
import { request } from '@/services/request';

interface UseRequestOptions<T> {
  // 是否立即执行
  immediate?: boolean;
  // 成功回调
  onSuccess?: (data: T) => void;
  // 错误回调
  onError?: (error: Error) => void;
  // 完成回调
  onFinally?: () => void;
}

export function useRequest<T>(
  apiFunc: () => Promise<T>,
  options: UseRequestOptions<T> = {}
) {
  const { immediate = false, onSuccess, onError, onFinally } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiFunc();
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setLoading(false);
      onFinally?.();
    }
  }, [apiFunc, onSuccess, onError, onFinally]);

  // 立即执行
  useState(() => {
    if (immediate) {
      execute();
    }
  });

  return {
    data,
    loading,
    error,
    execute,
    // 重置状态
    reset: () => {
      setData(null);
      setError(null);
      setLoading(false);
    },
  };
}
```

## 最佳实践

1. **统一错误处理** - 在拦截器中统一处理，业务代码不需要关心
2. **Token 自动刷新** - 无感刷新，用户体验更好
3. **请求取消** - 组件卸载时自动取消未完成的请求
4. **类型安全** - 完整的 TypeScript 类型定义
5. **请求缓存** - 对 GET 请求进行适当缓存
6. **重试机制** - 对失败请求进行自动重试
