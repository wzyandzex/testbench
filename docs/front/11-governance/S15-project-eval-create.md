# S15 - Project Eval 源上传+运行创建

## Slice 基本信息

| 字段 | 内容 |
|---|---|
| Slice ID | S15 |
| 名称 | Project Eval 源上传+运行创建 |
| 所属主线 | projecteval |
| 所属模块 | project evaluation create |
| 优先级 | P1 |
| 前置依赖 | 无 |
| 当前状态 | 已完成 |

## 0. 目标

用户可以创建评测源（Git 仓库或 ZIP 包）并基于源创建评测运行（自动生成计划）。页面提供 Capabilities 驱动的表单（项目类型/运行模式/范围）。

## 1. 为什么先做这个 Slice

1. Project Eval 是独立于 benchmark 治理的评测主线，S15 是入口页面。
2. S16 (计划确认+证据) 依赖 S15 创建的 Run。
3. Capabilities 端点驱动表单选项，与 S12 的 capabilities 模式一致。

## 2. 后端调研记录

### 2.1 读取的后端代码

| 文件 | 结论 |
|---|---|
| `router.go` L375-397 | 20 个 project-evals 路由，S15 范围: POST sources, POST runs, GET capabilities |
| `project_eval_handler.go` L119 | CreateSource: 请求体含 name/source_type/git_url+commit_sha 或 zip_object_key+archive_sha256 |
| `project_eval_handler.go` L203 | CreateRun: source_id/mode/project_type/scope/changed_files/candidate_benchmark_ids |
| `project_eval_handler.go` L876 | GetCapabilities: 返回 project_types/run_modes/scopes/dimensions |
| `projecteval/entry.go` L27-120 | CreateSource + CreateRun 服务: 验证身份→检测类型→生成计划→创建记录 |
| `projecteval/policy.go` L30 | Capabilities: 根据策略过滤 project_types/modes/scopes/dimensions |
| `domain/projecteval/model.go` | Source: 15 字段; Run: 25+ 字段 |
| `projecteval/capabilities_types.go` | Capabilities: 5 个维度(functionality/reliability/security/maintainability/performance) |

### 2.2 关键业务结论

1. **Source 两种类型**: `git`(需 git_url + commit_sha) 或 `zip`(需 zip_object_key + archive_sha256)。
2. **auto_run 已禁用**: CreateSource 拒绝 auto_run=true，运行创建始终是单独一步。
3. **Run 创建流程**: CreateSource → CreateRun(生成计划, status="planned") → ConfirmRun(S16 范围)。
4. **Run 请求体**: source_id(必填) + mode(advisory/strict) + project_type + scope(full/delta) + changed_files(delta 时必填)。
5. **Capabilities**: 策略驱动的 project_types/run_modes/scopes/dimensions 列表，用于构建表单。
6. **5 个内置维度**: functionality(0.28)/reliability(0.22)/security(0.22)/maintainability(0.16)/performance(0.12)。
7. **每日/并发限制**: CreateRun 检查每日预算; ConfirmRun 检查并发限制(S16 范围)。

## 3. API 合同

### 3.1 接口列表

| 方法 | 路径 | 用途 | 权限 |
|---|---|---|---|
| GET | `/api/v1/project-evals/capabilities` | 查询能力 | auth+org |
| POST | `/api/v1/project-evals/sources` | 创建源 | auth+org |
| POST | `/api/v1/project-evals/runs` | 创建运行 | auth+org |

### 3.2 请求参数

**CreateSource body**:
```json
{
  "name": "my-project",
  "source_type": "git",
  "git_url": "https://github.com/org/repo",
  "branch": "main",
  "commit_sha": "abc123",
  "project_type": "backend",
  "mode": "advisory"
}
```
或 zip 类型:
```json
{
  "name": "my-project",
  "source_type": "zip",
  "zip_object_key": "uploads/xxx.zip",
  "archive_sha256": "sha256hex...",
  "project_type": "frontend"
}
```

**CreateRun body**:
```json
{
  "source_id": "uuid",
  "mode": "advisory",
  "project_type": "backend",
  "scope": "full"
}
```

### 3.3 响应结构

**Source**: `{ id, organization_id, name, source_type, git_url, branch, commit_sha, detected_type, metadata, created_by, created_at, updated_at }`

**Run**: `{ id, source_id, organization_id, created_by, status("planned"), mode, scope, project_type, plan_version, plan_json, created_at, ... }`

**Capabilities**: `{ project_types[], run_modes[], scopes[], dimensions[{name, default_weight, description, ...}], active_dimensions[] }`

## 4. 页面设计

### 4.1 页面位置

- 路由: `/project-eval/create`

### 4.2 页面结构

**Steps 布局 (两步)**:

**Step 1 - 创建源**:
- Form:
  - Name: Input (必填)
  - Source Type: Radio (git / zip)
  - Git 类型:
    - Git URL: Input (必填)
    - Branch: Input (可选)
    - Commit SHA: Input (必填, 6-64 hex)
  - Zip 类型:
    - Object Key: Input (必填)
    - Archive SHA256: Input (必填, 64 hex)
  - Project Type: Select (从 capabilities, 可选)
  - Mode: Select (从 capabilities, 可选)
- 提交 → 返回 Source ID → 自动进入 Step 2

