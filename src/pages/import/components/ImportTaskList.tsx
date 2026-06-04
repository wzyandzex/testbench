/**
 * ImportTaskList component
 * Import task list
 */

import { memo, useCallback, useState } from 'react';
import {
  Table,
  Tag,
  Button,
  Space,
  Popconfirm,
  Tooltip,
  Badge,
} from 'antd';
import {
  DeleteOutlined,
  CloseCircleOutlined,
  EyeOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import type { ImportTask, ImportTaskStatus, DatasetType, SourceType } from '../service';
import { getStatusText, getStatusColor } from '../service';

interface ImportTaskListProps {
  tasks: ImportTask[];
  total: number;
  loading: boolean;
  onRefresh: () => void;
  onCancel: (id: string) => void;
  onDelete: (id: string) => void;
  onView: (task: ImportTask) => void;
  onPageChange?: (page: number, pageSize: number) => void;
  pageSize?: number;
  currentPage?: number;
}

const getDatasetName = (type: DatasetType): string => {
  const map: Record<DatasetType, string> = {
    humaneval: 'HumanEval',
    mbpp: 'MBPP',
    swebench: 'SWE-bench',
    codecomplete: 'CodeComplete',
    benchmark: i18next.t('import:table.datasetCustom'),
  };
  return map[type] || type;
};

const getSourceName = (type: SourceType): string => {
  const map: Record<SourceType, string> = {
    file: i18next.t('import:table.sourceFile'),
    url: i18next.t('import:table.sourceUrl'),
    huggingface: 'HuggingFace',
    json: 'JSON',
    yaml: 'YAML',
  };
  return map[type] || type;
};

export const ImportTaskList = memo(function ImportTaskList({
  tasks,
  total,
  loading,
  onRefresh,
  onCancel,
  onDelete,
  onView,
  onPageChange,
  pageSize = 20,
  currentPage = 1,
}: ImportTaskListProps) {
  const { t } = useTranslation('import');
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const handleCancel = useCallback(
    async (id: string) => {
      try {
        await onCancel(id);
      } catch (err) {
        // Error handled by store
      }
    },
    [onCancel]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      try {
        await onDelete(id);
      } catch (err) {
        // Error handled by store
      }
    },
    [onDelete]
  );

  const columns: ColumnsType<ImportTask> = [
    {
      title: t('table.dataset'),
      dataIndex: 'datasetType',
      key: 'datasetType',
      width: 140,
      render: (type: DatasetType) => (
        <Space>
          <span>{getDatasetName(type)}</span>
        </Space>
      ),
    },
    {
      title: t('table.source'),
      dataIndex: 'sourceType',
      key: 'sourceType',
      width: 100,
      render: (type: SourceType) => getSourceName(type),
    },
    {
      title: t('table.status'),
      dataIndex: 'status',
      key: 'status',
      width: 100,
      render: (status: ImportTaskStatus) => (
        <Badge
          status={getStatusColor(status) as any}
          text={<span style={{ fontSize: 13 }}>{getStatusText(status)}</span>}
        />
      ),
    },
    {
      title: t('table.progress'),
      key: 'progress',
      width: 150,
      render: (_, record) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ flex: 1 }}>
            <div style={{
              height: 4,
              background: 'var(--progress-bg, rgba(0,0,0,0.06))',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${record.progress.percentage}%`,
                background: 'var(--progress-bar, linear-gradient(90deg, #667eea, #764ba2))',
                transition: 'width 0.3s ease',
              }} />
            </div>
          </div>
          <span style={{ fontSize: 12, color: 'var(--import-text-secondary)', minWidth: 40 }}>
            {record.progress.percentage}%
          </span>
        </div>
      ),
    },
    {
      title: t('table.result'),
      key: 'result',
      width: 120,
      render: (_, record) => {
        if (!record.result || record.status !== 'completed') {
          return <span style={{ color: 'var(--import-text-tertiary)' }}>-</span>;
        }
        const { success, failed, skipped } = record.result;
        return (
          <Space size={4}>
            {success > 0 && <Tag color="success">{success}</Tag>}
            {failed > 0 && <Tag color="error">{failed}</Tag>}
            {skipped > 0 && <Tag color="default">{skipped}</Tag>}
          </Space>
        );
      },
    },
    {
      title: t('table.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: t('table.action'),
      key: 'actions',
      width: 150,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <Tooltip title={t('table.viewDetail')}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onView(record)}
            />
          </Tooltip>

          {(record.status === 'pending' || record.status === 'running') && (
            <Popconfirm
              title={t('actions.cancelConfirm')}
              onConfirm={() => handleCancel(record.id)}
              okText={t('actions.confirm')}
              cancelText={t('actions.cancel')}
            >
              <Button type="text" size="small" icon={<CloseCircleOutlined />} danger />
            </Popconfirm>
          )}

          {(record.status === 'failed' || record.status === 'cancelled') && (
            <Tooltip title={t('table.retry')}>
              <Button
                type="text"
                size="small"
                icon={<ReloadOutlined />}
                onClick={() => {
                  // TODO: Implement retry
                }}
              />
            </Tooltip>
          )}

          <Popconfirm
            title={t('actions.deleteConfirm')}
            description={t('actions.deleteDesc')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('actions.confirm')}
            cancelText={t('actions.cancel')}
          >
            <Button type="text" size="small" icon={<DeleteOutlined />} danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div className="import-task-list">
      <div className="task-list-header">
        <h3 className="task-list-title">{t('table.header')}</h3>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={onRefresh} loading={loading}>
            {t('table.refresh')}
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={tasks}
        rowKey="id"
        loading={loading}
        pagination={{
          current: currentPage,
          pageSize,
          total,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (count) => t('table.totalRecords', { count }),
          onChange: onPageChange,
        }}
        rowSelection={{
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        scroll={{ x: 900 }}
      />
    </div>
  );
});
