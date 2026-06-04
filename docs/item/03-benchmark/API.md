# Benchmark API（前端对接）

Base URL：`/api/v1`  
鉴权：全部需要 `Authorization: Bearer <token>`  
组织上下文：必须带 `X-Org-ID`  
Consumer：`user-app`（含组织管理员操作；系统管理员可在用户端以高权限角色使用）

---

## 1. 接口总览

| Method | Path | Consumer | 说明 |
|---|---|---|---|
| GET | `/benchmarks` | `user-app` | 列表（分页） |
| POST | `/benchmarks` | `user-app` | 创建 |
| GET | `/benchmarks/:id` | `user-app` | 详情 |
| PUT | `/benchmarks/:id` | `user-app` | 更新 |
| DELETE | `/benchmarks/:id` | `user-app` | 删除 |
| GET | `/benchmarks/:id/stats` | `user-app` | 统计 |
| PATCH | `/benchmarks/:id/status` | `user-app` | 审批通过/拒绝 |
| GET | `/benchmarks/:id/quality/latest` | `user-app` | 最新质量报告 |
| GET | `/benchmarks/:id/quality/history` | `user-app` | 质量报告历史（分页） |
| POST | `/benchmarks/:id/quality/recheck` | `user-app` | 触发质量复检（支持 hard gate / llm / all） |
| POST | `/benchmarks/:id/quality/llm-checks` | `user-app` | 触发 LLM 增强检测（异步） |
| GET | `/benchmarks/:id/quality/llm-checks` | `user-app` | 查询 LLM 检测任务列表（分页/状态过滤） |
| GET | `/benchmarks/:id/quality/llm-checks/summary` | `user-app` | 查询 LLM 检测任务状态聚合统计（看板卡片） |
| POST | `/benchmarks/:id/quality/override` | `user-app` | 创建 LLM 发布门禁豁免（组织管理员） |
| GET | `/benchmarks/:id/quality/overrides` | `user-app` | LLM 发布门禁豁免列表（组织管理员） |
| POST | `/benchmarks/:id/quality/override/:override_id/revoke` | `user-app` | 撤销 LLM 发布门禁豁免（组织管理员） |
| GET | `/benchmarks/:id/quality/llm-checks/:job_id` | `user-app` | 查询 LLM 检测任务状态 |
| POST | `/benchmarks/:id/quality/llm-checks/:job_id/cancel` | `user-app` | 取消 LLM 检测任务（`pending/processing`，processing 为 best-effort） |
| POST | `/benchmarks/:id/quality/llm-checks/:job_id/retry` | `user-app` | 重试失败/取消的 LLM 检测任务 |
| GET | `/benchmarks/:id/quality/cases` | `user-app` | LLM 检测用例级结果（支持过滤/变更视图） |
| GET | `/benchmarks/:id/quality/aggregate/latest` | `user-app` | 最新 LLM 聚合统计 |
| GET | `/benchmarks/:id/quality/diff/latest` | `user-app` | 最近两次 LLM 报告差异 |
| GET | `/benchmarks/:id/quality/diff/history` | `user-app` | LLM 报告差异历史（分页） |
| GET | `/benchmarks/:id/quality/llm-reports/latest` | `user-app` | 最新 LLM 增强检测报告 |
| GET | `/benchmarks/:id/quality/llm-reports/history` | `user-app` | LLM 增强检测报告历史（分页） |
| GET | `/quality/policies/effective` | `user-app` | 当前组织生效质量策略（system/org/request 合并） |
| GET | `/quality/policies/organization` | `user-app` | 当前组织质量基线策略（组织层） |
| PUT | `/quality/policies/organization` | `user-app` | 更新当前组织质量基线策略（组织管理员） |
| GET | `/quality/policies/organization/audits` | `user-app` | 组织质量策略变更审计日志（组织管理员） |
| GET | `/quality/llm/capabilities` | `user-app` | 获取 LLM 检测维度与当前组织可用模型 |
| GET | `/quality/llm/policies/organization` | `user-app` | 当前组织 LLM 检测策略 |
| POST | `/quality/llm/policies/organization/validate` | `user-app` | 校验组织 LLM 检测策略（dry-run，不落库，组织管理员） |
| PUT | `/quality/llm/policies/organization` | `user-app` | 更新当前组织 LLM 检测策略（组织管理员） |
| GET | `/benchmarks/pending` | `user-app` | 待审批列表 |
| POST | `/benchmarks/:id/fork` | `user-app` | Fork 题目 |
| GET | `/benchmarks/:id/forks` | `user-app` | 某题目的 Fork 列表 |
| GET | `/benchmarks/my-forks` | `user-app` | 我的 Fork |
| GET | `/benchmarks/tags` | `user-app` | 标签列表 |
| POST | `/benchmarks/tags` | `user-app` | 创建标签 |
| DELETE | `/benchmarks/tags/:id` | `user-app` | 删除标签 |

---

## 2. 核心请求示例

### 2.1 创建 `POST /benchmarks`

