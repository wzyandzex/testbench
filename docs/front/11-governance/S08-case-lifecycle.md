# S08 - Case 生命周期操作

## Slice 基本信息

| 字段 | 内容 |
|---|---|
| Slice ID | S08 |
| 名称 | Case 生命周期操作 |
| 所属主线 | benchmark |
| 所属模块 | benchmark case governance |
| 优先级 | P1 |
| 前置依赖 | S01 |
| 当前状态 | 已完成 |

## 0. 目标

用户（org-admin）可以在 Benchmark 详情页的 Cases 列表中执行生命周期操作：单个/批量退休、单个/批量恢复、重新提取。所有操作需 reason（退休/恢复必填），有二次确认。

## 1. 为什么先做这个 Slice

1. 生命周期操作是治理管理的"执行层"，完成 S08 后 Case 治理子页面（S01-S08）全部结束。
2. 退休/恢复影响用例是否参与验证和审查，是治理闭环的关键操作。
3. 权限要求高（org-admin），前端需要明确区分权限可见性。

## 2. 后端调研记录

### 2.1 读取的后端代码

| 文件 | 结论 |
|---|---|
| `router.go` L622-624,646-647 | 5 个写路由: POST reextract/retire/restore(批量) + POST :caseKey/retire/restore(单个)，全部 `RequireOrgAdmin()` |
| `benchmark_handler.go` L441-452 | 请求体: `ReextractRequest{reason}`, `LifecycleRequest{reason}`, `BatchLifecycleRequest{case_keys,reason}` |
| `benchmark_handler.go` L459-489 | `ReextractBenchmarkCases`: body 可选(reason 默认"手动 benchmark case 重新提取"), 返回 SyncResult |
| `benchmark_handler.go` L492-523 | `RetireBenchmarkCase`: path :caseKey, body 可选(reason 必填在 service 层), 返回更新后的 CaseAsset |
| `benchmark_handler.go` L526-557 | `BatchRetireBenchmarkCases`: body 必填(case_keys+reason), 返回 BatchResult |
| `benchmark_handler.go` L560-591 | `RestoreBenchmarkCase`: 同 retire 模式 |
| `benchmark_handler.go` L594-625 | `BatchRestoreBenchmarkCases`: 同 batch retire 模式 |
| `case_governance.go` L82-140 | 单个 retire: reason 必填, 幂等(已 retired→409), 事务内更新+审计 |
| `case_governance.go` L142-205 | 单个 restore: reason 必填, 前置(must be retired), 智能目标状态(active/inactive 取决于版本) |
| `case_governance.go` L207-248 | 批量 retire/restore: 委托 `batchUpdateBenchmarkCaseLifecycle` |
| `case_governance.go` L455-547 | 批量引擎: reason 必填, normalizeCaseKeyList(去重去空), 上限 200, 原子性(全成功或全失败), `SELECT FOR UPDATE` |
| `case_governance.go` L28-80 | Reextract: 完全重新同步(非状态转换), 调用 `caseAssetSyncer.SyncBenchmarkCases` |
| `org_context.go` L102-112 | `RequireOrgAdmin()`: 检查 `role == organization.RoleAdmin` |

### 2.2 关键业务结论

1. **权限: RequireOrgAdmin**: 路由层强制 org-admin，处理器内还有 canWrite 二次检查。
2. **Retire/Restore reason 必填**: service 层验证，空 reason → 400。
3. **幂等性**: 已 retired 的 case 再次 retire → 409；非 retired 的 case restore → 409。
4. **批量原子性**: 所有 case 验证通过才执行，任一失败全回滚。
5. **批量上限**: 200 个 case。
6. **Reextract 与 retire/restore 本质不同**: reextract 是完全重新同步（重新解析 benchmark 配置提取所有 case），不是状态转换。
7. **Restore 智能目标状态**: 恢复后根据 `PresentInBenchmarkVersion` 决定 active 还是 inactive。

## 3. API 合同

### 3.1 接口列表

| 方法 | 路径 | 用途 | 权限 |
|---|---|---|---|
| POST | `/api/v1/benchmarks/:id/cases/:caseKey/retire` | 单个退休 | org-admin |
| POST | `/api/v1/benchmarks/:id/cases/:caseKey/restore` | 单个恢复 | org-admin |
| POST | `/api/v1/benchmarks/:id/cases/retire` | 批量退休 | org-admin |
| POST | `/api/v1/benchmarks/:id/cases/restore` | 批量恢复 | org-admin |
| POST | `/api/v1/benchmarks/:id/cases/reextract` | 重新提取 | org-admin |

### 3.2 请求参数

**单个 Retire/Restore**:
- path: `id`, `caseKey`
- body(可选): `{ "reason": "..." }`

**批量 Retire/Restore**:
- path: `id`
- body: `{ "case_keys": ["key1", "key2"], "reason": "..." }`

**Reextract**:
- path: `id`
- body(可选): `{ "reason": "..." }`

### 3.3 响应结构

**单个**: `SuccessResponse` → 更新后的 `BenchmarkCaseAsset`

**批量**: `SuccessResponse` → `{ benchmark_id, action, updated_count, case_keys, items }`

**Reextract**: `SuccessResponse` → `{ Created, Versioned, Reactivated, Deactivated, Unchanged }`

### 3.4 错误与边界

| 错误 | HTTP | 场景 |
|---|---|---|
| reason 为空 | 400 | retire/restore 必须 reason |
| case_keys 为空 | 400 | 批量操作无选中 |
| 超过 200 | 400 | 批量上限 |
| 已 retired | 409 | 重复 retire |
| 非 retired | 409 | restore 非 retired 的 case |
| 无权限 | 403 | 非 org-admin |
| case 不存在 | 404 | case_key 找不到 |

