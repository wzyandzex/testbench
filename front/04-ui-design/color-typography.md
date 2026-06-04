# 色彩和字体风格设计

本文档提供三种 UI 设计风格的完整定义，包括色彩、字体、间距等规范。

---

## 风格一：企业级风格

### 设计理念

严肃、专业、可信赖，适合 B 端企业内部使用。

### 色彩系统

#### 品牌色

```css
/* 主色 - 深蓝 */
--color-primary: #1677ff;
--color-primary-hover: #4096ff;
--color-primary-active: #0958d9;
--color-primary-bg: #e6f4ff;

/* 辅助色 - 蓝紫 */
--color-secondary: #722ed1;
--color-secondary-hover: #9254de;
--color-secondary-active: #531dab;
--color-secondary-bg: #f9f0ff;
```

#### 功能色

```css
/* 成功 */
--color-success: #52c41a;
--color-success-hover: #73d13d;
--color-success-active: #389e0d;
--color-success-bg: #f6ffed;
--color-success-border: #b7eb8f;

/* 警告 */
--color-warning: #faad14;
--color-warning-hover: #ffc53d;
--color-warning-active: #d48806;
--color-warning-bg: #fffbe6;
--color-warning-border: #ffe58f;

/* 错误 */
--color-error: #ff4d4f;
--color-error-hover: #ff7875;
--color-error-active: #d9363e;
--color-error-bg: #fff2f0;
--color-error-border: #ffccc7;

/* 信息 */
--color-info: #1677ff;
--color-info-hover: #4096ff;
--color-info-active: #0958d9;
--color-info-bg: #e6f4ff;
--color-info-border: #91caff;
```

#### 中性色

```css
/* 文本色 */
--color-text-primary: rgba(0, 0, 0, 0.88);
--color-text-secondary: rgba(0, 0, 0, 0.65);
--color-text-tertiary: rgba(0, 0, 0, 0.45);
--color-text-disabled: rgba(0, 0, 0, 0.25);

/* 背景色 */
--color-bg-primary: #ffffff;
--color-bg-secondary: #fafafa;
--color-bg-tertiary: #f5f5f5;
--color-bg-hover: rgba(0, 0, 0, 0.04);
--color-bg-active: rgba(0, 0, 0, 0.08);

/* 边框色 */
--color-border: #d9d9d9;
--color-border-light: #f0f0f0;
--color-border-dark: #bfbfbf;
```

#### 状态色映射

| 状态 | 颜色 | Hex |
|------|------|-----|
| 等待中 | 橙色 | #faad14 |
| 运行中 | 蓝色 | #1677ff |
| 成功/完成 | 绿色 | #52c41a |
| 失败 | 红色 | #ff4d4f |
| 已取消 | 灰色 | #d9d9d9 |

### 字体系统

#### 字体家族

```css
--font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
  'Helvetica Neue', Arial, 'Noto Sans', sans-serif, 'Apple Color Emoji',
  'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';
--font-family-code: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo,
  Courier, monospace;
```

#### 字号

```css
--font-size-xs: 12px;
--font-size-sm: 14px;
--font-size-base: 16px;
--font-size-lg: 18px;
--font-size-xl: 20px;
--font-size-xxl: 24px;
--font-size-xxxl: 30px;
```

#### 行高

```css
--line-height-xs: 1.4;
--line-height-sm: 1.5;
--line-height-base: 1.5715;
--line-height-lg: 1.6667;
--line-height-xl: 1.75;
```

### 间距系统

```css
--spacing-xs: 4px;
--spacing-sm: 8px;
--spacing-md: 16px;
--spacing-lg: 24px;
--spacing-xl: 32px;
--spacing-xxl: 48px;
```

### 圆角

```css
--border-radius-sm: 4px;
--border-radius-base: 6px;
--border-radius-lg: 8px;
--border-radius-xl: 12px;
```

---

## 风格二：现代简约风格

### 设计理念

轻量、简洁、现代，类似 Vercel 风格，适合科技公司/创业团队。

### 色彩系统

#### 品牌色

