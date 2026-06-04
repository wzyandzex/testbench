import {
  BellOutlined,
  CameraOutlined,
  LockOutlined,
  MailOutlined,
  MoonOutlined,
  SafetyCertificateOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Checkbox,
  Col,
  Descriptions,
  Form,
  Input,
  Modal,
  Radio,
  Row,
  Select,
  Space,
  Switch,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import type { CSSProperties } from 'react';
import type { FormInstance } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { authService } from '@/services/auth';
import { useAuthStore, useUiStore } from '@/stores';
import { useThemeTokens } from '@/theme';
import { EmailChangeModal } from './components/EmailChangeModal';

type SettingsTabKey = 'profile' | 'security' | 'notifications' | 'preferences';

type AvatarFormValues = {
  avatar_url: string;
};

type PasswordFormValues = {
  old_password: string;
  new_password: string;
  confirm_password: string;
};

type DeleteFormValues = {
  password: string;
  confirm: boolean;
};

type NotificationPreferences = {
  taskComplete: boolean;
  taskFailed: boolean;
  systemAnnouncements: boolean;
  emailDigest: boolean;
};

type SavedUiPreferences = {
  theme?: 'light' | 'dark';
  layoutMode?: 'classic' | 'modern';
  language?: 'zh-CN' | 'en-US';
};

const notificationStorageKey = 'settings_notification_preferences';
const uiPreferenceStorageKey = 'settings_ui_preferences';

const defaultNotificationPreferences: NotificationPreferences = {
  taskComplete: true,
  taskFailed: true,
  systemAnnouncements: true,
  emailDigest: false,
};

const themeOptions = [
  { labelKey: 'ui.light', value: 'light' },
  { labelKey: 'ui.dark', value: 'dark' },
];

const layoutOptions = [
  { labelKey: 'ui.classic', value: 'classic' },
  { labelKey: 'ui.modern', value: 'modern' },
];

const languageOptions = [
  { labelKey: 'ui.zhCN', value: 'zh-CN' },
  { labelKey: 'ui.enUS', value: 'en-US' },
];

function readNotificationPreferences(): NotificationPreferences {
  if (typeof window === 'undefined') {
    return defaultNotificationPreferences;
  }

  try {
    const raw = window.localStorage.getItem(notificationStorageKey);
    if (!raw) {
      return defaultNotificationPreferences;
    }

    return {
      ...defaultNotificationPreferences,
      ...(JSON.parse(raw) as Partial<NotificationPreferences>),
    };
  } catch {
    return defaultNotificationPreferences;
  }
}

function readSavedUiPreferences(): SavedUiPreferences {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = window.localStorage.getItem(uiPreferenceStorageKey);
    return raw ? (JSON.parse(raw) as SavedUiPreferences) : {};
  } catch {
    return {};
  }
}

type ThemeTokenShape = ReturnType<typeof useThemeTokens>;

