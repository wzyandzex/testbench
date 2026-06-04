# S11 - 组织级治理总览

## Slice 基本信息

| 字段 | 内容 |
|---|---|
| Slice ID | S11 |
| 名称 | 组织级治理总览 |
| 所属主线 | benchmark |
| 所属模块 | benchmark governance overview |
| 优先级 | P1 |
| 前置依赖 | S09 (信任策略), S10 (决策策略) |
| 当前状态 | 已完成 |

## 0. 目标

提供组织级治理"驾驶舱"视图：汇总统计、Benchmark 治理热点、Case 治理列表（含丰富筛选）、批量操作预览。用户可在此页面快速定位需要关注的 benchmark/case，并触发治理操作。

## 1. 为什么先做这个 Slice

1. S09/S10 已建立策略基础设施，S11 是策略消费的入口页面。
2. 治理总览将 S01-S10 各子系统的数据汇总呈现，形成闭环。
3. S12-S14 (LLM Quality) 可复用此页面的筛选模式和操作预览机制。

## 2. 后端调研记录

### 2.1 读取的后端代码

| 文件 | 结论 |
|---|---|
| `router.go` L603-616 | 4 个治理路由: GET benchmarks, GET cases, GET summary, POST actions/preview |
| `benchmark_handler.go` L628-673 | cases/summary handler: 复用 `buildCaseGovernanceFilterFromRequest` 解析 20 个筛选参数 |
| `benchmark_handler.go` L676-697 | benchmarks handler: `buildCaseGovernanceBenchmarkHotspotFilterFromRequest` 解析 4 个参数 |
| `benchmark_handler.go` L1279-1332 | actions/preview handler: 请求体含 action + items[]，返回 accepted/rejected/benchmark_actions |
| `case_governance_types.go` L145-239 | `CaseGovernanceView` 完整结构: 8 组字段（标识/风险/检测/验证/审查/融合/修复/智能） |
| `case_governance_types.go` L274-319 | `CaseGovernanceSummary`: 40+ 统计字段 + 4 个比率 + 策略视图 |
| `case_governance_types.go` L321-360 | `CaseGovernanceBenchmarkHotspotView`: 30+ 统计字段 + 策略视图 |
| `case_governance_types.go` L370-434 | Action preview 相关类型: Accepted/Rejected/BenchmarkAction |
| `case_governance.go` L299-414 | 服务层: 3 个 list/summary 方法均解析策略后附加到响应 |
| `case_governance_actions.go` L104-240 | Preview 服务: 规范化→逐项校验→分组→构建 target route |

### 2.2 关键业务结论

1. **Summary 端点** 返回 40+ 聚合统计数字 + 4 个比率 (retirement_rate, flakiness_rate, low_confidence_rate, insufficient_evidence_rate)，以及 effective_trust_policy 和 effective_decision_policy 视图。
2. **Benchmark Hotspot 端点** 按 benchmark 聚合统计，含信任分布 (trusted/watch/untrusted)、证据新鲜度、修复状态等维度。支持 benchmark_search 和 attention_required_only 筛选。分页。
3. **Case 列表端点** 返回完整的 `CaseGovernanceView`，含 20+ 筛选参数 (benchmark_id, status, trust_posture, evidence_freshness, confidence_posture, primary_action 等)。分页。
4. **Action Preview 端点** 接受 action + items[]，逐项校验后返回 accepted_items、rejected_items 和 benchmark_actions（含 target_route 和 payload）。最多 200 项。
5. **CaseGovernanceView 字段比 S02 定义的更多**: 后端版本含 benchmark_name/display_name/type/language、detection_signal_summary、validation_primary_failure 系列字段、review_drift_status/recheck_recommended/triggered、fusion_drift_status、remediation_replay_status 等字段。S02 版本是简化子集。

## 3. API 合同

### 3.1 接口列表

| 方法 | 路径 | 用途 | 权限 |
|---|---|---|---|
| GET | `/api/v1/benchmarks/governance/summary` | 治理汇总统计 | auth |
| GET | `/api/v1/benchmarks/governance/benchmarks` | Benchmark 治理热点 | auth |
| GET | `/api/v1/benchmarks/governance/cases` | Case 治理列表 | auth |
| POST | `/api/v1/benchmarks/governance/actions/preview` | 治理操作预览 | auth |

### 3.2 请求参数

**Summary query**: 与 cases 相同的筛选参数（可选），用于按条件统计。通常不带参数获取全量统计。

