/**
 * SettingGroup Component
 * 设置分组容器 - 卡片背景 + 分组标题
 */

import { memo, ReactNode } from 'react';

export interface SettingGroupProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export const SettingGroup = memo(function SettingGroup({
  title,
  description,
  children,
  className = '',
  style,
}: SettingGroupProps) {
  return (
    <div className={`settings-group ${className}`} style={style}>
      {(title || description) && (
        <div className="settings-group-header">
          {title && <h3 className="settings-group-title">{title}</h3>}
          {description && <p className="settings-group-description">{description}</p>}
        </div>
      )}
      <div className="settings-group-content">
        {children}
      </div>
    </div>
  );
});

export default SettingGroup;
