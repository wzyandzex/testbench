# S02 - Case 治理详情（总览 Drawer）

## Slice 基本信息

| 字段 | 内容 |
|---|---|
| Slice ID | S02 |
| 名称 | Case 治理详情总览 |
| 所属主线 | benchmark |
| 所属模块 | benchmark case governance |
| 优先级 | P0 |
| 前置依赖 | S01 |
| 当前状态 | 方案待审批 |

## 0. 目标

用户可以在 Benchmark 详情页的 Cases 列表中点击某个用例，打开右侧抽屉查看该用例的治理总览：基本信息、治理智能（信任姿态/证据新鲜度/置信度）、五大支柱状态摘要、可用操作、生命周期审计时间线。

## 1. 为什么先做这个 Slice

1. 它是所有治理子报告（detection/validation/review/fusion）的入口总览页，S03-S07 的跳转从这里出发。
2. 用户需要在一个视图内看到用例的治理全貌，而不是分别进入多个子页面。
3. authoritative vs degraded 的区分在这个页面首次落地展示。

## 2. 后端调研记录

### 2.1 读取的后端代码

| 文件 | 结论 |
|---|---|
| `router.go` L640 | `GET /:id/cases/:caseKey/governance` → `GetCaseGovernanceDetail`，orgAuthenticated 组 |
| `router.go` L644 | `GET /:id/cases/:caseKey/lifecycle-audits` → `ListCaseLifecycleAudits`，orgAuthenticated 组 |
| `benchmark_handler.go` L1386-1407 | `GetCaseGovernanceDetail`：取 `:id` + `:caseKey` + orgID，canRead 检查，调 service，`SuccessResponse`（非分页） |
| `benchmark_handler.go` L1410-1433 | `ListCaseLifecycleAudits`：取 `:id` + `:caseKey` + page/page_size，调 service，`SuccessPageResponse` |
| `case_governance_detail.go` L13-129 | `GetCaseGovernanceDetail`：组装 CaseGovernanceDetail，内嵌 Current + LifecycleAudits(10) + Versions(10) + LatestDetection + LatestValidation + LatestReview + LatestFusion + RecheckTriggers + RemediationFeedbackHistory |
| `case_governance_types.go` L145-239 | `CaseGovernanceView`：~90 字段，覆盖 case 基本信息+detection/validation/review/fusion/remediation 各支柱 + governance_intelligence + available_actions |
| `case_governance_types.go` L371-388 | `CaseGovernanceDetail`：top-level 结构，`Current` + 嵌入的子报告数组 |
| `case_governance_types.go` L81-98 | `BenchmarkCaseLifecycleAuditLog`：id, case_key, action, from_status, to_status, trigger_source, reason, actor_user_id, created_at |

### 2.2 读取的辅助文档

| 文件 | 读到了什么 |
|---|---|
| 无相关文档 | docs/item 中无 case governance 文档 |

### 2.3 代码与文档一致性判断

1. 所有信息从代码直接确认。无辅助文档需要交叉检查。
2. 无过期文档。
3. 本 slice 以 `case_governance_types.go` 和 `case_governance_detail.go` 为准绳。

### 2.4 关键业务结论

1. **资源主键**: case_key（benchmark 内唯一），不是 id。
2. **状态机**: lifecycle action 有 created/versioned/deactivated/reactivated/retired/restored。
3. **authoritative vs degraded**: 每个支柱都有 `_authority_status` 和 `_degraded_reason` 字段。authority_status 枚举值由 domain 层定义（如 `authoritative`/`degraded`/`insufficient_evidence`）。前端必须区分展示。
4. **权限**: 普通组织成员可读（canRead）。lifecycle 操作需要 org-admin（S08）。
5. **404 隐匿**: canRead 失败返回 404001。
6. **governance intelligence**: trust_posture(trusted/watch/untrusted/inactive) + evidence_freshness(missing/fresh/aging/stale) + confidence_posture(authoritative/degraded/insufficient_evidence/low_confidence/decayed/not_applicable)。
7. **available_actions**: 后端已计算好推荐操作列表（validate_cases/review_cases/recheck_quality/inspect_detail）。

## 3. API 合同

### 3.1 接口列表

