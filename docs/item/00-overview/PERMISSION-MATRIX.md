# 接口级权限矩阵（用户端 / 系统管理端）

本文件给前端两个项目做统一权限判定基线：

- 用户端（`user-app`）
- 系统管理端（`admin-app`）

以当前后端实现（`internal/api/router/router.go` + handler 业务校验）为准。
机器可读权限契约源：`./contracts/permissions.catalog.json`（版本 `2026-03-05.v2`）。

---

## 1. 角色定义

| 角色 | 说明 |
|---|---|
| `guest` | 未登录 |
| `user` | 已登录普通用户（组织成员） |
| `org-admin` | 已登录且当前组织管理员 |
| `sys-admin` | 系统管理员（`role=admin`） |

判定优先级：后端鉴权 > 前端按钮显隐。

---

## 2. 全局门槛

| 路由组 | 基础门槛 |
|---|---|
| `/api/v1/auth/*`（公开部分） | `guest` 可访问 |
| `/api/v1/*`（authenticated） | 必须登录 |
| `/api/v1/*`（orgAuthenticated） | 必须登录 + `X-Org-ID` |
| `middleware.RequireOrgAdmin()` | 需 `org-admin` 或 `sys-admin` |
| `middleware.RequireAdmin()` | 仅 `sys-admin` |

说明：很多业务接口还有“资源作用域校验”（创建者/同组织/可见性），即使通过中间件也可能返回 403/404。

---

## 3. Auth 与系统用户

| Method | Path | Consumer | guest | user | org-admin | sys-admin | 备注 |
|---|---|---|---|---|---|---|---|
| POST | `/auth/register` | `shared` | ✅ | ✅ | ✅ | ✅ | 公开 |
| POST | `/auth/login` | `shared` | ✅ | ✅ | ✅ | ✅ | 公开 |
| POST | `/auth/refresh` | `shared` | ✅ | ✅ | ✅ | ✅ | 公开 |
| POST | `/auth/password/reset` | `shared` | ✅ | ✅ | ✅ | ✅ | 公开 |
| POST | `/auth/password/reset/confirm` | `shared` | ✅ | ✅ | ✅ | ✅ | 公开 |
| GET | `/auth/me` | `shared` | ❌ | ✅ | ✅ | ✅ | 登录态 |
| PUT | `/auth/password` | `shared` | ❌ | ✅ | ✅ | ✅ | 登录态 |
| POST | `/auth/logout` | `shared` | ❌ | ✅ | ✅ | ✅ | 登录态 |
| POST | `/auth/email/verify` | `shared` | ❌ | ✅ | ✅ | ✅ | 登录态 |
| POST | `/auth/email/verify/confirm` | `shared` | ❌ | ✅ | ✅ | ✅ | 登录态 |
| POST | `/auth/avatar` | `shared` | ❌ | ✅ | ✅ | ✅ | 登录态 |
| DELETE | `/auth/delete` | `shared` | ❌ | ✅ | ✅ | ✅ | 登录态 |
| GET | `/admin/users` | `admin-app` | ❌ | ❌ | ❌ | ✅ | 系统管理员专属 |
| POST | `/admin/users/:id/lock` | `admin-app` | ❌ | ❌ | ❌ | ✅ | 系统管理员专属 |
| POST | `/admin/users/:id/unlock` | `admin-app` | ❌ | ❌ | ❌ | ✅ | 系统管理员专属 |
| PUT | `/admin/users/:id/role` | `admin-app` | ❌ | ❌ | ❌ | ✅ | 系统管理员专属 |

---

## 4. 组织

