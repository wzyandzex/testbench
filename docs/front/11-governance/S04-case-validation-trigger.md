# S04 - Case Validation 触发 + 列表

## Slice 基本信息

| 字段 | 内容 |
|---|---|
| Slice ID | S04 |
| 名称 | Case Validation 触发 + Job 列表 |
| 所属主线 | benchmark |
| 所属模块 | benchmark case governance |
| 优先级 | P0 |
| 前置依赖 | S01, S02 |
| 当前状态 | 已完成 |

## 0. 目标

用户可以在 Case 治理 Drawer 中触发验证 Job、查看验证 Job 列表、预览验证范围、并通过轮询机制跟踪长任务执行进度。

## 1. 为什么先做这个 Slice

1. Validation 是治理流水线的核心动态验证环节，S02 只展示了聚合状态，S04 补充完整的触发和 Job 管理能力。
2. 这是第一个涉及写操作（trigger）和长任务轮询的 slice，建立的 polling 模式可被 S06(review) 和 S12(LLM quality) 复用。
3. Preview 和 Capabilities 让用户在触发前了解哪些 case 可以验证。

## 2. 后端调研记录

### 2.1 读取的后端代码

| 文件 | 结论 |
|---|---|
| `router.go` L627-642 | 8 个 validation 路由，trigger 用 canWrite，其余 canRead |
| `benchmark_handler.go` L1607 | `TriggerCaseValidationRequest`: case_keys/repeat_runs/idempotency_key/trigger_source |
| `benchmark_handler.go` L1641-1675 | `TriggerCaseValidationJob`: POST → 202 Accepted, 返回 {job_id, status, created_at} |
| `benchmark_handler.go` L1677-1700 | `ListCaseValidationJobs`: query status+page/page_size, `SuccessPageResponse` |
| `benchmark_handler.go` L1739-1762 | `GetLatestCaseValidationSummary`: 无参数, `SuccessResponse` |
| `benchmark_handler.go` L1765-1795 | `GetCaseValidationCapabilities`: 无参数, `SuccessResponse` |
| `benchmark_handler.go` L1797-1820 | `PreviewCaseValidation`: 可选 body {case_keys}, `SuccessResponse` |
| `benchmark_handler.go` L1822-1867 | `ListCaseValidationCaseReports`: query job_id/outcome/flaky/matched + 分页, `SuccessPageResponse` |
| `benchmark_handler.go` L1869-1900 | `ListCaseValidationHistory`: path :caseKey + 分页, `SuccessPageResponse` |
| `benchmark_handler.go` L1707-1737 | `ListCaseValidationEvidence`: path :caseKey + query job_id/outcome + 分页 |
| `case_validation.go` L76-94 | `BenchmarkCaseValidationJob`: id/benchmark_id/status/error_message/started_at/completed_at/created_at 等 |
| `case_validation.go` L15-24 | `BenchmarkCaseValidationJobStatus` 枚举: pending/processing/completed/failed/cancelled; 别名 running=[pending,processing], terminal=[completed,failed,cancelled] |
| `case_validation.go` L25-32 | `BenchmarkCaseValidationExpectedOutcome`: unknown/pass/fail |
| `case_validation.go` L33-41 | `BenchmarkCaseValidationObservedOutcome`: pass/fail/error/unsupported |
| `case_validation.go` L42-48 | `BenchmarkCaseValidationAuthorityStatus`: authoritative/degraded/mixed |
| `case_validation.go` L124-161 | `BenchmarkCaseValidationSummary`: job_id + 15 个统计字段 + authority_status |
| `case_validation.go` L163-197 | `BenchmarkCaseValidationCaseReport`: 30+ 字段，单 case 粒度聚合 |
| `case_validation_contract.go` L14-22 | `CaseValidationCapabilitiesView`: benchmark_id + manifest |
| `case_validation_contract.go` L24-33 | `CaseValidationPreview`: total/supported/unsupported + cases 数组 |
| `case_validation_contract.go` L34-68 | `CaseValidationPreviewCase`: 30+ 字段含 supported/adapter/expected_outcome 等 |
| `capability.go` L24-70 | `PlatformCapabilityManifest`: supported_contracts/runtime_bundles/unsupported_reasons |
| `case_validation.go` L698 | 默认配置: RepeatRuns=1, MaxCasesPerJob=200 |
| `handler.go` L3717+ | 错误映射: 403(disabled)/501(repo required)/503(executor/queue unavailable)/400(invalid/too many/no cases) |

