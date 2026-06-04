# MyAgent Frontend

基于 Vite + React + TypeScript + Ant Design 的前端项目。

## 技术栈

- **框架**: React 18
- **构建工具**: Vite 6
- **语言**: TypeScript 5
- **UI 组件**: Ant Design 5
- **路由**: React Router v6
- **状态管理**: Zustand 4
- **HTTP 客户端**: Axios 1
- **图表**: ECharts 5
- **国际化**: react-i18next

## 项目结构

```
src/
├── assets/           # 静态资源
│   ├── images/       # 图片
│   ├── icons/        # 图标
│   └── styles/       # 全局样式
├── components/       # 通用组件
│   ├── layout/       # 布局组件
│   ├── table/        # 表格组件
│   ├── form/         # 表单组件
│   ├── status/       # 状态显示组件
│   ├── chart/        # 图表组件
│   └── common/       # 通用组件
├── pages/            # 页面组件
│   ├── auth/         # 认证页面
│   ├── dashboard/    # 仪表盘
│   ├── benchmarks/   # 评测任务
│   ├── executions/   # 执行记录
│   ├── agents/       # Agent 管理
│   ├── batch/        # 批量执行
│   ├── metrics/      # 指标分析
│   ├── scheduler/    # 调度管理
│   ├── organizations/# 组织管理
│   ├── settings/     # 设置
│   └── notifications/# 通知中心
├── hooks/            # 自定义 Hooks
├── services/         # API 服务层
├── stores/           # Zustand 状态管理
├── router/           # 路由配置
├── utils/            # 工具函数
├── constants/        # 常量定义
├── types/            # TypeScript 类型
├── locales/          # 国际化文件
├── providers/        # Context Providers
├── i18n/             # i18n 配置
├── App.tsx           # 应用根组件
└── main.tsx          # 应用入口
```

## 开发指南

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 类型检查

```bash
npm run type-check
```

### 代码检查

```bash
npm run lint
```

## 环境变量

- `.env.development` - 开发环境配置
- `.env.production` - 生产环境配置

```bash
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_WS_BASE_URL=ws://localhost:8005/ws
```

## 主要功能模块

- 认证登录
- 评测任务管理
- 执行记录查看
- Agent 管理
- 批量执行
- 指标分析
- 调度管理
- 组织管理
- 用户设置
- 通知中心
