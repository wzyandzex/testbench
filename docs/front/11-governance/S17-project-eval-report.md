# S17 - Project Eval 报告+洞察+策略

## Slice 基本信息

| 字段 | 内容 |
|---|---|
| Slice ID | S17 |
| 名称 | Project Eval 报告+洞察+策略 |
| 所属主线 | projecteval |
| 所属模块 | project evaluation report |
| 优先级 | P1 |
| 前置依赖 | S16 |
| 当前状态 | 已完成 |

## 0. 目标

为用户提供组织级项目评测洞察（运行汇总+每日趋势+维度分组）和策略管理（阈值/维度权重/并发限制等），以及单次运行的详细报告+解释视图。

## 1. 为什么先做这个 Slice

1. S16 已完成运行详情页（计划+证据+生命周期），S17 补充组织级视角。
2. Insights 端点提供跨运行的趋势分析，策略端点控制评测行为边界。
3. Run Report/Explain 是单次运行的完整视图，补充 S16 证据页面的信息。

## 2. 后端调研记录

### 2.1 读取的后端代码

| 文件 | 结论 |
|---|---|
| `project_eval_handler.go` L699 | GetRunReport: 返回 RunReportView(score/decision/summary/evidence_summary/mainline/remediation/raw_report) |
| `project_eval_handler.go` L723 | GetRunExplain: 返回 RunExplainView(含 case_selections[]，每项含 evidence + binding) |
| `project_eval_handler.go` L765 | GetRunInsightsSummary: query(days/project_type/scope/mode/source_id/created_by)，返回组织级汇总 |
| `project_eval_handler.go` L827 | GetRunInsightsTrends: 同 query，返回 daily_trends[] |
| `project_eval_handler.go` L747 | GetEffectivePolicy: 返回 domain.Policy(15 字段) |
| `project_eval_handler.go` L943 | PreviewOrganizationPolicy: org-admin，请求体=upsertProjectEvalPolicyRequest，返回 PolicyPreview(valid/diff/capabilities) |
| `project_eval_handler.go` L893 | UpsertOrganizationPolicy: org-admin，同请求体，返回 Policy |
| `views.go` L53-73 | RunReportView: 17 字段 |
| `views.go` L75-138 | RunExplainView: 24 字段 + RunExplainCaseSelectionView(19 字段) + RunExplainBindingView(7 字段) |
| `model.go` L273-321 | RunTypeScopeScore(4 字段) / RunDailyTrend(30 字段) / RunInsightsFilter(5 字段) |
| `capabilities_types.go` | PolicyPreview / PolicyPreviewDiff / PreviewSetDiff / PreviewDimensionWeightChange / PreviewRunOptionBlock / PolicyPreviewSummary / DimensionControlInput |
| `model.go` L379-397 | Policy: 15 字段(pass_threshold/warn_threshold/strict_block_threshold/dimension_weights/max_daily_runs/max_concurrent_runs/delta_max_files/enable_cost_optimize/enabled_project_types/enabled_run_modes/enabled_scopes/dimension_controls) |

### 2.2 关键业务结论

1. **Run Report vs Explain**: Report 是只读汇总; Explain 额外包含 case_selections(每项含 evidence + binding)，数据更丰富。
2. **Insights 两个端点**: Summary 返回组织级统计汇总; Trends 返回 daily_trends[] 时间序列。
3. **Insights Filter**: 支持 days(1-90)/project_type/scope/mode/source_id/created_by 筛选。
4. **Policy**: 15 字段，其中 dimension_weights/enabled_project_types/enabled_run_modes/enabled_scopes/dimension_controls 是 raw JSON。
5. **Policy Preview**: org-admin 修改前可预览差异(added/removed sets + dimension weight changes + potential blocks)。
6. **Policy 编辑权限**: Preview + Upsert 均需 org-admin。

## 3. API 合同

### 3.1 接口列表

