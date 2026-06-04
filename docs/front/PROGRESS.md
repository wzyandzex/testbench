# 前端对接进度追踪

> 更新时间: 2026-04-13
> 模板版本: v3（与后端 `backend-driven-frontend-slice-template.md` 对齐）
> 真相源: 后端实际代码 > integration/test 行为 > contracts/README/API.md > plans/历史文档

## 状态说明

| 图标 | 含义 |
|------|------|
| ⏳ | 待开始 |
| 📝 | 方案编写中 |
| 👁️ | 方案待审批 |
| 🔄 | 实现中 |
| ✅ | 已完成 |
| ❌ | 已取消/跳过 |

---

## 总览

| 主线 | Slice 范围 | 主题 | 进度 |
|------|-----------|------|------|
| benchmark 治理 | S01-S08 | Case 治理子页面 | 8/8 ✅ |
| benchmark 治理 | S09-S11 | 治理策略管理 | 3/3 ✅ |
| benchmark 治理 | S12-S14 | LLM Quality 子系统 | 3/3 ✅ |
| projecteval | S15-S17 | 项目评测主线 | 3/3 ✅ |
| repairrun | S18 | 修复运行主线 | 1/1 ✅ |
| dashboard | S19-S20 | 真实化 + 运营页面 | 2/2 ✅ |
| **总计** | **S01-S20** | | **20/20 ✅** |

---

## benchmark 治理主线: Case 子页面 (S01-S08)

> 治理流水线的入口: cases list → case governance detail → validation/review/fusion → lifecycle actions

### S01 - Benchmark Cases 列表页
- 状态: ✅ 已完成
- 主线: benchmark
- 优先级: P0
- 方案: `11-governance/S01-benchmark-cases-list.md`
- API: `GET /benchmarks/:id/cases`
- 文件: `pages/benchmark-cases/{index,service,store}.tsx`
- 验收: [ ] 列表渲染 [ ] 分页 [ ] 状态筛选 [ ] 空状态 [ ] 摆脱 mock

### S02 - Case 治理详情（总览）
- 状态: ✅ 已完成
- 主线: benchmark
- 优先级: P0
- 前置: S01
- 方案: `11-governance/S02-case-governance-detail.md`
- API: `GET /benchmarks/:id/cases/:caseKey/governance`, `GET .../lifecycle-audits`
- 文件: `pages/case-detail/{index,service,store}.tsx`
- 验收: [ ] 治理状态展示 [ ] authoritative vs degraded [ ] 生命周期审计 [ ] 跳转各子报告

### S03 - Case Detection 展示
- 状态: ✅ 已完成
- 主线: benchmark
- 优先级: P1
- 前置: S01
- 方案: `11-governance/S03-case-detection.md`
- API: `GET /benchmarks/:id/cases/detections`, `GET .../detections/diff/latest`
- 文件: `pages/case-detail/tabs/DetectionTab.tsx`, 修改 `service.ts`
- 验收: [ ] 检测报告展示 [ ] diff 视图 [ ] 历史记录

### S04 - Case Validation 触发+列表
- 状态: ✅ 已完成
- 主线: benchmark
- 优先级: P0
- 前置: S01
- 方案: `11-governance/S04-case-validation-trigger.md`
- API: `POST .../validate`, `GET .../validation-jobs`, `GET .../validation/capabilities`, `POST .../validation/preview`
- 文件: `pages/case-detail/tabs/ValidationTab.tsx`, 修改 `service.ts`, `store.ts`
- 验收: [ ] 触发验证 [ ] Job 列表 [ ] 预览 [ ] 长任务轮询机制

### S05 - Case Validation 报告
- 状态: ✅ 已完成
- 主线: benchmark
- 优先级: P0
- 前置: S04
- 方案: `11-governance/S05-case-validation-report.md`
- API: `GET .../validation/latest`, `GET .../validation/cases`, `GET .../cases/:caseKey/evidence`, `GET .../cases/:caseKey/validation-history`
- 文件: `pages/case-validation-report/{index,service}.tsx`
- 验收: [ ] 最新报告 [ ] 用例级报告 [ ] 证据查看 [ ] authoritative vs degraded

