# MyAgent 前端开发文档

本文档提供 MyAgent Web 前端开发的完整指南，面向资深前端工程师。

## 文档组织

文档采用三层结构：**场景导向** → **页面导向** → **API 参考**

- **场景导向**：按用户任务组织，描述完整的业务流程
- **页面导向**：按页面组织，描述组件结构和状态管理
- **API 参考**：按模块组织，提供接口定义和类型说明

---

## 目录

### 00. 快速开始
- [系统概览](00-start/overview.md) - 系统架构、服务拓扑、核心概念
- [业务概览](00-start/business-overview.md) - 业务模型、核心实体关系
- [快速上手](00-start/quick-start.md) - 5分钟快速开始

### 01. 场景导向 (业务流程)
- [认证授权](01-scenarios/authentication.md) - 登录、注册、登出、密码重置流程
- [Benchmark 管理](01-scenarios/benchmark-management.md) - CRUD、筛选、排序流程
- [数据集导入](01-scenarios/dataset-import.md) - HumanEval/MBPP/SWE-bench 导入流程
- [任务执行](01-scenarios/task-execution.md) - 单次执行、批量执行流程
- [定时任务](01-scenarios/scheduled-tasks.md) - 定时任务创建、执行历史
- [组织管理](01-scenarios/organization.md) - 组织创建、成员管理、权限控制
- [通知推送](01-scenarios/notification.md) - 通知中心、实时更新流程

### 02. 页面导向 (组件设计)
- [登录/注册页](02-pages/login-register.md)
- [Benchmark 列表页](02-pages/benchmark-list.md)
- [Benchmark 详情页](02-pages/benchmark-detail.md)
- [创建/编辑 Benchmark 页](02-pages/benchmark-create-edit.md)
- [数据集导入页](02-pages/dataset-import.md)
- [执行记录列表页](02-pages/execution-list.md)
- [执行详情页](02-pages/execution-detail.md)
- [批量执行页](02-pages/batch-execution.md)
- [批量报告页](02-pages/batch-report.md)
- [定时任务页](02-pages/scheduled-tasks.md)
- [Agent 管理页](02-pages/agents.md)
- [组织管理页](02-pages/organizations.md)
- [设置页](02-pages/settings.md)

### 03. API 参考 (接口定义)
- [认证 API](03-api/auth-api.md) - 登录、注册、令牌刷新、密码重置
- [Benchmark API](03-api/benchmark-api.md) - 评测任务 CRUD、统计、标签管理
- [执行 API](03-api/execution-api.md) - 执行记录查询、重试、日志、轨迹
- [批量执行 API](02-api/batch-api.md) - 批量任务创建、进度跟踪、报告生成
- [定时任务 API](03-api/scheduled-task-api.md) - 定时任务管理、触发、执行历史
- [组织 API](03-api/organization-api.md) - 组织管理、成员邀请、配额查询
- [Agent API](02-api/agent-api.md) - Agent 列表、统计、健康检查
- [调度 API](02-api/scheduler-api.md) - 调度器状态、队列管理
- [SWE-bench API](03-api/swenbench-api.md) - SWE-bench 任务创建、状态查询
- [指标 API](02-api/metrics-api.md) - 指标分析、成本统计
- [语言 API](02-api/language-api.md) - 编程语言管理
- [国际化 API](02-api/i18n-api.md) - 多语言支持接口
- [WebSocket API](03-api/websocket-api.md) - WebSocket 消息协议、事件类型

### 04. 技术模式
- [WebSocket 集成](04-patterns/websocket.md) - 连接管理、订阅、重连
- [错误处理](04-patterns/error-handling.md) - 统一错误处理模式
- [状态管理](04-patterns/state-management.md) - Zustand store 设计
- [组织上下文](04-patterns/organization-context.md) - 组织上下文传递
- [实时进度](04-patterns/real-time-progress.md) - 实时进度处理

### 05. 类型定义
- [API 类型](05-types/api-types.md) - 统一的 API 请求/响应类型
- [领域类型](05-types/domain-types.md) - 领域模型类型
- [通用类型](05-types/common-types.md) - 通用类型定义

---

## 保留的旧文档

以下文档保留但可能不再更新，建议优先查看上述新文档：

- [架构设计](01-architecture/) - 前端架构概览
- [UI 设计规范](04-ui-design/) - 设计系统、组件规范
- [国际化](05-i18n/) - 国际化方案
- [权限控制](07-permissions/) - 权限系统
- [开发规范](09-development/) - 编码规范、项目结构
- [实施计划](10-plans/) - MVP 和功能计划

---

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.x | UI 框架 |
| TypeScript | 5.x | 类型系统 |
| Vite | 5.x | 构建工具 |
| Ant Design | 5.x | UI 组件库 |
| React Router | 6.x | 路由管理 |
| Zustand | 4.x | 状态管理 |
| axios | 1.x | HTTP 客户端 |
| ECharts | 5.x | 图表库 |
| react-i18next | 13.x | 国际化 |

## 环境变量

```bash
# .env.development
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_WS_BASE_URL=ws://localhost:8005/ws

# .env.production
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
VITE_WS_BASE_URL=wss://notifier.yourdomain.com/ws
```
