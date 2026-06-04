# S06 - Case Review 触发 + 报告

## Slice 基本信息

| 字段 | 内容 |
|---|---|
| Slice ID | S06 |
| 名称 | Case Review 触发 + 报告 |
| 所属主线 | benchmark |
| 所属模块 | benchmark case governance |
| 优先级 | P0 |
| 前置依赖 | S02, S05(复用 Report Modal 模式) |
| 当前状态 | 已完成 |

## 0. 目标

用户可以在 Case 治理 Drawer 中触发 LLM 审查 Job、查看审查 Job 列表（含轮询）、点击查看审查报告（Report + Case Reports + Drift 信息）。

## 1. 为什么先做这个 Slice

1. Review 是治理流水线的第三道关卡（静态检测→动态验证→LLM增强审查），S04/S05 已完成前两道。
2. Review 引入 LLM 评估，是第一个依赖 AI Provider 的治理环节，用户需要看到 provider 执行状态和置信度。
3. Drift 追踪（与上次审查结果的对比）是 Review 独有的能力。

## 2. 后端调研记录

### 2.1 读取的后端代码

| 文件 | 结论 |
|---|---|
| `router.go` L633-636,645 | 5 个 review 路由: POST /review, GET /review-jobs, GET /review/latest, GET /review/cases, GET /:caseKey/review-history |
| `benchmark_handler.go` L1614-1620 | `TriggerCaseReviewRequest`: case_keys/model/idempotency_key/trigger_source（注意：有 `model` 字段，无 `repeat_runs`） |
| `benchmark_handler.go` L1898-1950 | `TriggerCaseReviewJob`: canWrite, 202 Accepted, 同 validation 模式 |
| `benchmark_handler.go` L1952-1980 | `ListCaseReviewJobs`: query status+分页, canRead |
| `benchmark_handler.go` L1982-2006 | `GetLatestCaseReviewReport`: 无参数, `SuccessResponse` |
| `benchmark_handler.go` L2008-2053 | `ListCaseReviewCaseReports`: query report_id/risk_gte/decision/low_confidence/drift_status+分页, header `X-Case-Review-Report-ID` |
| `benchmark_handler.go` L2055-2090 | `ListCaseReviewHistory`: path :caseKey+分页 |
| `case_review.go`(domain) L75-94 | `BenchmarkCaseReviewJob`: id/benchmark_id/model/status/report_id/error_message/started_at/completed_at 等 |
| `case_review.go`(domain) L96-131 | `BenchmarkCaseReviewReport`: 28 字段，含 decision/pass_cases/warn_cases/block_cases/low_confidence_cases/average_confidence/authority_status/provider_execution_mode/provider_name/resolved_model/llm_call_succeeded/summary 等 |
| `case_review.go`(domain) L133-185 | `BenchmarkCaseReviewCaseReport`: 51 字段，含 decision/risk/confidence/low_confidence/drift_status/previous_decision/previous_risk/summary/findings_json 等 |
| `case_review.go`(domain) L11-58 | 枚举: JobStatus(5), Decision(pass/warn/block), DriftStatus(6), ProviderExecutionMode(7), AuthorityStatus(3) |
| `case_review.go`(app) L42-58 | RuntimeConfig: Enabled/MaxCasesPerJob(200)/Model/ProviderRoute/ConfidenceThreshold(0.65) 等 |
| `case_review.go`(app) L174-273 | 触发流程: 与 validation 相同的 Kafka+goroutine 模式 |
| `case_review_evaluator.go` | LLM 评估器: 多 provider fallback, temperature=0.1, 结构化 JSON 输出 |

### 2.2 读取的辅助文档

无相关文档。

### 2.3 代码与文档一致性判断

1. 所有信息从代码直接确认。
2. 本 slice 以 `case_review.go`(domain)、`case_review.go`(app)、`benchmark_handler.go` 为准绳。

### 2.4 关键业务结论

