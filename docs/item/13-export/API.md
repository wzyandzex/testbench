# 数据导出 API（前端对接）

Base URL: `/api/v1`  
鉴权：需要 `Authorization: Bearer <token>`  
组织上下文：必须带 `X-Org-ID`  
Consumer：`user-app`

可用性说明（按当前后端实现）：

- 导出路由仅在后端已启用对象存储导出组件时注册。
- 若部署未启用 MinIO/导出服务，前端应隐藏导出入口或展示“未启用”提示。

作用域说明：

- 导出前会校验执行记录所属组织。
- 跨组织访问返回 `404001`（隐藏资源存在性）。
- 缺少组织上下文时可能返回 `400`。

---

## 1. 接口总览

| Method | Path | Consumer | 说明 |
|---|---|---|---|
| POST | `/export/executions/:id` | `user-app` | 导出单次执行 |
| POST | `/export/executions/direct` | `user-app` | 直接下载 |
| POST | `/export/batch` | `user-app` | 批量导出 |
| GET | `/export/formats` | `user-app` | 导出格式列表 |

---

## 2. 单次导出 `POST /export/executions/:id`

Path：

- `id`: execution ID

Query：

- `type`: `pdf|excel|html`（默认 `html`）
- `template`: `summary|detailed|comparison`（默认 `summary`）
- `charts`: `true|false`（默认 `false`）
- `locale`: 如 `zh-CN`（默认 `zh-CN`）

请求示例：

```http
POST /api/v1/export/executions/exec-123?type=html&template=summary
Authorization: Bearer <token>
X-Org-ID: org-123
```

成功响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "file_url": "https://...",
    "file_name": "exec-123_summary.html",
    "file_size": 10240,
    "content_type": "text/html; charset=utf-8",
    "expires_at": "2026-02-28T12:00:00Z",
    "generated_at": "2026-02-28T11:00:00Z"
  }
}
```

前端处理：拿到 `file_url` 后 `window.open(file_url)` 即可下载/预览。

---

## 3. 批量导出 `POST /export/batch`

请求体：

```json
{
  "execution_ids": ["exec-1", "exec-2"],
  "format": "html",
  "template": "summary",
  "merge": false,
  "include_charts": false
}
```

约束：

- `execution_ids` 最少 1，最多 50
- `format` 必须为 `pdf|excel|html`
- `template` 必须为 `summary|detailed|comparison`

注意：部分失败时仍可能 HTTP 200，需检查 `data.status`。

---

## 4. 导出格式列表 `GET /export/formats`

返回 `formats[]`，每项包含：

- `format`
- `name`
- `templates`
- `content_type`
- `extension`

---

## 5. 已知问题（前端规避）

`POST /export/executions/direct` 当前实现会读取 path `:id`，但路由未定义 `:id`，常见返回：

```json
{
  "code": 400,
  "message": "execution_id is required"
}
```

建议暂不使用该接口。

---

## 6. 常见错误码/状态

| code | 场景 |
|---|---|
| `400` | execution_id 缺失、format/template 非法、批量参数非法 |
| `404001` | 执行记录不存在（含跨组织越权隐藏） |
| `500` | 导出生成失败、存储失败 |

---

## 7. 前端调用示例（TypeScript）

```ts
import api from "@/lib/api";

export async function fetchExportFormats() {
  const res = await api.get("/export/formats");
  return res.data.data.formats;
}

export async function exportExecution(id: string) {
  const res = await api.post(`/export/executions/${id}`, null, {
    params: { type: "html", template: "summary" },
  });
  return res.data.data;
}

