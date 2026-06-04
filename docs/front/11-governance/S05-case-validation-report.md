# S05 - Case Validation 报告

## Slice 基本信息

| 字段 | 内容 |
|---|---|
| Slice ID | S05 |
| 名称 | Case Validation 报告 |
| 所属主线 | benchmark |
| 所属模块 | benchmark case governance |
| 优先级 | P0 |
| 前置依赖 | S04 |
| 当前状态 | 已完成 |

## 0. 目标

用户可以在 Case 治理 Drawer 中查看验证报告：最新 Summary 统计、Case 级报告列表（含筛选）、单 Case 的 Evidence 详情、以及当前 Case 的验证历史。区分 authoritative 与 degraded。

## 1. 为什么先做这个 Slice

1. S04 实现了触发和 Job 管理，用户触发验证后需要查看结果。S05 补充完整的报告查看能力。
2. Summary → Case Reports → Evidence 是验证结果的三级下钻，是治理流水线验证环节的核心展示。
3. authoritative vs degraded 在 validation 领域有最丰富的语义（pass_rate / flaky / match_rate），需要在报告中完整落地。

## 2. 后端调研记录

### 2.1 读取的后端代码

| 文件 | 结论 |
|---|---|
| `benchmark_handler.go` L1739-1762 | `GetLatestCaseValidationSummary`: 无参数, `SuccessResponse`，返回单个 Summary |
| `benchmark_handler.go` L1822-1867 | `ListCaseValidationCaseReports`: query job_id/outcome/flaky/matched + 分页, `SuccessPageResponse`，响应头 `X-Case-Validation-Job-ID`  |
| `benchmark_handler.go` L1707-1737 | `ListCaseValidationEvidence`: path :caseKey + query job_id/outcome + 分页, `SuccessPageResponse` |
| `benchmark_handler.go` L1869-1900 | `ListCaseValidationHistory`: path :caseKey + 分页, `SuccessPageResponse` |
| `case_validation_query.go` L124-134 | CaseReports 的 job_id 自动解析: 空 job_id 时调 `FindLatestByBenchmarkIDInScope` 取最新 |
| `case_validation_query.go` L175-210 | 状态/结果过滤器规范化: running=[pending,processing], terminal=[completed,failed,cancelled] |
| `case_validation.go`(domain) L124-161 | `BenchmarkCaseValidationSummary`: job_id + 15 统计字段 + authority_status + degraded_reason |
| `case_validation.go`(domain) L163-197 | `BenchmarkCaseValidationCaseReport`: 30+ 字段，含 case_key/pass_rate/match_rate/flaky/aggregate_outcome/authority_status |
| `case_validation.go`(domain) L95-122 | `BenchmarkCaseExecutionEvidence`: per-attempt，含 observed_outcome/matched_expectation/output_text/error_message/exit_code/duration_ms |

### 2.2 读取的辅助文档

无相关文档。

### 2.3 代码与文档一致性判断

1. 所有信息从代码直接确认。
2. 本 slice 以 `case_validation.go`(domain) 和 `benchmark_handler.go`(handler) 为准绳。

### 2.4 关键业务结论

1. **Summary 不分页**: 单对象，基于最新 completed Job 的聚合统计。
2. **Case Reports 自动解析 job_id**: 不传 job_id 时自动取最新 Summary 的 job_id，响应头带 `X-Case-Validation-Job-ID`。
3. **Evidence 按 caseKey 作用域**: 查看单个 case 的每次执行尝试详情。
4. **History 按 caseKey 作用域**: 同一 case 跨多次验证 Job 的结果历史。
5. **CaseReport 核心字段**: `pass_rate`/`match_rate` 是 0-1 浮点数，`flaky` 是布尔值，`aggregate_outcome` 是最终判定。
6. **Evidence 核心字段**: `attempt`(第几次尝试), `observed_outcome`, `matched_expectation`(bool ptr), `output_text`, `error_message`, `exit_code`, `duration_ms`。
7. **authority_status**: authoritative/degraded/mixed，degraded 时有 `degraded_reason`。
8. **flaky 过滤**: query 参数 `flaky=true/false`，由 `parseOptionalQueryBool` 解析。
9. **outcome 过滤**: pass/fail/error/unsupported。

## 3. API 合同

### 3.1 接口列表

