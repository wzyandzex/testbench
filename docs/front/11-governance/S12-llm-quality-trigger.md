# S12 - LLM Quality 触发+列表

## Slice 基本信息

| 字段 | 内容 |
|---|---|
| Slice ID | S12 |
| 名称 | LLM Quality 触发+列表 |
| 所属主线 | benchmark |
| 所属模块 | benchmark quality llm |
| 优先级 | P1 |
| 前置依赖 | S04 (复用 trigger+polling 模式) |
| 当前状态 | 已完成 |

## 0. 目标

用户可以在 Benchmark 详情或独立页面触发 LLM 质量检查、查看 Job 列表和汇总、取消/重试 Job。触发前可查询能力（允许的模型、维度目录）构建表单。

## 1. 为什么先做这个 Slice

1. LLM Quality 是治理流水线的重要子系统，S04 已建立 trigger+polling+job list 模式，S12 可复用。
2. S13 (LLM Quality 报告) 依赖 S12 的 Job 列表和触发功能。
3. 与 S11 的操作预览联动，S11 的 `validate_cases`/`review_cases` 可直接触发，但 `recheck_quality` 需跳转到 S12 页面。

## 2. 后端调研记录

### 2.1 读取的后端代码

| 文件 | 结论 |
|---|---|
| `router.go` L576 | GET `/quality/llm/capabilities` — 独立路径，不在 benchmarks 下 |
| `router.go` L656-664 | 6 个 job 端点: POST/GET/GET summary/GET :job_id/POST cancel/POST retry |
| `benchmark_handler.go` L2183-2513 | Trigger/List/Summary/Get/Cancel/Retry handlers |
| `benchmark_handler.go` L2798-2813 | Capabilities handler: 仅需 auth+orgID |
| `llm_quality.go` L133-161 | Request 类型: Trigger(body: model/dimensions/scope/case_selector/strict_mode/idempotency_key), Retry(query: idempotency_key) |
| `llm_quality.go` L248-253 | `LLMQualityDimensionCapability`: name/cost_class/latency_class/requires_model |
| `llm_quality.go` L261-270 | `LLMQualityCapabilities`: dimensions/dimension_catalog/allowed_models/default_model 等 |
| `llm_quality.go` L841-986 | Trigger 服务: 解析策略→验证模型→检查并发/预算限制→创建 Job→入队 |
| `llm_quality_query.go` L30-45 | `ListLLMQualityJobsRequest` + `LLMQualityJobSummary`(8 个计数字段) |
| `llm_quality_query.go` L185-245 | List/Summary 实现: 分页+状态筛选 + 计数聚合 |
| `domain/llm_quality.go` L10-18 | Status 枚举: pending/processing/completed/failed/cancelled |
| `domain/llm_quality.go` L45-65 | `BenchmarkLLMQualityJob`: 14 个字段(id/benchmark_id/model/dimensions/status/error_message/report_id 等) |

### 2.2 关键业务结论

1. **7 个端点**: trigger(list 写入)、list、summary、get job、cancel、retry、capabilities。
2. **Capabilities 在不同 base path**: `/api/v1/quality/llm/capabilities`（非 benchmarks 下），仅需 auth+orgID。
3. **Trigger 表单字段**: model(必填，默认策略值)、dimensions(可选，默认策略值)、scope("full"/"delta")、case_selector(case_keys/max_cases)、strict_mode(bool)、idempotency_key(可选)。
4. **Job 状态**: 与 S04 相同的 pending→processing→completed/failed/cancelled。
5. **Summary**: total/pending/processing/completed/failed/cancelled + running(pending+processing) + terminal(completed+failed+cancelled)。
6. **Cancel**: 仅 pending/processing 可取消。**Retry**: 仅 failed/cancelled 可重试。
7. **错误**: 403(disabled)、400(model not allowed/strict mode forbidden)、429(too many running/budget exceeded/request limit)。

## 3. API 合同

### 3.1 接口列表

| 方法 | 路径 | 用途 | 权限 |
|---|---|---|---|
| GET | `/api/v1/quality/llm/capabilities` | 查询 LLM 能力 | auth |
| POST | `/api/v1/benchmarks/:id/quality/llm-checks` | 触发检查 | canWrite |
| GET | `/api/v1/benchmarks/:id/quality/llm-checks` | Job 列表 | canRead |
| GET | `/api/v1/benchmarks/:id/quality/llm-checks/summary` | Job 汇总 | canRead |
| GET | `/api/v1/benchmarks/:id/quality/llm-checks/:jobId` | 获取 Job | canRead |
| POST | `/api/v1/benchmarks/:id/quality/llm-checks/:jobId/cancel` | 取消 Job | canWrite |
| POST | `/api/v1/benchmarks/:id/quality/llm-checks/:jobId/retry` | 重试 Job | canWrite |

