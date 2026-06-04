# S16 - Project Eval 计划确认+证据

## Slice 基本信息

| 字段 | 内容 |
|---|---|
| Slice ID | S16 |
| 名称 | Project Eval 计划确认+证据 |
| 所属主线 | projecteval |
| 所属模块 | project evaluation detail |
| 优先级 | P1 |
| 前置依赖 | S15 |
| 当前状态 | 已完成 |

## 0. 目标

用户查看已创建的 Project Eval Run，浏览评测计划（Case Selection），可重新生成/修改计划，确认执行，查看证据结果，并通过 Mainline 生命周期状态机推进后续修复/重播流程。

## 1. 为什么先做这个 Slice

1. S15 创建的 Run 初始状态为 `planned`，S16 是用户查看和操作 Run 的核心页面。
2. S17 (报告) 依赖 S16 页面的 Run 状态和 Mainline 视图。
3. Mainline 生命周期状态机（~20 阶段）是整个项目评测的核心流程编排。

## 2. 后端调研记录

### 2.1 读取的后端代码

| 文件 | 结论 |
|---|---|
| `router.go` L375-397 | 20 个 project-evals 路由，S16 范围: 9 个 Run 详情/计划/证据/Mainline 端点 |
| `project_eval_handler.go` L1-1200 | 9 个 handler: GetRun/GetRunPlan/RegenerateRunPlan/ApplyRunPlanOverrides/ConfirmRunExecution/ListCaseSelections/ListRunEvidence/GetRunMainline/ExecuteRunMainlineAction |
| `projecteval/views.go` | RunDetailView(含 mainline+remediation)/RunPlanView/CaseSelectionSummary |
| `projecteval/evidence_projection.go` | RunEvidenceSummaryView/RunEvidenceRecordView(含 provenance.binding/static/validation/review) |
| `projecteval/mainline.go` | ~20 个 MainlineStage 常量 + RunMainlineView(primary_action/snapshot_guard/linked_repair) |
| `projecteval/mainline_action.go` | 6 个合法 action 常量 + RunMainlineActionResult(disposition: executed/already_satisfied) |
| `projecteval/mainline_action_boundary.go` | 每个 action 的可执行阶段 + also-satisfied 阶段 + snapshot guard 要求 |
| `projecteval/mainline_snapshot_guard.go` | SnapshotGuard 结构 + 验证逻辑(stage/run_id/state/plan_version/plan_hash) |
| `projecteval/remediation.go` | RunRemediationView(has_linked_repair/latest_linked_repair) + LinkedRepairRunSummaryView(20+ 字段) |
| `projecteval/remediation_outcome.go` | RunRemediationOutcomeView(category/improved/unchanged/regressed + 各计数) |
| `domain/projecteval/model.go` | Run 模型 25+ 字段(plan_version/score/decision/result_class/authoritative_truth 等) |

### 2.2 关键业务结论

1. **Run 状态流转**: `planned` → `pending`(confirm) → `running` → `completed`/`failed`/`cancelled`。
2. **计划操作仅限 planned**: regenerate 和 overrides 只在 `planned` 状态可用。
3. **Confirm 需要 user-id**: 确认执行需要登录用户身份，检查并发预算。
4. **Case Selection 分页**: 20+ 字段/记录，支持 status/reason/benchmark_id/plan_version 筛选。
5. **Evidence 分页+汇总**: 包含 summary(统计) + items(记录级详情)，记录含 provenance(binding/static/validation/review) 三支柱。
6. **Mainline ~20 阶段**: eval_* → repair_* → replay_*，终端阶段(terminal=true)不可继续操作。
7. **6 个 Mainline Action**: confirm_run_execution/create_linked_repair_run/start_repair_planning/approve_repair_plan/start_repair_apply/request_replay。
8. **Snapshot Guard**: 4 个 action 需要 snapshot guard(stage+linked_repair 状态)，不匹配返回 409。
9. **Idempotent**: confirm 对已确认的 Run 返回 `already_satisfied`，不报错。
10. **Remediation 视图**: RunDetail 自带 remediation(latest_linked_repair + latest_outcome)。

