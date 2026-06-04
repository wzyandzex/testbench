/**
 * 角色标签组件
 * 支持深色/浅色模式
 */

import { memo } from 'react';
import { Tag } from 'antd';
import { useIsDark } from '@/theme';
import { ROLE_CONFIG, type RoleType } from '@/pages/organizations/theme';
import { useRoleTagStyle } from '@/pages/organizations/style';

interface RoleTagProps {
  role: RoleType;
  onClick?: () => void;
}

export const RoleTag = memo(function RoleTag({ role, onClick }: RoleTagProps) {
  const isDark = useIsDark();
  const config = ROLE_CONFIG[role];
  const color = isDark ? config.darkColor : config.color;
  const baseStyle = useRoleTagStyle(color);

  const tagStyle = onClick
    ? { ...baseStyle, cursor: 'pointer' as const }
    : baseStyle;

  return (
    <Tag
      style={tagStyle}
      onClick={onClick}
    >
      {config.icon} {config.text}
    </Tag>
  );
});
