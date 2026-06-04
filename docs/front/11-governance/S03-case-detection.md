# S03 - Case Detection 展示

## Slice 基本信息

| 字段 | 内容 |
|---|---|
| Slice ID | S03 |
| 名称 | Case Detection 展示 |
| 所属主线 | benchmark |
| 所属模块 | benchmark case governance |
| 优先级 | P1 |
| 前置依赖 | S01, S02 |
| 当前状态 | 方案待审批 |

## 0. 目标

用户可以在 Case 治理详情 Drawer 中查看该 case 的静态检测报告历史列表和最新检测 diff 摘要，区分 authoritative 与 degraded 报告。

## 1. 为什么先做这个 Slice

1. Detection 是治理流水线的第一道关卡，用户需要看到 case 为什么被标记为高风险。
2. S02 Drawer 中已有 detection 的简要状态，S03 补充完整的检测报告列表和 diff 信息。
3. 后续 S04(validation) 和 S06(review) 的展示模式可以复用 S03 的列表结构。

## 2. 后端调研记录

### 2.1 读取的后端代码

| 文件 | 结论 |
|---|---|
| `router.go` L639 | `GET /:id/cases/detections` → `ListCaseDetections`，orgAuthenticated |
| `router.go` L649 | `GET /:id/cases/:caseKey/detections` → `ListCaseDetectionHistory`，orgAuthenticated |
| `router.go` L667-668 | `GET .../detections/diff/latest` → `GetLatestCaseDetectionDiff`；`GET .../diff/history` → `ListCaseDetectionDiffHistory` |
| `benchmark_handler.go` L1466-1502 | `ListCaseDetections`：query 参数 report_id/stage/decision/risk_gte/dimension + page/page_size，`SuccessPageResponse` |
| `benchmark_handler.go` L1505-1542 | `ListCaseDetectionHistory`：同上参数 + `:caseKey` path，`SuccessPageResponse` |
| `benchmark_handler.go` L1545-1571 | `GetLatestCaseDetectionDiff`：query stage(可选)，`SuccessResponse`（单对象） |
| `case_detection.go` L11-50 | `BenchmarkCaseDetectionReport`：id, case_key, case_name, stage, decision, risk_level, authority_status, degraded_reason, confidence, score, critical/high/medium/low_count, issue_count, issues 数组 |
| `case_detection.go` L57-71 | `BenchmarkCaseDetectionIssue`：rule_code, rule_name, dimension, severity, confidence, field_path, message, suggestion |
| `case_detection_diff.go` L12-27 | `BenchmarkCaseDetectionDiff`：current/previous_report_id, current/previous_decision, changed/added/removed_cases, new/resolved_high_risk_cases, score_delta, generated_at |
| `quality_report.go` L11-36 | 枚举：QualityGateStage(import/activation/recheck), QualitySeverity(critical/high/medium/low), QualityDecision(allow/allow_with_warnings/deny) |
| `static_authority.go` L9-15 | BenchmarkStaticAuthorityStatus: authoritative/degraded/mixed |

### 2.2 读取的辅助文档

无相关文档。

### 2.3 代码与文档一致性判断

1. 所有信息从代码直接确认。无辅助文档。
2. 本 slice 以 `case_detection.go`、`case_detection_diff.go`、`quality_report.go` 为准绳。

### 2.4 关键业务结论

1. **资源主键**: report ID。case_key 是业务标识。
2. **decision 枚举**: allow / allow_with_warnings / deny。deny 为拒绝准入。
3. **risk_level 枚举**: critical / high / medium / low。
4. **authority_status 枚举**: authoritative / degraded / mixed。degraded 表示检测规则执行失败或快照构建失败，结论不可信。
5. **stage 枚举**: import / activation / recheck。表示检测发生在哪个阶段。
6. **issues 数组**: 每条 issue 有 rule_code、dimension、severity、message、suggestion。前端需展示 issue 列表。
7. **diff 模型**: 比较两次检测报告间的变化（新增/移除/变更的 case 数量，高风险变化）。

