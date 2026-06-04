# 批量报告页面

## 概述

批量报告页面展示批量执行完成后的汇总报告，包括执行统计、Agent 对比、Benchmark 矩阵、失败分析等。

---

## 页面结构

```
/batch-executions/:id/report
  │
  ├─► 报告头部
  │     ├─ 批量任务名称
  │     ├─ 执行时间
  │     └─ 操作按钮（导出、分享）
  │
  ├─► 汇总统计
  │     ├─ 总任务数
  │     ├─ 完成/失败数量
  │     ├─ 成功率
  │     └─ 总耗时
  │
  ├─► Agent 对比
  │     ├─ 成功率对比图
  │     ├─ 耗时对比图
  │     └─ 成本对比图
  │
  ├─► Benchmark × Agent 矩阵
  │     ├─ 热力图
  │     ├─ 表格视图
  │     └─ 详情抽屉
  │
  ├─► 失败分析
  │     ├─ 失败原因分类
  │     ├─ 失败任务列表
  │     └─ 错误日志
  │
  └─► 执行列表
        ├─ 任务列表
        ├─ 筛选器
        └─ 分页
```

---

## 报告头部

```tsx
<PageHeader
  title={report.batch_name}
  subTitle={`执行时间: ${formatDateTime(report.completed_at)}`}
  extra={[
    <Button key="refresh" icon={<ReloadOutlined />}>
      刷新
    </Button>,
    <Button key="export" icon={<DownloadOutlined />}>
      导出报告
    </Button>,
  ]}
/>
```

---

## 汇总统计

### 统计卡片

```tsx
<Row gutter={16}>
  <Col span={6}>
    <Card>
      <Statistic
        title="总任务数"
        value={report.summary.total}
        prefix={<UnorderedListOutlined />}
      />
    </Card>
  </Col>

  <Col span={6}>
    <Card>
      <Statistic
        title="成功"
        value={report.summary.completed}
        valueStyle={{ color: '#3f8600' }}
        prefix={<CheckCircleOutlined />}
      />
    </Card>
  </Col>

  <Col span={6}>
    <Card>
      <Statistic
        title="失败"
        value={report.summary.failed}
        valueStyle={{ color: '#cf1322' }}
        prefix={<CloseCircleOutlined />}
      />
    </Card>
  </Col>

  <Col span={6}>
    <Card>
      <Statistic
        title="成功率"
        value={report.summary.success_rate}
        precision={1}
        suffix="%"
      />
    </Card>
  </Col>
</Row>
```

---

## Agent 对比

### 对比图表

```tsx
<Card title="Agent 对比分析" style={{ marginTop: 16 }}>
  <Tabs defaultActiveKey="success-rate">
    <Tabs.TabPane tab="成功率" key="success-rate">
      <ColumnChart
        data={report.agent_comparison.map(a => ({
          name: a.agent_name,
          value: a.success_rate,
        }))}
        xField="name"
        yField="value"
        yAxis={{
          min: 0,
          max: 100,
          label: { formatter: v => `${v}%` },
        }}
        meta={{ value: { alias: '成功率' } }}
      />
    </Tabs.TabPane>

    <Tabs.TabPane tab="平均耗时" key="duration">
      <ColumnChart
        data={report.agent_comparison.map(a => ({
          name: a.agent_name,
          value: a.avg_duration,
        }))}
        xField="name"
        yField="value"
        yAxis={{ label: { formatter: v => `${v}s` } }}
        meta={{ value: { alias: '秒' } }}
      />
    </Tabs.TabPane>

    <Tabs.TabPane tab="成本" key="cost">
      <PieChart
        data={report.agent_comparison.map(a => ({
          name: a.agent_name,
          value: a.total_cost,
        }))}
        angleField="value"
        colorField="name"
        radius={0.8}
        legend={{ position: 'bottom' }}
      />
    </Tabs.TabPane>
  </Tabs>
</Card>
```

---

## 执行矩阵

### 矩阵视图

```tsx
<Card title="Benchmark × Agent 矩阵" style={{ marginTop: 16 }}>
  <div className="matrix-controls">
    <Radio.Group value={viewMode} onChange={(e) => setViewMode(e.target.value)}>
      <Radio.Button value="table">表格</Radio.Button>
      <Radio.Button value="heatmap">热力图</Radio.Button>
    </Radio.Group>
  </div>

  {viewMode === 'table' ? (
    <MatrixTable matrix={report.matrix} agents={agents} />
  ) : (
    <MatrixHeatmap matrix={report.matrix} agents={agents} />
  )}
</Card>
```

