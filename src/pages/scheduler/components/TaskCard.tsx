import { memo } from 'react';
import { Button, Card, Space, Tag, Typography } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useIsDark } from '@/theme';
import { getSchedulerTheme } from '../theme';
import type { ScheduledTask } from '@/types/api/scheduled-task';
import {
  SCHEDULED_TASK_PRIORITY_CONFIG,
  SCHEDULED_TASK_RUN_STATUS_CONFIG,
  SCHEDULED_TASK_STATUS_CONFIG,
  formatScheduleSummary,
} from '@/types/api/scheduled-task';

const { Text } = Typography;

interface TaskCardProps {
  task: ScheduledTask;
  onPause?: () => void;
  onResume?: () => void;
  onTrigger?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const TaskCard = memo(function TaskCard({
  task,
  onPause,
  onResume,
  onTrigger,
  onEdit,
  onDelete,
}: TaskCardProps) {
  const isDark = useIsDark();
  const theme = getSchedulerTheme(isDark);
  const statusConfig = SCHEDULED_TASK_STATUS_CONFIG[task.status];
  const priorityConfig = SCHEDULED_TASK_PRIORITY_CONFIG[task.execution_config.task_config.priority];
  const runConfig = task.last_run_status ? SCHEDULED_TASK_RUN_STATUS_CONFIG[task.last_run_status] : null;

  return (
    <Card
      style={{
        borderRadius: 18,
        border: `1px solid ${isDark ? theme.cardBorder : 'rgba(148, 163, 184, 0.24)'}`,
        background: isDark ? theme.cardBg : '#ffffff',
        boxShadow: isDark ? theme.cardShadow : '0 12px 28px rgba(15, 23, 42, 0.08)',
      }}
      styles={{ body: { display: 'flex', flexDirection: 'column', gap: 12 } }}
    >
      <Space wrap size={8}>
        <Text strong style={{ color: theme.textPrimary }}>
          {task.name}
        </Text>
        <Tag color={statusConfig.color}>{statusConfig.label}</Tag>
        {!task.enabled && task.status !== 'archived' ? <Tag>{'\u5df2\u7981\u7528'}</Tag> : null}
        <Tag color={priorityConfig.color}>{priorityConfig.label}</Tag>
      </Space>

      {task.description ? <Text type="secondary">{task.description}</Text> : null}

      <div>
        <Tag style={{ fontFamily: 'monospace' }}>{task.schedule.expression}</Tag>
        <Text type="secondary">{formatScheduleSummary(task.schedule)}</Text>
      </div>

      <Space direction="vertical" size={2}>
        <Text type="secondary">
          {'\u4e0b\u6b21\u6267\u884c'}: {task.next_run_time ? dayjs(task.next_run_time).format('MM-DD HH:mm:ss') : '-'}
        </Text>
        <Text type="secondary">
          {'\u6700\u8fd1\u8fd0\u884c'}: {task.last_run_time ? dayjs(task.last_run_time).fromNow() : '-'}
        </Text>
        <Text type="secondary">
          {'\u6700\u8fd1\u72b6\u6001'}: {runConfig ? runConfig.label : '-'}
        </Text>
      </Space>

      <Space wrap>
        <Button disabled={task.status === 'archived'} onClick={task.enabled ? onPause : onResume}>
          {task.enabled ? '\u6682\u505c' : '\u542f\u7528'}
        </Button>
        <Button
          disabled={task.status === 'archived'}
          icon={<ThunderboltOutlined />}
          onClick={onTrigger}
        >
          {'\u7acb\u5373\u6267\u884c'}
        </Button>
        <Button onClick={onEdit}>{'\u7f16\u8f91'}</Button>
        <Button danger onClick={onDelete}>
          {'\u5220\u9664'}
        </Button>
      </Space>
    </Card>
  );
});