### S06 - Case Review 触发+报告
- 状态: ✅ 已完成
- 主线: benchmark
- 优先级: P0
- 前置: S02
- 方案: `11-governance/S06-case-review.md`
- API: `POST .../review`, `GET .../review-jobs`, `GET .../review/latest`, `GET .../review/cases`, `GET .../cases/:caseKey/review-history`
- 文件: `pages/case-detail/tabs/ReviewTab.tsx`, 修改 `service.ts`, `store.ts`
- 验收: [ ] 触发审查 [ ] 报告展示 [ ] 用例级报告 [ ] 长任务机制

### S07 - Case Fusion 报告
- 状态: ✅ 已完成
- 主线: benchmark
- 优先级: P0
- 前置: S05, S06
- 方案: `11-governance/S07-case-fusion.md`
- API: `GET .../fusion/latest`, `GET .../fusion/cases`, `GET .../cases/:caseKey/fusion-history`
- 文件: `pages/case-detail/tabs/FusionTab.tsx`, 修改 `service.ts`
- 验收: [ ] 融合报告 [ ] 用例级融合 [ ] 历史记录

### S08 - Case 生命周期操作
- 状态: ✅ 已完成
- 主线: benchmark
- 优先级: P1
- 前置: S01
- 方案: `11-governance/S08-case-lifecycle.md`
- API: `POST .../retire`, `POST .../restore`, `POST .../reextract`, `POST .../retire(batch)`, `POST .../restore(batch)`
- 文件: 修改 `pages/benchmark-cases/index.tsx`, `service.ts`
- 验收: [ ] 单个退休/恢复 [ ] 批量操作 [ ] org-admin 权限控制 [ ] 二次确认

---

## benchmark 治理主线: 策略管理 (S09-S11)

> 信任策略、决策策略、组织级治理总览

### S09 - 信任策略管理
- 状态: ✅ 已完成
- 主线: benchmark
- 优先级: P1
- 方案: `11-governance/S09-trust-policy.md`
- API: `GET/PUT /governance/policies/organization`, `GET /governance/policies/effective`, `POST .../validate`, `GET .../audits`
- 文件: `pages/governance-policies/trust/{index,service,store}.tsx`
- 验收: [ ] 查看当前策略 [ ] 编辑策略(org-admin) [ ] 审计日志 [ ] 预览验证

### S10 - 决策策略管理
- 状态: ✅ 已完成
- 主线: benchmark
- 优先级: P1
- 前置: S09 (复用策略页面模式)
- 方案: `11-governance/S10-decision-policy.md`
- API: `GET/PUT /governance/policies/decision/organization`, `GET /governance/policies/decision/effective`, `POST .../validate`, `GET .../audits`
- 文件: `pages/governance-policies/decision/{index,service,store}.tsx`
- 验收: [ ] 查看当前策略 [ ] 编辑策略(org-admin) [ ] 审计日志 [ ] 预览验证

### S11 - 组织级治理总览
- 状态: ✅ 已完成
- 主线: benchmark
- 优先级: P1
- 方案: `11-governance/S11-org-governance-overview.md`
- API: `GET /governance/benchmarks`, `GET /governance/cases`, `GET /governance/summary`, `POST /governance/actions/preview`
- 文件: `pages/governance/{index,service,store}.tsx`
- 验收: [ ] 治理总览 [ ] Benchmark 治理列表 [ ] Case 治理列表 [ ] 操作预览

---

## benchmark 治理主线: LLM Quality (S12-S14)

> LLM 质量检查触发、报告查看、质量策略管理

### S12 - LLM Quality 触发+列表
- 状态: ✅ 已完成
- 主线: benchmark
- 优先级: P1
- 方案: `11-governance/S12-llm-quality-trigger.md`
- API: `POST .../quality/llm-checks`, `GET .../quality/llm-checks`, `GET .../quality/llm-checks/summary`
- 文件: `pages/benchmark-quality/llm-checks/{index,service,store}.tsx`
- 验收: [ ] 触发检查 [ ] Job 列表 [ ] 汇总视图 [ ] 长任务轮询

### S13 - LLM Quality 报告详情
- 状态: ✅ 已完成
- 主线: benchmark
- 优先级: P1
- 前置: S12
- 方案: `11-governance/S13-llm-quality-report.md`
- API: `GET .../quality/llm-checks/:job_id`, `POST .../cancel`, `POST .../retry`, `GET .../quality/cases`, `GET .../quality/aggregate/latest`, `GET .../quality/diff/latest`, `GET .../quality/llm-reports/latest`
- 文件: `pages/benchmark-quality/llm-check-detail/{index,service}.tsx`
- 验收: [ ] 报告详情 [ ] 取消/重试 [ ] 用例级报告 [ ] diff 视图 [ ] authoritative vs degraded

