# Agent 管理页

## 页面概览

- **路由**: `/agents`
- **所需权限**: 已登录用户
- **关联场景**: 无（只读展示）

---

## 页面状态

```typescript
interface AgentListState {
  agents: Agent[]
  total: number
  loading: boolean

  // 筛选
  filters: {
    status?: 'active' | 'inactive'
    type?: string
  }

  // 分页
  pagination: {
    page: number
    pageSize: number
  }
}
```

## 组件结构

```
AgentListPage
├── PageHeader
│   ├── 标题 "Agent 管理"
│   └── 说明文字 (只读)
├── FilterBar
│   ├── 状态筛选
│   └── 类型筛选
└── AgentGrid (卡片式布局)
    └── AgentCard × N
        ├── Avatar / Icon
        ├── 名称
        ├── 类型
        ├── 能力标签
        ├── 配置参数
        └── 统计数据
```

## Agent 卡片

```tsx
<Col xs={24} sm={12} md={8} lg={6}>
  <Card>
    <Card.Meta
      avatar={
        <Avatar
          size={64}
          style={{ backgroundColor: getAgentColor(agent.type) }}
          icon={<RobotOutlined />}
        />
      }
      title={agent.name}
      description={
        <Space direction="vertical" size={0}>
          <Tag color={getTypeColor(agent.type)}>{agent.type}</Tag>
          <Text type="secondary">{agent.description}</Text>
        </Space>
      }
    />

    <Divider />

    {/* 能力标签 */}
    <div style={{ marginBottom: 16 }}>
      <Text strong>能力:</Text>
      <div style={{ marginTop: 8 }}>
        {agent.capabilities.map(cap => (
          <Tag key={cap}>{cap}</Tag>
        ))}
      </div>
    </div>

    {/* 配置参数 */}
    <Descriptions size="small" column={1}>
      <Descriptions.Item label="温度">{agent.config.temperature}</Descriptions.Item>
      <Descriptions.Item label="Max Tokens">{agent.config.max_tokens}</Descriptions.Item>
      <Descriptions.Item label="Max Steps">{agent.config.max_steps}</Descriptions.Item>
    </Descriptions>

    {/* 统计数据 */}
    <Divider />
    <Row gutter={8}>
      <Col span={8}>
        <Statistic
          title="总执行"
          value={agent.stats?.total_executions || 0}
          valueStyle={{ fontSize: 14 }}
        />
      </Col>
      <Col span={8}>
        <Statistic
          title="成功率"
          value={agent.stats?.success_rate || 0}
          suffix="%"
          precision={1}
          valueStyle={{ fontSize: 14 }}
        />
      </Col>
      <Col span={8}>
        <Statistic
          title="平均耗时"
          value={formatDuration(agent.stats?.avg_duration)}
          valueStyle={{ fontSize: 14 }}
        />
      </Col>
    </Row>
  </Card>
</Col>
```

## API 调用

```typescript
// GET /api/v1/agents
const fetchAgents = async (params: {
  page?: number
  page_size?: number
  status?: string
  type?: string
}): Promise<PaginatedResponse<Agent>> => {
  const res = await api.get('/agents', { params })
  return res.data
}
```
