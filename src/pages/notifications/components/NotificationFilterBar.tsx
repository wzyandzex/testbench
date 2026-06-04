/**
 * NotificationFilterBar Component
 * 筛选栏容器组件
 *
 * 特性:
 * - 状态筛选（全部/未读/已读）
 * - 类型筛选（Chips 风格）
 * - 响应式布局
 */

import { memo } from 'react';
import { StatusFilterGroup } from './StatusFilterGroup';
import { TypeFilterChips } from './TypeFilterChips';
import type { NotificationFilterBarProps } from '../types';

export const NotificationFilterBar = memo(function NotificationFilterBar({
  statusFilter,
  onStatusChange,
  typeFilter,
  onTypeChange,
  counts,
  className = '',
}: NotificationFilterBarProps) {
  return (
    <div
      className={`notification-filter-bar ${className}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        marginBottom: 24,
        padding: '16px 20px',
        borderRadius: 12,
        background: 'var(--notification-filter-bg, rgba(26, 26, 26, 0.4))',
        border: '1px solid var(--notification-filter-border, rgba(255, 255, 255, 0.06))',
      }}
    >
      {/* 状态筛选 */}
      <StatusFilterGroup
        activeStatus={statusFilter}
        onChange={onStatusChange}
        counts={{
          all: counts.all,
          unread: counts.unread,
          read: counts.read,
        }}
      />

      {/* 类型筛选 */}
      <TypeFilterChips
        activeTypes={typeFilter}
        onChange={onTypeChange}
        countsByType={counts.byType}
      />
    </div>
  );
});

export default NotificationFilterBar;
