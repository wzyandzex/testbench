# 系统设置 API（前端对接）

Base URL：`/api/v1`
Consumer：
- `user-app`：语言配置、缓存只读监控
- `admin-app`：Kafka 运维、缓存重置类操作

本模块分三类：

1. 语言配置（`/languages/*`，组织上下文业务接口）
2. 缓存监控（`/cache/*`，认证后可访问，部分管理员专属）
3. Kafka 运维（`/kafka/*`，系统管理员专属）

---

## 1. 接口总览

### 1.1 语言配置

| Method | Path | Consumer | 权限 |
|---|---|---|---|
| GET | `/languages` | `user-app` | 认证 + 组织上下文 |
| GET | `/languages/:name` | `user-app` | 认证 + 组织上下文 |
| GET | `/languages/:name/extensions` | `user-app` | 认证 + 组织上下文 |
| POST | `/languages/:name/reload` | `user-app` | 认证 + 组织上下文 |
| GET | `/languages/:name/docker-command` | `user-app` | 认证 + 组织上下文 |
| GET | `/languages/:name/test-command` | `user-app` | 认证 + 组织上下文 |

### 1.2 缓存监控（user-app + admin-app）

| Method | Path | Consumer | 权限 |
|---|---|---|---|
| GET | `/cache/kpi` | `shared` | 认证 |
| POST | `/cache/kpi/reset` | `admin-app` | 系统管理员 |
| GET | `/cache/stats` | `shared` | 认证 |
| GET | `/cache/stats/:prefix` | `shared` | 认证 |
| GET | `/cache/stats/:prefix/topkeys` | `shared` | 认证 |
| GET | `/cache/stats/:prefix/latency` | `shared` | 认证 |
| GET | `/cache/stats/:prefix/history` | `shared` | 认证 |
| POST | `/cache/stats/reset/:prefix` | `admin-app` | 系统管理员 |
| GET | `/cache/alerts` | `shared` | 认证 |
| GET | `/cache/summary` | `shared` | 认证 |

### 1.3 Kafka 运维（admin-app，系统管理员）

| Method | Path | Consumer | 权限 |
|---|---|---|---|
| GET | `/kafka/stats` | `admin-app` | 系统管理员 |
| GET | `/kafka/topics` | `admin-app` | 系统管理员 |
| GET | `/kafka/topics/:topic` | `admin-app` | 系统管理员 |
| POST | `/kafka/topics` | `admin-app` | 系统管理员 |
| DELETE | `/kafka/topics/:topic` | `admin-app` | 系统管理员 |
| GET | `/kafka/producers` | `admin-app` | 系统管理员 |
| GET | `/kafka/consumers` | `admin-app` | 系统管理员 |
| GET | `/kafka/health` | `admin-app` | 系统管理员 |

非系统管理员访问 Kafka 接口统一返回 `403001`。

---

## 2. 关键对接说明

### 2.1 语言命令接口

`GET /languages/:name/docker-command` 必填 query：`script_path`  
`GET /languages/:name/test-command` 必填 query：`project_path`

### 2.2 缓存 KPI

`GET /cache/kpi` 返回 Redis 关键指标快照，适合 10~30 秒轮询做看板卡片。

核心字段示例：

- `rate_limit_allowed_total`
- `rate_limit_throttled_total`
- `idempotency_reuse_total`
- `bloom_warmup_runs_total`
- `bloom_warmup_last_duration_ms`
- `bloom_warmup_last_completed_at`

### 2.3 汇总接口

`GET /cache/summary` 返回总览统计并包含 `redis_kpi`，可作为监控页首屏接口。

### 2.4 告警接口（实时阈值判定）

`GET /cache/alerts` 支持 query：
- `level=warning|critical`（可选）
- `limit`（可选，默认 50）

返回结构：
- `data.data[]`：告警列表
- `data.count`：条目数

后端阈值来源：`monitoring.cache_alert_thresholds`，按 prefix 匹配并支持 `default` 回退。  
推荐生产阈值与运维操作见：`docs/release/2026-03-05-cache-alert-thresholds-runbook.md`

### 2.5 Kafka Topic 创建

`POST /kafka/topics`

```json
{
  "name": "my-topic",
  "partitions": 3,
  "replication": 1
}
```

- `name` 必填
- `partitions` 缺省默认 3
- `replication` 缺省默认 1

---

## 3. 前端最小对接流程

1. 用户端先接语言配置 + 缓存只读接口（`/languages/*`、`/cache/*` 只读）。
2. 管理端补 Kafka 运维接口（`/kafka/*`）和缓存重置操作。
3. 管理端执行写操作后统一回源刷新对应列表或统计卡片。
4. 缓存监控页面建议 10~30 秒轮询一次，避免高频压测后端。

---

## 4. 页面字段映射（接口 -> UI）

