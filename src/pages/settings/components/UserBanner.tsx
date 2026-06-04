/**
 * UserBanner Component
 * Top user banner card - gradient background + decorative orbs
 */

import { memo, useCallback } from 'react';
import { Avatar, Button } from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';

// Mock user data
const mockUser = {
  username: 'admin',
  email: 'admin@example.com',
  avatar: '',
  get bio() { return i18next.t('settings:profile.bio'); },
};

export interface UserBannerProps {
  username?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  onEditProfile?: () => void;
}

export const UserBanner = memo(function UserBanner({
  username = mockUser.username,
  email = mockUser.email,
  avatar = mockUser.avatar,
  bio = mockUser.bio,
  onEditProfile,
}: UserBannerProps) {
  const { t } = useTranslation('settings');
  const handleEditClick = useCallback(() => {
    onEditProfile?.();
  }, [onEditProfile]);

  return (
    <div className="settings-user-banner">
      {/* Decorative orbs - dark theme */}
      <div className="settings-banner-orb settings-banner-orb-1" />
      <div className="settings-banner-orb settings-banner-orb-2" />
      <div className="settings-banner-orb settings-banner-orb-3" />

      {/* User info */}
      <div className="settings-banner-content">
        <Avatar
          size={72}
          icon={<UserOutlined />}
          src={avatar}
          className="settings-banner-avatar"
        />
        <div className="settings-banner-info">
          <div className="settings-banner-header">
            <h2 className="settings-banner-username">{username}</h2>
            <Button
              type="text"
              icon={<EditOutlined />}
              className="settings-banner-edit-btn"
              onClick={handleEditClick}
            >
              {t('profile.editProfile')}
            </Button>
          </div>
          <p className="settings-banner-email">{email}</p>
          <p className="settings-banner-bio">{bio}</p>
        </div>
      </div>
    </div>
  );
});

export default UserBanner;