1. **无 Preview/Capabilities**: Review 没有 preview 和 capabilities 端点，触发前无法预知范围。
2. **Trigger 有 model 参数**: 用户可选 LLM model，空值用默认 model。
3. **Decision 枚举不同**: pass/warn/block（vs validation 的 pass/fail/error/unsupported）。
4. **Risk 枚举**: critical/high/medium/low/info（比 detection/validation 多了 info）。
5. **Confidence**: 0-1 浮点数，低于 0.65 为低置信度。Case Report 有 `low_confidence` 布尔标记。
6. **Drift**: 与上次审查的对比（decision 变化、risk 变化、confidence 下降等），6 种状态。
7. **Provider 执行模式**: 7 种（llm_success/llm_response_fallback/llm_error_fallback 等），表示结果来源质量。
8. **Report (非 Summary)**: Review 的顶层报告叫 `BenchmarkCaseReviewReport`，比 validation 的 Summary 字段更多（含 provider 信息、LLM 调用状态等）。
9. **Cross-pillar 级联**: 验证完成后可自动触发审查，审查低置信度 case 可自动触发验证 recheck。
10. **Case Report 有 previous_* 字段**: 直接包含上次审查的 decision/risk/confidence，无需额外 API。

## 3. API 合同

### 3.1 接口列表

| 方法 | 路径 | 用途 | 权限 |
|---|---|---|---|
| POST | `/api/v1/benchmarks/:id/cases/review` | 触发审查 Job | canWrite |
| GET | `/api/v1/benchmarks/:id/cases/review-jobs` | Job 列表 | canRead |
| GET | `/api/v1/benchmarks/:id/cases/review/latest` | 最新审查报告 | canRead |
| GET | `/api/v1/benchmarks/:id/cases/review/cases` | Case 级报告 | canRead |
| GET | `/api/v1/benchmarks/:id/cases/:caseKey/review-history` | 单 Case 历史 | canRead |

### 3.2 请求参数

**Trigger**:
- path: `id`
- body: `{ case_keys?: string[], model?: string, idempotency_key?: string, trigger_source?: string }`

**List Jobs**:
- query: `page`, `page_size`, `status`(可选)

**Latest Report**:
- path: `id`

**Case Reports**:
- query: `page`, `page_size`, `report_id`(可选,空=自动取最新), `risk_gte`, `decision`(pass/warn/block), `low_confidence`(bool), `drift_status`(new/stable/risk_up/risk_down/decision_changed/confidence_down)

**History**:
- path: `id`, `caseKey`; query: `page`, `page_size`

### 3.3 响应结构

**Trigger** (202): 同 validation `{job_id, status, created_at}`

**Report** (`SuccessResponse`):
```json
{
  "code": 0,
  "data": {
    "id": "rr_001",
    "job_id": "jr_001",
    "model": "claude-3.5-sonnet",
    "decision": "pass",
    "total_cases": 50,
    "pass_cases": 40,
    "warn_cases": 8,
    "block_cases": 2,
    "low_confidence_cases": 3,
    "average_confidence": 0.85,
    "authority_status": "authoritative",
    "provider_execution_mode": "llm_success",
    "provider_name": "anthropic",
    "resolved_model": "claude-3.5-sonnet-20241022",
    "llm_call_succeeded": true,
    "summary": "Overall quality is good...",
    "generated_at": "2026-04-13T10:10:00Z"
  }
}
```

**Case Reports** (`SuccessPageResponse`): 每条 51 字段，核心：
- `decision`, `risk`, `confidence`, `low_confidence`, `authority_status`
- `drift_status`, `previous_decision`, `previous_risk`
- `summary`, `provider_execution_mode`
- `validation_outcome`, `validation_flaky`

### 3.4 错误与边界

1. 禁用 → 403; 仓库未配置 → 501; 评估器/队列不可用 → 503
2. 无 case → 400; 超限 → 400
3. Report 不存在 → 404（从未审查过）
4. Case Reports 空 → 空数组

