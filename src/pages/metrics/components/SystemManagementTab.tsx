import { Alert, Card, Typography } from 'antd';
import { useTranslation } from 'react-i18next';

const { Paragraph, Text } = Typography;

export default function SystemManagementTab() {
  const { t } = useTranslation('metrics');
  return (
    <Card bordered={false}>
      <Alert
        type="info"
        showIcon
        message={t('notices.adminNotImpl')}
        description={t('notices.adminDesc')}
      />
      <Paragraph style={{ marginTop: 16, marginBottom: 0 }}>
        <Text type="secondary">{t('notices.adminNote')}</Text>
      </Paragraph>
    </Card>
  );
}