**Step 2 - 创建运行**:
- Form:
  - Source ID: 显示 (从 Step 1 传入)
  - Mode: Select (advisory/strict, 从 capabilities)
  - Project Type: Select (从 capabilities)
  - Scope: Select (full/delta, 从 capabilities)
  - Changed Files: 当 scope=delta 时显示, TagInput
- 提交 → 返回 Run (status=planned) → 跳转 S16 详情页

**右侧面板 - Capabilities 信息**:
- 支持的项目类型
- 支持的运行模式
- 支持的范围
- 5 个维度及其权重

### 4.3 交互流

1. 页面加载 → 获取 capabilities
2. Step 1 填写源信息 → 提交 → 获得 source_id
3. 自动进入 Step 2 → 填写运行参数 → 提交 → 获得 run_id
4. 跳转到 `/project-eval/:runId` (S16 页面)

### 4.4 权限控制

- 所有端点仅需 auth + org context

## 5. 文件变更范围

| 文件 | 动作 | 原因 |
|---|---|---|
| `src/types/api/project-eval.ts` | 新增 | Project Eval 类型定义 |
| `src/services/project-eval.ts` | 新增 | Project Eval service 方法 |
| `src/pages/project-eval/ProjectEvalCreatePage.tsx` | 新增 | 创建页面 |
| `src/router/routes.tsx` | 修改 | 新增 lazy import |
| `src/router/index.tsx` | 修改 | 新增路由 |

核心文件 3 个 + 路由配置 2 个。新建独立的类型和服务文件（与 benchmark 分离）。

### 5.1 新增类型清单

```typescript
export type SourceType = 'git' | 'zip';
export type ProjectType = 'backend' | 'frontend' | 'llm_app' | 'agent' | 'unknown';
export type RunMode = 'advisory' | 'strict';
export type EvaluationScope = 'full' | 'delta';

export interface ProjectEvalSource {
  id: string;
  organization_id: string;
  name: string;
  source_type: SourceType;
  git_url?: string;
  branch?: string;
  commit_sha?: string;
  zip_object_key?: string;
  archive_sha256?: string;
  detected_type?: string;
  detection_info?: unknown;
  metadata?: Record<string, unknown>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectEvalRun {
  id: string;
  source_id: string;
  organization_id: string;
  created_by: string;
  approved_by?: string;
  status: string;
  mode: RunMode;
  scope: EvaluationScope;
  project_type: ProjectType;
  template_version?: string;
  plan_version: number;
  plan?: unknown;
  report?: unknown;
  score: number;
  decision: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectEvalCapabilities {
  project_types: string[];
  run_modes: string[];
  scopes: string[];
  dimensions: {
    name: string;
    default_weight: number;
    description: string;
    cost_class: string;
    enabled: boolean;
    effective_weight: number;
  }[];
  active_dimensions: string[];
}

export interface CreateSourceRequest {
  name: string;
  source_type: SourceType;
  git_url?: string;
  branch?: string;
  commit_sha?: string;
  zip_object_key?: string;
  archive_sha256?: string;
  project_type?: ProjectType;
  mode?: RunMode;
}

export interface CreateRunRequest {
  source_id: string;
  mode?: RunMode;
  project_type?: ProjectType;
  scope?: EvaluationScope;
  changed_files?: string[];
}
```

## 6. 验收标准

- [ ] 页面在 `/project-eval/create` 可访问
- [ ] Step 1: Git 源创建表单 (url/branch/commit)
- [ ] Step 1: Zip 源创建表单 (object_key/sha256)
- [ ] Step 1: Source Type 切换显示不同字段
- [ ] Step 2: 运行创建表单 (mode/type/scope)
- [ ] Step 2: Scope=delta 时显示 changed_files
- [ ] Capabilities 驱动表单选项
- [ ] 创建成功后跳转到运行详情页
- [ ] `npm run type-check` 通过
- [ ] `npm run build` 通过

## 7. 明确不做什么

1. 本 slice 不做文件上传 UI（zip 场景假设 object_key 已有）。
2. 本 slice 不做运行确认/审批 (S16 范围)。
3. 本 slice 不做已创建源/运行的列表（后续 slice）。
4. 本 slice 不做项目类型自动检测的 UI 展示。

## 8. 留给下一 Slice 的上下文

| 项目 | 内容 |
|---|---|
| 新增 service 方法 | `getProjectEvalCapabilities`, `createProjectEvalSource`, `createProjectEvalRun` |
| 新增类型 | `ProjectEvalSource`, `ProjectEvalRun`, `ProjectEvalCapabilities`, `CreateSourceRequest`, `CreateRunRequest` |
| 新增 service 文件 | `src/services/project-eval.ts`（独立于 benchmark.ts） |
| 新增类型文件 | `src/types/api/project-eval.ts`（独立于 benchmark.ts） |
| 页面路由 | `/project-eval/create` |

## 9. 实现记录

| 项目 | 内容 |
|---|---|
| 完成日期 | 2026-04-14 |
| 实际修改文件 | `src/types/api/project-eval.ts`(新), `src/services/project-eval.ts`(新), `src/pages/project-eval/ProjectEvalCreatePage.tsx`(新), `src/router/routes.tsx`, `src/router/index.tsx` |
| 运行命令 | `npx tsc --noEmit` ✅, `npx vite build` ✅ |
| 遇到的问题 | 无 |
| 与原方案的差异 | 无差异 |
