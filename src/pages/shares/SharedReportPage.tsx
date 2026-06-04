import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Descriptions,
  message,
  Popconfirm,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  CopyOutlined,
  DeleteOutlined,
  FileOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';

import type { ShareInfo } from './service';
import { getShare, revokeShare } from './service';
import { CommentSection } from './components/CommentSection';
import { useAuthStore } from '@/stores/authStore';

const { Title, Text } = Typography;

export default function SharedReportPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [share, setShare] = useState<ShareInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const currentUser = useAuthStore((s) => s.user);

  const fetchShare = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await getShare(id);
      setShare(data);
    } catch {
      // handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchShare();
  }, [fetchShare]);

  const handleRevoke = async () => {
    if (!id) return;
    try {
      await revokeShare(id);
      message.success('分享已撤销');
      navigate('/shares');
    } catch {
      // handled by interceptor
    }
  };

  const handleCopyLink = () => {
    if (share?.share_url) {
      const fullUrl = `${window.location.origin}${share.share_url}`;
      navigator.clipboard.writeText(fullUrl).then(
        () => message.success('链接已复制'),
        () => message.error('复制失败')
      );
    }
  };

  if (loading) {
    return (
      <Card bordered={false}>
        <Skeleton active paragraph={{ rows: 8 }} />
      </Card>
    );
  }

  if (!share) {
    return (
      <Card bordered={false}>
        <Text type="secondary">分享不存在或已被撤销</Text>
      </Card>
    );
  }

  const isOwner = currentUser?.id === share.shared_by;
  const canComment = share.access_level === 'comment' || share.access_level === 'manage';

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/shares')}>
          返回
        </Button>
      </Space>

      <Card bordered={false}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Space align="center" style={{ justifyContent: 'space-between', width: '100%' }}>
            <Title level={4} style={{ margin: 0 }}>
              {share.share_type === 'link' ? <LinkOutlined /> : <FileOutlined />}
              {' '}
              {share.execution_name || share.execution_id}
            </Title>
            <Space>
              {share.share_url && (
                <Button icon={<CopyOutlined />} onClick={handleCopyLink}>
                  复制链接
                </Button>
              )}
              {isOwner && share.status === 'active' && (
                <Popconfirm title="确定撤销此分享？" onConfirm={handleRevoke}>
                  <Button icon={<DeleteOutlined />} danger>
                    撤销分享
                  </Button>
                </Popconfirm>
              )}
            </Space>
          </Space>

          <Descriptions column={3} bordered size="small">
            <Descriptions.Item label="分享者">{share.shared_by_name}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color={share.status === 'active' ? 'green' : 'red'}>
                {share.status === 'active' ? '有效' : share.status === 'revoked' ? '已撤销' : '已过期'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="权限">
              <Tag color={share.access_level === 'manage' ? 'gold' : share.access_level === 'comment' ? 'blue' : 'default'}>
                {share.access_level === 'view' ? '查看' : share.access_level === 'comment' ? '评论' : '管理'}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="分享范围">
              {share.scope === 'org' ? '组织全员' : share.scope === 'user' ? share.recipient_name || '指定成员' : '外部链接'}
            </Descriptions.Item>
            <Descriptions.Item label="查看次数">{share.view_count}</Descriptions.Item>
            <Descriptions.Item label="创建时间">
              {dayjs(share.created_at).format('YYYY-MM-DD HH:mm')}
            </Descriptions.Item>
            {share.expires_at && (
              <Descriptions.Item label="过期时间">
                {dayjs(share.expires_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            )}
          </Descriptions>

          <Card
            type="inner"
            title="报告内容"
            extra={
              <Button
                type="link"
                onClick={() => navigate(`/executions/${share.execution_id}`)}
              >
                查看完整执行详情
              </Button>
            }
          >
            <Text type="secondary">
              此处展示 execution {share.execution_id} 的报告内容。
              点击"查看完整执行详情"可跳转到完整的执行记录页面。
            </Text>
          </Card>

          {share.status === 'active' && id && (
            <CommentSection shareId={id} canComment={canComment} />
          )}
        </Space>
      </Card>
    </div>
  );
}
