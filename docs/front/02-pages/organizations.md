# 组织管理页面

## 概述

组织管理页面用于管理用户所属的组织，包括创建组织、成员管理、邀请管理、配额查看等功能。

---

## 页面结构

```
/organizations
  │
  ├─► 组织列表页
  │     ├─ 组织卡片网格
  │     ├─ 创建组织按钮
  │     └─ 切换组织功能
  │
  ├─► 组织详情页 (/organizations/:id)
  │     ├─ 基本信息
  │     ├─ 配额信息
  │     ├─ 成员列表
  │     └─ 设置标签页
  │
  ├─► 创建组织页 (/organizations/new)
  │     ├─ 组织信息表单
  │     └─ 模板选择
  │
  └─► 邀请管理页 (/organizations/:id/invitations)
        ├─ 邀请列表
        ├─ 创建邀请
        └─ 重发/取消邀请
```

---

## 组织列表页

### 组件结构

```tsx
<PageHeader title="我的组织" />
<Button type="primary" icon={<PlusOutlined />}>
  创建组织
</Button>

<div className="org-grid">
  {organizations.map(org => (
    <OrgCard
      key={org.id}
      organization={org}
      isCurrent={org.id === currentOrg?.id}
      onSwitch={handleSwitch}
      onClick={handleClick}
    />
  ))}
</div>
```

### 组织卡片

```tsx
<Card
  hoverable
  className={isCurrent ? 'current-org' : ''}
  extra={isCurrent ? <Tag color="blue">当前</Tag> : null}
>
  <div className="org-header">
    <TeamOutlined style={{ fontSize: 32 }} />
    <h3>{org.name}</h3>
  </div>
  <p>{org.description}</p>
  <div className="org-stats">
    <Statistic title="成员" value={org.member_count} />
    <Statistic title="角色" value={org.role} />
  </div>
  <div className="org-actions">
    {isCurrent ? (
      <Button type="primary">管理</Button>
    ) : (
      <Button onClick={() => onSwitch(org.id)}>切换</Button>
    )}
  </div>
</Card>
```

---

## 组织详情页

### 页面布局

```tsx
<PageHeader
  title={organization.name}
  extra={[
    <Button key="settings" icon={<SettingOutlined />}>
      设置
    </Button>,
  ]}
/>

<Tabs defaultActiveKey="overview">
  <Tabs.TabPane tab="概览" key="overview">
    <OrgOverview organization={organization} />
  </Tabs.TabPane>

  <Tabs.TabPane tab="成员" key="members">
    <OrgMembers organization={organization} />
  </Tabs.TabPane>

  <Tabs.TabPane tab="邀请" key="invitations">
    <OrgInvitations organization={organization} />
  </Tabs.TabPane>

  <Tabs.TabPane tab="配额" key="quota">
    <OrgQuota organization={organization} />
  </Tabs.TabPane>
</Tabs>
```

### 概览标签页

```tsx
<Descriptions column={2}>
  <Descriptions.Item label="组织 ID">
    {organization.id}
  </Descriptions.Item>
  <Descriptions.Item label="创建者">
    {organization.owner.username}
  </Descriptions.Item>
  <Descriptions.Item label="成员数">
    {organization.member_count}
  </Descriptions.Item>
  <Descriptions.Item label="执行次数">
    {organization.execution_count}
  </Descriptions.Item>
  <Descriptions.Item label="创建时间">
    {formatDateTime(organization.created_at)}
  </Descriptions.Item>
</Descriptions>

<Card title="配额使用情况" style={{ marginTop: 16 }}>
  <Row gutter={16}>
    <Col span={8}>
      <Progress
        type="circle"
        percent={quota.members.percentage}
        format={() => `${quota.members.current}/${quota.members.limit}`}
      />
      <p>成员配额</p>
    </Col>
    <Col span={8}>
      <Progress
        type="circle"
        percent={quota.executions.percentage}
        format={() => `${quota.executions.current}/${quota.executions.limit}`}
      />
      <p>执行配额</p>
    </Col>
    <Col span={8}>
      <Progress
        type="circle"
        percent={quota.storage.percentage}
        format={() => `${formatBytes(quota.storage.current)}/${formatBytes(quota.storage.limit)}`}
      />
      <p>存储配额</p>
    </Col>
  </Row>
</Card>
```

---

## 成员管理

### 成员列表