| 方法 | 路径 | 用途 | 权限 |
|---|---|---|---|
| GET | `/api/v1/benchmarks/:id/cases/validation/latest` | 最新验证 Summary | canRead |
| GET | `/api/v1/benchmarks/:id/cases/validation/cases` | Case 级报告（分页） | canRead |
| GET | `/api/v1/benchmarks/:id/cases/:caseKey/evidence` | 单 Case Evidence（分页） | canRead |
| GET | `/api/v1/benchmarks/:id/cases/:caseKey/validation-history` | 单 Case 验证历史（分页） | canRead |

### 3.2 请求参数

**Latest Summary**:
- path: `id`
- headers: Authorization, X-Org-ID

**Case Reports**:
- path: `id`
- query: `page`(默认 1), `page_size`(默认 20), `job_id`(可选), `outcome`(可选: pass/fail/error/unsupported), `flaky`(可选: true/false), `matched`(可选: true/false)
- headers: Authorization, X-Org-ID

**Evidence**:
- path: `id`, `caseKey`
- query: `page`(默认 1), `page_size`(默认 20), `job_id`(可选), `outcome`(可选)
- headers: Authorization, X-Org-ID

**Validation History**:
- path: `id`, `caseKey`
- query: `page`(默认 1), `page_size`(默认 20)
- headers: Authorization, X-Org-ID

### 3.3 响应结构

**Summary** (`SuccessResponse`):
```json
{
  "code": 0,
  "data": {
    "job_id": "jv_001",
    "total_cases": 50,
    "supported_cases": 45,
    "unsupported_cases": 5,
    "expected_pass_cases": 40,
    "expected_fail_cases": 10,
    "matched_cases": 42,
    "mismatched_cases": 3,
    "flaky_cases": 2,
    "error_cases": 1,
    "authority_status": "authoritative",
    "authoritative_cases": 43,
    "degraded_cases": 2,
    "degraded_reason": "",
    "generated_at": "2026-04-13T10:05:30Z"
  }
}
```

**Case Reports** (`SuccessPageResponse`):
```json
{
  "code": 0,
  "data": {
    "total": 50,
    "page": 1,
    "size": 20,
    "data": [{
      "id": "cr_001",
      "job_id": "jv_001",
      "case_key": "test_add",
      "case_name": "Test Add",
      "expected_outcome": "pass",
      "aggregate_outcome": "pass",
      "aggregate_matched": true,
      "pass_rate": 1.0,
      "match_rate": 1.0,
      "attempt_count": 1,
      "pass_attempts": 1,
      "fail_attempts": 0,
      "error_attempts": 0,
      "unsupported_attempts": 0,
      "flaky": false,
      "authority_status": "authoritative",
      "degraded_reason": "",
      "aggregation_policy": "all_attempts",
      "created_at": "2026-04-13T10:05:30Z"
    }]
  }
}
```

**Evidence** (`SuccessPageResponse`):
```json
{
  "code": 0,
  "data": {
    "total": 3,
    "page": 1,
    "size": 20,
    "data": [{
      "id": "ev_001",
      "job_id": "jv_001",
      "case_key": "test_add",
      "attempt": 1,
      "adapter_name": "pytest_selector",
      "expected_outcome": "pass",
      "observed_outcome": "pass",
      "matched_expectation": true,
      "output_text": "...\n1 passed",
      "error_message": "",
      "exit_code": 0,
      "duration_ms": 1200,
      "created_at": "2026-04-13T10:03:00Z"
    }]
  }
}
```

**History** (`SuccessPageResponse`):
同 Case Reports 结构，但按 caseKey 作用域。

### 3.4 错误与边界

1. Summary 不存在 → 404 "case validation summary not found"（从未执行过验证）
2. Case Reports 无匹配 → 空数组
3. Evidence 无匹配 → 空数组
4. History 无匹配 → 空数组
5. 功能禁用 → 403
6. 仓库未配置 → 501
7. 无效参数 → 400

## 4. 前端现状调研

### 4.1 现有入口

| 项目 | 结论 |
|---|---|
| 现有导航入口 | S04 Validation Collapse 中 Job 列表已展示，点击 Job 行目前提示"功能开发中" |
| 现有页面是否可扩展 | 是，将 Job 行点击改为打开报告 Modal |

### 4.2 可复用代码

| 类型 | 文件 | 复用方式 |
|---|---|---|
| type | `benchmark.ts` | S04 已定义的 ValidationJobStatus/ValidationObservedOutcome 等枚举和配置 |
| service | `benchmark.ts` | 新增 4 个报告查询方法 |
| pattern | S03 Detection | 可展开行 + Table 分页模式 |
| pattern | S04 Trigger Modal | Modal 模式 |

