# 前后端对接开发方法论

> 版本: v3 (2026-04-13)
> 真相源: 后端实际代码 > integration/test 行为 > contracts/README/API.md > plans/历史文档
> 主线: benchmark(case governance) → projecteval(entry/HITL/report) → repairrun(action) → replay → governance feedback

## 核心定位

当前项目的中心不是"把页面做出来"，而是**把前端做成后端主线的稳定消费层**。

前端如果不按主线开发，最容易出现四类偏差：

1. 继续做 mock 驱动页面，真实接口接不上。
2. 只看 plan 文档猜接口，字段和状态机理解偏掉。
3. 忽略组织作用域、权限、404 隐匿、degraded/authoritative 区分。
4. 先做视觉壳和旧垂直能力，主线页面反而缺失。

## 强制规则

1. 后端实际代码是第一真相源；文档只能辅助定位，不能替代代码确认。
2. 一个 slice 只交付一个用户可见能力，不做大而全页面重做。
3. 真实业务页面禁止保留 mock 数据；mock 只允许存在于 preview/demo 页面。
4. 所有 org 作用域接口都必须明确 `X-Org-ID`、权限角色和 404 隐匿语义。
5. 所有长任务都必须明确是轮询、WebSocket 还是手动刷新，不能"默认会更新"。
6. 页面必须区分 authoritative vs degraded、mainline vs compatibility、empty vs no-permission vs not-found。
7. 一个 slice 不通过验收，不进入下一个 slice。

### 冲突处理

1. 如果 `docs/item`、`docs/front`、`docs/plans` 与后端代码不一致，以代码为准。
2. 如果代码路径不够清晰，再看对应集成测试和 handler 测试确认行为。
3. 如果文档明显过期，要在 slice 文档里显式标记"文档已失效，以代码为准"。

## 文件结构

```
后端仓库:
docs/front/11-delivery/
└── backend-driven-frontend-slice-template.md   # 模板源文件

前端仓库:
docs/front/
├── METHODOLOGY.md          # 本文件：方法论说明
├── SLICE-TEMPLATE.md       # 与后端模板同步的 slice 模板
├── PROGRESS.md             # 进度追踪（所有 slice 状态 + 上下文传递记录）
└── 11-governance/          # 治理子系统 slice 方案
    ├── S01-benchmark-cases-list.md
    └── ...
```

## 开发优先级

按当前项目定位，前端优先级固定为：

1. `benchmark` 治理主线：cases list → case governance detail → validation/review/fusion → lifecycle actions
2. 治理策略与组织级治理总览
3. `projecteval` 主线：source/run create → plan/confirm/evidence → report/explain/insights
4. `repairrun` 主线
5. dashboard 真实数据替换

不建议优先做：

1. 纯视觉重构
2. 兼容性旧垂直能力扩展
3. 大而全首页重做
4. 没有真实后端闭环的"先占坑页面"

## 工作流程

```
┌───────────┐    ┌──────────┐    ┌──────────┐    ┌──────────┐
│  Step 0   │───>│  Step 1  │───>│  Step 2  │───>│  Step 3  │
│ 深度调研  │    │ 方案编写 │    │ 方案审批 │    │ 实现+验证│
│           │    │ +审批    │    │          │    │ +上下文  │
└───────────┘    └──────────┘    └──────────┘    └──────────┘
```

### Step 0: 深度调研

**调研不充分，不动笔写方案。**

#### 0.1 后端代码真相源（必读顺序）

1. `internal/api/router/router.go` — 路径、方法、中间件、权限
2. `internal/api/handler/*_handler.go` — request 参数绑定、response 构建
3. `internal/application/*` — 业务逻辑、返回数据结构
4. `internal/domain/*` — 字段含义、状态机、边界条件
5. `tests/integration/*` 或模块测试 — 行为有歧义时以测试为准

#### 0.2 辅助文档（仅辅助定位，不替代代码）