```json
{
  "name": "humaneval_demo",
  "display_name": "HumanEval Demo",
  "description": "demo",
  "type": "code_complete",
  "language": "python",
  "difficulty": "medium",
  "category": "algorithm",
  "tags": ["demo", "python"],
  "source_id": "src-1",
  "source_type": "manual",
  "original_id": "origin-1",
  "url": "https://example.com",
  "config": {},
  "test_config": {}
}
```

约束：

- 必填：`name`、`type`、`language`、`difficulty`
- `status` 为空时默认 `draft`
- 重名返回 `400001`

### 2.2 列表 `GET /benchmarks`

常用 query：

- `name_like`
- `type`
- `language`
- `difficulty`
- `category`
- `status`
- `tags`（可重复）
- `page`、`page_size`

返回结构：

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

### 2.3 审批 `PATCH /benchmarks/:id/status`

```json
{
  "action": "approve",
  "reason": "looks good"
}
```

- `action` 必填：`approve` 或 `reject`
- `action=reject` 时 `reason` 必填，否则返回 `200004`

当审批/激活触发质量门禁失败时，返回 `422`：

```json
{
  "code": 422,
  "message": "quality gate denied reason",
  "data": {
    "stage": "activation",
    "report_id": "uuid",
    "decision": "deny",
    "critical_count": 1,
    "high_count": 0
  }
}
```

### 2.4 质量报告 `GET /benchmarks/:id/quality/latest`

可选 query：
- `stage=import|activation`（不传则取该 benchmark 最新一条）

### 2.5 质量报告历史 `GET /benchmarks/:id/quality/history`

query：
- `page`（默认 1）
- `page_size`（默认 20，最大 100）

### 2.6 生效质量策略 `GET /quality/policies/effective`

可选 query：
- `quality_mode`
- `quality_dimensions`（支持逗号分隔或重复参数）

用途：
- 前端在“导入前”展示本次请求最终会使用的质量策略；
- 返回结构包含 `effective/system_default/organization/request` 四层快照，方便解释为什么会被 gate 拒绝；
- 同时返回 `decision_thresholds` 与 `weights` 快照，便于前端在策略面板直观展示“阻断阈值”和“维度权重开关状态”。

新增返回字段说明：
- `decision_thresholds.deny_min_severity`：当前策略下触发拒绝的最低严重级别（`critical|high`）
- `decision_thresholds.warn_min_severity`：当前策略下触发告警的最低严重级别（当前固定为 `low`）
- `weights`：维度权重快照（当前实现为 0/1，1 表示维度启用，0 表示维度关闭）

### 2.7 组织质量基线策略 `GET/PUT /quality/policies/organization`

`GET`：
- 返回当前组织层策略；若组织未配置，返回默认基线（全维度启用，`block_on_high=true`）。

`PUT`（需组织管理员）请求体示例：

```json
{
  "enable_executability": false,
  "enable_stability": true,
  "enable_compliance": false,
  "block_on_high": false
}
```

约束：
- 强制维度 `enable_schema / enable_semantic / enable_security` 不能被关闭；
- `PUT` 后写入组织层策略，后续所有导入请求都会参与三层合并；
- 请求层仍只能加严，不能降低组织层策略强度。

### 2.8 组织质量策略审计日志 `GET /quality/policies/organization/audits`

query：
- `page`（默认 1）
- `page_size`（默认 20，最大 100）
- `actor_user_id`（可选）
- `action`（可选，当前主要为 `upsert`）
- `created_from`（可选，RFC3339）
- `created_to`（可选，RFC3339）
- `view`（可选，`summary|full`，默认 `full`）

说明：
- `view=summary` 只返回轻量字段（不返回 before/after policy JSON 快照），用于高频列表页，降低响应体和序列化开销；
- `view=full` 返回完整审计记录，适合详情排查。

返回结构为标准分页：
- `data.total`
- `data.page`
- `data.size`
- `data.data[]`（审计记录）

### 2.9 触发质量复检 `POST /benchmarks/:id/quality/recheck`

请求体示例：

```json
{
  "scope": "all",
  "trigger_reason": "manual_review",
  "model": "glm",
  "dimensions": ["semantic_depth", "security_risk"],
  "strict_mode": false,
  "idempotency_key": "recheck-20260306-001"
}
```

说明：

- `scope` 支持：`hard_gate`、`llm`、`all`（默认 `all`）；
- `hard_gate`：仅执行硬门禁复检，结果即时返回；
- `llm`：仅触发 LLM 异步检测，返回 `llm_job`；
- `all`：先执行硬门禁复检，通过后再触发 LLM 检测；
- 若硬门禁拒绝，接口返回 `422` 并带 `report_id/critical_count/high_count`。

### 2.10 触发 LLM 增强检测 `POST /benchmarks/:id/quality/llm-checks`

请求体示例：

```json
{
  "model": "glm",
  "scope": "delta",
  "case_selector": {
    "case_keys": ["case-1001", "case-1002"],
    "max_cases": 200
  },
  "dimensions": ["semantic_depth", "security_risk", "anti_gaming"],
  "strict_mode": false,
  "idempotency_key": "qcheck-20260305-001"
}
```

