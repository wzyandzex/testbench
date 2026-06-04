/**
 * 基本信息表单部分
 */

import { memo, useMemo } from 'react';
import { Form, Input, Select, Row, Col } from 'antd';
import { useTranslation } from 'react-i18next';
import type { FormInstance } from 'antd/es/form';
import type { DifficultyLevel } from '@/types';

const LANGUAGE_OPTIONS = [
  { label: 'Python', value: 'python' },
  { label: 'JavaScript', value: 'javascript' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'Java', value: 'java' },
  { label: 'Go', value: 'go' },
  { label: 'Rust', value: 'rust' },
  { label: 'C++', value: 'cpp' },
  { label: 'Ruby', value: 'ruby' },
  { label: 'PHP', value: 'php' },
];

interface FormSectionBasicProps {
  form: FormInstance;
  disabled?: boolean;
}

export const FormSectionBasic = memo(function FormSectionBasic({
  disabled = false,
}: FormSectionBasicProps) {
  const { t } = useTranslation('benchmarks');

  const BENCHMARK_TYPE_OPTIONS = useMemo(
    () => [
      { label: t('components.formEnhanced.basic.typeCodeFix'), value: 'code_fix' },
      { label: t('components.formEnhanced.basic.typeCodeComplete'), value: 'code_complete' },
      { label: t('components.formEnhanced.basic.typeTerminal'), value: 'terminal' },
      { label: t('components.formEnhanced.basic.typeCodeReview'), value: 'code_review' },
      { label: t('components.formEnhanced.basic.typeRefactor'), value: 'refactor' },
      { label: t('components.formEnhanced.basic.typeDebug'), value: 'debug' },
      { label: t('components.formEnhanced.basic.typeOptimize'), value: 'optimize' },
    ],
    [t],
  );

  const DIFFICULTY_OPTIONS = useMemo<{ label: string; value: DifficultyLevel }[]>(
    () => [
      { label: t('components.formEnhanced.basic.difficultyEasy'), value: 'easy' },
      { label: t('components.formEnhanced.basic.difficultyMedium'), value: 'medium' },
      { label: t('components.formEnhanced.basic.difficultyHard'), value: 'hard' },
      { label: t('components.formEnhanced.basic.difficultyExpert'), value: 'expert' },
    ],
    [t],
  );

  return (
    <div style={sectionStyle}>
      <Row gutter={[24, 16]}>
        <Col xs={24} md={12}>
          <Form.Item
            label={t('components.formEnhanced.basic.nameLabel')}
            name="name"
            rules={[
              { required: true, message: t('components.formEnhanced.basic.nameRequired') },
              { pattern: /^[a-zA-Z0-9_-]+$/, message: t('components.formEnhanced.basic.namePattern') },
              { min: 1, max: 100, message: t('components.formEnhanced.basic.nameLength') },
            ]}
            validateTrigger={['onChange', 'onBlur']}
          >
            <Input placeholder="my_benchmark" disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label={t('components.formEnhanced.basic.displayNameLabel')}
            name="display_name"
            rules={[
              { required: true, message: t('components.formEnhanced.basic.displayNameRequired') },
              { max: 255, message: t('components.formEnhanced.basic.displayNameMax') },
            ]}
          >
            <Input placeholder={t('components.formEnhanced.basic.displayNamePlaceholder')} disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label={t('components.formEnhanced.basic.typeLabel')}
            name="type"
            rules={[{ required: true, message: t('components.formEnhanced.basic.typeRequired') }]}
          >
            <Select options={BENCHMARK_TYPE_OPTIONS} disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item
            label={t('components.formEnhanced.basic.languageLabel')}
            name="language"
            rules={[{ required: true, message: t('components.formEnhanced.basic.languageRequired') }]}
          >
            <Select options={LANGUAGE_OPTIONS} disabled={disabled} />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item label={t('components.formEnhanced.basic.difficultyLabel')} name="difficulty">
            <Select
              options={DIFFICULTY_OPTIONS}
              placeholder={t('components.formEnhanced.basic.difficultyPlaceholder')}
              disabled={disabled}
            />
          </Form.Item>
        </Col>

        <Col xs={24} md={12}>
          <Form.Item label={t('components.formEnhanced.basic.categoryLabel')} name="category">
            <Input
              placeholder={t('components.formEnhanced.basic.categoryPlaceholder')}
              disabled={disabled}
            />
          </Form.Item>
        </Col>

        <Col span={24}>
          <Form.Item
            label={t('components.formEnhanced.basic.descriptionLabel')}
            name="description"
            rules={[{ max: 5000, message: t('components.formEnhanced.basic.descriptionMax') }]}
          >
            <Input.TextArea
              rows={4}
              placeholder={t('components.formEnhanced.basic.descriptionPlaceholder')}
              showCount
              maxLength={5000}
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

export default FormSectionBasic;
