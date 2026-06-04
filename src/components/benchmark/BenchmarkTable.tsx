/**
 * 评测任务表格组件
 * 用于展示评测任务列表，支持排序、筛选和操作
 */

import { Table, Tag, Space, Button, Typography, Avatar, Tooltip } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  ExperimentOutlined,
  CodeOutlined,
  FireOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType, TableProps } from 'antd/es/table';
import { useMemo } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import { useTranslation } from 'react-i18next';
import {
  useThemeTokens,
  useTextStyle,
  useProgressTrailColor,
} from '@/theme';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

export interface BenchmarkTableRecord {
  id: string;
  key: string;
  name: string;
  description?: string;
  language: string;
  category: string;
  status: 'active' | 'draft' | 'archived';
  totalExecutions: number;
  successRate: number;
  lastExecution?: Date | null;
  createdAt: Date;
}

export interface BenchmarkTableProps extends Omit<TableProps<BenchmarkTableRecord>, 'columns' | 'dataSource'> {
  dataSource: BenchmarkTableRecord[];
  loading?: boolean;
  onEdit?: (record: BenchmarkTableRecord) => void;
  onDelete?: (record: BenchmarkTableRecord) => void;
  onExecute?: (record: BenchmarkTableRecord) => void;
  onFork?: (record: BenchmarkTableRecord) => void;
}

// 语言颜色配置
const languageColors: Record<string, string> = {
  python: '#3776ab',
  javascript: '#f7df1e',
  typescript: '#3178c6',
  java: '#b07219',
  go: '#00add8',
  rust: '#dea584',
  cpp: '#f34b7d',
  ruby: '#cc342d',
  default: '#8c8c8c',
};

// 语言短标签
const languageLabels: Record<string, string> = {
  python: 'Python',
  javascript: 'JS',
  typescript: 'TS',
  java: 'Java',
  go: 'Go',
  rust: 'Rust',
  cpp: 'C++',
  ruby: 'Ruby',
};

function normalizePercent(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(100, value));
}

function formatPercent(value: number) {
  return normalizePercent(value).toFixed(1);
}

/**
 * 评测任务表格组件
 */
