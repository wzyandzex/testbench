/**
 * DatasetSelector component
 * Dataset selector - grid card layout
 */

import { memo, useCallback } from 'react';
import {
  CodeOutlined,
  PythonOutlined,
  GithubOutlined,
  EditOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { DatasetType } from '../service';
import { DATASET_INFO } from '../service';

interface DatasetSelectorProps {
  value: DatasetType | null;
  onChange: (type: DatasetType) => void;
  disabled?: boolean;
}

// 图标映射
const ICON_MAP: Record<DatasetType, React.ReactNode> = {
  humaneval: <CodeOutlined />,
  mbpp: <PythonOutlined />,
  swebench: <GithubOutlined />,
  codecomplete: <EditOutlined />,
  benchmark: <FileTextOutlined />,
};

export const DatasetSelector = memo(function DatasetSelector({
  value,
  onChange,
  disabled = false,
}: DatasetSelectorProps) {
  const { t } = useTranslation('import');
  const handleSelect = useCallback(
    (type: DatasetType) => {
      if (!disabled) {
        onChange(type);
      }
    },
    [onChange, disabled]
  );

  return (
    <div className="import-dataset-grid">
      {(Object.keys(DATASET_INFO) as DatasetType[]).map((type) => {
        const info = DATASET_INFO[type];
        const isSelected = value === type;

        return (
          <div
            key={type}
            className={`import-dataset-card ${isSelected ? 'selected' : ''}`}
            onClick={() => handleSelect(type)}
            style={{
              opacity: disabled ? 0.6 : 1,
              cursor: disabled ? 'not-allowed' : 'pointer',
            }}
          >
            <div className="dataset-icon">{ICON_MAP[type]}</div>
            <div className="dataset-name">{info.name}</div>
            <div className="dataset-description">{info.description}</div>
            <div className="dataset-meta">
              {info.sampleCount > 0 && (
                <div className="dataset-meta-item">
                  <span>📊</span>
                  <span>{t('datasetSelector.samples', { count: info.sampleCount })}</span>
                </div>
              )}
              <div className="dataset-meta-item">
                <span>🔷</span>
                <span>{info.language}</span>
              </div>
              <div className="dataset-meta-item">
                <span>🏷️</span>
                <span>{info.category}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
});
