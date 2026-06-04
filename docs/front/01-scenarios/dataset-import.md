# 数据集导入

## 概述

**业务目标**: 导入标准数据集（HumanEval、MBPP、SWE-bench）作为 Benchmark

**涉及角色**: 普通用户、管理员

**前置条件**: 用户已登录

---

## 支持的数据集

| 数据集 | 来源 | 数据量 | 格式 |
|--------|------|--------|------|
| HumanEval | OpenAI | 164 题 | JSON |
| MBPP | Mostly Basic Python Problems | 974 题 | JSON |
| SWE-bench | GitHub Issues | ~2000 题 | JSON |

---

## 流程 1: HumanEval/MBPP 导入

### 方式 A: 文件上传

### 步骤 1: 用户选择文件

**用户操作**: 用户在导入页点击"上传文件"，选择 JSON 文件

**前端行为**:
- 文件校验:
  - 格式: `.json`
  - 大小: 最大 500MB
- 显示文件名、大小

### 步骤 2: 上传到 MinIO

**用户操作**: 用户点击"上传"按钮

**前端行为**:
- API 请求: `POST /api/v1/codecomplete/{dataset}/import/upload`
- Content-Type: `multipart/form-data`
- 请求体:
  ```typescript
  FormData {
    file: File
  }
  ```

**后端响应**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    file_id: string,  // "import/humaneval/20260223/uuid"
    size: number
  }
}
```

**状态变化**:
```typescript
uploading = true
uploadProgress = 0  // 支持进度条

// 成功后
fileId = data.file_id
uploading = false
```

### 步骤 3: 创建导入任务

**用户操作**: 用户配置导入选项后点击"开始导入"

**前端行为**:
- 表单配置:
  ```typescript
  {
    limit: number,           // 最大导入数量，0 表示不限制
    visibility: string,      // public | private | organization
    needs_approval: boolean  // 是否需要审核
  }
  ```
- API 请求: `POST /api/v1/codecomplete/{dataset}/import/async`
- 请求体:
  ```typescript
  {
    file_id: string,
    limit: number,
    visibility: string,
    needs_approval: boolean
  }
  ```

**后端响应**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    task_id: string,
    status: "pending"
  }
}
```

### 步骤 4: 跟踪导入进度

**用户操作**: 页面自动跳转到任务详情页

**前端行为**:
- 轮询 API: `GET /api/v1/codecomplete/tasks/{task_id}/status`
- 频率: 每 2 秒
- 响应:
  ```typescript
  {
    code: 0,
    message: "success",
    data: {
      id: string,
      status: "pending" | "processing" | "completed" | "failed" | "cancelled",
      total: number,
      imported: number,
      failed: number,
      error_msg: string,
      created_at: string
    }
  }
  ```

**状态变化**:
```typescript
polling = true

// 更新进度
progress = (imported / total) * 100

// 完成/失败后停止轮询
if (status === 'completed' || status === 'failed') {
  polling = false
}
```

---

### 方式 B: URL 导入

### 步骤 1: 用户输入 URL

**用户操作**: 用户选择"从 URL 导入"，输入 URL

**前端行为**:
- URL 校验: 必须是有效 URL
- 白名单域名:
  - `github.com`
  - `raw.githubusercontent.com`
  - `gist.githubusercontent.com`
  - `huggingface.co`
  - `cdn-lfs.huggingface.co`

### 步骤 2: 创建导入任务

**用户操作**: 用户点击"导入"

**前端行为**:
- API 请求: `POST /api/v1/codecomplete/{dataset}/import/url`
- 请求体:
  ```typescript
  {
    url: string,
    limit: number,
    visibility: string
  }
  ```

---

### 方式 C: 直接 JSON 数据

### 步骤 1: 用户粘贴 JSON

**用户操作**: 用户选择"直接粘贴 JSON"，粘贴 JSON 数据

**前端行为**:
- JSON 格式校验
- 大小校验: 最大 100MB (base64 编码后约 133MB)

### 步骤 2: 创建导入任务

**用户操作**: 用户点击"导入"

**前端行为**:
- API 请求: `POST /api/v1/codecomplete/{dataset}/import/async`
- 请求体:
  ```typescript
  {
    data: string,  // base64 编码的 JSON
    limit: number,
    visibility: string
  }
  ```

---

## 流程 2: SWE-bench 导入

### 方式 A: 从 GitHub URL 导入

### 步骤 1: 用户输入仓库信息

**用户操作**: 用户填写表单

