# 前端对接总览（必读）

本文档面向前端开发，目标是让你在不了解后端实现细节的情况下也能稳定对接。

---

## 1. 基本信息

- API Base（默认）：`/api/v1`
- 健康检查：
  - `GET /health`（服务级）
  - `GET /api/v1/health`（API 级）
- 通用 `Content-Type`：`application/json`

---

## 1.1 双前端项目入口（先读）

当前后端服务对接两个前端项目：

- 用户端前端项目
- 系统管理端前端项目

请先阅读：

- `./FRONTEND-PROJECT-SPLIT.md`
- 用户端：`./USER-APP-QUICKSTART.md`
- 系统管理端：`./ADMIN-APP-QUICKSTART.md`
- 接口级权限矩阵：`./PERMISSION-MATRIX.md`
- 用户端路由白名单：`./route-whitelist.user-app.json`
- 系统管理端路由白名单：`./route-whitelist.admin-app.json`
- 共享路由白名单：`./route-whitelist.shared.json`
- 路由契约源：`./contracts/routes.catalog.json`
- 权限契约源：`./contracts/permissions.catalog.json`
- 错误码契约源：`./contracts/errors.catalog.json`
- 分页契约源：`./contracts/pagination.catalog.json`
- TypeScript 类型契约：`./contracts/frontend-api-types.ts`
- TypeScript SDK 模板：`./contracts/frontend-api-sdk-template.ts`
- 契约维护说明：`./contracts/README.md`

---

## 2. 鉴权与组织上下文

### 2.1 登录态

需要鉴权的接口请带：

```http
Authorization: Bearer <access_token>
```

公开接口仅限认证相关少数接口（如 `login/register/refresh/password reset`）。

### 2.2 组织上下文（重点）

大多数业务接口运行在组织上下文中，请带：

```http
X-Org-ID: <organization_id>
```

如果不带，后端会尝试使用用户默认组织；拿不到则返回错误。

---

## 3. 通用响应格式与错误处理

### 3.1 标准成功响应

```json
{
  "code": 0,
  "message": "success",
  "data": {}
}
```

### 3.2 标准错误响应

```json
{
  "code": 400,
  "message": "xxx"
}
```

### 3.3 前端必须处理的“不一致行为”

- 认证中间件错误通常是 HTTP `401/403`，body 里也有 `code`
- 组织中间件部分错误可能是 HTTP `200`，但 body 里 `code != 0`

建议统一判断：

1. HTTP 状态不是 2xx -> 直接走错误逻辑  
2. HTTP 是 2xx 但 `code !== 0` -> 也走错误逻辑

更多错误处理细节请看：

- `./ERROR-CODES.md`
- `./TIME-STRATEGY.md`
- `./TROUBLESHOOTING.md`

---

## 4. 分页约定

后端存在两种常见分页结构：

### 4.1 标准分页（`SuccessPageResponse`）

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 100,
    "page": 1,
    "size": 20,
    "data": []
  }
}
```

### 4.2 业务自定义分页（示例：导入任务）

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "tasks": [],
    "total": 100
  }
}
```

前端不要假设所有列表接口都返回 `items` 字段。

---

## 5. 模块导航

- 认证与账户：`../01-auth/API.md`
- 组织与成员：`../02-organization/API.md`
- 评测题目：`../03-benchmark/API.md`
- SWE 任务：`../04-swe/API.md`
- 执行记录：`../05-execution/API.md`
- 批量执行：`../06-batch/API.md`
- 定时任务：`../07-scheduled/API.md`
- Agent：`../08-agent/API.md`
- 成本：`../09-cost/API.md`
- 项目评测：`../10-project-eval/API.md`
- 数据导入：`../12-import/API.md`
- 数据导出：`../13-export/API.md`
- 通知历史：`../14-notification/API.md`
- 分析与报表：`../15-analytics/API.md`
- 系统设置：`../16-settings/API.md`
- 完整路由：`./API-ROUTES.md`
- 前端模板：`./FRONTEND-INTEGRATION.md`
- 双前端分层：`./FRONTEND-PROJECT-SPLIT.md`
- 用户端快速对接：`./USER-APP-QUICKSTART.md`
- 系统管理端快速对接：`./ADMIN-APP-QUICKSTART.md`
- 接口级权限矩阵：`./PERMISSION-MATRIX.md`
- 用户端路由白名单：`./route-whitelist.user-app.json`
- 系统管理端路由白名单：`./route-whitelist.admin-app.json`
- 共享路由白名单：`./route-whitelist.shared.json`
- 路由契约源：`./contracts/routes.catalog.json`
- 权限契约源：`./contracts/permissions.catalog.json`
- 错误码契约源：`./contracts/errors.catalog.json`
- 分页契约源：`./contracts/pagination.catalog.json`
- TypeScript 类型契约：`./contracts/frontend-api-types.ts`
- TypeScript SDK 模板：`./contracts/frontend-api-sdk-template.ts`
- 契约维护说明：`./contracts/README.md`
- 时间规范：`./TIME-STRATEGY.md`

---

## 6. 契约生成与版本

`route-whitelist.*.json` 由契约源生成。

- 生成命令：`python scripts/docs/generate_item_contracts.py`
- 校验命令：`python scripts/docs/generate_item_contracts.py --check`
- 契约版本：`2026-03-09.v4`
- 基线提交：`65e5999`

---

## 7. 推荐对接流程

1. 先接好通用请求层（token 注入 + 统一错误处理）
2. 打通登录与 token 刷新
3. 接组织选择，并在请求头注入 `X-Org-ID`
4. 先做列表页，再做详情页，再做操作类接口
5. 对异步任务接口加轮询或 WebSocket（导入、SWE、批量）
6. 补齐上传下载能力（`multipart/form-data`、URL 下载）

补充：每个业务模块 `API.md` 都包含固定结构，可按以下顺序阅读：
`接口总览 -> 前端最小对接流程 -> 页面字段映射（接口 -> UI） -> 页面接口调用时序（建议） -> 前端联调检查清单 -> 通用错误处理与排错`。

