# API 路由总览（前端）

来源：`internal/api/router/router.go`  
Base URL：`/api/v1`

说明：

- `Auth`：是否要求 `Authorization: Bearer <token>`
- `Org`：是否要求组织上下文（`X-Org-ID`）
- `Admin`：是否要求系统管理员（`role=admin`）

---

## 0. 前端项目归属（先看）

- 用户端前端项目：优先消费组织作用域业务路由（Benchmark/SWE/Execution/Import/Export 等）
- 系统管理端前端项目：优先消费平台治理路由（`/admin/users/*`、`/kafka/*`、缓存管理类）
- 共享路由：`/auth/*`、`/health`、部分只读监控路由

详细分层见：`./FRONTEND-PROJECT-SPLIT.md`
可直接消费的路由白名单 JSON：

- `./route-whitelist.user-app.json`
- `./route-whitelist.admin-app.json`
- `./route-whitelist.shared.json`

生成来源（单一真相源）：

- `./contracts/routes.catalog.json`
- 生成命令：`python scripts/docs/generate_item_contracts.py`

---

## 1. 公共路由

| Method | Path | Auth | Org | Admin | 说明 |
|---|---|---|---|---|---|
| GET | `/health` | 否 | 否 | 否 | API 健康检查 |
| POST | `/auth/login` | 否 | 否 | 否 | 登录 |
| POST | `/auth/refresh` | 否 | 否 | 否 | 刷新令牌 |
| POST | `/auth/register` | 否 | 否 | 否 | 注册 |
| POST | `/auth/password/reset` | 否 | 否 | 否 | 发起重置密码 |
| POST | `/auth/password/reset/confirm` | 否 | 否 | 否 | 确认重置密码 |

---

## 2. 仅认证路由（不要求组织上下文）

| Method | Path | Auth | Org | Admin | 说明 |
|---|---|---|---|---|---|
| GET | `/auth/me` | 是 | 否 | 否 | 当前用户信息 |
| PUT | `/auth/password` | 是 | 否 | 否 | 修改密码 |
| POST | `/auth/logout` | 是 | 否 | 否 | 退出登录 |
| POST | `/auth/email/verify` | 是 | 否 | 否 | 发送邮箱验证 |
| POST | `/auth/email/verify/confirm` | 是 | 否 | 否 | 确认邮箱变更 |
| POST | `/auth/avatar` | 是 | 否 | 否 | 更新头像 |
| DELETE | `/auth/delete` | 是 | 否 | 否 | 注销账号 |

### 2.1 系统管理员用户管理

| Method | Path | Auth | Org | Admin | 说明 |
|---|---|---|---|---|---|
| GET | `/admin/users` | 是 | 否 | 是 | 用户列表 |
| POST | `/admin/users/:id/lock` | 是 | 否 | 是 | 锁定用户 |
| POST | `/admin/users/:id/unlock` | 是 | 否 | 是 | 解锁用户 |
| PUT | `/admin/users/:id/role` | 是 | 否 | 是 | 修改角色 |

### 2.2 Kafka 运维（系统管理员）

| Method | Path | Auth | Org | Admin | 说明 |
|---|---|---|---|---|---|
| GET | `/kafka/stats` | 是 | 否 | 是 | Kafka 概览 |
| GET | `/kafka/topics` | 是 | 否 | 是 | Topic 列表 |
| GET | `/kafka/topics/:topic` | 是 | 否 | 是 | Topic 详情 |
| POST | `/kafka/topics` | 是 | 否 | 是 | 创建 Topic |
| DELETE | `/kafka/topics/:topic` | 是 | 否 | 是 | 删除 Topic |
| GET | `/kafka/producers` | 是 | 否 | 是 | 生产者信息 |
| GET | `/kafka/consumers` | 是 | 否 | 是 | 消费者信息 |
| GET | `/kafka/health` | 是 | 否 | 是 | Kafka 健康检查 |

### 2.3 缓存监控

