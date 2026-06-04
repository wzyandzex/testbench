import { Empty, Button } from 'antd';
import { useTranslation } from 'react-i18next';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';

interface EmptyStateProps {
  type?: 'default' | 'create' | 'refresh';
  description?: string;
  onCreate?: () => void;
  onRefresh?: () => void;
  createText?: string;
}

export function EmptyState({
  type = 'default',
  description,
  onCreate,
  onRefresh,
  createText,
}: EmptyStateProps) {
  const { t } = useTranslation('common');
  const resolvedCreateText = createText ?? t('components.emptyState.create');
  const defaultDescription = t('components.emptyState.default');

  if (type === 'create' && onCreate) {
    return (
      <Empty
        description={description || defaultDescription}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      >
        <Button type="primary" icon={<PlusOutlined />} onClick={onCreate}>
          {resolvedCreateText}
        </Button>
      </Empty>
    );
  }

  if (type === 'refresh' && onRefresh) {
    return (
      <Empty
        description={description || defaultDescription}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      >
        <Button icon={<ReloadOutlined />} onClick={onRefresh}>
          {t('components.emptyState.refresh')}
        </Button>
      </Empty>
    );
  }

  return <Empty description={description} image={Empty.PRESENTED_IMAGE_SIMPLE} />;
}
