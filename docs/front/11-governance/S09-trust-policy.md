# S09 - 信任策略管理

## Slice 基本信息

| 字段 | 内容 |
|---|---|
| Slice ID | S09 |
| 名称 | 信任策略管理 |
| 所属主线 | benchmark |
| 所属模块 | benchmark governance policy |
| 优先级 | P1 |
| 前置依赖 | S01 |
| 当前状态 | 已完成 |

## 0. 目标

用户可以查看当前生效的信任策略（effective），对比系统默认 vs 组织覆盖；org-admin 可以编辑组织级策略、预览验证、查看审计日志。

## 1. 为什么先做这个 Slice

1. S09-S11 构成策略管理层，信任策略是治理流水线的核心配置，影响证据新鲜度和自动化决策。
2. 信任策略管理是一个独立页面（非 Drawer 嵌入），为 S10(决策策略)、S14(质量策略) 建立可复用的策略页面模式。
3. 包含完整的 CRUD + validate + audit 交互，是最"完整"的策略管理 slice。

## 2. 后端调研记录

### 2.1 读取的后端代码

| 文件 | 结论 |
|---|---|
| `router.go` L606-610 | 5 个路由: GET effective, GET organization, POST validate(OrgAdmin), PUT upsert(OrgAdmin), GET audits(OrgAdmin) |
| `benchmark_handler.go` L699-706 | UpsertRequest: 6 个可选字段(指针类型)，全 omitted 则不更新 |
| `benchmark_handler.go` L771-769 | GetEffective: 返回 `ResolvedCaseGovernanceTrustPolicy`(effective+system_default+org+org_meta) |
| `benchmark_handler.go` L788-804 | GetOrganization: 返回 org 实体，不存在返回 404(无组织覆盖时) |
| `benchmark_handler.go` L805-844 | Validate: 绑定请求体→调用 service validate→成功返回 `{valid, normalized_policy}`→失败返回 400 `{detail, details}` |
| `benchmark_handler.go` L845-887 | Upsert: 先加载 before 快照→调用 service upsert→写审计日志→返回更新后策略 |
| `benchmark_handler.go` L888-968 | ListAudits: query 分页+actor/action/date 过滤+view=summary 模式→分页返回 |
| `governance_trust_policy.go`(domain) | 6 字段: evidence_aging_hours(168), evidence_stale_hours(720), review_low_confidence_threshold(0.65), 3 个 auto bool |
| `governance_trust_policy.go`(application) L39-72 | `CaseGovernanceTrustPolicyProfile`(6字段) + `ResolvedCaseGovernanceTrustPolicy`(effective+default+org+meta) + `CaseGovernanceEffectivePolicyView`(含 resolution_source) |
| `governance_trust_policy.go`(application) L299-343 | 验证规则: aging>0, stale>0, stale>aging, threshold∈(0,1] |
| `governance_trust_policy_audit_repository.go` | AuditLog 含 before/after snapshot(JSON)、actor/role/action/request 信息 |

### 2.2 关键业务结论

1. **Effective 策略解析**: org 覆盖优先 → 否则用系统默认。`resolution_source` 字段标明来源。
2. **Organization 策略不存在时**: GET organization 返回 404（前端应展示"未配置组织覆盖"）。
3. **Validate 是预览**: 不持久化，只校验参数合法性和归一化，返回 `{valid: true, normalized_policy}` 或 400 错误。
4. **Upsert 是全量覆盖**: 所有字段都会写入，未传的字段保持原值（指针类型 nil 表示不更新）。首次 upsert 创建，后续更新。
5. **Audit 前后快照**: `before_snapshot` 和 `after_snapshot` 是 JSON RawMessage，包含完整策略内容。
6. **6 个可配置字段**:
   - `evidence_aging_hours`: 证据老化时间（默认 168h / 7天）
   - `evidence_stale_hours`: 证据过期时间（默认 720h / 30天），必须 > aging
   - `review_low_confidence_threshold`: 审查低置信阈值（默认 0.65），范围 (0, 1]
   - `auto_review_after_validation`: 验证后自动审查（默认 false）
   - `auto_validation_after_review_low_confidence`: 审查低置信后自动验证（默认 false）
   - `auto_validation_on_quality_recheck`: 质量重检后自动验证（默认 false）
7. **权限**: 读操作(any authenticated)、写操作(RequireOrgAdmin)、审计(RequireOrgAdmin)。

## 3. API 合同

### 3.1 接口列表

