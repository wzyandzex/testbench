import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Checkbox, Divider, Modal, Radio, Select, Space, Typography } from 'antd';

import executionService, {
  type ExecutionExportFormat,
  type ExecutionExportFormatInfo,
  type ExecutionExportTemplate,
} from '@/services/execution';
import { useThemeTokens } from '@/theme';
import { listTemplates } from '@/pages/report-templates/service';
import type { TemplateInfo } from '@/pages/report-templates/service';

const { Text } = Typography;

const formatOptions = [
  { value: 'html', label: 'HTML', descriptionKey: 'components.exportModal.formats.html' },
  { value: 'pdf', label: 'PDF', descriptionKey: 'components.exportModal.formats.pdf' },
  { value: 'excel', label: 'Excel', descriptionKey: 'components.exportModal.formats.excel' },
] as const satisfies Array<{
  value: ExecutionExportFormat;
  label: string;
  descriptionKey: string;
}>;

const templateOptions = [
  { value: 'summary', labelKey: 'components.exportModal.templates.summaryName', descriptionKey: 'components.exportModal.templates.summary' },
  { value: 'detailed', labelKey: 'components.exportModal.templates.detailedName', descriptionKey: 'components.exportModal.templates.detailed' },
  { value: 'comparison', labelKey: 'components.exportModal.templates.comparisonName', descriptionKey: 'components.exportModal.templates.comparison' },
] as const satisfies Array<{
  value: ExecutionExportTemplate;
  labelKey: string;
  descriptionKey: string;
}>;

export interface ExecutionExportDraft {
  format: ExecutionExportFormat;
  template: ExecutionExportTemplate;
  templateId?: string;
  includeCharts: boolean;
}

interface ExecutionExportModalProps {
  open: boolean;
  mode: 'single' | 'batch';
  targetCount?: number;
  subjectLabel: string;
  loading?: boolean;
  onCancel: () => void;
  onSubmit: (draft: ExecutionExportDraft) => void | Promise<void>;
}

