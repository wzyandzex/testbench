/**
 * NotificationTimelineItem Component
 * Single timeline item - notification setting with hover preview
 */

import { memo, useState, useCallback, ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SettingSwitch } from './SettingSwitch';
import { NotificationPreview, NotificationType } from './NotificationPreview';

export interface NotificationTimelineItemProps {
  icon: ReactNode;
  label: string;
  description: string;
  checked: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  notificationType?: NotificationType;
  notificationTitle?: string;
  notificationMessage?: string;
  notificationTime?: string;
  className?: string;
}

export const NotificationTimelineItem = memo(function NotificationTimelineItem({
  icon,
  label,
  description,
  checked,
  onChange,
  disabled = false,
  notificationType = 'info',
  notificationTitle,
  notificationMessage,
  notificationTime,
  className = '',
}: NotificationTimelineItemProps) {
  const { t } = useTranslation('settings');
  const [isHovered, setIsHovered] = useState(false);

  const defaults = {
    title: t(`notificationPreview.timelineDefaults.${notificationType}Title`),
    message: t(`notificationPreview.timelineDefaults.${notificationType}Message`),
    time: t(`notificationPreview.timelineDefaults.${notificationType}Time`),
  };

  const handleMouseEnter = useCallback(() => {
    if (!disabled) {
      setIsHovered(true);
    }
  }, [disabled]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
  }, []);

  return (
    <div
      className={`notification-timeline-item ${isHovered ? 'notification-timeline-item-hovered' : ''} ${disabled ? 'notification-timeline-item-disabled' : ''} ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Timeline dot */}
      <div className="notification-timeline-dot">
        <div className="notification-timeline-dot-inner" />
      </div>

      {/* Setting item content */}
      <div className="notification-timeline-content">
        <div className="notification-timeline-icon">{icon}</div>
        <div className="notification-timeline-info">
          <div className="notification-timeline-label-row">
            <span className="notification-timeline-label">{label}</span>
            <SettingSwitch
              checked={checked}
              onChange={onChange}
              disabled={disabled}
              size="medium"
            />
          </div>
          <p className="notification-timeline-description">{description}</p>
        </div>
      </div>

      {/* Notification preview card */}
      <NotificationPreview
        type={notificationType}
        title={notificationTitle ?? defaults.title}
        message={notificationMessage ?? defaults.message}
        time={notificationTime ?? defaults.time}
        visible={isHovered && checked}
      />
    </div>
  );
});

export default NotificationTimelineItem;
