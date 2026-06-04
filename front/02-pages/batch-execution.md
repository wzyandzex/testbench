# 组织管理页

## 页面概览

- **路由**: `/organizations`
- **所需权限**: 已登录用户
- **关联场景**: [组织管理](../01-scenarios/organization.md)

---

## 页面状态

```typescript
interface OrganizationListState {
  organizations: Organization[]
  currentOrg: Organization | null
  loading: boolean

  // 模态框状态
  createModalVisible: boolean
  inviteModalVisible: boolean
  membersModalVisible: boolean
  selectedOrg: Organization | null
}
```

## 组件结构

```
OrganizationListPage
├── PageHeader
│   ├── 标题 "组织管理"
│   └── "创建组织" 按钮
├── OrganizationGrid
│   └── OrganizationCard × N
│       ├── Logo / 头像
│       ├── 名称
│       ├── 成员数量
│       ├── "管理" 按钮
│       └── "切换" 按钮
└── Modals
    ├── 创建组织模态框
    ├── 邀请成员模态框
    └── 成员管理模态框
```

## 组织卡片

```tsx
<Col xs={24} sm={12} md={8} lg={6}>
  <Card
    hoverable
    className={currentOrg?.id === org.id ? 'active' : ''}
    onClick={() => switchOrg(org.id)}
    actions={[
      <Button key="manage" onClick={(e) => openMembersModal(e, org)}>
        管理成员
      </Button>,
      <Button
        key="switch"
        type={currentOrg?.id === org.id ? 'primary' : 'default'}
        onClick={(e) => {
          e.stopPropagation()
          switchOrg(org.id)
        }}
      >
        {currentOrg?.id === org.id ? '当前组织' : '切换'}
      </Button>
    ]}
  >
    <Card.Meta
      avatar={
        org.logo_url ? (
          <Avatar src={org.logo_url} />
        ) : (
          <Avatar style={{ backgroundColor: getRandomColor(org.name) }}>
            {org.display_name[0]}
          </Avatar>
        )
      }
      title={org.display_name}
      description={
        <Space direction="vertical" size={0}>
          <Text type="secondary">@{org.name}</Text>
          <Text type="secondary">{org.member_count} 成员</Text>
        </Space>
      }
    />
  </Card>
</Col>
```

## 创建组织对话框

```tsx
<Modal
  title="创建组织"
  open={createModalVisible}
  onCancel={() => setCreateModalVisible(false)}
  onOk={handleCreate}
  okText="创建"
  cancelText="取消"
  width={600}
>
  <Form form={form} layout="vertical">
    <Form.Item
      label="组织名称"
      name="name"
      rules={[
        { required: true, message: '请输入组织名称' },
        { min: 3, max: 50, message: '长度 3-50 字符' },
        { pattern: /^[a-z0-9_-]+$/, message: '只能包含小写字母、数字、下划线、中划线' }
      ]}
    >
      <Input placeholder="org-name" />
    </Form.Item>

    <Form.Item
      label="显示名称"
      name="display_name"
      rules={[
        { required: true, message: '请输入显示名称' },
        { max: 100, message: '最多 100 字符' }
      ]}
    >
      <Input placeholder="我的组织" />
    </Form.Item>

    <Form.Item
      label="描述"
      name="description"
      rules={[{ max: 500, message: '最多 500 字符' }]}
    >
      <TextArea rows={3} placeholder="组织描述..." />
    </Form.Item>

    <Form.Item
      label="Logo URL"
      name="logo_url"
    >
      <Input placeholder="https://..." />
    </Form.Item>
  </Form>
</Modal>
```

## 成员管理对话框

