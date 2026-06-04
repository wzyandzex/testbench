/**
 * NotificationTimeline Component
 * 时间轴容器 - 管理通知设置的时间轴布局
 */

import { memo, ReactNode, useRef, useEffect } from 'react';

export interface NotificationTimelineProps {
  children: ReactNode;
  className?: string;
}

export const NotificationTimeline = memo(function NotificationTimeline({
  children,
  className = '',
}: NotificationTimelineProps) {
  const timelineRef = useRef<HTMLDivElement>(null);

  // 添加 staggered 动画延迟
  useEffect(() => {
    if (timelineRef.current) {
      const items = timelineRef.current.querySelectorAll('.notification-timeline-item');
      items.forEach((item, index) => {
        (item as HTMLElement).style.setProperty('--timeline-index', String(index));
      });
    }
  }, [children]);

  return (
    <div ref={timelineRef} className={`notification-timeline ${className}`}>
      {children}
    </div>
  );
});

export default NotificationTimeline;
