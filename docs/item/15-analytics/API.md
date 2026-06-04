# 分析与报表 API（前端对接）

Base URL: `/api/v1`  
Consumer：`user-app`

可用性说明（按当前后端实现）：

- `collector/*` 与 `analyzer/*` 路由仅在后端启用对象存储分析组件时注册。
- 若后端未启用对应组件，前端应隐藏相关菜单或展示“功能未启用”状态。

## 1. 接口总览

### 1.1 Analyzer 报告

| Method | Path | Consumer | 说明 |
|---|---|---|---|
| GET | `/analyzer/reports` | `user-app` | 报告列表 |
| GET | `/analyzer/reports/:id` | `user-app` | 报告详情 |
| GET | `/analyzer/trends` | `user-app` | 性能趋势报告列表 |
| GET | `/analyzer/comparisons` | `user-app` | Agent 对比报告列表 |

### 1.2 Collector 报告与审计

| Method | Path | Consumer | 说明 |
|---|---|---|---|
| GET | `/collector/cleanup-reports` | `user-app` | 清理报告列表 |
| GET | `/collector/cleanup-reports/:id` | `user-app` | 清理报告详情 |
| GET | `/collector/audit-logs` | `user-app` | 审计日志 |

### 1.3 Metrics 指标

| Method | Path | Consumer | 说明 |
|---|---|---|---|
| GET | `/metrics` | `user-app` | 指标列表 |
| GET | `/metrics/execution/:id` | `user-app` | 执行指标 |
| GET | `/metrics/comparison` | `user-app` | 指标对比 |
| GET | `/metrics/ranking` | `user-app` | 排名 |
| GET | `/metrics/report/:id` | `user-app` | 指标报告 |
| POST | `/metrics/aggregated` | `user-app` | 手动聚合 |

鉴权要求：需要 `Authorization`，必须带 `X-Org-ID`。

作用域说明：

- Analyzer/Collector 报告列表会按组织前缀查询对象存储。
- Metrics 明细/对比/报告会按组织范围做校验，越权时返回 `404001` 或 `404`。

---

## 2. Analyzer

## 2.1 报告列表 `GET /analyzer/reports`

Query：

- `report_type`：`performance_trends|agent_comparison|execution_stats`
- `start_date`：`YYYY-MM-DD`
- `end_date`：`YYYY-MM-DD`
- `page`、`page_size`

返回列表项：

- `report_id`
- `report_type`
- `generated_at`
- `date`
- `object_name`

## 2.2 报告详情 `GET /analyzer/reports/:id`

返回对象为报告 JSON 内容本体（动态结构，前端建议按报告类型渲染）。

## 2.3 趋势和对比快捷接口

- `GET /analyzer/trends` 等价于固定 `report_type=performance_trends`
- `GET /analyzer/comparisons` 等价于固定 `report_type=agent_comparison`

---

## 3. Collector

## 3.1 清理报告列表 `GET /collector/cleanup-reports`

Query：

- `cleanup_type`
- `start_date`、`end_date`（`YYYY-MM-DD`）
- `page`、`page_size`

返回字段：

- `report_id`
- `task_id`
- `generated_at`
- `date`
- `cleanup_type`
- `object_name`

## 3.2 清理报告详情 `GET /collector/cleanup-reports/:id`

返回 `collector.CleanupReport` 内容。

## 3.3 审计日志 `GET /collector/audit-logs`

Query：

- `triggered_by`
- `start_date`、`end_date`
- `page`、`page_size`

---

## 4. Metrics

## 4.1 指标列表 `GET /metrics`

常用 query：

- `benchmark_id`
- `agent_id`
- `language`
- `benchmark_type`
- `min_score`、`max_score`
- `created_after`、`created_before`（RFC3339）
- `page`、`page_size`

## 4.2 指标对比 `GET /metrics/comparison`

必填 query：

- `reference_id`
- `target_id`

## 4.3 指标聚合 `POST /metrics/aggregated`

Query：

- `period`：`daily|weekly|monthly`（默认 `daily`）
- `start_date`（RFC3339，可选）
- `end_date`（RFC3339，可选）

---

## 5. 常见错误

- `404`：报告或指标不存在
- `400`：对比缺少参数、时间格式错误
- `500`：对象存储或服务内部错误

---

## 6. 前端建议

1. 分析页拆分三个 Tab：Analyzer / Collector / Metrics。
2. 报告详情按 `report_type` 组件化渲染，避免硬编码单一 schema。
3. 对空列表做“暂无报告产物”提示，而不是直接报错。


## 前端最小对接流程

1. 页面先拆为 Analyzer、Collector、Metrics 三个 Tab。
2. Analyzer 先接报告列表与详情（`/analyzer/reports` 系列）。
3. Collector 接清理报告和审计日志（`/collector/*`）。
4. Metrics 接列表、对比、排名和报告接口，最后补手动聚合。


## 页面字段映射（接口 -> UI）

| 接口字段 | UI 字段/状态 | 说明 |
|---|---|---|
| `analyzer list: report_id/report_type` | `reportTable.rowKey/typeTag` | 报告列表主键与类型标签 |
| `analyzer detail.data` | `reportRenderer.payload` | 按类型组件化渲染 JSON |
| `collector list fields` | `cleanupTable.rows` | 清理报告列表展示 |
| `audit logs list` | `auditLogTable.rows` | 审计日志表格数据 |
| `metrics list/comparison` | `metricsCharts` | 指标趋势与对比图 |
| `metrics ranking/report` | `rankingTable/reportPanel` | 排名与报告详情渲染 |


## 页面接口调用时序（建议）

