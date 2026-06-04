/**
 * Generic search bar component
 */

import { memo, useCallback, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '@/hooks/useDebounce';
import { Input } from 'antd';
import { SearchOutlined, CloseCircleFilled } from '@ant-design/icons';

export interface SearchBarProps {
  value?: string;
  onChange?: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  allowClear?: boolean;
  debounceMs?: number;
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export const SearchBar = memo(function SearchBar({
  debounceMs = 300,
  value = '',
  onChange,
  onSearch,
  placeholder,
  allowClear = true,
  size = 'middle',
  disabled = false,
  style,
  className,
}: SearchBarProps) {
  const { t } = useTranslation('common');
  const resolvedPlaceholder = placeholder ?? t('components.searchBar.placeholder');
  const [localValue, setLocalValue] = useState(value);
  const debouncedValue = useDebounce(localValue, debounceMs);

  useEffect(() => {
    setLocalValue(value || '');
  }, [value]);

  useEffect(() => {
    if (debouncedValue !== value && onChange) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, onChange, value]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setLocalValue(e.target.value);
  }, []);

  const handlePressEnter = useCallback(() => {
    onSearch?.(value);
  }, [value, onSearch]);

  const handleClear = useCallback(() => {
    onChange?.('');
  }, [onChange]);

  const suffix = value ? (
    <CloseCircleFilled
      style={{ color: '#999', cursor: 'pointer' }}
      onClick={handleClear}
    />
  ) : null;

  return (
    <Input
      value={localValue}
      onChange={handleChange}
      onPressEnter={handlePressEnter}
      placeholder={resolvedPlaceholder}
      prefix={<SearchOutlined style={{ color: '#999' }} />}
      suffix={suffix}
      allowClear={allowClear}
      size={size}
      disabled={disabled}
      style={style}
      className={className}
    />
  );
});

export default SearchBar;