export default function SettingsPage() {
  const { t } = useTranslation('settings');
  const navigate = useNavigate();
  const tokens = useThemeTokens();
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const theme = useUiStore((state) => state.theme);
  const setTheme = useUiStore((state) => state.setTheme);
  const layoutMode = useUiStore((state) => state.layoutMode);
  const setLayoutMode = useUiStore((state) => state.setLayoutMode);
  const language = useUiStore((state) => state.language);
  const setLanguage = useUiStore((state) => state.setLanguage);

  const [activeTab, setActiveTab] = useState<SettingsTabKey>('profile');
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [deleteSubmitting, setDeleteSubmitting] = useState(false);
  const [avatarSubmitting, setAvatarSubmitting] = useState(false);
  const [notificationPreferences, setNotificationPreferences] = useState<NotificationPreferences>(
    readNotificationPreferences
  );

  const [avatarForm] = Form.useForm<AvatarFormValues>();
  const [passwordForm] = Form.useForm<PasswordFormValues>();
  const [deleteForm] = Form.useForm<DeleteFormValues>();

  useEffect(() => {
    avatarForm.setFieldsValue({ avatar_url: user?.avatar || '' });
  }, [avatarForm, user?.avatar]);

  useEffect(() => {
    const saved = readSavedUiPreferences();
    if (saved.theme) {
      setTheme(saved.theme);
    }
    if (saved.layoutMode) {
      setLayoutMode(saved.layoutMode);
    }
    if (saved.language) {
      setLanguage(saved.language);
    }
  }, [setLanguage, setLayoutMode, setTheme]);

  const cardStyle = useMemo<CSSProperties>(
    () => ({
      background: tokens.bg.elevated,
      border: `1px solid ${tokens.border.default}`,
      borderRadius: 24,
      boxShadow:
        theme === 'dark'
          ? '0 18px 60px rgba(0, 0, 0, 0.28)'
          : '0 16px 40px rgba(15, 23, 42, 0.08)',
    }),
    [theme, tokens]
  );

  const heroStyle = useMemo<CSSProperties>(
    () => ({
      ...cardStyle,
      overflow: 'hidden',
      background:
        theme === 'dark'
          ? 'radial-gradient(circle at top right, rgba(102, 126, 234, 0.34), transparent 32%), linear-gradient(135deg, rgba(16, 24, 40, 0.96), rgba(31, 41, 55, 0.92))'
          : 'radial-gradient(circle at top right, rgba(245, 158, 11, 0.18), transparent 30%), linear-gradient(135deg, rgba(255, 251, 235, 0.96), rgba(255, 255, 255, 0.98))',
    }),
    [cardStyle, theme]
  );

  const pageStyle = useMemo<CSSProperties>(
    () => ({
      maxWidth: 1180,
      margin: '0 auto',
      padding: '24px 24px 40px',
    }),
    []
  );

  const handleSubmitAvatar = useCallback(async () => {
    const values = await avatarForm.validateFields();
    setAvatarSubmitting(true);
    try {
      const result = await authService.updateAvatar(values.avatar_url);
      updateUser({ avatar: result.avatar_url || values.avatar_url });
      message.success(t('avatar.updated'));
    } finally {
      setAvatarSubmitting(false);
    }
  }, [avatarForm, updateUser, t]);

  const handlePasswordSubmit = useCallback(async () => {
    const values = await passwordForm.validateFields();
    setPasswordSubmitting(true);
    try {
      await authService.changePassword({
        old_password: values.old_password,
        new_password: values.new_password,
      });
      message.success(t('password.updated'));
      setPasswordModalOpen(false);
      passwordForm.resetFields();
    } finally {
      setPasswordSubmitting(false);
    }
  }, [passwordForm]);

  const handleDeleteSubmit = useCallback(async () => {
    const values = await deleteForm.validateFields();
    setDeleteSubmitting(true);
    try {
      await authService.deleteAccount({
        password: values.password,
        confirm: values.confirm,
      });
      clearAuth();
      message.success(t('deleteAccount.success'));
      navigate('/login', { replace: true });
    } finally {
      setDeleteSubmitting(false);
    }
  }, [clearAuth, deleteForm, navigate]);

  const tabItems = useMemo(
    () => [
      {
        key: 'profile',
        label: (
          <Space size={8}>
            <UserOutlined />
            {t('account.title')}
          </Space>
        ),
        children: (
          <ProfileTab
            user={user}
            avatarForm={avatarForm}
            avatarSubmitting={avatarSubmitting}
            onSubmitAvatar={handleSubmitAvatar}
            cardStyle={cardStyle}
            tokens={tokens}
          />
        ),
      },
      {
        key: 'security',
        label: (
          <Space size={8}>
            <LockOutlined />
            {t('password.title')}
          </Space>
        ),
        children: (
          <SecurityTab
            userEmail={user?.email || ''}
            onOpenPassword={() => setPasswordModalOpen(true)}
            onOpenEmailChange={() => setEmailModalOpen(true)}
            onOpenDelete={() => setDeleteModalOpen(true)}
            cardStyle={cardStyle}
            tokens={tokens}
          />
        ),
      },
      {
        key: 'notifications',
        label: (
          <Space size={8}>
            <BellOutlined />
            {t('notifications.title')}
          </Space>
        ),
        children: (
          <NotificationsTab
            preferences={notificationPreferences}
            onChange={setNotificationPreferences}
            onSave={() => {
              window.localStorage.setItem(
                notificationStorageKey,
                JSON.stringify(notificationPreferences)
              );
              message.success(t('notifications.saved'));
            }}
            cardStyle={cardStyle}
            tokens={tokens}
          />
        ),
      },
      {
        key: 'preferences',
        label: (
          <Space size={8}>
            <MoonOutlined />
            {t('ui.title')}
          </Space>
        ),
        children: (
          <PreferencesTab
            theme={theme}
            layoutMode={layoutMode}
            language={language}
            onThemeChange={setTheme}
            onLayoutModeChange={setLayoutMode}
            onLanguageChange={setLanguage}
            onSave={() => {
              window.localStorage.setItem(
                uiPreferenceStorageKey,
                JSON.stringify({ theme, layoutMode, language })
              );
              message.success(t('ui.saved'));
            }}
            cardStyle={cardStyle}
            tokens={tokens}
          />
        ),
      },
    ],
    [
      avatarForm,
      avatarSubmitting,
      cardStyle,
      handleSubmitAvatar,
      language,
      layoutMode,
      notificationPreferences,
      setLanguage,
      setLayoutMode,
      setTheme,
      t,
      theme,
      tokens,
      user,
    ]
  );

  return (
    <div style={pageStyle}>
      <PageHeader
        title={t('title')}
        description={t('description')}
      />

      <Card bordered={false} style={heroStyle}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={16}>
            <Space size={20} align="start">
              <Avatar size={88} src={user?.avatar} icon={<UserOutlined />} />
              <div>
                <Typography.Title level={2} style={{ margin: 0, color: tokens.text.primary }}>
                  {user?.username || t('account.currentUser')}
                </Typography.Title>
                <Space size={[8, 8]} wrap style={{ marginTop: 8 }}>
                  <Tag color="blue">{user?.role || 'user'}</Tag>
                  {user?.email ? <Tag color="gold">{user.email}</Tag> : null}
                  <Tag color="green">{t('account.title')}</Tag>
                </Space>
                <Typography.Paragraph
                  style={{
                    marginTop: 14,
                    marginBottom: 0,
                    color: tokens.text.secondary,
                    maxWidth: 620,
                  }}
                >
                  {t('profile.notice')}
                </Typography.Paragraph>
              </div>
            </Space>
          </Col>
          <Col xs={24} md={8}>
            <Card
              size="small"
              bordered={false}
              style={{
                background: theme === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.72)',
                borderRadius: 20,
              }}
            >
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                <Typography.Text style={{ color: tokens.text.secondary }}>{t('common:actions.view')}</Typography.Text>
                <Button block icon={<MailOutlined />} onClick={() => setEmailModalOpen(true)}>
                  {t('email.title')}
                </Button>
                <Button block icon={<LockOutlined />} onClick={() => setPasswordModalOpen(true)}>
                  {t('password.title')}
                </Button>
                <Button
                  block
                  danger
                  icon={<WarningOutlined />}
                  onClick={() => setDeleteModalOpen(true)}
                >
                  {t('deleteAccount.title')}
                </Button>
              </Space>
            </Card>
          </Col>
        </Row>
      </Card>

      <Card bordered={false} style={{ ...cardStyle, marginTop: 24 }}>
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key as SettingsTabKey)}
          items={tabItems}
          destroyInactiveTabPane={false}
        />
      </Card>

      <EmailChangeModal
        open={emailModalOpen}
        currentEmail={user?.email || ''}
        onClose={() => setEmailModalOpen(false)}
        onSuccess={(newEmail) => {
          updateUser({ email: newEmail });
          message.success(t('email.updated'));
        }}
      />

      <PasswordModal
        open={passwordModalOpen}
        form={passwordForm}
        submitting={passwordSubmitting}
        onCancel={() => {
          setPasswordModalOpen(false);
          passwordForm.resetFields();
        }}
        onSubmit={handlePasswordSubmit}
      />

      <DeleteAccountModal
        open={deleteModalOpen}
        form={deleteForm}
        submitting={deleteSubmitting}
        onCancel={() => {
          setDeleteModalOpen(false);
          deleteForm.resetFields();
        }}
        onSubmit={handleDeleteSubmit}
      />
    </div>
  );
}

