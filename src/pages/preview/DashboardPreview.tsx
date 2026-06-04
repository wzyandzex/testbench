import {
  Layout,
  Menu,
  Card,
  Row,
  Col,
  Table,
  Tag,
  Avatar,
  Dropdown,
  Space,
  Badge,
  Input,
  Button,
  Statistic,
  Progress,
  Typography,
  Breadcrumb,
} from 'antd';
import { useTranslation } from 'react-i18next';
import {
  HomeOutlined,
  AppstoreOutlined,
  SettingOutlined,
  BellOutlined,
  UserOutlined,
  SearchOutlined,
  DashboardOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;

/**
 * Dashboard preview component
 * Demonstrates a full Dashboard layout
 */
export function DashboardPreview() {
  const { t } = useTranslation('preview');

  // Sider menu (mock)
  const menuItems = [
    { key: '1', icon: <DashboardOutlined />, label: t('dashboard.menu.dashboard') },
    { key: '2', icon: <AppstoreOutlined />, label: t('dashboard.menu.tasks') },
    { key: '3', icon: <ClockCircleOutlined />, label: t('dashboard.menu.executions') },
    { key: '4', icon: <HomeOutlined />, label: t('dashboard.menu.agents') },
    { key: '5', icon: <SettingOutlined />, label: t('dashboard.menu.settings') },
  ];

  // Table columns (mock)
  const tableColumns = [
    {
      title: t('dashboard.table.name'),
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <Text strong>{text}</Text>,
    },
    {
      title: t('dashboard.table.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const statusConfig: Record<
          string,
          { color: string; text: string; icon: React.ReactNode }
        > = {
          running: { color: 'processing', text: t('dashboard.status.running'), icon: <SyncOutlined spin /> },
          completed: { color: 'success', text: t('dashboard.status.completed'), icon: <CheckCircleOutlined /> },
          failed: { color: 'error', text: t('dashboard.status.failed'), icon: <CloseCircleOutlined /> },
          pending: { color: 'default', text: t('dashboard.status.pending'), icon: <ClockCircleOutlined /> },
        };
        const config = statusConfig[status] || statusConfig.pending;
        return (
          <Tag color={config.color} icon={config.icon}>
            {config.text}
          </Tag>
        );
      },
    },
    {
      title: t('dashboard.table.agent'),
      dataIndex: 'agent',
      key: 'agent',
    },
    {
      title: t('dashboard.table.progress'),
      dataIndex: 'progress',
      key: 'progress',
      render: (progress: number) => (
        <Progress percent={progress} size="small" status={progress === 100 ? 'success' : 'active'} />
      ),
    },
    {
      title: t('dashboard.table.duration'),
      dataIndex: 'duration',
      key: 'duration',
    },
    {
      title: t('dashboard.table.action'),
      key: 'action',
      render: () => (
        <Space size="small">
          <Button type="link" size="small">
            {t('dashboard.table.view')}
          </Button>
          <Button type="link" size="small">
            {t('dashboard.table.log')}
          </Button>
        </Space>
      ),
    },
  ];

  const tableData = [
    {
      key: '1',
      name: t('dashboard.rows.row1Name'),
      status: 'running',
      agent: 'GPT-4 Agent',
      progress: 65,
      duration: t('dashboard.rows.row1Duration'),
    },
    {
      key: '2',
      name: t('dashboard.rows.row2Name'),
      status: 'completed',
      agent: 'Claude Agent',
      progress: 100,
      duration: t('dashboard.rows.row2Duration'),
    },
    {
      key: '3',
      name: t('dashboard.rows.row3Name'),
      status: 'failed',
      agent: 'Gemini Agent',
      progress: 45,
      duration: t('dashboard.rows.row3Duration'),
    },
    {
      key: '4',
      name: t('dashboard.rows.row4Name'),
      status: 'pending',
      agent: 'GPT-4 Agent',
      progress: 0,
      duration: '-',
    },
    {
      key: '5',
      name: t('dashboard.rows.row5Name'),
      status: 'completed',
      agent: 'Claude Agent',
      progress: 100,
      duration: t('dashboard.rows.row5Duration'),
    },
  ];

  // ECharts option
  const getChartOption = () => ({
    tooltip: {
      trigger: 'axis',
    },
    legend: {
      data: [t('dashboard.chart.successRate'), t('dashboard.chart.avgDuration')],
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: [
        t('dashboard.chart.mon'),
        t('dashboard.chart.tue'),
        t('dashboard.chart.wed'),
        t('dashboard.chart.thu'),
        t('dashboard.chart.fri'),
        t('dashboard.chart.sat'),
        t('dashboard.chart.sun'),
      ],
    },
    yAxis: [
      {
        type: 'value',
        name: t('dashboard.chart.successRateLabel'),
        position: 'left',
        max: 100,
      },
      {
        type: 'value',
        name: t('dashboard.chart.avgDurationLabel'),
        position: 'right',
      },
    ],
    series: [
      {
        name: t('dashboard.chart.successRate'),
        type: 'line',
        smooth: true,
        data: [85, 88, 92, 87, 94, 96, 93],
        itemStyle: {
          color: '#52c41a',
        },
        areaStyle: {
          color: 'rgba(82, 196, 26, 0.1)',
        },
      },
      {
        name: t('dashboard.chart.avgDuration'),
        type: 'line',
        smooth: true,
        yAxisIndex: 1,
        data: [45, 42, 38, 48, 35, 32, 36],
        itemStyle: {
          color: '#1677ff',
        },
      },
    ],
  });

  // User dropdown menu
  const userMenuItems = [
    { key: 'profile', label: t('dashboard.userMenu.profile') },
    { key: 'settings', label: t('dashboard.userMenu.settings') },
    { key: 'logout', label: t('dashboard.userMenu.logout') },
  ];

  return (
    <Layout style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid #d9d9d9' }}>
      {/* Sider */}
      <Sider
        width={240}
        style={{
          backgroundColor: '#001529',
          minHeight: 600,
        }}
      >
        <div
          style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          {t('dashboard.siderTitle')}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          defaultSelectedKeys={['1']}
          items={menuItems}
        />
      </Sider>

      <Layout>
        {/* Header */}
        <Header
          style={{
            backgroundColor: '#fff',
            padding: '0 24px',
            borderBottom: '1px solid #f0f0f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Space size="large">
            <Breadcrumb
              items={[
                { title: <HomeOutlined /> },
                { title: t('dashboard.header.breadcrumb') },
              ]}
            />
          </Space>

          <Space size="middle">
            <Input
              placeholder={t('dashboard.header.searchPlaceholder')}
              prefix={<SearchOutlined />}
              style={{ width: 200 }}
            />
            <Badge count={5} size="small">
              <Button icon={<BellOutlined />} />
            </Badge>
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar icon={<UserOutlined />} />
                <Text>{t('dashboard.header.adminText')}</Text>
              </Space>
            </Dropdown>
          </Space>
        </Header>

        {/* Content */}
        <Content style={{ padding: 24, backgroundColor: '#f5f5f5', minHeight: 600 }}>
          {/* Stats cards */}
          <Row gutter={16} style={{ marginBottom: 24 }}>
            <Col span={6}>
              <Card>
                <Statistic
                  title={t('dashboard.stats.totalTasks')}
                  value={1284}
                  prefix={<AppstoreOutlined />}
                  suffix={t('dashboard.stats.suffixCount')}
                />
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  <Text type="success">
                    <ArrowUpOutlined /> 12.5%
                  </Text>
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {t('dashboard.stats.vsLastWeek')}
                  </Text>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title={t('dashboard.stats.successRate')}
                  value={92.8}
                  suffix="%"
                  valueStyle={{ color: '#52c41a' }}
                  prefix={<CheckCircleOutlined />}
                />
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  <Text type="success">
                    <ArrowUpOutlined /> 3.2%
                  </Text>
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {t('dashboard.stats.vsLastWeek')}
                  </Text>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title={t('dashboard.stats.running')}
                  value={23}
                  prefix={<SyncOutlined spin />}
                  suffix={t('dashboard.stats.suffixCount')}
                />
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  <Text type="secondary">{t('dashboard.stats.currentlyExecuting')}</Text>
                </div>
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title={t('dashboard.stats.avgDuration')}
                  value={156}
                  suffix={t('dashboard.stats.suffixSeconds')}
                  prefix={<ClockCircleOutlined />}
                />
                <div style={{ marginTop: 8, fontSize: 12 }}>
                  <Text type="danger">
                    <ArrowDownOutlined /> 5.8%
                  </Text>
                  <Text type="secondary" style={{ marginLeft: 8 }}>
                    {t('dashboard.stats.vsLastWeek')}
                  </Text>
                </div>
              </Card>
            </Col>
          </Row>

          {/* Charts & tables */}
          <Row gutter={16}>
            <Col span={24}>
              <Card
                title={t('dashboard.cards.trendTitle')}
                extra={
                  <Button type="primary" icon={<PlusOutlined />} size="small">
                    {t('dashboard.cards.newTaskBtn')}
                  </Button>
                }
                style={{ marginBottom: 16 }}
              >
                <ReactECharts option={getChartOption()} style={{ height: 280 }} />
              </Card>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
              <Card
                title={t('dashboard.cards.recentTitle')}
                extra={
                  <Space>
                    <Button size="small">{t('dashboard.cards.filterBtn')}</Button>
                    <Button size="small">{t('dashboard.cards.exportBtn')}</Button>
                  </Space>
                }
              >
                <Table
                  columns={tableColumns}
                  dataSource={tableData}
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </Content>
      </Layout>
    </Layout>
  );
}
