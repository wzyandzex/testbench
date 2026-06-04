# 组件规范

## Ant Design 组件使用规范

### Button 按钮

#### 尺寸选择

| 场景 | 尺寸 |
|------|------|
| 表单操作 | middle（默认） |
| 卡片内操作 | small |
| 工具栏操作 | large |

#### 类型选择

| 场景 | 类型 | 示例 |
|------|------|------|
| 主要操作 | primary | 提交、确认、保存 |
| 次要操作 | default | 取消、重置 |
| 危险操作 | danger | 删除、移除 |
| 图标操作 | text | 编辑、查看 |

#### 示例代码

```tsx
import { Button, Space } from 'antd';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';

<Space>
  <Button type="primary" icon={<PlusOutlined />}>
    新建
  </Button>
  <Button icon={<EditOutlined />}>编辑</Button>
  <Button danger icon={<DeleteOutlined />}>删除</Button>
</Space>

// 禁用状态
<Button disabled>禁用按钮</Button>

// 加载状态
<Button loading>提交中</Button>
```

---

### Table 表格

#### 基本配置

```tsx
import { Table } from 'antd';
import type { ColumnsType, TableProps } from 'antd/es/table';

const columns: ColumnsType<DataType> = [
  {
    title: '名称',
    dataIndex: 'name',
    key: 'name',
    width: 200,
    fixed: 'left',
    sorter: true,
  },
  {
    title: '状态',
    dataIndex: 'status',
    key: 'status',
    width: 100,
    filters: [
      { text: '活跃', value: 'active' },
      { text: '草稿', value: 'draft' },
    ],
    render: (status) => <StatusBadge status={status} />,
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    fixed: 'right',
    render: (_, record) => (
      <Space>
        <Button type="link" size="small">查看</Button>
        <Button type="link" size="small">编辑</Button>
      </Space>
    ),
  },
];

<Table
  columns={columns}
  dataSource={data}
  rowKey="id"
  scroll={{ x: 1200 }}
  pagination={{
    current: page,
    pageSize: pageSize,
    total: total,
    showSizeChanger: true,
    showQuickJumper: true,
    showTotal: (total) => `共 ${total} 条`,
  }}
  onChange={handleTableChange}
/>
```

#### 分页配置规范

```typescript
const paginationConfig = {
  pageSizeOptions: ['10', '20', '50', '100'],
  showSizeChanger: true,
  showQuickJumper: true,
  showTotal: (total: number, range: [number, number]) =>
    `第 ${range[0]}-${range[1]} 条，共 ${total} 条`,
};
```

---

### Form 表单

#### 布局规范

```tsx
import { Form, Input, Select, Button } from 'antd';
const { TextArea } = Input;

<Form
  form={form}
  layout="vertical"
  onFinish={handleSubmit}
  autoComplete="off"
>
  <Form.Item
    name="name"
    label="名称"
    rules={[
      { required: true, message: '请输入名称' },
      { min: 2, max: 50, message: '名称长度为 2-50 个字符' },
    ]}
  >
    <Input placeholder="请输入名称" />
  </Form.Item>

  <Form.Item
    name="description"
    label="描述"
    rules={[{ max: 500, message: '描述最多 500 个字符' }]}
  >
    <TextArea rows={4} placeholder="请输入描述" />
  </Form.Item>

  <Form.Item
    name="language"
    label="编程语言"
    rules={[{ required: true, message: '请选择编程语言' }]}
  >
    <Select placeholder="请选择">
      <Select.Option value="python">Python</Select.Option>
      <Select.Option value="javascript">JavaScript</Select.Option>
    </Select>
  </Form.Item>

  <Form.Item>
    <Space>
      <Button type="primary" htmlType="submit">
        提交
      </Button>
      <Button onClick={onCancel}>取消</Button>
    </Space>
  </Form.Item>
</Form>
```

#### 验证规则

```typescript
// 常用验证规则
const rules = {
  required: (message: string) => ({
    required: true,
    message,
  }),

  email: {
    type: 'email' as const,
    message: '请输入有效的邮箱地址',
  },

  url: {
    type: 'url' as const,
    message: '请输入有效的 URL',
  },

  minLength: (min: number, message?: string) => ({
    min,
    message: message || `最少 ${min} 个字符`,
  }),

  maxLength: (max: number, message?: string) => ({
    max,
    message: message || `最多 ${max} 个字符`,
  }),

  pattern: (pattern: RegExp, message: string) => ({
    pattern,
    message,
  }),
};

// 使用示例
<Form.Item
  name="email"
  label="邮箱"
  rules={[rules.required('请输入邮箱'), rules.email]}
>
  <Input />
</Form.Item>
```

---

### Modal 弹窗

#### 标准用法

```tsx
import { Modal, Button } from 'antd';
import { useState } from 'react';

export function ConfirmModal() {
  const [open, setOpen] = useState(false);

  const handleOk = () => {
    // 执行操作
    setOpen(false);
  };

  return (
    <>
      <Button danger onClick={() => setOpen(true)}>
        删除
      </Button>
      <Modal
        title="确认删除"
        open={open}
        onOk={handleOk}
        onCancel={() => setOpen(false)}
        okText="确认"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <p>确定要删除此项目吗？此操作不可撤销。</p>
      </Modal>
    </>
  );
}
```

#### 宽度规范

| 内容类型 | 宽度 |
|---------|------|
| 确认弹窗 | 400px |
| 表单弹窗 | 520px |
| 详情弹窗 | 800px |
| 大型内容 | 1200px |

---

### Drawer 抽屉

#### 标准用法

