export default {
  // 通用操作
  actions: {
    save: '保存',
    cancel: '取消',
    confirm: '确认',
    delete: '删除',
    edit: '编辑',
    create: '创建',
    update: '更新',
    submit: '提交',
    search: '搜索',
    filter: '筛选',
    export: '导出',
    import: '导入',
    refresh: '刷新',
    download: '下载',
    upload: '上传',
    copy: '复制',
    back: '返回',
    close: '关闭',
    retry: '重试',
    view: '查看',
    detail: '详情',
    add: '添加',
    remove: '移除',
    select: '选择',
    clear: '清空',
    reset: '重置',
  },

  // 状态
  status: {
    loading: '加载中...',
    success: '操作成功',
    failed: '操作失败',
    error: '发生错误',
    empty: '暂无数据',
    noResults: '未找到匹配结果',
  },

  // 分页
  pagination: {
    total: '共 {{total}} 条',
    page: '第 {{page}} 页',
    pageSize: '每页 {{size}} 条',
    goto: '跳至',
    itemsPerPage: '条/页',
  },

  // 时间
  time: {
    justNow: '刚刚',
    minutesAgo: '{{count}} 分钟前',
    hoursAgo: '{{count}} 小时前',
    daysAgo: '{{count}} 天前',
    yesterday: '昨天',
    today: '今天',
    tomorrow: '明天',
  },

  // 验证
  validation: {
    required: '{{field}} 是必填项',
    minLength: '{{field}} 至少需要 {{min}} 个字符',
    maxLength: '{{field}} 最多 {{max}} 个字符',
    invalid: '{{field}} 格式不正确',
    emailInvalid: '请输入有效的邮箱地址',
    urlInvalid: '请输入有效的 URL',
  },
};