## 4. 前端现状调研

### 4.1 可复用代码

| 类型 | 文件 | 复用方式 |
|---|---|---|
| pattern | S04 | Validation Collapse + Trigger Modal + Job list + polling 完整模式 |
| pattern | S05 | Report Modal + Case Reports Table + 展开行 |
| type | `benchmark.ts` | VALIDATION_JOB_STATUS_CONFIG 可复用（status 枚举相同） |

### 4.2 当前缺口

1. 无 Review 相关类型定义。
2. 无 Review 相关 service 方法。
3. Drawer 中 review 只有 Descriptions 简要状态。

## 5. 页面设计

### 5.1 页面位置

- **Review Collapse**: S02 Drawer 内，在 Validation Collapse 之后
- **Trigger Modal**: 点击"触发审查"按钮打开
- **Report Modal**: 点击 completed Job 的"查看报告"打开

### 5.2 页面结构

**Review Collapse 面板**:
1. 触发按钮 "触发审查"（需 canWrite，disabled 当 403/503）
2. Job 列表 Table: status(created_by, model, created_at, completed_at, error_message, 操作-查看报告)
3. 5s 轮询机制（复用 S04 模式）

**Trigger Modal**:
- Model 选择（Input，可选，留空用默认）
- 确认触发 → POST → 202
- 无 Preview（review 没有 preview 端点）

**Report Modal** (900px):
1. **Report 统计**: pass/warn/block/low_confidence + average_confidence + decision Tag + authority_status
2. **Provider 信息**: provider_name / resolved_model / provider_execution_mode Tag / llm_call_succeeded
3. **Case Reports Table**: case_key / decision / risk / confidence / low_confidence / drift_status / authority_status / created_at
4. **Drift 列**: drift_status Tag + previous_decision→decision 变化
5. **筛选**: decision / drift_status Select
6. **展开行**: summary + findings(JSON) + previous_risk + previous_confidence + validation_outcome + validation_flaky

### 5.3 交互流

1. 展开 Review Collapse → 加载 Job 列表
2. 点击"触发审查" → Modal → 可选 model → 确认 → 202 → 关闭 Modal → 刷新 Job 列表
3. 有 running Job → 5s 轮询 → 终态停止
4. 点击 completed Job "查看报告" → Report Modal → 加载 Report + Case Reports
5. Case Reports 可按 decision/drift_status 筛选
6. 展开某行 → 查看详细审查结果（summary + findings + drift 变化）
7. authority_status 非 authoritative 行标黄

## 6. 数据与状态设计

### 6.1 新增枚举配置

```typescript
REVIEW_DECISION_CONFIG = {
  pass: { label: '通过', color: 'success' },
  warn: { label: '警告', color: 'warning' },
  block: { label: '阻止', color: 'error' },
}

REVIEW_RISK_CONFIG = {
  critical: { label: '严重', color: 'red' },
  high: { label: '高', color: 'orange' },
  medium: { label: '中', color: 'gold' },
  low: { label: '低', color: 'green' },
  info: { label: '信息', color: 'blue' },
}

REVIEW_DRIFT_STATUS_CONFIG = {
  new: { label: '新', color: 'blue' },
  stable: { label: '稳定', color: 'green' },
  risk_up: { label: '风险升高', color: 'orange' },
  risk_down: { label: '风险降低', color: 'green' },
  decision_changed: { label: '决策变更', color: 'red' },
  confidence_down: { label: '置信度下降', color: 'warning' },
}
```

### 6.2 长任务机制

同 S04: 5s 轮询，running Job 存在时启动，全部终态停止，Drawer 关闭清理。

## 7. 文件变更范围

| 文件 | 动作 | 原因 |
|---|---|---|
| `src/types/api/benchmark.ts` | 修改 | 新增 Review 类型 + 枚举配置 |
| `src/services/benchmark.ts` | 修改 | 新增 5 个 Review service 方法 |
| `src/pages/benchmarks/BenchmarkDetailPage.tsx` | 修改 | 新增 Review Collapse + Trigger Modal + Report Modal |