type SharedCardProps = {
  cardStyle: CSSProperties;
  tokens: ThemeTokenShape;
};

type ProfileTabProps = SharedCardProps & {
  user: ReturnType<typeof useAuthStore.getState>['user'];
  avatarForm: FormInstance<AvatarFormValues>;
  avatarSubmitting: boolean;
  onSubmitAvatar: () => Promise<void>;
};

function ProfileTab({
  user,
  avatarForm,
  avatarSubmitting,
  onSubmitAvatar,
  cardStyle,
  tokens,
}: ProfileTabProps) {
  const { t } = useTranslation('settings');
  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card bordered={false} style={cardStyle}>
        <Descriptions
          title={t('account.title')}
          column={{ xs: 1, sm: 2, lg: 3 }}
          labelStyle={{ color: tokens.text.secondary }}
          contentStyle={{ color: tokens.text.primary, fontWeight: 500 }}
        >
          <Descriptions.Item label={t('account.username')}>{user?.username || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('account.email')}>{user?.email || '-'}</Descriptions.Item>
          <Descriptions.Item label={t('account.role')}>{user?.role || '-'}</Descriptions.Item>
        </Descriptions>
      </Card>

      <Card bordered={false} style={cardStyle}>
        <Row gutter={[24, 24]} align="middle">
          <Col xs={24} md={8}>
            <Space direction="vertical" align="center" style={{ width: '100%' }}>
              <Avatar size={96} src={user?.avatar} icon={<UserOutlined />} />
            </Space>
          </Col>
          <Col xs={24} md={16}>
            <Space direction="vertical" size={16} style={{ width: '100%' }}>
              <Alert
                type="info"
                showIcon
                message={t('avatar.notice')}
                description={t('avatar.noticeDesc')}
              />
              <Form form={avatarForm} layout="vertical">
                <Form.Item
                  label={t('avatar.urlLabel')}
                  name="avatar_url"
                  rules={[
                    { required: true, message: t('avatar.urlRequired') },
                    { type: 'url', message: t('avatar.urlInvalid') },
                  ]}
                >
                  <Input prefix={<CameraOutlined />} placeholder="https://example.com/avatar.png" />
                </Form.Item>
                <Button type="primary" loading={avatarSubmitting} onClick={onSubmitAvatar}>
                  {t('avatar.urlLabel')}
                </Button>
              </Form>
            </Space>
          </Col>
        </Row>
      </Card>

      <Alert
        type="warning"
        showIcon
        message={t('profile.notice')}
        description={t('profile.noticeDesc')}
      />
    </Space>
  );
}