**Benchmarks query**:

| 参数 | 类型 | 说明 |
|---|---|---|
| benchmark_search | string | benchmark 名称模糊搜索 |
| attention_required_only | bool | 仅显示需关注的 benchmark |
| page | int | 页码，默认 1 |
| page_size | int | 每页数量，默认 20 |

**Cases query**:

| 参数 | 类型 | 说明 |
|---|---|---|
| benchmark_id | string | 按 benchmark ID 筛选 |
| benchmark_search | string | benchmark 名称搜索 |
| status | string | case 状态筛选 |
| trust_posture | string | 信任态势 (trusted/watch/untrusted/inactive) |
| trust_reason | string | 特定信任原因 |
| evidence_freshness | string | 证据新鲜度 |
| confidence_posture | string | 置信度态势 |
| primary_action | string | 主要治理操作 |
| attention_required | bool | 需关注 |
| low_confidence | bool | 低置信度 |
| flaky | bool | 不稳定 |
| insufficient_evidence | bool | 证据不足 |
| search | string | 通用搜索 |
| page | int | 页码 |
| page_size | int | 每页数量 |

**Actions preview body**:
```json
{
  "action": "validate_cases",
  "items": [
    { "benchmark_id": "...", "case_key": "..." }
  ]
}
```

### 3.3 响应结构

**Summary**: `{ /* CaseGovernanceSummary */ }` — 单个对象，40+ 统计字段 + 4 比率 + 策略

**Benchmarks**: `{ total, page, size, data: [/* CaseGovernanceBenchmarkHotspotView[] */] }` — 分页

**Cases**: `{ total, page, size, data: [/* CaseGovernanceListItem[] */] }` — 分页，含完整治理视图

**Actions preview**: `{ action, normalized_items, accepted_items, rejected_items, benchmark_actions }`

### 3.4 错误与边界

| 错误 | HTTP | 场景 |
|---|---|---|
| 仓库未初始化 | 501 | case governance repository not available |
| 无效查询 | 400 | 参数校验失败 |
| 无效 action | 400 | action 不在 4 个枚举值中 |
| 无选中项 | 400 | items 为空 |
| 超过 200 项 | 400 | items 超限 |
| 用例未找到 | 404 | case_key 不存在 |

## 4. 页面设计

### 4.1 页面位置

- 路由: `/governance`

### 4.2 页面结构

**整体布局: 上下四段式**

**Section 1 - 汇总统计卡**:
- Row of Statistic Cards (Ant Design Statistic 组件):
  - 总 Cases / Active / Retired
  - 需关注 / 低置信度 / 不稳定 / 证据不足
  - 信任分布: Trusted / Watch / Untrusted
  - 证据状态: Fresh / Aging / Stale
  - Fusion: Pass / Warn / Block
  - Remediation: Pending / Regressed / Improved
- 底部 4 个比率指标 (Retirement Rate / Flakiness Rate / Low Confidence Rate / Insufficient Evidence Rate)
- 右上角: 策略来源标签 (system_default / organization_override)

**Section 2 - Benchmark 治理热点**:
- 筛选: benchmark_search Input + attention_required_only Switch
- Table 列:
  - Benchmark 名称 + 类型 + 语言
  - 总 Cases / Active / Retired
  - 需关注 / 低置信度 / 不稳定 / 证据不足
  - 信任分布 (Trusted/Watch/Untrusted)
  - 修复状态 (Pending/Regressed)
  - 最新证据时间
- 分页
- 点击行可跳转到 cases 列表（带 benchmark_id 筛选）

**Section 3 - Case 治理列表**:
- 筛选栏 (Collapse 展开):
  - benchmark_search / status / trust_posture / evidence_freshness / confidence_posture / primary_action
  - attention_required / low_confidence / flaky / insufficient_evidence (Switch)
  - search (通用搜索)
- Table 列:
  - 选择框 (用于批量操作)
  - Case Key / Name / Benchmark 名称
  - 状态 / 版本
  - 治理智能: 信任态势 Tag + 信任原因 + 证据新鲜度 + 置信度
  - 检测: decision + risk + authority
  - 验证: outcome + authority + flaky
  - 审查: decision + risk + authority + low_confidence
  - 融合: decision + risk + insufficient_evidence
  - 主要操作 + 操作原因
  - 关注标记
- 展开行: 详细信号 (active_signals, 各支柱的详细状态)
- 分页
- 批量操作按钮: "预览验证" / "预览审查" / "预览复查" / "查看详情"

