# S01 - Benchmark Cases 列表页

## Slice 基本信息

| 字段 | 内容 |
|---|---|
| Slice ID | S01 |
| 名称 | Benchmark Cases 列表页 |
| 所属主线 | benchmark |
| 所属模块 | benchmark case governance |
| 优先级 | P0 |
| 前置依赖 | 无 |
| 当前状态 | 待调研 → 方案待审批 |

## 0. 目标

用户可以在 Benchmark 详情页的 "Cases" Tab 中查看该 Benchmark 下的所有用例资产，并按状态筛选。

## 1. 为什么先做这个 Slice

1. 它属于 benchmark 治理主线的入口——cases list 是后续所有治理操作（detection/validation/review/fusion/lifecycle）的上游页面。
2. 它是 S02（case governance detail）、S03（detection）、S04（validation）的前置依赖，后续 slice 都需要从列表点击进入。
3. 前端目前完全没有任何 case 相关代码，必须从这里打地基。

## 2. 后端调研记录

### 2.1 读取的后端代码

| 文件 | 结论 |
|---|---|
| `internal/api/router/router.go` L621 | `benchmarks.GET("/:id/cases", r.benchmarkHandler.ListCaseAssets)`，挂在 orgAuthenticated 组下，Auth + OrgContext 中间件 |
| `internal/api/handler/benchmark_handler.go` L413-439 | `ListCaseAssets`：取 `:id` param + `X-Org-ID` + `page`/`page_size` query，调 service 返回 `([]*BenchmarkCaseAsset, int64, error)`，用 `SuccessPageResponse` |
| `internal/application/benchmark/case_asset_read.go` L10-25 | `ListCaseAssets`：校验 benchmark 存在且属于 org，normalize page/pageSize，调 repo `ListByBenchmarkID` |
| `internal/application/benchmark/case_asset_read.go` L71-86 | `normalizePage`：最小 1；`normalizePageSize`：最小 1，最大 200，默认 20 |
| `internal/domain/benchmark/case_asset.go` | `BenchmarkCaseAsset` 结构体，完整字段见下方 |

### 2.2 读取的辅助文档

| 文件 | 读到了什么 |
|---|---|
| `docs/item/03-benchmark/README.md` | 只覆盖 CRUD/审批/Fork，无 case 相关内容，对本次 slice 无用 |

### 2.3 代码与文档一致性判断

1. 以下信息全部从代码直接确认：路由路径、请求参数、响应 envelope、domain 模型字段、权限逻辑。
2. `docs/item/03-benchmark/API.md` 不包含 case 接口文档，不影响。
3. 无过期文档与代码冲突的情况。
4. 本 slice 以 `benchmark_handler.go:413-439`、`case_asset_read.go:10-25`、`case_asset.go` 作为准绳。

### 2.4 关键业务结论

1. **资源主键**: `id`（数据库主键），业务标识是 `case_key`（benchmark 内唯一）。
2. **状态机**: `active` → 可被 `inactive`/`retired`（lifecycle 操作在 S08）。当前 slice 只读不写，不需关心状态转换。
3. **authoritative vs degraded**: 此接口返回的是持久化的 case asset 记录，是 authoritative 数据。无 degraded 场景。
4. **权限**: 普通组织成员可读（`canRead` = visibilityService.CanView + org scope 校验）。不需要 org-admin。
5. **404 隐匿**: `canRead` 失败返回 `404001` "benchmark not found"（防枚举）。不是 403。

## 3. API 合同

### 3.1 接口列表

| 方法 | 路径 | 用途 | 是否需要 Org | 权限 |
|---|---|---|---|---|
| GET | `/api/v1/benchmarks/:id/cases` | 获取 benchmark 下的用例资产列表 | 是 | authenticated + canRead |

### 3.2 请求参数

- path: `id` — benchmark ID
- query: `page`（int，默认 1）、`page_size`（int，默认 20，最大 200）
- headers: `Authorization: Bearer {token}`、`X-Org-ID: {org_id}`（由 axios 拦截器自动注入）