```css
/* 主色 - 黑白为主 */
--color-primary: #000000;
--color-primary-hover: #333333;
--color-primary-active: #000000;
--color-primary-bg: #f5f5f5;

/* 辅助色 - 纯白 */
--color-secondary: #ffffff;
--color-secondary-hover: #f5f5f5;
--color-secondary-active: #eaeaea;

/* 强调色 - 渐变蓝紫 */
--color-accent: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--color-accent-solid: #667eea;
```

#### 功能色

```css
/* 成功 */
--color-success: #10b981;
--color-success-bg: #d1fae5;
--color-success-border: #6ee7b7;

/* 警告 */
--color-warning: #f59e0b;
--color-warning-bg: #fef3c7;
--color-warning-border: #fcd34d;

/* 错误 */
--color-error: #ef4444;
--color-error-bg: #fee2e2;
--color-error-border: #fca5a5;

/* 信息 */
--color-info: #3b82f6;
--color-info-bg: #dbeafe;
--color-info-border: #93c5fd;
```

#### 中性色

```css
/* 文本色 */
--color-text-primary: #111111;
--color-text-secondary: #666666;
--color-text-tertiary: #999999;
--color-text-disabled: #d4d4d4;

/* 背景色 */
--color-bg-primary: #ffffff;
--color-bg-secondary: #fafafa;
--color-bg-tertiary: #f5f5f5;
--color-bg-hover: #f5f5f5;
--color-bg-active: #eaeaea;

/* 边框色 */
--color-border: #eaeaea;
--color-border-light: #f5f5f5;
--color-border-dark: #d4d4d4;
```

#### 状态色映射

| 状态 | 颜色 | Hex |
|------|------|-----|
| 等待中 | 琥珀色 | #f59e0b |
| 运行中 | 蓝色 | #3b82f6 |
| 成功/完成 | 绿色 | #10b981 |
| 失败 | 红色 | #ef4444 |
| 已取消 | 灰色 | #9ca3af |

### 字体系统

#### 字体家族

```css
--font-family-base: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI',
  Roboto, sans-serif;
--font-family-code: 'JetBrains Mono', 'SFMono-Regular', Consolas, monospace;
```

#### 字号

```css
--font-size-xs: 12px;
--font-size-sm: 13px;
--font-size-base: 14px;
--font-size-lg: 16px;
--font-size-xl: 18px;
--font-size-xxl: 24px;
--font-size-xxxl: 32px;
```

#### 字重

```css
--font-weight-light: 300;
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
```

### 间距系统

```css
--spacing-xs: 4px;
--spacing-sm: 12px;
--spacing-md: 20px;
--spacing-lg: 32px;
--spacing-xl: 48px;
--spacing-xxl: 64px;
```

### 圆角

```css
--border-radius-sm: 4px;
--border-radius-base: 8px;
--border-radius-lg: 12px;
--border-radius-xl: 16px;
--border-radius-round: 9999px;
```

### 阴影

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.05);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.05);
```

---

## 风格三：开发者工具风格

### 设计理念

功能至上、高信息密度、暗色友好，类似 GitHub/GitLab 风格。

### 色彩系统（亮色）

#### 品牌色

```css
/* 主色 - 深蓝绿 */
--color-primary: #0969da;
--color-primary-hover: #0757b3;
--color-primary-active: #044289;
--color-primary-bg: #ddf4ff;
--color-primary-border: #54aeff;

/* 辅助色 - 紫色 */
--color-secondary: #8250df;
--color-secondary-hover: #6e40cf;
--color-secondary-active: #5a30bf;
--color-secondary-bg: #f8f4ff;
```

#### 功能色

```css
/* 成功 */
--color-success: #1f883d;
--color-success-bg: #dafbe1;
--color-success-border: #3fb950;
--color-success-icon: #1a7f37;

/* 警告 */
--color-warning: #9a6700;
--color-warning-bg: #fff8c5;
--color-warning-border: #d29922;
--color-warning-icon: #9a6700;

/* 错误 */
--color-error: #cf222e;
--color-error-bg: #ffebe9;
--color-error-border: #ff7b72;
--color-error-icon: #cf222e;

/* 信息 */
--color-info: #0969da;
--color-info-bg: #ddf4ff;
--color-info-border: #54aeff;
```

#### 中性色

```css
/* 文本色 */
--color-text-primary: #24292f;
--color-text-secondary: #57606a;
--color-text-tertiary: #8b949e;
--color-text-disabled: #d0d7de;
--color-text-inverse: #ffffff;

