import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import i18next from 'i18next';
import { Alert, Button, Progress, Space, Tag, Typography, Upload, message } from 'antd';
import type { UploadProps } from 'antd';
import { DeleteOutlined, ReloadOutlined, UploadOutlined } from '@ant-design/icons';
import { formatDateTime, humanizeKey, ZIP_SOURCE_STATE_SEPARATION_TEXT_KEY } from './helpers';
import type { ProjectEvalSourceInputDraft } from './profileDraft';
import { projectEvalService } from '@/services/project-eval';
import type { ProjectEvalSourceUpload } from '@/types/api/project-eval';
import { formatBytes } from '@/utils/format';

const { Text } = Typography;

const STATUS_TONE: Record<ProjectEvalSourceUpload['status'], { color: string; labelKey: string }> = {
  pending_upload: { color: 'processing', labelKey: 'pending_upload' },
  ready: { color: 'success', labelKey: 'ready' },
  consumed: { color: 'blue', labelKey: 'consumed' },
  expired: { color: 'warning', labelKey: 'expired' },
  failed: { color: 'error', labelKey: 'failed' },
};

type ProjectEvalZipUploadPanelProps = {
  sourceInput: Pick<ProjectEvalSourceInputDraft, 'sourceUploadId' | 'sourceUpload'>;
  onChange: (patch: Partial<ProjectEvalSourceInputDraft>) => void;
  onHydrate: (patch: Pick<ProjectEvalSourceInputDraft, 'sourceUploadId' | 'sourceUpload'>) => void;
};

function getUploadAlertType(upload?: ProjectEvalSourceUpload | null): 'info' | 'success' | 'warning' | 'error' {
  switch (upload?.status) {
    case 'ready':
      return 'success';
    case 'expired':
      return 'warning';
    case 'failed':
      return 'error';
    default:
      return 'info';
  }
}

function summarizeDigest(value?: string): string {
  if (!value) {
    return '-';
  }

  return value.length <= 20 ? value : `${value.slice(0, 12)}...${value.slice(-8)}`;
}