说明：

- 该接口为**异步接口**，成功返回 `202`，前端拿 `job_id` 轮询任务状态；
- 仅对该 benchmark 有编辑权限的用户可触发；
- `idempotency_key` 建议前端传（防用户重复点击造成重复任务）；
- `model` 需在组织策略白名单内，否则返回错误；
- `scope` 支持：`full|delta`（默认 `full`）；
- `delta` 语义为“优先检测增量范围”，具体增量判定由后端策略决定；
- `dimensions` 可不传，后端默认选择顺序为：
  1) 组织策略 `default_dimensions`；
  2) benchmark 模板维度（按 `source_type`/`type`）；
  3) 平台内置默认维度；
- `case_selector` 为可选对象：
  - `case_keys`：按指定 case key 子集检测；
  - `max_cases`：限制最大检测条数，取值 `0~1000`，`0` 表示不设上限；
  - 当 `case_keys` 数量超过 `max_cases` 时，后端会按顺序截断；
- 当 `scope=delta` 且未传 `case_selector` 时，后端会自动生成增量集合：
  - 优先使用最近一次 LLM 报告中的高风险/变化 case；
  - 若无历史 case，则从当前 benchmark 配置中抽取测试用例（默认最多 200 条）；
- 后端会结合维度成本级别与当日预算余量进行智能采样，预算紧张时自动缩小增量集合；
- 默认建议模式（不直接阻断业务流程），结果用于增强审查。

成功响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "job_id": "job-uuid",
    "status": "pending",
    "created_at": "2026-03-05T12:00:00Z"
  }
}
```

### 2.11 查询 LLM 检测任务列表 `GET /benchmarks/:id/quality/llm-checks`

常用 query：

- `page`（默认 1）
- `page_size`（默认 20，最大 100）
- `status`（可选）：`pending|processing|completed|failed|cancelled|running|terminal`

返回：标准分页结构，`data[]` 元素为任务对象（含 `id/status/model/created_at/completed_at/error_message/report_id` 等字段）。

### 2.11.1 查询 LLM 任务聚合统计 `GET /benchmarks/:id/quality/llm-checks/summary`

返回字段重点：

- `total`：总任务数
- `pending/processing/completed/failed/cancelled`：各状态计数
- `running`：运行中总数（`pending + processing`）
- `terminal`：终态总数（`completed + failed + cancelled`）

### 2.11.2 查询单个 LLM 检测任务 `GET /benchmarks/:id/quality/llm-checks/:job_id`

返回字段重点：

- `status`: `pending|processing|completed|failed|cancelled`
- `error_message`: 失败原因（仅失败场景）
- `report_id`: 完成后可用于关联报告

### 2.12 取消 LLM 检测任务 `POST /benchmarks/:id/quality/llm-checks/:job_id/cancel`

约束：

- 支持取消 `pending` 和 `processing` 状态任务；
- `processing` 取消为 best-effort：若执行已接近完成，可能仍有报告产生，但任务状态会优先保持 `cancelled`；
- `completed/failed/cancelled` 会返回 `409`；
- 需要对 benchmark 具备写权限（与触发检测一致）。

成功响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "id": "job-uuid",
    "status": "cancelled",
    "error_message": "cancelled by user: user-1",
    "completed_at": "2026-03-06T12:10:00Z"
  }
}
```

### 2.12.1 重试 LLM 检测任务 `POST /benchmarks/:id/quality/llm-checks/:job_id/retry`

约束：

- 仅 `failed/cancelled` 任务可重试；
- `pending/processing/completed` 返回 `409`；
- 重试任务会创建新 `job_id`；
- 可选 query：`idempotency_key`（防重复重试创建）。

