# 组织管理接口

## 基础信息

| 项目 | 值 |
|------|------|
| 基础路径 | `/api/v1/organizations` |
| 需要认证 | 是 |
| 内容类型 | `application/json` |

## 错误码

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 400001 | 400 | 请求参数无效 |
| 400002 | 400 | 组织名称已存在 |
| 400003 | 400 | 配额已达上限 |
| 401001 | 401 | 未认证 |
| 403001 | 403 | 无权限操作 |
| 403002 | 403 | 非组织成员 |
| 404001 | 404 | 组织不存在 |
| 404002 | 404 | 成员不存在 |
| 404003 | 404 | 邀请不存在 |
| 409001 | 409 | 用户已是成员 |
| 409002 | 409 | 邀请已存在 |

---

## 接口列表

### 组织管理

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/organizations` | 创建组织 |
| GET | `/organizations` | 获取用户的组织列表 |
| GET | `/organizations/:id` | 获取组织详情 |
| PUT | `/organizations/:id` | 更新组织信息 |
| DELETE | `/organizations/:id` | 删除组织 |
| PUT | `/organizations/:id/settings` | 更新组织设置 |
| GET | `/organizations/:id/quota` | 获取组织配额使用情况 |

### 成员管理

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/organizations/:id/members` | 获取成员列表 |
| PUT | `/organizations/:id/members/:user_id/role` | 更新成员角色 |
| DELETE | `/organizations/:id/members/:user_id` | 移除成员 |

### 邀请管理

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/organizations/:id/invitations` | 邀请成员 |
| GET | `/organizations/:id/invitations` | 列出邀请 |
| DELETE | `/organizations/:id/invitations/:invitation_id` | 取消邀请 |
| POST | `/organizations/:id/invitations/:invitation_id/resend` | 重新发送邀请 |
| POST | `/organizations/:id/join` | 通过邀请码加入组织 |

### 用户操作

| 方法 | 端点 | 说明 |
|------|------|------|
| POST | `/user/current-organization` | 切换当前组织 |

### 组织模板

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/org-templates` | 列出组织模板 |
| GET | `/org-templates/:id` | 获取组织模板详情 |
| POST | `/org-templates/:template_id/create-org` | 基于模板创建组织 |

---

## 组织状态枚举

| 值 | 说明 |
|----|------|
| `active` | 活跃 - 正常使用 |
| `inactive` | 未激活 - 等待激活 |
| `suspended` | 已暂停 - 违反规定被暂停 |

---

## 成员角色枚举

| 值 | 权限 | 说明 |
|----|------|------|
| `owner` | 所有者 | 完全控制，可删除组织 |
| `admin` | 管理员 | 管理成员和资源，不可删除组织 |
| `member` | 成员 | 可创建和管理资源 |
| `guest` | 访客 | 仅可查看资源 |

---

## 模板分类枚举

| 值 | 说明 |
|----|------|
| `small` | 小型团队 |
| `medium` | 中型团队 |
| `large` | 大型团队 |
| `startup` | 初创公司 |
| `enterprise` | 企业版 |

---

## 1. 创建组织

### 请求

```http
POST /api/v1/organizations
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| name | string | 是 | 组织名称（唯一，3-50字符，小写字母数字下划线中划线） |
| display_name | string | 否 | 显示名称（1-100字符） |
| description | string | 否 | 描述（最多500字符） |
| logo_url | string | 否 | Logo URL |

```typescript
interface CreateOrganizationRequest {
  name: string;
  display_name?: string;
  description?: string;
  logo_url?: string;
}
```

### 响应

**成功响应（200）：**

```typescript
interface CreateOrganizationResponse {
  code: number;
  message: string;
  data: Organization;
}

interface Organization {
  id: string;
  name: string;
  display_name: string;
  description: string;
  logo_url: string;
  owner_id: string;
  // 设置
  max_members: number;
  max_executions_per_day: number;
  max_storage_gb: number;
  default_role: MemberRole;
  allow_signup: boolean;
  require_approval: boolean;
  // 状态
  status: OrgStatus;
  member_count: number;
  // 时间
  created_at: string;
  updated_at: string;
}

