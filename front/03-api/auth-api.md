# 认证接口

## 基础信息

| 项目 | 值 |
|------|------|
| 基础路径 | `/api/v1/auth` |
| 需要认证 | 部分（登录/注册/刷新/密码重置公开） |
| 内容类型 | `application/json` |

## 错误码

| 错误码 | HTTP状态码 | 说明 |
|--------|-----------|------|
| 400001 | 400 | 用户名已存在 |
| 400002 | 400 | 邮箱已存在 |
| 401002 | 401 | 用户名或密码错误 |
| 401003 | 401 | 刷新令牌已过期 |
| 401004 | 401 | 刷新令牌已撤销 |
| 403001 | 403 | 用户账户已被锁定 |
| 403002 | 403 | 用户账户未激活 |
| 429001 | 429 | 登录尝试过多，请稍后再试 |
| 501 | 501 | 邮件服务不可用 |

---

## 接口列表

| 方法 | 端点 | 需要认证 | 说明 |
|------|------|---------|------|
| POST | `/auth/login` | 否 | 用户登录 |
| POST | `/auth/register` | 否 | 用户注册（仅管理员） |
| POST | `/auth/refresh` | 否 | 刷新令牌 |
| POST | `/auth/logout` | 是 | 用户登出 |
| GET | `/auth/me` | 是 | 获取当前用户信息 |
| PUT | `/auth/password` | 是 | 修改密码 |
| POST | `/auth/password/reset` | 否 | 发送密码重置邮件 |
| POST | `/auth/password/reset/confirm` | 否 | 重置密码 |
| POST | `/auth/email/verify` | 是 | 发送邮箱验证（修改邮箱） |
| POST | `/auth/email/verify/confirm` | 否 | 验证邮箱变更 |
| POST | `/auth/avatar` | 是 | 上传头像 |
| POST | `/auth/delete` | 是 | 注销账户 |
| GET | `/admin/users` | 是 | 获取用户列表（仅管理员） |
| POST | `/admin/users/{id}/lock` | 是 | 锁定用户（仅管理员） |
| POST | `/admin/users/{id}/unlock` | 是 | 解锁用户（仅管理员） |
| PUT | `/admin/users/{id}/role` | 是 | 更新用户角色（仅管理员） |

---

## 用户角色枚举

| 值 | 权限 |
|----|------|
| `admin` | 管理员：完全权限，可管理用户和系统 |
| `user` | 普通用户：正常使用权限 |
| `viewer` | 查看者：只读权限 |

---

## 1. 用户登录

### 请求

```http
POST /api/v1/auth/login
Content-Type: application/json
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名 |
| password | string | 是 | 密码 |

```typescript
interface LoginRequest {
  username: string;
  password: string;
}
```

### 响应

**成功响应（200）：**

```typescript
interface LoginResponse {
  code: number;
  message: string;
  data: {
    access_token: string;   // 访问令牌（通常 15 分钟有效）
    refresh_token: string;  // 刷新令牌（通常 7 天有效）
    expires_in: number;     // 访问令牌过期时间（秒）
    token_type: string;     // 令牌类型，通常为 "Bearer"
    user: UserInfo;
  };
}