## 3. API 合同

### 3.1 接口列表

| # | 方法 | 路径 | 用途 | 权限 |
|---|---|---|---|---|
| 1 | GET | `/api/v1/project-evals/runs/:id` | Run 详情(含 mainline+remediation) | auth+org |
| 2 | GET | `/api/v1/project-evals/runs/:id/plan` | 计划视图(含 case_selection_summary) | auth+org |
| 3 | POST | `/api/v1/project-evals/runs/:id/plan/regenerate` | 重新生成计划 | auth+org |
| 4 | POST | `/api/v1/project-evals/runs/:id/plan/overrides` | 应用覆盖(include/exclude cases) | auth+org |
| 5 | POST | `/api/v1/project-evals/runs/:id/confirm` | 确认执行 | auth+org+user |
| 6 | GET | `/api/v1/project-evals/runs/:id/case-selection` | 分页 Case Selection 列表 | auth+org |
| 7 | GET | `/api/v1/project-evals/runs/:id/evidence` | 分页 Evidence + Summary | auth+org |
| 8 | GET | `/api/v1/project-evals/runs/:id/mainline` | Mainline 生命周期视图 | auth+org |
| 9 | POST | `/api/v1/project-evals/runs/:id/mainline/actions/:action` | 执行 Mainline Action | auth+org+user |

### 3.2 请求参数

**RegeneratePlan body**(可选):
```json
{
  "changed_files": ["string"],
  "candidate_benchmark_ids": ["string"]
}
```

**ApplyOverrides body**:
```json
{
  "include_case_keys": ["case_key_1"],
  "exclude_case_keys": ["case_key_3"],
  "candidate_benchmark_ids": ["bench_id_1"]
}
```

**Case Selection query**: `page`, `page_size`, `status`(comma-sep), `reason`(comma-sep), `benchmark_id`, `plan_version`

**Evidence query**: `page`, `page_size`, `decision`(comma-sep), `plan_version`, `benchmark_id`, `case_key`

**Mainline Action body**(可选):
```json
{
  "agent_id": "string",
  "snapshot_guard": {
    "stage": "eval_waiting_approval",
    "latest_linked_repair": {
      "run_id": "string",
      "state": "created",
      "replay_status": "not_requested",
      "latest_plan_version": 1,
      "latest_plan_hash": "string",
      "approved_plan_version": 1,
      "approved_plan_hash": "string"
    }
  }
}
```

### 3.3 响应结构

**RunDetailView**: `{ id, source_id, organization_id, created_by, approved_by, status, mode, scope, project_type, template_version, plan_version, plan, report, score, decision, error_message, approved_at, started_at, completed_at, created_at, updated_at, mainline{RunMainlineView}, remediation{RunRemediationView} }`

**RunPlanView**: `{ run_id, plan_version, approval_required(true), approved, approved_by, approved_at, approved_plan_version, selected_case_count, candidate_benchmark_ids, case_selection_summary{candidate_benchmark_count, candidate_case_count, selected_case_count, status_counts, reason_counts, selected_benchmark_counts}, plan{raw} }`

**Case Selection**: `{ run_id, page, page_size, total, items[{id, run_id, organization_id, source_id, plan_version, benchmark_id, case_asset_id, case_asset_version_id, case_key, selection_status, selection_reason, selection_rank, match_score, change_match_score, history_score, risk_score, coverage_score, freshness_score, evidence_summary, decision_trace, created_at}] }`

**Evidence**: `{ run_id, page, page_size, total, summary{run_id, organization_id, source_id, plan_version, selected_cases, evaluated_cases, pass_cases, warn_cases, block_cases, insufficient_cases, average_case_score, average_confidence, coverage_score, stats_json, generated_at}, items[RunEvidenceRecordView] }`