```tsx
<Table
  dataSource={members}
  columns={[
    { title: '用户', dataIndex: ['user', 'username'] },
    { title: '邮箱', dataIndex: ['user', 'email'] },
    {
      title: '角色',
      dataIndex: 'role',
      render: (role) => <RoleSelect value={role} onChange={handleChangeRole} />,
    },
    { title: '加入时间', dataIndex: 'joined_at', render: formatDateTime },
    {
      title: '操作',
      render: (_, record) => (
        <Button
          danger
          size="small"
          onClick={() => handleRemoveMember(record.user_id)}
        >
          移除
        </Button>
      ),
    },
  ]}
/>
```

### 角色选择器

```tsx
const RoleSelect: React.FC<RoleSelectProps> = ({ value, onChange, disabled }) => {
  const options = [
    { label: '所有者', value: 'owner' },
    { label: '管理员', value: 'admin' },
    { label: '成员', value: 'member' },
  ];

  return (
    <Select
      value={value}
      onChange={onChange}
      options={options}
      disabled={disabled}
      style={{ width: 120 }}
    />
  );
};
```

---

## 邀请管理

### 邀请列表

```tsx
<Table
  dataSource={invitations}
  columns={[
    { title: '邮箱', dataIndex: 'email' },
    { title: '角色', dataIndex: 'role' },
    { title: '邀请人', dataIndex: ['inviter', 'username'] },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status) => <InvitationStatusBadge status={status} />,
    },
    { title: '过期时间', dataIndex: 'expires_at', render: formatDateTime },
    {
      title: '操作',
      render: (_, record) => (
        <Space>
          {record.status === 'pending' && (
            <>
              <Button
                size="small"
                onClick={() => handleResend(record.id)}
              >
                重发
              </Button>
              <Button
                danger
                size="small"
                onClick={() => handleCancel(record.id)}
              >
                取消
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ]}
/>
```

### 创建邀请对话框

```tsx
<Modal
  title="邀请新成员"
  open={visible}
  onOk={handleSubmit}
  onCancel={() => setVisible(false)}
>
  <Form form={form} layout="vertical">
    <Form.Item
      name="email"
      label="邮箱地址"
      rules={[
        { required: true, message: '请输入邮箱' },
        { type: 'email', message: '邮箱格式不正确' },
      ]}
    >
      <Input placeholder="example@domain.com" />
    </Form.Item>

    <Form.Item
      name="role"
      label="角色"
      initialValue="member"
    >
      <Select>
        <Select.Option value="admin">管理员</Select.Option>
        <Select.Option value="member">成员</Select.Option>
      </Select>
    </Form.Item>
  </Form>
</Modal>
```

---

## 创建组织

### 表单结构

```tsx
<Form form={form} layout="vertical">
  <Form.Item
    name="name"
    label="组织名称"
    rules={[
      { required: true, message: '请输入组织名称' },
      { min: 2, max: 50, message: '名称长度 2-50 字符' },
    ]}
  >
    <Input placeholder="我的组织" />
  </Form.Item>

  <Form.Item
    name="description"
    label="描述"
  >
    <Input.TextArea
      placeholder="描述组织的用途..."
      rows={3}
    />
  </Form.Item>

  <Form.Item
    name="useTemplate"
    label="使用模板"
    valuePropName="checked"
  >
    <Switch />
  </Form.Item>

  {useTemplate && (
    <Form.Item
      name="template_id"
      label="选择模板"
      rules={[{ required: true, message: '请选择模板' }]}
    >
      <Select placeholder="选择组织模板">
        {templates.map(t => (
          <Select.Option key={t.id} value={t.id}>
            {t.name}
          </Select.Option>
        ))}
      </Select>
    </Form.Item>
  )}
</Form>
```

---

## 权限控制

### 权限矩阵

| 操作 | owner | admin | member |
|------|-------|-------|--------|
| 查看组织 | ✓ | ✓ | ✓ |
| 编辑基本信息 | ✓ | ✓ | ✗ |
| 删除组织 | ✓ | ✗ | ✗ |
| 邀请成员 | ✓ | ✓ | ✗ |
| 移除成员 | ✓ | ✓* | ✗ |
| 修改成员角色 | ✓ | ✓* | ✗ |
| 修改设置 | ✓ | ✓ | ✗ |

*admin 不能移除或修改 owner

### 组件权限控制

```tsx
// 使用权限包装器
<Permission require="owner|admin">
  <Button onClick={handleEdit}>编辑组织</Button>
</Permission>

// 或在组件内检查
const canEdit = useMemo(() => {
  return userRole === 'owner' || userRole === 'admin';
}, [userRole]);

{canEdit && (
  <Button onClick={handleEdit}>编辑组织</Button>
)}
```

---

## 相关 API

- [组织 API](../03-api/organization-api.md)
- [组织上下文模式](../04-patterns/organization-context.md)