interface UserInfo {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  avatar: string;
  current_org_id?: string;  // 当前组织 ID
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 401002 | 401 | 用户名或密码错误 |
| 403001 | 403 | 用户账户已被锁定 |
| 403002 | 403 | 用户账户未激活 |
| 429001 | 429 | 登录尝试过多，请稍后再试 |

### 使用场景

1. **登录表单提交**
   - 用户输入用户名和密码
   - 前端验证输入非空
   - 调用登录接口
   - 成功后存储 token 到 localStorage
   - 更新全局状态（用户信息、已登录状态）
   - 跳转到首页或原访问页面

2. **Token 存储**
   ```typescript
   // 存储到 localStorage
   localStorage.setItem('access_token', data.access_token);
   localStorage.setItem('refresh_token', data.refresh_token);
   localStorage.setItem('token_expires_at', String(Date.now() + data.expires_in * 1000));
   ```

3. **Token 自动刷新**
   - 在 axios 拦截器中检查 token 过期时间
   - 快过期时（如剩余 5 分钟）自动刷新
   - 使用 refresh_token 获取新的 access_token

---

## 2. 用户注册（仅管理员）

### 请求

```http
POST /api/v1/auth/register
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| username | string | 是 | 用户名（3-50字符，字母数字下划线） |
| email | string | 是 | 邮箱地址 |
| password | string | 是 | 密码（最少8字符，需包含大小写字母和数字） |

```typescript
interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}
```

### 响应

**成功响应（200）：**

```typescript
interface RegisterResponse {
  code: number;
  message: string;
  data: UserInfo;
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 400001 | 400 | 用户名已存在 |
| 400002 | 400 | 邮箱已存在 |
| 403001 | 403 | 无权限（仅管理员可注册） |

### 使用场景

1. **管理员创建用户**
   - 管理员在用户管理页面点击"添加用户"
   - 填写用户信息表单
   - 前端验证格式后提交
   - 成功后更新用户列表

2. **表单验证规则**
   ```typescript
   const validateUsername = (username: string) => {
     if (username.length < 3 || username.length > 50) return false;
     return /^[a-zA-Z0-9_]+$/.test(username);
   };

   const validatePassword = (password: string) => {
     if (password.length < 8) return false;
     return /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password);
   };
   ```

---

## 3. 刷新令牌

### 请求

```http
POST /api/v1/auth/refresh
Content-Type: application/json
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| refresh_token | string | 是 | 刷新令牌 |

```typescript
interface RefreshTokenRequest {
  refresh_token: string;
}
```

### 响应

**成功响应（200）：**

```typescript
interface RefreshTokenResponse {
  code: number;
  message: string;
  data: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    token_type: string;
    user: UserInfo;
  };
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 401003 | 401 | 刷新令牌已过期，请重新登录 |
| 401004 | 401 | 刷新令牌已撤销，请重新登录 |

### 使用场景

1. **Token 自动刷新**
   ```typescript
   // 在 axios 响应拦截器中
   api.interceptors.response.use(
     (response) => response,
     async (error) => {
       if (error.response?.status === 401 && !error.config._retry) {
         error.config._retry = true;
         try {
           const refreshToken = localStorage.getItem('refresh_token');
           const { data } = await api.post('/auth/refresh', { refresh_token: refreshToken });
           localStorage.setItem('access_token', data.access_token);
           localStorage.setItem('refresh_token', data.refresh_token);
           error.config.headers.Authorization = `Bearer ${data.access_token}`;
           return axios(error.config);
         } catch {
           // 刷新失败，跳转登录页
           localStorage.clear();
           window.location.href = '/login';
         }
       }
       return Promise.reject(error);
     }
   );
   ```

2. **定时刷新策略**
   ```typescript
   // 在应用启动时设置定时器
   useEffect(() => {
     const checkAndRefreshToken = async () => {
       const expiresAt = parseInt(localStorage.getItem('token_expires_at') || '0');
       const now = Date.now();
       // 提前 5 分钟刷新
       if (expiresAt - now < 5 * 60 * 1000) {
         await refreshAccessToken();
       }
     };

     const interval = setInterval(checkAndRefreshToken, 60000); // 每分钟检查
     return () => clearInterval(interval);
   }, []);
   ```

---

## 4. 用户登出

### 请求

```http
POST /api/v1/auth/logout
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| refresh_token | string | 是 | 要撤销的刷新令牌 |
| all_devices | boolean | 否 | 是否撤销所有设备的令牌（默认 false） |

```typescript
interface LogoutRequest {
  refresh_token: string;
  all_devices?: boolean;
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "logged out successfully"
  }
}
```

### 使用场景

1. **用户主动登出**
   ```typescript
   const handleLogout = async () => {
     try {
       const refreshToken = localStorage.getItem('refresh_token');
       await api.post('/auth/logout', { refresh_token: refreshToken });
     } catch (error) {
       console.error('Logout failed:', error);
     } finally {
       // 无论接口是否成功，都清除本地状态
       localStorage.clear();
       authStore.logout();
       navigate('/login');
     }
   };
   ```

2. **清除本地存储**
   ```typescript
   // 需要清除的项目
   localStorage.removeItem('access_token');
   localStorage.removeItem('refresh_token');
   localStorage.removeItem('token_expires_at');
   localStorage.removeItem('user_info');
   ```

---

## 5. 获取当前用户信息

### 请求

```http
GET /api/v1/auth/me
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