1. Analyzer Tab 首屏：`GET /analyzer/reports`。
2. 详情查看：`GET /analyzer/reports/:id`。
3. Collector Tab：`GET /collector/cleanup-reports` 与 `GET /collector/audit-logs`。
4. Metrics Tab：`GET /metrics`、`GET /metrics/comparison`、`GET /metrics/ranking`。


## 前端联调检查清单

1. 请求头：分析报表接口统一带 `Authorization` + `X-Org-ID`。
2. 必填参数：对比接口 `reference_id/target_id` 必填。
3. 成功判定：报告详情返回为动态 JSON，前端按 `report_type` 分组件渲染。
4. 失败分支：对象不存在（404）时展示空态并引导返回列表。
5. 回流刷新：筛选条件变更后重拉列表，不复用旧报告内容。

## 通用错误处理与排错

- 错误码总览：`../00-overview/ERROR-CODES.md`
- 快速排错：`../00-overview/TROUBLESHOOTING.md`
- 请求层模板：`../00-overview/FRONTEND-INTEGRATION.md`

## 字段级契约（深度版）

### A. Analyzer 报告列表 `GET /analyzer/reports`（query）

| 参数 | 类型 | 必填 | 默认值 | 枚举/约束 | 说明 |
|---|---|---|---|---|---|
| `report_type` | string | 否 | 空 | `performance_trends/agent_comparison/execution_stats` | 报告类型 |
| `start_date` | string | 否 | 空 | `YYYY-MM-DD` | 开始日期 |
| `end_date` | string | 否 | 空 | `YYYY-MM-DD` | 结束日期 |
| `page` | int | 否 | 1 | >=1 | 页码 |
| `page_size` | int | 否 | 20 | 建议 <=100 | 每页条数 |

列表项核心字段：

| 字段 | 类型 | 必有 | 说明 |
|---|---|---|---|
| `report_id` | string | 是 | 报告主键 |
| `report_type` | string | 是 | 报告类型 |
| `generated_at` | string | 否 | 生成时间 |
| `date` | string | 否 | 报告日期 |
| `object_name` | string | 否 | 对象存储路径 |

### B. Analyzer 报告详情 `GET /analyzer/reports/:id`

返回动态 JSON（结构随 `report_type` 变化）。  
前端契约：
1. 先识别 `report_type` 再选择渲染组件。
2. 未识别类型回退到“JSON 原文查看器”。

### C. Collector 接口字段

`GET /collector/cleanup-reports` query：

| 参数 | 类型 | 必填 | 默认值 | 约束 |
|---|---|---|---|---|
| `cleanup_type` | string | 否 | 空 | - |
| `start_date` | string | 否 | 空 | `YYYY-MM-DD` |
| `end_date` | string | 否 | 空 | `YYYY-MM-DD` |
| `page` | int | 否 | 1 | >=1 |
| `page_size` | int | 否 | 20 | 建议 <=100 |

`GET /collector/audit-logs` query：

| 参数 | 类型 | 必填 | 默认值 | 约束 |
|---|---|---|---|---|
| `triggered_by` | string | 否 | 空 | - |
| `start_date` | string | 否 | 空 | `YYYY-MM-DD` |
| `end_date` | string | 否 | 空 | `YYYY-MM-DD` |
| `page` | int | 否 | 1 | >=1 |
| `page_size` | int | 否 | 20 | 建议 <=100 |

### D. Metrics 接口字段

`GET /metrics` query：

| 参数 | 类型 | 必填 | 默认值 | 约束 |
|---|---|---|---|---|
| `benchmark_id` | string | 否 | 空 | - |
| `agent_id` | string | 否 | 空 | - |
| `language` | string | 否 | 空 | - |
| `benchmark_type` | string | 否 | 空 | - |
| `min_score` | number | 否 | 空 | >=0 |
| `max_score` | number | 否 | 空 | >=0 |
| `created_after` | string | 否 | 空 | RFC3339 |
| `created_before` | string | 否 | 空 | RFC3339 |
| `page` | int | 否 | 1 | >=1 |
| `page_size` | int | 否 | 20 | 建议 <=100 |

`GET /metrics/comparison` 必填：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `reference_id` | string | 是 | 基准指标 ID |
| `target_id` | string | 是 | 对比指标 ID |

`POST /metrics/aggregated` query：

| 参数 | 类型 | 必填 | 默认值 | 枚举/约束 |
|---|---|---|---|---|
| `period` | string | 否 | `daily` | `daily/weekly/monthly` |
| `start_date` | string | 否 | 空 | RFC3339 |
| `end_date` | string | 否 | 空 | RFC3339 |

## 状态机与终态语义（深度版）

### A. 报表列表页状态机

`idle -> loading -> success|empty|error`

前端行为：
1. 切换 Tab（Analyzer/Collector/Metrics）时独立维护各自状态。
2. 空列表显示“暂无产物”，不是错误态。

### B. 报表详情渲染状态

`loading -> typed_render|fallback_json|error`

规则：
1. 能识别 `report_type` 时走 typed_render 组件。
2. 未识别结构回退到 fallback_json，保证可读性。

## 页面级验收清单（新增）

1. Analyzer/Collector/Metrics 三个 Tab 能独立筛选与分页。  
2. 报告详情对动态 JSON 可稳定渲染（至少有 JSON 回退）。  
3. Metrics 对比缺 `reference_id/target_id` 时前端阻止请求。  
4. 对象不存在（404）场景展示空态并引导返回列表。  
5. 组件未启用场景（路由缺失）展示“功能未启用”而非报错页。  
6. 所有筛选条件变化后重新拉取数据，不复用过期详情内容。  

## 文档可信来源

- `internal/api/router/router.go`
- `internal/api/handler/analyzer_handler.go`
- `internal/api/handler/collector_handler.go`
- `internal/api/handler/metrics_handler.go`

更新时间：2026-03-05

