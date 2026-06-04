import { Alert, Button, Card, Col, Form, Input, InputNumber, Row, Select, Space, Typography } from 'antd';
import { useTranslation } from 'react-i18next';
import type { AgentStatus, AgentToolProfile, AgentType } from '@/types/api/agent';
import { useIsDark, useThemeTokens } from '@/theme';
import {
  AGENT_STATUS_OPTIONS,
  AGENT_TYPE_OPTIONS,
  RUNTIME_MODE_OPTIONS,
  TOOL_PROFILE_OPTIONS,
} from './helpers';

const { Text, Title } = Typography;

export interface AgentFormValues {
  name: string;
  display_name?: string;
  description?: string;
  type: AgentType;
  endpoint: string;
  api_key?: string;
  status: AgentStatus;
  version?: string;
  capabilities?: string[];
  provider?: string;
  model_name?: string;
  base_url?: string;
  runtime_mode?: 'native' | 'adk';
  tool_profile?: AgentToolProfile;
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  top_k?: number;
  model_params_json?: string;
  tools_json?: string;
  metadata_json?: string;
}

interface AgentFormProps {
  title: string;
  subtitle?: string;
  submitLabel: string;
  initialValues: Partial<AgentFormValues>;
  submitting?: boolean;
  apiKeyHelp: string;
  onSubmit: (values: AgentFormValues) => Promise<void>;
  onCancel: () => void;
}

export function AgentForm({
  title,
  subtitle,
  submitLabel,
  initialValues,
  submitting,
  apiKeyHelp,
  onSubmit,
  onCancel,
}: AgentFormProps) {
  const { t } = useTranslation('agents');
  const [form] = Form.useForm<AgentFormValues>();
  const tokens = useThemeTokens();
  const isDark = useIsDark();

  const pageBackground = isDark
    ? `radial-gradient(circle at top left, rgba(102, 126, 234, 0.14), transparent 30%), ${tokens.bg.primary}`
    : 'radial-gradient(circle at top left, rgba(22, 119, 255, 0.12), transparent 28%), linear-gradient(180deg, #f6f8fb 0%, #eef2f7 100%)';

  return (
    <div
      style={{
        minHeight: '100%',
        padding: '24px',
        background: pageBackground,
        color: tokens.text.primary,
      }}
    >
      <div
        style={{
          maxWidth: 1180,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <Title level={2} style={{ marginBottom: 8, color: tokens.text.primary }}>
              {title}
            </Title>
            {subtitle ? <Text style={{ color: tokens.text.secondary }}>{subtitle}</Text> : null}
          </div>

          <Space>
            <Button
              onClick={onCancel}
              style={
                isDark
                  ? {
                      background: tokens.bg.elevated,
                      borderColor: tokens.border.default,
                      color: tokens.text.primary,
                    }
                  : undefined
              }
            >
              {t('common:actions.cancel')}
            </Button>
            <Button type="primary" loading={submitting} onClick={() => form.submit()}>
              {submitLabel}
            </Button>
          </Space>
        </div>

        <Alert
          type="info"
          showIcon
          message={t('form.keyProcessing')}
          description={apiKeyHelp}
        />

        <Form<AgentFormValues>
          form={form}
          layout="vertical"
          initialValues={initialValues}
          onFinish={onSubmit}
        >
          <Row gutter={[20, 20]}>
            <Col xs={24} lg={14}>
              <Card title={t('form.basicInfo')} bordered={false}>
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item
                      label={t('form.internalName')}
                      name="name"
                      rules={[
                        { required: true, message: t('form.internalNameRequired') },
                        { max: 255, message: t('form.internalNameMax') },
                      ]}
                    >
                      <Input placeholder={t('form.internalNamePlaceholder')} />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item
                      label={t('form.displayName')}
                      name="display_name"
                      rules={[{ max: 255, message: t('form.displayNameMax') }]}
                    >
                      <Input placeholder={t('form.displayNamePlaceholder')} />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label={t('form.agentType')} name="type" rules={[{ required: true, message: t('form.agentTypeRequired') }]}>
                      <Select options={AGENT_TYPE_OPTIONS} />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label={t('form.statusLabel')} name="status" rules={[{ required: true, message: t('form.statusRequired') }]}>
                      <Select options={AGENT_STATUS_OPTIONS} />
                    </Form.Item>
                  </Col>

                  <Col xs={24}>
                    <Form.Item
                      label={t('form.endpoint')}
                      name="endpoint"
                      rules={[
                        { required: true, message: t('form.endpointRequired') },
                        { max: 500, message: t('form.endpointMax') },
                      ]}
                    >
                      <Input placeholder={t('form.endpointPlaceholder')} />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label={t('form.version')} name="version" rules={[{ max: 50, message: t('form.versionMax') }]}>
                      <Input placeholder={t('form.versionPlaceholder')} />
                    </Form.Item>
                  </Col>

                  <Col xs={24} md={12}>
                    <Form.Item label={t('form.capabilities')} name="capabilities">
                      <Select
                        mode="tags"
                        tokenSeparators={[',']}
                        placeholder={t('form.capabilitiesPlaceholder')}
                      />
                    </Form.Item>
                  </Col>

                  <Col xs={24}>
                    <Form.Item
                      label={t('form.description')}
                      name="description"
                      rules={[{ max: 2000, message: t('form.descriptionMax') }]}
                    >
                      <Input.TextArea rows={4} placeholder={t('form.descriptionPlaceholder')} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>

              <Card title={t('form.modelRuntime')} bordered={false} style={{ marginTop: 20 }}>
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={12}>
                    <Form.Item label={t('form.provider')} name="provider">
                      <Input placeholder={t('form.providerPlaceholder')} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label={t('form.modelName')} name="model_name">
                      <Input placeholder={t('form.modelNamePlaceholder')} />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item label={t('form.baseUrl')} name="base_url">
                      <Input placeholder={t('form.baseUrlPlaceholder')} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label={t('form.runtimeMode')} name="runtime_mode">
                      <Select options={[...RUNTIME_MODE_OPTIONS]} allowClear />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={12}>
                    <Form.Item label={t('form.toolProfile')} name="tool_profile">
                      <Select options={TOOL_PROFILE_OPTIONS} allowClear />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="Temperature" name="temperature">
                      <InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="Max Tokens" name="max_tokens">
                      <InputNumber min={1} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="Top P" name="top_p">
                      <InputNumber min={0} max={1} step={0.05} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item label="Top K" name="top_k">
                      <InputNumber min={0} style={{ width: '100%' }} />
                    </Form.Item>
                  </Col>
                  <Col xs={24}>
                    <Form.Item label={t('form.modelParamsJson')} name="model_params_json">
                      <Input.TextArea rows={6} placeholder={t('form.modelParamsPlaceholder')} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </Col>

            <Col xs={24} lg={10}>
              <Card title={t('form.credentials')} bordered={false}>
                <Form.Item label="API Key" name="api_key">
                  <Input.Password placeholder={t('form.apiKeyPlaceholder')} />
                </Form.Item>

                <Form.Item label="Tools JSON" name="tools_json">
                  <Input.TextArea rows={8} placeholder='e.g. {"shell":{"enabled":true}}' />
                </Form.Item>

                <Form.Item label="Metadata JSON" name="metadata_json">
                  <Input.TextArea rows={8} placeholder='e.g. {"owner":"platform-team"}' />
                </Form.Item>
              </Card>
            </Col>
          </Row>
        </Form>
      </div>
    </div>
  );
}

export default AgentForm;
