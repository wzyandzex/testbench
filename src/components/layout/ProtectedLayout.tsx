import { Outlet } from 'react-router-dom';
import { AppLayout } from './AppLayout';
import { ModernLayout } from './ModernLayout';
import { GlobalWSListener } from './GlobalWSListener';
import { Suspense } from 'react';
import { Spin } from 'antd';
import { useUiStore } from '@/stores';
import { RouteErrorBoundary } from '@/components/common/RouteErrorBoundary';

export function ProtectedLayout() {
  const layoutMode = useUiStore((s) => s.layoutMode);

  const LayoutComponent = layoutMode === 'modern' ? ModernLayout : AppLayout;

  return (
    <>
      <GlobalWSListener />
      <LayoutComponent>
        <RouteErrorBoundary>
          <Suspense
            fallback={
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <Spin />
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </RouteErrorBoundary>
      </LayoutComponent>
    </>
  );
}

export default ProtectedLayout;
