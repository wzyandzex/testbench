/**
 * NotificationCard Component
 * 通知卡片组件
 *
 * 特性:
 * - 图标 + 标题 + 消息 + 时间布局
 * - 未读/已读状态样式区分
 * - 悬停展开详情内容
 * - 点击跳转链接（如果有）
 * - 更多操作下拉菜单
 * - 扫除删除动画
 */

import { useState, useCallback, useMemo, memo } from 'react';
import { Dropdown, Button, Space } from 'antd';
import {
  CheckOutlined,
  DeleteOutlined,
  MoreOutlined,
  ArrowRightOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  BellOutlined,
  FileTextOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { useTranslation } from 'react-i18next';
import { SwipeToDelete, CardEnterAnimation } from './animations';
import type { NotificationCardProps } from '../types';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

// 类型配置
const TYPE_CONFIG = {
  success: {
    icon: <CheckOutlined />,
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  error: {
    icon: <CloseCircleOutlined />,
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  warning: {
    icon: <WarningOutlined />,
    color: '#f59e0b',
    bgColor: 'rgba(245, 158, 11, 0.1)',
    borderColor: 'rgba(245, 158, 11, 0.3)',
  },
  info: {
    icon: <InfoCircleOutlined />,
    color: '#1677ff',
    bgColor: 'rgba(22, 119, 255, 0.1)',
    borderColor: 'rgba(22, 119, 255, 0.3)',
  },
  execution_completed: {
    icon: <CheckOutlined />,
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  execution_failed: {
    icon: <CloseCircleOutlined />,
    color: '#ef4444',
    bgColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  system: {
    icon: <BellOutlined />,
    color: '#8b5cf6',
    bgColor: 'rgba(139, 92, 246, 0.1)',
    borderColor: 'rgba(139, 92, 246, 0.3)',
  },
  benchmark_created: {
    icon: <FileTextOutlined />,
    color: '#06b6d4',
    bgColor: 'rgba(6, 182, 212, 0.1)',
    borderColor: 'rgba(6, 182, 212, 0.3)',
  },
  agent_created: {
    icon: <RobotOutlined />,
    color: '#ec4899',
    bgColor: 'rgba(236, 72, 153, 0.1)',
    borderColor: 'rgba(236, 72, 153, 0.3)',
  },
};

export const NotificationCard = memo(function NotificationCard({
  notification,
  expanded = false,
  onExpandChange,
  onMarkRead,
  onDelete,
  index = 0,
  className = '',
}: NotificationCardProps) {
  const { t } = useTranslation('notifications');
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [isRemoving, setIsRemoving] = useState(false);

  const config = useMemo(() => {
    return TYPE_CONFIG[notification.type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.info;
  }, [notification.type]);

  const isUnread = notification.status === 'unread';

  // 格式化时间
  const timeAgo = useMemo(() => {
    return dayjs(notification.createdAt).fromNow();
  }, [notification.createdAt]);

  // 标记已读
  const handleMarkRead = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isUnread && onMarkRead) {
        onMarkRead(notification.id);
      }
    },
    [isUnread, notification.id, onMarkRead]
  );

  // 删除
  const handleDelete = useCallback(() => {
    setIsRemoving(true);
    setTimeout(() => {
      if (onDelete) {
        onDelete(notification.id);
      }
    }, 400);
  }, [notification.id, onDelete]);

  // 展开/折叠
  const handleExpand = useCallback(() => {
    const newState = !isExpanded;
    setIsExpanded(newState);
    if (onExpandChange) {
      onExpandChange(newState);
    }
  }, [isExpanded, onExpandChange]);

  // 点击卡片
  const handleCardClick = useCallback(() => {
    if (notification.link) {
      // 如果有链接，可以在这里处理导航
      window.location.href = notification.link;
    } else {
      handleExpand();
    }
  }, [notification.link, handleExpand]);

  // 更多操作菜单
  const moreMenuItems: MenuProps['items'] = useMemo(
    () => [
      {
        key: 'markRead',
        label: isUnread ? t('actions.markRead') : t('actions.markUnread'),
        icon: <CheckOutlined />,
        onClick: (e) => {
          e.domEvent.stopPropagation();
          if (onMarkRead) {
            onMarkRead(notification.id);
          }
        },
      },
      {
        type: 'divider',
      },
      {
        key: 'delete',
        label: t('actions.delete'),
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => {
          handleDelete();
        },
      },
    ],
    [isUnread, notification.id, onMarkRead, handleDelete, t]
  );

  return (
    <CardEnterAnimation index={index} delay={50}>
      <SwipeToDelete isDeleting={isRemoving}>
        <div
          className={`notification-card ${isUnread ? 'unread' : 'read'} ${isExpanded ? 'expanded' : ''} ${isRemoving ? 'removing' : ''} ${className}`}
          onClick={handleCardClick}
          style={{
            position: 'relative',
            padding: '16px',
            borderRadius: 12,
            background: isUnread
              ? 'var(--notification-card-unread-bg, rgba(102, 126, 234, 0.08))'
              : 'var(--notification-card-bg, rgba(26, 26, 26, 0.6))',
            border: isUnread
              ? '1px solid var(--notification-card-unread-border, rgba(102, 126, 234, 0.2))'
              : '1px solid var(--notification-card-border, rgba(255, 255, 255, 0.06))',
            cursor: notification.link ? 'pointer' : 'default',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            overflow: 'hidden',
          } as React.CSSProperties}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.borderColor = isUnread
              ? 'var(--notification-card-hover-border, rgba(102, 126, 234, 0.3))'
              : 'var(--notification-card-hover-border, rgba(102, 126, 234, 0.15))';
            e.currentTarget.style.boxShadow = isUnread
              ? '0 4px 20px rgba(102, 126, 234, 0.15)'
              : '0 2px 12px rgba(0, 0, 0, 0.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.borderColor = isUnread
              ? 'var(--notification-card-unread-border, rgba(102, 126, 234, 0.2))'
              : 'var(--notification-card-border, rgba(255, 255, 255, 0.06))';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          {/* 未读指示点 */}
          {isUnread && (
            <div
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: config.color,
                boxShadow: `0 0 8px ${config.color}`,
              }}
            />
          )}

          {/* 主要内容 */}
          <div style={{ display: 'flex', gap: 12, paddingLeft: isUnread ? 12 : 0 }}>
            {/* 图标 */}
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                background: config.bgColor,
                color: config.color,
                flexShrink: 0,
              }}
            >
              {config.icon}
            </div>

            {/* 内容区 */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {/* 标题行 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 8,
                  marginBottom: 4,
                }}
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: isUnread ? 600 : 500,
                    color: 'var(--notification-text, rgba(255, 255, 255, 0.95))',
                  }}
                >
                  {notification.title}
                </span>

                {/* 操作按钮 */}
                <Space size={4}>
                  {isUnread && onMarkRead && (
                    <Button
                      type="text"
                      size="small"
                      icon={<CheckOutlined />}
                      onClick={handleMarkRead}
                      style={{
                        fontSize: 12,
                        color: 'var(--notification-text-secondary, rgba(255, 255, 255, 0.55))',
                      }}
                    >
                      {t('actions.markRead')}
                    </Button>
                  )}
                  <Dropdown menu={{ items: moreMenuItems }} trigger={['click']}>
                    <Button
                      type="text"
                      size="small"
                      icon={<MoreOutlined />}
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        color: 'var(--notification-text-secondary, rgba(255, 255, 255, 0.55))',
                      }}
                    />
                  </Dropdown>
                </Space>
              </div>

              {/* 消息内容 */}
              <p
                style={{
                  margin: 0,
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: isUnread
                    ? 'var(--notification-text-secondary, rgba(255, 255, 255, 0.75))'
                    : 'var(--notification-text-secondary, rgba(255, 255, 255, 0.55))',
                  display: '-webkit-box',
                  WebkitLineClamp: isExpanded ? 'unset' : 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {notification.content}
              </p>

              {/* 时间和更多信息 */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 12,
                    color: 'var(--notification-text-tertiary, rgba(255, 255, 255, 0.4))',
                  }}
                >
                  {timeAgo}
                </span>

                {notification.link && (
                  <span
                    style={{
                      fontSize: 12,
                      color: config.color,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {t('actions.viewDetail')} <ArrowRightOutlined style={{ fontSize: 10 }} />
                  </span>
                )}
              </div>

              {/* 展开内容区域（可选） */}
              {isExpanded && (
                <div
                  style={{
                    marginTop: 12,
                    paddingTop: 12,
                    borderTop: '1px solid var(--notification-expand-border, rgba(255, 255, 255, 0.06))',
                    fontSize: 13,
                    color: 'var(--notification-text-secondary, rgba(255, 255, 255, 0.65))',
                  }}
                >
                  {/* 这里可以放置额外的详情内容 */}
                  <p>{t('section.detailPlaceholder')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </SwipeToDelete>
    </CardEnterAnimation>
  );
});

export default NotificationCard;
