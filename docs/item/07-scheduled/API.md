# 定时任务 API（前端对接）

Base URL: `/api/v1`  
Consumer：`user-app`

## 1. 接口总览

| Method | Path | Consumer | 说明 |
|---|---|---|---|
| POST | `/scheduled-tasks` | `user-app` | 创建任务 |
| GET | `/scheduled-tasks` | `user-app` | 列表 |
| GET | `/scheduled-tasks/:id` | `user-app` | 详情 |
| PUT | `/scheduled-tasks/:id` | `user-app` | 更新 |
| DELETE | `/scheduled-tasks/:id` | `user-app` | 删除 |
| PATCH | `/scheduled-tasks/:id/status` | `user-app` | 启停 |
| POST | `/scheduled-tasks/:id/trigger` | `user-app` | 手动触发 |
| GET | `/scheduled-tasks/:id/runs` | `user-app` | 运行历史 |

鉴权要求：需要 `Authorization`，必须带 `X-Org-ID`。

作用域说明（重要）：

- 若在组织上下文中，任务访问按组织成员权限校验。
- 对非本组织任务，接口返回 `404001`（隐藏资源存在性）。

---

## 2. 创建任务 `POST /scheduled-tasks`

请求体：

```json
{
  "name": "daily-check",
  "description": "daily benchmark",
  "schedule": {
    "type": "cron",
    "expression": "0 0 */6 * * *"
  },
  "execution_config": {
    "agent_ids": ["agent-1"],
    "benchmark_ids": ["bm-1"],
    "task_config": {
      "max_steps": 100,
      "timeout": 60000000000,
      "priority": "p2"
    },
    "agent_config": {
      "temperature": 0.7,
      "max_tokens": 4000
    }
  },
  "retry": {
    "enabled": true,
    "max_attempts": 3,
    "backoff_strategy": "exponential",
    "initial_backoff": 1000000000,
    "max_backoff": 60000000000
  },
  "notification": {
    "enabled": false,
    "channels": ["email"],
    "on_events": ["failed"]
  },
  "enabled": true
}
```

关键校验：

- `schedule.type`：`cron|interval|once`
- `cron` 表达式会做解析校验
- `execution_config.agent_ids` 至少 1，最多 50
- `execution_config.benchmark_ids` 至少 1，最多 100
- `task_config.priority`：`p0|p1|p2|p3` 或空
- `retry` 启用时才校验重试参数

成功返回 HTTP `201`，`code=0`。

---

## 3. 列表过滤行为（重要）

`GET /scheduled-tasks`

Query：

- `page`（默认 1）
- `page_size`（默认 20，最大 100）
- `enabled`（可选）
- `status`（可选）

后端过滤规则：

- 若没有组织上下文，默认只看“当前用户创建的任务”
- 若存在 `org_id` 上下文，则按组织维度查询（不再限制创建者）

---

## 4. 更新与启停

## 4.1 更新 `PUT /scheduled-tasks/:id`

请求体是局部更新（字段都可选）：

```json
{
  "name": "new name",
  "schedule": { "type": "cron", "expression": "0 0 */12 * * *" }
}
```

若所有字段都没传，返回 `400010`（空更新请求）。

## 4.2 启停 `PATCH /scheduled-tasks/:id/status`

```json
{
  "enabled": false
}
```

---

## 5. 手动触发与运行历史

## 5.1 手动触发 `POST /scheduled-tasks/:id/trigger`

返回一个 `TaskRunResponse` 占位对象，状态通常是 `pending`，真实执行记录由后台异步创建。

## 5.2 运行历史 `GET /scheduled-tasks/:id/runs`

Query：`page`、`page_size`（最大 100）

返回：`{ total, page, size, items }`

---

## 6. 常见错误码（模块专用）

- `400001`：无效请求体
- `400002`：缺少任务 ID
- `400010`：空更新请求
- `401001`：未认证
- `403001`：无访问权限
- `403002`：不是组织成员
- `404001`：任务不存在
- `500001~500007`：创建/列表/更新/触发/历史查询失败

---

## 7. 前端建议

1. 创建表单提供 cron 校验提示，减少后端报错往返。
2. 详情页显示“是否启用 + 任务状态 + 下次运行时间”。
3. 手动触发后跳转到 runs 列表并自动刷新最近记录。


## 前端最小对接流程

1. 先做任务列表 `GET /scheduled-tasks` 与创建 `POST /scheduled-tasks`。
2. 详情页接 `GET /scheduled-tasks/:id`，编辑用 `PUT /scheduled-tasks/:id`。
3. 状态切换接 `PATCH /scheduled-tasks/:id/status`，并支持手动触发 `POST /:id/trigger`。
4. 运行历史页接 `GET /scheduled-tasks/:id/runs`，用于排查失败任务。


## 页面字段映射（接口 -> UI）

| 接口字段 | UI 字段/状态 | 说明 |
|---|---|---|
| `task.id` | `scheduleTable.rowKey` | 编辑、删除、触发操作主键 |
| `task.name/description` | `scheduleForm.basic` | 创建与编辑表单基本信息 |
| `task.schedule.expression` | `cronInput.value` | Cron 表达式组件值 |
| `task.enabled/status` | `statusSwitch/statusTag` | 启停开关与状态展示 |
| `runs.data[]` | `runHistoryTable.rows` | 运行历史页表格数据 |
| `runs.data.total/page/size` | `runHistoryPagination` | 历史列表分页 |


## 页面接口调用时序（建议）

