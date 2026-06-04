# 导出 API

## 基础信息

| 项目 | 值 |
|------|------|
| 基础路径 | `/api/v1/export` |
| 需要认证 | 是 |
| 内容类型 | `application/json` |

---

## 接口列表

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/executions` | 导出执行记录 |
| POST | `/executions/direct` | 直接导出（返回文件内容） |
| POST | `/batch` | 导出批量报告 |
| GET | `/formats` | 获取支持的导出格式 |

---

## 1. 导出执行记录

### 请求

```http
POST /api/v1/export/executions
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体**:
```typescript
interface ExportExecutionsRequest {
  format: "json" | "csv" | "excel" | "pdf";

  // 筛选条件
  filters?: {
    execution_ids?: string[];     // 指定执行 ID
    benchmark_id?: string;        // 按 Benchmark 筛选
    agent_id?: string;            // 按 Agent 筛选
    status?: string;              // 按状态筛选
    start_date?: string;          // 起始日期 (YYYY-MM-DD)
    end_date?: string;            // 结束日期 (YYYY-MM-DD)
  };

  // 导出配置
  options?: {
    include_trace?: boolean;      // 包含执行跟踪
    include_artifacts?: boolean;  // 包含产物
    compress?: boolean;           // 压缩为 ZIP
  };
}
```

### 响应

**成功 (200)**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    export_id: string,
    format: string,
    file_name: string,
    download_url: string,
    expires_at: string,           // ISO 8601 格式
    file_size_bytes?: number,
    record_count: number
  }
}
```

### 示例

```typescript
// 导出指定执行记录
const response = await fetch('/api/v1/export/executions', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    format: 'excel',
    filters: {
      execution_ids: ['exec-1', 'exec-2', 'exec-3'],
    },
    options: {
      include_trace: true,
    },
  }),
});

const data = await response.json();

// 触发下载
window.open(data.data.download_url, '_blank');
```

---

## 2. 直接导出

### 请求

```http
POST /api/v1/export/executions/direct
Content-Type: application/json
Authorization: Bearer {access_token}
```

**响应**: 直接返回文件内容，`Content-Disposition` 头包含文件名

### 示例

```typescript
// 触发下载
const response = await fetch('/api/v1/export/executions/direct', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    format: 'csv',
    filters: {
      benchmark_id: 'bench-123',
    },
  }),
});

// 从响应头获取文件名
const contentDisposition = response.headers.get('Content-Disposition');
const fileName = contentDisposition
  ?.match(/filename=(.+)/)?.[1]
  || 'export.csv';

// 下载文件
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement('a');
a.href = url;
a.download = fileName;
a.click();
window.URL.revokeObjectURL(url);
```

---

## 3. 导出批量报告

### 请求

```http
POST /api/v1/export/batch
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体**:
```typescript
interface ExportBatchRequest {
  batch_id: string;              // 批量执行 ID
  format: "json" | "csv" | "excel" | "pdf";

  options?: {
    include_matrix?: boolean;    // 包含矩阵视图
    include_comparison?: boolean; // 包含 Agent 对比
    include_failed_analysis?: boolean; // 包含失败分析
  };
}
```

### 响应

**成功 (200)**:
```typescript
{
  code: 0,
  message: "success",
  data: {
    export_id: string,
    batch_id: string,
    format: string,
    file_name: string,
    download_url: string,
    expires_at: string,
    file_size_bytes?: number,
  }
}
```

---

## 4. 获取导出格式

### 请求

```http
GET /api/v1/export/formats
Authorization: Bearer {access_token}
```

### 响应

**成功 (200)**:
```typescript
{
  code: 0,
  message: "success",
  data: [
    {
      format: "json",
      name: "JSON",
      description: "原始数据格式，适合程序处理",
      extension: ".json",
      mime_type: "application/json",
      max_records: null,
      supports_compression: true
    },
    {
      format: "csv",
      name: "CSV",
      description: "逗号分隔值，适合 Excel 打开",
      extension: ".csv",
      mime_type: "text/csv",
      max_records: 1000000,
      supports_compression: false
    },
    {
      format: "excel",
      name: "Excel",
      description: "Excel 工作簿格式",
      extension: ".xlsx",
      mime_type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      max_records: 1000000,
      supports_compression: false
    },
    {
      format: "pdf",
      name: "PDF",
      description: "只读报告格式",
      extension: ".pdf",
      mime_type: "application/pdf",
      max_records: 10000,
      supports_compression: false
    }
  ]
}
```

