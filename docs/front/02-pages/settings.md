# 设置页面

## 概述

设置页面提供系统配置功能，包括个人设置、语言配置、缓存监控、Kafka 监控等。

---

## 页面结构

```
/settings
  │
  ├─► 个人设置
  │     ├─ 基本信息
  │     ├─ 密码修改
  │     ├─ 邮箱变更
  │     ├─ API 密钥管理
  │     └─ 偏好设置
  │
  ├─► 语言配置
  │     ├─ 语言列表
  │     ├─ 语言详情
  │     └─ 命令模板
  │
  ├─► 缓存监控（管理员）
  │     ├─ 缓存统计
  │     ├─ 告警列表
  │     └─ 热点键
  │
  ├─► Kafka 监控（管理员）
  │     ├─ Kafka 统计
  │     ├─ Topic 管理
  │     └─ 消费者信息
  │
  └─► 系统信息
        ├─ 版本信息
        ├─ 系统状态
        └─ 健康检查
```

---

## 个人设置

### 基本信息

```tsx
<Card title="基本信息">
  <Form layout="vertical">
    <Form.Item label="头像">
      <Upload
        name="avatar"
        listType="picture-card"
        showUploadList={false}
        beforeUpload={beforeUpload}
        onChange={handleAvatarChange}
      >
        {avatar ? (
          <img src={avatar} alt="avatar" style={{ width: '100%' }} />
        ) : (
          <div>
            <PlusOutlined />
            <div style={{ marginTop: 8 }}>上传</div>
          </div>
        )}
      </Upload>
    </Form.Item>

    <Form.Item label="用户名">
      <Input value={user?.username} disabled />
    </Form.Item>

    <Form.Item label="邮箱">
      <Input value={user?.email} disabled />
      <Button type="link">更改邮箱</Button>
    </Form.Item>

    <Form.Item label="角色">
      <Input value={user?.role} disabled />
    </Form.Item>
  </Form>
</Card>
```

### 密码修改

```tsx
<Card title="修改密码" style={{ marginTop: 16 }}>
  <Form
    layout="vertical"
    onFinish={handlePasswordChange}
  >
    <Form.Item
      name="old_password"
      label="当前密码"
      rules={[{ required: true, message: '请输入当前密码' }]}
    >
      <Input.Password />
    </Form.Item>

    <Form.Item
      name="new_password"
      label="新密码"
      rules={[
        { required: true, message: '请输入新密码' },
        { min: 8, message: '密码至少 8 个字符' },
        ({ getFieldValue }) => ({
          validator(_, value) {
            if (!value || getFieldValue('old_password') !== value) {
              return Promise.resolve();
            }
            return Promise.reject(new Error('新密码不能与当前密码相同'));
          },
        }),
      ]}
    >
      <Input.Password />
    </Form.Item>

    <Form.Item
      name="confirm_password"
      label="确认新密码"
      dependencies={['new_password']}
      rules={[
        { required: true, message: '请确认新密码' },
        ({ getFieldValue }) => ({
          validator(_, value) {
            if (!value || getFieldValue('new_password') === value) {
              return Promise.resolve();
            }
            return Promise.reject(new Error('两次输入的密码不一致'));
          },
        }),
      ]}
    >
      <Input.Password />
    </Form.Item>

    <Form.Item>
      <Button type="primary" htmlType="submit">
        修改密码
      </Button>
    </Form.Item>
  </Form>
</Card>
```

---

## 语言配置

### 语言列表

```tsx
<Card title="语言配置">
  <Table
    dataSource={languages}
    rowKey="name"
    pagination={false}
    columns={[
      { title: '语言', dataIndex: 'display_name' },
      { title: '版本', dataIndex: 'version' },
      {
        title: '扩展名',
        dataIndex: 'extensions',
        render: (exts) => exts?.map(e => <Tag key={e}>{e}</Tag>).join(' '),
      },
      { title: '测试框架', dataIndex: ['test_config', 'framework'] },
      {
        title: '操作',
        render: (_, record) => (
          <Space>
            <Button size="small" onClick={() => viewDetail(record)}>
              详情
            </Button>
            <Button
              size="small"
              onClick={() => reloadConfig(record.name)}
            >
              重载配置
            </Button>
          </Space>
        ),
      },
    ]}
  />
</Card>
```

### 语言详情抽屉

```tsx
<Drawer
  title={`语言配置: ${language?.display_name}`}
  open={visible}
  onClose={() => setVisible(false)}
  width={600}
>
  {language && (
    <Descriptions column={2} bordered>
      <Descriptions.Item label="名称" span={2}>
        {language.display_name}
      </Descriptions.Item>
      <Descriptions.Item label="版本">
        {language.version}
      </Descriptions.Item>
      <Descriptions.Item label="标识符">
        {language.name}
      </Descriptions.Item>
      <Descriptions.Item label="扩展名" span={2}>
        {language.extensions?.map(e => <Tag key={e}>{e}</Tag>)}
      </Descriptions.Item>

      <Descriptions.Item label="Docker 镜像" span={2}>
        <code>{language.sandbox_config?.image}</code>
      </Descriptions.Item>

      <Descriptions.Item label="Docker 命令" span={2}>
        <pre>{language.docker_command}</pre>
      </Descriptions.Item>

      <Descriptions.Item label="测试命令" span={2}>
        <pre>{language.test_command}</pre>
      </Descriptions.Item>

      <Descriptions.Item label="内存限制">
        {language.sandbox_config?.memory_limit}
      </Descriptions.Item>
      <Descriptions.Item label="超时">
        {language.sandbox_config?.timeout}s
      </Descriptions.Item>
    </Descriptions>
  )}
</Drawer>
```

