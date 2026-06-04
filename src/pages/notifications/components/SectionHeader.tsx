/**
 * SectionHeader Component
 * 区块头部组件
 *
 * 特性:
 * - 标题 + 数量 + 折叠按钮
 * - 类型图标和颜色
 * - 展开/折叠动画指示器
 */

import { memo, useMemo } from 'react';
import {
  DownOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  BellOutlined,
  FileTextOutlined,
  RobotOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { SectionHeaderProps } from '../types';

export const SectionHeader = memo(function SectionHeader({
  title,
  count,
  type,
  expanded,
  onToggle,
  className = '',
}: SectionHeaderProps) {
  const { t } = useTranslation('notifications');

  // 类型配置
  const TYPE_CONFIG = useMemo(() => ({
    success: {
      label: t('category.success'),
      icon: <CheckCircleOutlined />,
      color: '#10b981',
    },
    error: {
      label: t('category.error'),
      icon: <CloseCircleOutlined />,
      color: '#ef4444',
    },
    warning: {
      label: t('category.warning'),
      icon: <WarningOutlined />,
      color: '#f59e0b',
    },
    info: {
      label: t('category.info'),
      icon: <InfoCircleOutlined />,
      color: '#1677ff',
    },
    execution_completed: {
      label: t('category.executionCompleted'),
      icon: <CheckCircleOutlined />,
      color: '#10b981',
    },
    execution_failed: {
      label: t('category.executionFailed'),
      icon: <CloseCircleOutlined />,
      color: '#ef4444',
    },
    system: {
      label: t('category.system'),
      icon: <BellOutlined />,
      color: '#8b5cf6',
    },
    benchmark_created: {
      label: t('category.benchmarkCreated'),
      icon: <FileTextOutlined />,
      color: '#06b6d4',
    },
    agent_created: {
      label: t('category.agentCreated'),
      icon: <RobotOutlined />,
      color: '#ec4899',
    },
  }), [t]);

  const config = useMemo(() => {
    return TYPE_CONFIG[type as keyof typeof TYPE_CONFIG] || TYPE_CONFIG.info;
  }, [type, TYPE_CONFIG]);

  return (
    <div
      className={`section-header ${className}`}
      onClick={onToggle}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        marginBottom: 12,
        borderRadius: 10,
        background: 'var(--notification-section-header-bg, rgba(26, 26, 26, 0.4))',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'var(--notification-section-header-border, rgba(255, 255, 255, 0.06))',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = 'var(--notification-section-header-hover-bg, rgba(255, 255, 255, 0.03))';
        e.currentTarget.style.borderColor = `${config.color}30`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = 'var(--notification-section-header-bg, rgba(26, 26, 26, 0.4))';
        e.currentTarget.style.borderColor = 'var(--notification-section-header-border, rgba(255, 255, 255, 0.06))';
      }}
    >
      {/* 左侧：图标 + 标题 + 数量 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {/* 图标 */}
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 6,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 14,
            background: `${config.color}15`,
            color: config.color,
          }}
        >
          {config.icon}
        </div>

        {/* 标题 */}
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--notification-text, rgba(255, 255, 255, 0.95))',
          }}
        >
          {title}
        </span>

        {/* 数量 */}
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            padding: '2px 8px',
            borderRadius: 10,
            background: `${config.color}15`,
            color: config.color,
          }}
        >
          {count}
        </span>
      </div>

      {/* 右侧：折叠按钮 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 24,
          height: 24,
          borderRadius: 6,
          background: 'var(--notification-section-toggle-bg, rgba(255, 255, 255, 0.05))',
          transition: 'transform 0.3s ease',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
        }}
      >
        <DownOutlined
          style={{
            fontSize: 10,
            color: 'var(--notification-text-secondary, rgba(255, 255, 255, 0.55))',
          }}
        />
      </div>
    </div>
  );
});

export default SectionHeader;
