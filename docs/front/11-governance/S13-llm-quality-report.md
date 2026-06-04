# S13 - LLM Quality 报告详情

## Slice 基本信息

| 字段 | 内容 |
|---|---|
| Slice ID | S13 |
| 名称 | LLM Quality 报告详情 |
| 所属主线 | benchmark |
| 所属模块 | benchmark quality llm report |
| 优先级 | P1 |
| 前置依赖 | S12 (Job 列表) |
| 当前状态 | 已完成 |

## 0. 目标

展示 LLM 质量检查的完整报告：最新报告概览（含 findings）、汇总统计、与上次报告的 diff、用例级报告列表（含 findings 展开）、报告历史。

## 1. 为什么先做这个 Slice

1. S12 已建立 Job 触发和列表，S13 展示 Job 完成后的报告内容。
2. 报告详情与 S05 (Validation Report) 和 S06 (Review Report) 复用三级下钻模式（Summary → CaseReports → Findings）。
3. S14 (Quality Policy) 需要引用 S13 的报告结构来展示策略效果。

## 2. 后端调研记录

### 2.1 读取的后端代码

| 文件 | 结论 |
|---|---|
| `router.go` L665-672 | 5 个路由: cases/aggregate/latest/diff/latest/llm-reports/latest/llm-reports/history |
| `benchmark_handler.go` L2515-2680 | 5 个 handler: GetLatestReport/ListReports/ListCaseReports/GetAggregate/GetDiff |
| `llm_quality_query.go` L86-183 | ListCaseReports: 分页+筛选(report_id/risk_gte/decision/dimension/changed_only) |
| `llm_quality_query.go` L247-268 | GetAggregate + GetDiff 服务方法 |
| `llm_quality.go` L1578-1600 | GetLatestReport + ListReports 服务方法 |
| `domain/llm_quality.go` L67-137 | BenchmarkLLMQualityReport(20+字段+findings) + BenchmarkLLMQualityFinding |
| `domain/llm_quality.go` L139-160 | BenchmarkLLMQualityCaseReport(18字段+findings) + BenchmarkLLMQualityCaseFinding |
| `domain/llm_quality.go` L162-180 | BenchmarkLLMQualityAggregate(12字段) |
| `llm_quality_query.go` L56-72 | LLMQualityDiffLatest(16字段) |

### 2.2 关键业务结论

1. **5 个端点**: latest report / report history / aggregate / diff / case reports。
2. **Report 结构**: 20+ 字段 (model/risk/score/authority/provider/summary/findings/token_usage/cost_usd/latency_ms 等)。
3. **Finding 结构**: dimension/severity/title/detail/evidence/suggestion/confidence，report 级和 case 级各有一个。
4. **Aggregate**: 12 字段 — total/critical/high/medium/low/info cases + total_findings + average_score。
5. **Diff**: 16 字段 — current/previous report_id/risk/decision/score + score_delta + changed/added/removed/new_high_risk/resolved_high_risk。
6. **Case Reports**: 分页，6 个筛选参数 (report_id/risk_gte/decision/dimension/changed_only + 分页)。
7. **Decision 派生逻辑**: critical/high → "block", medium → "warn", low/info → "pass"。
8. **Provider Execution Mode**: llm_success / llm_response_fallback / llm_error_fallback，影响 authority_status。

## 3. API 合同

### 3.1 接口列表

| 方法 | 路径 | 用途 | 权限 |
|---|---|---|---|
| GET | `/api/v1/benchmarks/:id/quality/llm-reports/latest` | 最新报告 | canRead |
| GET | `/api/v1/benchmarks/:id/quality/llm-reports/history` | 报告历史 | canRead |
| GET | `/api/v1/benchmarks/:id/quality/aggregate/latest` | 最新汇总 | canRead |
| GET | `/api/v1/benchmarks/:id/quality/diff/latest` | 最新 diff | canRead |
| GET | `/api/v1/benchmarks/:id/quality/cases` | 用例级报告 | canRead |

### 3.2 请求参数

**Cases query**:

| 参数 | 类型 | 说明 |
|---|---|---|
| report_id | string | 目标报告 ID（空则最新） |
| risk_gte | string | 风险级别筛选 >= 阈值 |
| decision | string | block/warn/pass |
| dimension | string | 按维度名称筛选 |
| changed_only | bool | 仅显示变化的 cases |
| page | int | 页码 |
| page_size | int | 每页数量 |

**History query**: page, page_size

### 3.3 响应结构

**Latest Report**: 单个 `BenchmarkLLMQualityReport`（含 findings）

**Aggregate**: `{ report_id, benchmark_id, total_cases, critical/high/medium/low/info_cases, total_findings, average_score, created_at }`