---

## TypeScript 类型定义

```typescript
// src/types/api/export.ts

export type ExportFormat = 'json' | 'csv' | 'excel' | 'pdf';

export interface ExportRequest {
  format: ExportFormat;
  filters?: ExportFilters;
  options?: ExportOptions;
}

export interface ExportFilters {
  execution_ids?: string[];
  benchmark_id?: string;
  agent_id?: string;
  status?: string;
  start_date?: string;
  end_date?: string;
}

export interface ExportOptions {
  include_trace?: boolean;
  include_artifacts?: boolean;
  compress?: boolean;
}

export interface ExportResponse {
  export_id: string;
  format: ExportFormat;
  file_name: string;
  download_url: string;
  expires_at: string;
  file_size_bytes?: number;
  record_count: number;
}

export interface ExportFormatInfo {
  format: ExportFormat;
  name: string;
  description: string;
  extension: string;
  mime_type: string;
  max_records?: number;
  supports_compression: boolean;
}

export interface ExportBatchRequest {
  batch_id: string;
  format: ExportFormat;
  options?: {
    include_matrix?: boolean;
    include_comparison?: boolean;
    include_failed_analysis?: boolean;
  };
}
```

---

## 使用示例

### React Hook

```typescript
// hooks/useExport.ts
export const useExport = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportExecutions = async (request: ExportRequest) => {
    setLoading(false);
    setError(null);

    try {
      const response = await fetch('/api/v1/export/executions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('导出失败');
      }

      const data = await response.json();

      // 触发下载
      window.open(data.data.download_url, '_blank');

      return data.data as ExportResponse;
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const exportBatch = async (request: ExportBatchRequest) => {
    setLoading(false);
    setError(null);

    try {
      const response = await fetch('/api/v1/export/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${getToken()}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        throw new Error('导出失败');
      }

      const data = await response.json();

      // 触发下载
      window.open(data.data.download_url, '_blank');

      return data.data as ExportResponse;
    } catch (err) {
      setError(err instanceof Error ? err.message : '导出失败');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    exportExecutions,
    exportBatch,
    loading,
    error,
  };
};
```

### 导出按钮组件

```typescript
// components/ExportButton.tsx
const ExportButton: React.FC<{
  type: 'executions' | 'batch';
  filters?: any;
}> = ({ type, filters }) => {
  const { exportExecutions, exportBatch, loading } = useExport();
  const [visible, setVisible] = useState(false);
  const [form] = Form.useForm();

  const handleExport = async () => {
    const values = await form.validateFields();

    try {
      if (type === 'executions') {
        await exportExecutions({
          ...values,
          filters,
        });
      } else {
        await exportBatch({
          ...values,
        });
      }

      setVisible(false);
      message.success('导出成功');
    } catch (error) {
      message.error('导出失败');
    }
  };

  return (
    <>
      <Button
        icon={<DownloadOutlined />}
        onClick={() => setVisible(true)}
      >
        导出
      </Button>

      <Modal
        title="导出数据"
        open={visible}
        onCancel={() => setVisible(false)}
        onOk={handleExport}
        confirmLoading={loading}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="format"
            label="导出格式"
            initialValue="excel"
          >
            <Select>
              <Select.Option value="json">JSON</Select.Option>
              <Select.Option value="csv">CSV</Select.Option>
              <Select.Option value="excel">Excel</Select.Option>
              <Select.Option value="pdf">PDF</Select.Option>
            </Select>
          </Form.Item>

          {type === 'executions' && (
            <Form.Item name="include_trace" valuePropName="checked">
              <Checkbox>包含执行跟踪</Checkbox>
            </Form.Item>
          )}
        </Form>
      </Modal>
    </>
  );
};
```
