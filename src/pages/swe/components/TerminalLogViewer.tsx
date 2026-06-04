/**
 * TerminalLogViewer - Terminal-style log viewer component
 * CRT scanline effect
 * Glow text effect
 * Blinking cursor when connected
 * Color-coded log levels
 */

import { memo, useMemo, useCallback, useRef, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Typography, Space, Switch } from 'antd';
import { BugOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '@/theme';
import { getSWETheme } from '../theme';
import type { SWETaskLog as SWETaskLogType } from '@/types';

const { Text } = Typography;

interface TerminalLogViewerProps {
  logs: SWETaskLogType[];
  loading?: boolean;
  autoScroll?: boolean;
  style?: React.CSSProperties;
  maxHeight?: number | string;
  isConnected?: boolean;
}

// Log level config
const LOG_LEVEL_CONFIG = {
  debug: {
    color: '#6e7681',
    icon: '··',
    label: 'DEBUG',
  },
  info: {
    color: '#58a6ff',
    icon: 'ℹ',
    label: 'INFO',
  },
  warn: {
    color: '#d29922',
    icon: '⚠',
    label: 'WARN',
  },
  error: {
    color: '#f85149',
    icon: '✖',
    label: 'ERROR',
  },
};

// Phase icon config
const PHASE_ICONS: Record<string, string> = {
  idle: '💤',
  cloning: '📥',
  setup: '⚙️',
  analyzing: '🔍',
  fixing: '🔧',
  testing: '🧪',
  verifying: '✅',
  completed: '✨',
  failed: '💥',
};

/**
 * Format time
 */
const formatTime = (date: Date): string => {
  const d = new Date(date);
  const hours = d.getHours().toString().padStart(2, '0');
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const seconds = d.getSeconds().toString().padStart(2, '0');
  const ms = d.getMilliseconds().toString().padStart(3, '0');
  return `${hours}:${minutes}:${seconds}.${ms}`;
};

/**
 * TerminalLogViewer component
 * rerender-memo: uses memo for performance
 */
export const TerminalLogViewer = memo(function TerminalLogViewer({
  logs,
  loading = false,
  autoScroll: initialAutoScroll = true,
  style,
  maxHeight = 600,
  isConnected = false,
}: TerminalLogViewerProps) {
  const { t } = useTranslation('swe');
  const isDark = useIsDark();
  const theme = getSWETheme(isDark);
  const [autoScroll, setAutoScroll] = useState(initialAutoScroll);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const rowVirtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => logContainerRef.current,
    estimateSize: () => 24,
    overscan: 10
  });

  // Auto-scroll to bottom
  useEffect(() => {
    if (autoScroll && logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logs, autoScroll]);

  const handleToggleAutoScroll = useCallback((checked: boolean) => {
    setAutoScroll(checked);
  }, []);

  // Terminal window style
  const terminalStyle = useMemo(() => ({
    position: 'relative' as const,
    background: isDark ? '#0d1117' : '#f5f5f5',
    border: `1px solid ${isDark ? 'rgba(139, 233, 253, 0.2)' : 'rgba(0,0,0,0.1)'}`,
    borderRadius: 8,
    overflow: 'hidden',
    fontFamily: '"Fira Code", "Consolas", "Monaco", monospace',
    ...style,
  }), [isDark, style]);

  // Terminal header style
  const headerStyle = useMemo(() => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    background: isDark ? '#161b22' : '#e9ecef',
    borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
  }), [isDark]);

  // Terminal body style
  const bodyStyle = useMemo(() => ({
    padding: 12,
    maxHeight,
    overflowY: 'auto' as React.CSSProperties['overflowY'],
    background: isDark ? '#0d1117' : '#f5f5f5',
    color: isDark ? '#e6edf3' : '#24292f',
    fontSize: 12,
    lineHeight: 1.6,
  }), [isDark, maxHeight]);

  // Scanline overlay style
  const scanlineStyle = useMemo(() => ({
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(transparent 50%, rgba(0, 0, 0, 0.1) 50%)',
    backgroundSize: '100% 4px',
    pointerEvents: 'none' as const,
    opacity: isDark ? 0.3 : 0,
    animation: isDark ? 'scanline 8s linear infinite' : 'none',
  }), [isDark]);

  // CRT flicker style
  const crtFlickerStyle = useMemo(() => ({
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none' as const,
    opacity: isDark ? 0.03 : 0,
    animation: isDark ? 'crtFlicker 0.15s infinite' : 'none',
    background: 'rgba(255, 255, 255, 0.02)',
  }), [isDark]);

  // Log entry style
  const getLogEntryStyle = useCallback((index: number) => ({
    padding: '4px 0',
    borderBottom: index < logs.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
    fontSize: 12,
    fontFamily: '"Fira Code", monospace',
    display: 'flex',
    gap: 8,
    alignItems: 'flex-start',
  }), [logs.length]);

  // Render log level tag
  const renderLevelTag = useCallback((level: keyof typeof LOG_LEVEL_CONFIG) => {
    const config = LOG_LEVEL_CONFIG[level];
    return (
      <span style={{
        fontSize: 10,
        padding: '1px 6px',
        borderRadius: 2,
        background: isDark ? `${config.color}20` : `${config.color}15`,
        color: config.color,
        fontWeight: 500,
        whiteSpace: 'nowrap',
      }}>
        {config.icon} {config.label}
      </span>
    );
  }, [isDark]);

  return (
    <div style={terminalStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <Space size={8}>
          <BugOutlined style={{ color: theme.syntaxVariable }} />
          <Text style={{ fontSize: 13, fontWeight: 500, color: theme.textPrimary }}>
            {t('terminalLog.executionLog')}
          </Text>
          <Text style={{ fontSize: 12, color: theme.textSecondary }}>
            {t('terminalLog.itemCount', { count: logs.length })}
          </Text>
          {isConnected && (
            <span style={{
              fontSize: 10,
              padding: '2px 6px',
              borderRadius: 4,
              background: 'rgba(80, 250, 123, 0.2)',
              color: theme.syntaxFunction,
              animation: 'neonPulse 2s ease-in-out infinite',
            }}>
              ● {t('terminalLog.live')}
            </span>
          )}
        </Space>
        <Space size={8}>
          <Text style={{ fontSize: 12, color: theme.textSecondary }}>
            {t('terminalLog.autoScroll')}
          </Text>
          <Switch
            size="small"
            checked={autoScroll}
            onChange={handleToggleAutoScroll}
          />
        </Space>
      </div>

      {/* Body */}
      <div ref={logContainerRef} style={bodyStyle} className="swe-terminal">
        {loading && logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: theme.textTertiary }}>
            <Text style={{ color: theme.textTertiary }}>
              {t('terminalLog.loadingLogs')}
            </Text>
          </div>
        ) : logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: theme.textTertiary }}>
            <Text style={{ color: theme.textTertiary }}>
              {t('terminalLog.noLogs')}
            </Text>
          </div>
        ) : (
          <>
            <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                  const index = virtualRow.index;
                  const log = logs[index];
                  const levelConfig = LOG_LEVEL_CONFIG[log.level] || LOG_LEVEL_CONFIG.info;
                  const phaseIcon = PHASE_ICONS[log.phase] || '';

                  return (
                    <div
                      key={log.id || index}
                      style={{
                        ...getLogEntryStyle(index),
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: `${virtualRow.size}px`,
                        transform: `translateY(${virtualRow.start}px)`
                      }}
                    >
                      
                  {/* Timestamp */}
                  <span style={{
                    color: theme.textTertiary,
                    fontSize: 11,
                    minWidth: 80,
                    userSelect: 'none',
                  }}>
                    {formatTime(log.timestamp)}
                  </span>

                  {/* Level tag */}
                  {renderLevelTag(log.level)}

                  {/* Phase icon */}
                  <span style={{ fontSize: 11 }}>
                    {phaseIcon}
                  </span>

                  {/* Log content */}
                  <span style={{
                    color: log.level === 'error' ? theme.statusFailed : levelConfig.color,
                    wordBreak: 'break-all',
                    flex: 1,
                  }}>
                    {log.message}
                  </span>
                
                    </div>
                  );
                })}
              </div>

            {/* Blinking cursor when connected */}
            {isConnected && (
              <div style={{
                padding: '4px 0',
                fontSize: 12,
                color: theme.syntaxFunction,
                animation: 'terminalCursor 1s infinite',
              }}>
                ❯
              </div>
            )}
          </>
        )}
      </div>

      {/* Scanline effect - dark mode only */}
      {isDark && <div style={scanlineStyle} />}

      {/* CRT flicker - dark mode only */}
      {isDark && <div style={crtFlickerStyle} />}

      {/* Inject global styles */}
      <style>{`
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes crtFlicker {
          0% { opacity: 0.97; }
          5% { opacity: 0.95; }
          10% { opacity: 0.9; }
          15% { opacity: 0.95; }
          20% { opacity: 0.99; }
          100% { opacity: 0.97; }
        }
        @keyframes terminalCursor {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        @keyframes neonPulse {
          0%, 100% {
            box-shadow: 0 0 5px rgba(80, 250, 123, 0.5);
          }
          50% {
            box-shadow: 0 0 15px rgba(80, 250, 123, 0.8), 0 0 25px rgba(80, 250, 123, 0.5);
          }
        }
        .swe-terminal::-webkit-scrollbar {
          width: 6px;
        }
        .swe-terminal::-webkit-scrollbar-track {
          background: #0d1117;
        }
        .swe-terminal::-webkit-scrollbar-thumb {
          background: rgba(139, 233, 253, 0.3);
          border-radius: 3px;
        }
        .swe-terminal::-webkit-scrollbar-thumb:hover {
          background: rgba(139, 233, 253, 0.5);
        }
      `}</style>
    </div>
  );
}, (prev, next) => {
  // Custom comparison fn
  return (
    prev.logs.length === next.logs.length &&
    prev.loading === next.loading &&
    prev.isConnected === next.isConnected &&
    prev.autoScroll === next.autoScroll
  );
});

export default TerminalLogViewer;
