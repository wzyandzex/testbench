/**
 * ImportConfig component
 * Import config form - draft, approval, tags
 */

import { memo, useCallback, useState } from 'react';
import { Form, Input, Switch, Tag, Space } from 'antd';
import { TagsOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { ImportConfigType } from '../service';

interface ImportConfigProps {
  value?: Partial<ImportConfigType>;
  onChange: (config: Partial<ImportConfigType>) => void;
  disabled?: boolean;
}

export const ImportConfig = memo(function ImportConfig({
  value = {},
  onChange,
  disabled = false,
}: ImportConfigProps) {
  const { t } = useTranslation('import');
  const [tagsInput, setTagsInput] = useState('');
  const tags = value?.tags || [];

  const handleSwitchChange = useCallback(
    (key: keyof ImportConfigType, checked: boolean) => {
      onChange({ ...value, [key]: checked });
    },
    [value, onChange]
  );

  const handleDescriptionChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      onChange({ ...value, description: e.target.value });
    },
    [value, onChange]
  );

  const handleTagsInputClose = useCallback(
    (removedTag: string) => {
      const newTags = tags.filter(tag => tag !== removedTag);
      onChange({ ...value, tags: newTags });
    },
    [tags, value, onChange]
  );

  const handleTagsInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTagsInput(e.target.value);
  }, []);

  const handleTagsInputConfirm = useCallback(() => {
    const trimmed = tagsInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      onChange({ ...value, tags: [...tags, trimmed] });
    }
    setTagsInput('');
  }, [tagsInput, tags, value, onChange]);

  return (
    <div style={{ padding: '20px 0' }}>
      <Form layout="vertical" disabled={disabled}>
        {/* Auto create Benchmark */}
        <Form.Item
          label={t('config.autoCreate')}
          tooltip={t('config.autoCreateTooltip')}
        >
          <Switch
            checked={value?.autoCreate ?? false}
            onChange={(checked) => handleSwitchChange('autoCreate', checked)}
            disabled={disabled}
          />
          <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--import-text-secondary)' }}>
            {t('config.autoCreateHint')}
          </span>
        </Form.Item>

        {/* Require approval */}
        <Form.Item
          label={t('config.requireApproval')}
          tooltip={t('config.requireApprovalTooltip')}
        >
          <Switch
            checked={value?.requireApproval ?? false}
            onChange={(checked) => handleSwitchChange('requireApproval', checked)}
            disabled={disabled}
          />
          <span style={{ marginLeft: 8, fontSize: 13, color: 'var(--import-text-secondary)' }}>
            {t('config.requireApprovalHint')}
          </span>
        </Form.Item>

        {/* Description */}
        <Form.Item label={t('config.descLabel')}>
          <Input.TextArea
            placeholder={t('config.descPlaceholder')}
            value={value?.description || ''}
            onChange={handleDescriptionChange}
            disabled={disabled}
            rows={3}
            maxLength={500}
            showCount
          />
        </Form.Item>

        {/* Tags */}
        <Form.Item label={t('form.tags')}>
          <Space size={8} wrap>
            {tags.map((tag) => (
              <Tag
                key={tag}
                closable
                onClose={() => handleTagsInputClose(tag)}
                style={{ marginBottom: 8 }}
              >
                {tag}
              </Tag>
            ))}
            <Input
              type="text"
              size="small"
              placeholder={t('form.tagsPlaceholder')}
              value={tagsInput}
              onChange={handleTagsInputChange}
              onBlur={handleTagsInputConfirm}
              onPressEnter={handleTagsInputConfirm}
              disabled={disabled}
              prefix={<TagsOutlined />}
              style={{ width: 150 }}
            />
          </Space>
        </Form.Item>
      </Form>
    </div>
  );
});
