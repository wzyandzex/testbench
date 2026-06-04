import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Button, Checkbox, Divider, Form, Input, Modal, Tabs, message } from 'antd';
import {
  ArrowRightOutlined,
  GithubOutlined,
  GoogleOutlined,
  LockOutlined,
  MailOutlined,
  StarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { authService } from '@/services';
import { useAuthStore } from '@/stores';
import type { LoginDto, RegisterDto } from '@/types/api/auth';
import './AuthPage.css';

const SOCIAL_PROVIDERS = [
  { icon: <GithubOutlined />, label: 'GitHub' },
  { icon: <GoogleOutlined />, label: 'Google' },
] as const;

const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_COMPLEXITY_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

interface LoginFormProps {
  onSuccess: () => void;
  onForgotPassword: () => void;
}

interface RegisterFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

function getRouteRedirectTarget(location: ReturnType<typeof useLocation>) {
  return (location.state as { from?: { pathname?: string } } | null)?.from?.pathname || '/dashboard';
}

const LoginForm = memo(function LoginForm({ onSuccess, onForgotPassword }: LoginFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('auth');
  const setAuth = useAuthStore((state) => state.setAuth);
  const [form] = Form.useForm<LoginDto & { remember?: boolean }>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (values: LoginDto) => {
    setLoading(true);
    try {
      const response = await authService.login(values);
      setAuth(response.user, response.access_token, response.refresh_token, {
        currentOrgID: response.current_org_id,
        currentOrgRole: response.current_org_role,
      });
      message.success(t('login.success'));
      onSuccess();
      navigate(getRouteRedirectTarget(location), { replace: true });
    } finally {
      setLoading(false);
    }
  }, [location, navigate, onSuccess, setAuth, t]);

  return (
    <Form<LoginDto & { remember?: boolean }>
      form={form}
      name="login"
      onFinish={handleSubmit}
      autoComplete="off"
      layout="vertical"
      requiredMark={false}
      className="auth-form"
    >
      <Form.Item
        name="username"
        rules={[{ required: true, message: t('login.usernameRequired') }]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder={t('login.usernamePlaceholder')}
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[{ required: true, message: t('login.passwordRequired') }]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder={t('login.passwordPlaceholder')}
          size="large"
        />
      </Form.Item>

      <div className="auth-form-actions">
        <Form.Item name="remember" valuePropName="checked" noStyle>
          <Checkbox>{t('login.rememberMe')}</Checkbox>
        </Form.Item>
        <Button type="link" size="small" onClick={onForgotPassword} className="auth-forgot-link">
          {t('login.forgotPassword')}
        </Button>
      </div>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={loading}
          icon={<ArrowRightOutlined className="auth-button-arrow" />}
          className="auth-submit-button"
        >
          {loading ? t('login.submitting') : t('login.submit')}
        </Button>
      </Form.Item>

      <Divider plain className="auth-divider">
        {t('login.socialDivider')}
      </Divider>

      <div className="auth-social">
        {SOCIAL_PROVIDERS.map((provider) => (
          <Button
            key={provider.label}
            icon={provider.icon}
            size="large"
            className="auth-social-button"
          >
            {provider.label}
          </Button>
        ))}
      </div>
    </Form>
  );
});

const RegisterForm = memo(function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation('auth');
  const setAuth = useAuthStore((state) => state.setAuth);
  const [form] = Form.useForm<RegisterDto & { confirmPassword?: string; agree?: boolean }>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(async (values: RegisterDto) => {
    setLoading(true);
    try {
      await authService.register(values);
      const response = await authService.login({
        username: values.username,
        password: values.password,
      });
      setAuth(response.user, response.access_token, response.refresh_token, {
        currentOrgID: response.current_org_id,
        currentOrgRole: response.current_org_role,
      });
      message.success(t('register.success'));
      onSuccess();
      navigate(getRouteRedirectTarget(location), { replace: true });
    } finally {
      setLoading(false);
    }
  }, [location, navigate, onSuccess, setAuth, t]);

  return (
    <Form<RegisterDto & { confirmPassword?: string; agree?: boolean }>
      form={form}
      name="register"
      onFinish={handleSubmit}
      autoComplete="off"
      layout="vertical"
      requiredMark={false}
      className="auth-form"
    >
      <Form.Item
        name="username"
        rules={[{ required: true, message: t('register.usernameRequired') }]}
      >
        <Input
          prefix={<UserOutlined />}
          placeholder={t('register.usernamePlaceholder')}
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="email"
        rules={[
          { required: true, message: t('register.emailRequired') },
          { type: 'email', message: t('register.emailInvalid') },
        ]}
      >
        <Input
          prefix={<MailOutlined />}
          placeholder={t('register.emailPlaceholder')}
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="password"
        rules={[
          { required: true, message: t('register.passwordRequired') },
          { min: PASSWORD_MIN_LENGTH, message: t('register.passwordMin') },
          { pattern: PASSWORD_COMPLEXITY_PATTERN, message: t('register.passwordFormat') },
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder={t('register.passwordPlaceholder')}
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="confirmPassword"
        dependencies={['password']}
        rules={[
          { required: true, message: t('register.confirmPasswordRequired') },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error(t('register.confirmPasswordMismatch')));
            },
          }),
        ]}
      >
        <Input.Password
          prefix={<LockOutlined />}
          placeholder={t('register.confirmPasswordPlaceholder')}
          size="large"
        />
      </Form.Item>

      <Form.Item
        name="agree"
        valuePropName="checked"
        rules={[
          {
            validator: (_, value) =>
              value ? Promise.resolve() : Promise.reject(new Error(t('register.agreeRequired'))),
          },
        ]}
      >
        <Checkbox>
          {t('register.agreeTo')} <a href="/terms">{t('register.terms')}</a>
        </Checkbox>
      </Form.Item>

      <Form.Item>
        <Button
          type="primary"
          htmlType="submit"
          size="large"
          block
          loading={loading}
          className="auth-submit-button"
        >
          {loading ? t('register.submitting') : t('register.submit')}
        </Button>
      </Form.Item>

      <div className="auth-switch-hint">
        {t('register.hasAccount')}{' '}
        <Button type="link" size="small" onClick={onSwitchToLogin}>
          {t('register.loginNow')}
        </Button>
      </div>
    </Form>
  );
});

