import { Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined, LoadingOutlined, StopOutlined } from '@ant-design/icons';

type StatusType = 'success' | 'error' | 'warning' | 'default' | 'processing';
type StatusKey = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

interface StatusBadgeProps {
  status: StatusKey;
  text?: string;
}

const statusConfig: Record<
  StatusKey,
  { status: StatusType; icon: React.ReactNode; color: string; labelKey: string }
> = {
  pending: {
    status: 'default',
    icon: <ClockCircleOutlined />,
    color: '#faad14',
    labelKey: 'components.statusBadge.pending',
  },
  running: {
    status: 'processing',
    icon: <LoadingOutlined />,
    color: '#1890ff',
    labelKey: 'components.statusBadge.running',
  },
  completed: {
    status: 'success',
    icon: <CheckCircleOutlined />,
    color: '#52c41a',
    labelKey: 'components.statusBadge.completed',
  },
  failed: {
    status: 'error',
    icon: <CloseCircleOutlined />,
    color: '#ff4d4f',
    labelKey: 'components.statusBadge.failed',
  },
  cancelled: {
    status: 'default',
    icon: <StopOutlined />,
    color: '#8c8c8c',
    labelKey: 'components.statusBadge.cancelled',
  },
};

export function StatusBadge({ status, text }: StatusBadgeProps) {
  const { t } = useTranslation('common');
  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Space size={4}>
      <span style={{ color: config.color }}>{config.icon}</span>
      <span style={{ color: config.color }}>{text || t(config.labelKey)}</span>
    </Space>
  );
}
