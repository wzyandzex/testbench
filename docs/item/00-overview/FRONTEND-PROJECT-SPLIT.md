# 双前端项目分层规范（用户端 / 系统管理端）

目标：明确“哪些接口由哪个前端项目消费”，避免同一接口在两个项目重复实现或越权误接。

---

## 1. 前端项目定义

### 1.1 用户端前端项目（User App）

面向普通用户与组织管理员，承载业务主流程：

- 评测题目（Benchmark）
- SWE/执行/批量/定时
- 导入导出
- Agent 与成本分析
- 组织内治理（组织管理员权限）

### 1.2 系统管理端前端项目（Admin App）

面向系统管理员（`role=admin`），承载平台级治理与运维：

- 系统用户管理（锁定/解锁/角色调整）
- Kafka 运维
- 平台级监控与诊断
- （可选）全局审计与全局策略管理页

---

## 2. 分层原则（推荐）

1. **业务接口优先归用户端**：凡是组织作用域业务接口，优先由用户端接入。
2. **平台治理接口归管理端**：凡是系统管理员专属、平台级操作，归管理端。
3. **共享接口可双端接入**：如登录、刷新、个人资料等基础能力可复用。
4. **后端权限仍是最终边界**：前端做显隐，后端做强校验（403/404）。

---

## 3. 模块归属矩阵（按业务域）

| 模块 | 用户端 | 管理端 | 说明 |
|---|---|---|---|
| 01-auth | ✅ | ✅ | 两端共用登录与账号基础能力 |
| 02-organization | ✅ | ⛔ | 组织业务主域，建议仅用户端 |
| 03-benchmark | ✅ | ⛔ | 业务核心域，含质量检测与审批 |
| 04-swe | ✅ | ⛔ | 业务执行链路 |
| 05-execution | ✅ | ⛔ | 业务执行记录 |
| 06-batch | ✅ | ⛔ | 批量业务 |
| 07-scheduled | ✅ | ⛔ | 业务定时任务 |
| 08-agent | ✅ | ⛔ | 业务 Agent 管理 |
| 09-cost | ✅ | ⛔ | 业务成本分析 |
| 10-project-eval | ✅ | ⛔ | 项目上传与自适配评测主流程 |
| 12-import | ✅ | ⛔ | 业务导入链路 |
| 13-export | ✅ | ⛔ | 业务导出链路 |
| 14-notification | ✅ | ⛔ | 用户通知 |
| 15-analytics | ✅ | ⛔ | 业务分析 |
| 16-settings（语言） | ✅ | ⛔ | 组织业务相关配置 |
| 16-settings（缓存监控） | ✅ | ✅ | 用户端可看只读，管理端可做重置类操作 |
| 16-settings（Kafka） | ⛔ | ✅ | 系统管理员专属 |

---

## 4. 路由归属矩阵（按接口族）

### 4.1 用户端主接口族

- `/api/v1/benchmarks/*`
- `/api/v1/swenbench/*`
- `/api/v1/executions/*`
- `/api/v1/batch-executions/*`
- `/api/v1/scheduled-tasks/*`
- `/api/v1/agents/*`
- `/api/v1/cost/*`
- `/api/v1/project-evals/*`
- `/api/v1/import/*`
- `/api/v1/export/*`
- `/api/v1/history/*`
- `/api/v1/collector/*`
- `/api/v1/analyzer/*`
- `/api/v1/organizations/*`（含成员与模板）

### 4.2 系统管理端主接口族

- `/api/v1/admin/users/*`
- `/api/v1/kafka/*`
- `/api/v1/cache/*` 中重置类/管理类操作

### 4.3 双端共享接口族

- `/api/v1/auth/*`
- `/api/v1/health`
- `/api/v1/cache/*` 中只读监控类操作（按产品需要可在用户端也展示）

---

## 5. 当前建议的更优方式

比“按模块散写说明”更稳的方式是：

1. 先维护本文件作为**唯一分层真相**（Source of Truth）。
2. 每个模块 `API.md` 增加字段：`Consumer: user-app | admin-app | shared`。
3. 前端网关层按项目注入不同路由白名单，减少误调用。
4. 联调清单按项目拆分执行（见 quickstart 文档）。

对应白名单文件：

- `./route-whitelist.user-app.json`
- `./route-whitelist.admin-app.json`
- `./route-whitelist.shared.json`

对应契约源与生成命令：

- `./contracts/routes.catalog.json`
- `python scripts/docs/generate_item_contracts.py`

---

## 6. 注意事项

- 组织管理员属于“用户端业务角色”，不是系统管理端。
- `public` 资源审核归系统管理员，用户端只展示流程，不代表可以跳过后端权限。
- 前端权限显隐仅提升体验，不能替代后端鉴权。