const AuthPage = memo(function AuthPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useTranslation('auth');
  const [activeTab, setActiveTab] = useState<string>(searchParams.get('tab') || 'login');
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resetForm] = Form.useForm();
  const [resetLoading, setResetLoading] = useState(false);
  const [resetStep, setResetStep] = useState<'email' | 'password'>('email');

  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      setResetModalOpen(true);
      setResetStep('password');
    }
  }, [token]);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    setSearchParams({ tab: key });
  }, [setSearchParams]);

  const handleResetSubmit = useCallback(async () => {
    try {
      const values = await resetForm.validateFields();
      setResetLoading(true);
      if (resetStep === 'email') {
        await authService.sendPasswordResetEmail(values.email);
        message.success(t('resetPassword.success'));
        setResetModalOpen(false);
      } else {
        await authService.resetPassword({ token_id: token!, new_password: values.password, confirm_password: values.password });
        message.success(t('resetPassword.success'));
        setResetModalOpen(false);
        setSearchParams({});
      }
    } finally {
      setResetLoading(false);
    }
  }, [resetForm, resetStep, token, setSearchParams, t]);

  const features = useMemo(() => [
    { icon: '⚡', title: t('features.smartEval'), desc: t('features.smartEvalDesc') },
    { icon: '📊', title: t('features.dataInsight'), desc: t('features.dataInsightDesc') },
    { icon: '🚀', title: t('features.batchExec'), desc: t('features.batchExecDesc') },
    { icon: '🛡️', title: t('features.governance'), desc: t('features.governanceDesc') },
  ], [t]);

  const tabItems = useMemo(() => [
    {
      key: 'login',
      label: t('login.title'),
      children: (
        <LoginForm
          onSuccess={() => {}}
          onForgotPassword={() => {
            setResetStep('email');
            setResetModalOpen(true);
          }}
        />
      ),
    },
    {
      key: 'register',
      label: t('register.title'),
      children: (
        <RegisterForm
          onSuccess={() => {}}
          onSwitchToLogin={() => handleTabChange('login')}
        />
      ),
    },
  ], [t, handleTabChange]);

  return (
    <>
      <div className="auth-page">
        <div className="auth-brand">
          <div className="auth-brand-content">
            <div className="auth-logo">
              <span className="auth-logo-icon">
                <StarOutlined />
              </span>
            </div>
            <h1 className="auth-title">{t('hero.title')}</h1>
            <p className="auth-subtitle">{t('hero.subtitle')}</p>

            <div className="auth-features">
              {features.map((feature) => (
                <div key={feature.title} className="auth-feature">
                  <span className="auth-feature-icon">{feature.icon}</span>
                  <div className="auth-feature-content">
                    <div className="auth-feature-title">{feature.title}</div>
                    <div className="auth-feature-desc">{feature.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="auth-form-section">
          <div className="auth-form-container">
            <Tabs
              activeKey={activeTab}
              onChange={handleTabChange}
              items={tabItems}
              centered
              className="auth-tabs"
            />
          </div>
        </div>
      </div>

      <Modal
        open={resetModalOpen}
        title={t('resetPassword.title')}
        onCancel={() => {
          setResetModalOpen(false);
          resetForm.resetFields();
        }}
        onOk={handleResetSubmit}
        confirmLoading={resetLoading}
        okText={resetLoading ? t('resetPassword.submitting') : t('resetPassword.submit')}
      >
        {resetStep === 'email' ? (
          <Form form={resetForm} layout="vertical">
            <p style={{ marginBottom: 16, color: '#666' }}>
              {t('resetPassword.description')}
            </p>
            <Form.Item
              name="email"
              rules={[
                { required: true, message: t('resetPassword.emailRequired') },
                { type: 'email', message: t('resetPassword.emailInvalid') },
              ]}
            >
              <Input
                prefix={<MailOutlined />}
                placeholder={t('resetPassword.emailPlaceholder')}
                size="large"
              />
            </Form.Item>
          </Form>
        ) : (
          <Form form={resetForm} layout="vertical">
            <Form.Item
              name="password"
              label={t('resetPassword.newPasswordLabel')}
              rules={[
                { required: true, message: t('resetPassword.newPasswordRequired') },
                { min: PASSWORD_MIN_LENGTH, message: t('resetPassword.newPasswordMin') },
                { pattern: PASSWORD_COMPLEXITY_PATTERN, message: t('resetPassword.newPasswordFormat') },
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder={t('resetPassword.newPasswordPlaceholder')}
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label={t('resetPassword.confirmPasswordLabel')}
              dependencies={['password']}
              rules={[
                { required: true, message: t('resetPassword.confirmPasswordRequired') },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error(t('resetPassword.confirmPasswordMismatch')));
                  },
                }),
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder={t('resetPassword.confirmPasswordPlaceholder')}
                size="large"
              />
            </Form.Item>
          </Form>
        )}
      </Modal>
    </>
  );
});

export default AuthPage;
