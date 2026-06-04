import { useEffect } from 'react';
import { Form, Input, message, Modal, Radio } from 'antd';
import { useTranslation } from 'react-i18next';

import { createSession } from '../service';

interface SaveSessionModalProps {
  open: boolean;
  referenceId: string;
  targetId: string;
  defaultName?: string;
  onCancel: () => void;
  onSuccess: (sessionId: string) => void;
}

export function SaveSessionModal({
  open,
  referenceId,
  targetId,
  defaultName,
  onCancel,
  onSuccess,
}: SaveSessionModalProps) {
  const { t } = useTranslation('comparisons');
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.resetFields();
      const shortReference = referenceId.slice(0, 8);
      const shortTarget = targetId.slice(0, 8);
      form.setFieldsValue({
        name: defaultName || t('saveModal.defaultName', { reference: shortReference, target: shortTarget }),
        visibility: 'private',
      });
    }
  }, [open, defaultName, referenceId, targetId, form, t]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const result = await createSession({
        name: values.name,
        description: values.description,
        reference_id: referenceId,
        target_id: targetId,
        notes: values.notes,
        visibility: values.visibility,
      });
      message.success(t('saveModal.success'));
      onSuccess(result.id);
    } catch {
      // validation or API error
    }
  };

  return (
    <Modal
      title={t('saveModal.title')}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText={t('saveModal.ok')}
      cancelText={t('saveModal.cancel')}
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label={t('saveModal.name')}
          rules={[{ required: true, message: t('saveModal.nameRequired'), max: 150 }]}
        >
          <Input maxLength={150} />
        </Form.Item>

        <Form.Item name="description" label={t('saveModal.description')}>
          <Input.TextArea rows={2} placeholder={t('saveModal.descriptionPlaceholder')} />
        </Form.Item>

        <Form.Item name="notes" label={t('saveModal.notes')}>
          <Input.TextArea rows={4} placeholder={t('saveModal.notesPlaceholder')} />
        </Form.Item>

        <Form.Item name="visibility" label={t('saveModal.visibility')} rules={[{ required: true }]}>
          <Radio.Group>
            <Radio value="private">{t('saveModal.private')}</Radio>
            <Radio value="org">{t('saveModal.org')}</Radio>
          </Radio.Group>
        </Form.Item>
      </Form>
    </Modal>
  );
}
