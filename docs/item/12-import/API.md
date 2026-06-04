# 数据导入 API（前端对接）

Base URL: `/api/v1`  
鉴权：全部需要 `Authorization: Bearer <token>`  
组织上下文：必须带 `X-Org-ID`  
Consumer：`user-app`

`organization_id` 字段规则（非常重要）：

- 普通用户：只能导入到当前 `X-Org-ID`，如果请求里显式传了不同的 `organization_id`，会返回 `403`
- 系统管理员（`role=admin`）：允许传 `organization_id` 跨组织导入
- 管理员跨组织时，后端会校验目标组织是否存在且处于激活状态；不存在返回 `404`，非激活返回 `403`
- 不传 `organization_id` 时，默认导入到当前 `X-Org-ID`

导入限流（Import Abuse Control）：

- 导入写接口按 `org_id + user_id + dataset + source` 维度限流；
- 命中限流时返回 `429`，业务码 `429004`；
- 响应 `data` 包含 `limit`、`count`、`reset_at`、`dataset`、`source`，前端可直接用于提示“稍后重试”。
- 阈值由后端配置 `middleware.import_rate_limit_config` 控制（不同环境可独立调优）。
- 限流后端异常策略由 `middleware.import_rate_limit_fail_open` 控制：
  - `false`（默认，推荐生产）：fail-close，返回 `503001`；
  - `true`：fail-open，放行请求并记录告警日志。

---

## 1. 接口总览

## 1.1 Benchmark 导入

| Method | Path | Consumer | 说明 |
|---|---|---|---|
| POST | `/import/benchmarks/file` | `user-app` | 文件导入 |
| POST | `/import/benchmarks/url` | `user-app` | URL 导入 |
| POST | `/import/benchmarks/batch` | `user-app` | 批量导入 |
| POST | `/import/benchmarks/json` | `user-app` | JSON 导入 |
| POST | `/import/benchmarks/yaml` | `user-app` | YAML 导入 |
| GET | `/import/benchmarks/sources` | `user-app` | 支持的导入源 |

说明：
- Benchmark 的 `file/url/json/yaml` 导入接口返回的是单个 `benchmark` 对象；
- `quality_summary` 聚合结果结构主要用于 HumanEval/SWE-bench/CodeComplete 等数据集导入链路。

## 1.2 HumanEval / SWE-bench 导入

| Method | HumanEval | SWE-bench | Consumer |
|---|---|---|---|
| POST | `/import/humaneval/huggingface` | `/import/swebench/huggingface` | `user-app` |
| POST | `/import/humaneval/url` | `/import/swebench/url` | `user-app` |
| POST | `/import/humaneval/file` | `/import/swebench/file` | `user-app` |
| POST | `/import/humaneval/json` | `/import/swebench/json` | `user-app` |
| GET | `/import/humaneval/datasets` | `/import/swebench/datasets` | `user-app` |