| Method | Path | Consumer | guest | user | org-admin | sys-admin | 备注 |
|---|---|---|---|---|---|---|---|
| POST | `/organizations` | `user-app` | ❌ | ✅ | ✅ | ✅ | 登录态 |
| GET | `/organizations` | `user-app` | ❌ | ✅ | ✅ | ✅ | 登录态 |
| POST | `/organizations/:id/join` | `user-app` | ❌ | ✅ | ✅ | ✅ | 登录态 |
| POST | `/user/current-organization` | `shared` | ❌ | ✅ | ✅ | ✅ | 登录态 |
| GET | `/organizations/:id` | `user-app` | ❌ | ✅ | ✅ | ✅ | 需组织上下文 |
| GET | `/organizations/:id/quota` | `user-app` | ❌ | ✅ | ✅ | ✅ | 需组织上下文 |
| GET | `/organizations/:id/members` | `user-app` | ❌ | ✅ | ✅ | ✅ | 需组织上下文 |
| GET | `/organizations/:id/invitations` | `user-app` | ❌ | ✅ | ✅ | ✅ | 需组织上下文 |
| PUT | `/organizations/:id` | `user-app` | ❌ | ❌ | ✅ | ✅ | 组织管理员 |
| DELETE | `/organizations/:id` | `user-app` | ❌ | ❌ | ✅ | ✅ | 组织管理员 |
| PUT | `/organizations/:id/settings` | `user-app` | ❌ | ❌ | ✅ | ✅ | 组织管理员 |
| PUT | `/organizations/:id/members/:user_id/role` | `user-app` | ❌ | ❌ | ✅ | ✅ | 组织管理员 |
| DELETE | `/organizations/:id/members/:user_id` | `user-app` | ❌ | ❌ | ✅ | ✅ | 组织管理员 |
| POST | `/organizations/:id/invitations` | `user-app` | ❌ | ❌ | ✅ | ✅ | 组织管理员 |
| DELETE | `/organizations/:id/invitations/:invitation_id` | `user-app` | ❌ | ❌ | ✅ | ✅ | 组织管理员 |
| POST | `/organizations/:id/invitations/:invitation_id/resend` | `user-app` | ❌ | ❌ | ✅ | ✅ | 组织管理员 |
| GET | `/org-templates` | `user-app` | ❌ | ✅ | ✅ | ✅ | 登录态 |
| GET | `/org-templates/:id` | `user-app` | ❌ | ✅ | ✅ | ✅ | 登录态 |
| POST | `/org-templates` | `admin-app` | ❌ | ❌ | ❌ | ✅ | 系统管理员 |
| DELETE | `/org-templates/:id` | `admin-app` | ❌ | ❌ | ❌ | ✅ | 系统管理员 |
| POST | `/org-templates/:template_id/create-org` | `user-app` | ❌ | ✅ | ✅ | ✅ | 登录态 |

---

## 5. Benchmark 与质量检测

| Method | Path | Consumer | guest | user | org-admin | sys-admin | 备注 |
|---|---|---|---|---|---|---|---|
| GET | `/benchmarks` | `user-app` | ❌ | ✅ | ✅ | ✅ | 组织域；按可见性过滤 |
| POST | `/benchmarks` | `user-app` | ❌ | ✅ | ✅ | ✅ | 组织域 |
| GET | `/benchmarks/:id` | `user-app` | ❌ | ✅ | ✅ | ✅ | 可见性/作用域校验 |
| PUT | `/benchmarks/:id` | `user-app` | ❌ | ✅ | ✅ | ✅ | 需编辑权限 |
| DELETE | `/benchmarks/:id` | `user-app` | ❌ | ✅ | ✅ | ✅ | 需删除权限 |
| GET | `/benchmarks/:id/stats` | `user-app` | ❌ | ✅ | ✅ | ✅ | 读权限 |
| PATCH | `/benchmarks/:id/status` | `user-app` | ❌ | ✅ | ✅ | ✅ | 需审批权限 + 业务规则 |
| GET | `/benchmarks/:id/quality/latest` | `user-app` | ❌ | ✅ | ✅ | ✅ | 读权限 |
| GET | `/benchmarks/:id/quality/history` | `user-app` | ❌ | ✅ | ✅ | ✅ | 读权限 |
| POST | `/benchmarks/:id/quality/llm-checks` | `user-app` | ❌ | ✅ | ✅ | ✅ | 需编辑权限；异步任务 |
| GET | `/benchmarks/:id/quality/llm-checks/:job_id` | `user-app` | ❌ | ✅ | ✅ | ✅ | 组织作用域 |
| GET | `/benchmarks/:id/quality/llm-reports/latest` | `user-app` | ❌ | ✅ | ✅ | ✅ | 读权限 |
| GET | `/benchmarks/:id/quality/llm-reports/history` | `user-app` | ❌ | ✅ | ✅ | ✅ | 读权限 |
| GET | `/quality/policies/effective` | `user-app` | ❌ | ✅ | ✅ | ✅ | 组织域 |
| GET | `/quality/policies/organization` | `user-app` | ❌ | ✅ | ✅ | ✅ | 组织域 |
| PUT | `/quality/policies/organization` | `user-app` | ❌ | ❌ | ✅ | ✅ | 组织管理员 |
| GET | `/quality/policies/organization/audits` | `user-app` | ❌ | ❌ | ✅ | ✅ | 组织管理员 |
| GET | `/quality/llm/capabilities` | `user-app` | ❌ | ✅ | ✅ | ✅ | 组织域 |
| GET | `/quality/llm/policies/organization` | `user-app` | ❌ | ✅ | ✅ | ✅ | 组织域 |
| PUT | `/quality/llm/policies/organization` | `user-app` | ❌ | ❌ | ✅ | ✅ | 组织管理员 |
| GET | `/benchmarks/pending` | `user-app` | ❌ | ✅ | ✅ | ✅ | 返回内容按角色过滤 |
| POST | `/benchmarks/:id/fork` | `user-app` | ❌ | ✅ | ✅ | ✅ | 需可读权限 |
| GET | `/benchmarks/:id/forks` | `user-app` | ❌ | ✅ | ✅ | ✅ | 需可读权限 |
| GET | `/benchmarks/my-forks` | `user-app` | ❌ | ✅ | ✅ | ✅ | 当前用户 |
| GET | `/benchmarks/tags` | `user-app` | ❌ | ✅ | ✅ | ✅ | 组织域 |
| POST | `/benchmarks/tags` | `user-app` | ❌ | ✅ | ✅ | ✅ | 组织域 |
| DELETE | `/benchmarks/tags/:id` | `user-app` | ❌ | ✅ | ✅ | ✅ | 组织域 |