## 3. API 合同

### 3.1 接口列表

| 方法 | 路径 | 用途 | 是否需要 Org | 权限 |
|---|---|---|---|---|
| GET | `/api/v1/benchmarks/:id/cases/:caseKey/detections` | 单个 case 的检测历史 | 是 | canRead |
| GET | `/api/v1/benchmarks/:id/cases/detections/diff/latest` | 最新检测 diff | 是 | canRead |

本 slice 只消费这两个。benchmark 级 detections 列表和 diff history 留给 S11(组织级治理总览)。

### 3.2 请求参数

**Detection History**:
- path: `id`(benchmark ID), `caseKey`
- query: `page`(默认 1), `page_size`(默认 20), `stage`(可选: import/activation/recheck), `decision`(可选: allow/allow_with_warnings/deny), `risk_gte`(可选: critical/high/medium/low)
- headers: Authorization, X-Org-ID

**Latest Diff**:
- path: `id`
- query: `stage`(可选)
- headers: Authorization, X-Org-ID

### 3.3 响应结构

**Detection History** (`SuccessPageResponse`):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 3,
    "page": 1,
    "size": 20,
    "data": [
      {
        "id": "cdr_001",
        "benchmark_id": "bm_001",
        "case_key": "test_add",
        "case_name": "Test Add",
        "stage": "import",
        "decision": "deny",
        "risk_level": "high",
        "authority_status": "authoritative",
        "degraded_reason": "",
        "confidence": 0.95,
        "score": 45,
        "critical_count": 1,
        "high_count": 1,
        "medium_count": 0,
        "low_count": 0,
        "issue_count": 2,
        "issues": [
          {
            "id": 1,
            "rule_code": "assertion_completeness",
            "rule_name": "断言完整性",
            "dimension": "assertion",
            "severity": "high",
            "message": "测试用例缺少关键断言",
            "suggestion": "添加对返回值的断言"
          }
        ],
        "trigger_source": "benchmark_import",
        "created_at": "2026-04-01T10:00:00Z"
      }
    ]
  }
}
```

**Latest Diff** (`SuccessResponse`):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "current_report_id": "bqr_002",
    "previous_report_id": "bqr_001",
    "benchmark_id": "bm_001",
    "stage": "import",
    "current_decision": "allow",
    "previous_decision": "deny",
    "changed_cases": 5,
    "added_cases": 2,
    "removed_cases": 1,
    "new_high_risk_cases": 0,
    "resolved_high_risk_cases": 3,
    "score_delta": 15,
    "generated_at": "2026-04-10T08:00:00Z"
  }
}
```

### 3.4 错误与边界

1. 未登录 → 401
2. 无组织上下文 → 400
3. 不可见 → 404001
4. diff 不存在 → 404 "case detection diff not found"（首次检测无 diff）
5. 空数据 → data.data 为空数组
6. degraded → authority_status 非 authoritative 时标黄 + 显示 degraded_reason
7. diff repository 未配置 → 501（后端可选功能）

## 4. 前端现状调研

### 4.1 现有入口

| 项目 | 结论 |
|---|---|
| 路由挂载位置 | S02 Drawer 已在 BenchmarkDetailPage 内 |
| 现有导航入口 | S02 Drawer 中 detection 部分有简要状态，需扩展为完整列表 |
| 现有页面是否可扩展 | 是，在 S02 Drawer 中新增可折叠的 Detection 详情区块 |

### 4.2 可复用代码

| 类型 | 文件 | 复用方式 |
|---|---|---|
| type | `src/types/api/benchmark.ts` | S02 已定义的 AUTHORITY_STATUS_CONFIG 等枚举常量 |
| service | `src/services/benchmark.ts` | 新增 getCaseDetectionHistory + getLatestDetectionDiff |
| component | Ant Design Table/Collapse | 展示报告列表和 issue 展开行 |

