# S07 - Case Fusion 报告

## Slice 基本信息

| 字段 | 内容 |
|---|---|
| Slice ID | S07 |
| 名称 | Case Fusion 报告 |
| 所属主线 | benchmark |
| 所属模块 | benchmark case governance |
| 优先级 | P0 |
| 前置依赖 | S05, S06 |
| 当前状态 | 已完成 |

## 0. 目标

用户可以在 Case 治理 Drawer 中查看证据融合报告：最新 Fusion Report 统计、Case 级融合判决（含三大支柱信号）、证据完整性和 insufficient_evidence 标记。

## 1. 为什么先做这个 Slice

1. Fusion 是治理流水线的最终汇聚点，将 detection + validation + review 三大支柱证据综合为统一判决。
2. S05(validation report) 和 S06(review report) 已实现各自支柱的展示，S07 补充最终的融合视图。
3. Fusion 是纯只读，无触发/轮询，实现复杂度低于 S04-S06。

## 2. 后端调研记录

### 2.1 读取的后端代码

| 文件 | 结论 |
|---|---|
| `router.go` L637,638,643 | 3 个 GET 路由: fusion/latest, fusion/cases, :caseKey/fusion-history。**无 POST/PUT** |
| `benchmark_handler.go` L2083-2107 | `GetLatestCaseFusionReport`: 无参数, `SuccessResponse`, canRead |
| `benchmark_handler.go` L2109-2152 | `ListCaseFusionCaseReports`: query report_id/decision/insufficient_evidence+分页, `SuccessPageResponse`, header `X-Case-Fusion-Report-ID` |
| `benchmark_handler.go` L2154-2181 | `ListCaseFusionHistory`: path :caseKey+分页, `SuccessPageResponse` |
| `case_fusion.go`(domain) L28-48 | `BenchmarkCaseFusionReport`: 16 字段含 total/pass/warn/block/insufficient/average_confidence + 三支柱外键 |
| `case_fusion.go`(domain) L50-92 | `BenchmarkCaseFusionCaseReport`: 40+ 字段含 final_decision/final_risk_level/final_score/confidence/evidence_completeness + 三支柱信号快照 |
| `case_fusion.go`(domain) L10-26 | 枚举: FusionDecision(pass/warn/block), FusionRiskLevel(critical/high/medium/low/info) |
| `evidencefusion/service.go` | 融合引擎: 三支柱证据收集 + 评分算法 + 决策优先级 + 风险推导 + 漂移状态 |
| `case_fusion_query.go` | 查询服务: report_id 自动解析 + decision 过滤 + insufficient_evidence 过滤 |

### 2.2 关键业务结论

1. **纯只读**: 没有 trigger 端点，fusion 由后端管道在 detection/validation/review 完成后自动计算。
2. **Decision 枚举**: pass/warn/block（同 review）。
3. **Risk 枚举**: critical/high/medium/low/info（同 review）。
4. **FinalScore**: 0-100 分（从 100 开始扣分）。
5. **EvidenceCompleteness**: 0-1 浮点数，< 0.40 标记 insufficient_evidence。
6. **三大支柱信号嵌入 Case Report**: static_decision/static_risk_level/static_issue_count + validation_outcome/validation_matched/validation_flaky + review_decision/review_risk/review_confidence。
7. **Filters**: report_id(可选,自动最新), decision, insufficient_evidence。
8. **DecisionTraceJSON**: 包含所有应用的规则和输入（调试用）。
9. **Summary**: 人类可读的融合解释文本。

## 3. API 合同

### 3.1 接口列表

| 方法 | 路径 | 用途 | 权限 |
|---|---|---|---|
| GET | `/api/v1/benchmarks/:id/cases/fusion/latest` | 最新融合报告 | canRead |
| GET | `/api/v1/benchmarks/:id/cases/fusion/cases` | Case 级融合报告 | canRead |
| GET | `/api/v1/benchmarks/:id/cases/:caseKey/fusion-history` | 单 Case 历史 | canRead |

### 3.2 请求参数

**Latest Report**: path `id`

**Case Reports**: query `report_id`(可选), `decision`(可选:pass/warn/block), `insufficient_evidence`(可选:bool), `page`, `page_size`

**History**: path `id`, `caseKey`; query `page`, `page_size`

### 3.3 响应结构

**Report** (`SuccessResponse`):
```json
{
  "code": 0,
  "data": {
    "id": "fr_001",
    "total_cases": 50,
    "pass_cases": 38,
    "warn_cases": 8,
    "block_cases": 2,
    "insufficient_cases": 2,
    "average_confidence": 0.82,
    "trigger_source": "ensure_latest",
    "generated_at": "2026-04-13T10:15:00Z"
  }
}
```

**Case Report** (核心字段):
```json
{
  "case_key": "test_add",
  "final_decision": "pass",
  "final_risk_level": "low",
  "final_score": 88.5,
  "confidence": 0.92,
  "evidence_completeness": 1.0,
  "insufficient_evidence": false,
  "static_decision": "allow",
  "static_risk_level": "low",
  "static_issue_count": 0,
  "validation_outcome": "pass",
  "validation_matched": true,
  "validation_flaky": false,
  "review_decision": "pass",
  "review_risk": "low",
  "review_confidence": 0.95,
  "drift_status": "stable",
  "summary": "All pillars agree: case passes.",
  "created_at": "2026-04-13T10:15:00Z"
}
```