**Section 4 - 操作预览 Modal**:
- 触发: 点击批量操作按钮
- 展示:
  - 选中项数 / 已接受 / 已拒绝
  - Accepted Items Table: benchmark_name + case_key + action + reason
  - Rejected Items Table: benchmark_id + case_key + action + reason
  - Benchmark Actions Table: benchmark_name + action + target_route + item_count + case_keys
- 确认按钮 (实际执行跳转到对应 benchmark 的操作页面)

### 4.3 交互流

1. 页面加载 → 并行请求 summary + benchmarks + cases
2. Summary 渲染统计卡
3. Benchmarks 渲染热点列表
4. Cases 渲染治理列表（含筛选）
5. 点击 benchmark 行 → 筛选 cases 列表（benchmark_id 传入）
6. 选中 cases + 点击操作按钮 → 弹出 Preview Modal
7. Preview Modal 展示 accepted/rejected → 用户确认（跳转到对应操作页面）

### 4.4 权限控制

- 所有认证用户可查看
- 批量操作权限与单个操作权限一致（后端校验 per-benchmark 访问权限）

## 5. 文件变更范围

| 文件 | 动作 | 原因 |
|---|---|---|
| `src/types/api/benchmark.ts` | 修改 | 新增 6 个类型 + 2 个筛选接口 + 配置常量 |
| `src/services/benchmark.ts` | 修改 | 新增 4 个 service 方法 |
| `src/pages/governance/GovernanceOverviewPage.tsx` | 新增 | 治理总览页面 |
| `src/router/routes.tsx` | 修改 | 新增 lazy import |
| `src/router/index.tsx` | 修改 | 新增 `/governance` 路由 |

核心文件 3 个 + 路由配置 2 个（各 1-2 行）。

### 5.1 新增类型清单