| 方法 | 路径 | 用途 | 权限 |
|---|---|---|---|
| GET | `/api/v1/benchmarks/governance/policies/effective` | 获取生效策略 | auth |
| GET | `/api/v1/benchmarks/governance/policies/organization` | 获取组织策略 | auth |
| POST | `/api/v1/benchmarks/governance/policies/organization/validate` | 预览验证 | org-admin |
| PUT | `/api/v1/benchmarks/governance/policies/organization` | 更新组织策略 | org-admin |
| GET | `/api/v1/benchmarks/governance/policies/organization/audits` | 审计日志 | org-admin |

### 3.2 请求参数

**GET effective**: 无参数

**GET organization**: 无参数

**POST validate**:
```json
{
  "evidence_aging_hours": 168,
  "evidence_stale_hours": 720,
  "review_low_confidence_threshold": 0.65,
  "auto_review_after_validation": false,
  "auto_validation_after_review_low_confidence": false,
  "auto_validation_on_quality_recheck": false
}
```

**PUT upsert**: 同 validate

**GET audits**: query `actor_user_id`, `action`, `created_from`, `created_to`, `view=summary`, `page`, `page_size`

### 3.3 响应结构

**Effective** (`SuccessResponse`):
```json
{
  "effective": { /* 6 个策略字段 */ },
  "system_default": { /* 6 个策略字段 */ },
  "organization": { /* 6 个策略字段，无覆盖时 null */ },
  "organization_meta": { "updated_by": "...", "updated_at": "..." }
}
```

**Organization** (`SuccessResponse`): 组织策略实体，含 `updated_by`, `created_at`, `updated_at`

**Validate 成功** (`SuccessResponse`):
```json
{ "valid": true, "normalized_policy": { /* 归一化后的策略 */ } }
```

**Validate 失败** (400):
```json
{ "detail": "validation failed", "details": ["evidence_stale_hours must be greater than evidence_aging_hours"] }
```

**Audits** (`SuccessPageResponse`):
```json
{
  "data": [{
    "id": 1,
    "actor_user_id": "user_001",
    "actor_role": "admin",
    "action": "upsert",
    "before_snapshot": { /* JSON */ },
    "after_snapshot": { /* JSON */ },
    "request_method": "PUT",
    "request_path": "/api/v1/...",
    "client_ip": "127.0.0.1",
    "created_at": "2026-04-13T10:00:00Z"
  }],
  "total": 5, "page": 1, "size": 20
}
```

### 3.4 错误与边界

| 错误 | HTTP | 场景 |
|---|---|---|
| 组织策略不存在 | 404 | GET organization 无覆盖 |
| 验证失败 | 400 | stale <= aging, threshold 超范围等 |
| 无权限 | 403 | 非 org-admin 调用写接口 |
| 空审计 | 200 | 空数组 |

## 4. 页面设计

### 4.1 页面位置

- 路由: `/governance/policies/trust`
- 导入: 新增 lazy route + workspace 子路由

### 4.2 页面结构

**页面布局**: 使用 workspace 布局，Breadcrumb + 三个 Card 区域

**Card 1 - 当前生效策略**:
- 描述: 展示当前生效的信任策略
- 来源标签: `resolution_source`（"system_default" 或 "organization"）
- System Default 区块: 灰色背景，展示 6 个默认值
- Organization Override 区块: 如果有覆盖，展示覆盖值，高亮与默认不同的字段
- 如果无覆盖: 展示"未配置组织覆盖，使用系统默认"
- 更新信息: updated_by + updated_at

**Card 2 - 编辑组织策略** (仅 org-admin 可见):
- 描述: 编辑组织级信任策略覆盖
- Form 表单:
  - evidence_aging_hours: InputNumber, min=1, 步长 24
  - evidence_stale_hours: InputNumber, min=1, 步长 24
  - review_low_confidence_threshold: InputNumber(Slider), min=0.01, max=1, step=0.05
  - auto_review_after_validation: Switch
  - auto_validation_after_review_low_confidence: Switch
  - auto_validation_on_quality_recheck: Switch
- 按钮: "预览验证" + "保存"
- 预览验证: 调用 validate → 成功显示 normalized_policy 对比 → 确认后保存
- 保存: 调用 upsert → 成功后刷新 effective 和 organization
- 非 org-admin: 显示 Alert "仅组织管理员可编辑策略"

**Card 3 - 审计日志** (仅 org-admin 可见):
- 筛选: actor_user_id(Input) + action(Select) + 日期范围(DatePicker.RangePicker)
- Table: actor_user_id, actor_role, action, request_method, created_at, 操作(查看快照)
- 展开行: before_snapshot + after_snapshot JSON 对比
- 分页

### 4.3 交互流

