# 前端契约源（contracts）

本目录是 `docs/item` 的机器可读契约单一真相源（SoT）。

---

## 1. 文件说明

- `routes.catalog.json`：路由清单与元数据（consumer/scope/requires_org/optional/compat）。
- `permissions.catalog.json`：角色与权限规则（含关键路由覆盖规则）。
- `errors.catalog.json`：通用错误码契约（含分类与重试语义）。
- `pagination.catalog.json`：分页结构契约。
- `frontend-api-types.ts`：前端 TypeScript 类型契约（可直接复制到前端项目）。
- `frontend-api-sdk-template.ts`：前端 SDK 方法签名模板（按模块分组的 API 调用封装）。

---

## 2. 生成产物

由 `routes.catalog.json` 生成：

- `../route-whitelist.user-app.json`
- `../route-whitelist.admin-app.json`
- `../route-whitelist.shared.json`

生成命令：

```bash
python scripts/docs/generate_item_contracts.py
```

校验命令：

```bash
python scripts/docs/generate_item_contracts.py --check
```

---

## 3. 维护规则

1. 先更新 `routes.catalog.json`，再生成白名单。
2. 不直接手工改 `route-whitelist.*.json`。
3. 路由变更后同时检查：
   - `PERMISSION-MATRIX.md`
   - 相关模块 `API.md`
4. 每次更新 `routes.catalog.json` 时同步更新 `source_commit`。
5. 文档编码统一 UTF-8。