- `docs/item/00-overview/contracts/` — 契约文件
- `docs/item/00-overview/FRONTEND-INTEGRATION.md` — 请求封装模板
- `docs/item/00-overview/PERMISSION-MATRIX.md` — 权限矩阵
- 各模块 `README.md` / `API.md`

注意：如果文档与代码冲突，只能当"待修正文档"。禁止从 `docs/plans` 直接提取接口字段。

#### 0.3 前端现状

1. 前端路由文件
2. 对应模块现有 `service.ts`
3. 对应模块现有 `store.ts`
4. 对应可复用组件
5. 现有请求层和 org 上下文注入方式

#### 0.4 前序 Slice 状态

如果有前置依赖的 slice：

1. 读 PROGRESS.md 中前序 slice 的状态和上下文传递记录
2. 读前序 slice 的方案文档，特别是"留给下一 Slice 的上下文"
3. 读前序 slice 实际修改的文件，确认代码的真实状态
4. 如果前序 slice 未完成，本 slice 方案中依赖部分标注"待确认"

**核心：不了解前序 slice 的实际代码，不写新方案。**

#### 0.5 代码与文档一致性判断

调研完成后，必须在 slice 方案中写一段：

1. 哪些信息是代码直接确认的
2. 哪些文档仍然可信
3. 哪些文档已经过期或与代码不一致
4. 本 slice 最终以哪些代码文件作为准绳

---

### Step 1: 方案编写

基于 Step 0 的深度调研，复制 `SLICE-TEMPLATE.md` 填写方案。

方案必须包含：
- 后端调研记录（读了什么代码、得出什么结论）
- 代码与文档一致性判断
- API 合同（从 handler 代码提取，不是从文档抄）
- 前端现状调研（可复用什么、缺口在哪）
- 关键业务结论（主键、状态机、authoritative/degraded、权限、404 隐匿）
- 长任务机制（轮询/WebSocket/手动刷新）
- 明确不做什么
- 后端确认结论

### Step 2: 方案审批

wzy 审阅，审核口径：

1. 这个页面是不是主线能力，不是旁枝？
2. API/字段/状态是不是从真实后端代码确认的，而不是从旧文档抄的？
3. org、权限、错误、degraded 状态是不是处理完整？
4. 页面是不是已经摆脱 mock，能跑真实链路？

如有调整，回到 Step 0 补充调研，修改方案后重新审批。

### Step 3: 实现 + 验证 + 上下文传递

1. 严格按照方案中的文件变更范围实现
2. 对照验收标准逐项验证
3. 回填"留给下一 Slice 的上下文"和"实现记录"
4. 更新 `PROGRESS.md` 状态为 ✅ 已完成
5. 如果发现方案有遗漏或模板有不足，反哺更新模板

每个 slice 完成后，前端需提交：

1. slice 文档
2. 实际修改文件列表
3. 自测结果
4. 留给下一 slice 的上下文

## Slice 间上下文传递

每个 slice 完成后，在方案文档的"留给下一 Slice 的上下文"中记录：

| 上下文项 | 说明 |
|----------|------|
| 新增 service 方法 | 方法名、参数、返回类型 |
| 新增/修改 store | state 接口、action 方法 |
| 新增路由 | 路径、组件映射 |
| 新增类型 | interface 名、关键字段 |
| 可复用组件 | 组件名、Props 接口 |
| 已知遗留问题 | 什么没做、为什么、后续注意 |

下一个 slice 的 Step 0 中，必须读取这些记录，并到实际代码中确认。

## 模板版本历史

| 版本 | 日期 | 变更 |
|------|------|------|
| v3 | 2026-04-13 | 与后端 `backend-driven-frontend-slice-template.md` 对齐 |
| v2 | 2026-04-13 | 新增 Step 0 前置调研、上下文传递机制 |
| v1 | 2026-04-13 | 初始版本 |
