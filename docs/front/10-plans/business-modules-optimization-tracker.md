# 前端业务模块全面审查与优化追踪计划 (Frontend Optimization Tracker)

## 🎯 核心目标 (Objectives)
1. **对接规范一致性 (API & Architecture)**: 严格落实 `docs/item/` 下的架构设计，特别是 `FRONTEND-INTEGRATION.md` (标准响应、防风暴刷新、`X-Org-ID` 注入) 和 `FRONTEND-PROJECT-SPLIT.md` (User/Admin 路由权限隔离)。
2. **极致性能 (Performance)**: 落地 `Vercel React Best Practices`，消除网络瀑布流 (Waterfalls)、精准控制组件重渲染 (Rerender)、优化大列表与图表加载策略。
3. **UI/UX 与深浅模式体验 (Design & Patterns)**: 落地 `Frontend Patterns`，彻底根除颜色硬编码，全面基于 Ant Design Token (`theme.useToken`) 改造模块，实现优雅的日间/暗黑模式自适应与无缝切换。

---

## 📅 阶段划分与进度 (Phased Plan)

### Phase 1: 基础设施与路由基座 (Infrastructure) ✅ [已完成]
*基建不牢，地动山摇。首先确保请求拦截器、路由守卫、全局状态与后端文档完全对齐。*
- [x] **HTTP Client (`src/utils/request.ts` 或 `api.ts`)**: 
  - 校验是否实现双层错误判定 (`HTTP 2xx + code !== 0`)。
  - 校验无风暴并发 Token 刷新逻辑 (`refreshToken` 队列机制)。
  - 校验 `X-Org-ID` 的统一拦截注入。
- [x] **Router & Guards (`src/router`)**: 
  - 校验路由白名单配置是否契合 User App / Admin App 拆分逻辑。
  - 优化懒加载 (`lazy + Suspense`) 的 Chunk 分包策略。

### Phase 2: 核心基石业务 (Core Business) ✅ [已完成]
*登录、组织和数据大盘，是用户的第一印象。*
- [ ] **Auth (01-auth)**: 登录/注册页深浅模式适配，Token 安全存储。
- [ ] **Organization (02-organization)**: 组织切换逻辑优化，`current_org_id` 状态与 LocalStorage 的精确同步。
- [ ] **Dashboard (`src/pages/dashboard`)**: 重构大盘数据获取，并行请求消除 Waterfall；ECharts 图表实例深浅色动态绑定更新。
- [ ] **Settings (16-settings)**: 用户偏好设置表单优化。

### Phase 3: 核心执行引擎 (Execution Engine) ✅ [已完成]
*业务逻辑最复杂的区域，重点在于状态流转与 WebSocket 通信。*
- [x] **SWE 任务 (04-swe)**: 审查复杂状态机流转；重构 WebSocket Hook (`useSWEWebSocket`) 增加稳健的断线重连与心跳机制。
- [x] **单次执行 (05-execution)**: 优化长日志/长链路渲染，引入虚拟滚动 (`@tanstack/react-virtual` 或 Antd 虚拟列表)。
- [x] **批量执行 (06-batch)**: 优化批量统计卡片的组件拆分，防范深层状态传递引起的灾难性 Rerender。
- [x] **定时任务 (07-scheduled)**: 表单交互优化 (Controlled Form Pattern)，Cron 表达式组件重构。

### Phase 4: 核心资产管理 (Benchmarks & Agents) ✅ [已完成]
*数据展示密集型区域。*
- [x] **评测集管理 (03-benchmark)**: 重构题库展示列表；采用 Compound Components 模式拆分复杂的“新建/编辑”长表单。
- [x] **Agent 管理 (08-agent)**: 优化 Agent 列表检索过滤性能 (Debounce Hook的应用)；深色模式下卡片视觉层级优化。

### Phase 5: 数据流转与平台治理 (Data & Analytics) ✅ [已完成]
- [x] **成本与指标分析 (09-cost / 15-analytics)**: 大数据量图表渲染卡顿优化，异步按需加载图表库。
- [ ] **通知中心 (14-notification)**: 全局通知角标状态同步；WebSocket 推送接入优化 (当前暂无WS后端点，仅做 UI 修复或后续接).
- [ ] **导入导出 (12-import / 13-export)**: 审查导入任务轮询逻辑 (`pollImportTask` 模式)；大文件分片/防抖交互体验优化。

---

## 🛠️ 模块级审查 Checklist (Standard Operating Procedure)
每次进入一个模块，需严格执行以下检查项：
1. **API 层**: 是否抽取在独立 service 文件？是否使用通用解包 `unwrap` 且正确捕获/映射了业务错误码？
2. **逻辑层**: 业务状态是否与 UI 深度耦合？是否需要抽离 Custom Hook？
3. **性能层**: 列表是否缺少 `key`？繁重计算是否缺少 `useMemo`？回调是否缺少 `useCallback`？
4. **视图层**: 是否残留了硬编码的颜色 (如 `#fff`, `#f0f0f0`)？暗黑模式下是否存在边界/文本看不清的问题？

*文档最后更新时间: 2026-03-16*