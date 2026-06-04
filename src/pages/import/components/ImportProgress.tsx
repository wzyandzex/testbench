/**
 * ImportProgress component
 * Import progress display
 */

import { memo, useState, useEffect, useRef } from 'react';
import { Progress, Button, Collapse } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  MinusCircleOutlined,
  PlayCircleOutlined,
  PauseCircleOutlined,
  DownOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import type { ImportTask, ImportTaskStatus } from '../service';
import { getStatusText } from '../service';

interface ImportProgressProps {
  task: ImportTask;
  onCancel?: () => void;
  onRetry?: () => void;
  showLogs?: boolean;
}

// Log 条目类型
interface LogEntry {
  timestamp: string;
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

// Mock log generator
function generateMockLogs(task: ImportTask): LogEntry[] {
  const logs: LogEntry[] = [];
  const { progress, result, status } = task;

  logs.push({
    timestamp: new Date(task.createdAt).toISOString(),
    level: 'info',
    message: i18next.t('import:progress.logStart', { type: task.datasetType }),
  });

  if (status === 'running' || status === 'completed') {
    logs.push({
      timestamp: new Date(task.updatedAt).toISOString(),
      level: 'info',
      message: i18next.t('import:progress.logProcessing', { current: progress.current, total: progress.total }),
    });
  }

  if (status === 'completed' && result) {
    logs.push({
      timestamp: new Date(task.completedAt || task.updatedAt).toISOString(),
      level: 'success',
      message: i18next.t('import:progress.logComplete', { success: result.success, failed: result.failed, skipped: result.skipped }),
    });
  }

  if (status === 'failed') {
    logs.push({
      timestamp: new Date(task.updatedAt).toISOString(),
      level: 'error',
      message: task.error || i18next.t('import:progress.logFailed'),
    });
  }

  return logs;
}

export const ImportProgress = memo(function ImportProgress({
  task,
  onCancel,
  onRetry,
  showLogs = true,
}: ImportProgressProps) {
  const { t } = useTranslation('import');
  const [logsExpanded, setLogsExpanded] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const prevStatusRef = useRef<ImportTaskStatus>(task.status);

  // 监听任务状态变化
  useEffect(() => {
    if (prevStatusRef.current !== task.status) {
      prevStatusRef.current = task.status;
      setLogs(generateMockLogs(task));
    }
  }, [task.status, task]);

  // 初始化日志
  useEffect(() => {
    setLogs(generateMockLogs(task));
  }, [task.id]);

  const { progress, result, status } = task;
  const percentage = progress.percentage;
  const statusText = getStatusText(status);

  const getStatusIcon = () => {
    switch (status) {
      case 'pending':
        return <MinusCircleOutlined style={{ color: 'var(--import-text-tertiary)' }} />;
      case 'running':
        return <PlayCircleOutlined spin style={{ color: '#1677ff' }} />;
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#10b981' }} />;
      case 'failed':
        return <CloseCircleOutlined style={{ color: '#ef4444' }} />;
      case 'cancelled':
        return <PauseCircleOutlined style={{ color: 'var(--import-text-tertiary)' }} />;
    }
  };

  const getProgressStatus = (): 'success' | 'exception' | 'active' | 'normal' => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'failed':
      case 'cancelled':
        return 'exception';
      case 'running':
        return 'active';
      default:
        return 'normal';
    }
  };

  const canCancel = status === 'pending' || status === 'running';
  const canRetry = status === 'failed' || status === 'cancelled';

  return (
    <div style={{
      background: 'var(--import-card-bg)',
      border: '1px solid var(--import-card-border)',
      borderRadius: 12,
      padding: 20,
    }}>
      {/* 头部：状态和进度 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        {getStatusIcon()}
        <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--import-text)' }}>
          {statusText}
        </span>
        <span style={{ flex: 1 }} />
        {canCancel && onCancel && (
          <Button size="small" onClick={onCancel} danger>
            {t('progress.cancel')}
          </Button>
        )}
        {canRetry && onRetry && (
          <Button size="small" type="primary" onClick={onRetry}>
            {t('progress.retry')}
          </Button>
        )}
      </div>

      {/* Progress bar */}
      <div className="import-progress-bar">
        <div className="progress-header">
          <span className="progress-label">
            {status === 'running' ? t('progress.importing') : t('progress.progress')}
          </span>
          <span className="progress-percentage">{percentage}%</span>
        </div>
        <Progress
          percent={percentage}
          status={getProgressStatus()}
          strokeColor={{
            '0%': '#667eea',
            '100%': '#764ba2',
          }}
          showInfo={false}
          strokeWidth={6}
        />
        <div className="progress-stats">
          <span className="progress-stat">
            📊 {progress.current} / {progress.total}
          </span>
          {result && (
            <>
              <span className="progress-stat success">
                ✓ {result.success}
              </span>
              {result.failed > 0 && (
                <span className="progress-stat failed">
                  ✗ {result.failed}
                </span>
              )}
              {result.skipped > 0 && (
                <span className="progress-stat skipped">
                  ⊘ {result.skipped}
                </span>
              )}
            </>
          )}
        </div>
      </div>

      {/* 日志区域 */}
      {showLogs && logs.length > 0 && (
        <Collapse
          ghost
          activeKey={logsExpanded ? 'logs' : undefined}
          onChange={(keys) => setLogsExpanded(keys.includes('logs'))}
          style={{ marginTop: 16 }}
          expandIcon={({ isActive }) => (
            <DownOutlined
              style={{
                fontSize: 12,
                color: 'var(--import-text-secondary)',
                transform: isActive ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            />
          )}
          items={[
            {
              key: 'logs',
              label: (
                <span style={{ fontSize: 13, color: 'var(--import-text-secondary)' }}>
                  <CodeOutlined style={{ marginRight: 6 }} />
                  {t('progress.logsLabel')} ({logs.length})
                </span>
              ),
              children: (
                <div style={{
                  background: 'rgba(0, 0, 0, 0.03)',
                  borderRadius: 8,
                  padding: 12,
                  maxHeight: 200,
                  overflowY: 'auto',
                  fontFamily: 'monospace',
                  fontSize: 12,
                }}>
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      style={{
                        marginBottom: 4,
                        color: log.level === 'error' ? '#ef4444' :
                               log.level === 'success' ? '#10b981' :
                               log.level === 'warning' ? '#f59e0b' :
                               'var(--import-text-secondary)',
                      }}
                    >
                      <span style={{ opacity: 0.6 }}>
                        [{new Date(log.timestamp).toLocaleTimeString()}]
                      </span>
                      {' '}
                      {log.message}
                    </div>
                  ))}
                </div>
              ),
            },
          ]}
        />
      )}
    </div>
  );
});
