import { memo, useCallback } from 'react';
import {
  CloudUploadOutlined,
  CodeOutlined,
  FileTextOutlined,
  FileUnknownOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import i18next from 'i18next';
import type { DatasetType, SourceType } from '../service';

interface ImportSourceSelectorProps {
  value: SourceType | null;
  onChange: (type: SourceType) => void;
  datasetType?: DatasetType | null;
  disabled?: boolean;
}

interface SourceOption {
  type: SourceType;
  name: string;
  description: string;
  icon: React.ReactNode;
}

const SOURCE_OPTIONS: SourceOption[] = [
  {
    type: 'file',
    icon: <CloudUploadOutlined />,
    get name() { return i18next.t('import:sourceOptions.fileName'); },
    get description() { return i18next.t('import:sourceOptions.fileDesc'); },
  },
  {
    type: 'url',
    icon: <LinkOutlined />,
    get name() { return i18next.t('import:sourceOptions.urlName'); },
    get description() { return i18next.t('import:sourceOptions.urlDesc'); },
  },
  {
    type: 'huggingface',
    icon: <CodeOutlined />,
    get name() { return i18next.t('import:sourceOptions.hfName'); },
    get description() { return i18next.t('import:sourceOptions.hfDesc'); },
  },
  {
    type: 'json',
    icon: <FileTextOutlined />,
    get name() { return i18next.t('import:sourceOptions.jsonName'); },
    get description() { return i18next.t('import:sourceOptions.jsonDesc'); },
  },
  {
    type: 'yaml',
    icon: <FileUnknownOutlined />,
    get name() { return i18next.t('import:sourceOptions.yamlName'); },
    get description() { return i18next.t('import:sourceOptions.yamlDesc'); },
  },
];

export const ImportSourceSelector = memo(function ImportSourceSelector({
  value,
  onChange,
  datasetType,
  disabled = false,
}: ImportSourceSelectorProps) {
  const visibleOptions = SOURCE_OPTIONS.filter((option) => {
    if (datasetType === 'benchmark' && option.type === 'huggingface') {
      return false;
    }

    if (datasetType !== 'benchmark' && option.type === 'yaml') {
      return false;
    }

    return true;
  });

  const handleSelect = useCallback(
    (type: SourceType) => {
      if (!disabled) {
        onChange(type);
      }
    },
    [disabled, onChange]
  );

  return (
    <div className="import-source-selector">
      {visibleOptions.map((option) => {
        const isSelected = value === option.type;

        return (
          <div
            key={option.type}
            className={`source-item ${isSelected ? 'selected' : ''}`}
            onClick={() => handleSelect(option.type)}
            style={{
              opacity: disabled ? 0.6 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            <div className="source-icon">{option.icon}</div>
            <div className="source-name">{option.name}</div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--import-text-secondary)',
                marginTop: 4,
              }}
            >
              {option.description}
            </div>
          </div>
        );
      })}
    </div>
  );
});
