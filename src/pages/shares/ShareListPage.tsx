import { useCallback, useEffect, useState } from 'react';
import {
  Badge,
  Button,
  Card,
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
  CopyOutlined,
  DeleteOutlined,
  EyeOutlined,
  FileOutlined,
  GlobalOutlined,
  LinkOutlined,
  TeamOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';

import type { ShareInfo } from './service';
import { listShares, revokeShare } from './service';

const { Text } = Typography;

const scopeIcons: Record<string, React.ReactNode> = {
  org: <TeamOutlined />,
  user: <UserOutlined />,
  external: <GlobalOutlined />,
};

const scopeLabels: Record<string, string> = {
  org: '组织全员',
  user: '指定成员',
  external: '外部链接',
};

const accessLabels: Record<string, { text: string; color: string }> = {
  view: { text: '查看', color: 'default' },
  comment: { text: '评论', color: 'blue' },
  manage: { text: '管理', color: 'gold' },
};

const statusLabels: Record<string, { text: string; color: string }> = {
  active: { text: '有效', color: 'green' },
  revoked: { text: '已撤销', color: 'red' },
  expired: { text: '已过期', color: 'default' },
};

export default function ShareListPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<'sent' | 'received'>('sent');
  const [shares, setShares] = useState<ShareInfo[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchShares = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await listShares({ tab, page, page_size: 20 });
      setShares(resp.data || []);
      setTotal(resp.total);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [tab, page]);

  useEffect(() => {
    fetchShares();
  }, [fetchShares]);

  const handleRevoke = async (id: string) => {
    try {
      await revokeShare(id);
      message.success('分享已撤销');
      fetchShares();
    } catch {
      // handled by interceptor
    }
  };

  const handleCopyLink = (share: ShareInfo) => {
    if (share.share_url) {
      const fullUrl = `${window.location.origin}${share.share_url}`;
      navigator.clipboard.writeText(fullUrl).then(
        () => message.success('链接已复制'),
        () => message.error('复制失败')
      );
    }
  };

  const columns = [
    {
      title: '执行',
      dataIndex: 'execution_name',
      key: 'execution_name',
      render: (name: string, record: ShareInfo) => (
        <Text strong>{name || record.execution_id.slice(0, 8)}</Text>
      ),
    },
    {
      title: '类型',
      dataIndex: 'share_type',
      key: 'share_type',
      width: 100,
      render: (type: string) =>
        type === 'link' ? (
          <Tag icon={<LinkOutlined />}>链接</Tag>
        ) : (
          <Tag icon={<FileOutlined />}>文件</Tag>
        ),
    },
    {
      title: '范围',
      dataIndex: 'scope',
      key: 'scope',
      width: 120,
      render: (scope: string, record: ShareInfo) => (
        <Space>
          {scopeIcons[scope]}
          <Text>{scope === 'user' ? record.recipient_name || '指定成员' : scopeLabels[scope]}</Text>
        </Space>
      ),
    },
    {
      title: '权限',
      dataIndex: 'access_level',
      key: 'access_level',
      width: 80,
      render: (level: string) => {
        const info = accessLabels[level] || accessLabels.view;
        return <Tag color={info.color}>{info.text}</Tag>;
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: (status: string) => {
        const info = statusLabels[status] || statusLabels.active;
        return <Badge color={info.color} text={info.text} />;
      },
    },
    {
      title: '查看次数',
      dataIndex: 'view_count',
      key: 'view_count',
      width: 90,
      render: (count: number) => (
        <Space>
          <EyeOutlined />
          {count}
        </Space>
      ),
    },
    {
      title: tab === 'sent' ? '分享时间' : '分享者',
      key: 'meta',
      width: 140,
      render: (_: unknown, record: ShareInfo) =>
        tab === 'sent' ? (
          <Text type="secondary">{dayjs(record.created_at).format('MM-DD HH:mm')}</Text>
        ) : (
          <Text>{record.shared_by_name}</Text>
        ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 140,
      render: (_: unknown, record: ShareInfo) => (
        <Space>
          <Tooltip title="查看">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => navigate(`/shares/${record.id}`)}
            />
          </Tooltip>
          {record.share_url && (
            <Tooltip title="复制链接">
              <Button
                type="text"
                size="small"
                icon={<CopyOutlined />}
                onClick={() => handleCopyLink(record)}
              />
            </Tooltip>
          )}
          {tab === 'sent' && record.status === 'active' && (
            <Popconfirm title="确定撤销这个分享？" onConfirm={() => handleRevoke(record.id)}>
              <Tooltip title="撤销">
                <Button type="text" size="small" icon={<DeleteOutlined />} danger />
              </Tooltip>
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="报告分享"
      bordered={false}
    >
      <Tabs
        activeKey={tab}
        onChange={(key) => {
          setTab(key as 'sent' | 'received');
          setPage(1);
        }}
        items={[
          { key: 'sent', label: '我分享的' },
          { key: 'received', label: '收到的分享' },
        ]}
      />
      <Table
        rowKey="id"
        columns={columns}
        dataSource={shares}
        loading={loading}
        pagination={{
          current: page,
          pageSize: 20,
          total,
          onChange: setPage,
          showTotal: (t) => `共 ${t} 条`,
        }}
      />
    </Card>
  );
}
