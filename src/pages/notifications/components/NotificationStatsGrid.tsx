/**
 * NotificationStatsGrid Component
 * 统计网格容器组件
 *
 * 特性:
 * - 响应式布局（4列 → 2列 → 1列）
 * - 水平瀑布流布局
 * - 每个卡片带入场动画
 */

import { memo, useMemo, useState, useCallback } from 'react';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  BellOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { NotificationStatCard } from './NotificationStatCard';
import { CardEnterAnimation } from './animations';
import type { NotificationStatsGridProps } from '../types';

export const NotificationStatsGrid = memo(function NotificationStatsGrid({
  stats,
  trends,
  className = '',
}: NotificationStatsGridProps) {
  const { t } = useTranslation('notifications');
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  // 类型配置
  const TYPE_CONFIG = useMemo(() => ({
    unread: {
      title: t('stats.unread'),
      icon: <BellOutlined />,
      color: '#667eea',
    },
    success: {
      title: t('type.success'),
      icon: <CheckCircleOutlined />,
      color: '#10b981',
    },
    error: {
      title: t('type.error'),
      icon: <CloseCircleOutlined />,
      color: '#ef4444',
    },
    warning: {
      title: t('type.warning'),
      icon: <WarningOutlined />,
      color: '#f59e0b',
    },
    info: {
      title: t('type.info'),
      icon: <InfoCircleOutlined />,
      color: '#1677ff',
    },
  }), [t]);

  // 统计卡片数据
  const cards = useMemo(() => {
    return [
      {
        key: 'unread',
        title: TYPE_CONFIG.unread.title,
        value: stats.unread,
        icon: TYPE_CONFIG.unread.icon,
        color: TYPE_CONFIG.unread.color,
        trend: trends?.unread,
      },
      {
        key: 'success',
        title: TYPE_CONFIG.success.title,
        value: stats.success,
        icon: TYPE_CONFIG.success.icon,
        color: TYPE_CONFIG.success.color,
        trend: trends?.success,
      },
      {
        key: 'error',
        title: TYPE_CONFIG.error.title,
        value: stats.error,
        icon: TYPE_CONFIG.error.icon,
        color: TYPE_CONFIG.error.color,
        trend: trends?.error,
      },
      {
        key: 'warning',
        title: TYPE_CONFIG.warning.title,
        value: stats.warning,
        icon: TYPE_CONFIG.warning.icon,
        color: TYPE_CONFIG.warning.color,
        trend: trends?.warning,
      },
      {
        key: 'info',
        title: TYPE_CONFIG.info.title,
        value: stats.info,
        icon: TYPE_CONFIG.info.icon,
        color: TYPE_CONFIG.info.color,
        trend: trends?.info,
      },
    ];
  }, [stats, trends, TYPE_CONFIG]);

  const handleCardClick = useCallback((key: string) => {
    setActiveFilter(activeFilter === key ? null : key);
  }, [activeFilter]);

  return (
    <div
      className={`notification-stats-grid ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 16,
        marginBottom: 32,
      }}
    >
      {cards.map((card, index) => (
        <CardEnterAnimation key={card.key} index={index} delay={80}>
          <NotificationStatCard
            title={card.title}
            value={card.value}
            icon={card.icon}
            color={card.color}
            trend={card.trend}
            onClick={() => handleCardClick(card.key)}
            active={activeFilter === card.key}
          />
        </CardEnterAnimation>
      ))}
    </div>
  );
});

export default NotificationStatsGrid;
