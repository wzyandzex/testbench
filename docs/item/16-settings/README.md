# 系统设置模块（前端）

本模块用于系统运行时配置与观测能力对接，包含：

- 语言配置（`/languages/*`）
- 缓存监控（`/cache/*`）
- Kafka 监控（`/kafka/*`）

- 详细接口文档：`./API.md`
- Redis KPI 分档阈值：`./REDIS-KPI-THRESHOLDS.md`
- 推荐先读：`../00-overview/README.md`

## 前端对接重点

- 若 Kafka 未配置，相关接口会返回 `503` 或空数据。
- 缓存历史接口（`/cache/stats/:prefix/history`）仍为占位；告警接口（`/cache/alerts`）已返回实时阈值告警。
- 语言命令生成接口需要必填 query（`script_path` / `project_path`）。
- 缓存接口新增 `kpi/redis_kpi` 字段，建议做监控卡片并配置阈值分级展示。
- 若只做 KPI 卡片，优先调用轻量接口 `GET /cache/kpi`，减少无效数据拉取。
- 缓存重置类接口（`/cache/stats/reset/*`、`/cache/kpi/reset`）仅 `admin` 可调用。
- 后端阈值配置键：`monitoring.cache_alert_thresholds`（运维说明见 `docs/release/2026-03-05-cache-alert-thresholds-runbook.md`）。

## 文档可信来源

- `internal/api/router/router.go`
- `internal/api/handler/language_handler.go`
- `internal/api/handler/cache_metrics_handler.go`
- `internal/api/handler/kafka_handler.go`
- `internal/application/language/service.go`

更新时间：2026-03-04