### 2.2 读取的辅助文档

无相关文档。

### 2.3 代码与文档一致性判断

1. 所有信息从代码直接确认。无辅助文档。
2. 本 slice 以 `case_validation.go`(domain)、`case_validation.go`(app)、`case_validation_contract.go`(app)、`benchmark_handler.go`(handler) 为准绳。

### 2.4 关键业务结论

1. **Trigger 需要写权限**: `canWrite`，不是 canRead。前端必须检查权限或优雅处理 403。
2. **HTTP 202**: Trigger 成功返回 202 Accepted（非 200），body 是 `{job_id, status, created_at}`。
3. **长任务轮询**: Job 状态机 `pending → processing → completed/failed/cancelled`。前端应轮询 Job 列表或 summary 检测完成。
4. **幂等性**: `idempotency_key` 防重复触发。相同 key 返回已有 Job。
5. **Preview**: 可选传 `case_keys`。无 body 时预览全部 case。返回每个 case 的 supported 状态。
6. **Capabilities**: 返回平台能力清单（支持的语言、contract family、adapter 等）。前端可用来展示"系统支持什么验证"。
7. **Summary**: 基于 latest job 的聚合统计，包含 authority_status。
8. **错误码丰富**: 403(功能禁用) / 501(仓库未配置) / 503(执行器/队列不可用) / 400(无效请求)。前端需区分展示。
9. **状态别名**: 查询时可用 `running` 筛选 [pending, processing]，`terminal` 筛选终态。

## 3. API 合同

### 3.1 接口列表

| 方法 | 路径 | 用途 | 权限 |
|---|---|---|---|
| POST | `/api/v1/benchmarks/:id/cases/validate` | 触发验证 Job | canWrite |
| GET | `/api/v1/benchmarks/:id/cases/validation-jobs` | Job 列表 | canRead |
| GET | `/api/v1/benchmarks/:id/cases/validation/capabilities` | 能力清单 | canRead |
| POST | `/api/v1/benchmarks/:id/cases/validation/preview` | 预览验证范围 | canRead |

本 slice 只消费这 4 个。Summary / CaseReports / Evidence / History 留给 S05。

### 3.2 请求参数

**Trigger Validation**:
- path: `id`(benchmark ID)
- body: `{ case_keys?: string[], repeat_runs?: number, idempotency_key?: string, trigger_source?: string }`
- headers: Authorization, X-Org-ID

**List Validation Jobs**:
- path: `id`
- query: `page`(默认 1), `page_size`(默认 20), `status`(可选: pending/processing/completed/failed/cancelled/running/terminal)
- headers: Authorization, X-Org-ID

**Get Capabilities**:
- path: `id`
- headers: Authorization, X-Org-ID

**Preview Validation**:
- path: `id`
- body(可选): `{ case_keys?: string[] }`
- headers: Authorization, X-Org-ID

### 3.3 响应结构

**Trigger** (HTTP 202):
```json
{
  "code": 0,
  "message": "accepted",
  "data": {
    "job_id": "jv_001",
    "status": "pending",
    "created_at": "2026-04-13T10:00:00Z"
  }
}
```

