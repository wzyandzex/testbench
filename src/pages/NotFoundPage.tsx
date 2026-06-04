import { Result, Button } from 'antd';
import { useTranslation } from 'react-i18next';

export function NotFoundPage() {
  const { t } = useTranslation('errors');
  return (
    <Result
      status="404"
      title="404"
      subTitle={t('notFound')}
      extra={
        <Button type="primary" href="/">
          {t('backHome')}
        </Button>
      }
    />
  );
}

export default NotFoundPage;
