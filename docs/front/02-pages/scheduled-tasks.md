# 定时任务页

## 页面概览

- **路由**: `/scheduled-tasks`
- **所需权限**: 已登录用户
- **关联场景**: [定时任务](../01-scenarios/scheduled-tasks.md)

---

## 页面状态

```typescript
interface ScheduledTasksPageState {
  tasks: ScheduledTask[]
  total: number

  // 筛选
  filters: {
    status?: ScheduledTaskStatus
  }

  // 分页
  pagination: {
    page: number
    pageSize: number
  }

  loading: boolean

  // 模态框
  createModalVisible: boolean
  editingTask: ScheduledTask | null
}
```

## 组件结构

```
ScheduledTasksPage
├── PageHeader
│   ├── 标题 "定时任务"
│   └── "创建定时任务" 按钮
├── FilterBar
│   └── 状态筛选
└── TaskTable
    ├── columns
    └── pagination
```

## 表格列定义

| 列名 | 字段 | 渲染 |
|------|------|------|
| 名称 | name/display_name | Link 点击跳转详情 |
| Cron 表达式 | schedule_config.cron_expression | Monospace 字体 |
| 下次执行 | next_run_time | 相对时间 |
| 执行次数 | execution_count | 数字 |
| 状态 | status | Tag: active=绿, paused=黄, disabled=灰 |
| 创建者 | created_by | 用户名 |
| 创建时间 | created_at | 相对时间 |
| 操作 | - | Actions |

## 操作按钮

```tsx
const renderActions = (record: ScheduledTask) => {
  const canPause = record.status === 'active'
  const canResume = record.status === 'paused'
  const canTrigger = record.status !== 'disabled'

  return (
    <Space>
      {canPause && (
        <Button
          size="small"
          onClick={() => pauseTask(record.id)}
        >
          暂停
        </Button>
      )}
      {canResume && (
        <Button
          size="small"
          type="primary"
          onClick={() => resumeTask(record.id)}
        >
          恢复
        </Button>
      )}
      {canTrigger && (
        <Button
          size="small"
          onClick={() => triggerTask(record.id)}
        >
          立即执行
        </Button>
      )}
      <Dropdown
        menu={{
          items: [
            { key: 'view', label: '查看详情', onClick: () => navigate(`/scheduled-tasks/${record.id}`) },
            { key: 'edit', label: '编辑', onClick: () => openEditModal(record) },
            { key: 'runs', label: '执行历史', onClick: () => viewRunHistory(record.id) },
            { key: 'delete', label: '删除', danger: true, onClick: () => deleteTask(record.id) }
          ]
        }}
      >
        <Button size="small" icon={<MoreOutlined />} />
      </Dropdown>
    </Space>
  )
}
```

## 创建/编辑对话框

