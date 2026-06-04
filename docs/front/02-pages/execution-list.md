# 执行记录列表页

## 页面概览

- **路由**: `/executions`
- **所需权限**: 已登录用户
- **关联场景**: [任务执行](../01-scenarios/task-execution.md)

---

## 页面状态

```typescript
interface ExecutionListState {
  executions: ExecutionSummary[]
  total: number

  // 筛选
  filters: {
    status?: ExecutionStatus[]
    benchmark_id?: string
    agent_id?: string
    start_date?: string
    end_date?: string
  }

  // 分页
  pagination: {
    page: number
    pageSize: number
  }

  // 排序
  sorter: {
    field: string
    order: 'ascend' | 'descend'
  }

  // UI 状态
  loading: boolean
  autoRefresh: boolean  // 自动刷新
  selectedRowKeys: string[]
}
```

## 组件结构

```
ExecutionListPage
├── PageHeader
│   ├── 标题 "执行记录"
│   └── Actions
│       ├── 自动刷新开关
│       └── 导出按钮
├── FilterBar
│   ├── 状态筛选 (TagSelect)
│   ├── Benchmark 筛选 (Select)
│   ├── Agent 筛选 (Select)
│   ├── 日期范围 (RangePicker)
│   └── "重置" 按钮
├── ExecutionTable
│   ├── columns (见下表)
│   ├── rowSelection
│   ├── expandedRow (详情展开)
│   └── pagination
└── BatchActions (选中时显示)
    ├── "批量取消"
    └── "批量删除"
```

## 表格列定义

| 列名 | 字段 | 渲染 | 说明 |
|------|------|------|------|
| 选择 | - | Checkbox | 多选 |
| ID | id | Link + 复制 | 点击跳转详情 |
| Benchmark | benchmark_name | Link | 跳转到 Benchmark 详情 |
| Agent | agent_name | Tag | |
| 状态 | status | StatusBadge | 带动画效果 |
| 进度 | progress | Progress | running 时显示进度条 |
| 耗时 | duration_ms | 格式化 | "1m 23s" |
| 开始时间 | started_at | 相对时间 | "2 小时前" |
| 完成时间 | completed_at | 相对时间 | |
| 操作 | - | ActionButtons | 详情/日志/重试 |

### 状态徽标

```typescript
const statusConfig: Record<ExecutionStatus, { color: string; text: string; icon: string }> = {
  pending: { color: 'default', text: '等待中', icon: 'ClockCircleOutlined' },
  queued: { color: 'blue', text: '队列中', icon: 'HourglassOutlined' },
  running: { color: 'processing', text: '运行中', icon: 'LoadingOutlined' },
  completed: { color: 'success', text: '已完成', icon: 'CheckCircleOutlined' },
  failed: { color: 'error', text: '失败', icon: 'CloseCircleOutlined' },
  cancelled: { color: 'default', text: '已取消', icon: 'StopOutlined' },
  timeout: { color: 'warning', text: '超时', icon: 'ExclamationCircleOutlined' }
}
```

### 进度条

```tsx
const renderProgress = (record: ExecutionSummary) => {
  if (record.status === 'running') {
    return (
      <Progress
        percent={record.progress || 0}
        size="small"
        status="active"
      />
    )
  }
  if (record.status === 'completed') {
    return <Progress percent={100} size="small" status="success" />
  }
  if (record.status === 'failed' || record.status === 'timeout') {
    return <Progress percent={100} size="small" status="exception" />
  }
  return <Progress percent={0} size="small" />}
```

## 筛选器

```tsx
<Space wrap>
  {/* 状态筛选 */}
  <Select
    mode="multiple"
    placeholder="状态筛选"
    value={filters.status}
    onChange={(status) => setFilters({ ...filters, status })}
    style={{ width: 200 }}
    allowClear
  >
    <Select.Option value="running">运行中</Select.Option>
    <Select.Option value="completed">已完成</Select.Option>
    <Select.Option value="failed">失败</Select.Option>
    <Select.Option value="cancelled">已取消</Select.Option>
  </Select>

  {/* Benchmark 筛选 */}
  <Select
    placeholder="Benchmark"
    value={filters.benchmark_id}
    onChange={(benchmark_id) => setFilters({ ...filters, benchmark_id })}
    style={{ width: 200 }}
    allowClear
    showSearch
    options={benchmarks.map(bm => ({ label: bm.display_name, value: bm.id }))}
  />

  {/* Agent 筛选 */}
  <Select
    placeholder="Agent"
    value={filters.agent_id}
    onChange={(agent_id) => setFilters({ ...filters, agent_id })}
    style={{ width: 200 }}
    allowClear
    showSearch
    options={agents.map(a => ({ label: a.name, value: a.id }))}
  />

  {/* 日期范围 */}
  <RangePicker
    value={filters.dateRange}
    onChange={(dates) => {
      setFilters({
        ...filters,
        start_date: dates?.[0]?.format('YYYY-MM-DD'),
        end_date: dates?.[1]?.format('YYYY-MM-DD')
      })
    }}
  />

  {/* 重置按钮 */}
  <Button icon={<ReloadOutlined />} onClick={resetFilters}>
    重置
  </Button>
</Space>
```