**List Jobs** (`SuccessPageResponse`):
```json
{
  "code": 0,
  "data": {
    "total": 5,
    "page": 1,
    "size": 20,
    "data": [
      {
        "id": "jv_001",
        "benchmark_id": "bm_001",
        "organization_id": "org_001",
        "created_by": "user_001",
        "status": "completed",
        "request_payload": null,
        "error_message": "",
        "idempotency_key": "",
        "started_at": "2026-04-13T10:00:01Z",
        "completed_at": "2026-04-13T10:05:30Z",
        "created_at": "2026-04-13T10:00:00Z",
        "updated_at": "2026-04-13T10:05:30Z"
      }
    ]
  }
}
```

**Capabilities** (`SuccessResponse`):
```json
{
  "code": 0,
  "data": {
    "benchmark_id": "bm_001",
    "organization_id": "org_001",
    "manifest": {
      "manifest_version": "v1",
      "supported_contracts": [
        { "contract_family": "framework_selector", "languages": ["python", "go", "javascript", "java"] }
      ],
      "unsupported_reasons": [
        { "code": "no_selector_match", "category": "selector_contract", "description": "No matching test selector" }
      ]
    }
  }
}
```

**Preview** (`SuccessResponse`):
```json
{
  "code": 0,
  "data": {
    "benchmark_id": "bm_001",
    "total_cases": 50,
    "supported_cases": 45,
    "unsupported_cases": 5,
    "cases": [
      {
        "case_key": "test_add",
        "case_name": "Test Add",
        "supported": true,
        "adapter_name": "pytest_selector",
        "expected_outcome": "pass",
        "unsupported_reason_code": "",
        "unsupported_reason_description": ""
      }
    ]
  }
}
```

### 3.4 错误与边界

1. 未登录 → 401
2. 无组织上下文 → 400
3. 不可见 → 404001
4. 功能禁用 → 403 "case validation is disabled"
5. 仓库未配置 → 501
6. 执行器/队列不可用 → 503
7. 无 case 被选中 → 400 "no cases selected"
8. case 数超限 → 400 "too many cases"（默认上限 200）
9. 幂等 → 同 idempotency_key 返回已有 job（非错误）
10. 空数据 → jobs 为空数组
11. running Job → status=processing 时 error_message 可能为中间错误

## 4. 前端现状调研

### 4.1 现有入口

| 项目 | 结论 |
|---|---|
| 路由挂载位置 | S02 Drawer 已在 BenchmarkDetailPage 内 |
| 现有导航入口 | S02 Drawer 五大支柱摘要有 validation 行，S03 检测 Collapse 已在底部 |
| 现有页面是否可扩展 | 是，在 Drawer 中新增 Validation Collapse 面板（与 S03 检测面板并列） |

### 4.2 可复用代码

| 类型 | 文件 | 复用方式 |
|---|---|---|
| type | `src/types/api/benchmark.ts` | S03 已定义的 STATIC_AUTHORITY_STATUS_CONFIG 等 |
| service | `src/services/benchmark.ts` | 新增 trigger/listJobs/capabilities/preview |
| pattern | `BenchmarkDetailPage.tsx` | S03 的 Collapse + lazy load + Table 分页模式 |
| pattern | S03 fetchDetections | Promise.allSettled 并行请求 + lazy load 模式 |

### 4.3 当前缺口

1. 无 validation 相关类型定义。
2. 无 validation 相关 service 方法。
3. 无长任务轮询机制（本次需新建）。
4. Drawer 中 validation 只有 Descriptions 简要状态，需扩展为完整触发+Job 管理。

## 5. 页面设计

### 5.1 页面位置

- 嵌入 S02 Drawer 中，在 Detection Collapse 面板之后新增"验证管理" Collapse 面板
- 与 S03 Detection Collapse 并列

### 5.2 页面结构

1. **Collapse 面板标题**: "验证管理 (N 个 Job)" — N 为 job total

2. **触发区域**（面板顶部）:
   - Modal 触发按钮 "触发验证"
   - Modal 内容:
     - Preview 展示: 总数 / 支持 / 不支持
     - 可选 case_keys（暂不提供选择器，默认全部）
     - repeat_runs 输入（默认 1）
     - idempotency_key（自动生成，不暴露给用户）
     - 确认按钮 → 调用 trigger API
   - 触发成功后显示成功提示 + 关闭 Modal + 自动刷新 Job 列表

