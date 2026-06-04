/**
 * Temperature slider — slider + number input combo
 */

import { memo, useMemo } from 'react';
import { Slider, InputNumber } from 'antd';
import i18next from 'i18next';
import { useIsDark } from '@/theme';
import { AGENT_THEME } from '@/pages/agents/theme';

interface TemperatureSliderProps {
  value?: number;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}

// Temperature description label (resolved at access time via i18next)
const getTemperatureLabel = (value: number | undefined): string => {
  const v = value ?? 0.7;
  if (v > 1.5) return i18next.t('agents:components.tempSlider.ultraHigh');
  if (v > 0.7) return i18next.t('agents:components.tempSlider.balanced');
  if (v > 0.3) return i18next.t('agents:components.tempSlider.low');
  return i18next.t('agents:components.tempSlider.minimum');
};

export const TemperatureSlider = memo(function TemperatureSlider({
  value = 0.7,
  onChange,
  disabled,
}: TemperatureSliderProps) {
  const isDark = useIsDark();
  const theme = AGENT_THEME[isDark ? 'dark' : 'light'];

  // 滑块轨道样式
  const trackStyle = useMemo(
    () => ({
      background: isDark ? theme.accent : undefined,
    }),
    [isDark, theme]
  );

  // 滑块手柄样式
  const handleStyle = useMemo(
    () => ({
      borderColor: isDark ? theme.accent : undefined,
      boxShadow: isDark ? `0 0 10px ${theme.accent}40` : undefined,
    }),
    [isDark, theme]
  );

  // 轨道样式（未激活部分）
  const railStyle = useMemo(
    () => ({
      background: isDark ? 'rgba(255,255,255,0.1)' : undefined,
    }),
    [isDark]
  );

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <Slider
          style={{ flex: 1 }}
          min={0}
          max={2}
          step={0.1}
          value={value}
          onChange={onChange}
          disabled={disabled}
          tooltip={{
            formatter: (v) => `${v} - ${getTemperatureLabel(v)}`,
            color: isDark ? theme.cardBg : undefined,
          }}
          trackStyle={trackStyle}
          handleStyle={handleStyle}
          railStyle={railStyle}
        />
        <InputNumber
          min={0}
          max={2}
          step={0.1}
          value={value}
          onChange={onChange}
          disabled={disabled}
          style={{
            width: 90,
            borderRadius: isDark ? 8 : 6,
          }}
          controls={false}
        />
      </div>
      <div style={{ fontSize: '12px', color: theme.textTertiary, marginTop: 8 }}>
        {getTemperatureLabel(value)}
      </div>
    </div>
  );
});
