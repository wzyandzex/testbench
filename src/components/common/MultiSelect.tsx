/**
 * Multi-select dropdown component
 */

import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, Tag } from 'antd';
import type { SelectProps } from 'antd';

export interface MultiSelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface MultiSelectProps extends Omit<SelectProps, 'value' | 'onChange' | 'mode'> {
  value?: string[];
  onChange?: (value: string[]) => void;
  options: MultiSelectOption[];
  placeholder?: string;
  maxTagCount?: number;
  allowClear?: boolean;
  disabled?: boolean;
  loading?: boolean;
  style?: React.CSSProperties;
  size?: 'small' | 'middle' | 'large';
}

export const MultiSelect = memo(function MultiSelect({
  value = [],
  onChange,
  options,
  placeholder,
  maxTagCount = 3,
  allowClear = true,
  disabled = false,
  loading = false,
  style,
  size = 'middle',
  ...restProps
}: MultiSelectProps) {
  const { t } = useTranslation('common');
  const resolvedPlaceholder = placeholder ?? t('components.multiSelect.placeholder');

  const handleChange = useCallback(
    (selectedValues: string[]) => {
      onChange?.(selectedValues);
    },
    [onChange]
  );

  const handleClear = useCallback(() => {
    onChange?.([]);
  }, [onChange]);

  const tagRender = useCallback((props: any) => {
    const { label, closable, onClose } = props;
    const onPreventMouseDown = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };
    return (
      <Tag
        color="#1677ff"
        onMouseDown={onPreventMouseDown}
        closable={closable}
        onClose={onClose}
        style={{ marginRight: 3 }}
      >
        {label}
      </Tag>
    );
  }, []);

  return (
    <Select
      {...restProps}
      mode="multiple"
      value={value}
      onChange={handleChange}
      onClear={handleClear}
      placeholder={resolvedPlaceholder}
      maxTagCount={maxTagCount}
      maxTagPlaceholder={(omittedValues) => `+${omittedValues.length}...`}
      allowClear={allowClear}
      disabled={disabled}
      loading={loading}
      style={{ minWidth: 200, ...style }}
      size={size}
      tagRender={tagRender}
      options={options.map(opt => ({ label: opt.label, value: opt.value }))}
    />
  );
});

export default MultiSelect;
