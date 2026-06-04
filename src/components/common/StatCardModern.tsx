import { useState, useEffect, memo } from 'react';
import { Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

export interface StatCardModernProps {
  title: string;
  value: number | string;
  suffix?: string;
  prefix?: React.ReactNode;
  icon?: React.ReactNode;
  color?: string;
  change?: number;
  loading?: boolean;
  delay?: number;
  style?: React.CSSProperties;
  theme?: 'light' | 'dark';
}

/**
 * 现代统计卡片组件
 * 支持暗色和亮色两种主题
 */
export const StatCardModern = memo<StatCardModernProps>(({
  title,
  value,
  suffix,
  prefix,
  icon,
  color = '#667eea',
  change,
  loading = false,
  delay = 0,
  style,
  theme = 'light',
}) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  // 暗色主题样式
  const darkStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(20px)',
    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    background: 'rgba(26, 26, 26, 0.8)',
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 24,
    position: 'relative',
    overflow: 'hidden',
    ...style,
  };

  // 亮色主题样式
  const lightStyle: React.CSSProperties = {
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(20px)',
    transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
    background: '#ffffff',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: 12,
    padding: 24,
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
    position: 'relative',
    overflow: 'hidden',
    ...style,
  };

  const cardStyle = theme === 'dark' ? darkStyle : lightStyle;

  const iconContainerStyle: React.CSSProperties = {
    width: 48,
    height: 48,
    borderRadius: 12,
    background: theme === 'dark'
      ? `${color}20`
      : `${color}15`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 20,
    color: theme === 'dark' ? color : `${color}dd`,
    marginBottom: 16,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 500,
    color: theme === 'dark' ? 'rgba(255, 255, 255, 0.65)' : '#666666',
    marginBottom: 4,
  };

  const valueContainerStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  };

  const valueStyle: React.CSSProperties = {
    fontSize: 32,
    fontWeight: 600,
    color: theme === 'dark' ? 'rgba(255, 255, 255, 0.95)' : '#111111',
  };

  const trendStyle: React.CSSProperties = {
    padding: '4px 10px',
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 500,
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    background: change !== undefined && change >= 0
      ? (theme === 'dark' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)')
      : (theme === 'dark' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.1)'),
    color: change !== undefined && change >= 0
      ? (theme === 'dark' ? '#10b981' : '#059669')
      : (theme === 'dark' ? '#ef4444' : '#dc2626'),
  };

  const glowStyle: React.CSSProperties = {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 120,
    height: 120,
    background: `radial-gradient(circle, ${theme === 'dark' ? color + '30' : color + '20'} 0%, transparent 70%)`,
    borderRadius: '50%',
    pointerEvents: 'none',
  };

  const hoverStyle: Record<string, string> = theme === 'dark'
    ? {
        borderColor: 'rgba(102, 126, 234, 0.3)',
        boxShadow: '0 8px 32px rgba(102, 126, 234, 0.15)',
        transform: 'translateY(-4px)',
      }
    : {
        boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
        transform: 'translateY(-4px)',
      };

  return (
    <div
      style={cardStyle}
      onMouseEnter={(e) => {
        Object.assign(e.currentTarget.style, hoverStyle);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = String(cardStyle.border || '');
        e.currentTarget.style.boxShadow = cardStyle.boxShadow || '';
        e.currentTarget.style.transform = visible ? 'translateY(0)' : 'translateY(20px)';
      }}
    >
      {/* 装饰性光晕 */}
      {theme === 'dark' && <div style={glowStyle} />}

      {/* 图标 */}
      {icon && (
        <div style={iconContainerStyle}>
          {icon}
        </div>
      )}

      {/* 标题 */}
      <div style={titleStyle}>{title}</div>

      {/* 数值 + 趋势 */}
      <div style={valueContainerStyle}>
        <Statistic
          value={value}
          suffix={suffix}
          prefix={prefix}
          valueStyle={valueStyle}
          loading={loading}
        />
        {change !== undefined && (
          <div style={trendStyle}>
            {change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
    </div>
  );
});

StatCardModern.displayName = 'StatCardModern';
