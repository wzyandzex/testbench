# Redis KPI 阈值建议（前端监控看板）

适用对象：前端监控页面、后端运维、SRE 值班。  
指标来源：

- 业务接口：`GET /api/v1/cache/kpi`、`GET /api/v1/cache/summary`
- 观测指标：`/metrics`（Prometheus）

---

## 1. 重点关注指标

1. 缓存命中率：`hit / (hit + miss)`
2. 限流拦截量：`rate_limit_throttled_total` 增速
3. 幂等复用结构：`idempotency_reuse_cache_total` vs `idempotency_reuse_db_total`
4. Bloom warmup 健康度：
   - `bloom_warmup_error_total`
   - `bloom_warmup_last_duration_ms`

---

## 2. 分档阈值建议

说明：以下为上线初期建议值，建议上线后 1~2 周按真实流量回归校准。

### 2.1 低流量（< 100 RPS）

| 指标 | 绿色 | 黄色 | 红色 |
|---|---|---|---|
| 缓存命中率 | >= 85% | 70%~85% | < 70% |
| 10 分钟限流拦截增量 | <= 20 | 20~100 | > 100 |
| 30 分钟 warmup 错误增量 | 0 | 1~5 | > 5 |
| warmup 最近耗时 | < 2000ms | 2000~5000ms | > 5000ms |

### 2.2 中流量（100~500 RPS）

| 指标 | 绿色 | 黄色 | 红色 |
|---|---|---|---|
| 缓存命中率 | >= 90% | 80%~90% | < 80% |
| 10 分钟限流拦截增量 | <= 100 | 100~500 | > 500 |
| 30 分钟 warmup 错误增量 | 0 | 1~20 | > 20 |
| warmup 最近耗时 | < 3000ms | 3000~8000ms | > 8000ms |

### 2.3 高流量（> 500 RPS）

| 指标 | 绿色 | 黄色 | 红色 |
|---|---|---|---|
| 缓存命中率 | >= 92% | 85%~92% | < 85% |
| 10 分钟限流拦截增量 | <= 500 | 500~2000 | > 2000 |
| 30 分钟 warmup 错误增量 | 0 | 1~50 | > 50 |
| warmup 最近耗时 | < 5000ms | 5000~12000ms | > 12000ms |

---

## 3. 幂等复用诊断建议

建议关注比值：

- `idempotency_reuse_cache_total / idempotency_reuse_total`
- `idempotency_reuse_db_total / idempotency_reuse_total`

经验目标：

1. 正常应以 cache 复用为主。
2. 若 DB 复用占比长期偏高（例如 > 40%），优先排查：
   - 缓存 TTL 是否过短
   - key 设计是否不稳定
   - 缓存写入是否失败

---

## 4. 前端看板展示建议

1. 卡片层：展示当前值 + 5/10/30 分钟环比（上升/下降）。
2. 趋势层：命中率、限流拦截、warmup 错误折线图。
3. 状态层：绿/黄/红统一阈值映射。
4. 排障层：每个卡片挂“排障说明”链接到 `TROUBLESHOOTING.md`。

---

## 5. 告警落地建议（Prometheus）

建议至少启用以下告警：

1. Redis 限流拦截突增（10 分钟窗口）
2. Redis 缓存命中率持续下降（10~30 分钟窗口）
3. Bloom warmup 错误持续增长（30 分钟窗口）

更新时间：2026-03-04
