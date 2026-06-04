# 第一阶段 MVP

## 目标

构建 MyAgent 前端最小可用产品，支持核心功能的 Web 操作。

## 时间规划

预计 4-6 周

---

## 功能范围

### 核心模块

| 模块 | 功能 | 优先级 |
|------|------|--------|
| **认证** | 登录、登出、Token 管理 | P0 |
| **布局** | 顶部导航、侧边栏、主内容区 | P0 |
| **仪表盘** | 系统概览、统计卡片、任务趋势 | P0 |
| **评测任务** | 列表、详情、创建、编辑、删除 | P0 |
| **执行记录** | 列表、详情、日志查看、实时进度 | P0 |
| **Agent 管理** | 列表、详情（只读） | P1 |
| **通知** | 全局通知、通知中心 | P1 |

### 暂不实现

- 批量执行（Phase 2）
- 调度管理（Phase 2）
- 组织管理（Phase 2）
- 高级图表（Phase 2）
- 暗色主题（Phase 2）

---

## 技术任务

### 1. 项目初始化 (Week 1)

#### 1.1 脚手架搭建

```bash
# 创建项目
npm create vite@latest myagent-frontend -- --template react-ts
cd myagent-frontend
pnpm install
```

#### 1.2 安装依赖

```bash
# 核心依赖
pnpm add antd @ant-design/icons react-router-dom zustand axios

# 工具库
pnpm add dayjs lodash-es

# 国际化
pnpm add i18next react-i18next i18next-browser-languagedetector

# 图表
pnpm add echarts echarts-for-react

# 开发依赖
pnpm add -D @types/lodash-es @types/node
pnpm add -D eslint prettier
pnpm add -D @typescript-eslint/parser @typescript-eslint/eslint-plugin
```

#### 1.3 配置文件

- `.eslintrc.cjs` - ESLint 配置
- `.prettierrc` - Prettier 配置
- `tsconfig.json` - TypeScript 配置
- `vite.config.ts` - Vite 配置（路径别名）
- `.env.development` - 开发环境变量
- `.env.production` - 生产环境变量

#### 1.4 目录结构

创建基础目录结构：

```
src/
├── assets/
├── components/
│   ├── layout/
│   ├── common/
│   └── status/
├── pages/
├── hooks/
├── services/
├── stores/
├── router/
├── utils/
├── constants/
├── types/
├── locales/
├── providers/
├── App.tsx
└── main.tsx
```

### 2. 基础架构 (Week 1-2)

#### 2.1 样式系统

- CSS 变量定义（颜色、间距、字体、圆角）
- 全局样式（重置样式、通用类）
- Ant Design 主题定制

#### 2.2 路由配置

- 路由定义
- 路由守卫（认证守卫）
- 嵌套路由
- 404 处理

#### 2.3 状态管理

- `authStore` - 认证状态
- `uiStore` - UI 状态
- `wsStore` - WebSocket 状态

#### 2.4 API 客户端

- Axios 实例配置
- 请求/响应拦截器
- Token 刷新机制
- 错误处理

#### 2.5 国际化

- i18next 配置
- 语言文件结构
- 语言切换组件

### 3. 认证模块 (Week 2)

#### 功能列表

- [ ] 登录页面
- [ ] 登录表单（用户名/密码）
- [ ] 登录状态管理
- [ ] Token 持久化
- [ ] 自动登录
- [ ] 登出功能
- [ ] 路由守卫（未登录跳转）

#### 文件清单

```
pages/auth/
├── LoginPage.tsx          # 登录页面
├── LoginContainer.tsx     # 登录容器（处理逻辑）
└── components/
    ├── LoginForm.tsx      # 登录表单
    └── RememberMe.tsx     # 记住我

stores/
└── authStore.ts           # 认证状态管理

services/
└── auth.ts                # 认证 API

hooks/
└── useAuth.ts             # 认证 Hook
```

### 4. 布局框架 (Week 2)

#### 功能列表

- [ ] 主布局容器
- [ ] 顶部导航栏
  - Logo
  - 面包屑
  - 用户下拉菜单
  - 通知图标
  - 语言切换
- [ ] 侧边栏
  - 菜单列表
  - 折叠/展开
  - 当前激活状态
- [ ] 主内容区
- [ ] 页脚

#### 文件清单

```
components/layout/
├── AppLayout.tsx          # 主布局
├── AppHeader.tsx          # 顶部栏
├── AppSidebar.tsx         # 侧边栏
├── AppFooter.tsx          # 页脚
├── Logo.tsx               # Logo 组件
├── UserMenu.tsx           # 用户菜单
├── LanguageSelector.tsx   # 语言切换
└── NotificationIcon.tsx   # 通知图标
```

### 5. 仪表盘 (Week 3)

#### 功能列表

- [ ] 统计卡片
  - 总任务数
  - 运行中任务
  - 成功率
  - Agent 状态
- [ ] 趋势图表
  - 执行量趋势（折线图）
  - 成功率趋势（折线图）
- [ ] 最近执行列表
- [ ] 快捷操作入口

#### 文件清单

```
pages/dashboard/
├── DashboardPage.tsx
└── components/
    ├── StatCard.tsx       # 统计卡片
    ├── TrendChart.tsx     # 趋势图
    ├── RecentExecutions.tsx
    └── QuickActions.tsx
```

### 6. 评测任务管理 (Week 3-4)

