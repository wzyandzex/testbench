/**
 * Admin 系统默认 Agent 模板配置页
 *
 * - 单例（id=global），admin 角色才能访问（路由层 PermissionGuard 守卫，后端 handler 二次校验）
 * - is_active 必须显式打开才会在新 org 创建时被克隆（避免空模板把"未配置"的占位 agent 推给所有人）
 * - API key 三态：留空=不变；点"清空 key"按钮=清空；输入新值=更新
 * - 模板更新不追溯历史 org（snapshot 语义）
 */
import { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Form,
  Input,
  Select,
  Skeleton,
  Space,
  Switch,
  Tag,
  Typography,
  message,
} from 'antd';
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons';
import { Trans, useTranslation } from 'react-i18next';
import {
  adminAgentTemplateService,
  type DefaultAgentTemplate,
  type UpdateDefaultAgentTemplateRequest,
} from './service';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const TYPE_OPTIONS = [
  { value: 'code_edit', label: 'Code Edit' },
  { value: 'terminal', label: 'Terminal' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'autonomous', label: 'Autonomous' },
];

interface FormValues {
  display_name: string;
  description: string;
  type: 'code_edit' | 'terminal' | 'hybrid' | 'autonomous';
  endpoint: string;
  api_key: string;
  model_config: string;
  capabilities: string;
  tools: string;
  metadata: string;
  is_active: boolean;
}

function jsonToString(v: unknown): string {
  if (v == null) return '';
  if (typeof v === 'string') return v;
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return '';
  }
}

