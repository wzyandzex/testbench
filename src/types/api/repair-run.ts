/**
 * Repair Run 类型定义
 * Slice: S18
 */

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
