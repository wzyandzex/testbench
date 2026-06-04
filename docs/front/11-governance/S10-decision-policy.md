# S10 - 决策策略管理

## Slice 基本信息

| 字段 | 内容 |
|---|---|
| Slice ID | S10 |
| 名称 | 决策策略管理 |
| 所属主线 | benchmark |
| 所属模块 | benchmark governance policy |
| 优先级 | P1 |
| 前置依赖 | S09 (复用策略页面模式) |
| 当前状态 | 已完成 |

## 0. 目标

用户可以查看当前生效的决策策略（reason 分类优先级 + reason→action 映射），对比系统默认 vs 组织覆盖；org-admin 可以编辑组织级策略、预览验证、查看审计日志。

## 1. 为什么先做这个 Slice

1. 决策策略决定治理智能引擎如何根据 reason 将 case 分为 untrusted/watch，以及触发什么 action。
2. 与 S09 共享相同的 5 端点模式和页面布局，复用 established pattern。
3. S09 已建立策略页面的 effective + form + audit 三段式结构，S10 在此基础上增加更复杂的表单交互。

## 2. 后端调研记录

### 2.1 读取的后端代码

| 文件 | 结论 |
|---|---|
| `router.go` L611-615 | 5 个路由: GET effective, GET organization, POST validate(OrgAdmin), PUT upsert(OrgAdmin), GET audits(OrgAdmin)。路径含 `/decision/` 子路径 |
| `benchmark_handler.go` L708-714 | UpsertRequest: 5 个可选字段(指针类型): 4 个 `*[]string` + 1 个 `*map[string]string` |
| `benchmark_handler.go` L969-1162 | Handler 逻辑与 S09 完全同构: effective→resolved, organization→404表示无覆盖, validate→preview, upsert→audit+persist, audits→分页+summary |
| `governance_decision_policy.go`(domain) L11-23 | 实体: 4 个 `[]string` JSON + 1 个 `map[string]string` JSON + updated_by + timestamps |
| `governance_decision_policy.go`(application) L39-96 | Profile(5字段) + Resolved(effective+default+org+meta) + EffectiveView(含 resolution_source) |
| `case_governance_policy_catalog.go` L6-33 | 27 个治理 reason 常量 |
| `case_governance_policy_catalog.go` L91-191 | 默认值: untrusted(15), watch(8), attention(18), primary_action_priority(25), primary_action_by_reason(25 mapping) |
| `case_governance_types.go` L43-47 | 4 个 GovernanceAction 枚举: validate_cases, review_cases, recheck_quality, inspect_detail |
| `governance_decision_policy.go`(application) L317-402 | 验证规则: untrusted+watch 必须精确分区 23 个 trust reason; reason-action 映射必须在允许组合内 |

### 2.2 关键业务结论

1. **5 个可配置字段**:
   - `untrusted_reason_priority`: string[]，不可信 reason 列表（含优先级排序），默认 15 个
   - `watch_reason_priority`: string[]，观察 reason 列表（含优先级排序），默认 8 个
   - `attention_reason_priority`: string[]，需关注 reason 列表，默认 18 个
   - `primary_action_reason_priority`: string[]，主操作 reason 优先级，默认 25 个
   - `primary_action_by_reason`: map<string, string>，reason → action 映射，默认 25 条
2. **分区约束**: untrusted + watch 必须精确覆盖 23 个 trust classification reason，不能重叠，不能遗漏。
3. **Action 枚举**: 仅 4 个值: `validate_cases`, `review_cases`, `recheck_quality`, `inspect_detail`。
4. **Reason-Action 约束**: 不是所有 reason 都能配所有 action，有允许组合表（如 `review_degraded` 只能配 `inspect_detail` 或 `review_cases`）。
5. **Effective 解析**: 同 trust policy，org 覆盖优先 → 否则系统默认。
6. **审计日志**: 结构与 trust policy 完全相同（before/after snapshot）。

## 3. API 合同

### 3.1 接口列表

