# 数据集导入页

## 页面概览

- **路由**: `/import`
- **所需权限**: 已登录用户
- **关联场景**: [数据集导入](../01-scenarios/dataset-import.md)

---

## 页面状态

```typescript
interface DatasetImportPageState {
  // 当前选择的数据集
  dataset: 'humaneval' | 'mbpp' | 'swenbench'

  // 导入方式
  importMethod: 'file' | 'url' | 'json' | 'swenbench'

  // 文件上传
  uploadedFile: {
    fileId: string
    name: string
    size: number
  } | null
  uploadProgress: number

  // 导入任务
  importTasks: ImportTask[]
  selectedTask: ImportTask | null

  // UI 状态
  uploading: boolean
  importing: boolean
  activeTab: 'import' | 'tasks'
}
```

## 组件结构

```
DatasetImportPage
├── PageHeader
│   ├── 标题 "数据集导入"
│   └── "查看导入历史" 按钮
├── Tabs
│   ├── 导入 Tab
│   │   ├── DatasetSelector (数据集选择)
│   │   ├── MethodSelector (导入方式选择)
│   │   ├── FileUploadPanel (文件上传方式)
│   │   ├── URLImportPanel (URL 导入方式)
│   │   ├── JSONImportPanel (JSON 粘贴方式)
│   │   ├── SWEBenchPanel (SWE-bench 专用)
│   │   └── ImportOptions (导入配置)
│   │       ├── 限制数量
│   │       ├── 可见性
│   │       └── 是否需要审核
│   │   └── "开始导入" 按钮
│   └── 导入历史 Tab
│       └── TaskList
│           ├── 筛选器
│           └── 任务列表
└── TaskDetailModal (任务详情)
```

## 数据集选择

```tsx
<Segmented
  value={dataset}
  onChange={setDataset}
  options={[
    { label: 'HumanEval', value: 'humaneval' },
    { label: 'MBPP', value: 'mbpp' },
    { label: 'SWE-bench', value: 'swenbench' }
  ]}
/>

{dataset === 'swenbench' ? (
  <SWEBenchPanel />
) : (
  <MethodSelector dataset={dataset} />
)}
```

## 导入方式选择

### HumanEval/MBPP 导入方式

```tsx
<Radio.Group value={importMethod} onChange={(e) => setImportMethod(e.target.value)}>
  <Radio value="file">上传文件</Radio>
  <Radio value="url">从 URL 导入</Radio>
  <Radio value="json">粘贴 JSON</Radio>
</Radio.Group>
```

### 方式 A: 文件上传

```tsx
<Upload.Dragger
  name="file"
  accept=".json,.jsonl"
  maxsize={500 * 1024 * 1024}  // 500MB
  beforeUpload={(file) => {
    const isValidType = file.name.endsWith('.json') || file.name.endsWith('.jsonl')
    if (!isValidType) {
      message.error('只支持 .json 和 .jsonl 文件')
      return Upload.LIST_IGNORE
    }
    const isLt500M = file.size / 1024 / 1024 < 500
    if (!isLt500M) {
      message.error('文件大小不能超过 500MB')
      return Upload.LIST_IGNORE
    }
    return true
  }}
  customRequest={async ({ file, onSuccess, onError, onProgress }) => {
    const formData = new FormData()
    formData.append('file', file)

    setUploading(true)

    try {
      const res = await api.post(`/codecomplete/${dataset}/import/upload`, formData, {
        onUploadProgress: ({ total, loaded }) => {
          setUploadProgress(Math.round((loaded / total) * 100))
        }
      })

      setUploadedFile({
        fileId: res.data.file_id,
        name: file.name,
        size: file.size
      })
      onSuccess(res.data)
    } catch (err) {
      onError(err)
    } finally {
      setUploading(false)
    }
  }}
>
  <p className="ant-upload-drag-icon">
    <InboxOutlined />
  </p>
  <p className="ant-upload-text">点击或拖拽文件到此区域上传</p>
  <p className="ant-upload-hint">支持 .json 和 .jsonl 文件，最大 500MB</p>
</Upload.Dragger>
```

