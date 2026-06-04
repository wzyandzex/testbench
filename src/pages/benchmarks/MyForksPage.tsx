/**
 * MyForksPage - My Fork list page
 * Shows all user-forked benchmarks, supports update notifications and sync operations
 */

import { useCallback, useEffect, useMemo } from 'react';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Typography,
  Tooltip,
  message,
  Breadcrumb,
} from 'antd';
import {
  HomeOutlined,
  BranchesOutlined,
  SyncOutlined,
  EyeOutlined,
  CheckOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { useTranslation } from 'react-i18next';
import { useBenchmarkStore } from './store';
import { logger } from '@/utils';
import { useThemeTokens } from '@/theme';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Title, Text } = Typography;

/**
 * MyForksPage component
 *
 * Features:
 * - Show all user forks
 * - Show has_parent_updates status
 * - "Sync update" button (view parent updates)
 * - Mark as read
 */
export default function MyForksPage() {
  const { t } = useTranslation('benchmarks');
  const navigate = useNavigate();
  const tokens = useThemeTokens();

  // Store
  const {
    forks,
    forksTotal,
    forksLoading,
    forksParams,
    fetchMyForks,
    markUpdateSeen,
    setForksParams,
  } = useBenchmarkStore();

  // Fetch data
  useEffect(() => {
    fetchMyForks();
  }, [fetchMyForks]);

  // Refresh list
  const handleRefresh = useCallback(() => {
    fetchMyForks();
    message.success(t('myForks.refreshed'));
  }, [fetchMyForks, t]);

  // View parent benchmark
  const handleViewParent = useCallback(
    (parentId: string) => {
      navigate(`/benchmarks/${parentId}`);
    },
    [navigate]
  );

  // Edit fork
  const handleEdit = useCallback(
    (forkId: string) => {
      navigate(`/benchmarks/${forkId}/edit`);
    },
    [navigate]
  );

  // Sync update (jump to parent compare)
  const handleSync = useCallback(
    (fork: any) => {
      logger.userAction('sync_fork', { forkId: fork.id, parentId: fork.parent_id });
      navigate(`/benchmarks/${fork.parent_id}`, {
        state: { compareWith: fork.child_id },
      });
    },
    [navigate]
  );

  // Mark as read
  const handleMarkSeen = useCallback(
    (forkId: string) => {
      markUpdateSeen(forkId);
      message.success(t('myForks.markedRead'));
    },
    [markUpdateSeen, t]
  );

  // Table columns
  const columns = useMemo(
    () => [
      {
        title: t('myForks.colForkName'),
        dataIndex: 'child_name',
        key: 'child_name',
        width: 200,
        render: (name: string, record: any) => (
          <Space>
            <BranchesOutlined style={{ color: tokens.text.secondary }} />
            <a onClick={() => handleEdit(record.child_id)}>{name}</a>
            {record.has_parent_updates && !record.parent_updates_seen && (
              <Tag color="warning" style={{ margin: 0 }}>
                {t('myForks.tagHasUpdate')}
              </Tag>
            )}
          </Space>
        ),
      },
      {
        title: t('myForks.colSource'),
        dataIndex: 'parent_name',
        key: 'parent_name',
        width: 180,
        render: (name: string, record: any) => (
          <Tooltip title={t('myForks.tooltipViewParent')}>
            <a onClick={() => handleViewParent(record.parent_id)}>{name}</a>
          </Tooltip>
        ),
      },
      {
        title: t('myForks.colForkTime'),
        dataIndex: 'forked_at',
        key: 'forked_at',
        width: 150,
        render: (time: string) => (
          <Text type="secondary" style={{ fontSize: 13 }}>
            {dayjs(time).fromNow()}
          </Text>
        ),
      },
      {
        title: t('myForks.colParentVersion'),
        dataIndex: 'parent_version',
        key: 'parent_version',
        width: 100,
        render: (version: number) => (
          <Tag color="default">v{version}</Tag>
        ),
      },
      {
        title: t('myForks.colUpdateStatus'),
        key: 'update_status',
        width: 180,
        render: (_: any, record: any) => {
          if (!record.has_parent_updates) {
            return (
              <Text type="secondary" style={{ fontSize: 13 }}>
                {t('myForks.labelUpToDate')}
              </Text>
            );
          }
          return (
            <Space size="small">
              <Tag color="warning">{t('myForks.tagNewVersion')}</Tag>
              <Button
                type="link"
                size="small"
                icon={<SyncOutlined />}
                onClick={() => handleSync(record)}
              >
                {t('myForks.btnSync')}
              </Button>
            </Space>
          );
        },
      },
      {
        title: t('myForks.colActions'),
        key: 'actions',
        width: 150,
        fixed: 'right' as const,
        render: (_: any, record: any) => (
          <Space size="small">
            <Tooltip title={t('myForks.tooltipViewParentBtn')}>
              <Button
                type="text"
                size="small"
                icon={<EyeOutlined />}
                onClick={() => handleViewParent(record.parent_id)}
              />
            </Tooltip>
            <Tooltip title={t('myForks.tooltipMarkRead')}>
              <Button
                type="text"
                size="small"
                icon={<CheckOutlined />}
                disabled={!record.has_parent_updates || record.parent_updates_seen}
                onClick={() => handleMarkSeen(record.id)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [tokens.text.secondary, handleEdit, handleViewParent, handleSync, handleMarkSeen, t]
  );

  // Stats
  const stats = useMemo(() => {
    const hasUpdates = forks.filter((f) => f.has_parent_updates && !f.parent_updates_seen);
    return {
      total: forksTotal,
      hasUpdates: hasUpdates.length,
      upToDate: forksTotal - hasUpdates.length,
    };
  }, [forks, forksTotal]);

  return (
    <div style={{ padding: 24 }}>
      {/* Breadcrumb */}
      <Breadcrumb style={{ marginBottom: 16 }} items={[
        { title: <HomeOutlined />, href: '/dashboard' },
        { title: <span>{t('myForks.breadcrumbBenchmarks')}</span>, href: '/benchmarks' },
        { title: <span>{t('myForks.breadcrumbMyForks')}</span> },
      ]} />

      {/* Page title */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 24,
        }}
      >
        <div>
          <Title level={2} style={{ margin: 0 }}>
            {t('myForks.title')}
          </Title>
          <Text type="secondary">
            {t('myForks.subtitle', { total: stats.total })}
          </Text>
        </div>
        <Button icon={<ReloadOutlined />} onClick={handleRefresh}>
          {t('myForks.refresh')}
        </Button>
      </div>

      {/* Stats cards */}
      <Card style={{ marginBottom: 16 }}>
        <Space size="large">
          <div>
            <Text type="secondary">{t('myForks.statTotal')}</Text>
            <div style={{ fontSize: 20, fontWeight: 600 }}>
              {stats.total}
            </div>
          </div>
          <div>
            <Text type="secondary">{t('myForks.statHasUpdates')}</Text>
            <div
              style={{
                fontSize: 20,
                fontWeight: 600,
                color: stats.hasUpdates > 0 ? tokens.status.warning : tokens.text.secondary,
              }}
            >
              {stats.hasUpdates}
            </div>
          </div>
          <div>
            <Text type="secondary">{t('myForks.statUpToDate')}</Text>
            <div style={{ fontSize: 20, fontWeight: 600, color: tokens.status.success }}>
              {stats.upToDate}
            </div>
          </div>
        </Space>
      </Card>

      {/* Fork list table */}
      <Card>
        <Table
          columns={columns}
          dataSource={forks}
          rowKey="id"
          loading={forksLoading}
          pagination={{
            current: forksParams.page || 1,
            pageSize: forksParams.page_size || 20,
            total: forksTotal,
            showSizeChanger: true,
            showTotal: (total) => t('myForks.showTotal', { total }),
            onChange: (page, pageSize) => {
              setForksParams({ page, page_size: pageSize });
              fetchMyForks();
            },
          }}
          locale={{
            emptyText: (
              <div style={{ padding: '40px 0', textAlign: 'center' }}>
                <BranchesOutlined style={{ fontSize: 48, color: '#ccc' }} />
                <div style={{ marginTop: 16, color: '#999' }}>
                  {t('myForks.emptyText')}
                </div>
                <Button type="primary" style={{ marginTop: 16 }} onClick={() => navigate('/benchmarks')}>
                  {t('myForks.browseBenchmarks')}
                </Button>
              </div>
            ),
          }}
        />
      </Card>
    </div>
  );
}
