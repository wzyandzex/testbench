import { Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { InboxOutlined, FilterOutlined } from '@ant-design/icons';

export interface EmptyPageProps {
  type?: 'empty' | 'no-result';
  title?: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyPage({
  type = 'empty',
  title,
  description,
  actionText,
  onAction,
}: EmptyPageProps) {
  const { t } = useTranslation('common');
  const config = {
    empty: {
      icon: <InboxOutlined />,
      defaultTitle: t('components.emptyPage.emptyTitle'),
      defaultDescription: t('components.emptyPage.emptyDesc'),
    },
    'no-result': {
      icon: <FilterOutlined />,
      defaultTitle: t('components.emptyPage.noResultTitle'),
      defaultDescription: t('components.emptyPage.noResultDesc'),
    },
  };

  const currentConfig = config[type];

  return (
    <div
      style={{
        padding: 80,
        textAlign: 'center',
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #f0f0f0',
      }}
    >
      <div
        style={{
          fontSize: 48,
          color: '#d9d9d9',
          marginBottom: 16,
        }}
      >
        {currentConfig.icon}
      </div>
      <div style={{ fontSize: 16, color: '#999', marginBottom: 8 }}>
        {title || currentConfig.defaultTitle}
      </div>
      <div style={{ fontSize: 14, color: '#bbb', marginBottom: 24 }}>
        {description || currentConfig.defaultDescription}
      </div>
      {actionText && onAction && (
        <Button type="primary" onClick={onAction}>
          {actionText}
        </Button>
      )}
    </div>
  );
}
