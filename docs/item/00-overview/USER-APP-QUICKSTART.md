# 用户端前端项目：快速对接清单

适用对象：普通用户、组织管理员使用的业务前端项目。

---

## 1. 首批必接（MVP）

- [ ] 认证：`/auth/login`、`/auth/refresh`、`/auth/me`
- [ ] 组织：当前组织、组织切换、成员角色回显
- [ ] Benchmark：列表、详情、创建、更新、质量报告
- [ ] Execution：执行创建、列表、详情
- [ ] Import：导入任务创建 + 状态轮询
- [ ] Project Evaluation：项目源创建、评测任务创建、报告查询

---

## 2. 第二批（核心增强）

- [ ] SWE 任务（创建、详情、重试、WS）
- [ ] Batch 批量执行
- [ ] Scheduled 定时任务
- [ ] Agent 管理与执行
- [ ] Cost 统计页面
- [ ] Project Evaluation 洞察看板（summary + trends）

---

## 3. 第三批（体验与治理）

- [ ] Benchmark LLM 增强检测页（任务 + 报告 + 组织策略）
- [ ] Export 导出
- [ ] Notification 通知
- [ ] Analytics 分析页

---

## 4. 用户端不建议接入

- `/api/v1/admin/users/*`
- `/api/v1/kafka/*`

如需显示平台状态，建议只读接入 `/api/v1/cache/*` 监控接口。

---

## 5. 路由白名单（建议直接接入）

- 用户端：`./route-whitelist.user-app.json`
- 共享：`./route-whitelist.shared.json`

建议在前端路由守卫和 API 客户端 allow-list 中直接使用白名单。
