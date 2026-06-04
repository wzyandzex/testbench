# 批量执行页

## 页面概览

- **路由**: `/batch-executions` | `/batch-executions/:id`
- **所需权限**: 已登录用户
- **关联场景**: [任务执行](../01-scenarios/task-execution.md)

---

## 页面状态 (列表页)

```typescript
interface BatchListState {
  batches: BatchSummary[]
  total: number

  // 筛选
  filters: {
    status?: BatchStatus
    createdBy?: string
  }

  // 分页
  pagination: {
    page: number
    pageSize: number
  }

  loading: boolean
  autoRefresh: boolean
}
```

## 页面状态 (详情页)

```typescript
interface BatchDetailState {
  batch: BatchExecution | null
  tasks: BatchTaskProgress[]
  report: BatchReport | null

  // WebSocket
  connected: boolean
  progress: {
    total: number
    completed: number
    failed: number
    percentage: number
  }

  // UI 状态
  loading: boolean
  activeTab: 'overview' | 'tasks' | 'matrix' | 'report'
  taskFilters: {
    agent_id?: string
    benchmark_id?: string
    status?: BatchTaskStatus[]
  }
}
```

## 组件结构 (列表页)

```
BatchListPage
├── PageHeader
│   ├── 标题 "批量执行"
│   └── "创建批量任务" 按钮
├── FilterBar
│   ├── 状态筛选
│   └── 创建者筛选
└── BatchTable
    ├── columns
    └── pagination
```

## 组件结构 (详情页)

```
BatchDetailPage
├── PageHeader
│   ├── 返回按钮
│   ├── 标题 (batch.name)
│   ├── 状态标签
│   └── Actions
│       ├── "取消" (running 时)
│       └── "下载报告" (completed 时)
├── ProgressCard
│   ├── 总体进度条
│   ├── 统计卡片
│   └── 耗时信息
├── Tabs
│   ├── 概览 Tab
│   │   └── 基本信息
│   ├── 任务列表 Tab
│   │   ├── 筛选器
│   │   └── 任务表格
│   ├── 矩阵 Tab
│   │   └── Agent × Benchmark 矩阵
│   └── 报告 Tab
│       └── 报告内容 (完成后)
└── TaskDetailModal (点击任务显示详情)
```

## 创建批量任务对话框

```tsx
<Modal
  title="创建批量执行"
  open={visible}
  onCancel={() => setVisible(false)}
  width={800}
  footer={[
    <Button key="cancel" onClick={() => setVisible(false)}>
      取消
    </Button>,
    <Button key="submit" type="primary" loading={submitting} onClick={handleSubmit}>
      创建
    </Button>
  ]}
>
  <Form layout="vertical">
    {/* 基本信息 */}
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          label="名称"
          name="name"
          rules={[{ required: true, message: '请输入名称' }]}
        >
          <Input placeholder="批量执行名称" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="描述" name="description">
          <Input placeholder="可选描述" />
        </Form.Item>
      </Col>
    </Row>

    {/* Agent 选择 */}
    <Form.Item
      label="选择 Agent"
      name="agent_ids"
      rules={[{ required: true, message: '请选择至少一个 Agent' }]}
    >
      <Select
        mode="multiple"
        placeholder="选择要测试的 Agent"
        options={agents.map(a => ({ label: a.name, value: a.id }))}
        maxTagCount={3}
      />
    </Form.Item>

    {/* Benchmark 选择 */}
    <Form.Item
      label="选择 Benchmark"
      name="benchmark_ids"
      rules={[{ required: true, message: '请选择至少一个 Benchmark' }]}
    >
      <Select
        mode="multiple"
        placeholder="选择要执行的 Benchmark"
        options={benchmarks.map(bm => ({ label: bm.display_name, value: bm.id }))}
        maxTagCount={3}
        showSearch
      />
    </Form.Item>

    {/* 预估信息 */}
    {agentIds.length > 0 && benchmarkIds.length > 0 && (
      <Alert
        message="预估"
        description={`将创建 ${agentIds.length} × ${benchmarkIds.length} = ${agentIds.length * benchmarkIds.length} 个执行任务`}
        type="info"
        showIcon
      />
    )}

    {/* 高级配置 */}
    <Form.Item label="高级配置">
      <Collapse>
        <Panel header="任务配置" key="task">
          <Form.Item name={['task_config', 'max_steps']} label="最大步数">
            <InputNumber min={1} max={1000} />
          </Form.Item>
          <Form.Item name={['task_config', 'timeout']} label="超时时间 (秒)">
            <InputNumber min={60} max={3600} />
          </Form.Item>
          <Form.Item name={['task_config', 'priority']} label="优先级">
            <Select>
              <Select.Option value="p1">P1 (高)</Select.Option>
              <Select.Option value="p2">P2 (中)</Select.Option>
              <Select.Option value="p3">P3 (低)</Select.Option>
            </Select>
          </Form.Item>
        </Panel>

        <Panel header="执行选项" key="options">
          <Form.Item name={['options', 'parallel']} label="并行执行" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name={['options', 'max_parallel']} label="最大并行数">
            <InputNumber min={1} max={50} />
          </Form.Item>
          <Form.Item name={['options', 'stop_on_first_failure']} label="首次失败时停止" valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item name={['options', 'generate_report']} label="生成报告" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Panel>
      </Collapse>
    </Form.Item>
  </Form>
</Modal>
```

## 详情页 - 进度卡片