返回（新增 `quality_summary`，前端可直接展示质量门禁结果）：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "success": true,
    "imported": 12,
    "failed": 1,
    "skipped": 0,
    "total": 13,
    "quality_summary": {
      "checked": 13,
      "passed": 12,
      "denied": 1,
      "warnings": 2
    },
    "items": []
  }
}
```

## 1.3 CodeComplete 导入

| Method | Path | Consumer | 说明 |
|---|---|---|---|
| POST | `/import/codecomplete/huggingface/:dataset` | `user-app` | 从 HF 导入 |
| POST | `/import/codecomplete/url/:dataset` | `user-app` | 从 URL 导入 |
| POST | `/import/codecomplete/file/:dataset` | `user-app` | 文件导入 |
| POST | `/import/codecomplete/json/:dataset` | `user-app` | JSON 导入 |
| GET | `/import/codecomplete/datasets` | `user-app` | 支持数据集列表 |

返回结构同上，也包含 `quality_summary`（当该链路启用质量门禁时返回）。

## 1.4 异步导入任务（高频）

| Method | Path | Consumer | 说明 |
|---|---|---|---|
| POST | `/import/tasks/:dataset` | `user-app` | 创建导入任务（推荐） |
| POST | `/import/tasks` | `user-app` | 创建导入任务（兼容） |
| GET | `/import/tasks` | `user-app` | 导入任务列表 |
| GET | `/import/tasks/:task_id` | `user-app` | 任务详情（推荐） |
| GET | `/import/tasks/:id` | `user-app` | 任务详情（兼容） |
| POST | `/import/tasks/:task_id/cancel` | `user-app` | 取消任务（推荐） |
| POST | `/import/tasks/:id/cancel` | `user-app` | 取消任务（兼容） |
| POST | `/import/tasks/:dataset/upload` | `user-app` | 上传导入文件（推荐） |
| POST | `/import/tasks/upload` | `user-app` | 上传导入文件（兼容） |

## 1.5 质量策略（导入前可查询）

| Method | Path | Consumer | 说明 |
|---|---|---|---|
| GET | `/quality/policies/effective` | `user-app` | 获取当前组织“生效中的导入质量策略” |
| GET | `/quality/policies/organization` | `user-app` | 获取当前组织“组织层质量基线策略” |
| PUT | `/quality/policies/organization` | `user-app` | 更新组织层质量基线策略（组织管理员） |
| GET | `/quality/policies/organization/audits` | `user-app` | 查询组织层质量策略变更审计（组织管理员） |

---

## 2. 异步导入任务（建议优先接）

## 2.1 创建任务 `POST /import/tasks/:dataset`

`dataset` 当前仅支持：`humaneval`、`mbpp`

请求体：

```json
{
  "dataset": "humaneval",
  "data": "base64-encoded-json",
  "file_id": "import/humaneval/20260228/uuid",
  "limit": 100,
  "visibility": "private",
  "needs_approval": true
}
```

约束：

- `data` 与 `file_id` 二选一，至少一个必填
- `file_id` 必须以 `import/` 开头，且不能含 `..` 或 `\`
- 使用 `file_id` 要求后端已配置 MinIO
- 依赖 Kafka 队列；不可用时返回 `503`

成功响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "task_id": "uuid",
    "status": "pending"
  }
}
```

## 2.2 上传文件 `POST /import/tasks/:dataset/upload`

`multipart/form-data`:

- `file`: `.json` 或 `.jsonl`
- 大小上限：500MB

成功响应：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "file_id": "import/humaneval/20260228/uuid",
    "size": 12345
  }
}
```

## 2.3 查询任务 `GET /import/tasks/:task_id`

```json
{
  "id": "uuid",
  "status": "pending",
  "total": 0,
  "imported": 0,
  "failed": 0,
  "error_msg": "",
  "created_at": "2026-02-28T10:00:00Z"
}
```

终态：`completed` / `failed` / `cancelled`

## 2.4 任务列表 `GET /import/tasks`

Query：

- `page`（默认 1）
- `page_size`（默认 20，最大 1000）
- `status`（可选）
- `dataset`（可选，当前校验 `humaneval|mbpp`）

返回：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "tasks": [],
    "total": 10
  }
}
```

---

## 3. 其他导入接口常用请求结构

## 3.1 Benchmark URL 导入

`POST /import/benchmarks/url`

```json
{
  "url": "https://example.com/benchmark.json"
}
```

## 3.2 HumanEval/SWE-bench 从 HuggingFace 导入

```json
{
  "dataset_name": "openai/openai_humaneval",
  "split": "test",
  "limit": 100,
  "visibility": "private",
  "needs_approval": true,
  "quality_mode": "balanced",
  "quality_dimensions": ["executability", "stability"],
  "organization_id": "org-xxx"
}
```

说明：`organization_id` 仅管理员可跨组织指定；普通用户建议不传。

## 3.3 CodeComplete 导入（URL 示例）

`POST /import/codecomplete/url/:dataset`

```json
{
  "url": "https://example.com/data.jsonl",
  "limit": 100,
  "visibility": "private",
  "needs_approval": true,
  "quality_mode": "strict",
  "quality_dimensions": ["stability", "compliance"],
  "organization_id": "org-xxx"
}
```

说明：`needs_approval` 未传时默认 `true`；`organization_id` 权限规则同上。

## 3.4 JSON 导入 `data` 字段契约（P2-1）