| # | 方法 | 路径 | 用途 | 权限 |
|---|---|---|---|---|
| 1 | GET | `/api/v1/project-evals/runs/:id/report` | Run 报告 | auth+org |
| 2 | GET | `/api/v1/project-evals/runs/:id/explain` | Run 解释(含 case selections) | auth+org |
| 3 | GET | `/api/v1/project-evals/insights/summary` | 组织洞察汇总 | auth+org |
| 4 | GET | `/api/v1/project-evals/insights/trends` | 组织洞察趋势 | auth+org |
| 5 | GET | `/api/v1/project-evals/policies/effective` | 有效策略 | auth+org |
| 6 | POST | `/api/v1/project-evals/policies/organization/preview` | 预览策略变更 | auth+org+admin |
| 7 | PUT | `/api/v1/project-evals/policies/organization` | 更新策略 | auth+org+admin |

### 3.2 请求参数

**Insights query**: `days`(1-90), `project_type`, `scope`, `mode`, `source_id`, `created_by`

**Policy Upsert/Preview body**:
```json
{
  "pass_threshold": 60.0,
  "warn_threshold": 40.0,
  "strict_block_threshold": 30.0,
  "dimension_weights": { "functionality": 0.3 },
  "max_daily_runs": 10,
  "max_concurrent_runs": 3,
  "delta_max_files": 50,
  "enable_cost_optimize": true,
  "enabled_project_types": ["backend", "frontend"],
  "enabled_run_modes": ["advisory", "strict"],
  "enabled_scopes": ["full", "delta"],
  "dimension_controls": { "functionality": { "enabled": true, "required": true, "min_weight": 0.1 } }
}
```

### 3.3 响应结构

**RunReportView**: `{ run_id, status, score, decision, summary, score_mode, result_class, truth_mode, processor_profile, outcome_authority_source, authoritative_truth, legacy_fallback_used, legacy_fallback_reason, selected_case_count, case_selection_summary, evidence_summary, mainline, remediation, report }`

**RunExplainView**: `{ run_id, organization_id, source_id, status, mode, project_type, plan_version, approved, approved_by, approved_at, approved_plan_version, score, decision, score_mode, result_class, truth_mode, processor_profile, outcome_authority_source, authoritative_truth, legacy_fallback_used, legacy_fallback_reason, selected_case_count, evaluated_case_count, case_selection_summary, evidence_summary, mainline, remediation, case_selections[RunExplainCaseSelectionView] }`

**RunExplainCaseSelectionView**: `{ selection_record_id, benchmark_id, case_key, case_asset_id, case_asset_version_id, selection_status, selection_reason, selection_rank, match_score, evidence_available, evidence_record_id, fusion_report_id, fusion_case_report_id, final_decision, final_risk_level, final_score, confidence, evidence_completeness, insufficient_evidence, binding, evidence }`

**Insights Summary**: `{ organization_id, window_days, since, generated_at, filter, total_runs, average_score, status_distribution, decision_distribution, score_mode_distribution, evidence_backed_runs, legacy_fallback_runs, compatibility_reason_distribution, linked_repair_runs, replay_*_runs, remediation_*_runs, selected_cases, evaluated_cases, pass/warn/block/insufficient_cases, average_confidence, average_coverage_score, type_scope_scores[] }`

**Daily Trend**: `{ run_date, total_runs, completed_runs, average_score, authoritative_runs, compatibility_runs, authoritative_average_score, compatibility_average_score, evidence_backed_runs, legacy_fallback_runs, linked_repair_runs, replay_*_runs, remediation_*_runs, selected/evaluated/pass/warn/block/insufficient_cases, average_confidence, average_coverage_score }`

**Policy**: `{ id, organization_id, pass_threshold, warn_threshold, strict_block_threshold, dimension_weights, max_daily_runs, max_concurrent_runs, delta_max_files, enable_cost_optimize, enabled_project_types, enabled_run_modes, enabled_scopes, dimension_controls, updated_by, created_at, updated_at }`

**PolicyPreview**: `{ valid, normalized_policy, capabilities, diff{ project_types{added/removed}, run_modes{added/removed}, scopes{added/removed}, active_dimensions{added/removed}, dimension_weights[{dimension/before/after}], potential_run_blocks[{option_type/value/severity/reason/message}], summary{block_count/warn_*_count} } }`

## 4. 页面设计

### 4.1 页面位置

- 路由: `/project-eval/insights` (组织洞察+策略)
- 报告/解释通过 S16 详情页的 service 方法调用（不建独立路由）

### 4.2 页面结构

**整体布局: Tabs(2 个)**