```typescript
// 治理汇总统计
export interface CaseGovernanceSummary {
  benchmark_id: string;
  organization_id: string;
  benchmark_count: number;
  total_cases: number;
  active_cases: number;
  missing_cases: number;
  retired_cases: number;
  attention_required_cases: number;
  review_degraded_cases: number;
  low_confidence_cases: number;
  recheck_recommended_cases: number;
  recheck_triggered_cases: number;
  flaky_cases: number;
  insufficient_evidence_cases: number;
  authoritative_confidence_cases: number;
  decayed_confidence_cases: number;
  low_confidence_posture_cases: number;
  insufficient_evidence_posture_cases: number;
  degraded_confidence_cases: number;
  trusted_active_cases: number;
  watch_active_cases: number;
  untrusted_active_cases: number;
  aging_evidence_cases: number;
  stale_evidence_cases: number;
  validation_retryable_failure_cases: number;
  validation_environmental_failure_cases: number;
  fusion_pass_cases: number;
  fusion_warn_cases: number;
  fusion_block_cases: number;
  remediation_cases: number;
  remediation_pending_cases: number;
  remediation_improved_cases: number;
  remediation_unchanged_cases: number;
  remediation_regressed_cases: number;
  remediation_unavailable_cases: number;
  remediation_failed_cases: number;
  remediation_version_shifted_cases: number;
  remediation_missing_in_replay_cases: number;
  retirement_rate: number;
  flakiness_rate: number;
  low_confidence_rate: number;
  insufficient_evidence_rate: number;
  effective_trust_policy?: CaseGovernanceEffectivePolicyView;
  effective_decision_policy?: CaseGovernanceEffectiveDecisionPolicyView;
}

// Effective 策略视图 (嵌入到 summary/hotspot 中)
export interface CaseGovernanceEffectivePolicyView {
  resolution_source: string;
  organization_override_applied: boolean;
  evidence_aging_hours: number;
  evidence_stale_hours: number;
  review_low_confidence_threshold: number;
  auto_review_after_validation: boolean;
  auto_validation_after_review_low_confidence: boolean;
  auto_validation_on_quality_recheck: boolean;
  organization_policy_updated_by?: string;
  organization_policy_updated_at?: string;
}

export interface CaseGovernanceEffectiveDecisionPolicyView {
  resolution_source: string;
  organization_override_applied: boolean;
  untrusted_reason_priority?: string[];
  watch_reason_priority?: string[];
  attention_reason_priority?: string[];
  primary_action_reason_priority?: string[];
  primary_action_by_reason?: Record<string, string>;
  organization_policy_updated_by?: string;
  organization_policy_updated_at?: string;
}

// Benchmark 治理热点
export interface CaseGovernanceBenchmarkHotspotView {
  benchmark_id: string;
  benchmark_name?: string;
  benchmark_display_name?: string;
  benchmark_type?: string;
  benchmark_language?: string;
  organization_id: string;
  total_cases: number;
  active_cases: number;
  missing_cases: number;
  retired_cases: number;
  attention_required_cases: number;
  review_degraded_cases: number;
  low_confidence_cases: number;
  recheck_recommended_cases: number;
  recheck_triggered_cases: number;
  flaky_cases: number;
  insufficient_evidence_cases: number;
  authoritative_confidence_cases: number;
  decayed_confidence_cases: number;
  low_confidence_posture_cases: number;
  insufficient_evidence_posture_cases: number;
  degraded_confidence_cases: number;
  trusted_active_cases: number;
  watch_active_cases: number;
  untrusted_active_cases: number;
  aging_evidence_cases: number;
  stale_evidence_cases: number;
  validation_retryable_failure_cases: number;
  validation_environmental_failure_cases: number;
  remediation_cases: number;
  remediation_pending_cases: number;
  remediation_regressed_cases: number;
  remediation_unavailable_cases: number;
  remediation_failed_cases: number;
  remediation_version_shifted_cases: number;
  latest_evidence_at?: string;
  effective_trust_policy?: CaseGovernanceEffectivePolicyView;
  effective_decision_policy?: CaseGovernanceEffectiveDecisionPolicyView;
}

// Case 治理列表项 (扩展 S02 的 CaseGovernanceView)
export interface CaseGovernanceListItem extends CaseGovernanceView {
  benchmark_name?: string;
  benchmark_display_name?: string;
  benchmark_type?: string;
  benchmark_language?: string;
  organization_id: string;
  source_scope?: string;
  current_version_id?: string;
  content_hash?: string;
  last_seen_benchmark_version: number;
  last_present_benchmark_version: number;
  lifecycle_source?: string;
  lifecycle_reason?: string;
  lifecycle_updated_by?: string;
  lifecycle_updated_at?: string;
  latest_evidence_at?: string;
  // 检测扩展
  detection_dimension_risks?: Record<string, string>;
  detection_signal_summary?: string;
  detection_signal_resolution_source?: string;
  detection_created_at?: string;
  detection_report_id?: string;
  // 验证扩展
  validation_matched?: boolean;
  validation_created_at?: string;
  validation_job_id?: string;
  validation_case_report_id?: string;
  validation_primary_failure_kind?: string;
  validation_primary_failure_class?: string;
  validation_primary_failure_stage?: string;
  validation_primary_failure_reason?: string;
  validation_primary_failure_retryable?: boolean;
  validation_primary_failure_environmental?: boolean;
  validation_has_retryable_failures?: boolean;
  validation_has_environmental_failures?: boolean;
  // 审查扩展
  review_drift_status?: string;
  review_recheck_recommended?: boolean;
  review_recheck_triggered?: boolean;
  review_created_at?: string;
  review_report_id?: string;
  review_case_report_id?: string;
  review_triggered_validation_job_id?: string;
  // 融合扩展
  fusion_drift_status?: string;
  fusion_created_at?: string;
  fusion_report_id?: string;
  fusion_case_report_id?: string;
  // 修复扩展
  remediation_repair_run_id?: string;
  remediation_replay_status?: string;
  remediation_comparison_mode?: string;
  remediation_latest_feedback_at?: string;
  // 策略视图
  effective_trust_policy?: CaseGovernanceEffectivePolicyView;
  effective_decision_policy?: CaseGovernanceEffectiveDecisionPolicyView;
}

// 操作预览
export interface CaseGovernanceActionPreviewRequest {
  action: GovernanceAction;
  items: { benchmark_id: string; case_key: string }[];
}

export interface CaseGovernanceActionPreview {
  action: GovernanceAction;
  normalized_items?: { benchmark_id: string; case_key: string }[];
  accepted_items?: CaseGovernanceActionPreviewAccepted[];
  rejected_items?: CaseGovernanceActionPreviewRejected[];
  benchmark_actions?: CaseGovernanceBenchmarkActionPreview[];
}

export interface CaseGovernanceActionPreviewAccepted {
  benchmark_id: string;
  benchmark_name?: string;
  case_key: string;
  case_name?: string;
  action: GovernanceAction;
  reason?: string;
}

export interface CaseGovernanceActionPreviewRejected {
  benchmark_id: string;
  case_key: string;
  action: GovernanceAction;
  reason?: string;
}

export interface CaseGovernanceBenchmarkActionPreview {
  benchmark_id: string;
  benchmark_name?: string;
  action: GovernanceAction;
  target_method: string;
  target_route?: string;
  payload?: Record<string, unknown>;
  item_count: number;
  case_keys?: string[];
  item_routes?: { case_key: string; route: string; method: string }[];
}

// 筛选接口
export interface GovernanceBenchmarkFilter {
  benchmark_search?: string;
  attention_required_only?: boolean;
  page?: number;
  page_size?: number;
}

export interface GovernanceCaseFilter {
  benchmark_id?: string;
  benchmark_search?: string;
  status?: string;
  risk_gte?: string;
  drift_status?: string;
  trust_posture?: string;
  trust_reason?: string;
  evidence_freshness?: string;
  confidence_posture?: string;
  primary_action?: string;
  attention_required?: boolean;
  low_confidence?: boolean;
  flaky?: boolean;
  insufficient_evidence?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}
```