### 3.3 响应结构

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "total": 45,
    "page": 1,
    "size": 20,
    "data": [
      {
        "id": "ca_abc123",
        "benchmark_id": "bm_xyz789",
        "organization_id": "org_001",
        "case_key": "test_function_add",
        "case_name": "Test Function Add",
        "source_scope": "file",
        "source_path": "tests/test_math.py",
        "case_type": "selector",
        "status": "active",
        "current_version": 3,
        "current_version_id": "cv_def456",
        "content_hash": "sha256:abcdef1234567890",
        "last_seen_benchmark_version": 5,
        "last_present_benchmark_version": 5,
        "lifecycle_source": "",
        "lifecycle_reason": "",
        "lifecycle_updated_by": "",
        "lifecycle_updated_at": null,
        "created_at": "2026-03-20T10:00:00Z",
        "updated_at": "2026-04-01T15:30:00Z"
      }
    ]
  }
}
```

补充：
1. 分页字段名：请求用 `page_size`，响应用 `size`。
2. 列表字段名：`data.data`。
3. 时间字段：`created_at`、`updated_at`、`lifecycle_updated_at`（可空）。
4. 枚举字段：`status`（active/inactive/retired）、`case_type`（selector/structured/assertion_body/assertion_line）。
5. 可空字段：`current_version_id`、`lifecycle_source`、`lifecycle_reason`、`lifecycle_updated_by`、`lifecycle_updated_at`、`case_name`。

### 3.4 错误与边界

1. 未登录 → 401（auth 中间件拦截）
2. 无组织上下文 → 400 "organization context required"（handler 显式返回）
3. 权限不足/不可见 → 404001 "benchmark not found"（canRead 失败，防枚举）
4. 资源不存在 → 404001 "benchmark not found"（service 层 loadBenchmark 失败）
5. 空数据 → code=0，`data.data` 为空数组 `[]`，`total` 为 0
6. 长任务未完成 → 不适用，此接口是同步读操作
7. degraded/compatibility → 不适用，纯 authoritative 读

## 4. 前端现状调研

### 4.1 现有入口

| 项目 | 结论 |
|---|---|
| 路由挂载位置 | `/benchmarks/:id` → `BenchmarkDetailPage`，无 case 路由 |
| 现有导航入口 | Benchmark 详情页有 4 个 Tab：Overview/Analytics/History/Settings，无 Cases Tab |
| 现有页面是否可扩展 | 是，在 Tab 组件中新增 "Cases" Tab 即可 |

### 4.2 可复用代码

| 类型 | 文件 | 复用方式 |
|---|---|---|
| service | `src/services/benchmark.ts` | 新增 `getCases` 方法 |
| store | `src/pages/benchmarks/store.ts` | 扩展，新增 caseList 状态 |
| component | `src/components/common/StatusBadge` | 复用 status 展示 |
| type | `src/types/api/benchmark.ts` | 扩展，新增 CaseAsset 类型 |

### 4.3 当前缺口

1. Benchmark 详情页（`BenchmarkDetailPage.tsx`）**全是 mock 数据**，但本次 slice 只加 Cases Tab，不改动其他 Tab。
2. 没有任何 case 相关的接口调用、类型定义、状态管理。
3. 现有 benchmark service 无 case 方法。
4. 无脱节问题（因为没有已存在的 case 代码）。

## 5. 页面设计

### 5.1 页面位置

- 路由：复用现有 `/benchmarks/:id`，不新增路由
- 页面入口：BenchmarkDetailPage 的 Tab 栏，新增 "Cases" Tab（放在 Overview 之后）
- 页面层级：Tab 级别，不是独立页面

### 5.2 页面结构

1. **Tab 头**: "Cases" tab 项（新增）
2. **筛选区**: 状态筛选下拉（全部/active/inactive/retired）+ 搜索框（按 case_key/case_name 模糊搜索，前端本地过滤，后端不支持搜索参数）
3. **主内容区**: Ant Design Table，列定义：
   - `case_key` — 文本列，可点击跳转到 case 详情（S02）
   - `case_name` — 文本列，无则显示 case_key
   - `case_type` — Tag 列（selector=蓝/structured=绿/assertion_body=橙/assertion_line=紫）
   - `source_path` — 文本列，代码路径
   - `status` — Tag 列（active=绿/inactive=灰/retired=红）
   - `current_version` — 数字列
   - `updated_at` — 日期列，dayjs 格式化
4. **操作区**: 暂无（lifecycle 操作在 S08）
5. **分页区**: 标准分页

### 5.3 交互流

1. 用户点击 "Cases" Tab → 以 benchmark_id 调用 `GET /benchmarks/:id/cases?page=1&page_size=20`。
2. 加载中显示 Table loading 骨架。
3. 数据返回后渲染表格。
4. 用户切换状态筛选 → 前端本地过滤（后端不支持 status 参数筛选）。
5. 用户点击分页 → 重新请求对应 page。
6. 用户点击某行 case_key → 后续跳转到 S02 的 case 详情页（本次 slice 只做占位，S02 实现后启用跳转）。
7. API 返回非 0 code → message.error 显示错误提示。
8. 列表为空 → EmptyState 组件。

## 6. 数据与状态设计

### 6.1 页面状态

1. loading — 首次加载/翻页时
2. refreshing — 不需要（同步接口）
3. submitting — 不需要（只读）
4. empty — total === 0
5. error — API 返回非 0 或网络错误
6. degraded — 不适用

### 6.2 字段映射

| 后端字段 | 前端字段/组件 | 备注 |
|---|---|---|
| `id` | 内部使用，不展示 | 行 key |
| `case_key` | 文本列，可点击 | 唯一业务标识 |
| `case_name` | 文本列 | omitempty，无值时显示 case_key |
| `source_scope` | 不展示 | 内部字段 |
| `source_path` | 文本列 | 代码路径 |
| `case_type` | Tag 组件 | 4 种枚举值 |
| `status` | Tag 组件 | 3 种枚举值 |
| `current_version` | 数字列 | 当前版本号 |
| `content_hash` | 不展示 | 内部字段 |
| `updated_at` | 日期列 | dayjs 格式化 |
| `created_at` | 不展示 | 可在 tooltip 中显示 |

### 6.3 长任务机制

不适用。此接口是同步读操作。

## 7. 文件变更范围

| 文件 | 动作 | 原因 |
|---|---|---|
| `src/types/api/benchmark.ts` | 修改 | 新增 `BenchmarkCaseAsset` 类型、`CaseAssetStatus`/`CaseAssetType` 枚举 |
| `src/services/benchmark.ts` | 修改 | 新增 `getCases(id, params)` 方法 |
| `src/pages/benchmarks/BenchmarkDetailPage.tsx` | 修改 | 新增 Cases Tab，包含表格和筛选 |

注意：只改 3 个文件，不新建独立页面。Cases Tab 内嵌在现有详情页中。

## 8. 验收标准

- [ ] 页面不再依赖 mock 数据（Cases Tab 使用真实 API）。
- [ ] 接口路径 `GET /benchmarks/:id/cases`，参数 `page`/`page_size`，响应字段 `total`/`page`/`size`/`data` 与后端代码一致。
- [ ] `Authorization` 与 `X-Org-ID` 由拦截器自动注入。
- [ ] 权限不足返回 404001 时显示 "未找到该评测" 提示（不是 403）。
- [ ] loading / empty / error 状态完整。
- [ ] 分页可工作，翻页正确请求对应 page。
- [ ] 状态筛选（前端本地过滤）可工作。
- [ ] `npm run type-check` 通过。

## 9. 明确不做什么

1. 本 slice 不做 case 详情页（S02 的工作）。
2. 本 slice 不做 lifecycle 操作（退休/恢复，S08 的工作）。
3. 本 slice 不做 detection/validation/review/fusion 相关展示（后续 slice）。
4. 本 slice 不改动其他 4 个 Tab（Overview/Analytics/History/Settings），保持原样。
5. 本 slice 不做 case_key 点击跳转（只做视觉上的可点击样式，跳转在 S02 启用）。
6. 本 slice 不做后端状态筛选参数（后端当前不支持 status query，前端本地过滤）。

## 10. 留给下一 Slice 的上下文

实现完成后回填。

| 项目 | 内容 |
|---|---|
| 新增 service 方法 | `benchmarkService.getCases(benchmarkId, params)` 返回 `PaginatedResponse<BenchmarkCaseAsset>` |
| 新增/修改 store | 未新建独立 store，状态直接在 BenchmarkDetailPage 组件内管理 |
| 新增路由 | 无，复用 `/benchmarks/:id`，Cases Tab 内嵌 |
| 新增类型 | `BenchmarkCaseAsset`, `CaseAssetStatus`, `CaseAssetType`, `CASE_ASSET_STATUS_CONFIG`, `CASE_ASSET_TYPE_CONFIG` |
| 可复用组件 | Cases Tab 内的 Table + Select 筛选结构可被后续 Tab 参考 |
| 已知遗留问题 | 1. case_key 点击跳转在 S02 实现后启用; 2. 后端不支持 status query 参数，前端本地过滤 |

## 11. 实现记录

| 项目 | 内容 |
|---|---|
| 完成日期 | 2026-04-13 |
| 实际修改文件 | `src/types/api/benchmark.ts`, `src/services/benchmark.ts`, `src/pages/benchmarks/BenchmarkDetailPage.tsx` |
| 运行命令 | `npx tsc --noEmit` ✅, `npx vite build` ✅ |
| 遇到的问题 | 1. axios 拦截器已 unwrap body.data，getCases 返回类型需 `as unknown as PaginatedResponse` 适配; 2. ThemeTokens 无 colorPrimary，改用 `theme.useToken()` |
| 与原方案的差异 | 无实质性差异，3 个文件精确匹配 |

---

## 后端确认结论

1. 本 slice 消费的是 benchmark 治理主线中的 case asset 列表能力。
2. 路由路径、请求参数（page/page_size）、响应结构（total/page/size/data）、domain 模型字段全部从 `benchmark_handler.go`、`case_asset_read.go`、`case_asset.go` 代码确认。
3. 无过期文档冲突。`docs/item/03-benchmark/` 不包含 case 接口文档，不影响。
4. 后端当前不支持 status 筛选参数，前端采用本地过滤方案。如果后续后端增加 status query 参数，前端 service 层可以透明切换。
