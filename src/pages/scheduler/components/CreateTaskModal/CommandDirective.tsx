/**
 * CommandDirective Component
 * 命令指令面板 - 任务名称和描述输入
 */

import { memo, useCallback } from 'react';
import { Input, Form } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '@/theme';
import { getSchedulerTheme } from '../../theme';
import { getCommandPanelStyle } from './style';
import type { FormInstance } from 'antd/es/form';

interface CommandDirectiveProps {
  form: FormInstance;
}

export const CommandDirective = memo(function CommandDirective({
  form,
}: CommandDirectiveProps) {
  const { t } = useTranslation('scheduler');
  const isDark = useIsDark();
  const theme = getSchedulerTheme(isDark);
  const panelStyle = getCommandPanelStyle(isDark);

  const handleNameChange = useCallback(() => {
    // 可以在这里添加实时验证逻辑
  }, []);

  return (
    <div style={panelStyle.container}>
      {/* 头部 */}
      <div style={panelStyle.header}>
        <FileTextOutlined style={panelStyle.headerIcon} />
        <span>{t('panels.command.header')}</span>
      </div>

      {/* 表单 */}
      <Form form={form} layout="vertical">
        {/* 任务代号 */}
        <Form.Item
          label={<span style={panelStyle.label}>{t('panels.command.taskName')}</span>}
          name="name"
          rules={[
            { required: true, message: t('form.nameRequired') },
            { min: 2, max: 50, message: t('form.nameLength') },
          ]}
          style={{ marginBottom: '16px' }}
        >
          <Input
            placeholder={t('form.namePlaceholder')}
            style={panelStyle.input}
            onChange={handleNameChange}
            autoFocus
          />
        </Form.Item>

        {/* 任务描述 */}
        <Form.Item
          label={<span style={panelStyle.label}>{t('panels.command.taskDesc')}</span>}
          name="description"
          style={{ marginBottom: 0 }}
        >
          <Input.TextArea
            rows={3}
            placeholder={t('form.descPlaceholder')}
            style={panelStyle.textarea}
          />
        </Form.Item>
      </Form>

      {/* 装饰元素 - 深色模式 */}
      {isDark && (
        <>
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '2px',
              background: `linear-gradient(90deg, ${theme.accentCyan}, ${theme.accentPurple}, ${theme.accentMagenta})`,
              opacity: 0.5,
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '20px',
              right: '20px',
              width: '40px',
              height: '40px',
              border: `1px solid ${theme.cardBorder}`,
              borderRadius: '50%',
              opacity: 0.3,
              background: `radial-gradient(circle, ${theme.accentCyan}20, transparent)`,
            }}
          />
        </>
      )}
    </div>
  );
});
