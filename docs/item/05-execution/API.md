# 执行记录 API（前端对接）

Base URL: `/api/v1`  
Consumer：`user-app`

## 1. 接口总览

| Method | Path | Consumer | 说明 |
|---|---|---|---|
| GET | `/executions` | `user-app` | 执行列表 |
| POST | `/executions` | `user-app` | 创建执行 |
| GET | `/executions/:id` | `user-app` | 执行详情 |
| DELETE | `/executions/:id` | `user-app` | 取消执行 |
| GET | `/executions/:id/trace` | `user-app` | 执行轨迹 |
| GET | `/executions/summary` | `user-app` | 执行摘要 |

鉴权要求：需要 `Authorization`，必须带 `X-Org-ID`。

作用域说明（重要）：

- 后端按 `organization_id` 做执行记录隔离。
- 跨组织访问详情/轨迹/取消会返回 `404001`（防资源枚举）。

---

## 2. 关键请求与响应

## 2.1 创建执行 `POST /executions`

```json
{
  "benchmark_id": "bm-1",
  "agent_id": "agent-1",
  "priority": "p2",
  "task_config": {},
  "agent_config": {},
  "sandbox_id": "sb-1",
  "sandbox_type": "docker",
  "max_steps": 100
}
```

说明：

- `benchmark_id`、`agent_id` 必填
- `priority` 为空时后端默认 `p2`
- `user_id`、`organization_id` 由后端从上下文注入
- 支持请求头幂等键：`Idempotency-Key`

---

## 2.2 列表 `GET /executions`

常用 query：

- `benchmark_id`
- `agent_id`
- `status`（可重复）
- `priority`（可重复）
- `success`
- `started_after`、`started_before`
- `page`、`page_size`

返回分页：`data.total/page/size/data`。

---

## 2.3 详情 `GET /executions/:id`

返回核心字段：

- `status`：`pending|running|completed|failed|timeout|cancelled`
- `success`
- `result` / `error`
- `started_at` / `completed_at` / `duration`
- token 与 step 统计字段

---

## 2.4 取消执行 `DELETE /executions/:id`

