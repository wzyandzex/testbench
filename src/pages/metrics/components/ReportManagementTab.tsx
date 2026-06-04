import { Alert, Card, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

const { Paragraph, Text } = Typography;

export default function ReportManagementTab() {
  const { t } = useTranslation('metrics');
  return (
    <Card bordered={false}>
      <Alert
        type="warning"
        showIcon
        message={t('notices.reportNotImpl')}
        description={t('notices.reportDesc')}
      />
      <Paragraph style={{ marginTop: 16, marginBottom: 0 }}>
        <Text type="secondary">{t('notices.reportNote')}</Text>
      </Paragraph>
    </Card>
  );
}
