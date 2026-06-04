/**
 * HolographicProgress - Holographic progress visualization
 * Segmented circular progress ring, one segment per phase
 * Current phase pulses, completed phase syntax green, failed phase red
 */

import { memo, useMemo } from 'react';
import i18next from 'i18next';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '@/theme';
import { getSWETheme, PHASE_COLOR_CONFIG, getPhaseColor } from '../theme';
import type { SWETaskPhase } from '@/types';

interface HolographicProgressProps {
  currentPhase: SWETaskPhase;
  progress?: number;
  size?: number;
  strokeWidth?: number;
  showLabels?: boolean;
}

// Phase definitions - ordered
const PHASES = [
  { key: 'idle', colorKey: 'idle', get label() { return i18next.t('swe:phases.idle'); } },
  { key: 'cloning', colorKey: 'cloning', get label() { return i18next.t('swe:phases.cloning'); } },
  { key: 'setup', colorKey: 'setup', get label() { return i18next.t('swe:phases.setup'); } },
  { key: 'analyzing', colorKey: 'analyzing', get label() { return i18next.t('swe:phases.analyzing'); } },
  { key: 'fixing', colorKey: 'fixing', get label() { return i18next.t('swe:phases.fixing'); } },
  { key: 'testing', colorKey: 'testing', get label() { return i18next.t('swe:phases.testing'); } },
  { key: 'verifying', colorKey: 'verifying', get label() { return i18next.t('swe:phases.verifying'); } },
  { key: 'completed', colorKey: 'completed', get label() { return i18next.t('swe:phases.completed'); } },
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

/**
 * HolographicProgress component
 * rerender-memo: uses memo for performance
 */
export const HolographicProgress = memo(function HolographicProgress({
  currentPhase,
  progress = 0,
  size = 180,
  strokeWidth = 12,
  showLabels = true,
}: HolographicProgressProps) {
  const { t } = useTranslation('swe');
  const isDark = useIsDark();
  const theme = getSWETheme(isDark);

  // Current phase index
  const currentIndex = PHASE_INDEX[currentPhase] ?? 0;

  // SVG params
  const center = size / 2;
  const radius = (size - strokeWidth) / 2;
  const gapAngle = 4; // gap between segments in degrees

  // Segment paths
  const segments = useMemo(() => {
    return PHASES.map((phase, index) => {
      const isCompleted = index < currentIndex;
      const isCurrent = index === currentIndex;
      const isFailed = currentPhase === 'failed' && index >= currentIndex;

      // Resolve color
      let color = isDark
        ? PHASE_COLOR_CONFIG[phase.colorKey]?.dark || theme.border
        : PHASE_COLOR_CONFIG[phase.colorKey]?.light || theme.border;

      if (isFailed) {
        color = theme.statusFailed;
      } else if (isCompleted) {
        color = theme.syntaxFunction;
      } else if (isCurrent) {
        color = getPhaseColor(currentPhase, isDark);
      }

      // Start/end angles
      const startAngle = (index * 360) / PHASES.length - 90 + gapAngle / 2;
      const endAngle = ((index + 1) * 360) / PHASES.length - 90 - gapAngle / 2;

      // To radians
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;

      // Path points
      const x1 = center + radius * Math.cos(startRad);
      const y1 = center + radius * Math.sin(startRad);
      const x2 = center + radius * Math.cos(endRad);
      const y2 = center + radius * Math.sin(endRad);

      // Large arc flag
      const largeArc = endAngle - startAngle > 180 ? 1 : 0;

      // Inner ring path (creates donut effect)
      const innerRadius = radius - strokeWidth;
      const innerX1 = center + innerRadius * Math.cos(startRad);
      const innerY1 = center + innerRadius * Math.sin(startRad);
      const innerX2 = center + innerRadius * Math.cos(endRad);
      const innerY2 = center + innerRadius * Math.sin(endRad);

      const ringPathData = [
        'M', x1, y1,
        'A', radius, radius, 0, largeArc, 1, x2, y2,
        'L', innerX2, innerY2,
        'A', innerRadius, innerRadius, 0, largeArc, 0, innerX1, innerY1,
        'Z',
      ].join(' ');

      return {
        ...phase,
        pathData: ringPathData,
        color,
        isCompleted,
        isCurrent,
        isFailed,
      };
    });
  }, [currentIndex, currentPhase, isDark, theme, radius, center, strokeWidth]);

  // Center content style
  const centerStyle = useMemo(() => ({
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center' as const,
  }), []);

  const progressStyle = useMemo(() => ({
    fontSize: size * 0.2,
    fontWeight: 700,
    color: theme.syntaxFunction,
    ...(isDark && {
      textShadow: `0 0 20px ${theme.syntaxFunction}40`,
    }),
  }), [size, theme, isDark]);

  const labelStyle = useMemo(() => ({
    fontSize: size * 0.06,
    color: theme.textSecondary,
    marginTop: 4,
  }), [size, theme]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <svg
        width={size}
        height={size}
        style={{
          display: 'block',
          filter: isDark ? 'drop-shadow(0 0 10px rgba(139, 233, 253, 0.2))' : 'none',
        }}
      >
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={radius - strokeWidth / 2}
          fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}
          strokeWidth={strokeWidth * 0.8}
        />

        {/* Phase segments */}
        {segments.map((segment) => {
          const animateClass = segment.isCurrent && isDark ? 'current-segment' : '';

          return (
            <path
              key={segment.key}
              d={segment.pathData}
              fill={segment.color}
              opacity={segment.isCompleted || segment.isCurrent ? 1 : 0.3}
              style={{
                transition: 'all 0.3s ease-out',
                ...(segment.isCurrent && isDark && {
                  animation: 'neonPulse 2s ease-in-out infinite',
                  filter: `drop-shadow(0 0 8px ${segment.color})`,
                }),
              }}
              className={animateClass}
            />
          );
        })}
      </svg>

      {/* Center content */}
      <div style={centerStyle}>
        {currentPhase === 'completed' ? (
          <>
            <div style={{ ...progressStyle, color: theme.syntaxFunction }}>
              ✓
            </div>
            <div style={labelStyle}>{t('phases.completed')}</div>
          </>
        ) : currentPhase === 'failed' ? (
          <>
            <div style={{ ...progressStyle, color: theme.statusFailed }}>
              ✖
            </div>
            <div style={{ ...labelStyle, color: theme.statusFailed }}>{t('status.failed')}</div>
          </>
        ) : (
          <>
            <div style={progressStyle}>{progress}%</div>
            <div style={labelStyle}>
              {PHASES[currentIndex]?.label || currentPhase}
            </div>
          </>
        )}
      </div>

      {/* Phase labels - if enabled */}
      {showLabels && (
        <div style={{
          position: 'absolute',
          top: -24,
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: 16,
          fontSize: 11,
        }}>
          {segments.slice(0, 6).map((segment) => (
            <div
              key={segment.key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                color: segment.isCompleted || segment.isCurrent ? segment.color : theme.textTertiary,
                opacity: segment.isCompleted || segment.isCurrent ? 1 : 0.5,
              }}
            >
              <span style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: segment.color,
                ...(segment.isCurrent && isDark && {
                  boxShadow: `0 0 8px ${segment.color}`,
                }),
              }} />
              <span>{segment.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}, (prev, next) => {
  // Custom comparison fn
  return (
    prev.currentPhase === next.currentPhase &&
    prev.progress === next.progress &&
    prev.size === next.size &&
    prev.strokeWidth === next.strokeWidth &&
    prev.showLabels === next.showLabels
  );
});

/**
 * Compact variant - horizontal bar progress
 */
interface CompactProgressProps {
  currentPhase: SWETaskPhase;
  progress?: number;
}

export const CompactHolographicProgress = memo(function CompactHolographicProgress({
  currentPhase,
  progress = 0,
}: CompactProgressProps) {
  const isDark = useIsDark();
  const theme = getSWETheme(isDark);
  const currentIndex = PHASE_INDEX[currentPhase] ?? 0;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      {/* Phase indicator */}
      <div style={{ display: 'flex', gap: 4 }}>
        {PHASES.slice(0, 7).map((phase, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const color = isCompleted
            ? theme.syntaxFunction
            : isCurrent
              ? getPhaseColor(currentPhase, isDark)
              : theme.textTertiary;

          return (
            <div
              key={phase.key}
              style={{
                width: 24,
                height: 6,
                borderRadius: 3,
                background: color,
                opacity: isCompleted || isCurrent ? 1 : 0.3,
                transition: 'all 0.3s ease-out',
                ...(isCurrent && isDark && {
                  boxShadow: `0 0 8px ${color}`,
                  animation: 'neonPulse 2s ease-in-out infinite',
                }),
              }}
              title={phase.label}
            />
          );
        })}
      </div>

      {/* Progress percent */}
      <span style={{
        fontSize: 12,
        fontFamily: '"Fira Code", monospace',
        color: theme.syntaxFunction,
        minWidth: 40,
      }}>
        {progress}%
      </span>
    </div>
  );
});

export default HolographicProgress;
