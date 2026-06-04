/**
 * 系统操作页 (admin)
 *
 * 两个区块：
 * - 指标聚合：手动触发指标聚合任务（默认 cron 触发，admin 偶尔需手动补跑历史窗口）
 * - 语言配置重载：热更新某个语言的执行配置（无需重启服务）
 */
import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  Select,
  Space,
  Typography,
  message,
} from 'antd';
import { ApiOutlined, ThunderboltOutlined } from '@ant-design/icons';
import dayjs, { type Dayjs } from 'dayjs';
import { useTranslation } from 'react-i18next';
import { systemOpsService, type AggregationPeriod } from './systemOpsService';

const { Title, Paragraph } = Typography;
const { RangePicker } = DatePicker;

interface AggregationFormValues {
  period: AggregationPeriod;
  range?: [Dayjs, Dayjs];
}

interface ReloadFormValues {
  name: string;
}

const COMMON_LANGUAGES = ['python', 'go', 'javascript', 'typescript', 'java', 'rust', 'cpp'];

export default function SystemOpsPage() {
  const { t } = useTranslation('admin');
  const [aggForm] = Form.useForm<AggregationFormValues>();
  const [reloadForm] = Form.useForm<ReloadFormValues>();
  const [aggLoading, setAggLoading] = useState(false);
  const [reloadLoading, setReloadLoading] = useState(false);

  const periodOptions = useMemo<{ value: AggregationPeriod; label: string }[]>(
    () => [
      { value: 'daily', label: t('systemOps.aggregation.periodOptions.daily') },
      { value: 'weekly', label: t('systemOps.aggregation.periodOptions.weekly') },
      { value: 'monthly', label: t('systemOps.aggregation.periodOptions.monthly') },
    ],
    [t]
  );

  const handleTriggerAggregation = async (values: AggregationFormValues) => {
    setAggLoading(true);
    try {
      const params: Parameters<typeof systemOpsService.triggerMetricsAggregation>[0] = {
        period: values.period,
      };
      if (values.range) {
        params.start_date = values.range[0].toISOString();
        params.end_date = values.range[1].toISOString();
      }
      await systemOpsService.triggerMetricsAggregation(params);
      message.success(t('systemOps.aggregation.messages.triggered'));
    } catch (err) {
      message.error(
        t('systemOps.aggregation.messages.triggerFailed', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setAggLoading(false);
    }
  };

  const handleReload = async (values: ReloadFormValues) => {
    const name = values.name.trim();
    if (!name) {
      message.warning(t('systemOps.reload.messages.languageEmpty'));
      return;
    }
    setReloadLoading(true);
    try {
      await systemOpsService.reloadLanguageConfig(name);
      message.success(t('systemOps.reload.messages.reloaded', { name }));
    } catch (err) {
      message.error(
        t('systemOps.reload.messages.reloadFailed', {
          error: err instanceof Error ? err.message : String(err),
        })
      );
    } finally {
      setReloadLoading(false);
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 960, margin: '0 auto' }}>
      <Title level={3} style={{ marginBottom: 8 }}>
        {t('systemOps.title')}
      </Title>
      <Paragraph type="secondary" style={{ marginBottom: 16 }}>
        {t('systemOps.description')}
      </Paragraph>

      <Card
        title={
          <Space>
            <ThunderboltOutlined />
            <span>{t('systemOps.aggregation.cardTitle')}</span>
          </Space>
        }
        style={{ marginBottom: 16 }}
        bordered={false}
      >
        <Alert
          type="info"
          showIcon
          message={t('systemOps.aggregation.alertTitle')}
          description={t('systemOps.aggregation.alertDescription')}
          style={{ marginBottom: 16 }}
        />
        <Form<AggregationFormValues>
          form={aggForm}
          layout="vertical"
          initialValues={{ period: 'daily' }}
          onFinish={handleTriggerAggregation}
        >
          <Form.Item
            label={t('systemOps.aggregation.periodLabel')}
            name="period"
            rules={[{ required: true }]}
          >
            <Select options={periodOptions} />
          </Form.Item>
          <Form.Item
            label={t('systemOps.aggregation.rangeLabel')}
            name="range"
            extra={t('systemOps.aggregation.rangeExtra')}
          >
            <RangePicker
              showTime
              style={{ width: '100%' }}
              presets={[
                {
                  label: t('systemOps.aggregation.presets.today'),
                  value: [dayjs().startOf('day'), dayjs()],
                },
                {
                  label: t('systemOps.aggregation.presets.yesterday'),
                  value: [
                    dayjs().subtract(1, 'day').startOf('day'),
                    dayjs().subtract(1, 'day').endOf('day'),
                  ],
                },
                {
                  label: t('systemOps.aggregation.presets.last7d'),
                  value: [dayjs().subtract(7, 'day').startOf('day'), dayjs()],
                },
                {
                  label: t('systemOps.aggregation.presets.last30d'),
                  value: [dayjs().subtract(30, 'day').startOf('day'), dayjs()],
                },
              ]}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={aggLoading}
              icon={<ThunderboltOutlined />}
            >
              {t('systemOps.aggregation.submit')}
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card
        title={
          <Space>
            <ApiOutlined />
            <span>{t('systemOps.reload.cardTitle')}</span>
          </Space>
        }
        bordered={false}
      >
        <Alert
          type="warning"
          showIcon
          message={t('systemOps.reload.alertTitle')}
          description={t('systemOps.reload.alertDescription')}
          style={{ marginBottom: 16 }}
        />
        <Form<ReloadFormValues> form={reloadForm} layout="vertical" onFinish={handleReload}>
          <Form.Item
            label={t('systemOps.reload.languageLabel')}
            name="name"
            rules={[{ required: true, message: t('systemOps.reload.languageRequired') }]}
            extra={
              <Space wrap size={4} style={{ marginTop: 4 }}>
                <span style={{ color: '#888', fontSize: 12 }}>
                  {t('systemOps.reload.commonHint')}
                </span>
                {COMMON_LANGUAGES.map((l) => (
                  <Button
                    key={l}
                    size="small"
                    type="link"
                    onClick={() => reloadForm.setFieldValue('name', l)}
                  >
                    {l}
                  </Button>
                ))}
              </Space>
            }
          >
            <Input placeholder={t('systemOps.reload.languagePlaceholder')} />
          </Form.Item>
          <Form.Item>
            <Button danger htmlType="submit" loading={reloadLoading} icon={<ApiOutlined />}>
              {t('systemOps.reload.submit')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
}
