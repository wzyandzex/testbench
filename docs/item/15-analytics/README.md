# 分析与报表模块（前端）

本模块覆盖三类能力：

- 分析报告（`/analyzer/*`）
- 清理报告与审计日志（`/collector/*`）
- 指标分析（`/metrics/*`）

- 详细接口文档：`./API.md`
- 路由总览：`../00-overview/API-ROUTES.md`

## 前端对接重点

- 报告类接口强依赖对象存储中的产物，可能出现“有任务但暂无报告”。
- 指标接口和分析报告接口是两套能力，前端建议分 Tab。
- 分页结构统一用 `data.total/page/size/data`（个别接口字段名不同时已在 API 文档说明）。

## 文档可信来源

- `internal/api/router/router.go`
- `internal/api/handler/analyzer_handler.go`
- `internal/api/handler/collector_handler.go`
- `internal/api/handler/metrics_handler.go`

更新时间：2026-03-04