### S14 - Quality Policy 管理
- 状态: ✅ 已完成
- 主线: benchmark
- 优先级: P1
- 前置: S09 (复用策略页面模式)
- 方案: `11-governance/S14-quality-policy.md`
- API: `GET/PUT /quality/policies/organization`, `GET /quality/policies/effective`, `GET .../audits`, `GET/PUT /quality/llm/policies/organization`, `POST .../validate`, `GET .../llm/capabilities`
- 文件: `pages/governance-policies/quality/{index,service,store}.tsx`
- 验收: [ ] 质量策略 [ ] LLM质量策略 [ ] 能力查询 [ ] 审计日志

---

## projecteval 主线 (S15-S17)

> 项目级评测: source/run create → plan/confirm/evidence → report/explain/insights

### S15 - Project Eval 源上传+运行创建
- 状态: ✅ 已完成
- 主线: projecteval
- 优先级: P1
- 方案: `11-governance/S15-project-eval-create.md`
- API: `POST /project-evals/sources`, `POST /project-evals/runs`, `GET /capabilities`
- 文件: `pages/project-eval/create/{index,service,store}.tsx`
- 验收: [ ] 源上传 [ ] 运行创建 [ ] 能力展示

### S16 - Project Eval 计划确认+证据
- 状态: ✅ 已完成
- 主线: projecteval
- 优先级: P1
- 前置: S15
- 方案: `11-governance/S16-project-eval-plan.md`
- API: `GET /runs/:id`, `GET /runs/:id/plan`, `POST .../regenerate`, `POST .../overrides`, `POST .../confirm`, `GET .../case-selection`, `GET .../evidence`, `GET .../mainline`, `POST .../mainline/actions/:action`
- 文件: `pages/project-eval/ProjectEvalDetailPage.tsx`
- 验收: [x] 计划查看 [x] 计划修改(override) [x] 确认执行 [x] 证据查看 [x] Mainline 操作 [x] 生命周期 Steps

### S17 - Project Eval 报告
- 状态: ✅ 已完成
- 主线: projecteval
- 优先级: P1
- 前置: S16
- 方案: `11-governance/S17-project-eval-report.md`
- API: `GET .../report`, `GET .../explain`, `GET .../insights/summary`, `GET .../insights/trends`, `GET .../policies/effective`, `POST .../policies/organization/preview`, `PUT .../policies/organization`
- 文件: `pages/project-eval/ProjectEvalInsightsPage.tsx`
- 验收: [x] 洞察汇总+趋势 [x] 策略展示+编辑(org-admin) [x] 预览差异 Modal [x] Report/Explain service 方法

---

## repairrun 主线 (S18)

> 修复运行: create → plan → approve → apply → replay

### S18 - Repair Run 管理
- 状态: ✅ 已完成
- 主线: repairrun
- 优先级: P1
- 方案: `11-governance/S18-repair-run.md`
- API: `POST/GET /repair-runs`, `GET .../:id`, `POST .../plan`, `POST .../approve`, `POST .../apply`, `POST .../replay`, `POST .../cancel`
- 文件: `pages/repair-run/RepairRunPage.tsx`
- 验收: [x] 列表+筛选 [x] 详情 Drawer [x] 工作流操作 [x] 创建 Modal [x] Project Eval 报告到 Repair 草稿桥接

---

## dashboard 主线 (S19-S20)

> 真实数据替换 + 运营页面

### S19 - Dashboard 真实数据接入
- 状态: ✅ 已完成
- 主线: dashboard
- 优先级: P2
- 方案: `11-governance/S19-dashboard-real-data.md`
- API: `GET /executions/summary`, `GET /scheduler/stats`, `GET /metrics`, `GET /cost/summary`, `GET /project-evals/insights/summary`
- 文件: 修改 `pages/dashboard/DashboardPage.tsx`, `services/execution.ts`
- 验收: [x] 替换全部 mock [x] 统计卡片 [x] 趋势图(执行量) [x] 最近执行

### S20 - Analyzer 报告页
- 状态: ✅ 已完成
- 主线: dashboard
- 优先级: P2
- 方案: `11-governance/S20-analyzer.md`
- API: `GET /analyzer/reports`, `GET .../:id`, `GET .../trends`, `GET .../comparisons`
- 文件: `pages/analyzer/AnalyzerPage.tsx`
- 验收: [x] 报告列表+分页 [x] 类型筛选 [x] 详情 Drawer(三种类型) [x] Agent/Benchmark 统计表

