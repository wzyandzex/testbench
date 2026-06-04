/**
 * SWE task card component
 */

import { Card, Tag, Progress, Typography, Space, Button } from 'antd';
import {
  ClockCircleOutlined,
  GitlabOutlined,
  ExclamationCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  StopOutlined,
  RightOutlined,
} from '@ant-design/icons';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import type { SWEBenchTask } from '@/types';

const { Text, Paragraph } = Typography;

interface SWETaskCardProps {
  task: SWEBenchTask;
  onClick?: () => void;
}

// Status config — label uses getter for runtime i18n
const STATUS_CONFIG = {
  pending: {
    color: 'default',
    icon: <ClockCircleOutlined />,
    get label() { return i18next.t('swe:status.pending'); },
  },
  running: {
    color: 'processing',
    icon: <SyncOutlined spin />,
    get label() { return i18next.t('swe:status.running'); },
  },
  completed: {
    color: 'success',
    icon: <CheckCircleOutlined />,
    get label() { return i18next.t('swe:status.completed'); },
  },
  failed: {
    color: 'error',
    icon: <ExclamationCircleOutlined />,
    get label() { return i18next.t('swe:status.failed'); },
  },
  cancelled: {
    color: 'default',
    icon: <StopOutlined />,
    get label() { return i18next.t('swe:status.cancelled'); },
  },
};

// Phase config — label uses getter for runtime i18n
const PHASE_CONFIG: Record<string, { label: string; color: string }> = {
  idle: { color: '#d9d9d9', get label() { return i18next.t('swe:card.phaseLabels.idle'); } },
  cloning: { color: '#1890ff', get label() { return i18next.t('swe:card.phaseLabels.cloning'); } },
  setup: { color: '#52c41a', get label() { return i18next.t('swe:card.phaseLabels.setup'); } },
  analyzing: { color: '#722ed1', get label() { return i18next.t('swe:card.phaseLabels.analyzing'); } },
  fixing: { color: '#fa8c16', get label() { return i18next.t('swe:card.phaseLabels.fixing'); } },
  testing: { color: '#13c2c2', get label() { return i18next.t('swe:card.phaseLabels.testing'); } },
  verifying: { color: '#eb2f96', get label() { return i18next.t('swe:card.phaseLabels.verifying'); } },
  completed: { color: '#52c41a', get label() { return i18next.t('swe:card.phaseLabels.completed'); } },
  failed: { color: '#ff4d4f', get label() { return i18next.t('swe:card.phaseLabels.failed'); } },
};

export const SWETaskCard = ({ task, onClick }: SWETaskCardProps) => {
  const { t } = useTranslation('swe');
  const statusConfig = STATUS_CONFIG[task.status];
  const phaseConfig = PHASE_CONFIG[task.currentPhase] || PHASE_CONFIG.idle;

  // Format repo name
  const repoName = task.repoName || task.repoUrl.split('/').pop() || 'unknown';

  // Format duration
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '-';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  return (
    <Card
      hoverable
      onClick={onClick}
      style={{
        borderRadius: 8,
        transition: 'all 0.2s',
        cursor: onClick ? 'pointer' : 'default',
      }}
      styles={{
        body: { padding: 16 },
      }}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        {/* Header: status + repo name */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Space>
            <Tag icon={statusConfig.icon} color={statusConfig.color as any}>
              {statusConfig.label}
            </Tag>
            <Tag icon={<GitlabOutlined />} color="blue">
              {repoName}
            </Tag>
          </Space>
          {onClick && (
            <Button type="text" size="small" icon={<RightOutlined />} />
          )}
        </div>

        {/* Issue info */}
        <div>
          <Text strong style={{ fontSize: 14 }}>
            #{task.issueNumber} {task.issueTitle || t('task.unnamedIssue')}
          </Text>
          {task.repoUrl && (
            <Paragraph
              ellipsis
              style={{
                margin: 0,
                fontSize: 12,
                color: '#8c8c8c',
              }}
            >
              {task.repoUrl}
            </Paragraph>
          )}
        </div>

        {/* Progress bar */}
        {task.status === 'running' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 12, color: phaseConfig.color }}>
                {phaseConfig.label}
              </Text>
              <Text style={{ fontSize: 12 }}>{task.progress}%</Text>
            </div>
            <Progress
              percent={task.progress}
              size="small"
              strokeColor={phaseConfig.color}
              showInfo={false}
            />
          </div>
        )}

        {/* Footer info */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size="small">
            <Text style={{ fontSize: 12, color: '#8c8c8c' }}>
              {t('card.agentLabel')}: {task.agent?.name || '-'}
            </Text>
            <Text style={{ fontSize: 12, color: '#8c8c8c' }}>
              {t('card.strategyLabel')}: {task.testStrategy}
            </Text>
          </Space>
          {task.duration && (
            <Text style={{ fontSize: 12, color: '#8c8c8c' }}>
              {formatDuration(task.duration)}
            </Text>
          )}
        </div>

        {/* Test result */}
        {task.testResult && task.status === 'completed' && (
          <div style={{
            display: 'flex',
            gap: 12,
            padding: '8px 12px',
            background: '#f5f5f5',
            borderRadius: 4,
          }}>
            <Text style={{ fontSize: 12 }}>
              {t('card.testsLabel')}: {task.testResult.passedTests}/{task.testResult.totalTests} {t('tile.testsPassed')}
            </Text>
            <Text style={{ fontSize: 12, color: task.testResult.passRate >= 80 ? '#52c41a' : '#faad14' }}>
              {t('card.passRate')}: {task.testResult.passRate.toFixed(1)}%
            </Text>
          </div>
        )}

        {/* Error info */}
        {task.status === 'failed' && task.error && (
          <Text
            ellipsis
            style={{
              fontSize: 12,
              color: '#ff4d4f',
            }}
          >
            {task.error}
          </Text>
        )}

        {/* Fix attempts */}
        {task.fixAttempts > 0 && (
          <Tag style={{ margin: 0 }} color="orange">
            {t('card.fixedTimes', { count: task.fixAttempts })}
          </Tag>
        )}
      </Space>
    </Card>
  );
};

export default SWETaskCard;
