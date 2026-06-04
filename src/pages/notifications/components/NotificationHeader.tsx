/**
 * NotificationHeader Component
 * 页面头部组件
 *
 * 特性:
 * - 标题 + 描述
 * - 全部标为已读按钮
 * - 清空全部按钮
 * - 未读数量徽标
 */

import { memo } from 'react';
import { Button, Space, Badge } from 'antd';
import {
  CheckOutlined,
  DeleteOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { NotificationHeaderProps } from '../types';

export const NotificationHeader = memo(function NotificationHeader({
  title,
  description,
  unreadCount,
  totalCount,
  onMarkAllRead,
  onClearAll,
  className = '',
}: NotificationHeaderProps) {
  const { t } = useTranslation('notifications');
  const titleText = title ?? t('title');
  const descriptionText = description ?? t('description');
  return (
    <div
      className={`notification-header ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
        padding: '20px 24px',
        borderRadius: 16,
        background: 'var(--notification-header-bg, rgba(26, 26, 26, 0.6))',
        border: '1px solid var(--notification-header-border, rgba(255, 255, 255, 0.08))',
      }}
    >
      {/* 左侧：标题和描述 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* 图标徽标 */}
        <div
          style={{
            position: 'relative',
            width: 48,
            height: 48,
            borderRadius: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            background: 'var(--notification-header-icon-bg, rgba(102, 126, 234, 0.15))',
            color: 'var(--notification-header-icon-color, #667eea)',
          }}
        >
          <BellOutlined />
          {unreadCount > 0 && (
            <Badge
              count={unreadCount > 99 ? '99+' : unreadCount}
              style={{
                position: 'absolute',
                top: -4,
                right: -4,
              }}
            />
          )}
        </div>

        {/* 标题和描述 */}
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: 'var(--notification-text, rgba(255, 255, 255, 0.95))',
            }}
          >
            {titleText}
          </h2>
          <p
            style={{
              margin: '4px 0 0 0',
              fontSize: 13,
              color: 'var(--notification-text-secondary, rgba(255, 255, 255, 0.55))',
            }}
          >
            {descriptionText}
          </p>
        </div>
      </div>

      {/* 右侧：操作按钮 */}
      <Space>
        <Button
          icon={<CheckOutlined />}
          onClick={onMarkAllRead}
          disabled={unreadCount === 0}
          style={{
            borderRadius: 8,
          }}
        >
          {t('actions.markAllRead')}
        </Button>
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={onClearAll}
          disabled={totalCount === 0}
          style={{
            borderRadius: 8,
          }}
        >
          {t('actions.clearAll')}
        </Button>
      </Space>
    </div>
  );
});

export default NotificationHeader;