**Diff**: `{ current/previous_report_id, current/previous_risk/decision/score, score_delta, changed/added/removed/new_high_risk/resolved_high_risk_cases, generated_at }`

**Cases**: 分页 `BenchmarkLLMQualityCaseReport[]`（含 findings）

**History**: 分页 `BenchmarkLLMQualityReport[]`

## 4. 页面设计

### 4.1 页面位置

- 路由: `/benchmarks/:id/llm-quality/:jobId` (从 S12 的"查看报告"按钮跳转)

### 4.2 页面结构

**四段式布局**:

**Section 1 - 报告概览 + Aggregate + Diff**:
- Row 1 (统计卡):
  - Risk Level Tag (critical=red/high=orange/medium=yellow/low=green/info=blue)
  - Score: Statistic (0-100)
  - Authority Status Tag
  - Provider: name + model + execution mode
  - Cost: $XX / Latency: XXms
- Row 2 (Aggregate):
  - Total Cases / Critical / High / Medium / Low / Info / Total Findings / Average Score
- Row 3 (Diff with previous):
  - Score Delta (带箭头)
  - Changed / Added / Removed cases
  - New High Risk / Resolved High Risk
  - 无 diff 时: Alert "首次报告，无对比数据"

**Section 2 - Report Summary + Findings**:
- Summary 文本 (可折叠)
- Findings Table:
  - Dimension / Severity Tag / Title / Detail / Evidence / Suggestion / Confidence
  - 按 severity 排序

**Section 3 - Case Reports Table**:
- 筛选栏: risk_gte / decision / dimension / changed_only
- Table 列:
  - Case Key / Case Name / Index
  - Risk Tag / Score
  - Authority / Provider Mode
  - LLM Call Succeeded
  - Summary (tooltip)
  - Findings Count
- 展开行: Findings Table (同 Section 2 结构)
- 分页

**Section 4 - Report History**:
- Collapse 面板 (默认折叠)
- Table: Date / Model / Risk / Score / Authority / Findings Count
- 点击行 → 切换当前查看的报告

### 4.3 交互流

1. 页面加载 → 并行请求 latest report + aggregate + diff + cases
2. Section 1 渲染概览和 diff
3. Section 2 渲染 findings
4. Section 3 渲染 case reports（含筛选）
5. 打开 History → 加载报告历史 → 点击行 → 刷新所有 sections (用 report_id 筛选)

### 4.4 权限控制

- 所有端点仅需 canRead 权限

## 5. 文件变更范围

| 文件 | 动作 | 原因 |
|---|---|---|
| `src/types/api/benchmark.ts` | 修改 | 新增 Report/Aggregate/Diff/CaseReport/Finding 类型 + 配置常量 |
| `src/services/benchmark.ts` | 修改 | 新增 5 个 service 方法 |
| `src/pages/benchmark-quality/LLMQualityReportPage.tsx` | 新增 | 报告详情页面 |
| `src/router/routes.tsx` | 修改 | 新增 lazy import |
| `src/router/index.tsx` | 修改 | 新增路由 |

核心文件 3 个 + 路由配置 2 个。

### 5.1 新增类型清单

