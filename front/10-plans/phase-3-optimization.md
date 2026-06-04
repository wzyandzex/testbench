# 第三阶段优化

## 目标

性能优化、代码质量提升、扩展性增强。

## 时间规划

预计 2-4 周

---

## 性能优化

### 1. 代码优化

#### 1.1 代码分割

```typescript
// 路由级别懒加载
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'));
const BenchmarksPage = lazy(() => import('@/pages/benchmarks/BenchmarkListPage'));

// 组件级别懒加载
const HeavyChart = lazy(() => import('@/components/chart/HeavyChart'));
```

#### 1.2 Tree Shaking

```typescript
// 按需导入
import { Button } from 'antd';
// 而不是
import * as Antd from 'antd';

// lodash 按需导入
import debounce from 'lodash-es/debounce';
```

#### 1.3 依赖分析

```bash
# 分析打包体积
npm run build -- --report
```

### 2. 渲染优化

#### 2.1 虚拟列表

```typescript
// 使用 react-window 或 rc-virtual-list
import { List } from 'react-window';

const Row = ({ index, style }) => (
  <div style={style}>Row {index}</div>
);

<List
  height={600}
  itemCount={10000}
  itemSize={35}
>
  {Row}
</List>
```

#### 2.2 React 优化

```typescript
// React.memo 防止不必要重渲染
export const MemoComponent = React.memo(({ data }) => {
  return <div>{data.name}</div>;
});

// useMemo 缓存计算结果
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(a, b);
}, [a, b]);

// useCallback 稳定函数引用
const handleClick = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

### 3. 网络优化

#### 3.1 请求合并

```typescript
// 批量请求
const fetchMultiple = (ids: string[]) => {
  return api.post('/items/batch', { ids });
};
```

#### 3.2 请求缓存

```typescript
// 使用 React Query 或 SWR
import { useQuery } from '@tanstack/react-query';

const { data } = useQuery({
  queryKey: ['benchmark', id],
  queryFn: () => fetchBenchmark(id),
  staleTime: 5 * 60 * 1000, // 5 分钟
  cacheTime: 10 * 60 * 1000,
});
```

#### 3.3 预加载

```typescript
// 预加载下一页数据
const prefetchNextPage = () => {
  queryClient.prefetchQuery({
    queryKey: ['benchmarks', page + 1],
    queryFn: () => fetchBenchmarks(page + 1),
  });
};
```

### 4. 资源优化

#### 4.1 图片优化

```typescript
// 响应式图片
<img
  srcSet="image-320w.jpg 320w, image-640w.jpg 640w, image-1280w.jpg 1280w"
  sizes="(max-width: 320px) 280px, (max-width: 640px) 600px, 1200px"
  src="image-1280w.jpg"
  alt="..."
/>

// 懒加载
<img loading="lazy" src="..." alt="..." />
```

#### 4.2 字体优化

```css
/* 字子集化 */
@font-face {
  font-family: 'CustomFont';
  src: url('custom-font.woff2') format('woff2');
  unicode-range: U+0020-007E; /* ASCII 字符 */
}
```

---

## 代码质量

### 1. TypeScript 强化

#### 1.1 严格模式

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

#### 1.2 类型完善

```typescript
// 完善所有组件 Props 类型
interface ComponentProps {
  data: DataType;
  onAction: (id: string) => void;
  loading?: boolean;
}

// 泛型组件
function List<T>({ items, renderItem }: ListProps<T>) {
  return <ul>{items.map(renderItem)}</ul>;
}
```

### 2. 测试覆盖

#### 2.1 单元测试

```typescript
// 组件测试
import { render, screen } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    screen.getByText('Click').click();
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});

// Hook 测试
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

describe('useCounter', () => {
  it('increments count', () => {
    const { result } = renderHook(() => useCounter());
    act(() => {
      result.current.increment();
    });
    expect(result.current.count).toBe(1);
  });
});
```

#### 2.2 集成测试

```typescript
// 路由测试
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