```tsx
<Modal
  title={editingTask ? '编辑定时任务' : '创建定时任务'}
  open={visible}
  onCancel={() => setVisible(false)}
  width={800}
  footer={[
    <Button key="cancel" onClick={() => setVisible(false)}>
      取消
    </Button>,
    <Button key="submit" type="primary" loading={submitting} onClick={handleSubmit}>
      {editingTask ? '保存' : '创建'}
    </Button>
  ]}
>
  <Form layout="vertical" form={form} initialValues={defaultValues}>
    {/* 基本信息 */}
    <Row gutter={16}>
      <Col span={12}>
        <Form.Item
          label="名称"
          name="name"
          rules={[{ required: true, message: '请输入名称' }]}
        >
          <Input placeholder="定时任务名称" />
        </Form.Item>
      </Col>
      <Col span={12}>
        <Form.Item label="描述" name="description">
          <Input placeholder="可选描述" />
        </Form.Item>
      </Col>
    </Row>

    {/* Benchmark 和 Agent 选择 */}
    <Form.Item
      label="Benchmark"
      name="benchmark_ids"
      rules={[{ required: true, message: '请选择至少一个 Benchmark' }]}
    >
      <Select
        mode="multiple"
        placeholder="选择要执行的 Benchmark"
        options={benchmarks.map(bm => ({ label: bm.display_name, value: bm.id }))}
      />
    </Form.Item>

    <Form.Item
      label="Agent"
      name="agent_ids"
      rules={[{ required: true, message: '请选择至少一个 Agent' }]}
    >
      <Select
        mode="multiple"
        placeholder="选择要使用的 Agent"
        options={agents.map(a => ({ label: a.name, value: a.id }))}
      />
    </Form.Item>

    {/* Cron 表达式 */}
    <Form.Item
      label="Cron 表达式"
      name={['schedule_config', 'cron_expression']}
      rules={[{ required: true, message: '请输入 Cron 表达式' }]}
      extra={
        <Space>
          <Link onClick={() => setPreset('*/5 * * * *')}>每5分钟</Link>
          <Link onClick={() => setPreset('0 * * * *')}>每小时</Link>
          <Link onClick={() => setPreset('0 0 * * *')}>每天0点</Link>
          <Link onClick={() => setPreset('0 0 * * 1')}>每周一0点</Link>
        </Space>
      }
    >
      <Input placeholder="* * * * *" />
    </Form.Item>

    <Form.Item label="下次执行时间预览">
      <Text code>{getNextRunTime(cronExpression)}</Text>
    </Form.Item>

    <Form.Item label="时区" name={['schedule_config', 'timezone']}>
      <Select showSearch>
        {timezones.map(tz => (
          <Select.Option key={tz.value} value={tz.value}>
            {tz.label}
          </Select.Option>
        ))}
      </Select>
    </Form.Item>

    {/* 执行配置 */}
    <Collapse>
      <Panel header="执行配置" key="execution">
        <Form.Item name={['execution_config', 'priority']} label="优先级">
          <Select>
            <Select.Option value="p1">P1 (高)</Select.Option>
            <Select.Option value="p2">P2 (中)</Select.Option>
            <Select.Option value="p3">P3 (低)</Select.Option>
          </Select>
        </Form.Item>
        <Form.Item name={['execution_config', 'timeout']} label="超时时间 (秒)">
          <InputNumber min={60} max={3600} />
        </Form.Item>
        <Form.Item name={['execution_config', 'max_steps']} label="最大步数">
          <InputNumber min={1} max={1000} />
        </Form.Item>
      </Panel>

      <Panel header="重试配置" key="retry">
        <Form.Item name={['retry_config', 'enabled']} label="启用重试" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name={['retry_config', 'max_retries']} label="最大重试次数">
          <InputNumber min={1} max={10} />
        </Form.Item>
      </Panel>

      <Panel header="通知配置" key="notification">
        <Form.Item name={['notification_config', 'enabled']} label="启用通知" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name={['notification_config', 'on_success']} label="成功时通知" valuePropName="checked">
          <Switch />
        </Form.Item>
        <Form.Item name={['notification_config', 'on_failure']} label="失败时通知" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Panel>
    </Collapse>

    {/* 启用状态 */}
    <Form.Item name="enabled" label="状态" valuePropName="checked">
      <Switch checkedChildren="启用" unCheckedChildren="禁用" />
    </Form.Item>
  </Form>
</Modal>
```

## Cron 表达式校验

```typescript
const validateCronExpression = async (_: any, value: string) => {
  if (!value) return Promise.reject('请输入 Cron 表达式')

  // 简单校验 (5-7 个部分)
  const parts = value.trim().split(/\s+/)
  if (parts.length < 5 || parts.length > 7) {
    return Promise.reject('Cron 表达式应为 5-7 个部分')
  }

  // 校验每部分
  const cronRegex = /^(\*|[\d\-,/]+)$/
  for (const part of parts) {
    if (!cronRegex.test(part)) {
      return Promise.reject(`无效的部分: ${part}`)
    }
  }

  return Promise.resolve()
}
```

## API 调用

```typescript
// GET /api/v1/scheduled-tasks
const fetchScheduledTasks = async (params: {
  page?: number
  page_size?: number
  status?: string
}): Promise<PaginatedResponse<ScheduledTask>> => {
  const res = await api.get('/scheduled-tasks', { params })
  return res.data
}

// POST /api/v1/scheduled-tasks
const createScheduledTask = async (data: CreateScheduledTaskRequest): Promise<ScheduledTask> => {
  const res = await api.post('/scheduled-tasks', data)
  return res.data.data
}

// PUT /api/v1/scheduled-tasks/:id
const updateScheduledTask = async (id: string, data: UpdateScheduledTaskRequest): Promise<void> => {
  await api.put(`/scheduled-tasks/${id}`, data)
}

// POST /api/v1/scheduled-tasks/:id/pause
const pauseTask = async (id: string): Promise<void> => {
  await api.post(`/scheduled-tasks/${id}/pause`)
}

// POST /api/v1/scheduled-tasks/:id/resume
const resumeTask = async (id: string): Promise<void> => {
  await api.post(`/scheduled-tasks/${id}/resume`)
}

// POST /api/v1/scheduled-tasks/:id/trigger
const triggerTask = async (id: string): Promise<TaskRun> => {
  const res = await api.post(`/scheduled-tasks/${id}/trigger`)
  return res.data
}

// DELETE /api/v1/scheduled-tasks/:id
const deleteTask = async (id: string): Promise<void> => {
  await api.delete(`/scheduled-tasks/${id}`)
}

// GET /api/v1/scheduled-tasks/:id/runs
const fetchTaskRuns = async (id: string, params: {
  page?: number
  page_size?: number
}): Promise<{ data: TaskRun[], total: number }> => {
  const res = await api.get(`/scheduled-tasks/${id}/runs`, { params })
  return res.data
}
```
