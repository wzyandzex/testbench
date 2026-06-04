# S19 - Dashboard 真实数据接入

## Slice 基本信息

| 字段 | 内容 |
|---|---|
| Slice ID | S19 |
| 名称 | Dashboard 真实数据接入 |
| 所属主线 | dashboard |
| 所属模块 | dashboard |
| 优先级 | P2 |
| 前置依赖 | 无 |
| 当前状态 | 已完成 |

## 0. 目标

将 Dashboard 页面的 mock 数据替换为真实后端 API 数据，包括统计卡片、趋势图表和最近执行列表。

## 1. 为什么先做这个 Slice

1. Dashboard 是用户登录后的首页，当前全部使用 mock 数据。
2. 已有足够的后端 API 可支撑大部分数据需求。

## 2. 后端调研记录

### 2.1 API 映射关系

| Dashboard 元素 | Mock 字段 | 真实 API | 响应字段 |
|---|---|---|---|
| 评测任务数 | totalBenchmarks | `GET /benchmarks?page=1&page_size=1` | `data.total` |
| 运行中执行 | runningExecutions | `GET /executions/summary` | `data.running` |
| Agent 数量 | totalAgents | `GET /agents?page=1&page_size=1` | `data.total` |
| 成功率 | successRate | `GET /executions/summary` | `data.success_rate` |
| 趋势日期 | trendData.dates | `GET /cost/statistics?period=day&start_date=&end_date=` | `trend_data[].date` |
| 趋势执行量 | trendData.executions | 同上 | `trend_data[].executions` |
| 最近执行 | recentExecutions | `GET /executions?page=1&page_size=5` | 分页列表 |

### 2.2 关键结论

1. **`GET /executions/summary`** 返回 `{total, pending, running, completed, failed, timeout, cancelled, success_rate, avg_duration}`，前端 service 缺少此方法。
2. **`GET /cost/statistics?period=day`** 返回 `trend_data[{date, cost, tokens, executions, avg_cost}]`，有每日执行量但无每日成功率。
3. **趋势图成功率**: 无后端端点提供每日成功率。方案: 趋势图仅展示执行量（移除成功率线），或显示固定值。
4. **变更百分比**: 无后端对比 API。方案: 不展示变更百分比（移除 change prop）。
5. **执行列表缺少 benchmark/agent 名称**: 仅有 ID。方案: 展示 ID 截断+跳转链接。

## 3. 页面设计

### 3.1 变更范围

修改 `DashboardPage.tsx`，替换所有 mock 数据为 API 调用。

### 3.2 具体变更

1. **新增 `executionService.getSummary()`**: 调用 `GET /executions/summary`
2. **4 个统计卡片**: 并行调用 `benchmarks.list`, `executions.summary`, `agents.list`
3. **趋势图表**: 调用 `cost.statistics(period=day, start_date=7天前, end_date=今天)` → 仅展示执行量线
4. **最近执行**: 调用 `executions.list(page=1, page_size=5)`
5. **移除 change 百分比**: StatCard 的 change prop 设为 undefined
6. **刷新按钮**: 触发重新加载所有数据

## 4. 文件变更范围

| 文件 | 动作 | 原因 |
|---|---|---|
| `src/services/execution.ts` | 修改 | 新增 getSummary 方法 |
| `src/pages/dashboard/DashboardPage.tsx` | 修改 | 替换 mock 为真实 API |

核心文件 2 个。类型使用已有类型，不新建文件。

### 4.1 新增 service 方法

```typescript
// execution.ts 新增:
getSummary: () => GET /executions/summary → { total, running, completed, failed, success_rate, avg_duration }
```

## 5. 验收标准

- [ ] 统计卡片显示真实数据（Benchmarks/Running/Agents/SuccessRate）
- [ ] 趋势图显示近 7 天执行量
- [ ] 最近执行列表显示真实记录
- [ ] 刷新按钮重新加载数据
- [ ] 无 mock 数据残留
- [ ] `npx tsc --noEmit` 通过
- [ ] `npx vite build` 通过

## 6. 明确不做什么

1. 不做变更百分比（无后端 API）。
2. 不做趋势图每日成功率线（无后端 API）。
3. 不做 benchmark/agent 名称解析（执行记录仅有 ID）。
4. 不新建独立类型/服务文件（复用已有）。

## 7. 实现记录

| 项目 | 内容 |
|---|---|
| 完成日期 | 2026-04-14 |
| 实际修改文件 | `src/services/execution.ts`(修改), `src/pages/dashboard/DashboardPage.tsx`(修改) |
| 运行命令 | `npx tsc --noEmit` ✅, `npx vite build` ✅ |
| 遇到的问题 | `setRecentLoading` 未使用 — 改为 `[recentLoading]` |
| 与原方案的差异 | 无差异 |
