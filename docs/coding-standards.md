# 代码风格规范

本文档定义了项目中的代码风格规范，确保代码一致性和可维护性。

## 导入顺序

文件中的导入语句应按照以下顺序排列：

```tsx
// 1. 第三方库
import { useState, useEffect } from 'react';
import { Button, Form } from 'antd';
import { useNavigate } from 'react-router-dom';

// 2. @/ 别名导入（项目内部模块）
import { useAuthStore } from '@/stores/authStore';
import { logger } from '@/utils';
import type { User } from '@/types';

// 3. 相对路径导入
import { MyComponent } from './components/MyComponent';
import { myLocalUtil } from './utils';
import './styles.css';
```

## 组件声明

使用函数声明 + 默认导出：

```tsx
// ✅ 推荐
export default function MyComponent({ prop }: Props) {
  // ...
}

// ✅ 也接受（需要函数名）
const MyComponent = function({ prop }: Props) {
  // ...
};
export default MyComponent;

// ❌ 避免（匿名函数）
export default function({ prop }: Props) {
  // ...
}
```

## 变量声明

```tsx
// ✅ 使用 const 声明组件和常量
const MyComponent = () => { ... };
const CONFIG = { ... };

// ✅ 使用 let 声明需要重新赋值的变量
let count = 0;
count += 1;

// ❌ 避免 var
```

## 样式处理

```tsx
// ✅ 简单样式使用内联 style
<div style={{ padding: 16, background: '#fff' }}>

// ✅ 复杂样式抽取到 style.ts
import { cardStyle } from './style';

// ✅ 动态样式使用模板字符串
<div style={{ color: isActive ? '#000' : '#999' }}>

// ❌ 避免在页面中写 <style> 标签（全局样式除外）
```

## 类型定义

```tsx
// ✅ Props 接口使用 PascalCase
interface MyComponentProps {
  title: string;
  count?: number;
  onSubmit: () => void;
}

// ✅ 事件处理器命名以 on 开头
const handleSubmit = () => { ... };
const handleClick = () => { ... };

// ✅ 布尔值命名以 is/has/can 开头
const isLoading = false;
const hasError = true;
const canSubmit = true;
```

## 日志和错误处理

```tsx
// ✅ 使用统一日志工具
import { logger } from '@/utils';

logger.info('操作成功');
logger.error('操作失败', error);
logger.userAction('click_button', { buttonId: 'submit' });

// ❌ 避免直接使用 console
console.log('message'); // 不要使用
```

## 异步处理

```tsx
// ✅ 使用 async/await
async function fetchData() {
  try {
    const result = await api.get('/data');
    return result;
  } catch (error) {
    logger.error('获取数据失败', error);
    throw error;
  }
}

// ✅ Promise 链式处理
fetchData()
  .then(data => processData(data))
  .catch(error => logger.error('处理失败', error));
```

## 条件渲染

```tsx
// ✅ 短条件
{isLoading && <Loading />}

// ✅ 三元表达式
{isLoggedIn ? <Dashboard /> : <Login />}

// ✅ 复杂逻辑抽取为变量
const showButton = isLoggedIn && hasPermission;
{showButton && <Button />}

// ❌ 避免在 JSX 中写复杂逻辑
{isLoggedIn && hasPermission && isAdmin && <Button />}
```

## 列表渲染

```tsx
// ✅ 带有 key 和解包
{items.map(item => (
  <Item key={item.id} {...item} />
))}

// ✅ 使用索引作为 key（仅当列表静态时）
{items.map((item, index) => (
  <div key={index}>{item.name}</div>
))}
```

## Hooks 规则

```tsx
// ✅ 自定义 Hook 以 use 开头
export function useRequest<T>(apiFunc: () => Promise<T>) { ... }

// ✅ Hooks 在组件顶层调用
function MyComponent() {
  const [state, setState] = useState();
  useEffect(() => { ... });
  // ...
}

// ❌ 不要在条件、循环中使用 Hooks
if (condition) {
  useState(); // 错误！
}
```

## 文件命名

```
// ✅ 组件文件使用 PascalCase
MyComponent.tsx
UserProfile.tsx

// ✅ 工具文件使用 camelCase
formatUtils.ts
apiClient.ts

// ✅ 样式文件与组件同名
MyComponent.style.ts

// ✅ 类型文件使用小写
types/user.ts
```

## 注释规范

```tsx
/**
 * 组件功能描述
 * @param props - 组件属性
 */
function MyComponent(props: Props) {
  // 单行注释：解释复杂逻辑
  const result = data.filter(item => item.isActive);

  /*
   * 多行注释：解释复杂算法
   * 第一步：xxx
   * 第二步：xxx
   */
}
```

## Ant Design 使用规范

```tsx
// ✅ Button 类型使用
<Button type="primary">主要操作</Button>
<Button type="default">次要操作</Button>
<Button type="text" icon={<Icon />}>图标按钮</Button>
<Button danger>危险操作</Button>

// ✅ Form 布局
<Form layout="vertical">
  <Form.Item label="名称" name="name" rules={[{ required: true }]}>
    <Input />
  </Form.Item>
</Form>

// ✅ Table 配置
<Table
  rowKey="id"
  pagination={{ showTotal: (total) => `共 ${total} 条` }}
  columns={columns}
  dataSource={data}
/>
```
