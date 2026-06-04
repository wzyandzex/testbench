/**
 * SchedulePreview Component
 * 调度预览面板 - 显示 Cron 表达式和下次执行时间
 */

import { memo, useMemo } from 'react';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '@/theme';
import { getSchedulerTheme } from '../../theme';
import { getSchedulePreviewStyle } from './style';
import { getCronDescription } from './hooks';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

interface SchedulePreviewProps {
  cronExpression: string;
  selectedHour?: number;
  selectedMinute?: number;
  selectedDays?: number[];
}

export const SchedulePreview = memo(function SchedulePreview({
  cronExpression,
  selectedHour = 9,
  selectedMinute = 0,
  selectedDays = [1, 2, 3, 4, 5],
}: SchedulePreviewProps) {
  const { t } = useTranslation('scheduler');
  const isDark = useIsDark();
  const theme = getSchedulerTheme(isDark);
  const previewStyle = getSchedulePreviewStyle(isDark);

  // 解析 Cron 表达式
  const humanReadable = useMemo(() => {
    return getCronDescription(cronExpression);
  }, [cronExpression]);

  // 计算下次执行时间
  const nextRunTime = useMemo(() => {
    const now = new Date();
    const targetDays = selectedDays.sort();
    let nextDate: Date | null = null;

    // 检查接下来7天内是否有匹配
    for (let i = 0; i < 7; i++) {
      const checkDate = new Date(now);
      checkDate.setDate(checkDate.getDate() + i);
      checkDate.setHours(selectedHour, selectedMinute, 0, 0);

      if (checkDate > now && targetDays.includes(checkDate.getDay())) {
        nextDate = checkDate;
        break;
      }
    }

    if (nextDate) {
      return dayjs(nextDate).fromNow();
    }

    return t('noTimeMatch');
  }, [selectedDays, selectedHour, selectedMinute, t]);

  return (
    <div style={previewStyle.container}>
      {/* Cron 表达式显示 */}
      <div style={previewStyle.cronDisplay}>
        <code style={previewStyle.cronCode}>{cronExpression}</code>
      </div>

      {/* 人类可读描述 */}
      <div style={previewStyle.humanReadable}>
        {humanReadable}
      </div>

      {/* 下次执行时间 */}
      <div style={previewStyle.nextRun}>
        <ClockCircleOutlined style={previewStyle.nextRunIcon} />
        <span>{t('panels.schedule.nextRun', { when: nextRunTime })}</span>
      </div>

      {/* 深色模式装饰 */}
      {isDark && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '4px',
            height: '100%',
            background: `linear-gradient(180deg, ${theme.accentCyan}, ${theme.accentMagenta})`,
            borderRadius: '12px 0 0 12px',
            opacity: 0.6,
          }}
        />
      )}
    </div>
  );
});