1. 页面加载 → 并行请求 effective + organization
2. org-admin 看到 Card 1(只读) + Card 2(表单) + Card 3(审计)
3. 非 org-admin 只看到 Card 1(只读)
4. 编辑表单 → 点击"预览验证" → validate API → 显示归一化结果 → 确认 → upsert API → 刷新
5. 审计筛选/翻页 → 重新请求
6. 展开审计行 → 显示 before/after JSON diff

### 4.4 权限控制

- Card 2/3 仅 org-admin 可见
- org-admin 检测: 同 S08，从 localStorage auth context 读取

## 5. 文件变更范围

| 文件 | 动作 | 原因 |
|---|---|---|
| `src/types/api/benchmark.ts` | 修改 | 新增信任策略类型 + 枚举 + 配置常量 |
| `src/services/benchmark.ts` | 修改 | 新增 5 个 trust policy service 方法 |
| `src/pages/governance/TrustPolicyPage.tsx` | 新增 | 信任策略管理页面 |
| `src/router/routes.tsx` | 修改 | 新增 lazy import |
| `src/router/index.tsx` | 修改 | 新增 `/governance/policies/trust` 路由 |

核心文件 3 个（types + service + page），路由配置 2 个（各 1-2 行）。

## 6. 验收标准

- [ ] 页面在 `/governance/policies/trust` 可访问
- [ ] 展示当前生效策略（effective），标明来源
- [ ] 对比展示 system_default vs organization override
- [ ] 无组织覆盖时显示"未配置组织覆盖"
- [ ] org-admin 可见编辑表单
- [ ] org-admin 可编辑 6 个策略字段
- [ ] 预览验证: validate API → 显示结果 → 确认 → upsert
- [ ] validate 失败 → 显示错误详情（如 "stale must be > aging"）
- [ ] upsert 成功 → 刷新 effective 展示
- [ ] 审计日志表格含筛选（actor/action/date）和分页
- [ ] 审计展开行显示 before/after 快照
- [ ] 非 org-admin 不可见编辑/审计
- [ ] `npm run type-check` 通过
- [ ] `npm run build` 通过

## 7. 明确不做什么

1. 本 slice 不做决策策略管理（S10）。
2. 本 slice 不做质量策略管理（S14）。
3. 本 slice 不做策略批量导入/导出。
4. 本 slice 不做 before/after 的结构化 diff 展示（用 JSON pre 即可）。

## 8. 留给下一 Slice 的上下文

| 项目 | 内容 |
|---|---|
| 新增 service 方法 | `getEffectiveTrustPolicy`, `getOrganizationTrustPolicy`, `validateTrustPolicy`, `upsertTrustPolicy`, `listTrustPolicyAudits` |
| 新增类型 | `CaseGovernanceTrustPolicyProfile`, `ResolvedCaseGovernanceTrustPolicy`, `OrganizationGovernanceTrustPolicy`, `TrustPolicyValidationResult`, `TrustPolicyAuditLog` |
| 可复用模式 | 策略管理页面模式: effective 展示 + 编辑表单 + validate 预览 + audit 日志。S10/S14 可复用此模式 |
| 路由前缀 | `/governance/policies/` 下，trust 是第一个子路由 |

## 9. 实现记录

| 项目 | 内容 |
|---|---|
| 完成日期 | 2026-04-14 |
| 实际修改文件 | `src/types/api/benchmark.ts`, `src/services/benchmark.ts`, `src/pages/governance/TrustPolicyPage.tsx`, `src/router/routes.tsx`, `src/router/index.tsx` |
| 运行命令 | `npx tsc --noEmit` ✅, `npx vite build` ✅ |
| 遇到的问题 | 1. Spin 未使用 import → 移除; 2. navigate/useNavigate 未使用 → 移除; 3. Parameters<typeof>[1] 类型错误 → 改为 [0] |
| 与原方案的差异 | 无实质性差异 |

---

## 后端确认结论

1. 5 个端点，base path `/api/v1/benchmarks/governance/policies/`，trust 无额外子路径前缀（decision 有 `/decision/`）。
2. Effective 返回四层结构: effective(解析后) + system_default + organization(可null) + organization_meta(可null)。
3. Organization 策略不存在时 GET 返回 404，不是空对象。
4. Validate 成功返回 `{valid: true, normalized_policy: {...}}`，失败返回 400 `{detail, details}`。
5. Upsert 是全量写入（非 patch 语义），首次自动创建。
6. Audit view=summary 模式省略 snapshot 数据，可用于轻量列表。
7. 6 个策略字段全部有合理默认值，upsert 空体等同 noop。
