# 系统管理端前端项目：快速对接清单

适用对象：系统管理员（`role=admin`）使用的管理前端项目。

---

## 1. 首批必接（MVP）

- [ ] 认证：`/auth/login`、`/auth/refresh`、`/auth/me`
- [ ] 用户管理：`/admin/users/*`
- [ ] Kafka 运维：`/kafka/*`
- [ ] 缓存监控：`/cache/kpi`、`/cache/stats`、`/cache/alerts`

---

## 2. 第二批（治理增强）

- [ ] 缓存管理操作：`/cache/kpi/reset`、`/cache/stats/reset/:prefix`
- [ ] 平台告警看板与趋势视图
- [ ] 管理端审计视图（若启用）

---

## 3. 与用户端边界

管理端建议**不承载业务主流程页面**（Benchmark/SWE/Execution/Import 等），
这些能力归用户端项目，避免两个前端重复维护同一业务 UI。

---

## 4. 权限提示策略

- 非 admin 用户进入管理端，统一提示“无系统管理权限”并引导返回用户端。
- 对 `403001` 错误做统一弹层，不暴露内部细节。

---

## 5. 路由白名单（建议直接接入）

- 系统管理端：`./route-whitelist.admin-app.json`
- 共享：`./route-whitelist.shared.json`

建议在前端路由守卫和 API 客户端 allow-list 中直接使用白名单。