### 方式 B: URL 导入

```tsx
<Form layout="vertical">
  <Form.Item
    label="数据文件 URL"
    name="url"
    rules={[
      { required: true, message: '请输入 URL' },
      { type: 'url', message: '请输入有效的 URL' }
    ]}
  >
    <Input
      placeholder="https://github.com/.../dataset.json"
      suffix={<Tooltip title="支持 GitHub、raw.githubusercontent.com、HuggingFace">
        <InfoCircleOutlined />
      </Tooltip>}
    />
  </Form.Item>

  <Alert
    message="支持的域名"
    description="github.com, raw.githubusercontent.com, gist.githubusercontent.com, huggingface.co"
    type="info"
    showIcon
  />
</Form>
```

### 方式 C: JSON 数据

```tsx
<Form.Item
  label="JSON 数据"
  name="jsonData"
  rules={[
    { required: true, message: '请输入 JSON 数据' },
    {
      validator: (_, value) => {
        try {
          JSON.parse(value)
          return Promise.resolve()
        } catch {
          return Promise.reject('无效的 JSON 格式')
        }
      }
    }
  ]}
>
  <TextArea
    rows={10}
    placeholder='[{"task_id": "...", "prompt": "...", "test": "..."}]'
    maxLength={100 * 1024 * 1024}  // 100MB 限制
    showCount
  />
</Form.Item>
```

## SWE-bench 专用面板

```tsx
<Form layout="vertical">
  <Row gutter={16}>
    <Col span={12}>
      <Form.Item
        label="仓库 URL"
        name="repo_url"
        rules={[{ required: true, message: '请输入仓库 URL' }]}
      >
        <Input placeholder="https://github.com/owner/repo" />
      </Form.Item>
    </Col>
    <Col span={12}>
      <Form.Item label="分支" name="base_branch">
        <Input placeholder="main" />
      </Form.Item>
    </Col>
  </Row>

  <Form.Item label="Commit Hash" name="commit_hash">
    <Input placeholder="留空使用最新 commit" />
  </Form.Item>

  <Divider>Issue 信息</Divider>

  <Form.Item
    label="Issue 标题"
    name={['issue', 'title']}
    rules={[{ required: true, message: '请输入 Issue 标题' }]}
  >
    <Input />
  </Form.Item>

  <Form.Item
    label="Issue 描述"
    name={['issue', 'body']}
    rules={[{ required: true, message: '请输入 Issue 描述' }]}
  >
    <TextArea rows={4} />
  </Form.Item>

  <Form.Item label="Issue URL" name={['issue', 'url']}>
    <Input placeholder="https://github.com/owner/repo/issues/123" />
  </Form.Item>

  <Divider>测试配置</Divider>

  <Form.Item label="测试策略" name={['config', 'test_strategy']}>
    <Radio.Group>
      <Radio value="full">运行所有测试</Radio>
      <Radio value="smart">智能选择测试</Radio>
      <Radio value="skip">跳过测试</Radio>
    </Radio.Group>
  </Form.Item>
</Form>
```

## 导入配置

```tsx
<Card title="导入配置" size="small">
  <Form layout="vertical">
    <Row gutter={16}>
      <Col span={8}>
        <Form.Item label="最大导入数量">
          <InputNumber
            min={0}
            max={10000}
            placeholder="0 表示不限制"
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item label="可见性">
          <Select>
            <Select.Option value="private">私有</Select.Option>
            <Select.Option value="organization">组织内</Select.Option>
          </Select>
        </Form.Item>
      </Col>
      <Col span={8}>
        <Form.Item label="需要审核" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Col>
    </Row>
  </Form>
</Card>
```

## 导入按钮

```tsx
<Button
  type="primary"
  size="large"
  block
  loading={importing}
  disabled={!canImport}
  onClick={handleImport}
>
  {importing ? '导入中...' : '开始导入'}
</Button>
```