成功响应示例（HTTP 202）：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "job_id": "new-job-uuid",
    "status": "pending",
    "created_at": "2026-03-06T12:20:00Z"
  }
}
```

### 2.13 LLM 报告接口

- `GET /benchmarks/:id/quality/llm-reports/latest`
- `GET /benchmarks/:id/quality/llm-reports/history?page=1&page_size=20`

报告核心字段：

- `overall_risk`: `critical|high|medium|low|info`
- `score`: 0~100
- `summary`
- `findings[]`: 维度、严重度、证据、建议、置信度
- `token_usage` / `cost_usd` / `latency_ms`

### 2.14 LLM 用例级结果/聚合/差异

1) `GET /benchmarks/:id/quality/cases`

常用 query：
- `report_id`：指定某次报告，不传默认最新
- `risk_gte`：`critical|high|medium|low|info`
- `decision`：`block|warn|pass`
- `dimension`：按维度过滤（如 `semantic_depth`）
- `changed_only`：`true/false`，为 `true` 时仅返回相对上一份报告有变化的 case
- `page`、`page_size`

说明：
- `risk_gte` 与 `decision` 可同时传，按交集过滤；
- `changed_only=true` 时，若无上一份报告，则当前报告全部 case 视为“变化”；
- 返回为标准分页结构（`total/page/size/data[]`）。

2) `GET /benchmarks/:id/quality/aggregate/latest`

返回最新聚合字段（示例）：
- `report_id`
- `total_cases`
- `critical_cases/high_cases/medium_cases/low_cases/info_cases`
- `total_findings`
- `average_score`

3) `GET /benchmarks/:id/quality/diff/latest`

返回最近两次报告差异（示例字段）：
- `current_report_id`、`previous_report_id`
- `current_risk`、`previous_risk`
- `current_decision`、`previous_decision`
- `current_score`、`previous_score`、`score_delta`
- `changed_cases`、`added_cases`、`removed_cases`
- `new_high_risk_cases`、`resolved_high_risk_cases`

4) `GET /benchmarks/:id/quality/diff/history`

query：
- `page`（默认 1）
- `page_size`（默认 20，最大 100）
- `risk_gte`（可选）：`critical|high|medium|low|info`，按 `current_risk` 阈值过滤
- `decision`（可选）：`block|warn|pass`，按 `current_decision` 精确过滤
- `score_delta_abs_gte`（可选）：非负整数，按 `abs(score_delta)` 下限过滤
- `changed_cases_gte`（可选）：非负整数，按 `changed_cases` 下限过滤

说明：
- 所有过滤条件为“交集”关系（AND）；
- `score_delta_abs_gte` 与 `changed_cases_gte` 传入负数或非整数会返回 `400 invalid llm quality query`。

请求示例：

```http
GET /api/v1/benchmarks/bm-1/quality/diff/history?risk_gte=medium&decision=warn&score_delta_abs_gte=10&changed_cases_gte=3&page=1&page_size=20
```

响应示例：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 1,
    "page": 1,
    "size": 20,
    "data": [
      {
        "current_report_id": "r-20260306-02",
        "previous_report_id": "r-20260306-01",
        "current_risk": "medium",
        "previous_risk": "high",
        "current_decision": "warn",
        "previous_decision": "block",
        "current_score": 82,
        "previous_score": 70,
        "score_delta": 12,
        "changed_cases": 3,
        "added_cases": 1,
        "removed_cases": 0,
        "new_high_risk_cases": 0,
        "resolved_high_risk_cases": 1,
        "generated_at": "2026-03-06T12:00:00Z"
      }
    ]
  }
}
```

5) `POST /benchmarks/:id/quality/override`（组织管理员）

请求体示例：

```json
{
  "report_id": "report-uuid",
  "reason": "temporary business hotfix release window",
  "expires_at": "2026-03-10T12:00:00Z"
}
```

说明：
- `reason` 必填；
- `expires_at` 可选（RFC3339），建议总是传，避免长期豁免；
- `report_id` 可选，不传表示对当前 benchmark 创建“全局有效（未过期）”豁免；
- 仅组织管理员可调用；
- 豁免生效后，LLM release-gate 可被绕过（仍保留审计数据）。

6) `GET /benchmarks/:id/quality/overrides`（组织管理员）

query：
- `page`（默认 1）
- `page_size`（默认 20，最大 100）

说明：
- 返回当前 benchmark 的 override 历史（含 `revoked/revoked_by/revoked_at/expires_at`）。

7) `POST /benchmarks/:id/quality/override/:override_id/revoke`（组织管理员）

说明：
- 撤销指定 override；
- 已撤销或不存在返回 404；
- 撤销后 release-gate 将不再使用该 override。

### 2.14 LLM 能力与组织策略

`GET /quality/llm/capabilities`：

- 返回当前可选检测维度（前端用于勾选）
- 返回组织可用模型白名单（前端用于模型下拉）
- 返回 `dimension_catalog` 维度元信息（用于展示复杂度提示与模型要求）
- 返回 `result_post_processor_catalog` 后处理插件目录（用于组织策略编辑页渲染可选项）
- 返回组织策略快照字段：
  - `default_dimensions`
  - `dimension_template_by_source_type`
  - `dimension_template_by_benchmark_type`
- 维度集合是后端可扩展注册的，前端不要硬编码固定维度枚举，应始终以该接口返回为准

`dimension_catalog[]` 字段：
- `name`：维度名称（如 `semantic_depth`）
- `cost_class`：成本等级（`low|medium|high`）
- `latency_class`：时延等级（`fast|medium|slow`）
- `requires_model`：推荐/要求模型列表（可为空；为空表示不限模型）

`result_post_processor_catalog[]` 字段：
- `name`：插件名称（用于 `result_post_processors` / `required_result_post_processors`）
- `active`：当前运行时是否已启用该插件
- `required`：若 `active=true` 时，该插件是否按必选插件执行

`GET /quality/llm/policies/organization`：

- 获取组织 LLM 检测基线策略

`POST /quality/llm/policies/organization/validate`（组织管理员）：