### 3.2 请求参数

**Trigger body**:
```json
{
  "model": "gpt-4",
  "dimensions": ["correctness", "completeness"],
  "scope": "full",
  "case_selector": { "case_keys": ["..."], "max_cases": 50 },
  "strict_mode": false,
  "idempotency_key": "optional-key"
}
```

**List query**: page, page_size, status(filter: pending/processing/completed/failed/cancelled/running/terminal)

**Retry query**: idempotency_key (optional)

### 3.3 响应结构

**Trigger** (202): `{ "job_id": "...", "status": "pending", "created_at": "..." }`

**List** (200): `{ total, page, size, data: [BenchmarkLLMQualityJob] }`

**Summary** (200): `{ total, pending, processing, completed, failed, cancelled, running, terminal }`

**Job**: 单个 `BenchmarkLLMQualityJob` 对象

**Capabilities**: `{ dimensions, dimension_catalog, allowed_models, default_model, default_dimensions, ... }`

### 3.4 错误与边界

| 错误 | HTTP | 场景 |
|---|---|---|
| LLM quality disabled | 403 | 组织策略 enabled=false |
| Model not allowed | 400 | 模型不在允许列表 |
| Strict mode forbidden | 400 | 策略未允许 strict mode |
| Too many running jobs | 429 | 超过并发限制 |
| Budget exceeded | 429 | 超过每日预算 |
| Request limit reached | 429 | 超过每日请求限制 |
| Job not found | 404 | job_id 不存在 |
| Job not cancelable | 409 | 非 pending/processing |
| Job not retryable | 409 | 非 failed/cancelled |

## 4. 页面设计

### 4.1 页面位置

- 路由: `/benchmarks/:id/quality` (Tab 方式嵌入 Benchmark 详情) 或独立页面 `/benchmark-quality/:id/llm-checks`
- 采用独立页面方式: `/benchmarks/:id/llm-quality`

### 4.2 页面结构

**三段式布局**:

**Section 1 - 汇总统计**:
- Row of Statistic Cards: Total / Pending / Processing / Completed / Failed / Cancelled
- Running 和 Terminal 汇总

**Section 2 - 触发按钮 + Job 列表**:
- 触发按钮: 打开 Trigger Modal
- 筛选: status Select
- Table 列:
  - ID (截断显示)
  - Model
  - Status Tag
  - Strict Mode
  - Error Message (tooltip)
  - 开始时间 / 完成时间
  - 创建时间
  - 操作: 取消(pending/processing) / 重试(failed/cancelled) / 查看报告(completed,跳转S13)
- 分页
- 自动轮询: 当有 pending/processing job 时 5s 轮询

**Section 3 - Trigger Modal**:
- Form 字段:
  - Model: Select (从 capabilities.allowed_models，默认 capabilities.default_model)
  - Dimensions: 多选 Select (从 capabilities.dimension_catalog)
  - Scope: Radio (full / delta)
  - Case Selector: 条件显示 (scope=delta 时)
    - Case Keys: TagInput 或 TextArea (每行一个)
    - Max Cases: InputNumber
  - Strict Mode: Switch
  - Idempotency Key: Input (可选)
- 提交 → 202 → 关闭 Modal → 刷新列表

### 4.3 交互流

1. 页面加载 → 并行请求 capabilities + summary + jobs
2. 汇总卡渲染
3. Job 列表渲染
4. 点击"触发检查" → 打开 Modal → 加载 capabilities → 填表单 → 提交
5. 提交成功 → 关闭 Modal → 轮询刷新
6. 点击取消 → 确认 → POST cancel → 刷新
7. 点击重试 → 确认 → POST retry → 刷新
8. 点击查看报告 → 跳转 S13 页面 (job_id 作为参数)

### 4.4 权限控制

- 触发/取消/重试: canWrite (后端校验)
- 查看: canRead

## 5. 文件变更范围

| 文件 | 动作 | 原因 |
|---|---|---|
| `src/types/api/benchmark.ts` | 修改 | 新增 LLM Quality 类型 + 配置常量 |
| `src/services/benchmark.ts` | 修改 | 新增 7 个 service 方法 |
| `src/pages/benchmark-quality/LLMQualityPage.tsx` | 新增 | LLM Quality 页面 |
| `src/router/routes.tsx` | 修改 | 新增 lazy import |
| `src/router/index.tsx` | 修改 | 新增路由 |

核心文件 3 个 + 路由配置 2 个。

### 5.1 新增类型清单