```tsx
import { Drawer, Button, Form } from 'antd';

export function EditDrawer({ visible, onClose, record }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (visible && record) {
      form.setFieldsValue(record);
    }
  }, [visible, record]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      // 提交数据
      onClose();
    } catch (error) {
      console.error('验证失败:', error);
    }
  };

  return (
    <Drawer
      title="编辑"
      placement="right"
      width={600}
      open={visible}
      onClose={onClose}
      extra={
        <Space>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" onClick={handleSubmit}>
            保存
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical">
        {/* 表单内容 */}
      </Form>
    </Drawer>
  );
}
```

---

### Select 选择器

#### 远程搜索

```tsx
import { Select } from 'antd';

interface Option {
  value: string;
  label: string;
}

export function RemoteSelect() {
  const [options, setOptions] = useState<Option[]>([]);
  const [fetching, setFetching] = useState(false);

  const handleSearch = async (value: string) => {
    if (!value) {
      setOptions([]);
      return;
    }

    setFetching(true);
    try {
      const result = await searchApi(value);
      setOptions(result);
    } finally {
      setFetching(false);
    }
  };

  return (
    <Select
      showSearch
      placeholder="请搜索"
      filterOption={false}
      onSearch={debounce(handleSearch, 300)}
      options={options}
      loading={fetching}
      notFoundContent={fetching ? '搜索中...' : '暂无数据'}
    />
  );
}
```

---

### Upload 上传

#### 标准用法

```tsx
import { Upload, Button, message } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

export function FileUpload() {
  const [fileList, setFileList] = useState([]);

  const handleUpload = async (options: any) => {
    const { file, onProgress, onSuccess, onError } = options;

    try {
      const response = await uploadService.upload(file, {
        onUploadProgress: (progressEvent) => {
          const percent = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          onProgress({ percent });
        },
      });

      onSuccess(response.data);
      message.success('上传成功');
    } catch (error) {
      onError(error);
      message.error('上传失败');
    }
  };

  return (
    <Upload
      customRequest={handleUpload}
      fileList={fileList}
      onChange={({ fileList }) => setFileList(fileList)}
      maxCount={1}
    >
      <Button icon={<UploadOutlined />}>上传文件</Button>
    </Upload>
  );
}
```

---

### Descriptions 描述列表

```tsx
import { Descriptions, Tag } from 'antd';

export function DetailDescriptions({ data }) {
  return (
    <Descriptions bordered column={2}>
      <Descriptions.Item label="名称">{data.name}</Descriptions.Item>
      <Descriptions.Item label="状态">
        <Tag color={statusColor[data.status]}>{statusText[data.status]}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="编程语言">{data.language}</Descriptions.Item>
      <Descriptions.Item label="任务数量">{data.task_count}</Descriptions.Item>
      <Descriptions.Item label="创建时间" span={2}>
        {formatDateTime(data.created_at)}
      </Descriptions.Item>
      <Descriptions.Item label="描述" span={2}>
        {data.description || '-'}
      </Descriptions.Item>
    </Descriptions>
  );
}
```

---

### Tree 树形控件

```tsx
import { Tree } from 'antd';

export function OrganizationTree({ data, onSelect }) {
  return (
    <Tree
      showLine
      treeData={data}
      onSelect={onSelect}
      fieldNames={{ title: 'name', key: 'id', children: 'children' }}
      defaultExpandAll
    />
  );
}
```

---

## 业务组件封装

### DataTable 组件

```tsx
// src/components/table/DataTable.tsx
import { Table, TableProps } from 'antd';
import { usePagination } from '@/hooks/usePagination';

interface DataTableProps<T> extends TableProps<T> {
  request: (params: any) => Promise<{ data: T[]; total: number }>;
}

export function DataTable<T extends Record<string, any>>({
  request,
  columns,
  ...props
}: DataTableProps<T>) {
  const { data, loading, pagination, handleTableChange } = usePagination(request);

  return (
    <Table
      columns={columns}
      dataSource={data}
      loading={loading}
      pagination={pagination}
      onChange={handleTableChange}
      {...props}
    />
  );
}
```

### StatusBadge 组件

```tsx
// src/components/status/StatusBadge.tsx
import { Badge } from 'antd';

const statusConfig: Record<string, { color: string; text: string }> = {
  pending: { color: 'default', text: '等待中' },
  running: { color: 'processing', text: '运行中' },
  completed: { color: 'success', text: '已完成' },
  failed: { color: 'error', text: '失败' },
  timeout: { color: 'warning', text: '超时' },
  cancelled: { color: 'default', text: '已取消' },
};

export function StatusBadge({ status }: { status: keyof typeof statusConfig }) {
  const config = statusConfig[status] || { color: 'default', text: status };
  return <Badge status={config.color as any} text={config.text} />;
}
```

### PageContainer 组件

```tsx
// src/components/layout/PageContainer.tsx
import { Card, Breadcrumb, Space } from 'antd';
import { useLocation } from 'react-router-dom';

interface PageContainerProps {
  title: string;
  extra?: React.ReactNode;
  breadcrumb?: Array<{ title: string; path?: string }>;
  children: React.ReactNode;
}

export function PageContainer({
  title,
  extra,
  breadcrumb,
  children,
}: PageContainerProps) {
  return (
    <div style={{ padding: '16px' }}>
      <Card
        title={title}
        extra={extra}
        breadcrumb={
          breadcrumb && {
            items: breadcrumb.map((item) => ({
              title: item.title,
            })),
          }
        }
      >
        {children}
      </Card>
    </div>
  );
}
```