```typescript
// Risk Level (复用 S06 的 ReviewRisk 类似结构)
export const LLM_QUALITY_RISK_CONFIG = {
  critical: { label: '严重', color: 'red' },
  high: { label: '高', color: 'orange' },
  medium: { label: '中', color: 'gold' },
  low: { label: '低', color: 'green' },
  info: { label: '信息', color: 'blue' },
} as const;

// Report Finding
export interface LLMQualityFinding {
  id: number;
  report_id: string;
  dimension: string;
  severity: string;
  title: string;
  detail?: string;
  evidence?: string;
  suggestion?: string;
  confidence: number;
  created_at: string;
}

// Full Report
export interface BenchmarkLLMQualityReport {
  id: string;
  job_id: string;
  benchmark_id: string;
  organization_id: string;
  model: string;
  prompt_version?: string;
  dimensions?: unknown;
  overall_risk: string;
  score: number;
  authority_status?: string;
  provider_execution_mode?: string;
  provider_name?: string;
  resolved_model?: string;
  llm_call_succeeded: boolean;
  degraded_reason?: string;
  summary?: string;
  suggestions?: unknown;
  token_usage?: unknown;
  cost_usd: number;
  latency_ms: number;
  raw_response?: unknown;
  provider_runtime_json?: unknown;
  created_at: string;
  findings?: LLMQualityFinding[];
}

// Case Finding
export interface LLMQualityCaseFinding {
  id: number;
  case_report_id: string;
  dimension: string;
  severity: string;
  title: string;
  detail?: string;
  evidence?: string;
  suggestion?: string;
  confidence: number;
  created_at: string;
}

// Case Report
export interface BenchmarkLLMQualityCaseReport {
  id: string;
  report_id: string;
  benchmark_id: string;
  organization_id: string;
  case_key: string;
  case_name?: string;
  case_index: number;
  risk: string;
  score: number;
  authority_status?: string;
  provider_execution_mode?: string;
  provider_name?: string;
  resolved_model?: string;
  llm_call_succeeded: boolean;
  degraded_reason?: string;
  summary?: string;
  dimensions?: unknown;
  provider_runtime_json?: unknown;
  created_at: string;
  findings?: LLMQualityCaseFinding[];
}

// Aggregate
export interface BenchmarkLLMQualityAggregate {
  report_id: string;
  benchmark_id: string;
  organization_id: string;
  total_cases: number;
  critical_cases: number;
  high_cases: number;
  medium_cases: number;
  low_cases: number;
  info_cases: number;
  total_findings: number;
  average_score: number;
  created_at: string;
}

// Diff
export interface LLMQualityDiffLatest {
  current_report_id: string;
  previous_report_id?: string;
  current_risk: string;
  previous_risk?: string;
  current_decision: string;
  previous_decision?: string;
  current_score: number;
  previous_score: number;
  score_delta: number;
  changed_cases: number;
  added_cases: number;
  removed_cases: number;
  new_high_risk_cases: number;
  resolved_high_risk_cases: number;
  generated_at: string;
}
```

## 6. 验收标准

- [ ] 页面在 `/benchmarks/:id/llm-quality/:jobId` 可访问
- [ ] 报告概览: Risk/Score/Authority/Provider/Cost/Latency
- [ ] Aggregate 统计卡正确展示
- [ ] Diff 展示当前 vs 上次的变化
- [ ] Findings Table: Dimension/Severity/Title/Detail
- [ ] Case Reports 列表含筛选 (risk/decision/dimension/changed_only)
- [ ] Case 展开行显示 Findings
- [ ] Report History 可折叠
- [ ] `npm run type-check` 通过
- [ ] `npm run build` 通过

## 7. 明确不做什么

1. 本 slice 不做 LLM Quality 策略管理 (S14)。
2. 本 slice 不做 override 功能。
3. 本 slice 不做报告导出。
4. 本 slice 不做 token_usage 和 raw_response 的详细 UI（仅展示基本指标）。

## 8. 留给下一 Slice 的上下文

| 项目 | 内容 |
|---|---|
| 新增 service 方法 | `getLatestLLMQualityReport`, `listLLMQualityReports`, `getLatestLLMQualityAggregate`, `getLatestLLMQualityDiff`, `listLLMQualityCaseReports` |
| 新增类型 | `BenchmarkLLMQualityReport`, `BenchmarkLLMQualityCaseReport`, `BenchmarkLLMQualityAggregate`, `LLMQualityDiffLatest`, `LLMQualityFinding`, `LLMQualityCaseFinding`, `LLM_QUALITY_RISK_CONFIG` |
| 可复用模式 | 三级下钻: Aggregate → CaseReports → Findings (复用 S05 模式) |

## 9. 实现记录

| 项目 | 内容 |
|---|---|
| 完成日期 | 2026-04-14 |
| 实际修改文件 | `src/types/api/benchmark.ts`, `src/services/benchmark.ts`, `src/pages/benchmark-quality/LLMQualityReportPage.tsx`, `src/router/routes.tsx`, `src/router/index.tsx` |
| 运行命令 | `npx tsc --noEmit` ✅, `npx vite build` ✅ |
| 遇到的问题 | 1. placeholder "风险 >= " 中 `=` 导致 JSX 解析错误 → 改为 "风险 ≥"; 2. `.map(([k, v])` 中 `v` 与 JSX 属性冲突 → 改为 `[key, cfg]`; 3. `LLM_QUALITY_JOB_STATUS_CONFIG` 和 `SEVERITY_ORDER` 未使用 → 移除 |
| 与原方案的差异 | 无差异 |

---

## 后端确认结论

1. 5 个端点，全在 `/api/v1/benchmarks/:id/quality/` 下。
2. Latest report 含 20+ 字段 + findings 数组。
3. Aggregate: 12 字段 (risk 分布 + findings + score)。
4. Diff: 16 字段 (current vs previous 的 risk/decision/score + 变化计数)。
5. Case reports: 分页 + 6 筛选参数，每条含 findings。
6. History: 分页的 report 列表。
7. Risk level 5 级: critical/high/medium/low/info。
8. Authority: authoritative / degraded。Provider mode: 3 种。