---

## 6. SWE / Execution / Batch / Scheduled / Agent / Metrics / Scheduler / Language

这些接口都在 `orgAuthenticated` 组下，基础是“登录 + `X-Org-ID`”。

### 6.1 SWE

| Method | Path | Consumer | guest | user | org-admin | sys-admin | 备注 |
|---|---|---|---|---|---|---|---|
| POST | `/swenbench/tasks` | `user-app` | ❌ | ✅ | ✅ | ✅ | 组织域 |
| GET | `/swenbench/tasks` | `user-app` | ❌ | ✅ | ✅ | ✅ | 组织域 |
| GET | `/swenbench/tasks/:id` | `user-app` | ❌ | ✅ | ✅ | ✅ | user+org 作用域 |
| POST | `/swenbench/tasks/:id/retry` | `user-app` | ❌ | ✅ | ✅ | ✅ | user+org 作用域 |
| POST | `/swenbench/tasks/:id/fix` | `user-app` | ❌ | ✅ | ✅ | ✅ | user+org 作用域 |
| GET | `/swenbench/tasks/:id/export` | `user-app` | ❌ | ✅ | ✅ | ✅ | user+org 作用域 |
| GET | `/swenbench/tasks/:id/test-options` | `user-app` | ❌ | ✅ | ✅ | ✅ | user+org 作用域 |
| POST | `/swenbench/tasks/:id/test-strategy` | `user-app` | ❌ | ✅ | ✅ | ✅ | user+org 作用域 |
| GET | `/swenbench/tasks/:id/ws` | `user-app` | ❌ | ✅ | ✅ | ✅ | task 作用域校验 |
| GET | `/swenbench/ws` | `admin-app` | ❌ | ❌ | ❌ | ✅ | 系统管理员 |
| GET | `/swenbench/ws/stats` | `admin-app` | ❌ | ❌ | ❌ | ✅ | 系统管理员 |
| GET | `/swenbench/repo/cache` | `admin-app` | ❌ | ❌ | ❌ | ✅ | 系统管理员 |
| DELETE | `/swenbench/repo/cache` | `admin-app` | ❌ | ❌ | ❌ | ✅ | 系统管理员 |

### 6.2 Execution

| Method | Path | Consumer | guest | user | org-admin | sys-admin |
|---|---|---|---|---|---|---|
| GET | `/executions` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| POST | `/executions` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| GET | `/executions/:id` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| DELETE | `/executions/:id` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| GET | `/executions/:id/trace` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| GET | `/executions/summary` | `user-app` | ❌ | ✅ | ✅ | ✅ |

### 6.3 Batch

| Method | Path | Consumer | guest | user | org-admin | sys-admin |
|---|---|---|---|---|---|---|
| POST | `/batch-executions` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| GET | `/batch-executions` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| GET | `/batch-executions/:id` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| POST | `/batch-executions/:id/cancel` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| GET | `/batch-executions/:id/tasks` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| GET | `/batch-executions/:id/report` | `user-app` | ❌ | ✅ | ✅ | ✅ |

### 6.4 Scheduled

| Method | Path | Consumer | guest | user | org-admin | sys-admin |
|---|---|---|---|---|---|---|
| POST | `/scheduled-tasks` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| GET | `/scheduled-tasks` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| GET | `/scheduled-tasks/:id` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| PUT | `/scheduled-tasks/:id` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| DELETE | `/scheduled-tasks/:id` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| PATCH | `/scheduled-tasks/:id/status` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| POST | `/scheduled-tasks/:id/trigger` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| GET | `/scheduled-tasks/:id/runs` | `user-app` | ❌ | ✅ | ✅ | ✅ |

### 6.5 Agent

