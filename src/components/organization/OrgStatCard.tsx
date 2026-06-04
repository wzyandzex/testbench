/**
 * 组织统计卡片组件
 * 支持深色/浅色模式，深色模式下带霓虹发光效果
 */

import { memo, useState, useEffect } from 'react';
import { useIsDark } from '@/theme';
import { ORG_THEME } from '@/pages/organizations/theme';
import { useOrgStatCardStyle, useNeonTopBorder, useNumberStyle, useIconStyle } from '@/pages/organizations/style';

interface OrgStatCardProps {
  icon: string;
  value: number;
  label: string;
  color: string;
}

export const OrgStatCard = memo(function OrgStatCard({
  icon,
  value,
  label,
  color,
}: OrgStatCardProps) {
  const isDark = useIsDark();
  const cardStyle = useOrgStatCardStyle();
  const neonTopBorder = useNeonTopBorder(color);
  const numberStyle = useNumberStyle(color);
  const iconStyle = useIconStyle(color);

  // 数字动画
  const [animatedValue, setAnimatedValue] = useState(0);

  useEffect(() => {
    const duration = 1000;
    const steps = 30;
    const stepValue = value / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += stepValue;
      if (current >= value) {
        setAnimatedValue(value);
        clearInterval(timer);
      } else {
        setAnimatedValue(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  const displayValue = animatedValue.toLocaleString();

  return (
    <div style={cardStyle}>
      {/* 深色模式霓虹顶部边框 */}
      {isDark && <div style={neonTopBorder} />}

      {/* 图标 */}
      <div style={iconStyle}>
        {icon}
      </div>

      {/* 数值 */}
      <div style={numberStyle}>
        {displayValue}
      </div>

      {/* 标签 */}
      <div style={{
        fontSize: 13,
        color: isDark ? ORG_THEME.dark.textSecondary : ORG_THEME.light.textSecondary,
      }}>
        {label}
      </div>
    </div>
  );
});
