# 国际化概览

## 技术选型

使用 **react-i18next** 作为国际化解决方案。

### 优势

- 成熟稳定，社区活跃
- 支持命名空间、嵌套翻译
- 支持插值、复数、日期格式化
- 支持按需加载语言包
- 与后端 i18n API 可对接

---

## 安装配置

### 安装依赖

```bash
npm install i18next react-i18next i18next-browser-languagedetector
npm install -D @types/i18next
```

### 初始化配置

```typescript
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import zhCN from './locales/zh-CN';
import enUS from './locales/en-US';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'zh-CN': { translation: zhCN },
      'en-US': { translation: enUS },
    },
    fallbackLng: 'zh-CN',
    lng: 'zh-CN',
    debug: import.meta.env.DEV,

    interpolation: {
      escapeValue: false, // React 已经处理 XSS
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
```

### Provider 包装

```tsx
// src/main.tsx
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import App from './App';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <I18nextProvider i18n={i18n}>
    <App />
  </I18nextProvider>
);
```

---

## 语言文件组织

### 目录结构

```
src/locales/
├── index.ts         # 导出入口
├── zh-CN.ts         # 简体中文
├── en-US.ts         # 英文
└── modules/         # 模块化翻译
    ├── common.ts    # 通用翻译
    ├── nav.ts       # 导航菜单
    ├── benchmark.ts # 评测任务
    ├── execution.ts # 执行记录
    ├── agent.ts     # Agent 管理
    └── errors.ts    # 错误消息
```

### 模块化组织

```typescript
// src/locales/modules/common.ts
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
    paste: '粘贴',
    back: '返回',
    close: '关闭',
    retry: '重试',
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

// src/locales/modules/benchmark.ts
export default {
  title: '评测任务',
  list: {
    title: '评测任务列表',
    create: '创建评测任务',
    search: '搜索评测任务',
    filter: '筛选',
    export: '导出',
    import: '导入',
  },
  detail: {
    title: '评测任务详情',
    overview: '概览',
    executions: '执行记录',
    config: '配置',
    logs: '日志',
  },
  form: {
    name: '名称',
    namePlaceholder: '请输入评测任务名称',
    description: '描述',
    descriptionPlaceholder: '请输入描述',
    language: '编程语言',
    status: '状态',
    statusDraft: '草稿',
    statusActive: '活跃',
    statusArchived: '已归档',
  },
  status: {
    draft: '草稿',
    active: '活跃',
    archived: '已归档',
    deprecated: '已废弃',
  },
};

// src/locales/zh-CN.ts
import common from './modules/common';
import benchmark from './modules/benchmark';
import execution from './modules/execution';
import agent from './modules/agent';
import errors from './modules/errors';

export default {
  ...common,
  benchmark,
  execution,
  agent,
  errors,
};
```

---

## 使用方式

### 在组件中使用

```tsx
import { useTranslation } from 'react-i18next';

function BenchmarkList() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('benchmark.list.title')}</h1>
      <Button>{t('actions.create')}</Button>
      <Table />
    </div>
  );
}

// 使用插值
<p>{t('validation.required', { field: '名称' })}</p>
// 输出: 名称 是必填项

// 使用复数
<p>{t('time.minutesAgo', { count: 5 })}</p>
// 输出: 5 分钟前
```

### 在 Hook 中使用

```typescript
// src/hooks/useI18n.ts
import { useTranslation } from 'react-i18next';

export function useI18n() {
  const { t, i18n } = useTranslation();

  const formatDateTime = (date: string) => {
    // 使用 i18n 格式化日期
    return new Date(date).toLocaleDateString(i18n.language);
  };

  const formatNumber = (num: number) => {
    return num.toLocaleString(i18n.language);
  };

  return {
    t,
    locale: i18n.language,
    changeLanguage: i18n.changeLanguage,
    formatDateTime,
    formatNumber,
  };
}
```

### 切换语言

```tsx
import { Select } from 'antd';
import { useTranslation } from 'react-i18next';

const languages = [
  { value: 'zh-CN', label: '简体中文' },
  { value: 'en-US', label: 'English' },
];

function LanguageSelector() {
  const { i18n } = useTranslation();

  const handleChange = (value: string) => {
    i18n.changeLanguage(value);
    // 保存到 localStorage
    localStorage.setItem('language', value);
  };

  return (
    <Select
      value={i18n.language}
      onChange={handleChange}
      options={languages}
      style={{ width: 120 }}
    />
  );
}
```

