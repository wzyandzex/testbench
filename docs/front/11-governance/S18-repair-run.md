# S18 - Repair Run 管理

## Slice 基本信息

| 字段 | 内容 |
|---|---|
| Slice ID | S18 |
| 名称 | Repair Run 管理 |
| 所属主线 | repairrun |
| 所属模块 | repair run management |
| 优先级 | P1 |
| 前置依赖 | S16 (了解 Project Eval 关联) |
| 当前状态 | 已完成 |

## 0. 目标

用户可以查看修复运行列表、创建修复运行、查看详情，并推进修复工作流（规划→审批→应用→重播→取消）。

## 1. 为什么先做这个 Slice

1. 修复运行是项目评测闭环的核心环节（发现问题→修复→重播验证）。
2. S16 的 Mainline 生命周期已涉及关联修复信息，S18 提供独立管理界面。
3. 8 个端点覆盖完整 CRUD + 工作流。

## 2. 后端调研记录

### 2.1 读取的后端代码

| 文件 | 结论 |
|---|---|
| `router.go` L402-413 | 8 个 repair-runs 路由: POST/GET /, GET/:id, POST /:id/plan/approve/apply/replay/cancel |
| `repair_run_handler.go` | 8 个 handler: Create/List/Get/StartPlanning/ApproveLatestPlan/StartApply/RequestReplay/CancelRun |
| `domain/repairrun/run.go` | Run 模型 30+ 字段; 8 个 RunState; 状态转换 CAS 保护 |
| `domain/repairrun/workflow_summary.go` | WorkflowPhase(5 个)/DispatchStatus(6 个) 从 state 派生 |
| `domain/repairrun/lineage.go` | ReplayStatus(6 个) + RepairTriggerSnapshot + SelectedCaseRef/GovernanceEvidenceRef |
| `domain/task/context.go` | RepairTask(8 字段)/RepairPlan(9 字段)/RepairPlanStep/ProblemInfo/RepairVerification |
| `application/repairrun/view.go` | RunSummaryView(30 字段)/RunView(继承+4 嵌套) |
| `application/projecteval/repair_bridge.go` | LinkedRepairRunView(12 字段) + CreateLinkedRepairRun |

### 2.2 关键业务结论

1. **8 个 RunState**: created→planning→approval_pending→approved→applying→completed/failed/cancelled。
2. **WorkflowPhase**: planning/approval/apply/completed/cancelled（从 state 派生）。
3. **DispatchStatus**: not_requested/dispatching/dispatched/dispatch_failed/execution_failed/completed。
4. **ReplayStatus**: not_requested/pending/running/completed/failed/unavailable。
5. **RunView 扁平化**: Go 嵌入 RunSummaryView，JSON 扁平输出，额外含 repair_task/trigger_snapshot/latest_plan_snapshot/approved_plan_snapshot。
6. **Create 需 agent_id + repair_task**: 复杂嵌套结构。
7. **List 自定义分页**: 返回 `{page, page_size, total, items}`。
8. **Replay 前置**: completed + replay_status=not_requested + 有 project_eval 谱系。
9. **Cancel**: 任何非终端状态可取消，可选 reason。
10. **Idempotency-Key**: Create 支持，防重复提交。

## 3. API 合同

### 3.1 接口列表

| # | 方法 | 路径 | 用途 | 权限 |
|---|---|---|---|---|
| 1 | POST | `/api/v1/repair-runs` | 创建修复运行 | auth+org+user |
| 2 | GET | `/api/v1/repair-runs` | 列表(分页) | auth+org |
| 3 | GET | `/api/v1/repair-runs/:id` | 详情 | auth+org |
| 4 | POST | `/api/v1/repair-runs/:id/plan` | 开始规划 | auth+org+user |
| 5 | POST | `/api/v1/repair-runs/:id/approve` | 审批计划 | auth+org+user |
| 6 | POST | `/api/v1/repair-runs/:id/apply` | 开始应用 | auth+org+user |
| 7 | POST | `/api/v1/repair-runs/:id/replay` | 请求重播 | auth+org+user |
| 8 | POST | `/api/v1/repair-runs/:id/cancel` | 取消运行 | auth+org+user |

### 3.2 请求参数

**Create body**:
```json
{
  "agent_id": "string",
  "repair_task": {
    "title": "string", "objective": "string", "scope_paths": [],
    "problem": { "title": "", "description": "", "steps": [], "expected": "", "actual": "" },
    "constraints": [], "acceptance_criteria": [],
    "verification": { "language": "", "targets": [], "success_criteria": [] }
  }
}
```

**List query**: `page`, `page_size`, `state`(逗号分隔), `user_id`, `agent_id`

**Cancel body**(可选): `{ "reason": "string" }`

### 3.3 响应结构