#### 功能列表

##### 列表页
- [ ] 任务列表（表格）
- [ ] 分页
- [ ] 搜索
- [ ] 筛选（状态、语言）
- [ ] 排序
- [ ] 批量操作（删除）

##### 详情页
- [ ] 基本信息
- [ ] 任务统计
- [ ] 执行记录列表
- [ ] 配置查看

##### 创建/编辑
- [ ] 创建任务表单
- [ ] 编辑任务表单
- [ ] 表单验证
- [ ] 语言选择

#### 文件清单

```
pages/benchmarks/
├── BenchmarkListPage.tsx
├── BenchmarkDetailPage.tsx
├── BenchmarkCreatePage.tsx
├── BenchmarkEditPage.tsx
└── components/
    ├── BenchmarkTable.tsx
    ├── BenchmarkFilter.tsx
    ├── BenchmarkForm.tsx
    ├── BenchmarkCard.tsx
    └── ExecutionList.tsx

stores/
└── benchmarkStore.ts

services/
└── benchmark.ts
```

### 7. 执行记录管理 (Week 4-5)

#### 功能列表

##### 列表页
- [ ] 执行列表（表格）
- [ ] 分页
- [ ] 筛选（状态、Agent、时间范围）
- [ ] 排序
- [ ] 状态徽标
- [ ] 进度条（运行中）

##### 详情页
- [ ] 基本信息
- [ ] 执行状态
- [ ] 实时进度
- [ ] 日志查看
  - 分级别显示
  - 实时追加（SSE）
  - 自动滚动
- [ ] 产物下载

##### 操作
- [ ] 取消执行
- [ ] 重试执行

#### 文件清单

```
pages/executions/
├── ExecutionListPage.tsx
├── ExecutionDetailPage.tsx
└── components/
    ├── ExecutionTable.tsx
    ├── ExecutionStatus.tsx
    ├── ExecutionProgress.tsx
    ├── ExecutionLog.tsx
    └── ActionButtons.tsx

hooks/
└── useExecutionUpdates.ts  # WebSocket 实时更新

services/
└── execution.ts
```

### 8. Agent 管理 (Week 5)

#### 功能列表

- [ ] Agent 列表（卡片视图）
- [ ] Agent 详情
  - 基本信息
  - 配置参数
  - 统计数据
- [ ] 激活/停用
- [ ] 状态监控

#### 文件清单

```
pages/agents/
├── AgentListPage.tsx
├── AgentDetailPage.tsx
└── components/
    ├── AgentCard.tsx
    ├── AgentConfig.tsx
    └── AgentStats.tsx

services/
└── agent.ts
```

### 9. 通知中心 (Week 5-6)

#### 功能列表

- [ ] 全局通知
  - 成功/失败/警告
  - 自动消失
- [ ] 通知中心
  - 通知列表
  - 已读/未读
  - 标记已读
  - 清空通知
- [ ] 桌面通知（可选）

#### 文件清单

```
pages/notifications/
├── NotificationPage.tsx
└── components/
    ├── NotificationList.tsx
    └── NotificationItem.tsx

hooks/
└── useNotifications.ts

stores/
└── notificationStore.ts
```

### 10. WebSocket 集成 (Week 5-6)

#### 功能列表

- [ ] 连接管理器
- [ ] 自动重连
- [ ] 心跳机制
- [ ] 订阅管理
- [ ] 执行进度推送
- [ ] 通知推送

#### 文件清单

```
services/
└── websocket.ts           # WebSocket 连接管理器

stores/
└── wsStore.ts             # WebSocket 状态

hooks/
└── useWebSocket.ts        # WebSocket Hook
```

---

## 测试计划

### 单元测试

关键工具函数和 Hook：

- [ ] `format.ts` - 格式化函数
- [ ] `validation.ts` - 验证函数
- [ ] `useRequest` Hook
- [ ] `useDebounce` Hook

### 集成测试

- [ ] 登录流程
- [ ] API 请求
- [ ] 路由跳转

---

## 部署计划

### 构建配置

```bash
# 开发构建
npm run build:dev

# 生产构建
npm run build
```

### 环境变量

```bash
# .env.production
VITE_API_BASE_URL=https://api.myagent.com/api/v1
VITE_WS_BASE_URL=wss://notifier.myagent.com/ws
```

### 静态资源部署

- Nginx 配置
- CDN 配置（可选）
- 缓存策略

---

## 验收标准

### 功能验收

1. 用户可以登录系统
2. 用户可以查看仪表盘统计数据
3. 用户可以查看/创建/编辑/删除评测任务
4. 用户可以查看执行记录和日志
5. 用户可以查看 Agent 信息
6. 用户可以接收实时通知

### 性能验收

1. 首屏加载时间 < 2s
2. 路由切换时间 < 500ms
3. API 请求响应时间 < 1s
4. Lighthouse 分数 > 80

### 兼容性验收

1. Chrome 最新版
2. Firefox 最新版
3. Edge 最新版
4. Safari 最新版

---

## 风险与缓解

| 风险 | 缓解措施 |
|------|---------|
| 后端 API 变更 | 前后端接口文档同步，版本控制 |
| WebSocket 连接不稳定 | 实现完善的重连机制 |
| 性能问题 | 代码分割、懒加载、缓存优化 |
| 浏览器兼容性 | 使用 Babel、Polyfill |
