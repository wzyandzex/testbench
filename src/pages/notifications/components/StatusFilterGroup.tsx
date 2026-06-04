/**
 * StatusFilterGroup Component
 * 状态筛选组组件
 *
 * 特性:
 * - Segmented 风格
 * - 全部/未读/已读 三个选项
 * - 显示数量徽标
 */

import { memo, useCallback, useMemo } from 'react';
import { Badge } from 'antd';
import { useTranslation } from 'react-i18next';
import type { StatusFilterGroupProps } from '../types';

export const StatusFilterGroup = memo(function StatusFilterGroup({
  activeStatus,
  onChange,
  counts,
  className = '',
}: StatusFilterGroupProps) {
  const { t } = useTranslation('notifications');

  const STATUS_OPTIONS = useMemo(() => ([
    { key: 'all' as const, label: t('filter.all') },
    { key: 'unread' as const, label: t('filter.unread') },
    { key: 'read' as const, label: t('filter.read') },
  ]), [t]);

  const handleStatusChange = useCallback(
    (status: 'all' | 'unread' | 'read') => {
      onChange(status);
    },
    [onChange]
  );

  return (
    <div
      className={`status-filter-group ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}
    >
      {STATUS_OPTIONS.map((option) => {
        const isActive = activeStatus === option.key;
        const count = counts[option.key];

        return (
          <button
            key={option.key}
            type="button"
            onClick={() => handleStatusChange(option.key)}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              fontSize: 14,
              fontWeight: isActive ? 600 : 500,
              borderRadius: 8,
              border: '1px solid transparent',
              background: isActive
                ? 'var(--notification-filter-active-bg, rgba(102, 126, 234, 0.15))'
                : 'transparent',
              borderColor: isActive
                ? 'var(--notification-filter-active-border, rgba(102, 126, 234, 0.3))'
                : 'transparent',
              color: isActive
                ? 'var(--notification-filter-active-text, rgba(255, 255, 255, 0.95))'
                : 'var(--notification-filter-text, rgba(255, 255, 255, 0.55))',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'var(--notification-filter-hover-bg, rgba(255, 255, 255, 0.05))';
              }
            }}
            onMouseLeave={(e) => {
              if (!isActive) {
                e.currentTarget.style.background = 'transparent';
              }
            }}
          >
            {option.label}
            <Badge
              count={count}
              showZero
              style={{
                background: isActive
                  ? 'var(--notification-badge-bg, #667eea)'
                  : 'var(--notification-badge-inactive-bg, rgba(255, 255, 255, 0.2))',
                fontSize: 11,
                height: 18,
                lineHeight: '18px',
                padding: '0 6px',
                borderRadius: 9,
                minWidth: 20,
              }}
            />
          </button>
        );
      })}
    </div>
  );
});

export default StatusFilterGroup;