- dry-run 校验策略并返回归一化结果，不写入数据库；
- 请求体与 `PUT /quality/llm/policies/organization` 完全一致；
- 成功返回：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "valid": true,
    "normalized_policy": {
      "organization_id": "org-1"
    }
  }
}
```

- 失败返回 `400 invalid llm quality policy`，并返回结构化错误：

```json
{
  "code": 400,
  "message": "invalid llm quality policy",
  "data": {
    "detail": "invalid llm quality policy: result_post_processors",
    "details": [
      {
        "field": "result_post_processors",
        "code": "invalid_result_post_processors",
        "message": "result_post_processors contains unknown or disallowed processor names"
      }
    ]
  }
}
```

- 字段说明：
  - `data.details[]`：结构化错误明细（前端应优先使用）。
  - `data.detail`：兼容字段（字符串），用于旧前端兜底展示。
- 兼容策略：
  - 当前阶段保留 `detail + details[]` 双轨返回；
  - 前端完成切换并稳定后，再评估下线 `detail` 字符串字段。

`PUT /quality/llm/policies/organization`（组织管理员）请求体示例：

```json
{
  "enabled": true,
  "allowed_models": ["glm", "claude"],
  "default_model": "glm",
  "default_dimensions": ["semantic_depth", "security_risk", "anti_gaming"],
  "dimension_template_by_source_type": {
    "swebench": ["semantic_depth", "anti_gaming", "security_risk"],
    "humaneval": ["oracle_quality", "edge_case_coverage", "reproducibility"]
  },
  "dimension_template_by_benchmark_type": {
    "code_complete": ["oracle_quality", "edge_case_coverage", "reproducibility"]
  },
  "result_post_processors": ["normalize_suggestions", "dedupe_findings"],
  "required_result_post_processors": ["dedupe_findings"],
  "allow_strict_mode": false,
  "daily_budget_usd": 30,
  "daily_request_limit": 200,
  "concurrent_job_limit": 5,
  "delta_sampling_default_max_cases": 200,
  "delta_sampling_strict_min_cases": 3,
  "delta_sampling_enable_cost_optimization": true,
  "delta_sampling_enable_budget_optimization": true,
  "release_gate_enabled": true,
  "release_gate_block_risk": "high",
  "release_gate_require_fresh_report": true
}
```

策略字段解释：

- `enabled`: 是否启用该组织的 LLM 增强检测
- `allowed_models`: 用户可选模型白名单
- `default_model`: 前端默认选中的模型
- `default_dimensions`: 前端默认勾选维度
- `dimension_template_by_source_type`: 按 `benchmark.source_type` 配置默认维度模板（如 `swebench`）
- `dimension_template_by_benchmark_type`: 按 `benchmark.type` 配置默认维度模板（如 `code_complete`）
- `result_post_processors`: 组织级后处理插件白名单（按名称）
- `required_result_post_processors`: 组织级强制插件（命中失败会将任务标记为失败）
- `allow_strict_mode`: 是否允许用户开启严格模式
- `daily_budget_usd`: 组织每日预算（0 表示不限制）
- `daily_request_limit`: 组织每日请求数（0 表示不限制）
- `concurrent_job_limit`: 组织并发任务上限
- `delta_sampling_default_max_cases`: `scope=delta` 时默认采样上限（范围 `1~5000`，默认 `200`）
- `delta_sampling_strict_min_cases`: `strict_mode=true` 时最小保留 case 数（范围 `1~1000`，默认 `3`）
- `delta_sampling_enable_cost_optimization`: 是否启用基于维度成本等级的采样收缩
- `delta_sampling_enable_budget_optimization`: 是否启用基于组织预算压力的采样收缩
- `release_gate_enabled`: 是否启用“LLM 参与发布/激活阻断”
- `release_gate_block_risk`: 阻断阈值（`critical|high|medium|low|info`）
- `release_gate_require_fresh_report`: 启用阻断时，是否要求必须存在最新 LLM 报告

补充约定：

- `PUT /quality/llm/policies/organization` 为部分更新，未传字段保持当前值不变。
- `default_dimensions` 支持显式清空：传 `[]` 表示取消组织级默认维度覆盖（回落到模板/系统默认链路）。
- `result_post_processors` / `required_result_post_processors` 支持显式清空：传 `[]` 表示取消组织级覆盖。
- 插件名大小写不敏感，`cfg:` 前缀可省略（后端会归一化为小写名称）。
- 传入未知插件名会返回 `400 invalid llm quality policy`。
- 当 `result_post_processors` 非空时，`required_result_post_processors` 必须是其子集。
- 若传入非法范围（例如 `delta_sampling_default_max_cases=0`），返回 `400 invalid llm quality policy`。
- 模板维度必须是当前后端可识别的维度名（含扩展维度）；未知维度会返回 `400 invalid llm quality policy`。
- 检测触发时若请求未传 `dimensions`，后端默认选择顺序为：
  1) `default_dimensions`；
  2) 组织模板（`dimension_template_by_source_type` / `dimension_template_by_benchmark_type`）；
  3) 系统运行时模板；
  4) 内置默认维度。

---

## 3. 权限与可见性（重点）

### 3.1 读权限

- 系统管理员：可读全部。
- 普通用户：
  - `private`：仅创建者本人可读。
  - `organization`：同组织成员可读。
  - `public`：可读。

部分读接口对越权会返回 `404001`（隐藏资源存在性）。

### 3.2 写权限（更新）

- 仅创建者可编辑。
- 若资源属于组织，还要求该用户是该组织成员。

### 3.3 删除权限

- 系统管理员可删任意。
- 普通用户遵循“可编辑即可删除”。

### 3.4 审批权限（已按新策略收敛）

- 资源创建者不能审批自己的 benchmark。
- 系统管理员：可审批 `public` 与 `organization` 的 pending 资源。
- 组织管理员：只可审批本组织下 `visibility=organization` 的 pending 资源。
- 组织管理员不能审批 `public` 资源。

### 3.5 待审批列表 `/benchmarks/pending`

- 系统管理员：可看到全部 pending。
- 组织管理员：仅看到当前组织下 `visibility=organization` 的 pending。
- 其他角色：返回空列表。

---

## 4. Fork 相关

| Method | Path | Consumer | 说明 |
|---|---|---|---|
| POST | `/benchmarks/:id/fork` | `user-app` | 基于父 benchmark 创建个人副本 |
| GET | `/benchmarks/:id/forks` | `user-app` | 查看该题目所有 fork |
| GET | `/benchmarks/my-forks` | `user-app` | 查看我 fork 的题目 |

常见错误：

- `200005`：重复 fork 或 fork 失败
- `404001`：父资源不存在或不可读

---

## 5. 常见错误码

| code | 含义 |
|---|---|
| `400001` | benchmark 名称冲突 |
| `404001` | benchmark 不存在（或越权隐藏） |
| `404002` | 标签不存在 |
| `200002` | benchmark 不在待审批状态 |
| `200003` | 无审批权限 |
| `200004` | 拒绝审批未提供 reason |
| `200005` | fork 失败或重复 fork |
| `403` | 组织未启用 LLM 检测 |
| `429` | LLM 检测并发/预算/日请求限制触发 |
| `501` | 审批/Fork 服务未启用 |
| `422` | 质量门禁拒绝（激活/审批被阻断） |

---

## 6. 前端最小对接流程

1. 先接列表 + 详情 + 创建/编辑/删除。
2. 再补审批页（pending 列表 + approve/reject）。
3. 再补 LLM 增强检测（触发 + 任务状态 + 报告）。
4. 最后补 fork 与标签管理。

---

## 7. 页面字段映射（接口 -> UI）

| 页面 | UI 字段 | 接口字段 | 备注 |
|---|---|---|---|
| Benchmark 列表 | 名称 | `data.data[].name` | 主标题 |
| Benchmark 列表 | 状态 | `data.data[].status` | `draft/pending/approved/rejected` |
| Benchmark 列表 | 可见性 | `data.data[].visibility` | `private/organization/public` |
| Benchmark 详情 | 基本信息卡片 | `GET /benchmarks/:id` 返回对象 | 建议分组渲染 |
| 审批页 | 待审批列表 | `GET /benchmarks/pending` | 数据按角色过滤 |
| 质量报告页 | 风险级别 | `overall_risk` | 用颜色分层 |
| 质量报告页 | 评分 | `score` | 0~100 |
| LLM 检测任务 | 任务状态 | `status` | `pending/processing/completed/failed/cancelled` |

---

## 8. 页面接口调用时序（建议）

1. 列表页加载：
`GET /benchmarks` -> 渲染列表 -> 用户点击行进入详情。
2. 详情页加载：
`GET /benchmarks/:id` 并行 `GET /benchmarks/:id/stats`，质量卡片懒加载 `GET /benchmarks/:id/quality/latest`。
3. 审批页：
`GET /benchmarks/pending` -> `PATCH /benchmarks/:id/status` -> 成功后回源刷新 `GET /benchmarks/pending`。
4. LLM 增强检测：
`POST /benchmarks/:id/quality/llm-checks` -> 拿 `job_id` 轮询 `GET /benchmarks/:id/quality/llm-checks/:job_id` -> 失败/取消时可 `POST /benchmarks/:id/quality/llm-checks/:job_id/retry` -> 完成后拉 `GET /benchmarks/:id/quality/llm-reports/latest`。
5. 标签管理：
`GET /benchmarks/tags` -> `POST/DELETE /benchmarks/tags*` -> 操作后刷新标签列表。

---

## 9. 前端联调检查清单

1. 全部请求带 `Authorization` 和 `X-Org-ID`。
2. 审批弹窗里 `reject` 必须强制填写 reason。
3. 列表分页按 `data.total/page/size/data` 解析。
4. 对 `404001` 统一展示“资源不存在或无访问权限”。
5. LLM 检测触发时前端传 `idempotency_key`，避免重复点击产生重复任务。
6. `422`（质量门禁拒绝）必须展示 `data.stage` 与统计信息，避免用户误判为系统故障。

---

## 10. 通用错误处理与排错

1. `HTTP 2xx && code!=0` 也按失败处理，禁止仅凭 HTTP 成功判断业务成功。
2. `404001` 统一提示“资源不存在或无访问权限”，不要区分越权与真实不存在。
3. `403001` 出现在管理员动作时，前端除提示外应回收对应入口显隐状态。
4. `429`（LLM 检测预算/并发限制）建议展示“稍后重试 + 当前组织策略限制说明”。
5. `422`（质量门禁）建议在页面展示“阻断原因 + 修复建议”，并提供重新检测入口。

---

## 11. 字段级契约（深度版）

### A. 创建 Benchmark `POST /benchmarks`（请求体）

| 字段 | 类型 | 必填 | 可空 | 默认值 | 枚举/约束 | 说明 |
|---|---|---|---|---|---|---|
| `name` | string | 是 | 否 | - | 唯一命名（组织/可见性作用域冲突规则） | 机器可读名 |
| `display_name` | string | 否 | 是 | 后端默认 | <=255 | 展示名 |
| `description` | string | 否 | 是 | 空 | <=2000（建议） | 描述 |
| `type` | string | 是 | 否 | - | `code_complete/...` | Benchmark 类型 |
| `language` | string | 是 | 否 | - | 语言枚举由后端支持集决定 | 主语言 |
| `difficulty` | string | 是 | 否 | - | `easy/medium/hard`（常见） | 难度 |
| `category` | string | 否 | 是 | 空 | 业务分类 | 分类 |
| `tags` | string[] | 否 | 是 | 空数组 | 标签名数组 | 标签 |
| `source_id` | string | 否 | 是 | 空 | - | 来源标识 |
| `source_type` | string | 否 | 是 | `manual` | 源类型枚举 | 来源类型 |
| `original_id` | string | 否 | 是 | 空 | - | 上游原始 ID |
| `url` | string | 否 | 是 | 空 | URL | 来源链接 |
| `config` | object | 否 | 是 | `{}` | - | 业务配置 |
| `test_config` | object | 否 | 是 | `{}` | - | 测试配置 |

### B. 列表 `GET /benchmarks`（query）

| 参数 | 类型 | 必填 | 默认值 | 约束 | 说明 |
|---|---|---|---|---|---|
| `name_like` | string | 否 | 空 | - | 名称模糊匹配 |
| `type` | string | 否 | 空 | - | 类型过滤 |
| `language` | string | 否 | 空 | - | 语言过滤 |
| `difficulty` | string | 否 | 空 | - | 难度过滤 |
| `category` | string | 否 | 空 | - | 分类过滤 |
| `status` | string | 否 | 空 | - | 状态过滤 |
| `tags` | string[] | 否 | 空 | 可重复传参 | 标签过滤 |
| `page` | int | 否 | 1 | >=1 | 分页页码 |
| `page_size` | int | 否 | 20 | 建议 <=100 | 分页大小 |

### C. 审批 `PATCH /benchmarks/:id/status`（请求体 + 错误体）

请求体：

| 字段 | 类型 | 必填 | 可空 | 默认值 | 枚举/约束 | 说明 |
|---|---|---|---|---|---|---|
| `action` | string | 是 | 否 | - | `approve/reject` | 审批动作 |
| `reason` | string | 条件必填 | 是 | 空 | `reject` 时必填 | 审批原因 |

质量门禁拒绝错误体（HTTP 422）：

| 字段 | 类型 | 必有 | 说明 |
|---|---|---|---|
| `data.stage` | string | 是 | `import/activation` |
| `data.report_id` | string | 是 | 关联报告 ID |
| `data.decision` | string | 是 | 通常为 `deny` |
| `data.critical_count` | int | 否 | 严重问题数 |
| `data.high_count` | int | 否 | 高危问题数 |

### D. 触发 LLM 检测 `POST /benchmarks/:id/quality/llm-checks`

| 字段 | 类型 | 必填 | 可空 | 默认值 | 枚举/约束 | 说明 |
|---|---|---|---|---|---|---|
| `model` | string | 否 | 是 | 组织默认模型 | 需在组织白名单内 | 使用模型 |
| `scope` | string | 否 | 是 | `full` | `full/delta` | 检测范围；`delta` 未传 `case_selector` 时后端自动选增量 case |
| `case_selector.case_keys` | string[] | 否 | 是 | 空 | 去重后生效 | 指定 case 子集 |
| `case_selector.max_cases` | int | 否 | 是 | `0` | `0~1000` | 最大检测条数，0=不限制 |
| `dimensions` | string[] | 否 | 是 | 组织默认维度 | 来自 capabilities | 检测维度 |
| `strict_mode` | bool | 否 | 是 | false | 受组织策略约束 | 严格模式 |
| `idempotency_key` | string | 强烈建议 | 是 | 空 | 建议唯一 | 幂等防重 |

成功响应（HTTP 202）：

| 字段 | 类型 | 必有 | 说明 |
|---|---|---|---|
| `data.job_id` | string | 是 | 任务标识 |
| `data.status` | string | 是 | 初始状态 |
| `data.created_at` | string | 是 | RFC3339 时间 |

### E. 查询 LLM 任务列表 `GET /benchmarks/:id/quality/llm-checks`

| 字段 | 类型 | 必有 | 枚举/约束 | 说明 |
|---|---|---|---|---|
| `id` | string | 是 | - | 任务 ID |
| `status` | string | 是 | `pending/processing/completed/failed/cancelled` | 任务状态 |
| `model` | string | 是 | - | 模型标识 |
| `created_at` | string | 是 | RFC3339 | 创建时间 |
| `completed_at` | string | 否 | RFC3339 | 完成/取消时间 |

说明：

- 支持 `status` 过滤：
  - 具体状态：`pending|processing|completed|failed|cancelled`
  - 聚合别名：`running`（`pending+processing`）、`terminal`（`completed+failed+cancelled`）
- 返回结构为标准分页格式。

### E.1 查询 LLM 任务聚合统计 `GET /benchmarks/:id/quality/llm-checks/summary`

| 字段 | 类型 | 必有 | 说明 |
|---|---|---|---|
| `total` | int | 是 | 总任务数 |
| `pending` | int | 是 | 等待执行任务数 |
| `processing` | int | 是 | 执行中任务数 |
| `completed` | int | 是 | 执行成功任务数 |
| `failed` | int | 是 | 执行失败任务数 |
| `cancelled` | int | 是 | 已取消任务数 |
| `running` | int | 是 | 运行中总数（`pending + processing`） |
| `terminal` | int | 是 | 终态总数（`completed + failed + cancelled`） |

### E.2 查询单个 LLM 任务 `GET /benchmarks/:id/quality/llm-checks/:job_id`

| 字段 | 类型 | 必有 | 枚举/约束 | 说明 |
|---|---|---|---|---|
| `status` | string | 是 | `pending/processing/completed/failed/cancelled` | 任务状态 |
| `error_message` | string | 否 | failed 时常见 | 错误说明 |
| `report_id` | string | 否 | completed 时常见 | 关联报告 |

### F. 取消 LLM 任务 `POST /benchmarks/:id/quality/llm-checks/:job_id/cancel`

成功响应（HTTP 200）：

| 字段 | 类型 | 必有 | 说明 |
|---|---|---|---|
| `data.id` | string | 是 | 任务 ID |
| `data.status` | string | 是 | 固定为 `cancelled` |
| `data.completed_at` | string | 是 | 取消时间（RFC3339） |
| `data.error_message` | string | 否 | 取消说明（含操作者） |

错误语义：

- `404`：任务不存在或不在当前组织/benchmark 作用域；
- `409`：任务当前不可取消（`completed/failed/cancelled`）；
- `400`：请求参数不合法。

### G. 重试 LLM 任务 `POST /benchmarks/:id/quality/llm-checks/:job_id/retry`

可选 query：

- `idempotency_key`：幂等键，防止重复点击创建多个重试任务。

成功响应（HTTP 202）：

| 字段 | 类型 | 必有 | 说明 |
|---|---|---|---|
| `data.job_id` | string | 是 | 新任务 ID |
| `data.status` | string | 是 | 初始为 `pending` |
| `data.created_at` | string | 是 | RFC3339 时间 |

错误语义：

- `404`：原任务不存在或不在当前组织/benchmark 作用域；
- `409`：原任务当前不可重试（非 `failed/cancelled`）；
- `400`：请求参数不合法。

## 12. 状态机与终态语义（深度版）

### A. Benchmark 审批状态机（页面语义）

`draft -> pending -> approved|rejected`

补充规则：
1. 创建者不能审批自己创建的 benchmark。
2. org-admin 仅能审批本组织 `visibility=organization` 的 pending。
3. sys-admin 可审批 `public/organization` 的 pending。

### B. LLM 检测任务状态机

`pending -> processing -> completed|failed|cancelled`

前端行为：
1. `pending/processing`：轮询 + 禁用重复触发按钮（同一 `idempotency_key`）。
2. `completed`：拉取 latest report 并展示 findings。
3. `failed`：显示 `error_message`，允许重试。
4. `cancelled`：终态，停止轮询。

## 13. 页面级验收清单（新增）

1. 创建页提交必填字段校验：`name/type/language/difficulty`。
2. 审批 reject 时前端强制填写 `reason`，否则禁止提交。
3. `PATCH status` 命中 `422` 时能展示 stage 与计数，不当作系统崩溃。
4. LLM 检测支持幂等：重复点击不会创建多条重复任务。
5. 详情页能正确区分“任务进行中”和“已有最新报告”两种状态。
6. 权限显隐与后端一致：org-admin 不显示 public 审批操作。
7. 质量分析页支持三层展示：case 列表（可筛选）+ aggregate 卡片 + diff 变化卡片。

---

## 14. 可信来源

- `internal/api/router/router.go`
- `internal/api/handler/benchmark_handler.go`
- `internal/application/benchmark/visibility_service.go`
- `internal/application/benchmark/approval_service.go`

更新时间：2026-03-06



