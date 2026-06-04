# 执行详情页

## 页面概览

- **路由**: `/executions/:id`
- **所需权限**: 已登录用户
- **关联场景**: [任务执行](../01-scenarios/task-execution.md)

---

## 页面状态

```typescript
interface ExecutionDetailState {
  execution: ExecutionDetail | null
  logs: LogEntry[]
  progress: ExecutionProgress

  // UI 状态
  loading: boolean
  cancelling: boolean
  autoScroll: boolean  // 日志自动滚动
  logLevelFilter: LogLevel
}
```

## 组件结构

```
ExecutionDetailPage
├── PageHeader
│   ├── 返回按钮
│   ├── Title (execution_id)
│   └── Actions
│       ├── "取消执行" (running 时显示)
│       ├── "重试" (failed 时显示)
│       └── "下载日志"
├── StatusCard
│   ├── 状态徽标
│   ├── 进度条
│   ├── 耗时统计
│   └── 资源使用
├── ResultCard (completed/failed 时显示)
│   ├── 成功/失败图标
│   ├── 输出内容
│   └── 错误信息
├── LogPanel
│   ├── 工具栏
│   │   ├── 日志级别筛选
│   │   ├── 自动滚动开关
│   │   ├── 清空日志
│   │   └── 下载日志
│   └── 日志内容区
│       ├── 时间戳
│       ├── 级别标签
│       └── 消息内容
└── ArtifactList (产物列表)
    ├── 文件名
    ├── 大小
    └── 下载链接
```

## API 调用

```typescript
// GET /api/v1/executions/:id
const fetchExecutionDetail = async (id: string): Promise<ExecutionDetail> => {
  const res = await api.get(`/executions/${id}`)
  return res.data.data
}

// POST /api/v1/executions/:id/cancel
const cancelExecution = async (id: string): Promise<void> => {
  await api.post(`/executions/${id}/cancel`)
}

// POST /api/v1/executions/:id/retry
const retryExecution = async (id: string): Promise<Execution> => {
  const res = await api.post(`/executions/${id}/retry`)
  return res.data.data
}
```

## WebSocket 订阅

```typescript
useEffect(() => {
  if (!executionId) return

  // 订阅执行进度
  const unsubscribe = wsStore.subscribe(executionId, (message) => {
    switch (message.event) {
      case 'execution_progress':
        setProgress(message.data)
        break
      case 'execution_log':
        setLogs(prev => [...prev, message.data])
        break
      case 'execution_completed':
        setExecution(message.data)
        break
      case 'execution_failed':
        setError(message.data.error)
        break
    }
  })

  return () => unsubscribe()
}, [executionId])
```

## 进度计算

```typescript
const progressPercentage = useMemo(() => {
  if (!execution) return 0

  switch (execution.status) {
    case 'pending':
    case 'queued':
      return 0
    case 'running':
      return progress?.percentage || 0
    case 'completed':
    case 'failed':
    case 'cancelled':
    case 'timeout':
      return 100
    default:
      return 0
  }
}, [execution?.status, progress])
```

## 日志展示

### 日志级别颜色

```typescript
const logLevelColors: Record<LogLevel, string> = {
  debug: '#999',
  info: '#1890ff',
  warn: '#faad14',
  error: '#ff4d4f'
}
```

### 日志自动滚动

```typescript
const logContainerRef = useRef<HTMLDivElement>(null)

useEffect(() => {
  if (autoScroll && logContainerRef.current) {
    logContainerRef.current.scrollTop =
      logContainerRef.current.scrollHeight
  }
}, [logs, autoScroll])
```

## 事件处理

### onCancel

```typescript
const onCancel = async () => {
  Modal.confirm({
    title: '确认取消',
    content: '确定要取消这个执行任务吗？',
    onOk: async () => {
      setCancelling(true)
      try {
        await cancelExecution(executionId)
        message.success('任务已取消')
        fetchExecutionDetail()
      } finally {
        setCancelling(false)
      }
    }
  })
}
```

### onRetry

```typescript
const onRetry = async () => {
  setCancelling(true)
  try {
    const newExecution = await retryExecution(executionId)
    message.success('已创建重试任务')
    navigate(`/executions/${newExecution.id}`)
  } finally {
    setCancelling(false)
  }
}
```

### onDownloadLogs

```typescript
const onDownloadLogs = () => {
  const logText = logs
    .map(log => `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}`)
    .join('\n')

  const blob = new Blob([logText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `execution-${executionId}-logs.txt`
  a.click()
  URL.revokeObjectURL(url)
}
```

## 轮询降级

当 WebSocket 不可用时，使用轮询：

```typescript
useEffect(() => {
  if (wsStore.connected) return // WebSocket 正常时不轮询

  const interval = setInterval(async () => {
    if (execution?.status === 'running') {
      await fetchExecutionDetail()
    }
  }, 2000)

  return () => clearInterval(interval)
}, [execution?.status, wsStore.connected])
```