```typescript
interface UserInfoResponse {
  code: number;
  message: string;
  data: UserInfo;
}
```

### 使用场景

1. **应用启动时获取用户信息**
   ```typescript
   useEffect(() => {
     const fetchUserInfo = async () => {
       try {
         const userInfo = await api.get('/auth/me');
         authStore.setUserInfo(userInfo);
       } catch {
         // Token 无效，清除本地状态
         authStore.logout();
         navigate('/login');
       }
     };
     fetchUserInfo();
   }, []);
   ```

2. **页面权限验证**
   ```typescript
   const requireRole = (allowedRoles: string[]) => {
     const userInfo = authStore.userInfo;
     if (!userInfo || !allowedRoles.includes(userInfo.role)) {
       navigate('/403');
     }
   };
   ```

---

## 6. 修改密码

### 请求

```http
PUT /api/v1/auth/password
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| old_password | string | 是 | 旧密码 |
| new_password | string | 是 | 新密码（最少8字符） |

```typescript
interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "password changed successfully"
  }
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 401002 | 401 | 旧密码不正确 |

### 使用场景

1. **密码修改表单**
   ```tsx
   const [form] = Form.useForm();

   const handleChangePassword = async (values: ChangePasswordRequest) => {
     try {
       await api.put('/auth/password', values);
       message.success('密码修改成功');
       form.resetFields();
     } catch (error) {
       if (error.code === 401002) {
         message.error('旧密码不正确');
       }
     }
   };

   return (
     <Form form={form} onFinish={handleChangePassword}>
       <Form.Item name="old_password" label="旧密码" rules={[{ required: true }]}>
         <Input.Password />
       </Form.Item>
       <Form.Item
         name="new_password"
         label="新密码"
         rules={[
           { required: true },
           { min: 8, message: '密码至少8位' },
           { pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, message: '需包含大小写字母和数字' }
         ]}
       >
         <Input.Password />
       </Form.Item>
       <Form.Item
         name="confirm_password"
         label="确认新密码"
         dependencies={['new_password']}
         rules={[
           { required: true },
           ({ getFieldValue }) => ({
             validator(_, value) {
               if (!value || getFieldValue('new_password') === value) {
                 return Promise.resolve();
               }
               return Promise.reject(new Error('两次输入的密码不一致'));
             }
           })
         ]}
       >
         <Input.Password />
       </Form.Item>
     </Form>
   );
   ```

---

## 7. 发送密码重置邮件

### 请求

```http
POST /api/v1/auth/password/reset
Content-Type: application/json
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱地址 |

```typescript
interface SendPasswordResetRequest {
  email: string;
}
```

### 响应

无论邮箱是否存在，都返回相同响应（防止邮箱枚举攻击）：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "如果该邮箱已注册，您将收到密码重置邮件"
  }
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 501 | 501 | 邮件服务不可用 |

### 使用场景

1. **忘记密码流程**
   ```tsx
   const [email, setEmail] = useState('');
   const [submitted, setSubmitted] = useState(false);

   const handleSubmit = async () => {
     try {
       await api.post('/auth/password/reset', { email });
       setSubmitted(true);
       message.success('如果该邮箱已注册，您将收到密码重置邮件');
     } catch (error) {
       message.error('发送失败，请稍后重试');
     }
   };

   return submitted ? (
     <Alert message="重置邮件已发送，请查收邮箱" type="success" />
   ) : (
     <Form onFinish={handleSubmit}>
       <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email' }]}>
         <Input placeholder="请输入注册邮箱" />
       </Form.Item>
       <Button type="primary" htmlType="submit">发送重置邮件</Button>
     </Form>
   );
   ```

---

## 8. 重置密码

### 请求

```http
POST /api/v1/auth/password/reset/confirm
Content-Type: application/json
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| token_id | string | 是 | 重置令牌ID（从邮件链接中获取） |
| new_password | string | 是 | 新密码 |

