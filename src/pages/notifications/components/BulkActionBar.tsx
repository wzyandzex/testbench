/**
 * BulkActionBar Component
 * 批量操作栏组件
 *
 * 特性:
 * - 显示已选择数量
 * - 批量标为已读
 * - 批量删除
 * - 清空选择
 * - 滑入动画
 */

import { memo } from 'react';
import { Button, Space, message } from 'antd';
import {
  CheckOutlined,
  DeleteOutlined,
  CloseOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { BulkActionBarProps } from '../types';

export const BulkActionBar = memo(function BulkActionBar({
  selectedCount,
  onBulkMarkRead,
  onBulkDelete,
  onClearSelection,
  className = '',
}: BulkActionBarProps) {
  const { t } = useTranslation('notifications');
  if (selectedCount === 0) return null;

  const handleBulkMarkRead = () => {
    message.success(t('actions.markedReadSuccess', { count: selectedCount }));
    onBulkMarkRead();
  };

  const handleBulkDelete = () => {
    message.success(t('actions.deletedSuccess', { count: selectedCount }));
    onBulkDelete();
  };

  return (
    <div
      className={`bulk-action-bar ${className}`}
      style={{
        position: 'sticky',
        bottom: 24,
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px',
        borderRadius: 12,
        background: 'var(--notification-bulk-bar-bg, rgba(102, 126, 234, 0.15))',
        border: '1px solid var(--notification-bulk-bar-border, rgba(102, 126, 234, 0.3))',
        backdropFilter: 'blur(20px)',
        boxShadow: '0 4px 20px rgba(102, 126, 234, 0.2)',
        animation: 'bulkBarSlideUp 0.3s ease-out',
      }}
    >
      {/* 左侧：已选择数量 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: 'var(--notification-text, rgba(255, 255, 255, 0.95))',
          }}
        >
          {t('actions.selectedPrefix')}
        </span>
        <span
          style={{
            fontSize: 16,
            fontWeight: 700,
            color: '#667eea',
          }}
        >
          {selectedCount}
        </span>
        <span
          style={{
            fontSize: 14,
            color: 'var(--notification-text-secondary, rgba(255, 255, 255, 0.55))',
          }}
        >
          {t('actions.selectedCountSuffix')}
        </span>
      </div>

      {/* 右侧：操作按钮 */}
      <Space>
        <Button
          icon={<CloseOutlined />}
          onClick={onClearSelection}
          style={{
            borderRadius: 8,
          }}
        >
          {t('actions.cancelSelection')}
        </Button>
        <Button
          icon={<CheckOutlined />}
          onClick={handleBulkMarkRead}
          style={{
            borderRadius: 8,
          }}
        >
          {t('actions.bulkMarkRead')}
        </Button>
        <Button
          danger
          icon={<DeleteOutlined />}
          onClick={handleBulkDelete}
          style={{
            borderRadius: 8,
          }}
        >
          {t('actions.delete')}
        </Button>
      </Space>
    </div>
  );
});

export default BulkActionBar;