export function ExecutionExportModal({
  open,
  mode,
  targetCount = 1,
  subjectLabel,
  loading = false,
  onCancel,
  onSubmit,
}: ExecutionExportModalProps) {
  const { t } = useTranslation('executions');
  const tokens = useThemeTokens();
  const [draft, setDraft] = useState<ExecutionExportDraft>({
    format: 'html',
    template: 'summary',
    templateId: undefined,
    includeCharts: false,
  });
  const [customTemplates, setCustomTemplates] = useState<TemplateInfo[]>([]);
  const [exportFormats, setExportFormats] = useState<ExecutionExportFormatInfo[]>([]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setDraft({
      format: 'html',
      template: 'summary',
      templateId: undefined,
      includeCharts: false,
    });
    setCustomTemplates([]);
    setExportFormats([]);

    Promise.all([
      listTemplates({ page_size: 50, status: 'active' }),
      executionService.getExportFormats(),
    ])
      .then(([templateResp, formatResp]) => {
        setCustomTemplates((templateResp.data || []).filter((template) => !template.is_system));
        setExportFormats(formatResp.formats || []);
      })
      .catch(() => {
        setCustomTemplates([]);
        setExportFormats([]);
      });
  }, [open]);

  const selectedFormat = useMemo(
    () => formatOptions.find((item) => item.value === draft.format) ?? formatOptions[0],
    [draft.format]
  );
  const selectedTemplate = useMemo(
    () => templateOptions.find((item) => item.value === draft.template) ?? templateOptions[0],
    [draft.template]
  );
  const selectedCustomTemplate = useMemo(
    () => customTemplates.find((template) => template.id === draft.templateId),
    [customTemplates, draft.templateId]
  );
  const selectedFormatInfo = useMemo(
    () => exportFormats.find((format) => format.format === draft.format),
    [draft.format, exportFormats]
  );
  const chartsSupported = selectedFormatInfo?.supports_charts ?? true;
  const comparisonEnabled = mode === 'batch' && targetCount >= 2;
  const canSubmit = draft.template !== 'comparison' || comparisonEnabled;

  useEffect(() => {
    if (!chartsSupported) {
      setDraft((current) => (current.includeCharts ? { ...current, includeCharts: false } : current));
    }
  }, [chartsSupported]);

  useEffect(() => {
    if (!comparisonEnabled) {
      setDraft((current) => (
        current.template === 'comparison'
          ? { ...current, template: 'summary', templateId: undefined }
          : current
      ));
    }
  }, [comparisonEnabled]);

  const getTemplateBaseLabel = (base?: string) => {
    switch (base) {
      case 'detailed':
        return t('components.exportModal.detailedLabel');
      case 'comparison':
        return t('components.exportModal.comparisonLabel');
      case 'summary':
      default:
        return t('components.exportModal.summaryLabel');
    }
  };

  const note =
    mode === 'batch'
      ? draft.template === 'comparison' && comparisonEnabled
        ? t('components.exportModal.noteBatchComparison')
        : t('components.exportModal.noteBatch')
      : t('components.exportModal.noteSingle');
  const comparisonUnavailableText =
    mode === 'batch'
      ? t('components.exportModal.comparisonRequiresMultiple')
      : t('components.exportModal.comparisonSingleUnavailable');

  return (
    <Modal
      open={open}
      title={mode === 'batch' ? t('components.exportModal.titleBatch') : t('components.exportModal.titleSingle')}
      okText={mode === 'batch' ? t('components.exportModal.okBatch') : t('components.exportModal.okSingle')}
      cancelText={t('components.exportModal.cancel')}
      confirmLoading={loading}
      onCancel={onCancel}
      onOk={() => {
        if (canSubmit) {
          void onSubmit(draft);
        }
      }}
      okButtonProps={{ disabled: !canSubmit }}
      destroyOnClose
    >
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        <div
          style={{
            borderRadius: 16,
            border: `1px solid ${tokens.border.default}`,
            background: `linear-gradient(135deg, ${tokens.bg.secondary}, ${tokens.bg.elevated})`,
            padding: 16,
          }}
        >
          <Space direction="vertical" size={4}>
            <Text style={{ color: tokens.text.secondary }}>{t('components.exportModal.subject')}</Text>
            <Text style={{ color: tokens.text.primary, fontSize: 16, fontWeight: 600 }}>{subjectLabel}</Text>
          </Space>
        </div>

        <div
          style={{
            borderRadius: 16,
            border: `1px solid ${tokens.border.default}`,
            background: tokens.bg.elevated,
            padding: 16,
          }}
        >
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Text style={{ color: tokens.text.primary, fontWeight: 600 }}>{t('components.exportModal.formatLabel')}</Text>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={draft.format}
              onChange={(event) =>
                setDraft((current) => ({ ...current, format: event.target.value as ExecutionExportFormat }))
              }
            >
              {formatOptions.map((item) => (
                <Radio.Button key={item.value} value={item.value}>
                  {item.label}
                </Radio.Button>
              ))}
            </Radio.Group>
            <Text style={{ color: tokens.text.secondary }}>{t(selectedFormat.descriptionKey)}</Text>
          </Space>
        </div>

        <div
          style={{
            borderRadius: 16,
            border: `1px solid ${tokens.border.default}`,
            background: tokens.bg.elevated,
            padding: 16,
          }}
        >
          <Space direction="vertical" size={12} style={{ width: '100%' }}>
            <Text style={{ color: tokens.text.primary, fontWeight: 600 }}>{t('components.exportModal.templateLabel')}</Text>
            <Radio.Group
              optionType="button"
              buttonStyle="solid"
              value={draft.template}
              disabled={Boolean(draft.templateId)}
              onChange={(event) =>
                setDraft((current) => ({ ...current, template: event.target.value as ExecutionExportTemplate }))
              }
            >
              {templateOptions.map((item) => {
                const disabled = item.value === 'comparison' && !comparisonEnabled;
                return (
                  <Radio.Button key={item.value} value={item.value} disabled={disabled}>
                    {t(item.labelKey)}
                  </Radio.Button>
                );
              })}
            </Radio.Group>
            <Text style={{ color: tokens.text.secondary }}>{t(selectedTemplate.descriptionKey)}</Text>
            {!comparisonEnabled && (
              <Text style={{ color: tokens.text.secondary, fontSize: 12 }}>
                {comparisonUnavailableText}
              </Text>
            )}

            {customTemplates.length > 0 && (
              <>
                <Divider style={{ margin: '8px 0' }} />
                <Text style={{ color: tokens.text.primary, fontWeight: 600, fontSize: 13 }}>
                  {t('components.exportModal.customTemplateTitle')}
                </Text>
                <Select
                  allowClear
                  placeholder={t('components.exportModal.customTemplatePlaceholder')}
                  value={draft.templateId}
                  onChange={(value) =>
                    setDraft((current) => {
                      if (!value) {
                        return { ...current, templateId: undefined };
                      }

                      const template = customTemplates.find((item) => item.id === value);
                      if (!template) {
                        return { ...current, templateId: value };
                      }

                      return {
                        ...current,
                        templateId: value,
                        template: template.base_template,
                      };
                    })
                  }
                  style={{ width: '100%' }}
                  options={customTemplates.map((tpl) => ({
                    value: tpl.id,
                    label: t('components.exportModal.customTemplateOption', {
                      name: tpl.name,
                      defaultBadge: tpl.is_default ? t('components.exportModal.defaultBadge') : '',
                      base: getTemplateBaseLabel(tpl.base_template),
                    }),
                  }))}
                />
                {draft.templateId && (
                  <Text style={{ color: tokens.text.secondary, fontSize: 12 }}>
                    {t('components.exportModal.customTemplateOverride', {
                      base: getTemplateBaseLabel(selectedCustomTemplate?.base_template),
                    })}
                  </Text>
                )}
              </>
            )}
          </Space>
        </div>

        <div
          style={{
            borderRadius: 16,
            border: `1px solid ${tokens.border.default}`,
            background: tokens.bg.elevated,
            padding: 16,
          }}
        >
          <Space direction="vertical" size={10} style={{ width: '100%' }}>
            <Checkbox
              checked={draft.includeCharts}
              disabled={!chartsSupported}
              onChange={(event) =>
                setDraft((current) => ({ ...current, includeCharts: event.target.checked }))
              }
            >
              {t('components.exportModal.chartsLabel')}
            </Checkbox>
            <Text style={{ color: tokens.text.secondary }}>
              {chartsSupported
                ? t('components.exportModal.chartsSupported')
                : t('components.exportModal.chartsUnsupported', { format: selectedFormat.label })}
            </Text>
          </Space>
        </div>

        <Alert type="info" showIcon message={t('components.exportModal.noteTitle')} description={note} />
      </Space>
    </Modal>
  );
}
