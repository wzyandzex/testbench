/**
 * NotificationStatCard Component
 * 单个统计卡片组件
 *
 * 特性:
 * - 数字增长动画
 * - 趋势指示器（百分比变化 + 箭头）
 * - 图标 + 标签 + 数值布局
 * - 悬停轻微抬升效果
 */

import { memo, useMemo } from 'react';
import { ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons';
import { AnimatedCounter } from './animations';
import type { NotificationStatCardProps } from '../types';

export const NotificationStatCard = memo(function NotificationStatCard({
  title,
  value,
  icon,
  color,
  trend,
  onClick,
  active = false,
  className = '',
}: NotificationStatCardProps) {
  // 计算趋势显示
  const trendDisplay = useMemo(() => {
    if (trend === undefined) return null;

    const isPositive = trend > 0;
    const isNegative = trend < 0;

    const trendColor = isPositive ? '#10b981' : isNegative ? '#ef4444' : '#999';
    const TrendIcon = isPositive ? ArrowUpOutlined : isNegative ? ArrowDownOutlined : MinusOutlined;

    return (
      <div
        className="stat-card-trend"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          fontSize: 12,
          fontWeight: 500,
          color: trendColor,
          marginTop: 4,
        }}
      >
        <TrendIcon style={{ fontSize: 10 }} />
        <span>{Math.abs(trend)}%</span>
      </div>
    );
  }, [trend]);

  return (
    <div
      className={`notification-stat-card ${active ? 'active' : ''} ${className}`}
      onClick={onClick}
      style={{
        position: 'relative',
        padding: '20px 16px',
        borderRadius: 16,
        background: 'var(--notification-stat-bg, rgba(26, 26, 26, 0.6))',
        borderWidth: '1px',
        borderStyle: 'solid',
        borderColor: 'var(--notification-stat-border, rgba(255, 255, 255, 0.08))',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.borderColor = `${color}40`;
          e.currentTarget.style.boxShadow = `0 8px 24px ${color}20`;
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.borderColor = 'var(--notification-stat-border, rgba(255, 255, 255, 0.08))';
        e.currentTarget.style.boxShadow = active ? `0 0 20px ${color}30` : 'none';
      }}
    >
      {/* 激活状态发光边框 */}
      {active && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: `linear-gradient(90deg, ${color}, ${color}80)`,
            borderRadius: '16px 16px 0 0',
          }}
        />
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* 图标 */}
        <div
          className="stat-card-icon"
          style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 18,
            background: `${color}15`,
            color,
            flexShrink: 0,
          }}
        >
          {icon}
        </div>

        {/* 内容 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="stat-card-value"
            style={{
              fontSize: 24,
              fontWeight: 700,
              color: 'var(--notification-text, rgba(255, 255, 255, 0.95))',
              lineHeight: 1.2,
            }}
          >
            <AnimatedCounter value={value} duration={1000} format={true} />
          </div>
          <div
            className="stat-card-title"
            style={{
              fontSize: 13,
              color: 'var(--notification-text-secondary, rgba(255, 255, 255, 0.55))',
              marginTop: 2,
            }}
          >
            {title}
          </div>
          {trendDisplay}
        </div>
      </div>
    </div>
  );
});

export default NotificationStatCard;
