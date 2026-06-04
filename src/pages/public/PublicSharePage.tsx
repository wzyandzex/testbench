import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Button,
  Card,
  Descriptions,
  Form,
  Input,
  Result,
  Skeleton,
  Space,
  Tag,
  Typography,
} from 'antd';
import { LockOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

import type { ShareInfo } from '../shares/service';
import { getPublicShare, verifyPublicSharePassword } from '../shares/service';

const { Title, Text } = Typography;

export default function PublicSharePage() {
  const { token } = useParams<{ token: string }>();
  const [share, setShare] = useState<ShareInfo | null>(null);
  const [needsPassword, setNeedsPassword] = useState(false);
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchShare = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const result = await getPublicShare(token);
      setShare(result.share);
      setNeedsPassword(result.has_password);
      if (!result.has_password) {
        setVerified(true);
      }
    } catch (err: unknown) {
      const bizErr = err as { isBizError?: boolean; code?: number; message?: string };
      if (bizErr.isBizError) {
        if (bizErr.code === 410001 || bizErr.code === 410002) {
          setError('此分享链接已过期或被撤销');
        } else if (bizErr.code === 404001) {
          setError('分享链接不存在');
        } else {
          setError(bizErr.message || '加载失败');
        }
      } else {
        setError('网络错误，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchShare();
  }, [fetchShare]);

  const handleVerify = async (values: { password: string }) => {
    if (!token) return;
    setVerifying(true);
    try {
      const result = await verifyPublicSharePassword(token, values.password);
      setShare(result);
      setVerified(true);
    } catch {
      // interceptor shows error
    } finally {
      setVerifying(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 800, margin: '80px auto', padding: '0 24px' }}>
        <Card bordered={false}>
          <Skeleton active paragraph={{ rows: 6 }} />
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ maxWidth: 800, margin: '80px auto', padding: '0 24px' }}>
        <Result status="warning" title="无法访问" subTitle={error} />
      </div>
    );
  }

  if (needsPassword && !verified) {
    return (
      <div style={{ maxWidth: 400, margin: '120px auto', padding: '0 24px' }}>
        <Card bordered={false}>
          <Space direction="vertical" align="center" style={{ width: '100%' }}>
            <LockOutlined style={{ fontSize: 48, color: '#1890ff' }} />
            <Title level={4}>受密码保护的分享</Title>
            <Text type="secondary">请输入密码以查看报告内容</Text>
            <Form onFinish={handleVerify} style={{ width: '100%', marginTop: 16 }}>
              <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
                <Input.Password placeholder="输入访问密码" size="large" />
              </Form.Item>
              <Form.Item>
                <Button type="primary" htmlType="submit" loading={verifying} block size="large">
                  验证
                </Button>
              </Form.Item>
            </Form>
          </Space>
        </Card>
      </div>
    );
  }

  if (!share) return null;

  return (
    <div style={{ maxWidth: 1000, margin: '40px auto', padding: '0 24px' }}>
      <Card bordered={false}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div style={{ textAlign: 'center' }}>
            <Title level={3}>评测报告</Title>
            <Text type="secondary">
              由 {share.shared_by_name || '团队成员'} 分享
            </Text>
          </div>

          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="执行">
              {share.execution_name || share.execution_id}
            </Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag color="green">有效</Tag>
            </Descriptions.Item>
            <Descriptions.Item label="查看次数">{share.view_count}</Descriptions.Item>
            {share.expires_at && (
              <Descriptions.Item label="过期时间">
                {dayjs(share.expires_at).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            )}
          </Descriptions>

          <Card type="inner" title="报告内容">
            <Text type="secondary">
              此处展示 execution {share.execution_id} 的报告内容。
              外部访问者可查看报告基本信息和指标数据。
            </Text>
          </Card>
        </Space>
      </Card>
    </div>
  );
}