后端已升级为“新旧双协议兼容”：
- 推荐：`data` 直接传 **原生 JSON 数组**；
- 兼容：`data` 继续传 **base64 字符串**（旧客户端）。

推荐写法（新协议）：

```json
{
  "data": [
    { "task_id": "HumanEval/0", "prompt": "...", "test": "..." }
  ],
  "visibility": "private",
  "needs_approval": true
}
```

兼容写法（旧协议）：

```json
{
  "data": "W3sidGFza19pZCI6ICJIdW1hbkV2YWwvMCIsICJwcm9tcHQiOiAiLi4uIn1d",
  "visibility": "private"
}
```

URL 安全策略（所有 URL 导入接口统一）：
- 仅允许 `http/https`；
- 拒绝 `localhost`、`127.0.0.1`、`10.x`、`192.168.x.x` 等私网/回环地址；
- 域名白名单：`github.com`、`raw.githubusercontent.com`、`gist.githubusercontent.com`、`huggingface.co`、`cdn-lfs.huggingface.co`。

## 3.5 质量策略参数（新增）

所有 HumanEval/SWE/CodeComplete 导入接口支持：

- `quality_mode`: `strict | balanced | lenient`
- `quality_dimensions`: string[]，可选维度列表  
  可选值：`schema`、`semantic`、`executability`、`stability`、`security`、`compliance`

后端策略说明（前端必须知晓）：

1. 生效策略按三层合并：`system default -> organization policy -> request`。  
2. 请求层是“只增不减”：只能加严，不能放松组织策略。  
3. `strict`：请求层加严为“可选维度全开 + block_on_high=true”。  
4. `balanced`：请求层不做降级；可配合 `quality_dimensions` 打开额外可选维度。  
5. `lenient`：请求层不允许放松系统/组织策略，按 `balanced` 处理。  
6. 强制维度 `schema/semantic/security` 永远启用，`quality_dimensions` 不能关闭它们。  
7. 文件上传接口若使用 `multipart/form-data`，`quality_dimensions` 传逗号分隔字符串即可，例如：  
   `quality_dimensions=executability,stability`

### 3.6 查询当前生效质量策略 `GET /quality/policies/effective`

可选 query（用于“带入本次请求参数后预览”）：
- `quality_mode`
- `quality_dimensions`（支持重复 query 或逗号分隔）

示例：

`GET /api/v1/quality/policies/effective?quality_mode=strict&quality_dimensions=stability,compliance`