### 4.3 当前缺口

1. 无 Summary/CaseReport/Evidence/History 类型定义。
2. 无报告查询 service 方法。
3. Job 行点击无报告详情展示。

## 5. 页面设计

### 5.1 页面位置

- **报告 Modal**: 在 S04 Validation Collapse 中，点击 completed 状态的 Job 行 → 打开报告 Modal
- **验证历史**: 在同一 Modal 内，case report 展开行中包含"验证历史"链接

### 5.2 页面结构

**报告 Modal**（宽度 900px）:

1. **Summary 统计卡**（顶部）:
   - AntRow + Statistic: 总用例 / 匹配 / 不匹配 / Flaky / 错误 / 不支持
   - authority_status Tag（复用 STATIC_AUTHORITY_STATUS_CONFIG）
   - degraded_reason 展示（degraded 时）
   - generated_at 时间

2. **Case Reports Table**（主体）:
   - 列: case_key / case_name / expected_outcome / aggregate_outcome / pass_rate / match_rate / flaky / authority_status / created_at
   - outcome 用 Tag 展示（复用 VALIDATION_OBSERVED_OUTCOME_CONFIG）
   - pass_rate 用百分比展示
   - flaky 用黄色 Tag
   - authority_status 非 authoritative 的行标黄
   - 分页
   - 顶部 Select 筛选器: outcome / flaky

3. **展开行 Evidence Table**（点击某行展开）:
   - 列: attempt / adapter_name / expected / observed / matched / exit_code / duration_ms / created_at
   - observed_outcome 用 Tag
   - matched_expectation 用 Yes/No Tag
   - output_text 和 error_message 用可折叠文本展示（前 200 字符 + 展开更多）

### 5.3 交互流

1. 用户点击 S04 Job 列表中 completed Job 行 → 打开报告 Modal
2. Modal 加载: 并行调用 `getLatestValidationSummary` + `listValidationCaseReports`
3. Summary 统计卡展示在 Modal 顶部
4. Case Reports 表格展示，可按 outcome/flaky 筛选
5. 点击某行展开 → 调用 `listValidationEvidence` 展示该 case 的 evidence
6. authority_status 为 degraded 的行标黄
7. API 错误 → message.error
8. Summary 不存在（404）→ Modal 中显示"暂无验证报告"

## 6. 数据与状态设计

### 6.1 页面状态

1. loading — 报告加载中
2. empty — Summary 不存在（从未验证过）
3. error — API 返回非 0
4. degraded — 行级别标黄

### 6.2 字段映射

**Summary**:
| 后端字段 | 前端展示 | 备注 |
|---|---|---|
| `total_cases` | Statistic | 总用例 |
| `matched_cases` | Statistic(绿) | 匹配 |
| `mismatched_cases` | Statistic(红) | 不匹配 |
| `flaky_cases` | Statistic(黄) | Flaky |
| `error_cases` | Statistic(红) | 错误 |
| `authority_status` | Tag | 复用 STATIC_AUTHORITY_STATUS_CONFIG |
| `degraded_reason` | 文本(黄) | authority 非 authoritative 时展示 |
| `generated_at` | 文本 | dayjs 格式化 |

**Case Report**:
| 后端字段 | 前端展示 | 备注 |
|---|---|---|
| `case_key` | 文本 | 标识 |
| `case_name` | 文本 | 可空 |
| `expected_outcome` | Tag | unknown/pass/fail |
| `aggregate_outcome` | Tag | 复用 VALIDATION_OBSERVED_OUTCOME_CONFIG |
| `pass_rate` | 百分比 | 0-1 转 XX% |
| `match_rate` | 百分比 | 0-1 转 XX% |
| `flaky` | Tag(黄) | true 时展示 |
| `authority_status` | Tag + 行背景 | 复用 STATIC_AUTHORITY_STATUS_CONFIG |
| `degraded_reason` | 文本(黄) | degraded 时展示 |
| `attempt_count` | 数字 | 总尝试次数 |

