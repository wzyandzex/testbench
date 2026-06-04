/**
 * TimeWheel Component
 * 圆形时间选择器 - "时空命令接口"的核心组件
 *
 * 三环结构：
 * - 外环：星期选择 (周一到周日)
 * - 中环：小时选择 (0-23)
 * - 内环：分钟选择 (0, 15, 30, 45)
 */

import { memo, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '@/theme';
import { getSchedulerTheme } from '../../theme';
import {
  getTimeWheelPanelStyle,
  getCenterDisplayStyle,
  getAnimationStyles,
} from './style';
import { MINUTE_PRESETS, getDayLabels, getDayFullNames } from './hooks';
import type { TimeWheelState } from './hooks';

interface TimeWheelProps {
  value: string; // cron expression
  onChange: (cron: string) => void;
  state?: TimeWheelState;
  onStateChange?: (state: TimeWheelState) => void;
}

const CX = 150;
const CY = 150;
const OUTER_RADIUS = 120;
const MIDDLE_RADIUS = 90;
const INNER_RADIUS = 60;

export const TimeWheel = memo(function TimeWheel({
  value,
  onChange,
  state,
  onStateChange,
}: TimeWheelProps) {
  const { t } = useTranslation('scheduler');
  const isDark = useIsDark();
  const theme = getSchedulerTheme(isDark);
  const panelStyle = getTimeWheelPanelStyle(isDark);
  const centerStyle = getCenterDisplayStyle(isDark);

  // 解析当前状态
  const currentState = state || useMemo(() => {
    const parts = value.split(' ');
    if (parts.length !== 5) return { selectedDays: [1, 2, 3, 4, 5], selectedHour: 9, selectedMinute: 0 };

    const [, hour, , , dayOfWeek] = parts;
    const selectedHour = hour === '*' ? 9 : parseInt(hour, 10) || 9;

    let selectedDays = [1, 2, 3, 4, 5];
    if (dayOfWeek === '*') selectedDays = [0, 1, 2, 3, 4, 5, 6];
    else if (dayOfWeek.includes('-')) {
      const [start, end] = dayOfWeek.split('-').map(Number);
      selectedDays = Array.from({ length: end - start + 1 }, (_, i) => start + i);
    } else if (dayOfWeek.includes(',')) {
      selectedDays = dayOfWeek.split(',').map(Number);
    } else if (dayOfWeek !== '*') {
      selectedDays = [parseInt(dayOfWeek, 10)];
    }

    return { selectedDays, selectedHour, selectedMinute: 0 };
  }, [value]);

  // 星期选择处理
  const handleDayToggle = useCallback((dayIndex: number) => {
    const newSelectedDays = currentState.selectedDays.includes(dayIndex)
      ? currentState.selectedDays.length > 1
        ? currentState.selectedDays.filter(d => d !== dayIndex)
        : currentState.selectedDays
      : [...currentState.selectedDays, dayIndex];

    const newState = { ...currentState, selectedDays: newSelectedDays };
    const newCron = `${currentState.selectedMinute} ${currentState.selectedHour} * * ${newSelectedDays.sort((a, b) => a - b).join(',')}`;

    onStateChange?.(newState);
    onChange(newCron);
  }, [currentState, onChange, onStateChange]);

  // 小时选择处理
  const handleHourChange = useCallback((hour: number) => {
    const newState = { ...currentState, selectedHour: hour };
    const newCron = `${currentState.selectedMinute} ${hour} * * ${currentState.selectedDays.sort((a, b) => a - b).join(',')}`;

    onStateChange?.(newState);
    onChange(newCron);
  }, [currentState, onChange, onStateChange]);

  // 分钟选择处理
  const handleMinuteChange = useCallback((minute: number) => {
    const newState = { ...currentState, selectedMinute: minute };
    const newCron = `${minute} ${currentState.selectedHour} * * ${currentState.selectedDays.sort((a, b) => a - b).join(',')}`;

    onStateChange?.(newState);
    onChange(newCron);
  }, [currentState, onChange, onStateChange]);

  // 生成外环星期段
  const daySegments = useMemo(() => {
    const segments = [];
    const anglePerSegment = 360 / 7;
    const dayLabels = getDayLabels();

    for (let i = 0; i < 7; i++) {
      const startAngle = i * anglePerSegment - 90;
      const endAngle = (i + 1) * anglePerSegment - 90;
      const isSelected = currentState.selectedDays.includes(i);

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = CX + OUTER_RADIUS * Math.cos(startRad);
      const y1 = CY + OUTER_RADIUS * Math.sin(startRad);
      const x2 = CX + (OUTER_RADIUS - 25) * Math.cos(startRad);
      const y2 = CY + (OUTER_RADIUS - 25) * Math.sin(startRad);
      const x3 = CX + (OUTER_RADIUS - 25) * Math.cos(endRad);
      const y3 = CY + (OUTER_RADIUS - 25) * Math.sin(endRad);
      const x4 = CX + OUTER_RADIUS * Math.cos(endRad);
      const y4 = CY + OUTER_RADIUS * Math.sin(endRad);

      const textAngle = startAngle + anglePerSegment / 2;
      const textRad = (textAngle * Math.PI) / 180;
      const textX = CX + (OUTER_RADIUS - 12) * Math.cos(textRad);
      const textY = CY + (OUTER_RADIUS - 12) * Math.sin(textRad);

      segments.push({
        index: i,
        pathData: `M ${x1} ${y1} L ${x2} ${y2} A ${OUTER_RADIUS - 25} ${OUTER_RADIUS - 25} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${OUTER_RADIUS} ${OUTER_RADIUS} 0 0 0 ${x1} ${y1}`,
        textX,
        textY,
        label: dayLabels[i],
        isSelected,
      });
    }

    return segments;
  }, [currentState.selectedDays, t]);

  // 生成中环小时段
  const hourSegments = useMemo(() => {
    const segments = [];
    const anglePerSegment = 360 / 24;

    for (let i = 0; i < 24; i++) {
      const startAngle = i * anglePerSegment - 90;
      const endAngle = (i + 1) * anglePerSegment - 90;
      const isSelected = currentState.selectedHour === i;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = CX + (MIDDLE_RADIUS + 2) * Math.cos(startRad);
      const y1 = CY + (MIDDLE_RADIUS + 2) * Math.sin(startRad);
      const x2 = CX + (MIDDLE_RADIUS - 26) * Math.cos(startRad);
      const y2 = CY + (MIDDLE_RADIUS - 26) * Math.sin(startRad);
      const x3 = CX + (MIDDLE_RADIUS - 26) * Math.cos(endRad);
      const y3 = CY + (MIDDLE_RADIUS - 26) * Math.sin(endRad);
      const x4 = CX + (MIDDLE_RADIUS + 2) * Math.cos(endRad);
      const y4 = CY + (MIDDLE_RADIUS + 2) * Math.sin(endRad);

      segments.push({
        index: i,
        pathData: `M ${x1} ${y1} L ${x2} ${y2} A ${MIDDLE_RADIUS - 26} ${MIDDLE_RADIUS - 26} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${MIDDLE_RADIUS + 2} ${MIDDLE_RADIUS + 2} 0 0 0 ${x1} ${y1}`,
        isSelected,
      });
    }

    return segments;
  }, [currentState.selectedHour]);

  // 生成内环分钟段
  const minuteSegments = useMemo(() => {
    const segments = [];
    const anglePerSegment = 360 / 4;

    for (let i = 0; i < 4; i++) {
      const startAngle = i * anglePerSegment - 90;
      const endAngle = (i + 1) * anglePerSegment - 90;
      const minute = MINUTE_PRESETS[i];
      const isSelected = currentState.selectedMinute === minute;

      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      const x1 = CX + (INNER_RADIUS + 2) * Math.cos(startRad);
      const y1 = CY + (INNER_RADIUS + 2) * Math.sin(startRad);
      const x2 = CX + (INNER_RADIUS - 28) * Math.cos(startRad);
      const y2 = CY + (INNER_RADIUS - 28) * Math.sin(startRad);
      const x3 = CX + (INNER_RADIUS - 28) * Math.cos(endRad);
      const y3 = CY + (INNER_RADIUS - 28) * Math.sin(endRad);
      const x4 = CX + (INNER_RADIUS + 2) * Math.cos(endRad);
      const y4 = CY + (INNER_RADIUS + 2) * Math.sin(endRad);

      const textAngle = startAngle + anglePerSegment / 2;
      const textRad = (textAngle * Math.PI) / 180;
      const textX = CX + (INNER_RADIUS - 15) * Math.cos(textRad);
      const textY = CY + (INNER_RADIUS - 15) * Math.sin(textRad);

      segments.push({
        index: i,
        pathData: `M ${x1} ${y1} L ${x2} ${y2} A ${INNER_RADIUS - 28} ${INNER_RADIUS - 28} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${INNER_RADIUS + 2} ${INNER_RADIUS + 2} 0 0 0 ${x1} ${y1}`,
        textX,
        textY,
        label: minute.toString(),
        minute,
        isSelected,
      });
    }

    return segments;
  }, [currentState.selectedMinute]);

  return (
    <div style={panelStyle.container}>
      <style>{getAnimationStyles(isDark)}</style>

      <div style={panelStyle.header}>
        <span>⏱️</span>
        <span>{t('panels.wheel.header')}</span>
      </div>

      <div style={panelStyle.wheelContainer}>
        <svg
          viewBox="0 0 300 300"
          style={panelStyle.svg}
          className="wheel-enter"
        >
          {/* 装饰环 */}
          <circle
            cx={CX}
            cy={CY}
            r={OUTER_RADIUS + 5}
            fill="none"
            stroke={isDark ? 'rgba(99, 102, 241, 0.2)' : 'rgba(148, 163, 184, 0.2)'}
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* 外环 - 星期 */}
          {daySegments.map((segment) => (
            <g key={`day-${segment.index}`}>
              <path
                d={segment.pathData}
                fill={segment.isSelected
                  ? (isDark ? 'rgba(0, 245, 255, 0.25)' : 'rgba(8, 145, 178, 0.25)')
                  : (isDark ? 'rgba(148, 163, 184, 0.08)' : 'rgba(148, 163, 184, 0.08)')}
                stroke={segment.isSelected ? theme.accentCyan : (isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.25)')}
                strokeWidth={segment.isSelected ? 2 : 1}
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                onClick={() => handleDayToggle(segment.index)}
              />
              <text
                x={segment.textX}
                y={segment.textY}
                fill={segment.isSelected ? theme.accentCyan : theme.textSecondary}
                fontSize={segment.isSelected ? 13 : 11}
                fontWeight={segment.isSelected ? 600 : 400}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {segment.label}
              </text>
            </g>
          ))}

          {/* 中环 - 小时 */}
          {hourSegments.map((segment) => {
            const showLabel = segment.index % 3 === 0;
            const textAngle = (segment.index * 15 - 90) * Math.PI / 180;
            const textX = CX + (MIDDLE_RADIUS - 15) * Math.cos(textAngle);
            const textY = CY + (MIDDLE_RADIUS - 15) * Math.sin(textAngle);

            return (
              <g key={`hour-${segment.index}`}>
                <path
                  d={segment.pathData}
                  fill={segment.isSelected
                    ? (isDark ? 'rgba(168, 85, 247, 0.25)' : 'rgba(139, 92, 246, 0.25)')
                    : (isDark ? 'rgba(148, 163, 184, 0.05)' : 'rgba(148, 163, 184, 0.05)')}
                  stroke={segment.isSelected ? theme.accentPurple : (isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.2)')}
                  strokeWidth={segment.isSelected ? 2 : 1}
                  style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                  onClick={() => handleHourChange(segment.index)}
                />
                {showLabel && (
                  <text
                    x={textX}
                    y={textY}
                    fill={segment.isSelected ? theme.accentPurple : theme.textSecondary}
                    fontSize={10}
                    fontWeight={segment.isSelected ? 600 : 400}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {segment.index}
                  </text>
                )}
              </g>
            );
          })}

          {/* 内环 - 分钟 */}
          {minuteSegments.map((segment) => (
            <g key={`minute-${segment.index}`}>
              <path
                d={segment.pathData}
                fill={segment.isSelected
                  ? (isDark ? 'rgba(244, 114, 182, 0.25)' : 'rgba(236, 72, 153, 0.25)')
                  : (isDark ? 'rgba(148, 163, 184, 0.05)' : 'rgba(148, 163, 184, 0.05)')}
                stroke={segment.isSelected ? theme.accentMagenta : (isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(148, 163, 184, 0.2)')}
                strokeWidth={segment.isSelected ? 2 : 1}
                style={{ cursor: 'pointer', transition: 'all 0.3s ease' }}
                onClick={() => handleMinuteChange(segment.minute)}
              />
              <text
                x={segment.textX}
                y={segment.textY}
                fill={segment.isSelected ? theme.accentMagenta : theme.textSecondary}
                fontSize={segment.isSelected ? 11 : 9}
                fontWeight={segment.isSelected ? 600 : 400}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {segment.label}
              </text>
            </g>
          ))}

          {/* 中心圆背景 */}
          <circle
            cx={CX}
            cy={CY}
            r={INNER_RADIUS - 32}
            fill={isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)'}
            stroke={isDark ? theme.cardBorder : theme.cardBorder}
            strokeWidth="2"
          />
        </svg>

        {/* 中心时间显示 */}
        <div style={centerStyle.container}>
          <div style={centerStyle.time}>
            {String(currentState.selectedHour).padStart(2, '0')}:{String(currentState.selectedMinute).padStart(2, '0')}
          </div>
          <div style={centerStyle.label}>
            {currentState.selectedDays.map(d => getDayFullNames()[d]).join(' ')}
          </div>
        </div>
      </div>
    </div>
  );
});