### 4.3 当前缺口

1. 无 detection report 相关类型定义。
2. 无 detection 相关 service 方法。
3. S02 Drawer 中 detection 只有 Descriptions 简要状态，需扩展。

## 5. 页面设计

### 5.1 页面位置

- 嵌入 S02 的 Drawer 中，在"五大支柱状态摘要"的 Detection 行下方新增可折叠面板
- 或者：在五大支柱区域之后新增独立的"检测历史"折叠面板

方案：在 Drawer 底部（lifecycle timeline 之后）新增一个 Collapse 面板"检测报告历史"，点击展开显示检测报告列表。

### 5.2 页面结构

1. **Collapse 面板标题**: "检测报告 (N)" — N 为 total
2. **最新 Diff 摘要**（如有 diff）: StatCard 行显示 changed/added/removed/new_high_risk/resolved_high_risk + score_delta
3. **检测报告 Table**（分页）:
   - `stage` — Tag（import=蓝/activation=绿/recheck=橙）
   - `decision` — Tag（allow=绿/allow_with_warnings=黄/deny=红）
   - `risk_level` — Tag（critical=红/high=橙/medium=黄/low=绿）
   - `authority_status` — Tag（复用 AUTHORITY_STATUS_CONFIG）
   - `score` — 数字列
   - `issue_count` — 数字列
   - `created_at` — 日期列
4. **可展开行**: 点击某行展开 issues 列表（rule_code, dimension, severity, message, suggestion）
5. **degraded 标记**: authority_status 非 authoritative 的行整体标黄背景

### 5.3 交互流

1. 用户打开 S02 Drawer → Drawer 加载成功后，如果 lifecycle_audits 已显示，底部展示"检测报告"折叠面板
2. 点击展开 → 调用 `GET .../detections?page=1&page_size=10` + `GET .../diff/latest`（并行请求）
3. Diff 摘要展示在表格上方
4. 翻页 → 重新请求 detection history
5. 点击表格行展开 → 显示 issues 列表
6. authority_status 为 degraded 的行标黄，显示 degraded_reason
7. API 错误 → message.error

## 6. 数据与状态设计

### 6.1 页面状态

1. loading — 检测报告加载中
2. refreshing — 翻页时
3. submitting — 不需要
4. empty — total === 0
5. error — API 返回非 0
6. degraded — 行级别标黄

### 6.2 字段映射

| 后端字段 | 前端展示 | 备注 |
|---|---|---|
| `stage` | Tag | import/activation/recheck |
| `decision` | Tag | allow/allow_with_warnings/deny |
| `risk_level` | Tag | critical/high/medium/low |
| `authority_status` | Tag + 行背景色 | authoritative=正常/degraded/mixed=黄 |
| `degraded_reason` | 展示在 degraded 行旁 | |
| `score` | 数字列 | 检测评分 |
| `confidence` | 数字列(%) | 置信度 |
| `issue_count` | 数字列 | 问题数 |
| `issues[].rule_code` | 展开行文本 | 规则代码 |
| `issues[].dimension` | 展开行 Tag | 维度 |
| `issues[].severity` | 展开行 Tag | 严重度 |
| `issues[].message` | 展开行文本 | 问题描述 |
| `issues[].suggestion` | 展开行文本 | 修复建议 |
| `created_at` | 日期列 | dayjs 格式化 |
| diff.`changed_cases` | StatCard | 变更数 |
| diff.`added_cases` | StatCard | 新增数 |
| diff.`removed_cases` | StatCard | 移除数 |
| diff.`new_high_risk_cases` | StatCard(红) | 新增高风险 |
| diff.`resolved_high_risk_cases` | StatCard(绿) | 解决高风险 |
| diff.`score_delta` | StatCard | 分数变化(+/−) |

### 6.3 长任务机制

不适用。同步读。