3. **Job 列表 Table**:
   - `status` — Tag（pending=蓝/processing=蓝动画/completed=绿/failed=红/cancelled=灰）
   - `created_by` — 文本
   - `error_message` — 仅 failed 时展示
   - `started_at` — 日期
   - `completed_at` — 日期
   - `created_at` — 日期
   - 分页

4. **轮询机制**:
   - Job 列表中有 status 为 pending 或 processing 的 Job 时，每 5 秒自动轮询 `ListValidationJobs`
   - 全部 Job 到达终态时停止轮询
   - 组件卸载（Drawer 关闭）时清除定时器

5. **Capabilities 展示**（简洁）:
   - 面板展开时调用 capabilities API
   - 如果返回 403 或 503，面板顶部显示 Alert："验证功能未启用"或"服务暂不可用"
   - 正常时不在面板内显式展示 capabilities，仅在触发 Modal 中间接使用 preview

### 5.3 交互流

1. 用户展开"验证管理" Collapse → 首次展开时加载 Job 列表 + capabilities
2. 若 capabilities 返回 403/503 → 显示 Alert，禁用"触发验证"按钮
3. 点击"触发验证" → 打开 Modal → 自动调用 preview 展示范围
4. 确认触发 → 调用 POST /validate → 202 返回 → 成功提示 + 关闭 Modal
5. Job 列表自动刷新 → 若有 running Job 则启动 5s 轮询
6. Job 完成后轮询停止，列表刷新显示最终状态
7. 点击 Job 行 → 提示"报告详情将在 S05 实现"
8. API 错误 → message.error，特殊处理 403/503/501

## 6. 数据与状态设计

### 6.1 页面状态

1. loading — Job 列表加载中
2. refreshing — 轮询刷新中
3. triggering — 触发验证中（Modal 内按钮 loading）
4. previewing — 预览加载中（Modal 内）
5. empty — total === 0
6. error — API 返回非 0
7. polling — 有 running Job 时的轮询状态
8. disabled — capabilities 返回 403/503

### 6.2 字段映射

| 后端字段 | 前端展示 | 备注 |
|---|---|---|
| Job.`status` | Tag | pending=蓝/processing=蓝/completed=绿/failed=红/cancelled=灰 |
| Job.`created_by` | 文本 | 触发者 |
| Job.`error_message` | 文本(红) | 仅 failed/cancelled 时展示 |
| Job.`started_at` | 日期 | dayjs 格式化 |
| Job.`completed_at` | 日期 | dayjs 格式化 |
| Job.`created_at` | 日期 | dayjs 格式化 |
| Preview.`total_cases` | Statistic | 总数 |
| Preview.`supported_cases` | Statistic(绿) | 支持数 |
| Preview.`unsupported_cases` | Statistic(红) | 不支持数 |
| Trigger Response.`job_id` | 成功提示 | "验证已触发: {job_id}" |
| Capabilities 禁用 | Alert | "验证功能未启用" 或 "服务暂不可用" |

### 6.3 长任务机制

1. 触发返回 202 后，启动轮询定时器
2. 轮询间隔: 5 秒
3. 轮询方法: `GET /:id/cases/validation-jobs?page=1&page_size=20`
4. 停止条件: 所有 Job 的 status 都属于 terminal（completed/failed/cancelled）
5. 清理: Drawer 关闭或组件卸载时 `clearInterval`
6. 防止重复轮询: 轮询已在运行时不重复启动

## 7. 文件变更范围

| 文件 | 动作 | 原因 |
|---|---|---|
| `src/types/api/benchmark.ts` | 修改 | 新增 validation Job/Preview/Capabilities 类型 + 枚举配置 |
| `src/services/benchmark.ts` | 修改 | 新增 triggerCaseValidation + listValidationJobs + getValidationCapabilities + previewValidation |
| `src/pages/benchmarks/BenchmarkDetailPage.tsx` | 修改 | 新增 Validation Collapse 面板 + 触发 Modal + Job 列表 + 轮询 |

