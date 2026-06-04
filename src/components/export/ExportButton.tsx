/**
 * ExportButton component — quick-export dropdown + dialog trigger
 */

import { useCallback, memo, useMemo } from 'react';
import { Dropdown, message } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  DownloadOutlined,
  FileTextOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  CodeOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import type { ExportFormat, ExportType } from './types';
import { useExportStore, useQuickExportLoading } from './store';
import { ExportDialog } from './ExportDialog';
import { exportService, getExportFileName } from './service';

interface ExportButtonProps {
  type: ExportType;
  benchmarkId?: string;
  agentId?: string;
  executionIds?: string[];
  batchId?: string;
  filters?: Record<string, any>;
  totalCount?: number;
  disabled?: boolean;
  loading?: boolean;
  onExport?: (request: any) => Promise<any>;
}

export const ExportButton = memo(function ExportButton({
  type,
  benchmarkId,
  agentId,
  executionIds,
  batchId,
  filters,
  totalCount = 0,
  disabled = false,
  loading: externalLoading = false,
  onExport,
}: ExportButtonProps) {
  const { t } = useTranslation('common');
  const quickExportLoading = useQuickExportLoading();

  const openDialog = useCallback(() => {
    useExportStore.getState().openDialog(type, {
      type,
      benchmarkId,
      agentId,
      executionIds,
      batchId,
      filters,
      totalCount,
    });
  }, [type, benchmarkId, agentId, executionIds, batchId, filters, totalCount]);

  const handleQuickExport = useCallback(
    async (format: ExportFormat) => {
      useExportStore.getState().setQuickExportLoading(true);

      try {
        const request = {
          type,
          format,
          filters: {
            dataRange: 'filtered' as const,
            benchmark_id: benchmarkId,
            agent_id: agentId,
            execution_ids: executionIds,
            ...filters,
          },
          options: {},
        };

        let result: any;

        if (onExport) {
          result = await onExport(request);
        } else {
          if (type === 'batch' && batchId) {
            result = await exportService.batch(batchId, request);
          } else {
            result = await exportService.executions(request);
          }
        }

        if (result?.download_url) {
          exportService.downloadFile(result.download_url, result.file_name);
        } else if (result instanceof Blob) {
          const fileName = getExportFileName(type, format);
          exportService.downloadBlob(result, fileName);
        }

        message.success(t('components.export.successMessage', { format: format.toUpperCase() }));
      } catch (err) {
        // handled by axios interceptor
      } finally {
        useExportStore.getState().setQuickExportLoading(false);
      }
    },
    [type, batchId, benchmarkId, agentId, executionIds, filters, onExport, t]
  );

  const handleMenuClick = useCallback(
    async ({ key }: { key: string }) => {
      if (key === 'settings') {
        openDialog();
        return;
      }
      handleQuickExport(key as ExportFormat);
    },
    [openDialog, handleQuickExport]
  );

  const isLoading = externalLoading || quickExportLoading;
  const menuItems = useMemo(() => [
    {
      key: 'excel',
      label: t('components.export.quick.excel'),
      icon: <FileExcelOutlined />,
    },
    {
      key: 'csv',
      label: t('components.export.quick.csv'),
      icon: <FileTextOutlined />,
    },
    {
      key: 'json',
      label: t('components.export.quick.json'),
      icon: <CodeOutlined />,
    },
    {
      key: 'pdf',
      label: t('components.export.quick.pdf'),
      icon: <FilePdfOutlined />,
    },
    { type: 'divider' as const },
    {
      key: 'settings',
      label: t('components.export.quick.settings'),
      icon: <SettingOutlined />,
    },
  ], [t]);

  return (
    <>
      <Dropdown.Button
        icon={<DownloadOutlined />}
        menu={{ items: menuItems, onClick: handleMenuClick }}
        onClick={openDialog}
        disabled={disabled}
        loading={isLoading}
        trigger={['click']}
        type="default"
      >
        {t('components.export.button')}
      </Dropdown.Button>

      <ExportDialog onExport={onExport} loading={externalLoading} />
    </>
  );
});

export default ExportButton;
