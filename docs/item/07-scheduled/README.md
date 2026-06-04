# 定时任务模块（前端）

本模块用于创建周期任务（cron/interval/once），并管理启停、手动触发、运行历史。

- 详细接口文档：`./API.md`
- 推荐先读：`../00-overview/README.md`

## 前端对接重点

- 本模块使用独立错误码体系（如 `400001`、`500006`）。
- 创建接口成功 HTTP 为 `201`，其余大多是 `200`。
- 任务列表在“个人模式”和“组织模式”下过滤逻辑不同。

## 文档可信来源

- `internal/api/router/router.go`
- `internal/api/handler/scheduled_task_handler.go`
- `internal/api/handler/schedule_errors.go`
- `internal/domain/schedule/*.go`
- `internal/application/schedule/service.go`

更新时间：2026-03-04

