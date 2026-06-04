# Benchmark 模块（前端）

本模块用于管理评测题目（Benchmark）、标签、审批与 Fork。

- 详细接口：`./API.md`
- 路由总览：`../00-overview/API-ROUTES.md`
- 请求层模板：`../00-overview/FRONTEND-INTEGRATION.md`

## 对接重点

1. 所有接口都必须带 `Authorization` + `X-Org-ID`。
2. 列表分页结构固定为 `data.total/page/size/data`。
3. 审批权限矩阵：
   - 系统管理员可审批 `public` 与 `organization`。
   - 组织管理员仅可审批本组织 `organization` 资源。
   - 创建者不能审批自己的资源。
4. 越权读接口会出现 `404001`（防枚举）。

## 可信来源

- `internal/api/router/router.go`
- `internal/api/handler/benchmark_handler.go`
- `internal/application/benchmark/visibility_service.go`
- `internal/application/benchmark/approval_service.go`

更新时间：2026-03-04

