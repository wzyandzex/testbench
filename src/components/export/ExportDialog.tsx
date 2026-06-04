/**
 * ExportDialog — full export configuration modal
 */

import { useState, useCallback, useEffect, memo } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import {
  Modal,
  DatePicker,
  Switch,
  Button,
  Alert,
  Space,
  Divider,
  Radio,
} from 'antd';
import {
  DownloadOutlined,
  CloudDownloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useExportStore, useExportType, useExportConfig, useExportContext } from './store';
import { ExportFormatSelector } from './ExportFormatSelector';
import type { ExportFormat, ExportFilters, ExportOptions } from './types';
import { EXPORT_FORMATS, estimateFileSize, formatFileSize, getDefaultOptionsForFormat, exportService } from './service';

const { RangePicker } = DatePicker;

interface ExportDialogProps {
  onExport?: (request: any) => Promise<any>;
  loading?: boolean;
}

export const ExportDialog = memo(function ExportDialog({
  onExport,
  loading: externalLoading = false,
}: ExportDialogProps) {
  const { t } = useTranslation('common');
  const dialogVisible = useExportStore((s) => s.dialogVisible);
  const exportType = useExportType();
  const config = useExportConfig();
  const exportContext = useExportContext();

  const closeDialog = useExportStore((s) => s.closeDialog);
  const setFormat = useExportStore((s) => s.setFormat);
  const setFilters = useExportStore((s) => s.setFilters);
  const setOptions = useExportStore((s) => s.setOptions);

  // Local state
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);

  // 重置进度
  useEffect(() => {
    if (!dialogVisible) {
      setProgress(0);
    }
  }, [dialogVisible]);

  // 格式变化时更新默认选项
  const handleFormatChange = useCallback(
    (format: ExportFormat) => {
      setFormat(format);
      const defaultOptions = getDefaultOptionsForFormat(format);
      setOptions(defaultOptions);
    },
    [setFormat, setOptions]
  );

  // 数据范围变化
  const handleDataRangeChange = useCallback(
    (range: ExportFilters['dataRange']) => {
      setFilters({ dataRange: range });
    },
    [setFilters]
  );

  // 时间范围变化
  const handleDateRangeChange = useCallback(
    (dates: any) => {
      if (dates && dates[0] && dates[1]) {
        setFilters({
          start_date: dates[0].toISOString(),
          end_date: dates[1].toISOString(),
        });
      } else {
        setFilters({
          start_date: undefined,
          end_date: undefined,
        });
      }
    },
    [setFilters]
  );

  // 选项变化
  const handleOptionChange = useCallback(
    (key: keyof ExportOptions, value: any) => {
      setOptions({ [key]: value });
    },
    [setOptions]
  );

  // 获取预估记录数
  const getEstimatedCount = useCallback((): number => {
    const totalCount = exportContext?.totalCount || 0;
    const dataRange = config.filters.dataRange;

    switch (dataRange) {
      case 'current_page':
        return Math.min(20, totalCount);
      case 'filtered':
        return totalCount;
      case 'all':
        return totalCount;
      default:
        return totalCount;
    }
  }, [config.filters.dataRange, exportContext?.totalCount]);

  // 预估文件大小
  const estimatedSize = estimateFileSize(getEstimatedCount(), config.format);
  const formatInfo = EXPORT_FORMATS[config.format];

  // 执行导出
  const handleExport = useCallback(async () => {
    if (!exportType) return;

    setExporting(true);
    setProgress(0);

    try {
      const request = {
        type: exportType,
        format: config.format,
        filters: {
          ...config.filters,
          ...exportContext?.filters,
        },
        options: config.options,
      };

      // 使用传入的导出函数或默认服务
      if (onExport) {
        const result = await onExport(request);
        useExportStore.getState().setLastExport(result);

        // 如果返回下载链接，自动下载
        if (result?.download_url) {
          exportService.downloadFile(result.download_url, result.file_name);
        }
      } else {
        // 使用默认服务
        const result = await exportService.executions(request);
        useExportStore.getState().setLastExport(result);

        if (result.download_url) {
          exportService.downloadFile(result.download_url, result.file_name);
        }
      }

      // 导出成功，关闭对话框
      setTimeout(() => {
        closeDialog();
      }, 500);
    } catch (err) {
      // 错误由 axios 拦截器处理
    } finally {
      setExporting(false);
      setProgress(0);
    }
  }, [exportType, config, exportContext, onExport, closeDialog]);

  // 当前是否包含 trace
  const showTraceOption = exportType === 'executions';
  // 当前是否支持压缩
  const showCompressOption = formatInfo.supports_compression;

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CloudDownloadOutlined style={{ color: '#667eea' }} />
          <span>{t('components.export.dialog.title')}</span>
        </div>
      }
      open={dialogVisible}
      onCancel={closeDialog}
      width={600}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={closeDialog}>
            {t('components.export.dialog.cancel')}
          </Button>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exporting || externalLoading}
            disabled={!exportType}
          >
            {exporting
              ? (progress > 0
                ? t('components.export.dialog.exportingProgress', { progress })
                : t('components.export.dialog.exporting'))
              : t('components.export.dialog.start')}
          </Button>
        </div>
      }
      destroyOnClose
      rootClassName="export-dialog-root"
    >
      <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 12, color: 'var(--export-text, rgba(255,255,255,0.95))' }}>
            {t('components.export.dialog.formatTitle')}
          </h4>
          <ExportFormatSelector
            value={config.format}
            onChange={handleFormatChange}
          />
        </div>

        <Divider style={{ margin: '24px 0' }} />

        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 12, color: 'var(--export-text, rgba(255,255,255,0.95))' }}>
            {t('components.export.dialog.dataRangeTitle')}
          </h4>
          <Radio.Group
            value={config.filters.dataRange}
            onChange={(e) => handleDataRangeChange(e.target.value)}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <Radio value="current_page">
              {t('components.export.dialog.rangeCurrentPage', { count: 20 })}
            </Radio>
            <Radio value="filtered">
              {t('components.export.dialog.rangeFiltered', { total: getEstimatedCount().toLocaleString() })}
            </Radio>
            <Radio value="all">
              {t('components.export.dialog.rangeAll')}
            </Radio>
          </Radio.Group>

          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 13, color: 'var(--export-text-secondary, rgba(255,255,255,0.65))' }}>
              {t('components.export.dialog.timeRangeLabel')}
            </label>
            <RangePicker
              style={{ width: '100%' }}
              placeholder={[t('components.export.dialog.timeRangeStart'), t('components.export.dialog.timeRangeEnd')]}
              onChange={handleDateRangeChange}
              disabled={exporting}
            />
          </div>
        </div>

        <Divider style={{ margin: '24px 0' }} />

        <div style={{ marginBottom: 24 }}>
          <h4 style={{ marginBottom: 12, color: 'var(--export-text, rgba(255,255,255,0.95))' }}>
            {t('components.export.dialog.optionsTitle')}
          </h4>
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            {showTraceOption && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: 'var(--export-text-secondary)' }}>
                  {t('components.export.dialog.includeTrace')}
                </span>
                <Switch
                  checked={config.options.include_trace}
                  onChange={(checked) => handleOptionChange('include_trace', checked)}
                  disabled={exporting}
                />
              </div>
            )}

            {showTraceOption && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: 'var(--export-text-secondary)' }}>
                  {t('components.export.dialog.includeArtifacts')}
                </span>
                <Switch
                  checked={config.options.include_artifacts}
                  onChange={(checked) => handleOptionChange('include_artifacts', checked)}
                  disabled={exporting}
                />
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 14, color: 'var(--export-text-secondary)' }}>
                {t('components.export.dialog.includeMetadata')}
              </span>
              <Switch
                checked={config.options.include_metadata}
                onChange={(checked) => handleOptionChange('include_metadata', checked)}
                disabled={exporting}
              />
            </div>

            {showCompressOption && (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, color: 'var(--export-text-secondary)' }}>
                  {t('components.export.dialog.compress')}
                </span>
                <Switch
                  checked={config.options.compress}
                  onChange={(checked) => handleOptionChange('compress', checked)}
                  disabled={exporting}
                />
              </div>
            )}
          </Space>
        </div>

        <Alert
          message={t('components.export.dialog.estimateTitle')}
          description={
            <div style={{ fontSize: 13 }}>
              <p style={{ margin: '0 0 4px 0' }}>
                <Trans
                  i18nKey="common:components.export.dialog.estimateRecords"
                  values={{ total: getEstimatedCount().toLocaleString() }}
                  components={{ strong: <strong /> }}
                />
              </p>
              <p style={{ margin: 0 }}>
                <Trans
                  i18nKey="common:components.export.dialog.estimateSize"
                  values={{ size: formatFileSize(estimatedSize) }}
                  components={{ strong: <strong /> }}
                />
              </p>
            </div>
          }
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
        />
      </div>
    </Modal>
  );
});
