/**
 * NotificationTypeSection Component
 * 类型区块组件（可折叠）
 *
 * 特性:
 * - 按类型分区块显示
 * - 可折叠内容区（max-height 动画）
 * - 每个区块最多显示指定数量，其余折叠
 * - "查看全部"链接
 */

import { useState, useCallback, useMemo, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { SectionHeader } from './SectionHeader';
import { NotificationCard } from './NotificationCard';
import { CollapseSection } from './animations';
import type { NotificationTypeSectionProps } from '../types';

export const NotificationTypeSection = memo(function NotificationTypeSection({
  type,
  title,
  notifications,
  maxDisplay = 3,
  index = 0,
  onMarkRead,
  onDelete,
  className = '',
}: NotificationTypeSectionProps) {
  const { t } = useTranslation('notifications');
  const [expanded, setExpanded] = useState(true);
  const [showAll, setShowAll] = useState(false);

  // 是否有更多通知
  const hasMore = notifications.length > maxDisplay;

  // 显示的通知列表
  const displayNotifications = useMemo(() => {
    return showAll ? notifications : notifications.slice(0, maxDisplay);
  }, [notifications, showAll, maxDisplay]);

  // 切换展开/折叠
  const handleToggle = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  // 切换显示全部
  const handleShowAll = useCallback(() => {
    setShowAll((prev) => !prev);
  }, []);

  // 类型标题映射
  const getTypeTitle = useCallback((typeKey: string) => {
    const titles: Record<string, string> = {
      success: t('category.success'),
      error: t('category.error'),
      warning: t('category.warning'),
      info: t('category.info'),
      execution_completed: t('category.executionCompleted'),
      execution_failed: t('category.executionFailed'),
      system: t('category.system'),
      benchmark_created: t('category.benchmarkCreated'),
      agent_created: t('category.agentCreated'),
    };
    return titles[typeKey] || title;
  }, [title, t]);

  return (
    <div
      className={`notification-type-section ${className}`}
      style={{
        marginBottom: 24,
        animation: `sectionFadeIn 0.3s ease-out ${index * 0.1}s both`,
      }}
    >
      {/* 区块头部 */}
      <SectionHeader
        title={getTypeTitle(type)}
        count={notifications.length}
        type={type}
        expanded={expanded}
        onToggle={handleToggle}
      />

      {/* 可折叠内容区 */}
      <CollapseSection isOpen={expanded} duration={300}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* 通知卡片列表 */}
          {displayNotifications.map((notification, idx) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              index={idx}
              onMarkRead={onMarkRead}
              onDelete={onDelete}
            />
          ))}

          {/* 查看全部链接 */}
          {hasMore && (
            <button
              type="button"
              onClick={handleShowAll}
              style={{
                width: '100%',
                padding: '12px',
                fontSize: 13,
                fontWeight: 500,
                color: 'var(--notification-show-more-text, rgba(102, 126, 234, 0.85))',
                background: 'var(--notification-show-more-bg, rgba(102, 126, 234, 0.05))',
                borderWidth: '1px',
                borderStyle: 'dashed',
                borderColor: 'var(--notification-show-more-border, rgba(102, 126, 234, 0.2))',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textAlign: 'center',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--notification-show-more-hover-bg, rgba(102, 126, 234, 0.1))';
                e.currentTarget.style.borderColor = 'var(--notification-show-more-hover-border, rgba(102, 126, 234, 0.3))';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--notification-show-more-bg, rgba(102, 126, 234, 0.05))';
                e.currentTarget.style.borderColor = 'var(--notification-show-more-border, rgba(102, 126, 234, 0.2))';
              }}
            >
              {showAll
                ? t('section.collapse', { count: notifications.length - maxDisplay })
                : t('section.showAll', { count: notifications.length })}
            </button>
          )}

          {/* 空状态 */}
          {notifications.length === 0 && (
            <div
              style={{
                padding: '32px 16px',
                textAlign: 'center',
                color: 'var(--notification-text-secondary, rgba(255, 255, 255, 0.45))',
                fontSize: 13,
              }}
            >
              {t('section.emptyType')}
            </div>
          )}
        </div>
      </CollapseSection>
    </div>
  );
});

export default NotificationTypeSection;
