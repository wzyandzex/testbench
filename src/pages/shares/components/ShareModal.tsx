import { useEffect, useState } from 'react';
import {
  DatePicker,
  Form,
  Input,
  message,
  Modal,
  Radio,
  Select,
  Space,
  Typography,
} from 'antd';
import { LinkOutlined, FileOutlined, TeamOutlined, GlobalOutlined, UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import type { CreateShareRequest, ShareScope, ShareType } from '../service';
import { createShare } from '../service';

const { Text } = Typography;

interface ShareModalProps {
  open: boolean;
  executionId: string;
  executionName?: string;
  onCancel: () => void;
  onSuccess: () => void;
  orgMembers?: Array<{ user_id: string; username: string }>;
}

export function ShareModal({
  open,
  executionId,
  executionName,
  onCancel,
  onSuccess,
  orgMembers = [],
}: ShareModalProps) {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [shareType, setShareType] = useState<ShareType>('link');
  const [scope, setScope] = useState<ShareScope>('org');

  useEffect(() => {
    if (open) {
      form.resetFields();
      setShareType('link');
      setScope('org');
    }
  }, [open, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const req: CreateShareRequest = {
        execution_id: executionId,
        share_type: shareType,
        access_level: values.access_level,
        scope,
        recipient_user_id: scope === 'user' ? values.recipient_user_id : undefined,
        password: scope === 'external' ? values.password : undefined,
        file_format: shareType === 'file' ? values.file_format : undefined,
        expires_at: values.expires_at ? values.expires_at.toISOString() : undefined,
      };

      const result = await createShare(req);
      message.success('分享创建成功');

      if (result.share_url) {
        const fullUrl = `${window.location.origin}${result.share_url}`;
        await navigator.clipboard.writeText(fullUrl).catch(() => {});
        message.info('分享链接已复制到剪贴板');
      }

      onSuccess();
    } catch {
      // form validation or API error handled by interceptor
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={`分享报告${executionName ? ` - ${executionName}` : ''}`}
      open={open}
      onCancel={onCancel}
      onOk={handleSubmit}
      confirmLoading={loading}
      okText="创建分享"
      cancelText="取消"
      width={520}
      destroyOnClose
    >
      <Form form={form} layout="vertical" initialValues={{ access_level: 'view', file_format: 'html' }}>
        <Form.Item label="分享类型">
          <Radio.Group value={shareType} onChange={(e) => setShareType(e.target.value)}>
            <Radio.Button value="link">
              <Space>
                <LinkOutlined />
                在线链接
              </Space>
            </Radio.Button>
            <Radio.Button value="file">
              <Space>
                <FileOutlined />
                导出文件
              </Space>
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        <Form.Item label="分享范围">
          <Radio.Group value={scope} onChange={(e) => setScope(e.target.value)}>
            <Radio.Button value="org">
              <Space>
                <TeamOutlined />
                组织全员
              </Space>
            </Radio.Button>
            <Radio.Button value="user">
              <Space>
                <UserOutlined />
                指定成员
              </Space>
            </Radio.Button>
            <Radio.Button value="external">
              <Space>
                <GlobalOutlined />
                外部链接
              </Space>
            </Radio.Button>
          </Radio.Group>
        </Form.Item>

        {scope === 'user' && (
          <Form.Item
            name="recipient_user_id"
            label="选择成员"
            rules={[{ required: true, message: '请选择分享对象' }]}
          >
            <Select
              showSearch
              placeholder="搜索组织成员"
              optionFilterProp="label"
              options={orgMembers.map((m) => ({
                value: m.user_id,
                label: m.username,
              }))}
            />
          </Form.Item>
        )}

        {scope === 'external' && (
          <>
            <Form.Item
              name="password"
              label="访问密码"
              rules={[{ required: true, message: '外部链接必须设置密码' }]}
            >
              <Input.Password placeholder="设置访问密码" />
            </Form.Item>
            <Form.Item
              name="expires_at"
              label="过期时间"
              rules={[{ required: true, message: '外部链接必须设置过期时间' }]}
            >
              <DatePicker
                showTime
                disabledDate={(current) => current && current < dayjs().startOf('day')}
                placeholder="选择过期时间"
                style={{ width: '100%' }}
              />
            </Form.Item>
          </>
        )}

        <Form.Item
          name="access_level"
          label="权限级别"
          rules={[{ required: true }]}
        >
          <Radio.Group>
            <Radio value="view">
              <Space direction="vertical" size={0}>
                <Text>仅查看</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>只能查看报告内容</Text>
              </Space>
            </Radio>
            <Radio value="comment" disabled={scope === 'external'}>
              <Space direction="vertical" size={0}>
                <Text>可评论</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>查看 + 添加评论</Text>
              </Space>
            </Radio>
            <Radio value="manage" disabled={scope === 'external'}>
              <Space direction="vertical" size={0}>
                <Text>可管理</Text>
                <Text type="secondary" style={{ fontSize: 12 }}>查看 + 评论 + 管理权限</Text>
              </Space>
            </Radio>
          </Radio.Group>
        </Form.Item>

        {shareType === 'file' && (
          <Form.Item name="file_format" label="文件格式">
            <Radio.Group>
              <Radio.Button value="html">HTML</Radio.Button>
              <Radio.Button value="pdf">PDF</Radio.Button>
              <Radio.Button value="excel">Excel</Radio.Button>
            </Radio.Group>
          </Form.Item>
        )}

        {scope !== 'external' && (
          <Form.Item name="expires_at" label="过期时间（可选）">
            <DatePicker
              showTime
              disabledDate={(current) => current && current < dayjs().startOf('day')}
              placeholder="不设置则永不过期"
              style={{ width: '100%' }}
            />
          </Form.Item>
        )}
      </Form>
    </Modal>
  );
}