export default function ProjectEvalZipUploadPanel({
  sourceInput,
  onChange,
  onHydrate,
}: ProjectEvalZipUploadPanelProps) {
  const { t } = useTranslation('projectEval');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [refreshingUpload, setRefreshingUpload] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

  const currentUpload = sourceInput.sourceUpload;
  const currentUploadId = sourceInput.sourceUploadId.trim() || currentUpload?.id || '';

  const refreshUploadStatus = useCallback(async (options?: { silent?: boolean }) => {
    if (!currentUploadId) {
      setRefreshError(null);
      return;
    }

    setRefreshingUpload(true);

    try {
      const response = await projectEvalService.getSourceUpload(currentUploadId, { silentError: true });
      const upload = response as unknown as ProjectEvalSourceUpload;
      onHydrate({
        sourceUploadId: upload.id,
        sourceUpload: upload,
      });
      setRefreshError(null);
    } catch (error: unknown) {
      const response = (error as { response?: { status?: number; data?: { message?: string } } })?.response;
      const nextError =
        response?.status === 404
          ? i18next.t('projectEval:zipUpload.errors.fileMissing')
          : response?.data?.message || i18next.t('projectEval:zipUpload.errors.refreshFailedDefault');

      setRefreshError(nextError);
      onHydrate({
        sourceUploadId: currentUploadId,
        sourceUpload: null,
      });

      if (!options?.silent) {
        message.warning(nextError);
      }
    } finally {
      setRefreshingUpload(false);
    }
  }, [currentUploadId, onHydrate]);

  useEffect(() => {
    if (!currentUploadId) {
      setRefreshError(null);
      return;
    }

    void refreshUploadStatus({ silent: true });
  }, [currentUploadId, refreshUploadStatus]);

  const uploadProps: UploadProps = {
    accept: '.zip,application/zip',
    maxCount: 1,
    showUploadList: false,
    disabled: uploading,
    beforeUpload: (file) => {
      if (!file.name.toLowerCase().endsWith('.zip')) {
        message.warning(t('zipUpload.errors.notZip'));
        return Upload.LIST_IGNORE;
      }

      return true;
    },
    customRequest: async (options) => {
      const file = options.file as File;
      if (!(file instanceof File)) {
        const invalidFileError = new Error(t('zipUpload.errors.browserOnly'));
        options.onError?.(invalidFileError);
        message.error(invalidFileError.message);
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      try {
        const response = await projectEvalService.createSourceUpload(file, (progress) => {
          setUploadProgress(progress);
          options.onProgress?.({ percent: progress });
        });

        const upload = response as unknown as ProjectEvalSourceUpload;
        onChange({
          sourceUploadId: upload.id,
          sourceUpload: upload,
        });
        setRefreshError(null);

        options.onSuccess?.(upload);
        message.success(t('zipUpload.success.uploaded'));
      } catch (error: unknown) {
        const uploadError = error instanceof Error ? error : new Error(t('zipUpload.errors.uploadFailedDefault'));
        options.onError?.(uploadError);
      } finally {
        setUploading(false);
        setUploadProgress(null);
      }
    },
  };

  return (
    <Space direction="vertical" size={12} style={{ width: '100%' }}>
      <Alert
        type="info"
        showIcon
        message={t('zipUpload.alert.title')}
        description={t('zipUpload.alert.description', { separationText: i18next.t(ZIP_SOURCE_STATE_SEPARATION_TEXT_KEY) })}
      />

      <Space wrap>
        <Upload {...uploadProps}>
          <Button type="primary" icon={<UploadOutlined />} loading={uploading}>
            {t('zipUpload.buttons.select')}
          </Button>
        </Upload>
        {currentUploadId && (
          <Button
            icon={<ReloadOutlined />}
            onClick={() => void refreshUploadStatus()}
            loading={refreshingUpload}
            disabled={uploading}
          >
            {t('zipUpload.buttons.refresh')}
          </Button>
        )}
        {currentUploadId && (
          <Button
            icon={<DeleteOutlined />}
            onClick={() => onChange({ sourceUploadId: '', sourceUpload: null })}
            disabled={uploading || refreshingUpload}
          >
            {t('zipUpload.buttons.clear')}
          </Button>
        )}
      </Space>

      {uploadProgress !== null && (
        <Progress percent={uploadProgress} size="small" status={uploading ? 'active' : 'normal'} />
      )}

      {currentUploadId && (
        <Alert
          type={getUploadAlertType(currentUpload)}
          showIcon
          message={currentUpload ? currentUpload.original_filename : t('zipUpload.panel.fallbackTitle')}
          description={(
            <Space direction="vertical" size={6}>
              <Space wrap>
                <Tag color={currentUpload ? STATUS_TONE[currentUpload.status].color : 'default'}>
                  {currentUpload ? t(`zipUpload.statusLabels.${STATUS_TONE[currentUpload.status].labelKey}`) : t('zipUpload.panel.recorded')}
                </Tag>
                <Text type="secondary">Upload ID: {currentUploadId}</Text>
              </Space>
              {currentUpload && (
                <>
                  <Text type="secondary">{t('zipUpload.panel.size', { value: formatBytes(currentUpload.size_bytes) })}</Text>
                  <Text type="secondary">{t('zipUpload.panel.digest', { value: summarizeDigest(currentUpload.archive_sha256) })}</Text>
                  <Text type="secondary">{t('zipUpload.panel.expiresAt', { value: formatDateTime(currentUpload.expires_at) })}</Text>
                  <Text type="secondary">{t('zipUpload.panel.sourceType', { value: humanizeKey(currentUpload.source_type) })}</Text>
                  {currentUpload.error_message && (
                    <Text type="danger">{t('zipUpload.panel.error', { message: currentUpload.error_message })}</Text>
                  )}
                </>
              )}
              {!currentUpload && (
                <Text type="secondary">
                  {refreshingUpload
                    ? t('zipUpload.panel.refreshing')
                    : t('zipUpload.panel.summaryMissing')}
                </Text>
              )}
              {refreshError && (
                <Text type="danger">{refreshError}</Text>
              )}
            </Space>
          )}
        />
      )}
    </Space>
  );
}
