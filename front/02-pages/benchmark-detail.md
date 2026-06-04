# Benchmark 详情页

## 页面概览

- **路由**: `/benchmarks/:id`
- **所需权限**: 已登录用户
- **关联场景**: [Benchmark 管理](../01-scenarios/benchmark-management.md)

---

## 页面状态

```typescript
interface BenchmarkDetailState {
  benchmark: BenchmarkDetail | null
  stats: BenchmarkStats | null
  executions: Execution[]
  loading: boolean
  activeTab: string  // 'overview' | 'config' | 'executions' | 'history'
}
```

## 组件结构

```
BenchmarkDetailPage
├── PageHeader
│   ├── 返回按钮
│   ├── 标题 (display_name)
│   ├── 状态标签 (status, approval_status)
│   └── Actions
│       ├── "编辑" 按钮
│       ├── "执行" 按钮
│       └── "更多" 下拉菜单
│           ├── "复制"
│           ├── "导出"
│           └── "删除"
├── Content
│   ├── OverviewTab (概览)
│   │   ├── 基本信息卡片
│   │   ├── 统计卡片
│   │   └── 标签列表
│   ├── ConfigTab (配置)
│   │   ├── Benchmark 配置
│   │   └── 测试配置
│   └── ExecutionsTab (执行记录)
│       └── ExecutionTable (简化版)
```

## 基本信息卡片

```typescript
interface BasicInfo {
  name: string
  display_name: string
  description: string
  type: BenchmarkType
  language: string
  difficulty: DifficultyLevel
  category: string
  visibility: Visibility
  created_by: string
  created_at: string
  updated_at: string
}
```

### 字段渲染

| 字段 | 渲染方式 |
|------|----------|
| type | Tag: code_fix=蓝, code_complete=绿, terminal=紫 |
| language | Badge |
| difficulty | Tag: easy=绿, medium=黄, hard=橙, expert=红 |
| visibility | Icon: public=地球, private=锁, org=团队 |
| created_at | 相对时间 + Tooltip 显示完整时间 |

## 统计卡片

```typescript
interface StatsCards {
  total_runs: number      // 总执行次数
  passed_runs: number     // 成功次数
  failed_runs: number     // 失败次数
  timeout_runs: number    // 超时次数
  success_rate: number    // 成功率 (%)
  avg_duration: number    // 平均耗时 (毫秒)
  last_run_at: string     // 最后执行时间
}
```

### 展示方式

```tsx
<Row gutter={16}>
  <Col span={6}>
    <Statistic title="总执行" value={stats.total_runs} />
  </Col>
  <Col span={6}>
    <Statistic
      title="成功率"
      value={stats.success_rate}
      suffix="%"
      valueStyle={{ color: stats.success_rate >= 80 ? 'green' : 'red' }}
    />
  </Col>
  <Col span={6}>
    <Statistic
      title="平均耗时"
      value={formatDuration(stats.avg_duration)}
    />
  </Col>
  <Col span={6}>
    <Statistic
      title="最后执行"
      value={formatRelativeTime(stats.last_run_at)}
    />
  </Col>
</Row>
```

## 配置展示

### Benchmark 配置

折叠面板展示，JSON 格式化：

```typescript
interface ConfigDisplay {
  initial_state: {
    repo_url?: string
    files: Record<string, string>
  }
  instructions: {
    user_prompt: string
    hints?: string[]
  }
  goal: string
  constraints?: string[]
  success_criteria?: string[]
  resource_limits: {
    max_memory_mb: number
    max_cpu_count: number
    network_access: boolean
  }
  agent_config: {
    mode: string
    tools: string[]
    temperature: number
    max_steps: number
  }
}
```

### 文件列表

```tsx
<Table
  columns={[
    { title: '文件名', dataIndex: 'filename', key: 'filename' },
    { title: '大小', render: (_, file) => formatSize(file.size) },
    { title: '操作', render: (_, file) => <a onClick={() => viewFile(file.path)}>查看</a> }
  ]}
  dataSource={Object.entries(config.initial_state.files).map(([path, content]) => ({
    filename: path,
    content,
    size: content.length
  }))}
  pagination={false}
/>
```

## 执行记录标签

简化版执行列表，支持筛选和分页：

```typescript
interface ExecutionsTabState {
  executions: Execution[]
  loading: boolean
  statusFilter?: ExecutionStatus
  pagination: {
    page: number
    pageSize: number
    total: number
  }
}
```

## 操作按钮

### 执行按钮

```typescript
const handleExecute = () => {
  // 打开执行对话框
  setExecuteModalVisible(true)
}

// ExecuteModal 内容
interface ExecuteModalState {
  agent_id: string
  priority?: 'p1' | 'p2' | 'p3'
  config?: {
    max_steps?: number
    timeout?: number
  }
}
```

### 编辑按钮

```typescript
const handleEdit = () => {
  navigate(`/benchmarks/${benchmark.id}/edit`)
}
```

### 复制按钮

```typescript
const handleCopy = async () => {
  const newBenchmark = await duplicateBenchmark(benchmark.id)
  message.success('复制成功')
  navigate(`/benchmarks/${newBenchmark.id}/edit`)
}
```

### 删除按钮

```typescript
const handleDelete = () => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这个 Benchmark 吗？',
    okText: '删除',
    okType: 'danger',
    onOk: async () => {
      await deleteBenchmark(benchmark.id)
      message.success('删除成功')
      navigate('/benchmarks')
    }
  })
}
```

## API 调用

```typescript
// GET /api/v1/benchmarks/:id
const fetchBenchmarkDetail = async (id: string): Promise<BenchmarkDetail> => {
  const res = await api.get(`/benchmarks/${id}`)
  return res.data
}

// GET /api/v1/benchmarks/:id/stats
const fetchBenchmarkStats = async (id: string): Promise<BenchmarkStats> => {
  const res = await api.get(`/benchmarks/${id}/stats`)
  return res.data
}

// POST /api/v1/benchmarks/:id/duplicate
const duplicateBenchmark = async (id: string): Promise<Benchmark> => {
  const res = await api.post(`/benchmarks/${id}/duplicate`)
  return res.data
}

// DELETE /api/v1/benchmarks/:id
const deleteBenchmark = async (id: string): Promise<void> => {
  await api.delete(`/benchmarks/${id}`)
}
```

## 权限控制

| 操作 | 所需权限 |
|------|----------|
| 查看详情 | 任何可见权限 |
| 编辑 | 创建者或 admin |
| 执行 | 组织内成员 |
| 复制 | 组织内成员 |
| 删除 | 创建者或 admin |

```typescript
const canEdit = benchmark.created_by === user.id || user.role === 'admin'
const canDelete = benchmark.created_by === user.id || orgStore.hasRole('admin')
```
