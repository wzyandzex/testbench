/**
 * NotificationWaterfall Component
 * 瀑布流容器组件
 *
 * 特性:
 * - 按类型分区块显示通知
 * - 2列响应式布局
 * - 每个区块可独立折叠
 * - 自动排序（按未读数量和时间）
 */

import { memo, useMemo } from 'react';
import { BellOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { NotificationTypeSection } from './NotificationTypeSection';
import type { NotificationWaterfallProps } from '../types';

// 类型排序顺序（按重要性）
const TYPE_ORDER = [
  'error',
  'execution_failed',
  'warning',
  'success',
  'execution_completed',
  'agent_created',
  'benchmark_created',
  'info',
  'system',
];

export const NotificationWaterfall = memo(function NotificationWaterfall({
  groupedNotifications,
  onMarkRead,
  onDelete,
  className = '',
}: NotificationWaterfallProps) {
  const { t } = useTranslation('notifications');

  // 类型标题映射
  const TYPE_TITLES: Record<string, string> = useMemo(() => ({
    success: t('category.success'),
    error: t('category.error'),
    warning: t('category.warning'),
    info: t('category.info'),
    execution_completed: t('category.executionCompleted'),
    execution_failed: t('category.executionFailed'),
    system: t('category.system'),
    benchmark_created: t('category.benchmarkCreated'),
    agent_created: t('category.agentCreated'),
  }), [t]);

  // 获取有通知的类型列表（按排序顺序）
  const sortedTypes = useMemo(() => {
    const types = Object.keys(groupedNotifications).filter(
      (type) => groupedNotifications[type]?.length > 0
    );

    return types.sort((a, b) => {
      const indexA = TYPE_ORDER.indexOf(a);
      const indexB = TYPE_ORDER.indexOf(b);

      // 如果都在顺序列表中，按顺序排序
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }

      // 如果只有一个在顺序列表中，在列表中的排前面
      if (indexA !== -1) return -1;
      if (indexB !== -1) return 1;

      // 都不在列表中，按未读数量排序
      const unreadA = groupedNotifications[a].filter((n) => n.status === 'unread').length;
      const unreadB = groupedNotifications[b].filter((n) => n.status === 'unread').length;
      return unreadB - unreadA;
    });
  }, [groupedNotifications]);

  return (
    <div
      className={`notification-waterfall ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))',
        gap: 24,
        alignItems: 'start',
      }}
    >
      {sortedTypes.map((type, index) => {
        const notifications = groupedNotifications[type];

        return (
          <NotificationTypeSection
            key={type}
            type={type}
            title={TYPE_TITLES[type] || type}
            notifications={notifications}
            index={index}
            onMarkRead={onMarkRead}
            onDelete={onDelete}
          />
        );
      })}

      {/* 空状态 */}
      {sortedTypes.length === 0 && (
        <div
          style={{
            gridColumn: '1 / -1',
            padding: '48px 24px',
            textAlign: 'center',
            color: 'var(--notification-text-secondary, rgba(255, 255, 255, 0.45))',
          }}
        >
          <div
            style={{
              fontSize: 48,
              marginBottom: 16,
              opacity: 0.5,
            }}
          >
            <BellOutlined />
          </div>
          <p style={{ fontSize: 14, margin: 0 }}>{t('section.emptyAll')}</p>
        </div>
      )}
    </div>
  );
});

export default NotificationWaterfall;