**RunMainlineView**: `{ stage, next_action, primary_action{action, required_inputs, snapshot_guard_required, idempotent}, primary_action_reason, available_actions[], snapshot_guard{stage, latest_linked_repair}, outcome_authority_source, authoritative_run, repair_eligible, replay_eligible, terminal, explain, latest_linked_repair{LinkedRepairRunSummaryView}, latest_remediation_outcome{RunRemediationOutcomeView} }`

**MainlineActionResult**: `{ run_id, action, disposition("executed"/"already_satisfied"), mainline{RunMainlineView} }`

## 4. 页面设计

### 4.1 页面位置

- 路由: `/project-eval/:id`

### 4.2 页面结构

**整体布局: 卡片堆叠 + Tabs**

**顶部区域 - Run 概览卡片**:
- 标题: "项目评测运行详情" + Run ID 截断显示
- Breadcrumb: Dashboard → Project Eval → Run Detail
- Descriptions(4列): Status(Tag+颜色), Mode, Scope, Project Type, Plan Version, Score, Decision, Created At
- 如果有 error_message: Alert.error 显示

**主 Tabs(3 个)**:

**Tab 1 - 计划 (Plan)**:
- Plan 概要 Descriptions: plan_version, selected_case_count, approved, approval_required
- Case Selection Summary: Statistic 行(candidate_benchmark_count / candidate_case_count / selected_case_count)
- 操作按钮区(status=planned 时显示):
  - "重新生成计划" Button → RegeneratePlan
  - "修改选择" Button → Override Modal(include_case_keys + exclude_case_keys TagInput)
  - "确认执行" Button(primary, danger) → ConfirmRun(二次确认 Popconfirm)
- Case Selection Table(分页):
  - 列: case_key, selection_status(Tag), selection_reason, benchmark_id, selection_rank, match_score, coverage_score
  - 筛选: status Select, benchmark_id Select
  - 展开行: 所有 score 字段 + evidence_summary/decision_trace JSON 预览

**Tab 2 - 证据 (Evidence)**:
- Summary 统计卡 Row:
  - selected_cases, evaluated_cases, pass_cases(warn/block), average_case_score, average_confidence, coverage_score
- Evidence Table(分页):
  - 列: case_key, final_decision(Tag: pass绿/warn黄/block红), final_risk_level, final_score, confidence, evidence_completeness, projection_status, insufficient_evidence
  - 筛选: decision Select, case_key Input
  - 展开行: binding + provenance(static/validation/review) 三支柱 Descriptions
- 只在 status=completed/running 时有数据

**Tab 3 - 生命周期 (Mainline)**:
- Mainline Stage 展示:
  - Steps 组件(竖向): eval_* → repair_* → replay_*，高亮当前 stage
  - explain 文本说明
  - authoritative_run / repair_eligible / replay_eligible 标签
- Primary Action 区域(非 terminal 时显示):
  - 主操作按钮(根据 primary_action.action 动态渲染)
  - 如果 snapshot_guard_required: 显示确认提示"操作需要验证当前状态"
  - agent_id 输入(create_linked_repair_run 时)
- Linked Repair 信息(如果有):
  - Descriptions: state, current_phase, retryable, replay_status, plan_version 等
- Remediation Outcome(如果有):
  - Statistic 行: improved/unchanged/regressed/pending/failed 各计数
  - category Tag

### 4.3 交互流

1. 页面加载 → 并行获取 Run Detail + Plan + Mainline
2. Tab 1 默认展示计划 + Case Selection 列表(自动加载第一页)
3. 用户可 regenerate/override/confirm(plan → pending 转换)
4. Confirm 后自动刷新 Run + Mainline(stage 变化)
5. 切换到 Evidence Tab 加载证据数据
6. 切换到 Mainline Tab 查看生命周期 + 执行动作
7. Mainline Action 执行后刷新整个视图

### 4.4 权限控制

