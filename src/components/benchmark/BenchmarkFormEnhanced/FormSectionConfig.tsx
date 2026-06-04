/**
 * 任务配置表单部分
 * 包含目标、用户指令、系统提示、超时设置、资源限制、Agent 配置等
 */

import { memo, useMemo } from 'react';
import {
  Form,
  Input,
  InputNumber,
  Row,
  Col,
  Select,
  Switch,
  Collapse,
} from 'antd';
import type { FormInstance } from 'antd/es/form';
import { useTranslation } from 'react-i18next';

const { TextArea } = Input;
const { Panel } = Collapse;

interface FormSectionConfigProps {
  form: FormInstance;
  disabled?: boolean;
}

export const FormSectionConfig = memo(function FormSectionConfig({
  disabled = false,
}: FormSectionConfigProps) {
  const { t } = useTranslation('benchmarks');

  const AGENT_MODE_OPTIONS = useMemo(
    () => [
      { label: t('components.formEnhanced.config.modeCodeEdit'), value: 'code_edit' },
      { label: t('components.formEnhanced.config.modeTerminal'), value: 'terminal' },
      { label: t('components.formEnhanced.config.modeHybrid'), value: 'hybrid' },
      { label: t('components.formEnhanced.config.modeAutonomous'), value: 'autonomous' },
    ],
    [t],
  );

  return (
    <div style={sectionStyle}>
      <Row gutter={[24, 16]}>
        <Col span={24}>
          <Form.Item
            label={t('components.formEnhanced.config.goalLabel')}
            name={['config', 'goal']}
            rules={[{ required: true, message: t('components.formEnhanced.config.goalRequired') }]}
          >
            <Input placeholder={t('components.formEnhanced.config.goalPlaceholder')} disabled={disabled} />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            label={t('components.formEnhanced.config.userPromptLabel')}
            name={['config', 'instructions', 'user_prompt']}
            rules={[{ required: true, message: t('components.formEnhanced.config.userPromptRequired') }]}
          >
            <TextArea rows={4} placeholder={t('components.formEnhanced.config.userPromptPlaceholder')} disabled={disabled} />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            label={t('components.formEnhanced.config.systemPromptLabel')}
            name={['config', 'instructions', 'system_prompt']}
          >
            <TextArea rows={3} placeholder={t('components.formEnhanced.config.systemPromptPlaceholder')} disabled={disabled} />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            label={t('components.formEnhanced.config.contextLabel')}
            name={['config', 'instructions', 'context']}
          >
            <TextArea rows={2} placeholder={t('components.formEnhanced.config.contextPlaceholder')} disabled={disabled} />
          </Form.Item>
        </Col>

        {/* 基础设置 */}
        <Col span={24}>
          <Collapse defaultActiveKey={['basic']} ghost>
            <Panel header={t('components.formEnhanced.config.panelExecution')} key="basic">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label={t('components.formEnhanced.config.timeoutLabel')}
                    name={['config', 'timeout']}
                    rules={[{ required: true, message: t('components.formEnhanced.config.timeoutRequired') }]}
                  >
                    <InputNumber min={1} max={3600} style={{ width: '100%' }} disabled={disabled} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label={t('components.formEnhanced.config.maxAttemptsLabel')}
                    name={['config', 'max_attempts']}
                    rules={[{ required: true, message: t('components.formEnhanced.config.maxAttemptsRequired') }]}
                  >
                    <InputNumber min={1} max={10} style={{ width: '100%' }} disabled={disabled} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label={t('components.formEnhanced.config.maxStepsLabel')}
                    name={['config', 'agent_config', 'max_steps']}
                  >
                    <InputNumber min={1} max={100} style={{ width: '100%' }} disabled={disabled} />
                  </Form.Item>
                </Col>
              </Row>
            </Panel>

            {/* 资源限制 */}
            <Panel header={t('components.formEnhanced.config.panelResource')} key="resource">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={6}>
                  <Form.Item
                    label={t('components.formEnhanced.config.memoryLabel')}
                    name={['config', 'resource_limits', 'max_memory_mb']}
                  >
                    <InputNumber min={128} max={8192} style={{ width: '100%' }} disabled={disabled} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={6}>
                  <Form.Item
                    label={t('components.formEnhanced.config.cpuLabel')}
                    name={['config', 'resource_limits', 'max_cpu_count']}
                  >
                    <InputNumber min={1} max={16} style={{ width: '100%' }} disabled={disabled} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={6}>
                  <Form.Item
                    label={t('components.formEnhanced.config.maxDurationLabel')}
                    name={['config', 'resource_limits', 'max_duration']}
                  >
                    <InputNumber min={10} max={3600} style={{ width: '100%' }} disabled={disabled} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={6}>
                  <Form.Item
                    label={t('components.formEnhanced.config.diskLabel')}
                    name={['config', 'resource_limits', 'max_disk_usage_mb']}
                  >
                    <InputNumber min={100} max={10240} style={{ width: '100%' }} disabled={disabled} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label={t('components.formEnhanced.config.networkLabel')}
                    name={['config', 'resource_limits', 'network_access']}
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren={t('components.formEnhanced.config.networkAllow')}
                      unCheckedChildren={t('components.formEnhanced.config.networkDeny')}
                      disabled={disabled}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Panel>

            {/* Agent 配置 */}
            <Panel header={t('components.formEnhanced.config.panelAgent')} key="agent">
              <Row gutter={[16, 16]}>
                <Col xs={24} md={8}>
                  <Form.Item
                    label={t('components.formEnhanced.config.agentModeLabel')}
                    name={['config', 'agent_config', 'mode']}
                  >
                    <Select options={AGENT_MODE_OPTIONS} disabled={disabled} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label={t('components.formEnhanced.config.temperatureLabel')}
                    name={['config', 'agent_config', 'temperature']}
                  >
                    <InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} disabled={disabled} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={8}>
                  <Form.Item
                    label={t('components.formEnhanced.config.maxTokensLabel')}
                    name={['config', 'agent_config', 'max_tokens']}
                  >
                    <InputNumber min={100} max={32000} step={100} style={{ width: '100%' }} disabled={disabled} />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label={t('components.formEnhanced.config.allowRetryLabel')}
                    name={['config', 'agent_config', 'allow_retry']}
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren={t('components.formEnhanced.config.yes')}
                      unCheckedChildren={t('components.formEnhanced.config.no')}
                      disabled={disabled}
                    />
                  </Form.Item>
                </Col>

                <Col xs={24} md={12}>
                  <Form.Item
                    label={t('components.formEnhanced.config.verboseLabel')}
                    name={['config', 'agent_config', 'verbose']}
                    valuePropName="checked"
                  >
                    <Switch
                      checkedChildren={t('components.formEnhanced.config.verboseOn')}
                      unCheckedChildren={t('components.formEnhanced.config.verboseOff')}
                      disabled={disabled}
                    />
                  </Form.Item>
                </Col>
              </Row>
            </Panel>
          </Collapse>
        </Col>
      </Row>
    </div>
  );
});

const sectionStyle: React.CSSProperties = {
  padding: 0,
};

export default FormSectionConfig;