```typescript
// LLM Quality Job Status
export type LLMQualityJobStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';

export const LLM_QUALITY_JOB_STATUS_CONFIG = {
  pending: { label: '等待中', color: 'default' },
  processing: { label: '处理中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  failed: { label: '失败', color: 'error' },
  cancelled: { label: '已取消', color: 'default' },
} as const;

// LLM Quality Job
export interface BenchmarkLLMQualityJob {
  id: string;
  benchmark_id: string;
  organization_id: string;
  created_by: string;
  model: string;
  dimensions?: unknown;
  strict_mode: boolean;
  status: LLMQualityJobStatus;
  error_message?: string;
  started_at?: string;
  completed_at?: string;
  report_id?: string;
  idempotency_key?: string;
  created_at: string;
  updated_at: string;
}

// Trigger Response
export interface TriggerLLMQualityCheckResponse {
  job_id: string;
  status: LLMQualityJobStatus;
  created_at: string;
}

// Job Summary
export interface LLMQualityJobSummary {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  cancelled: number;
  running: number;
  terminal: number;
}

// Capabilities
export interface LLMQualityDimensionCapability {
  name: string;
  cost_class: string;
  latency_class: string;
  requires_model?: string[];
}

export interface LLMQualityResultPostProcessorCapability {
  name: string;
  active: boolean;
  required: boolean;
}

export interface LLMQualityCapabilities {
  dimensions: string[];
  dimension_catalog: LLMQualityDimensionCapability[];
  result_post_processor_catalog?: LLMQualityResultPostProcessorCapability[];
  allowed_models: string[];
  default_model?: string;
  default_dimensions?: string[];
  dimension_template_by_source_type?: Record<string, string[]>;
  dimension_template_by_benchmark_type?: Record<string, string[]>;
}

// Trigger Request
export interface TriggerLLMQualityCheckRequest {
  model: string;
  dimensions?: string[];
  scope?: string;
  case_selector?: { case_keys?: string[]; max_cases?: number };
  strict_mode?: boolean;
  idempotency_key?: string;
}
```

## 6. 验收标准

- [ ] 页面可访问 (通过 Benchmark 详情跳转或直接 URL)
- [ ] 汇总统计正确展示
- [ ] Job 列表含状态筛选和分页
- [ ] 触发 Modal: Model/Dimensions/Scope 表单
- [ ] 触发后列表自动刷新 (轮询)
- [ ] 取消按钮仅 pending/processing 可用
- [ ] 重试按钮仅 failed/cancelled 可用
- [ ] 查看报告按钮跳转 (预留 S13 路由)
- [ ] Capabilities 驱动表单选项
- [ ] `npm run type-check` 通过
- [ ] `npm run build` 通过

## 7. 明确不做什么

1. 本 slice 不做报告详情 (S13 范围)。
2. 本 slice 不做 LLM Quality 策略管理 (S14 范围)。
3. 本 slice 不做 override 功能 (后续 slice)。
4. 本 slice 不做 capabilities 的详细 UI 展示 (仅用于构建表单)。

## 8. 留给下一 Slice 的上下文

| 项目 | 内容 |
|---|---|
| 新增 service 方法 | `getLLMQualityCapabilities`, `triggerLLMQualityCheck`, `listLLMQualityJobs`, `getLLMQualityJobSummary`, `getLLMQualityJob`, `cancelLLMQualityJob`, `retryLLMQualityJob` |
| 新增类型 | `BenchmarkLLMQualityJob`, `LLMQualityJobStatus`, `LLMQualityJobSummary`, `LLMQualityCapabilities`, `TriggerLLMQualityCheckRequest`, `TriggerLLMQualityCheckResponse` 等 |
| 轮询模式 | 复用 S04 的 5s 轮询模式: 有 pending/processing job 时启用 |
| 页面路由 | `/benchmarks/:id/llm-quality` |

## 9. 实现记录

| 项目 | 内容 |
|---|---|
| 完成日期 | 2026-04-14 |
| 实际修改文件 | `src/types/api/benchmark.ts`, `src/services/benchmark.ts`, `src/pages/benchmark-quality/LLMQualityPage.tsx`, `src/router/routes.tsx`, `src/router/index.tsx` |
| 运行命令 | `npx tsc --noEmit` ✅, `npx vite build` ✅ |
| 遇到的问题 | 1. `Alert` 未使用 import → 移除 |
| 与原方案的差异 | 无差异 |

---

## 后端确认结论

1. 7 个端点: 6 个在 `/api/v1/benchmarks/:id/quality/llm-checks` 下，1 个 capabilities 在 `/api/v1/quality/llm/capabilities`。
2. Trigger body 5 字段: model/dimensions/scope/case_selector/strict_mode + idempotency_key。
3. Job status 5 个: pending/processing/completed/failed/cancelled。
4. Summary 8 个计数字段: 5 原始 + running(pending+processing) + terminal(completed+failed+cancelled) + total。
5. Capabilities 驱动表单: allowed_models/default_model/dimension_catalog。
6. 错误丰富: 403(disabled)/400(model)/429(并发/预算/限制)/404/409(不可操作)。
