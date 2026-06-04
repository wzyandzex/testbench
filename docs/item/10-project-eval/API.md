# Project Evaluation API（前端对接）

Base URL: `/api/v1`  
Consumer：`user-app`

鉴权要求：所有接口都需要 `Authorization` + `X-Org-ID`。

---

## 1. 接口总览

| Method | Path | Consumer | 说明 |
|---|---|---|---|
| POST | `/project-evals/sources` | `user-app` | 创建项目源（Git/ZIP） |
| POST | `/project-evals/runs` | `user-app` | 创建评测任务 |
| GET | `/project-evals/capabilities` | `user-app` | 查询评测能力目录 |
| GET | `/project-evals/runs/:id` | `user-app` | 查询任务基础信息 |
| GET | `/project-evals/runs/:id/plan` | `user-app` | 查询任务计划快照 |
| GET | `/project-evals/runs/:id/report` | `user-app` | 查询任务报告快照 |
| GET | `/project-evals/insights/summary` | `user-app` | 查询组织评测汇总洞察 |
| GET | `/project-evals/insights/trends` | `user-app` | 查询组织评测日趋势 |
| GET | `/project-evals/policies/effective` | `user-app` | 查询组织生效策略 |
| POST | `/project-evals/policies/organization/preview` | `user-app` | 预校验组织策略（不落库，组织管理员） |
| PUT | `/project-evals/policies/organization` | `user-app` | 更新组织策略（组织管理员） |

---

## 2. 创建项目源

`POST /project-evals/sources`

请求体：

```json
{
  "name": "my-backend-repo",
  "source_type": "git",
  "git_url": "https://example.com/repo.git",
  "branch": "main",
  "commit_sha": "",
  "zip_object_key": "",
  "project_type": "backend",
  "mode": "advisory",
  "metadata": {
    "languages": ["go"],
    "frameworks": ["gin"],
    "files": ["go.mod", "cmd/main.go"]
  }
}
```

说明：

1. `source_type=git` 时必须传 `git_url`。
2. `source_type=zip` 时必须传 `zip_object_key`。
3. `project_type` 和 `mode` 会作为 hint 写入 metadata，后端用于识别增强。

---

## 3. 创建评测任务

`POST /project-evals/runs`

请求体（全量）：

```json
{
  "source_id": "src_xxx",
  "mode": "advisory",
  "project_type": "backend",
  "scope": "full"
}
```

请求体（增量）：

```json
{
  "source_id": "src_xxx",
  "mode": "strict",
  "scope": "delta",
  "changed_files": [
    "internal/api/handler/user_handler.go",
    "internal/application/auth/service.go"
  ]
}
```

关键约束：

1. `scope=delta` 时，`changed_files` 不能为空，否则返回 `400001`。
2. 可能返回限额错误：
   - `429001`：超出日运行配额
   - `429002`：超出并发配额

---

## 4. 任务查询接口

### 4.1 基础信息

`GET /project-evals/runs/:id`

返回 `status/mode/project_type/score/decision` 等基础字段。

### 4.2 计划快照

`GET /project-evals/runs/:id/plan`

返回结构（示例）：

```json
{
  "run_id": "run_xxx",
  "plan": {
    "template_version": "v1",
    "project_type": "backend",
    "scope": "delta",
    "runner_profile": {
      "template_id": "backend-go-v1",
      "runtime_image": "golang:1.22-alpine"
    },
    "changed_files": [],
    "sampled_files": []
  }
}
```

### 4.3 报告快照

`GET /project-evals/runs/:id/report`

返回结构（示例）：

```json
{
  "run_id": "run_xxx",
  "report": {
    "status": "completed",
    "score": 84.3,
    "decision": "pass",
    "dimensions": {},
    "weights": {},
    "dimension_plugins": {
      "providers": {}
    }
  }
}
```

---

## 4.4 能力目录

`GET /project-evals/capabilities`

用途：

1. 前端动态渲染“可选维度/模式/scope”配置。
2. 展示内置维度与插件维度来源（`builtin|plugin`）。
3. 每个维度包含元信息：`description/cost_class/risk_level/default_weight`。
4. 每个维度返回组织生效态：`enabled/effective_weight`。
5. `active_dimensions` 可直接作为“当前生效维度”列表渲染。

---

## 5. 运营洞察接口

### 5.1 汇总洞察

`GET /project-evals/insights/summary?days=14`

参数：

1. `days` 可选，正整数；不传默认 `14`。
2. `project_type` 可选：`backend|frontend|llm_app|agent|unknown`
3. `scope` 可选：`full|delta`
4. `mode` 可选：`advisory|strict`
5. `source_id` 可选：按项目源过滤
6. `created_by` 可选：按任务创建人过滤
7. `page` 可选：用于趋势分页参数透传，默认 `1`
8. `page_size` 可选：用于趋势分页参数透传，默认 `14`

返回核心字段：