## 6. 验收标准

- [ ] 页面在 `/governance` 可访问
- [ ] 汇总统计卡正确展示所有关键指标
- [ ] 策略来源标签 (system_default/organization_override) 显示
- [ ] Benchmark 热点列表含搜索和筛选
- [ ] Benchmark 行点击可筛选 cases 列表
- [ ] Case 治理列表含丰富筛选 (10+ 筛选维度)
- [ ] Case 列表展示信任态势/证据新鲜度/置信度/主要操作
- [ ] Case 展开行显示详细信号
- [ ] 批量选择 cases 后可触发操作预览
- [ ] 操作预览 Modal 展示 accepted/rejected/benchmark_actions
- [ ] 分页正常工作
- [ ] `npm run type-check` 通过
- [ ] `npm run build` 通过

## 7. 明确不做什么

1. 本 slice 不做操作预览后的实际执行（只做预览，执行跳转到已有页面）。
2. 本 slice 不做 Case 行点击跳转到 case detail（已在 S02 实现，可复用路由）。
3. 本 slice 不做实时刷新/WebSocket（页面加载时获取数据即可）。
4. 本 slice 不做 summary 的条件筛选（只展示全量统计，简化实现）。
5. 本 slice 不做数据导出。

## 8. 留给下一 Slice 的上下文

| 项目 | 内容 |
|---|---|
| 新增 service 方法 | `getGovernanceSummary`, `listGovernanceBenchmarks`, `listGovernanceCases`, `previewGovernanceAction` |
| 新增类型 | `CaseGovernanceSummary`, `CaseGovernanceEffectivePolicyView`, `CaseGovernanceEffectiveDecisionPolicyView`, `CaseGovernanceBenchmarkHotspotView`, `CaseGovernanceListItem`, `CaseGovernanceActionPreview*` 系列, `GovernanceBenchmarkFilter`, `GovernanceCaseFilter` |
| 可复用模式 | 筛选栏 Collapse 模式、统计卡 Row 模式、批量选择+操作预览模式 |

## 9. 实现记录

| 项目 | 内容 |
|---|---|
| 完成日期 | 2026-04-14 |
| 实际修改文件 | `src/types/api/benchmark.ts`, `src/services/benchmark.ts`, `src/pages/governance/GovernanceOverviewPage.tsx`, `src/router/routes.tsx`, `src/router/index.tsx` |
| 运行命令 | `npx tsc --noEmit` ✅, `npx vite build` ✅ |
| 遇到的问题 | 1. VALIDATION_JOB_STATUS_CONFIG 未使用 import → 移除 |
| 与原方案的差异 | 无差异 |

---

## 后端确认结论

1. 4 个端点，base path `/api/v1/benchmarks/governance/`。
2. Summary 返回 40+ 统计字段 + 4 比率，非分页，单个对象。
3. Benchmarks 按 benchmark 聚合，4 个筛选参数，分页。
4. Cases 返回完整 `CaseGovernanceView`，20+ 筛选参数，分页。
5. Actions preview 接受 action + items[]，返回 accepted/rejected/benchmark_actions。最多 200 项。
6. 所有端点需要 auth + org context。
7. `CaseGovernanceEffectivePolicyView` 和 `CaseGovernanceEffectiveDecisionPolicyView` 嵌入到 summary/hotspot/list 响应中。
