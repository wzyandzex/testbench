# 批量执行 API（前端对接）

Base URL: `/api/v1`  
Consumer：`user-app`

## 1. 接口总览

| Method | Path | Consumer | 说明 |
|---|---|---|---|
| POST | `/batch-executions` | `user-app` | 创建批量任务 |
| GET | `/batch-executions` | `user-app` | 批量任务列表 |
| GET | `/batch-executions/:id` | `user-app` | 批量任务详情 |
| POST | `/batch-executions/:id/cancel` | `user-app` | 取消批量任务 |
| GET | `/batch-executions/:id/tasks` | `user-app` | 子任务列表 |
| GET | `/batch-executions/:id/report` | `user-app` | 批量报告 |

鉴权要求：需要 `Authorization`，必须带 `X-Org-ID`。

作用域说明（重要）：

- 后端按 `organization_id` 做批量任务隔离。
- 跨组织访问详情/子任务/报告/取消会返回 `404001` 或 `404002`（防资源枚举）。

---

## 2. 创建批量任务 `POST /batch-executions`

请求体：

```json
{
  "name": "nightly-regression",
  "description": "night run",
  "agent_ids": ["agent-1", "agent-2"],
  "benchmark_ids": ["bm-1", "bm-2"],
  "task_config": {
    "max_steps": 100,
    "timeout": 120000000000,
    "priority": "p2"
  },
  "agent_config": {
    "temperature": 0.7,
    "max_tokens": 4000
  },
  "options": {
    "parallel": true,
    "max_parallel": 10,
    "stop_on_first_failure": false,
    "generate_report": true
  }
}
```

关键约束：

- `agent_ids`、`benchmark_ids` 必填且至少 1 个
- 单侧最多 100 个
- 组合任务数上限 10000（`len(agent_ids)*len(benchmark_ids)`）
- `task_config.priority` 可选：`p0|p1|p2|p3|p4`
- `options.max_parallel` 会被后端收敛到 `1~50`

成功返回 `CreateBatchResponse`（`created_at` 是 Unix 秒级时间戳）。

---

## 3. 列表与详情

## 3.1 列表 `GET /batch-executions`

Query：

- `status`
- `page`（默认 1）
- `page_size`（默认 20）

返回：`data = { data: BatchSummary[], total, page, size }`

## 3.2 详情 `GET /batch-executions/:id`

返回：

- `batch_execution`（完整批量实体）
- `progress_percentage`

---

## 4. 子任务列表 `GET /batch-executions/:id/tasks`

Query：

- `agent_id`
- `benchmark_id`
- `status`（可重复）
- `page`、`page_size`
- `order_by`（默认 `created_at`）
- `order_dir`（默认 `desc`）

返回：`data = { data: BatchTaskProgress[], total, page, size }`

---

## 5. 取消任务 `POST /batch-executions/:id/cancel`

常见错误：

- `404002`：批量任务不存在
- `400004`：任务已完成，不能取消

---

## 6. 报告 `GET /batch-executions/:id/report`

返回 `BatchReport` 内容。

- 若不存在，可能返回 `404003`
- 服务端也可能在查询时尝试延迟生成报告

---

## 7. 常见错误码

- `400001`：请求参数非法
- `404001/404002/404003`：批量任务或报告不存在（含越权隐藏）
- `409001`：批量名称重复
- `500001~500006`：创建/查询/取消/报告内部错误

---

## 8. 前端建议

1. 创建前先展示“预计任务数=Agent数×Benchmark数”。
2. 详情页拆分展示：总体进度 + 子任务表格。
3. 报告按钮可做“延迟可用”提示，避免用户以为立即生成。


## 前端最小对接流程

1. 先接 `POST /batch-executions` 创建批量任务，表单支持多 benchmark/agent 选择。
2. 列表页接 `GET /batch-executions`，详情页接 `GET /batch-executions/:id`。
3. 子任务页接 `GET /batch-executions/:id/tasks`，提供进度与失败原因展示。
4. 报告页接 `GET /batch-executions/:id/report`，并补 `POST /batch-executions/:id/cancel`。


## 页面字段映射（接口 -> UI）

| 接口字段 | UI 字段/状态 | 说明 |
|---|---|---|
| `create.data.id` | `batchStore.currentBatchId` | 创建后跳转详情页 |
| `list.data.data[]` | `batchTable.rows` | 批量任务列表数据源 |
| `list.data.total/page/size` | `pagination` | 统一分页控制 |
| `detail.data.batch_execution` | `batchDetail.base` | 详情页基础信息区 |
| `detail.data.progress_percentage` | `batchDetail.progress` | 进度条展示 |
| `tasks.data.*` | `taskSubTable` | 子任务列表与失败明细 |


## 页面接口调用时序（建议）

1. 批量创建：`POST /batch-executions`。
2. 列表与详情：`GET /batch-executions`、`GET /batch-executions/:id`。
3. 子任务面板：`GET /batch-executions/:id/tasks`。
4. 报告页：`GET /batch-executions/:id/report`，取消时走 `POST /:id/cancel`。


## 前端联调检查清单

1. 请求头：批量接口统一带 `Authorization` + `X-Org-ID`。
2. 必填参数：创建时 `agent_ids`、`benchmark_ids` 不能为空。
3. 成功判定：创建返回后校验批量 ID，再进入详情页加载进度。
4. 失败分支：组合数超限等 `400` 错误应在表单层给出明确约束提示。
5. 回流刷新：取消或配置变更后刷新列表、详情与子任务列表。

