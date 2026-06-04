import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Button,
  Card,
  Empty,
  message,
  Popconfirm,
  Space,
  Table,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import {
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import type { SessionInfo, Verdict } from './service';
import { deleteSession, listSessions, VERDICT_META } from './service';

const { Title, Text } = Typography;

export default function ComparisonListPage() {
  const { t } = useTranslation('comparisons');
  const navigate = useNavigate();
  const [tab, setTab] = useState<'mine' | 'org'>('mine');
  const [sessions, setSessions] = useState<SessionInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await listSessions({ tab, page, page_size: 20 });
      setSessions(resp.data || []);
      setTotal(resp.total);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    try {
      await deleteSession(id);
      message.success(t('list.deleteSuccess'));
      fetchData();
    } catch {
      // handled
    }
  };

  const columns = [
    {
      title: t('list.columns.name'),
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record: SessionInfo) => (
        <Space direction="vertical" size={0}>
          <Text strong>{text}</Text>
          {record.description && (
            <Text type="secondary" style={{ fontSize: 12 }}>{record.description}</Text>
          )}
        </Space>
      ),
    },
    {
      title: t('list.columns.verdict'),
      dataIndex: 'verdict',
      key: 'verdict',
      width: 110,
      render: (v: Verdict | undefined) => {
        if (!v) return <Tag>-</Tag>;
        const meta = VERDICT_META[v];
        return (
          <Tag color={v === 'improved' ? 'success' : v === 'regressed' ? 'error' : v === 'mixed' ? 'warning' : 'default'}>
            {meta.icon} {t(`verdict.${v}`)}
          </Tag>
        );
      },
    },
    {
      title: t('list.columns.pair'),
      key: 'pair',
      render: (_: unknown, record: SessionInfo) => (
        <Text code style={{ fontSize: 11 }}>
          {record.reference_id.slice(0, 8)} → {record.target_id.slice(0, 8)}
        </Text>
      ),
    },
    {
      title: t('list.columns.visibility'),
      dataIndex: 'visibility',
      key: 'visibility',
      width: 90,
      render: (v: string) => v === 'org'
        ? <Tag icon={<TeamOutlined />}>{t('list.visibility.org')}</Tag>
        : <Tag icon={<UserOutlined />}>{t('list.visibility.private')}</Tag>,
    },
    {
      title: t('list.columns.created'),
      key: 'meta',
      width: 140,
      render: (_: unknown, record: SessionInfo) => (
        <Space direction="vertical" size={0}>
          <Text style={{ fontSize: 12 }}>{record.created_by_name || record.created_by.slice(0, 8)}</Text>
          <Text type="secondary" style={{ fontSize: 11 }}>
            {dayjs(record.created_at).format('MM-DD HH:mm')}
          </Text>
        </Space>
      ),
    },
    {
      title: t('list.columns.actions'),
      key: 'actions',
      width: 100,
      render: (_: unknown, record: SessionInfo) => (
        <Space>
          <Tooltip title={t('list.actions.view')}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/comparisons/sessions/${record.id}`)}
            />
          </Tooltip>
          {tab === 'mine' && (
            <Popconfirm title={t('list.actions.deleteConfirm')} onConfirm={() => handleDelete(record.id)}>
              <Button type="text" size="small" icon={<DeleteOutlined />} danger />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      bordered={false}
      title={
        <Space>
          <Title level={4} style={{ margin: 0 }}>{t('list.title')}</Title>
        </Space>
      }
      extra={
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => navigate('/comparisons/new')}
        >
          {t('list.new')}
        </Button>
      }
    >
      <Tabs
        activeKey={tab}
        onChange={(k) => { setTab(k as 'mine' | 'org'); setPage(1); }}
        items={[
          { key: 'mine', label: t('list.tabs.mine') },
          { key: 'org',  label: t('list.tabs.org') },
        ]}
      />
      <Table
        rowKey="id"
        columns={columns}
        dataSource={sessions}
        loading={loading}
        locale={{
          emptyText: <Empty description={tab === 'mine' ? t('list.empty.mine') : t('list.empty.org')} />,
        }}
        pagination={{
          current: page,
          pageSize: 20,
          total,
          onChange: setPage,
          showTotal: (totalCount) => t('list.total', { total: totalCount }),
        }}
      />
    </Card>
  );
}
