import { memo, useCallback, useMemo, useRef, useState } from 'react';
import {
  CloudUploadOutlined,
  DeleteOutlined,
  FileOutlined,
} from '@ant-design/icons';
import { message } from 'antd';
import { useTranslation } from 'react-i18next';
import { formatFileSize, validateFileSize } from '../service';

interface FileUploaderProps {
  value?: File | null;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  loading?: boolean;
  titleText?: string;
  hintText?: string;
  formatsText?: string;
}

const DEFAULT_ACCEPT = '.json,.yaml,.yml,.csv';
const DEFAULT_MAX_SIZE = 100 * 1024 * 1024;

function matchesAcceptedFile(file: File, accept: string): boolean {
  const rules = accept
    .split(',')
    .map((rule) => rule.trim().toLowerCase())
    .filter(Boolean);

  if (rules.length === 0) {
    return true;
  }

  const extension = file.name.includes('.')
    ? `.${file.name.split('.').pop()?.toLowerCase()}`
    : '';
  const mimeType = file.type.toLowerCase();

  return rules.some((rule) => {
    if (rule.startsWith('.')) {
      return extension === rule;
    }

    if (rule.endsWith('/*')) {
      return mimeType.startsWith(rule.slice(0, -1));
    }

    return mimeType === rule;
  });
}

export const FileUploader = memo(function FileUploader({
  value,
  onChange,
  accept = DEFAULT_ACCEPT,
  maxSize = DEFAULT_MAX_SIZE,
  disabled = false,
  loading = false,
  titleText,
  hintText,
  formatsText,
}: FileUploaderProps) {
  const { t } = useTranslation('import');
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const normalizedFormatsText = useMemo(
    () => formatsText || accept.replace(/,/g, ' '),
    [accept, formatsText]
  );

  const normalizedHintText = useMemo(
    () => hintText || t('uploader.defaultHint', { formats: normalizedFormatsText, maxSize: formatFileSize(maxSize) }),
    [hintText, maxSize, normalizedFormatsText, t]
  );

  const normalizedTitleText = useMemo(
    () => titleText || t('uploader.defaultTitle'),
    [titleText, t]
  );

  const handleFileSelect = useCallback(
    (file: File) => {
      if (!matchesAcceptedFile(file, accept)) {
        message.error(t('uploader.unsupportedType', { formats: normalizedFormatsText }));
        return;
      }

      if (!validateFileSize(file, maxSize)) {
        message.error(t('uploader.tooLarge', { maxSize: formatFileSize(maxSize) }));
        return;
      }

      onChange(file);
    },
    [accept, maxSize, normalizedFormatsText, onChange, t]
  );

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);

      if (disabled || loading) {
        return;
      }

      const files = Array.from(event.dataTransfer.files);
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [disabled, handleFileSelect, loading]
  );

  const handleDragOver = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();

      if (!disabled && !loading) {
        setIsDragging(true);
      }
    },
    [disabled, loading]
  );

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleClick = useCallback(() => {
    if (!disabled && !loading && inputRef.current) {
      inputRef.current.click();
    }
  }, [disabled, loading]);

  const handleInputChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = event.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }

      if (inputRef.current) {
        inputRef.current.value = '';
      }
    },
    [handleFileSelect]
  );

  const handleRemove = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation();
      onChange(null);
    },
    [onChange]
  );

  return (
    <div className="import-file-uploader">
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        style={{ display: 'none' }}
        disabled={disabled || loading}
      />

      {!value ? (
        <div
          className={`upload-area ${isDragging ? 'dragging' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={handleClick}
          style={{
            cursor: disabled || loading ? 'not-allowed' : 'pointer',
            opacity: disabled ? 0.6 : 1,
          }}
        >
          <div className="upload-icon">
            {loading ? <CloudUploadOutlined spin /> : <CloudUploadOutlined />}
          </div>
          <div className="upload-title">
            {loading ? t('uploader.uploading') : normalizedTitleText}
          </div>
          <div className="upload-hint">{normalizedHintText}</div>
          <div className="upload-formats">{normalizedFormatsText}</div>
        </div>
      ) : (
        <div className="file-preview">
          <div className="file-icon">
            <FileOutlined />
          </div>
          <div className="file-info">
            <div className="file-name">{value.name}</div>
            <div className="file-size">{formatFileSize(value.size)}</div>
          </div>
          {!disabled && !loading && (
            <div className="file-remove" onClick={handleRemove}>
              <DeleteOutlined />
            </div>
          )}
        </div>
      )}
    </div>
  );
});
