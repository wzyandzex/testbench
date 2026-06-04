# 通用类型定义

```typescript
// src/types/common.ts

/**
 * 实体状态
 */
export type EntityStatus =
  | 'pending'     // 等待中
  | 'active'      // 活跃
  | 'inactive'    // 非活跃
  | 'archived'    // 已归档
  | 'deleted'     // 已删除

/**
 * 优先级
 */
export type Priority = 'p0' | 'p1' | 'p2' | 'p3' | 'p4'

/**
 * 可见性
 */
export type Visibility = 'public' | 'private' | 'organization'

/**
 * 用户角色
 */
export type UserRole = 'admin' | 'user' | 'viewer'

/**
 * 组织角色
 */
export type OrgRole = 'owner' | 'admin' | 'member' | 'viewer'

/**
 * 审核/审批状态
 */
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

/**
 * Id 类型
 */
export type ID = string

/**
 * 时间戳
 */
export type Timestamp = string  // ISO 8601 格式

/**
 * Unix 时间戳（毫秒）
 */
export type UnixMillis = number

/**
 * Unix 时间戳（纳秒）
 */
export type UnixNanos = number
```

---

## 分页类型

```typescript
// src/types/pagination.ts

/**
 * 分页参数
 */
export interface PaginationParams {
  page?: number         // 页码，从 1 开始
  page_size?: number    // 每页数量
}

/**
 * 分页响应
 */
export interface PaginationResponse<T> {
  total: number        // 总记录数
  page: number         // 当前页
  size: number         // 每页数量
  data: T[]            // 数据列表
}

/**
 * 排序参数
 */
export interface SortParams {
  order_by?: string    // 排序字段
  order_dir?: 'asc' | 'desc'  // 排序方向
}
```

---

## 筛选类型

```typescript
// src/types/filter.ts

/**
 * 日期范围筛选
 */
export interface DateRangeFilter {
  start_date?: string  // ISO 8601
  end_date?: string    // ISO 8601
}

/**
 * 状态筛选
 */
export interface StatusFilter<T extends string> {
  status?: T[]
}

/**
 * ID 列表筛选
 */
export interface IdsFilter {
  ids?: string[]
}

/**
 * 模糊搜索筛选
 */
export interface SearchFilter {
  search?: string      // 搜索关键词
  name_like?: string   // 名称模糊匹配
}

/**
 * 组合筛选参数
 */
export interface FilterParams
  extends PaginationParams,
    SortParams,
    DateRangeFilter,
    SearchFilter {}
```

---

## 表单类型

```typescript
// src/types/form.ts

/**
 * 表单字段规则
 */
export interface FormRule {
  required?: boolean
  message?: string
  min?: number
  max?: number
  pattern?: RegExp
  validator?: (rule: any, value: any) => Promise<void> | void
}

/**
 * 表单字段
 */
export interface FormField<T = any> {
  name: string
  label?: string
  value?: T
  rules?: FormRule[]
  placeholder?: string
  disabled?: boolean
  hidden?: boolean
}

/**
 * 表单状态
 */
export interface FormState<T = any> {
  values: T
  errors: Record<keyof T, string | undefined>
  touched: Record<keyof T, boolean>
  submitting: boolean
}
```

---

## UI 类型

```typescript
// src/types/ui.ts

/**
 * 菜单项
 */
export interface MenuItem {
  key: string
  label: string
  icon?: string
  path?: string
  children?: MenuItem[]
  disabled?: boolean
  hidden?: boolean
}

/**
 * 面包屑项
 */
export interface BreadcrumbItem {
  title: string
  path?: string
}

/**
 * 标签页
 */
export interface TabItem {
  key: string
  label: string
  content: React.ReactNode
  closable?: boolean
}

/**
 * 通知类型
 */
export type NotificationType = 'success' | 'info' | 'warning' | 'error'

/**
 * 通知数据
 */
export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  link?: string
  read: boolean
  created_at: string
}
```

---

## Hook 类型

```typescript
// src/types/hooks.ts

/**
 * 异步操作状态
 */
export interface AsyncState<T> {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * 请求 Hook 返回值
 */
export interface RequestResult<T> {
  data: T | null
  loading: boolean
  error: string | null
  execute: (...args: any[]) => Promise<T>
  reset: () => void
}

/**
 * 分页 Hook 返回值
 */
export interface PaginationResult {
  page: number
  pageSize: number
  total: number
  onChange: (page: number, pageSize: number) => void
}
```

---

## 组件 Props 类型

```typescript
// src/types/components.ts

/**
 * 表格列定义
 */
export interface TableColumn {
  key: string
  title: string
  dataIndex?: string
  width?: number
  align?: 'left' | 'center' | 'right'
  fixed?: 'left' | 'right'
  sortable?: boolean
  filterable?: boolean
  render?: (value: any, record: any) => React.ReactNode
}

/**
 * 选择器选项
 */
export interface SelectOption<T = any> {
  label: string
  value: T
  disabled?: boolean
}

/**
 * 步骤条项
 */
export interface StepItem {
  title: string
  description?: string
  status?: 'wait' | 'process' | 'finish' | 'error'
  icon?: React.ReactNode
}
```