```typescript
interface ResetPasswordRequest {
  token_id: string;
  new_password: string;
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "密码重置成功，请使用新密码登录"
  }
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 400 | 400 | 无效或已过期的重置链接 |

### 使用场景

1. **从邮件链接跳转**
   ```tsx
   // URL: /reset-password?token=xxx
   const ResetPasswordPage = () => {
     const [searchParams] = useSearchParams();
     const token_id = searchParams.get('token');

     const handleReset = async (values: { new_password: string }) => {
       try {
         await api.post('/auth/password/reset/confirm', {
           token_id,
           new_password: values.new_password
         });
         message.success('密码重置成功');
         navigate('/login');
       } catch (error) {
         message.error('重置链接已失效，请重新获取');
       }
     };

     return (
       <Form onFinish={handleReset}>
         <Form.Item name="new_password" label="新密码" rules={[{ required: true, min: 8 }]}>
           <Input.Password />
         </Form.Item>
         <Button type="primary" htmlType="submit">重置密码</Button>
       </Form>
     );
   };
   ```

---

## 9. 发送邮箱验证（修改邮箱）

### 请求

```http
POST /api/v1/auth/email/verify
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| new_email | string | 是 | 新邮箱地址 |

```typescript
interface SendEmailVerificationRequest {
  new_email: string;
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "验证邮件已发送到新邮箱"
  }
}
```

---

## 10. 验证邮箱变更

### 请求

```http
POST /api/v1/auth/email/verify/confirm
Content-Type: application/json
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| token_id | string | 是 | 验证令牌ID |

```typescript
interface VerifyEmailRequest {
  token_id: string;
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "邮箱验证成功",
    "new_email": "new@example.com"
  }
}
```

---

## 11. 上传头像

### 请求

```http
POST /api/v1/auth/avatar
Content-Type: multipart/form-data
Authorization: Bearer {access_token}
```

**表单字段：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| avatar_url | string | 否 | 头像 URL（推荐方式） |
| avatar | File | 否 | 头像文件（暂未实现） |

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "avatar_url": "https://example.com/avatar.jpg"
  }
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 501 | 501 | 直接文件上传暂未实现，请使用 avatar_url 字段 |

### 使用场景

1. **头像上传组件**
   ```tsx
   const AvatarUpload = () => {
     const [imageUrl, setImageUrl] = useState('');

     const handleUpload = async (url: string) => {
       try {
         const { data } = await api.post('/auth/avatar', { avatar_url: url });
         setImageUrl(data.avatar_url);
         authStore.updateUserInfo({ avatar: data.avatar_url });
         message.success('头像更新成功');
       } catch (error) {
         message.error('头像更新失败');
       }
     };

     return (
       <Upload
         listType="picture-card"
         showUploadList={false}
         beforeUpload={(file) => {
           // 先上传到对象存储，获取 URL
           uploadToOss(file).then(url => handleUpload(url));
           return false;
         }}
       >
         {imageUrl ? <img src={imageUrl} alt="avatar" /> : <UploadOutlined />}
       </Upload>
     );
   };
   ```

---

## 12. 注销账户

### 请求

```http
POST /api/v1/auth/delete
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| password | string | 是 | 确认密码 |
| confirm | boolean | 是 | 确认注销 |

```typescript
interface DeleteAccountRequest {
  password: string;
  confirm: boolean;
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "账户已成功注销，所有数据已被删除"
  }
}
```

**错误响应：**

| 错误码 | HTTP 状态码 | 说明 |
|--------|-----------|------|
| 403 | 403 | 密码验证失败 |
| 400 | 400 | 请确认账户删除 |

### 使用场景