---

## 缓存监控（管理员）

### 缓存仪表板

```tsx
<Card title="缓存监控">
  <Row gutter={16}>
    <Col span={6}>
      <Statistic
        title="总键数"
        value={stats?.total_keys}
        loading={isLoading}
      />
    </Col>
    <Col span={6}>
      <Statistic
        title="内存使用"
        value={stats?.memory_used}
        suffix="MB"
        loading={isLoading}
      />
    </Col>
    <Col span={6}>
      <Statistic
        title="命中率"
        value={stats?.hit_rate}
        precision={2}
        suffix="%"
        loading={isLoading}
        valueStyle={{ color: stats?.hit_rate > 80 ? '#3f8600' : '#cf1322' }}
      />
    </Col>
    <Col span={6}>
      <Statistic
        title="QPS"
        value={stats?.qps}
        loading={isLoading}
      />
    </Col>
  </Row>

  <Button
    style={{ marginTop: 16 }}
    onClick={() => refetch()}
  >
    刷新
  </Button>
</Card>
```

### 告警列表

```tsx
<Card title="缓存告警" style={{ marginTop: 16 }}>
  {alerts && alerts.length > 0 ? (
    <List
      dataSource={alerts}
      renderItem={(alert) => (
        <List.Item>
          <List.Item.Meta
            avatar={<AlertIcon type={alert.type} />}
            title={<AlertSeverity severity={alert.severity}>{alert.type}</AlertSeverity>}
            description={alert.message}
          />
          <Tag color={alert.status === 'active' ? 'red' : 'green'}>
            {alert.status}
          </Tag>
        </List.Item>
      )}
    />
  ) : (
    <Empty description="暂无告警" />
  )}
</Card>
```

---

## Kafka 监控（管理员）

### Kafka 仪表板

```tsx
<Card title="Kafka 监控">
  <Row gutter={16}>
    <Col span={4}>
      <Statistic title="Topics" value={stats?.total_topics} />
    </Col>
    <Col span={5}>
      <Statistic title="消息/秒" value={stats?.messages_per_second} />
    </Col>
    <Col span={5}>
      <Statistic title="字节/秒" value={stats?.bytes_per_second} formatter={formatBytes} />
    </Col>
    <Col span={5}>
      <Statistic title="消费者组" value={stats?.consumer_groups} />
    </Col>
    <Col span={5}>
      <Statistic
        title="消费延迟"
        value={stats?.consumer_lag}
        formatter={formatNumber}
        valueStyle={{ color: stats?.consumer_lag > 1000 ? '#cf1322' : '#3f8600' }}
      />
    </Col>
  </Row>
</Card>
```

### Topic 列表

```tsx
<Card title="Topics" style={{ marginTop: 16 }}>
  <Table
    dataSource={topics}
    rowKey="name"
    pagination={false}
    columns={[
      { title: 'Topic', dataIndex: 'name' },
      { title: '分区', dataIndex: 'partitions' },
      { title: '副本因子', dataIndex: 'replication_factor' },
      {
        title: '消息数',
        dataIndex: 'total_messages',
        render: (value) => formatNumber(value),
      },
      {
        title: 'msg/s',
        dataIndex: 'messages_per_second',
        render: (value) => formatNumber(value),
      },
      {
        title: '消费延迟',
        dataIndex: 'consumer_lag',
        render: (value) => formatNumber(value),
      },
      {
        title: '操作',
        render: (_, record) => (
          <Space>
            <Button size="small">详情</Button>
            <Button
              size="small"
              danger
              onClick={() => handleDeleteTopic(record.name)}
            >
              删除
            </Button>
          </Space>
        ),
      },
    ]}
  />
</Card>
```

---

## 系统信息

```tsx
<Card title="系统信息">
  <Descriptions column={2} bordered>
    <Descriptions.Item label="版本" span={2}>
      MyAgent v{systemInfo.version}
    </Descriptions.Item>
    <Descriptions.Item label="构建时间">
      {systemInfo.build_time}
    </Descriptions.Item>
    <Descriptions.Item label="Git Commit">
      <code>{systemInfo.git_commit?.substring(0, 8)}</code>
    </Descriptions.Item>
    <Descriptions.Item label="Go 版本" span={2}>
      {systemInfo.go_version}
    </Descriptions.Item>
    <Descriptions.Item label="启动时间">
      {formatDateTime(systemInfo.start_time)}
    </Descriptions.Item>
    <Descriptions.Item label="运行时间">
      {formatDuration(systemInfo.uptime)}
    </Descriptions.Item>
  </Descriptions>
</Card>
```

---

## 相关 API

- [语言 API](../02-api/language-api.md)
- [缓存 API](../02-api/cache-api.md)
- [Kafka API](../02-api/scheduler-api.md)