- 所有 Tab 可查看(auth + org)
- 计划操作(regenerate/overrides): 所有已认证用户
- Confirm + Mainline Actions: 需要登录用户身份(user-id)

## 5. 文件变更范围

| 文件 | 动作 | 原因 |
|---|---|---|
| `src/types/api/project-eval.ts` | 修改 | 新增 S16 类型(10+ 接口/类型) |
| `src/services/project-eval.ts` | 修改 | 新增 9 个 service 方法 |
| `src/pages/project-eval/ProjectEvalDetailPage.tsx` | 新增 | 详情页面(3 Tabs + 操作) |
| `src/router/routes.tsx` | 修改 | 新增 lazy import |
| `src/router/index.tsx` | 修改 | 新增路由 |

核心文件 3 个 + 路由配置 2 个。类型和服务复用 S15 已建的 `project-eval.ts` 文件。

### 5.1 新增类型清单

```typescript
// --- Run Detail ---
export interface RunDetailView {
  id: string;
  source_id: string;
  organization_id: string;
  created_by: string;
  approved_by?: string;
  status: string;
  mode: RunMode;
  scope: EvaluationScope;
  project_type: ProjectType;
  template_version?: string;
  plan_version: number;
  plan?: unknown;
  report?: unknown;
  score: number;
  decision: string;
  error_message?: string;
  approved_at?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  mainline?: RunMainlineView;
  remediation?: RunRemediationView;
}

// --- Plan ---
export interface RunPlanView {
  run_id: string;
  plan_version: number;
  approval_required: boolean;
  approved: boolean;
  approved_by?: string;
  approved_at?: string;
  approved_plan_version: number;
  selected_case_count: number;
  candidate_benchmark_ids: string[];
  case_selection_summary: CaseSelectionSummary;
  plan?: unknown;
}

export interface CaseSelectionSummary {
  candidate_benchmark_count: number;
  candidate_case_count: number;
  selected_case_count: number;
  status_counts: Record<string, number>;
  reason_counts: Record<string, number>;
  selected_benchmark_counts: Record<string, number>;
}

// --- Case Selection ---
export type SelectionStatus = 'selected' | 'skipped' | 'forced_included' | 'forced_excluded';

export interface CaseSelectionRecord {
  id: string;
  run_id: string;
  organization_id: string;
  source_id: string;
  plan_version: number;
  benchmark_id: string;
  case_asset_id: string;
  case_asset_version_id?: string;
  case_key: string;
  selection_status: SelectionStatus;
  selection_reason: string;
  selection_rank: number;
  match_score: number;
  change_match_score: number;
  history_score: number;
  risk_score: number;
  coverage_score: number;
  freshness_score: number;
  evidence_summary?: unknown;
  decision_trace?: unknown;
  created_at: string;
}

export interface CaseSelectionResponse {
  run_id: string;
  page: number;
  page_size: number;
  total: number;
  items: CaseSelectionRecord[];
}

// --- Evidence ---
export type FinalDecision = 'pass' | 'warn' | 'block';
export type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface RunEvidenceSummary {
  run_id: string;
  organization_id: string;
  source_id: string;
  plan_version: number;
  selected_cases: number;
  evaluated_cases: number;
  pass_cases: number;
  warn_cases: number;
  block_cases: number;
  insufficient_cases: number;
  average_case_score: number;
  average_confidence: number;
  coverage_score: number;
  stats_json?: unknown;
  generated_at: string;
}

export interface RunEvidenceRecordView {
  id: string;
  run_id: string;
  organization_id: string;
  source_id: string;
  plan_version: number;
  selection_record_id?: string;
  benchmark_id: string;
  case_asset_id?: string;
  case_asset_version_id?: string;
  case_key: string;
  fusion_report_id?: string;
  fusion_case_report_id?: string;
  final_decision: FinalDecision;
  final_risk_level: RiskLevel;
  final_score: number;
  confidence: number;
  evidence_completeness: number;
  insufficient_evidence: boolean;
  projection_status: string;
  warnings?: string[];
  binding?: Record<string, unknown>;
  provenance?: {
    binding?: Record<string, unknown>;
    static?: Record<string, unknown>;
    validation?: Record<string, unknown>;
    review?: Record<string, unknown>;
  };
  created_at: string;
}

export interface RunEvidenceResponse {
  run_id: string;
  page: number;
  page_size: number;
  total: number;
  summary?: RunEvidenceSummary;
  items: RunEvidenceRecordView[];
}

// --- Mainline ---
export type RunMainlineStage = string; // ~20 个阶段字符串

export interface MainlineActionDescriptor {
  action: string;
  required_inputs: string[];
  snapshot_guard_required: boolean;
  idempotent: boolean;
}

export interface SnapshotGuard {
  stage: string;
  latest_linked_repair: {
    run_id: string;
    state: string;
    replay_status: string;
    latest_plan_version: number;
    latest_plan_hash: string;
    approved_plan_version: number;
    approved_plan_hash: string;
  };
}

export interface RunMainlineView {
  stage: RunMainlineStage;
  next_action: string;
  primary_action?: MainlineActionDescriptor;
  primary_action_reason?: string;
  available_actions: MainlineActionDescriptor[];
  snapshot_guard?: SnapshotGuard;
  outcome_authority_source?: string;
  authoritative_run: boolean;
  repair_eligible: boolean;
  replay_eligible: boolean;
  terminal: boolean;
  explain?: string;
  latest_linked_repair?: LinkedRepairRunSummaryView;
  latest_remediation_outcome?: RunRemediationOutcomeView;
}

export interface LinkedRepairRunSummaryView {
  id: string;
  state: string;
  current_phase?: string;
  last_failure_phase?: string;
  dispatch_status?: string;
  retryable: boolean;
  last_task_id?: string;
  last_execution_id?: string;
  planning_task_id?: string;
  planning_execution_id?: string;
  latest_plan_version: number;
  latest_plan_hash?: string;
  approved_plan_version: number;
  approved_plan_hash?: string;
  approved_by?: string;
  approved_at?: string;
  apply_task_id?: string;
  apply_execution_id?: string;
  replay_status: string;
  replay_project_eval_run_id?: string;
  replay_error_code?: string;
  replay_error?: string;
  error_code?: string;
  error?: string;
  created_at: string;
  updated_at: string;
}

export type RemediationOutcomeCategory = 'pending' | 'improved' | 'unchanged' | 'regressed' | 'non_comparable' | 'failed' | 'unavailable' | 'missing_feedback';

export interface RunRemediationOutcomeView {
  category: RemediationOutcomeCategory;
  primary_comparison_outcome?: string;
  primary_comparison_mode?: string;
  total_cases: number;
  improved_cases: number;
  unchanged_cases: number;
  regressed_cases: number;
  pending_cases: number;
  failed_cases: number;
  unavailable_cases: number;
  non_comparable_cases: number;
  version_shifted_cases: number;
  missing_in_replay_cases: number;
  replay_non_authoritative_cases: number;
  latest_feedback_at?: string;
}

export interface RunRemediationView {
  has_linked_repair: boolean;
  linked_repair_count: number;
  latest_linked_repair?: LinkedRepairRunSummaryView;
  latest_outcome?: RunRemediationOutcomeView;
}

// --- Requests ---
export interface RegeneratePlanRequest {
  changed_files?: string[];
  candidate_benchmark_ids?: string[];
}

export interface ApplyOverridesRequest {
  include_case_keys?: string[];
  exclude_case_keys?: string[];
  candidate_benchmark_ids?: string[];
}

export interface ExecuteMainlineActionRequest {
  agent_id?: string;
  snapshot_guard?: SnapshotGuard;
}

export interface MainlineActionResult {
  run_id: string;
  action: string;
  disposition: 'executed' | 'already_satisfied';
  mainline: RunMainlineView;
}
```

