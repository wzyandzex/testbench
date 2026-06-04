# SWE API（前端对接）

Base URL：`/api/v1`  
鉴权：全部需要 `Authorization: Bearer <token>`  
组织上下文：任务接口必须带 `X-Org-ID`  
Consumer：`user-app`（SWE 主流程）；系统管理员专属观测接口可按需要接入 `admin-app`

---

## 1. 接口总览

### 1.1 任务接口（用户可用，按 user+org 作用域）

| Method | Path | Consumer | 说明 |
|---|---|---|---|
| POST | `/swenbench/tasks` | `user-app` | 创建任务 |
| GET | `/swenbench/tasks` | `user-app` | 任务列表 |
| GET | `/swenbench/tasks/:id` | `user-app` | 任务详情 |
| POST | `/swenbench/tasks/:id/retry` | `user-app` | 重试 |
| POST | `/swenbench/tasks/:id/fix` | `user-app` | 智能修复 |
| GET | `/swenbench/tasks/:id/export` | `user-app` | 导出修复产物 |
| GET | `/swenbench/tasks/:id/test-options` | `user-app` | 测试选项 |
| POST | `/swenbench/tasks/:id/test-strategy` | `user-app` | 设置测试策略 |
| GET | `/swenbench/tasks/:id/ws` | `user-app` | 单任务 WebSocket |

### 1.2 系统管理员接口（建议 admin-app）

| Method | Path | Consumer | 说明 |
|---|---|---|---|
| GET | `/swenbench/ws` | `admin-app` | 全任务 WebSocket |
| GET | `/swenbench/ws/stats` | `admin-app` | WS 连接统计 |
| GET | `/swenbench/repo/cache` | `admin-app` | 仓库缓存列表 |
| DELETE | `/swenbench/repo/cache` | `admin-app` | 删除仓库缓存 |

非系统管理员访问上表接口返回：`403001`。

---

## 2. 关键请求示例

### 2.1 创建任务 `POST /swenbench/tasks`

```json
{
  "repo_url": "https://github.com/example/repo",
  "commit_hash": "abcdef",
  "base_branch": "main",
  "issue": {
    "number": 123,
    "title": "fix failing test",
    "body": "details",
    "url": "https://github.com/example/repo/issues/123",
    "labels": ["bug"]
  },
  "config": {
    "test_strategy": "smart",
    "enable_auto_fix": true,
    "max_fix_attempts": 1
  }
}
```

约束：

- `repo_url` 必填
- `issue.title`、`issue.body` 必填
- `config.test_strategy` 可选：`full|smart|skip`，默认 `smart`

