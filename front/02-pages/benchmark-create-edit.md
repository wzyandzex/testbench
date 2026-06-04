# Benchmark 创建/编辑页

## 页面概览

- **路由**: `/benchmarks/create` | `/benchmarks/:id/edit`
- **所需权限**: 已登录用户
- **关联场景**: [Benchmark 管理](../01-scenarios/benchmark-management.md)

---

## 页面状态

```typescript
interface BenchmarkFormState {
  mode: 'create' | 'edit'
  benchmarkId?: string
  form: BenchmarkFormData
  loading: boolean
  saving: boolean
  hasUnsavedChanges: boolean
  activeTab: 'basic' | 'config' | 'test'
}

interface BenchmarkFormData {
  // 基本信息
  name: string
  display_name: string
  description: string
  type: BenchmarkType
  language: string
  difficulty?: DifficultyLevel
  category?: string
  tags: string[]
  status?: BenchmarkStatus
  visibility: Visibility

  // 任务配置
  config: {
    initial_state: {
      repo_url?: string
      commit_hash?: string
      branch?: string
      files: FileEntry[]
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
    timeout: number
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

  // 测试配置
  test_config: {
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
}

interface FileEntry {
  path: string
  content: string
}
```

## 组件结构

```
BenchmarkFormPage
├── PageHeader
│   ├── 返回按钮
│   └── 标题 (新建 Benchmark / 编辑 Benchmark)
├── Form
│   ├── Tabs
│   │   ├── 基本信息 Tab
│   │   ├── 任务配置 Tab
│   │   └── 测试配置 Tab
│   └── Form Actions
│       ├── "保存草稿"
│       ├── "预览"
│       └── "提交" 按钮
└── DirtyCheck (离开时提示未保存)
```

## 表单字段

### 基本信息 Tab

| 字段 | 组件 | 校验规则 |
|------|------|----------|
| name | Input | 必填，1-100字符，字母数字下划线中划线，唯一 |
| display_name | Input | 必填，1-255字符 |
| description | TextArea | 可选，最多5000字符 |
| type | Select | 必选 |
| language | Select | 必选 |
| difficulty | Select | 可选 |
| category | Input | 可选 |
| tags | Select (多选) | 可选 |
| status | Radio | 默认 draft |
| visibility | Radio | 默认 private |

### 任务配置 Tab

#### 初始状态

```tsx
<Form.Item label="初始代码">
  <Tabs>
    <Tabs.TabPane tab="直接输入" key="files">
      <FileEditor
        files={form.config.initial_state.files}
        onChange={(files) => setFiles(files)}
      />
    </Tabs.TabPane>
    <Tabs.TabPane tab="Git 仓库" key="repo">
      <Form.Item name={['config', 'initial_state', 'repo_url']}>
        <Input placeholder="https://github.com/owner/repo" />
      </Form.Item>
      <Form.Item name={['config', 'initial_state', 'commit_hash']}>
        <Input placeholder="commit hash (可选)" />
      </Form.Item>
      <Form.Item name={['config', 'initial_state', 'branch']}>
        <Input placeholder="分支名 (默认 main)" />
      </Form.Item>
    </Tabs.TabPane>
  </Tabs>
</Form.Item>
```

#### 指令

```tsx
<Form.Item label="用户指令" name={['config', 'instructions', 'user_prompt']} required>
  <TextArea rows={4} placeholder="描述任务目标..." />
</Form.Item>

<Form.Item label="系统提示" name={['config', 'instructions', 'system_prompt']}>
  <TextArea rows={3} placeholder="可选的系统提示..." />
</Form.Item>

<Form.Item label="目标" name={['config', 'goal']} required>
  <Input placeholder="成功的定义..." />
</Form.Item>
```

#### 资源限制

```tsx
<Form.Item label="内存限制 (MB)" name={['config', 'resource_limits', 'max_memory_mb']}>
  <InputNumber min={128} max={8192} />
</Form.Item>

<Form.Item label="CPU 核心数" name={['config', 'resource_limits', 'max_cpu_count']}>
  <InputNumber min={1} max={16} />
</Form.Item>

<Form.Item label="网络访问" name={['config', 'resource_limits', 'network_access']} valuePropName="checked">
  <Switch />
</Form.Item>
```

### 测试配置 Tab

