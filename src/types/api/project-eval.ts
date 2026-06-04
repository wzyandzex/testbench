/**
 * Project Eval 绫诲瀷瀹氫箟
 * Slice: S15, S16, S17
 */

export type SourceType = 'git' | 'zip';
export type ProjectType = 'backend' | 'frontend' | 'llm_app' | 'agent' | 'unknown';
export type RunMode = 'advisory' | 'strict';
export type EvaluationScope = 'full' | 'delta';
export type EvaluationDepth = 'quick' | 'standard' | 'deep' | 'release_gate';
export type ProjectEvalRunHealthPreset =
  | 'needs_attention'
  | 'failed_or_blocked'
  | 'pending_approval'
  | 'stale_running'
  | 'low_evidence'
  | 'repair_recommended';
export type ProjectEvalRunSavedViewVisibility = 'private' | 'organization';
export type ProjectEvalSourceUploadStatus =
  | 'pending_upload'
  | 'ready'
  | 'consumed'
  | 'expired'
  | 'failed';

export interface ProjectEvalDetectionInfo {
  engine?: string;
  project_type?: string;
  confidence?: string;
  scores?: Record<string, number>;
  signals?: string[];
  hint_used?: boolean;
  error?: string;
}

export interface ProjectEvalRiskHotspot {
  id: string;
  severity: string;
  description: string;
}

export interface ProjectEvalProfileView {
  project_type: ProjectType;
  confidence: string;
  detection_engine?: string;
  hint_used: boolean;
  scale_profile: string;
  recommended_depth: EvaluationDepth | string;
  recommended_scope: EvaluationScope;
  recommended_report_variants: string[];
  languages?: string[];
  frameworks?: string[];
  manifest_files?: string[];
  file_count?: number;
  complexity_score: number;
  risk_hotspots?: ProjectEvalRiskHotspot[];
  signals?: string[];
}

export const SOURCE_TYPE_CONFIG = {
  git: { label: 'Git repository' },
  zip: { label: 'ZIP archive' },
} as const;

export const PROJECT_TYPE_CONFIG = {
  backend: { label: 'Backend service' },
  frontend: { label: 'Frontend app' },
  llm_app: { label: 'LLM application' },
  agent: { label: 'Agent system' },
  unknown: { label: 'Unknown' },
} as const;

export const RUN_MODE_CONFIG = {
  advisory: { label: 'Advisory' },
  strict: { label: 'Strict' },
} as const;

export const EVAL_SCOPE_CONFIG = {
  full: { label: 'Full repository' },
  delta: { label: 'Changed files only' },
} as const;

export const RUN_STATUS_CONFIG = {
  pending: { label: 'Pending', color: 'default' },
  planned: { label: 'Plan ready', color: 'blue' },
  running: { label: 'Running', color: 'processing' },
  completed: { label: 'Completed', color: 'success' },
  failed: { label: 'Failed', color: 'error' },
  cancelled: { label: 'Cancelled', color: 'default' },
} as const;

export interface ProjectEvalSourceIndexSummary {
  status: string;
  chunk_count: number;
  file_count: number;
  error_message?: string;
  build_started_at?: string;
  build_completed_at?: string;
  last_updated_at?: string;
  created_at: string;
}

export interface ProjectEvalSource {
  id: string;
  organization_id: string;
  name: string;
  source_type: SourceType;
  git_url?: string;
  branch?: string;
  commit_sha?: string;
  zip_object_key?: string;
  archive_sha256?: string;
  detected_type?: ProjectType;
  detection_info?: ProjectEvalDetectionInfo;
  metadata?: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
  index?: ProjectEvalSourceIndexSummary;
  profile?: ProjectEvalProfileView;
}

export interface ProjectEvalSourceListItem {
  id: string;
  organization_id: string;
  name: string;
  source_type: SourceType;
  git_url?: string;
  branch?: string;
  commit_sha?: string;
  zip_object_key?: string;
  archive_sha256?: string;
  detected_type: ProjectType;
  created_by: string;
  created_at: string;
  updated_at: string;
  index?: ProjectEvalSourceIndexSummary;
  profile?: ProjectEvalProfileView;
}

export interface ProjectEvalSourceListParams {
  page?: number;
  page_size?: number;
  name?: string;
  source_type?: SourceType;
  detected_type?: ProjectType;
  created_by?: string;
  order_by?: 'created_at' | 'updated_at' | 'name' | 'source_type' | 'detected_type';
  order_dir?: 'asc' | 'desc';
}

export interface ProjectEvalSourceListResponse {
  page: number;
  page_size: number;
  total: number;
  items: ProjectEvalSourceListItem[];
}