**RunSummaryView**: `{ id, organization_id, user_id, agent_id, idempotency_key, project_eval_run_id, project_eval_source_id, project_eval_plan_version, state, planning_task_id, planning_execution_id, latest_plan_version, latest_plan_hash, approved_plan_version, approved_plan_hash, approved_by, approved_at, apply_task_id, apply_execution_id, replay_status, replay_project_eval_run_id, replay_error_code, replay_error, error_code, error, current_phase, last_failure_phase, retryable, last_task_id, last_execution_id, dispatch_status, created_at, updated_at }`

**RunView** (继承+扩展): 额外含 `repair_task`(RepairTask), `trigger_snapshot`(RepairTriggerSnapshot), `latest_plan_snapshot`(RepairPlan), `approved_plan_snapshot`(RepairPlan)

**List response**: `{ page, page_size, total, items: RunSummaryView[] }`

## 4. 页面设计

### 4.1 页面位置

- 路由: `/repair-runs` (列表+操作)

### 4.2 页面结构

**列表卡片**:
- 筛选栏: State Select(多选) + Agent ID Input
- Table:
  - 列: ID(截断), Agent ID, State(Tag+颜色), Current Phase, Replay Status, Plan Version, Approved Version, Retryable, Created At, Updated At
  - 操作列: 查看详情(Button) → Drawer
  - Error 列高亮显示
  - 分页

**详情 Drawer**:
- Descriptions(3列): ID, Agent ID, State, Current Phase, Dispatch Status, Retryable, Project Eval Run ID, Plan Version, Approved Version, Approved By, Replay Status, Created At, Updated At
- Repair Task 展示(Collapse): title, objective, scope_paths, problem, constraints, acceptance_criteria, verification
- Trigger Snapshot(Collapse): trigger_reason, summary, scope_paths, selected_cases
- Latest Plan(Collapse): version, summary, scope_paths, steps Table, risks, notes
- Approved Plan(Collapse): 同上
- Error 信息(Alert)

**操作区** (根据 state 动态显示):
- created → "开始规划" Button
- approval_pending → "审批计划" Button(primary)
- approved → "开始应用" Button(primary)
- applying → (等待中)
- completed + replay=not_requested → "请求重播" Button
- 非终端 → "取消" Button(danger) + Popconfirm
- failed + retryable → "重试" (重新触发当前阶段)

**Create Modal**:
- Agent ID: Input(必填)
- Repair Task: 折叠表单(title/objective/scope_paths/problem)
- 提交 → 创建成功后刷新列表

### 4.3 交互流

1. 页面加载 → 获取列表
2. 点击行 → 打开 Drawer 获取详情
3. Drawer 内操作 → plan/approve/apply/replay/cancel → 刷新详情+列表
4. 创建按钮 → Create Modal → 提交 → 刷新列表

### 4.4 权限控制

- 所有端点: auth + org
- 修改操作: 需 user-id (登录即可)

## 5. 文件变更范围

| 文件 | 动作 | 原因 |
|---|---|---|
| `src/types/api/repair-run.ts` | 新增 | Repair Run 独立类型定义 |
| `src/services/repair-run.ts` | 新增 | Repair Run 独立 service |
| `src/pages/repair-run/RepairRunPage.tsx` | 新增 | 列表+详情+操作页面 |
| `src/router/routes.tsx` | 修改 | 新增 lazy import |
| `src/router/index.tsx` | 修改 | 新增路由 |

核心文件 3 个 + 路由配置 2 个。独立类型和服务文件（与 project-eval 分离）。

### 5.1 新增类型清单

