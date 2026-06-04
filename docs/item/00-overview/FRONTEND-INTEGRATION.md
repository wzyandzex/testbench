# 前端请求层模板（可直接落地）

本文件给前端同学提供一份可直接复用的请求层模板，目标是统一处理鉴权、组织上下文、业务错误码和刷新令牌。

适配场景：

- 用户端前端项目（user-app）
- 系统管理端前端项目（admin-app）

建议：将本文件抽成共享 SDK（例如 `@project/api-client`），两端复用同一请求中间层。

## 1. 统一响应结构

后端统一返回：

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

判定规则必须是双层：

1. HTTP 状态不是 2xx：失败。
2. HTTP 状态是 2xx 但 `code !== 0`：也失败。

---

## 2. Axios 基础封装（TypeScript）

```ts
import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";

type ApiEnvelope<T> = {
  code: number;
  message: string;
  data: T;
};

type BizError = {
  isBizError: true;
  code: number;
  message: string;
  data?: unknown;
};

const api: AxiosInstance = axios.create({
  baseURL: "/api/v1",
  timeout: 20000,
});

function getAccessToken() {
  return localStorage.getItem("access_token") || "";
}

function getRefreshToken() {
  return localStorage.getItem("refresh_token") || "";
}

function getCurrentOrgId() {
  return localStorage.getItem("current_org_id") || "";
}

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getAccessToken();
  const orgId = getCurrentOrgId();

  config.headers = config.headers || {};

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 主标准头（组织域接口必填）
  if (orgId) {
    config.headers["X-Org-ID"] = orgId;
  }

  // 兼容期说明：后端仍兼容 X-Organization-Id，前端无需主动双写。
  return config;
});

api.interceptors.response.use(
  (response) => {
    const body = response?.data as ApiEnvelope<unknown>;
    if (body && typeof body.code === "number" && body.code !== 0) {
      const err: BizError = {
        isBizError: true,
        code: body.code,
        message: body.message || "business error",
        data: body.data,
      };
      return Promise.reject(err);
    }
    return response;
  },
  (error: AxiosError) => Promise.reject(error)
);

export default api;
```

---

## 3. 刷新令牌并发收敛（避免风暴）

```ts
let refreshing = false;
let waitQueue: Array<() => void> = [];

async function refreshToken() {
  const refresh = getRefreshToken();
  const res = await axios.post<ApiEnvelope<{ access_token: string; refresh_token: string; current_org_id?: string }>>(
    "/api/v1/auth/refresh",
    { refresh_token: refresh }
  );

  const tokens = res.data.data;
  localStorage.setItem("access_token", tokens.access_token);
  localStorage.setItem("refresh_token", tokens.refresh_token);
  if (tokens.current_org_id) {
    localStorage.setItem("current_org_id", tokens.current_org_id);
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const status = error.response?.status;
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;

    if (status !== 401 || !original || original._retry) {
      return Promise.reject(error);
    }

    if (!refreshing) {
      refreshing = true;
      try {
        await refreshToken();
        waitQueue.forEach((fn) => fn());
        waitQueue = [];
      } catch (e) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        location.href = "/login";
        return Promise.reject(e);
      } finally {
        refreshing = false;
      }
    }

    return new Promise((resolve) => {
      waitQueue.push(() => {
        original._retry = true;
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${getAccessToken()}`;
        resolve(api(original));
      });
    });
  }
);
```

---

## 4. 通用解包函数

```ts
export async function unwrap<T>(promise: Promise<{ data: ApiEnvelope<T> }>): Promise<T> {
  const res = await promise;
  if (res.data.code !== 0) {
    throw new Error(res.data.message || "request failed");
  }
  return res.data.data;
}
```

---

## 5. 典型场景模板

### 5.1 导入任务轮询

```ts
export async function pollImportTask(taskId: string, onUpdate: (task: any) => void) {
  const maxAttempts = 300;
  for (let i = 0; i < maxAttempts; i++) {
    const res = await api.get(`/import/tasks/${taskId}`);
    const task = res.data.data;
    onUpdate(task);

    if (["completed", "failed", "cancelled"].includes(task.status)) {
      return task;
    }

    await new Promise((r) => setTimeout(r, 1000));
  }
  throw new Error("polling timeout");
}
```

### 5.2 上传导入文件

```ts
export async function uploadImportFile(dataset: "humaneval" | "mbpp", file: File) {
  const form = new FormData();
  form.append("file", file);

  const res = await api.post(`/import/tasks/${dataset}/upload`, form, {
    headers: { "Content-Type": "multipart/form-data" },
  });

  return res.data.data as { file_id: string; size: number };
}
```

---

## 6. 建议错误映射

- `401001~401004`：登录态问题，走刷新/重新登录。
- `403001`：权限不足（如 Kafka、SWE 全局 WS/缓存管理等系统管理员接口）。
- `404001`：资源不存在或越权被隐藏（防枚举语义）。
- `409001`：Benchmark 导入同名冲突（默认仅新增，不覆盖）。
- `503`：依赖服务不可用（如 Kafka 队列不可用）。

---

## 7. 对接前自检

1. 组织域接口请求头已统一注入 `Authorization` 和 `X-Org-ID`（缺失会被拒绝）。
2. 所有调用点都处理了 `HTTP 2xx + code!=0`。
3. 401 刷新链路只会有一个并发 refresh。
4. 登录/刷新/切换组织后都能正确更新本地 `current_org_id`。
5. 业务码提示文案已按模块做映射。

更新时间：2026-03-04

