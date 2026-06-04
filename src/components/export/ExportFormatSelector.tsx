/**
 * ExportFormatSelector — card-based export format picker
 */

import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CodeOutlined,
  FileTextOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
} from '@ant-design/icons';
import type { ExportFormat } from './types';
import { EXPORT_FORMATS } from './service';

interface ExportFormatSelectorProps {
  value: ExportFormat;
  onChange: (format: ExportFormat) => void;
  disabled?: boolean;
  disabledFormats?: ExportFormat[];
}

const ICON_MAP: Record<ExportFormat, React.ReactNode> = {
  json: <CodeOutlined />,
  csv: <FileTextOutlined />,
  excel: <FileExcelOutlined />,
  pdf: <FilePdfOutlined />,
};

export const ExportFormatSelector = memo(function ExportFormatSelector({
  value,
  onChange,
  disabled = false,
  disabledFormats = [],
}: ExportFormatSelectorProps) {
  const { t } = useTranslation('common');
  const handleSelect = useCallback(
    (format: ExportFormat) => {
      if (!disabled && !disabledFormats.includes(format)) {
        onChange(format);
      }
    },
    [onChange, disabled, disabledFormats]
  );

  return (
    <div className="export-format-selector">
      {(Object.keys(EXPORT_FORMATS) as ExportFormat[]).map((format) => {
        const info = EXPORT_FORMATS[format];
        const isSelected = value === format;
        const isDisabled = disabled || disabledFormats.includes(format);

        return (
          <div
            key={format}
            className={`export-format-card ${isSelected ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
            onClick={() => handleSelect(format)}
            style={{
              opacity: isDisabled ? 0.5 : 1,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
            }}
          >
            <div
              className="format-icon"
              style={{ color: info.color }}
            >
              {ICON_MAP[format]}
            </div>
            <div className="format-name">{info.name}</div>
            <div className="format-description">{info.description}</div>
            <div className="format-meta">
              <span className="format-extension">.{format}</span>
              {info.max_records && (
                <span className="format-limit">{t('components.export.selector.maxRecords', { total: info.max_records.toLocaleString() })}</span>
              )}
            </div>
            {isSelected && (
              <div className="format-selected-indicator" />
            )}
          </div>
        );
      })}
    </div>
  );
});
