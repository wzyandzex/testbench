/**
 * Status Bar Component
 * 状态栏 - 显示当前系统状态的动画指示器
 */

import { memo, useMemo, useState, useEffect } from 'react';
import { Typography } from 'antd';
import { ClockCircleOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '@/theme';
import { getSchedulerTheme } from '../theme';

const { Text } = Typography;

interface StatusBarProps {
  activeCount: number;
}

export const StatusBar = memo(function StatusBar({ activeCount }: StatusBarProps) {
  const { t } = useTranslation('scheduler');
  const isDark = useIsDark();
  const theme = getSchedulerTheme(isDark);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const containerStyle = useMemo(
    () => ({
      display: 'flex',
      alignItems: 'center',
      gap: isDark ? '24px' : '20px',
      padding: isDark ? '16px 24px' : '12px 20px',
      borderRadius: isDark ? '12px' : '10px',
      background: isDark ? 'rgba(26, 31, 58, 0.6)' : 'rgba(255, 255, 255, 0.8)',
      border: isDark ? `1px solid ${theme.cardBorder}` : `1px solid ${theme.cardBorder}`,
      backdropFilter: isDark ? 'blur(10px)' : undefined,
    }),
    [isDark, theme]
  );

  const statusItemStyle = useMemo(
    () => ({
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      fontSize: '13px',
    }),
    []
  );

  const pulsingDotStyle = useMemo(
    () => ({
      width: '8px',
      height: '8px',
      borderRadius: '50%',
      background: theme.statusActive,
      animation: 'scheduler-pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
    }),
    [theme]
  );

  return (
    <div style={containerStyle}>
      {/* System Status */}
      <div style={statusItemStyle}>
        <div style={pulsingDotStyle} />
        <Text style={{ color: theme.textSecondary, fontSize: '13px' }}>
          {t('statusBar.systemRunning')}
        </Text>
      </div>

      {/* Divider */}
      <div
        style={{
          width: '1px',
          height: '16px',
          background: theme.cardBorder,
        }}
      />

      {/* Active Tasks */}
      <div style={statusItemStyle}>
        <ThunderboltOutlined style={{ color: theme.accentCyan, fontSize: '14px' }} />
        <Text style={{ color: theme.textSecondary, fontSize: '13px' }}>
          {t('statusBar.activeTasks', { count: activeCount })}
        </Text>
      </div>

      {/* Divider */}
      <div
        style={{
          width: '1px',
          height: '16px',
          background: theme.cardBorder,
        }}
      />

      {/* Current Time */}
      <div style={statusItemStyle}>
        <ClockCircleOutlined style={{ color: theme.accentMagenta, fontSize: '14px' }} />
        <Text style={{ color: theme.textSecondary, fontSize: '13px', fontFamily: 'monospace' }}>
          {currentTime.toLocaleTimeString('zh-CN')}
        </Text>
      </div>
    </div>
  );
});
