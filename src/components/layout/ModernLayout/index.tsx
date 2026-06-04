import { Suspense, memo } from 'react';
import { Spin } from 'antd';
import { useUiStore } from '@/stores';
import { DarkLayout } from './DarkLayout';
import { LightLayout } from './LightLayout';

interface ModernLayoutProps {
  children: React.ReactNode;
}

// 加载中组件
const PageLoading = () => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
    }}
  >
    <Spin size="large" />
  </div>
);

/**
 * 现代布局组件
 * 根据当前主题自动切换暗色/亮色布局
 */
export const ModernLayout = memo<ModernLayoutProps>(({ children }) => {
  const theme = useUiStore((s) => s.theme);

  // 根据主题选择布局
  const Layout = theme === 'dark' ? DarkLayout : LightLayout;

  return (
    <Suspense fallback={<PageLoading />}>
      <Layout>
        {children}
      </Layout>
    </Suspense>
  );
});

ModernLayout.displayName = 'ModernLayout';

// 默认导出用于 lazy loading
export default ModernLayout;

// 导出子布局供外部使用
export { DarkLayout } from './DarkLayout/index';
export { LightLayout } from './LightLayout/index';