**Tab 1 - 组织洞察 (Insights)**:

顶部筛选区:
- Days: Select(7/14/30/60/90)
- Project Type: Select(全部/backend/frontend/llm_app/agent)
- Mode: Select(全部/advisory/strict)

汇总统计卡 Row:
- total_runs, average_score, evidence_backed_runs, legacy_fallback_runs
- selected_cases, evaluated_cases, pass/warn/block_cases
- average_confidence, average_coverage_score

维度分组表格:
- type_scope_scores Table: project_type, scope, run_count, average_score

修复/重播统计 Descriptions:
- linked_repair_runs, replay_completed/unavailable/failed_runs
- remediation_improved/unchanged/regressed/failed_runs

每日趋势表格(折叠):
- daily_trends Table: run_date, total_runs, average_score, authoritative_average_score, pass_cases, warn_cases, block_cases

**Tab 2 - 策略管理 (Policy)**:

Card 1 - 当前有效策略(effective):
- Descriptions(3列): pass_threshold, warn_threshold, strict_block_threshold, max_daily_runs, max_concurrent_runs, delta_max_files, enable_cost_optimize
- dimension_weights 展示(Tag 组)
- enabled_project_types / enabled_run_modes / enabled_scopes (Tag 组)

Card 2 - 编辑策略(org-admin):
- 表单: pass_threshold/warn_threshold/strict_block_threshold(InputNumber)
- max_daily_runs/max_concurrent_runs/delta_max_files(InputNumber)
- enable_cost_optimize(Switch)
- enabled_project_types/enabled_run_modes/enabled_scopes(Checkbox.Group)
- dimension_weights(各维度 InputNumber)
- "预览变更" Button → 调用 Preview → 显示 Diff Modal
- "保存" Button → 调用 Upsert

Card 3 - 预览差异 Modal:
- PreviewSetDiff(project_types/run_modes/scopes: added/removed)
- DimensionWeightChange Table
- PotentialRunBlocks Table(severity/reason/message)
- Summary(block_count/warn_*_count)

### 4.3 交互流

1. 页面加载 → 获取 Insights Summary + Effective Policy
2. 展开 Trends 折叠区 → 获取 Trends 数据
3. org-admin 编辑策略 → 预览 → 确认保存
4. S16 详情页可调用 getRunReport/getRunExplain 获取单次报告

### 4.4 权限控制

- Insights: auth + org (只读)
- Policy 查看: auth + org
- Policy 编辑/预览: org-admin

## 5. 文件变更范围

| 文件 | 动作 | 原因 |
|---|---|---|
| `src/types/api/project-eval.ts` | 修改 | 新增 S17 类型 |
| `src/services/project-eval.ts` | 修改 | 新增 7 个 service 方法 |
| `src/pages/project-eval/ProjectEvalInsightsPage.tsx` | 新增 | 洞察+策略页面 |
| `src/router/routes.tsx` | 修改 | 新增 lazy import |
| `src/router/index.tsx` | 修改 | 新增路由 |

核心文件 3 个 + 路由配置 2 个。

### 5.1 新增类型清单