```tsx
<Form.Item label="测试类型" name={['test_config', 'type']}>
  <Select>
    <Select.Option value="unit">单元测试</Select.Option>
    <Select.Option value="integration">集成测试</Select.Option>
    <Select.Option value="e2e">端到端测试</Select.Option>
    <Select.Option value="custom">自定义</Select.Option>
  </Select>
</Form.Item>

<Form.Item label="测试命令" name={['test_config', 'command']} required>
  <Input placeholder="pytest" />
</Form.Item>

<Form.Item label="测试脚本" name={['test_config', 'script']}>
  <TextArea rows={6} placeholder="# 测试脚本内容" />
</Form.Item>
```

## 表单校验

### 实时校验

```typescript
const validateName = async (_: any, value: string) => {
  if (!value) return Promise.reject('请输入名称')
  if (!/^[a-zA-Z0-9_-]+$/.test(value)) {
    return Promise.reject('只能包含字母、数字、下划线、中划线')
  }
  if (value.length < 1 || value.length > 100) {
    return Promise.reject('长度必须在 1-100 字符之间')
  }

  // 检查唯一性（编辑时跳过自己）
  if (mode === 'create' || value !== originalName) {
    const exists = await checkNameExists(value)
    if (exists) return Promise.reject('名称已存在')
  }

  return Promise.resolve()
}
```

### 表单规则

```typescript
const rules = {
  name: [{ validator: validateName }],
  display_name: [
    { required: true, message: '请输入显示名称' },
    { max: 255, message: '最多 255 字符' }
  ],
  type: [{ required: true, message: '请选择类型' }],
  language: [{ required: true, message: '请选择语言' }]
}
```

## 保存处理

### 保存草稿

```typescript
const handleSaveDraft = async () => {
  try {
    await form.validateFields()
    setSaving(true)

    const values = { ...form, status: 'draft' }

    if (mode === 'create') {
      const result = await createBenchmark(values)
      message.success('草稿已保存')
      navigate(`/benchmarks/${result.id}/edit`)
    } else {
      await updateBenchmark(benchmarkId, values)
      message.success('草稿已更新')
      setHasUnsavedChanges(false)
    }
  } finally {
    setSaving(false)
  }
}
```

### 提交审核

```typescript
const handleSubmit = async () => {
  try {
    await form.validateFields()
    setSaving(true)

    const values = { ...form, status: 'active', approval_status: 'pending' }

    if (mode === 'create') {
      const result = await createBenchmark(values)
      message.success('Benchmark 创建成功，已提交审核')
      navigate(`/benchmarks/${result.id}`)
    } else {
      await updateBenchmark(benchmarkId, values)
      message.success('Benchmark 已更新，已提交审核')
      navigate(`/benchmarks/${benchmarkId}`)
    }
  } finally {
    setSaving(false)
  }
}
```

## 离开提示

```tsx
<Prompt
  when={hasUnsavedChanges}
  message="有未保存的更改，确定要离开吗？"
/>

// 或使用 react-router 的导航拦截
useEffect(() => {
  const unblock = navigator.block((tx) => {
    if (hasUnsavedChanges) {
      Modal.confirm({
        title: '未保存的更改',
        content: '确定要离开吗？未保存的更改将丢失。',
        onOk: () => unblock(),
        onCancel: () => {}
      })
    } else {
      return true
    }
  })

  return () => unblock()
}, [hasUnsavedChanges])
```

## API 调用

```typescript
// POST /api/v1/benchmarks
const createBenchmark = async (data: CreateBenchmarkRequest): Promise<Benchmark> => {
  const res = await api.post('/benchmarks', data)
  return res.data
}

// PUT /api/v1/benchmarks/:id
const updateBenchmark = async (id: string, data: UpdateBenchmarkRequest): Promise<Benchmark> => {
  const res = await api.put(`/benchmarks/${id}`, data)
  return res.data
}

// GET /api/v1/benchmarks/:id (编辑时加载)
const fetchBenchmark = async (id: string): Promise<Benchmark> => {
  const res = await api.get(`/benchmarks/${id}`)
  return res.data
}
```

## 预览功能

```typescript
const handlePreview = () => {
  const values = form.getFieldsValue()

  Modal.info({
    title: '预览 Benchmark 配置',
    width: 800,
    content: (
      <pre style={{ maxHeight: 400, overflow: 'auto' }}>
        {JSON.stringify(values, null, 2)}
      </pre>
    )
  })
}
```