**前端行为**:
- 表单字段:
  ```typescript
  {
    repo_url: string,      // 必填，GitHub 仓库 URL
    commit_hash?: string,  // 可选，默认 main 分支最新
    base_branch?: string,  // 可选，默认 "main"
    issue: {
      number?: number,     // Issue 编号
      title: string,       // 必填
      body: string,        // 必填
      url?: string,        // Issue URL
      labels?: string[]
    },
    config?: {
      test_strategy: "full" | "smart" | "skip",
      enable_auto_fix?: boolean,
      max_fix_attempts?: number
    }
  }
  ```

### 步骤 2: 创建 SWE 任务

**用户操作**: 用户点击"创建任务"

**前端行为**:
- API 请求: `POST /api/v1/swenbench/tasks`
- 请求体: 上述表单数据

**后端响应**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    id: string,        // "swe-{uuid}"
    status: "pending",
    phase: "init",
    message: "Task created successfully",
    created_at: string
  }
}
```

### 步骤 3: 实时跟踪任务进度

**前端行为**:
- WebSocket 连接: `ws://localhost:8005/ws`
- 订阅任务进度:
  ```typescript
  // 发送订阅消息
  {
    event: "subscribe",
    data: {
      task_id: string
    }
  }
  ```

**WebSocket 推送**:
```typescript
// 阶段进度
{
  event: "swe_progress",
  data: {
    task_id: string,
    phase: "init" | "repository" | "indexing" | "executing" | "testing" | "fixing" | "completed" | "failed",
    progress: number,  // 0-100
    message: string
  }
}

// 任务完成
{
  event: "swe_completed",
  data: {
    task_id: string,
    result: {...}
  }
}

// 任务失败
{
  event: "swe_failed",
  data: {
    task_id: string,
    error: string
  }
}
```

**进度计算**:
```typescript
const phaseProgress: Record<string, number> = {
  init: 0,
  repository: 15,
  indexing: 30,
  executing: 50,
  testing: 75,
  fixing: 85,
  completed: 100,
  failed: 100
}
```

### 步骤 4: 查看任务详情

**用户操作**: 用户点击任务查看详情

**前端行为**:
- API 请求: `GET /api/v1/swenbench/tasks/{id}`
- 响应:
  ```typescript
  {
    code: 0,
    message: "success",
    data: {
      id: string,
      status: string,
      phase: string,
      progress: number,
      repository: {
        url: string,
        owner: string,
        name: string,
        commit_hash: string,
        cloned: boolean
      },
      test: {
        strategy: string,
        passed?: boolean,
        total?: number,
        passed_count?: number,
        failed_count?: number
      },
      fix: {
        attempted: boolean,
        success: boolean,
        fixed_count?: number
      },
      error?: string,
      created_at: string,
      updated_at: string,
      completed_at?: string
    }
  }
  ```

### 步骤 5: 导出结果

**用户操作**: 用户点击"导出代码"

**前端行为**:
- API 请求: `GET /api/v1/swenbench/tasks/{id}/export`
- 响应:
  ```typescript
  {
    code: 0,
    message: "success",
    data: {
      task_id: string,
      artifact_key: string,
      download_url: string,
      file_count: number,
      expires_at: string
    }
  }
  ```

---

## 流程 3: 批量导入管理

### 查看导入任务列表

**用户操作**: 用户访问导入历史页面

**前端行为**:
- API 请求: `GET /api/v1/codecomplete/tasks?page=1&page_size=20&status={status}`
- 响应:
  ```typescript
  {
    code: 0,
    message: "success",
    data: {
      tasks: ImportTask[],
      total: number
    }
  }
  ```

### 取消导入任务

**用户操作**: 用户点击"取消"按钮

**前端行为**:
- 确认对话框
- API 请求: `POST /api/v1/codecomplete/tasks/{task_id}/cancel`
- 条件: 只能取消 status = "pending" 的任务

---

## 异常场景处理

### 文件过大
- 提示"文件过大，请使用文件上传方式"
- 提供文件上传入口

### URL 不在白名单
- 提示"该域名不支持，请先下载文件后上传"
- 列出支持的域名

### 导入失败
- 显示详细错误信息
- 提供"重试"按钮（针对部分失败）

### 任务超时
- 显示"导入超时，请联系管理员"
- 记录 task_id 供排查

---

## 相关页面

- [数据集导入页](../02-pages/dataset-import.md)

## 相关 API

- [Benchmark Import API](../03-api/benchmark-api.md) - 包含导入接口
- [SWE-bench API](../03-api/swenbench-api.md)
