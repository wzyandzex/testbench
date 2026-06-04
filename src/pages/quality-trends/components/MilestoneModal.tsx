import { useEffect } from 'react';
import {
  ColorPicker,
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Select,
} from 'antd';
import dayjs from 'dayjs';

import type { MilestoneCategory, MilestoneScope } from '../service';
import { CATEGORY_LABELS, createMilestone } from '../service';

interface MilestoneModalProps {
  open: boolean;
  scopeType: MilestoneScope;
  scopeId?: string;
  defaultDate?: string;
  onCancel: () => void;
  onSuccess: () => void;
}

export function MilestoneModal({
  open,
  scopeType,
  scopeId,
  defaultDate,
  onCancel,
  onSuccess,
}: MilestoneModalProps) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open) {
      form.resetFields();
      form.setFieldsValue({
        category: 'deployment',
        occurred_at: defaultDate ? dayjs(defaultDate) : dayjs(),
      });
    }
  }, [open, defaultDate, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const colorHex = typeof values.color === 'object'
        ? values.color?.toHexString?.()
        : values.color;

      await createMilestone({
        scope_type: scopeType,
        scope_id: scopeId,
        occurred_at: values.occurred_at.toISOString(),
        label: values.label,
        description: values.description,
        category: values.category as MilestoneCategory,
        color: colorHex || CATEGORY_LABELS[values.category as MilestoneCategory].color,
      });
      message.success('里程碑已添加');
      onSuccess();
    } catch {
      // validation or API error
    }
  };

  return (
    <Modal
      title="添加里程碑"
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      okText="保存"
      cancelText="取消"
      destroyOnClose
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="label"
          label="标签"
          rules={[{ required: true, message: '请输入标签', max: 100 }]}
        >
          <Input placeholder="例如：升级到 Opus 4.7、Prompt 重构上线" maxLength={100} />
        </Form.Item>

        <Form.Item
          name="occurred_at"
          label="发生时间"
          rules={[{ required: true }]}
        >
          <DatePicker showTime style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="category" label="类别" rules={[{ required: true }]}>
          <Select
            options={Object.entries(CATEGORY_LABELS).map(([key, val]) => ({
              value: key,
              label: (
                <span>
                  <span
                    style={{
                      display: 'inline-block',
                      width: 10, height: 10,
                      borderRadius: '50%',
                      backgroundColor: val.color,
                      marginRight: 8,
                    }}
                  />
                  {val.label}
                </span>
              ),
            }))}
          />
        </Form.Item>

        <Form.Item name="color" label="颜色（可选，覆盖默认）">
          <ColorPicker showText />
        </Form.Item>

        <Form.Item name="description" label="说明">
          <Input.TextArea rows={3} placeholder="详细描述（可选）" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
