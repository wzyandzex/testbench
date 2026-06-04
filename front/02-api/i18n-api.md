# 国际化接口

## 基础信息

| 项目 | 值 |
|------|------|
| 基础路径 | `/api/v1/i18n` |
| 需要认证 | 否 |
| 内容类型 | `application/json` |

## 错误码

| HTTP 状态码 | 说明 |
|------------|------|
| 404 | 语言包不存在 |
| 500 | 服务器内部错误 |

---

## 接口列表

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/i18n/locales` | 列出所有可用的语言包 |
| GET | `/i18n/locales/:lang` | 获取指定语言的语言包 |

---

## 1. 列出所有可用的语言包

### 请求

```http
GET /api/v1/i18n/locales
```

或者使用 Accept-Language header：

```http
GET /api/v1/i18n/locales
Accept-Language: zh-CN
```

### 响应

```typescript
interface LocalesResponse {
  code: number;
  message: string;
  data: LocaleMetadata[];
}

interface LocaleMetadata {
  code: string;           // 语言代码，如 zh-CN, en-US
  name: string;           // 语言名称
  native_name: string;    // 原生名称
  direction: string;      // 文字方向（ltr/rtl）
  flag: string;           // 国旗 emoji
  is_default: boolean;   // 是否默认语言
  coverage: number;       // 翻译覆盖率（百分比）
}
```

**示例响应：**

```json
{
  "code": 0,
  "message": "success",
  "data": [
    {
      "code": "zh-CN",
      "name": "Chinese (Simplified)",
      "native_name": "简体中文",
      "direction": "ltr",
      "flag": "🇨🇳",
      "is_default": false,
      "coverage": 95
    },
    {
      "code": "en-US",
      "name": "English (United States)",
      "native_name": "English",
      "direction": "ltr",
      "flag": "🇺🇸",
      "is_default": true,
      "coverage": 100
    }
  ]
}
```

---

## 2. 获取指定语言的语言包

### 请求

```http
GET /api/v1/i18nlocales/zh-CN
```

或者使用 Accept-Language header：

```http
GET /api/v1/i18n/locales
Accept-Language: zh-CN
```

### 响应

```typescript
interface LocaleContentResponse {
  code: number;
  message: string;
  data: LocaleContent;
}

interface LocaleContent {
  code: string;
  translations: Record<string, string>;
  // 或者分层结构
  common?: Record<string, string>;
  auth?: Record<string, string>;
  benchmark?: Record<string, string>;
  execution?: Record<string, string>;
  // ...其他模块
}
```

**示例响应：**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "code": "zh-CN",
    "translations": {
      "common.save": "保存",
      "common.cancel": "取消",
      "common.delete": "删除",
      "common.confirm": "确认",
      "auth.login": "登录",
      "auth.logout": "登出",
      "benchmark.create": "创建评测任务",
      "execution.running": "运行中",
      "execution.completed": "已完成"
    }
  }
}
```

---

## 3. 与前端国际化集成

### 使用 react-i18next 加载语言包

```typescript
// src/services/i18n.ts
import { request } from './request';
import type { LocaleContent } from '@/types/api/i18n';

export const i18nService = {
  // 获取可用语言列表
  listLocales: async () => {
    const { data } = await request.get<LocaleMetadata[]>('/i18n/locales');
    return data;
  },

  // 获取语言包内容
  getLocale: async (lang: string) => {
    const { data } = await request.get<LocaleContent>(`/i18n/locales/${lang}`);
    return data;
  },

  // 从后端动态加载语言包
  loadLocale: async (lang: string) => {
    const content = await i18nService.getLocale(lang);
    return content.translations;
  },
};
```

### 初始化 i18next

