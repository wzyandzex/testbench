import { useState } from 'react';
import { App, Button, Form, Input, Modal, Select, Space, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import { useOrganizationStore } from '@/stores/organizationStore';
import type { OrganizationInvitation } from '@/types/organization';
import { getInviteMemberModalCSS } from './InviteMemberModal.style';

const { TextArea } = Input;
const { Paragraph, Text } = Typography;
const SELECT_POPUP_CLASS_NAME = 'organization-invite-select-dropdown';

const getSelectPopupContainer = (triggerNode: HTMLElement): HTMLElement => {
  return (triggerNode.closest('.organization-invite-modal-root') as HTMLElement) || document.body;
};

interface InviteMemberModalProps {
  open: boolean;
  organizationId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

export function InviteMemberModal({
  open,
  organizationId,
  onClose,
  onSuccess,
}: InviteMemberModalProps) {
  const { t } = useTranslation('organizations');
  const { message, modal } = App.useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const inviteMember = useOrganizationStore((state) => state.inviteMember);

  const copyInvitation = async (invitation: OrganizationInvitation) => {
    const value = invitation.invite_url || invitation.invite_code;
    if (!value) {
      return;
    }
    await navigator.clipboard.writeText(value);
    message.success(t('components.inviteModal.copySuccess'));
  };

  const showDeliveryFallback = (invitation: OrganizationInvitation) => {
    const isNotConfigured = invitation.delivery_status === 'not_configured';
    modal.warning({
      title: isNotConfigured
        ? t('components.inviteModal.notConfiguredTitle')
        : t('components.inviteModal.deliveryFailedTitle'),
      okText: t('components.inviteModal.fallbackOk'),
      content: (
        <Space direction="vertical" size={12} style={{ width: '100%' }}>
          <Paragraph style={{ margin: 0 }}>
            {isNotConfigured
              ? t('components.inviteModal.notConfiguredMessage')
              : t('components.inviteModal.deliveryFailedMessage')}
          </Paragraph>
          <Text copyable={{ text: invitation.invite_url || invitation.invite_code }}>
            {invitation.invite_url || invitation.invite_code}
          </Text>
          <Button onClick={() => void copyInvitation(invitation)}>
            {t('components.inviteModal.copyInvite')}
          </Button>
        </Space>
      ),
    });
  };

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const invitation = await inviteMember(organizationId, {
        email: values.email,
        role: values.role,
        message: values.message,
        expires_in: values.expires_in,
      });

      if (!invitation.delivery_status || invitation.delivery_status === 'sent') {
        message.success(t('components.inviteModal.successMessage'));
      } else {
        showDeliveryFallback(invitation);
      }
      form.resetFields();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Invite failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <>
      <style>{getInviteMemberModalCSS()}</style>
      <Modal
        title={t('components.inviteModal.title')}
        open={open}
        onOk={handleSubmit}
        onCancel={handleCancel}
        okText={t('components.inviteModal.okText')}
        cancelText={t('components.inviteModal.cancelText')}
        confirmLoading={loading}
        destroyOnClose
        rootClassName="organization-invite-modal-root"
      >
        <Form
          className="organization-invite-modal-form"
          form={form}
          layout="vertical"
          initialValues={{ role: 'member', expires_in: 168 }}
        >
          <Form.Item
            label={t('components.inviteModal.emailLabel')}
            name="email"
            rules={[
              { required: true, message: t('components.inviteModal.emailRequired') },
              { type: 'email', message: t('components.inviteModal.emailInvalid') },
            ]}
          >
            <Input placeholder="user@example.com" />
          </Form.Item>

          <Form.Item
            label={t('components.inviteModal.roleLabel')}
            name="role"
            rules={[{ required: true, message: t('components.inviteModal.roleRequired') }]}
          >
            <Select
              popupClassName={SELECT_POPUP_CLASS_NAME}
              getPopupContainer={getSelectPopupContainer}
              options={[
                { label: t('role.admin'), value: 'admin' },
                { label: t('role.member'), value: 'member' },
                { label: t('role.guest'), value: 'guest' },
              ]}
            />
          </Form.Item>

          <Form.Item
            label={t('components.inviteModal.expiresLabel')}
            name="expires_in"
            rules={[{ required: true, message: t('components.inviteModal.expiresRequired') }]}
          >
            <Select
              popupClassName={SELECT_POPUP_CLASS_NAME}
              getPopupContainer={getSelectPopupContainer}
              options={[
                { label: t('components.inviteModal.expires7d'), value: 168 },
                { label: t('components.inviteModal.expires3d'), value: 72 },
                { label: t('components.inviteModal.expires1d'), value: 24 },
              ]}
            />
          </Form.Item>

          <Form.Item label={t('components.inviteModal.messageLabel')} name="message">
            <TextArea
              rows={3}
              placeholder={t('components.inviteModal.messagePlaceholder')}
              maxLength={500}
              showCount
            />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default InviteMemberModal;
