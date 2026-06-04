# S20 - Analyzer 报告页

## Slice 基本信息

| 字段 | 内容 |
|---|---|
| Slice ID | S20 |
| 名称 | Analyzer 报告页 |
| 所属主线 | dashboard |
| 所属模块 | analyzer |
| 优先级 | P2 |
| 前置依赖 | 无 |
| 当前状态 | 已完成 |

## 0. 目标

提供分析报告的浏览和查看功能，包括性能趋势报告、Agent 对比报告和执行统计报告三种类型。

## 1. 后端调研记录

### 1.1 API 端点

| # | 方法 | 路径 | 用途 |
|---|---|---|---|
| 1 | GET | `/api/v1/analyzer/reports` | 列表(分页+类型筛选+日期筛选) |
| 2 | GET | `/api/v1/analyzer/reports/:id` | 报告详情(返回原始JSON，三种类型之一) |
| 3 | GET | `/api/v1/analyzer/trends` | 性能趋势报告列表(快捷) |
| 4 | GET | `/api/v1/analyzer/comparisons` | Agent对比报告列表(快捷) |

### 1.2 三种报告类型

**performance_trends**: time_range + avg_duration[]/pass_rate[]/token_usage[](DataPoint) + agent_stats[] + benchmark_stats[]
**agent_comparison**: compared_agents[] + performance/cost/quality(ComparisonMetric{metric_name, values, leader}) + recommendation
**execution_stats**: time_range + total/success/failure + overall_pass_rate + avg_duration_ms + agent_stats[] + benchmark_stats[]

### 1.3 权限

所有端点仅需 auth + org context，无 admin 要求。

## 2. 页面设计

- **路由**: `/analyzer`
- **布局**: Tabs(3个) + Detail Drawer
- **Tab 1 - 全部报告**: 分页列表(report_type/date/generated_at) + 类型筛选
- **Tab 2 - 性能趋势**: 同列表(仅 performance_trends)
- **Tab 3 - Agent 对比**: 同列表(仅 agent_comparison)
- **Detail Drawer**: 点击行获取详情，根据类型渲染不同内容
  - performance_trends: 时间序列数据 + agent/benchmark 统计表
  - agent_comparison: 三个维度对比(values Table) + recommendation
  - execution_stats: 汇总统计 + agent/benchmark 统计表

## 3. 文件变更范围

| 文件 | 动作 |
|---|---|
| `src/types/api/analyzer.ts` | 新增 |
| `src/services/analyzer.ts` | 新增 |
| `src/pages/analyzer/AnalyzerPage.tsx` | 新增 |
| `src/router/routes.tsx` | 修改 |
| `src/router/index.tsx` | 修改 |

## 4. 验收标准

- [x] 列表分页 + 类型筛选
- [x] 详情 Drawer 展示三种报告类型
- [x] `npx tsc --noEmit` + `npx vite build` 通过

## 5. 实现记录

| 项目 | 内容 |
|---|---|
| 完成日期 | 2026-04-14 |
| 实际修改文件 | `src/types/api/analyzer.ts`(新), `src/services/analyzer.ts`(新), `src/pages/analyzer/AnalyzerPage.tsx`(新), `src/router/routes.tsx`, `src/router/index.tsx` |
| 运行命令 | `npx tsc --noEmit` ✅, `npx vite build` ✅ |
| 遇到的问题 | 1. `await import` 在非 async 函数内 2. `Tabs` 未 import 3. 隐式 any 类型 — 均已修复 |
| 与原方案的差异 | 无差异 |