type SecurityTabProps = SharedCardProps & {
  userEmail: string;
  onOpenPassword: () => void;
  onOpenEmailChange: () => void;
  onOpenDelete: () => void;
};

function SecurityTab({
  userEmail,
  onOpenPassword,
  onOpenEmailChange,
  onOpenDelete,
  cardStyle,
  tokens,
}: SecurityTabProps) {
  const { t } = useTranslation('settings');
  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card bordered={false} style={cardStyle}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space align="start">
            <LockOutlined style={{ fontSize: 18, color: tokens.brand.primary }} />
            <div>
              <Typography.Title level={4} style={{ margin: 0, color: tokens.text.primary }}>
                {t('password.title')}
              </Typography.Title>
              <Typography.Paragraph style={{ margin: '6px 0 0', color: tokens.text.secondary }}>
                {t('password.rulesDesc')}
              </Typography.Paragraph>
            </div>
          </Space>
          <Button type="primary" onClick={onOpenPassword}>
            {t('password.title')}
          </Button>
        </Space>
      </Card>

      <Card bordered={false} style={cardStyle}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space align="start">
            <MailOutlined style={{ fontSize: 18, color: '#d97706' }} />
            <div>
              <Typography.Title level={4} style={{ margin: 0, color: tokens.text.primary }}>
                {t('email.title')}
              </Typography.Title>
              <Typography.Paragraph style={{ margin: '6px 0 0', color: tokens.text.secondary }}>
                {t('email.currentEmail')}: {userEmail || '-'}
              </Typography.Paragraph>
            </div>
          </Space>
          <Button onClick={onOpenEmailChange}>{t('email.title')}</Button>
        </Space>
      </Card>

      <Alert
        type="warning"
        showIcon
        message={t('twoFactor.notice')}
        description={t('twoFactor.noticeDesc')}
        icon={<SafetyCertificateOutlined />}
      />

      <Card bordered={false} style={{ ...cardStyle, border: '1px solid rgba(239, 68, 68, 0.28)' }}>
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Space align="start">
            <WarningOutlined style={{ fontSize: 18, color: '#ef4444' }} />
            <div>
              <Typography.Title level={4} style={{ margin: 0, color: tokens.text.primary }}>
                {t('deleteAccount.title')}
              </Typography.Title>
              <Typography.Paragraph style={{ margin: '6px 0 0', color: tokens.text.secondary }}>
                {t('deleteAccount.warningDesc')}
              </Typography.Paragraph>
            </div>
          </Space>
          <Button danger onClick={onOpenDelete}>
            {t('deleteAccount.title')}
          </Button>
        </Space>
      </Card>
    </Space>
  );
}