export async function exportBatch(executionIds: string[]) {
  const res = await api.post("/export/batch", {
    execution_ids: executionIds,
    format: "html",
    template: "summary",
  });
  return res.data.data;
}
```


## 前端最小对接流程

1. 先接 `GET /export/formats` 渲染格式和模板选项。
2. 单条导出走 `POST /export/executions/:id`，拿 `file_url` 直接下载。
3. 多选导出走 `POST /export/batch`，并在结果页展示 `status/completed/error`。
4. 不使用 `POST /export/executions/direct`，该接口当前有已知参数缺陷。


## 页面字段映射（接口 -> UI）

| 接口字段 | UI 字段/状态 | 说明 |
|---|---|---|
| `formats.data.formats[]` | `exportForm.formatOptions` | 导出格式下拉选项 |
| `formats[].templates[]` | `exportForm.templateOptions` | 模板下拉选项（联动 format） |
| `export.data.file_url` | `downloadAction.url` | 前端直接打开下载链接 |
| `export.data.file_name` | `downloadAction.filename` | 下载记录与文件名展示 |
| `batch.data.status/completed/total` | `batchExportResult` | 批量导出结果面板 |
| `batch.data.error` | `batchExportResult.errorText` | 部分/全部失败提示 |


## 页面接口调用时序（建议）

1. 初始化选项：`GET /export/formats`。
2. 单条导出：`POST /export/executions/:id`，拿到 `file_url` 直接下载。
3. 批量导出：`POST /export/batch`，展示 `status/completed/error`。
4. 导出完成后刷新页面状态，不使用 `executions/direct`。


## 前端联调检查清单

1. 请求头：导出接口统一带 `Authorization` + `X-Org-ID`。
2. 必填参数：单条导出 path `:id` 必填；批量导出 `execution_ids` 至少 1 个。
3. 成功判定：拿到 `file_url` 才触发下载；批量导出同时检查 `status`。
4. 失败分支：`POST /export/executions/direct` 不纳入联调范围（已知实现缺陷）。
5. 回流刷新：导出完成后更新页面导出状态与最近操作记录。

## 通用错误处理与排错

- 错误码总览：`../00-overview/ERROR-CODES.md`
- 快速排错：`../00-overview/TROUBLESHOOTING.md`
- 请求层模板：`../00-overview/FRONTEND-INTEGRATION.md`

## 字段级契约（深度版）

### A. 单次导出 `POST /export/executions/:id`

Path：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `id` | string | 是 | execution ID |

Query：

| 参数 | 类型 | 必填 | 默认值 | 枚举/约束 | 说明 |
|---|---|---|---|---|---|
| `type` | string | 否 | `html` | `pdf/excel/html` | 导出格式 |
| `template` | string | 否 | `summary` | `summary/detailed/comparison` | 模板 |
| `charts` | bool | 否 | false | - | 是否包含图表 |
| `locale` | string | 否 | `zh-CN` | 如 `zh-CN/en-US` | 语言地区 |

响应核心字段：

| 字段 | 类型 | 必有 | 说明 |
|---|---|---|---|
| `file_url` | string | 是 | 下载地址 |
| `file_name` | string | 是 | 文件名 |
| `file_size` | int | 否 | 文件大小 |
| `content_type` | string | 否 | MIME 类型 |
| `expires_at` | string | 否 | 链接过期时间 |
| `generated_at` | string | 否 | 生成时间 |

### B. 批量导出 `POST /export/batch`（请求体）

| 字段 | 类型 | 必填 | 可空 | 默认值 | 枚举/约束 | 说明 |
|---|---|---|---|---|---|---|
| `execution_ids` | string[] | 是 | 否 | - | 1~50 | 待导出执行 ID |
| `format` | string | 否 | `html` | `pdf/excel/html` | 导出格式 |
| `template` | string | 否 | `summary` | `summary/detailed/comparison` | 模板 |
| `merge` | bool | 否 | false | - | 是否合并输出 |
| `include_charts` | bool | 否 | false | - | 是否包含图表 |

批量响应重点字段（按当前实现语义）：

| 字段 | 类型 | 必有 | 说明 |
|---|---|---|---|
| `status` | string | 常见 | 批量导出状态 |
| `completed` | int | 常见 | 已完成数 |
| `total` | int | 常见 | 总数 |
| `error` | string | 否 | 失败信息 |

注意：批量导出“部分失败”可能仍返回 HTTP 200，需要结合 `status/error` 判定。

### C. 导出格式 `GET /export/formats`

`formats[]` 字段约定：

| 字段 | 类型 | 必有 | 说明 |
|---|---|---|---|
| `format` | string | 是 | 格式标识 |
| `name` | string | 是 | 展示名称 |
| `templates` | string[] | 是 | 可用模板 |
| `content_type` | string | 否 | MIME |
| `extension` | string | 否 | 文件扩展名 |

## 状态机与终态语义（深度版）

### A. 单次导出下载状态机

`idle -> submitting -> generated -> downloading -> done|error`

前端行为：
1. `generated` 后才允许触发下载动作。
2. `file_url` 缺失即判定失败，不触发浏览器下载。

### B. 批量导出状态机

`idle -> submitting -> processing -> completed|partial_failed|failed`

说明：
1. `partial_failed` 需展示完成数与失败原因，不应直接归类“全失败”。
2. 状态判断以业务字段 `status/error` 为主，不只看 HTTP 状态。

## 页面级验收清单（新增）

1. 先加载 `GET /export/formats` 再允许提交导出请求。  
2. 单次导出必须拿到 `file_url` 才触发下载。  
3. 批量导出支持部分失败展示（completed/total/error）。  
4. 非法 format/template 在前端拦截，减少 400 往返。  
5. `POST /export/executions/direct` 不作为可用接口接入（已知缺陷）。  
6. 跨组织导出场景统一提示“资源不存在或无访问权限”。  

## 文档可信来源

- `internal/api/router/router.go`
- `internal/api/handler/export_handler.go`
- `internal/application/report/exporter/*`
- `internal/domain/report/export/*`

更新时间：2026-03-05

