/**
 * Notification Page Component Types
 * 通知页面组件类型定义
 */

import type { ReactNode, CSSProperties } from 'react';

// ========== AnimatedCounter Props ==========
export interface AnimatedCounterProps {
  /** 目标数值 */
  value: number;
  /** 动画时长（毫秒）*/
  duration?: number;
  /** 是否格式化（千分位）*/
  format?: boolean;
  /** 前缀 */
  prefix?: string;
  /** 后缀 */
  suffix?: string;
  /** 自定义类名 */
  className?: string;
  /** 自定义样式 */
  style?: CSSProperties;
}

// ========== CollapseSection Props ==========
export interface CollapseSectionProps {
  /** 是否展开 */
  isOpen: boolean;
  /** 子元素 */
  children: ReactNode;
  /** 动画时长（毫秒）*/
  duration?: number;
  /** 自定义类名 */
  className?: string;
}

// ========== SwipeToDelete Props ==========
export interface SwipeToDeleteProps {
  /** 子元素 */
  children: ReactNode;
  /** 是否正在删除 */
  isDeleting?: boolean;
  /** 自定义类名 */
  className?: string;
}

// ========== CardEnterAnimation Props ==========
export interface CardEnterAnimationProps {
  /** 子元素 */
  children: ReactNode;
  /** 索引（用于计算延迟）*/
  index?: number;
  /** 每个索引的延迟增量（毫秒）*/
  delay?: number;
  /** 动画时长（毫秒）*/
  duration?: number;
  /** 自定义类名 */
  className?: string;
}

// ========== NotificationStatCard Props ==========
export interface NotificationStatCardProps {
  /** 标题 */
  title: string;
  /** 数值 */
  value: number;
  /** 图标 */
  icon: ReactNode;
  /** 颜色 */
  color: string;
  /** 趋势百分比（可选）*/
  trend?: number;
  /** 点击回调 */
  onClick?: () => void;
  /** 是否激活 */
  active?: boolean;
  /** 自定义类名 */
  className?: string;
}

// ========== NotificationStatsGrid Props ==========
export interface NotificationStatsGridProps {
  /** 统计数据 */
  stats: {
    unread: number;
    success: number;
    error: number;
    warning: number;
    info: number;
  };
  /** 趋势数据（可选）*/
  trends?: {
    unread?: number;
    success?: number;
    error?: number;
    warning?: number;
    info?: number;
  };
  /** 自定义类名 */
  className?: string;
}

// ========== StatusFilterGroup Props ==========
export interface StatusFilterGroupProps {
  /** 当前激活的状态 */
  activeStatus: 'all' | 'unread' | 'read';
  /** 状态变更回调 */
  onChange: (status: 'all' | 'unread' | 'read') => void;
  /** 各状态数量 */
  counts: {
    all: number;
    unread: number;
    read: number;
  };
  /** 自定义类名 */
  className?: string;
}

// ========== TypeFilterChips Props ==========
export interface TypeFilterChipsProps {
  /** 当前激活的类型 */
  activeTypes: string[];
  /** 类型变更回调 */
  onChange: (types: string[]) => void;
  /** 可选类型列表 */
  availableTypes?: string[];
  /** 自定义类名 */
  className?: string;
}

// ========== NotificationFilterBar Props ==========
export interface NotificationFilterBarProps {
  /** 状态筛选值 */
  statusFilter: 'all' | 'unread' | 'read';
  /** 状态变更回调 */
  onStatusChange: (status: 'all' | 'unread' | 'read') => void;
  /** 类型筛选值 */
  typeFilter: string[];
  /** 类型变更回调 */
  onTypeChange: (types: string[]) => void;
  /** 数量统计 */
  counts: {
    all: number;
    unread: number;
    read: number;
    byType: Record<string, number>;
  };
  /** 自定义类名 */
  className?: string;
}

// ========== NotificationCard Props ==========
export interface NotificationCardProps {
  /** 通知数据 */
  notification: {
    id: string;
    type: string;
    status: 'unread' | 'read' | 'archived';
    title: string;
    content: string;
    createdAt: Date | string;
    link?: string;
  };
  /** 是否展开 */
  expanded?: boolean;
  /** 展开/折叠回调 */
  onExpandChange?: (expanded: boolean) => void;
  /** 标记已读回调 */
  onMarkRead?: (id: string) => void;
  /** 删除回调 */
  onDelete?: (id: string) => void;
  /** 索引（用于动画延迟）*/
  index?: number;
  /** 自定义类名 */
  className?: string;
}

// ========== SectionHeader Props ==========
export interface SectionHeaderProps {
  /** 标题 */
  title: string;
  /** 数量 */
  count: number;
  /** 类型 */
  type: string;
  /** 是否展开 */
  expanded: boolean;
  /** 展开/折叠回调 */
  onToggle: () => void;
  /** 自定义类名 */
  className?: string;
}

// ========== NotificationTypeSection Props ==========
export interface NotificationTypeSectionProps {
  /** 类型 */
  type: string;
  /** 标题 */
  title: string;
  /** 通知列表 */
  notifications: Array<{
    id: string;
    type: string;
    status: 'unread' | 'read' | 'archived';
    title: string;
    content: string;
    createdAt: Date | string;
    link?: string;
  }>;
  /** 最大显示数量 */
  maxDisplay?: number;
  /** 区块索引（用于动画）*/
  index?: number;
  /** 标记已读回调 */
  onMarkRead?: (id: string) => void;
  /** 删除回调 */
  onDelete?: (id: string) => void;
  /** 自定义类名 */
  className?: string;
}

// ========== NotificationWaterfall Props ==========
export interface NotificationWaterfallProps {
  /** 通知列表（按类型分组）*/
  groupedNotifications: Record<string, Array<{
    id: string;
    type: string;
    status: 'unread' | 'read' | 'archived';
    title: string;
    content: string;
    createdAt: Date | string;
    link?: string;
  }>>;
  /** 折叠状态管理 */
  collapsedSections: Record<string, boolean>;
  /** 展开/折叠回调 */
  onToggleSection?: (type: string) => void;
  /** 标记已读回调 */
  onMarkRead?: (id: string) => void;
  /** 删除回调 */
  onDelete?: (id: string) => void;
  /** 自定义类名 */
  className?: string;
}

// ========== NotificationHeader Props ==========
export interface NotificationHeaderProps {
  /** 标题 */
  title?: string;
  /** 描述 */
  description?: string;
  /** 未读数量 */
  unreadCount: number;
  /** 总数量 */
  totalCount: number;
  /** 全部标为已读回调 */
  onMarkAllRead: () => void;
  /** 清空全部回调 */
  onClearAll: () => void;
  /** 自定义类名 */
  className?: string;
}

// ========== BulkActionBar Props ==========
export interface BulkActionBarProps {
  /** 已选择数量 */
  selectedCount: number;
  /** 批量操作回调 */
  onBulkMarkRead: () => void;
  onBulkDelete: () => void;
  /** 清空选择回调 */
  onClearSelection: () => void;
  /** 自定义类名 */
  className?: string;
}