| 方法 | 路径 | 用途 | 是否需要 Org | 权限 |
|---|---|---|---|---|
| GET | `/api/v1/benchmarks/:id/cases/:caseKey/governance` | 获取用例治理详情总览 | 是 | canRead |
| GET | `/api/v1/benchmarks/:id/cases/:caseKey/lifecycle-audits` | 获取生命周期审计（分页） | 是 | canRead |

### 3.2 请求参数

**Governance Detail**:
- path: `id`(benchmark ID), `caseKey`
- headers: Authorization, X-Org-ID

**Lifecycle Audits**:
- path: `id`, `caseKey`
- query: `page`(默认 1), `page_size`(默认 20)
- headers: Authorization, X-Org-ID

### 3.3 响应结构

**Governance Detail** (`SuccessResponse`):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "benchmark_id": "bm_001",
    "organization_id": "org_001",
    "case_key": "test_add",
    "current": {
      "case_asset_id": "ca_001",
      "case_key": "test_add",
      "case_name": "Test Add",
      "source_path": "tests/test_math.py",
      "case_type": "selector",
      "status": "active",
      "current_version": 3,
      "governance_risk": "medium",
      "governance_drift_status": "drifted",
      "detection_decision": "deny",
      "detection_risk_level": "high",
      "detection_authority_status": "authoritative",
      "detection_degraded_reason": "",
      "detection_issue_count": 2,
      "validation_aggregate_outcome": "pass",
      "validation_authority_status": "authoritative",
      "validation_degraded_reason": "",
      "validation_pass_rate": 1.0,
      "validation_flaky": false,
      "review_decision": "approve",
      "review_risk": "low",
      "review_authority_status": "authoritative",
      "review_degraded_reason": "",
      "review_low_confidence": false,
      "fusion_decision": "pass",
      "fusion_risk_level": "low",
      "fusion_insufficient_evidence": false,
      "governance_intelligence": {
        "trust_posture": "watch",
        "trust_reason": "detection high risk",
        "evidence_freshness": "fresh",
        "confidence_posture": "authoritative",
        "active_signals": ["detection_high_risk", "review_recheck_recommended"]
      },
      "operator_attention_required": true,
      "operator_attention_reason": "detection high risk",
      "available_actions": ["validate_cases", "review_cases"],
      "primary_action": "review_cases",
      "primary_action_reason": "review recommended for high risk case"
    },
    "lifecycle_audits": [
      {
        "id": "audit_001",
        "case_key": "test_add",
        "action": "versioned",
        "from_status": "active",
        "to_status": "active",
        "trigger_source": "benchmark_update",
        "reason": "content hash changed",
        "actor_user_id": "",
        "created_at": "2026-03-25T10:00:00Z"
      }
    ],
    "lifecycle_audit_total": 5,
    "versions": [],
    "version_total": 3,
    "latest_detection": null,
    "latest_validation": null,
    "latest_review": null,
    "latest_fusion": null
  }
}
```

**Lifecycle Audits** (`SuccessPageResponse`):
```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 5,
    "page": 1,
    "size": 20,
    "data": [{ /* BenchmarkCaseLifecycleAuditLog */ }]
  }
}
```

### 3.4 错误与边界

1. 未登录 → 401
2. 无组织上下文 → 400
3. 不可见 → 404001
4. case_key 不存在 → 通过 service 层错误映射返回
5. 空数据 → `current` 可能为 null（如果 case 无治理记录）
6. 长任务 → 不适用（同步读）
7. degraded → 各支柱的 `_authority_status` 非 authoritative 时需标黄展示 degraded reason

## 4. 前端现状调研

### 4.1 现有入口

| 项目 | 结论 |
|---|---|
| 路由挂载位置 | 无独立路由，计划用 Drawer 方式嵌入 BenchmarkDetailPage |
| 现有导航入口 | S01 的 case_key 已渲染为可点击样式，需启用点击事件 |
| 现有页面是否可扩展 | 是，BenchmarkDetailPage 中新增 Drawer 组件 |

### 4.2 可复用代码

| 类型 | 文件 | 复用方式 |
|---|---|---|
| type | `src/types/api/benchmark.ts` | S01 已定义的 CaseAssetStatus/CaseAssetType 和配置常量 |
| service | `src/services/benchmark.ts` | 新增 getCaseGovernanceDetail 方法 |
| component | Ant Design Drawer/Descriptions/Timeline | 直接使用 |

### 4.3 当前缺口

1. 无 governance 相关类型定义。
2. 无 governance 相关 service 方法。
3. S01 的 case_key 点击事件未实现。

## 5. 页面设计

### 5.1 页面位置

- 路由：不新增路由，Drawer 方式
- 入口：点击 S01 Cases Tab 中的 case_key → 打开右侧 Drawer
- 层级：BenchmarkDetailPage 内的 Drawer overlay

### 5.2 页面结构

Drawer 内从上到下：

1. **Drawer 头部**: case_key + case_name + status Tag + case_type Tag
2. **治理智能卡片**: trust_posture(信任姿态) + evidence_freshness(证据新鲜度) + confidence_posture(置信度) — 用三个 Tag/StatCard 展示
3. **操作提示**: operator_attention_required 时显示 Alert，说明 primary_action 和 reason
4. **五大支柱状态摘要** — 用 Descriptions 组件：
   - Detection: decision + risk_level + authority_status（degraded 时标黄 + 显示 reason）
   - Validation: outcome + pass_rate + authority_status + flaky 标记
   - Review: decision + risk + authority_status + low_confidence 标记
   - Fusion: decision + risk_level + insufficient_evidence 标记
   - Remediation: attempt_count + repair_state + comparison_outcome
5. **可用操作**: available_actions 列表，每个操作作为 Button（本次只展示，实际触发在后续 slice）
6. **生命周期时间线**: Ant Design Timeline 组件，展示 lifecycle_audits（detail 内嵌的最新 10 条），每条显示 action + from_status → to_status + reason + 时间
7. **子报告入口**: 最新 detection/validation/review/fusion 的入口链接（点击跳转到对应 slice 的内容，当前 slice 只做占位标记"待实现"）

### 5.3 交互流

1. 用户点击 Cases Tab 表格中的 case_key → 打开 Drawer → 调用 `GET .../governance` 加载数据
2. Drawer 展示 loading → 数据返回后渲染各区块
3. authority_status 为 degraded 的支柱 → 标黄显示 degraded_reason
4. 生命周期时间线展示最近 10 条，底部有"查看更多"（点击调用分页 API 加载更多）
5. 关闭 Drawer → 不影响 Cases Tab 列表
6. API 错误 → message.error

## 6. 数据与状态设计

### 6.1 页面状态

1. loading — Drawer 打开时加载中
2. refreshing — 不需要
3. submitting — 不需要（只读）
4. empty — current 为 null 时显示"无治理记录"
5. error — API 返回非 0
6. degraded — 各支柱 authority_status 非 authoritative 时局部标黄

### 6.2 字段映射（仅 S02 展示的核心字段）

| 后端字段 | 前端展示 | 备注 |
|---|---|---|
| `current.case_key` | Drawer 标题 | 标识 |
| `current.case_name` | Drawer 标题副文本 | 可空 |
| `current.status` | Tag | 复用 CASE_ASSET_STATUS_CONFIG |
| `current.case_type` | Tag | 复用 CASE_ASSET_TYPE_CONFIG |
| `current.governance_intelligence.trust_posture` | Tag（颜色按值区分） | trusted=绿/watch=黄/untrusted=红/inactive=灰 |
| `current.governance_intelligence.evidence_freshness` | Tag | fresh=绿/aging=黄/stale=红/missing=灰 |
| `current.governance_intelligence.confidence_posture` | Tag | authoritative=绿/degraded=黄/其余=灰 |
| `current.operator_attention_required` | Alert | true 时显示警告 |
| `current.detection_decision` | 文本 + risk_level Tag | |
| `current.detection_authority_status` | Tag | authoritative=绿/degraded=黄 |
| `current.detection_degraded_reason` | 展示在 degraded Tag 旁 | 仅 authority_status 非 authoritative 时显示 |
| `current.validation_aggregate_outcome` | 文本 + pass_rate | |
| `current.validation_authority_status` | Tag | 同上 |
| `current.review_decision` | 文本 + risk Tag | |
| `current.review_authority_status` | Tag | 同上 |
| `current.fusion_decision` | 文本 + risk_level Tag | |
| `current.available_actions` | Button 列表 | 展示但不触发 |
| `lifecycle_audits[].action` | Timeline Item 标题 | |
| `lifecycle_audits[].from_status → to_status` | Timeline Item 副标题 | |
| `lifecycle_audits[].reason` | Timeline Item 内容 | |
| `lifecycle_audits[].created_at` | Timeline Item 时间 | dayjs 格式化 |

### 6.3 长任务机制

不适用。同步读操作。

## 7. 文件变更范围

| 文件 | 动作 | 原因 |
|---|---|---|
| `src/types/api/benchmark.ts` | 修改 | 新增 CaseGovernanceDetail/CaseGovernanceView/CaseGovernanceIntelligenceView/BenchmarkCaseLifecycleAuditLog 等类型 + 枚举配置常量 |
| `src/services/benchmark.ts` | 修改 | 新增 getCaseGovernanceDetail + getCaseLifecycleAudits 方法 |
| `src/pages/benchmarks/BenchmarkDetailPage.tsx` | 修改 | 新增 CaseDetailDrawer 组件 + 启用 case_key 点击事件 |

## 8. 验收标准

- [ ] 点击 S01 Cases Tab 中的 case_key → 右侧 Drawer 打开
- [ ] Drawer 展示治理智能（trust_posture/evidence_freshness/confidence_posture）
- [ ] 五大支柱状态摘要展示（detection/validation/review/fusion/remediation）
- [ ] authority_status 为 degraded 时标黄显示 degraded_reason
- [ ] operator_attention_required 时显示 Alert
- [ ] 生命周期时间线展示
- [ ] available_actions 展示（按钮形式，点击提示"功能开发中"）
- [ ] loading / empty / error 状态完整
- [ ] `npm run type-check` 通过
- [ ] `npm run build` 通过

## 9. 明确不做什么

1. 本 slice 不做 detection 详细报告展示（S03）。
2. 本 slice 不做 validation 触发和详细报告（S04/S05）。
3. 本 slice 不做 review 详细报告（S06）。
4. 本 slice 不做 fusion 详细报告（S07）。
5. 本 slice 不做 lifecycle 操作按钮（retire/restore，S08）。
6. 本 slice 不做 available_actions 的实际触发（只展示，后续 slice 实现触发）。
7. 本 slice 不做 lifecycle audits 的完整分页加载（展示内嵌的 10 条，分页在后续可按需补充）。

## 10. 留给下一 Slice 的上下文

实现完成后回填。

| 项目 | 内容 |
|---|---|
| 新增 service 方法 | `benchmarkService.getCaseGovernanceDetail(benchmarkId, caseKey)`, `benchmarkService.getCaseLifecycleAudits(benchmarkId, caseKey, params)` |
| 新增/修改 store | 无，状态直接在 BenchmarkDetailPage 组件内管理 |
| 新增路由 | 无，Drawer 方式嵌入 BenchmarkDetailPage |
| 新增类型 | `CaseGovernanceDetail`, `CaseGovernanceView`, `CaseGovernanceIntelligenceView`, `BenchmarkCaseLifecycleAuditLog` + 8 个枚举类型 + 8 个配置常量 |
| 可复用组件 | 治理智能卡片、支柱状态 Descriptions、生命周期 Timeline 的渲染模式可被后续 slice 复用 |
| 已知遗留问题 | 1. available_actions 按钮只展示提示，实际触发在后续 slice; 2. lifecycle audits 只展示内嵌 10 条，无"加载更多"; 3. 子报告入口只做 presence 检查，详情在 S03-S07 |

## 11. 实现记录

| 项目 | 内容 |
|---|---|
| 完成日期 | 2026-04-13 |
| 实际修改文件 | `src/types/api/benchmark.ts`, `src/services/benchmark.ts`, `src/pages/benchmarks/BenchmarkDetailPage.tsx` |
| 运行命令 | `npx tsc --noEmit` ✅, `npx vite build` ✅ |
| 遇到的问题 | `Descriptions` 在已有一行 antd import 和新增行重复，去掉重复 import 即可 |
| 与原方案的差异 | 无实质性差异，3 个文件精确匹配 |

---

## 后端确认结论

1. 本 slice 消费的是 benchmark 治理主线中的 case governance detail 能力。
2. `CaseGovernanceDetail` 和 `CaseGovernanceView` 结构从 `case_governance_types.go` 代码确认。lifecycle action 枚举从同文件确认。`GetCaseGovernanceDetail` 的组装逻辑从 `case_governance_detail.go` 确认。
3. 无过期文档冲突。
4. `latest_detection/validation/review/fusion` 子报告的完整结构在本次 slice 只做 presence 检查（有/无），不展开展示。展开展示在 S03-S07。
