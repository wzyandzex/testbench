/**
 * SWE task progress display
 */

import { Progress, Space, Typography, Card } from 'antd';
import {
  CheckCircleOutlined,
  LoadingOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import type { SWEBenchTask } from '@/types';

const { Text } = Typography;

interface SWETaskProgressProps {
  task: SWEBenchTask;
  style?: React.CSSProperties;
}

// Phase color map
const PHASE_COLORS: Record<string, string> = {
  idle: '#d9d9d9',
  cloning: '#1890ff',
  setup: '#52c41a',
  analyzing: '#722ed1',
  fixing: '#fa8c16',
  testing: '#13c2c2',
  verifying: '#eb2f96',
  completed: '#52c41a',
  failed: '#ff4d4f',
};

// Phase label map (lazy via i18next)
const getPhaseLabel = (phase: string): string => {
  return i18next.t(`swe:progress.phaseLabels.${phase}`, { defaultValue: phase });
};

export const SWETaskProgress = ({ task, style }: SWETaskProgressProps) => {
  const { t } = useTranslation('swe');
  const { currentPhase, progress, status } = task;
  const phaseColor = PHASE_COLORS[currentPhase] || '#d9d9d9';
  const phaseLabel = getPhaseLabel(currentPhase) || t('progress.unknown');

  // Progress bar status
  let progressStatus: 'normal' | 'active' | 'success' | 'exception' = 'normal';
  let icon = null;

  if (status === 'running') {
    progressStatus = 'active';
    icon = <LoadingOutlined />;
  } else if (status === 'completed') {
    progressStatus = 'success';
    icon = <CheckCircleOutlined />;
  } else if (status === 'failed') {
    progressStatus = 'exception';
    icon = <ExclamationCircleOutlined />;
  }

  // Format duration
  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return t('detail.duration.seconds', { count: seconds });
    if (seconds < 3600) return t('detail.duration.minutesSeconds', {
      minutes: Math.floor(seconds / 60),
      seconds: seconds % 60,
    });
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return t('detail.duration.hoursMinutes', { hours, minutes });
  };

  return (
    <Card size="small" style={style}>
      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        {/* Phase + progress */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space>
            {icon}
            <Text strong>{phaseLabel}</Text>
          </Space>
          <Text type="secondary">{progress}%</Text>
        </div>

        {/* Progress bar */}
        <Progress
          percent={progress}
          status={progressStatus}
          strokeColor={phaseColor}
          showInfo={false}
        />

        {/* Time info */}
        {task.startedAt && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('progress.startedAt')}: {new Date(task.startedAt).toLocaleString()}
          </Text>
        )}

        {task.duration && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {t('progress.elapsedTime')}: {formatDuration(task.duration)}
          </Text>
        )}
      </Space>
    </Card>
  );
};

export default SWETaskProgress;
