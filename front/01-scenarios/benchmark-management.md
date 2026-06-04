# Benchmark 管理

## 概述

**业务目标**: 管理（创建、编辑、删除、查询）代码评测任务

**涉及角色**: 普通用户、管理员

**前置条件**: 用户已登录

---

## 流程 1: 创建 Benchmark

### 步骤 1: 用户打开创建页面

**用户操作**: 用户点击"新建 Benchmark"按钮

**前端行为**:
- 导航到 `/benchmarks/create`
- 初始化表单状态:
  ```typescript
  const [form] = Form.useForm()
  const loading = false
  const benchmark = {
    name: '',
    display_name: '',
    description: '',
    type: 'code_fix',
    language: 'python',
    difficulty: 'medium',
    category: '',
    tags: [],
    status: 'draft',
    config: defaultConfig,
    test_config: defaultTestConfig
  }
  ```

### 步骤 2: 填写基本信息

**用户操作**: 用户填写表单

**前端行为 - 字段校验**:

| 字段 | 校验规则 |
|------|----------|
| name | 必填，1-100 字符，字母数字下划线中划线，全局唯一 |
| display_name | 必填，1-255 字符 |
| description | 可选，最多 5000 字符 |
| type | 必选，下拉选择 |
| language | 必选，下拉选择 |
| difficulty | 可选，下拉选择 |
| category | 可选 |
| tags | 可选，多选 |

**类型选择**:
```typescript
type BenchmarkType =
  | 'code_fix'      // 代码修复
  | 'code_complete' // 代码补全
  | 'terminal'      // 终端操作
  | 'code_review'   // 代码审查
  | 'refactor'      // 代码重构
  | 'debug'         // 调试
  | 'optimize'      // 性能优化
```

**难度选择**:
```typescript
type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert'
```

### 步骤 3: 配置任务

**用户操作**: 用户切换到"任务配置"标签页

**前端行为**:
- 显示动态配置表单（根据 type 变化）
- 配置结构:
  ```typescript
  interface BenchmarkConfig {
    initial_state: {
      repo_url?: string
      commit_hash?: string
      branch?: string
      files: Record<string, string>  // 文件路径 -> 内容
      diff?: string
      base_dir?: string
    }
    required_files: string[]
    instructions: {
      user_prompt: string
      system_prompt?: string
      context?: string
      examples?: string[]
      hints?: string[]
    }
    goal: string
    constraints?: string[]
    success_criteria?: string[]
    timeout: number  // 纳秒
    max_attempts: number
    resource_limits: {
      max_memory_mb: number
      max_cpu_count: number
      max_duration: number
      max_disk_usage_mb: number
      network_access: boolean
    }
    agent_config: {
      mode: 'code_edit' | 'terminal' | 'hybrid' | 'autonomous'
      tools: string[]
      temperature: number
      max_tokens: number
      max_steps: number
      allow_retry: boolean
      verbose: boolean
    }
  }
  ```

### 步骤 4: 配置测试

**用户操作**: 用户切换到"测试配置"标签页

**前端行为**:
- 测试配置结构:
  ```typescript
  interface TestConfig {
    type: 'unit' | 'integration' | 'e2e' | 'custom'
    script: string
    command: string
    args: string[]
    timeout: number
    env: Record<string, string>
    expected: {
      exit_code?: number
      output?: string
      not_contains?: string[]
      contains?: string[]
      min_pass_rate?: number
    }
  }
  ```

### 步骤 5: 提交创建

**用户操作**: 用户点击"创建"按钮

**前端行为**:
- 表单校验（所有必填字段）
- API 请求: `POST /api/v1/benchmarks`
- 请求体: 完整的 Benchmark 对象

**后端响应**:

成功响应 (200):
```typescript
{
  code: 0,
  message: "success",
  data: Benchmark  // 创建的完整对象
}
```

错误响应:
| 错误码 | HTTP Code | 说明 |
|--------|-----------|------|
| 400001 | 400 | Benchmark 名称已存在 |

**状态变化**:
```typescript
loading = true

// 成功后
message.success("Benchmark 创建成功")
navigate(`/benchmarks/${data.id}`)
loading = false

// 失败后
loading = false
// 显示具体字段错误
```

---

## 流程 2: 编辑 Benchmark

### 步骤 1: 用户打开编辑页面

**用户操作**: 用户在列表页或详情页点击"编辑"

**前端行为**:
- 导航到 `/benchmarks/:id/edit`
- API 请求: `GET /api/v1/benchmarks/:id`
- 加载现有数据到表单

### 步骤 2: 修改内容

**用户操作**: 用户修改字段

**前端行为**:
- 实时校验
- 脏标记 (hasUnsavedChanges)

### 步骤 3: 保存修改

**用户操作**: 用户点击"保存"按钮