type MemberRole = 'owner' | 'admin' | 'member' | 'guest';
type OrgStatus = 'active' | 'inactive' | 'suspended';
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 400001 | 400 | 请求参数无效 |
| 400002 | 400 | 组织名称已存在 |

### 使用场景

1. **创建组织表单**
   ```tsx
   const CreateOrganizationModal = ({ visible, onSuccess, onCancel }) => {
     const [form] = Form.useForm();

     const handleSubmit = async (values: CreateOrganizationRequest) => {
       try {
         const response = await api.post('/organizations', values);
         message.success('组织创建成功');
         // 自动切换到新组织
         await switchOrganization(response.data.id);
         onSuccess?.();
       } catch (error) {
         if (error.code === 400002) {
           form.setFields([{ name: 'name', errors: ['组织名称已存在'] }]);
         }
       }
     };

     return (
       <Modal
         title="创建组织"
         open={visible}
         onCancel={onCancel}
         onOk={() => form.submit()}
       >
         <Form form={form} layout="vertical">
           <Form.Item
             name="name"
             label="组织名称"
             rules={[
               { required: true, message: '请输入组织名称' },
               { min: 3, max: 50, message: '长度 3-50 字符' },
               { pattern: /^[a-z0-9_-]+$/, message: '只能包含小写字母、数字、下划线、中划线' }
             ]}
           >
             <Input placeholder="org-name" />
           </Form.Item>

           <Form.Item
             name="display_name"
             label="显示名称"
             rules={[{ max: 100, message: '最多 100 字符' }]}
           >
             <Input placeholder="我的组织" />
           </Form.Item>

           <Form.Item
             name="description"
             label="描述"
             rules={[{ max: 500, message: '最多 500 字符' }]}
           >
             <TextArea rows={3} placeholder="组织描述..." />
           </Form.Item>

           <Form.Item name="logo_url" label="Logo URL">
             <Input placeholder="https://..." />
           </Form.Item>
         </Form>
       </Modal>
     );
   };
   ```

---

## 2. 获取用户的组织列表

### 请求

```http
GET /api/v1/organizations
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface MembershipsResponse {
  code: number;
  message: string;
  data: Membership[];
}

interface Membership {
  org_id: string;
  org_name: string;
  display_name: string;
  logo_url?: string;
  role: MemberRole;
  member_count: number;
  joined_at: string;
  is_owner: boolean;
  is_default: boolean;
}
```

### 使用场景

1. **组织切换器**
   ```tsx
   const OrganizationSwitcher = () => {
     const { data: memberships } = useRequest(() => api.get('/organizations'));
     const currentOrgId = useOrganizationStore(state => state.currentOrgId);
     const switchOrg = useOrganizationStore(state => state.switchOrganization);

     const handleSwitch = async (orgId: string) => {
       try {
         await api.post('/user/current-organization', { org_id: orgId });
         switchOrg(orgId);
         window.location.reload(); // 刷新页面以更新组织上下文
       } catch (error) {
         message.error('切换组织失败');
       }
     };

     return (
       <Dropdown menu={{
         items: memberships?.map(m => ({
           key: m.org_id,
           label: (
             <Space>
               {m.logo_url && <Avatar size="small" src={m.logo_url} />}
               <span>{m.display_name}</span>
               {m.is_default && <Tag size="small">当前</Tag>}
             </Space>
           ),
           onClick: () => m.org_id !== currentOrgId && handleSwitch(m.org_id)
         }))
       }}>
         <Button>
           <Space>
             <BuildingOutlined />
             {memberships?.find(m => m.org_id === currentOrgId)?.display_name}
           </Space>
         </Button>
       </Dropdown>
     );
   };
   ```

---

## 3. 获取组织详情

### 请求