| 方法 | 路径 | 用途 | 权限 |
|---|---|---|---|
| GET | `/api/v1/benchmarks/governance/policies/decision/effective` | 获取生效决策策略 | auth |
| GET | `/api/v1/benchmarks/governance/policies/decision/organization` | 获取组织决策策略 | auth |
| POST | `/api/v1/benchmarks/governance/policies/decision/organization/validate` | 预览验证 | org-admin |
| PUT | `/api/v1/benchmarks/governance/policies/decision/organization` | 更新组织策略 | org-admin |
| GET | `/api/v1/benchmarks/governance/policies/decision/organization/audits` | 审计日志 | org-admin |

### 3.2 请求参数

**Upsert/Validate body**:
```json
{
  "untrusted_reason_priority": ["replay_regressed", "..."],
  "watch_reason_priority": ["review_recheck_recommended", "..."],
  "attention_reason_priority": ["retired", "..."],
  "primary_action_reason_priority": ["retired", "..."],
  "primary_action_by_reason": { "retired": "inspect_detail", "..." : "..." }
}
```

**Audits query**: 同 S09（actor_user_id, action, created_from, created_to, view, page, page_size）

### 3.3 响应结构

**Effective** (`SuccessResponse`):
```json
{
  "effective": { "untrusted_reason_priority": [...], "watch_reason_priority": [...], ... },
  "system_default": { ... },
  "organization": { ... },  // null 如果无覆盖
  "organization_meta": { "updated_by": "...", "updated_at": "..." }
}
```

**Validate 成功**: `{ "valid": true, "normalized_policy": { ... } }`
**Validate 失败** (400): `{ "detail": "...", "details": [{ "field": "...", "code": "...", "message": "..." }] }`

### 3.4 错误与边界

| 错误 | HTTP | 场景 |
|---|---|---|
| 分区不完整 | 400 | untrusted+watch 未覆盖所有 23 个 trust reason |
| 分区重叠 | 400 | reason 同时出现在 untrusted 和 watch |
| 无效 reason | 400 | 使用了不在允许集的 reason |
| 无效 action | 400 | reason-action 组合不被允许 |
| 组织策略不存在 | 404 | GET organization 无覆盖 |
| 501 | 审计仓库未初始化 |

## 4. 页面设计

### 4.1 页面位置

- 路由: `/governance/policies/decision`

### 4.2 页面结构

**与 S09 共享相同的 three-card 布局**，但 Card 1 和 Card 2 的内容不同。

**Card 1 - 当前生效策略**:
- 来源标签: resolution_source
- 两列布局展示 untrusted/watch 分类:
  - 左列: Untrusted Reasons（红色标签），按优先级排列
  - 右列: Watch Reasons（黄色标签），按优先级排列
- Attention Reasons: 标签列表
- Primary Action Mapping: Table(reason → action)
- 无覆盖时: Alert "未配置组织覆盖"

**Card 2 - 编辑组织策略** (仅 org-admin):

Tab 1 - Reason 分类:
- Untrusted Reason 列表: 可排序的 Tag 列表 + 上移/下移按钮 + 从 watch 列表添加按钮
- Watch Reason 列表: 同上
- Transfer 风格: 23 个 trust reason 必须分配到 untrusted 或 watch

Tab 2 - Attention & Action:
- Attention Reasons: 多选 Select（从 25 个 allowed reason 中选择）
- Primary Action Priority: 可排序列表（拖拽排序过于复杂，使用上下移动按钮）
- Primary Action By Reason: Table
  - 列: Reason(Select) + Action(Select: 4 个 action)
  - 添加行 / 删除行
  - 约束: 只显示允许的 reason-action 组合

按钮: "预览验证" + "保存"

**Card 3 - 审计日志** (仅 org-admin):
- 完全复用 S09 的审计日志结构

### 4.3 交互流

1. 页面加载 → 并行请求 effective + organization
2. 卡片1展示分类结果（只读）
3. org-admin 打开卡片2编辑
4. 编辑 untrusted/watch 列表 → 确保 23 个 reason 完整分区
5. 编辑 action mapping → 每行选择 reason + allowed action
6. 预览验证 → 显示 normalized_policy 或错误详情
7. 保存 → upsert → 刷新

### 4.4 权限控制

同 S09: Card 2/3 仅 org-admin 可见。

## 5. 文件变更范围