```typescript
// src/i18n/config.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { i18nService } from '@/services/i18n';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpApi from 'i18next-http-backend';
import ChainedBackend from 'i18next-chained-backend';

const initI18n = async () => {
  // 获取可用语言列表
  const locales = await i18nService.listLocales();
  const languages = locales.map(l => l.code);
  const defaultLang = locales.find(l => l.is_default)?.code || 'en-US';

  await i18n.use(initReactI18next).init({
    lng: defaultLang,
    fallbackLng: 'en-US',
    supportedLngs: languages,

    resources: languages.reduce((acc, lang) => {
      acc[lang] = {
        translation: async () => {
          const content = await i18nService.getLocale(lang);
          return content.translations;
        },
      };
      return acc;
    }, {} as any),

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: true,
    },
  });
};
```

### 语言切换组件

```typescript
// src/components/LanguageSwitcher.tsx
import { Select } from 'antd';
import { useTranslation } from 'react-i18next';
import { i18nService } from '@/services/i18n';
import { useQuery } from '@tanstack/react-query';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const { data: locales } = useQuery({
    queryKey: ['locales'],
    queryFn: () => i18nService.listLocales(),
  });

  const handleChange = async (lang: string) => {
    // 动态加载语言包
    const translations = await i18nService.getLocale(lang);

    // 更新 i18next 资源
    i18n.addResourceBundle(lang, 'translation', translations);

    // 切换语言
    await i18n.changeLanguage(lang);

    // 可选：保存到本地存储
    localStorage.setItem('preferred-language', lang);
  };

  return (
    <Select
      style={{ width: 200 }}
      placeholder="选择语言"
      value={i18n.language}
      onChange={handleChange}
      options={locales?.map((locale) => ({
        value: locale.code,
        label: (
          <span>
            {locale.flag} {locale.native_name}
          </span>
        ),
      }))}
    />
  );
}
```

---

## TypeScript 类型定义

```typescript
// src/types/api/i18n.ts

export interface LocaleMetadata {
  code: string;
  name: string;
  native_name: string;
  direction: 'ltr' | 'rtl';
  flag: string;
  is_default: boolean;
  coverage: number;
}

export interface LocaleContent {
  code: string;
  translations: Record<string, string>;
}

export interface LocaleTranslations {
  common?: Record<string, string>;
  auth?: Record<string, string>;
  benchmark?: Record<string, string>;
  execution?: Record<string, string>;
  agent?: Record<string, string>;
  batch?: Record<string, string>;
  metrics?: Record<string, string>;
  scheduler?: Record<string, string>;
  organization?: Record<string, string>;
  settings?: Record<string, string>;
}
```

---

## 支持的语言代码

| 代码 | 名称 | 原生名称 | 方向 |
|------|------|----------|------|
| zh-CN | Chinese (Simplified) | 简体中文 | ltr |
| en-US | English (United States) | English | ltr |
| ja-JP | Japanese | 日本語 | ltr |
| ko-KR | Korean | 한국어 | ltr |
| fr-FR | French | Français | ltr |
| de-DE | German | Deutsch | ltr |
| es-ES | Spanish | Español | ltr |
| ru-RU | Russian | Русский | ltr |
| ar-SA | Arabic | العربية | rtl |

---

## 前端最佳实践

### 1. 语言包缓存

```typescript
// 使用 React Query 缓存语言包
const { data: translations } = useQuery({
  queryKey: ['locale', lang],
  queryFn: () => i18nService.getLocale(lang),
  staleTime: 5 * 60 * 1000, // 5分钟
  cacheTime: 10 * 60 * 1000, // 10分钟
});
```

### 2. 按需加载

```typescript
// 只加载当前语言包
const loadLocale = async (lang: string) => {
  if (!i18n.hasResourceBundle(lang, 'translation')) {
    const content = await i18nService.getLocale(lang);
    i18n.addResourceBundle(lang, 'translation', content.translations);
  }
};
```

### 3. 预加载常用语言

```typescript
// 在应用初始化时预加载
const preloadCommonLocales = async () => {
  const commonLangs = ['en-US', 'zh-CN'];
  await Promise.all(
    commonLangs.map(lang => i18nService.getLocale(lang))
  );
};
```

### 4. 语言检测顺序

1. URL 参数 (`?lang=zh-CN`)
2. 用户设置（从后端获取）
3. 本地存储
4. Accept-Language header
5. 默认语言
