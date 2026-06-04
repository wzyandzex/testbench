/**
 * NotificationPreview Component
 * Notification preview card - slides in from right on hover
 */

import { memo } from 'react';
import { CheckCircleFilled, CloseCircleFilled, InfoCircleFilled, BellFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

export type NotificationType = 'success' | 'error' | 'info' | 'system';

export interface NotificationPreviewProps {
  type: NotificationType;
  title?: string;
  message?: string;
  time?: string;
  visible?: boolean;
}

// Notification type config
const notificationConfig = {
  success: {
    icon: <CheckCircleFilled />,
    bgColor: 'rgba(82, 196, 26, 0.1)',
    iconColor: '#52c41a',
    borderColor: 'rgba(82, 196, 26, 0.3)',
  },
  error: {
    icon: <CloseCircleFilled />,
    bgColor: 'rgba(255, 77, 79, 0.1)',
    iconColor: '#ff4d4f',
    borderColor: 'rgba(255, 77, 79, 0.3)',
  },
  info: {
    icon: <InfoCircleFilled />,
    bgColor: 'rgba(24, 144, 255, 0.1)',
    iconColor: '#1890ff',
    borderColor: 'rgba(24, 144, 255, 0.3)',
  },
  system: {
    icon: <BellFilled />,
    bgColor: 'rgba(102, 126, 234, 0.1)',
    iconColor: '#667eea',
    borderColor: 'rgba(102, 126, 234, 0.3)',
  },
} as const;

export const NotificationPreview = memo(function NotificationPreview({
  type,
  title,
  message,
  time,
  visible = true,
}: NotificationPreviewProps) {
  const { t } = useTranslation('settings');
  if (!visible) return null;

  const config = notificationConfig[type];
  const content = {
    title: t(`notificationPreview.${type}.title`),
    message: t(`notificationPreview.${type}.message`),
    time: t(`notificationPreview.${type}.time`),
  };

  return (
    <div className="notification-preview">
      <div
        className="notification-preview-content"
        style={{
          '--notification-bg': config.bgColor,
          '--notification-icon-color': config.iconColor,
          '--notification-border-color': config.borderColor,
        } as React.CSSProperties}
      >
        <div className="notification-preview-icon">{config.icon}</div>
        <div className="notification-preview-body">
          <div className="notification-preview-header">
            <span className="notification-preview-title">{title || content.title}</span>
            <span className="notification-preview-time">{time || content.time}</span>
          </div>
          <p className="notification-preview-message">{message || content.message}</p>
        </div>
      </div>
      {/* 3D decoration */}
      <div className="notification-preview-shine" />
    </div>
  );
});

export default NotificationPreview;