| 文件 | 动作 | 原因 |
|---|---|---|
| `src/types/api/benchmark.ts` | 修改 | 新增决策策略类型 + reason/action 枚举 + 配置常量 |
| `src/services/benchmark.ts` | 修改 | 新增 5 个 decision policy service 方法 |
| `src/pages/governance/DecisionPolicyPage.tsx` | 新增 | 决策策略管理页面 |
| `src/router/routes.tsx` | 修改 | 新增 lazy import |
| `src/router/index.tsx` | 修改 | 新增 `/governance/policies/decision` 路由 |

核心文件 3 个 + 路由配置 2 个（各 1-2 行）。

## 6. 验收标准

- [ ] 页面在 `/governance/policies/decision` 可访问
- [ ] 展示 effective 策略中 untrusted/watch 分类
- [ ] 展示 attention reasons 和 primary action mapping
- [ ] 对比 system_default vs organization override
- [ ] org-admin 可编辑 untrusted/watch reason 列表
- [ ] untrusted+watch 必须分区 23 个 trust reason（前端提示）
- [ ] org-admin 可编辑 attention reasons 和 action mapping
- [ ] 预览验证 + 保存功能
- [ ] 审计日志表格含筛选和分页
- [ ] 非 org-admin 不可见编辑/审计
- [ ] `npm run type-check` 通过
- [ ] `npm run build` 通过

## 7. 明确不做什么

1. 本 slice 不做 drag-and-drop 排序（使用上下移动按钮）。
2. 本 slice 不做 reason 的国际化（显示原始 reason key）。
3. 本 slice 不做 reason-action 允许组合的前端实时校验（依赖后端 validate）。
4. 本 slice 不做独立的 reason-action 允许组合查询端点。

## 8. 留给下一 Slice 的上下文

| 项目 | 内容 |
|---|---|
| 新增 service 方法 | `getEffectiveDecisionPolicy`, `getOrganizationDecisionPolicy`, `validateDecisionPolicy`, `upsertDecisionPolicy`, `listDecisionPolicyAudits` |
| 新增类型 | `CaseGovernanceDecisionPolicyProfile`, `ResolvedCaseGovernanceDecisionPolicy`, `OrganizationGovernanceDecisionPolicy`, `DecisionPolicyValidationResult`, `DecisionPolicyAuditLog` |
| 新增常量 | `GOVERNANCE_ACTIONS` (4 个 action), `TRUST_CLASSIFICATION_REASONS` (23 个 reason), `DEFAULT_UNTRACHED_REASONS`, `DEFAULT_WATCH_REASONS`, `DEFAULT_PRIMARY_ACTION_BY_REASON` |
| 可复用组件 | 审计日志 Card 完全复用 S09 模式 |

## 9. 实现记录

| 项目 | 内容 |
|---|---|
| 完成日期 | 2026-04-14 |
| 实际修改文件 | `src/types/api/benchmark.ts`, `src/services/benchmark.ts`, `src/pages/governance/DecisionPolicyPage.tsx`, `src/router/routes.tsx`, `src/router/index.tsx` |
| 运行命令 | `npx tsc --noEmit` ✅, `npx vite build` ✅ |
| 遇到的问题 | 1. GovernanceAction 重复定义(S02已有) → 删除S10的重复; 2. Descriptions/Spin未使用 import → 移除; 3. Set<string>类型推断 → 显式泛型; 4. idx参数未使用 → 移除; 5. setAuditDateRange未使用 → 替换readOnly Input为DatePicker |
| 与原方案的差异 | 审计日志的日期筛选从readOnly Input改为DatePicker; 无其他差异 |

---

## 后端确认结论

1. 5 个端点，base path `/api/v1/benchmarks/governance/policies/decision/`，注意比 trust 多了 `/decision/` 子路径。
2. 请求体 5 个字段: 4 个 `*[]string` + 1 个 `*map[string]string`（不是 `map[string]Action`）。
3. 验证复杂: untrusted+watch 精确分区 23 个 trust reason；reason-action 有允许组合约束。
4. 有效 action 仅 4 个: validate_cases, review_cases, recheck_quality, inspect_detail。
5. 默认 untrusted=15, watch=8, attention=18, primary_action_priority=25, primary_action_by_reason=25。
6. Audit 结构与 trust policy 完全相同（不同的 DB 表但同构）。
