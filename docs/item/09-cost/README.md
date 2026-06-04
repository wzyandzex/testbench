# 成本模块（前端）

本模块用于查看执行成本、统计报表、模型定价管理与成本试算。

- 详细接口文档：`./API.md`
- 推荐先读：`../00-overview/README.md`

## 前端对接重点

- 统计与汇总日期格式是 `YYYY-MM-DD`。
- 成本统计支持较多筛选项，建议做高级筛选面板。
- 模型定价写接口（新增/编辑/删除）仅系统管理员可用，普通用户建议只展示只读列表。

## 文档可信来源

- `internal/api/router/router.go`
- `internal/api/handler/cost_handler.go`
- `internal/application/cost/service.go`
- `internal/domain/cost/models.go`

更新时间：2026-03-04