## 7. 文件变更范围

| 文件 | 动作 | 原因 |
|---|---|---|
| `src/types/api/benchmark.ts` | 修改 | 新增 detection report/issue/diff 类型 + 枚举配置常量 |
| `src/services/benchmark.ts` | 修改 | 新增 getCaseDetectionHistory + getLatestDetectionDiff |
| `src/pages/benchmarks/BenchmarkDetailPage.tsx` | 修改 | 在 Drawer 中新增 Detection 折叠面板（Table + diff 摘要） |

## 8. 验收标准

- [ ] S02 Drawer 底部新增"检测报告"折叠面板
- [ ] 展开后显示检测报告历史列表（分页）
- [ ] decision/risk_level/stage/authority_status 用 Tag 展示，颜色正确
- [ ] authority_status 非 authoritative 的行标黄
- [ ] 展开行显示 issues 列表（rule_code, dimension, severity, message, suggestion）
- [ ] 最新 diff 摘要展示（changed/added/removed/new_high_risk/resolved/score_delta）
- [ ] loading / empty / error 状态完整
- [ ] `npm run type-check` 通过
- [ ] `npm run build` 通过

## 9. 明确不做什么

1. 本 slice 不做 benchmark 级的 detections 列表（S11 组织级治理总览）。
2. 本 slice 不做 diff history 完整列表（S11）。
3. 本 slice 不做 detection 的筛选交互（stage/decision/risk_gte 筛选），默认加载全部。
4. 本 slice 不做检测触发（触发在 S08 lifecycle 的 recheck 操作中）。

## 10. 留给下一 Slice 的上下文

| 项目 | 内容 |
|---|---|
| 新增 service 方法 | `benchmarkService.getCaseDetectionHistory(benchmarkId, caseKey, params)`, `benchmarkService.getLatestDetectionDiff(benchmarkId, params)` |
| 新增/修改 store | 无，状态在 BenchmarkDetailPage 组件内管理 |
| 新增路由 | 无，Collapse 面板嵌入 Drawer |
| 新增类型 | `QualityGateStage`, `QualityDecision`, `QualitySeverity`, `StaticAuthorityStatus`, `BenchmarkCaseDetectionIssue`, `BenchmarkCaseDetectionReport`, `BenchmarkCaseDetectionDiff` + 4 配置常量 |
| 可复用组件 | Detection Collapse 面板的 Table + expandable row + diff Statistic 行模式可被 S04(validation)/S06(review)/S07(fusion) 复用 |
| 已知遗留问题 | 1. diff 使用 `Promise.allSettled` 优雅降级，diff 不可用时不展示; 2. detection 只在首次展开时加载（lazy），后续翻页正常请求; 3. Drawer 关闭时不清空 detection 数据（下次打开其他 case 时由 fetchDetections 重写） |

## 11. 实现记录

| 项目 | 内容 |
|---|---|
| 完成日期 | 2026-04-13 |
| 实际修改文件 | `src/types/api/benchmark.ts`, `src/services/benchmark.ts`, `src/pages/benchmarks/BenchmarkDetailPage.tsx` |
| 运行命令 | `npx tsc --noEmit` ✅, `npx vite build` ✅ |
| 遇到的问题 | Edit 工具 XML 解析错误（已通过分段编辑解决） |
| 与原方案的差异 | 无实质性差异，3 个文件精确匹配 |

---

## 后端确认结论

1. 本 slice 消费的是 benchmark 治理主线中的 case detection history 和 latest diff 能力。
2. `BenchmarkCaseDetectionReport`、`BenchmarkCaseDetectionIssue`、`BenchmarkCaseDetectionDiff` 结构从 `case_detection.go` 和 `case_detection_diff.go` 代码确认。枚举值从 `quality_report.go` 和 `static_authority.go` 确认。
3. 无过期文档冲突。
4. diff 是可选功能（可能返回 404 或 501），前端需优雅处理。