## 8. 验收标准

- [ ] Review Collapse 面板在 Drawer 内展示
- [ ] "触发审查" 按钮打开 Modal，可选 model
- [ ] 触发成功后 Job 列表刷新
- [ ] Job 列表含 status/model/created_by/时间/错误/操作
- [ ] 有 running Job 时 5s 轮询
- [ ] 点击 completed Job "查看报告" 打开 Report Modal
- [ ] Report 统计卡展示 (pass/warn/block/low_confidence/confidence)
- [ ] Provider 信息展示 (provider/model/execution_mode)
- [ ] Case Reports Table 含 decision/risk/confidence/drift_status
- [ ] decision/risk/drift_status 用彩色 Tag 展示
- [ ] authority_status 非 authoritative 行标黄
- [ ] 展开行显示 summary + findings + drift 变化
- [ ] 筛选: decision / drift_status
- [ ] loading / empty / error / disabled 状态完整
- [ ] `npm run type-check` 通过
- [ ] `npm run build` 通过

## 9. 明确不做什么

1. 本 slice 不做 Review History 独立页面（service 方法已预留）。
2. 本 slice 不做 findings_json 的详细结构化展示（用 JSON.stringify 简单展示）。
3. 本 slice 不做 recheck trigger record 展示。
4. 本 slice 不做 provider_runtime_json 的可观测性展示。
5. 本 slice 不做 LLM provider 配置/管理。

## 10. 留给下一 Slice 的上下文

| 项目 | 内容 |
|---|---|
| 新增 service 方法 | `triggerCaseReview`, `listReviewJobs`, `getLatestReviewReport`, `listReviewCaseReports`, `listReviewHistory` |
| 新增类型 | `ReviewDecision`, `ReviewRisk`, `ReviewDriftStatus`, `ReviewProviderExecutionMode` + 3 配置常量 + `BenchmarkCaseReviewJob`, `TriggerReviewResponse`, `BenchmarkCaseReviewReport`, `BenchmarkCaseReviewCaseReport` |
| 可复用组件 | Review Collapse + Trigger Modal + Report Modal 完整模式; Provider 信息 Alert; Drift 变化对比展示 |
| 已知遗留问题 | 1. listReviewHistory service 方法已添加但未在 UI 中消费; 2. findings_json 用 pre 标签简单展示，未做结构化; 3. recheck trigger record 未展示; 4. review 没有 capabilities 端点，无法提前检测可用性 |

## 11. 实现记录

| 项目 | 内容 |
|---|---|
| 完成日期 | 2026-04-13 |
| 实际修改文件 | `src/types/api/benchmark.ts`, `src/services/benchmark.ts`, `src/pages/benchmarks/BenchmarkDetailPage.tsx` |
| 运行命令 | `npx tsc --noEmit` ✅, `npx vite build` ✅ |
| 遇到的问题 | 1. reviewEnabled/reviewDisabledReason 声明未使用（review 无 capabilities 端点），删除; 2. findings_json 的 `unknown` 类型不能直接给 `<Text>`，改用 `<pre>` 标签 |
| 与原方案的差异 | 无实质性差异 |

---

## 后端确认结论

1. Review 与 Validation 共享 Job 状态机和 Kafka+goroutine 异步模式，但执行器不同（LLM vs 沙箱）。
2. Trigger 参数多了一个 `model` 字段，没有 `repeat_runs`。
3. 没有 Preview/Capabilities 端点，触发前无法预知范围。
4. Report 字段比 Validation Summary 丰富得多（provider 信息、LLM 调用状态、summary 文本）。
5. Case Report 有 drift 追踪（previous_* 字段），这是 Review 独有的。
6. `confidence` 是 0-1 浮点数，低于 0.65 标记为低置信度。
7. Review Case Reports 筛选器比 Validation 多: risk_gte, decision, low_confidence, drift_status。
