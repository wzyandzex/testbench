/**
 * 评测任务表单组件
 * 用于创建和编辑评测任务
 */

import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Form,
  Input,
  Select,
  Button,
  Card,
  Row,
  Col,
  Switch,
  Slider,
} from 'antd';

import type { BenchmarkFormData } from '@/types/benchmark';

const { TextArea } = Input;
const { Option } = Select;

interface BenchmarkFormProps {
  initialValues?: Partial<BenchmarkFormData>;
  onSubmit: (data: BenchmarkFormData) => Promise<void>;
  onCancel?: () => void;
  submitText?: string;
  loading?: boolean;
}

// 语言选项
const languageOptions = [
  { label: 'Python', value: 'python' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' },
  { label: 'Java', value: 'java' },
  { label: 'C++', value: 'cpp' },
  { label: 'Ruby', value: 'ruby' },
];

/**
 * 评测任务表单组件
 */
export function BenchmarkForm({
  initialValues,
  onCancel,
  submitText,
  loading = false,
}: BenchmarkFormProps) {
  const { t } = useTranslation('benchmarks');
  const [form] = Form.useForm<BenchmarkFormData>();

  // 分类选项（依赖翻译）
  const categoryOptions = useMemo(
    () => [
      { label: t('components.form.categoryCoding'), value: 'coding' },
      { label: t('components.form.categoryReasoning'), value: 'reasoning' },
      { label: t('components.form.categoryKnowledge'), value: 'knowledge' },
      { label: t('components.form.categoryMultimodal'), value: 'multimodal' },
    ],
    [t],
  );

  // 初始化表单值
  useEffect(() => {
    if (initialValues) {
      form.setFieldsValue(initialValues);
    }
  }, [form, initialValues]);

  return (
    <Form
      form={form}
      layout="horizontal"
      style={{ maxWidth: 800 }}
      initialValues={{
        status: 'active',
        category: 'coding',
        language: 'python',
        config: {
          timeout: 300,
          maxRetries: 3,
          passScore: 60,
        },
      }}
    >
      <Card
        title={<span style={{ fontWeight: 600 }}>{t('components.form.basicTitle')}</span>}
        style={{ marginBottom: 16 }}
      >
        <Form.Item
          label={t('components.form.nameLabel')}
          name="name"
          rules={[
            { required: true, message: t('components.form.nameRequired') },
            { min: 2, max: 100, message: t('components.form.nameLength') },
          ]}
        >
          <Input placeholder={t('components.form.namePlaceholder')} />
        </Form.Item>

        <Form.Item
          label={t('components.form.descriptionLabel')}
          name="description"
          rules={[
            { required: true, message: t('components.form.descriptionRequired') },
            { max: 500, message: t('components.form.descriptionMax') },
          ]}
        >
          <TextArea
            rows={4}
            placeholder={t('components.form.descriptionPlaceholder')}
            showCount
            maxLength={500}
          />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('components.form.languageLabel')}
              name="language"
              rules={[{ required: true, message: t('components.form.languageRequired') }]}
            >
              <Select placeholder={t('components.form.languagePlaceholder')}>
                {languageOptions.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={t('components.form.categoryLabel')}
              name="category"
              rules={[{ required: true, message: t('components.form.categoryRequired') }]}
            >
              <Select placeholder={t('components.form.categoryPlaceholder')}>
                {categoryOptions.map((opt) => (
                  <Option key={opt.value} value={opt.value}>
                    {opt.label}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label={t('components.form.statusLabel')}
          name="status"
          valuePropName="checked"
          getValueProps={(checked) => ({ value: checked ? 'active' : 'draft' })}
        >
          <Switch checkedChildren={t('components.form.statusSwitch')} />
        </Form.Item>
      </Card>

      <Card
        title={<span style={{ fontWeight: 600 }}>{t('components.form.configTitle')}</span>}
        style={{ marginBottom: 16 }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('components.form.timeoutLabel')}
              name={['config', 'timeout']}
              rules={[{ required: true, message: t('components.form.timeoutRequired') }]}
              tooltip={t('components.form.timeoutTooltip')}
            >
              <Input
                type="number"
                min={10}
                max={3600}
                suffix={t('components.form.timeoutSuffix')}
                placeholder="300"
              />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label={t('components.form.maxRetriesLabel')}
              name={['config', 'maxRetries']}
              rules={[{ required: true, message: t('components.form.maxRetriesRequired') }]}
            >
              <Input
                type="number"
                min={0}
                max={5}
                placeholder="3"
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label={t('components.form.passScoreLabel')}
              name={['config', 'passScore']}
              rules={[{ required: true, message: t('components.form.passScoreRequired') }]}
              tooltip={t('components.form.passScoreTooltip')}
            >
              <Slider
                min={0}
                max={100}
                marks={{ 0: '0', 60: '60', 80: '80', 100: '100' }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Card>

      <Card
        title={<span style={{ fontWeight: 600 }}>{t('components.form.casesTitle')}</span>}
        style={{ marginBottom: 24 }}
        extra={
          <Button type="link" size="small">
            {t('components.form.batchImport')}
          </Button>
        }
      >
        {/* 测试用例列表将由子组件实现 */}
        <div style={{ padding: 24, textAlign: 'center', color: '#999' }}>
          {t('components.form.casesDeveloping')}
        </div>
      </Card>

      {/* 操作按钮 */}
      <div style={{ textAlign: 'right' }}>
        {onCancel && (
          <Button style={{ marginRight: 8 }} onClick={onCancel}>
            {t('components.form.cancel')}
          </Button>
        )}
        <Button type="primary" htmlType="submit" loading={loading}>
          {submitText ?? t('components.form.submitDefault')}
        </Button>
      </div>
    </Form>
  );
}

export default BenchmarkForm;
