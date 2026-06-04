# 认证模块（前端）

本模块负责：

- 登录 / 注册 / 刷新 token
- 用户信息与密码管理
- 邮箱验证与密码找回
- 管理员用户管理（锁定、解锁、改角色）

- 详细接口文档：`./API.md`
- 通用接入模板：`../00-overview/FRONTEND-INTEGRATION.md`
- 错误码处理：`../00-overview/ERROR-CODES.md`

## 前端对接重点

- 401 场景要统一走 refresh 流程。
- `POST /auth/logout` 建议传 `{}` 或完整 body（后端走 JSON 绑定）。
- `POST /auth/avatar` 当前推荐 `avatar_url`，文件直传暂未实现。

## 文档可信来源

- `internal/api/router/router.go`
- `internal/api/handler/auth_handler.go`
- `internal/api/middleware/auth.go`

更新时间：2026-03-04