---

## 上下文传递记录

> 每个 slice 完成后在此记录关键上下文，供后续 slice 的 Step 0 读取。
> 详细的上下文信息见各 slice 方案的"留给下一 Slice 的上下文"章节。

| Slice | 关键产出 | 留给谁 |
|-------|---------|--------|
| S01 | 类型 `BenchmarkCaseAsset`/`CaseAssetStatus`/`CaseAssetType` + 配置常量; service 方法 `getCases`; DetailPage Cases Tab（表格+状态筛选+分页） | S02(详情页需从 case_key 跳转), S03-S07(Tab 复用模式), S08(lifecycle 操作) |
| S02 | 类型 `CaseGovernanceDetail`/`CaseGovernanceView`/`CaseGovernanceIntelligenceView`/`BenchmarkCaseLifecycleAuditLog` + 8 枚举 + 8 配置常量; service 方法 `getCaseGovernanceDetail`/`getCaseLifecycleAudits`; Drawer 组件（治理智能+支柱摘要+生命周期时间线+可用操作）; case_key 点击跳转已启用 | S03(detection 详情), S04(validation 触发), S06(review), S07(fusion), S08(lifecycle 操作+可用操作触发) |
| S03 | 类型 `BenchmarkCaseDetectionReport`/`BenchmarkCaseDetectionIssue`/`BenchmarkCaseDetectionDiff` + 4 枚举 + 4 配置常量; service 方法 `getCaseDetectionHistory`/`getLatestDetectionDiff`; Drawer 底部 Collapse 面板（diff Statistic 行 + 可展开报告表格） | S04(复用 detection Collapse 模式做 validation), S06(复用做 review), S07(复用做 fusion) |
| S04 | 类型 `BenchmarkCaseValidationJob`/`TriggerValidationResponse`/`CaseValidationPreview`/`CaseValidationPreviewCase`/`CaseValidationCapabilitiesView` + 4 枚举 + 2 配置常量; service 方法 `triggerCaseValidation`/`listValidationJobs`/`getValidationCapabilities`/`previewValidation`; Validation Collapse 面板 + Trigger Modal + Preview + Job 列表 + 5s 轮询; capabilities 可达性检查 | S05(validation 报告详情), S06(复用 trigger+polling 模式做 review), S12(复用做 LLM quality) |
| S05 | 类型 `BenchmarkCaseValidationSummary`/`BenchmarkCaseValidationCaseReport`/`BenchmarkCaseExecutionEvidence`; service 方法 `getLatestValidationSummary`/`listValidationCaseReports`/`listValidationEvidence`/`listValidationHistory`; Report Modal(Summary 统计+CaseReports Table+展开行 Evidence); TruncatedText 组件; authority_status 行标黄; outcome 筛选器 | S06(review report 复用三级下钻模式), S13(LLM quality report 复用) |
| S06 | 类型 `BenchmarkCaseReviewJob`/`BenchmarkCaseReviewReport`/`BenchmarkCaseReviewCaseReport` + ReviewDecision/ReviewRisk/ReviewDriftStatus/ReviewProviderExecutionMode + 3 配置常量; service 方法 `triggerCaseReview`/`listReviewJobs`/`getLatestReviewReport`/`listReviewCaseReports`/`listReviewHistory`; Review Collapse + Trigger Modal(model选择) + Report Modal(统计+Provider信息+CaseReports+展开行Drift对比+findings) | S07(fusion 复用 Report Modal 模式), S12(LLM quality 复用 trigger+polling) |
| S07 | 类型 `BenchmarkCaseFusionReport`/`BenchmarkCaseFusionCaseReport`; service 方法 `getLatestFusionReport`/`listFusionCaseReports`/`listFusionHistory`; Fusion Collapse(纯只读,懒加载) + Report 统计卡 + CaseReports Table(含三支柱展开行 Descriptions) + decision/insufficient_evidence 筛选 | S08(lifecycle 操作可引用 fusion 判决) |
| S09 | 类型 `CaseGovernanceTrustPolicyProfile`/`ResolvedCaseGovernanceTrustPolicy`/`OrganizationGovernanceTrustPolicy`/`TrustPolicyValidationResult`/`TrustPolicyAuditLog`; service 方法 `getEffectiveTrustPolicy`/`getOrganizationTrustPolicy`/`validateTrustPolicy`/`upsertTrustPolicy`/`listTrustPolicyAudits`; TrustPolicyPage(effective展示+编辑表单+validate预览+audit日志); 路由 `/governance/policies/trust` | S10(复用策略页面模式做决策策略), S14(复用做质量策略) |
| S10 | 类型 `CaseGovernanceDecisionPolicyProfile`/`ResolvedCaseGovernanceDecisionPolicy`/`OrganizationGovernanceDecisionPolicy`/`DecisionPolicyValidationResult`/`DecisionPolicyAuditLog`; 常量 `GOVERNANCE_ACTIONS`/`TRUST_CLASSIFICATION_REASONS`/`DEFAULT_*`; service 方法 `getEffectiveDecisionPolicy`/`getOrganizationDecisionPolicy`/`validateDecisionPolicy`/`upsertDecisionPolicy`/`listDecisionPolicyAudits`; DecisionPolicyPage(reason分类排序+action mapping+audit); 路由 `/governance/policies/decision`; SortableReasonList+ReasonLabelMap组件 | S11(组织治理总览可引用策略), S14(复用策略模式) |
| S11 | 类型 `CaseGovernanceSummary`/`CaseGovernanceEffectivePolicyView`/`CaseGovernanceEffectiveDecisionPolicyView`/`CaseGovernanceBenchmarkHotspotView`/`CaseGovernanceListItem`/`CaseGovernanceActionPreview*`系列/`GovernanceBenchmarkFilter`/`GovernanceCaseFilter`; service 方法 `getGovernanceSummary`/`listGovernanceBenchmarks`/`listGovernanceCases`/`previewGovernanceAction`; GovernanceOverviewPage(汇总统计卡+Benchmark热点+Case列表+操作预览Modal); 路由 `/governance` | S12(复用筛选+操作预览模式做LLM Quality) |
| S12 | 类型 `BenchmarkLLMQualityJob`/`LLMQualityJobStatus`/`LLMQualityJobSummary`/`LLMQualityCapabilities`/`TriggerLLMQualityCheckRequest`/`TriggerLLMQualityCheckResponse`; 常量 `LLM_QUALITY_JOB_STATUS_CONFIG`; service 方法 `getLLMQualityCapabilities`/`triggerLLMQualityCheck`/`listLLMQualityJobs`/`getLLMQualityJobSummary`/`getLLMQualityJob`/`cancelLLMQualityJob`/`retryLLMQualityJob`; LLMQualityPage(汇总统计+Job列表+5s轮询+Trigger Modal); 路由 `/benchmarks/:id/llm-quality` | S13(LLM Quality报告详情) |
| S13 | 类型 `BenchmarkLLMQualityReport`/`BenchmarkLLMQualityCaseReport`/`BenchmarkLLMQualityAggregate`/`LLMQualityDiffLatest`/`LLMQualityFinding`/`LLMQualityCaseFinding`; 常量 `LLM_QUALITY_RISK_CONFIG`; service 方法 `getLatestLLMQualityReport`/`listLLMQualityReports`/`getLatestLLMQualityAggregate`/`getLatestLLMQualityDiff`/`listLLMQualityCaseReports`; LLMQualityReportPage(概览+Aggregate+Diff+Findings+CaseReports+History); 路由 `/benchmarks/:id/llm-quality/:jobId` | S14(Quality Policy管理) |
| S14 | 类型 `OrganizationQualityPolicy`/`ResolvedQualityPolicy`/`QualityPolicyAuditLog`/`UpsertLLMQualityPolicyRequest`; 常量 `QUALITY_DIMENSIONS`; service 方法 `getEffectiveQualityPolicy`/`getOrganizationQualityPolicy`/`upsertOrganizationQualityPolicy`/`listQualityPolicyAudits`/`getOrganizationLLMQualityPolicy`/`validateLLMQualityPolicy`/`upsertOrganizationLLMQualityPolicy`; QualityPolicyPage(双Tab:质量策略+LLM策略+审计); 路由 `/governance/policies/quality` | S15+(策略消费方) |
| S15 | 新建独立类型文件`project-eval.ts`+服务文件`project-eval.ts`; 类型`ProjectEvalSource`/`ProjectEvalRun`/`ProjectEvalCapabilities`/`CreateSourceRequest`/`CreateRunRequest`; 常量`SOURCE_TYPE_CONFIG`/`PROJECT_TYPE_CONFIG`/`RUN_MODE_CONFIG`/`EVAL_SCOPE_CONFIG`; service 方法`getProjectEvalCapabilities`/`createProjectEvalSource`/`createProjectEvalRun`; ProjectEvalCreatePage(两步式:源表单+运行表单+Capabilities面板); 路由`/project-eval/create` | S16(计划确认+证据) |
| S16 | 新增20+类型: `RunDetailView`/`RunPlanView`/`RunMainlineView`/`CaseSelectionRecord`/`RunEvidenceRecordView`/`LinkedRepairRunSummaryView`/`RunRemediationOutcomeView`/`SnapshotGuard`/`MainlineActionResult`等; 常量`MAINLINE_STAGE_CONFIG`(21阶段)/`SELECTION_STATUS_CONFIG`/`FINAL_DECISION_CONFIG`/`REMEDIATION_CATEGORY_CONFIG`/`MAINLINE_ACTION_LABEL`; service 方法9个(`getRun`/`getRunPlan`/`regeneratePlan`/`applyOverrides`/`confirmRun`/`listCaseSelections`/`listEvidence`/`getMainline`/`executeMainlineAction`); ProjectEvalDetailPage(3 Tabs:计划+证据+生命周期+Override Modal+Mainline Actions); 路由`/project-eval/:id` | S17(报告+解释+洞察+策略) |
| S17 | 新增类型: `RunReportView`/`RunExplainView`/`RunExplainCaseSelectionView`/`RunInsightsSummary`/`RunInsightsTrends`/`RunDailyTrend`/`RunTypeScopeScore`/`ProjectEvalPolicy`/`UpsertPolicyRequest`/`PolicyPreview`/`PolicyPreviewDiff`/`PreviewSetDiff`/`PreviewDimensionWeightChange`/`PreviewRunOptionBlock`/`PolicyPreviewSummary`; service 方法7个(`getRunReport`/`getRunExplain`/`getInsightsSummary`/`getInsightsTrends`/`getEffectivePolicy`/`previewPolicy`/`upsertPolicy`); ProjectEvalInsightsPage(2 Tabs:洞察汇总+趋势+策略管理+预览差异); 路由`/project-eval/insights` | S18(修复运行) |

