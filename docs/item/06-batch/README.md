# 批量执行模块（前端）

本模块用于创建并管理批量执行（多个 Agent × 多个 Benchmark 组合）。

- 详细接口文档：`./API.md`
- 推荐先读：`../00-overview/README.md`

## 前端对接重点

- 创建后立即返回 batch 信息，实际执行为异步。
- 任务总数是笛卡尔积，可能很大，UI 必须展示预估总任务数。
- 批量状态和子任务状态是两层，需要分别展示。

## 文档可信来源

- `internal/api/router/router.go`
- `internal/api/handler/batch_handler.go`
- `internal/domain/batch/*.go`
- `internal/application/batch/service.go`

更新时间：2026-03-04

