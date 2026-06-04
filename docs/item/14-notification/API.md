# 通知历史 API（前端对接）

Base URL: `/api/v1`  
Consumer：`user-app`

## 1. 接口总览

| Method | Path | Consumer | 说明 |
|---|---|---|---|
| GET | `/history` | `user-app` | 历史记录查询 |
| GET | `/history/:id` | `user-app` | 单条详情 |
| GET | `/history/stats` | `user-app` | 统计信息 |
| GET | `/history/pending-count` | `user-app` | 待确认数量 |
| PUT | `/history/:id/acknowledge` | `user-app` | 确认 |
| PUT | `/history/:id/reject` | `user-app` | 拒绝 |
| POST | `/history/bulk-acknowledge` | `user-app` | 批量确认 |
| POST | `/history/export` | `user-app` | 导出（json/csv） |

鉴权要求：需要 `Authorization`，必须带 `X-Org-ID`。

作用域说明：

- 查询/详情/确认/拒绝/导出都按组织范围过滤。
- 跨组织访问单条记录会返回 `404`（隐藏资源存在性）。

---

## 2. 查询 `GET /history`

Query 参数：

- `event_types`（可重复）
- `priorities`（可重复）
- `statuses`（可重复）
- `channels`（可重复）
- `ack_statuses`（可重复）
- `task_id`
- `worker_id`
- `start_time`（RFC3339，例如 `2026-02-28T10:00:00Z`）
- `end_time`（RFC3339）
- `search`
- `page`（默认 1）
- `page_size`（默认 20，最大 1000）
- `sort_by`（常见：`timestamp|priority`）
- `sort_order`（`asc|desc`）

