# 通知中心页面

## 概述

通知中心页面展示用户的所有通知，支持查看、确认、筛选等操作。

---

## 页面结构

```
/notifications
  │
  ├─► 通知列表
  │     ├─ 筛选器（状态、类型、时间）
  │     ├─ 批量操作（全部已读、批量删除）
  │     └─ 通知项列表
  │
  ├─► 通知详情
  │     ├─ 通知内容
  │     ├─ 关联资源链接
  │     └─ 操作按钮（确认、拒绝）
  │
  └─► 通知设置
        ├─ 通知类型开关
        ├─ 通知方式选择
        └─ 免打扰设置
```

---

## 通知列表

### 页面头部

```tsx
<PageHeader
  title="通知中心"
  extra={[
    <Badge key="badge" count={unreadCount} overflowCount={99}>
      <BellOutlined style={{ fontSize: 20 }} />
    </Badge>,
  ]}
/>
```

### 筛选器

```tsx
<Card size="small" style={{ marginBottom: 16 }}>
  <Row gutter={16}>
    <Col span={6}>
      <Select
        placeholder="状态"
        allowClear
        onChange={(value) => setFilters({ ...filters, status: value })}
        style={{ width: '100%' }}
      >
        <Select.Option value="pending">未读</Select.Option>
        <Select.Option value="acknowledged">已读</Select.Option>
      </Select>
    </Col>

    <Col span={6}>
      <Select
        placeholder="类型"
        allowClear
        onChange={(value) => setFilters({ ...filters, type: value })}
        style={{ width: '100%' }}
      >
        <Select.Option value="execution_completed">执行完成</Select.Option>
        <Select.Option value="execution_failed">执行失败</Select.Option>
        <Select.Option value="batch_progress">批量进度</Select.Option>
        <Select.Option value="org_invitation">组织邀请</Select.Option>
      </Select>
    </Col>

    <Col span={6}>
      <RangePicker
        placeholder={['开始日期', '结束日期']}
        onChange={(dates) => setFilters({
          ...filters,
          start_date: dates?.[0]?.format('YYYY-MM-DD'),
          end_date: dates?.[1]?.format('YYYY-MM-DD'),
        })}
      />
    </Col>

    <Col span={6}>
      <Button onClick={() => setFilters({})}>重置</Button>
    </Col>
  </Row>
</Card>
```

### 批量操作

```tsx
<Space style={{ marginBottom: 16 }}>
  <Checkbox
    checked={selectedAll}
    onChange={handleSelectAll}
  >
    全选
  </Checkbox>

  <Button
    disabled={selected.length === 0}
    onClick={handleBatchAcknowledge}
  >
    批量已读
  </Button>

  <Button
    disabled={selected.length === 0}
    danger
    onClick={handleBatchDelete}
  >
    批量删除
  </Button>

  {hasPending && (
    <Button type="link" onClick={handleMarkAllRead}>
      全部设为已读
    </Button>
  )}
</Space>
```

---

## 通知列表项

```tsx
<List
  dataSource={notifications}
  loading={isLoading}
  pagination={{
    pageSize: 20,
    showSizeChanger: true,
    showTotal: (total) => `共 ${total} 条`,
  }}
  renderItem={(item) => (
    <List.Item
      key={item.id}
      className={item.status === 'pending' ? 'unread' : ''}
      onClick={() => handleNotificationClick(item)}
    >
      <List.Item.Meta
        avatar={
          <Avatar
            icon={<NotificationIcon type={item.type} />}
            style={{
              backgroundColor: getNotificationColor(item.type),
            }}
          />
        }
        title={
          <Space>
            <span>{item.title}</span>
            {item.priority === 'high' && (
              <Tag color="red">重要</Tag>
            )}
            {item.status === 'pending' && (
              <Badge status="error" />
            )}
          </Space>
        }
        description={
          <>
            <p>{item.message}</p>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {formatRelativeTime(item.created_at)}
            </Text>
          </>
        }
      />
      <div className="notification-actions">
        {item.status === 'pending' && (
          <>
            {item.type === 'org_invitation' && (
              <>
                <Button
                  size="small"
                  type="primary"
                  onClick={(e) => handleAccept(e, item)}
                >
                  接受
                </Button>
                <Button
                  size="small"
                  danger
                  onClick={(e) => handleReject(e, item)}
                >
                  拒绝
                </Button>
              </>
            )}
            {item.resource_type && (
              <Button
                size="small"
                type="link"
                onClick={(e) => handleViewResource(e, item)}
              >
                查看
              </Button>
            )}
          </>
        )}
      </div>
    </List.Item>
  )}
/>
```

---

## 通知图标