---

## 与后端 API 对接

### 获取用户语言偏好

```typescript
// src/services/user.ts
export const userService = {
  // 获取用户信息（包含语言偏好）
  getProfile: () => {
    return request.get<User>('/auth/me');
  },

  // 更新语言偏好
  updateLanguage: (language: string) => {
    return request.put('/auth/profile', { language });
  },
};
```

### 同步语言设置

```typescript
// src/i18n/sync.ts
import { useAuthStore } from '@/stores/authStore';
import { userService } from '@/services/user';

export async function syncLanguageWithBackend(language: string) {
  try {
    await userService.updateLanguage(language);
    useAuthStore.getState().updateUser({ language });
  } catch (error) {
    console.error('Failed to sync language with backend:', error);
  }
}

export async function loadLanguageFromBackend() {
  try {
    const user = await userService.getProfile();
    return user.language || 'zh-CN';
  } catch {
    return localStorage.getItem('language') || 'zh-CN';
  }
}
```

### 应用初始化时加载语言

```typescript
// src/main.tsx
import { loadLanguageFromBackend } from '@/i18n/sync';

async function initApp() {
  // 加载用户语言偏好
  const language = await loadLanguageFromBackend();
  i18n.changeLanguage(language);

  // 渲染应用
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  );
}

initApp();
```

---

## 日期和数字格式化

### 配置

```typescript
// src/i18n/formatters.ts
import i18n from './index';

// 日期格式化
export const formatDate = (date: string | Date, format?: string) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = i18n.language;

  if (format) {
    return dayjs(d).locale(locale).format(format);
  }

  return d.toLocaleDateString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export const formatDateTime = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const locale = i18n.language;

  return d.toLocaleString(locale, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatRelativeTime = (date: string | Date) => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return i18n.t('time.justNow');
  if (diffMins < 60) return i18n.t('time.minutesAgo', { count: diffMins });
  if (diffMins < 1440) return i18n.t('time.hoursAgo', { count: Math.floor(diffMins / 60) });
  return i18n.t('time.daysAgo', { count: Math.floor(diffMins / 1440) });
};

// 数字格式化
export const formatNumber = (num: number) => {
  return num.toLocaleString(i18n.language);
};

export const formatPercent = (num: number, decimals = 1) => {
  return (num * 100).toFixed(decimals) + '%';
};

export const formatBytes = (bytes: number) => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// 货币格式化
export const formatCurrency = (amount: number) => {
  return amount.toLocaleString(i18n.language, {
    style: 'currency',
    currency: i18n.language === 'zh-CN' ? 'CNY' : 'USD',
  });
};
```

---

## TypeScript 支持

### 类型定义

```typescript
// src/types/i18n.ts
import 'i18next';

declare module 'i18next' {
  interface CustomTypeOptions {
    resources: {
      translation: {
        // 通用
        actions: Record<string, string>;
        status: Record<string, string>;
        pagination: {
          total: '{{total}} 条';
          page: '第 {{page}} 页';
          pageSize: '每页 {{size}} 条';
        };
        validation: {
          required: '{{field}} 是必填项';
          emailInvalid: '请输入有效的邮箱地址';
        };

        // Benchmark
        benchmark: {
          title: string;
          list: {
            title: string;
            create: string;
          };
          form: {
            name: string;
            namePlaceholder: string;
          };
          status: Record<string, string>;
        };

        // ... 其他模块
      };
    };

    // 允许任意嵌套
    returnNull: false;
    returnObjects: false;
    returnEmptyString: false;
  }
}
```

### 使用类型安全

```typescript
// src/i18n/typedT.ts
import { TFunction } from 'i18next';
import { i18n } from './index';

type TypedT = TFunction<'translation', undefined>;

export const typedT: TypedT = i18n.t;
```

---

## 最佳实践

1. **使用命名空间** - 大型项目使用命名空间管理翻译
2. **插值参数** - 使用 `{{key}}` 语法进行插值
3. **复数处理** - 使用 count 参数处理复数
4. **按需加载** - 大型语言包可以按需加载
5. **统一管理** - 所有翻译键集中在语言文件中
6. **类型安全** - 使用 TypeScript 定义翻译键类型
7. **后端同步** - 用户语言偏好与后端同步