export function BenchmarkTable({
  dataSource,
  loading = false,
  onEdit,
  onDelete,
  onExecute,
  onFork,
  ...tableProps
}: BenchmarkTableProps) {
  const navigate = useNavigate();
  const { t } = useTranslation('benchmarks');

  // 主题 hooks
  const tokens = useThemeTokens();
  const primaryText = useTextStyle('primary');
  const secondaryText = useTextStyle('secondary');
  const progressTrailColor = useProgressTrailColor();

  // 分类配置
  const categoryConfig = useMemo<
    Record<string, { color: string; icon: React.ReactNode; text: string; textColor: string }>
  >(
    () => ({
      coding: {
        color: '#1677ff',
        icon: <CodeOutlined />,
        text: t('components.table.categoryCoding'),
        textColor: '#1677ff',
      },
      reasoning: {
        color: '#10b981',
        icon: <FireOutlined />,
        text: t('components.table.categoryReasoning'),
        textColor: '#10b981',
      },
      knowledge: {
        color: '#f59e0b',
        icon: <ExperimentOutlined />,
        text: t('components.table.categoryKnowledge'),
        textColor: '#f59e0b',
      },
      multimodal: {
        color: '#8b5cf6',
        icon: <ExperimentOutlined />,
        text: t('components.table.categoryMultimodal'),
        textColor: '#8b5cf6',
      },
      default: {
        color: '#8c8c8c',
        icon: <ExperimentOutlined />,
        text: t('components.table.categoryDefault'),
        textColor: '#8c8c8c',
      },
    }),
    [t],
  );

  // 状态配置
  const statusConfig = useMemo<
    Record<string, { color: string; icon: React.ReactNode; text: string; bgColor: string }>
  >(
    () => ({
      active: {
        color: '#10b981',
        icon: <CheckCircleOutlined />,
        text: t('components.table.statusActive'),
        bgColor: '#10b98115',
      },
      draft: {
        color: '#9ca3af',
        icon: <ClockCircleOutlined />,
        text: t('components.table.statusDraft'),
        bgColor: '#9ca3af15',
      },
      archived: {
        color: '#d1d5db',
        icon: <ExperimentOutlined />,
        text: t('components.table.statusArchived'),
        bgColor: '#d1d5db15',
      },
    }),
    [t],
  );

  // 预计算所有语言的颜色
  const languageBgColors = useMemo(() => {
    const colors: Record<string, string> = {};
    Object.keys(languageColors).forEach(lang => {
      const color = languageColors[lang];
      colors[lang] = `${color}15`;
    });
    return colors;
  }, []);

  // 处理行点击
  const handleRowClick = (record: BenchmarkTableRecord) => {
    navigate(`/benchmarks/${record.id}`);
  };

  // 渲染语言标签
  const renderLanguage = (language: string) => {
    const color = languageColors[language] || languageColors.default;
    const label = languageLabels[language] || language.slice(0, 2).toUpperCase();
    const avatarBg = languageBgColors[language] || `${languageColors.default}15`;

    return (
      <Tag
        style={{
          margin: 0,
          padding: '2px 8px',
          borderRadius: 4,
          border: `1px solid ${color}30`,
          background: avatarBg,
          color,
          fontSize: 12,
          fontWeight: 500,
        }}
      >
        {label}
      </Tag>
    );
  };

  // 渲染分类标签
  const renderCategory = (category: string) => {
    const config = categoryConfig[category] || {
      ...categoryConfig.default,
      text: category || categoryConfig.default.text,
    };

    return (
      <Tag
        icon={config.icon}
        style={{
          margin: 0,
          padding: '2px 8px',
          borderRadius: 4,
          border: `1px solid ${config.color}30`,
          background: `${config.color}15`,
          color: config.textColor,
          fontSize: 12,
        }}
      >
        {config.text}
      </Tag>
    );
  };

  // 渲染状态标签
  const renderStatus = (status: string) => {
    const config = statusConfig[status] || statusConfig.draft;

    return (
      <Tag
        icon={config.icon}
        style={{
          margin: 0,
          padding: '2px 8px',
          borderRadius: 4,
          border: `1px solid ${config.color}30`,
          background: config.bgColor,
          color: config.color,
          fontSize: 12,
        }}
      >
        {config.text}
      </Tag>
    );
  };

  // 渲染成功率
  const renderSuccessRate = (rate: number, total: number) => {
    if (total === 0) {
      return <Text style={{ ...secondaryText }}>-</Text>;
    }

    const normalizedRate = normalizePercent(rate);
    const color =
      normalizedRate >= 80
        ? tokens.status.success
        : normalizedRate >= 60
          ? tokens.status.warning
          : tokens.status.error;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Text style={{ color, fontWeight: 600, minWidth: 44 }}>
          {formatPercent(rate)}%
        </Text>
        <div
          style={{
            flex: 1,
            height: 4,
            background: progressTrailColor,
            borderRadius: 2,
            overflow: 'hidden',
            maxWidth: 60,
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${normalizedRate}%`,
              background: color,
              borderRadius: 2,
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>
    );
  };

  // 渲染操作按钮
  const renderActions = (record: BenchmarkTableRecord) => {
    const canExecute = record.status === 'active';
    const canEdit = true;
    const canFork = true;
    const canDelete = record.totalExecutions === 0;

    return (
      <Space size="small">
        {canExecute && onExecute && (
          <Tooltip title={t('components.table.tooltipExecute')}>
            <Button
              type="text"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onExecute(record);
              }}
              style={{ color: '#10b981' }}
            />
          </Tooltip>
        )}
        {canEdit && onEdit && (
          <Tooltip title={t('components.table.tooltipEdit')}>
            <Button
              type="text"
              size="small"
              icon={<EditOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onEdit(record);
              }}
            />
          </Tooltip>
        )}
        {canFork && onFork && (
          <Tooltip title={t('components.table.tooltipFork')}>
            <Button
              type="text"
              size="small"
              icon={<BranchesOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onFork(record);
              }}
            />
          </Tooltip>
        )}
        {canDelete && onDelete && (
          <Tooltip title={t('components.table.tooltipDelete')}>
            <Button
              type="text"
              size="small"
              icon={<DeleteOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onDelete(record);
              }}
              danger
            />
          </Tooltip>
        )}
      </Space>
    );
  };

  // 表格列配置
  const columns: ColumnsType<BenchmarkTableRecord> = [
    {
      title: t('components.table.columns.name'),
      dataIndex: 'name',
      key: 'name',
      width: 280,
      render: (name: string, record) => {
        const langColor = languageColors[record.language] || languageColors.default;
        const avatarBg = languageBgColors[record.language] || `${languageColors.default}15`;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar
              size={32}
              style={{
                background: avatarBg,
                color: langColor,
                fontSize: 12,
                fontWeight: 600,
                flexShrink: 0,
              }}
            >
              {(languageLabels[record.language] || record.language.slice(0, 2)).slice(0, 2)}
            </Avatar>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, ...primaryText, marginBottom: 2 }}>{name}</div>
              {record.description && (
                <Text style={{ fontSize: 12, ...secondaryText }} ellipsis={{ tooltip: record.description }}>
                  {record.description}
                </Text>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: t('components.table.columns.category'),
      dataIndex: 'category',
      key: 'category',
      width: 100,
      render: renderCategory,
    },
    {
      title: t('components.table.columns.language'),
      dataIndex: 'language',
      key: 'language',
      width: 80,
      render: renderLanguage,
    },
    {
      title: t('components.table.columns.status'),
      dataIndex: 'status',
      key: 'status',
      width: 80,
      render: renderStatus,
    },
    {
      title: t('components.table.columns.executions'),
      dataIndex: 'totalExecutions',
      key: 'totalExecutions',
      width: 100,
      sorter: (a, b) => a.totalExecutions - b.totalExecutions,
      render: (count: number) => <Text strong>{count}</Text>,
    },
    {
      title: t('components.table.columns.successRate'),
      dataIndex: 'successRate',
      key: 'successRate',
      width: 120,
      sorter: (a, b) => a.successRate - b.successRate,
      render: (rate: number, record) => renderSuccessRate(rate, record.totalExecutions),
    },
    {
      title: t('components.table.columns.lastExecution'),
      dataIndex: 'lastExecution',
      key: 'lastExecution',
      width: 120,
      sorter: (a, b) => {
        if (!a.lastExecution) return 1;
        if (!b.lastExecution) return -1;
        return a.lastExecution.getTime() - b.lastExecution.getTime();
      },
      render: (date: Date | null) =>
        date ? (
          <Tooltip title={dayjs(date).format('YYYY-MM-DD HH:mm:ss')}>
            <Text style={{ fontSize: 13, ...secondaryText }}>
              {dayjs(date).fromNow()}
            </Text>
          </Tooltip>
        ) : (
          <Text style={{ ...secondaryText }}>-</Text>
        ),
    },
    {
      title: t('components.table.columns.actions'),
      key: 'actions',
      width: 140,
      fixed: 'right',
      render: (_: unknown, record) => renderActions(record),
    },
  ];

  return (
    <Table<BenchmarkTableRecord>
      rowKey="id"
      columns={columns}
      dataSource={dataSource}
      loading={loading}
      onRow={(record) => ({
        onClick: () => handleRowClick(record),
        style: { cursor: 'pointer' },
      })}
      pagination={{
        showSizeChanger: true,
        showTotal: (total) => t('components.table.pagerTotal', { total }),
        pageSizeOptions: ['10', '20', '50', '100'],
        defaultPageSize: 20,
        ...tableProps.pagination,
      }}
      {...tableProps}
    />
  );
}

export default BenchmarkTable;
