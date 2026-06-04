/**
 * SWETaskTile - Cyber-style task card
 * Asymmetric cut corners, status-color top border, terminal-style phase
 * indicator, animated bug icon
 */

import { memo, useMemo, useCallback } from 'react';
import { Typography, Space } from 'antd';
import { CodeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '@/theme';
import { TiltCard } from '@/components/agent/TiltCard';
import { getSWETheme, getPhaseColor, STATUS_CONFIG } from '../theme';
import type { SWEBenchTask } from '@/types';

const { Text, Paragraph } = Typography;

interface SWETaskTileProps {
  task: SWEBenchTask;
  onClick?: () => void;
  delay?: number;
}

// Phase definitions - ordered
const PHASES = [
  { key: 'idle', shortLabel: 'IDLE' },
  { key: 'cloning', shortLabel: 'CLONE' },
  { key: 'setup', shortLabel: 'SETUP' },
  { key: 'analyzing', shortLabel: 'ANALYZE' },
  { key: 'fixing', shortLabel: 'FIXING' },
  { key: 'testing', shortLabel: 'TEST' },
  { key: 'verifying', shortLabel: 'VERIFY' },
  { key: 'completed', shortLabel: 'DONE' },
] as const;

// Phase index map
const PHASE_INDEX: Record<string, number> = {
  idle: 0,
  cloning: 1,
  setup: 2,
  analyzing: 3,
  fixing: 4,
  testing: 5,
  verifying: 6,
  completed: 7,
  failed: 7,
};

// Format duration
const formatDuration = (seconds?: number): string => {
  if (!seconds) return '';
  if (seconds < 60) return `${seconds}s`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  return `${Math.floor(seconds / 3600)}h`;
};

/**
 * Bug icon with crawl animation
 */
const BugIcon = memo(function BugIcon({ isRunning }: { isRunning: boolean }) {
  const iconStyle = useMemo(() => ({
    fontSize: 18,
    ...(isRunning && {
      animation: 'bugPulse 2s ease-in-out infinite',
    }),
  }), [isRunning]);

  return <span style={iconStyle}>🐛</span>;
});

/**
 * SWETaskTile component
 * rerender-memo: uses memo for performance
 */
export const SWETaskTile = memo(function SWETaskTile({
  task,
  onClick,
  delay = 0,
}: SWETaskTileProps) {
  const { t } = useTranslation('swe');
  const isDark = useIsDark();
  const theme = getSWETheme(isDark);

  // Status config
  const statusConfig = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  const statusColor = isDark ? statusConfig.dark : statusConfig.light;
  const phaseColor = getPhaseColor(task.currentPhase, isDark);

  // Current phase index
  const currentIndex = PHASE_INDEX[task.currentPhase] ?? 0;

  // Card style
  const cardStyle = useMemo(() => ({
    position: 'relative' as const,
    padding: '16px',
    background: theme.cardBg,
    border: `1px solid ${theme.cardBorder}`,
    borderRadius: isDark ? 0 : 12,
    overflow: 'hidden' as const,
    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
    cursor: onClick ? 'pointer' : 'default',
    ...(isDark && {
      backdropFilter: 'blur(10px)',
      clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 0 100%)',
      animation: `staggeredFadeIn 0.5s ease-out ${delay}s both`,
      borderTop: `3px solid ${statusColor}`,
    }),
  }), [theme, isDark, statusColor, onClick, delay]);

  // Repo name style
  const repoStyle = useMemo(() => ({
    fontSize: 11,
    fontFamily: '"Fira Code", monospace',
    color: theme.syntaxVariable,
    background: isDark ? 'rgba(139, 233, 253, 0.1)' : 'rgba(0,0,0,0.05)',
    padding: '2px 6px',
    borderRadius: 4,
  }), [theme, isDark]);

  // Issue title style
  const titleStyle = useMemo(() => ({
    fontSize: 14,
    fontWeight: 600,
    color: theme.textPrimary,
    marginBottom: 4,
  }), [theme]);

  // Phase step style helper
  const getStepStyle = useCallback((completed: boolean, active: boolean) => ({
    fontSize: 10,
    fontFamily: '"Fira Code", monospace',
    padding: '2px 6px',
    borderRadius: 2,
    background: completed
      ? isDark
        ? 'rgba(80, 250, 123, 0.2)'
        : 'rgba(25, 135, 84, 0.1)'
      : active
        ? isDark
          ? 'rgba(139, 233, 253, 0.2)'
          : 'rgba(13, 110, 253, 0.1)'
        : 'transparent',
    color: completed
      ? theme.syntaxFunction
      : active
        ? phaseColor
        : theme.textTertiary,
    fontWeight: active ? 600 : 400,
    ...(isDark && active && {
      animation: 'neonPulse 2s ease-in-out infinite',
    }),
  }), [isDark, theme, phaseColor]);

  const handleClick = useCallback(() => {
    onClick?.();
  }, [onClick]);

  // Render terminal-style phase indicator
  const renderPhaseIndicator = () => {
    if (task.status === 'completed') {
      return (
        <span style={getStepStyle(true, false)}>
          ✔ {t('tile.completedTag')}
        </span>
      );
    }

    if (task.status === 'failed') {
      return (
        <span style={{
          ...getStepStyle(false, false),
          color: theme.statusFailed,
          background: isDark ? 'rgba(255, 85, 85, 0.2)' : 'rgba(220, 53, 69, 0.1)',
        }}>
          ✖ {t('tile.failedTag')}
        </span>
      );
    }

    // Show a few preceding phases + current
    const visiblePhases = PHASES.slice(Math.max(0, currentIndex - 2), currentIndex + 2);

    return (
      <Space size={4}>
        {visiblePhases.map((phase) => {
          const phaseIndex = PHASE_INDEX[phase.key] ?? 0;
          const isCompleted = phaseIndex < currentIndex;
          const isActive = phaseIndex === currentIndex;

          return (
            <span key={phase.key} style={getStepStyle(isCompleted, isActive)}>
              {isCompleted && '✔ '}
              {isActive && '● '}
              {phase.shortLabel}
              {isActive && '...'}
            </span>
          );
        })}
      </Space>
    );
  };

  return (
    <TiltCard onClick={handleClick} intensity={12} glow={isDark}>
      <div style={cardStyle}>
        {/* Header: status + repo name */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <Space size={8}>
            <BugIcon isRunning={task.status === 'running'} />
            <span style={repoStyle}>
              {task.repoName || t('tile.unknownRepo')}
            </span>
          </Space>
          <span style={{
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 4,
            background: isDark ? `${statusColor}20` : `${statusColor}15`,
            color: statusColor,
            fontWeight: 500,
          }}>
            {statusConfig.icon} {statusConfig.label}
          </span>
        </div>

        {/* Issue info */}
        <div style={{ marginBottom: 12 }}>
          <div style={titleStyle}>
            #{task.issueNumber} {task.issueTitle || t('task.unnamedIssue')}
          </div>
          {task.repoUrl && (
            <Paragraph
              ellipsis
              style={{
                margin: 0,
                fontSize: 11,
                color: theme.textSecondary,
                fontFamily: '"Fira Code", monospace',
              }}
            >
              {task.repoUrl}
            </Paragraph>
          )}
        </div>

        {/* Terminal-style phase indicator */}
        <div style={{ marginBottom: 12 }}>
          {renderPhaseIndicator()}
        </div>

        {/* Progress bar - shown while running or pending */}
        {(task.status === 'running' || task.status === 'pending') && (
          <div style={{ marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <Text style={{ fontSize: 11, color: phaseColor, fontFamily: '"Fira Code", monospace' }}>
                {task.currentPhase.toUpperCase()}
              </Text>
              <Text style={{ fontSize: 11, color: theme.textSecondary }}>
                {task.progress}%
              </Text>
            </div>
            <div style={{
              height: 4,
              background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
              borderRadius: 2,
              overflow: 'hidden',
            }}>
              <div style={{
                height: '100%',
                width: `${task.progress}%`,
                background: phaseColor,
                transition: 'width 0.3s ease-out',
                ...(isDark && task.status === 'running' && {
                  boxShadow: `0 0 10px ${phaseColor}`,
                }),
              }} />
            </div>
          </div>
        )}

        {/* Footer info */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingTop: 8,
          borderTop: `1px solid ${theme.borderLight}`,
        }}>
          <Space size={12}>
            <Text style={{ fontSize: 11, color: theme.textSecondary }}>
              <CodeOutlined style={{ marginRight: 4 }} />
              {task.agent?.name || '-'}
            </Text>
            <Text style={{ fontSize: 11, color: theme.textSecondary }}>
              {t('tile.strategy')}: {task.testStrategy}
            </Text>
          </Space>
          {(task.duration || task.fixAttempts > 0) && (
            <Space size={8}>
              {task.duration && (
                <Text style={{ fontSize: 11, color: theme.textTertiary }}>
                  {formatDuration(task.duration)}
                </Text>
              )}
              {task.fixAttempts > 0 && (
                <span style={{
                  fontSize: 11,
                  padding: '2px 6px',
                  borderRadius: 4,
                  background: isDark ? 'rgba(255, 184, 108, 0.2)' : 'rgba(253, 126, 20, 0.1)',
                  color: theme.statusFixing,
                }}>
                  🔧 {task.fixAttempts}
                </span>
              )}
            </Space>
          )}
        </div>

        {/* Test result - shown on completion */}
        {task.testResult && task.status === 'completed' && (
          <div style={{
            marginTop: 8,
            display: 'flex',
            gap: 12,
            padding: '8px 12px',
            background: isDark ? 'rgba(80, 250, 123, 0.1)' : 'rgba(25, 135, 84, 0.05)',
            borderRadius: 4,
            border: `1px solid ${isDark ? 'rgba(80, 250, 123, 0.2)' : 'rgba(25, 135, 84, 0.2)'}`,
          }}>
            <Text style={{ fontSize: 11, color: theme.syntaxFunction }}>
              ✓ {task.testResult.passedTests}/{task.testResult.totalTests} {t('tile.testsPassed')}
            </Text>
            <Text style={{
              fontSize: 11,
              color: task.testResult.passRate >= 80 ? theme.syntaxFunction : theme.statusFailed,
            }}>
              {task.testResult.passRate.toFixed(1)}%
            </Text>
          </div>
        )}

        {/* Error info */}
        {task.status === 'failed' && task.error && (
          <div style={{
            marginTop: 8,
            padding: '8px 12px',
            background: isDark ? 'rgba(255, 85, 85, 0.1)' : 'rgba(220, 53, 69, 0.05)',
            borderRadius: 4,
            border: `1px solid ${isDark ? 'rgba(255, 85, 85, 0.2)' : 'rgba(220, 53, 69, 0.2)'}`,
          }}>
            <Text
              ellipsis
              style={{
                fontSize: 11,
                color: theme.statusFailed,
                fontFamily: '"Fira Code", monospace',
              }}
            >
              ✖ {task.error}
            </Text>
          </div>
        )}
      </div>
    </TiltCard>
  );
}, (prev, next) => {
  // Custom comparison fn
  return (
    prev.task.id === next.task.id &&
    prev.task.status === next.task.status &&
    prev.task.currentPhase === next.task.currentPhase &&
    prev.task.progress === next.task.progress &&
    prev.delay === next.delay
  );
});

export default SWETaskTile;
