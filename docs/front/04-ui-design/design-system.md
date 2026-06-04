# 设计系统概览

## 设计原则

### 1. 清晰优先

信息层次清晰，用户能快速找到所需内容。

- **视觉层次** - 通过大小、颜色、间距建立清晰的层次
- **信息密度** - 适度留白，避免信息过载
- **一致性** - 相同功能使用相同交互模式

### 2. 效率导向

减少操作步骤，提高用户工作效率。

- **快捷操作** - 常用功能一键触达
- **批量操作** - 支持多选批量处理
- **智能默认** - 合理的默认值和自动填充

### 3. 反馈及时

用户操作后立即给予反馈。

- **加载状态** - 操作进行中显示进度
- **成功/失败** - 明确的操作结果提示
- **实时更新** - 数据变化自动刷新

### 4. 容错设计

预防和减少用户错误。

- **表单验证** - 实时验证和错误提示
- **确认操作** - 危险操作二次确认
- **可撤销** - 支持撤销最近操作

## 组件规范

### 基础组件

基于 Ant Design 组件库进行定制。

| 组件 | 用途 | 定制要点 |
|------|------|---------|
| Button | 按钮 | 统一尺寸、禁用态样式 |
| Input | 输入框 | 错误状态、前后缀图标 |
| Select | 选择器 | 虚拟滚动、多选样式 |
| Table | 表格 | 固定列、排序、筛选 |
| Form | 表单 | 布局、验证提示 |
| Modal | 弹窗 | 尺寸限制、动画 |
| Drawer | 抽屉 | 层级、遮罩 |
| Badge | 徽标 | 颜色、位置 |

### 业务组件

在 `src/components/` 下创建业务组件。

```
components/
├── table/              # 表格相关
│   ├── DataTable.tsx   # 数据表格（封装排序、筛选、分页）
│   ├── ActionButtons.tsx  # 操作按钮组
│   └── StatusColumn.tsx   # 状态列
├── form/               # 表单相关
│   ├── FormBuilder.tsx # 动态表单构建器
│   ├── FilterForm.tsx  # 筛选表单
│   └── UploadZone.tsx  # 上传区域
├── status/             # 状态显示
│   ├── StatusBadge.tsx # 状态徽标
│   ├── ProgressRing.tsx   # 进度环
│   └── ConnectionStatus.tsx # 连接状态
└── chart/              # 图表
    ├── LineChart.tsx   # 折线图
    ├── BarChart.tsx    # 柱状图
    └── PieChart.tsx    # 饼图
```

## 间距系统

使用 8px 基准网格系统。

```css
/* CSS 变量 */
--spacing-xs: 4px;    /* 0.5x */
--spacing-sm: 8px;    /* 1x */
--spacing-md: 16px;   /* 2x */
--spacing-lg: 24px;   /* 3x */
--spacing-xl: 32px;   /* 4x */
--spacing-xxl: 48px;  /* 6x */
```

### 使用场景

| 场景 | 间距 |
|------|------|
| 组件内部元素 | sm / md |
| 组件之间 | md / lg |
| 页面区块之间 | lg / xl |
| 页面边距 | xl |

## 圆角规范

```css
--radius-xs: 2px;
--radius-sm: 4px;
--radius-md: 6px;
--radius-lg: 8px;
--radius-xl: 12px;
--radius-round: 50%;
```

### 使用场景

| 元素 | 圆角 |
|------|------|
| 按钮 | md |
| 输入框 | md |
| 卡片 | lg |
| 标签 | sm |
| 头像 | round |

## 阴影规范

```css
--shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
--shadow-md: 0 4px 6px rgba(0, 0, 0, 0.08);
--shadow-lg: 0 10px 15px rgba(0, 0, 0, 0.1);
--shadow-xl: 0 20px 25px rgba(0, 0, 0, 0.12);
```

### 使用场景

| 元素 | 阴影 |
|------|------|
| 卡片 | sm / md |
| 下拉菜单 | md |
| 弹窗 | lg |
| 抽屉 | xl |

## 字体规范

### 字体家族

```css
--font-family-base: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto,
  'Helvetica Neue', Arial, 'Noto Sans', sans-serif;
--font-family-code: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo,
  Courier, monospace;
```

### 字号系统

```css
--font-size-xs: 12px;
--font-size-sm: 14px;
--font-size-md: 16px;
--font-size-lg: 18px;
--font-size-xl: 20px;
--font-size-xxl: 24px;
--font-size-xxxl: 30px;
```

### 字重

```css
--font-weight-normal: 400;
--font-weight-medium: 500;
--font-weight-semibold: 600;
--font-weight-bold: 700;
```

### 使用场景

| 元素 | 字号 | 字重 |
|------|------|------|
| 页面标题 | xxl / xxxl | bold |
| 卡片标题 | lg / xl | medium |
| 正文 | md | normal |
| 辅助文字 | sm | normal |
| 标签 | xs | normal |

## 图标规范

使用 Ant Design Icons 或自定义 SVG 图标。

### 图标尺寸