```http
GET /api/v1/organizations/:id
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface OrganizationDetailResponse {
  code: number;
  message: string;
  data: OrganizationDetail;
}

interface OrganizationDetail extends Organization {
  // 包含 Organization 所有字段
  // 额外添加：
  owner_name?: string;
  members?: MemberInfo[];
  recent_activity?: Activity[];
}

interface Activity {
  id: string;
  type: 'execution' | 'benchmark_created' | 'member_joined';
  user_id: string;
  user_name: string;
  description: string;
  created_at: string;
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 400001 | 400 | 组织 ID 必填 |
| 401001 | 401 | 未认证 |
| 403002 | 403 | 非组织成员 |
| 404001 | 404 | 组织不存在 |

---

## 4. 更新组织信息

### 请求

```http
PUT /api/v1/organizations/:id
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| display_name | string | 否 | 显示名称 |
| description | string | 否 | 描述 |
| logo_url | string | 否 | Logo URL |

```typescript
interface UpdateOrganizationRequest {
  display_name?: string;
  description?: string;
  logo_url?: string;
}
```

### 响应

**成功响应（200）：**

```typescript
interface UpdateOrganizationResponse {
  code: number;
  message: string;
  data: Organization;
}
```

---

## 5. 删除组织

### 请求

```http
DELETE /api/v1/organizations/:id
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "organization deleted successfully"
  }
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 403001 | 403 | 只有所有者可以删除组织 |
| 404001 | 404 | 组织不存在 |

### 使用场景

1. **危险操作确认**
   ```tsx
   const DeleteOrganizationButton = ({ orgId, orgName }: { orgId: string; orgName: string }) => {
     const handleDelete = () => {
       Modal.confirm({
         title: '删除组织',
         icon: <ExclamationCircleOutlined />,
         content: (
           <div>
             <p>确定要删除组织 <strong>{orgName}</strong> 吗？</p>
             <Alert
               type="warning"
               message="此操作不可恢复，所有数据将被永久删除"
               style={{ marginTop: 16 }}
             />
             <p style={{ marginTop: 16 }}>请输入组织名称以确认删除：</p>
             <Input placeholder={orgName} id="confirm-delete-input" />
           </div>
         ),
         okText: '删除',
         okType: 'danger',
         onOk: async () => {
           const input = document.getElementById('confirm-delete-input') as HTMLInputElement;
           if (input.value !== orgName) {
             message.error('组织名称不匹配');
             return Promise.reject();
           }
           try {
             await api.delete(`/organizations/${orgId}`);
             message.success('组织已删除');
             window.location.href = '/organizations';
           } catch (error) {
             message.error('删除失败');
             return Promise.reject();
           }
         }
       });
     };

     return <Button danger onClick={handleDelete}>删除组织</Button>;
   };
   ```

---

## 6. 更新组织设置

### 请求

```http
PUT /api/v1/organizations/:id/settings
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| max_members | number | 否 | 最大成员数 |
| max_executions_per_day | number | 否 | 每日最大执行次数 |
| max_storage_gb | number | 否 | 最大存储（GB） |
| default_role | MemberRole | 否 | 新成员默认角色 |
| allow_signup | boolean | 否 | 是否允许公开注册 |
| require_approval | boolean | 否 | 加入是否需要审批 |

```typescript
interface UpdateSettingsRequest {
  max_members?: number;
  max_executions_per_day?: number;
  max_storage_gb?: number;
  default_role?: MemberRole;
  allow_signup?: boolean;
  require_approval?: boolean;
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "settings updated successfully"
  }
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 403001 | 403 | 只有管理员可以更新设置 |

---

## 7. 获取组织配额

### 请求

```http
GET /api/v1/organizations/:id/quota
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface QuotaInfoResponse {
  code: number;
  message: string;
  data: QuotaInfo;
}

interface QuotaInfo {
  // 成员配额
  max_members: number;
  current_members: number;
  members_usage_percentage: number;

  // 执行配额
  max_executions_per_day: number;
  today_executions: number;
  executions_usage_percentage: number;

