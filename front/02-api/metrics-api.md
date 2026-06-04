# 指标分析接口

## 基础信息

| 项目 | 值 |
|------|------|
| 基础路径 | `/api/v1/metrics` |
| 需要认证 | 是 |
| 内容类型 | `application/json` |

## 错误码

| 错误码 | 说明 |
|--------|------|
| 404001 | 指标不存在 |

---

## 接口列表

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/metrics` | 获取指标记录列表 |
| GET | `/metrics/execution/:id` | 获取执行指标 |
| GET | `/metrics/comparison` | 对比指标 |
| GET | `/metrics/ranking` | 获取指标排名 |
| GET | `/metrics/report/:id` | 获取指标报告 |
| POST | `/metrics/aggregated` | 创建聚合指标 |

---

## 1. 获取指标记录列表

### 请求

```http
GET /api/v1/metrics?benchmark_id=bm_001&agent_id=agent_001&language=python&min_score=0.5&max_score=1.0&page=1&page_size=20
Authorization: Bearer {access_token}
```

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| benchmark_id | string | - | 评测任务 ID 筛选 |
| agent_id | string | - | Agent ID 筛选 |
| language | string | - | 语言筛选 |
| benchmark_type | string | - | 评测任务类型筛选 |
| min_score | number | - | 最小分数筛选 |
| max_score | number | - | 最大分数筛选 |
| created_after | string | - | 创建时间之后（ISO 8601） |
| created_before | string | - | 创建时间之前（ISO 8601） |
| page | int | 1 | 页码 |
| page_size | int | 20 | 每页数量（最大1000） |

### 响应

```typescript
interface PaginatedResponse {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    data: MetricsRecord[];
  };
}

interface MetricsRecord {
  id: string;
  execution_id: string;
  benchmark_id: string;
  agent_id: string;
  // 功能指标
  test_pass_rate: number;
  test_coverage: number;
  test_case_count: number;
  requirement_met: boolean;
  constraint_met: boolean;
  success_criteria: number;
  regression_test: boolean;
  // 效率指标
  total_duration: number;      // 毫秒
  execution_time: number;      // 毫秒
  planning_time: number;       // 毫秒
  correction_time: number;     // 毫秒
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  tokens_per_step: number;
  total_steps: number;
  efficient_steps: number;
  efficiency_rate: number;
  memory_usage_mb: number;
  cpu_usage_percent: number;
  // 质量指标
  code_style_score: number;
  code_complexity: number;
  code_smell_count: number;
  violation_count: number;
  security_score: number;
  vulnerability_count: number;
  maintainability_index: number;
  tech_debt_ratio: number;
  documentation_score: number;
  comment_coverage: number;
  // 稳定性指标
  success_rate: number;
  timeout_rate: number;
  error_rate: number;
  crash_rate: number;
  self_correction_count: number;
  self_correction_rate: number;
  retry_count: number;
  retry_success_count: number;
  consistency_score: number;
  // 推理指标
  reasoning_depth: number;
  planning_steps: number;
  backtracking_count: number;
  tool_call_count: number;
  tool_success_rate: number;
  unique_tool_count: number;
  context_usage: number;
  few_shot_count: number;
  improvement_rate: number;
  // 综合评分
  score: number;
  func_score: number;
  eff_score: number;
  qual_score: number;
  stab_score: number;
  reas_score: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
}
```

---

## 2. 获取执行指标

### 请求

```http
GET /api/v1/metrics/execution/:id
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface ExecutionMetricsResponse {
  code: number;
  message: string;
  data: MetricsRecord;
}
```

**错误响应：**

| 错误码 | 说明 |
|--------|------|
| 404001 | 指标不存在 |

---

## 3. 对比指标

### 请求

```http
GET /api/v1/metrics/comparison?reference_id=exec_001&target_id=exec_002
Authorization: Bearer {access_token}
```

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| reference_id | string | 参考执行 ID（必填） |
| target_id | string | 目标执行 ID（必填） |

### 响应

```typescript
interface MetricsComparisonResponse {
  code: number;
  message: string;
  data: MetricsComparison;
}

interface MetricsComparison {
  reference: MetricsRecord;
  target: MetricsRecord;
  diff: MetricsDiff;
}

interface MetricsDiff {
  score: number;       // 综合评分差异
  func_score: number;   // 功能评分差异
  eff_score: number;    // 效率评分差异
  qual_score: number;   // 质量评分差异
  stab_score: number;   // 稳定性评分差异
  reas_score: number;   // 推理评分差异
}
```

---

## 4. 获取指标排名

### 请求

```http
GET /api/v1/metrics/ranking?benchmark_id=bm_001&language=python
Authorization: Bearer {access_token}
```

**查询参数：**

| 参数 | 类型 | 说明 |
|------|------|------|
| benchmark_id | string | 评测任务 ID 筛选 |
| agent_id | string | Agent ID 筛选 |
| language | string | 语言筛选 |
| benchmark_type | string | 评测任务类型筛选 |

### 响应

```typescript
interface MetricsRankingResponse {
  code: number;
  message: string;
  data: MetricsRanking[];
}

