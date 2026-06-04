import { memo } from 'react';
import { Empty } from 'antd';
import { useIsDark } from '@/theme';
import { getSchedulerTheme } from '../theme';
import { TaskCard } from './TaskCard';
import type { ScheduledTask } from '@/types/api/scheduled-task';

interface TaskGridProps {
  tasks: ScheduledTask[];
  onTaskPause?: (id: string) => void;
  onTaskResume?: (id: string) => void;
  onTaskTrigger?: (id: string) => void;
  onTaskEdit?: (task: ScheduledTask) => void;
  onTaskDelete?: (id: string) => void;
}

export const TaskGrid = memo(function TaskGrid({
  tasks,
  onTaskPause,
  onTaskResume,
  onTaskTrigger,
  onTaskEdit,
  onTaskDelete,
}: TaskGridProps) {
  const isDark = useIsDark();
  const theme = getSchedulerTheme(isDark);

  if (tasks.length === 0) {
    return (
      <div
        style={{
          padding: '48px 20px',
          borderRadius: 18,
          border: `1px solid ${isDark ? theme.cardBorder : 'rgba(148, 163, 184, 0.24)'}`,
          background: isDark ? theme.cardBg : '#ffffff',
        }}
      >
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={'\u6682\u65e0\u53ef\u5c55\u793a\u7684\u8c03\u5ea6\u4efb\u52a1'} />
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
        gap: 16,
      }}
    >
      {tasks.map((task) => (
        <TaskCard
          key={task.id}
          task={task}
          onPause={() => onTaskPause?.(task.id)}
          onResume={() => onTaskResume?.(task.id)}
          onTrigger={() => onTaskTrigger?.(task.id)}
          onEdit={() => onTaskEdit?.(task)}
          onDelete={() => onTaskDelete?.(task.id)}
        />
      ))}
    </div>
  );
});