  // 存储配额
  max_storage_gb: number;
  used_storage_gb: number;
  storage_usage_percentage: number;

  // 总体状态
  overall_usage_percentage: number;
  near_limit: boolean;
  quota_exceeded: boolean;
}
```

### 使用场景

1. **配额展示卡片**
   ```tsx
   const QuotaDisplay = ({ orgId }: { orgId: string }) => {
     const { data: quota } = useRequest(() => api.get(`/organizations/${orgId}/quota`));

     if (!quota) return null;

     return (
       <Row gutter={16}>
         <Col span={8}>
           <Card>
             <Statistic
               title="成员使用"
               value={quota.current_members}
               suffix={`/ ${quota.max_members}`}
               description={
                 <Progress
                   percent={quota.members_usage_percentage}
                   status={quota.members_usage_percentage > 90 ? 'exception' : 'active'}
                   size="small"
                 />
               }
             />
           </Card>
         </Col>
         <Col span={8}>
           <Card>
             <Statistic
               title="今日执行"
               value={quota.today_executions}
               suffix={`/ ${quota.max_executions_per_day}`}
               description={
                 <Progress
                   percent={quota.executions_usage_percentage}
                   status={quota.executions_usage_percentage > 90 ? 'exception' : 'active'}
                   size="small"
                 />
               }
             />
           </Card>
         </Col>
         <Col span={8}>
           <Card>
             <Statistic
               title="存储使用"
               value={quota.used_storage_gb}
               precision={2}
               suffix={`/ ${quota.max_storage_gb} GB`}
               description={
                 <Progress
                   percent={quota.storage_usage_percentage}
                   status={quota.storage_usage_percentage > 90 ? 'exception' : 'active'}
                   size="small"
                 />
               }
             />
           </Card>
         </Col>
       </Row>
     );
   };
   ```

---

## 8. 获取成员列表

### 请求

```http
GET /api/v1/organizations/:id/members?role=admin&query=john&page=1&page_size=20
Authorization: Bearer {access_token}
```

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| role | string | - | 角色筛选 |
| query | string | - | 用户名/邮箱搜索 |
| page | int | 1 | 页码 |
| page_size | int | 20 | 每页数量 |

### 响应

```typescript
interface ListMembersResponse {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    data: MemberInfo[];
  };
}

interface MemberInfo {
  id: string;
  user_id: string;
  username: string;
  email: string;
  avatar: string;
  role: MemberRole;
  invited_by: string;
  invited_by_name?: string;
  joined_at: string;
  is_owner: boolean;
  last_active_at?: string;
}
```

---

## 9. 更新成员角色

### 请求

```http
PUT /api/v1/organizations/:id/members/:user_id/role
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| role | MemberRole | 是 | 新角色 |

```typescript
interface UpdateMemberRoleRequest {
  role: MemberRole;
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "member role updated successfully"
  }
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 400001 | 400 | 不能修改所有者角色 |
| 403001 | 403 | 无权限或不是管理员 |
| 404002 | 404 | 成员不存在 |

### 使用场景

1. **角色选择器**
   ```tsx
   const MemberRoleSelect = ({ orgId, userId, currentRole }: Props) => {
     const [loading, setLoading] = useState(false);

     const handleChange = async (newRole: MemberRole) => {
       if (newRole === currentRole) return;

       setLoading(true);
       try {
         await api.put(`/organizations/${orgId}/members/${userId}/role`, { role: newRole });
         message.success('角色已更新');
       } catch (error) {
         message.error('更新失败');
       } finally {
         setLoading(false);
       }
     };

     return (
       <Select
         value={currentRole}
         onChange={handleChange}
         loading={loading}
         disabled={currentRole === 'owner'}
         style={{ width: 120 }}
       >
         <Select.Option value="admin">
           <Space><Badge status="gold" />管理员</Space>
         </Select.Option>
         <Select.Option value="member">
           <Space><Badge status="blue" />成员</Space>
         </Select.Option>
         <Select.Option value="guest">
           <Space><Badge status="default" />访客</Space>
         </Select.Option>
       </Select>
     );
   };
   ```

---

## 10. 移除成员

### 请求

```http
DELETE /api/v1/organizations/:id/members/:user_id
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "member removed successfully"
  }
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 400001 | 400 | 不能移除组织所有者 |
| 403001 | 403 | 无权限 |
| 404002 | 404 | 成员不存在 |