interface MetricsRanking {
  rank: number;
  agent_id: string;
  avg_score: number;
  total_count: number;
  success_count: number;
}
```

---

## 5. 获取指标报告

### 请求

```http
GET /api/v1/metrics/report/:id
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface MetricsReportResponse {
  code: number;
  message: string;
  data: MetricsReport;
}

interface MetricsReport {
  execution_id: string;
  benchmark_id: string;
  agent_id: string;
  metrics: MetricsRecord;
  comparison?: MetricsComparison;
  analysis: AnalysisResult;
  recommendations: string[];
  generated_at: string;
}

interface AnalysisResult {
  strengths: string[];
  weaknesses: string[];
  diagnostics: Diagnostic[];
  improvements: string[];
  overall: string;
}

interface Diagnostic {
  category: string;
  issue: string;
  severity: string;
  suggestion: string;
}
```

---

## 6. 创建聚合指标

### 请求

```http
POST /api/v1/metrics/aggregated?period=daily&start_date=2024-01-01T00:00:00Z&end_date=2024-01-31T23:59:59Z
Authorization: Bearer {access_token}
```

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| period | string | daily | 聚合周期（daily/weekly/monthly） |
| start_date | string | 今天 | 开始日期（ISO 8601） |
| end_date | string | 现在 | 结束日期（ISO 8601） |

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "aggregated metrics created successfully"
  }
}
```

---

## TypeScript 类型定义

```typescript
// src/types/api/metrics.ts

export interface MetricsRecord {
  id: string;
  execution_id: string;
  benchmark_id: string;
  agent_id: string;
  // 功能指标
  test_pass_rate: number;
  test_coverage: number;
  test_case_count: number;
  requirement_met: boolean;
  constraint_met: boolean;
  success_criteria: number;
  regression_test: boolean;
  // 效率指标
  total_duration: number;
  execution_time: number;
  planning_time: number;
  correction_time: number;
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
  tokens_per_step: number;
  total_steps: number;
  efficient_steps: number;
  efficiency_rate: number;
  memory_usage_mb: number;
  cpu_usage_percent: number;
  // 质量指标
  code_style_score: number;
  code_complexity: number;
  code_smell_count: number;
  violation_count: number;
  security_score: number;
  vulnerability_count: number;
  maintainability_index: number;
  tech_debt_ratio: number;
  documentation_score: number;
  comment_coverage: number;
  // 稳定性指标
  success_rate: number;
  timeout_rate: number;
  error_rate: number;
  crash_rate: number;
  self_correction_count: number;
  self_correction_rate: number;
  retry_count: number;
  retry_success_count: number;
  consistency_score: number;
  // 推理指标
  reasoning_depth: number;
  planning_steps: number;
  backtracking_count: number;
  tool_call_count: number;
  tool_success_rate: number;
  unique_tool_count: number;
  context_usage: number;
  few_shot_count: number;
  improvement_rate: number;
  // 综合评分
  score: number;
  func_score: number;
  eff_score: number;
  qual_score: number;
  stab_score: number;
  reas_score: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface MetricsFilter {
  execution_id?: string;
  benchmark_id?: string;
  agent_id?: string;
  language?: string;
  benchmark_type?: string;
  min_score?: number;
  max_score?: number;
  created_after?: string;
  created_before?: string;
  page?: number;
  page_size?: number;
  order_by?: string;
  order_dir?: string;
}

export interface MetricsComparison {
  reference: MetricsRecord;
  target: MetricsRecord;
  diff: MetricsDiff;
}

export interface MetricsDiff {
  score: number;
  func_score: number;
  eff_score: number;
  qual_score: number;
  stab_score: number;
  reas_score: number;
}

export interface MetricsReport {
  execution_id: string;
  benchmark_id: string;
  agent_id: string;
  metrics: MetricsRecord;
  comparison?: MetricsComparison;
  analysis: AnalysisResult;
  recommendations: string[];
  generated_at: string;
}

export interface AnalysisResult {
  strengths: string[];
  weaknesses: string[];
  diagnostics: Diagnostic[];
  improvements: string[];
  overall: string;
}

export interface Diagnostic {
  category: string;
  issue: string;
  severity: string;
  suggestion: string;
}

export interface MetricsRanking {
  rank: number;
  agent_id: string;
  avg_score: number;
  total_count: number;
  success_count: number;
}

export interface MetricsAggregated {
  id: string;
  benchmark_id: string;
  agent_id: string;
  language: string;
  benchmark_type: string;
  period: string;
  start_date: string;
  end_date: string;
  sample_count: number;
  avg_score: number;
  avg_func_score: number;
  avg_eff_score: number;
  avg_qual_score: number;
  avg_stab_score: number;
  avg_reas_score: number;
  score_distribution: any;
  max_score: number;
  min_score: number;
  std_dev: number;
  trend: number;
  created_at: string;
  updated_at: string;
}

// 错误码
export const MetricsErrorCode = {
  NOT_FOUND: 404001,
} as const;
```