```typescript
export type RunState = 'created' | 'planning' | 'approval_pending' | 'approved' | 'applying' | 'completed' | 'failed' | 'cancelled';
export type WorkflowPhase = 'planning' | 'approval' | 'apply' | 'completed' | 'cancelled';
export type DispatchStatus = 'not_requested' | 'dispatching' | 'dispatched' | 'dispatch_failed' | 'execution_failed' | 'completed';
export type ReplayStatus = 'not_requested' | 'pending' | 'running' | 'completed' | 'failed' | 'unavailable';

export const RUN_STATE_CONFIG: Record<string, { label: string; color: string }> = {
  created: { label: '已创建', color: 'default' },
  planning: { label: '规划中', color: 'processing' },
  approval_pending: { label: '待审批', color: 'orange' },
  approved: { label: '已审批', color: 'cyan' },
  applying: { label: '应用中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  failed: { label: '失败', color: 'error' },
  cancelled: { label: '已取消', color: 'default' },
};

export const REPLAY_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  not_requested: { label: '未请求', color: 'default' },
  pending: { label: '待执行', color: 'blue' },
  running: { label: '运行中', color: 'processing' },
  completed: { label: '完成', color: 'success' },
  failed: { label: '失败', color: 'error' },
  unavailable: { label: '不可用', color: 'default' },
};

export interface RepairRunSummary {
  id: string;
  organization_id: string;
  user_id: string;
  agent_id: string;
  idempotency_key?: string;
  project_eval_run_id?: string;
  project_eval_source_id?: string;
  project_eval_plan_version?: number;
  state: RunState;
  planning_task_id?: string;
  planning_execution_id?: string;
  latest_plan_version?: number;
  latest_plan_hash?: string;
  approved_plan_version?: number;
  approved_plan_hash?: string;
  approved_by?: string;
  approved_at?: string;
  apply_task_id?: string;
  apply_execution_id?: string;
  replay_status: ReplayStatus;
  replay_project_eval_run_id?: string;
  replay_error_code?: string;
  replay_error?: string;
  error_code?: string;
  error?: string;
  current_phase?: WorkflowPhase;
  last_failure_phase?: WorkflowPhase;
  retryable: boolean;
  last_task_id?: string;
  last_execution_id?: string;
  dispatch_status?: DispatchStatus;
  created_at: string;
  updated_at: string;
}

export interface RepairRunView extends RepairRunSummary {
  repair_task?: RepairTask;
  trigger_snapshot?: RepairTriggerSnapshot;
  latest_plan_snapshot?: RepairPlan;
  approved_plan_snapshot?: RepairPlan;
}

export interface RepairRunListResponse {
  page: number;
  page_size: number;
  total: number;
  items: RepairRunSummary[];
}

export interface RepairTask {
  title?: string;
  objective?: string;
  scope_paths?: string[];
  problem?: ProblemInfo;
  constraints?: string[];
  acceptance_criteria?: string[];
  verification?: RepairVerification;
}

export interface ProblemInfo {
  title: string;
  description: string;
  steps?: string[];
  expected?: string;
  actual?: string;
  environment?: string;
  references?: string[];
}

export interface RepairVerification {
  language?: string;
  targets?: string[];
  success_criteria?: string[];
}

export interface RepairPlan {
  version?: number;
  source_execution_id?: string;
  plan_hash?: string;
  summary?: string;
  scope_paths?: string[];
  steps?: RepairPlanStep[];
  verification?: RepairVerification;
  risks?: string[];
  notes?: string[];
}

export interface RepairPlanStep {
  kind?: string;
  target?: string;
  summary?: string;
}

export interface RepairTriggerSnapshot {
  trigger_reason?: string;
  summary?: string;
  scope_paths?: string[];
  selected_cases?: SelectedCaseRef[];
  evidence_refs?: GovernanceEvidenceRef[];
  source_locator?: RepairSourceLocator;
}

export interface SelectedCaseRef {
  benchmark_id?: string;
  case_key?: string;
  source?: string;
}

export interface GovernanceEvidenceRef {
  type?: string;
  ref_id?: string;
  uri?: string;
}

export interface RepairSourceLocator {
  project_eval_source_id?: string;
  source_type?: string;
  repo_url?: string;
  commit_hash?: string;
  archive_sha256?: string;
}

export interface CreateRepairRunRequest {
  agent_id: string;
  repair_task?: RepairTask;
}

export interface CancelRepairRunRequest {
  reason?: string;
}
```

### 5.2 新增 service 方法

```typescript
// src/services/repair-run.ts:
listRuns: (params?) => RepairRunListResponse
getRun: (id: string) => RepairRunView
createRun: (data: CreateRepairRunRequest) => RepairRunView
startPlanning: (id: string) => RepairRunView
approvePlan: (id: string) => RepairRunView
startApply: (id: string) => RepairRunView
requestReplay: (id: string) => RepairRunView
cancelRun: (id: string, data?: CancelRepairRunRequest) => RepairRunView
```

## 6. 验收标准

- [ ] 页面在 `/repair-runs` 可访问
- [ ] 列表: 分页 + state 筛选 + agent_id 筛选
- [ ] 详情 Drawer: 基本信息 + Repair Task + Plan 展示
- [ ] 工作流操作: plan/approve/apply/replay/cancel 根据状态动态显示
- [ ] 创建 Modal: agent_id + repair_task 表单
- [ ] 错误处理: 400004 状态不允许 / 其他错误
- [ ] `npx tsc --noEmit` 通过
- [ ] `npx vite build` 通过

## 7. 明确不做什么

1. 本 slice 不做 Project Eval 关联修复创建（S16 Mainline 已覆盖）。
2. 本 slice 不做实时 WebSocket 推送（状态通过手动刷新）。
3. 本 slice 不做计划编辑/手动上传（仅查看和操作推进）。

## 8. 留给下一 Slice 的上下文

| 项目 | 内容 |
|---|---|
| 新增文件 | `src/types/api/repair-run.ts`, `src/services/repair-run.ts` |
| 新增页面路由 | `/repair-runs` |

## 9. 实现记录

| 项目 | 内容 |
|---|---|
| 完成日期 | 2026-04-14 |
| 实际修改文件 | `src/types/api/repair-run.ts`(新), `src/services/repair-run.ts`(新), `src/pages/repair-run/RepairRunPage.tsx`(新), `src/router/routes.tsx`, `src/router/index.tsx` |
| 运行命令 | `npx tsc --noEmit` ✅, `npx vite build` ✅ |
| 遇到的问题 | `Row`/`Col` 未使用 import — 已移除 |
| 与原方案的差异 | 无差异 |