## 4. 页面设计

### 5.1 页面位置

- 在 S01 Cases Tab 的 Table 上方/下方添加操作按钮
- 不新增 Collapse，直接修改现有 Cases Table

### 5.2 页面结构

**Cases Table 顶部操作栏**:
1. 左侧: 状态筛选 Select（已有）
2. 右侧: 批量操作按钮组（仅 org-admin 可见）:
   - "批量退休" — 选中 case 后可用，需二次确认 Modal
   - "批量恢复" — 选中 case 后可用，需二次确认 Modal
   - "重新提取" — 无需选中，直接触发，需二次确认

**Cases Table 行操作**:
- 新增"操作"列:
  - "退休" 按钮 — status=active 时显示
  - "恢复" 按钮 — status=retired 时显示
  - 点击后弹出确认 Modal（含 reason 输入）

**确认 Modal**:
- 标题: "确认退休 N 个用例" / "确认恢复 N 个用例" / "确认重新提取"
- 原因输入框（retire/restore 必填，reextract 可选）
- 确认按钮 → 调用 API → 成功后刷新列表
- 显示错误（409 已 retired 等）

### 5.3 权限控制

- 批量操作按钮组: 仅 org-admin 可见，非 org-admin 隐藏
- 行操作按钮: 同上
- 当前用户 org-admin 状态从 auth context 获取

### 5.4 交互流

1. org-admin 用户打开 Cases Tab → 看到操作按钮
2. 选中若干 case → "批量退休" 可点击 → Modal → 输入 reason → 确认 → API → 刷新
3. 点击某行的"退休" → Modal → 输入 reason → 确认 → API → 刷新
4. 点击"重新提取" → Modal → 可选 reason → 确认 → API → 刷新
5. 非 org-admin → 操作按钮不显示

## 6. 文件变更范围

| 文件 | 动作 | 原因 |
|---|---|---|
| `src/services/benchmark.ts` | 修改 | 新增 5 个 lifecycle service 方法 |
| `src/pages/benchmarks/BenchmarkDetailPage.tsx` | 修改 | Cases Table 新增行选择+操作按钮+确认 Modal |

注意：不需要新增 types（复用 S01 已有的 `BenchmarkCaseAsset`），不需要修改 types 文件。**只需修改 2 个文件。**

## 7. 验收标准

- [ ] org-admin 可见批量操作按钮组（批量退休/批量恢复/重新提取）
- [ ] 非 org-admin 不可见操作按钮
- [ ] Cases Table 支持行选择（checkbox）
- [ ] 选中 case 后批量按钮可用
- [ ] 点击"批量退休"→ 确认 Modal(reason 必填) → 调用 API → 刷新列表
- [ ] 点击"批量恢复"→ 同上
- [ ] 点击"重新提取"→ 确认 Modal(reason 可选) → 调用 API → 刷新列表
- [ ] 行操作: active 行显示"退休"按钮，retired 行显示"恢复"按钮
- [ ] 点击行操作 → 确认 Modal(reason 必填) → 调用 API → 刷新
- [ ] 409 错误（已 retired/非 retired）→ message.error 提示
- [ ] 空选择/空 reason → 按钮禁用或 Modal 验证
- [ ] `npm run type-check` 通过
- [ ] `npm run build` 通过

## 8. 明确不做什么

1. 本 slice 不做 lifecycle audit 的完整分页展示（S02 Drawer 已有内嵌 10 条）。
2. 本 slice 不做 batch result 的详细展示（成功后刷新列表即可）。
3. 本 slice 不做 reextract 的进度追踪（同步操作，直接等待结果）。

## 10. 留给下一 Slice 的上下文

| 项目 | 内容 |
|---|---|
| 新增 service 方法 | `retireCase`, `restoreCase`, `batchRetireCases`, `batchRestoreCases`, `reextractCases` |
| 新增类型 | 无，复用 S01 已有类型 |
| 可复用组件 | Lifecycle 确认 Modal (reason 输入 + danger 样式) |
| 已知遗留问题 | 1. org-admin 检测从 localStorage auth context 读取，如果 auth 结构变化需调整; 2. reextract 是同步操作，大数据量时可能超时; 3. 批量操作无客户端 200 上限校验（依赖后端 400） |

## 11. 实现记录

| 项目 | 内容 |
|---|---|
| 完成日期 | 2026-04-14 |
| 实际修改文件 | `src/services/benchmark.ts`, `src/pages/benchmarks/BenchmarkDetailPage.tsx` |
| 运行命令 | `npx tsc --noEmit` ✅, `npx vite build` ✅ |
| 遇到的问题 | 无 |
| 与原方案的差异 | 只修改 2 个文件（无需改 types），比原方案更精简 |

---

## 后端确认结论

1. 所有 lifecycle 写操作需要 `RequireOrgAdmin()` 中间件，不是普通 canWrite。
2. Retire/Restore 的 reason 在 service 层必填验证，空 reason → 400。
3. 批量操作原子性：全部验证通过才执行，任一失败全回滚。
4. 批量上限 200 个 case，前端需做客户端限制。
5. Reextract 是完全重新同步，与 retire/restore 状态转换本质不同。
6. Restore 智能目标状态：active 还是 inactive 取决于 case 是否在当前 benchmark 版本中存在。
7. 已 retired → 再次 retire → 409；非 retired → restore → 409。
