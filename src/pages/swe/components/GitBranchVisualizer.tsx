/**
 * GitBranchVisualizer - Git branch visualization
 * Git-style timeline, commit nodes, diff stats
 */

import { memo, useMemo } from 'react';
import { Typography, Space } from 'antd';
import {
  CheckCircleOutlined,
  CloseCircleOutlined,
  BranchesOutlined,
  PlusOutlined,
  MinusOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '@/theme';
import { getSWETheme, getPhaseColor } from '../theme';
import { SWEFixAttempt } from '@/types';
import dayjs from 'dayjs';

const { Text } = Typography;

interface GitBranchVisualizerProps {
  fixHistory: SWEFixAttempt[];
  currentPhase?: string;
}

/**
 * Format duration
 */
const formatDuration = (started: Date, completed?: Date): string => {
  const start = dayjs(started);
  const end = completed ? dayjs(completed) : dayjs();
  const diff = end.diff(start, 'second');

  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`;
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`;
};

/**
 * GitBranchVisualizer component
 * rerender-memo: uses memo for performance
 */
export const GitBranchVisualizer = memo(function GitBranchVisualizer({
  fixHistory,
}: GitBranchVisualizerProps) {
  const { t } = useTranslation('swe');
  const isDark = useIsDark();
  const theme = getSWETheme(isDark);

  const containerStyle = useMemo(() => ({
    position: 'relative' as const,
    padding: '16px 0',
  }), []);

  const timelineStyle = useMemo(() => ({
    position: 'absolute' as const,
    left: 11,
    top: 16,
    bottom: 16,
    width: 2,
    background: isDark ? 'rgba(139, 233, 253, 0.2)' : 'rgba(0,0,0,0.1)',
  }), [isDark]);

  // Commit node style helper
  const getCommitNodeStyle = (active: boolean) => ({
    position: 'relative' as const,
    display: 'flex',
    gap: 16,
    paddingBottom: active ? 20 : 0,
  });

  // Node dot style helper
  const getNodeDotStyle = (success: boolean, active: boolean) => ({
    width: 24,
    height: 24,
    borderRadius: '50%',
    background: success
      ? theme.syntaxFunction
      : theme.statusFailed,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    zIndex: 1,
    ...(isDark && {
      boxShadow: success
        ? `0 0 15px ${theme.syntaxFunction}60`
        : `0 0 15px ${theme.statusFailed}60`,
      border: `2px solid ${success ? theme.syntaxFunction : theme.statusFailed}`,
    }),
    ...(active && !success && {
      animation: 'neonPulse 2s ease-in-out infinite',
    }),
  });

  const nodeContentStyle = useMemo(() => ({
    flex: 1,
    padding: '12px 16px',
    background: isDark ? 'rgba(22, 27, 34, 0.8)' : '#fff',
    border: `1px solid ${isDark ? 'rgba(139, 233, 253, 0.2)' : 'rgba(0,0,0,0.08)'}`,
    borderRadius: isDark ? 0 : 8,
    ...(isDark && {
      backdropFilter: 'blur(10px)',
      clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)',
    }),
  }), [isDark]);

  const diffStatsStyle = useMemo(() => ({
    display: 'flex',
    gap: 12,
    marginTop: 8,
    padding: '8px 12px',
    background: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.03)',
    borderRadius: 4,
    fontFamily: '"Fira Code", monospace',
    fontSize: 11,
  }), [isDark]);

  if (!fixHistory || fixHistory.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: 40,
        color: theme.textTertiary,
      }}>
        <BranchesOutlined style={{ fontSize: 32, marginBottom: 8 }} />
        <div>{t('gitBranch.noHistory')}</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      {/* Timeline */}
      <div style={timelineStyle} />

      {/* Commit nodes */}
      {fixHistory.map((attempt, index) => {
        const isLast = index === fixHistory.length - 1;
        const isSuccess = attempt.success;
        const isActive = !isLast && !isSuccess;

        return (
          <div key={attempt.attemptNumber} style={getCommitNodeStyle(isActive)}>
            {/* Node dot */}
            <div style={getNodeDotStyle(isSuccess, isActive)}>
              {isSuccess ? (
                <CheckCircleOutlined style={{ color: '#fff', fontSize: 12 }} />
              ) : (
                <CloseCircleOutlined style={{ color: '#fff', fontSize: 12 }} />
              )}
            </div>

            {/* Node content */}
            <div style={nodeContentStyle}>
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Space size={8}>
                  <Text style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: theme.textPrimary,
                  }}>
                    commit {attempt.attemptNumber}: {attempt.phase.toUpperCase()}
                  </Text>
                  <span style={{
                    fontSize: 10,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: `${getPhaseColor(attempt.phase, isDark)}20`,
                    color: getPhaseColor(attempt.phase, isDark),
                    fontWeight: 500,
                  }}>
                    {attempt.phase.toUpperCase()}
                  </span>
                  {isSuccess && (
                    <span style={{
                      fontSize: 10,
                      padding: '2px 6px',
                      borderRadius: 4,
                      background: isDark ? 'rgba(80, 250, 123, 0.2)' : 'rgba(25, 135, 84, 0.1)',
                      color: theme.syntaxFunction,
                      fontWeight: 500,
                    }}>
                      SUCCESS
                    </span>
                  )}
                </Space>
                <Text style={{ fontSize: 11, color: theme.textTertiary, fontFamily: '"Fira Code", monospace' }}>
                  {dayjs(attempt.startedAt).format('HH:mm:ss')}
                </Text>
              </div>

              {/* Time info */}
              <div style={{ marginTop: 4 }}>
                <Text style={{ fontSize: 12, color: theme.textSecondary }}>
                  {t('gitBranch.duration')}: {formatDuration(attempt.startedAt, attempt.completedAt)}
                </Text>
                {!attempt.completedAt && (
                  <span style={{
                    marginLeft: 8,
                    fontSize: 11,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: isDark ? 'rgba(139, 233, 253, 0.2)' : 'rgba(13, 110, 253, 0.1)',
                    color: theme.syntaxVariable,
                    animation: 'neonPulse 2s ease-in-out infinite',
                  }}>
                    {t('gitBranch.inProgress')}
                  </span>
                )}
              </div>

              {/* Diff stats */}
              {attempt.changes && (
                <div style={diffStatsStyle}>
                  <Space size={4}>
                    <FileTextOutlined style={{ color: theme.syntaxVariable }} />
                    <span style={{ color: theme.textSecondary }}>
                      {t('gitBranch.filesCount', { count: attempt.changes.filesModified.length })}
                    </span>
                  </Space>
                  <Space size={4}>
                    <PlusOutlined style={{ color: theme.syntaxFunction }} />
                    <span style={{ color: theme.syntaxFunction }}>
                      +{attempt.changes.linesAdded}
                    </span>
                  </Space>
                  <Space size={4}>
                    <MinusOutlined style={{ color: theme.statusFailed }} />
                    <span style={{ color: theme.statusFailed }}>
                      -{attempt.changes.linesDeleted}
                    </span>
                  </Space>
                </div>
              )}

              {/* Error info */}
              {attempt.error && (
                <div style={{
                  marginTop: 8,
                  padding: '8px 12px',
                  background: isDark ? 'rgba(255, 85, 85, 0.1)' : 'rgba(220, 53, 69, 0.05)',
                  border: `1px solid ${isDark ? 'rgba(255, 85, 85, 0.2)' : 'rgba(220, 53, 69, 0.2)'}`,
                  borderRadius: 4,
                  fontFamily: '"Fira Code", monospace',
                  fontSize: 11,
                }}>
                  <Text style={{ color: theme.statusFailed }}>
                    ✖ {attempt.error}
                  </Text>
                </div>
              )}

              {/* File list */}
              {attempt.changes && attempt.changes.filesModified.length > 0 && (
                <div style={{
                  marginTop: 8,
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 4,
                }}>
                  {attempt.changes.filesModified.slice(0, 5).map((file, i) => (
                    <span key={i} style={{
                      fontSize: 10,
                      padding: '2px 6px',
                      borderRadius: 3,
                      background: isDark ? 'rgba(139, 233, 253, 0.1)' : 'rgba(0,0,0,0.05)',
                      color: theme.syntaxVariable,
                      fontFamily: '"Fira Code", monospace',
                    }}>
                      {file.split('/').pop()}
                    </span>
                  ))}
                  {attempt.changes.filesModified.length > 5 && (
                    <span style={{
                      fontSize: 10,
                      padding: '2px 6px',
                      borderRadius: 3,
                      background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0,0,0,0.05)',
                      color: theme.textTertiary,
                    }}>
                      {t('gitBranch.moreFiles', { count: attempt.changes.filesModified.length - 5 })}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Global animation styles */}
      <style>{`
        @keyframes neonPulse {
          0%, 100% {
            box-shadow: 0 0 5px rgba(139, 233, 253, 0.5);
          }
          50% {
            box-shadow: 0 0 15px rgba(139, 233, 253, 0.8), 0 0 25px rgba(139, 233, 253, 0.5);
          }
        }
      `}</style>
    </div>
  );
}, (prev, next) => {
  // Custom comparison fn
  return (
    prev.fixHistory.length === next.fixHistory.length &&
    prev.fixHistory.map(f => `${f.attemptNumber}-${f.success}-${f.phase}`).join(',') ===
    next.fixHistory.map(f => `${f.attemptNumber}-${f.success}-${f.phase}`).join(',') &&
    prev.currentPhase === next.currentPhase
  );
});

export default GitBranchVisualizer;
