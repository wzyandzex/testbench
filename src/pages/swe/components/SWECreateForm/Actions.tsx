/**
 * Form Actions Component
 * Navigation button area — supports forward, back and submit
 */

import { memo, useMemo } from 'react';
import { Button, Space } from 'antd';
import {
  ArrowLeftOutlined,
  ArrowRightOutlined,
  SaveOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { useIsDark } from '@/theme';
import { getSWETheme } from '../../theme';
import { useSWEFormContext } from './index';
import { STEP_CONFIG } from './index';

export interface ActionsProps {
  submitting?: boolean;
  loading?: boolean;
}

export const Actions = memo(function Actions({
  submitting = false,
  loading = false,
}: ActionsProps) {
  const { t } = useTranslation('swe');
  const isDark = useIsDark();
  const theme = getSWETheme(isDark);
  const { state, prevStep, nextStep, submit, canGoBack, isStepValid } =
    useSWEFormContext();

  const handleNext = () => {
    nextStep();
  };

  const handleBack = () => {
    prevStep();
  };

  const handleSubmit = () => {
    submit();
  };

  // Actions container style
  const actionsStyle = useMemo(() => {
    const baseStyle: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: isDark ? '28px' : '24px',
      padding: isDark ? '20px 24px' : '16px 20px',
      borderRadius: isDark ? '14px' : '10px',
      position: 'relative',
      overflow: 'hidden',
    };

    if (isDark) {
      return {
        ...baseStyle,
        background: `${theme.cardBg}e6`,
        border: `1px solid ${theme.cardBorder}`,
        backdropFilter: 'blur(10px)',
      };
    }

    return {
      ...baseStyle,
      background: '#fafafa',
      border: `1px solid ${theme.borderLight}`,
    };
  }, [isDark, theme]);

  // Step indicator style
  const stepIndicatorStyle = useMemo(
    () => ({
      fontSize: isDark ? '13px' : '12px',
      color: theme.textSecondary,
      fontFamily: 'monospace',
    }),
    [isDark, theme]
  );

  // Primary button style
  const primaryButtonStyle = useMemo(() => {
    const baseStyle: React.CSSProperties = {
      height: isDark ? '44px' : '40px',
      paddingLeft: '24px',
      paddingRight: '24px',
      borderRadius: isDark ? '11px' : '9px',
      fontWeight: 500,
      border: 'none',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
    };

    if (isDark) {
      return {
        ...baseStyle,
        background: theme.gradientPrimary,
        boxShadow: theme.glow,
      };
    }

    return {
      ...baseStyle,
      background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
    };
  }, [isDark, theme]);

  // Secondary button style
  const secondaryButtonStyle = useMemo(() => {
    const baseStyle: React.CSSProperties = {
      height: isDark ? '44px' : '40px',
      paddingLeft: '24px',
      paddingRight: '24px',
      borderRadius: isDark ? '11px' : '9px',
      fontWeight: 500,
    };

    if (isDark) {
      return {
        ...baseStyle,
        background: 'transparent',
        borderColor: theme.border,
        color: theme.textSecondary,
      };
    }

    return baseStyle;
  }, [isDark, theme]);

  // Current step info
  const currentStepIndex = STEP_CONFIG.findIndex((s) => s.key === state.currentStep);
  const isLastStep = currentStepIndex === STEP_CONFIG.length - 1;
  const isCurrentStepValid = isStepValid(state.currentStep);

  return (
    <div style={actionsStyle}>
      {/* Step indicator */}
      <div style={stepIndicatorStyle}>
        <span style={{ color: theme.syntaxComment }}>{`/* `}</span>
        <span style={{ color: theme.syntaxString }}>Step</span>
        <span style={{ color: theme.syntaxComment }}>{` `}</span>
        <span style={{ color: theme.syntaxNumber }}>{currentStepIndex + 1}</span>
        <span style={{ color: theme.syntaxComment }}>{` / `}</span>
        <span style={{ color: theme.syntaxNumber }}>{STEP_CONFIG.length}</span>
        <span style={{ color: theme.syntaxComment }}>{` */`}</span>
      </div>

      {/* Action buttons */}
      <Space size={isDark ? 12 : 10}>
        {/* Back button */}
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={handleBack}
          disabled={!canGoBack || submitting}
          style={secondaryButtonStyle}
        >
          {t('createForm.actions.back')}
        </Button>

        {/* Next/Submit button */}
        {isLastStep ? (
          <Button
            type="primary"
            icon={submitting ? <SaveOutlined spin /> : <CheckOutlined />}
            onClick={handleSubmit}
            disabled={!isCurrentStepValid || loading}
            loading={submitting}
            style={primaryButtonStyle}
          >
            {submitting ? t('createForm.actions.creating') : t('createForm.actions.createTask')}
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<ArrowRightOutlined />}
            onClick={handleNext}
            disabled={!isCurrentStepValid || submitting}
            style={primaryButtonStyle}
          >
            {t('createForm.actions.next')}
          </Button>
        )}
      </Space>

      {/* Corner decorations for dark mode */}
      {isDark && (
        <>
          <div
            style={{
              position: 'absolute',
              bottom: '6px',
              right: '6px',
              width: '12px',
              height: '12px',
              borderRight: `1px solid ${theme.accent}`,
              borderBottom: `1px solid ${theme.accent}`,
              borderRadius: '0 0 0 8px',
            }}
          />
          <div
            style={{
              position: 'absolute',
              top: '6px',
              left: '6px',
              width: '12px',
              height: '12px',
              borderLeft: `1px solid ${theme.accent}`,
              borderTop: `1px solid ${theme.accent}`,
              borderRadius: '8px 0 0 0',
            }}
          />
        </>
      )}
    </div>
  );
});
