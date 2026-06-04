/**
 * NotificationCardExpanded Component
 * 通知卡片展开详情组件
 *
 * 特性:
 * - 显示通知的完整详情
 * - 支持自定义渲染内容
 * - 可折叠动画
 */

import { memo, ReactNode } from 'react';
import { CollapseSection } from './animations';

interface NotificationCardExpandedProps {
  isOpen: boolean;
  children: ReactNode;
  className?: string;
}

export const NotificationCardExpanded = memo(function NotificationCardExpanded({
  isOpen,
  children,
  className = '',
}: NotificationCardExpandedProps) {
  return (
    <CollapseSection isOpen={isOpen} duration={300} className={className}>
      <div
        style={{
          marginTop: 12,
          paddingTop: 12,
          borderTop: '1px solid var(--notification-expand-border, rgba(255, 255, 255, 0.06))',
          fontSize: 13,
          color: 'var(--notification-text-secondary, rgba(255, 255, 255, 0.65))',
        }}
      >
        {children}
      </div>
    </CollapseSection>
  );
});

export default NotificationCardExpanded;
