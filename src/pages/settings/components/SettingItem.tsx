/**
 * SettingItem Component
 * 通用设置项 - 支持多种控件类型
 */

import { memo, ReactNode, useCallback } from 'react';
import { Button } from 'antd';
import { SettingSwitch } from './SettingSwitch';

export type SettingItemType =
  | 'text'
  | 'textarea'
  | 'password'
  | 'switch'
  | 'select'
  | 'radio'
  | 'button'
  | 'custom';

export interface SettingItemProps {
  label: string;
  description?: string;
  type?: SettingItemType;
  value?: any;
  defaultValue?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  options?: Array<{ label: string; value: any; description?: string }>;
  placeholder?: string;
  children?: ReactNode;
  className?: string;
  action?: ReactNode; // 自定义右侧操作区
}

export const SettingItem = memo(function SettingItem({
  label,
  description,
  type = 'text',
  value,
  defaultValue,
  onChange,
  disabled = false,
  options,
  placeholder,
  children,
  className = '',
  action,
}: SettingItemProps) {
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      if (!disabled) {
        onChange?.(e.target.value);
      }
    },
    [disabled, onChange]
  );

  const renderControl = () => {
    // 自定义操作区优先
    if (action) {
      return <div className="settings-item-action">{action}</div>;
    }

    // 自定义内容
    if (children) {
      return <div className="settings-item-custom">{children}</div>;
    }

    // Switch
    if (type === 'switch') {
      return (
        <SettingSwitch
          checked={value ?? defaultValue ?? false}
          onChange={onChange}
          disabled={disabled}
        />
      );
    }

    // Select
    if (type === 'select' && options) {
      return (
        <select
          className="settings-item-select"
          value={value ?? defaultValue ?? ''}
          onChange={handleChange}
          disabled={disabled}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      );
    }

    // Radio (卡样式)
    if (type === 'radio' && options) {
      return (
        <div className="settings-item-radios">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`settings-item-radio ${value === opt.value ? 'settings-item-radio-active' : ''}`}
              onClick={() => !disabled && onChange?.(opt.value)}
              disabled={disabled}
            >
              <span className="settings-item-radio-label">{opt.label}</span>
              {opt.description && (
                <span className="settings-item-radio-desc">{opt.description}</span>
              )}
            </button>
          ))}
        </div>
      );
    }

    // Button
    if (type === 'button') {
      return (
        <Button type="primary" onClick={onChange} disabled={disabled}>
          {label}
        </Button>
      );
    }

    // Textarea
    if (type === 'textarea') {
      return (
        <textarea
          className="settings-item-textarea"
          value={value ?? defaultValue ?? ''}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          rows={3}
        />
      );
    }

    // Password / Text (默认)
    return (
      <input
        type={type}
        className="settings-item-input"
        value={value ?? defaultValue ?? ''}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
      />
    );
  };

  return (
    <div className={`settings-item ${disabled ? 'settings-item-disabled' : ''} ${className}`}>
      <div className="settings-item-main">
        <div className="settings-item-label-section">
          <span className="settings-item-label">{label}</span>
          {description && (
            <span className="settings-item-description">{description}</span>
          )}
        </div>
        <div className="settings-item-control">{renderControl()}</div>
      </div>
    </div>
  );
});

export default SettingItem;