```typescript
// --- Run Report ---
export interface RunReportView {
  run_id: string;
  status?: string;
  score: number;
  decision?: string;
  summary?: string;
  score_mode?: string;
  result_class?: string;
  truth_mode?: string;
  processor_profile?: string;
  outcome_authority_source?: string;
  authoritative_truth: boolean;
  legacy_fallback_used: boolean;
  legacy_fallback_reason?: string;
  selected_case_count?: number;
  case_selection_summary?: Record<string, unknown>;
  evidence_summary?: RunEvidenceSummary;
  mainline?: RunMainlineView;
  remediation?: RunRemediationView;
  report?: Record<string, unknown>;
}

// --- Run Explain ---
export interface RunExplainCaseSelectionView {
  selection_record_id?: string;
  benchmark_id: string;
  case_key: string;
  case_asset_id?: string;
  case_asset_version_id?: string;
  selection_status: string;
  selection_reason: string;
  selection_rank: number;
  match_score: number;
  evidence_available: boolean;
  evidence_record_id?: string;
  fusion_report_id?: string;
  fusion_case_report_id?: string;
  final_decision?: string;
  final_risk_level?: string;
  final_score?: number;
  confidence?: number;
  evidence_completeness?: number;
  insufficient_evidence: boolean;
  binding?: Record<string, unknown>;
  evidence?: Record<string, unknown>;
}

export interface RunExplainView {
  run_id: string;
  organization_id: string;
  source_id: string;
  status: string;
  mode: RunMode;
  project_type: ProjectType;
  plan_version: number;
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
  approved_plan_version?: number;
  score: number;
  decision?: string;
  score_mode?: string;
  result_class?: string;
  truth_mode?: string;
  processor_profile?: string;
  outcome_authority_source?: string;
  authoritative_truth: boolean;
  legacy_fallback_used: boolean;
  legacy_fallback_reason?: string;
  selected_case_count: number;
  evaluated_case_count: number;
  case_selection_summary?: Record<string, unknown>;
  evidence_summary?: RunEvidenceSummary;
  mainline?: RunMainlineView;
  remediation?: RunRemediationView;
  case_selections: RunExplainCaseSelectionView[];
}

// --- Insights ---
export interface RunInsightsFilter {
  project_type?: string;
  scope?: string;
  mode?: string;
  source_id?: string;
  created_by?: string;
}

export interface RunTypeScopeScore {
  project_type: string;
  scope: string;
  run_count: number;
  average_score: number;
}

export interface RunInsightsSummary {
  organization_id: string;
  window_days: number;
  since: string;
  generated_at: string;
  filter: RunInsightsFilter;
  total_runs: number;
  average_score: number;
  status_distribution: Record<string, number>;
  decision_distribution: Record<string, number>;
  score_mode_distribution: Record<string, number>;
  evidence_backed_runs: number;
  legacy_fallback_runs: number;
  compatibility_reason_distribution: Record<string, number>;
  linked_repair_runs: number;
  replay_completed_runs: number;
  replay_unavailable_runs: number;
  replay_failed_runs: number;
  remediation_pending_runs: number;
  remediation_improved_runs: number;
  remediation_unchanged_runs: number;
  remediation_regressed_runs: number;
  remediation_non_comparable_runs: number;
  remediation_failed_runs: number;
  remediation_unavailable_runs: number;
  remediation_missing_feedback_runs: number;
  selected_cases: number;
  evaluated_cases: number;
  pass_cases: number;
  warn_cases: number;
  block_cases: number;
  insufficient_cases: number;
  average_confidence: number;
  average_coverage_score: number;
  type_scope_scores: RunTypeScopeScore[];
}

export interface RunDailyTrend {
  run_date: string;
  total_runs: number;
  completed_runs: number;
  average_score: number;
  authoritative_runs: number;
  compatibility_runs: number;
  authoritative_average_score: number;
  compatibility_average_score: number;
  evidence_backed_runs: number;
  legacy_fallback_runs: number;
  linked_repair_runs: number;
  replay_completed_runs: number;
  replay_unavailable_runs: number;
  replay_failed_runs: number;
  remediation_pending_runs: number;
  remediation_improved_runs: number;
  remediation_unchanged_runs: number;
  remediation_regressed_runs: number;
  remediation_non_comparable_runs: number;
  remediation_failed_runs: number;
  remediation_unavailable_runs: number;
  remediation_missing_feedback_runs: number;
  selected_cases: number;
  evaluated_cases: number;
  pass_cases: number;
  warn_cases: number;
  block_cases: number;
  insufficient_cases: number;
  average_confidence: number;
  average_coverage_score: number;
}

export interface RunInsightsTrends {
  organization_id: string;
  window_days: number;
  since: string;
  generated_at: string;
  filter: RunInsightsFilter;
  trend_page: number;
  trend_page_size: number;
  trend_total: number;
  daily_trends: RunDailyTrend[];
  [key: string]: unknown;
}

// --- Policy ---
export interface ProjectEvalPolicy {
  id: number;
  organization_id: string;
  pass_threshold: number;
  warn_threshold: number;
  strict_block_threshold: number;
  dimension_weights?: Record<string, number>;
  max_daily_runs: number;
  max_concurrent_runs: number;
  delta_max_files: number;
  enable_cost_optimize: boolean;
  enabled_project_types?: string[];
  enabled_run_modes?: string[];
  enabled_scopes?: string[];
  dimension_controls?: Record<string, unknown>;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface UpsertPolicyRequest {
  pass_threshold?: number;
  warn_threshold?: number;
  strict_block_threshold?: number;
  dimension_weights?: Record<string, number>;
  max_daily_runs?: number;
  max_concurrent_runs?: number;
  delta_max_files?: number;
  enable_cost_optimize?: boolean;
  enabled_project_types?: string[];
  enabled_run_modes?: string[];
  enabled_scopes?: string[];
  dimension_controls?: Record<string, unknown>;
}

export interface PolicyPreview {
  valid: boolean;
  normalized_policy: ProjectEvalPolicy;
  capabilities?: unknown;
  diff?: PolicyPreviewDiff;
}

export interface PolicyPreviewDiff {
  project_types: PreviewSetDiff;
  run_modes: PreviewSetDiff;
  scopes: PreviewSetDiff;
  active_dimensions: PreviewSetDiff;
  dimension_weights: PreviewDimensionWeightChange[];
  potential_run_blocks: PreviewRunOptionBlock[];
  summary: PolicyPreviewSummary;
}

export interface PreviewSetDiff {
  added: string[];
  removed: string[];
}

export interface PreviewDimensionWeightChange {
  dimension: string;
  before: number;
  after: number;
}

export interface PreviewRunOptionBlock {
  option_type: string;
  value: string;
  severity: string;
  risk_level?: string;
  reason: string;
  message: string;
  suggestion?: string;
  merged_count?: number;
}

export interface PolicyPreviewSummary {
  block_count: number;
  warn_high_count: number;
  warn_medium_count: number;
  warn_low_count: number;
}
```