export interface ProjectEvalSourceUpload {
  id: string;
  organization_id: string;
  created_by: string;
  source_type: SourceType;
  status: ProjectEvalSourceUploadStatus;
  original_filename: string;
  content_type: string;
  size_bytes: number;
  archive_sha256?: string;
  staged_object_key: string;
  final_object_key?: string;
  source_id?: string;
  error_message?: string;
  expires_at: string;
  consumed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectEvalRun {
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
  created_at: string;
  updated_at: string;
}

export interface ProjectEvalRunSourceSummary {
  id: string;
  name: string;
  source_type: SourceType;
  detected_type: ProjectType;
}

export interface ProjectEvalRunHealthSummary {
  evaluation_depth?: string;
  project_family?: string;
  framework_family?: string;
  template_family?: string;
  scale_profile?: string;
  orchestration_mode?: string;
  staged: boolean;
  large_project: boolean;
  stage_count: number;
  completed_stage_count: number;
  failed_stage_count: number;
  retryable_stage_count: number;
  stale_stage_count: number;
  module_slice_stage_count: number;
  insufficient_evidence_cases: number;
  has_insufficient_evidence: boolean;
  progress_percent: number;
  status_counts?: Record<string, number>;
  health_state: string;
  health_reasons?: string[];
  failed_stage_ids?: string[];
  failed_module_slice_ids?: string[];
  stale_stage_ids?: string[];
}
export interface ProjectEvalRunListItem {
  id: string;
  source_id: string;
  source?: ProjectEvalRunSourceSummary;
  organization_id: string;
  created_by: string;
  approved_by?: string;
  status: string;
  mode: RunMode;
  scope: EvaluationScope;
  project_type: ProjectType;
  template_version?: string;
  plan_version: number;
  score: number;
  decision: string;
  summary?: string;
  score_mode?: string;
  result_class?: string;
  truth_mode?: string;
  authoritative_truth: boolean;
  legacy_fallback_used: boolean;
  legacy_fallback_reason?: string;
  selected_case_count?: number;
  outcome?: RunReportOutcomeView;
  health?: ProjectEvalRunHealthSummary;
  evidence_posture?: RunEvidencePostureView;
  error_message?: string;
  approved: boolean;
  approved_at?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectEvalRunListParams {
  page?: number;
  page_size?: number;
  saved_view_id?: string;
  status?: string;
  statuses?: string;
  health_preset?: ProjectEvalRunHealthPreset;
  mode?: RunMode;
  project_type?: ProjectType;
  scope?: EvaluationScope;
  decision?: string;
  decisions?: string;
  evaluation_depth?: string;
  project_family?: string;
  framework_family?: string;
  template_family?: string;
  scale_profile?: string;
  orchestration_mode?: string;
  score_mode?: string;
  score_modes?: string;
  result_class?: string;
  result_classes?: string;
  truth_mode?: string;
  truth_modes?: string;
  authoritative_truth?: boolean;
  legacy_fallback_used?: boolean;
  staged_only?: boolean;
  large_project_only?: boolean;
  stage_status?: string;
  stage_kind?: string;
  stage_id?: string;
  module_slice_id?: string;
  has_failed_stages?: boolean;
  retry_required_only?: boolean;
  stale_stage_plan_only?: boolean;
  insufficient_evidence_only?: boolean;
  source_id?: string;
  created_by?: string;
  order_by?: 'created_at' | 'updated_at' | 'completed_at' | 'score' | 'status';
  order_dir?: 'asc' | 'desc';
}

export interface ProjectEvalRunListResponse {
  page: number;
  page_size: number;
  total: number;
  items: ProjectEvalRunListItem[];
}

export interface ProjectEvalRunSavedViewFilters {
  source_id?: string;
  created_by?: string;
  statuses?: string[];
  health_preset?: ProjectEvalRunHealthPreset;
  mode?: RunMode;
  project_type?: ProjectType;
  scope?: EvaluationScope;
  decisions?: string[];
  evaluation_depth?: string;
  project_family?: string;
  framework_family?: string;
  template_family?: string;
  scale_profile?: string;
  orchestration_mode?: string;
  score_modes?: string[];
  result_classes?: string[];
  truth_modes?: string[];
  authoritative_truth?: boolean;
  legacy_fallback_used?: boolean;
  staged_only?: boolean;
  large_project_only?: boolean;
  stage_status?: string;
  stage_kind?: string;
  stage_id?: string;
  module_slice_id?: string;
  has_failed_stages?: boolean;
  retry_required_only?: boolean;
  stale_stage_plan_only?: boolean;
  insufficient_evidence_only?: boolean;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
}

export interface ProjectEvalRunSavedViewColumn {
  key: string;
  label?: string;
  visible: boolean;
  order?: number;
  width?: number;
  pinned?: 'left' | 'right' | '';
}

export interface ProjectEvalRunSavedView {
  id: string;
  organization_id?: string;
  owner_user_id?: string;
  name: string;
  description?: string;
  visibility: ProjectEvalRunSavedViewVisibility;
  builtin: boolean;
  is_default: boolean;
  pinned: boolean;
  sort_order: number;
  filters: ProjectEvalRunSavedViewFilters;
  columns?: ProjectEvalRunSavedViewColumn[];
  metadata?: Record<string, unknown>;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectEvalRunSavedViewCapabilities {
  visibilities: ProjectEvalRunSavedViewVisibility[];
  filter_keys: string[];
  column_keys: string[];
  builtin: boolean;
}

export interface ProjectEvalRunSavedViewListResponse {
  organization_id: string;
  page: number;
  page_size: number;
  total: number;
  items: ProjectEvalRunSavedView[];
  builtin_items?: ProjectEvalRunSavedView[];
  default_view_id?: string;
  capabilities: ProjectEvalRunSavedViewCapabilities;
}

export interface ProjectEvalRunSavedViewListParams {
  page?: number;
  page_size?: number;
  visibility?: ProjectEvalRunSavedViewVisibility;
  order_by?: 'updated_at' | 'created_at' | 'name' | 'sort_order';
  order_dir?: 'asc' | 'desc';
}

export interface UpsertProjectEvalRunSavedViewRequest {
  name: string;
  description?: string;
  visibility?: ProjectEvalRunSavedViewVisibility;
  is_default?: boolean;
  pinned?: boolean;
  sort_order?: number;
  filters: ProjectEvalRunSavedViewFilters;
  columns?: ProjectEvalRunSavedViewColumn[];
  metadata?: Record<string, unknown>;
}

export type ProjectEvalSupportAcceptanceWorkspaceViewVisibility = 'private' | 'organization';
export type ProjectEvalSupportAcceptanceWorkspaceSection =
  | 'dashboard'
  | 'lane_dashboard'
  | 'history'
  | 'review_queue'
  | 'sample_schedule'
  | 'refresh_policies';

export interface ProjectEvalSupportAcceptanceWorkspaceFilters {
  source_id?: string;
  run_id?: string;
  project_family?: string;
  framework_family?: string;
  template_family?: string;
  evaluation_depth?: string;
  status?: string;
  freshness?: string;
  maturity?: string;
  decision?: string;
  operator_review_status?: ProjectEvalSupportAcceptanceLaneReviewStatus | string;
  authoritative_truth?: boolean;
  legacy_fallback_used?: boolean;
  has_operator_review?: boolean;
  operator_review_stale_only?: boolean;
  review_due_only?: boolean;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
}

export interface ProjectEvalSupportAcceptanceWorkspaceSampleOptions {
  limit?: number;
  include_blocked?: boolean;
  force?: boolean;
  auto_confirm?: boolean;
}

export interface ProjectEvalSupportAcceptanceWorkspaceColumn {
  key: string;
  label?: string;
  visible: boolean;
  order?: number;
  width?: number;
  pinned?: 'left' | 'right' | '';
}

export type ProjectEvalSupportAcceptanceWorkspaceTableKey =
  | 'lane_dashboard'
  | 'history'
  | 'sample_schedule'
  | 'refresh_policies';

export interface ProjectEvalSupportAcceptanceWorkspaceState {
  default_section?: ProjectEvalSupportAcceptanceWorkspaceSection;
  visible_sections?: ProjectEvalSupportAcceptanceWorkspaceSection[];
  dashboard_limit?: number;
  history_page_size?: number;
  sample_schedule?: ProjectEvalSupportAcceptanceWorkspaceSampleOptions;
  columns?: ProjectEvalSupportAcceptanceWorkspaceColumn[];
  table_layouts?: Partial<
    Record<ProjectEvalSupportAcceptanceWorkspaceTableKey, ProjectEvalSupportAcceptanceWorkspaceColumn[]>
  >;
}

export interface ProjectEvalSupportAcceptanceWorkspaceView {
  id: string;
  organization_id?: string;
  owner_user_id?: string;
  name: string;
  description?: string;
  visibility: ProjectEvalSupportAcceptanceWorkspaceViewVisibility;
  builtin: boolean;
  is_default: boolean;
  pinned: boolean;
  sort_order: number;
  filters: ProjectEvalSupportAcceptanceWorkspaceFilters;
  workspace: ProjectEvalSupportAcceptanceWorkspaceState;
  metadata?: Record<string, unknown>;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectEvalSupportAcceptanceWorkspaceViewCapabilities {
  visibilities: ProjectEvalSupportAcceptanceWorkspaceViewVisibility[];
  filter_keys: string[];
  sections: ProjectEvalSupportAcceptanceWorkspaceSection[];
  column_keys?: string[];
  table_column_keys?: Partial<Record<ProjectEvalSupportAcceptanceWorkspaceTableKey, string[]>>;
  builtin: boolean;
}

export interface ProjectEvalSupportAcceptanceWorkspaceViewListResponse {
  organization_id: string;
  page: number;
  page_size: number;
  total: number;
  items: ProjectEvalSupportAcceptanceWorkspaceView[];
  builtin_items?: ProjectEvalSupportAcceptanceWorkspaceView[];
  default_view_id?: string;
  capabilities: ProjectEvalSupportAcceptanceWorkspaceViewCapabilities;
}

export interface ProjectEvalSupportAcceptanceWorkspaceViewListParams {
  page?: number;
  page_size?: number;
  visibility?: ProjectEvalSupportAcceptanceWorkspaceViewVisibility;
  order_by?: 'updated_at' | 'created_at' | 'name' | 'sort_order';
  order_dir?: 'asc' | 'desc';
}

export interface UpsertProjectEvalSupportAcceptanceWorkspaceViewRequest {
  name: string;
  description?: string;
  visibility?: ProjectEvalSupportAcceptanceWorkspaceViewVisibility;
  is_default?: boolean;
  pinned?: boolean;
  sort_order?: number;
  filters: ProjectEvalSupportAcceptanceWorkspaceFilters;
  workspace: ProjectEvalSupportAcceptanceWorkspaceState;
  metadata?: Record<string, unknown>;
}

export interface ProjectEvalDimensionCapability {
  name: string;
  source?: string;
  default_weight: number;
  score_range?: string;
  description: string;
  cost_class: string;
  risk_level?: string;
  enabled: boolean;
  effective_weight: number;
  display_name?: string;
  required?: boolean;
  min_weight?: number;
  max_weight?: number;
}

export interface ProjectEvalAcceptanceSummary {
  ledger_id: string;
  status: string;
  freshness: string;
  last_verified_at?: string;
  next_review_due?: string;
  evidence_count: number;
  sample_count: number;
  known_gap_count: number;
}

export interface ProjectEvalSupportAcceptanceDecision {
  schema_version: string;
  lane_key?: string;
  decision: string;
  severity: string;
  allowed_by_default: boolean;
  requires_refresh: boolean;
  promotion_candidate: boolean;
  demotion_candidate: boolean;
  release_gate_blocked: boolean;
  recommended_action: string;
  reasons?: string[];
  refresh_reasons?: string[];
  decision_explanation?: string;
}

export type ProjectEvalSupportAcceptanceLaneReviewStatus =
  | 'confirmed'
  | 'accepted_with_disclosure'
  | 'refresh_requested'
  | 'promotion_approved'
  | 'demotion_approved'
  | 'blocked'
  | (string & {});

export type ProjectEvalSupportAcceptanceLaneReviewAuditAction =
  | 'created'
  | 'updated'
  | (string & {});

export interface ProjectEvalSupportAcceptanceOperatorReviewSummary {
  review_status: ProjectEvalSupportAcceptanceLaneReviewStatus;
  reason: string;
  note?: string;
  reviewed_record_id?: string;
  reviewed_run_id?: string;
  reviewed_verified_at?: string;
  reviewed_system_decision?: string;
  updated_by: string;
  updated_at: string;
  stale: boolean;
}

export interface ProjectEvalSupportAcceptanceLaneReview {
  id: string;
  organization_id: string;
  lane_key: string;
  project_family: string;
  framework_family: string;
  template_family: string;
  review_status: ProjectEvalSupportAcceptanceLaneReviewStatus;
  reason: string;
  note?: string;
  reviewed_record_id?: string;
  reviewed_run_id?: string;
  reviewed_verified_at?: string;
  reviewed_system_decision?: string;
  context?: Record<string, unknown>;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectEvalSupportAcceptanceLaneReviewAudit {
  id: string;
  review_id: string;
  organization_id: string;
  lane_key: string;
  project_family: string;
  framework_family: string;
  template_family: string;
  action: ProjectEvalSupportAcceptanceLaneReviewAuditAction;
  review_status: ProjectEvalSupportAcceptanceLaneReviewStatus;
  reason: string;
  note?: string;
  reviewed_record_id?: string;
  actor_user_id: string;
  before_snapshot?: Record<string, unknown>;
  after_snapshot?: Record<string, unknown>;
  created_at: string;
}

export interface ProjectEvalSupportAcceptanceLaneReviewListParams {
  page?: number;
  page_size?: number;
  project_family?: string;
  framework_family?: string;
  template_family?: string;
  lane_key?: string;
  review_status?: ProjectEvalSupportAcceptanceLaneReviewStatus | string;
  updated_by?: string;
  order_by?: string;
  order_dir?: 'asc' | 'desc';
}

export interface ProjectEvalSupportAcceptanceLaneReviewListResponse {
  organization_id: string;
  page: number;
  page_size: number;
  total: number;
  items: ProjectEvalSupportAcceptanceLaneReview[];
}

export interface ProjectEvalSupportAcceptanceLaneReviewAuditListParams {
  page?: number;
  page_size?: number;
  project_family?: string;
  framework_family?: string;
  template_family?: string;
  lane_key?: string;
  action?: ProjectEvalSupportAcceptanceLaneReviewAuditAction | string;
  review_status?: ProjectEvalSupportAcceptanceLaneReviewStatus | string;
  actor_user_id?: string;
}

export interface ProjectEvalSupportAcceptanceLaneReviewAuditListResponse {
  organization_id: string;
  page: number;
  page_size: number;
  total: number;
  items: ProjectEvalSupportAcceptanceLaneReviewAudit[];
}

export interface UpsertSupportAcceptanceLaneReviewRequest {
  project_family: string;
  framework_family: string;
  template_family: string;
  lane_key: string;
  review_status: ProjectEvalSupportAcceptanceLaneReviewStatus;
  reason: string;
  note?: string;
  reviewed_record_id?: string;
  reviewed_run_id?: string;
  reviewed_verified_at?: string;
  reviewed_system_decision?: string;
  context?: Record<string, unknown>;
}

export interface ProjectEvalSupportSample {
  id: string;
  name: string;
  sample_type: string;
  project_family: string;
  framework_family: string;
  template_family: string;
  depths?: string[];
  evidence_classes?: string[];
  status: string;
  notes?: string;
}

export interface ProjectEvalSupportAcceptanceRecord {
  id: string;
  project_family: string;
  framework_family: string;
  template_family: string;
  maturity: string;
  status: string;
  freshness: string;
  last_verified_at?: string;
  next_review_due?: string;
  supported_depths: string[];
  validation_lanes?: string[];
  evidence_classes?: string[];
  representative_samples?: ProjectEvalSupportSample[];
  evidence_refs?: string[];
  known_gaps?: string[];
}

export interface ProjectEvalProjectFamilyCapability {
  id: string;
  display_name: string;
  project_type: ProjectType;
  maturity: string;
  default_depth: string;
  supported_depths: string[];
  evidence_classes: string[];
  report_variants: string[];
  policy_enabled: boolean;
  acceptance?: ProjectEvalAcceptanceSummary;
  description?: string;
  limitations?: string[];
}

export interface ProjectEvalFrameworkFamilyCapability {
  id: string;
  display_name: string;
  project_family: string;
  languages: string[];
  frameworks?: string[];
  maturity: string;
  supported_depths: string[];
  evidence_classes: string[];
  validation_lanes?: string[];
  acceptance?: ProjectEvalAcceptanceSummary;
  limitations?: string[];
}

export interface ProjectEvalTemplateFamilyCapability {
  id: string;
  display_name: string;
  project_type: ProjectType;
  framework_family?: string;
  maturity: string;
  depths: string[];
  default_depth: string;
  acceptance?: ProjectEvalAcceptanceSummary;
}

export interface ProjectEvalDepthCapability {
  id: string;
  display_name: string;
  budget_class: string;
  intended_use: string;
  evidence_classes: string[];
}

export interface ProjectEvalReportVariantCapability {
  id: string;
  display_name: string;
  audience: string;
  default: boolean;
  sections: string[];
  export_targets: string[];
  description?: string;
}

export interface ProjectEvalSupportMatrix {
  manifest_version: string;
  project_families: ProjectEvalProjectFamilyCapability[];
  framework_families: ProjectEvalFrameworkFamilyCapability[];
  scale_profiles: {
    id: string;
    display_name: string;
    file_count_hint: string;
    default_depth: string;
    recommended_scopes: string[];
    orchestration: string;
    partial_evidence_semantics?: string;
  }[];
  evaluation_depths: ProjectEvalDepthCapability[];
  evidence_classes: {
    id: string;
    display_name: string;
    maturity: string;
    authoritative: boolean;
  }[];
  template_families: ProjectEvalTemplateFamilyCapability[];
  report_variants: ProjectEvalReportVariantCapability[];
  acceptance_ledger?: ProjectEvalSupportAcceptanceRecord[];
}

export interface ProjectEvalCapabilities {
  project_types: string[];
  run_modes: string[];
  scopes: string[];
  dimensions: ProjectEvalDimensionCapability[];
  active_dimensions: string[];
  support_matrix?: ProjectEvalSupportMatrix;
  report_variants?: ProjectEvalReportVariantCapability[];
}

export interface CreateSourceRequest {
  name: string;
  source_type: SourceType;
  git_url?: string;
  branch?: string;
  commit_sha?: string;
  source_upload_id?: string;
  zip_object_key?: string;
  archive_sha256?: string;
  project_type?: ProjectType;
  mode?: RunMode;
}

export interface CreateRunRequest {
  source_id: string;
  mode?: RunMode;
  project_type?: ProjectType;
  scope?: EvaluationScope;
  evaluation_depth?: string;
  project_family?: string;
  framework_family?: string;
  template_family?: string;
  report_variant?: string;
  report_variants?: string[];
  changed_files?: string[];
  candidate_benchmark_ids?: string[];
}

export interface ProjectEvalCreateRunDefaults {
  source_id: string;
  mode: RunMode;
  project_type: ProjectType;
  scope: EvaluationScope;
  evaluation_depth: string;
  project_family: string;
  framework_family: string;
  template_family: string;
  report_variant: string;
  report_variants: string[];
  changed_files_required: boolean;
  candidate_benchmark_ids?: string[];
}

export interface ProjectEvalDefaultsOptions {
  project_types: ProjectType[];
  run_modes: RunMode[];
  scopes: EvaluationScope[];
  project_families: ProjectEvalProjectFamilyCapability[];
  framework_families: ProjectEvalFrameworkFamilyCapability[];
  template_families: ProjectEvalTemplateFamilyCapability[];
  evaluation_depths: ProjectEvalDepthCapability[];
  report_variants: ProjectEvalReportVariantCapability[];
  acceptance_ledger?: ProjectEvalSupportAcceptanceRecord[];
}

export interface ProjectEvalDefaultsSupport {
  matrix_version: string;
  project_family?: ProjectEvalProjectFamilyCapability;
  framework_family?: ProjectEvalFrameworkFamilyCapability;
  template_family?: ProjectEvalTemplateFamilyCapability;
  acceptance?: ProjectEvalAcceptanceSummary;
  decision?: ProjectEvalSupportAcceptanceDecision;
  status?: string;
  freshness?: string;
  maturity?: string;
  representative_samples?: ProjectEvalSupportSample[];
  evidence_refs?: string[];
  known_gaps?: string[];
  limitations?: string[];
}

export interface RunPlanningGuidanceView {
  schema_version: string;
  project_type?: ProjectType;
  recommended_scope?: EvaluationScope;
  detection_confidence?: string;
  project_family?: string;
  framework_family?: string;
  template_family?: string;
  evaluation_depth?: string;
  scale_profile?: string;
  orchestration_mode?: string;
  case_selection_mode?: string;
  runner_policy_hint?: string;
  budget_class?: string;
  case_budget?: string;
  timeout_multiplier?: number;
  max_stage_count?: number;
  stage_count?: number;
  runtime_image?: string;
  resource_profile?: string;
  validation_lane?: string;
  test_selection_policy?: string;
  lane_scope?: string;
  allow_partial: boolean;
  partial_result_policy?: string;
  requires_truth_lineage: boolean;
  large_project_strategy_enabled: boolean;
  staged_execution_enabled: boolean;
  module_slicing_enabled: boolean;
  module_slice_count?: number;
  candidate_case_count?: number;
  selected_case_count?: number;
  evidence_classes?: string[];
  authoritative_evidence_classes?: string[];
  diagnostic_evidence_classes?: string[];
  deferred_evidence_classes?: string[];
  setup_commands?: string[];
  setup_command_candidates?: string[];
  test_command_candidates?: string[];
  support_command_candidates?: string[];
  cost_posture?: string;
  speed_posture?: string;
  confidence_posture?: string;
  summary?: string;
  recommended_for?: string[];
  tradeoffs?: string[];
  warnings?: string[];
  next_actions?: string[];
}

export interface ProjectEvalDefaultsPreview {
  evaluation_profile: Record<string, unknown>;
  execution_profile: Record<string, unknown>;
  budget_profile: Record<string, unknown>;
  evidence_plan: Record<string, unknown>;
  module_slicing_plan?: Record<string, unknown>;
  large_project_strategy: Record<string, unknown>;
  staged_execution_plan: Record<string, unknown>;
  evidence_accounting: Record<string, unknown>;
  planning_guidance?: RunPlanningGuidanceView;
  runner_profile: Record<string, unknown>;
  agent_orchestration_contract: Record<string, unknown>;
}

export interface ProjectEvalDefaultsBlock {
  option_type: string;
  value: string;
  reason: string;
  message: string;
}

export interface ProjectEvalDefaultsNote {
  id: string;
  severity: string;
  message: string;
}

export interface ProjectEvalDefaults {
  source_id: string;
  organization_id: string;
  allowed: boolean;
  source_profile?: ProjectEvalProfileView;
  defaults?: ProjectEvalCreateRunDefaults;
  options: ProjectEvalDefaultsOptions;
  support?: ProjectEvalDefaultsSupport;
  preview?: ProjectEvalDefaultsPreview;
  policy_blocks?: ProjectEvalDefaultsBlock[];
  notes?: ProjectEvalDefaultsNote[];
}

// ============= Stage Progress + Module Slice Execution =============
export type RunStageStatus =
  | 'scheduled'
  | 'running'
  | 'completed'
  | 'failed'
  | 'skipped'
  | (string & {});

export interface ModuleSliceCommandCandidate {
  kind?: string;
  source?: string;
  command?: string[];
  command_text?: string;
  workdir?: string;
  confidence?: string;
  [key: string]: unknown;
}

export interface ModuleSliceCommandSignals {
  planned_setup?: string[];
  planned_validation?: string[];
  discovered_validation?: ModuleSliceCommandCandidate[];
  selected_candidate?: ModuleSliceCommandCandidate;
  [key: string]: unknown;
}

export interface ModuleSliceCommandExecutionTiming {
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  wall_duration_ms?: number;
  acquire_duration_ms?: number;
  exec_duration_ms?: number;
  timeout_ms?: number;
  [key: string]: unknown;
}

export interface ModuleSliceCommandExecutionLogStream {
  text?: string;
  truncated?: boolean;
  bytes?: number;
  original_bytes?: number;
  [key: string]: unknown;
}

export interface ModuleSliceCommandExecutionLogs {
  format?: string;
  limit_bytes?: number;
  stdout?: ModuleSliceCommandExecutionLogStream;
  stderr?: ModuleSliceCommandExecutionLogStream;
  [key: string]: unknown;
}

export interface ModuleSliceCommandExecutionFailure {
  class?: string;
  reason?: string;
  retryable?: boolean;
  [key: string]: unknown;
}

export interface ModuleSliceCommandExecutionArtifacts {
  raw_trace_available?: boolean;
  downloadable?: boolean;
  trace_ref?: string;
  object_key?: string;
  content_type?: string;
  size_bytes?: number;
  sha256?: string;
  created_at?: string;
  download_url?: string;
  download_url_expires_at?: string;
  download_error?: string;
  error_message?: string;
  reason?: string;
  [key: string]: unknown;
}

export interface ModuleSliceCommandExecutionPayload {
  policy_version?: string;
  mode?: string;
  status?: string;
  outcome?: string;
  command?: string[];
  command_text?: string;
  workdir?: string;
  runtime_image?: string;
  sandbox_id?: string;
  exit_code?: number;
  duration_ms?: number;
  timeout_ms?: number;
  acquire_duration_ms?: number;
  exec_duration_ms?: number;
  wall_duration_ms?: number;
  timed_out?: boolean;
  signaled?: boolean;
  signal?: string;
  stdout?: string;
  stderr?: string;
  stdout_truncated?: boolean;
  stderr_truncated?: boolean;
  stdout_bytes?: number;
  stderr_bytes?: number;
  stdout_original_bytes?: number;
  stderr_original_bytes?: number;
  output_limit_bytes?: number;
  log_format?: string;
  failure_class?: string;
  failure_reason?: string;
  retryable?: boolean;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  timing?: ModuleSliceCommandExecutionTiming;
  logs?: ModuleSliceCommandExecutionLogs;
  failure?: ModuleSliceCommandExecutionFailure;
  artifacts?: ModuleSliceCommandExecutionArtifacts;
  [key: string]: unknown;
}

export interface ModuleSliceExecutionSignals {
  schema_version?: string;
  generated_at?: string;
  authority?: string;
  status?: string;
  outcome?: string;
  readiness?: string;
  confidence?: string;
  command_execution?: string;
  run_id?: string;
  organization_id?: string;
  source_id?: string;
  plan_version?: number;
  stage_record_id?: string;
  stage_id?: string;
  stage_kind?: string;
  stage_order?: number;
  module_slice_id?: string;
  module_path?: string;
  validation_lane?: string;
  runtime_image?: string;
  framework_family?: string;
  template_family?: string;
  evaluation_depth?: string;
  unavailable_reason?: string;
  risks?: string[];
  commands?: ModuleSliceCommandSignals;
  execution?: ModuleSliceCommandExecutionPayload;
  module?: Record<string, unknown>;
  tests?: Record<string, unknown>;
  coverage?: Record<string, unknown>;
  materialization?: Record<string, unknown>;
  planned_module_slice?: Record<string, unknown>;
  runner_profile?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ModuleSliceExecutionSummary {
  schema_version?: string;
  generated_at?: string;
  module_slice_count?: number;
  ready_count?: number;
  source_backed_count?: number;
  status_counts?: Record<string, number>;
  outcome_counts?: Record<string, number>;
  readiness_counts?: Record<string, number>;
  authority_counts?: Record<string, number>;
  validation_lane_counts?: Record<string, number>;
  command_execution_counts?: Record<string, number>;
  command_outcome_counts?: Record<string, number>;
  partial_result_semantics?: string;
  requires_report_disclosure?: boolean;
  supports_admin_stage_retry?: boolean;
  supports_frontend_dashboard?: boolean;
  [key: string]: unknown;
}

export interface RunStageRecordView {
  id: string;
  run_id: string;
  organization_id: string;
  source_id: string;
  plan_version: number;
  stage_id: string;
  stage_order: number;
  stage_kind: string;
  stage_name: string;
  module_slice_id?: string;
  module_path?: string;
  status: RunStageStatus;
  terminal: boolean;
  retryable: boolean;
  retry_blocked_reason?: string;
  payload?: Record<string, unknown>;
  result?: Record<string, unknown>;
  execution_signals?: ModuleSliceExecutionSignals;
  error_message?: string;
  scheduled_at: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface RunStageProgressView {
  run_id: string;
  organization_id: string;
  source_id: string;
  run_status: string;
  plan_version: number;
  stage_count: number;
  terminal_stage_id?: string;
  status_counts: Record<string, number>;
  completed_count: number;
  failed_count: number;
  retryable_count: number;
  progress_percent: number;
  staged_execution_plan?: Record<string, unknown>;
  module_slicing_plan?: Record<string, unknown>;
  module_slice_execution_summary?: ModuleSliceExecutionSummary;
  items: RunStageRecordView[];
}

export interface RunStageRetryView {
  run_id: string;
  organization_id: string;
  stage_record_id: string;
  stage_id: string;
  stage_kind: string;
  module_slice_id?: string;
  status: RunStageStatus;
  queued: boolean;
  requested_by?: string;
  requested_at: string;
  message?: Record<string, unknown>;
}
// ============= S16: Run Detail + Plan + Evidence + Mainline =============

// --- Selection Status ---
export type SelectionStatus = 'selected' | 'skipped' | 'forced_included' | 'forced_excluded';

export const SELECTION_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  selected: { label: 'Selected', color: 'green' },
  skipped: { label: 'Skipped', color: 'default' },
  forced_included: { label: 'Forced include', color: 'blue' },
  forced_excluded: { label: 'Forced exclude', color: 'red' },
};

// --- Final Decision ---
export type FinalDecision = 'pass' | 'warn' | 'block';

export const FINAL_DECISION_CONFIG: Record<string, { label: string; color: string }> = {
  pass: { label: 'Pass', color: 'green' },
  warn: { label: 'Warn', color: 'orange' },
  block: { label: 'Block', color: 'red' },
};

// --- Remediation ---
export type RemediationOutcomeCategory =
  | 'pending'
  | 'improved'
  | 'unchanged'
  | 'regressed'
  | 'non_comparable'
  | 'failed'
  | 'unavailable'
  | 'missing_feedback';

export const REMEDIATION_CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'default' },
  improved: { label: 'Improved', color: 'green' },
  unchanged: { label: 'Unchanged', color: 'blue' },
  regressed: { label: 'Regressed', color: 'red' },
  non_comparable: { label: 'Non-comparable', color: 'default' },
  failed: { label: 'Failed', color: 'red' },
  unavailable: { label: 'Unavailable', color: 'default' },
  missing_feedback: { label: 'Missing feedback', color: 'default' },
};

// --- Mainline Stage ---
export const MAINLINE_STAGE_CONFIG: Record<
  string,
  { label: string; color: string; terminal: boolean }
> = {
  eval_waiting_approval: { label: 'Waiting for approval', color: 'orange', terminal: false },
  eval_pending_execution: { label: 'Ready to run', color: 'blue', terminal: false },
  eval_running: { label: 'Evaluation running', color: 'processing', terminal: false },
  eval_failed: { label: 'Evaluation failed', color: 'red', terminal: true },
  eval_cancelled: { label: 'Evaluation cancelled', color: 'default', terminal: true },
  eval_completed_non_authoritative: {
    label: 'Completed with fallback authority',
    color: 'gold',
    terminal: true,
  },
  eval_completed_no_action: { label: 'Completed without repair', color: 'green', terminal: true },
  repair_available: { label: 'Repair available', color: 'orange', terminal: false },
  repair_created: { label: 'Repair created', color: 'blue', terminal: false },
  repair_planning: { label: 'Repair planning', color: 'processing', terminal: false },
  repair_approval_pending: { label: 'Repair awaiting approval', color: 'orange', terminal: false },
  repair_approved: { label: 'Repair approved', color: 'cyan', terminal: false },
  repair_applying: { label: 'Repair applying', color: 'processing', terminal: false },
  repair_failed: { label: 'Repair failed', color: 'red', terminal: true },
  repair_cancelled: { label: 'Repair cancelled', color: 'default', terminal: true },
  replay_available: { label: 'Replay available', color: 'orange', terminal: false },
  replay_pending: { label: 'Replay pending', color: 'blue', terminal: false },
  replay_running: { label: 'Replay running', color: 'processing', terminal: false },
  replay_completed: { label: 'Replay completed', color: 'green', terminal: true },
  replay_failed: { label: 'Replay failed', color: 'red', terminal: true },
  replay_unavailable: { label: 'Replay unavailable', color: 'default', terminal: true },
};

export const MAINLINE_STAGE_GROUPS = [
  {
    label: 'Evaluation',
    stages: [
      'eval_waiting_approval',
      'eval_pending_execution',
      'eval_running',
      'eval_completed_no_action',
      'eval_completed_non_authoritative',
      'eval_failed',
      'eval_cancelled',
    ],
  },
  {
    label: 'Repair',
    stages: [
      'repair_available',
      'repair_created',
      'repair_planning',
      'repair_approval_pending',
      'repair_approved',
      'repair_applying',
      'repair_failed',
      'repair_cancelled',
    ],
  },
  {
    label: 'Replay',
    stages: [
      'replay_available',
      'replay_pending',
      'replay_running',
      'replay_completed',
      'replay_failed',
      'replay_unavailable',
    ],
  },
];

export const MAINLINE_ACTION_LABEL: Record<string, string> = {
  confirm_run_execution: 'Confirm execution',
  create_linked_repair_run: 'Create repair run',
  start_repair_planning: 'Start repair planning',
  approve_repair_plan: 'Approve repair plan',
  start_repair_apply: 'Start repair apply',
  request_replay: 'Request replay',
};

// --- Run Detail View ---
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
  score_mode?: string;
  result_class?: string;
  truth_mode?: string;
  processor_profile?: string;
  outcome_authority_source?: string;
  authoritative_truth: boolean;
  legacy_fallback_used: boolean;
  legacy_fallback_reason?: string;
  evidence_posture?: RunEvidencePostureView;
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

export interface RunEvidenceReverificationPostureView {
  status?: string;
  mode?: string;
  authority_status?: string;
  degraded_reason?: string;
  observed_cases?: number;
  matched_cases?: number;
  mismatched_cases?: number;
  authority_counts?: Record<string, number>;
  issue_state_counts?: Record<string, number>;
}

export interface RunEvidencePostureView {
  status: string;
  authoritative_ready: boolean;
  insufficient_evidence: boolean;
  insufficient_evidence_reason?: string;
  truth_source_mode?: string;
  selected_cases: number;
  evaluated_cases: number;
  insufficient_cases: number;
  current_run_execution_cases?: number;
  benchmark_fusion_cases?: number;
  missing_current_run_execution_cases?: number;
  truth_source_counts?: Record<string, number>;
  binding_resolution_counts?: Record<string, number>;
  reverification?: RunEvidenceReverificationPostureView;
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
  final_risk_level: string;
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
  stage: string;
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
  repair_refusal_reason?: string;
  latest_linked_repair?: LinkedRepairRunSummaryView;
  latest_remediation_outcome?: RunRemediationOutcomeView;
}

export type ContractComplianceStatus =
  | 'satisfied'
  | 'partial'
  | 'gap'
  | 'unavailable'
  | 'not_required'
  | 'unknown'
  | (string & {});

export interface ContractCheckResult {
  id: string;
  required: boolean;
  status: ContractComplianceStatus;
  severity?: string;
  expectation?: string;
  reason?: string;
  evidence?: string[];
}

export interface ContractDeliverableResult {
  id: string;
  required: boolean;
  status: ContractComplianceStatus;
  audience?: string;
  content?: string[];
  reason?: string;
  evidence?: string[];
}

export interface ContractGap {
  id: string;
  type: string;
  required: boolean;
  severity?: string;
  message?: string;
  recommended_action?: string;
}

export interface ContractCompliance {
  contract_kind?: string;
  contract_version?: string;
  owner?: string;
  source?: string;
  execution_record_id?: string;
  status: ContractComplianceStatus;
  score: number;
  summary?: string;
  required_satisfied: number;
  required_total: number;
  optional_satisfied: number;
  optional_total: number;
  required_gap_count: number;
  gap_count: number;
  self_checks?: ContractCheckResult[];
  deliverables?: ContractDeliverableResult[];
  gaps?: ContractGap[];
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
  planning_contract_compliance?: ContractCompliance;
  apply_contract_compliance?: ContractCompliance;
  latest_contract_compliance?: ContractCompliance;
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

export type RunReportOutcomeKind = 'repair' | 'replay' | 'refusal' | 'neutral';

export interface RunReportOutcomeView {
  kind: RunReportOutcomeKind | string;
  label: string;
  stage?: string;
  explain?: string;
  decision?: string;
  outcome_authority_source?: string;
  authoritative_truth: boolean;
  repair_eligible: boolean;
  replay_eligible: boolean;
  refusal_reason?: string;
  next_action?: string;
  next_action_label?: string;
  next_action_reason?: string;
  linked_repair?: LinkedRepairRunSummaryView;
  remediation_outcome?: RunRemediationOutcomeView;
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

export interface ExecuteReportActionRequest {
  target_type?: string;
  target_id?: string;
  target_variant?: string;
  snapshot_guard?: SnapshotGuard;
}

export interface ReportActionTargetView {
  type?: string;
  id?: string;
  variant?: string;
}

export interface ReportActionResult {
  run_id: string;
  action: string;
  disposition: 'executed' | 'already_satisfied' | 'stale' | 'unavailable';
  message?: string;
  target?: ReportActionTargetView;
  mainline?: RunMainlineView;
  report?: RunReportView;
}

// ============= S17: Report + Insights + Policy =============

// --- Run Report ---
export type RunReportVariant = 'summary' | 'executive' | 'technical' | 'evidence' | 'remediation';

export interface RunReportSectionView {
  id: string;
  title: string;
  summary?: string;
  severity?: string;
  items?: string[];
  metrics?: Record<string, unknown>;
}

export interface RunReportNextActionView {
  id: string;
  label: string;
  priority: string;
  recommended: boolean;
  reason?: string;
  target_type?: string;
  target_id?: string;
  target_variant?: string;
}

export interface RunSupportPostureView {
  matrix_version?: string;
  project_family?: string;
  project_family_name?: string;
  framework_family?: string;
  framework_family_name?: string;
  template_family?: string;
  template_family_name?: string;
  evaluation_depth?: string;
  scale_profile?: string;
  project_type?: ProjectType;
  recommended_scope?: EvaluationScope;
  detection_confidence?: string;
  status?: string;
  freshness?: string;
  maturity?: string;
  policy_enabled: boolean;
  depth_supported: boolean;
  acceptance?: ProjectEvalAcceptanceSummary;
  decision?: ProjectEvalSupportAcceptanceDecision;
  representative_samples?: ProjectEvalSupportSample[];
  evidence_refs?: string[];
  known_gaps?: string[];
  limitations?: string[];
  validation_lanes?: string[];
  evidence_classes?: string[];
  supported_depths?: string[];
  operator_review?: ProjectEvalSupportAcceptanceOperatorReviewSummary;
}

export interface RunLargeProjectCoverageView {
  enabled: boolean;
  status: string;
  severity: string;
  summary?: string;
  scale_profile?: string;
  evaluation_depth?: string;
  orchestration_mode?: string;
  partial_result_policy?: string;
  sampling_policy?: string;
  coverage_floor_policy?: string;
  stage_count?: number;
  planned_stage_count?: number;
  module_slice_count?: number;
  ready_module_slice_count?: number;
  source_backed_module_slice_count?: number;
  executed_module_slice_command_count?: number;
  failed_module_slice_command_count?: number;
  module_slice_readiness_counts?: Record<string, number>;
  module_slice_outcome_counts?: Record<string, number>;
  module_slice_command_outcome_counts?: Record<string, number>;
  candidate_case_count?: number;
  selected_case_count?: number;
  sampled_case_count?: number;
  evaluated_case_count?: number;
  skipped_candidate_case_count?: number;
  deferred_candidate_case_count?: number;
  insufficient_evidence_case_count?: number;
  deferred_evidence_classes?: string[];
  disclosure_requirements?: string[];
  requires_skipped_disclosure: boolean;
  requires_deferred_disclosure: boolean;
  requires_module_slice_disclosure: boolean;
  total_repository_case_count_known: boolean;
  coverage_score?: number;
  module_slice_readiness_ratio?: number;
  evaluation_coverage_ratio?: number;
  risk_flags?: string[];
  next_actions?: string[];
}

export interface RunReportView {
  run_id: string;
  view_variant?: RunReportVariant | string;
  audience?: string;
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
  module_slicing_plan?: Record<string, unknown>;
  large_project_strategy?: Record<string, unknown>;
  staged_execution_plan?: Record<string, unknown>;
  evidence_accounting?: Record<string, unknown>;
  planning_guidance?: RunPlanningGuidanceView;
  large_project_coverage?: RunLargeProjectCoverageView;
  agent_orchestration_contract?: Record<string, unknown>;
  support_posture?: RunSupportPostureView;
  evidence_summary?: RunEvidenceSummary;
  evidence_posture?: RunEvidencePostureView;
  module_slice_execution_summary?: ModuleSliceExecutionSummary;
  module_slice_execution_signals?: ModuleSliceExecutionSignals[];
  mainline?: RunMainlineView;
  remediation?: RunRemediationView;
  outcome?: RunReportOutcomeView;
  sections?: RunReportSectionView[];
  next_actions?: RunReportNextActionView[];
  available_variants?: string[];
  export_targets?: string[];
  report?: Record<string, unknown>;
}

export type RunReportExportFormat = 'json' | 'markdown' | 'csv';

export interface RunReportEvidenceExportView {
  included: boolean;
  summary?: RunEvidenceSummary;
  decisions?: string[];
  limit: number;
  record_count: number;
  total_records: number;
  truncated: boolean;
  records?: RunEvidenceRecordView[];
}

export interface RunReportTraceSelectionView {
  include_raw_traces: boolean;
  stage_statuses?: string[];
  stage_ids?: string[];
  module_slice_ids?: string[];
  trace_limit: number;
}

export interface RunReportTraceAttachmentView {
  id: string;
  artifact_kind: string;
  stage_record_id: string;
  stage_id: string;
  stage_kind: string;
  stage_name?: string;
  stage_status: string;
  module_slice_id?: string;
  module_path?: string;
  object_key?: string;
  trace_ref?: string;
  content_type?: string;
  size_bytes?: number;
  sha256?: string;
  downloadable: boolean;
  download_url?: string;
  download_url_expires_at?: string;
  created_at?: string;
  reason?: string;
}

export interface RunReportAttachmentPackageView {
  schema_version: string;
  run_id: string;
  organization_id: string;
  included: boolean;
  selection: RunReportTraceSelectionView;
  attachment_count: number;
  matched_count: number;
  truncated: boolean;
  attachments?: RunReportTraceAttachmentView[];
}

export interface RunReportExportManifestView {
  schema_version: string;
  run_id: string;
  organization_id: string;
  variant: string;
  audience?: string;
  format: string;
  file_name: string;
  content_type: string;
  encoding: string;
  generated_at: string;
  report_included?: boolean;
  report_status?: string;
  decision?: string;
  score?: number;
  score_mode?: string;
  result_class?: string;
  truth_mode?: string;
  processor_profile?: string;
  outcome_authority_source?: string;
  authoritative_truth?: boolean;
  legacy_fallback_used?: boolean;
  legacy_fallback_reason?: string;
  insufficient_evidence_reason?: string;
  evidence_posture?: RunEvidencePostureView;
  evidence_included: boolean;
  evidence_limit?: number;
  evidence_decisions?: string[];
  evidence_record_count: number;
  evidence_total_records?: number;
  raw_traces_included: boolean;
  trace_limit?: number;
  trace_stage_statuses?: string[];
  trace_stage_ids?: string[];
  module_slice_ids?: string[];
  attachment_count: number;
  matched_attachment_count: number;
  truncated: boolean;
  section_ids?: string[];
  next_action_ids?: string[];
  next_actions?: RunReportNextActionView[];
  warnings?: string[];
}

export interface RunReportExportView {
  schema_version: string;
  run_id: string;
  organization_id: string;
  variant: string;
  audience?: string;
  format: RunReportExportFormat | string;
  file_name: string;
  content_type: string;
  encoding: string;
  generated_at: string;
  manifest?: RunReportExportManifestView;
  report?: RunReportView;
  evidence?: RunReportEvidenceExportView;
  attachment_package?: RunReportAttachmentPackageView;
  content: string;
  warnings?: string[];
}

export interface RunReportExportParams {
  variant?: string;
  format?: RunReportExportFormat | string;
  include_evidence_records?: boolean;
  evidence_decision?: string;
  evidence_limit?: number;
  include_raw_traces?: boolean;
  trace_stage_status?: string;
  trace_stage_id?: string;
  module_slice_id?: string;
  trace_limit?: number;
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
  evidence_posture?: RunEvidencePostureView;
  module_slice_execution_summary?: ModuleSliceExecutionSummary;
  module_slice_execution_signals?: ModuleSliceExecutionSignals[];
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
  authoritative_runs: number;
  compatibility_runs: number;
  insufficient_evidence_runs: number;
  current_run_execution_ready_runs: number;
  missing_current_run_execution_runs: number;
  current_run_execution_cases: number;
  missing_current_run_execution_cases: number;
  authoritative_average_score: number;
  compatibility_average_score: number;
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
  insufficient_evidence_runs: number;
  current_run_execution_ready_runs: number;
  missing_current_run_execution_runs: number;
  current_run_execution_cases: number;
  missing_current_run_execution_cases: number;
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
  current_run_execution_ready_runs: number;
  missing_current_run_execution_runs: number;
  current_run_execution_cases: number;
  missing_current_run_execution_cases: number;
  daily_trends: RunDailyTrend[];
  [key: string]: unknown;
}

// --- Support Acceptance History ---
export interface ProjectEvalSupportAcceptanceHistoryParams {
  page?: number;
  page_size?: number;
  source_id?: string;
  run_id?: string;
  project_family?: string;
  framework_family?: string;
  template_family?: string;
  evaluation_depth?: string;
  status?: string;
  freshness?: string;
  maturity?: string;
  decision?: string;
  operator_review_status?: ProjectEvalSupportAcceptanceLaneReviewStatus | string;
  authoritative_truth?: boolean;
  legacy_fallback_used?: boolean;
  has_operator_review?: boolean;
  operator_review_stale_only?: boolean;
  review_due_only?: boolean;
  order_by?:
    | 'verified_at'
    | 'created_at'
    | 'updated_at'
    | 'score'
    | 'status'
    | 'project_family'
    | 'framework_family';
  order_dir?: 'asc' | 'desc';
}

export interface ProjectEvalSupportAcceptanceDashboardParams {
  project_family?: string;
  framework_family?: string;
  template_family?: string;
  evaluation_depth?: string;
  status?: string;
  freshness?: string;
  maturity?: string;
  operator_review_status?: ProjectEvalSupportAcceptanceLaneReviewStatus | string;
  has_operator_review?: boolean;
  operator_review_stale_only?: boolean;
  limit?: number;
}

export interface ProjectEvalSupportAcceptanceReviewQueueParams {
  page?: number;
  page_size?: number;
  project_family?: string;
  framework_family?: string;
  template_family?: string;
  evaluation_depth?: string;
  status?: string;
  freshness?: string;
  maturity?: string;
  operator_review_status?: ProjectEvalSupportAcceptanceLaneReviewStatus | string;
  has_operator_review?: boolean;
  operator_review_stale_only?: boolean;
}

export interface ProjectEvalSupportAcceptanceFilterView {
  source_id?: string;
  run_id?: string;
  project_family?: string;
  framework_family?: string;
  template_family?: string;
  evaluation_depth?: string;
  status?: string;
  freshness?: string;
  maturity?: string;
  decision?: string;
  operator_review_status?: ProjectEvalSupportAcceptanceLaneReviewStatus | string;
  authoritative_truth?: boolean;
  legacy_fallback_used?: boolean;
  has_operator_review?: boolean;
  operator_review_stale_only?: boolean;
  review_due_only?: boolean;
}

export interface ProjectEvalSupportAcceptanceHistorySummary {
  total_records: number;
  accepted_records: number;
  provisional_records: number;
  exploratory_records: number;
  fresh_records: number;
  aging_records: number;
  stale_records: number;
  authoritative_records: number;
  compatibility_fallback_records: number;
  review_due_records: number;
  status_distribution: Record<string, number>;
  freshness_distribution: Record<string, number>;
  maturity_distribution: Record<string, number>;
  depth_distribution: Record<string, number>;
}

export interface ProjectEvalSupportAcceptanceHistoryItem {
  id: string;
  organization_id: string;
  source_id: string;
  run_id: string;
  lane_key: string;
  project_family: string;
  framework_family: string;
  template_family: string;
  evaluation_depth: string;
  report_variant?: string;
  report_variants?: string[];
  status: string;
  freshness: string;
  maturity: string;
  score: number;
  decision?: string;
  authoritative_truth: boolean;
  legacy_fallback_used: boolean;
  legacy_fallback_reason?: string;
  sample_id: string;
  sample_name: string;
  sample_type: string;
  validation_lanes?: string[];
  evidence_classes?: string[];
  evidence_refs?: string[];
  known_gaps?: string[];
  verified_at: string;
  last_verified_at?: string;
  next_review_due?: string;
  review_due: boolean;
  review_state: string;
  review_priority: string;
  operator_review?: ProjectEvalSupportAcceptanceOperatorReviewSummary;
  created_at: string;
  updated_at: string;
}

export interface ProjectEvalSupportAcceptanceHistoryResponse {
  organization_id: string;
  generated_at: string;
  page: number;
  page_size: number;
  total: number;
  filter: ProjectEvalSupportAcceptanceFilterView;
  items: ProjectEvalSupportAcceptanceHistoryItem[];
  summary: ProjectEvalSupportAcceptanceHistorySummary;
}

export interface ProjectEvalSupportAcceptanceReviewQueueResponse {
  organization_id: string;
  generated_at: string;
  page: number;
  page_size: number;
  total: number;
  filter: ProjectEvalSupportAcceptanceFilterView;
  items: ProjectEvalSupportAcceptanceLaneSummary[];
}

export interface ProjectEvalSupportAcceptanceRepresentativeSample {
  record_id: string;
  run_id: string;
  source_id: string;
  sample_id: string;
  sample_name: string;
  sample_type: string;
  depth?: string;
  score: number;
  decision?: string;
  verified_at?: string;
  review_state: string;
}

export interface ProjectEvalSupportAcceptanceLaneSummary {
  lane_key: string;
  project_family: string;
  framework_family: string;
  template_family: string;
  latest_record_id: string;
  latest_run_id: string;
  latest_source_id: string;
  latest_status: string;
  latest_freshness: string;
  latest_maturity: string;
  latest_decision?: string;
  latest_score: number;
  last_verified_at?: string;
  next_review_due?: string;
  review_due: boolean;
  review_state: string;
  review_priority: string;
  record_count: number;
  authoritative_count: number;
  compatibility_fallback_count: number;
  known_gap_count: number;
  depths?: string[];
  validation_lanes?: string[];
  evidence_classes?: string[];
  decision?: ProjectEvalSupportAcceptanceDecision;
  operator_review?: ProjectEvalSupportAcceptanceOperatorReviewSummary;
  recent_representative_samples?: ProjectEvalSupportAcceptanceRepresentativeSample[];
  queue_reasons?: string[];
}

export interface ProjectEvalSupportAcceptanceDashboard {
  organization_id: string;
  generated_at: string;
  record_scan_limit: number;
  truncated: boolean;
  filter: ProjectEvalSupportAcceptanceFilterView;
  summary: ProjectEvalSupportAcceptanceHistorySummary;
  total_lanes: number;
  fresh_lanes: number;
  aging_lanes: number;
  stale_lanes: number;
  review_due_lanes: number;
  authoritative_lanes: number;
  compatibility_fallback_lanes: number;
  project_family_distribution: Record<string, number>;
  framework_family_distribution: Record<string, number>;
  template_family_distribution: Record<string, number>;
  lane_summaries: ProjectEvalSupportAcceptanceLaneSummary[];
  review_queue: ProjectEvalSupportAcceptanceLaneSummary[];
  recent_representative_samples: ProjectEvalSupportAcceptanceRepresentativeSample[];
}

export interface ProjectEvalSupportAcceptanceSampleScheduleParams extends ProjectEvalSupportAcceptanceDashboardParams {
  include_blocked?: boolean;
  force?: boolean;
  mode?: RunMode;
  scope?: EvaluationScope;
  report_variant?: string;
  report_variants?: string;
}

export interface ScheduleSupportAcceptanceSamplesRequest {
  project_family?: string;
  framework_family?: string;
  template_family?: string;
  evaluation_depth?: string;
  status?: string;
  freshness?: string;
  maturity?: string;
  operator_review_status?: ProjectEvalSupportAcceptanceLaneReviewStatus | string;
  has_operator_review?: boolean;
  operator_review_stale_only?: boolean;
  limit?: number;
  include_blocked?: boolean;
  force?: boolean;
  auto_confirm?: boolean;
  mode?: RunMode;
  scope?: EvaluationScope;
  report_variant?: string;
  report_variants?: string[];
}

export interface ProjectEvalSupportAcceptanceSampleScheduleCandidate {
  lane_key: string;
  project_family: string;
  framework_family: string;
  template_family: string;
  project_type: ProjectType;
  evaluation_depth: string;
  mode: RunMode;
  scope: EvaluationScope;
  report_variant: string;
  report_variants: string[];
  refresh_reasons: string[];
  status: string;
  blocked_reason?: string;
  error_message?: string;
  source_id?: string;
  sample: ProjectEvalSupportAcceptanceRepresentativeSample;
  refresh_run_id?: string;
  latest_record_id?: string;
  latest_run_id?: string;
  latest_status?: string;
  latest_freshness?: string;
  latest_maturity?: string;
  latest_decision?: string;
  latest_score: number;
  last_verified_at?: string;
  next_review_due?: string;
  review_due: boolean;
  review_state: string;
  review_priority: string;
  record_count: number;
  validation_lanes?: string[];
  evidence_classes?: string[];
  decision?: ProjectEvalSupportAcceptanceDecision;
  operator_review?: ProjectEvalSupportAcceptanceOperatorReviewSummary;
}

export interface ProjectEvalSupportAcceptanceSampleSchedule {
  organization_id: string;
  generated_at: string;
  limit: number;
  include_blocked: boolean;
  force: boolean;
  auto_confirm?: boolean;
  mode: RunMode;
  scope: EvaluationScope;
  report_variant: string;
  report_variants: string[];
  filter: ProjectEvalSupportAcceptanceFilterView;
  total_candidates: number;
  executable_candidates: number;
  blocked_candidates: number;
  created_runs: number;
  confirmed_runs: number;
  failed_runs: number;
  items: ProjectEvalSupportAcceptanceSampleScheduleCandidate[];
}

export type ProjectEvalSupportAcceptanceRefreshCadence = 'manual' | 'daily' | 'weekly' | 'monthly';

export interface ProjectEvalSupportAcceptanceRefreshPolicyParams {
  page?: number;
  page_size?: number;
  enabled?: boolean;
  cadence?: ProjectEvalSupportAcceptanceRefreshCadence;
  last_trigger_status?: string;
  due_only?: boolean;
  order_by?: 'updated_at' | 'created_at' | 'name' | 'cadence' | 'next_run_at' | 'last_run_at';
  order_dir?: 'asc' | 'desc';
}

export interface ProjectEvalSupportAcceptanceRefreshPolicySchedule {
  project_family?: string;
  framework_family?: string;
  template_family?: string;
  evaluation_depth?: string;
  status?: string;
  freshness?: string;
  maturity?: string;
  operator_review_status?: ProjectEvalSupportAcceptanceLaneReviewStatus | string;
  has_operator_review?: boolean;
  operator_review_stale_only?: boolean;
  limit: number;
  include_blocked: boolean;
  force: boolean;
  auto_confirm: boolean;
  mode: RunMode;
  scope: EvaluationScope;
  report_variant: string;
  report_variants: string[];
}

export interface ProjectEvalSupportAcceptanceRefreshPolicyResult {
  triggered_at: string;
  status: string;
  total_candidates: number;
  executable_candidates: number;
  blocked_candidates: number;
  created_runs: number;
  confirmed_runs: number;
  failed_runs: number;
  error_message?: string;
}

export interface ProjectEvalSupportAcceptanceRefreshPolicy {
  id: string;
  organization_id: string;
  name: string;
  description?: string;
  enabled: boolean;
  cadence: ProjectEvalSupportAcceptanceRefreshCadence;
  due: boolean;
  next_run_at?: string;
  last_run_at?: string;
  last_triggered_by?: string;
  last_trigger_status: string;
  last_trigger_error?: string;
  last_result?: ProjectEvalSupportAcceptanceRefreshPolicyResult;
  schedule: ProjectEvalSupportAcceptanceRefreshPolicySchedule;
  created_by: string;
  updated_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectEvalSupportAcceptanceRefreshPolicyListResponse {
  organization_id: string;
  generated_at: string;
  page: number;
  page_size: number;
  total: number;
  due_policies: number;
  filter: {
    enabled?: boolean;
    cadence?: string;
    last_trigger_status?: string;
    due_only?: boolean;
  };
  items: ProjectEvalSupportAcceptanceRefreshPolicy[];
}

export interface UpsertSupportAcceptanceRefreshPolicyRequest {
  name: string;
  description?: string;
  enabled?: boolean;
  cadence?: ProjectEvalSupportAcceptanceRefreshCadence;
  next_run_at?: string;
  project_family?: string;
  framework_family?: string;
  template_family?: string;
  evaluation_depth?: string;
  status?: string;
  freshness?: string;
  maturity?: string;
  operator_review_status?: ProjectEvalSupportAcceptanceLaneReviewStatus | string;
  has_operator_review?: boolean;
  operator_review_stale_only?: boolean;
  limit?: number;
  include_blocked?: boolean;
  force?: boolean;
  auto_confirm?: boolean;
  mode?: RunMode;
  scope?: EvaluationScope;
  report_variant?: string;
  report_variants?: string[];
}

export interface ProjectEvalSupportAcceptanceRefreshPolicyTrigger {
  policy: ProjectEvalSupportAcceptanceRefreshPolicy;
  schedule?: ProjectEvalSupportAcceptanceSampleSchedule;
  error_message?: string;
}

export interface RunDueSupportAcceptanceRefreshPoliciesRequest {
  limit?: number;
}

export interface RunDueSupportAcceptanceRefreshPoliciesResponse {
  organization_id: string;
  triggered_at: string;
  total_policies: number;
  triggered_policies: number;
  failed_policies: number;
  items: ProjectEvalSupportAcceptanceRefreshPolicyTrigger[];
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