返回：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 100,
    "page": 1,
    "page_size": 20,
    "records": []
  }
}
```

---

## 3. 确认与拒绝

## 3.1 确认 `PUT /history/:id/acknowledge`

```json
{
  "comment": "handled"
}
```

## 3.2 拒绝 `PUT /history/:id/reject`

```json
{
  "comment": "not relevant"
}
```

`comment` 可选；操作人由后端从登录上下文自动识别。

---

## 4. 批量确认 `POST /history/bulk-acknowledge`

```json
{
  "ids": ["id-1", "id-2"],
  "comment": "batch ack"
}
```

返回：

- `success_count`
- `failed_ids`

---

## 5. 导出 `POST /history/export`

Query 使用与查询接口一致，额外参数：

- `format=json|csv`（默认 `json`）

行为：

- `csv`：返回 `text/csv`，附件下载
- `json`：返回 `application/json`，附件下载

注意：虽然是 `POST`，当前实现主要读取 query，不依赖 JSON body。

---

## 6. 统计接口

- `GET /history/stats`：返回按状态/渠道/优先级/事件类型/确认状态的统计
- `GET /history/pending-count`：返回 `{count}`

---

## 7. 常见错误

- `400`：缺少必填参数（如 `id`、`ids`）
- `404`：记录不存在
- `500`：查询或导出失败

---

## 8. 前端建议

1. 列表页默认筛选 `ack_statuses=pending` 展示待处理项。
2. 批量确认后，局部刷新当前页和 pending-count。
3. 导出按钮直接拼 query 触发下载，避免额外 JSON body 复杂度。


## 前端最小对接流程

1. 列表页先接 `GET /history`，默认筛选待处理项。
2. 详情页接 `GET /history/:id`，提供确认/拒绝操作按钮。
3. 操作接口接 `PUT /history/:id/acknowledge`、`PUT /history/:id/reject`。
4. 再补批量确认和导出，并联动 `GET /history/pending-count` 刷新角标。


## 页面字段映射（接口 -> UI）

| 接口字段 | UI 字段/状态 | 说明 |
|---|---|---|
| `list.data.records[]` | `historyTable.rows` | 通知历史列表数据源 |
| `list.data.total/page/page_size` | `historyPagination` | 列表分页状态 |
| `record.status/ack_status` | `statusTag/ackBadge` | 通知状态与确认状态标签 |
| `pending-count.data.count` | `headerBadge.count` | 顶部待处理角标 |
| `ack/reject 响应` | `rowActionFeedback` | 行内确认/拒绝操作回执 |
| `stats.data.*` | `statsCards/charts` | 统计面板指标渲染 |


## 页面接口调用时序（建议）

1. 列表首屏：`GET /history`，并行拉 `GET /history/pending-count`。
2. 点击详情：`GET /history/:id`。
3. 行内操作：`PUT /history/:id/acknowledge` 或 `PUT /history/:id/reject`。
4. 批量处理后刷新列表与 pending-count，导出时调用 `POST /history/export`。


## 前端联调检查清单

1. 请求头：通知历史接口统一带 `Authorization` + `X-Org-ID`。
2. 必填参数：确认/拒绝可不传 body；批量确认需 `ids`。
3. 成功判定：列表按 `records + total + page/page_size` 解析。
4. 失败分支：单条不存在时提示记录已失效，并从当前列表移除。
5. 回流刷新：确认/拒绝/批量确认后刷新列表与 pending-count。

## 通用错误处理与排错

- 错误码总览：`../00-overview/ERROR-CODES.md`
- 快速排错：`../00-overview/TROUBLESHOOTING.md`
- 请求层模板：`../00-overview/FRONTEND-INTEGRATION.md`

## 字段级契约（深度版）

### A. 历史查询 `GET /history`（query + 响应）

Query：

| 参数 | 类型 | 必填 | 默认值 | 约束 | 说明 |
|---|---|---|---|---|---|
| `event_types` | string[] | 否 | 空 | 可重复参数 | 事件类型过滤 |
| `priorities` | string[] | 否 | 空 | 可重复参数 | 优先级过滤 |
| `statuses` | string[] | 否 | 空 | 可重复参数 | 状态过滤 |
| `channels` | string[] | 否 | 空 | 可重复参数 | 渠道过滤 |
| `ack_statuses` | string[] | 否 | 空 | 可重复参数 | 确认状态过滤 |
| `task_id` | string | 否 | 空 | - | 关联任务过滤 |
| `worker_id` | string | 否 | 空 | - | 关联 worker |
| `start_time` | string | 否 | 空 | RFC3339 | 起始时间 |
| `end_time` | string | 否 | 空 | RFC3339 | 截止时间 |
| `search` | string | 否 | 空 | - | 关键字 |
| `page` | int | 否 | 1 | >=1 | 页码 |
| `page_size` | int | 否 | 20 | <=1000 | 每页条数 |
| `sort_by` | string | 否 | 后端默认 | 如 `timestamp/priority` | 排序字段 |
| `sort_order` | string | 否 | `desc` | `asc/desc` | 排序方向 |

响应核心：

| 字段 | 类型 | 必有 | 说明 |
|---|---|---|---|
| `data.total` | int | 是 | 总数 |
| `data.page` | int | 是 | 当前页 |
| `data.page_size` | int | 是 | 每页数量 |
| `data.records` | array | 是 | 记录列表 |

### B. 确认/拒绝 `PUT /history/:id/*`（请求体）

| 字段 | 类型 | 必填 | 可空 | 默认值 | 约束 | 说明 |
|---|---|---|---|---|---|---|
| `comment` | string | 否 | 是 | 空 | 建议 <=1000 | 备注 |

### C. 批量确认 `POST /history/bulk-acknowledge`

| 字段 | 类型 | 必填 | 可空 | 默认值 | 约束 | 说明 |
|---|---|---|---|---|---|---|
| `ids` | string[] | 是 | 否 | - | 至少 1 条 | 待确认 ID 集合 |
| `comment` | string | 否 | 是 | 空 | 建议 <=1000 | 备注 |

响应核心：

| 字段 | 类型 | 必有 | 说明 |
|---|---|---|---|
| `success_count` | int | 是 | 成功确认条数 |
| `failed_ids` | string[] | 否 | 失败 ID 集合 |

### D. 导出 `POST /history/export`

| 参数 | 类型 | 必填 | 默认值 | 枚举/约束 | 说明 |
|---|---|---|---|---|---|
| `format` | string | 否 | `json` | `json/csv` | 导出格式 |

注意：当前实现主要从 query 读取参数，不依赖 JSON body。

## 状态机与终态语义（深度版）

### A. 单条确认状态机

`pending -> acked|rejected`

前端行为：
1. 操作成功后行内状态立即更新，并刷新 `pending-count`。
2. 对已终态记录隐藏重复确认按钮，避免无效操作。

### B. 批量确认流程状态

`idle -> submitting -> partial_success|success|failed`

说明：
1. `partial_success` 需展示 `failed_ids`，支持二次重试。
2. 成功后列表与角标都要回流刷新。

## 页面级验收清单（新增）

1. 列表分页严格按 `records + total + page + page_size` 解析。  
2. 单条确认/拒绝可仅传空对象 `{}` 或不传请求体。  
3. 批量确认支持部分成功提示，不误判为全失败。  
4. 导出支持 `json/csv`，并根据 Content-Type 触发下载。  
5. 详情/操作返回 404 时统一提示“记录不存在或无访问权限”。  
6. 所有操作后 `pending-count` 与列表状态保持一致。  

## 文档可信来源

- `internal/api/router/router.go`
- `internal/api/handler/notifier_history_handler.go`
- `internal/application/notifier/history/store.go`
- `internal/application/notifier/history/mysql_store.go`

更新时间：2026-03-05