1. 列表页首屏：`GET /scheduled-tasks`。
2. 创建/编辑：`POST /scheduled-tasks`、`PUT /scheduled-tasks/:id`。
3. 启停/触发：`PATCH /scheduled-tasks/:id/status`、`POST /scheduled-tasks/:id/trigger`。
4. 运行历史页：`GET /scheduled-tasks/:id/runs`。


## 前端联调检查清单

1. 请求头：定时任务接口统一携带 `Authorization` + `X-Org-ID`。
2. 必填参数：创建时 `name`、`schedule`、`execution_config` 必须有效。
3. 成功判定：创建应返回 HTTP 201 且 `code===0`，前端需兼容 201 状态。
4. 失败分支：cron 不合法、配额超限等错误在表单区就近提示。
5. 回流刷新：启停、触发、删除后刷新列表，并按需刷新运行历史。

## 通用错误处理与排错

- 错误码总览：`../00-overview/ERROR-CODES.md`
- 快速排错：`../00-overview/TROUBLESHOOTING.md`
- 请求层模板：`../00-overview/FRONTEND-INTEGRATION.md`

## 字段级契约（深度版）

### A. 创建任务 `POST /scheduled-tasks`（请求体）

| 字段 | 类型 | 必填 | 可空 | 默认值 | 枚举/约束 | 说明 |
|---|---|---|---|---|---|---|
| `name` | string | 是 | 否 | - | 非空，建议 <=255 | 任务名 |
| `description` | string | 否 | 是 | 空 | <=2000（建议） | 描述 |
| `schedule.type` | string | 是 | 否 | - | `cron/interval/once` | 调度类型 |
| `schedule.expression` | string | 条件必填 | 是 | - | cron/interval 必填 | 调度表达式 |
| `execution_config.agent_ids` | string[] | 是 | 否 | - | 1~50 | 执行 agent 集合 |
| `execution_config.benchmark_ids` | string[] | 是 | 否 | - | 1~100 | benchmark 集合 |
| `execution_config.task_config.priority` | string | 否 | 是 | `p2` | `p0/p1/p2/p3` | 优先级 |
| `execution_config.agent_config` | object | 否 | 是 | `{}` | - | Agent 参数 |
| `retry.enabled` | bool | 否 | 是 | false | - | 是否启用重试 |
| `retry.max_attempts` | int | 条件必填 | 是 | 后端默认 | >0 | 启用重试时生效 |
| `retry.backoff_strategy` | string | 条件必填 | 是 | - | `fixed/exponential`（常见） | 重试退避策略 |
| `notification.enabled` | bool | 否 | 是 | false | - | 通知开关 |
| `notification.channels` | string[] | 否 | 是 | 空数组 | 如 `email/webhook` | 通知渠道 |
| `enabled` | bool | 否 | 是 | true | - | 初始启用状态 |

### B. 列表 `GET /scheduled-tasks`（query）

| 参数 | 类型 | 必填 | 默认值 | 约束 | 说明 |
|---|---|---|---|---|---|
| `page` | int | 否 | 1 | >=1 | 页码 |
| `page_size` | int | 否 | 20 | <=100 | 每页条数 |
| `enabled` | bool | 否 | 空 | - | 启用状态过滤 |
| `status` | string | 否 | 空 | - | 运行状态过滤 |

### C. 更新与启停（请求体）

更新 `PUT /scheduled-tasks/:id`：

| 字段 | 类型 | 必填 | 可空 | 默认值 | 说明 |
|---|---|---|---|---|---|
| 全部创建字段 | mixed | 否 | 是 | 不变 | 局部更新，未传字段不变 |

注意：空请求会返回 `400010`。

启停 `PATCH /scheduled-tasks/:id/status`：

| 字段 | 类型 | 必填 | 可空 | 默认值 | 说明 |
|---|---|---|---|---|---|
| `enabled` | bool | 是 | 否 | - | true 启用，false 停用 |

### D. 运行历史 `GET /scheduled-tasks/:id/runs`

| 参数 | 类型 | 必填 | 默认值 | 约束 | 说明 |
|---|---|---|---|---|---|
| `page` | int | 否 | 1 | >=1 | 页码 |
| `page_size` | int | 否 | 20 | <=100 | 每页条数 |

返回结构：`{ total, page, size, items }`（注意字段名是 `items`）。

## 状态机与终态语义（深度版）

### A. 定时任务启用状态

`enabled=true|false` 与任务运行状态解耦：
1. `enabled=false`：不会按调度自动触发，但历史运行记录仍可查询。
2. `enabled=true`：按 schedule 正常触发。

### B. 手动触发流程状态

`idle -> triggering -> queued -> running -> completed|failed`

说明：
1. `POST /trigger` 成功通常先返回占位运行记录（pending/queued）。
2. 真正执行结果在 `runs` 中异步体现，前端应做短轮询。

## 页面级验收清单（新增）

1. 创建成功兼容 HTTP 201 + `code===0` 判定。  
2. Cron 非法时能在表单层明确提示，不落到通用错误弹窗。  
3. 空更新请求不会提交（或能正确处理 `400010`）。  
4. 启停后列表与详情状态一致回流。  
5. 手动触发后 runs 页可看到新增记录并自动刷新到终态。  
6. 跨组织访问任务统一提示“资源不存在或无访问权限”。  

## 文档可信来源

- `internal/api/router/router.go`
- `internal/api/handler/scheduled_task_handler.go`
- `internal/api/handler/schedule_errors.go`
- `internal/domain/schedule/types.go`
- `internal/domain/schedule/schedule_config.go`
- `internal/application/schedule/service.go`

更新时间：2026-03-05

