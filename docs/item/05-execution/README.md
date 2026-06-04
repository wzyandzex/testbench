# 执行记录模块（前端）

本模块用于创建执行、查询执行进度与结果、取消执行、查看轨迹和摘要。

- 详细接口文档：`./API.md`
- 推荐先读：`../00-overview/README.md`

## 前端对接重点

- 创建执行后通常异步推进，详情页应轮询或订阅状态变化。
- 列表/摘要都返回标准 `code/message/data` 包装。
- 取消接口是 `DELETE /executions/:id`，不是 `POST cancel`。

## 文档可信来源

- `internal/api/router/router.go`
- `internal/api/handler/execution_handler.go`
- `internal/application/execution/service.go`
- `internal/domain/execution/execution.go`

更新时间：2026-03-04

