/**
 * ForkUpdateBadge - Fork 更新通知徽章组件
 * 当父题目有更新时显示提示
 */

import { memo, useCallback } from 'react';
import { Badge, Tooltip, Button, Space } from 'antd';
import {
  SyncOutlined,
  EyeOutlined,
  CheckOutlined,
  BranchesOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { BenchmarkFork, BenchmarkForkItem } from '@/types';

interface ForkUpdateBadgeProps {
  /** Fork 数据 */
  fork: BenchmarkFork | BenchmarkForkItem;
  /** 显示模式 */
  mode?: 'badge' | 'button';
  /** 查看更新回调 */
  onViewUpdate?: () => void;
  /** 同步更新回调 */
  onSync?: () => void;
  /** 标记已读回调 */
  onMarkSeen?: (forkId: string) => void;
  /** 自定义样式 */
  style?: React.CSSProperties;
  /** 自定义类名 */
  className?: string;
}

/**
 * ForkUpdateBadge 组件
 *
 * 功能：
 * - 显示父题目是否有更新
 * - 提供查看更新、同步更新、标记已读等操作
 * - 已查看后隐藏徽章
 */
export const ForkUpdateBadge = memo(function ForkUpdateBadge({
  fork,
  mode = 'badge',
  onViewUpdate,
  onSync,
  onMarkSeen,
  style,
  className,
}: ForkUpdateBadgeProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('benchmarks');

  // 如果没有更新或已查看，不显示徽章
  if (!fork.has_parent_updates || fork.parent_updates_seen) {
    return null;
  }

  const handleViewUpdate = useCallback(() => {
    onViewUpdate?.();
    // 可以跳转到父题目详情页对比差异
    if (fork.parent_id) {
      navigate(`/benchmarks/${fork.parent_id}`);
    }
  }, [fork.parent_id, navigate, onViewUpdate]);

  const handleMarkSeen = useCallback(() => {
    onMarkSeen?.(fork.id);
  }, [fork.id, onMarkSeen]);

  const handleSync = useCallback(() => {
    onSync?.();
  }, [onSync]);

  // Badge 模式：简单的徽章显示
  if (mode === 'badge') {
    return (
      <Tooltip title={t('components.fork.badge.tooltipHasUpdate')}>
        <Badge
          status="warning"
          text={
            <span
              onClick={handleViewUpdate}
              style={{ cursor: 'pointer', fontSize: 12 }}
            >
              {t('components.fork.badge.hasUpdate')}
            </span>
          }
          style={style}
          className={className}
        />
      </Tooltip>
    );
  }

  // Button 模式：带操作按钮的完整显示
  return (
    <div
      style={{
        padding: '8px 12px',
        background: '#fff7e6',
        border: '1px solid #ffd591',
        borderRadius: 6,
        ...style,
      }}
      className={className}
    >
      <Space size="small">
        <Badge status="warning" text={t('components.fork.badge.hasUpdate')} />
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={handleViewUpdate}
        >
          {t('components.fork.badge.view')}
        </Button>
        <Button
          type="link"
          size="small"
          icon={<SyncOutlined />}
          onClick={handleSync}
        >
          {t('components.fork.badge.sync')}
        </Button>
        <Button
          type="link"
          size="small"
          icon={<CheckOutlined />}
          onClick={handleMarkSeen}
        >
          {t('components.fork.badge.ignore')}
        </Button>
      </Space>
    </div>
  );
});

/**
 * ForkStatusBadge - 显示 Fork 关系状态的徽章
 */
interface ForkStatusBadgeProps {
  /** 是否为 Fork */
  isFork: boolean;
  /** 父题目 ID */
  parentId?: string;
  /** 自定义样式 */
  style?: React.CSSProperties;
}

export const ForkStatusBadge = memo(function ForkStatusBadge({
  isFork,
  parentId,
  style,
}: ForkStatusBadgeProps) {
  const { t } = useTranslation('benchmarks');

  if (!isFork) {
    return null;
  }

  return (
    <Tooltip title={t('components.fork.badge.forkedFrom', { parentId })}>
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '2px 8px',
          background: '#f0f0f0',
          borderRadius: 4,
          fontSize: 12,
          color: '#666',
          ...style,
        }}
      >
        <BranchesOutlined style={{ fontSize: 10 }} />
        {t('components.fork.badge.forkLabel')}
      </span>
    </Tooltip>
  );
});

export default ForkUpdateBadge;