---

## 变更日志

| 日期 | 变更 |
|------|------|
| 2026-04-14 | S20 完成: Analyzer 报告页面（3 Tabs列表+详情Drawer+三种报告类型渲染+Agent/Benchmark统计表） |
| 2026-04-14 | S19 完成: Dashboard 真实数据接入（统计卡片从API加载+趋势图(cost.statistics)+最近执行(executions.list)+刷新按钮） |
| 2026-04-14 | S18 完成: Repair Run 管理页面（列表+筛选+详情Drawer+工作流操作plan/approve/apply/replay/cancel+Create Modal） |
| 2026-04-14 | S17 完成: Project Eval 洞察+策略页面（2 Tabs:组织洞察汇总+趋势+策略管理+预览差异Modal） |
| 2026-04-14 | S16 完成: Project Eval 详情页面（3 Tabs:计划操作+证据汇总+生命周期Steps+Mainline Actions+Override Modal） |
| 2026-04-14 | S15 完成: Project Eval 创建页面（两步式:Git/Zip源+Capabilities驱动运行表单） |
| 2026-04-14 | S14 完成: Quality Policy 管理页面（双Tab:质量策略6维度+LLM策略20+字段+审计日志） |
| 2026-04-14 | S13 完成: LLM Quality 报告详情页面（概览+Aggregate+Diff+Findings+CaseReports+History） |
| 2026-04-14 | S12 完成: LLM Quality 触发+列表页面（汇总统计+Job列表+5s轮询+Trigger Modal） |
| 2026-04-14 | S11 完成: 组织治理总览页面（汇总统计卡+Benchmark热点+Case治理列表+批量操作预览） |
| 2026-04-14 | S10 完成: 决策策略管理页面（reason分类排序+action mapping+审计日志） |
| 2026-04-14 | S09 完成: 信任策略管理页面（effective展示+编辑表单+审计日志） |
| 2026-04-13 | v3: 与后端模板对齐，按主线重新组织，增加 authoritative/degraded/长任务/权限要求 |
| 2026-04-13 | v2: 新增上下文传递记录章节 |
| 2026-04-13 | 初始化，创建 20 个 slice 计划 |