```tsx
const NotificationIcon: React.FC<{ type: string }> = ({ type }) => {
  const iconMap: Record<string, React.ReactNode> = {
    execution_completed: <CheckCircleOutlined />,
    execution_failed: <CloseCircleOutlined />,
    batch_progress: <LoadingOutlined />,
    batch_completed: <CheckSquareOutlined />,
    org_invitation: <TeamOutlined />,
    org_joined: <UserAddOutlined />,
    system: <InfoCircleOutlined />,
    warning: <WarningOutlined />,
  };

  return iconMap[type] || <BellOutlined />;
};

const getNotificationColor = (type: string): string => {
  const colorMap: Record<string, string> = {
    execution_completed: '#52c41a',
    execution_failed: '#ff4d4f',
    batch_progress: '#1890ff',
    org_invitation: '#722ed1',
    system: '#8c8c8c',
    warning: '#faad14',
  };

  return colorMap[type] || '#8c8c8c';
};
```

---

## 通知详情

```tsx
const NotificationDetail: React.FC<{
  notification: Notification;
  onAcknowledge: () => void;
  onReject: () => void;
}> = ({ notification, onAcknowledge, onReject }) => {
  return (
    <Drawer
      title={notification.title}
      open={visible}
      onClose={onClose}
      width={480}
      extra={
        notification.status === 'pending' && (
          <Space>
            <Button onClick={onReject}>拒绝</Button>
            <Button type="primary" onClick={onAcknowledge}>
              确认
            </Button>
          </Space>
        )
      }
    >
      <div className="notification-detail">
        <div className="notification-content">
          <p>{notification.message}</p>
        </div>

        {notification.metadata && (
          <Card title="详细信息" size="small" style={{ marginTop: 16 }}>
            <pre>{JSON.stringify(notification.metadata, null, 2)}</pre>
          </Card>
        )}

        {notification.resource_type && (
          <Card title="相关资源" size="small" style={{ marginTop: 16 }}>
            <Descriptions column={1}>
              <Descriptions.Item label="类型">
                {notification.resource_type}
              </Descriptions.Item>
              <Descriptions.Item label="ID">
                {notification.resource_id}
              </Descriptions.Item>
            </Descriptions>
            <Button
              type="primary"
              onClick={() => navigateToResource(notification)}
            >
              查看详情
            </Button>
          </Card>
        )}

        <div className="notification-footer" style={{ marginTop: 24 }}>
          <Text type="secondary">
            {formatDateTime(notification.created_at)}
          </Text>
        </div>
      </div>
    </Drawer>
  );
};
```

---

## WebSocket 实时通知

```tsx
// hooks/useNotificationWebSocket.ts
export const useNotificationWebSocket = () => {
  const { addNotification, updatePendingCount } = useNotificationStore();

  useEffect(() => {
    const ws = new WebSocket(wsUrl('/ws'));

    ws.onopen = () => {
      console.log('Notification WebSocket connected');
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);

      switch (message.event) {
        case 'notification':
          addNotification(message.data);
          updatePendingCount();

          // 显示通知
          notification.open({
            message: message.data.title,
            description: message.data.message,
            type: getNotificationType(message.data.type),
            placement: 'topRight',
            duration: 4.5,
          });
          break;

        case 'task_completed':
          handleTaskCompleted(message.data);
          break;

        case 'batch_progress':
          handleBatchProgress(message.data);
          break;

        case 'org_invitation':
          handleOrgInvitation(message.data);
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket closed, reconnecting in 5s...');
      setTimeout(() => {
        // 重连逻辑
      }, 5000);
    };

    return () => ws.close();
  }, []);
};
```

---

## 通知设置

```tsx
<Card title="通知设置">
  <Form layout="vertical">
    <Form.Item label="通知类型">
      <List
        dataSource={[
          { type: 'execution_completed', label: '执行完成通知', checked: true },
          { type: 'execution_failed', label: '执行失败通知', checked: true },
          { type: 'batch_progress', label: '批量进度通知', checked: false },
          { type: 'org_invitation', label: '组织邀请通知', checked: true },
        ]}
        renderItem={(item) => (
          <List.Item
            actions={[
              <Switch
                key="toggle"
                checked={item.checked}
                onChange={(checked) => handleToggle(item.type, checked)}
              />,
            ]}
          >
            <List.Item.Meta
              avatar={<NotificationIcon type={item.type} />}
              title={item.label}
              description={`接收${item.label}`}
            />
          </List.Item>
        )}
      />
    </Form.Item>

    <Form.Item label="免打扰">
      <Space direction="vertical">
        <Checkbox>启用免打扰模式</Checkbox>
        <TimePicker.RangePicker
          placeholder={['开始时间', '结束时间']}
          format="HH:mm"
        />
      </Space>
    </Form.Item>
  </Form>
</Card>
```

---

## 相关 API

- [通知历史 API](../03-api/notification-api.md)
- [WebSocket API](../03-api/websocket-api.md)