```tsx
<Card title="执行进度" bordered={false}>
  {/* 进度条 */}
  <Progress
    percent={progress.percentage}
    status={
      batch.status === 'failed' ? 'exception' :
      batch.status === 'completed' ? 'success' :
      'normal'
    }
  />

  <Row gutter={16} style={{ marginTop: 16 }}>
    <Col span={6}>
      <Statistic title="总任务" value={batch.total_tasks} />
    </Col>
    <Col span={6}>
      <Statistic
        title="已完成"
        value={batch.completed_tasks}
        valueStyle={{ color: '#3f8600' }}
      />
    </Col>
    <Col span={6}>
      <Statistic
        title="运行中"
        value={batch.running_tasks}
        valueStyle={{ color: '#1890ff' }}
      />
    </Col>
    <Col span={6}>
      <Statistic
        title="失败"
        value={batch.failed_tasks}
        valueStyle={{ color: '#cf1322' }}
      />
    </Col>
  </Row>

  {/* 耗时 */}
  {batch.started_at && (
    <div style={{ marginTop: 16 }}>
      <Text type="secondary">
        耗时: {formatDuration(batch.started_at, batch.completed_at || new Date())}
      </Text>
    </div>
  )}
</Card>
```

## 详情页 - 报告 Tab

```tsx
{report && (
  <div>
    {/* 概览统计 */}
    <Row gutter={16}>
      <Col span={6}>
        <Card>
          <Statistic title="总任务" value={report.summary.total_tasks} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="成功率" value={report.summary.success_rate} suffix="%" precision={1} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="平均耗时" value={formatDuration(report.summary.avg_duration)} />
        </Card>
      </Col>
      <Col span={6}>
        <Card>
          <Statistic title="总成本" value={report.summary.total_cost} prefix="$" precision={4} />
        </Card>
      </Col>
    </Row>

    {/* Agent 对比表格 */}
    <Card title="Agent 对比" style={{ marginTop: 16 }}>
      <Table
        columns={[
          { title: 'Agent', dataIndex: 'agent_name' },
          { title: '执行次数', dataIndex: 'total_executions' },
          { title: '成功', dataIndex: 'success_count' },
          { title: '失败', dataIndex: 'failed_count' },
          { title: '成功率', dataIndex: 'success_rate', render: (v) => `${v.toFixed(1)}%` },
          { title: '平均耗时', dataIndex: 'avg_duration', render: (v) => formatDuration(v) },
          { title: 'Token 使用', dataIndex: 'total_tokens' },
          { title: '成本', dataIndex: 'total_cost', render: (v) => `$${v.toFixed(4)}` }
        ]}
        dataSource={report.agent_comparison}
        rowKey="agent_id"
        pagination={false}
      />
    </Card>

    {/* 排名 */}
    <Card title="Agent 排名" style={{ marginTop: 16 }}>
      <Row gutter={16}>
        <Col span={12}>
          <h4>成功率排名</h4>
          <List
            dataSource={report.rankings.by_success_rate}
            renderItem={(item, index) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Badge count={index + 1} />}
                  title={item.agent_name}
                  description={`${item.value} ${item.unit}`}
                />
              </List.Item>
            )}
          />
        </Col>
        <Col span={12}>
          <h4>速度排名</h4>
          <List
            dataSource={report.rankings.by_speed}
            renderItem={(item, index) => (
              <List.Item>
                <List.Item.Meta
                  avatar={<Badge count={index + 1} />}
                  title={item.agent_name}
                  description={`${item.value} ${item.unit}`}
                />
              </List.Item>
            )}
          />
        </Col>
      </Row>
    </Card>
  </div>
)}
```

## WebSocket 订阅

```typescript
useEffect(() => {
  if (!batchId) return

  const unsubscribe = wsStore.subscribe(
    { batch_id: batchId },
    (message) => {
      switch (message.event) {
        case 'batch_progress':
          setProgress({
            total: message.data.total_count,
            completed: message.data.completed_count,
            failed: message.data.failed || 0,
            percentage: message.data.percentage
          })
          if (activeTab === 'tasks') {
            fetchBatchTasks()
          }
          break

        case 'batch_status_change':
          setBatch(prev => ({ ...prev, status: message.data.status }))
          break

        case 'batch_completed':
          message.success('批量执行完成')
          fetchBatchReport()
          break

        case 'batch_failed':
          message.error(`批量执行失败: ${message.data.error}`)
          break
      }
    }
  )

  return () => unsubscribe()
}, [batchId])
```

## API 调用

```typescript
// 创建批量任务
const createBatch = async (data: CreateBatchRequest): Promise<CreateBatchResponse> => {
  const res = await api.post('/batch-executions', data)
  return res.data
}

// 获取批量任务详情
const fetchBatchDetail = async (id: string): Promise<BatchExecution> => {
  const res = await api.get(`/batch-executions/${id}`)
  return res.data.data
}

// 获取批量任务列表
const fetchBatchTasks = async (
  id: string,
  filters: BatchTaskFilter
): Promise<{ data: BatchTaskProgress[], total: number }> => {
  const res = await api.get(`/batch-executions/${id}/tasks`, { params: filters })
  return res.data
}

// 获取批量报告
const fetchBatchReport = async (id: string): Promise<BatchReport> => {
  const res = await api.get(`/batch-executions/${id}/report`)
  return res.data
}

// 取消批量任务
const cancelBatch = async (id: string): Promise<void> => {
  await api.post(`/batch-executions/${id}/cancel`)
}
```
