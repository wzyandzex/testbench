# SWE 模块（前端）

本模块用于创建和跟踪 SWE-bench 任务，包含实时状态、测试策略和产物导出。

- 详细接口：`./API.md`
- 路由总览：`../00-overview/API-ROUTES.md`

## 对接重点

1. 任务接口按 `user_id + organization_id` 做作用域隔离。
2. 普通用户只对自己作用域内任务可见，跨用户/跨组织访问返回 `404`。
3. 以下接口仅系统管理员可用：
   - `/swenbench/ws`
   - `/swenbench/ws/stats`
   - `/swenbench/repo/cache`（GET/DELETE）
4. 前端建议“单任务 WS + HTTP 轮询兜底”组合接入。

## 可信来源

- `internal/api/router/router.go`
- `internal/api/handler/swenbench_handler.go`
- `internal/infrastructure/storage/mysql/swenbench_repository.go`

更新时间：2026-03-04