```css
--icon-size-xs: 12px;
--icon-size-sm: 16px;
--icon-size-md: 20px;
--icon-size-lg: 24px;
--icon-size-xl: 32px;
```

### 使用原则

- **语义清晰** - 图标含义明确，无需文字说明
- **统一风格** - 使用同一套图标库
- **适当大小** - 根据上下文选择合适尺寸

## 状态颜色

### 功能色

```css
--color-primary: #1890ff;
--color-success: #52c41a;
--color-warning: #faad14;
--color-error: #ff4d4f;
--color-info: #1890ff;
```

### 中性色

```css
--color-text-primary: rgba(0, 0, 0, 0.85);
--color-text-secondary: rgba(0, 0, 0, 0.65);
--color-text-tertiary: rgba(0, 0, 0, 0.45);
--color-text-disabled: rgba(0, 0, 0, 0.25);

--color-border: #d9d9d9;
--color-border-light: #f0f0f0;

--color-bg-primary: #ffffff;
--color-bg-secondary: #fafafa;
--color-bg-tertiary: #f5f5f5;
```

## 布局规范

### 断点系统

```css
--breakpoint-xs: 480px;
--breakpoint-sm: 576px;
--breakpoint-md: 768px;
--breakpoint-lg: 992px;
--breakpoint-xl: 1200px;
--breakpoint-xxl: 1600px;
```

### 栅格系统

使用 Ant Design 的 24 列栅格系统。

```tsx
<Row gutter={16}>
  <Col xs={24} sm={12} md={8} lg={6}>
    {/* 内容 */}
  </Col>
</Row>
```

### 容器宽度

| 断点 | 容器宽度 |
|------|---------|
| xs | 100% |
| sm | 100% |
| md | 720px |
| lg | 960px |
| xl | 1140px |
| xxl | 1320px |

## 动画规范

### 过渡时间

```css
--duration-fast: 100ms;
--duration-base: 200ms;
--duration-slow: 300ms;
--duration-slower: 500ms;
```

### 缓动函数

```css
--ease-in-out: cubic-bezier(0.645, 0.045, 0.355, 1);
--ease-out: cubic-bezier(0.215, 0.61, 0.355, 1);
--ease-in: cubic-bezier(0.55, 0.055, 0.675, 0.19);
```

### 使用场景

| 场景 | 时长 | 缓动 |
|------|------|------|
| 按钮悬停 | fast | ease-in-out |
| 弹窗显示 | base | ease-out |
| 页面切换 | slow | ease-in-out |
| 列表项加载 | base | ease-out |

## 响应式设计

### 移动优先

使用 min-width 断点，从移动端开始设计。

```css
/* 移动端（默认） */
.component {
  padding: 8px;
}

/* 平板及以上 */
@media (min-width: 768px) {
  .component {
    padding: 16px;
  }
}

/* 桌面 */
@media (min-width: 1200px) {
  .component {
    padding: 24px;
  }
}
```

### 隐藏/显示

```tsx
// 响应式显示
<Col xs={24} md={12} lg={8}>
  {/* 在移动端占满，平板占一半，桌面占 1/3 */}
</Col>

// 响应式隐藏
<Hidden xs>
  {/* 在移动端隐藏 */}
</Hidden>
```

## 无障碍规范

### ARIA 属性

```tsx
<button aria-label="关闭" aria-pressed={false}>
  <CloseOutlined />
</button>

<div role="status" aria-live="polite">
  {message}
</div>
```

### 键盘导航

- 所有交互元素支持键盘访问
- Tab 顺序符合逻辑
- Esc 关闭弹窗/抽屉
- Enter/Space 激活按钮

### 焦点管理

```tsx
// 弹窗关闭后返回焦点
const [previousActiveElement, setPreviousActiveElement] =
  useState<HTMLElement | null>(null);

useEffect(() => {
  if (visible) {
    setPreviousActiveElement(document.activeElement as HTMLElement);
  } else {
    previousActiveElement?.focus();
  }
}, [visible]);
```

## CSS-in-JS 规范

使用 styled-components 或 CSS Modules。

```tsx
// styled-components
import styled from 'styled-components';

const StyledCard = styled(Card)<{ $active: boolean }>`
  border: 1px solid ${props => props.$active
    ? 'var(--color-primary)'
    : 'var(--color-border)'};
  transition: all var(--duration-base) var(--ease-in-out);

  &:hover {
    box-shadow: var(--shadow-md);
  }
`;
```

## 主题定制

### Ant Design 主题定制

```tsx
// src/theme/index.ts
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';

const theme = {
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
    fontSize: 14,
  },
  components: {
    Button: {
      borderRadius: 6,
    },
    Input: {
      borderRadius: 6,
    },
  },
};

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConfigProvider theme={theme} locale={zhCN}>
      {children}
    </ConfigProvider>
  );
}
```

### CSS 变量主题

```css
/* light.css */
:root {
  --color-bg-primary: #ffffff;
  --color-text-primary: rgba(0, 0, 0, 0.85);
}

/* dark.css */
[data-theme="dark"] {
  --color-bg-primary: #141414;
  --color-text-primary: rgba(255, 255, 255, 0.85);
}
```
