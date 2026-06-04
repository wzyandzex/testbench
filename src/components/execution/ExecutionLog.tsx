/**
 * Execution log component
 * Displays execution log entries.
 * Theme-aware: light mode uses light-gray background; dark mode uses slightly darker gray.
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Typography, Tag, Space, Button, Select, Empty, Spin } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  CopyOutlined,
  DownOutlined,
  UpOutlined,
} from '@ant-design/icons';
import { useThemeTokens, useIsDark } from '@/theme';
import dayjs from 'dayjs';

const { Text } = Typography;

type LogLevel = 'info' | 'success' | 'warning' | 'error' | 'debug';

export interface ExecutionLog {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface ExecutionLogProps {
  logs: ExecutionLog[];
  loading?: boolean;
  autoScroll?: boolean;
  maxHeight?: number;
  onRetry?: () => void;
}

/**
 * Log line component
 */
interface LogLineProps {
  log: ExecutionLog;
  levelConfig: Record<LogLevel, { color: string; icon: React.ReactNode; text: string }>;
  copyLabel: string;
}

function LogLine({ log, levelConfig, copyLabel }: LogLineProps) {
  const tokens = useThemeTokens();
  const config = levelConfig[log.level];

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(log.message);
  }, [log.message]);

  return (
    <div
      style={{
        padding: '6px 0',
        borderBottom: `1px solid ${tokens.border.default}`,
        fontFamily: 'SFMono-Regular, Consolas, "Liberation Mono", Menlo, monospace',
        fontSize: 13,
        lineHeight: 1.6,
      }}
    >
      <Space size={8} style={{ display: 'flex', alignItems: 'flex-start' }}>
        <Text style={{ color: tokens.text.tertiary, fontSize: 12, minWidth: 140 }}>
          {dayjs(log.timestamp).format('HH:mm:ss.SSS')}
        </Text>

        <Tag
          icon={config.icon}
          style={{
            margin: 0,
            padding: '0 6px',
            borderRadius: 4,
            fontSize: 11,
            border: 'none',
            background: `${config.color}15`,
            color: config.color,
            minWidth: 70,
            textAlign: 'center',
          }}
        >
          {config.text}
        </Tag>

        <Text
          style={{
            color: config.color,
            flex: 1,
            wordBreak: 'break-all',
            whiteSpace: 'pre-wrap',
          }}
        >
          {log.message}
        </Text>

        <Button
          type="text"
          size="small"
          icon={<CopyOutlined />}
          onClick={handleCopy}
          style={{ fontSize: 12, color: tokens.text.tertiary }}
        >
          {copyLabel}
        </Button>
      </Space>
    </div>
  );
}

/**
 * Execution log component
 */