## 导入历史

### 任务列表

```tsx
<Table
  columns={[
    {
      title: '数据集',
      dataIndex: 'dataset',
      render: (dataset) => dataset.toUpperCase()
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status) => {
        const config = {
          pending: { color: 'default', text: '等待中' },
          processing: { color: 'blue', text: '处理中' },
          completed: { color: 'green', text: '已完成' },
          failed: { color: 'red', text: '失败' },
          cancelled: { color: 'default', text: '已取消' }
        }
        const { color, text } = config[status] || config.pending
        return <Badge status={color} text={text} />
      }
    },
    {
      title: '进度',
      render: (_, record) => (
        record.status === 'processing' ? (
          <Progress
            percent={Math.round((record.imported / record.total) * 100)}
            status="active"
          />
        ) : (
          <span>{record.imported} / {record.total}</span>
        )
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      render: (time) => formatRelativeTime(time)
    },
    {
      title: '操作',
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            onClick={() => viewTaskDetail(record)}
          >
            详情
          </Button>
          {record.status === 'pending' && (
            <Button
              type="link"
              danger
              onClick={() => cancelTask(record.id)}
            >
              取消
            </Button>
          )}
        </Space>
      )
    }
  ]}
  dataSource={importTasks}
  rowKey="id"
  pagination={{
    pageSize: 20,
    showSizeChanger: true
  }}
/>
```

## API 调用

```typescript
// 文件上传
const uploadFile = async (dataset: string, file: File): Promise<UploadResponse> => {
  const formData = new FormData()
  formData.append('file', file)

  const res = await api.post(`/codecomplete/${dataset}/import/upload`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return res.data
}

// 创建导入任务
const createImportTask = async (
  dataset: string,
  config: ImportConfig
): Promise<{ task_id: string }> => {
  const res = await api.post(`/codecomplete/${dataset}/import/async`, config)
  return res.data
}

// 查询任务状态
const getTaskStatus = async (taskId: string): Promise<ImportTask> => {
  const res = await api.get(`/codecomplete/tasks/${taskId}/status`)
  return res.data
}

// 任务列表
const listTasks = async (params: {
  page?: number
  page_size?: number
  status?: string
}): Promise<{ tasks: ImportTask[], total: number }> => {
  const res = await api.get('/codecomplete/tasks', { params })
  return res.data
}

// 取消任务
const cancelTask = async (taskId: string): Promise<void> => {
  await api.post(`/codecomplete/tasks/${taskId}/cancel`)
}
```

## 任务详情模态框

```tsx
<Modal
  title="导入任务详情"
  open={detailVisible}
  onCancel={() => setDetailVisible(false)}
  width={800}
  footer={[
    <Button key="close" onClick={() => setDetailVisible(false)}>
      关闭
    </Button>
  ]}
>
  {selectedTask && (
    <Descriptions column={2} bordered>
      <Descriptions.Item label="任务 ID">{selectedTask.id}</Descriptions.Item>
      <Descriptions.Item label="状态">
        <Badge status={getStatusBadge(selectedTask.status)} text={selectedTask.status} />
      </Descriptions.Item>
      <Descriptions.Item label="数据集">{selectedTask.dataset.toUpperCase()}</Descriptions.Item>
      <Descriptions.Item label="来源">{selectedTask.source_type}</Descriptions.Item>
      <Descriptions.Item label="总数">{selectedTask.total}</Descriptions.Item>
      <Descriptions.Item label="已导入">{selectedTask.imported}</Descriptions.Item>
      <Descriptions.Item label="失败">{selectedTask.failed}</Descriptions.Item>
      <Descriptions.Item label="创建时间">{selectedTask.created_at}</Descriptions.Item>
      {selectedTask.error_msg && (
        <Descriptions.Item label="错误信息" span={2}>
          <Typography.Text type="danger">{selectedTask.error_msg}</Typography.Text>
        </Descriptions.Item>
      )}
    </Descriptions>
  )}
</Modal>
```
