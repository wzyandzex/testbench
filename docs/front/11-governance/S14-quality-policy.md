# S14 - Quality Policy 管理

## Slice 基本信息

| 字段 | 内容 |
|---|---|
| Slice ID | S14 |
| 名称 | Quality Policy 管理 |
| 所属主线 | benchmark |
| 所属模块 | benchmark quality policy |
| 优先级 | P1 |
| 前置依赖 | S09 (复用策略页面模式), S10 (复用策略页面模式) |
| 当前状态 | 已完成 |

## 0. 目标

管理两种质量策略: 通用质量策略（6 维度开关 + block_on_high）和 LLM 质量策略（enabled/模型/维度/预算/并发/发布门）。支持 effective 策略查看、组织级策略编辑、LLM 策略预览验证、审计日志。

## 1. 为什么先做这个 Slice

1. S09/S10 已建立三段式策略页面模式（effective + 编辑 + 审计），S14 复用此模式。
2. S12/S13 的 LLM Quality 功能受策略控制，S14 提供策略管理界面。
3. S11 的治理总览引用策略来源标签，S14 完成策略闭环。

## 2. 后端调研记录

### 2.1 读取的后端代码

| 文件 | 结论 |
|---|---|
| `router.go` L569-580 | 8 个路由: quality policy 4 个 + llm policy 3 个 + capabilities 1 个 |
| `benchmark_handler.go` L3025-3460 | 7 个 handler: GetEffective/GetOrg/UpsertOrg/ListAudits + LLM GetOrg/Validate/UpsertOrg |
| `domain/quality_policy.go` | `OrganizationQualityPolicy`: 6 bool 维度 + block_on_high + updated_by + timestamps |
| `domain/llm_quality.go` L220-248 | `OrganizationLLMQualityPolicy`: 20+ 字段 (enabled/models/dimensions/budget/limits/release_gate) |
| `qualitygate/policy_resolver.go` | `ResolvedPolicy`: effective/system_default/organization/request + thresholds + weights |
| `qualitygate/types.go` L7-14 | 6 个质量维度常量: schema/semantic/executability/stability/security/compliance |
| `qualitygate/policy.go` L5-15 | 强制维度: schema/semantic/security（不能禁用） |
| `llm_quality.go` L1602-1808 | LLM 策略服务: GetOrganization/Validate/Upsert + 默认值 + 校验规则 |
| `quality_policy_audit_repository.go` | 审计日志结构: 与 S09/S10 同构（before/after snapshot） |

### 2.2 关键业务结论

1. **通用质量策略 7 个字段**: enable_schema/semantic/executability/stability/security/compliance + block_on_high。强制维度 (schema/semantic/security) 不能禁用。
2. **LLM 质量策略 20+ 字段**: enabled/allowed_models/default_model/default_dimensions + 4 个 delta 采样 + 3 个限制 + 3 个 release gate + post processors。
3. **Effective 端点** 返回三层: system_default/organization/request + decision_thresholds + weights。有查询参数 quality_mode 和 quality_dimensions。
4. **LLM 策略 Validate**: 与 PUT 相同的请求体，不持久化，返回合并后的策略预览或错误详情。
5. **审计日志**: 与 S09/S10 完全同构（before/after snapshot），仅有通用质量策略有审计（LLM 策略目前没有审计端点）。
6. **GET organization 无覆盖时**: 通用策略返回全 true 默认值；LLM 策略返回 enabled=false 默认值。

## 3. API 合同

### 3.1 接口列表

| 方法 | 路径 | 用途 | 权限 |
|---|---|---|---|
| GET | `/api/v1/quality/policies/effective` | 生效策略 | auth |
| GET | `/api/v1/quality/policies/organization` | 组织质量策略 | auth |
| PUT | `/api/v1/quality/policies/organization` | 更新策略 | org-admin |
| GET | `/api/v1/quality/policies/organization/audits` | 审计日志 | org-admin |
| GET | `/api/v1/quality/llm/policies/organization` | 组织 LLM 策略 | auth |
| POST | `/api/v1/quality/llm/policies/organization/validate` | 预览验证 | org-admin |
| PUT | `/api/v1/quality/llm/policies/organization` | 更新 LLM 策略 | org-admin |

### 3.2 请求参数

**Quality Policy Upsert body**:
```json
{
  "enable_executability": true,
  "enable_stability": false,
  "enable_compliance": true,
  "block_on_high": true
}
```
(所有字段为 `*bool` 可选，强制维度不可传 false)

**LLM Policy Upsert/Validate body**:
```json
{
  "enabled": true,
  "allowed_models": ["gpt-4", "claude-3"],
  "default_model": "gpt-4",
  "default_dimensions": ["semantic_depth", "reproducibility"],
  "allow_strict_mode": true,
  "daily_budget_usd": 10.0,
  "daily_request_limit": 100,
  "concurrent_job_limit": 3,
  "release_gate_enabled": true,
  "release_gate_block_risk": "high"
}
```
(20+ 可选字段，PATCH 式更新)

**Audits query**: 同 S09/S10（actor_user_id, action, created_from, created_to, view, page, page_size）

### 3.3 响应结构

**Effective**: `{ effective, system_default, organization?, request?, decision_thresholds, weights }`

