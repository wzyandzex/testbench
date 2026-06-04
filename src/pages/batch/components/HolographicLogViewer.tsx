/**
 * 全息日志查看器组件
 * 带扫描线效果、颜色编码日志级别、自动滚动
 * 支持深色模式赛博科技风格
 */

import { useMemo, memo, useRef, useEffect, CSSProperties } from 'react';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '@/theme';
import { getBatchTheme } from '../theme';
import dayjs from 'dayjs';

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';

export interface LogEntry {
  id: string;
  level: LogLevel;
  message: string;
  timestamp: Date | string;
  itemId?: string;
}

interface HolographicLogViewerProps {
  logs: LogEntry[];
  maxHeight?: number;
  autoScroll?: boolean;
  highlightNew?: boolean;
}

// ✅ rendering-hoist-jsx: 提取静态配置
const LOG_LEVEL_CONFIG = {
  info: { label: 'INFO', color: '#00d4ff', icon: 'ℹ️' },
  warn: { label: 'WARN', color: '#f59e0b', icon: '⚠️' },
  error: { label: 'ERROR', color: '#ff4466', icon: '❌' },
  debug: { label: 'DEBUG', color: '#9ca3af', icon: '🔍' },
} as const;

/**
 * 单个日志行组件
 */
const LogLine = memo(function LogLine({
  log,
  isNew,
}: {
  log: LogEntry;
  isNew?: boolean;
}) {
  const isDark = useIsDark();
  const theme = getBatchTheme(isDark);
  const config = LOG_LEVEL_CONFIG[log.level];

  const lineStyle = useMemo((): CSSProperties => ({
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    padding: '6px 8px',
    fontSize: 12,
    lineHeight: 1.6,
    fontFamily: 'monospace',
    borderRadius: 4,
    transition: 'background 0.3s',
    ...(isNew && isDark && {
      animation: 'flashHighlight 1s ease-out',
    }),
  }), [isNew, isDark]);

  const timestampStyle = useMemo((): CSSProperties => ({
    color: theme.textTertiary,
    fontSize: 11,
    minWidth: 80,
  }), [theme.textTertiary]);

  const levelStyle = useMemo((): CSSProperties => ({
    color: config.color,
    fontWeight: 600,
    fontSize: 11,
    minWidth: 50,
  }), [config.color]);

  const itemIdStyle = useMemo((): CSSProperties => ({
    color: theme.neonPurple,
    fontSize: 11,
  }), [theme.neonPurple]);

  const messageStyle = useMemo((): CSSProperties => ({
    color: log.level === 'error' ? theme.neonRed : theme.textSecondary,
    flex: 1,
    wordBreak: 'break-word' as const,
  }), [log.level, theme.neonRed, theme.textSecondary]);

  const formattedTime = useMemo(() => {
    const date = typeof log.timestamp === 'string' ? dayjs(log.timestamp) : dayjs(log.timestamp);
    return date.format('HH:mm:ss.SSS');
  }, [log.timestamp]);

  return (
    <div className="log-line" style={lineStyle}>
      <span style={timestampStyle}>[{formattedTime}]</span>
      <span style={levelStyle}>[{config.label}]</span>
      {log.itemId && (
        <span style={itemIdStyle}>[Item: {log.itemId.slice(0, 8)}]</span>
      )}
      <span style={messageStyle}>{log.message}</span>
    </div>
  );
}, (prev, next) => {
  return prev.log.id === next.log.id;
});

/**
 * 全息日志查看器
 * ✅ rerender-memo: 使用 memo 优化性能
 */
export const HolographicLogViewer = memo(function HolographicLogViewer({
  logs,
  maxHeight = 400,
  autoScroll = true,
  highlightNew = true,
}: HolographicLogViewerProps) {
  const isDark = useIsDark();
  const { t } = useTranslation('batch');
  const theme = getBatchTheme(isDark);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLogCountRef = useRef(0);

  // 容器样式
  const containerStyle = useMemo((): CSSProperties => ({
    position: 'relative',
    background: isDark ? '#0d0d12' : '#1e1e1e',
    border: `1px solid ${isDark ? 'rgba(0, 212, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
    borderRadius: isDark ? 0 : 8,
    padding: 16,
    maxHeight,
    overflow: 'auto',
    ...(isDark && {
      boxShadow: 'inset 0 0 40px rgba(0, 0, 0, 0.5)',
    }),
  }), [isDark, maxHeight]);

  // 扫描线效果样式
  const scanlineStyle = useMemo((): CSSProperties => ({
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '100%',
    background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 212, 255, 0.03) 2px, rgba(0, 212, 255, 0.03) 4px)',
    pointerEvents: 'none',
  }), []);

  // 自动滚动到底部
  useEffect(() => {
    if (autoScroll && containerRef.current) {
      const container = containerRef.current;
      const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 100;

      // 如果用户在底部附近，或者有新日志，则自动滚动
      if (isNearBottom || logs.length > prevLogCountRef.current) {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: logs.length > prevLogCountRef.current ? 'smooth' : 'auto',
        });
      }

      prevLogCountRef.current = logs.length;
    }
  }, [logs, autoScroll]);

  // 空状态
  if (!logs || logs.length === 0) {
    const emptyStyle: CSSProperties = {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 60,
      color: theme.textTertiary,
    };

    return (
      <div style={containerStyle}>
        <div style={emptyStyle}>
          <span style={{ fontSize: 48, marginBottom: 16, opacity: 0.5 }}>📡</span>
          <span style={{ fontSize: 14 }}>{t('log.noLogs')}</span>
        </div>
        {isDark && <div style={scanlineStyle} />}
      </div>
    );
  }

  return (
    <div ref={containerRef} style={containerStyle}>
      {/* 扫描线效果 */}
      {isDark && <div style={scanlineStyle} />}

      {/* 日志行 */}
      {logs.map((log, index) => (
        <LogLine
          key={log.id}
          log={log}
          isNew={highlightNew && index >= prevLogCountRef.current}
        />
      ))}

      {/* 注入动画 */}
      {isDark && (
        <style>{`
          @keyframes flashHighlight {
            0% { background: rgba(0, 212, 255, 0.2); }
            100% { background: transparent; }
          }

          /* 滚动条样式 */
          ::-webkit-scrollbar {
            width: 6px;
          }

          ::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 3px;
          }

          ::-webkit-scrollbar-thumb {
            background: rgba(0, 212, 255, 0.3);
            border-radius: 3px;
          }

          ::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 212, 255, 0.5);
          }
        `}</style>
      )}
    </div>
  );
}, (prev, next) => {
  // 比较：只在日志数量或最后一个日志变化时重渲染
  return (
    prev.logs.length === next.logs.length &&
    prev.logs[prev.logs.length - 1]?.id === next.logs[next.logs.length - 1]?.id
  );
});

export default HolographicLogViewer;