成功返回：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "execution cancelled successfully"
  }
}
```

若执行已完成/已取消，返回业务错误（如 `400002`）。

---

## 2.5 轨迹 `GET /executions/:id/trace`

返回轨迹数组，每项包含：

- `step_index`
- `step_type`
- `action`
- `input` / `output` / `error`
- `timestamp`

---

## 2.6 摘要 `GET /executions/summary`

支持按 `benchmark_id`、`agent_id` 过滤，返回：

- `total`
- `pending/running/completed/failed/timeout/cancelled`
- `success_rate`

---

## 3. 常见错误码

- `404001`：执行不存在（含跨组织越权隐藏）
- `400002`：幂等键非法，或执行已完成无法取消（不同接口语义）
- `500`：内部错误

---

## 4. 前端建议

1. 列表与摘要共用筛选状态，避免用户理解不一致。
2. 详情页对 `pending/running` 启动轮询，终态自动停止。
3. `trace` 可能较大，建议懒加载并支持折叠展示。


## 前端最小对接流程

1. 先接 `GET /executions` 列表，支持按状态和时间过滤。
2. 详情页接 `GET /executions/:id`，并补 `GET /executions/:id/trace` 展示执行轨迹。
3. 操作类先接 `POST /executions` 创建，再接 `DELETE /executions/:id` 取消。
4. 统计页补 `GET /executions/summary` 做全局概览。


## 页面字段映射（接口 -> UI）

| 接口字段 | UI 字段/状态 | 说明 |
|---|---|---|
| `data.data[].id` | `executionTable.rowKey` | 详情跳转与操作按钮主键 |
| `data.data[].status` | `statusTag` | 列表状态标签与筛选条件 |
| `detail.data.success` | `resultBadge` | 成功/失败视觉反馈 |
| `detail.data.started_at/completed_at` | `timeline.start/end` | 执行时长与时间轴展示 |
| `trace.data` | `tracePanel.steps` | 轨迹页日志与步骤渲染 |
| `summary.data.*` | `dashboardCards` | 执行概览指标卡 |


## 页面接口调用时序（建议）

1. 列表页加载：`GET /executions`。
2. 创建执行：`POST /executions` 后跳转详情。
3. 详情页拉取：`GET /executions/:id` + `GET /executions/:id/trace`。
4. 取消操作：`DELETE /executions/:id` 后刷新详情与列表状态。


## 前端联调检查清单

1. 请求头：执行域接口必须带 `Authorization` + `X-Org-ID`。
2. 必填参数：创建执行至少传 `benchmark_id` 与 `agent_id`。
3. 成功判定：创建成功后拿到 execution id，再进入详情页拉取状态。
4. 失败分支：取消失败要区分“已终态不可取消”和“系统错误”两类提示。
5. 回流刷新：取消或重试相关操作后刷新详情、trace 与列表三处状态。

## 通用错误处理与排错

- 错误码总览：`../00-overview/ERROR-CODES.md`
- 快速排错：`../00-overview/TROUBLESHOOTING.md`
- 请求层模板：`../00-overview/FRONTEND-INTEGRATION.md`

## 字段级契约（深度版）

### A. 创建执行 `POST /executions`（请求体）

| 字段 | 类型 | 必填 | 可空 | 默认值 | 枚举/约束 | 说明 |
|---|---|---|---|---|---|---|
| `benchmark_id` | string | 是 | 否 | - | 必须存在且可访问 | 目标 benchmark |
| `agent_id` | string | 是 | 否 | - | 必须存在且可访问 | 执行 agent |
| `priority` | string | 否 | 是 | `p2` | `p0/p1/p2/p3/p4` | 调度优先级 |
| `task_config` | object | 否 | 是 | `{}` | - | 任务配置 |
| `agent_config` | object | 否 | 是 | `{}` | - | Agent 参数 |
| `sandbox_id` | string | 否 | 是 | 空 | - | 指定沙箱实例 |
| `sandbox_type` | string | 否 | 是 | 空 | 如 `docker` | 沙箱类型 |
| `max_steps` | int | 否 | 是 | 后端默认 | >0 | 最大步骤数 |

请求头补充：

| Header | 必填 | 说明 |
|---|---|---|
| `Authorization` | 是 | Bearer token |
| `X-Org-ID` | 是 | 组织作用域 |
| `Idempotency-Key` | 否（建议） | 幂等防重，重复提交可复用结果 |

### B. 列表 `GET /executions`（query）

| 参数 | 类型 | 必填 | 默认值 | 约束 | 说明 |
|---|---|---|---|---|---|
| `benchmark_id` | string | 否 | 空 | - | 按 benchmark 过滤 |
| `agent_id` | string | 否 | 空 | - | 按 agent 过滤 |
| `status` | string[] | 否 | 空 | 可重复参数 | 执行状态过滤 |
| `priority` | string[] | 否 | 空 | 可重复参数 | 优先级过滤 |
| `success` | bool | 否 | 空 | - | 成功/失败过滤 |
| `started_after` | string | 否 | 空 | RFC3339 | 开始时间下界 |
| `started_before` | string | 否 | 空 | RFC3339 | 开始时间上界 |
| `page` | int | 否 | 1 | >=1 | 页码 |
| `page_size` | int | 否 | 20 | 建议 <=100 | 每页条数 |

### C. 详情 `GET /executions/:id`（响应核心）

| 字段 | 类型 | 必有 | 枚举/约束 | 说明 |
|---|---|---|---|---|
| `status` | string | 是 | `pending/running/completed/failed/timeout/cancelled` | 执行状态 |
| `success` | bool | 否 | 终态常见 | 是否成功 |
| `result` | object | 否 | completed 常见 | 执行结果 |
| `error` | string/object | 否 | failed 常见 | 错误信息 |
| `started_at` | string | 否 | RFC3339 | 开始时间 |
| `completed_at` | string | 否 | RFC3339 | 完成时间 |
| `duration` | int | 否 | ms/秒依实现 | 耗时 |

### D. 执行轨迹 `GET /executions/:id/trace`（响应项）

| 字段 | 类型 | 必有 | 说明 |
|---|---|---|---|
| `step_index` | int | 是 | 步骤序号 |
| `step_type` | string | 否 | 步骤类型 |
| `action` | string | 否 | 执行动作 |
| `input` | any | 否 | 输入快照 |
| `output` | any | 否 | 输出快照 |
| `error` | string | 否 | 该步错误 |
| `timestamp` | string | 否 | 时间戳 |

## 状态机与终态语义（深度版）

### A. 执行任务状态机

`pending -> running -> completed|failed|timeout|cancelled`

前端行为建议：
1. `pending/running`：详情页轮询，trace 采用懒加载并按需刷新。
2. `completed/failed/timeout/cancelled`：终态后停止轮询。
3. `cancelled` 与 `failed` 在视觉上区分，避免误导用户。

### B. 取消动作状态

`idle -> cancelling -> success|failed`

补充规则：
1. 已终态执行取消会返回业务错误（如 `400002`）。
2. 取消失败需保留详情页上下文，供用户重新判断状态。

## 页面级验收清单（新增）

1. 创建执行后能获取 execution id 并跳转详情。  
2. 详情页在运行态能持续刷新状态，终态自动停止。  
3. trace 面板可按步骤稳定渲染大数据量（可折叠）。  
4. 取消执行后列表、详情、摘要三处状态一致回流。  
5. 越权访问执行详情统一提示“资源不存在或无访问权限”。  
6. 幂等键重复提交不会生成多条重复执行（前端可观测到复用结果）。  

## 文档可信来源

- `internal/api/router/router.go`
- `internal/api/handler/execution_handler.go`
- `internal/application/execution/service.go`
- `internal/domain/execution/execution.go`

更新时间：2026-03-05