| Method | Path | Consumer | guest | user | org-admin | sys-admin |
|---|---|---|---|---|---|---|
| GET | `/agents` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| POST | `/agents` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| GET | `/agents/:id` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| PUT | `/agents/:id` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| DELETE | `/agents/:id` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| GET | `/agents/:id/stats` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| POST | `/agents/:id/execute` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| POST | `/agents/:id/execute/stream` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| GET | `/agents/:id/health` | `user-app` | ❌ | ✅ | ✅ | ✅ |
| POST | `/agents/:id/sync` | `user-app` | ❌ | ✅ | ✅ | ✅ |

### 6.6 Metrics / Scheduler / Language

| Method | Path | Consumer | guest | user | org-admin | sys-admin | 备注 |
|---|---|---|---|---|---|---|---|
| GET | `/metrics*` | `user-app` | ❌ | ✅ | ✅ | ✅ | 指标查询 |
| POST | `/metrics/aggregated` | `user-app` | ❌ | ✅ | ✅ | ✅ | 聚合 |
| GET/POST | `/scheduler/*` | `user-app` | ❌ | ✅ | ✅ | ✅ | 组织域 |
| GET/POST | `/languages/*` | `user-app` | ❌ | ✅ | ✅ | ✅ | 组织域 |

---

## 7. Import / Export / Cost / Notification / Analyzer / Collector

| 接口族 | Consumer | guest | user | org-admin | sys-admin | 备注 |
|---|---|---|---|---|---|---|
| `/import/benchmarks/*` | `user-app` | ❌ | ✅ | ✅ | ✅ | 导入治理与组织隔离 |
| `/import/humaneval/*` | `user-app` | ❌ | ✅ | ✅ | ✅ | 同上 |
| `/import/swebench/*` | `user-app` | ❌ | ✅ | ✅ | ✅ | 同上 |
| `/import/codecomplete/*` | `user-app` | ❌ | ✅ | ✅ | ✅ | 同上 |
| `/import/tasks/*` | `user-app` | ❌ | ✅ | ✅ | ✅ | 异步任务 |
| `/project-evals/sources` `/project-evals/runs*` `/project-evals/insights/*` `/project-evals/policies/effective` | `user-app` | ❌ | ✅ | ✅ | ✅ | 项目评测主链路 |
| `PUT /project-evals/policies/organization` | `user-app` | ❌ | ❌ | ✅ | ✅ | 组织管理员 |
| `/export/*` | `user-app` | ❌ | ✅ | ✅ | ✅ | 组织作用域 |
| `/cost/summary` `/cost/statistics` `/cost/execution/:id` `/cost/calculate` | `user-app` | ❌ | ✅ | ✅ | ✅ | 组织域 |
| `GET /cost/models` | `shared` | ❌ | ✅ | ✅ | ✅ | 读接口 |
| `POST/PUT/DELETE /cost/models*` | `admin-app` | ❌ | ❌ | ❌ | ✅ | 系统管理员 |
| `/history/*` | `user-app` | ❌ | ✅ | ✅ | ✅ | 组织域 |
| `/analyzer/*` | `user-app` | ❌ | ✅ | ✅ | ✅ | 可选组件 |
| `/collector/*` | `user-app` | ❌ | ✅ | ✅ | ✅ | 可选组件 |

---

## 8. Cache / Kafka（平台治理）

| Method | Path | Consumer | guest | user | org-admin | sys-admin | 备注 |
|---|---|---|---|---|---|---|---|
| GET | `/cache/kpi` | `shared` | ❌ | ✅ | ✅ | ✅ | 只读监控 |
| GET | `/cache/stats*` | `shared` | ❌ | ✅ | ✅ | ✅ | 只读监控 |
| GET | `/cache/alerts` | `shared` | ❌ | ✅ | ✅ | ✅ | 只读监控 |
| GET | `/cache/summary` | `shared` | ❌ | ✅ | ✅ | ✅ | 只读监控 |
| POST | `/cache/kpi/reset` | `admin-app` | ❌ | ❌ | ❌ | ✅ | 管理操作 |
| POST | `/cache/stats/reset/:prefix` | `admin-app` | ❌ | ❌ | ❌ | ✅ | 管理操作 |
| GET/POST/DELETE | `/kafka/*` | `admin-app` | ❌ | ❌ | ❌ | ✅ | 系统管理员专属 |

---

## 9. 前端实施建议

1. 用户端和管理端分别维护**路由白名单**，由本矩阵驱动。
2. 页面按钮显隐按本矩阵做第一道过滤，调用失败仍按后端返回兜底。
3. 对 `404` 统一文案“资源不存在或无权限”，不要细分越权原因（防枚举）。
4. 对 403/429 做统一弹层与重试建议。