### 3.4 错误与边界

1. Report 不存在 → 404（无 fusion 数据）
2. 功能不可用 → 501
3. 空数据 → 空数组

## 4. 页面设计

### 5.1 页面位置

- **Fusion Collapse**: S02 Drawer 内，在 Review Collapse 之后
- **Report 内容**: 展开即加载（同 S03 Detection 模式）

### 5.2 页面结构

**Fusion Collapse 面板**（懒加载，展开时请求）:

1. **Report 统计**（面板顶部）: AntRow + Statistic
   - 总用例 / 通过(绿) / 警告(黄) / 阻止(红) / 证据不足(灰)
   - 平均置信度
   - generated_at 时间

2. **筛选**: decision Select + insufficient_evidence Select

3. **Case Reports Table**（分页）:
   - case_key / final_decision / final_risk_level / final_score / confidence / evidence_completeness / insufficient_evidence / drift_status
   - decision/risk 用 Tag（复用 REVIEW_DECISION_CONFIG / REVIEW_RISK_CONFIG）
   - insufficient_evidence 行标灰
   - final_score 用数字+颜色（>=80绿 / >=60黄 / <60红）

4. **展开行**:
   - Summary 文本
   - 三大支柱信号表格:
     - Static: decision / risk / issue_count
     - Validation: outcome / matched / flaky
     - Review: decision / risk / confidence

### 5.3 交互流

1. 展开 Fusion Collapse → 并行加载 Report + Case Reports
2. Report 不存在（404）→ 显示"暂无融合数据"
3. 筛选 decision / insufficient_evidence → 重新加载 Case Reports
4. 翻页 → 重新加载
5. 展开某行 → 展示 summary + 三支柱信号（数据已在 case report 中）

## 6. 文件变更范围

| 文件 | 动作 | 原因 |
|---|---|---|
| `src/types/api/benchmark.ts` | 修改 | 新增 Fusion Report/CaseReport 类型 |
| `src/services/benchmark.ts` | 修改 | 新增 3 个 Fusion 查询方法 |
| `src/pages/benchmarks/BenchmarkDetailPage.tsx` | 修改 | 新增 Fusion Collapse 面板 |

## 7. 验收标准

- [ ] Fusion Collapse 面板在 Drawer 内展示
- [ ] 展开后加载 Report 统计卡（total/pass/warn/block/insufficient/confidence）
- [ ] Case Reports Table 含 final_decision/final_risk_level/final_score/confidence
- [ ] decision/risk 用 Tag 展示
- [ ] insufficient_evidence 行标记
- [ ] 展开行显示 summary + 三支柱信号
- [ ] decision 筛选器
- [ ] insufficient_evidence 筛选器
- [ ] Report 不存在时显示"暂无融合数据"
- [ ] loading / empty / error 状态完整
- [ ] `npm run type-check` 通过
- [ ] `npm run build` 通过

## 8. 明确不做什么

1. 本 slice 不做 fusion-history 独立页面（service 方法已预留）。
2. 本 slice 不做 decision_trace_json / evidence_trace_json 展示。
3. 本 slice 不做 fusion 触发（后端无此端点）。

## 9. 明确不做什么

1. 本 slice 不做 fusion-history 独立页面（service 方法已预留）。
2. 本 slice 不做 decision_trace_json / evidence_trace_json 展示。
3. 本 slice 不做 fusion 触发（后端无此端点）。

## 10. 留给下一 Slice 的上下文

| 项目 | 内容 |
|---|---|
| 新增 service 方法 | `getLatestFusionReport`, `listFusionCaseReports`, `listFusionHistory` |
| 新增类型 | `BenchmarkCaseFusionReport`, `BenchmarkCaseFusionCaseReport` |
| 可复用组件 | Fusion Collapse 的 Report 统计 + 三支柱 Descriptions 展开行模式 |
| 已知遗留问题 | 1. listFusionHistory service 方法已添加但未在 UI 中消费; 2. decision_trace_json 未展示; 3. Fusion Report 无 trigger 能力(后端无端点) |

## 11. 实现记录

| 项目 | 内容 |
|---|---|
| 完成日期 | 2026-04-13 |
| 实际修改文件 | `src/types/api/benchmark.ts`, `src/services/benchmark.ts`, `src/pages/benchmarks/BenchmarkDetailPage.tsx` |
| 运行命令 | `npx tsc --noEmit` ✅, `npx vite build` ✅ |
| 遇到的问题 | 无 |
| 与原方案的差异 | 无实质性差异 |

---

## 后端确认结论

1. Fusion 是纯只读，没有触发端点。Fusion Report 由后端管道自动计算。
2. Decision 枚举与 Review 相同: pass/warn/block。Risk 枚举也相同。
3. Case Report 包含完整的三大支柱信号快照，无需额外 API。
4. `final_score` 是 0-100 分（不是 0-1）。`confidence` 和 `evidence_completeness` 是 0-1。
5. `insufficient_evidence` 当 `evidence_completeness < 0.40` 时为 true。
