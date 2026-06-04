/**
 * 测试配置表单部分
 * 包含测试类型、测试命令、测试脚本、超时设置、期望结果等
 */

import { memo, useMemo } from 'react';
import { Form, Input, InputNumber, Row, Col, Select } from 'antd';
import type { FormInstance } from 'antd/es/form';
import { useTranslation } from 'react-i18next';

const { TextArea } = Input;

interface FormSectionTestProps {
  form: FormInstance;
  disabled?: boolean;
}

export const FormSectionTest = memo(function FormSectionTest({
  disabled = false,
}: FormSectionTestProps) {
  const { t } = useTranslation('benchmarks');

  const TEST_TYPE_OPTIONS = useMemo(
    () => [
      { label: t('components.formEnhanced.test.typeUnit'), value: 'unit' },
      { label: t('components.formEnhanced.test.typeIntegration'), value: 'integration' },
      { label: t('components.formEnhanced.test.typeE2e'), value: 'e2e' },
      { label: t('components.formEnhanced.test.typeCustom'), value: 'custom' },
    ],
    [t],
  );

  // 常用测试命令
  const TEST_COMMAND_OPTIONS = useMemo(
    () => [
      { label: 'pytest', value: 'pytest' },
      { label: t('components.formEnhanced.test.cmdPytestVerbose'), value: 'pytest -v' },
      { label: 'npm test', value: 'npm test' },
      { label: 'go test', value: 'go test' },
      { label: 'cargo test', value: 'cargo test' },
      { label: 'mvn test', value: 'mvn test' },
      { label: t('components.formEnhanced.test.cmdCustom'), value: 'custom' },
    ],
    [t],
  );

  return (
    <div style={sectionStyle}>
      <Row gutter={[24, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            label={t('components.formEnhanced.test.typeLabel')}
            name={['test_config', 'type']}
            rules={[{ required: true, message: t('components.formEnhanced.test.typeRequired') }]}
          >
            <Select options={TEST_TYPE_OPTIONS} disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label={t('components.formEnhanced.test.commandLabel')}
            name={['test_config', 'command']}
            rules={[{ required: true, message: t('components.formEnhanced.test.commandRequired') }]}
          >
            <Select
              options={TEST_COMMAND_OPTIONS}
              placeholder={t('components.formEnhanced.test.commandPlaceholder')}
              disabled={disabled}
              showSearch
              allowClear
              filterOption={(input, option) =>
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            label={t('components.formEnhanced.test.scriptLabel')}
            name={['test_config', 'script']}
            tooltip={t('components.formEnhanced.test.scriptTooltip')}
          >
            <TextArea
              rows={8}
              placeholder={t('components.formEnhanced.test.scriptPlaceholder')}
              style={{ fontFamily: 'Consolas, monospace', fontSize: 13 }}
              disabled={disabled}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label={t('components.formEnhanced.test.timeoutLabel')}
            name={['test_config', 'timeout']}
            rules={[{ type: 'number', min: 1, max: 600, message: t('components.formEnhanced.test.timeoutRange') }]}
          >
            <InputNumber
              min={1}
              max={600}
              style={{ width: '100%' }}
              placeholder="60"
              disabled={disabled}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label={t('components.formEnhanced.test.exitCodeLabel')}
            name={['test_config', 'expected', 'exit_code']}
            tooltip={t('components.formEnhanced.test.exitCodeTooltip')}
          >
            <InputNumber
              min={0}
              max={255}
              style={{ width: '100%' }}
              placeholder="0"
              disabled={disabled}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={8}>
          <Form.Item
            label={t('components.formEnhanced.test.workingDirLabel')}
            name={['test_config', 'working_dir']}
            tooltip={t('components.formEnhanced.test.workingDirTooltip')}
          >
            <Input placeholder="/workspace" disabled={disabled} />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            label={t('components.formEnhanced.test.envLabel')}
            name={['test_config', 'env']}
            tooltip={t('components.formEnhanced.test.envTooltip')}
          >
            <TextArea
              rows={4}
              placeholder="NODE_ENV=test&#10;API_URL=http://localhost:3000"
              disabled={disabled}
            />
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
});

const sectionStyle: React.CSSProperties = {
  padding: 0,
};

export default FormSectionTest;
