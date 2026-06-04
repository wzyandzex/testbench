/**
 * SWE task log viewer
 */

import { Card, Typography, Space, Tag, Switch } from 'antd';
import {
  FileTextOutlined,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { SWETaskLog as SWETaskLogType } from '@/types';

const { Text } = Typography;

interface SWETaskLogProps {
  logs: SWETaskLogType[];
  loading?: boolean;
  autoScroll?: boolean;
  style?: React.CSSProperties;
  maxHeight?: number | string;
}

// Log level config
const LOG_LEVEL_CONFIG = {
  debug: {
    color: '#8c8c8c',
    icon: <InfoCircleOutlined />,
    label: 'DEBUG',
  },
  info: {
    color: '#1890ff',
    icon: <InfoCircleOutlined />,
    label: 'INFO',
  },
  warn: {
    color: '#faad14',
    icon: <ExclamationCircleOutlined />,
    label: 'WARN',
  },
  error: {
    color: '#ff4d4f',
    icon: <ExclamationCircleOutlined />,
    label: 'ERROR',
  },
};

// Phase color
const PHASE_COLORS: Record<string, string> = {
  idle: '#d9d9d9',
  cloning: '#1890ff',
  setup: '#52c41a',
  analyzing: '#722ed1',
  fixing: '#fa8c16',
  testing: '#13c2c2',
  verifying: '#eb2f96',
  completed: '#52c41a',
  failed: '#ff4d4f',
};

export const SWETaskLog = ({
  logs,
  loading = false,
  autoScroll: initialAutoScroll = true,
  style,
  maxHeight = 400,
}: SWETaskLogProps) => {
  const { t } = useTranslation('swe');
  const [autoScroll, setAutoScroll] = useState(initialAutoScroll);
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  // Format time
  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString(undefined, { hour12: false });
  };

  return (
    <Card
      size="small"
      title={
        <Space>
          <FileTextOutlined />
          <Text>{t('terminalLog.executionLog')}</Text>
          <Text type="secondary">{t('terminalLog.itemCount', { count: logs.length })}</Text>
        </Space>
      }
      extra={
        <Space>
          <Text style={{ fontSize: 12 }}>{t('terminalLog.autoScroll')}</Text>
          <Switch
            size="small"
            checked={autoScroll}
            onChange={setAutoScroll}
          />
        </Space>
      }
      style={style}
      styles={{
        body: {
          padding: 0,
        },
      }}
    >
      <div
        ref={logContainerRef}
        style={{
          maxHeight,
          overflowY: 'auto',
          background: '#1f1f1f',
          padding: 12,
          fontFamily: 'monospace',
          fontSize: 12,
        }}
      >
        {loading && logs.length === 0 ? (
          <Text style={{ color: '#8c8c8c' }}>{t('terminalLog.loadingLogs')}</Text>
        ) : logs.length === 0 ? (
          <Text style={{ color: '#8c8c8c' }}>{t('terminalLog.noLogs')}</Text>
        ) : (
          logs.map((log, index) => {
            const levelConfig = LOG_LEVEL_CONFIG[log.level];
            const phaseColor = PHASE_COLORS[log.phase] || '#d9d9d9';

            return (
              <div
                key={log.id || index}
                style={{
                  marginBottom: 4,
                  paddingBottom: 4,
                  borderBottom:
                    index < logs.length - 1 ? '1px solid #333' : 'none',
                }}
              >
                <Space size={4}>
                  {/* Timestamp */}
                  <Text style={{ color: '#8c8c8c', fontSize: 11 }}>
                    {formatTime(log.timestamp)}
                  </Text>

                  {/* Level tag */}
                  <Tag
                    style={{
                      margin: 0,
                      fontSize: 10,
                      padding: '0 4px',
                      lineHeight: '16px',
                      border: `1px solid ${levelConfig.color}`,
                      color: levelConfig.color,
                      background: 'transparent',
                    }}
                  >
                    {levelConfig.label}
                  </Tag>

                  {/* Phase tag */}
                  <Tag
                    style={{
                      margin: 0,
                      fontSize: 10,
                      padding: '0 4px',
                      lineHeight: '16px',
                      background: phaseColor,
                      color: '#fff',
                      border: 'none',
                    }}
                  >
                    {log.phase}
                  </Tag>

                  {/* Log content */}
                  <Text style={{ color: '#e8e8e8', wordBreak: 'break-all' }}>
                    {log.message}
                  </Text>
                </Space>

                {/* Metadata */}
                {log.metadata && Object.keys(log.metadata).length > 0 && (
                  <div style={{ marginLeft: 120, marginTop: 2 }}>
                    <Text style={{ color: '#8c8c8c', fontSize: 11 }}>
                      {JSON.stringify(log.metadata)}
                    </Text>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};

export default SWETaskLog;