### 5.2 新增 service 方法

```typescript
// S17 新增:
getRunReport: (id: string) => RunReportView
getRunExplain: (id: string) => RunExplainView
getInsightsSummary: (params?) => RunInsightsSummary
getInsightsTrends: (params?) => RunInsightsTrends
getEffectivePolicy: () => ProjectEvalPolicy
previewPolicy: (data: UpsertPolicyRequest) => PolicyPreview
upsertPolicy: (data: UpsertPolicyRequest) => ProjectEvalPolicy
```

## 6. 验收标准

- [ ] 页面在 `/project-eval/insights` 可访问
- [ ] 洞察 Tab: 筛选(days/type/mode) + 汇总统计卡 + 维度分组表 + 趋势表
- [ ] 策略 Tab: 有效策略展示 + 编辑表单(org-admin) + 预览差异 Modal
- [ ] Service: getRunReport/getRunExplain 可被 S16 调用
- [ ] 权限: 策略编辑仅 org-admin 可见
- [ ] `npx tsc --noEmit` 通过
- [ ] `npx vite build` 通过

## 7. 明确不做什么

1. 本 slice 不做 Run 列表页 (后续 slice)。
2. 本 slice 不做趋势图表可视化 (仅表格展示)。
3. 本 slice 不做 Report/Explain 独立路由 (service 方法已添加，可在 S16 中调用)。

## 8. 留给下一 Slice 的上下文

| 项目 | 内容 |
|---|---|
| 新增 service 方法 | `getRunReport`, `getRunExplain`, `getInsightsSummary`, `getInsightsTrends`, `getEffectivePolicy`, `previewPolicy`, `upsertPolicy` |
| 新增类型 | RunReportView, RunExplainView, RunExplainCaseSelectionView, RunInsights*, RunDailyTrend, ProjectEvalPolicy, UpsertPolicyRequest, PolicyPreview* |
| 页面路由 | `/project-eval/insights` |

## 9. 实现记录

| 项目 | 内容 |
|---|---|
| 完成日期 | 2026-04-14 |
| 实际修改文件 | `src/types/api/project-eval.ts`(修改), `src/services/project-eval.ts`(修改), `src/pages/project-eval/ProjectEvalInsightsPage.tsx`(新), `src/router/routes.tsx`, `src/router/index.tsx` |
| 运行命令 | `npx tsc --noEmit` ✅, `npx vite build` ✅ |
| 遇到的问题 | `RunInsightsTrends` 未 import — 已修复 |
| 与原方案的差异 | 无差异 |
