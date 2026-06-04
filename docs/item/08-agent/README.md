# Agent 模块（前端）

本模块用于 Agent 的 CRUD、执行调用、流式执行、健康检查与注册同步。

- 详细接口文档：`./API.md`
- 路由总览：`../00-overview/API-ROUTES.md`

## 前端对接重点

- `execute` 返回普通 JSON；`execute/stream` 返回 SSE（`text/event-stream`）。
- 创建/更新时配置字段多，建议前端做 schema 校验。
- 执行失败时会返回较多业务错误码（agent 状态、registry 状态等）。

## 文档可信来源

- `internal/api/router/router.go`
- `internal/api/handler/agent_handler.go`
- `internal/application/agent/service.go`
- `internal/domain/agent/agent.go`

更新时间：2026-03-04

