# 业务概览

## 核心实体关系

```
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  User       │──────▶│Organization │◀──────│  Benchmark  │
│             │ 成员  │             │ 拥有  │             │
└─────────────┘       └─────────────┘       └──────┬──────┘
                                                     │
                                                     │ 触发
                                                     ▼
                                              ┌─────────────┐
                                              │  Execution  │
                                              │             │
                                              └──────┬──────┘
                                                     │
                                                     │ 使用
                                                     ▼
┌─────────────┐       ┌─────────────┐       ┌─────────────┐
│  Scheduled  │──────▶│  Scheduler  │──────▶│   Agent     │
│   Task      │ 提交  │             │ 分发  │             │
└─────────────┘       └─────────────┘       └─────────────┘
```

## 核心业务模块

### 1. 认证授权 (Authentication)

| 功能 | 说明 |
|------|------|
| 登录 | 用户名/密码登录，返回 access_token 和 refresh_token |
| 注册 | 仅管理员可注册新用户 |
| Token 刷新 | 使用 refresh_token 获取新的 access_token |
| 登出 | 撤销 refresh_token |
| 密码重置 | 邮件验证重置密码 |
| 角色管理 | admin | user | viewer |

### 2. Benchmark 管理

| 功能 | 说明 |
|------|------|
| 创建 | 手动创建或导入数据集 |
| 编辑 | 修改配置、测试脚本 |
| 删除 | 删除 Benchmark（需检查依赖） |
| 导入 | HumanEval、MBPP、SWE-bench 等数据集 |
| 筛选 | 按类型、语言、难度、状态筛选 |
| 审核 | approval_status: pending | approved | rejected |

### 3. 执行管理

| 功能 | 说明 |
|------|------|
| 单次执行 | 选择 Benchmark + Agent，创建执行任务 |
| 批量执行 | 选择多个 Benchmark + Agent，创建批量任务 |
| 进度跟踪 | WebSocket 实时推送执行进度 |
| 日志查看 | 查看执行日志、错误信息 |
| 结果下载 | 下载执行产物（代码、报告） |
| 重试/取消 | 失败重试、运行中取消 |

### 4. 定时任务

| 功能 | 说明 |
|------|------|
| 创建调度 | 配置 cron 表达式、选择 Benchmark |
| 执行历史 | 查看历史执行记录 |
| 暂停/恢复 | 控制定时任务状态 |
| 通知配置 | 配置执行完成通知 |

### 5. 组织管理

| 功能 | 说明 |
|------|------|
| 创建组织 | 用户可创建多个组织 |
| 成员管理 | 邀请成员、分配角色 |
| 资源隔离 | 组织间资源隔离 |
| 切换组织 | 用户可切换当前组织上下文 |

### 6. 通知推送

| 功能 | 说明 |
|------|------|
| 实时推送 | WebSocket 推送执行进度 |
| 通知中心 | 查看历史通知 |
| 已读/未读 | 标记通知状态 |
| 订阅管理 | 订阅特定事件 |

## Benchmark 类型详解

### code_fix（代码修复）

给定一个有 bug 的代码片段，要求 Agent 修复问题。

```typescript
{
  type: "code_fix",
  config: {
    initial_state: {
      files: {
        "main.py": "def add(a, b): return a - b  // bug"
      },
      instructions: {
        user_prompt: "修复 add 函数的 bug"
      }
    },
    test_config: {
      type: "unit",
      script: "pytest test_main.py"
    }
  }
}
```

### code_complete（代码补全）

给定不完整的代码，要求 Agent 补全缺失部分。

```typescript
{
  type: "code_complete",
  config: {
    initial_state: {
      files: {
        "sort.py": "def bubble_sort(arr):\n    # TODO: 实现"
      }
    }
  }
}
```

### terminal（终端操作）

通过终端命令完成任务。