### 5.2 新增配置常量

```typescript
// Mainline Stage 配置(用于 Steps 组件)
export const MAINLINE_STAGE_GROUPS = [
  { label: '评测阶段', stages: ['eval_waiting_approval', 'eval_pending_execution', 'eval_running', 'eval_completed_no_action', 'eval_completed_non_authoritative', 'eval_failed', 'eval_cancelled'] },
  { label: '修复阶段', stages: ['repair_available', 'repair_created', 'repair_planning', 'repair_approval_pending', 'repair_approved', 'repair_applying', 'repair_failed', 'repair_cancelled'] },
  { label: '重播阶段', stages: ['replay_available', 'replay_pending', 'replay_running', 'replay_completed', 'replay_failed', 'replay_unavailable'] },
];

export const MAINLINE_STAGE_CONFIG: Record<string, { label: string; color: string; terminal: boolean }> = {
  eval_waiting_approval: { label: '等待审批', color: 'orange', terminal: false },
  eval_pending_execution: { label: '等待执行', color: 'blue', terminal: false },
  eval_running: { label: '执行中', color: 'processing', terminal: false },
  eval_failed: { label: '评测失败', color: 'red', terminal: true },
  eval_cancelled: { label: '已取消', color: 'default', terminal: true },
  eval_completed_non_authoritative: { label: '完成(非权威)', color: 'gold', terminal: true },
  eval_completed_no_action: { label: '完成(无需操作)', color: 'green', terminal: true },
  repair_available: { label: '可修复', color: 'orange', terminal: false },
  repair_created: { label: '修复已创建', color: 'blue', terminal: false },
  repair_planning: { label: '修复规划中', color: 'processing', terminal: false },
  repair_approval_pending: { label: '修复待审批', color: 'orange', terminal: false },
  repair_approved: { label: '修复已审批', color: 'cyan', terminal: false },
  repair_applying: { label: '修复应用中', color: 'processing', terminal: false },
  repair_failed: { label: '修复失败', color: 'red', terminal: true },
  repair_cancelled: { label: '修复已取消', color: 'default', terminal: true },
  replay_available: { label: '可重播', color: 'orange', terminal: false },
  replay_pending: { label: '重播待执行', color: 'blue', terminal: false },
  replay_running: { label: '重播执行中', color: 'processing', terminal: false },
  replay_completed: { label: '重播完成', color: 'green', terminal: true },
  replay_failed: { label: '重播失败', color: 'red', terminal: true },
  replay_unavailable: { label: '重播不可用', color: 'default', terminal: true },
};

export const SELECTION_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  selected: { label: '已选', color: 'green' },
  skipped: { label: '跳过', color: 'default' },
  forced_included: { label: '强制包含', color: 'blue' },
  forced_excluded: { label: '强制排除', color: 'red' },
};

export const FINAL_DECISION_CONFIG: Record<string, { label: string; color: string }> = {
  pass: { label: '通过', color: 'green' },
  warn: { label: '警告', color: 'orange' },
  block: { label: '阻止', color: 'red' },
};

export const REMEDIATION_CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: '待定', color: 'default' },
  improved: { label: '改善', color: 'green' },
  unchanged: { label: '不变', color: 'blue' },
  regressed: { label: '退化', color: 'red' },
  non_comparable: { label: '不可比较', color: 'default' },
  failed: { label: '失败', color: 'red' },
  unavailable: { label: '不可用', color: 'default' },
  missing_feedback: { label: '缺少反馈', color: 'default' },
};

export const MAINLINE_ACTION_LABEL: Record<string, string> = {
  confirm_run_execution: '确认执行',
  create_linked_repair_run: '创建修复运行',
  start_repair_planning: '开始修复规划',
  approve_repair_plan: '审批修复计划',
  start_repair_apply: '开始修复应用',
  request_replay: '请求重播',
};
```

