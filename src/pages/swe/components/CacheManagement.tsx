/**
 * SWE repo cache management
 */

import { Card, Table, Button, Space, Popconfirm, Typography, Tag, Progress } from 'antd';
import {
  DeleteOutlined,
  ReloadOutlined,
  CloudDownloadOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { formatBytes } from '@/utils/format';
import type { SWECacheStats, SWEBenchRepo } from '@/types';
import type { ColumnsType } from 'antd/es/table';

const { Text } = Typography;

interface CacheManagementProps {
  cacheStats: SWECacheStats | null;
  loading?: boolean;
  onRefresh?: (repoName: string) => void;
  onDelete?: (repoName: string) => void;
  onPreheat?: (repoUrls: string[]) => void;
  style?: React.CSSProperties;
}

export const CacheManagement = ({
  cacheStats,
  loading,
  onRefresh,
  onDelete,
  onPreheat,
  style,
}: CacheManagementProps) => {
  const { t } = useTranslation('swe');

  // Table columns
  const columns: ColumnsType<SWEBenchRepo> = [
    {
      title: t('cache.columns.repoName'),
      dataIndex: 'name',
      key: 'name',
      render: (name: string) => (
        <Space>
          <DatabaseOutlined />
          <Text code>{name}</Text>
        </Space>
      ),
    },
    {
      title: t('cache.columns.url'),
      dataIndex: 'url',
      key: 'url',
      ellipsis: true,
      render: (url: string) => (
        <a href={url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12 }}>
          {url}
        </a>
      ),
    },
    {
      title: t('cache.columns.size'),
      dataIndex: 'size',
      key: 'size',
      width: 120,
      render: (size: number) => <Text>{formatBytes(size)}</Text>,
      },
    {
      title: t('cache.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: SWEBenchRepo['status']) => {
        const config = {
          cached: { color: 'success', label: t('cache.statusLabels.cached') },
          updating: { color: 'processing', label: t('cache.statusLabels.updating') },
          error: { color: 'error', label: t('cache.statusLabels.error') },
        };
        const { color, label } = config[status];
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: t('cache.columns.cachedAt'),
      dataIndex: 'cachedAt',
      key: 'cachedAt',
      width: 180,
      render: (date: Date) => new Date(date).toLocaleString(),
    },
    {
      title: t('cache.columns.commitCount'),
      dataIndex: 'commitCount',
      key: 'commitCount',
      width: 100,
      render: (count?: number) => (
        <Text>{count !== undefined ? count.toLocaleString() : '-'}</Text>
      ),
    },
    {
      title: t('cache.columns.actions'),
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            size="small"
            icon={<ReloadOutlined />}
            onClick={() => onRefresh?.(record.name)}
            disabled={loading}
          >
            {t('cache.actions.refresh')}
          </Button>
          <Popconfirm
            title={t('cache.deleteTitle')}
            description={t('cache.deleteDesc')}
            onConfirm={() => onDelete?.(record.name)}
            okText={t('cache.actions.confirm')}
            cancelText={t('cache.actions.cancel')}
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
              disabled={loading}
            >
              {t('cache.actions.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Totals
  const totalSize = cacheStats?.repos?.reduce((sum, repo) => sum + repo.size, 0) || 0;
  const totalRepos = cacheStats?.repos?.length || 0;
  const updatingCount = cacheStats?.repos?.filter((r) => r.status === 'updating').length || 0;

  return (
    <Space direction="vertical" style={{ width: '100%', ...style }} size={12}>
      {/* Stats card */}
      <Card>
        <Space size="large">
          <div>
            <Text type="secondary">{t('cache.stats.cachedRepos')}</Text>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>
              {totalRepos}
            </div>
          </div>
          <div>
            <Text type="secondary">{t('cache.stats.totalSize')}</Text>
            <div style={{ fontSize: 24, fontWeight: 'bold' }}>
              {formatBytes(totalSize)}
            </div>
          </div>
          <div>
            <Text type="secondary">{t('cache.stats.updating')}</Text>
            <div style={{ fontSize: 24, fontWeight: 'bold', color: '#1890ff' }}>
              {updatingCount}
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Button
              icon={<CloudDownloadOutlined />}
              onClick={() => {
                onPreheat?.([]);
              }}
            >
              {t('cache.stats.preheat')}
            </Button>
          </div>
        </Space>
        {totalSize > 0 && (
          <div style={{ marginTop: 16 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              {t('cache.stats.storageUsage')}
            </Text>
            <Progress
              percent={Math.min((totalSize / (10 * 1024 * 1024 * 1024)) * 100, 100)}
              format={() => formatBytes(totalSize)}
              strokeColor="#52c41a"
            />
          </div>
        )}
      </Card>

      {/* Cache list */}
      <Card title={t('cache.title')} styles={{ body: { padding: 0 } }}>
        <Table
          columns={columns}
          dataSource={cacheStats?.repos || []}
          rowKey="name"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total) => t('cache.stats.totalCount', { total }),
          }}
        />
      </Card>
    </Space>
  );
};

export default CacheManagement;
