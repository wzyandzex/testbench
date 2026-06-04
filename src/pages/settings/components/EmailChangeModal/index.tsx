import {
  CheckCircleFilled,
  LinkOutlined,
  MailOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';
import { Alert, Button, Form, Input, Modal, Space, Steps, Typography, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { authService } from '@/services/auth';
import { getEmailChangeModalCSS } from './style';

export type EmailChangeStep = 'input' | 'verify' | 'success';

export interface EmailChangeModalProps {
  open: boolean;
  onClose: () => void;
  currentEmail: string;
  onSuccess?: (newEmail: string) => void;
}

export const EmailChangeModal = ({
  open,
  onClose,
  currentEmail,
  onSuccess,
}: EmailChangeModalProps) => {
  const { t } = useTranslation('settings');
  const [form] = Form.useForm<{ new_email: string; token_input: string }>();
  const [step, setStep] = useState<EmailChangeStep>('input');
  const [loading, setLoading] = useState(false);
  const [newEmail, setNewEmail] = useState('');

  useEffect(() => {
    if (!open) {
      form.resetFields();
      setStep('input');
      setLoading(false);
      setNewEmail('');
    }
  }, [form, open]);

  const currentStep = useMemo(() => {
    if (step === 'success') {
      return 2;
    }
    return step === 'verify' ? 1 : 0;
  }, [step]);

  const handleSendVerification = async () => {
    const values = await form.validateFields(['new_email']);
    setLoading(true);
    try {
      await authService.sendEmailVerification({ new_email: values.new_email });
      setNewEmail(values.new_email);
      setStep('verify');
      message.success(t('email.verificationSent'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async () => {
    const values = await form.validateFields(['token_input']);
    setLoading(true);
    try {
      const result = await authService.confirmEmail({ token_id: values.token_input });
      const nextEmail = result.new_email || newEmail;
      setStep('success');
      onSuccess?.(nextEmail);
      message.success(t('email.verified'));
      window.setTimeout(() => {
        onClose();
      }, 900);
    } finally {
      setLoading(false);
    }
  };

  const footer =
    step === 'success'
      ? [
          <Button key="done" type="primary" onClick={onClose}>
            {t('email.step3')}
          </Button>,
        ]
      : [
          <Button key="cancel" onClick={onClose}>
            {t('common:actions.cancel')}
          </Button>,
          step === 'verify' ? (
            <Button key="resend" onClick={handleSendVerification} loading={loading}>
              {t('email.sendVerification')}
            </Button>
          ) : null,
          <Button
            key="submit"
            type="primary"
            loading={loading}
            onClick={step === 'input' ? handleSendVerification : handleConfirm}
          >
            {step === 'input' ? t('email.sendVerification') : t('email.confirmChange')}
          </Button>,
        ].filter(Boolean);

  return (
    <>
      <style>{getEmailChangeModalCSS()}</style>
      <Modal
        open={open}
        title={t('email.title')}
        onCancel={onClose}
        footer={footer}
        destroyOnHidden
        width={640}
        rootClassName="settings-email-change-modal-root"
      >
        <Space
          className="email-change-modal-content"
          direction="vertical"
          size={20}
        >
          <Steps
            className="email-change-modal-steps"
            size="small"
            current={currentStep}
            items={[
              { title: t('email.step1') },
              { title: t('email.step2') },
              { title: t('email.step3') },
            ]}
          />

          {step === 'input' ? (
            <>
              <Alert
                className="email-change-modal-alert"
                type="info"
                showIcon
                message={t('email.notice')}
                description={t('email.noticeDesc')}
                icon={<MailOutlined />}
              />
              <Form className="email-change-modal-form" form={form} layout="vertical">
                <Form.Item label={t('email.currentEmail')}>
                  <Input value={currentEmail} disabled />
                </Form.Item>
                <Form.Item
                  label={t('email.newEmail')}
                  name="new_email"
                  rules={[
                    { required: true, message: t('email.newEmailRequired') },
                    { type: 'email', message: t('email.newEmailInvalid') },
                    {
                      validator: (_, value) => {
                        if (!value || value.toLowerCase() !== currentEmail.toLowerCase()) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error(t('email.sameEmail')));
                      },
                    },
                  ]}
                >
                  <Input prefix={<MailOutlined />} placeholder="name@example.com" />
                </Form.Item>
              </Form>
            </>
          ) : null}

          {step === 'verify' ? (
            <>
              <Alert
                className="email-change-modal-alert"
                type="warning"
                showIcon
                message={t('email.checkEmail')}
                icon={<SafetyCertificateOutlined />}
              />
              <Form className="email-change-modal-form" form={form} layout="vertical">
                <Form.Item
                  label={t('email.tokenLabel')}
                  name="token_input"
                  rules={[{ required: true, message: t('email.tokenRequired') }]}
                >
                  <Input.TextArea
                    autoSize={{ minRows: 3, maxRows: 5 }}
                    placeholder={t('email.tokenPlaceholder')}
                  />
                </Form.Item>
              </Form>
            </>
          ) : null}

          {step === 'success' ? (
            <Alert
              className="email-change-modal-alert"
              type="success"
              showIcon
              icon={<CheckCircleFilled />}
              message={t('email.success')}
            />
          ) : null}

          <Space className="email-change-modal-help" align="start" size={8}>
            <LinkOutlined className="email-change-modal-help-icon" />
            <Typography.Text type="secondary">
              {t('email.noticeDesc')}
            </Typography.Text>
          </Space>
        </Space>
      </Modal>
    </>
  );
};

export default EmailChangeModal;