## 8. 验收标准

- [ ] S02 Drawer 中新增"验证管理" Collapse 面板
- [ ] 展开后加载 Job 列表（分页）
- [ ] Job status 用 Tag 展示，颜色正确
- [ ] "触发验证"按钮打开 Modal，Modal 内展示 Preview 统计
- [ ] 确认触发后调用 API，成功后关闭 Modal + 刷新列表
- [ ] 触发失败时正确展示错误（403/503/501/400）
- [ ] 有 running Job 时自动轮询（5s 间隔）
- [ ] 全部 Job 终态时停止轮询
- [ ] Drawer 关闭时清理轮询定时器
- [ ] loading / empty / error / disabled 状态完整
- [ ] `npm run type-check` 通过
- [ ] `npm run build` 通过

## 9. 明确不做什么

1. 本 slice 不做 Validation Summary 展示（S05）。
2. 本 slice 不做 Case-level 报告详情（S05）。
3. 本 slice 不做 Evidence 查看（S05）。
4. 本 slice 不做 Validation History（S05）。
5. 本 slice 不做 case_keys 多选器（默认验证全部 case）。
6. 本 slice 不做 Capabilities 的详细展示（只在触发失败时展示原因）。

## 10. 留给下一 Slice 的上下文

| 项目 | 内容 |
|---|---|
| 新增 service 方法 | `triggerCaseValidation`, `listValidationJobs`, `getValidationCapabilities`, `previewValidation` |
| 新增/修改 store | 无，状态在 BenchmarkDetailPage 组件内管理 |
| 新增路由 | 无，Collapse 面板嵌入 Drawer |
| 新增类型 | `ValidationJobStatus`, `ValidationExpectedOutcome`, `ValidationObservedOutcome`, `ValidationAuthorityStatus`, `VALIDATION_JOB_STATUS_CONFIG`, `VALIDATION_OBSERVED_OUTCOME_CONFIG`, `BenchmarkCaseValidationJob`, `TriggerValidationResponse`, `CaseValidationPreview`, `CaseValidationPreviewCase`, `CaseValidationCapabilitiesView` |
| 可复用组件 | Trigger Modal + Preview Statistic + Job Table + 5s 轮询模式可被 S06(review) 和 S12(LLM quality) 复用 |
| 已知遗留问题 | 1. 幂等 key 由前端自动生成(ui-timestamp-random)，用户不可见; 2. Capabilities 只做可达性检查，不展示 manifest 详情; 3. Job 行点击提示"功能开发中"(S05 实现报告详情); 4. 轮询在 Drawer 关闭时清理，但不会在 Job 完成时通知用户(后续可加 notification) |

## 11. 实现记录

| 项目 | 内容 |
|---|---|
| 完成日期 | 2026-04-13 |
| 实际修改文件 | `src/types/api/benchmark.ts`, `src/services/benchmark.ts`, `src/pages/benchmarks/BenchmarkDetailPage.tsx` |
| 运行命令 | `npx tsc --noEmit` ✅, `npx vite build` ✅ |
| 遇到的问题 | 无 |
| 与原方案的差异 | 无实质性差异，3 个文件精确匹配 |

---

## 后端确认结论

1. 本 slice 消费的是 benchmark 治理主线中的 case validation trigger + job list + capabilities + preview 能力。
2. `BenchmarkCaseValidationJob` 和状态枚举从 `case_validation.go`(domain) 确认。Trigger 请求/响应从 `benchmark_handler.go` 确认。
3. 触发是写操作（canWrite），其余是读操作（canRead）。
4. Trigger 返回 HTTP 202（非 200），前端需注意 axios interceptor 可能不区分 200/202。
5. 长任务轮询是前端侧机制，后端不提供 WebSocket 推送（本次不依赖 Notifier 服务）。