```typescript
{
  type: "terminal",
  config: {
    initial_state: {
      instructions: {
        user_prompt: "使用 git 命令查看当前分支"
      }
    }
  }
}
```

### code_review（代码审查）

给定代码，要求 Agent 进行审查并给出意见。

```typescript
{
  type: "code_review",
  config: {
    initial_state: {
      files: { "app.js": "..." }
    }
  }
}
```

### refactor（代码重构）

给定代码，要求 Agent 重构改进。

### debug（调试）

给定失败测试和代码，要求 Agent 定位并修复问题。

### optimize（性能优化）

给定代码，要求 Agent 优化性能。

## 执行状态机

```
                    ┌──────────┐
                    │ pending  │◀─────────────┐
                    └─────┬────┘              │
                          │                   │ (重试)
                   (Worker 接收)              │
                          ▼                   │
                    ┌──────────┐              │
                    │ running  │──────────────┘
                    └─────┬────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
  (测试通过)          (超时/失败)        (用户取消)
        │                 │                 │
        ▼                 ▼                 ▼
  ┌──────────┐      ┌──────────┐      ┌──────────┐
  │completed │      │  failed  │      │cancelled │
  └──────────┘      └──────────┘      └──────────┘
```

## 批量执行流程

```
用户创建批量任务
       │
       ▼
┌──────────────┐
│   pending    │ 初始状态
└──────┬───────┘
       │ (开始执行)
       ▼
┌──────────────┐
│   running    │ 并行执行多个子任务
└──────┬───────┘
       │
       ▼
   [进度推送]
       │
       ├─► 全部成功 ──► completed
       ├─► 部分失败 ──► completed (失败任务记录)
       ├─► 全部失败 ──► failed
       └─► 用户取消 ──► cancelled
```

## 数据集导入来源

### HumanEval

- 来源: OpenAI HumanEval 数据集
- 格式: JSON
- 内容: 164 个 Python 编程问题
- 导入方式: URL / 文件上传 / JSON 数据

### MBPP

- 来源: Mostly Basic Python Problems
- 格式: JSON
- 内容: 974 个 Python 编程问题
- 导入方式: URL / 文件上传 / JSON 数据

### SWE-bench

- 来源: SWE-bench (GitHub Issues + 代码仓库)
- 格式: JSON
- 内容: 真实 GitHub Issues
- 导入方式:
  - URL 导入 (从 GitHub URL)
  - 直接提交 (repo_url + issue 信息)
- 流程:
  1. 克隆仓库
  2. 构建索引
  3. Agent 执行修复
  4. 运行测试
  5. 生成报告

## WebSocket 事件类型

| 事件 | 数据结构 | 说明 |
|------|---------|------|
| `execution_created` | `{ execution_id, ... }` | 执行创建 |
| `execution_progress` | `{ execution_id, progress, message }` | 执行进度 |
| `execution_completed` | `{ execution_id, result }` | 执行完成 |
| `execution_failed` | `{ execution_id, error }` | 执行失败 |
| `batch_progress` | `{ batch_id, completed, total }` | 批量进度 |
| `batch_completed` | `{ batch_id, report_id }` | 批量完成 |
| `notification` | `{ id, type, message }` | 通用通知 |

## 组织上下文传递

### API 请求携带组织 ID

```typescript
// 方式 1: Query 参数
GET /api/v1/benchmarks?org_id={org_id}

// 方式 2: Header
GET /api/v1/benchmarks
X-Organization-ID: {org_id}
```

### 状态管理

```typescript
// organizationStore
interface OrganizationStore {
  currentOrg: Organization | null;
  switchOrg(orgId: string): Promise<void>;
  hasPermission(permission: string): boolean;
}
```

### 路由集成

```typescript
// URL 中携带组织 ID
/organizations/:orgId/benchmarks
/organizations/:orgId/executions

// 或使用状态管理（推荐）
/benchmarks (从 store 读取 currentOrg)
```
