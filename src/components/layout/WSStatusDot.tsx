import { memo } from 'react';
import { Tooltip } from 'antd';
import { useTranslation } from 'react-i18next';
import { useWSStore } from '@/stores/wsStore';

const STATE_COLORS: Record<string, string> = {
  connected: '#52c41a',
  connecting: '#faad14',
  disconnected: '#ff4d4f',
  error: '#ff4d4f',
};

export const WSStatusDot = memo(() => {
  const connectionState = useWSStore((s) => s.connectionState);
  const { t } = useTranslation('common');
  const color = STATE_COLORS[connectionState] || STATE_COLORS.disconnected;

  const labels: Record<string, string> = {
    connected: t('ws.connected'),
    connecting: t('ws.connecting'),
    disconnected: t('ws.disconnected'),
    error: t('ws.error'),
  };

  if (connectionState === 'disconnected') return null;

  return (
    <Tooltip title={labels[connectionState]}>
      <span
        style={{
          display: 'inline-block',
          width: 8,
          height: 8,
          borderRadius: '50%',
          backgroundColor: color,
          boxShadow: connectionState === 'connected' ? `0 0 4px ${color}` : undefined,
          animation: connectionState === 'connecting' ? 'pulse 1.5s infinite' : undefined,
        }}
      />
    </Tooltip>
  );
});

WSStatusDot.displayName = 'WSStatusDot';
