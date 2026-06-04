# 对接排错手册（前端）

当页面“接口报错但不清楚原因”时，按下面顺序排查。

---

## 1. 先看基础三件套

1. 是否带了 `Authorization: Bearer <token>`
2. 是否带了 `X-Org-ID`（业务接口）
3. Base URL 是否是 `/api/v1`

---

## 2. 再看响应体

- 若 HTTP 非 2xx：看 `message` 和状态码
- 若 HTTP 2xx：必须继续看 `code`
- `code != 0` 一律按失败处理

---

## 3. 常见问题快速定位

## 3.1 登录后仍 401

- access_token 未刷新到请求头
- refresh_token 过期（`401003/401004`）

## 3.2 列表接口一直 403

- 当前用户不在该组织
- `X-Org-ID` 指向了无权限组织

## 3.3 导入任务创建失败

- dataset 不是 `humaneval|mbpp`
- `data` 与 `file_id` 都没传
- 队列不可用（`503`）

## 3.4 导出 direct 接口失败

- `POST /export/executions/direct` 当前实现存在参数缺陷
- 请改用 `POST /export/executions/:id`

## 3.5 定时任务创建失败

- cron 表达式不合法
- execution_config 超过限制（agent/benchmark 数量）

---

## 4. 前端日志建议

建议在错误日志中至少记录：

- method + path
- query/body（脱敏后）
- HTTP status
- response.code
- response.message
- 当前 `org_id`

---

## 5. 关联文档

- `./ERROR-CODES.md`
- `./FRONTEND-INTEGRATION.md`
- 各模块 `API.md`

更新时间：2026-03-04

