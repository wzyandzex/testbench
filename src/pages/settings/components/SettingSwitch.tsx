/**
 * SettingSwitch Component
 * 自定义开关控件 - 弹性动画 + 发光效果
 */

import { memo, useCallback } from 'react';

export interface SettingSwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
  className?: string;
}

const sizeStyles = {
  small: { width: 36, height: 20, dot: 14 },
  medium: { width: 44, height: 24, dot: 18 },
  large: { width: 52, height: 28, dot: 22 },
} as const;

export const SettingSwitch = memo(function SettingSwitch({
  checked,
  onChange,
  disabled = false,
  size = 'medium',
  className = '',
}: SettingSwitchProps) {
  const handleClick = useCallback(() => {
    if (!disabled) {
      onChange?.(!checked);
    }
  }, [checked, disabled, onChange]);

  const styles = sizeStyles[size];
  const dotOffset = checked ? styles.width - styles.dot - 4 : 4;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      className={`settings-switch settings-switch-${size} ${checked ? 'settings-switch-checked' : ''} ${disabled ? 'settings-switch-disabled' : ''} ${className}`}
      onClick={handleClick}
      style={{
        width: styles.width,
        height: styles.height,
      }}
    >
      <span
        className="settings-switch-dot"
        style={{
          width: styles.dot,
          height: styles.dot,
          transform: `translateX(${dotOffset}px)`,
        }}
      />
    </button>
  );
});

export default SettingSwitch;