function parseJsonOrNull(s: string): Record<string, unknown> | null {
  const trimmed = s.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function parseCapabilities(s: string): string[] {
  return s
    .split(/[,\n]/)
    .map((x) => x.trim())
    .filter((x) => x.length > 0);
}

export default function DefaultAgentTemplatePage() {
  const { t } = useTranslation('admin');
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<DefaultAgentTemplate | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const tpl = await adminAgentTemplateService.getDefaultTemplate();
      setTemplate(tpl);
      form.setFieldsValue({
        display_name: tpl.display_name,
        description: tpl.description,
        type: tpl.type,
        endpoint: tpl.endpoint,
        api_key: '',
        model_config: jsonToString(tpl.model_config),
        capabilities: (tpl.capabilities ?? []).join(', '),
        tools: jsonToString(tpl.tools),
        metadata: jsonToString(tpl.metadata),
        is_active: tpl.is_active,
      });
    } catch (err) {
      message.error(
        t('defaultAgent.messages.loadFailed', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setLoading(false);
    }
  }, [form, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = useCallback(
    async (values: FormValues) => {
      // JSON 字段预校验
      if (values.model_config.trim() && parseJsonOrNull(values.model_config) === null) {
        message.error(t('defaultAgent.messages.modelConfigInvalid'));
        return;
      }
      if (values.tools.trim() && parseJsonOrNull(values.tools) === null) {
        message.error(t('defaultAgent.messages.toolsInvalid'));
        return;
      }
      if (values.metadata.trim() && parseJsonOrNull(values.metadata) === null) {
        message.error(t('defaultAgent.messages.metadataInvalid'));
        return;
      }

      const req: UpdateDefaultAgentTemplateRequest = {
        display_name: values.display_name,
        description: values.description,
        type: values.type,
        endpoint: values.endpoint,
        capabilities: parseCapabilities(values.capabilities),
        is_active: values.is_active,
      };
      // API key 三态
      if (values.api_key) {
        req.api_key = values.api_key;
      }
      // JSON 字段：留空表示不变
      if (values.model_config.trim()) {
        const parsed = parseJsonOrNull(values.model_config);
        if (parsed) req.model_config = parsed;
      }
      if (values.tools.trim()) {
        const parsed = parseJsonOrNull(values.tools);
        if (parsed) req.tools = parsed;
      }
      if (values.metadata.trim()) {
        const parsed = parseJsonOrNull(values.metadata);
        if (parsed) req.metadata = parsed;
      }

      setSaving(true);
      try {
        const updated = await adminAgentTemplateService.updateDefaultTemplate(req);
        setTemplate(updated);
        // 重置 api_key 输入框（已经入库不需要再显示）
        form.setFieldValue('api_key', '');
        message.success(t('defaultAgent.messages.saved'));
      } catch (err) {
        message.error(
          t('defaultAgent.messages.saveFailed', {
            error: err instanceof Error ? err.message : String(err),
          })
        );
      } finally {
        setSaving(false);
      }
    },
    [form, t]
  );

  const handleClearKey = useCallback(async () => {
    setSaving(true);
    try {
      const updated = await adminAgentTemplateService.updateDefaultTemplate({ api_key: '' });
      setTemplate(updated);
      form.setFieldValue('api_key', '');
      message.success(t('defaultAgent.messages.keyCleared'));
    } catch (err) {
      message.error(
        t('defaultAgent.messages.clearFailed', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setSaving(false);
    }
  }, [form, t]);

  return (
    <div style={{ padding: 24, maxWidth: 1080, margin: '0 auto' }}>
      <Title level={3} style={{ marginBottom: 8 }}>
        {t('defaultAgent.title')}
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 24 }}>
        <Trans
          i18nKey="defaultAgent.description"
          ns="admin"
          components={{ 1: <strong /> }}
        />
      </Paragraph>

      {!loading && template && !template.is_active && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('defaultAgent.alerts.inactiveTitle')}
          description={t('defaultAgent.alerts.inactiveDescription')}
        />
      )}

      {!loading && template && template.is_active && !template.has_api_key && (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message={t('defaultAgent.alerts.noKeyTitle')}
          description={t('defaultAgent.alerts.noKeyDescription')}
        />
      )}

      <Card>
        {loading ? (
          <Skeleton active paragraph={{ rows: 8 }} />
        ) : (
          <Form<FormValues>
            form={form}
            layout="vertical"
            onFinish={handleSave}
            requiredMark={false}
          >
            <Form.Item
              label={
                <Space>
                  <span>{t('defaultAgent.fields.isActiveLabel')}</span>
                  {template && (
                    <Tag color={template.is_active ? 'green' : 'default'}>
                      {template.is_active
                        ? t('defaultAgent.tags.active')
                        : t('defaultAgent.tags.inactive')}
                    </Tag>
                  )}
                </Space>
              }
              name="is_active"
              valuePropName="checked"
              extra={t('defaultAgent.fields.isActiveExtra')}
            >
              <Switch />
            </Form.Item>

            <Form.Item
              label={t('defaultAgent.fields.displayNameLabel')}
              name="display_name"
              rules={[{ required: true, max: 255 }]}
            >
              <Input placeholder={t('defaultAgent.fields.displayNamePlaceholder')} />
            </Form.Item>

            <Form.Item label={t('defaultAgent.fields.descriptionLabel')} name="description">
              <TextArea rows={2} placeholder={t('defaultAgent.fields.descriptionPlaceholder')} />
            </Form.Item>

            <Form.Item
              label={t('defaultAgent.fields.typeLabel')}
              name="type"
              rules={[{ required: true }]}
            >
              <Select options={TYPE_OPTIONS} />
            </Form.Item>

            <Form.Item
              label={t('defaultAgent.fields.endpointLabel')}
              name="endpoint"
              rules={[{ required: true, max: 500 }]}
              extra={t('defaultAgent.fields.endpointExtra')}
            >
              <Input placeholder={t('defaultAgent.fields.endpointPlaceholder')} />
            </Form.Item>

            <Form.Item
              label={
                <Space>
                  <span>{t('defaultAgent.fields.apiKeyLabel')}</span>
                  {template && (
                    <Tag color={template.has_api_key ? 'green' : 'default'}>
                      {template.has_api_key
                        ? t('defaultAgent.tags.keyConfigured')
                        : t('defaultAgent.tags.keyMissing')}
                    </Tag>
                  )}
                </Space>
              }
              name="api_key"
              extra={
                <Space size={8}>
                  <Text type="secondary">{t('defaultAgent.fields.apiKeyExtraHint')}</Text>
                  <Button size="small" danger onClick={handleClearKey} loading={saving}>
                    {t('defaultAgent.fields.apiKeyClearBtn')}
                  </Button>
                </Space>
              }
            >
              <Input.Password
                placeholder={
                  template?.has_api_key
                    ? t('defaultAgent.fields.apiKeyPlaceholderConfigured')
                    : t('defaultAgent.fields.apiKeyPlaceholderNew')
                }
              />
            </Form.Item>

            <Form.Item
              label={t('defaultAgent.fields.capabilitiesLabel')}
              name="capabilities"
              extra={t('defaultAgent.fields.capabilitiesExtra')}
            >
              <TextArea rows={2} placeholder={t('defaultAgent.fields.capabilitiesPlaceholder')} />
            </Form.Item>

            <Form.Item
              label={t('defaultAgent.fields.modelConfigLabel')}
              name="model_config"
              extra={t('defaultAgent.fields.modelConfigExtra')}
            >
              <TextArea rows={6} placeholder="{}" style={{ fontFamily: 'monospace' }} />
            </Form.Item>

            <Form.Item label={t('defaultAgent.fields.toolsLabel')} name="tools">
              <TextArea rows={4} placeholder="{}" style={{ fontFamily: 'monospace' }} />
            </Form.Item>

            <Form.Item label={t('defaultAgent.fields.metadataLabel')} name="metadata">
              <TextArea rows={3} placeholder="{}" style={{ fontFamily: 'monospace' }} />
            </Form.Item>

            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={saving}
              >
                {t('defaultAgent.actions.save')}
              </Button>
              <Button icon={<ReloadOutlined />} onClick={() => void load()} disabled={saving}>
                {t('defaultAgent.actions.reload')}
              </Button>
            </Space>
          </Form>
        )}
      </Card>
    </div>
  );
}
