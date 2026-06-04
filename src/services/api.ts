import axios, { AxiosError, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import i18next from 'i18next';
import { runtimeConfig } from '@/constants/runtime';
import { useAuthStore } from '@/stores/authStore';
import { useWorkspaceStore } from '@/stores/workspaceStore';

export type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

export type BizError = {
  isBizError: true;
  code: number;
  message: string;
  data?: unknown;
};

export interface ApiRequestConfig<D = unknown> extends AxiosRequestConfig<D> {
  silentError?: boolean;
}

type InternalApiRequestConfig<D = unknown> = InternalAxiosRequestConfig<D> & {
  _retry?: boolean;
  silentError?: boolean;
};

export interface ApiRateLimitError {
  isRateLimitError: true;
  code: number;
  message: string;
  status: number;
  limit: number;
  count: number;
  resetAt: number;
  retryAfterMs: number;
}

const api = axios.create({
  baseURL: runtimeConfig.apiBaseUrl,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

function isSilentRequest(config?: { silentError?: boolean } | null): boolean {
  return config?.silentError === true;
}

export function extractApiRateLimitError(error: unknown): ApiRateLimitError | null {
  const axiosError = error as AxiosError<ApiEnvelope<unknown>>;
  const status = axiosError?.response?.status;
  const payload = axiosError?.response?.data;
  if (status !== 429 || !payload || typeof payload !== 'object') {
    return null;
  }

  const code = typeof payload.code === 'number' ? payload.code : status;
  const message = typeof payload.message === 'string' && payload.message.trim() ? payload.message : 'too many requests';
  const rawData = payload.data;
  const data = rawData && typeof rawData === 'object' ? (rawData as Record<string, unknown>) : null;
  const limit = typeof data?.limit === 'number' ? data.limit : 0;
  const count = typeof data?.count === 'number' ? data.count : 0;
  const resetAt = typeof data?.reset_at === 'number' ? data.reset_at : 0;

  return {
    isRateLimitError: true,
    code,
    message,
    status,
    limit,
    count,
    resetAt,
    retryAfterMs: resetAt > 0 ? Math.max(0, resetAt * 1000 - Date.now()) : 0,
  };
}

api.interceptors.request.use(
  (config: InternalApiRequestConfig) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    config.headers['X-Request-ID'] = generateRequestId();

    const currentOrgId =
      useWorkspaceStore.getState().currentOrg?.org_id || localStorage.getItem('current_org_id');
    if (currentOrgId) {
      config.headers['X-Org-ID'] = currentOrgId;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isRefreshing = false;
let waitQueue: Array<() => void> = [];

function clearAuthAndRedirect() {
  useAuthStore.getState().clearAuth();
  window.location.href = '/login';
}

async function refreshToken() {
  const refresh = useAuthStore.getState().refreshToken;
  const res = await axios.post<ApiEnvelope<{
    access_token: string;
    refresh_token: string;
    current_org_id?: string;
    current_org_role?: 'admin' | 'member' | 'guest';
  }>>(
    `${api.defaults.baseURL || '/api/v1'}/auth/refresh`,
    { refresh_token: refresh }
  );

  const tokens = res.data.data;
  useAuthStore.getState().setTokens(tokens.access_token, tokens.refresh_token, {
    currentOrgID: tokens.current_org_id,
    currentOrgRole: tokens.current_org_role,
  });
  if (tokens.current_org_id) {
    localStorage.setItem('current_org_id', tokens.current_org_id);
  }
  return tokens.access_token;
}

const commonErrorKeys: Record<number, string> = {
  401002: 'errors:invalidCredentials',
  403001: 'errors:forbidden',
  404001: 'errors:resourceNotFound',
  409001: 'errors:conflict',
  429001: 'errors:tooManyRequests',
  503: 'errors:dependencyUnavailable',
};

const authErrorKeys: Record<number, string> = {
  400001: 'errors:userExists',
  400002: 'errors:emailExists',
  400003: 'errors:passwordComplexity',
  422001: 'errors:invalidCredentials',
  422002: 'errors:oldPasswordWrong',
};

const exportErrorKeys: Record<number, string> = {
  400003: 'errors:exportComparisonRequiresMultiple',
  400004: 'errors:exportMergePdfOnly',
  400005: 'errors:reportTemplateMismatch',
  400006: 'errors:reportTemplateInvalid',
  501001: 'errors:chartExportUnavailable',
  503001: 'errors:reportTemplateExportUnavailable',
  503002: 'errors:pdfExportUnavailable',
};

function isAuthScopedUrl(url?: string) {
  if (!url) {
    return false;
  }
  return (
    url.includes('/auth/') ||
    url.includes('/users/change-password') ||
    url.includes('/settings/change-password')
  );
}

function isExportScopedUrl(url?: string) {
  return Boolean(url?.includes('/export/'));
}

function resolveErrorMessage(code: number, msg: string, url?: string) {
  const scopedKey = isExportScopedUrl(url)
    ? exportErrorKeys[code]
    : isAuthScopedUrl(url)
      ? authErrorKeys[code]
      : undefined;
  const key = scopedKey || commonErrorKeys[code];

  if (key) {
    return i18next.t(key, { defaultValue: msg || undefined });
  }
  return msg || i18next.t('errors:requestFailed');
}

function showErrorMessage(code: number, msg: string, url?: string) {
  message.error(resolveErrorMessage(code, msg, url));
}

api.interceptors.response.use(
  (response) => {
    const body = response?.data as ApiEnvelope<unknown>;
    const requestConfig = response.config as ApiRequestConfig | undefined;

    if (body && typeof body.code === 'number' && body.code !== 0) {
      const err: BizError = {
        isBizError: true,
        code: body.code,
        message: body.message || 'business error',
        data: body.data,
      };

      if (!isSilentRequest(requestConfig)) {
        showErrorMessage(body.code, body.message, response.config.url);
      }
      return Promise.reject(err);
    }

    return body && typeof body.code === 'number' ? body.data : response.data;
  },
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as InternalApiRequestConfig | undefined;
    const silentError = isSilentRequest(original);

    if (status !== 401 || !original || original._retry) {
      if (!silentError && error.response) {
        const data = error.response.data as ApiEnvelope<unknown>;
        const code = data?.code || status;
        const msg = data?.message || '请求失败';
        showErrorMessage(code || 500, msg, original?.url);
      } else if (!silentError && error.code === 'ECONNABORTED') {
        message.error('请求超时，请重试');
      } else if (!silentError && !window.navigator.onLine) {
        message.error('网络连接已断开，请检查网络');
      } else if (!silentError) {
        message.error('网络错误，请稍后重试');
      }
      return Promise.reject(error);
    }

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        await refreshToken();
        waitQueue.forEach((fn) => fn());
        waitQueue = [];
      } catch (refreshError) {
        clearAuthAndRedirect();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return new Promise((resolve) => {
      waitQueue.push(() => {
        original._retry = true;
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${useAuthStore.getState().accessToken}`;
        resolve(api(original));
      });
    });
  }
);

export async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const res = await promise;
  if (res.data.code !== 0) {
    throw new Error(res.data.message || 'request failed');
  }
  return res.data.data;
}

export default api;
