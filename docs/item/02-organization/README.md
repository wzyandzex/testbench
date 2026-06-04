# 组织与成员模块（前端）

本模块负责多组织管理、成员与邀请、组织模板。

- 详细接口文档：`./API.md`
- 推荐先读：`../00-overview/README.md`
- 全量路由总表：`../00-overview/API-ROUTES.md`

## 前端对接重点

- 需要组织上下文的接口必须带 `X-Org-ID`。
- 组织管理员接口依赖 `RequireOrgAdmin()`，当前按 `org_role=admin` 判断。
- `POST /organizations/:id/join` 的 path `:id` 当前实现未使用，真正依赖 body 里的 `invite_code`。

## 文档可信来源

- 路由：`internal/api/router/router.go`
- 处理器：`internal/api/handler/organization_handler.go`
- 领域模型：`internal/domain/organization/*.go`

更新时间：2026-03-04