## 通用错误处理与排错

- 错误码总览：`../00-overview/ERROR-CODES.md`
- 快速排错：`../00-overview/TROUBLESHOOTING.md`
- 请求层模板：`../00-overview/FRONTEND-INTEGRATION.md`

## 字段级契约（深度版）

### A. 创建批量任务 `POST /batch-executions`（请求体）

| 字段 | 类型 | 必填 | 可空 | 默认值 | 枚举/约束 | 说明 |
|---|---|---|---|---|---|---|
| `name` | string | 是（建议） | 是 | 后端可默认 | <=255（建议） | 批量任务名 |
| `description` | string | 否 | 是 | 空 | <=2000（建议） | 描述 |
| `agent_ids` | string[] | 是 | 否 | - | 至少 1，最多 100 | 参与 agent |
| `benchmark_ids` | string[] | 是 | 否 | - | 至少 1，最多 100 | 参与 benchmark |
| `task_config.max_steps` | int | 否 | 是 | 后端默认 | >0 | 单任务最大步数 |
| `task_config.timeout` | int | 否 | 是 | 后端默认 | >0 | 超时配置（单位依实现） |
| `task_config.priority` | string | 否 | 是 | `p2` | `p0/p1/p2/p3/p4` | 优先级 |
| `agent_config` | object | 否 | 是 | `{}` | - | Agent 通用参数 |
| `options.parallel` | bool | 否 | 是 | true | - | 是否并行 |
| `options.max_parallel` | int | 否 | 是 | 后端默认 | 后端收敛到 1~50 | 并行度 |
| `options.stop_on_first_failure` | bool | 否 | 是 | false | - | 首错即停 |
| `options.generate_report` | bool | 否 | 是 | true | - | 是否生成报告 |

硬约束（前端需提前提示）：
1. 组合任务数上限：`len(agent_ids) * len(benchmark_ids) <= 10000`。
2. 任一数组为空或超限会返回 `400001`。

### B. 列表 `GET /batch-executions`（query）

| 参数 | 类型 | 必填 | 默认值 | 约束 | 说明 |
|---|---|---|---|---|---|
| `status` | string | 否 | 空 | - | 按批量状态过滤 |
| `page` | int | 否 | 1 | >=1 | 页码 |
| `page_size` | int | 否 | 20 | 建议 <=100 | 每页条数 |

### C. 子任务列表 `GET /batch-executions/:id/tasks`（query）

| 参数 | 类型 | 必填 | 默认值 | 约束 | 说明 |
|---|---|---|---|---|---|
| `agent_id` | string | 否 | 空 | - | 按 agent 过滤 |
| `benchmark_id` | string | 否 | 空 | - | 按 benchmark 过滤 |
| `status` | string[] | 否 | 空 | 可重复传参 | 子任务状态过滤 |
| `page` | int | 否 | 1 | >=1 | 页码 |
| `page_size` | int | 否 | 20 | 建议 <=100 | 每页条数 |
| `order_by` | string | 否 | `created_at` | 后端支持字段 | 排序字段 |
| `order_dir` | string | 否 | `desc` | `asc/desc` | 排序方向 |

### D. 详情/报告响应核心字段

详情（`GET /batch-executions/:id`）：

| 字段 | 类型 | 必有 | 说明 |
|---|---|---|---|
| `data.batch_execution` | object | 是 | 批量主实体 |
| `data.progress_percentage` | number | 是 | 进度百分比 |

报告（`GET /batch-executions/:id/report`）：

| 字段 | 类型 | 必有 | 说明 |
|---|---|---|---|
| `summary` | object | 常见 | 汇总统计 |
| `items` | array | 常见 | 子任务明细 |
| `generated_at` | string | 常见 | 报告生成时间 |

## 状态机与终态语义（深度版）

### A. 批量任务状态机

`pending -> running -> completed|failed|cancelled`

前端行为建议：
1. `pending/running`：轮询详情与子任务列表，展示总体进度。
2. `completed/failed/cancelled`：终态停止高频轮询，保留手动刷新。
3. `failed` 不代表全部失败，需结合子任务明细展示部分成功。

### B. 报告可用状态

`not_ready -> generating -> ready`

前端建议：
1. `GET /report` 返回不存在时（如 `404003`）展示“报告生成中/稍后可用”。
2. 提供手动重试查询按钮，避免用户误判为系统故障。

## 页面级验收清单（新增）

1. 创建前会展示“预计任务数”，且超过上限时前端阻止提交。  
2. 创建成功后可跳转详情页并持续看到进度变化。  
3. 子任务筛选（agent/benchmark/status）可正确生效并支持分页。  
4. 批量取消成功后，列表与详情状态同步更新。  
5. 报告未就绪场景文案明确（不是“404 页面”）。  
6. 跨组织访问任意批量资源统一提示“资源不存在或无访问权限”。  

## 文档可信来源

- `internal/api/router/router.go`
- `internal/api/handler/batch_handler.go`
- `internal/domain/batch/types.go`
- `internal/domain/batch/batch_execution.go`
- `internal/application/batch/service.go`

更新时间：2026-03-05