### 5.3 新增 service 方法

```typescript
// src/services/project-eval.ts 新增:
getRun: (id: string) => RunDetailView
getRunPlan: (id: string) => RunPlanView
regeneratePlan: (id: string, data?: RegeneratePlanRequest) => ProjectEvalRun
applyOverrides: (id: string, data: ApplyOverridesRequest) => ProjectEvalRun
confirmRun: (id: string) => ProjectEvalRun
listCaseSelections: (id: string, params?: { page?, page_size?, status?, reason?, benchmark_id?, plan_version? }) => CaseSelectionResponse
listEvidence: (id: string, params?: { page?, page_size?, decision?, plan_version?, benchmark_id?, case_key? }) => RunEvidenceResponse
getMainline: (id: string) => RunMainlineView
executeMainlineAction: (id: string, action: string, data?: ExecuteMainlineActionRequest) => MainlineActionResult
```

## 6. 验收标准

- [ ] 页面在 `/project-eval/:id` 可访问
- [ ] Run 概览: 状态/模式/评分/决策等基本信息展示
- [ ] 计划 Tab: Plan 概要 + Case Selection Summary + 操作按钮 + 分页列表
- [ ] 计划操作: Regenerate(重新生成) + Override Modal(include/exclude) + Confirm(确认执行)
- [ ] 证据 Tab: Summary 统计卡 + Evidence 分页列表 + 展开行(provenance 三支柱)
- [ ] 证据筛选: decision/case_key 筛选
- [ ] 生命周期 Tab: Steps 展示当前阶段 + Primary Action 按钮
- [ ] Mainline Action: 执行动作(含 snapshot guard 确认) + 自动刷新
- [ ] 状态联动: planned 时显示操作按钮; completed 时切换到 Evidence 有数据
- [ ] 错误处理: 409 snapshot stale / 429 并发限制 / 其他错误
- [ ] `npx tsc --noEmit` 通过
- [ ] `npx vite build` 通过