---

## 11. 邀请成员

### 请求

```http
POST /api/v1/organizations/:id/invitations
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| emails | string[] | 是 | 邮箱列表 |
| role | MemberRole | 否 | 角色（默认 member） |
| expires_in_hours | number | 否 | 过期时间（小时，默认 48） |

```typescript
interface InviteMembersRequest {
  emails: string[];
  role?: MemberRole;
  expires_in_hours?: number;
}
```

### 响应

```typescript
interface InvitationResponse {
  code: number;
  message: string;
  data: {
    invitations: Invitation[];
    already_members: string[];
    already_invited: string[];
  };
}

interface Invitation {
  id: string;
  org_id: string;
  org_name: string;
  email: string;
  role: MemberRole;
  invite_code: string;
  invite_url: string;
  expires_at: string;
  created_at: string;
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 400003 | 400 | 成员配额已超 |
| 409001 | 409 | 用户已是成员 |
| 409002 | 409 | 邀请已存在 |
| 403001 | 403 | 无权限（需要管理员） |

### 使用场景

1. **批量邀请成员**
   ```tsx
   const InviteMembersModal = ({ orgId, visible, onCancel }: Props) => {
     const [emails, setEmails] = useState<string[]>([]);
     const [role, setRole] = useState<MemberRole>('member');
     const [inviting, setInviting] = useState(false);

     const handleInvite = async () => {
       setInviting(true);
       try {
         const { data } = await api.post(`/organizations/${orgId}/invitations`, {
           emails,
           role
         });

         if (data.already_members.length > 0) {
           message.warning(`以下用户已是成员: ${data.already_members.join(', ')}`);
         }
         if (data.already_invited.length > 0) {
           message.info(`以下用户已受邀: ${data.already_invited.join(', ')}`);
         }
         if (data.invitations.length > 0) {
           message.success(`已发送 ${data.invitations.length} 封邀请邮件`);
           setEmails([]);
           onCancel?.();
         }
       } catch (error) {
         if (error.code === 400003) {
           message.error('成员配额已达上限');
         }
       } finally {
         setInviting(false);
       }
     };

     return (
       <Modal
         title="邀请新成员"
         open={visible}
         onCancel={onCancel}
         onOk={handleInvite}
         confirmLoading={inviting}
       >
         <Form layout="vertical">
           <Form.Item label="邮箱地址">
             <Select
               mode="tags"
               placeholder="输入邮箱，按回车添加"
               value={emails}
               onChange={setEmails}
               options={emails.map(e => ({ label: e, value: e }))}
               tokenSeparators={[',', ' ']}
             />
           </Form.Item>

           <Form.Item label="默认角色">
             <Select value={role} onChange={setRole}>
               <Select.Option value="admin">管理员</Select.Option>
               <Select.Option value="member">成员</Select.Option>
               <Select.Option value="guest">访客</Select.Option>
             </Select>
           </Form.Item>
         </Form>
       </Modal>
     );
   };
   ```

---

## 12. 列出邀请

### 请求

```http
GET /api/v1/organizations/:id/invitations
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface InvitationsResponse {
  code: number;
  message: string;
  data: Invitation[];
}
```

---

## 13. 取消邀请

### 请求

```http
DELETE /api/v1/organizations/:id/invitations/:invitation_id
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "invitation cancelled successfully"
  }
}
```

---

## 14. 重新发送邀请

### 请求

```http
POST /api/v1/organizations/:id/invitations/:invitation_id/resend
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| expires_in_hours | number | 否 | 新的过期时间（小时） |

```typescript
interface ResendInvitationRequest {
  expires_in_hours?: number;
}
```

### 响应

```typescript
interface InvitationResponse {
  code: number;
  message: string;
  data: Invitation;
}
```

---

## 15. 通过邀请码加入组织

### 请求

```http
POST /api/v1/organizations/:id/join
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| invite_code | string | 是 | 邀请码 |

```typescript
interface JoinOrganizationRequest {
  invite_code: string;
}
```

### 响应

```typescript
interface MemberResponse {
  code: number;
  message: string;
  data: Member;
}

interface Member {
  id: string;
  org_id: string;
  user_id: string;
  role: MemberRole;
  invited_by: string;
  joined_at: string;
}
```

---

## 16. 切换当前组织

### 请求

```http
POST /api/v1/user/current-organization
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| org_id | string | 是 | 组织 ID |

```typescript
interface SwitchOrganizationRequest {
  org_id: string;
}
```

### 响应

**成功响应（200）：**

```typescript
interface SwitchOrganizationResponse {
  code: number;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    user: UserInfo;
    organization: Organization;
  };
}
```

### 使用场景

1. **切换组织流程**
   ```typescript
   const switchOrganization = async (orgId: string) => {
     try {
       // 1. 调用切换接口
       const response = await api.post('/user/current-organization', { org_id: orgId });

       // 2. 更新本地存储的 token
       localStorage.setItem('access_token', response.data.access_token);
       localStorage.setItem('refresh_token', response.data.refresh_token);

       // 3. 更新全局状态
       authStore.setUserInfo(response.data.user);
       organizationStore.setCurrentOrganization(response.data.organization);

       // 4. 刷新页面以更新组织上下文
       window.location.reload();
     } catch (error) {
       message.error('切换组织失败');
     }
   };
   ```

---

## 17. 列出组织模板

### 请求

```http
GET /api/v1/org-templates
Authorization: Bearer {access_token}
```

### 响应

```typescript
interface OrgTemplatesResponse {
  code: number;
  message: string;
  data: OrgTemplate[];
}