| 页面 | UI 字段 | 接口字段 | 备注 |
|---|---|---|---|
| 语言列表 | 语言名称 | `data[].name` | 由 `GET /languages` 提供 |
| 语言详情 | 扩展名列表 | `data.extensions` | `GET /languages/:name/extensions` |
| 缓存总览 | 告警数 | `GET /cache/alerts -> data.count` | 顶部告警角标 |
| 缓存总览 | KPI 卡片 | `GET /cache/kpi` 各指标字段 | 建议带单位 |
| Kafka Topic 列表 | Topic 名称 | `GET /kafka/topics` 返回条目 | 仅 admin-app |
| Kafka Topic 详情 | 分区/副本 | `GET /kafka/topics/:topic` | 仅 admin-app |

---

## 5. 页面接口调用时序（建议）

1. 设置首页（user-app）：
并行请求 `GET /languages` + `GET /cache/summary` + `GET /cache/alerts`。
2. 语言详情页：
`GET /languages/:name` -> `GET /languages/:name/extensions`，命令类接口按按钮触发。
3. 缓存看板：
首屏 `GET /cache/summary` + `GET /cache/kpi`，之后按固定间隔轮询。
4. Kafka 管理页（admin-app）：
`GET /kafka/stats` + `GET /kafka/topics`，创建/删除后回源刷新 `GET /kafka/topics`。
5. 缓存重置操作（admin-app）：
`POST /cache/kpi/reset` 或 `POST /cache/stats/reset/:prefix` -> 成功后刷新 KPI/统计。

---

## 6. 前端联调检查清单

1. user-app 不展示 Kafka 管理入口，admin-app 才显示 `/kafka/*`。
2. 管理端对写操作（Topic 创建/删除、缓存 reset）必须加二次确认。
3. 对 `/languages/:name/docker-command` 与 `/languages/:name/test-command` 必填 query 做前端校验。
4. `403001` 统一提示“无系统管理权限”，并收敛到只读模式。
5. 缓存看板轮询间隔需可配置，避免环境差异导致请求过密。

---

## 7. 通用错误处理与排错

| code | 场景 | 前端处理 |
|---|---|---|
| `400` | 必填 query/body 缺失 | 表单就地提示并阻止提交 |
| `403001` | 非系统管理员访问管理员接口 | 提示无权限并隐藏入口 |
| `404` | 语言/Topic/前缀不存在 | 显示“资源不存在”，并提供返回列表 |
| `503` | Kafka 不可用 | 提示依赖故障，允许稍后重试 |
| `500` | 内部错误 | 保留当前上下文并允许重试 |

---

## 8. 字段级契约（深度版）

### A. 语言接口字段

`GET /languages/:name/docker-command` query：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `script_path` | string | 是 | 脚本路径 |

`GET /languages/:name/test-command` query：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `project_path` | string | 是 | 工程路径 |

### B. 缓存监控接口字段

`GET /cache/alerts` query：

| 参数 | 类型 | 必填 | 默认值 | 约束 |
|---|---|---|---|---|
| `level` | string | 否 | 空 | `warning/critical` |
| `limit` | int | 否 | 50 | >0 |

响应核心：

| 字段 | 类型 | 必有 | 说明 |
|---|---|---|---|
| `data.data[]` | array | 是 | 告警列表 |
| `data.count` | int | 是 | 告警数量 |

`POST /cache/stats/reset/:prefix`：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `prefix` | string | 是 | 统计前缀 |

### C. Kafka 管理接口字段

`POST /kafka/topics` 请求体：

| 字段 | 类型 | 必填 | 可空 | 默认值 | 约束 |
|---|---|---|---|---|---|
| `name` | string | 是 | 否 | - | 非空 topic 名 |
| `partitions` | int | 否 | 是 | 3 | >0 |
| `replication` | int | 否 | 是 | 1 | >0 |

`DELETE /kafka/topics/:topic`：

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| `topic` | string | 是 | topic 名称 |

## 9. 状态机与终态语义（深度版）

### A. 设置页数据状态机

`idle -> loading -> success|empty|error`

前端建议：
1. 语言、缓存、Kafka 三个分区各自维护独立加载状态。
2. 管理操作失败不应影响只读监控区渲染。

### B. Kafka 管理操作状态

`idle -> submitting -> success|error`

规则：
1. 创建/删除 topic 成功后立即回源 `GET /kafka/topics`。
2. 403 场景回落只读或引导退出管理端。

## 10. 页面级验收清单（新增）

1. user-app 不显示 Kafka 管理入口，admin-app 才显示写操作按钮。  
2. 缓存只读接口可稳定轮询，重置接口不会被普通用户误触发。  
3. 语言命令接口缺 query 参数时在前端阻止提交。  
4. Kafka 创建/删除后列表与统计视图能正确回流刷新。  
5. `403001`、`503`、`500` 三类错误有区分文案。  
6. 告警页能按 `level/limit` 正确过滤并展示总数。  

---

## 11. 可信来源

- `internal/api/router/router.go`
- `internal/api/handler/language_handler.go`
- `internal/api/handler/cache_metrics_handler.go`
- `internal/api/handler/kafka_handler.go`

更新时间：2026-03-05