## 7. 明确不做什么

1. 本 slice 不做报告/解释/洞察 (S17 范围: `/runs/:id/report`, `/runs/:id/explain`, insights)。
2. 本 slice 不做策略管理 (S17 范围: `/policies/effective`, `/policies/organization`)。
3. 本 slice 不做文件上传 UI (S15 已覆盖)。
4. 本 slice 不做 Run 列表页 (后续 slice)。
5. 本 slice 不做 repair-runs 独立管理页 (S18 范围)。

## 8. 留给下一 Slice 的上下文

| 项目 | 内容 |
|---|---|
| 新增 service 方法 | `getRun`, `getRunPlan`, `regeneratePlan`, `applyOverrides`, `confirmRun`, `listCaseSelections`, `listEvidence`, `getMainline`, `executeMainlineAction` |
| 新增类型 | 20+ 接口/类型 (RunDetailView, RunPlanView, RunMainlineView, CaseSelection*, Evidence*, Remediation*, SnapshotGuard, MainlineAction*) |
| 新增配置常量 | MAINLINE_STAGE_CONFIG(21阶段), SELECTION_STATUS_CONFIG, FINAL_DECISION_CONFIG, REMEDIATION_CATEGORY_CONFIG, MAINLINE_ACTION_LABEL |
| 页面路由 | `/project-eval/:id` |
| S17 复用 | RunDetailView.report, getRun/report/explain/insights 端点 |

## 9. 实现记录

| 项目 | 内容 |
|---|---|
| 完成日期 | 2026-04-14 |
| 实际修改文件 | `src/types/api/project-eval.ts`(修改), `src/services/project-eval.ts`(修改), `src/pages/project-eval/ProjectEvalDetailPage.tsx`(新), `src/router/routes.tsx`, `src/router/index.tsx` |
| 运行命令 | `npx tsc --noEmit` ✅, `npx vite build` ✅ |
| 遇到的问题 | 1. `Paragraph`/`navigate` 未使用 import 2. `snapshot_guard` 类型 `unknown` 不兼容 `SnapshotGuard` — 均已修复 |
| 与原方案的差异 | 无差异 |
