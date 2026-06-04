import { useState, useEffect } from 'react';
import { Card, Statistic, Typography } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useIsDark, useThemeTokens } from '@/theme';

const { Text } = Typography;

export interface StatCardProps {
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
}

/**
 * 统计卡片组件
 * 用于 Dashboard 和其他数据展示页面
 */
export function StatCard({
  title,
  value,
  suffix,
  prefix,
  icon,
  color = '#1677ff',
  change,
  loading = false,
  delay = 0,
  style,
}: StatCardProps) {
  const [visible, setVisible] = useState(false);
  const tokens = useThemeTokens();
  const isDark = useIsDark();

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  const subtleAccent = /^#[0-9a-fA-F]{6}$/.test(color)
    ? `${color}${isDark ? '24' : '15'}`
    : tokens.bg.tertiary;

  return (
    <Card
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        borderRadius: 12,
        border: `1px solid ${tokens.border.default}`,
        background: tokens.bg.elevated,
        boxShadow: isDark ? '0 12px 32px rgba(0, 0, 0, 0.28)' : '0 1px 3px rgba(15, 23, 42, 0.08)',
        overflow: 'hidden',
        position: 'relative',
        ...style,
      }}
      styles={{ body: { padding: '24px' } }}
    >
      {/* 装饰性背景 */}
      <div
        style={{
          position: 'absolute',
          top: -20,
          right: -20,
          width: 100,
          height: 100,
          background: `radial-gradient(circle, ${subtleAccent} 0%, transparent 70%)`,
          borderRadius: '50%',
        }}
      />
      <div style={{ position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
          {icon && (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                background: subtleAccent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 20,
                color,
              }}
            >
              {icon}
            </div>
          )}
          <div style={{ marginLeft: icon ? 12 : 0, flex: 1 }}>
            <Text style={{ fontSize: 14, color: tokens.text.secondary }}>
              {title}
            </Text>
          </div>
          {change !== undefined && (
            <div
              style={{
                padding: '4px 10px',
                borderRadius: 20,
                fontSize: 12,
                fontWeight: 500,
                background: change >= 0
                  ? (isDark ? 'rgba(16, 185, 129, 0.16)' : 'rgba(16, 185, 129, 0.1)')
                  : (isDark ? 'rgba(239, 68, 68, 0.16)' : 'rgba(239, 68, 68, 0.1)'),
                color: change >= 0 ? tokens.status.success : tokens.status.error,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              {Math.abs(change)}%
            </div>
          )}
        </div>
        <Statistic
          value={value}
          suffix={suffix}
          prefix={prefix}
          valueStyle={{
            fontSize: 32,
            fontWeight: 600,
            color: tokens.text.primary,
          }}
          loading={loading}
        />
      </div>
    </Card>
  );
}