**Organization Quality Policy**: `{ organization_id, enable_schema, enable_semantic, ..., block_on_high, updated_by, created_at, updated_at }`

**Organization LLM Policy**: `{ organization_id, enabled, allowed_models, default_model, ..., release_gate_block_risk, updated_by, created_at, updated_at }`

**Validate 成功**: 合并后的 `OrganizationLLMQualityPolicy`
**Validate 失败** (400): `{ "details": [{ "field": "...", "code": "...", "message": "..." }] }`

## 4. 页面设计

### 4.1 页面位置

- 路由: `/governance/policies/quality`

### 4.2 页面结构

**Tabs 布局 (两个 Tab)**:

**Tab 1 - 质量策略**:
- Card 1: 当前 Effective 策略
  - 6 个维度开关状态 (Tag: enabled 绿 / disabled 灰)
  - 强制维度标记 (星号)
  - Block On High 状态
  - 来源标签 (system_default / organization_override)
- Card 2: 编辑组织策略 (org-admin)
  - 6 个 Switch (强制维度 disabled)
  - Block On High Switch
  - 保存按钮
- Card 3: 审计日志 (org-admin)
  - 复用 S09/S10 审计日志模式

**Tab 2 - LLM 质量策略**:
- Card 1: 当前 LLM 策略 (只读)
  - Enabled 状态
  - Allowed Models / Default Model
  - Default Dimensions
  - 并发/预算/限制
  - Release Gate 配置
  - Delta 采样配置
- Card 2: 编辑 LLM 策略 (org-admin)
  - Enabled Switch
  - Allowed Models: TagInput / Select mode=tags
  - Default Model: Select (from allowed_models)
  - Default Dimensions: 多选 (from capabilities)
  - Allow Strict Mode: Switch
  - Daily Budget USD: InputNumber
  - Daily Request Limit: InputNumber
  - Concurrent Job Limit: InputNumber
  - Delta Sampling 配置: 4 个字段
  - Release Gate 配置: 3 个字段
  - 预览验证 + 保存按钮

### 4.3 交互流

1. 页面加载 → 并行请求 effective + organization policy + LLM policy
2. Tab 1 展示质量策略
3. Tab 2 展示 LLM 策略
4. org-admin 编辑 → 保存 → 刷新

### 4.4 权限控制

Card 2 (编辑) 仅 org-admin 可见。LLM 策略无审计端点，不显示审计 Card。

## 5. 文件变更范围

| 文件 | 动作 | 原因 |
|---|---|---|
| `src/types/api/benchmark.ts` | 修改 | 新增 Quality Policy + LLM Policy 类型 + 配置常量 |
| `src/services/benchmark.ts` | 修改 | 新增 7 个 service 方法 |
| `src/pages/governance-policies/quality/QualityPolicyPage.tsx` | 新增 | 质量策略管理页面 |
| `src/router/routes.tsx` | 修改 | 新增 lazy import |
| `src/router/index.tsx` | 修改 | 新增路由 |

核心文件 3 个 + 路由配置 2 个。

## 6. 验收标准

- [ ] 页面在 `/governance/policies/quality` 可访问
- [ ] Tab 1: 展示 effective 质量策略 + 6 维度 + Block On High
- [ ] Tab 1: 强制维度标记不可编辑
- [ ] Tab 1: org-admin 可编辑可选维度 + Block On High
- [ ] Tab 1: 审计日志含筛选和分页
- [ ] Tab 2: 展示 LLM 策略 (enabled/models/dimensions/limits/gate)
- [ ] Tab 2: org-admin 可编辑 LLM 策略
- [ ] Tab 2: 预览验证 + 保存
- [ ] `npm run type-check` 通过
- [ ] `npm run build` 通过

## 7. 明确不做什么

1. 本 slice 不做 Effective 策略的请求层收紧 (quality_mode 参数)。
2. 本 slice 不做 dimension template 的详细编辑（使用简化的文本输入）。
3. 本 slice 不做 post processors 的编辑（展示但不可编辑）。

## 8. 留给下一 Slice 的上下文

| 项目 | 内容 |
|---|---|
| 新增 service 方法 | `getEffectiveQualityPolicy`, `getOrganizationQualityPolicy`, `upsertOrganizationQualityPolicy`, `listQualityPolicyAudits`, `getOrganizationLLMQualityPolicy`, `validateLLMQualityPolicy`, `upsertOrganizationLLMQualityPolicy` |
| 新增类型 | `OrganizationQualityPolicy`, `ResolvedQualityPolicy`, `QualityPolicyAuditLog`, LLM policy 相关类型 (已在 S12 domain) |
| 可复用模式 | S09 三段式策略页面 + S10 Tabs 模式 |

## 9. 实现记录

| 项目 | 内容 |
|---|---|
| 完成日期 | 2026-04-14 |
| 实际修改文件 | `src/types/api/benchmark.ts`, `src/services/benchmark.ts`, `src/pages/governance-policies/quality/QualityPolicyPage.tsx`, `src/router/routes.tsx`, `src/router/index.tsx` |
| 运行命令 | `npx tsc --noEmit` ✅, `npx vite build` ✅ |
| 遇到的问题 | 无 |
| 与原方案的差异 | 无差异 |