```tsx
<Modal
  title={`成员管理 - ${selectedOrg?.display_name}`}
  open={membersModalVisible}
  onCancel={() => setMembersModalVisible(false)}
  width={800}
  footer={null}
>
  <Space direction="vertical" style={{ width: '100%' }} size="large">
    {/* 邀请成员 */}
    <Card size="small" title="邀请新成员">
      <Form layout="inline" onFinish={handleInvite}>
        <Form.Item
          name="emails"
          rules={[{ required: true, message: '请输入邮箱' }]}
        >
          <Select
            mode="tags"
            placeholder="输入邮箱，按回车添加"
            style={{ width: 300 }}
          >
            {inviteEmails.map(email => (
              <Select.Option key={email} value={email}>
                {email}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item
          name="role"
          initialValue="member"
        >
          <Select style={{ width: 120 }}>
            <Select.Option value="admin">管理员</Select.Option>
            <Select.Option value="member">成员</Select.Option>
            <Select.Option value="viewer">查看者</Select.Option>
          </Select>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={inviting}>
            发送邀请
          </Button>
        </Form.Item>
      </Form>
    </Card>

    {/* 成员列表 */}
    <Table
      columns={[
        {
          title: '用户',
          dataIndex: 'username',
          render: (_, record) => (
            <Space>
              <Avatar size="small" src={record.avatar} />
              <span>{record.username}</span>
              {record.role === 'owner' && (
                <Tag color="gold">所有者</Tag>
              )}
            </Space>
          )
        },
        {
          title: '邮箱',
          dataIndex: 'email'
        },
        {
          title: '角色',
          dataIndex: 'role',
          render: (role, record) => (
            record.role === 'owner' ? (
              <Tag color="gold">所有者</Tag>
            ) : (
              <Select
                size="small"
                value={role}
                onChange={(newRole) => updateMemberRole(record.user_id, newRole)}
                style={{ width: 100 }}
              >
                <Select.Option value="admin">管理员</Select.Option>
                <Select.Option value="member">成员</Select.Option>
                <Select.Option value="viewer">查看者</Select.Option>
              </Select>
            )
          )
        },
        {
          title: '状态',
          dataIndex: 'status',
          render: (status) => (
            <Badge
              status={status === 'active' ? 'success' : 'default'}
              text={status === 'active' ? '活跃' : '待激活'}
            />
          )
        },
        {
          title: '操作',
          render: (_, record) => (
            record.role !== 'owner' && (
              <Popconfirm
                title="移除成员"
                description="确定要移除该成员吗？"
                onConfirm={() => removeMember(record.user_id)}
              >
                <Button type="link" danger size="small">
                  移除
                </Button>
              </Popconfirm>
            )
          )
        }
      ]}
      dataSource={members}
      rowKey="user_id"
      pagination={false}
      size="small"
    />
  </Space>
</Modal>
```

## 角色权限说明

```tsx
<DescriptionList size="small" bordered>
  <DescriptionList.Item label="所有者">
    完全控制组织，可删除组织
  </DescriptionList.Item>
  <DescriptionList.Item label="管理员">
    管理成员和资源，不可删除组织
  </DescriptionList.Item>
  <DescriptionList.Item label="成员">
    可创建和管理资源
  </DescriptionList.Item>
  <DescriptionList.Item label="查看者">
    仅可查看资源
  </DescriptionList.Item>
</DescriptionList>
```

## API 调用

```typescript
// 创建组织
const createOrganization = async (data: CreateOrgRequest): Promise<Organization> => {
  const res = await api.post('/organizations', data)
  return res.data
}

// 获取组织列表
const fetchOrganizations = async (): Promise<Organization[]> => {
  const res = await api.get('/organizations')
  return res.data
}

// 获取组织成员
const fetchMembers = async (orgId: string): Promise<OrganizationMember[]> => {
  const res = await api.get(`/organizations/${orgId}/members`)
  return res.data
}

// 邀请成员
const inviteMembers = async (
  orgId: string,
  data: { emails: string[], role: string }
): Promise<Invitation[]> => {
  const res = await api.post(`/organizations/${orgId}/invitations`, data)
  return res.data.invitations
}

// 更新成员角色
const updateMemberRole = async (
  orgId: string,
  userId: string,
  role: string
): Promise<void> => {
  await api.put(`/organizations/${orgId}/members/${userId}/role`, { role })
}

// 移除成员
const removeMember = async (orgId: string, userId: string): Promise<void> => {
  await api.delete(`/organizations/${orgId}/members/${userId}`)
}

// 删除组织
const deleteOrganization = async (orgId: string): Promise<void> => {
  await api.delete(`/organizations/${orgId}`)
}
```
