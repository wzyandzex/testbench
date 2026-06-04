/**
 * UrlImporter component
 * URL import component
 */

import { memo, useState, useCallback, useEffect } from 'react';
import { Input, Button, Alert } from 'antd';
import { LinkOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { validateUrl } from '../service';

interface UrlImporterProps {
  value?: string;
  onChange: (url: string) => void;
  disabled?: boolean;
  loading?: boolean;
  placeholder?: string;
}

export const UrlImporter = memo(function UrlImporter({
  value = '',
  onChange,
  disabled = false,
  loading = false,
  placeholder,
}: UrlImporterProps) {
  const { t } = useTranslation('import');
  const resolvedPlaceholder = placeholder ?? i18next.t('import:urlImporter.placeholder');
  const [inputValue, setInputValue] = useState(value);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [touched, setTouched] = useState(false);

  // 同步外部 value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const validate = useCallback((url: string) => {
    if (!url) return null;
    return validateUrl(url);
  }, []);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setInputValue(val);

      if (touched && val) {
        setIsValid(validate(val));
      }

      onChange(val);
    },
    [onChange, touched, validate]
  );

  const handleBlur = useCallback(() => {
    setTouched(true);
    if (inputValue) {
      setIsValid(validate(inputValue));
    }
  }, [inputValue, validate]);

  const handleTestUrl = useCallback(() => {
    setTouched(true);
    const valid = validate(inputValue);
    setIsValid(valid);
    if (valid) {
      onChange(inputValue);
    }
  }, [inputValue, validate, onChange]);

  const isValidUrl = isValid === true;
  const isInvalidUrl = isValid === false;

  return (
    <div style={{ width: '100%' }}>
      <Input
        size="large"
        placeholder={resolvedPlaceholder}
        prefix={<LinkOutlined style={{ color: 'rgba(0,0,0,0.25)' }} />}
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        disabled={disabled || loading}
        status={touched && isInvalidUrl ? 'error' : undefined}
        suffix={
          isValidUrl ? (
            <CheckCircleOutlined style={{ color: '#52c41a' }} />
          ) : touched && isInvalidUrl ? (
            <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
          ) : null
        }
        onPressEnter={handleTestUrl}
      />

      {touched && isInvalidUrl && (
        <Alert
          message={t('urlImporter.invalidUrl')}
          type="error"
          showIcon
          style={{ marginTop: 8 }}
        />
      )}

      {isValidUrl && (
        <div style={{ marginTop: 8 }}>
          <Button
            type="primary"
            size="small"
            loading={loading}
            onClick={handleTestUrl}
            disabled={disabled}
          >
            {t('urlImporter.validateAndImport')}
          </Button>
        </div>
      )}
    </div>
  );
});