type NotificationsTabProps = SharedCardProps & {
  preferences: NotificationPreferences;
  onChange: (next: NotificationPreferences) => void;
  onSave: () => void;
};

function NotificationsTab({ preferences, onChange, onSave, cardStyle, tokens }: NotificationsTabProps) {
  const { t } = useTranslation('settings');
  const updatePreference = useCallback(
    (key: keyof NotificationPreferences, value: boolean) => {
      onChange({
        ...preferences,
        [key]: value,
      });
    },
    [onChange, preferences]
  );

  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message={t('notifications.notice')}
        description={t('notifications.noticeDesc')}
      />

      <Card bordered={false} style={cardStyle}>
        <Space direction="vertical" size={20} style={{ width: '100%' }}>
          {([
            ['taskComplete', t('notifications.taskComplete'), t('notifications.taskCompleteDesc')],
            ['taskFailed', t('notifications.taskFailed'), t('notifications.taskFailedDesc')],
            ['systemAnnouncements', t('notifications.systemAnnouncements'), t('notifications.systemAnnouncementsDesc')],
            ['emailDigest', t('notifications.emailDigest'), t('notifications.emailDigestDesc')],
          ] as const).map(([key, title, description]) => (
            <Row key={key} justify="space-between" align="middle" gutter={[16, 16]}>
              <Col flex="auto">
                <Typography.Text strong style={{ color: tokens.text.primary }}>
                  {title}
                </Typography.Text>
                <Typography.Paragraph style={{ margin: '4px 0 0', color: tokens.text.secondary }}>
                  {description}
                </Typography.Paragraph>
              </Col>
              <Col>
                <Switch
                  checked={preferences[key as keyof NotificationPreferences]}
                  onChange={(checked) =>
                    updatePreference(key as keyof NotificationPreferences, checked)
                  }
                />
              </Col>
            </Row>
          ))}

          <Button type="primary" onClick={onSave}>
            {t('notifications.title')}
          </Button>
        </Space>
      </Card>
    </Space>
  );
}

type PreferencesTabProps = SharedCardProps & {
  theme: 'light' | 'dark';
  layoutMode: 'classic' | 'modern';
  language: 'zh-CN' | 'en-US';
  onThemeChange: (value: 'light' | 'dark') => void;
  onLayoutModeChange: (value: 'classic' | 'modern') => void;
  onLanguageChange: (value: 'zh-CN' | 'en-US') => void;
  onSave: () => void;
};

function PreferencesTab({
  theme,
  layoutMode,
  language,
  onThemeChange,
  onLayoutModeChange,
  onLanguageChange,
  onSave,
  cardStyle,
  tokens,
}: PreferencesTabProps) {
  const { t } = useTranslation('settings');
  return (
    <Space direction="vertical" size={20} style={{ width: '100%' }}>
      <Card bordered={false} style={cardStyle}>
        <Space direction="vertical" size={24} style={{ width: '100%' }}>
          <div>
            <Typography.Text strong style={{ color: tokens.text.primary }}>
              {t('ui.light')}/{t('ui.dark')}
            </Typography.Text>
            <div style={{ marginTop: 12 }}>
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                value={theme}
                onChange={(event) => onThemeChange(event.target.value)}
                options={themeOptions.map(o => ({ label: t(o.labelKey), value: o.value }))}
              />
            </div>
          </div>

          <div>
            <Typography.Text strong style={{ color: tokens.text.primary }}>
              {t('ui.classic')}/{t('ui.modern')}
            </Typography.Text>
            <div style={{ marginTop: 12 }}>
              <Radio.Group
                optionType="button"
                buttonStyle="solid"
                value={layoutMode}
                onChange={(event) => onLayoutModeChange(event.target.value)}
                options={layoutOptions.map(o => ({ label: t(o.labelKey), value: o.value }))}
              />
            </div>
          </div>

          <div>
            <Typography.Text strong style={{ color: tokens.text.primary }}>
              {t('common:language', 'Language')}
            </Typography.Text>
            <div style={{ marginTop: 12, maxWidth: 260 }}>
              <Select
                value={language}
                onChange={onLanguageChange}
                options={languageOptions.map((opt) => ({ value: opt.value, label: t(opt.labelKey) }))}
              />
            </div>
          </div>

          <Alert
            type="info"
            showIcon
            message={t('ui.notice')}
            description={t('ui.noticeDesc')}
          />

          <Button type="primary" onClick={onSave}>
            {t('ui.saved')}
          </Button>
        </Space>
      </Card>
    </Space>
  );
}