成功响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "swe-xxxx",
    "status": "pending",
    "phase": "init",
    "message": "Task created successfully",
    "created_at": "2026-03-04T10:00:00Z"
  }
}
```

### 2.2 列表 `GET /swenbench/tasks`

Query：

- `page`、`page_size`
- `status`
- `repo_owner`
- `repo_name`

返回分页结构：`data.total/page/size/data`。

### 2.3 设置测试策略 `POST /swenbench/tasks/:id/test-strategy`

```json
{
  "strategy": "smart"
}
```

限制：

- 仅允许 `full|smart|skip`
- 任务进入 `testing/completed/failed` 后不可修改（返回 `400`）

---

## 3. 作用域与越权语义（重点）

后端对任务读写统一使用 `user_id + organization_id` 作用域。

- 同用户同组织：可访问。
- 跨用户或跨组织：`404 Task not found`（不暴露资源存在性）。
- 若调用链缺失用户上下文，仓储层采用 fail-close，不会放开为全局查询。

前端含义：

1. 任务 ID 不能跨账号/跨组织复用。
2. 遇到 404 时统一按“任务不存在或无权限”提示。

---

## 4. WebSocket 对接建议

### 4.1 单任务 WS（推荐）

- `GET /swenbench/tasks/:id/ws`
- 建连前会做任务作用域校验。

### 4.2 全局 WS（仅系统管理员）

- `GET /swenbench/ws`
- 适合运维大盘，不建议普通业务页依赖。

### 4.3 断线处理

1. 指数退避重连。
2. 同时保留 HTTP 轮询兜底（详情接口）。

---

## 5. Repo Cache 管理（仅系统管理员）

### 5.1 列表

`GET /swenbench/repo/cache?page=1&page_size=20`

### 5.2 删除

`DELETE /swenbench/repo/cache?repo_url=<url-encode>`

`repo_url` 必填且需 URL 编码。

---

## 6. 常见错误

| code | 场景 |
|---|---|
| `400` | 参数错误、策略非法、状态不允许修改 |
| `403001` | 调用了系统管理员接口但无权限 |
| `404` | 任务/缓存不存在或越权被隐藏 |
| `500` | 仓储未配置或内部错误 |

---

## 7. 前端最小对接流程

1. 先接 `POST /swenbench/tasks` + `GET /swenbench/tasks`。
2. 详情页接 `GET /swenbench/tasks/:id`。
3. 实时更新优先接 `GET /swenbench/tasks/:id/ws`，失败降级轮询。
4. 再补 retry/fix/test-strategy/export。
5. 管理后台再接 repo cache 与全局 WS（管理员可见）。

---

## 8. 页面字段映射（接口 -> UI）

| 页面 | UI 字段 | 接口字段 | 备注 |
|---|---|---|---|
| 任务列表 | 任务 ID | `data.data[].id` | 用于详情跳转 |
| 任务列表 | 状态 | `data.data[].status` | 终态建议颜色区分 |
| 任务详情 | 阶段 | `data.phase` | `init/testing/fixing/...` |
| 任务详情 | 日志流 | WS 事件消息体 | 断线后可回落到详情轮询 |
| 测试策略弹窗 | 策略值 | `strategy` | `full/smart/skip` |
| Repo Cache 管理 | 仓库地址 | `repo_url` | 删除时需 URL encode |

---

## 9. 页面接口调用时序（建议）

1. 列表页：
`GET /swenbench/tasks` -> 渲染列表 -> 点击行进入详情。
2. 详情页：
`GET /swenbench/tasks/:id` 首屏 -> 立即建 `GET /swenbench/tasks/:id/ws` 保持实时更新。
3. 操作流（retry/fix/test-strategy）：
执行 `POST` 后回源 `GET /swenbench/tasks/:id`；重要操作建议带 loading 锁，避免并发提交。
4. 管理端观测：
管理员页接 `GET /swenbench/ws/stats` + `GET /swenbench/repo/cache`；删除缓存后刷新列表。

---

## 10. 前端联调检查清单

1. 请求头：`Authorization` + `X-Org-ID`。
2. 创建任务后必须持久化 `task_id` 用于后续详情、WS、重试。
3. 对 `404` 使用统一文案“任务不存在或无访问权限”。
4. 对 `403001` 隐藏管理员专属入口并保留兜底提示。
5. WS 重连要有指数退避与最大重试间隔，避免服务抖动时形成重连风暴。
6. `POST /swenbench/tasks/:id/test-strategy` 在 `testing/completed/failed` 状态应前端禁用。

---

## 11. 通用错误处理与排错

1. `400`：优先展示字段级错误，避免统一“系统错误”提示。
2. `403001`：说明为管理员能力受限，提示后跳转回普通业务页。
3. `404`：统一提示“任务不存在或无访问权限”，不暴露越权细节。
4. `500`：建议保留当前上下文并提供“稍后重试”。
5. WS 断开时先提示“实时连接中断，已切换轮询”，避免用户误判任务失败。

---

## 12. 字段级契约（深度版）

### A. 创建任务 `POST /swenbench/tasks`（请求体）

| 字段 | 类型 | 必填 | 可空 | 默认值 | 枚举/约束 | 说明 |
|---|---|---|---|---|---|---|
| `repo_url` | string | 是 | 否 | - | 合法仓库 URL | 目标仓库 |
| `commit_hash` | string | 否 | 是 | 空 | 提交哈希 | 指定基线提交 |
| `base_branch` | string | 否 | 是 | 默认分支 | - | 基线分支 |
| `issue.number` | int | 否 | 是 | 空 | >0 | Issue 编号 |
| `issue.title` | string | 是 | 否 | - | 非空 | 问题标题 |
| `issue.body` | string | 是 | 否 | - | 非空 | 问题描述 |
| `issue.url` | string | 否 | 是 | 空 | URL | Issue 地址 |
| `issue.labels` | string[] | 否 | 是 | 空数组 | - | 标签 |
| `config.test_strategy` | string | 否 | 是 | `smart` | `full/smart/skip` | 测试策略 |
| `config.enable_auto_fix` | bool | 否 | 是 | false | - | 自动修复开关 |
| `config.max_fix_attempts` | int | 否 | 是 | 1 | >=0 | 最大修复次数 |

响应字段（成功）：

| 字段 | 类型 | 必有 | 说明 |
|---|---|---|---|
| `data.id` | string | 是 | task_id |
| `data.status` | string | 是 | 初始状态 |
| `data.phase` | string | 是 | 初始阶段 |
| `data.created_at` | string | 是 | RFC3339 时间 |

### B. 列表 `GET /swenbench/tasks`（query）

| 参数 | 类型 | 必填 | 默认值 | 约束 | 说明 |
|---|---|---|---|---|---|
| `page` | int | 否 | 1 | >=1 | 页码 |
| `page_size` | int | 否 | 20 | 建议 <=100 | 每页条数 |
| `status` | string | 否 | 空 | - | 按状态过滤 |
| `repo_owner` | string | 否 | 空 | - | 仓库 owner 过滤 |
| `repo_name` | string | 否 | 空 | - | 仓库名过滤 |

### C. 设置测试策略 `POST /swenbench/tasks/:id/test-strategy`

| 字段 | 类型 | 必填 | 可空 | 默认值 | 枚举/约束 | 说明 |
|---|---|---|---|---|---|---|
| `strategy` | string | 是 | 否 | - | `full/smart/skip` | 新策略值 |

业务约束：
1. 任务状态进入 `testing/completed/failed` 后不可修改策略。
2. 非任务作用域用户访问统一返回 `404`。

### D. Repo Cache 删除 `DELETE /swenbench/repo/cache`

| 参数 | 类型 | 必填 | 约束 | 说明 |
|---|---|---|---|---|
| `repo_url` | string | 是 | URL encode | 目标缓存仓库地址 |

## 13. 状态机与终态语义（深度版）

### A. SWE 任务状态机（页面语义）

`pending -> running/testing/fixing -> completed|failed|cancelled`

说明：
1. `running/testing/fixing` 视为进行中，前端显示动态进度与日志流。
2. `completed/failed/cancelled` 为终态，停止轮询与 WS 重试。

### B. WS 连接状态机（前端建议）

`connecting -> open -> reconnecting -> open | closed`

策略建议：
1. `reconnecting` 采用指数退避，最大间隔可配置。
2. 超过最大重试次数进入 `closed`，回退 HTTP 轮询并提示用户。

## 14. 页面级验收清单（新增）

1. 创建任务后必须拿到 `task_id` 并能跳转详情页。
2. 详情页在 WS 断开时可自动降级轮询，且用户可感知连接状态。
3. 测试策略接口仅在可编辑状态可点；禁用状态与后端规则一致。
4. 越权访问 task 返回 `404` 时统一提示“任务不存在或无访问权限”。
5. 管理端 Repo Cache 删除成功后能立即回流刷新列表。
6. 管理端非 admin 登录时不展示 `/swenbench/ws*` 与 `/repo/cache` 页面。

---

## 15. 可信来源

- `internal/api/router/router.go`
- `internal/api/handler/swenbench_handler.go`
- `internal/infrastructure/storage/mysql/swenbench_repository.go`

更新时间：2026-03-05