1. `total_runs`
2. `average_score`
3. `status_distribution`
4. `decision_distribution`
5. `type_scope_scores`

### 5.2 趋势洞察

`GET /project-evals/insights/trends?days=14`

支持同样过滤参数：

1. `project_type`
2. `scope`
3. `mode`
4. `source_id`
5. `created_by`
6. `page`
7. `page_size`

返回核心字段：

1. `daily_trends[].run_date`
2. `daily_trends[].total_runs`
3. `daily_trends[].completed_runs`
4. `daily_trends[].average_score`
5. `trend_page`
6. `trend_page_size`
7. `trend_total`

---

## 6. 策略接口

### 6.1 生效策略

`GET /project-evals/policies/effective`

### 6.2 更新组织策略（组织管理员）

`PUT /project-evals/policies/organization`

### 6.2A 预校验组织策略（组织管理员）

`POST /project-evals/policies/organization/preview`

说明：

1. 入参与 `PUT /project-evals/policies/organization` 一致。
2. 不持久化，仅返回“归一化后策略 + 当前能力生效视图”，用于前端“提交前预览”。
3. 返回结构核心字段：
   - `valid`（固定 `true`，表示校验通过）
   - `normalized_policy`
   - `capabilities`
   - `diff`（相对当前生效策略的变化）
4. `diff` 字段说明：
   - `project_types/run_modes/scopes/active_dimensions`：`added[]/removed[]`
   - `dimension_weights[]`：`dimension/before/after`（只返回发生变化的维度）
   - `potential_run_blocks[]`：潜在影响项，字段为 `option_type/value/severity/risk_level/reason/message/suggestion/merged_count`。
     - `severity`：`block|warn`
     - `risk_level`：`high|medium|low`
     - `message`：后端生成的中文提示文案，可直接用于前端弹窗/提示条。
     - `suggestion`：建议动作，前端可直接展示为“修复建议”。
     - `merged_count`：聚合条目数（仅聚合场景出现）。
     - 当前分级规则：
       - `block`：`project_type/run_mode/scope` 被移出允许集合（会导致创建 run 被拒绝）
       - `warn`：维度被移出 active 或维度权重下降（不会阻断 run，但会影响评测覆盖/关注度）
     - 同一维度下多条 `warn` 会被后端聚合为单条摘要，减少前端告警噪音。
   - `summary`：风险摘要统计，字段为：
     - `block_count`
     - `warn_high_count`
     - `warn_medium_count`
     - `warn_low_count`

支持字段：

1. `pass_threshold`
2. `warn_threshold`
3. `strict_block_threshold`
4. `dimension_weights`
5. `max_daily_runs`
6. `max_concurrent_runs`
7. `delta_max_files`
8. `enable_cost_optimize`
9. `enabled_project_types`
10. `enabled_run_modes`
11. `enabled_scopes`
12. `dimension_controls`

`dimension_weights` 说明：

1. key 为维度名，value 为权重（>=0）。
2. 可包含扩展插件维度。
3. 维度显式设为 `0` 表示禁用该维度参与打分。
4. 不允许负值；出现负值会返回 `400001`（`invalid project evaluation policy`）。

`dimension_controls` 说明（组织主观配置）：

1. `enabled`：显式开关维度。
2. `required`：标记为组织要求重点维度（用于前端策略页展示）。
3. `min_weight/max_weight`：限制维度权重范围（0~1）。
4. `display_name/description`：组织自定义展示文案。
5. `min_weight/max_weight` 超出 `[0,1]` 或 `min_weight > max_weight` 会返回 `400001`。

允许集合字段说明（组织治理边界）：

1. `enabled_project_types`：允许创建 run 的项目类型白名单。
2. `enabled_run_modes`：允许创建 run 的模式白名单。
3. `enabled_scopes`：允许创建 run 的 scope 白名单。
4. 任一白名单字段传空数组 `[]` 表示“清空限制，恢复默认全量可选”。
5. 白名单若包含非法枚举值，会返回 `400001`，后端不会静默忽略。

---

## 7. 常见错误

1. `400001`：请求参数错误（如 `scope=delta` 但未传 `changed_files`、`days` 非法）。
2. `404001`：资源不存在或越权（统一隐藏语义）。
3. `409001`：项目源名称冲突。
4. `429001`：日配额超限。
5. `429002`：并发配额超限。

---

## 8. 前端最小对接流程

1. 创建 source：`POST /project-evals/sources`
2. 创建 run：`POST /project-evals/runs`
3. 轮询 run/report：`GET /project-evals/runs/:id` + `/report`
4. 接仪表盘：`/insights/summary` + `/insights/trends`
5. 管理端页（组织管理员）：`/policies/effective` + `/policies/organization`

---

## 文档可信来源

- `internal/api/router/router.go`
- `internal/api/handler/project_eval_handler.go`
- `internal/application/projecteval/service.go`

更新时间：2026-03-09
