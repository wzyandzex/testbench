import { memo, useMemo } from 'react';
import { Empty, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { useIsDark } from '@/theme';
import { getSchedulerTheme } from '../theme';
import type { ScheduledTask } from '@/types/api/scheduled-task';
import { SCHEDULED_TASK_STATUS_CONFIG, formatScheduleSummary } from '@/types/api/scheduled-task';

const { Text } = Typography;

interface TimelineViewProps {
  tasks: ScheduledTask[];
}

export const TimelineView = memo(function TimelineView({ tasks }: TimelineViewProps) {
  const isDark = useIsDark();
  const theme = getSchedulerTheme(isDark);

  const orderedTasks = useMemo(
    () =>
      [...tasks].sort((left, right) => {
        const leftTime = new Date(left.next_run_time || '').getTime();
        const rightTime = new Date(right.next_run_time || '').getTime();
        return leftTime - rightTime;
      }),
    [tasks]
  );

  if (orderedTasks.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={'\u6682\u65e0\u53ef\u9884\u89c8\u7684\u65f6\u95f4\u8f74'} />;
  }

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      {orderedTasks.map((task) => {
        const statusConfig = SCHEDULED_TASK_STATUS_CONFIG[task.status];

        return (
          <div
            key={task.id}
            style={{
              borderRadius: 16,
              padding: '12px 14px',
              border: `1px solid ${isDark ? theme.cardBorder : 'rgba(148, 163, 184, 0.24)'}`,
              background: isDark ? theme.cardBg : '#ffffff',
            }}
          >
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Space wrap size={8}>
                <Text strong style={{ color: theme.textPrimary }}>
                  {task.name}
                </Text>
                <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
              </Space>
              <Text type="secondary">{formatScheduleSummary(task.schedule)}</Text>
              <Text type="secondary">
                {'\u4e0b\u6b21\u6267\u884c'}: {task.next_run_time ? dayjs(task.next_run_time).format('MM-DD HH:mm:ss') : '-'}
              </Text>
            </Space>
          </div>
        );
      })}
    </Space>
  );
});