**前端行为**:
- API 请求: `PUT /api/v1/benchmarks/:id`
- 请求体: 修改的字段（部分更新）

**后端响应**:

成功响应 (200):
```typescript
{
  code: 0,
  message: "success",
  data: Benchmark  // 更新后的完整对象
}
```

错误响应:
| 错误码 | HTTP Code | 说明 |
|--------|-----------|------|
| 404001 | 404 | Benchmark 不存在 |
| 400001 | 400 | Benchmark 名称已存在 |

**状态变化**:
```typescript
loading = true

// 成功后
message.success("保存成功")
hasUnsavedChanges = false
loading = false

// 失败后
loading = false
```

---

## 流程 3: 删除 Benchmark

### 步骤 1: 用户点击删除

**用户操作**: 用户点击"删除"按钮

**前端行为**:
- 显示确认对话框:
  ```
  确定要删除 Benchmark "XXX" 吗？
  此操作不可撤销。
  ```
- API 请求: `DELETE /api/v1/benchmarks/:id`

**后端响应**:

成功响应 (200):
```typescript
{
  code: 0,
  message: "success",
  data: {
    message: "benchmark deleted successfully"
  }
}
```

错误响应:
| 错误码 | HTTP Code | 说明 |
|--------|-----------|------|
| 404001 | 404 | Benchmark 不存在 |
| 400009 | 400 | Benchmark 有关联的执行记录，无法删除 |

**状态变化**:
```typescript
loading = true

// 成功后
message.success("删除成功")
navigate('/benchmarks')
loading = false

// 失败后
loading = false
message.error(response.data.message)
```

---

## 流程 4: 列表查询和筛选

### 步骤 1: 用户打开列表页

**用户操作**: 用户访问 `/benchmarks`

**前端行为**:
- API 请求: `GET /api/v1/benchmarks?page=1&page_size=20`
- 初始化筛选状态:
  ```typescript
  const filters = {
    name_like: '',
    type: undefined,
    language: undefined,
    difficulty: undefined,
    category: undefined,
    status: undefined,
    tags: []
  }
  const pagination = {
    page: 1,
    page_size: 20
  }
  const sorter = {
    field: 'created_at',
    order: 'descend'
  }
  ```

### 步骤 2: 用户应用筛选

**用户操作**: 用户选择筛选条件

**前端行为**:
- 防抖处理 (300ms)
- 重置 page = 1
- API 请求: `GET /api/v1/benchmarks?{filters}&page=1`

**支持的筛选参数**:
| 参数 | 类型 | 说明 |
|------|------|------|
| name_like | string | 名称模糊搜索 |
| type | string[] | 多选 |
| language | string | 单选 |
| difficulty | string[] | 多选 |
| category | string | 单选 |
| status | string[] | 多选 |
| tags | string[] | 多选 |

### 步骤 3: 用户排序

**用户操作**: 用户点击表格列头

**前端行为**:
- API 请求: `GET /api/v1/benchmarks?order_by={field}&order_dir={asc|desc}`

### 步骤 4: 用户翻页

**用户操作**: 用户点击分页器

**前端行为**:
- API 请求: `GET /api/v1/benchmarks?page={page}&page_size={size}`
- 保存当前页码到 URL (保持刷新状态)

---

## 流程 5: 查看 Benchmark 详情

### 步骤 1: 用户打开详情页

**用户操作**: 用户点击列表中的 Benchmark

**前端行为**:
- 导航到 `/benchmarks/:id`
- API 请求: `GET /api/v1/benchmarks/:id`
- API 请求: `GET /api/v1/benchmarks/:id/stats`

### 步骤 2: 页面展示

**前端显示内容**:
1. **基本信息卡片**: name, display_name, description, type, language, difficulty
2. **状态标签**: status, approval_status, visibility
3. **统计卡片**:
   ```typescript
   interface BenchmarkStats {
     total_runs: number
     passed_runs: number
     failed_runs: number
     timeout_runs: number
     avg_duration: number
     success_rate: number
     last_run_at: string
   }
   ```
4. **配置展示**: 折叠面板展示 config 和 test_config
5. **执行记录**: 列表展示最近执行

---

## 异常场景处理

### 名称冲突
- 创建时: 实时校验，显示 "名称已存在"
- 编辑时: 保存失败，提示并高亮字段

### 并发编辑
- 提示"数据已被其他用户修改，请刷新后重试"
- 提供"刷新"和"强制保存"选项

### 加载失败
- 显示错误页面，提供"重试"和"返回列表"按钮

---

## 相关页面

- [Benchmark 列表页](../02-pages/benchmark-list.md)
- [Benchmark 详情页](../02-pages/benchmark-detail.md)
- [创建/编辑页](../02-pages/benchmark-create-edit.md)

## 相关 API

- [Benchmark API](../03-api/benchmark-api.md)
