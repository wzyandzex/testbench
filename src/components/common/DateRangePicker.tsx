/**
 * Date range picker component
 */

import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { DatePicker } from 'antd';
import { CalendarOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

export type DateRangePreset =
  | '1h'
  | '6h'
  | '24h'
  | '7d'
  | '30d'
  | '90d'
  | 'custom';

export interface DateRangePickerProps {
  value?: [Dayjs, Dayjs] | null;
  onChange?: (dates: [Dayjs, Dayjs] | null, preset?: DateRangePreset) => void;
  presets?: DateRangePreset[];
  defaultPreset?: DateRangePreset;
  placeholder?: [string, string];
  size?: 'small' | 'middle' | 'large';
  disabled?: boolean;
  showTime?: boolean;
  format?: string;
  style?: React.CSSProperties;
  allowClear?: boolean;
}

const PRESET_KEYS: Record<
  Exclude<DateRangePreset, 'custom'>,
  { labelKey: string; range: () => [Dayjs, Dayjs] }
> = {
  '1h': { labelKey: 'components.dateRange.preset1h', range: () => [dayjs().subtract(1, 'hour'), dayjs()] },
  '6h': { labelKey: 'components.dateRange.preset6h', range: () => [dayjs().subtract(6, 'hour'), dayjs()] },
  '24h': { labelKey: 'components.dateRange.preset24h', range: () => [dayjs().subtract(24, 'hour'), dayjs()] },
  '7d': { labelKey: 'components.dateRange.preset7d', range: () => [dayjs().subtract(7, 'day'), dayjs()] },
  '30d': { labelKey: 'components.dateRange.preset30d', range: () => [dayjs().subtract(30, 'day'), dayjs()] },
  '90d': { labelKey: 'components.dateRange.preset90d', range: () => [dayjs().subtract(90, 'day'), dayjs()] },
};

const DEFAULT_PRESETS: DateRangePreset[] = ['1h', '6h', '24h', '7d', '30d', '90d'];

export const DateRangePicker = memo(function DateRangePicker({
  value,
  onChange,
  presets = DEFAULT_PRESETS,
  placeholder,
  size = 'middle',
  disabled = false,
  showTime = false,
  format = 'YYYY-MM-DD HH:mm:ss',
  style,
  allowClear = true,
}: DateRangePickerProps) {
  const { t } = useTranslation('common');
  const resolvedPlaceholder: [string, string] = placeholder ?? [t('components.dateRange.startDate'), t('components.dateRange.endDate')];

  const rangePickerPresets = useMemo(() => {
    return presets
      .filter((p) => p !== 'custom')
      .map((preset) => ({
        label: t(PRESET_KEYS[preset as Exclude<DateRangePreset, 'custom'>].labelKey),
        value: () => PRESET_KEYS[preset as Exclude<DateRangePreset, 'custom'>].range(),
      }));
  }, [presets, t]);

  const handleCalendarChange = useCallback(
    (dates: null | [Dayjs | null, Dayjs | null]) => {
      if (!dates || !dates[0] || !dates[1]) {
        onChange?.(null, 'custom');
        return;
      }
      onChange?.([dates[0] as Dayjs, dates[1] as Dayjs], 'custom');
    },
    [onChange]
  );

  const handlePresetClick = useCallback(
    (preset: Exclude<DateRangePreset, 'custom'>) => {
      const range = PRESET_KEYS[preset].range();
      onChange?.(range, preset);
    },
    [onChange]
  );

  const shortcuts = presets.map((preset) => {
    if (preset === 'custom') return null;
    return (
      <button
        key={preset}
        type="button"
        onClick={() => handlePresetClick(preset)}
        style={{
          padding: '4px 12px',
          margin: '0 4px',
          border: '1px solid #d9d9d9',
          borderRadius: '4px',
          background: value ? '#1677ff' : 'transparent',
          color: value ? '#fff' : '#000',
          cursor: 'pointer',
          fontSize: '12px',
        }}
      >
        {t(PRESET_KEYS[preset].labelKey)}
      </button>
    );
  });

  return (
    <div style={{ display: 'inline-block' }}>
      <div style={{ marginBottom: 8, display: 'flex', flexWrap: 'wrap' }}>
        {shortcuts}
      </div>
      <RangePicker
        value={value}
        onChange={handleCalendarChange}
        placeholder={resolvedPlaceholder}
        size={size}
        disabled={disabled}
        showTime={showTime}
        format={format}
        style={style}
        allowClear={allowClear}
        presets={rangePickerPresets}
        suffixIcon={<CalendarOutlined />}
      />
    </div>
  );
});

export default DateRangePicker;