## 展开行

```tsx
<Table
  expandable={{
    expandedRowRender: (record) => (
      <ExecutionExpandRow execution={record} />
    ),
    columnWidth: 40
  }}
/>
```

### 展开内容

```tsx
function ExecutionExpandRow({ execution }: { execution: ExecutionSummary }) {
  const [detail, setDetail] = useState<ExecutionDetail | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (execution.status === 'running' || execution.status === 'completed') {
      loadDetail()
    }
  }, [execution.id, execution.status])

  const loadDetail = async () => {
    setLoading(true)
    try {
      const data = await fetchExecutionDetail(execution.id)
      setDetail(data)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <Spin />
  }

  if (!detail) {
    return <Empty description="暂无详情" />
  }

  return (
    <Card size="small">
      <Row gutter={16}>
        <Col span={12}>
          <Descriptions column={1} size="small">
            <Descriptions.Item label="结果">
              {detail.result?.success ? (
                <Tag color="success">成功</Tag>
              ) : (
                <Tag color="error">失败</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label="退出码">
              {detail.result?.exit_code}
            </Descriptions.Item>
            <Descriptions.Item label="Token 使用">
              {detail.result?.tokens_used || '-'}
            </Descriptions.Item>
            <Descriptions.Item label="成本">
              ${detail.result?.cost?.toFixed(4) || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Col>
        <Col span={12}>
          <div style={{ maxHeight: 200, overflow: 'auto' }}>
            <Typography.Text>
              <pre style={{ margin: 0, fontSize: 12 }}>
                {detail.result?.output || '(无输出)'}
              </pre>
            </Typography.Text>
            {detail.result?.error && (
              <Typography.Text type="danger">
                <pre style={{ margin: 0, fontSize: 12 }}>
                  {detail.result.error}
                </pre>
              </Typography.Text>
            )}
          </div>
        </Col>
      </Row>
      {detail.artifacts?.length > 0 && (
        <>
          <Divider />
          <Space>
            {detail.artifacts.map(artifact => (
              <Button
                key={artifact.name}
                size="small"
                href={artifact.download_url}
              >
                <DownloadOutlined /> {artifact.name}
              </Button>
            ))}
          </Space>
        </>
      )}
    </Card>
  )
}
```

## 操作按钮

```tsx
const renderActions = (record: ExecutionSummary) => {
  const canCancel = record.status === 'pending' || record.status === 'queued'
  const canRetry = record.status === 'failed' || record.status === 'timeout'

  return (
    <Space>
      <Button type="link" onClick={() => navigate(`/executions/${record.id}`)}>
        详情
      </Button>
      {canCancel && (
        <Popconfirm
          title="确认取消"
          description="确定要取消这个执行任务吗？"
          onConfirm={() => cancelExecution(record.id)}
        >
          <Button type="link" danger>取消</Button>
        </Popconfirm>
      )}
      {canRetry && (
        <Button type="link" onClick={() => retryExecution(record.id)}>
          重试
        </Button>
      )}
      <Button type="link" onClick={() => downloadLogs(record.id)}>
        日志
      </Button>
    </Space>
  )
}
```

## 自动刷新

```tsx
<Switch
  checked={autoRefresh}
  onChange={(checked) => {
    setAutoRefresh(checked)
    if (checked) {
      // 启动定时刷新
      startPolling()
    } else {
      stopPolling()
    }
  }}
/>
<span>自动刷新</span>
```

```typescript
useEffect(() => {
  if (!autoRefresh) return

  const interval = setInterval(() => {
    fetchExecutions()
  }, 5000)  // 每 5 秒刷新

  return () => clearInterval(interval)
}, [autoRefresh, filters])
```

## API 调用

```typescript
// GET /api/v1/executions
const fetchExecutions = async (params: ExecutionFilter): Promise<PaginatedResponse<ExecutionSummary>> => {
  const res = await api.get('/executions', { params })
  return res.data
}

// POST /api/v1/executions/:id/cancel
const cancelExecution = async (id: string): Promise<void> => {
  await api.post(`/executions/${id}/cancel`)
}

// POST /api/v1/executions/:id/retry
const retryExecution = async (id: string): Promise<Execution> => {
  const res = await api.post(`/executions/${id}/retry`)
  return res.data
}

// GET /api/v1/executions/:id/logs/download
const downloadLogs = async (id: string): Promise<void> => {
  const res = await api.get(`/executions/${id}/logs/download`, {
    responseType: 'blob'
  })

  const url = window.URL.createObjectURL(new Blob([res.data]))
  const a = document.createElement('a')
  a.href = url
  a.download = `execution-${id}-logs.txt`
  a.click()
  window.URL.revokeObjectURL(url)
}
```
