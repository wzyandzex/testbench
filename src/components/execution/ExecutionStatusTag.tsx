import { Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  LoadingOutlined,
  StopOutlined,
} from '@ant-design/icons';
import { useThemeTokens } from '@/theme';

const statusConfig = {
  pending: {
    icon: <ClockCircleOutlined />,
    statusKey: 'default' as const,
  },
  running: {
    icon: <LoadingOutlined />,
    statusKey: 'info' as const,
  },
  completed: {
    icon: <CheckCircleOutlined />,
    statusKey: 'success' as const,
  },
  failed: {
    icon: <CloseCircleOutlined />,
    statusKey: 'error' as const,
  },
  cancelled: {
    icon: <StopOutlined />,
    statusKey: 'default' as const,
  },
  timeout: {
    icon: <ClockCircleOutlined />,
    statusKey: 'warning' as const,
  },
} as const;

export function ExecutionStatusTag({ status }: { status: keyof typeof statusConfig }) {
  const { t } = useTranslation('executions');
  const tokens = useThemeTokens();
  const config = statusConfig[status] || statusConfig.pending;

  const color = (() => {
    switch (config.statusKey) {
      case 'info':
        return tokens.status.info;
      case 'success':
        return tokens.status.success;
      case 'error':
        return tokens.status.error;
      case 'warning':
        return tokens.status.warning;
      default:
        return tokens.text.disabled;
    }
  })();

  return (
    <Tag
      icon={config.icon}
      style={{
        margin: 0,
        padding: '4px 12px',
        borderRadius: 20,
        border: `1px solid ${color}30`,
        background: `${color}15`,
        color,
        fontSize: 13,
        fontWeight: 500,
      }}
    >
      {t(`status.${status}`)}
    </Tag>
  );
}