/* 背景色 */
--color-bg-primary: #ffffff;
--color-bg-secondary: #f6f8fa;
--color-bg-tertiary: #eaeef2;
--color-bg-overlay: #ffffff;

/* 边框色 */
--color-border: #d0d7de;
--color-border-muted: #eaeef2;
--color-border-dark: #babbbd;
```

### 色彩系统（暗色）

```css
[data-theme="dark"] {
  /* 文本色 */
  --color-text-primary: #c9d1d9;
  --color-text-secondary: #8b949e;
  --color-text-tertiary: #6e7681;
  --color-text-disabled: #484f58;
  --color-text-inverse: #24292f;

  /* 背景色 */
  --color-bg-primary: #0d1117;
  --color-bg-secondary: #161b22;
  --color-bg-tertiary: #21262d;
  --color-bg-overlay: #161b22;

  /* 边框色 */
  --color-border: #30363d;
  --color-border-muted: #21262d;
  --color-border-dark: #6e7681;

  /* 功能色 */
  --color-success: #3fb950;
  --color-success-bg: rgba(63, 185, 80, 0.15);
  --color-warning: #d29922;
  --color-warning-bg: rgba(210, 153, 34, 0.15);
  --color-error: #f85149;
  --color-error-bg: rgba(248, 81, 73, 0.15);
  --color-info: #58a6ff;
  --color-info-bg: rgba(88, 166, 255, 0.15);
}
```

### 字体系统

#### 字体家族

```css
--font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans',
  Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji';
--font-family-code: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas,
  'Liberation Mono', monospace;
```

#### 字号

```css
--font-size-micro: 10px;
--font-size-xs: 11px;
--font-size-sm: 12px;
--font-size-base: 14px;
--font-size-lg: 16px;
--font-size-xl: 18px;
--font-size-xxl: 20px;
--font-size-xxxl: 24px;
```

### 间距系统

```css
--spacing-1: 2px;
--spacing-2: 4px;
--spacing-3: 8px;
--spacing-4: 12px;
--spacing-5: 16px;
--spacing-6: 20px;
--spacing-7: 24px;
--spacing-8: 32px;
```

### 圆角

```css
--border-radius-small: 4px;
--border-radius-medium: 6px;
--border-radius-large: 8px;
```

---

## 风格选择建议

| 风格 | 适用场景 | 优缺点 |
|------|---------|--------|
| **企业级风格** | 内部企业系统、传统行业 | 优点：专业稳重、用户熟悉<br>缺点：略显保守 |
| **现代简约风格** | SaaS 产品、科技公司 | 优点：现代时尚、品牌感强<br>缺点：可能不够专业 |
| **开发者工具风格** | 开发者工具、技术平台 | 优点：信息密度高、开发者友好<br>缺点：学习成本略高 |

## CSS 变量定义

### 统一变量名

```css
/* 主题选择 */
:root {
  --theme-mode: 'enterprise'; /* 'enterprise' | 'modern' | 'developer' */
}
```

### JavaScript 切换主题

```typescript
// src/utils/theme.ts
export const themes = {
  enterprise: 'enterprise',
  modern: 'modern',
  developer: 'developer',
} as const;

export function setTheme(theme: keyof typeof themes) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('theme', theme);
}

export function getTheme(): keyof typeof themes {
  const stored = localStorage.getItem('theme');
  if (stored && stored in themes) {
    return stored as keyof typeof themes;
  }
  return themes.enterprise;
}

// 初始化
export function initTheme() {
  setTheme(getTheme());
}
```

### Ant Design 主题配置

```typescript
// src/theme/config.ts
const enterpriseTheme = {
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 6,
    fontSize: 14,
  },
};

const modernTheme = {
  token: {
    colorPrimary: '#000000',
    borderRadius: 8,
    fontSize: 14,
    colorBgContainer: '#ffffff',
  },
};

const developerTheme = {
  token: {
    colorPrimary: '#0969da',
    borderRadius: 6,
    fontSize: 14,
  },
  algorithm: theme.darkAlgorithm, // 支持暗色
};

export const themes = {
  enterprise: enterpriseTheme,
  modern: modernTheme,
  developer: developerTheme,
};
```