type PasswordModalProps = {
  open: boolean;
  form: FormInstance<PasswordFormValues>;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
};

function PasswordModal({ open, form, submitting, onCancel, onSubmit }: PasswordModalProps) {
  const { t } = useTranslation('settings');
  return (
    <Modal
      open={open}
      title={t('password.title')}
      onCancel={onCancel}
      onOk={onSubmit}
      okText={t('password.okText')}
      cancelText={t('common:actions.cancel', 'Cancel')}
      confirmLoading={submitting}
      destroyOnHidden
    >
      <div style={{ marginTop: 16 }}>
        <Alert
          type="info"
          showIcon
          message={t('password.rules')}
          description={t('password.rulesDesc')}
          style={{ marginBottom: 16 }}
        />
        <Form form={form} layout="vertical">
          <Form.Item
            label={t('password.currentPassword')}
            name="old_password"
            rules={[{ required: true, message: t('password.currentRequired') }]}
          >
            <Input.Password placeholder={t('password.currentPlaceholder')} />
          </Form.Item>
          <Form.Item
            label={t('password.newPassword')}
            name="new_password"
            rules={[
              { required: true, message: t('password.newRequired') },
              { min: 8, message: t('password.newMin') },
              {
                pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/,
                message: t('password.newFormat'),
              },
            ]}
          >
            <Input.Password placeholder={t('password.newPlaceholder')} />
          </Form.Item>
          <Form.Item
            label={t('password.confirmPassword')}
            name="confirm_password"
            dependencies={['new_password']}
            rules={[
              { required: true, message: t('password.confirmRequired') },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('new_password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('password.mismatch')));
                },
              }),
            ]}
          >
            <Input.Password placeholder={t('password.confirmPlaceholder')} />
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}

type DeleteAccountModalProps = {
  open: boolean;
  form: FormInstance<DeleteFormValues>;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: () => void;
};

function DeleteAccountModal({
  open,
  form,
  submitting,
  onCancel,
  onSubmit,
}: DeleteAccountModalProps) {
  const { t } = useTranslation('settings');
  return (
    <Modal
      open={open}
      title={t('deleteAccount.title')}
      onCancel={onCancel}
      onOk={onSubmit}
      okText={t('deleteAccount.okText')}
      cancelText={t('common:actions.cancel', 'Cancel')}
      okButtonProps={{ danger: true }}
      confirmLoading={submitting}
      destroyOnHidden
    >
      <div style={{ marginTop: 16 }}>
        <Alert
          type="error"
          showIcon
          message={t('deleteAccount.warning')}
          description={t('deleteAccount.warningDesc')}
          style={{ marginBottom: 16 }}
        />
        <Form form={form} layout="vertical">
          <Form.Item
            label={t('deleteAccount.passwordLabel')}
            name="password"
            rules={[{ required: true, message: t('deleteAccount.passwordRequired') }]}
          >
            <Input.Password placeholder={t('deleteAccount.passwordPlaceholder')} />
          </Form.Item>
          <Form.Item
            name="confirm"
            valuePropName="checked"
            rules={[
              {
                validator: (_, value) => {
                  if (value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error(t('deleteAccount.confirmRequired')));
                },
              },
            ]}
          >
            <Checkbox>{t('deleteAccount.warning')}</Checkbox>
          </Form.Item>
        </Form>
      </div>
    </Modal>
  );
}
