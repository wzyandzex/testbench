/**
 * 计划标签组件
 * 支持深色/浅色模式，深色模式下带霓虹发光效果
 */

import { memo } from 'react';
import { Tag } from 'antd';
import { useIsDark } from '@/theme';
import { PLAN_CONFIG, type PlanType } from '@/pages/organizations/theme';
import { usePlanTagStyle } from '@/pages/organizations/style';

interface PlanTagProps {
  plan: PlanType;
}

export const PlanTag = memo(function PlanTag({ plan }: PlanTagProps) {
  const isDark = useIsDark();
  const config = PLAN_CONFIG[plan];
  const color = isDark ? config.darkColor : config.color;
  const tagStyle = usePlanTagStyle(color);

  return (
    <Tag
      style={tagStyle}
    >
      {config.icon} {config.text}
    </Tag>
  );
});
