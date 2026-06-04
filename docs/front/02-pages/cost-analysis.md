# 成本分析页面

## 概述

成本分析页面展示 LLM API 调用成本统计和分析，帮助用户控制和优化成本。

---

## 页面结构

```
/cost
  │
  ├─► 成本仪表板
  │     ├─ 总成本卡片
  │     ├─ Token 统计
  │     ├─ 执行次数
  │     └─ 成本趋势图
  │
  ├─► 成本分析
  │     ├─ 按模型分析
  │     ├─ 按 Agent 分析
  │     ├─ 按 Benchmark 分析
  │     └─ 对比分析
  │
  ├─► 模型成本配置
  │     ├─ 模型价格列表
  │     ├─ 编辑价格
  │     └─ 添加模型
  │
  └─► 预算管理
        ├─ 预算进度条
        ├─ 月度预算设置
        └─ 超限告警
```

---

## 成本仪表板

### 日期范围选择器

```tsx
<Space style={{ marginBottom: 16 }}>
  <RangePicker
    value={dateRange}
    onChange={(dates) => setDateRange(dates)}
    presets={[
      { label: '今天', value: [dayjs().startOf('day'), dayjs()] },
      { label: '本周', value: [dayjs().startOf('week'), dayjs()] },
      { label: '本月', value: [dayjs().startOf('month'), dayjs()] },
      { label: '上月', value: [
        dayjs().subtract(1, 'month').startOf('month'),
        dayjs().subtract(1, 'month').endOf('month')
      ]},
    ]}
  />
  <Button onClick={() => refetch()}>刷新</Button>
</Space>
```

### 统计卡片

```tsx
<Row gutter={16}>
  <Col span={6}>
    <Card>
      <Statistic
        title="总成本"
        value={summary?.total_cost || 0}
        precision={2}
        prefix="$"
        loading={isLoading}
      />
      {summary?.vs_previous_period && (
        <div className="trend">
          {summary.vs_previous_period.cost_change_percent > 0 ? (
            <Text type="danger">
              <ArrowUpOutlined />
              {summary.vs_previous_period.cost_change_percent.toFixed(1)}%
            </Text>
          ) : (
            <Text type="success">
              <ArrowDownOutlined />
              {Math.abs(summary.vs_previous_period.cost_change_percent).toFixed(1)}%
            </Text>
          )}
          <Text type="secondary"> vs 上期</Text>
        </div>
      )}
    </Card>
  </Col>

  <Col span={6}>
    <Card>
      <Statistic
        title="总 Tokens"
        value={summary?.total_tokens || 0}
        formatter={(value) => formatNumber(Number(value))}
        loading={isLoading}
      />
    </Card>
  </Col>

  <Col span={6}>
    <Card>
      <Statistic
        title="执行次数"
        value={summary?.execution_count || 0}
        loading={isLoading}
      />
    </Card>
  </Col>

  <Col span={6}>
    <Card>
      <Statistic
        title="平均成本"
        value={summary?.avg_cost_per_execution || 0}
        precision={2}
        prefix="$"
        loading={isLoading}
      />
    </Card>
  </Col>
</Row>
```

---

## 成本趋势图

```tsx
<Card title="成本趋势" style={{ marginTop: 16 }}>
  <AreaChart
    height={300}
    data={stats?.daily_costs || []}
    xField="date"
    yField="cost"
    xAxis={{ label: { formatter: (value) => dayjs(value).format('MM-DD') } }}
    yAxis={{ label: { formatter: (value) => `$${value}` } }}
    smooth
    areaStyle={{ fill: 'l(270) 0:#ffffff 0:#5B8FF9 1:#5B8FF9' }}
  />
</Card>
```

---

## 按模型分析

### 模型成本表格

```tsx
<Card title="按模型分析" style={{ marginTop: 16 }}>
  <Table
    dataSource={stats?.by_model || []}
    rowKey={(record) => `${record.provider}-${record.model}`}
    columns={[
      {
        title: '提供商',
        dataIndex: 'provider',
        render: (provider) => <Tag>{provider}</Tag>,
      },
      { title: '模型', dataIndex: 'model' },
      {
        title: '输入 Tokens',
        dataIndex: 'input_tokens',
        render: (value) => formatNumber(value),
      },
      {
        title: '输出 Tokens',
        dataIndex: 'output_tokens',
        render: (value) => formatNumber(value),
      },
      {
        title: '总 Tokens',
        dataIndex: 'total_tokens',
        render: (value) => formatNumber(value),
      },
      {
        title: '成本',
        dataIndex: 'cost',
        render: (value) => `$${value.toFixed(2)}`,
      },
      {
        title: '占比',
        dataIndex: 'percentage',
        render: (value) => `${value.toFixed(1)}%`,
      },
    ]}
    pagination={false}
    summary={(pageData) => {
      const totalCost = pageData.reduce((sum, item) => sum + item.cost, 0);
      return (
        <Table.Summary fixed>
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={5}>
              <Text strong>总计</Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={5}>
              <Text strong>${totalCost.toFixed(2)}</Text>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={6} />
          </Table.Summary.Row>
        </Table.Summary>
      );
    }}
  />
</Card>
```

---

## 按项目分析

