/**
 * Form Steps Navigation
 * Vertical step bar on the left with neon effect + animation
 */

import { memo, useMemo } from 'react';
import { CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useIsDark } from '@/theme';
import { getSWETheme } from '../../theme';
import { STEP_CONFIG } from './index';
import { useSWEFormContext } from './index';
import type { StepsProps } from './types';

export const Steps = memo(function Steps({ steps }: StepsProps) {
  const isDark = useIsDark();

  const stepContainerStyle = useMemo(
    () => ({
      display: 'flex' as const,
      gap: isDark ? '20px' : '16px',
      marginBottom: isDark ? '32px' : '24px',
      position: 'relative' as const,
    }),
    [isDark]
  );

  return (
    <div style={stepContainerStyle}>
      {steps.map((step, index) => (
        <StepItem key={step.key} step={step} index={index} />
      ))}
    </div>
  );
});

interface StepItemProps {
  step: (typeof STEP_CONFIG)[number];
  index: number;
}

const StepItem = memo(function StepItem({ step, index }: StepItemProps) {
  const isDark = useIsDark();
  const theme = getSWETheme(isDark);
  const { state, getStepIndex } = useSWEFormContext();

  const stepIndex = getStepIndex(step.key as any);
  const currentIndex = getStepIndex(state.currentStep as any);
  const isCompleted = state.completedSteps.includes(step.key as any);
  const isCurrent = step.key === state.currentStep;
  const isPending = stepIndex > currentIndex;

  const stepStyle = useMemo(() => {
    const baseStyle: React.CSSProperties = {
      flex: 1,
      display: 'flex',
      alignItems: 'center',
      gap: isDark ? '12px' : '10px',
      padding: isDark ? '16px 20px' : '12px 16px',
      borderRadius: isDark ? '12px' : '8px',
      cursor: isPending ? 'default' : 'pointer',
      transition: 'all 0.3s ease',
      position: 'relative' as const,
      overflow: 'hidden',
    };

    if (isDark) {
      // Dark mode - neon effect
      if (isCurrent) {
        return {
          ...baseStyle,
          background: `${theme.accent}15`,
          border: `1px solid ${theme.accent}`,
          boxShadow: theme.glow,
        };
      }
      if (isCompleted) {
        return {
          ...baseStyle,
          background: `${theme.statusCompleted}15`,
          border: `1px solid ${theme.statusCompleted}40`,
        };
      }
      return {
        ...baseStyle,
        background: 'transparent',
        border: `1px solid ${theme.border}`,
      };
    }

    // Light mode
    if (isCurrent) {
      return {
        ...baseStyle,
        background: `${theme.accent}10`,
        border: `1px solid ${theme.accent}`,
      };
    }
    if (isCompleted) {
      return {
        ...baseStyle,
        background: `${theme.statusCompleted}10`,
        border: `1px solid ${theme.statusCompleted}40`,
      };
    }
    return {
      ...baseStyle,
      background: '#ffffff',
      border: `1px solid ${theme.border}`,
    };
  }, [isDark, isCurrent, isCompleted, isPending, theme]);

  const iconStyle = useMemo(() => {
    const baseStyle: React.CSSProperties = {
      width: isDark ? '36px' : '32px',
      height: isDark ? '36px' : '32px',
      borderRadius: isDark ? '10px' : '8px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: isDark ? '16px' : '14px',
      flexShrink: 0,
      transition: 'all 0.3s ease',
    };

    if (isDark) {
      if (isCurrent) {
        return {
          ...baseStyle,
          background: theme.accent,
          boxShadow: theme.glow,
        };
      }
      if (isCompleted) {
        return {
          ...baseStyle,
          background: theme.statusCompleted,
        };
      }
      return {
        ...baseStyle,
        background: `${theme.cardBorder}`,
      };
    }

    if (isCurrent) {
      return {
        ...baseStyle,
        background: theme.accent,
      };
    }
    if (isCompleted) {
      return {
        ...baseStyle,
        background: theme.statusCompleted,
      };
    }
    return {
      ...baseStyle,
      background: '#f0f0f0',
    };
  }, [isDark, isCurrent, isCompleted, theme]);

  const textStyle = useMemo(() => ({
    fontSize: isDark ? '14px' : '13px',
    fontWeight: isCurrent ? 600 : 500,
    color: isCurrent
      ? theme.textPrimary
      : isCompleted
      ? theme.statusCompleted
      : theme.textSecondary,
    transition: 'all 0.3s ease',
  }), [isDark, isCurrent, isCompleted, theme]);

  const indicatorStyle = useMemo(() => {
    const baseStyle: React.CSSProperties = {
      position: 'absolute' as const,
      bottom: 0,
      left: 0,
      height: '3px',
      borderRadius: '0 0 12px 12px',
      transition: 'all 0.3s ease',
    };

    if (isCurrent) {
      return {
        ...baseStyle,
        width: '100%',
        background: theme.gradientPrimary,
      };
    }
    if (isCompleted) {
      return {
        ...baseStyle,
        width: '100%',
        background: theme.statusCompleted,
      };
    }
    return {
      ...baseStyle,
      width: '0%',
    };
  }, [isCurrent, isCompleted, theme]);

  return (
    <div
      style={stepStyle}
      onClick={() => {
        if (!isPending && getStepIndex(step.key as any) < currentIndex) {
          // Allow going back to completed steps
        }
      }}
    >
      {/* Progress indicator bar (bottom) */}
      {isDark && <div style={indicatorStyle} />}

      {/* Icon */}
      <div style={iconStyle}>
        {isCompleted ? <CheckCircleOutlined /> : isPending ? <ClockCircleOutlined /> : step.icon}
      </div>

      {/* Text content */}
      <div style={{ flex: 1 }}>
        <div style={textStyle}>{step.title}</div>
        {isCurrent && isDark && (
          <div
            style={{
              fontSize: '11px',
              color: theme.textTertiary,
              marginTop: '2px',
            }}
          >
            {step.description}
          </div>
        )}
      </div>

      {/* Step number badge */}
      <div
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: isCurrent ? theme.accent : isCompleted ? theme.statusCompleted : theme.textTertiary,
          opacity: isDark ? 0.8 : 0.6,
        }}
      >
        {String(index + 1).padStart(2, '0')}
      </div>
    </div>
  );
});
