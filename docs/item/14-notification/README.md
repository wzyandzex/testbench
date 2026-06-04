# 通知历史模块（前端）

本模块用于查询通知/告警历史、确认或拒绝、批量确认、导出。

- 详细接口文档：`./API.md`
- 推荐先读：`../00-overview/README.md`

## 前端对接重点

- 路由前缀是 `/history`（不是旧注释中的 `/history/records`）。
- 导出路由是 `POST /history/export`，格式参数通过 query `format` 传递。
- 查询接口返回结构是 `records`，不是通用 `items`。

## 文档可信来源

- `internal/api/router/router.go`
- `internal/api/handler/notifier_history_handler.go`
- `internal/application/notifier/history/*.go`

更新时间：2026-03-04