```tsx
<Card title="按项目分析" style={{ marginTop: 16 }}>
  <Tabs>
    <Tabs.TabPane tab="Benchmark" key="benchmark">
      <Table
        dataSource={stats?.by_project.filter(p => p.project_type === 'benchmark')}
        columns={[
          { title: 'Benchmark', dataIndex: 'project_name' },
          { title: '执行次数', dataIndex: 'execution_count' },
          { title: '总成本', dataIndex: 'cost', render: (v) => `$${v.toFixed(2)}` },
          { title: '平均成本', dataIndex: 'avg_cost_per_execution', render: (v) => `$${v.toFixed(4)}` },
        ]}
        pagination={{ pageSize: 10 }}
      />
    </Tabs.TabPane>

    <Tabs.TabPane tab="批量执行" key="batch">
      <Table
        dataSource={stats?.by_project.filter(p => p.project_type === 'batch')}
        columns={[
          { title: '批量任务', dataIndex: 'project_name' },
          { title: '执行次数', dataIndex: 'execution_count' },
          { title: '总成本', dataIndex: 'cost', render: (v) => `$${v.toFixed(2)}` },
        ]}
      />
    </Tabs.TabPane>

    <Tabs.TabPane tab="定时任务" key="scheduled">
      <Table
        dataSource={stats?.by_project.filter(p => p.project_type === 'scheduled')}
        columns={[
          { title: '定时任务', dataIndex: 'project_name' },
          { title: '执行次数', dataIndex: 'execution_count' },
          { title: '总成本', dataIndex: 'cost', render: (v) => `$${v.toFixed(2)}` },
        ]}
      />
    </Tabs.TabPane>
  </Tabs>
</Card>
```

---

## 模型成本配置

### 配置列表

```tsx
<Card title="模型成本配置" style={{ marginTop: 16 }}>
  <Table
    dataSource={modelCosts}
    columns={[
      { title: '提供商', dataIndex: 'provider', render: (t) => <Tag>{t}</Tag> },
      { title: '模型', dataIndex: 'model' },
      { title: '输入价格', dataIndex: 'input_price', render: (v) => `$${v}/M` },
      { title: '输出价格', dataIndex: 'output_price', render: (v) => `$${v}/M` },
      {
        title: '操作',
        render: (_, record) => (
          <Space>
            <Button size="small" onClick={() => handleEdit(record)}>
              编辑
            </Button>
            <Button
              size="small"
              danger
              onClick={() => handleDelete(record.id)}
            >
              删除
            </Button>
          </Space>
        ),
      },
    ]}
    pagination={false}
  />
</Card>
```

### 编辑对话框

```tsx
<Modal
  title="编辑模型价格"
  open={visible}
  onOk={handleSubmit}
  onCancel={() => setVisible(false)}
>
  <Form form={form} layout="vertical">
    <Form.Item name="provider" label="提供商">
      <Select>
        <Select.Option value="claude">Claude</Select.Option>
        <Select.Option value="openai">OpenAI</Select.Option>
        <Select.Option value="glm">智谱</Select.Option>
      </Select>
    </Form.Item>

    <Form.Item name="model" label="模型名称">
      <Input placeholder="claude-sonnet-4-20250514" />
    </Form.Item>

    <Form.Item
      name="input_price"
      label="输入价格 ($/1M tokens)"
      rules={[{ required: true, message: '请输入价格' }]}
    >
      <InputNumber min={0} step={0.01} precision={4} style={{ width: '100%' }} />
    </Form.Item>

    <Form.Item
      name="output_price"
      label="输出价格 ($/1M tokens)"
      rules={[{ required: true, message: '请输入价格' }]}
    >
      <InputNumber min={0} step={0.01} precision={4} style={{ width: '100%' }} />
    </Form.Item>
  </Form>
</Modal>
```

---

## 预算管理

### 预算进度条

```tsx
<Card title="月度预算" style={{ marginTop: 16 }}>
  {stats?.budget ? (
    <>
      <Progress
        percent={stats.budget.percentage}
        status={stats.budget.is_over ? 'exception' : stats.budget.percentage >= 80 ? 'warning' : 'success'}
        strokeColor={getProgressColor(stats.budget.percentage)}
      />

      <div className="budget-info" style={{ marginTop: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Statistic
              title="已使用"
              value={stats.budget.used}
              precision={2}
              prefix="$"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="预算限制"
              value={stats.budget.limit}
              prefix="$"
            />
          </Col>
          <Col span={8}>
            <Statistic
              title="剩余"
              value={stats.budget.remaining}
              precision={2}
              prefix="$"
              valueStyle={{
                color: stats.budget.remaining < 0 ? '#cf1322' : '#3f8600',
              }}
            />
          </Col>
        </Row>
      </div>

      <div className="budget-reset" style={{ marginTop: 16 }}>
        <Text type="secondary">
          预算重置: {formatDate(stats.budget.reset_date)}
        </Text>
      </div>

      {stats.budget.is_over && (
        <Alert
          type="error"
          message="预算已超支"
          description="当前支出已超过月度预算限制，请注意控制使用"
          style={{ marginTop: 16 }}
          showIcon
        />
      )}
    </>
  ) : (
    <Empty description="未设置预算" />
  )}
</Card>
```

---

## 相关 API

- [成本 API](../03-api/cost-api.md)