**Evidence**:
| 后端字段 | 前端展示 | 备注 |
|---|---|---|
| `attempt` | 数字 | 第 N 次尝试 |
| `adapter_name` | 文本 | 适配器 |
| `observed_outcome` | Tag | 复用 VALIDATION_OBSERVED_OUTCOME_CONFIG |
| `matched_expectation` | Tag | true=绿 / false=红 / null=灰 |
| `exit_code` | 数字 | 0=正常 |
| `duration_ms` | 文本 | Xms / Xs |
| `output_text` | 可折叠文本 | 前 200 字符 + 展开 |
| `error_message` | 可折叠文本(红) | |

### 6.3 长任务机制

不适用。全部同步读。

## 7. 文件变更范围

| 文件 | 动作 | 原因 |
|---|---|---|
| `src/types/api/benchmark.ts` | 修改 | 新增 Summary/CaseReport/Evidence 类型 |
| `src/services/benchmark.ts` | 修改 | 新增 4 个报告查询方法 |
| `src/pages/benchmarks/BenchmarkDetailPage.tsx` | 修改 | 新增报告 Modal + Job 行点击改为打开报告 |

## 8. 验收标准

- [ ] 点击 completed Job 行打开报告 Modal
- [ ] Modal 顶部展示 Summary 统计卡（total/matched/mismatched/flaky/error）
- [ ] Summary 的 authority_status 用 Tag 展示，degraded 时显示 reason
- [ ] Case Reports 表格展示（分页）
- [ ] aggregate_outcome / expected_outcome 用 Tag 展示
- [ ] pass_rate / match_rate 用百分比展示
- [ ] flaky 行标记黄色
- [ ] authority_status 非 authoritative 行标黄
- [ ] 展开行显示 Evidence 表格（attempt/observed/matched/duration/output）
- [ ] output_text / error_message 长文本可折叠
- [ ] Summary 不存在时显示"暂无验证报告"
- [ ] loading / error 状态完整
- [ ] `npm run type-check` 通过
- [ ] `npm run build` 通过

## 9. 明确不做什么

1. 本 slice 不做 validation-history 完整页面（用 Case Reports 的展开行替代）。
2. 本 slice 不做 evidence 的 command_json 展示（太技术化，后续按需加）。
3. 本 slice 不做 Case Reports 的 matched 筛选器（只做 outcome 和 flaky 筛选）。
4. 本 slice 不做报告的导出/下载功能。

## 10. 留给下一 Slice 的上下文

| 项目 | 内容 |
|---|---|
| 新增 service 方法 | `getLatestValidationSummary`, `listValidationCaseReports`, `listValidationEvidence`, `listValidationHistory` |
| 新增/修改 store | 无，状态在 BenchmarkDetailPage 组件内管理 |
| 新增路由 | 无，Modal 嵌入 Drawer |
| 新增类型 | `BenchmarkCaseValidationSummary`, `BenchmarkCaseValidationCaseReport`, `BenchmarkCaseExecutionEvidence` |
| 可复用组件 | TruncatedText（截断折叠文本）可被 S06/S07 复用; Report Modal 的 Summary + CaseReports + Evidence 三级下钻模式可被 S06(review report) 和 S13(LLM quality report) 复用 |
| 已知遗留问题 | 1. listValidationHistory service 方法已添加但未在 UI 中消费; 2. evidence 的 command_json 未展示; 3. Case Reports 的 matched 筛选器未实现; 4. degraded 行标黄用 CSS class `ant-table-row-warning`，需要全局样式配合 |

## 11. 实现记录

| 项目 | 内容 |
|---|---|
| 完成日期 | 2026-04-13 |
| 实际修改文件 | `src/types/api/benchmark.ts`, `src/services/benchmark.ts`, `src/pages/benchmarks/BenchmarkDetailPage.tsx` |
| 运行命令 | `npx tsc --noEmit` ✅, `npx vite build` ✅ |
| 遇到的问题 | 1. `Tooltip` import 未使用，删除; 2. Case Reports Table 有两个 `expandable` 属性导致 JSX 错误，合并为一个 |
| 与原方案的差异 | 无实质性差异，3 个文件精确匹配 |

---

## 后端确认结论

1. 本 slice 消费 4 个 validation 报告查询端点，全部只读（canRead）。
2. Case Reports 的 `job_id` 自动解析是关键便利特性，不传 job_id 时取最新 Summary 的 job_id。
3. `pass_rate`/`match_rate` 是 0-1 浮点数（非百分比），前端需 ×100 展示。
4. `matched_expectation` 是 `*bool`（可为 null），null 表示无法判定。
5. `output_text` 可能非常长（完整的测试输出），前端需截断展示。