const router = createMemoryRouter(routes, {
  initialEntries: ['/'],
});

render(<RouterProvider router={router} />);
```

#### 2.3 E2E 测试

```typescript
// Playwright
import { test, expect } from '@playwright/test';

test('login flow', async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="username"]', 'testuser');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});
```

### 3. 代码规范

#### 3.1 ESLint 规则

```javascript
// .eslintrc.cjs
module.exports = {
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/recommended',
    'plugin:jsx-a11y/recommended',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
  },
};
```

#### 3.2 Prettier 配置

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "arrowParens": "always"
}
```

#### 3.3 Commit 规范

```bash
# 使用 commitlint
git commit -m "feat(benchmark): add create benchmark page"
git commit -m "fix(auth): resolve token refresh issue"
git commit -m "docs: update README"
```

---

## 可维护性

### 1. 组件文档

```typescript
/**
 * 数据表格组件
 *
 * @description 支持排序、筛选、分页的数据表格
 *
 * @example
 * ```tsx
 * <DataTable
 *   columns={columns}
 *   dataSource={data}
 *   loading={loading}
 *   onRowClick={handleRowClick}
 * />
 * ```
 */
export interface DataTableProps<T> {
  /**
   * 表格列配置
   */
  columns: ColumnsType<T>;
  /**
   * 数据源
   */
  dataSource: T[];
  /**
   * 加载状态
   */
  loading?: boolean;
  /**
   * 行点击事件
   */
  onRowClick?: (record: T) => void;
}
```

### 2. Storybook

```typescript
// stories/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    type: 'primary',
    children: 'Button',
  },
};

export const Secondary: Story = {
  args: {
    type: 'default',
    children: 'Button',
  },
};
```

### 3. 变更日志

```markdown
# Changelog

## [1.2.0] - 2026-02-01
### Added
- 批量执行功能
- 调度管理功能

### Fixed
- Token 刷新问题
- WebSocket 重连问题

### Changed
- 优化列表加载性能
```

---

## 部署优化

### 1. 构建优化

```typescript
// vite.config.ts
export default defineConfig({
  build: {
    // 代码分割
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor': ['antd', '@ant-design/icons'],
          'chart-vendor': ['echarts', 'echarts-for-react'],
        },
      },
    },
    // 压缩
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    // 资源内联限制
    assetsInlineLimit: 4096,
  },
});
```

### 2. CDN 配置

```html
<!-- index.html -->
<head>
  <link rel="stylesheet" href="https://cdn.example.com/antd.min.css" />
</head>
<body>
  <script src="https://cdn.example.com/react.production.min.js"></script>
  <script src="https://cdn.example.com/react-dom.production.min.js"></script>
</body>
```

### 3. 缓存策略

```nginx
# nginx.conf
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}

location /index.html {
  add_header Cache-Control "no-cache";
}
```

---

## 监控与分析

### 1. 性能监控

```typescript
// Web Vitals 监控
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

getCLS(console.log);
getFID(console.log);
getFCP(console.log);
getLCP(console.log);
getTTFB(console.log);
```

### 2. 错误监控

```typescript
// Sentry 集成
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
});
```

### 3. 用户行为分析

```typescript
// 埋点
import { trackEvent } from '@/utils/analytics';

const handleClick = () => {
  trackEvent('button_click', {
    button_name: 'create_benchmark',
    page: 'benchmark_list',
  });
};
```

---

## 完成标准

### 性能指标

| 指标 | 目标 |
|------|------|
| FCP | < 1s |
| LCP | < 2.5s |
| TTI | < 3s |
| CLS | < 0.1 |
| Lighthouse | > 90 |

### 质量指标

| 指标 | 目标 |
|------|------|
| 测试覆盖率 | > 70% |
| TypeScript 覆盖率 | 100% |
| ESLint 错误 | 0 |
| Bundle 大小 | < 500KB (gzip) |