export function ExecutionLog({
  logs,
  loading = false,
  autoScroll = true,
  maxHeight = 400,
  onRetry,
}: ExecutionLogProps) {
  const { t } = useTranslation('executions');
  const tokens = useThemeTokens();
  const isDark = useIsDark();
  const containerRef = useRef<HTMLDivElement>(null);
  const [filterLevel, setFilterLevel] = useState<LogLevel | 'all'>('all');
  const [expanded, setExpanded] = useState(true);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && expanded && containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [logs, autoScroll, expanded]);

  // Filter logs by level
  const filteredLogs = useMemo(() => {
    if (filterLevel === 'all') return logs;
    return logs.filter((log) => log.level === filterLevel);
  }, [logs, filterLevel]);

  // Log stats
  const stats = useMemo(() => {
    return {
      total: logs.length,
      info: logs.filter((l) => l.level === 'info').length,
      success: logs.filter((l) => l.level === 'success').length,
      warning: logs.filter((l) => l.level === 'warning').length,
      error: logs.filter((l) => l.level === 'error').length,
      debug: logs.filter((l) => l.level === 'debug').length,
    };
  }, [logs]);

  // Compute colors from current theme
  const levelConfig = useMemo<Record<LogLevel, { color: string; icon: React.ReactNode; text: string }>>(
    () => ({
      info: {
        color: tokens.status.info,
        icon: <InfoCircleOutlined />,
        text: 'INFO',
      },
      success: {
        color: tokens.status.success,
        icon: <CheckCircleOutlined />,
        text: 'SUCCESS',
      },
      warning: {
        color: tokens.status.warning,
        icon: <ExclamationCircleOutlined />,
        text: 'WARN',
      },
      error: {
        color: tokens.status.error,
        icon: <CloseCircleOutlined />,
        text: 'ERROR',
      },
      debug: {
        color: tokens.text.tertiary,
        icon: <LoadingOutlined />,
        text: 'DEBUG',
      },
    }),
    [tokens.status.info, tokens.status.success, tokens.status.warning, tokens.status.error, tokens.text.tertiary]
  );

  // Log container background — light gray in light mode, slightly darker gray in dark mode
  const logBackground = isDark ? 'rgba(30, 30, 30, 0.8)' : '#f5f5f5';
  const toolbarBackground = isDark ? 'rgba(45, 45, 45, 0.9)' : '#e8e8e8';
  const borderColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)';

  // Toggle expanded/collapsed
  const toggleExpanded = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  return (
    <div
      style={{
        background: logBackground,
        borderRadius: 8,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Toolbar */}
      <div
        style={{
          padding: '8px 12px',
          borderBottom: `1px solid ${borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: toolbarBackground,
        }}
      >
        <Space size={12}>
          <Text style={{ color: tokens.text.tertiary, fontSize: 12 }}>
            {t('components.log.totalCount', { count: stats.total })}
          </Text>
          <Select
            value={filterLevel}
            onChange={setFilterLevel}
            size="small"
            style={{ width: 100 }}
            options={[
              { label: t('components.log.levelFilter.all'), value: 'all' },
              { label: t('components.log.levelFilter.info'), value: 'info' },
              { label: t('components.log.levelFilter.success'), value: 'success' },
              { label: t('components.log.levelFilter.warning'), value: 'warning' },
              { label: t('components.log.levelFilter.error'), value: 'error' },
              { label: t('components.log.levelFilter.debug'), value: 'debug' },
            ]}
          />
        </Space>
        <Space size={8}>
          {onRetry && (
            <Button size="small" onClick={onRetry}>
              {t('components.log.retry')}
            </Button>
          )}
          <Button
            type="text"
            size="small"
            icon={expanded ? <UpOutlined /> : <DownOutlined />}
            onClick={toggleExpanded}
            style={{ color: tokens.text.tertiary }}
          >
            {expanded ? t('components.log.collapse') : t('components.log.expand')}
          </Button>
        </Space>
      </div>

      {/* Log content */}
      <div
        ref={containerRef}
        style={{
          padding: '8px 12px',
          maxHeight: expanded ? maxHeight : 60,
          overflowY: 'auto',
          transition: 'max-height 0.3s ease',
          background: logBackground,
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Spin tip={t('components.log.loading')} />
          </div>
        ) : filteredLogs.length === 0 ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            imageStyle={{ opacity: 0.3 }}
            description={logs.length === 0 ? t('components.log.empty') : t('components.log.noMatch')}
            style={{ padding: 40 }}
          />
        ) : (
          filteredLogs.map((log, index) => (
            <LogLine key={`${log.id}-${index}`} log={log} levelConfig={levelConfig} copyLabel={t('components.log.copy')} />
          ))
        )}
      </div>

      {/* Status bar */}
      <div
        style={{
          padding: '4px 12px',
          borderTop: `1px solid ${borderColor}`,
          background: toolbarBackground,
          display: 'flex',
          gap: 16,
        }}
      >
        {Object.entries(stats).map(([key, count]) => {
          if (key === 'total') return null;
          const cfg = levelConfig[key as LogLevel];
          return (
            <span
              key={key}
              style={{
                fontSize: 11,
                color: count > 0 ? cfg.color : tokens.text.disabled,
              }}
            >
              {cfg.text}: {count}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export default ExecutionLog;