### 矩阵表格

```tsx
<Table
  dataSource={report.matrix}
  rowKey="benchmark_name"
  pagination={false}
  scroll={{ x: 'max-content' }}
>
  <Table.Column
    title="Benchmark"
    dataIndex="benchmark_name"
    fixed="left"
    width={200}
  />

  {agents.map(agent => (
    <Table.Column
      key={agent.id}
      title={agent.name}
      width={120}
      align="center"
      render={(value, record) => {
        const agentResult = record.agents.find(a => a.agent_name === agent.name);
        return (
          <MatrixCell
            status={agentResult?.status}
            duration={agentResult?.duration}
            success={agentResult?.success}
            onClick={() => showDetail(record.benchmark_name, agent.name)}
          />
        );
      }}
    />
  ))}
</Table>
```

### 矩阵单元格

```tsx
const MatrixCell: React.FC<MatrixCellProps> = ({ status, duration, success, onClick }) => {
  const getCellProps = () => {
    switch (status) {
      case 'completed':
        return {
          style: { backgroundColor: success ? '#f6ffed' : '#fff2f0' },
          icon: success ? <CheckCircleOutlined /> : <CloseCircleOutlined />,
        };
      case 'failed':
        return {
          style: { backgroundColor: '#fff2f0' },
          icon: <CloseCircleOutlined />,
        };
      case 'running':
        return {
          style: { backgroundColor: '#e6f7ff' },
          icon: <LoadingOutlined />,
        };
      default:
        return {
          style: { backgroundColor: '#fafafa' },
          icon: <ClockCircleOutlined />,
        };
    }
  };

  const { style, icon } = getCellProps();

  return (
    <div
      className="matrix-cell"
      style={style}
      onClick={onClick}
    >
      {icon}
      {duration && <span className="duration">{duration}s</span>}
    </div>
  );
};
```

---

## 失败分析

### 失败原因分类

```tsx
<Card title="失败分析" style={{ marginTop: 16 }}>
  <Row gutter={16}>
    {report.failure_analysis.map((item, index) => (
      <Col span={8} key={index}>
        <Statistic
          title={item.error_message}
          value={item.count}
          valueStyle={{ color: '#cf1322' }}
        />
        <Button
          size="small"
          type="link"
          onClick={() => filterByError(item.error_message)}
        >
          查看详情
        </Button>
      </Col>
    ))}
  </Row>
</Card>
```

### 失败任务列表

```tsx
<Table
  dataSource={failedTasks}
  columns={[
    { title: 'Benchmark', dataIndex: 'benchmark_name' },
    { title: 'Agent', dataIndex: 'agent_name' },
    { title: '错误信息', dataIndex: 'error', ellipsis: true },
    {
      title: '操作',
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => viewLog(record.task_id)}>
            查看日志
          </Button>
          <Button size="small" onClick={() => retry(record.task_id)}>
            重试
          </Button>
        </Space>
      ),
    },
  ]}
  pagination={{ pageSize: 10 }}
/>
```

---

## 详情抽屉

```tsx
<Drawer
  title="执行详情"
  open={drawerVisible}
  onClose={() => setDrawerVisible(false)}
  width={600}
>
  {selectedTask && (
    <>
      <Descriptions column={2}>
        <Descriptions.Item label="Benchmark">
          {selectedTask.benchmark_name}
        </Descriptions.Item>
        <Descriptions.Item label="Agent">
          {selectedTask.agent_name}
        </Descriptions.Item>
        <Descriptions.Item label="状态">
          <StatusBadge status={selectedTask.status} />
        </Descriptions.Item>
        <Descriptions.Item label="耗时">
          {selectedTask.duration}s
        </Descriptions.Item>
      </Descriptions>

      {selectedTask.error && (
        <Alert
          type="error"
          message="执行失败"
          description={selectedTask.error}
          style={{ marginTop: 16 }}
        />
      )}

      <Card title="执行日志" style={{ marginTop: 16 }}>
        <pre className="execution-log">
          {selectedTask.log || '暂无日志'}
        </pre>
      </Card>
    </>
  )}
</Drawer>
```

---

## 导出功能

```tsx
const handleExport = async (format: 'pdf' | 'excel') => {
  const response = await fetch(`/api/v1/export/batch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      format,
      batch_id: batchId,
    }),
  });

  const data = await response.json();

  // 触发下载
  window.open(data.data.download_url, '_blank');
};
```

---

## 相关 API

- [批量执行 API](../03-api/batch-api.md)
- [导出 API](../03-api/export-api.md)