interface OrgTemplate {
  id: string;
  name: string;
  display_name: string;
  description: string;
  // 设置
  max_members: number;
  max_executions_per_day: number;
  max_storage_gb: number;
  default_role: MemberRole;
  allow_signup: boolean;
  require_approval: boolean;
  // 模板信息
  is_system: boolean;
  is_public: boolean;
  category: TemplateCategory;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

type TemplateCategory = 'small' | 'medium' | 'large' | 'startup' | 'enterprise';
```

---

## 18. 基于模板创建组织

### 请求

```http
POST /api/v1/org-templates/:template_id/create-org
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

```typescript
interface CreateOrganizationFromTemplateRequest {
  name: string;
  display_name?: string;
  description?: string;
}
```

### 响应

```typescript
interface CreateOrganizationResponse {
  code: number;
  message: string;
  data: Organization;
}
```

---

## TypeScript 类型定义

```typescript
// src/types/api/organization.ts

export type MemberRole = 'owner' | 'admin' | 'member' | 'guest';
export type OrgStatus = 'active' | 'inactive' | 'suspended';
export type TemplateCategory = 'small' | 'medium' | 'large' | 'startup' | 'enterprise';

export interface Organization {
  id: string;
  name: string;
  display_name: string;
  description: string;
  logo_url: string;
  owner_id: string;
  max_members: number;
  max_executions_per_day: number;
  max_storage_gb: number;
  default_role: MemberRole;
  allow_signup: boolean;
  require_approval: boolean;
  status: OrgStatus;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface OrganizationDetail extends Organization {
  owner_name?: string;
  members?: MemberInfo[];
  recent_activity?: Activity[];
}

export interface Activity {
  id: string;
  type: 'execution' | 'benchmark_created' | 'member_joined';
  user_id: string;
  user_name: string;
  description: string;
  created_at: string;
}

export interface Membership {
  org_id: string;
  org_name: string;
  display_name: string;
  logo_url?: string;
  role: MemberRole;
  member_count: number;
  joined_at: string;
  is_owner: boolean;
  is_default: boolean;
}

export interface QuotaInfo {
  max_members: number;
  current_members: number;
  members_usage_percentage: number;
  max_executions_per_day: number;
  today_executions: number;
  executions_usage_percentage: number;
  max_storage_gb: number;
  used_storage_gb: number;
  storage_usage_percentage: number;
  overall_usage_percentage: number;
  near_limit: boolean;
  quota_exceeded: boolean;
}

export interface MemberInfo {
  id: string;
  user_id: string;
  username: string;
  email: string;
  avatar: string;
  role: MemberRole;
  invited_by: string;
  invited_by_name?: string;
  joined_at: string;
  is_owner: boolean;
  last_active_at?: string;
}

export interface Invitation {
  id: string;
  org_id: string;
  org_name: string;
  email: string;
  role: MemberRole;
  invite_code: string;
  invite_url: string;
  expires_at: string;
  created_at: string;
}

export interface OrgTemplate {
  id: string;
  name: string;
  display_name: string;
  description: string;
  max_members: number;
  max_executions_per_day: number;
  max_storage_gb: number;
  default_role: MemberRole;
  allow_signup: boolean;
  require_approval: boolean;
  is_system: boolean;
  is_public: boolean;
  category: TemplateCategory;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  org_id: string;
  user_id: string;
  role: MemberRole;
  invited_by: string;
  joined_at: string;
}

export interface CreateOrganizationRequest {
  name: string;
  display_name?: string;
  description?: string;
  logo_url?: string;
}

export interface UpdateOrganizationRequest {
  display_name?: string;
  description?: string;
  logo_url?: string;
}

export interface UpdateSettingsRequest {
  max_members?: number;
  max_executions_per_day?: number;
  max_storage_gb?: number;
  default_role?: MemberRole;
  allow_signup?: boolean;
  require_approval?: boolean;
}

export interface UpdateMemberRoleRequest {
  role: MemberRole;
}

export interface InviteMembersRequest {
  emails: string[];
  role?: MemberRole;
  expires_in_hours?: number;
}

export interface JoinOrganizationRequest {
  invite_code: string;
}

export interface ResendInvitationRequest {
  expires_in_hours?: number;
}

export interface SwitchOrganizationRequest {
  org_id: string;
}

export interface CreateOrganizationFromTemplateRequest {
  name: string;
  display_name?: string;
  description?: string;
}

export interface MemberFilter {
  role?: MemberRole;
  query?: string;
  page?: number;
  page_size?: number;
}

// 错误码
export const OrganizationErrorCode = {
  INVALID_PARAMS: 400001,
  NAME_EXISTS: 400002,
  QUOTA_EXCEEDED: 400003,
  NOT_AUTHENTICATED: 401001,
  NO_PERMISSION: 403001,
  NOT_MEMBER: 403002,
  NOT_FOUND: 404001,
  MEMBER_NOT_FOUND: 404002,
  INVITATION_NOT_FOUND: 404003,
  ALREADY_MEMBER: 409001,
  INVITATION_EXISTS: 409002,
} as const;

// 辅助函数
export const getRoleColor = (role: MemberRole): string => {
  const colors: Record<MemberRole, string> = {
    owner: 'gold',
    admin: 'blue',
    member: 'green',
    guest: 'default',
  };
  return colors[role];
};

export const getRoleLabel = (role: MemberRole): string => {
  const labels: Record<MemberRole, string> = {
    owner: '所有者',
    admin: '管理员',
    member: '成员',
    guest: '访客',
  };
  return labels[role];
};

export const getStatusBadge = (status: OrgStatus) => {
  const config: Record<OrgStatus, { status: 'success' | 'warning' | 'error'; text: string }> = {
    active: { status: 'success', text: '活跃' },
    inactive: { status: 'warning', text: '未激活' },
    suspended: { status: 'error', text: '已暂停' },
  };
  return config[status];
};
```