返回（示例）：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "effective": {
      "name": "request-tightened",
      "block_on_high": true,
      "enabled_dimensions": {
        "schema": true,
        "semantic": true,
        "executability": true,
        "stability": true,
        "security": true,
        "compliance": true
      }
    },
    "system_default": {
      "name": "system-default",
      "block_on_high": true,
      "enabled_dimensions": {
        "schema": true,
        "semantic": true,
        "executability": true,
        "stability": true,
        "security": true,
        "compliance": true
      }
    },
    "organization": null,
    "request": {
      "name": "request-tightened",
      "block_on_high": true,
      "enabled_dimensions": {
        "schema": true,
        "semantic": true,
        "executability": true,
        "stability": true,
        "security": true,
        "compliance": true
      }
    }
  }
}
```

### 3.7 组织层质量基线策略 `PUT /quality/policies/organization`（组织管理员）

请求体示例：

```json
{
  "enable_executability": false,
  "enable_stability": true,
  "enable_compliance": false,
  "block_on_high": false
}
```

说明：
- 这一步是“组织默认值”配置，不是一次性导入参数；
- 影响该组织后续导入请求的基线策略；
- 强制维度 `schema/semantic/security` 不能关闭。

### 3.8 组织策略审计查询 `GET /quality/policies/organization/audits`

建议前端在“组织设置-质量策略”页提供审计记录抽屉，便于排查为什么导入策略变化。

支持过滤参数：
- `actor_user_id`
- `action`
- `created_from` / `created_to`（RFC3339）
- `page` / `page_size`
- `view=summary|full`（建议列表页使用 `summary`）

---

## 4. 常见错误码/状态

| code | 场景 |
|---|---|
| `400` | dataset 不支持、缺少 data/file_id、文件格式不合法、参数错误 |
| `2103` | URL scheme 非法（仅允许 http/https） |
| `2104` | URL 不在白名单或命中私网/回环地址（SSRF 拦截） |
| `2105` | URL 格式非法 |
| `409001` | Benchmark 导入同名冲突（默认仅新增，不允许隐式覆盖已有 benchmark） |
| `429004` | 导入频率超限（按 org+user+dataset+source 限流） |
| `422` | 质量门禁拒绝（逐条体现在 `items[].error`；导入接口整体仍返回 200，便于前端展示部分成功） |
| `503001` | 导入限流器后端不可用（`import_rate_limit_fail_open=false` 时触发） |
| `403` | 组织范围违规（普通用户跨组织）、目标组织非激活 |
| `404` | task 不存在 |
| `404` | 管理员跨组织导入时 `organization_id` 不存在 |
| `500` | 创建任务/上传/查询内部错误 |
| `503` | Kafka 队列不可用，任务无法入队 |

---

## 5. 前端对接建议

1. 统一封装“创建任务 + 轮询状态 + 错误提示”。
2. 上传成功后将 `file_id` 回填到创建任务请求。
3. 收到 `503` 时提示“系统繁忙，稍后重试”。
4. 列表页兼容非标准分页字段（`tasks` 而非 `items`）。


## 前端最小对接流程

1. 优先走异步任务链路：先上传文件 `POST /import/tasks/:dataset/upload`。
2. 用返回 `file_id` 调 `POST /import/tasks/:dataset` 创建任务。
3. 列表页接 `GET /import/tasks`，详情轮询 `GET /import/tasks/:task_id`。
4. 对失败任务提供重试入口；对 pending 任务提供 `POST /cancel` 取消操作。


## 页面字段映射（接口 -> UI）

| 接口字段 | UI 字段/状态 | 说明 |
|---|---|---|
| `upload.data.file_id` | `importForm.fileId` | 创建异步任务时直接回填 |
| `create.data.task_id` | `importTask.currentTaskId` | 轮询状态与详情跳转主键 |
| `task.data.status` | `taskStatusTag` | pending/processing/completed 等状态展示 |
| `task.data.total/imported/failed` | `progressStats` | 进度条与成功/失败计数 |
| `list.data.tasks[]` | `importTaskTable.rows` | 任务列表数据源 |
| `list.data.total` | `importTaskPagination.total` | 列表总数（非标准分页结构） |


## 页面接口调用时序（建议）

1. 上传文件：`POST /import/tasks/:dataset/upload`。
2. 创建任务：`POST /import/tasks/:dataset`（携带 `file_id`）。
3. 轮询详情：`GET /import/tasks/:task_id` 直到终态。
4. 列表页回流：`GET /import/tasks`，支持取消 `POST /:task_id/cancel`。


## 前端联调检查清单

1. 请求头：导入接口统一带 `Authorization` + `X-Org-ID`。
兼容期：后端仍兼容旧头 `X-Organization-Id`，但前端应尽快统一为 `X-Org-ID`。
2. 必填参数：创建任务必须有 `dataset` 且 `data/file_id` 至少一个。
3. 组织字段：普通用户不要传跨组织 `organization_id`；管理员跨组织导入必须传真实存在的组织 ID。
4. 成功判定：上传成功要拿到 `file_id`，创建成功要拿到 `task_id`。
5. 失败分支：`503` 统一提示队列不可用并提供稍后重试；`400` 做表单校验提示；`403/404` 给出组织权限或组织不存在提示。
6. 回流刷新：任务终态后刷新任务列表，并保留失败详情便于重试。

## 通用错误处理与排错

- 错误码总览：`../00-overview/ERROR-CODES.md`
- 快速排错：`../00-overview/TROUBLESHOOTING.md`
- 请求层模板：`../00-overview/FRONTEND-INTEGRATION.md`

## 字段级契约（深度版）

### A. 创建异步导入任务 `POST /import/tasks/:dataset`（请求体）

| 字段 | 类型 | 必填 | 可空 | 默认值 | 枚举/约束 | 说明 |
|---|---|---|---|---|---|---|
| `dataset` | string | 否（path 推荐） | 否 | - | `humaneval/mbpp`（当前） | 兼容路径会从 body/query 读取 |
| `data` | array 或 string | 条件必填 | 是 | - | 原生 JSON 数组（推荐）或 base64（兼容） | `data/file_id` 二选一 |
| `file_id` | string | 条件必填 | 是 | - | 以 `import/` 开头，禁止 `..` 与 `\\` | 已上传文件标识 |
| `limit` | int | 否 | 是 | 后端默认 | >0 | 导入条数上限 |
| `visibility` | string | 否 | 是 | `private` | `private/organization/public` | 资源可见性 |
| `needs_approval` | bool | 否 | 是 | true | - | 是否需审批 |
| `quality_mode` | string | 否 | 是 | `balanced` | `strict/balanced/lenient` | 质量策略请求层参数 |
| `quality_dimensions` | string[] | 否 | 是 | 空 | 见维度枚举 | 额外启用维度（只增不减） |
| `organization_id` | string | 否 | 是 | 当前 `X-Org-ID` | 普通用户不可跨组织 | 管理员跨组织导入入口 |

维度枚举：`schema`、`semantic`、`executability`、`stability`、`security`、`compliance`

### B. 上传文件 `POST /import/tasks/:dataset/upload`（multipart）

| 字段 | 类型 | 必填 | 约束 | 说明 |
|---|---|---|---|---|
| `file` | file | 是 | `.json/.jsonl`，<=500MB | 源数据文件 |
| `dataset` | string | 否（path 推荐） | 同任务接口 | 兼容路径可从 query/form 读取 |
| `quality_mode` | string | 否 | `strict/balanced/lenient` | 可选 |
| `quality_dimensions` | string | 否 | 逗号分隔字符串 | 如 `executability,stability` |

响应字段：

| 字段 | 类型 | 必有 | 说明 |
|---|---|---|---|
| `data.file_id` | string | 是 | 创建任务时回填 |
| `data.size` | int | 是 | 文件大小（字节） |

### C. URL 导入通用字段（`/import/*/url*`）

| 字段 | 类型 | 必填 | 可空 | 默认值 | 约束 |
|---|---|---|---|---|---|
| `url` | string | 是 | 否 | - | 仅 `http/https`；通过 SSRF 白名单校验 |
| `limit` | int | 否 | 是 | 后端默认 | >0 |
| `visibility` | string | 否 | 是 | `private` | `private/organization/public` |
| `needs_approval` | bool | 否 | 是 | true | - |
| `organization_id` | string | 否 | 是 | 当前 `X-Org-ID` | 管理员可跨组织 |

## 状态机与终态语义（深度版）

### A. 异步导入任务状态机

`pending -> processing -> completed|failed|cancelled`

前端行为建议：
1. `pending/processing`：展示进度与“取消任务”按钮。
2. `completed`：展示 `imported/failed/skipped/quality_summary`。
3. `failed`：展示 `error_msg` 并提供“重试（新建任务）”入口。
4. `cancelled`：标记终态，不再轮询。

### B. 导入质量摘要语义

`quality_summary` 用于解释质量门禁效果：
- `checked`：检查条目数
- `passed`：通过数
- `denied`：被门禁拒绝数
- `warnings`：警告数

前端不应把“整体接口成功 + denied>0”误判为系统错误，这通常代表“部分导入成功”。

## 页面级验收清单（新增）

1. `data` 同时兼容原生数组与 base64；新页面默认发原生数组。  
2. 上传 -> 创建任务 -> 轮询详情链路可闭环，且任务终态会停止轮询。  
3. `429004` 能展示 `reset_at` 并给出“稍后重试”的倒计时提示。  
4. 普通用户传跨组织 `organization_id` 时，页面应正确提示权限错误。  
5. `quality_summary` 在结果页可视化展示，避免用户误解“部分失败”。  
6. URL 导入命中 `2103/2104/2105` 时，表单有针对性错误文案。  

## 文档可信来源

- `internal/api/router/router.go`
- `internal/api/handler/import_task_handler.go`
- `internal/api/handler/benchmark_import_handler.go`
- `internal/api/handler/humaneval_import_handler.go`
- `internal/api/handler/swebench_import_handler.go`
- `internal/api/handler/codecomplete_import_handler.go`

更新时间：2026-03-05


