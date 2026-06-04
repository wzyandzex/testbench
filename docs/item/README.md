# 前端对接文档入口（`docs/item`）

本目录是前端同学对接后端 API 的**推荐入口**。文档已按“先全局、再模块”组织。

## 1. 建议阅读顺序

1. `00-overview/README.md`（先建立全局认知）
2. `00-overview/FRONTEND-PROJECT-SPLIT.md`（先确认你属于用户端还是系统管理端）
3. `00-overview/USER-APP-QUICKSTART.md` 或 `00-overview/ADMIN-APP-QUICKSTART.md`
4. `00-overview/PERMISSION-MATRIX.md`（接口级权限矩阵，前端显隐与路由白名单必看）
5. `00-overview/route-whitelist.user-app.json`（用户端路由白名单，可直接用于前端路由守卫/API allow-list）
6. `00-overview/route-whitelist.admin-app.json`（系统管理端路由白名单）
7. `00-overview/route-whitelist.shared.json`（共享路由白名单）
8. `00-overview/contracts/routes.catalog.json`（路由契约单一真相源）
9. `00-overview/contracts/permissions.catalog.json`（权限契约）
10. `00-overview/contracts/errors.catalog.json`（错误码契约）
11. `00-overview/contracts/pagination.catalog.json`（分页契约）
12. `00-overview/contracts/frontend-api-types.ts`（前端 TypeScript 类型契约，可直接复制）
13. `00-overview/contracts/frontend-api-sdk-template.ts`（前端 SDK 模板，可直接复制）
14. `00-overview/contracts/README.md`（契约维护与生成说明）
15. `00-overview/FRONTEND-INTEGRATION.md`（可直接复用的请求封装模板）
16. `00-overview/API-ROUTES.md`（完整路由清单）
17. `00-overview/ERROR-CODES.md`（错误码与统一处理策略）
18. `00-overview/TIME-STRATEGY.md`（时间字段与时区统一规范）
19. `00-overview/TROUBLESHOOTING.md`（快速排错手册）
20. 各业务模块 `README.md` 与 `API.md`

---

## 2. 模块目录（按业务域）

- `01-auth`：认证与账户
- `02-organization`：组织、成员、邀请、模板
- `03-benchmark`：评测题目、标签、审批、Fork
- `04-swe`：SWE 任务、测试策略、仓库缓存、WebSocket
- `05-execution`：执行记录与轨迹
- `06-batch`：批量执行与报告
- `07-scheduled`：定时任务与运行历史
- `08-agent`：Agent 管理与执行
- `09-cost`：成本统计与模型定价
- `10-project-eval`：项目上传与自适配评测（Project Evaluation）
- `12-import`：数据导入
- `13-export`：数据导出
- `14-notification`：通知历史与确认
- `15-analytics`：分析报告、清理报告、指标接口
- `16-settings`：语言配置、缓存监控、Kafka 监控（含 Redis KPI 与阈值建议）

---

## 2.1 双前端项目分层（新增）

为避免两个前端项目（用户端 / 系统管理端）对接混用，新增分层文档：

- `00-overview/FRONTEND-PROJECT-SPLIT.md`：完整归属矩阵（接口/模块按前端项目划分）
- `00-overview/USER-APP-QUICKSTART.md`：用户端最小必接清单
- `00-overview/ADMIN-APP-QUICKSTART.md`：系统管理端最小必接清单
- `00-overview/PERMISSION-MATRIX.md`：接口级权限矩阵（角色 × 接口 × 前端项目）
- `00-overview/route-whitelist.user-app.json`：用户端可消费路由白名单
- `00-overview/route-whitelist.admin-app.json`：系统管理端可消费路由白名单
- `00-overview/route-whitelist.shared.json`：共享路由白名单

建议先明确项目边界，再进入模块 `API.md`。

---

## 3. 文档范围

- 以后端代码实现为准（`internal/api/router/router.go` + 对应 handler）
- 优先保证路径、方法、鉴权、参数、错误行为准确
- 面向前端可落地，包含请求样例、分页结构与常见避坑说明
- 各模块 `API.md` 统一包含六段：`接口说明`、`前端最小对接流程`、`页面字段映射（接口 -> UI）`、`页面接口调用时序（建议）`、`前端联调检查清单`、`通用错误处理与排错`

---

## 3.1 契约生成（新增）

路由白名单由契约源生成，不建议手工改 `route-whitelist.*.json`。

- 契约源：`00-overview/contracts/routes.catalog.json`
- 生成命令：`python scripts/docs/generate_item_contracts.py`
- 校验命令：`python scripts/docs/generate_item_contracts.py --check`

当前契约版本：`2026-03-09.v4`  
当前基线提交：`65e5999`

---

## 4. 强提醒（避免踩坑）

- 组织请求头是 `X-Org-ID`（不是 `X-Organization-ID`）
- 组织域接口必须携带 `X-Org-ID`，否则会直接返回参数错误
- 路由注释与真实路由偶有历史差异，请以 `router.go` 为准