| Method | Path | Auth | Org | Admin | 说明 |
|---|---|---|---|---|---|
| GET | `/cache/kpi` | 是 | 否 | 否 | Redis KPI 快照 |
| POST | `/cache/kpi/reset` | 是 | 否 | 是 | 重置 KPI 快照 |
| GET | `/cache/stats` | 是 | 否 | 否 | 缓存统计 |
| GET | `/cache/stats/:prefix` | 是 | 否 | 否 | 前缀统计 |
| GET | `/cache/stats/:prefix/topkeys` | 是 | 否 | 否 | 热 key |
| GET | `/cache/stats/:prefix/latency` | 是 | 否 | 否 | 延迟统计 |
| GET | `/cache/stats/:prefix/history` | 是 | 否 | 否 | 历史数据 |
| POST | `/cache/stats/reset/:prefix` | 是 | 否 | 是 | 重置统计 |
| GET | `/cache/alerts` | 是 | 否 | 否 | 告警列表 |
| GET | `/cache/summary` | 是 | 否 | 否 | 汇总看板 |

---

## 3. 组织上下文路由（业务主干）

这些接口必须携带：

- `Authorization`
- `X-Org-ID`（后端兼容旧头 `X-Organization-Id`）

### 3.1 组织与模板

- `/organizations/*`
- `/user/current-organization`
- `/org-templates/*`

详细见：`../02-organization/API.md`

### 3.2 Benchmark

- `/benchmarks`
- `/benchmarks/:id`
- `/benchmarks/:id/stats`
- `/benchmarks/:id/status`
- `/benchmarks/:id/quality/latest`
- `/benchmarks/:id/quality/history`
- `/benchmarks/:id/quality/llm-checks`
- `/benchmarks/:id/quality/llm-checks/:job_id`
- `/benchmarks/:id/quality/llm-reports/latest`
- `/benchmarks/:id/quality/llm-reports/history`
- `/benchmarks/pending`
- `/benchmarks/:id/fork`
- `/benchmarks/:id/forks`
- `/benchmarks/my-forks`
- `/benchmarks/tags`
- `/quality/policies/effective`
- `/quality/policies/organization`
- `/quality/policies/organization/audits`
- `/quality/llm/capabilities`
- `/quality/llm/policies/organization`

详细见：`../03-benchmark/API.md`

### 3.3 SWE-bench

- `/swenbench/tasks`
- `/swenbench/tasks/:id`
- `/swenbench/tasks/:id/retry`
- `/swenbench/tasks/:id/fix`
- `/swenbench/tasks/:id/export`
- `/swenbench/tasks/:id/test-options`
- `/swenbench/tasks/:id/test-strategy`
- `/swenbench/tasks/:id/ws`（按任务作用域校验）
- `/swenbench/ws`（系统管理员）
- `/swenbench/ws/stats`（系统管理员）
- `/swenbench/repo/cache` GET/DELETE（系统管理员）

详细见：`../04-swe/API.md`

### 3.4 执行、批量、定时

- `/executions/*`
- `/batch-executions/*`
- `/scheduled-tasks/*`

详细见：

- `../05-execution/API.md`
- `../06-batch/API.md`
- `../07-scheduled/API.md`

### 3.5 Agent / Metrics / Scheduler / Language

- `/agents/*`
- `/metrics/*`
- `/scheduler/*`
- `/languages/*`

详细见：

- `../08-agent/API.md`
- `../15-analytics/API.md`
- `../16-settings/API.md`

### 3.6 导入与导出

- `/import/benchmarks/*`
- `/import/humaneval/*`
- `/import/swebench/*`
- `/import/codecomplete/*`
- `/import/tasks/*`
- `/export/*`

详细见：

- `../12-import/API.md`
- `../13-export/API.md`

### 3.7 成本、通知、分析

- `/cost/*`
- `/history/*`
- `/collector/*`
- `/analyzer/*`

详细见：

- `../09-cost/API.md`
- `../14-notification/API.md`
- `../15-analytics/API.md`

### 3.8 项目评测（Project Evaluation）

- `/project-evals/sources`
- `/project-evals/runs`
- `/project-evals/capabilities`
- `/project-evals/runs/:id`
- `/project-evals/runs/:id/plan`
- `/project-evals/runs/:id/report`
- `/project-evals/insights/summary`
- `/project-evals/insights/trends`
- `/project-evals/policies/effective`
- `/project-evals/policies/organization`（组织管理员）

详细见：

- `../10-project-eval/API.md`

---

## 4. 前端接入建议

1. 组织域业务请求必须带 `Authorization` + `X-Org-ID`。
2. 对系统管理员接口做前端权限隐藏，但仍保留后端 `403001` 兜底。
3. 对 `404` 保持“资源不存在”统一提示，不区分是否越权（防枚举语义）。

更新时间：2026-03-09

