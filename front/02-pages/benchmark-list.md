# Benchmark 列表页

## 页面概览

- **路由**: `/benchmarks`
- **所需权限**: 已登录用户
- **关联场景**: [Benchmark 管理](../01-scenarios/benchmark-management.md)

---

## 页面状态

```typescript
interface BenchmarkListState {
  // 数据
  benchmarks: Benchmark[]
  total: number

  // 筛选
  filters: {
    name_like: string
    type: BenchmarkType[]
    language: string
    difficulty: DifficultyLevel[]
    category: string
    status: BenchmarkStatus[]
    tags: string[]
  }

  // 分页
  pagination: {
    page: number
    page_size: number
  }

  // 排序
  sorter: {
    field: string
    order: 'ascend' | 'descend'
  }

  // UI 状态
  loading: boolean
  selectedRowKeys: string[]
}
```

## 组件结构

```
BenchmarkListPage
├── PageHeader
│   ├── Title ("Benchmark 列表")
│   └── Actions
│       ├── "新建 Benchmark" 按钮
│       └── "导入数据集" 按钮
├── FilterBar
│   ├── 搜索框 (name_like)
│   ├── 类型筛选 (type)
│   ├── 语言筛选 (language)
│   ├── 难度筛选 (difficulty)
│   ├── 状态筛选 (status)
│   ├── 标签筛选 (tags)
│   └── "重置" 按钮
├── BenchmarkTable
│   ├── columns (见下表)
│   ├── rowSelection
│   └── pagination
└── BatchActions (选中时显示)
    ├── "批量导出"
    └── "批量删除"
```

## 表格列定义

| 列名 | 字段 | 渲染 | 说明 |
|------|------|------|------|
| 选择 | - | Checkbox | 多选 |
| 名称 | display_name | Link | 点击跳转详情 |
| ID | name | Text | 灰色小字 |
| 类型 | type | Tag | 不同类型不同颜色 |
| 语言 | language | Tag | |
| 难度 | difficulty | Tag | easy=green, hard=red |
| 状态 | status | Badge | draft=灰, active=绿 |
| 创建时间 | created_at | 相对时间 | "2 小时前" |
| 操作 | - | ActionButtons | 查看/编辑/删除 |

## API 调用

```typescript
// GET /api/v1/benchmarks
const fetchBenchmarks = async (params: {
  page: number
  page_size: number
  name_like?: string
  type?: string[]
  language?: string
  difficulty?: string[]
  category?: string
  status?: string[]
  tags?: string[]
  order_by?: string
  order_dir?: 'asc' | 'desc'
}): Promise<PaginatedResponse<Benchmark>> => {
  const res = await api.get('/benchmarks', { params })
  return res.data
}
```

## 事件处理

### onSearch

防抖 300ms 后执行搜索，重置 page=1

### onFilterChange

```typescript
const onFilterChange = (newFilters: Partial<typeof filters>) => {
  setFilters({ ...filters, ...newFilters })
  setPagination({ ...pagination, page: 1 })
}
```

### onTableChange

```typescript
const onTableChange = (pagination, filters, sorter) => {
  setPagination({
    page: pagination.current,
    page_size: pagination.pageSize
  })
  if (sorter.field) {
    setSorter({
      field: sorter.field,
      order: sorter.order
    })
  }
}
```

### onDelete

```typescript
const onDelete = (id: string) => {
  Modal.confirm({
    title: '确认删除',
    content: '确定要删除这个 Benchmark 吗？',
    onOk: async () => {
      await api.delete(`/benchmarks/${id}`)
      message.success('删除成功')
      fetchBenchmarks() // 刷新列表
    }
  })
}
```

### onBatchDelete

```typescript
const onBatchDelete = async () => {
  if (selectedRowKeys.length === 0) return

  Modal.confirm({
    title: '批量删除',
    content: `确定要删除选中的 ${selectedRowKeys.length} 个 Benchmark 吗？`,
    onOk: async () => {
      await Promise.all(
        selectedRowKeys.map(id => api.delete(`/benchmarks/${id}`))
      )
      message.success(`成功删除 ${selectedRowKeys.length} 个 Benchmark`)
      setSelectedRowKeys([])
      fetchBenchmarks()
    }
  })
}
```

## URL 同步

```typescript
// 将筛选状态同步到 URL
useEffect(() => {
  const params = new URLSearchParams()
  if (filters.name_like) params.set('search', filters.name_like)
  if (filters.type?.length) params.set('type', filters.type.join(','))
  if (filters.language) params.set('language', filters.language)
  params.set('page', String(pagination.page))

  // 不改变 history，只替换 URL
  navigate({ search: params.toString() }, { replace: true })
}, [filters, pagination])
```