1. **危险操作二次确认**
   ```tsx
   const DeleteAccount = () => {
     const [step, setStep] = useState(1);
     const [form] = Form.useForm();

     const handleDelete = async (values: DeleteAccountRequest) => {
       if (!values.confirm) {
         message.error('请确认账户删除');
         return;
       }
       try {
         await api.post('/auth/delete', values);
         message.success('账户已注销');
         localStorage.clear();
         navigate('/login');
       } catch (error) {
         if (error.code === 403) {
           message.error('密码错误');
         }
       }
     };

     return step === 1 ? (
       <Alert
         type="warning"
         message="危险操作"
         description="注销账户将删除所有数据且无法恢复"
         action={
           <Button danger onClick={() => setStep(2)}>继续</Button>
         }
       />
     ) : (
       <Form form={form} onFinish={handleDelete}>
         <Form.Item name="password" label="确认密码" rules={[{ required: true }]}>
           <Input.Password />
         </Form.Item>
         <Form.Item name="confirm" valuePropName="checked" rules={[{ required: true }]}>
           <Checkbox>我确认删除账户且无法恢复</Checkbox>
         </Form.Item>
         <Button danger htmlType="submit">确认注销</Button>
       </Form>
     );
   };
   ```

---

## 管理员接口

### 13. 获取用户列表（仅管理员）

### 请求

```http
GET /api/v1/admin/users?page=1&page_size=20&status=active&role=user
Authorization: Bearer {access_token}
```

**查询参数：**

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| page | int | 1 | 页码 |
| page_size | int | 20 | 每页数量（最大100） |
| status | string | - | 用户状态筛选 (active/inactive/locked) |
| role | string | - | 用户角色筛选 |
| query | string | - | 用户名/邮箱搜索 |

### 响应

```typescript
interface AdminUserInfo {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user' | 'viewer';
  avatar: string;
  status: 'active' | 'inactive' | 'locked';
  created_at: string;
  last_login_at?: string;
}

interface UserListResponse {
  code: number;
  message: string;
  data: {
    total: number;
    page: number;
    size: number;
    data: AdminUserInfo[];
  };
}
```

### 14. 锁定用户（仅管理员）

### 请求

```http
POST /api/v1/admin/users/{id}/lock
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "user locked successfully"
  }
}
```

### 15. 解锁用户（仅管理员）

### 请求

```http
POST /api/v1/admin/users/{id}/unlock
Authorization: Bearer {access_token}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "user unlocked successfully"
  }
}
```

### 16. 更新用户角色（仅管理员）

### 请求

```http
PUT /api/v1/admin/users/{id}/role
Content-Type: application/json
Authorization: Bearer {access_token}
```

**请求体：**

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| role | string | 是 | admin | user | viewer |

```typescript
interface UpdateRoleRequest {
  role: 'admin' | 'user' | 'viewer';
}
```

### 响应

**成功响应（200）：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "message": "user role updated successfully"
  }
}
```

---

## TypeScript 类型定义

```typescript
// src/types/api/auth.ts

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar: string;
  current_org_id?: string;
  created_at?: string;
  last_login_at?: string;
}

export type UserRole = 'admin' | 'user' | 'viewer';

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
  all_devices?: boolean;
}

export interface ChangePasswordRequest {
  old_password: string;
  new_password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface SendPasswordResetRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token_id: string;
  new_password: string;
}

export interface SendEmailVerificationRequest {
  new_email: string;
}

export interface VerifyEmailRequest {
  token_id: string;
}

export interface DeleteAccountRequest {
  password: string;
  confirm: boolean;
}

export interface UpdateAvatarRequest {
  avatar_url?: string;
}

export interface AdminUserInfo {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  avatar: string;
  status: UserStatus;
  created_at: string;
  last_login_at?: string;
}

export type UserStatus = 'active' | 'inactive' | 'locked';

export interface UpdateRoleRequest {
  role: UserRole;
}

export interface UserFilter {
  page?: number;
  page_size?: number;
  status?: UserStatus;
  role?: UserRole;
  query?: string;
}

// 错误码
export const AuthErrorCode = {
  USERNAME_EXISTS: 400001,
  EMAIL_EXISTS: 400002,
  INVALID_CREDENTIALS: 401002,
  REFRESH_TOKEN_EXPIRED: 401003,
  REFRESH_TOKEN_REVOKED: 401004,
  USER_LOCKED: 403001,
  USER_INACTIVE: 403002,
  RATE_LIMITED: 429001,
  EMAIL_SERVICE_UNAVAILABLE: 501,
} as const;
```
