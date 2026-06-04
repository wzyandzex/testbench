import {
  Button,
  Space,
  Input,
  Select,
  Switch,
  Radio,
  Checkbox,
  Card,
  Badge,
  Tag,
  Progress,
  Divider,
  Typography,
  Alert,
  Statistic,
  Row,
  Col,
  DatePicker,
  Slider,
  Rate,
  Tooltip,
  Popover,
} from 'antd';
import { useTranslation } from 'react-i18next';
import {
  PlusOutlined,
  DeleteOutlined,
  EditOutlined,
  SearchOutlined,
  DownloadOutlined,
  UploadOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
} from '@ant-design/icons';

const { Text, Title } = Typography;
const { TextArea } = Input;

/**
 * Component showcase area
 * Demonstrates Ant Design components under the current theme
 */
export function ComponentShowcase() {
  const { t } = useTranslation('preview');
  return (
    <Card>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* 1. Buttons */}
        <div>
          <Title level={5} style={{ marginBottom: 12 }}>
            {t('showcase.buttons.title')}
          </Title>
          <Space wrap>
            <Button type="primary" icon={<PlusOutlined />}>
              {t('showcase.buttons.primary')}
            </Button>
            <Button>{t('showcase.buttons.default')}</Button>
            <Button type="dashed">{t('showcase.buttons.dashed')}</Button>
            <Button danger icon={<DeleteOutlined />}>
              {t('showcase.buttons.danger')}
            </Button>
            <Button icon={<EditOutlined />}>{t('showcase.buttons.icon')}</Button>
            <Button type="link">{t('showcase.buttons.link')}</Button>
            <Button loading>{t('showcase.buttons.loading')}</Button>
            <Button disabled>{t('showcase.buttons.disabled')}</Button>
          </Space>
        </div>

        <Divider />

        {/* 2. Inputs */}
        <div>
          <Title level={5} style={{ marginBottom: 12 }}>
            {t('showcase.inputs.title')}
          </Title>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Row gutter={16}>
              <Col span={12}>
                <Input placeholder={t('showcase.inputs.inputPlaceholder')} prefix={<SearchOutlined />} />
              </Col>
              <Col span={12}>
                <Input.Search placeholder={t('showcase.inputs.searchPlaceholder')} enterButton />
              </Col>
            </Row>
            <TextArea rows={3} placeholder={t('showcase.inputs.textareaPlaceholder')} />
            <Row gutter={16}>
              <Col span={12}>
                <Input.Password placeholder={t('showcase.inputs.passwordPlaceholder')} />
              </Col>
              <Col span={12}>
                <Input
                  placeholder={t('showcase.inputs.prefixSuffixPlaceholder')}
                  prefix="https://"
                  suffix=".com"
                />
              </Col>
            </Row>
          </Space>
        </div>

        <Divider />

        {/* 3. Selects */}
        <div>
          <Title level={5} style={{ marginBottom: 12 }}>
            {t('showcase.selects.title')}
          </Title>
          <Space wrap size="middle">
            <Select
              placeholder={t('showcase.selects.selectPlaceholder')}
              style={{ width: 200 }}
              options={[
                { value: 'option1', label: t('showcase.selects.option1') },
                { value: 'option2', label: t('showcase.selects.option2') },
                { value: 'option3', label: t('showcase.selects.option3') },
              ]}
            />
            <Select
              mode="multiple"
              placeholder={t('showcase.selects.multiplePlaceholder')}
              style={{ width: 200 }}
              options={[
                { value: 'option1', label: t('showcase.selects.option1') },
                { value: 'option2', label: t('showcase.selects.option2') },
                { value: 'option3', label: t('showcase.selects.option3') },
              ]}
            />
            <DatePicker placeholder={t('showcase.selects.datePlaceholder')} />
            <DatePicker.RangePicker placeholder={[t('showcase.selects.startDate'), t('showcase.selects.endDate')]} />
          </Space>
        </div>

        <Divider />

        {/* 4. Status indicators */}
        <div>
          <Title level={5} style={{ marginBottom: 12 }}>
            {t('showcase.status.title')}
          </Title>
          <Space wrap size="middle">
            <Badge status="default" text={t('showcase.status.pending')} />
            <Badge status="processing" text={t('showcase.status.running')} />
            <Badge status="success" text={t('showcase.status.success')} />
            <Badge status="error" text={t('showcase.status.failed')} />
            <Badge status="warning" text={t('showcase.status.warning')} />

            <Tag color="blue">{t('showcase.status.blueTag')}</Tag>
            <Tag color="green">{t('showcase.status.greenTag')}</Tag>
            <Tag color="gold">{t('showcase.status.goldTag')}</Tag>
            <Tag color="red">{t('showcase.status.redTag')}</Tag>
            <Tag color="purple">{t('showcase.status.purpleTag')}</Tag>

            <Tag icon={<CheckCircleOutlined />} color="success">
              {t('showcase.status.completed')}
            </Tag>
            <Tag icon={<SyncOutlined spin />} color="processing">
              {t('showcase.status.processing')}
            </Tag>
            <Tag icon={<CloseCircleOutlined />} color="error">
              {t('showcase.status.failedTag')}
            </Tag>
            <Tag icon={<ClockCircleOutlined />} color="default">
              {t('showcase.status.todo')}
            </Tag>
          </Space>
        </div>

        <Divider />

        {/* 5. Progress */}
        <div>
          <Title level={5} style={{ marginBottom: 12 }}>
            {t('showcase.progress.title')}
          </Title>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Progress percent={30} />
            <Progress percent={50} status="active" />
            <Progress percent={70} status="success" />
            <Progress percent={100} />
            <Progress percent={75} status="exception" />
            <Progress type="circle" percent={75} />
            <Progress type="dashboard" percent={80} />
          </Space>
        </div>

        <Divider />

        {/* 6. Switches & Checkboxes */}
        <div>
          <Title level={5} style={{ marginBottom: 12 }}>
            {t('showcase.switches.title')}
          </Title>
          <Space wrap size="large">
            <Space>
              <Switch defaultChecked />
              <Switch />
              <Switch disabled />
            </Space>
            <Space>
              <Checkbox defaultChecked>{t('showcase.switches.checkbox')}</Checkbox>
              <Checkbox>{t('showcase.switches.unchecked')}</Checkbox>
              <Checkbox disabled>{t('showcase.switches.disabled')}</Checkbox>
            </Space>
            <Space>
              <Radio.Group defaultValue="a">
                <Radio value="a">{t('showcase.switches.optionA')}</Radio>
                <Radio value="b">{t('showcase.switches.optionB')}</Radio>
                <Radio value="c">{t('showcase.switches.optionC')}</Radio>
              </Radio.Group>
            </Space>
            <Space>
              <Rate defaultValue={4} />
            </Space>
          </Space>
        </div>

        <Divider />

        {/* 7. Statistics */}
        <div>
          <Title level={5} style={{ marginBottom: 12 }}>
            {t('showcase.statistics.title')}
          </Title>
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title={t('showcase.statistics.totalVisits')} value={11280} />
            </Col>
            <Col span={6}>
              <Statistic title={t('showcase.statistics.taskComplete')} value={93} suffix="%" />
            </Col>
            <Col span={6}>
              <Statistic title={t('showcase.statistics.activeUsers')} value={562} prefix={<CheckCircleOutlined />} />
            </Col>
            <Col span={6}>
              <Statistic
                title={t('showcase.statistics.growthRate')}
                value={9.3}
                suffix="%"
                valueStyle={{ color: '#cf1322' }}
                prefix="↓"
              />
            </Col>
          </Row>
        </div>

        <Divider />

        {/* 8. Alerts */}
        <div>
          <Title level={5} style={{ marginBottom: 12 }}>
            {t('showcase.alerts.title')}
          </Title>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <Alert message={t('showcase.alerts.success')} type="success" showIcon />
            <Alert message={t('showcase.alerts.info')} type="info" showIcon />
            <Alert message={t('showcase.alerts.warning')} type="warning" showIcon closable />
            <Alert message={t('showcase.alerts.error')} type="error" showIcon closable />
            <Alert
              message={t('showcase.alerts.description')}
              description={t('showcase.alerts.descriptionDetail')}
              type="info"
              showIcon
            />
          </Space>
        </div>

        <Divider />

        {/* 9. Other controls */}
        <div>
          <Title level={5} style={{ marginBottom: 12 }}>
            {t('showcase.others.title')}
          </Title>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            <div style={{ width: '100%', maxWidth: 400 }}>
              <Text>{t('showcase.others.sliderLabel')}</Text>
              <Slider defaultValue={30} />
              <Slider range defaultValue={[20, 50]} />
            </div>

            <Space>
              <Tooltip title={t('showcase.others.tooltipText')}>
                <Button>{t('showcase.others.hoverHint')}</Button>
              </Tooltip>
              <Popover content={t('showcase.others.popoverContent')} title={t('showcase.others.popoverTitle')}>
                <Button>{t('showcase.others.clickHint')}</Button>
              </Popover>
            </Space>

            <Space>
              <Button icon={<DownloadOutlined />}>{t('showcase.others.download')}</Button>
              <Button icon={<UploadOutlined />}>{t('showcase.others.upload')}</Button>
              <Button icon={<SettingOutlined />}>{t('showcase.others.settings')}</Button>
            </Space>
          </Space>
        </div>
      </Space>
    </Card>
  );
}
